#!/usr/bin/env node
/**
 * test-autonomous-menu.js — 验证 autonomous-menu 交互菜单
 *
 * 覆盖：
 *   - choices 定义
 *   - render 输出包含菜单项
 *   - executeChoice 对 off/on/single/always 的行为
 *
 * 运行：node scripts/orchestrator/test-autonomous-menu.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// 备份全局状态
const originalExit = process.exit;
const originalStdoutWrite = process.stdout.write;
const originalSpawn = require('child_process').spawn;

// 阻止 process.exit 真的退出
let exitCalls = [];
process.exit = (code) => {
  exitCalls.push(code ?? 0);
  throw new Error(`process.exit(${code})`);
};

// 捕获 stdout
let stdoutBuffer = '';
process.stdout.write = (chunk) => {
  stdoutBuffer += chunk.toString();
  return true;
};

// 加载菜单模块（此时 require 不会触发 main，因为不是 require.main）
const menu = require('./autonomous-menu.js');
const autonomous = require('./autonomous.js');

// 恢复 stdout
process.stdout.write = originalStdoutWrite;

function reset() {
  stdoutBuffer = '';
  exitCalls = [];
}

function captureStdout(fn) {
  stdoutBuffer = '';
  process.stdout.write = (chunk) => {
    stdoutBuffer += chunk.toString();
    return true;
  };
  try {
    fn();
  } finally {
    process.stdout.write = originalStdoutWrite;
  }
  return stdoutBuffer;
}

function withMockedSpawn(fn) {
  const childProcess = require('child_process');
  const calls = [];
  childProcess.spawn = (...args) => {
    calls.push(args);
    return { on: (event, cb) => { if (event === 'exit') setTimeout(() => cb(0), 0); } };
  };
  try {
    fn(calls);
  } finally {
    childProcess.spawn = originalSpawn;
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

// 1. choices 定义
test('choices 包含 4 个选项且顺序正确', () => {
  assert.strictEqual(menu.choices.length, 4);
  assert.deepStrictEqual(menu.choices.map(c => c.key), ['single', 'always', 'on', 'off']);
});

// 2. render 输出
test('render 输出包含所有菜单项和提示', () => {
  const out = captureStdout(() => menu.render());
  assert(out.includes('选择自主模式'), '应包含标题');
  assert(out.includes('single'), '应包含 single');
  assert(out.includes('always'), '应包含 always');
  assert(out.includes('on'), '应包含 on');
  assert(out.includes('off'), '应包含 off');
});

// 3. executeChoice off
test('选择 off 会调用 disable 并退出 0', () => {
  reset();
  const offChoice = menu.choices.find(c => c.key === 'off');
  let didDisable = false;
  const originalDisable = autonomous.disable;
  autonomous.disable = () => { didDisable = true; return { enabled: false }; };
  try {
    try { menu.executeChoice(offChoice); } catch (e) { /* process.exit 会 throw */ }
  } finally {
    autonomous.disable = originalDisable;
  }
  assert(didDisable, '应调用 disable');
  assert.deepStrictEqual(exitCalls, [0], '应退出 0');
});

// 4. executeChoice on
test('选择 on 会调用 enable(always) 并退出 0，不启动 runner', () => {
  reset();
  const onChoice = menu.choices.find(c => c.key === 'on');
  let enabledMode = null;
  const originalEnable = autonomous.enable;
  autonomous.enable = (opts) => { enabledMode = opts.mode; return { enabled: true, mode: opts.mode, enabled_at: new Date().toISOString() }; };
  try {
    withMockedSpawn((calls) => {
      try { menu.executeChoice(onChoice); } catch (e) { /* process.exit 会 throw */ }
      assert.strictEqual(enabledMode, 'always', 'on 模式应启用 always');
      assert.strictEqual(calls.length, 0, 'on 不应启动 runner');
    });
  } finally {
    autonomous.enable = originalEnable;
  }
});

// 5. executeChoice single
test('选择 single 会调用 enable(single) 并启动 runner', () => {
  reset();
  const singleChoice = menu.choices.find(c => c.key === 'single');
  let enabledMode = null;
  const originalEnable = autonomous.enable;
  autonomous.enable = (opts) => { enabledMode = opts.mode; return { enabled: true, mode: opts.mode, enabled_at: new Date().toISOString() }; };
  try {
    withMockedSpawn((calls) => {
      menu.executeChoice(singleChoice);
      assert.strictEqual(enabledMode, 'single', 'single 模式应启用 single');
      assert.strictEqual(calls.length, 1, 'single 应启动 runner');
      assert.strictEqual(path.basename(calls[0][0]), 'node');
      assert(calls[0][1][0].includes('autonomous-runner.js'), '应启动 autonomous-runner');
    });
  } finally {
    autonomous.enable = originalEnable;
  }
});

// 6. executeChoice always
test('选择 always 会调用 enable(always) 并启动 runner', () => {
  reset();
  const alwaysChoice = menu.choices.find(c => c.key === 'always');
  let enabledMode = null;
  const originalEnable = autonomous.enable;
  autonomous.enable = (opts) => { enabledMode = opts.mode; return { enabled: true, mode: opts.mode, enabled_at: new Date().toISOString() }; };
  try {
    withMockedSpawn((calls) => {
      menu.executeChoice(alwaysChoice);
      assert.strictEqual(enabledMode, 'always', 'always 模式应启用 always');
      assert.strictEqual(calls.length, 1, 'always 应启动 runner');
    });
  } finally {
    autonomous.enable = originalEnable;
  }
});

// 恢复全局状态
process.exit = originalExit;

console.log(`\n${passed}/${passed + failed} 测试通过`);
if (failed > 0) process.exit(1);
