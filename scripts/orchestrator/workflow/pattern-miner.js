#!/usr/bin/env node
/**
 * pattern-miner.js — 个人 workflow 模式挖掘器（v2.0 P0-5）
 *
 * 作用：
 *   - 从 workflow-events.jsonl 挖掘常见行为模式
 *   - 输出 workflow-patterns.json（供 suggestion-engine 使用）
 *
 * 挖掘规则：
 *   - 关联规则：A 事件发生后，T 分钟内发生 B 事件
 *   - 支持度 support = A→B 共同出现次数
 *   - 置信度 confidence = support / count(A)
 *   - 仅保留 support >= minSupport 且 confidence >= minConfidence 的模式
 *
 * 支持的模式类型：
 *   - file_modified → command_run（如改 orchestrator .js 后跑 npm test）
 *   - file_modified → test_run
 *   - file_modified → commit
 *   - command_run → command_run（命令链）
 *   - plan_created → plan_approved
 *   - session_start → command_run
 *
 * 用法：
 *   const Miner = require('./pattern-miner');
 *   Miner.mine({ minSupport: 3, minConfidence: 0.6 });
 *
 *   CLI:
 *   node pattern-miner.js mine
 *   node pattern-miner.js list
 *   node pattern-miner.js stats
 *
 * @since v2.0.2 (2026-06-25)
 * @source 03_版本迭代计划.md §五 v2.0 P0-5
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(WORKSPACE_ROOT, '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');
const EVENTS_FILE = process.env.WORKFLOW_EVENTS_FILE
  ? path.resolve(process.env.WORKFLOW_EVENTS_FILE)
  : path.join(MEMORY_DIR, 'workflow-events.jsonl');
const PATTERNS_FILE = process.env.WORKFLOW_PATTERNS_FILE
  ? path.resolve(process.env.WORKFLOW_PATTERNS_FILE)
  : path.join(MEMORY_DIR, 'workflow-patterns.json');

// 默认阈值
const DEFAULT_MIN_SUPPORT = 2;
const DEFAULT_MIN_CONFIDENCE = 0.5;
const DEFAULT_WINDOW_MINUTES = 30;

// 事件类型对（触发 → 行为）
const RULE_TEMPLATES = [
  { trigger: 'file_modified', action: 'command_run' },
  { trigger: 'file_modified', action: 'test_run' },
  { trigger: 'file_modified', action: 'commit' },
  { trigger: 'command_run', action: 'command_run' },
  { trigger: 'command_run', action: 'test_run' },
  { trigger: 'test_run', action: 'commit' },
  { trigger: 'plan_created', action: 'plan_approved' },
  { trigger: 'session_start', action: 'command_run' },
];

// ── 工具函数 ─────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFileSafe(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch {
    return null;
  }
}

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  const content = readFileSafe(EVENTS_FILE);
  if (!content) return [];

  const events = [];
  for (const line of content.split('\n').filter(Boolean)) {
    try {
      events.push(JSON.parse(line));
    } catch { /* skip malformed */ }
  }
  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

function hashTrigger(trigger) {
  const parts = [
    `T:${trigger.type}`,
    trigger.modules ? `M:${trigger.modules.sort().join(',')}` : '',
    trigger.exts ? `E:${trigger.exts.sort().join(',')}` : '',
    trigger.command ? `C:${trigger.command}` : '',
  ];
  return parts.filter(Boolean).join('|');
}

function hashPattern(pattern) {
  const a = pattern.action;
  const parts = [
    hashTrigger(pattern.trigger),
    `A:${a.type}`,
    a.command ? `C:${a.command}` : '',
    a.testCommand ? `TC:${a.testCommand}` : '',
  ];
  return parts.filter(Boolean).join('|');
}

function makePattern(triggerEvent, actionEvent, count) {
  const trigger = { type: triggerEvent.type };
  const payload = triggerEvent.payload || {};
  if (payload.modules?.length) trigger.modules = payload.modules.slice().sort();
  if (payload.exts?.length) trigger.exts = payload.exts.slice().sort();
  if (payload.command) trigger.command = payload.command;

  const action = { type: actionEvent.type };
  const actionPayload = actionEvent.payload || {};
  if (actionPayload.command) action.command = actionPayload.command;
  if (actionPayload.testCommand) action.testCommand = actionPayload.testCommand;

  return {
    id: `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    trigger,
    action,
    support: count,
    confidence: 0, // 后面计算
    lastSeen: actionEvent.ts,
  };
}

function patternMatchesEvent(pattern, event) {
  const side = pattern.trigger;
  if (side.type !== event.type) return false;

  const payload = event.payload || {};
  if (side.modules?.length) {
    const eventModules = payload.modules || [];
    if (!side.modules.some(m => eventModules.includes(m))) return false;
  }
  if (side.exts?.length) {
    const eventExts = payload.exts || [];
    if (!side.exts.some(e => eventExts.includes(e))) return false;
  }
  if (side.command && payload.command !== side.command) return false;
  return true;
}

function actionMatches(pattern, event) {
  const side = pattern.action;
  if (side.type !== event.type) return false;

  const payload = event.payload || {};
  if (side.command && payload.command !== side.command) return false;
  if (side.testCommand && payload.testCommand !== side.testCommand) return false;
  return true;
}

// ── 核心 API ─────────────────────────────────────────

const Miner = {
  /**
   * 执行模式挖掘
   * @param {object} [opts]
   * @returns {object} { patterns, stats }
   */
  mine(opts = {}) {
    const minSupport = opts.minSupport || DEFAULT_MIN_SUPPORT;
    const minConfidence = opts.minConfidence || DEFAULT_MIN_CONFIDENCE;
    const windowMs = (opts.windowMinutes || DEFAULT_WINDOW_MINUTES) * 60 * 1000;
    const maxPatterns = opts.maxPatterns || 100;

    const events = readEvents();
    const stats = {
      totalEvents: events.length,
      minSupport,
      minConfidence,
      windowMinutes: opts.windowMinutes || DEFAULT_WINDOW_MINUTES,
    };

    if (events.length === 0) {
      return { patterns: [], stats };
    }

    // Step 1: 统计 trigger 出现次数（按 trigger 完整维度：type + modules + exts + command）
    // 修复：旧逻辑只按 trigger.type 计数，导致同一 type 在不同 context（如 .js vs .md）被合并，
    // 分母过大、confidence 系统性偏低，minConfidence=0.5 会滤掉真模式。
    const triggerCounts = new Map(); // hash -> count
    for (const ev of events) {
      const counted = new Set(); // 同一事件同一 trigger 维度只计一次（可能匹配多个 rule）
      for (const rule of RULE_TEMPLATES) {
        if (ev.type !== rule.trigger) continue;
        const trigger = { type: ev.type };
        const payload = ev.payload || {};
        if (payload.modules?.length) trigger.modules = payload.modules.slice().sort();
        if (payload.exts?.length) trigger.exts = payload.exts.slice().sort();
        if (payload.command) trigger.command = payload.command;
        const hash = hashTrigger(trigger);
        if (counted.has(hash)) continue;
        counted.add(hash);
        triggerCounts.set(hash, (triggerCounts.get(hash) || 0) + 1);
      }
    }

    // Step 2: 挖掘窗口内共现
    const cooccurrence = new Map(); // hash -> { triggerEvent, actionEvent, count, lastTs }

    for (let i = 0; i < events.length; i++) {
      const evA = events[i];
      const tA = new Date(evA.ts).getTime();

      for (const rule of RULE_TEMPLATES) {
        if (evA.type !== rule.trigger) continue;

        // v3.0.8 P0-007 修复：窗口内所有匹配 action 都计数（之前 break 只计首个）
        for (let j = i + 1; j < events.length; j++) {
          const evB = events[j];
          const tB = new Date(evB.ts).getTime();
          if (tB - tA > windowMs) break;
          if (evB.type !== rule.action) continue;

          // 每次匹配都计一对（共现 pair）
          const pattern = makePattern(evA, evB, 0);
          const hash = hashPattern(pattern);

          const existing = cooccurrence.get(hash);
          if (existing) {
            existing.count++;
            if (evB.ts > existing.lastTs) {
              existing.lastTs = evB.ts;
              existing.lastAction = evB;
            }
          } else {
            cooccurrence.set(hash, {
              pattern,
              count: 1,
              lastTs: evB.ts,
              lastAction: evB,
            });
          }
        }
      }
    }

    // Step 3: 计算置信度并过滤
    const patterns = [];
    for (const { pattern, count, lastAction } of cooccurrence.values()) {
      const triggerHash = hashTrigger(pattern.trigger);
      const triggerTotal = triggerCounts.get(triggerHash) || 1;
      const confidence = count / triggerTotal;
      if (count >= minSupport && confidence >= minConfidence) {
        pattern.support = count;
        pattern.confidence = Number(confidence.toFixed(3));
        pattern.lastSeen = lastAction.ts;
        patterns.push(pattern);
      }
    }

    // 按置信度 × 支持度排序
    patterns.sort((a, b) => (b.confidence * b.support) - (a.confidence * a.support));

    const finalPatterns = patterns.slice(0, maxPatterns);

    return {
      patterns: finalPatterns,
      stats: {
        ...stats,
        patternsFound: finalPatterns.length,
        candidates: patterns.length + (cooccurrence.size - patterns.length),
      },
    };
  },

  /**
   * 保存挖掘结果到 workflow-patterns.json
   * @param {object} [opts]
   * @returns {object}
   */
  mineAndSave(opts = {}) {
    const result = Miner.mine(opts);
    try {
      ensureDir(MEMORY_DIR);
      fs.writeFileSync(PATTERNS_FILE, JSON.stringify({
        ts: new Date().toISOString(),
        ...result,
      }, null, 2));
    } catch (e) {
      process.stderr.write(`[pattern-miner] save failed: ${e.message}\n`);
    }
    return result;
  },

  /**
   * 读取已保存的模式
   * @returns {object|null}
   */
  loadPatterns() {
    if (!fs.existsSync(PATTERNS_FILE)) return null;
    try {
      return JSON.parse(readFileSafe(PATTERNS_FILE));
    } catch {
      return null;
    }
  },

  /**
   * 根据当前事件推荐匹配的模式
   * @param {object[]} recentEvents 最近事件
   * @param {number} [topK=5]
   * @returns {object[]}
   */
  matchPatterns(recentEvents, topK = 5) {
    const data = Miner.loadPatterns();
    if (!data || !data.patterns) return [];

    const patterns = data.patterns;
    const matches = [];

    for (const pattern of patterns) {
      // 最近是否有事件触发这个 pattern
      for (let i = recentEvents.length - 1; i >= 0; i--) {
        const ev = recentEvents[i];
        if (patternMatchesEvent(pattern, ev)) {
          matches.push({
            ...pattern,
            matchedAt: ev.ts,
          });
          break;
        }
      }
    }

    return matches
      .sort((a, b) => (b.confidence * b.support) - (a.confidence * a.support))
      .slice(0, topK);
  },

  get PATTERNS_FILE() { return PATTERNS_FILE; },
  get EVENTS_FILE() { return EVENTS_FILE; },
};

// ── CLI 入口 ─────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2] || 'help';

  try {
    switch (cmd) {
      case 'mine': {
        const opts = {
          minSupport: parseFloat(process.argv[3]) || DEFAULT_MIN_SUPPORT,
          minConfidence: parseFloat(process.argv[4]) || DEFAULT_MIN_CONFIDENCE,
          windowMinutes: parseFloat(process.argv[5]) || DEFAULT_WINDOW_MINUTES,
        };
        const result = Miner.mineAndSave(opts);
        console.log(`✅ 模式挖掘完成`);
        console.log(`  事件总数: ${result.stats.totalEvents}`);
        console.log(`  有效模式: ${result.stats.patternsFound}`);
        console.log(`  阈值: support>=${opts.minSupport}, confidence>=${opts.minConfidence}, window=${opts.windowMinutes}min`);
        for (const p of result.patterns.slice(0, 10)) {
          const triggerDesc = JSON.stringify(p.trigger);
          const actionDesc = JSON.stringify(p.action);
          console.log(`  • ${triggerDesc} → ${actionDesc} (sup=${p.support}, conf=${p.confidence})`);
        }
        break;
      }
      case 'list': {
        const data = Miner.loadPatterns();
        if (!data || !data.patterns || data.patterns.length === 0) {
          console.log('📋 暂无模式（先跑 mine）');
          break;
        }
        console.log(`📋 已保存模式（${data.patterns.length} 条，更新于 ${data.ts?.slice(0, 19) || '未知'}）`);
        for (const p of data.patterns) {
          const triggerDesc = JSON.stringify(p.trigger);
          const actionDesc = JSON.stringify(p.action);
          console.log(`  • ${triggerDesc} → ${actionDesc} (sup=${p.support}, conf=${p.confidence})`);
        }
        break;
      }
      case 'stats': {
        const data = Miner.loadPatterns();
        if (!data) {
          console.log('📋 暂无模式数据');
          break;
        }
        console.log(`📊 模式统计`);
        console.log(`  总数: ${data.patterns?.length || 0}`);
        console.log(`  事件数: ${data.stats?.totalEvents || 0}`);
        console.log(`  挖掘时间: ${data.ts?.slice(0, 19) || '未知'}`);
        break;
      }
      case 'help':
      default:
        console.log(`
pattern-miner.js — 个人 workflow 模式挖掘器

用法:
  node pattern-miner.js mine [minSupport=2] [minConfidence=0.5] [windowMinutes=30]
  node pattern-miner.js list
  node pattern-miner.js stats

阈值说明:
  support    模式至少出现多少次才保留
  confidence 触发后实际执行行为的概率
  window     触发后多少分钟内算一次共现
`);
    }
  } catch (e) {
    console.error('❌ 异常:', e.message);
  }
  process.exit(0);
}

module.exports = Miner;
