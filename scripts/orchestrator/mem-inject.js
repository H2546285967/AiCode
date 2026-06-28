#!/usr/bin/env node
/**
 * mem-inject.js — 基于压缩历史的"相关性注入"（M39 · 借鉴 thedotmack/claude-mem）
 *
 * 痛点：新会话启动时，需要"历史上跟当前任务相关的"决策/教训，但 left-brain 只有
 *       机械 TF-IDF（skill-reuse），不能区分"事件类别"重要性。
 *
 * 借鉴思路（claude-mem 注入层）：
 *   - 把压缩后的历史当语料，按相关性 + 时间衰减 + 类别权重评分
 *   - Top-K 输出 + 总字符控制（不爆上下文）
 *   - 输出"可直接粘到 prompt"的 Markdown 片段
 *
 * 本实现（M39 POC）：
 *   - 不接 hook（避免误注入；用户主动调用或 session-init 集成）
 *   - 三因子评分：相关性（关键词 Jaccard）+ 类别权重 + 时间衰减
 *   - 输出：markdown 片段 + token 估算
 *
 * 与 skill-reuse 关系：
 *   - skill-reuse（M27）= 召回 KB（跨任务经验）
 *   - mem-inject（M39）= 从历史压缩里挑"当下相关的事件"
 *   - 互补：KB 长期沉淀 vs 历史会话事件
 *
 * @since v3.0.5 M39 (2026-06-28)
 * @source https://github.com/thedotmack/claude-mem
 * @see scripts/orchestrator/mem-compress.js（产出事件列表）
 * @see scripts/orchestrator/skill-reuse.js（KB 召回）
 */

'use strict';

const { compressFromDisk } = require('./mem-compress');

const DEFAULTS = {
  topK: 8,                    // 最多返回 K 条
  maxChars: 2000,             // 输出总字符上限
  snippetLen: 200,            // 单条截断

  // 类别权重（claude-mem 强调"决策/教训"更重要）
  categoryWeight: {
    decision: 1.3,
    correction: 1.4,    // 纠正更重要（避免重犯）
    commit: 0.7,        // commit 信息密度低
    lesson: 1.5,        // 教训最重要
  },

  // 时间衰减（半衰期 30 天）
  timeDecayHalfLifeDays: 30,

  // 相关性阈值
  minRelevance: 0.02,
};

/**
 * 分词（沿用 skill-reuse 的启发式：中文 2+ / 英文 2+ / 数字 2+）
 */
function tokenize(text) {
  if (!text) return new Set();
  const tokens = new Set();
  const cn = text.match(/[一-龥]{2,}/g) || [];
  cn.forEach(m => tokens.add(m));
  const en = text.match(/[a-zA-Z]{2,}/g) || [];
  en.forEach(m => tokens.add(m.toLowerCase()));
  const num = text.match(/\d{2,}/g) || [];
  num.forEach(m => tokens.add(m));
  return tokens;
}

/**
 * Jaccard 相关分
 */
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach(t => { if (b.has(t)) inter++; });
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * 时间衰减因子（越近越高）
 * @param {string} savedAt  ISO timestamp
 * @param {number} halfLifeDays
 * @returns {number} 0-1
 */
function timeDecay(savedAt, halfLifeDays = DEFAULTS.timeDecayHalfLifeDays) {
  if (!savedAt) return 0.5;
  const t = new Date(savedAt).getTime();
  if (Number.isNaN(t)) return 0.5;
  const ageDays = (Date.now() - t) / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return 1; // 未来时间
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/**
 * 单事件评分
 * @param {object} event  { category, label, text, saved_at }
 * @param {Set} qTokens
 * @param {object} [opts]
 * @returns {{ event, relevance, decay, categoryBoost, final }}
 */
function scoreEvent(event, qTokens, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const eTokens = tokenize(event.text);
  const relevance = jaccard(qTokens, eTokens);
  const decay = timeDecay(event.saved_at, o.timeDecayHalfLifeDays);
  const categoryBoost = o.categoryWeight[event.category] || 1.0;
  // 综合分：相关性 × 时间衰减 × 类别权重（开根号软化，避免某一因子压死）
  const final = relevance * Math.sqrt(decay) * Math.sqrt(categoryBoost);
  return { event, relevance, decay, categoryBoost, final };
}

/**
 * 主函数：从压缩历史挑 Top-K 相关事件
 * @param {string} query  当前任务描述
 * @param {object} [opts]
 * @param {Array} [opts.events]  跳过磁盘读取，直接传事件列表（测试用）
 * @returns {{
 *   hits: Array,
 *   totalChars: number,
 *   summary: string,       // markdown 片段
 *   stats: { totalEvents, returned, avgRelevance, charSaved },
 * }}
 */
function injectRelevant(query, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  if (!query || typeof query !== 'string') {
    return { hits: [], totalChars: 0, summary: '', stats: { totalEvents: 0, returned: 0, avgRelevance: 0, charSaved: 0 } };
  }

  // 1. 取事件（优先用传入的，否则从磁盘读）
  const events = o.events || compressFromDisk().events;
  const totalEvents = events.length;
  const qTokens = tokenize(query);

  // 2. 评分 + 过滤
  const scored = events
    .map(e => scoreEvent(e, qTokens, o))
    .filter(s => s.relevance >= o.minRelevance)
    .sort((a, b) => b.final - a.final)
    .slice(0, o.topK);

  // 3. 拼装 markdown（边拼边检查 maxChars，超出就截断最后一个 block）
  const parts = [];
  const header = `## 📌 历史相关注入（${scored.length}/${totalEvents} 条 · 阈值 ${(o.minRelevance * 100).toFixed(0)}%）\n`;
  parts.push(header);
  let totalChars = header.length;
  let actualReturned = 0;

  for (const s of scored) {
    if (totalChars >= o.maxChars) break;
    const t = (s.event.saved_at || '').slice(0, 10);
    let block = `- **[${t}] [${s.event.label}]** ${s.event.text.slice(0, o.snippetLen)}` +
      `${s.event.text.length > o.snippetLen ? '...' : ''}` +
      ` _(相关 ${(s.relevance * 100).toFixed(0)}% · 衰减 ${(s.decay * 100).toFixed(0)}% · ${s.event.category}×${s.categoryBoost})_`;
    // 剩余预算不足时也截断这一条
    const remaining = o.maxChars - totalChars;
    if (block.length > remaining) {
      block = block.slice(0, Math.max(0, remaining - 3)) + '...';
    }
    parts.push(block);
    parts.push('');
    totalChars += block.length;
    actualReturned++;
  }

  const summary = parts.join('\n');
  const avgRelevance = actualReturned > 0 ? scored.slice(0, actualReturned).reduce((a, s) => a + s.relevance, 0) / actualReturned : 0;

  // 估算 token 节省（vs 全部历史全量注入）
  const charSaved = Math.max(0, totalEvents * 120 - summary.length);

  return {
    hits: scored.slice(0, actualReturned).map(s => ({
      id: s.event.session_id,
      category: s.event.category,
      label: s.event.label,
      text: s.event.text,
      saved_at: s.event.saved_at,
      score: s.final,
    })),
    totalChars: summary.length,
    summary,
    stats: {
      totalEvents,
      returned: actualReturned,
      avgRelevance,
      charSaved,
    },
  };
}

module.exports = {
  DEFAULTS,
  tokenize,
  jaccard,
  timeDecay,
  scoreEvent,
  injectRelevant,
};
