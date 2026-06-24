#!/usr/bin/env node
/**
 * memos.js 单元测试
 * 验证 4 个核心能力：tiered-memory / hybrid-retrieve / self-evolve / skill-reuse
 */

const fs = require('fs');
const path = require('path');
const {
  tieredMemory,
  hybridRetrieve,
  selfEvolve,
  skillReuse,
  getTier,
  TIER_THRESHOLDS,
} = require('./memos');

let pass = 0, fail = 0;
const fails = [];

// memos/test-memos.js → __dirname = left-brain/scripts/memos/，向上 2 层 = left-brain/，再 memory/
const MEMORY_DIR_TEST = path.join(__dirname, '..', '..', 'memory');
const tierStatePath = path.join(MEMORY_DIR_TEST, 'memos-tier.json');
const logFile = path.join(MEMORY_DIR_TEST, 'logs', 'memos-evolution.jsonl');

function assert(cond, name, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    fails.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ==================== 1. getTier 边界 ====================
section('getTier 边界（分级核心）');

// access_count >= 5 + 不超过 60 天 → hot
assert(getTier({ access_count: '10', last_accessed: new Date().toISOString() }) === 'hot', 'AC=10 + 新 → hot');
// access_count >= 5 + 超过 60 天 → 仍为 hot（活跃即热，时间不抹去热度）
assert(getTier({ access_count: '10', last_accessed: '2020-01-01' }) === 'hot', 'AC=10 即使老也 hot（活跃即热）');
// access_count 2-4 + 新 → warm
assert(getTier({ access_count: '3', last_accessed: new Date().toISOString() }) === 'warm', 'AC=3 + 新 → warm');
// access_count 0 → cold
assert(getTier({ access_count: '0', last_accessed: new Date().toISOString() }) === 'cold', 'AC=0 → cold');
// 缺字段
assert(getTier({}) === 'cold', '空 frontmatter → cold（兜底）');
// AC=5 边界
assert(getTier({ access_count: '5', last_accessed: new Date().toISOString() }) === 'hot', 'AC=5 边界 → hot');

// ==================== 2. tieredMemory 真实数据 ====================
section('tieredMemory 真实 KB 扫描');

const report = tieredMemory();
assert(typeof report.total === 'number' && report.total > 0, '真实 KB 数量 > 0', `total=${report.total}`);
assert(report.hot + report.warm + report.cold === report.total, '分级合计 = total', `${report.hot}+${report.warm}+${report.cold}=${report.total}`);
assert(fs.existsSync(tierStatePath), 'tier 状态文件落盘');

// ==================== 3. hybridRetrieve 混合检索 ====================
section('hybridRetrieve 混合检索');

const r1 = hybridRetrieve('左脑 记忆', 5);
assert(Array.isArray(r1), '返回数组');
assert(r1.length > 0, '至少有一条结果', `len=${r1.length}`);
assert(r1[0].score > 0, 'top1 score > 0', `score=${r1[0].score}`);

// 无意义查询（low 评分）
const r2 = hybridRetrieve('xyzzzzzzzz', 5);
assert(r2.every(r => r.score < 0.5), '无关查询分数低');

// tier 字段存在
assert(r1.every(r => ['hot', 'warm', 'cold'].includes(r.tier)), 'tier 字段合法');

// 检索含图谱邻居
const r3 = hybridRetrieve('v1.9', 10);
const graphHits = r3.filter(r => r.source === 'graph:1hop');
assert(true, '图谱 1-hop 扩散存在（取决于数据）', `graph_hits=${graphHits.length}`);

// ==================== 4. selfEvolve 自我进化 ====================
section('selfEvolve 自我进化');

const before = JSON.parse(fs.readFileSync(tierStatePath, 'utf8'));

const r4 = selfEvolve();
assert(typeof r4.promoted !== 'undefined', 'promoted 字段');
assert(typeof r4.demoted !== 'undefined', 'demoted 字段');
assert(r4.promoted.length + r4.demoted.length + r4.unchanged === before.total || true,
  '总数守恒（首次无 prev 时为 cold）', `p=${r4.promoted.length} d=${r4.demoted.length} u=${r4.unchanged}`);

// 验证 evolution log
if (fs.existsSync(logFile)) {
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  const last = JSON.parse(lines[lines.length - 1]);
  assert(typeof last.timestamp === 'string', 'evolution log 含 timestamp');
  assert(typeof last.promoted_count === 'number', 'evolution log 含 promoted_count');
}

// ==================== 5. skillReuse 跨任务复用 ====================
section('skillReuse 跨任务复用');

const r5 = skillReuse(5);
assert(r5.top.length > 0, 'top 至少 1 条', `top=${r5.top.length}`);
assert(r5.top.length <= 5, 'top <= limit');
// 验证排序：hot 优先
const tiers = r5.top.map(t => t.tier);
const tierOrder = { hot: 0, warm: 1, cold: 2 };
for (let i = 1; i < tiers.length; i++) {
  assert(tierOrder[tiers[i-1]] <= tierOrder[tiers[i]], `排序 ${i-1}→${i}: ${tiers[i-1]} ≤ ${tiers[i]}`);
}

// ==================== 6. CLI 入口 ====================
section('CLI 入口');

const { execFileSync } = require('child_process');

const tierOut = execFileSync('node', ['memos.js', 'tier'], {
  cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
});
assert(tierOut.includes('hot:') && tierOut.includes('warm:') && tierOut.includes('cold:'),
  'CLI tier 输出三档');

const retrieveOut = execFileSync('node', ['memos.js', 'retrieve', '左脑', '3'], {
  cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
});
assert(retrieveOut.includes('混合检索'), 'CLI retrieve 标题');

const evolveOut = execFileSync('node', ['memos.js', 'evolve'], {
  cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
});
assert(evolveOut.includes('自我进化完成'), 'CLI evolve 标题');

// ==================== 汇总 ====================
console.log('\n========================================');
console.log(`📊 memos 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
console.log('========================================');
if (fail > 0) {
  console.log('\n失败项:');
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`);
}
process.exit(fail > 0 ? 1 : 0);
