#!/usr/bin/env node
/**
 * mem-compress.js — 历史会话智能压缩（M39 · 借鉴 thedotmack/claude-mem）
 *
 * 痛点：left-brain 现在每个 session 摘要全量保存（latest_summary.md + session_*.md），
 *       几十个会话累积后，"历史全量"塞满上下文；用户每次只能加载 latest 一份，丢历史。
 *
 * 借鉴思路（claude-mem 核心）：
 *   - AI 压缩：用模型/启发式把长会话历史压成"高密度摘要"（保留决策/教训/commit，去重闲聊）
 *   - 持久化：压缩后的 summary 落盘，新会话启动可按相关性加载
 *   - 时间线：N 个 session → 一段连贯叙事，而非离散文档
 *
 * 本实现（M39 POC）：
 *   - 启发式压缩（不调真 LLM，避免 token/费用；可后续接 LLM 增强）
 *   - 4 类事件抽取：decision（决策）/ correction（纠正）/ commit（提交）/ lesson（教训）
 *   - 去重：相似事件合并（按首 30 字 hash）
 *   - 时间线：按 session_id 排序，输出"YYYY-MM-DD: ...（类别）..."
 *   - 纯函数，无 IO，便于测试 + 复用
 *
 * 与 left-brain 关系：
 *   - 互补不重复：left-brain 存全量；mem-compress 产出"压缩视图"给新会话
 *   - 输出可作为 session-init 的"历史上下文注入"层（未来可接 hook，POC 阶段不接）
 *
 * @since v3.0.5 M39 (2026-06-28)
 * @source https://github.com/thedotmack/claude-mem · 借鉴评估 7.3/10
 * @see scripts/orchestrator/mem-inject.js（基于压缩结果做相关性注入）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = path.join(__dirname, '..', '..', '.claude', 'skills', 'left-brain', 'memory', 'sessions');

const DEFAULTS = {
  // 事件分类（启发式关键词）
  categories: {
    decision: { label: '决策', patterns: [/决定[用选]/, /决策[：:]/, /选择[用选]/, /采纳/, /确认[方案]/, /^## 决策/m] },
    correction: { label: '纠正', patterns: [/不对[，,]/, /错了/, /应该[是]/, /不是[这样会]/, /纠正:/, /别[这样这]/] },
    commit: { label: '提交', patterns: [/\bcommit\b/, /\d{7,}/, /commit [0-9a-f]{7}/i] },
    lesson: { label: '教训', patterns: [/教训/, /反思/, /复盘/, /失败/, /下次[要别]/, /不要[再这]/] },
  },
  // 去重：前 N 字 hash
  dedupePrefixLen: 30,
  // 单条压缩后保留字数
  snippetLen: 120,
  // 最多事件数（防止压缩后还太长）
  maxEvents: 50,
};

/**
 * 单文件会话摘要 → 事件列表
 * @param {string} content
 * @param {object} [meta]  { session_id, saved_at } 来自文件元数据
 * @param {object} [opts]
 * @returns {Array<{category, label, text, line}>}
 */
function extractEvents(content, meta = {}, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  if (!content || typeof content !== 'string') return [];

  const lines = content.split('\n');
  const events = [];
  // frontmatter 元数据（可被外部 meta 覆盖）
  const idMatch = content.match(/^session_id:\s*(.+)$/m);
  const timeMatch = content.match(/^saved_at:\s*(.+)$/m);
  const sessionId = meta.session_id || (idMatch ? idMatch[1].trim() : null);
  const savedAt = meta.saved_at || (timeMatch ? timeMatch[1].trim() : null);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // 跳过标题 / frontmatter 整段
    if (line.startsWith('#')) continue;
    if (line.startsWith('---')) continue;
    // 跳过 frontmatter 内的字段行（session_id: xxx / saved_at: xxx / type: xxx）
    if (/^(session_id|saved_at|type):\s/.test(line)) continue;
    // 跳过 state-snapshot 生成的元数据行（- **Session ID**: xxx 等）
    if (/\*\*[^*]+\*\*:/.test(line)) continue;

    for (const [key, def] of Object.entries(o.categories)) {
      if (def.patterns.some(re => re.test(line))) {
        events.push({
          category: key,
          label: def.label,
          text: line.replace(/^[-·•*\d.)\s]+/, '').slice(0, o.snippetLen),
          line: i + 1,
          session_id: sessionId,
          saved_at: savedAt,
        });
        break; // 一行最多归一类
      }
    }
  }
  return events;
}

/**
 * 去重：相似事件合并（按首 N 字）
 * @param {Array} events
 * @param {number} [prefixLen]
 * @returns {Array}
 */
function dedupeEvents(events, prefixLen = DEFAULTS.dedupePrefixLen) {
  const seen = new Set();
  const out = [];
  for (const e of events) {
    const key = e.text.slice(0, prefixLen).replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

/**
 * 时间线：按 saved_at 排序
 * @param {Array} events
 * @returns {Array}
 */
function sortByTime(events) {
  return [...events].sort((a, b) => {
    const ta = a.saved_at || '';
    const tb = b.saved_at || '';
    return ta.localeCompare(tb);
  });
}

/**
 * 压缩：多 session → 一段高密度摘要
 * 算法：extract（per-session meta）→ dedupe → sort → 取 maxEvents
 *
 * @param {Array<{content, session_id?, saved_at?}>} sessions  每个元素是一份 session（含元数据）
 * @param {object} [opts]
 * @returns {{
 *   events: Array,
 *   counts: {decision, correction, commit, lesson, total},
 *   dateRange: {from, to}|null,
 *   text: string,        // 压缩后的纯文本（可注入上下文）
 *   markdown: string,    // 带格式的 markdown
 * }}
 */
function compressSessions(sessions, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      events: [],
      counts: { decision: 0, correction: 0, commit: 0, lesson: 0, total: 0 },
      dateRange: null,
      text: '',
      markdown: '',
    };
  }

  // 兼容老调用：纯字符串数组（无 meta）→ 把字符串当 content，meta 从字符串 frontmatter 解析
  const normalized = sessions.map(s => {
    if (typeof s === 'string') {
      const idMatch = s.match(/^session_id:\s*(.+)$/m);
      const timeMatch = s.match(/^saved_at:\s*(.+)$/m);
      return {
        content: s,
        session_id: idMatch ? idMatch[1].trim() : null,
        saved_at: timeMatch ? timeMatch[1].trim() : null,
      };
    }
    return s;
  });

  // 1. extract（每个 session 用自己的 meta）
  let all = [];
  for (const session of normalized) {
    all.push(...extractEvents(session.content, {
      session_id: session.session_id,
      saved_at: session.saved_at,
    }, o));
  }

  // 2. dedupe
  all = dedupeEvents(all, o.dedupePrefixLen);

  // 3. sort by time
  all = sortByTime(all);

  // 4. cap
  if (all.length > o.maxEvents) all = all.slice(-o.maxEvents); // 保留最近

  // 5. counts
  const counts = { decision: 0, correction: 0, commit: 0, lesson: 0, total: all.length };
  for (const e of all) counts[e.category] = (counts[e.category] || 0) + 1;

  // 6. dateRange
  const times = all.map(e => e.saved_at).filter(Boolean).sort();
  const dateRange = times.length > 0 ? { from: times[0], to: times[times.length - 1] } : null;

  // 7. 拼装 markdown
  const md = [];
  md.push(`## 📜 压缩历史（${all.length} 事件 · ${normalized.length} session）`);
  if (dateRange) md.push(`> 时间范围: ${dateRange.from} → ${dateRange.to}`);
  md.push(`> 类别: 决策 ${counts.decision} / 纠正 ${counts.correction} / 提交 ${counts.commit} / 教训 ${counts.lesson}`);
  md.push('');
  for (const e of all) {
    const t = (e.saved_at || '').slice(0, 10); // YYYY-MM-DD
    md.push(`- **[${t}] [${e.label}]** ${e.text}`);
  }

  const markdown = md.join('\n');
  const text = all.map(e => `[${e.label}] ${e.text}`).join('；');

  return { events: all, counts, dateRange, text, markdown };
}

/**
 * 从磁盘加载所有 session（实际 IO 包装）
 * @param {string} [dir]  默认 SESSIONS_DIR
 * @returns {Array<{id, content, file, mtime}>}
 */
function loadAllSessions(dir = SESSIONS_DIR) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => {
    // 只读 markdown session 文件（排除 JSON / latest_state.json 等）
    if (!f.endsWith('.md')) return false;
    if (!f.startsWith('session_') && f !== 'latest_summary.md') return false;
    return true;
  });
  const out = [];
  for (const f of files) {
    const file = path.join(dir, f);
    try {
      const content = fs.readFileSync(file, 'utf8');
      const idMatch = content.match(/^session_id:\s*(.+)$/m);
      const timeMatch = content.match(/^saved_at:\s*(.+)$/m);
      // latest_summary.md 由 state-snapshot.js 生成，格式不同，从粗体元数据解析
      let sessionId = idMatch ? idMatch[1].trim() : f;
      let savedAt = timeMatch ? timeMatch[1].trim() : null;
      if (f === 'latest_summary.md') {
        const sid = content.match(/^-\s*\*\*Session ID\*\*:\s*(.+)$/m);
        const t = content.match(/^-\s*\*\*时间\*\*:\s*(.+)$/m);
        if (sid) sessionId = sid[1].trim();
        if (t) savedAt = t[1].trim();
      }
      const stat = fs.statSync(file);
      out.push({ id: sessionId, content, file, mtime: stat.mtimeMs, saved_at: savedAt });
    } catch { /* 跳过 */ }
  }
  return out.sort((a, b) => a.mtime - b.mtime);
}

/**
 * 一站式：磁盘所有 session → 压缩
 * @param {object} [opts]
 * @returns {object}
 */
function compressFromDisk(opts = {}) {
  const sessions = loadAllSessions();
  return compressSessions(sessions, opts);
}

module.exports = {
  DEFAULTS,
  extractEvents,
  dedupeEvents,
  sortByTime,
  compressSessions,
  loadAllSessions,
  compressFromDisk,
  SESSIONS_DIR,
};
