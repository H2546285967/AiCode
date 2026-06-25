#!/usr/bin/env node
/**
 * test-workflow-observer.js — workflow-observer 单元测试
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 测试目录
const TEST_DIR = path.join(__dirname, '.test-workflow-observer');
const TEST_EVENTS_FILE = path.join(TEST_DIR, 'workflow-events.jsonl');

process.env.WORKFLOW_EVENTS_FILE = TEST_EVENTS_FILE;
const Observer = require('./workflow-observer');

// 清空调试目录
function reset() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function testRecordAndRead() {
  reset();

  const ev1 = Observer.record('command_run', { command: 'npm test' });
  assert(ev1, 'record 应返回事件对象');
  assert.strictEqual(ev1.type, 'command_run');
  assert.strictEqual(ev1.payload.command, 'npm test');
  assert(ev1.session, '事件应带 session');

  const ev2 = Observer.record('file_modified', {
    files: ['scripts/orchestrator/dispatcher.js', 'scripts/mcp/fetch-server.js'],
  });
  assert.deepStrictEqual(ev2.payload.exts.sort(), ['js'], '应识别扩展名并去重');
  assert(ev2.payload.modules.includes('orchestrator'), '应识别 orchestrator 模块');
  assert(ev2.payload.modules.includes('mcp'), '应识别 mcp 模块');

  const recent = Observer.getRecentEvents(1);
  assert.strictEqual(recent.length, 2, '应读到 2 条事件');

  console.log('✅ testRecordAndRead passed');
}

function testStats() {
  reset();

  Observer.record('command_run', { command: 'npm test' });
  Observer.record('command_run', { command: 'npm test' });
  Observer.record('file_modified', { files: ['README.md'] });

  const stats = Observer.stats(1);
  assert.strictEqual(stats.total, 3, '总数应为 3');
  assert.strictEqual(stats.byType['command_run'], 2, 'command_run 应为 2');
  assert.strictEqual(stats.byType['file_modified'], 1, 'file_modified 应为 1');

  console.log('✅ testStats passed');
}

function testCleanup() {
  reset();

  // 写一条旧事件（31 天前）
  const oldEvent = {
    ts: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'command_run',
    session: 'test',
    payload: { command: 'old' },
  };
  fs.appendFileSync(TEST_EVENTS_FILE, JSON.stringify(oldEvent) + '\n');

  Observer.record('command_run', { command: 'new' });

  const removed = Observer.cleanup(30);
  assert.strictEqual(removed, 1, '应删除 1 条过期事件');

  const remaining = Observer.getAllEvents();
  assert.strictEqual(remaining.length, 1, '应保留 1 条新事件');

  console.log('✅ testCleanup passed');
}

function testInvalidType() {
  reset();

  const ev = Observer.record('unknown_type', { foo: 1 });
  assert.strictEqual(ev, null, '未知类型应返回 null');

  console.log('✅ testInvalidType passed');
}

function testRecordFromGitStatus() {
  reset();

  // 只要当前仓库有改动就记录；没有改动则返回 null
  const ev = Observer.recordFromGitStatus();
  if (ev) {
    assert.strictEqual(ev.type, 'file_modified');
    assert(Array.isArray(ev.payload.files));
  }

  console.log('✅ testRecordFromGitStatus passed');
}

function testEventFilePath() {
  assert.strictEqual(Observer.EVENTS_FILE, TEST_EVENTS_FILE, '事件文件路径应为测试路径');
  console.log('✅ testEventFilePath passed');
}

// ── 运行 ─────────────────────────────────────────────

function run() {
  testEventFilePath();
  testRecordAndRead();
  testStats();
  testCleanup();
  testInvalidType();
  testRecordFromGitStatus();
  console.log('\n🎉 workflow-observer 测试全部通过');
}

if (require.main === module) {
  run();
}

module.exports = { run };
