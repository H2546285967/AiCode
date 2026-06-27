#!/usr/bin/env node
/**
 * swarm-coordinator.js — 多 Agent Swarm 协调器（M31 · 借鉴 ruvnet/ruflo）
 *
 * 痛点：AiCode dispatcher 现在只决定"派不派 + 派几个"，派出去的 Agent 各自独立回答，
 *       没有"汇总 + 投票"机制。复杂任务（比如"重构 dispatcher.js"）单 Agent 视角容易盲。
 *
 * 借鉴思路（ruflo 核心能力之一）：
 *   - 生成 N 个异构视角的 prompt（安全 / 性能 / 可维护性 等）
 *   - 每个 Agent 拿到不同视角 → 独立分析
 *   - 汇总所有结果 → 按策略投票 / 加权 / 选 best
 *   - 输出最终答案 + 投票依据（可追溯）
 *
 * 本实现（M31 POC）：
 *   - 纯函数 + 离线模式（不接 dispatcher hook，避免误伤）
 *   - 复用 semantic-recall.js 的 tokenize 做文本相似度（不重新造轮子）
 *   - 3 个核心函数：generatePerspectives / aggregateResults / swarmDecide
 *   - 支持 3 种汇总策略：majority / weighted / best-of
 *   - CLI: node swarm-coordinator.js "task" [--n=3] [--strategy=majority] [--mock]
 *
 * @since v3.0.5 M31 (2026-06-27)
 * @source https://github.com/ruvnet/ruflo · 借鉴评估 7.7/10
 * @see .claude/skills/evolve/SKILL.md §借鉴评估
 */

'use strict';

const path = require('path');

// 复用现有 tokenize（避免重复实现文本相似度基础）
// 注意：semantic-recall 的 tokenize 返回 Array，我们这里统一用 Set 方便交集运算
let tokenizeFn = null;
try {
  // semantic-recall.js 导出 tokenize 在 v2.1.0 +;
  const sr = require('./recall/semantic-recall');
  if (sr.tokenize) {
    const origTokenize = sr.tokenize;
    tokenizeFn = (text) => new Set(origTokenize(text));
  }
} catch {
  // 软引用降级：semantic-recall 不可用 → 用本地 fallback
}

// ==================== 默认配置 ====================

const DEFAULTS = {
  n: 3,                      // 默认 3 个视角
  strategy: 'majority',      // 默认投票策略
  threshold: 0.6,            // majority 判定"同一答案"的相似度阈值
  mockResults: true,         // 是否使用 mock（演示模式）
};

const PERSPECTIVE_POOL = [
  { id: 'safety',    label: '安全性',    template: '从【安全】角度分析以下任务，关注潜在风险、注入、权限漏洞：\n\n${task}' },
  { id: 'perf',      label: '性能',      template: '从【性能】角度分析以下任务，关注时间复杂度、IO、并发瓶颈：\n\n${task}' },
  { id: 'maintain',  label: '可维护性',  template: '从【可维护性】角度分析以下任务，关注可读性、模块边界、测试覆盖：\n\n${task}' },
  { id: 'simplicity', label: '简洁性',   template: '从【简洁性】角度分析以下任务，关注过度工程、最小实现、删繁就简：\n\n${task}' },
  { id: 'compat',    label: '兼容性',    template: '从【兼容性】角度分析以下任务，关注向后兼容、迁移成本、breaking change：\n\n${task}' },
];

// ==================== 工具函数 ====================

/**
 * 本地 fallback tokenize（semantic-recall 不可用时降级）
 * 中文按 bigram 切，英文按 [a-z0-9]+ 切
 */
function fallbackTokenize(text) {
  const tokens = new Set();
  if (typeof text !== 'string') return tokens;
  // 英文 / 数字
  const enMatches = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  enMatches.forEach(m => tokens.add(m));
  // 中文 bigram（每个汉字 + 它和下一个的组合）
  const zh = text.match(/[一-龥]/g) || [];
  for (let i = 0; i < zh.length; i++) {
    tokens.add(zh[i]);
    if (i < zh.length - 1) tokens.add(zh[i] + zh[i + 1]);
  }
  return tokens;
}

function tokenize(text) {
  if (tokenizeFn) return tokenizeFn(text);
  return fallbackTokenize(text);
}

/**
 * Jaccard 相似度（两文本 token 集合的交集/并集）
 */
function jaccardSimilarity(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return 0;
  if (a === b) return 1;
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 && tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * 简单相似度（majority 判定用）= Jaccard
 */
function similarity(a, b) {
  return jaccardSimilarity(a, b);
}

// ==================== 核心函数 ====================

/**
 * generatePerspectives(task, n) — 生成 N 个异构视角 prompt
 *
 * @param {string} task - 用户任务
 * @param {object} [opts] { n, pool }
 * @returns {Array<{ id, label, prompt, template }>}
 */
function generatePerspectives(task, opts = {}) {
  if (typeof task !== 'string' || task.trim() === '') {
    return [];
  }
  const nRaw = opts.n !== undefined ? opts.n : DEFAULTS.n;
  const n = Math.max(1, Math.min(nRaw, PERSPECTIVE_POOL.length));
  const pool = Array.isArray(opts.pool) && opts.pool.length > 0 ? opts.pool : PERSPECTIVE_POOL;

  // 取前 n 个（确定性输出）
  const selected = pool.slice(0, n);
  return selected.map(p => ({
    id: p.id,
    label: p.label,
    template: p.template,
    prompt: p.template.replace('${task}', task.trim()),
  }));
}

/**
 * aggregateResults(results, strategy) — 汇总 N 个结果
 *
 * @param {Array<{ text: string, score?: number, perspective?: string }>} results
 * @param {string} [strategy] - 'majority' | 'weighted' | 'best-of'
 * @param {object} [opts] { threshold }
 * @returns {{ winner: object, votes: number[], groups: Array<Array<number>>, strategy: string, reasoning: string, totalResults: number }}
 */
function aggregateResults(results, strategy = DEFAULTS.strategy, opts = {}) {
  const threshold = opts.threshold || DEFAULTS.threshold;

  // 兜底
  if (!Array.isArray(results) || results.length === 0) {
    return {
      winner: null,
      votes: [],
      groups: [],
      strategy,
      reasoning: '无输入结果',
      totalResults: 0,
    };
  }

  if (strategy === 'best-of') {
    // 选 score 最高的（score 缺失时按 0.5 默认）
    let bestIdx = 0;
    let bestScore = results[0].score !== undefined ? results[0].score : 0.5;
    for (let i = 1; i < results.length; i++) {
      const s = results[i].score !== undefined ? results[i].score : 0.5;
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    return {
      winner: results[bestIdx],
      votes: results.map((_, i) => (i === bestIdx ? 1 : 0)),
      groups: [[bestIdx]],
      strategy,
      reasoning: `best-of: 选 score 最高 (${bestScore.toFixed(2)}) 的 ${results[bestIdx].perspective || '结果' + bestIdx}`,
      totalResults: results.length,
    };
  }

  // majority / weighted：先按相似度聚类
  const groups = []; // groups[i] = [result indices in same cluster]
  const votes = new Array(results.length).fill(0);

  for (let i = 0; i < results.length; i++) {
    let placed = false;
    for (const g of groups) {
      // 与 group 中第一个比较（代表该 cluster 的"标准答案"）
      const sim = similarity(results[i].text, results[g[0]].text);
      if (sim >= threshold) {
        g.push(i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push([i]);
    }
  }

  // 找最大组
  let largestGroup = groups[0];
  for (const g of groups) {
    if (g.length > largestGroup.length) largestGroup = g;
  }

  // 给最大组成员投票
  for (const idx of largestGroup) votes[idx] = 1;

  if (strategy === 'weighted') {
    // 加权：每个结果的 score 求和，取和最大的 group
    const groupScores = groups.map(g =>
      g.reduce((sum, idx) => sum + (results[idx].score !== undefined ? results[idx].score : 0.5), 0)
    );
    let maxIdx = 0;
    for (let i = 1; i < groupScores.length; i++) {
      if (groupScores[i] > groupScores[maxIdx]) maxIdx = i;
    }
    largestGroup = groups[maxIdx];
    for (const idx of largestGroup) votes[idx] = 1;
    const winnerIdx = largestGroup[0];
    return {
      winner: results[winnerIdx],
      votes,
      groups,
      strategy,
      reasoning: `weighted: 最大权重组 ${largestGroup.length}/${results.length} (score 总和 ${groupScores[maxIdx].toFixed(2)})`,
      totalResults: results.length,
    };
  }

  // 默认 majority
  const winnerIdx = largestGroup[0];
  const consensusRatio = largestGroup.length / results.length;
  return {
    winner: results[winnerIdx],
    votes,
    groups,
    strategy: 'majority',
    reasoning: `majority: 最大一致组 ${largestGroup.length}/${results.length} (${(consensusRatio * 100).toFixed(0)}% 共识, 阈值 ≥ ${threshold})`,
    totalResults: results.length,
  };
}

/**
 * swarmDecide(task, opts) — 一站式 swarm 决策
 *
 * @param {string} task
 * @param {object} [opts] { n, strategy, runAgent, mockResults }
 *   - runAgent: async (prompt, perspective) => { text, score } 注入真实 Agent 调用
 *   - mockResults: 默认 true，不传 runAgent 时用 mock 演示
 * @returns {Promise<{ perspectives, results, consensus, finalAnswer }>}
 */
async function swarmDecide(task, opts = {}) {
  const n = opts.n || DEFAULTS.n;
  const strategy = opts.strategy || DEFAULTS.strategy;

  // 1. 生成视角
  const perspectives = generatePerspectives(task, { n });

  // 2. 调用 Agent（或 mock）
  const useMock = opts.mockResults !== undefined ? opts.mockResults : (opts.runAgent ? false : DEFAULTS.mockResults);
  let results = [];
  if (useMock) {
    // Mock 模式：基于视角 + 任务生成模拟回答
    results = perspectives.map(p => ({
      text: `[${p.label}视角] 建议：针对"${task.trim()}"，从${p.label}角度应该考虑 ${mockHint(p.id)}`,
      score: 0.7 + Math.random() * 0.2, // 0.7-0.9
      perspective: p.id,
    }));
  } else if (typeof opts.runAgent === 'function') {
    // 真实 Agent 模式
    results = await Promise.all(perspectives.map(async p => {
      try {
        const r = await opts.runAgent(p.prompt, p);
        return {
          text: r.text || '',
          score: r.score,
          perspective: p.id,
        };
      } catch (e) {
        return {
          text: `[ERROR] ${p.label}: ${e.message}`,
          score: 0,
          perspective: p.id,
          error: e.message,
        };
      }
    }));
  } else {
    throw new Error('swarmDecide: 需 opts.runAgent 或 opts.mockResults=true');
  }

  // 3. 汇总投票
  const consensus = aggregateResults(results, strategy);

  // 4. 最终答案 = consensus.winner.text
  const finalAnswer = consensus.winner ? consensus.winner.text : '';

  return {
    perspectives,
    results,
    consensus,
    finalAnswer,
  };
}

/**
 * Mock 提示（让 mock 结果在不同视角下产生不同措辞，避免全 100% 相似）
 */
function mockHint(perspectiveId) {
  const hints = {
    safety: '输入校验、权限边界、敏感字段加密',
    perf: '算法复杂度、缓存策略、批量处理',
    maintain: '函数拆分、注释、单元测试覆盖',
    simplicity: '最小实现、删除冗余、避免过度抽象',
    compat: '向后兼容、迁移路径、deprecation 提示',
  };
  return hints[perspectiveId] || '通用最佳实践';
}

// ==================== CLI ====================

function formatSwarmOutput(swarmResult) {
  const lines = [];
  lines.push('# 🐝 Swarm 协调结果');
  lines.push('');
  lines.push(`## 📋 ${swarmResult.perspectives.length} 个异构视角`);
  lines.push('');
  swarmResult.perspectives.forEach((p, i) => {
    lines.push(`### ${i + 1}. [${p.label}] \`${p.id}\``);
    lines.push('```');
    lines.push(p.prompt);
    lines.push('```');
    lines.push('');
  });

  lines.push(`## 💬 ${swarmResult.results.length} 个 Agent 输出`);
  lines.push('');
  swarmResult.results.forEach((r, i) => {
    lines.push(`### Agent ${i + 1} · \`${r.perspective}\` · score=${(r.score || 0).toFixed(2)}`);
    lines.push(r.text);
    lines.push('');
  });

  lines.push('## 🗳️ 投票汇总');
  lines.push('');
  lines.push(`- 策略：\`${swarmResult.consensus.strategy}\``);
  lines.push(`- 理由：${swarmResult.consensus.reasoning}`);
  lines.push(`- 投票：\`[${swarmResult.consensus.votes.join(', ')}]\`（1 = 入选）`);
  lines.push(`- 分组：${swarmResult.consensus.groups.length} 个 cluster`);
  swarmResult.consensus.groups.forEach((g, i) => {
    lines.push(`  - 组 ${i + 1}: [${g.join(', ')}]`);
  });
  lines.push('');
  lines.push('## ✅ 最终答案');
  lines.push('');
  lines.push('```');
  lines.push(swarmResult.finalAnswer);
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  // 支持 PowerShell 兼容：args 0 是可选 flag，其余全是 task 片段
  // 找 --n= / --strategy= / --mock / --real / --help
  const flagPattern = /^--/;
  const taskParts = [];
  const opts = {};

  for (const arg of args) {
    if (arg.startsWith('--n=')) {
      opts.n = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--strategy=')) {
      opts.strategy = arg.split('=')[1];
    } else if (arg === '--mock') {
      opts.mockResults = true;
    } else if (arg === '--real') {
      opts.mockResults = false;
    } else if (arg === '--help' || arg === '-h') {
      // fallthrough to help
    } else if (!flagPattern.test(arg)) {
      taskParts.push(arg);
    }
  }

  const task = taskParts.join(' ').trim();

  if (task === '' || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: swarm:run "task" [--n=3] [--strategy=majority] [--mock]');
    console.log('       swarm:run task words here --n=4     # PowerShell 友好');
    console.log('');
    console.log('Options:');
    console.log('  --n=N            视角数量 (默认 3, 最多 5)');
    console.log('  --strategy=X     汇总策略 majority|weighted|best-of (默认 majority)');
    console.log('  --mock           使用 mock 结果（演示模式，默认）');
    console.log('');
    console.log('Examples:');
    console.log('  swarm:run 重构 dispatcher.js --n=3');
    console.log('  swarm:run "新增 dashboard" --n=4 --strategy=weighted');
    process.exit(task === '' ? 1 : 0);
  }

  opts.n = opts.n || DEFAULTS.n;
  opts.strategy = opts.strategy || DEFAULTS.strategy;
  if (opts.mockResults === undefined) opts.mockResults = true;

  try {
    const result = await swarmDecide(task, opts);
    console.log(formatSwarmOutput(result));
  } catch (e) {
    console.error('❌ Swarm 协调失败:', e.message);
    process.exit(1);
  }
}

module.exports = {
  generatePerspectives,
  aggregateResults,
  swarmDecide,
  jaccardSimilarity,
  similarity,
  tokenize,
  DEFAULTS,
  PERSPECTIVE_POOL,
  formatSwarmOutput,
};

// ==================== 入口 ====================
if (require.main === module) {
  main();
}