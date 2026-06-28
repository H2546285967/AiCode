#!/usr/bin/env node
/**
 * test-mem-poc.js — mem-compress + mem-inject 测试（M39 · v3.0.5）
 *
 * 覆盖：
 *   - mem-compress：extract / dedupe / sort / counts / dateRange / markdown
 *   - mem-inject：tokenize / jaccard / timeDecay / scoreEvent / injectRelevant（含 mock events 不依赖磁盘）
 *   - 端到端：磁盘 sample sessions → compress → inject
 *
 * @since v3.0.5 M39 (2026-06-28)
 */

'use strict';

const {
  DEFAULTS: COMPRESS_DEFAULTS,
  extractEvents,
  dedupeEvents,
  sortByTime,
  compressSessions,
} = require('./mem-compress');

const {
  DEFAULTS: INJECT_DEFAULTS,
  injectRelevant,
  tokenize,
  jaccard,
  timeDecay,
  scoreEvent,
} = require('./mem-inject');

let pass = 0, fail = 0;
const fails = [];

function check(name, cond, expected, actual) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else {
    fail++; fails.push(name);
    console.log(`❌ ${name}`);
    if (expected !== undefined) console.log(`   expected: ${JSON.stringify(expected)}`);
    if (actual !== undefined) console.log(`   actual:   ${JSON.stringify(actual)}`);
  }
}

function near(a, b, eps = 0.01) { return Math.abs(a - b) <= eps; }

console.log('━'.repeat(60));
console.log('🧪 mem-poc 测试（M39 · v3.0.5 · 借鉴 thedotmack/claude-mem）');
console.log('━'.repeat(60));

// ════════════════════════════════════════════════════════════════
// PART A: mem-compress
// ════════════════════════════════════════════════════════════════

console.log('\n━━━ PART A: mem-compress ━━━');

// ── A1. extractEvents ──
console.log('\n── A1. extractEvents 事件抽取 ──');
const sample1 = `---
session_id: 20260625-120000
saved_at: 2026-06-25 12:00:00
type: session_summary
---
# 会话摘要
## 对话内容
- 决定用 Python 3.12
- 不对，应该用 Python 3.11
- 教训：永远检查依赖
- commit ae29b7f 完成 M36A
## 关键决策
- 决策：用 uv 管理依赖
`;
const evs1 = extractEvents(sample1);
check('extractEvents 返回数组', Array.isArray(evs1));
check('extractEvents 至少 5 条', evs1.length >= 5, 'actual: ' + evs1.length);
check('包含 decision 类别', evs1.some(e => e.category === 'decision'));
check('包含 correction 类别', evs1.some(e => e.category === 'correction'));
check('包含 lesson 类别', evs1.some(e => e.category === 'lesson'));
check('包含 commit 类别', evs1.some(e => e.category === 'commit'));
check('每条事件有 session_id', evs1.every(e => e.session_id === '20260625-120000'));
check('每条事件有 saved_at', evs1.every(e => e.saved_at === '2026-06-25 12:00:00'));
check('空内容 → 空数组', extractEvents('').length === 0);
check('null → 空数组', extractEvents(null).length === 0);
check('跳过标题行', !evs1.some(e => e.text.startsWith('#')));
check('跳过 frontmatter', !evs1.some(e => e.text.includes('session_id:')));

// ── A2. dedupeEvents ──
console.log('\n── A2. dedupeEvents 去重 ──');
const dupEvents = [
  { text: '决定用 Python 3.12 做后端开发', category: 'decision', label: '决策' },
  { text: '决定用 Python 3.12 做后端开发', category: 'decision', label: '决策' },
  { text: '决定用 Python 3.12 做后端开发的理由是...', category: 'decision', label: '决策' },
  { text: '完全不同的内容：杭州西湖游玩', category: 'correction', label: '纠正' },
];
const deduped = dedupeEvents(dupEvents);
check('去重后剩 3 条（前缀足够长时，第 3 条和第 1 条不完全一致视为不同）', deduped.length === 3, 'actual: ' + deduped.length);
check('保留第一条', deduped[0].text.startsWith('决定用 Python 3.12'));
check('包含不重复的第 4 条', deduped.some(e => e.text.startsWith('完全不同的内容')));
check('空数组', dedupeEvents([]).length === 0);

// ── A3. sortByTime ──
console.log('\n── A3. sortByTime 时间排序 ──');
const timeEvents = [
  { text: 'c', saved_at: '2026-06-25 10:00:00' },
  { text: 'a', saved_at: '2026-06-23 10:00:00' },
  { text: 'b', saved_at: '2026-06-24 10:00:00' },
];
const sorted = sortByTime(timeEvents);
check('按时间升序', sorted[0].text === 'a' && sorted[1].text === 'b' && sorted[2].text === 'c');
check('不修改原数组', sorted !== timeEvents);

// ── A4. compressSessions 集成 ──
console.log('\n── A4. compressSessions 集成 ──');
const s1 = `---
session_id: 20260625-120000
saved_at: 2026-06-25 12:00:00
---
- 决定用 Python 3.12
- 教训：永远检查依赖
- commit ae29b7f 完成 M36A`;
const s2 = `---
session_id: 20260626-100000
saved_at: 2026-06-26 10:00:00
---
- 不对，应该用 Python 3.11
- 教训：永远检查依赖
- 决策：用 uv 管理依赖`;
const cmp = compressSessions([s1, s2]);
check('返回 events 数组', Array.isArray(cmp.events));
check('去重后 ≥ 4 条', cmp.events.length >= 4, 'actual: ' + cmp.events.length);
check('去重后 ≤ 6 条（上限）', cmp.events.length <= 6, 'actual: ' + cmp.events.length);
check('decision 计数 > 0', cmp.counts.decision > 0);
check('correction 计数 > 0', cmp.counts.correction > 0);
check('commit 计数 > 0', cmp.counts.commit > 0);
check('lesson 计数 = 1（去重）', cmp.counts.lesson === 1, 'actual: ' + cmp.counts.lesson);
check('total = decision+correction+commit+lesson', cmp.counts.total === cmp.counts.decision + cmp.counts.correction + cmp.counts.commit + cmp.counts.lesson);
check('dateRange.from 是最早时间', cmp.dateRange && cmp.dateRange.from === '2026-06-25 12:00:00');
check('dateRange.to 是最晚时间', cmp.dateRange && cmp.dateRange.to === '2026-06-26 10:00:00');
check('markdown 包含标题', cmp.markdown.includes('## 📜 压缩历史'));
check('markdown 包含事件', cmp.markdown.includes('- **[2'));
check('text 包含类别前缀', cmp.text.includes('[教训]'));
check('空输入 → 空 events', compressSessions([]).events.length === 0);
check('空输入 → counts.total = 0', compressSessions([]).counts.total === 0);
check('空输入 → dateRange = null', compressSessions([]).dateRange === null);

// ── A5. maxEvents 截断 ──
console.log('\n── A5. maxEvents 截断 ──');
const manyEvents = Array.from({ length: 100 }, (_, i) => ({
  text: `事件${i}: 这是第${i}条测试内容用于触发 maxEvents`,
  saved_at: `2026-06-${String(20 + (i % 5)).padStart(2, '0')} 10:00:00`,
  category: 'lesson',
  label: '教训',
}));
const truncated = compressSessions(
  [`---\nsession_id: t\nsaved_at: 2026-06-20 10:00:00\n---\n` + manyEvents.map(e => `- ${e.text}`).join('\n')],
  { maxEvents: 10 }
);
check('maxEvents=10 时 events ≤ 10', truncated.events.length <= 10, 'actual: ' + truncated.events.length);

// ════════════════════════════════════════════════════════════════
// PART B: mem-inject
// ════════════════════════════════════════════════════════════════

console.log('\n━━━ PART B: mem-inject ━━━');

// ── B1. tokenize ──
console.log('\n── B1. tokenize 分词 ──');
const tokens = tokenize('PowerShell Set-Content UTF-8 中文文件 乱码');
check('包含 PowerShell', tokens.has('PowerShell') || tokens.has('powershell'));
check('包含 UTF', tokens.has('UTF') || tokens.has('utf'));
check('包含中文', tokens.has('中文文件'));
check('空字符串 → 空 set', tokenize('').size === 0);
check('null → 空 set', tokenize(null).size === 0);

// ── B2. jaccard ──
console.log('\n── B2. jaccard 相关分 ──');
const a = new Set(['python', 'pip', '依赖']);
const b = new Set(['python', 'pip', '包']);
const c = new Set(['杭州', '西湖']);
check('a vs b 相似 > 0', jaccard(a, b) > 0);
check('a vs c = 0', jaccard(a, c) === 0);
check('a vs a = 1', jaccard(a, a) === 1);
check('空 set 边界', jaccard(new Set(), a) === 0);

// ── B3. timeDecay ──
console.log('\n── B3. timeDecay 时间衰减 ──');
const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const wayback = new Date(Date.now() - 86400000 * 365).toISOString();
check('now → 高', timeDecay(now) > 0.95);
check('yesterday → 中高', timeDecay(yesterday) > 0.9 && timeDecay(yesterday) < 1.0);
check('1 年前 → 低', timeDecay(wayback) < 0.05);
check('未来时间 → 1', timeDecay('2099-01-01T00:00:00Z') === 1);
check('无时间 → 0.5', timeDecay(null) === 0.5);

// ── B4. scoreEvent ──
console.log('\n── B4. scoreEvent 综合评分 ──');
const recentEvent = {
  category: 'lesson',
  label: '教训',
  text: 'Python 依赖管理要用 uv',
  saved_at: new Date().toISOString(),
};
const oldEvent = {
  category: 'commit',
  label: '提交',
  text: 'Python 依赖管理测试通过',
  saved_at: new Date(Date.now() - 86400000 * 90).toISOString(), // 90 天前
};
const qTokens = tokenize('Python 依赖管理');
const sRecent = scoreEvent(recentEvent, qTokens);
const sOld = scoreEvent(oldEvent, qTokens);
check('lesson 类别 boost > commit', sRecent.categoryBoost > sOld.categoryBoost);
check('recent 时间衰减 > old', sRecent.decay > sOld.decay);
check('recent 综合分 > old', sRecent.final > sOld.final, `recent=${sRecent.final.toFixed(3)} old=${sOld.final.toFixed(3)}`);
check('所有分在 0-1 之间', sRecent.final >= 0 && sRecent.final <= 1);

// ── B5. injectRelevant ──
console.log('\n── B5. injectRelevant 主函数 ──');
const mockEvents = [
  { category: 'lesson', label: '教训', text: 'Python 依赖管理要用 uv', saved_at: new Date().toISOString(), session_id: 's1' },
  { category: 'decision', label: '决策', text: '选择 Python 3.12', saved_at: new Date(Date.now() - 86400000).toISOString(), session_id: 's2' },
  { category: 'commit', label: '提交', text: 'fix pipeline', saved_at: new Date(Date.now() - 86400000 * 60).toISOString(), session_id: 's3' },
  { category: 'correction', label: '纠正', text: '不对，Python 应该用 3.11', saved_at: new Date().toISOString(), session_id: 's4' },
  { category: 'lesson', label: '教训', text: '杭州西湖游玩攻略', saved_at: new Date().toISOString(), session_id: 's5' }, // 完全不相关
];
const r1 = injectRelevant('Python 依赖管理', { events: mockEvents });
check('返回 hits 数组', Array.isArray(r1.hits));
check('返回 summary', typeof r1.summary === 'string' && r1.summary.length > 0);
check('返回 stats', typeof r1.stats === 'object');
check('summary 包含标题', r1.summary.includes('历史相关注入'));
check('summary 至少 1 条', r1.hits.length >= 1);
check('summary 不超过 maxChars+10%', r1.totalChars <= INJECT_DEFAULTS.maxChars * 1.1, 'actual: ' + r1.totalChars);
check('不相关事件被过滤', !r1.hits.some(h => h.text.includes('西湖')));
check('stats.avgRelevance > 0', r1.stats.avgRelevance > 0);
check('stats.charSaved > 0（节省了字符）', r1.stats.charSaved > 0);
check('空 query → 空结果', injectRelevant('').hits.length === 0);
check('null query → 空结果', injectRelevant(null).hits.length === 0);
check('topK 限制', injectRelevant('Python', { events: mockEvents, topK: 2 }).hits.length <= 2);
check('maxChars 截断', injectRelevant('Python', { events: mockEvents, maxChars: 100 }).totalChars <= 250); // 标题也算

// ── B6. 类别排序合理性 ──
console.log('\n── B6. 类别排序合理性 ──');
const allCategories = injectRelevant('Python 依赖', { events: mockEvents });
const lessons = allCategories.hits.filter(h => h.category === 'lesson');
const commits = allCategories.hits.filter(h => h.category === 'commit');
if (lessons.length > 0 && commits.length > 0) {
  check('lesson 类别在 commit 前', allCategories.hits.indexOf(lessons[0]) < allCategories.hits.indexOf(commits[0]),
    'lessons[0]=' + allCategories.hits.indexOf(lessons[0]),
    'commits[0]=' + allCategories.hits.indexOf(commits[0]));
}

// ════════════════════════════════════════════════════════════════
// PART C: 端到端
// ════════════════════════════════════════════════════════════════

console.log('\n━━━ PART C: 端到端 demo ━━━');

// 不依赖磁盘：手动构造 sample sessions
const e2e1 = `---
session_id: 20260620-100000
saved_at: 2026-06-20 10:00:00
---
- 决定用 TypeScript 重写脚本
- 教训：脚本要先写测试
- commit abc1234 feat: M31 swarm POC`;
const e2e2 = `---
session_id: 20260622-100000
saved_at: 2026-06-22 10:00:00
---
- 不对，TypeScript 太重，应保持 JavaScript
- 决策：保持 JS
- 教训：先评估再决定`;
const e2e3 = `---
session_id: 20260625-100000
saved_at: 2026-06-25 10:00:00
---
- 决定用 sandbox-tool-output 解决上下文超限
- commit def5678 feat(M26): sandbox POC
- 教训：mksglu/context-mode 思路值得借鉴`;
const cmp2 = compressSessions([e2e1, e2e2, e2e3]);
check('端到端：events ≥ 5', cmp2.events.length >= 5, 'actual: ' + cmp2.events.length);
check('端到端：dateRange 正确', cmp2.dateRange && cmp2.dateRange.from === '2026-06-20 10:00:00' && cmp2.dateRange.to === '2026-06-25 10:00:00');

const r2 = injectRelevant('sandbox context-mode 借鉴', { events: cmp2.events });
check('端到端：注入能召回 sandbox 决策', r2.hits.some(h => h.text.includes('sandbox-tool-output')));
check('端到端：注入能召回 context-mode 教训', r2.hits.some(h => h.text.includes('mksglu')));
check('端到端：markdown 可读', r2.summary.includes('历史相关注入'));

// ════════════════════════════════════════════════════════════════
// 总结
// ════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(60));
console.log(`📊 总计: ${pass} ✅ / ${fail} ❌`);
console.log('━'.repeat(60));
if (fail > 0) {
  console.log('\n失败清单:');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(1);
} else {
  console.log('\n🎉 全部通过');
  process.exit(0);
}
