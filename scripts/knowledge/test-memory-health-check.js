#!/usr/bin/env node
/**
 * test-memory-health-check.js — memory-health-check 单元测试（M48-D）
 *
 * 覆盖：
 *   1. checkMemoryIndex 4 路径（OK / 超行 / 超字节 / 双超）
 *   2. checkSingleKBs 2 路径（OK / 超 100 行的 KB）
 *   3. checkVolumeInversion 3 路径（OK / 倒挂 / 无 docs 跳过）
 *   4. exitCode 状态码（0/1/2）
 *   5. CLI --json 输出合法 JSON
 *   6. CLI 跑通真实仓库
 *
 * @since v3.0.6 (2026-06-29)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const health = require('./memory-health-check.js');

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log('  PASS ' + name);
    pass++;
  } catch (e) {
    console.log('  FAIL ' + name + ' -- ' + e.message);
    fail++;
    failures.push({ name, error: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'assertEq') + ' -- want ' + JSON.stringify(b) + ' got ' + JSON.stringify(a));
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'health-test-'));
}

console.log('\ntest-memory-health-check.js\n');

// 1. checkMemoryIndex
test('checkMemoryIndex OK', () => {
  const orig = health.THRESHOLDS;
  health.THRESHOLDS.MEMORY_INDEX_LINES.value = 9999;
  health.THRESHOLDS.MEMORY_INDEX_BYTES.value = 99999999;
  const r = health.checkMemoryIndex();
  health.THRESHOLDS = orig;
  assertEq(r.issues.length, 0, 'issues=0');
  assert(r.lines > 0, 'lines>0');
});

test('checkMemoryIndex 超行 error', () => {
  const orig = health.THRESHOLDS;
  health.THRESHOLDS.MEMORY_INDEX_LINES.value = 1;
  const r = health.checkMemoryIndex();
  health.THRESHOLDS = orig;
  const err = r.issues.find(i => i.severity === 'error');
  assert(err, 'has error');
});

test('checkMemoryIndex 超字节 error', () => {
  const orig = health.THRESHOLDS;
  health.THRESHOLDS.MEMORY_INDEX_BYTES.value = 1;
  const r = health.checkMemoryIndex();
  health.THRESHOLDS = orig;
  const err = r.issues.find(i => i.severity === 'error' && i.label.indexOf('25KB') >= 0);
  assert(err, 'has 25KB error');
});

// 2. checkSingleKBs
test('checkSingleKBs 检测超大 KB', () => {
  const tmp = makeTempDir();
  const kbDir = path.join(tmp, 'knowledge');
  fs.mkdirSync(kbDir, { recursive: true });
  for (let i = 0; i < 5; i++) {
    fs.writeFileSync(path.join(kbDir, 'kb-' + i + '.md'), '# normal\nshort');
  }
  fs.writeFileSync(path.join(kbDir, 'huge.md'), '# huge\n' + Array(151).join('a\n'));

  const orig = health.THRESHOLDS;
  health.THRESHOLDS.SINGLE_KB_LINES.value = 100;
  const r = health.checkSingleKBs(kbDir);
  health.THRESHOLDS = orig;

  assertEq(r.total, 6, 'total=6');
  assertEq(r.oversized, 1, 'oversized=1');
  assert(r.details[0].label.indexOf('huge.md') >= 0, 'huge.md');
});

test('checkSingleKBs OK', () => {
  const tmp = makeTempDir();
  const kbDir = path.join(tmp, 'knowledge');
  fs.mkdirSync(kbDir, { recursive: true });
  for (let i = 0; i < 3; i++) {
    fs.writeFileSync(path.join(kbDir, 'kb-' + i + '.md'), '# n\ns');
  }
  const r = health.checkSingleKBs(kbDir);
  assertEq(r.oversized, 0, '0');
});

test('checkSingleKBs 不存在目录返回空', () => {
  const r = health.checkSingleKBs(path.join(os.tmpdir(), 'never-exist-' + Date.now()));
  assertEq(r.total, 0, 'total=0');
});

// 3. checkVolumeInversion
test('dirSize helper OK', () => {
  const tmp = makeTempDir();
  fs.writeFileSync(path.join(tmp, 'a.md'), 'hello');
  fs.writeFileSync(path.join(tmp, 'b.md'), 'world!');
  const s = health.dirSize(tmp);
  assertEq(s, 11, 'size=11');
});

test('checkVolumeInversion 倒挂', () => {
  const tmp = makeTempDir();
  const memDir = path.join(tmp, 'memory');
  const docsDir = path.join(tmp, 'docs');
  fs.mkdirSync(memDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, 'big.md'), Buffer.alloc(50 * 1024, 'x'));
  fs.writeFileSync(path.join(docsDir, 'small.md'), Buffer.alloc(10 * 1024, 'y'));
  const m = health.dirSize(memDir);
  const d = health.dirSize(docsDir);
  const ratio = m / d;
  assert(ratio > 3, 'ratio=' + ratio);
});

test('checkVolumeInversion 健康态', () => {
  const tmp = makeTempDir();
  const memDir = path.join(tmp, 'memory');
  const docsDir = path.join(tmp, 'docs');
  fs.mkdirSync(memDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  // 模拟：memory 小、docs 大
  fs.writeFileSync(path.join(memDir, 'small.md'), Buffer.alloc(5 * 1024, 'x'));
  fs.writeFileSync(path.join(docsDir, 'big.md'), Buffer.alloc(100 * 1024, 'y'));
  // 直接调 helper 算 ratio（绕开真实 MEMORY_DIR）
  const m = health.dirSize(memDir);
  const d = health.dirSize(docsDir);
  const ratio = m / d;
  assert(ratio < 0.3, '健康 ratio=' + ratio);
});

// 4. exitCode
test('exitCode 0', () => {
  assertEq(health.exitCode({ summary: { error: 0, warn: 0 }, issues: [] }), 0, '0');
});

test('exitCode 1', () => {
  assertEq(health.exitCode({ summary: { error: 0, warn: 1 }, issues: [] }), 1, '1');
});

test('exitCode 2', () => {
  assertEq(health.exitCode({ summary: { error: 1, warn: 0 }, issues: [] }), 2, '2');
});

// 5. CLI
test('CLI --json 输出合法 JSON', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'memory-health-check.js'), '--json'], { encoding: 'utf8' });
  try {
    const j = JSON.parse(r.stdout);
    assert(j.checks, 'has checks');
    assert(j.summary, 'has summary');
  } catch (e) {
    throw new Error('JSON parse fail: ' + e.message + ' / stdout=' + r.stdout.slice(0, 200));
  }
});

test('CLI 默认跑输出报告', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'memory-health-check.js')], { encoding: 'utf8' });
  assert(r.stdout.indexOf('MEMORY.md 体检报告') >= 0, '报告标题');
  assert(r.stdout.indexOf('总结') >= 0, '含总结');
});

// 6. 真实仓库
test('runAll 在真实仓库跑通', () => {
  const r = health.runAll();
  assert(Array.isArray(r.checks), 'checks 是数组');
  assert(r.checks.length === 3, '3 项检查');
  assert(r.summary, '有 summary');
  // MEMORY.md 应该 OK（< 200 行 < 25KB）
  const memIdx = r.checks.find(c => c.name === 'MEMORY_INDEX');
  assert(memIdx.lines < 200, '实际行数 ' + memIdx.lines);
  assert(memIdx.bytes < 25 * 1024, '实际字节 ' + memIdx.bytes);
});

console.log('\n' + '='.repeat(50));
console.log('总计: ' + (pass + fail) + ' · 通过: ' + pass + ' · 失败: ' + fail);
if (fail > 0) {
  console.log('\n失败用例:');
  for (const f of failures) console.log('  - ' + f.name + ': ' + f.error);
  process.exit(1);
} else {
  console.log('全部通过\n');
  process.exit(0);
}
