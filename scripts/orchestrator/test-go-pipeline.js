#!/usr/bin/env node
/**
 * test-go-pipeline.js — go-pipeline.js 单元测试
 *
 * 测试覆盖：
 *   1. parseArgs 各 flag 解析
 *   2. runStage 5 状态：passed / failed / skipped / dry-run
 *   3. runPipeline 失败立即停止逻辑
 *   4. runPipeline --only 单阶段模式
 *   5. runPipeline --skip 多阶段跳过
 *   6. formatHuman 人类可读输出含关键字段
 *   7. CLI 集成（dry-run + 默认参数）
 *
 * @since v3.0.5 (2026-06-28)
 */

const assert = require('assert');
const pipeline = require('./go-pipeline');
const { parseArgs, runStage, runPipeline, formatHuman, STAGES, STAGE_DEFS } = pipeline;

let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    if (e.stack) console.log(e.stack.split('\n').slice(1, 4).join('\n'));
    fail++;
  }
}

// ── 1. parseArgs ──────────────────────────────────────

test('parseArgs 默认值', () => {
  const opts = parseArgs([]);
  assert(opts.dryRun === false);
  assert(opts.skip.size === 0);
  assert(opts.only === null);
  assert(opts.testCmd === null);
});

test('parseArgs --dry-run', () => {
  const opts = parseArgs(['--dry-run']);
  assert(opts.dryRun === true);
});

test('parseArgs --skip 多阶段', () => {
  const opts = parseArgs(['--skip', 'simplify,review']);
  assert(opts.skip.has('simplify'));
  assert(opts.skip.has('review'));
  assert(!opts.skip.has('test'));
});

test('parseArgs --only', () => {
  const opts = parseArgs(['--only', 'test']);
  assert(opts.only === 'test');
});

test('parseArgs --test-cmd / --commit-msg', () => {
  const opts = parseArgs(['--test-cmd', 'npm run test:dispatcher', '--commit-msg', 'fix: x']);
  assert(opts.testCmd === 'npm run test:dispatcher');
  assert(opts.commitMsg === 'fix: x');
});

// ── 2. runStage 5 状态 ───────────────────────────────

test('runStage test 失败时返回 failed', () => {
  const fakeExec = () => { const e = new Error('test fail'); e.status = 1; e.stderr = 'AssertionError'; throw e; };
  const r = runStage('test', { dryRun: false, skip: new Set(), only: null, exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'failed');
  assert(r.message.includes('exit=1'));
  assert(r.message.includes('AssertionError'));
});

test('runStage test 成功时返回 passed', () => {
  const fakeExec = () => 'ok 1\nok 2';
  const r = runStage('test', { dryRun: false, skip: new Set(), only: null, exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'passed');
  assert(r.message.includes('ok 2'));
});

test('runStage simplify 无脚本 → skipped', () => {
  const fakeExec = () => { throw new Error('should not be called'); };
  const r = runStage('simplify', { dryRun: false, skip: new Set(), only: null, exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'skipped');
  assert(r.message.includes('无独立脚本'));
});

test('runStage --dry-run test → dry-run', () => {
  const fakeExec = () => { throw new Error('should not be called'); };
  const r = runStage('test', { dryRun: true, skip: new Set(), only: null, exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'dry-run');
  assert(r.message.includes('would run'));
});

test('runStage --skip 指定跳过', () => {
  const fakeExec = () => { throw new Error('should not be called'); };
  const r = runStage('test', { dryRun: false, skip: new Set(['test']), only: null, exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'skipped');
});

test('runStage --only 不匹配阶段 → skipped', () => {
  const fakeExec = () => { throw new Error('should not be called'); };
  const r = runStage('test', { dryRun: false, skip: new Set(), only: 'commit', exec: fakeExec, cwd: '/tmp' });
  assert(r.status === 'skipped');
  assert(r.message.includes('--only=commit'));
});

// ── 3. runPipeline 失败立即停止 ───────────────────────

test('runPipeline 失败立即停止', () => {
  let calls = 0;
  const fakeExec = (cmd) => {
    calls++;
    if (calls === 1) {
      const e = new Error('fail'); e.status = 1; e.stderr = 'err'; throw e;
    }
    return 'ok';
  };
  const opts = parseArgs([]);
  const result = runPipeline(opts, { exec: fakeExec });
  // test 失败 → simplify/review/commit 都不应跑
  assert(result.stages.length === 1, '应只跑 1 个阶段');
  assert(result.stages[0].status === 'failed');
  assert(result.summary === 'failed');
  assert(result.counts.failed === 1);
  assert(calls === 1, '失败后不应再调 exec');
});

test('runPipeline 全部失败（含 skip）→ summary=partial 或 all-skipped', () => {
  // simulate: test 失败 + simplify/review 跳过 + commit 不跑
  const fakeExec = () => { const e = new Error('fail'); e.status = 1; throw e; };
  const opts = parseArgs([]);
  const result = runPipeline(opts, { exec: fakeExec });
  assert(result.stages.length === 1);
  assert(result.summary === 'failed');
});

test('runPipeline --only test 只跑 test', () => {
  let calls = 0;
  const fakeExec = () => { calls++; return 'ok'; };
  const opts = parseArgs(['--only', 'test']);
  const result = runPipeline(opts, { exec: fakeExec });
  assert(result.stages.length === 1);
  assert(result.stages[0].stage === 'test');
  assert(result.stages[0].status === 'passed');
  assert(calls === 1);
});

test('runPipeline dry-run 不调 exec', () => {
  let calls = 0;
  const fakeExec = () => { calls++; return 'ok'; };
  const opts = parseArgs(['--dry-run']);
  const result = runPipeline(opts, { exec: fakeExec });
  // test(dry-run) + simplify(skipped, 无脚本) + review(skipped) + commit(dry-run)
  assert(result.dryRun === true);
  assert(calls === 0, 'dry-run 不应调 exec');
  assert(result.stages.some(s => s.stage === 'test' && s.status === 'dry-run'));
  assert(result.stages.some(s => s.stage === 'commit' && s.status === 'dry-run'));
});

test('runPipeline --skip simplify,review', () => {
  let calls = 0;
  const fakeExec = () => { calls++; return 'ok'; };
  const opts = parseArgs(['--skip', 'simplify,review']);
  const result = runPipeline(opts, { exec: fakeExec });
  assert(result.stages.find(s => s.stage === 'simplify').status === 'skipped');
  assert(result.stages.find(s => s.stage === 'review').status === 'skipped');
  assert(result.stages.find(s => s.stage === 'test').status === 'passed');
  assert(result.stages.find(s => s.stage === 'commit').status === 'passed');
  assert(calls === 2, '应只跑 test + commit');
});

test('runPipeline 全 skipped → all-skipped', () => {
  const fakeExec = () => 'ok';
  const opts = parseArgs(['--skip', 'test,commit']); // test/simplify/review/commit 都被无脚本或 skip 覆盖
  const result = runPipeline(opts, { exec: fakeExec });
  // simplify/review 无脚本 → skipped
  assert(result.summary === 'all-skipped');
});

// ── 4. formatHuman ───────────────────────────────────

test('formatHuman 含关键字段', () => {
  const fakeExec = () => 'ok';
  const opts = parseArgs(['--skip', 'simplify,review']);
  const result = runPipeline(opts, { exec: fakeExec });
  const text = formatHuman(result);
  assert(text.includes('/go pipeline'));
  assert(text.includes('test'));
  assert(text.includes('commit'));
  assert(text.includes('汇总'));
  assert(text.includes('总耗时'));
});

// ── 5. STAGE_DEFS 一致性 ─────────────────────────────

test('STAGE_DEFS 覆盖全部 STAGES', () => {
  for (const s of STAGES) {
    assert(STAGE_DEFS[s], `缺少 ${s} 定义`);
    assert(typeof STAGE_DEFS[s].name === 'string');
    assert(typeof STAGE_DEFS[s].description === 'string');
  }
});

// ── 总结 ─────────────────────────────────────────────

console.log('');
console.log(`📊 测试结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);