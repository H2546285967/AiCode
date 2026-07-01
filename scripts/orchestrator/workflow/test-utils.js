#!/usr/bin/env node
/**
 * test-utils.js — utils.js 单元测试
 *
 * v3.0.8 P1-001 抽取验证：
 *   - 路径常量正确性
 *   - env 变量覆盖 EVENTS_FILE / PATTERNS_FILE
 *   - ensureDir / readFileSafe 行为正确
 */

const assert = require('assert');
const path = require('path');

// 重置 env（防止外部设置污染）
const ORIGINAL_EVENTS = process.env.WORKFLOW_EVENTS_FILE;
const ORIGINAL_PATTERNS = process.env.WORKFLOW_PATTERNS_FILE;

function freshRequire() {
  delete require.cache[require.resolve('./utils')];
  return require('./utils');
}

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

// ── 1. 路径常量（默认模式） ──
test('WORKSPACE_ROOT 指向工程根（3 层 __dirname 上溯）', () => {
  const u = freshRequire();
  assert.ok(u.WORKSPACE_ROOT.endsWith('AiCode'), '应指向 AiCode 根');
  assert.ok(u.WORKSPACE_ROOT.includes('H:\\AI-han\\AiCode'), 'Windows 路径');
});

test('SKILL_DIR = WORKSPACE_ROOT/.claude/skills/left-brain', () => {
  const u = freshRequire();
  assert.strictEqual(u.SKILL_DIR, path.join(u.WORKSPACE_ROOT, '.claude', 'skills', 'left-brain'));
});

test('MEMORY_DIR = SKILL_DIR/memory', () => {
  const u = freshRequire();
  assert.strictEqual(u.MEMORY_DIR, path.join(u.SKILL_DIR, 'memory'));
});

test('EVENTS_FILE 默认 = MEMORY_DIR/workflow-events.jsonl', () => {
  delete process.env.WORKFLOW_EVENTS_FILE;
  const u = freshRequire();
  assert.strictEqual(u.EVENTS_FILE, path.join(u.MEMORY_DIR, 'workflow-events.jsonl'));
});

test('PATTERNS_FILE 默认 = MEMORY_DIR/workflow-patterns.json', () => {
  delete process.env.WORKFLOW_PATTERNS_FILE;
  const u = freshRequire();
  assert.strictEqual(u.PATTERNS_FILE, path.join(u.MEMORY_DIR, 'workflow-patterns.json'));
});

// ── 2. env 变量覆盖 ──
test('WORKFLOW_EVENTS_FILE 覆盖 EVENTS_FILE', () => {
  process.env.WORKFLOW_EVENTS_FILE = '/tmp/test-events.jsonl';
  const u = freshRequire();
  assert.strictEqual(u.EVENTS_FILE, path.resolve('/tmp/test-events.jsonl'));
});

test('WORKFLOW_PATTERNS_FILE 覆盖 PATTERNS_FILE', () => {
  process.env.WORKFLOW_PATTERNS_FILE = '/tmp/test-patterns.json';
  const u = freshRequire();
  assert.strictEqual(u.PATTERNS_FILE, path.resolve('/tmp/test-patterns.json'));
});

// ── 3. ensureDir ──
test('ensureDir 创建不存在的目录', () => {
  const fs = require('fs');
  const u = freshRequire();
  const testDir = path.join(u.WORKSPACE_ROOT, '.test-utils-tmp-' + Date.now());
  assert.ok(!fs.existsSync(testDir));
  u.ensureDir(testDir);
  assert.ok(fs.existsSync(testDir), '目录应被创建');
  fs.rmdirSync(testDir);
});

test('ensureDir 对已存在目录不抛', () => {
  const fs = require('fs');
  const u = freshRequire();
  const testDir = path.join(u.WORKSPACE_ROOT, '.test-utils-exists');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  u.ensureDir(testDir);  // 不抛即通过
  assert.ok(fs.existsSync(testDir));
  fs.rmdirSync(testDir);
});

// ── 4. readFileSafe ──
test('readFileSafe 读取存在的文件', () => {
  const u = freshRequire();
  const fp = path.join(u.WORKSPACE_ROOT, 'package.json');
  const content = u.readFileSafe(fp);
  assert.ok(content, '应读到内容');
  assert.ok(content.includes('"name"'), 'package.json 含 name 字段');
});

test('readFileSafe 不存在的文件返回 null', () => {
  const u = freshRequire();
  const fp = path.join(u.WORKSPACE_ROOT, '.test-utils-nonexistent-' + Date.now());
  assert.strictEqual(u.readFileSafe(fp), null);
});

// ── 5. 集成验证：3 个源文件仍能 require utils 不抛 ──
test('pattern-miner.js 可加载（用 utils）', () => {
  delete require.cache[require.resolve('./pattern-miner')];
  const Miner = require('./pattern-miner');
  assert.ok(Miner, 'pattern-miner 应可加载');
});

test('workflow-observer.js 可加载（用 utils）', () => {
  delete require.cache[require.resolve('./workflow-observer')];
  const Observer = require('./workflow-observer');
  assert.ok(Observer, 'workflow-observer 应可加载');
});

test('suggestion-engine.js 可加载（用 utils）', () => {
  delete require.cache[require.resolve('./suggestion-engine')];
  const Suggest = require('./suggestion-engine');
  assert.ok(Suggest, 'suggestion-engine 应可加载');
});

test('workflow-cli.js 可加载（用 utils）', () => {
  delete require.cache[require.resolve('./workflow-cli')];
  const Cli = require('./workflow-cli');
  assert.ok(Cli, 'workflow-cli 应可加载');
});

// ── 清理 ──
process.env.WORKFLOW_EVENTS_FILE = ORIGINAL_EVENTS;
process.env.WORKFLOW_PATTERNS_FILE = ORIGINAL_PATTERNS;

// ── 总结 ──
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 utils 测试: ${passed} 通过 / ${failed} 失败`);
console.log('='.repeat(60));

if (failed > 0) process.exit(1);