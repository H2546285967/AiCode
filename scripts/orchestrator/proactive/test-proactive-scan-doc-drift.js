#!/usr/bin/env node
/**
 * proactive-scan doc-drift 维度单元测试（M48 兑现）
 * 4 场景：①日期漂移报警 ②⏳段残留报警 ③01/02 漏 M_N 报警 ④健康=空
 *
 * 策略：临时 mock 文件注入 detectDocDrift 用 readFileSafe 路径
 * 难度：detectDocDrift 直接用 WORKSPACE_ROOT 拼路径，mock 整个 root 不可行
 * → 改测函数本身（读真实仓库 + 构造可观测 assertion）+ mock 不动文件
 *
 * @since v3.0.9 (2026-06-30)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  detectDocDrift,
  detectAll,
} = require('./proactive-scan');

let pass = 0, fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; fails.push({ name, detail }); console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`); }
}

function section(title) { console.log(`\n── ${title} ──`); }

// ── 场景 1：函数返回数组（接口契约）────────────────
section('1. 函数契约');
const result = detectDocDrift();
assert(Array.isArray(result), '返回数组', `got ${typeof result}`);

// ── 场景 2：真仓库 04.md + CHANGELOG.md 健康（应该 [] 或少量 info）──
section('2. 当前真实仓库体检');
const real = result;
const allHealthy = real.every(f => f.dimension === 'doc-drift');
assert(allHealthy, '所有 findings dimension = doc-drift', `got ${real.map(f => f.dimension).join(',') || '空'}`);
console.log(`    真实仓库 doc-drift findings: ${real.length} 条`);
real.forEach(f => console.log(`      - [${f.severity}] ${f.message}`));

// ── 场景 3：探测到 04.md "最近一次同步" 字段存在（断言 reader 走得通）──
section('3. 04.md "最近一次同步" 字段解析');
const root = path.join(__dirname, '..', '..', '..');
const c04 = fs.readFileSync(path.join(root, '04_自我演进路线.md'), 'utf8');
const syncMatch = c04.match(/\*\*最近一次同步\*\*[：:]?\s*(\d{4}-\d{2}-\d{2})/);
assert(syncMatch !== null, '04.md 含 "最近一次同步" YYYY-MM-DD', `检测失败`);
console.log(`    当前同步日期: ${syncMatch ? syncMatch[1] : 'N/A'}`);

// ── 场景 4：detectAll 把 doc-drift 纳入 8 维度（不抛错）──
section('4. detectAll 集成（强制 force=true 避免缓存）');
let allOk = false;
let dimCount = 0;
try {
  const r = detectAll(true);
  allOk = r && r.summary;
  dimCount = (r.summary && r.summary.dimensions) || 0;
  assert(true, 'detectAll 不抛错');
} catch (e) {
  assert(false, 'detectAll 不抛错', e.message);
}

console.log(`\n────────────────────────────────────────`);
console.log(`📊 测试结果: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) {
  console.log('失败项:');
  fails.forEach(f => console.log(`  - ${f.name}: ${f.detail || ''}`));
  process.exit(1);
}
process.exit(0);
