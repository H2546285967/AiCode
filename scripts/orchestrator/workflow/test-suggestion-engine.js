#!/usr/bin/env node
/**
 * test-suggestion-engine.js — suggestion-engine 单元测试
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const TEST_DIR = path.join(__dirname, '.test-suggestion-engine');
const TEST_EVENTS_FILE = path.join(TEST_DIR, 'workflow-events.jsonl');
const TEST_PATTERNS_FILE = path.join(TEST_DIR, 'workflow-patterns.json');

process.env.WORKFLOW_EVENTS_FILE = TEST_EVENTS_FILE;
process.env.WORKFLOW_PATTERNS_FILE = TEST_PATTERNS_FILE;

const Observer = require('./workflow-observer');
const Miner = require('./pattern-miner');
const Suggest = require('./suggestion-engine');

function reset() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function testSuggestFromPattern() {
  reset();

  // 学习：改 orchestrator .js → npm test
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });
  Observer.record('command_run', { command: 'npm test' }, { session: 'test' });

  Miner.mineAndSave({ minSupport: 2, minConfidence: 0.5, windowMinutes: 30 });

  // 当前触发事件
  Observer.record('file_modified', { files: ['scripts/orchestrator/dispatcher.js'] }, { session: 'test' });

  const suggestions = Suggest.suggest({ hours: 1, topK: 3 });
  assert(suggestions.length > 0, '应返回建议');
  const cmdSuggestion = suggestions.find(s => s.type === 'run_command' && s.command === 'npm test');
  assert(cmdSuggestion, '应建议 npm test');
  assert(cmdSuggestion.source === 'pattern' || cmdSuggestion.source === 'heuristic', '来源合理');

  console.log('✅ testSuggestFromPattern passed');
}

function testSuggestHeuristicUncommitted() {
  reset();

  // 不记录事件，只依赖 git 状态启发
  const suggestions = Suggest.suggest({ hours: 1, topK: 5 });
  // 当前仓库可能有未提交改动
  const commitSuggestion = suggestions.find(s => s.type === 'commit');
  // 不强求一定有，因为可能没有未提交改动；但格式要合法
  for (const s of suggestions) {
    assert(s.type, '建议应有 type');
    assert(typeof s.confidence === 'number', '建议应有 confidence');
    assert(s.reason, '建议应有 reason');
  }

  console.log('✅ testSuggestHeuristicUncommitted passed');
}

function testFormat() {
  const suggestions = [
    {
      type: 'run_command',
      command: 'npm test',
      reason: '你刚修改了 orchestrator 模块',
      confidence: 0.85,
      icon: '🧪',
      source: 'pattern',
    },
  ];

  const formatted = Suggest.format(suggestions);
  assert(formatted.includes('npm test'), '格式化输出应包含命令');
  assert(formatted.includes('orchestrator'), '格式化输出应包含原因');

  const empty = Suggest.format([]);
  assert(empty.includes('暂无'), '空建议应有提示');

  console.log('✅ testFormat passed');
}

function testContext() {
  reset();
  const ctx = Suggest.context(1);
  assert(typeof ctx.recentEvents === 'number', 'recentEvents 应为数字');
  assert(typeof ctx.patterns === 'number', 'patterns 应为数字');
  assert(typeof ctx.uncommitted === 'number', 'uncommitted 应为数字');
  assert(Array.isArray(ctx.recentFiles), 'recentFiles 应为数组');

  console.log('✅ testContext passed');
}

// ── 运行 ─────────────────────────────────────────────

function run() {
  testSuggestFromPattern();
  testSuggestHeuristicUncommitted();
  testFormat();
  testContext();
  console.log('\n🎉 suggestion-engine 测试全部通过');
}

if (require.main === module) {
  run();
}

module.exports = { run };
