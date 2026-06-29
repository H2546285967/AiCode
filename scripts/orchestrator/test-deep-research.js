#!/usr/bin/env node
/**
 * test-deep-research.js — deep-research 单元测试（M49）
 *
 * 覆盖：
 *   1. METHODOLOGY 配置完整
 *   2. loadObject 三级 fallback
 *   3. renderVertical 含 5 维度 + 字数参考
 *   4. renderHorizontal 含场景 A/B/C + 4 维度对比
 *   5. renderIntersection 含 3 个剧本（最可能/最危险/最乐观）
 *   6. generateReport 输出含 6 段
 *   7. analyzeCmd 输出框架含"研究对象名"
 *   8. CLI --json 输出合法 JSON
 *   9. templateCmd 输出模板含 [待填]
 *  10. from-data 文件不存在报错
 *
 * 用法：node test-deep-research.js
 *
 * @since v3.0.7 (2026-06-29)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const dr = require('./deep-research.js');

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

console.log('\ntest-deep-research.js\n');

// 1. METHODOLOGY
test('METHODOLOGY 完整配置', () => {
  const m = dr.METHODOLOGY;
  assert(m.name.includes('横纵'), 'name 含横纵');
  assert(m.axes.vertical, 'vertical');
  assert(m.axes.horizontal, 'horizontal');
  assert(m.axes.intersection, 'intersection');
  assertEq(m.axes.vertical.key_questions.length, 5, '5 维度');
  assertEq(m.axes.horizontal.comparison_dimensions.length, 4, '4 维度对比');
  assertEq(m.axes.intersection.core_questions.length, 5, '5 核心问题');
  assert(m.adopted_changes.length >= 1, 'adopted_changes 有内容');
});

// 2. loadObject
test('loadObject 三级 fallback', () => {
  const o = dr.loadObject('X');
  assertEq(o.name, 'X', 'name');
  assert(o.type.includes('待确定'), 'type fallback');
  assert(o.timeline.length === 0, 'timeline 空');
});

test('loadObject 接受 data 参数', () => {
  const data = { type: '产品', timeline: [{ date: '2024', event: '发布' }] };
  const o = dr.loadObject('X', data);
  assertEq(o.type, '产品', 'type');
  assertEq(o.timeline.length, 1, 'timeline 1 条');
});

// 3. renderVertical
test('renderVertical 含 5 维度', () => {
  const o = dr.loadObject('Claude Code');
  const out = dr.renderVertical(o);
  assert(out.includes('## 二、纵向分析'), '标题');
  assert(out.includes('起源追溯'), '起源追溯');
  assert(out.includes('诞生节点'), '诞生节点');
  assert(out.includes('演进历程'), '演进历程');
  assert(out.includes('决策逻辑'), '决策逻辑');
  assert(out.includes('阶段划分'), '阶段划分');
  assert(out.includes('6000-15000'), '字数参考');
});

// 4. renderHorizontal
test('renderHorizontal 含场景 A/B/C + 4 维度', () => {
  const o = dr.loadObject('X');
  const out = dr.renderHorizontal(o);
  assert(out.includes('## 三、横向分析'), '标题');
  assert(out.includes('场景 A'), '场景 A');
  assert(out.includes('场景 B'), '场景 B');
  assert(out.includes('场景 C'), '场景 C');
  assert(out.includes('核心差异'), '核心差异');
  assert(out.includes('用户视角'), '用户视角');
  assert(out.includes('生态位'), '生态位');
  assert(out.includes('趋势判断'), '趋势判断');
  assert(out.includes('3000-10000'), '字数参考');
});

// 5. renderIntersection
test('renderIntersection 含 3 剧本', () => {
  const o = dr.loadObject('X');
  const out = dr.renderIntersection(o);
  assert(out.includes('## 四、横纵交汇'), '标题');
  assert(out.includes('最可能'), '最可能');
  assert(out.includes('最危险'), '最危险');
  assert(out.includes('最乐观'), '最乐观');
  assert(out.includes('1500-3000'), '字数参考');
});

// 6. generateReport
test('generateReport 含 6 段', () => {
  const o = dr.loadObject('Claude Code');
  const report = dr.generateReport(o);
  assert(report.includes('# Claude Code'), 'H1 含对象名');
  assert(report.includes('## 一、一句话定义'), '段 1');
  assert(report.includes('## 二、纵向分析'), '段 2');
  assert(report.includes('## 三、横向分析'), '段 3');
  assert(report.includes('## 四、横纵交汇'), '段 4');
  assert(report.includes('## 五、信息来源'), '段 5');
  assert(report.includes('## 六、方法论说明'), '段 6');
});

test('generateReport 中 [待填] 占位符', () => {
  const o = dr.loadObject('X');
  const report = dr.generateReport(o);
  assert(report.includes('[待填]'), '有 [待填] 占位');
});

// 7. CLI --help
test('CLI 无参数输出用法', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js')], { encoding: 'utf8' });
  assertEq(r.status, 0, 'exit=0');
  assert(r.stdout.includes('用法'), '含用法');
  assert(r.stdout.includes('analyze'), 'analyze');
  assert(r.stdout.includes('template'), 'template');
  assert(r.stdout.includes('from-data'), 'from-data');
});

// 8. CLI analyze
test('CLI analyze "Claude Code" 输出框架', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js'), 'analyze', 'Claude Code'], { encoding: 'utf8' });
  assertEq(r.status, 0, 'exit=0');
  assert(r.stdout.includes('Claude Code'), '含对象名');
  assert(r.stdout.includes('## 二、纵向分析'), '段 2');
  assert(r.stdout.includes('## 四、横纵交汇'), '段 4');
});

// 9. CLI --json
test('CLI analyze --json 输出合法 JSON', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js'), 'analyze', 'X', '--json'], { encoding: 'utf8' });
  assertEq(r.status, 0, 'exit=0');
  try {
    const j = JSON.parse(r.stdout);
    assert(j.methodology, 'methodology');
    assert(j.axes, 'axes');
    assert(j.object, 'object');
  } catch (e) {
    throw new Error('JSON parse fail: ' + e.message);
  }
});

// 10. CLI template
test('CLI template 输出模板', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js'), 'template', 'X'], { encoding: 'utf8' });
  assertEq(r.status, 0, 'exit=0');
  assert(r.stdout.includes('待填') || r.stdout.includes('[待填]') || r.stdout.includes('必填'), '含占位符');
  assert(r.stdout.includes('纵向'), '纵向');
  assert(r.stdout.includes('横向'), '横向');
});

// 11. CLI from-data
test('CLI from-data 文件不存在报错', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js'), 'from-data', '/nonexistent.json'], { encoding: 'utf8' });
  assert(r.status !== 0, 'exit != 0');
  assert(r.stderr.includes('不存在') || r.stdout.includes('不存在'), '含不存在');
});

test('CLI from-data 从真实 JSON 生成报告', () => {
  const tmp = path.join(os.tmpdir(), 'dr-' + Date.now() + '.json');
  const data = {
    name: 'TestObj',
    type: '产品',
    timeline: [{ date: '2024-01', event: '初始发布' }],
    competitors: [{ name: '竞品 A', description: 'A 的定位' }],
    advantage_roots: [{ advantage: '快', historical_event: '2023 Q3 重构' }],
    future_scenarios: [{ scenario: '继续增长' }],
  };
  fs.writeFileSync(tmp, JSON.stringify(data));
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'deep-research.js'), 'from-data', tmp], { encoding: 'utf8' });
  assertEq(r.status, 0, 'exit=0');
  assert(r.stdout.includes('TestObj'), '含对象名');
  assert(r.stdout.includes('2024-01'), '含时间线');
  assert(r.stdout.includes('竞品 A'), '含竞品');
  fs.unlinkSync(tmp);
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
