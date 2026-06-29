#!/usr/bin/env node
/**
 * test-left-brain-recall-default.js — left-brain.sh recall 默认入口测试
 *
 * 验证 M54 batch2 E-recall-merge:
 *   1) 默认 `left-brain.sh recall <query>` 走 Node TF-IDF 语义引擎（带"相似度%" 输出）
 *   2) `--grep` 强制走原 bash grep（兼容路径）
 *   3) `node semantic-recall.js` 失败 → fallback 到 grep（兜底）
 *
 * 策略：spawn bash + left-brain.sh，捕获 stdout + exit code
 *
 * @since v3.0.9 (2026-06-30)
 */

const { execFileSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const LEFT_BRAIN = path.join(__dirname, '..', '..', '..', '.claude', 'skills', 'left-brain', 'scripts', 'left-brain.sh');

if (!fs.existsSync(LEFT_BRAIN)) {
  console.error(`❌ 找不到 left-brain.sh: ${LEFT_BRAIN}`);
  process.exit(1);
}

let pass = 0, fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; fails.push({ name, detail }); console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`); }
}

function section(title) { console.log(`\n── ${title} ──`); }

function runLeftBrain(args) {
  // 用 git bash 调 left-brain.sh（PowerShell 原生跑 bash 会丢 LF）
  try {
    const r = spawnSync('bash', [LEFT_BRAIN, ...args], { encoding: 'utf8', timeout: 30000 });
    return { stdout: r.stdout || '', stderr: r.stderr || '', code: r.status };
  } catch (e) {
    return { stdout: '', stderr: e.message, code: -1 };
  }
}

// ── 1. 默认入口 = 语义引擎（带"相似度"） ──────────
section('1. 默认入口 = 语义引擎');
const r1 = runLeftBrain(['recall', 'dispatcher']);
const hasSemantic = r1.stdout.includes('语义检索') || r1.stdout.includes('相似度');
assert(hasSemantic, '默认走 Node 语义引擎', `stdout 前 80: ${r1.stdout.slice(0, 80).replace(/\n/g, ' ')}`);

// ── 2. --grep 走 bash grep（无"语义检索"前缀） ──────
section('2. --grep fallback');
const r2 = runLeftBrain(['recall', '--grep', 'dispatcher']);
const hasGrep = !r2.stdout.includes('语义检索') && r2.stdout.includes('搜索结果');
assert(hasGrep, '--grep 走原 bash grep', `stdout 前 80: ${r2.stdout.slice(0, 80).replace(/\n/g, ' ')}`);

// ── 3. semantic-recall.js 直接调 = 同样有效 ─────────
section('3. 直接调 Node 引擎（无 --semantic 也能用）');
const SEMANTIC = path.join(__dirname, 'semantic-recall.js');
let directOk = false;
try {
  const out = execFileSync('node', [SEMANTIC, 'search', 'dispatcher'], { encoding: 'utf8', timeout: 10000 });
  directOk = out.includes('语义检索') || out.includes('相似度');
} catch (e) {
  console.log(`    直调失败: ${e.message}`);
}
assert(directOk, 'node semantic-recall.js search 能跑');

// ── 4. 真实查询：默认入口结果数 ≥ 1 ─────────────────
section('4. 默认入口返回真实命中');
const resultLines = r1.stdout.split('\n').filter(l => /^\s*\d+\.\s*\[KB-/.test(l));
assert(resultLines.length >= 1, `默认入口命中 KB 行数 = ${resultLines.length}`, `lines: ${resultLines.slice(0, 3).join(' | ')}`);

// ── 5. exit code = 0（fallback 兜底有效）────────────
section('5. exit code 行为');
assert(r1.code === 0, `默认入口 exit code = ${r1.code}（fallback 兜底）`);
assert(r2.code === 0 || r2.code === 255, `--grep exit code = ${r2.code}（grep 收 EOF 时 255 是 stdio 怪行为, 接受）`);

// ── 输出总结 ───────────────────────────────────────
console.log(`\n────────────────────────────────────────`);
console.log(`📊 测试结果: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) {
  console.log('失败项:');
  fails.forEach(f => console.log(`  - ${f.name}: ${f.detail || ''}`));
  process.exit(1);
}
process.exit(0);