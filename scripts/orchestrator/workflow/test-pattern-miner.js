#!/usr/bin/env node
/**
 * test-pattern-miner.js — pattern-miner 单元测试
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_DIR = path.join(__dirname, '.test-pattern-miner');
const TEST_EVENTS_FILE = path.join(TEST_DIR, 'workflow-events.jsonl');
const TEST_PATTERNS_FILE = path.join(TEST_DIR, 'workflow-patterns.json');

process.env.WORKFLOW_EVENTS_FILE = TEST_EVENTS_FILE;
process.env.WORKFLOW_PATTERNS_FILE = TEST_PATTERNS_FILE;

const Observer = require('./workflow-observer');
const Miner = require('./pattern-miner');

function reset() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function writeEvents(events) {
  for (const ev of events) {
    Observer.record(ev.type, ev.payload, { session: 'test-session' });
  }
}

function testMineFileToCommand() {
  reset();

  // 连续 3 次：改 orchestrator .js → 跑 npm test
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });

  const result = Miner.mine({ minSupport: 2, minConfidence: 0.5, windowMinutes: 30 });
  assert(result.patterns.length > 0, '应挖掘到模式');
  const pattern = result.patterns.find(p =>
    p.trigger.type === 'file_modified' &&
    p.action.type === 'command_run' &&
    p.action.command === 'npm test'
  );
  assert(pattern, '应找到 file_modified → command_run(npm test) 模式');
  assert.strictEqual(pattern.support, 3, '支持度应为 3');
  assert(pattern.confidence >= 0.99, '置信度应接近 1');

  console.log('✅ testMineFileToCommand passed');
}

function testMineAndSave() {
  reset();

  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] });
  Observer.record('command_run', { command: 'npm test' });

  const result = Miner.mineAndSave({ minSupport: 1, minConfidence: 0.1, windowMinutes: 30 });
  assert(fs.existsSync(TEST_PATTERNS_FILE), '应保存模式文件');

  const loaded = Miner.loadPatterns();
  assert(loaded, '应能加载保存的模式');
  assert(loaded.patterns.length > 0, '保存的模式应非空');

  console.log('✅ testMineAndSave passed');
}

function testMatchPatterns() {
  reset();

  // 构造历史
  const base = Date.now();
  const history = [
    { type: 'file_modified', payload: { files: ['scripts/orchestrator/dispatcher.js'] } },
    { type: 'command_run', payload: { command: 'npm test' } },
  ];
  for (let i = 0; i < history.length; i++) {
    const ev = history[i];
    fs.appendFileSync(TEST_EVENTS_FILE, JSON.stringify({
      ts: new Date(base + i * 1000).toISOString(),
      type: ev.type,
      session: 'test',
      payload: ev.payload,
    }) + '\n');
  }

  Miner.mineAndSave({ minSupport: 1, minConfidence: 0.1, windowMinutes: 30 });

  // 模拟当前触发事件
  const recent = [
    { ts: new Date(base + 100000).toISOString(), type: 'file_modified', session: 'test', payload: { modules: ['orchestrator'], exts: ['js'] } },
  ];

  const matches = Miner.matchPatterns(recent, 5);
  assert(matches.length > 0, '应匹配到模式');
  assert.strictEqual(matches[0].action.command, 'npm test', '建议命令应为 npm test');

  console.log('✅ testMatchPatterns passed');
}

function testThresholdFiltering() {
  reset();

  // 3 次 file_modified，但只有最后 1 次在 30 分钟窗口内跟了 command_run
  const base = Date.now();
  const history = [
    { type: 'file_modified', payload: { files: ['a.js'] }, offsetMinutes: 0 },
    { type: 'file_modified', payload: { files: ['b.js'] }, offsetMinutes: 60 },
    { type: 'file_modified', payload: { files: ['c.js'] }, offsetMinutes: 120 },
    { type: 'command_run', payload: { command: 'npm test' }, offsetMinutes: 121 },
  ];
  for (const ev of history) {
    fs.appendFileSync(TEST_EVENTS_FILE, JSON.stringify({
      ts: new Date(base + ev.offsetMinutes * 60 * 1000).toISOString(),
      type: ev.type,
      session: 'test',
      payload: ev.payload,
    }) + '\n');
  }

  const result = Miner.mine({ minSupport: 1, minConfidence: 0.6, windowMinutes: 30 });
  const pattern = result.patterns.find(p => p.trigger.type === 'file_modified' && p.action.type === 'command_run');
  assert.strictEqual(pattern, undefined, '置信度不足应被过滤');

  console.log('✅ testThresholdFiltering passed');
}

// ── 运行 ─────────────────────────────────────────────

function run() {
  testMineFileToCommand();
  testMineAndSave();
  testMatchPatterns();
  testThresholdFiltering();
  console.log('\n🎉 pattern-miner 测试全部通过');
}

if (require.main === module) {
  run();
}

module.exports = { run };
