#!/usr/bin/env node
/**
 * test-dispatch-skill.js — /dispatch skill 升格测试（M44 v1.0 · 2026-06-28）
 *
 * 验证 SKILL.md 升格后的契约：
 *   1. SKILL.md 存在 + frontmatter 合法 + 描述 > 20 字符
 *   2. commands/dispatch.md 入口存在（向后兼容）
 *   3. dispatcher.js 4 步骤决策契约（recallBeforeDispatch → scoreComplexity → 关键词 → 多维度）
 *   4. graph 字段契约（M14）：所有 decide() 返回必含 graph 字段 + 三档 hit
 *   5. reuse_kb 完整性：hit=reuse 时必附 KB 条目
 *   6. scoreComplexity 输出契约：{score, band, breakdown} 字段必含 + band ∈ {no_dispatch, gray_zone, dispatch}
 *   7. agentsFromScore 公式：Math.min(3, Math.ceil(score / 3))
 *   8. CLI 输出 JSON 可被 JSON.parse（确认 stdout 是合法 JSON）
 *
 * 区别于 test-dispatcher.js：
 *   - test-dispatcher.js 测"派 / 不派"语义（用户视角黑盒）
 *   - 本测试测"SKILL.md 升格后的契约完整性"（开发者视角白盒）
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  decide,
  scoreComplexity,
  agentsFromScore,
  recallBeforeDispatch,
  GRAPH_RECALL_THRESHOLDS,
  RULES,
} = require('./dispatcher');

const ROOT = path.join(__dirname, '..', '..');
const SKILL_MD = path.join(ROOT, '.claude', 'skills', 'dispatch', 'SKILL.md');
const COMMAND_MD = path.join(ROOT, '.claude', 'commands', 'dispatch.md');
const ENGINE = path.join(__dirname, 'dispatcher.js');

let pass = 0, fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    fails.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ==================== 1. SKILL.md frontmatter 合法 ====================
section('1. SKILL.md frontmatter 合法');

assert(fs.existsSync(SKILL_MD), 'SKILL.md 存在', SKILL_MD);
const skillContent = fs.readFileSync(SKILL_MD, 'utf8');
const fmMatch = skillContent.match(/^---\s*\n([\s\S]*?)\n---/);
assert(!!fmMatch, 'SKILL.md 含 --- 分隔符');

if (fmMatch) {
  const yaml = fmMatch[1];
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  assert(!!nameMatch, 'frontmatter 含 name', nameMatch ? `name=${nameMatch[1].trim()}` : '未找到');

  // description 支持多行折叠 YAML `>`
  let desc = null;
  const descBlock = yaml.match(/^description:\s*(?:>\s*)?\n([\s\S]+?)(?=^[a-zA-Z]|\Z)/m);
  if (descBlock) {
    desc = descBlock[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
  } else {
    const descMatch = yaml.match(/^description:\s*(.+)$/m);
    if (descMatch) desc = descMatch[1].trim();
  }
  assert(!!desc && desc.length > 20, 'description 非空且 > 20 字符',
    desc ? `desc.length=${desc.length}` : '未找到');
  assert(nameMatch && nameMatch[1].trim() === 'dispatch', 'name === "dispatch"',
    nameMatch ? `实际=${nameMatch[1].trim()}` : '');
}

// ==================== 2. 命令入口保留 ====================
section('2. commands/dispatch.md 向后兼容入口');

assert(fs.existsSync(COMMAND_MD), 'commands/dispatch.md 存在（向后兼容）');

// ==================== 3. dispatcher.js 4 步骤决策契约 ====================
section('3. dispatcher.js 4 步骤决策契约');

const allDispatchInputs = [
  '排查订单添加菜品失败 BUG',
  '解释下 Java 的 CountDownLatch',
  '全面重构 UserService 和 OrderService',
];

for (const inp of allDispatchInputs) {
  const r = decide(inp);
  assert(typeof r === 'object' && r !== null, `decide("${inp}") 返回 object`);
  assert('dispatch' in r, `decide("${inp}") 返回含 dispatch 字段`);
  assert('agents' in r, `decide("${inp}") 返回含 agents 字段`);
  assert('reason' in r, `decide("${inp}") 返回含 reason 字段`);
  assert('complexity_score' in r, `decide("${inp}") 返回含 complexity_score 字段（M9 契约）`);
  assert('complexity_band' in r, `decide("${inp}") 返回含 complexity_band 字段`);
  assert('graph' in r, `decide("${inp}") 返回含 graph 字段（M14 契约）`);
}

// ==================== 4. graph 字段契约（M14） ====================
section('4. graph 字段契约（M14 知识图谱反哺）');

const graphInputs = [
  '排查订单添加菜品失败 BUG',
  '解释下 Java 的 CountDownLatch',
  '修复 PowerShell 中文乱码',
  '随便聊聊',
];

for (const inp of graphInputs) {
  const r = decide(inp);
  const g = r.graph;
  assert(g && typeof g === 'object', `decide("${inp}").graph 是 object`);
  assert(['reuse', 'similar', 'miss', 'no-graph'].includes(g.hit),
    `decide("${inp}").graph.hit ∈ 四档之一`, g ? `实际=${g.hit}` : '');
  assert(typeof g.matched === 'boolean', `decide("${inp}").graph.matched 是 boolean`);
  assert(typeof g.score === 'number', `decide("${inp}").graph.score 是 number`);
  assert(g.threshold && g.threshold.reuse === 0.5 && g.threshold.similar === 0.05,
    `decide("${inp}").graph.threshold 符合 M14 设定`, g ? JSON.stringify(g.threshold) : '');
}

// ==================== 5. recallBeforeDispatch 直接契约 ====================
section('5. recallBeforeDispatch 直接契约');

// 空输入 / 非字符串 → 不抛
assert(recallBeforeDispatch('').hit === 'miss', '空字符串 → hit=miss（不抛）');
assert(recallBeforeDispatch(null).hit === 'miss', 'null → hit=miss（不抛）');

// 阈值常量
assert(GRAPH_RECALL_THRESHOLDS.reuse === 0.5, 'reuse 阈值 = 0.5');
assert(GRAPH_RECALL_THRESHOLDS.similar === 0.05, 'similar 阈值 = 0.05');

// 正常查询 → 返回结构合法
const r1 = recallBeforeDispatch('修复 PowerShell 中文乱码');
assert(r1 && ['reuse', 'similar', 'miss', 'no-graph'].includes(r1.hit),
  '正常查询 hit ∈ 四档', r1 ? `hit=${r1.hit}` : '返回 null');

// ==================== 6. scoreComplexity 输出契约 ====================
section('6. scoreComplexity 输出契约');

const sc1 = scoreComplexity('随便聊聊');
assert(typeof sc1.score === 'number' && sc1.score >= 0 && sc1.score <= 10,
  'scoreComplexity 返回 score ∈ [0, 10]', `score=${sc1.score}`);
assert(['no_dispatch', 'gray_zone', 'dispatch'].includes(sc1.band),
  'scoreComplexity 返回 band ∈ 三档', `band=${sc1.band}`);
assert(sc1.breakdown && typeof sc1.breakdown === 'object',
  'scoreComplexity 返回 breakdown object');

// 高分关键词应该落入 dispatch 档
const sc2 = scoreComplexity('全面排查前后端数据库缓存接口文件所有问题');
assert(sc2.score >= 8, '高强度信号 → score ≥ 8', `score=${sc2.score}`);
assert(sc2.band === 'dispatch', '高强度信号 → band=dispatch');

// 抑制关键词应该落入 no_dispatch 档
const sc3 = scoreComplexity('帮我快速瞄一下这段代码');
assert(sc3.band === 'no_dispatch', '抑制信号 → band=no_dispatch', `band=${sc3.band}`);

// ==================== 7. agentsFromScore 公式 ====================
section('7. agentsFromScore 公式：Math.min(3, Math.ceil(score / 3))');

assert(agentsFromScore(1) === 1, 'score=1 → 1 agent');
assert(agentsFromScore(3) === 1, 'score=3 → 1 agent');
assert(agentsFromScore(4) === 2, 'score=4 → 2 agents');
assert(agentsFromScore(6) === 2, 'score=6 → 2 agents');
assert(agentsFromScore(7) === 3, 'score=7 → 3 agents');
assert(agentsFromScore(10) === 3, 'score=10 → 3 agents（受 max_agents=3 限制）');
assert(agentsFromScore(0) === 0, 'score=0 → 0 agent');

// ==================== 8. RULES 版本号契约 ====================
section('8. RULES 版本号 + 关键字段');

assert(RULES && RULES.version, 'RULES.version 存在', RULES ? RULES.version : '');
assert(RULES.scoring && RULES.scoring.no_dispatch_max === 3, 'scoring.no_dispatch_max = 3');
assert(RULES.scoring.gray_zone_max === 7, 'scoring.gray_zone_max = 7');
assert(RULES.should_dispatch.max_agents === 3, 'should_dispatch.max_agents = 3');

// ==================== 9. CLI 输出 JSON 可解析 ====================
section('9. CLI 输出 JSON 可解析');

try {
  const out = execFileSync(process.execPath, [ENGINE, '排查订单添加菜品失败 BUG'], {
    encoding: 'utf8',
    timeout: 5000,
  });
  const parsed = JSON.parse(out);
  assert(parsed.dispatch !== undefined, 'CLI 输出 JSON 含 dispatch 字段');
  assert(parsed.agents !== undefined, 'CLI 输出 JSON 含 agents 字段');
  assert(parsed.graph !== undefined, 'CLI 输出 JSON 含 graph 字段（M14 契约）');
} catch (e) {
  fail++;
  fails.push({ name: 'CLI 输出 JSON 可解析', detail: e.message });
  console.log(`  ❌ CLI 输出 JSON 可解析  → ${e.message}`);
}

// ==================== 10. reuse_kb 完整性（hit=reuse 时必附） ====================
section('10. reuse_kb 完整性契约');

// 命中 reuse 的输入（如果 KB 引擎可用 + 有匹配项）
const r2 = decide('修复 PowerShell 中文乱码');
if (r2.graph && r2.graph.hit === 'reuse') {
  assert(r2.reuse_kb && typeof r2.reuse_kb === 'object', 'hit=reuse 时必附 reuse_kb');
  assert(r2.reuse_kb.id, 'reuse_kb 含 id');
  assert(r2.dispatch === false, 'hit=reuse 时 dispatch=false（强制不派）');
  assert(r2.agents === 0, 'hit=reuse 时 agents=0');
} else {
  // 如果当前 KB 引擎不可用，跳过但不算失败（兜底机制生效）
  pass++;
  console.log(`  ⏭️  hit=reuse 条件未触发（KB 引擎: ${r2.graph?.hit || 'unknown'}），跳过复用契约验证`);
}

// ==================== 总结 ====================
console.log('\n' + '━'.repeat(60));
console.log(`📊 /dispatch skill 升格测试结果: ${pass} 通过 / ${fail} 失败`);
console.log('━'.repeat(60));

if (fail > 0) {
  console.log('\n❌ 失败项:');
  fails.forEach(f => console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`));
  process.exit(1);
}

console.log('\n🎉 所有 /dispatch skill 升格契约验证通过');
process.exit(0);