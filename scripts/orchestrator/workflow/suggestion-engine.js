#!/usr/bin/env node
/**
 * suggestion-engine.js — 个人 workflow 主动建议引擎（v2.0 P0-5）
 *
 * 作用：
 *   - 根据最近事件 + 已挖掘模式，生成下一步操作建议
 *   - 在 session-init 顶部展示，或响应 /workflow 命令
 *
 * 建议来源：
 *   1. 模式匹配：pattern-miner 挖掘出的高频行为序列
 *   2. 启发规则：无模式时的兜底建议（如未提交改动 → commit）
 *   3. 上下文感知：当前 git 状态、最近修改文件、未完成任务
 *
 * 输出格式：
 *   {
 *     type: 'run_command' | 'review_changes' | 'continue_task' | 'commit' | 'general',
 *     command?: string,
 *     reason: string,
 *     confidence: number,
 *     icon: string
 *   }
 *
 * 用法：
 *   const Suggest = require('./suggestion-engine');
 *   const suggestions = Suggest.suggest({ hours: 2, topK: 3 });
 *
 *   CLI:
 *   node suggestion-engine.js suggest [hours=2] [topK=3]
 *
 * @since v2.0.2 (2026-06-25)
 * @source 03_版本迭代计划.md §五 v2.0 P0-5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(WORKSPACE_ROOT, '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');

// 模块默认建议映射（冷启动 / 兜底）
const MODULE_SUGGESTIONS = {
  orchestrator: {
    command: 'npm test',
    reason: 'orchestrator 模块改动通常需要跑 npm test 验证',
    icon: '🧪',
  },
  mcp: {
    command: 'npm run test:mcp',
    reason: 'MCP server 改动建议跑 MCP 专项测试',
    icon: '🔌',
  },
  evolution: {
    command: 'npm run test:evolution',
    reason: 'evolution 模块改动建议跑进化系统测试',
    icon: '🧬',
  },
  'claude-config': {
    command: 'npm run test:state',
    reason: 'Claude 配置/左脑改动建议跑状态快照测试',
    icon: '🧠',
  },
  docs: {
    command: 'npm run doc:check',
    reason: '文档改动后建议检查文档漂移',
    icon: '📚',
  },
};

// ── 工具函数 ─────────────────────────────────────────

function execSafe(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd: cwd || WORKSPACE_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
  }

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function loadJsonSafe(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch {
    return null;
  }
}

// 加载依赖模块（避免循环引用）
function loadObserver() {
  try {
    return require('./workflow-observer');
  } catch {
    return null;
  }
}

function loadMiner() {
  try {
    return require('./pattern-miner');
  } catch {
    return null;
  }
}

// ── 核心 API ─────────────────────────────────────────

const Suggest = {
  /**
   * 生成建议列表
   * @param {object} [opts]
   *   - hours: 最近多少小时的事件
   *   - topK: 最多返回几条
   *   - includeHeuristics: 是否包含启发式兜底建议
   * @returns {object[]}
   */
  suggest(opts = {}) {
    const hours = opts.hours || 2;
    const topK = opts.topK || 3;
    const includeHeuristics = opts.includeHeuristics !== false;

    const Observer = loadObserver();
    const Miner = loadMiner();

    let recentEvents = [];
    if (Observer) {
      recentEvents = Observer.getRecentEvents(hours);
    }

    const suggestions = [];
    const usedKeys = new Set();

    // 1. 基于模式匹配的建议
    if (Miner) {
      const matched = Miner.matchPatterns(recentEvents, topK * 2);
      for (const pattern of matched) {
        const action = pattern.action;
        if (action.type === 'command_run' && action.command) {
          const key = `pattern:${action.command}`;
          if (usedKeys.has(key)) continue;
          usedKeys.add(key);
          suggestions.push({
            type: 'run_command',
            command: action.command,
            reason: `你刚${describeTrigger(pattern.trigger)}，历史上有 ${Math.round(pattern.confidence * 100)}% 概率会执行此命令`,
            confidence: pattern.confidence,
            icon: '🔮',
            source: 'pattern',
          });
        } else if (action.type === 'test_run') {
          const key = 'pattern:test_run';
          if (usedKeys.has(key)) continue;
          usedKeys.add(key);
          suggestions.push({
            type: 'run_command',
            command: 'npm test',
            reason: `你刚${describeTrigger(pattern.trigger)}，历史上通常会跑测试`,
            confidence: pattern.confidence,
            icon: '🧪',
            source: 'pattern',
          });
        } else if (action.type === 'commit') {
          const key = 'pattern:commit';
          if (usedKeys.has(key)) continue;
          usedKeys.add(key);
          suggestions.push({
            type: 'commit',
            reason: `你刚${describeTrigger(pattern.trigger)}，历史上接下来通常会 commit`,
            confidence: pattern.confidence,
            icon: '💾',
            source: 'pattern',
          });
        }
      }
    }

    // 2. 启发式兜底建议
    if (includeHeuristics) {
      suggestions.push(...generateHeuristicSuggestions(recentEvents, usedKeys));
    }

    // 3. 排序：置信度降序，pattern 优先
    suggestions.sort((a, b) => (b.confidence * (b.source === 'pattern' ? 1.2 : 1)) -
                            (a.confidence * (a.source === 'pattern' ? 1.2 : 1)));

    return suggestions.slice(0, topK);
  },

  /**
   * 格式化为人类可读字符串
   * @param {object[]} suggestions
   * @returns {string}
   */
  format(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      return '💡 暂无 workflow 建议（多使用几次后会自动学习）';
    }

    const lines = [];
    lines.push(`💡 智能 workflow 建议（${suggestions.length} 条）`);
    for (const s of suggestions) {
      const cmd = s.command ? `\`${s.command}\`` : '';
      lines.push(`  ${s.icon || '•'} ${s.type === 'run_command' ? '运行' : s.type === 'commit' ? '提交' : '建议'}: ${cmd}`);
      lines.push(`     ${s.reason}`);
    }
    return lines.join('\n');
  },

  /**
   * 获取当前上下文快照（用于调试）
   * @param {number} [hours=2]
   * @returns {object}
   */
  context(hours = 2) {
    const Observer = loadObserver();
    const Miner = loadMiner();
    return {
      recentEvents: Observer ? Observer.getRecentEvents(hours).length : 0,
      patterns: Miner ? (Miner.loadPatterns()?.patterns?.length || 0) : 0,
      uncommitted: getUncommittedCount(),
      recentFiles: getRecentModifiedFiles(hours),
    };
  },
};

// ── 内部函数 ─────────────────────────────────────────

function describeTrigger(trigger) {
  const parts = [];
  if (trigger.type === 'file_modified') {
    parts.push('修改了');
    if (trigger.modules?.length) parts.push(trigger.modules.join('/') + ' 模块');
    else if (trigger.exts?.length) parts.push(trigger.exts.join('/') + ' 文件');
    else parts.push('文件');
  } else if (trigger.type === 'command_run') {
    parts.push(`执行了 \`${trigger.command || '命令'}\``);
  } else if (trigger.type === 'plan_created') {
    parts.push('创建了 plan');
  } else if (trigger.type === 'session_start') {
    parts.push('开启了新会话');
  } else {
    parts.push(`发生了 ${trigger.type}`);
  }
  return parts.join('');
}

function getUncommittedCount() {
  const output = execSafe('git status --porcelain');
  if (!output) return 0;
  return output.split('\n').filter(Boolean).length;
}

function getRecentModifiedFiles(hours) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const output = execSafe(`git log --pretty=format:"%H %ad" --date=iso --since="${since}" --name-only`);
  if (!output) return [];

  const files = new Set();
  for (const line of output.split('\n')) {
    if (line.trim() && !line.includes(' ')) {
      files.add(line.trim());
    }
  }
  return Array.from(files).slice(0, 10);
}

function generateHeuristicSuggestions(recentEvents, usedKeys) {
  const suggestions = [];

  // 启发 1：未提交改动 > 0 → 建议 commit
  const uncommitted = getUncommittedCount();
  if (uncommitted > 0) {
    const key = 'heuristic:commit';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      suggestions.push({
        type: 'commit',
        reason: `当前有 ${uncommitted} 个未提交改动，建议整理后 commit`,
        confidence: 0.6,
        icon: '💾',
        source: 'heuristic',
      });
    }
  }

  // 启发 2：最近修改了特定模块 → 建议对应测试
  const recentFiles = [];
  for (const ev of recentEvents) {
    if (ev.type === 'file_modified' && Array.isArray(ev.payload?.files)) {
      recentFiles.push(...ev.payload.files);
    }
  }

  const modules = new Set();
  for (const file of recentFiles) {
    const parts = file.split(/[/\\]/);
    if (parts.length >= 2 && parts[0] === 'scripts') {
      modules.add(parts[1]);
    } else if (/\.(md)$/.test(file)) {
      modules.add('docs');
    } else if (parts[0] === '.claude') {
      modules.add('claude-config');
    }
  }

  for (const mod of modules) {
    const mapping = MODULE_SUGGESTIONS[mod];
    if (!mapping) continue;
    const key = `heuristic:${mod}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    suggestions.push({
      type: 'run_command',
      command: mapping.command,
      reason: mapping.reason,
      confidence: 0.5,
      icon: mapping.icon,
      source: 'heuristic',
    });
  }

  // 启发 3：最近有 plan_created 但没有 plan_approved → 建议 review
  const hasPlanCreated = recentEvents.some(e => e.type === 'plan_created');
  const hasPlanApproved = recentEvents.some(e => e.type === 'plan_approved');
  if (hasPlanCreated && !hasPlanApproved) {
    const key = 'heuristic:plan';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      suggestions.push({
        type: 'review_changes',
        reason: '你创建了 plan 但还没批准，可以 /ok 继续或 /no 调整',
        confidence: 0.55,
        icon: '📋',
        source: 'heuristic',
      });
    }
  }

  return suggestions;
}

// ── CLI 入口 ─────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2] || 'suggest';

  try {
    switch (cmd) {
      case 'suggest': {
        const hours = parseFloat(process.argv[3]) || 2;
        const topK = parseInt(process.argv[4], 10) || 3;
        const suggestions = Suggest.suggest({ hours, topK });
        console.log(Suggest.format(suggestions));
        break;
      }
      case 'context': {
        const hours = parseFloat(process.argv[3]) || 2;
        const ctx = Suggest.context(hours);
        console.log(JSON.stringify(ctx, null, 2));
        break;
      }
      case 'json': {
        const hours = parseFloat(process.argv[3]) || 2;
        const topK = parseInt(process.argv[4], 10) || 3;
        const suggestions = Suggest.suggest({ hours, topK });
        console.log(JSON.stringify(suggestions, null, 2));
        break;
      }
      case 'help':
      default:
        console.log(`
suggestion-engine.js — 个人 workflow 主动建议引擎

用法:
  node suggestion-engine.js suggest [hours=2] [topK=3]
  node suggestion-engine.js json [hours=2] [topK=3]
  node suggestion-engine.js context [hours=2]

说明:
  从 workflow-events.jsonl 学习你的习惯，结合当前 git 状态给出下一步建议。
`);
    }
  } catch (e) {
    console.error('❌ 异常:', e.message);
  }
  process.exit(0);
}

module.exports = Suggest;
