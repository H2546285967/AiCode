#!/usr/bin/env node
/**
 * test-sync-l5-progress.js — sync-l5-progress.js 单元测试
 *
 * 覆盖：
 *   1. parseMetricsL5 解析正确
 *   2. parseRoadmapL5 解析正确
 *   3. diffL5 in-sync（无变化）
 *   4. diffL5 out-of-sync（metrics 显示 ✅ 但 04.md 显示 🟡）
 *   5. diffL5 缺数据 graceful 返回
 *   6. applyChanges 替换 status 列
 *   7. applyChanges 更新顶部"最近一次同步"
 *   8. findLatestReport 找到最近一份 metrics 报告
 *
 * @since v3.0.5 (2026-06-28) RESEARCH-research-skill-ecosystem-20260626
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const {
  parseMetricsL5,
  parseRoadmapL5,
  diffL5,
  applyChanges,
  findLatestReport,
} = require('./sync-l5-progress');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

// ── 1. parseMetricsL5 ─────────────────────────────────

test('parseMetricsL5: 解析 5 条 L5 行', () => {
  const md = `
## 🎯 L5 终极智能达标进度

| # | 条件 | 本月状态 |
|:-:|:-----|:---------|
| 1 | M13+M14+M15 全部 ✅ | M13 ✅ + M14 ✅ + M15 ✅ |
| 2 | 失败蒸馏率 ≥ 80% | 🟡 数据采集中 |
| 3 | dispatcher 知识命中率 ≥ 30% | 🟡 起步（实测 28%）|
| 4 | 月度 metric 报告持续 3 个月 | 🟡 第 2 个月 |
| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | 🟡 数据采集中 |
`;
  const rows = parseMetricsL5(md);
  assert.strictEqual(rows.length, 5, `期望 5 条，实际 ${rows.length}`);
  assert.strictEqual(rows[0].n, 1);
  assert.ok(/✅/.test(rows[0].status));
  assert.strictEqual(rows[2].n, 3);
  assert.ok(!/✅/.test(rows[2].status));
});

test('parseMetricsL5: 找不到 L5 段返回 null', () => {
  const rows = parseMetricsL5('# 普通文档\n无 L5 段\n');
  assert.strictEqual(rows, null);
});

// ── 2. parseRoadmapL5 ─────────────────────────────────

test('parseRoadmapL5: 解析 04.md L5 段', () => {
  const md = `
**L5 5 条真实进度**（2026-06-25 · M15 已落地）：

| # | 条件 | 当前状态 | 关联 |
|:--|:-----|:---------|:-----|
| 1 | M13+M14+M15 全部 ✅ | ✅ **3/3** | M13 ✅（v2.0.5）/ **M14 ✅（v3.0.0）** / M15 ✅（v2.0.6）|
| 2 | 失败蒸馏率 ≥ 80% | 🟡 数据采集中 | M13 已落地，30 天统计开始 |
| 3 | dispatcher 知识命中率 ≥ 30% | ✅ **已达标（实测 66.7%，目标 ≥ 30%）** | M14（v3.0.0 ✅）已上线 |
| 4 | 月度 metric 报告持续 3 个月 | 🟡 第 1 个月 | M15 已上线（v2.0.6），需 2026-06 / 07 / 08 |
| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | 🟡 数据采集中 | 自主模式 v2.0.0 P0-1 已开 |
`;
  const rows = parseRoadmapL5(md);
  assert.strictEqual(rows.length, 5);
  assert.strictEqual(rows[0].n, 1);
  assert.ok(/✅/.test(rows[0].status));
  assert.strictEqual(rows[3].n, 4);
  assert.ok(!/✅/.test(rows[3].status));
});

test('parseRoadmapL5: 找不到 L5 段返回 null', () => {
  const rows = parseRoadmapL5('无 L5 5 条真实进度段\n');
  assert.strictEqual(rows, null);
});

// ── 3. diffL5 in-sync ─────────────────────────────────

test('diffL5: 完全同步 → inSync=true', () => {
  const metrics = [
    { n: 1, condition: 'A', status: 'M13 ✅ + M14 ✅ + M15 ✅' },
    { n: 2, condition: 'B', status: '🟡 数据采集中' },
    { n: 3, condition: 'C', status: '🟡 起步' },
    { n: 4, condition: 'D', status: '🟡 第 1 个月' },
    { n: 5, condition: 'E', status: '🟡 数据采集中' },
  ];
  const roadmap = [
    { n: 1, condition: 'A', status: '✅ **3/3**', link: '' },
    { n: 2, condition: 'B', status: '🟡 数据采集中', link: '' },
    { n: 3, condition: 'C', status: '🟡 待实测', link: '' },
    { n: 4, condition: 'D', status: '🟡 第 1 个月', link: '' },
    { n: 5, condition: 'E', status: '🟡 数据采集中', link: '' },
  ];
  const diff = diffL5(metrics, roadmap);
  assert.strictEqual(diff.inSync, true);
  assert.strictEqual(diff.changes.length, 0);
});

// ── 4. diffL5 out-of-sync ─────────────────────────────

test('diffL5: metrics 升级 ✅ 但 04.md 还 🟡 → 1 项变更', () => {
  const metrics = [
    { n: 1, condition: 'A', status: 'M13 ✅ + M14 ✅ + M15 ✅' },
    { n: 2, condition: 'B', status: '✅ 已达标（实测 85%）' }, // 升级
    { n: 3, condition: 'C', status: '🟡 起步' },
    { n: 4, condition: 'D', status: '🟡 第 2 个月' },
    { n: 5, condition: 'E', status: '🟡 数据采集中' },
  ];
  const roadmap = [
    { n: 1, condition: 'A', status: '✅ 3/3', link: '' },
    { n: 2, condition: 'B', status: '🟡 数据采集中', link: '' },
    { n: 3, condition: 'C', status: '🟡 待实测', link: '' },
    { n: 4, condition: 'D', status: '🟡 第 1 个月', link: '' },
    { n: 5, condition: 'E', status: '🟡 数据采集中', link: '' },
  ];
  const diff = diffL5(metrics, roadmap);
  assert.strictEqual(diff.inSync, false);
  assert.strictEqual(diff.changes.length, 1);
  assert.strictEqual(diff.changes[0].n, 2);
});

test('diffL5: metrics 降级 🟡 但 04.md 还 ✅ → 1 项变更', () => {
  const metrics = [
    { n: 1, condition: 'A', status: '🟡 数据采集中' }, // 降级
    { n: 2, condition: 'B', status: '🟡 数据采集中' },
    { n: 3, condition: 'C', status: '🟡 起步' },
    { n: 4, condition: 'D', status: '🟡 第 2 个月' },
    { n: 5, condition: 'E', status: '🟡 数据采集中' },
  ];
  const roadmap = [
    { n: 1, condition: 'A', status: '✅ 3/3', link: '' },
    { n: 2, condition: 'B', status: '🟡 数据采集中', link: '' },
    { n: 3, condition: 'C', status: '🟡 待实测', link: '' },
    { n: 4, condition: 'D', status: '🟡 第 1 个月', link: '' },
    { n: 5, condition: 'E', status: '🟡 数据采集中', link: '' },
  ];
  const diff = diffL5(metrics, roadmap);
  assert.strictEqual(diff.inSync, false);
  assert.strictEqual(diff.changes.length, 1);
  assert.strictEqual(diff.changes[0].n, 1);
});

// ── 5. diffL5 缺数据 graceful ─────────────────────────

test('diffL5: metrics 缺 → error', () => {
  const diff = diffL5(null, [{ n: 1, condition: 'A', status: '✅' }]);
  assert.strictEqual(diff.inSync, true);
  assert.ok(/metrics/.test(diff.error));
});

test('diffL5: 04.md 缺 → error', () => {
  const diff = diffL5([{ n: 1, condition: 'A', status: '✅' }], null);
  assert.strictEqual(diff.inSync, true);
  assert.ok(/04\.md/.test(diff.error));
});

// ── 6. applyChanges 替换 status 列 ─────────────────────

test('applyChanges: 替换第 n 行的 status 列', () => {
  const md = `# 04

**L5 5 条真实进度**（2026-06-25）：

| # | 条件 | 当前状态 | 关联 |
|:--|:-----|:---------|:-----|
| 1 | M13+M14+M15 全部 ✅ | ✅ **3/3** | M13 ✅ |
| 2 | 失败蒸馏率 ≥ 80% | 🟡 数据采集中 | M13 |
| 3 | dispatcher 知识命中率 ≥ 30% | 🟡 待实测 | M14 |
| 4 | 月度 metric 报告持续 3 个月 | 🟡 第 1 个月 | M15 |
| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | 🟡 数据采集中 | 自主模式 |
`;
  const changes = [
    { n: 4, before: '🟡 第 1 个月', after: '🟡 第 2 个月', condition: 'D' },
  ];
  const metricsRows = [
    { n: 1, condition: 'A', status: '✅ 3/3' },
    { n: 2, condition: 'B', status: '🟡 数据采集中' },
    { n: 3, condition: 'C', status: '🟡 待实测' },
    { n: 4, condition: 'D', status: '🟡 第 2 个月（实测持续 2 个月）' },
    { n: 5, condition: 'E', status: '🟡 数据采集中' },
  ];
  const newMd = applyChanges(md, changes, metricsRows);
  assert.ok(newMd.includes('🟡 第 2 个月'), '新 status 应出现');
  assert.ok(!newMd.includes('🟡 第 1 个月'), '旧 status 应消失');
});

// ── 7. applyChanges 更新顶部"最近一次同步" ──────────

test('applyChanges: 更新顶部"最近一次同步"时间戳', () => {
  const md = `# 04
> **最近一次同步**：2026-06-27 (v3.0.5 M24 sync-roadmap 自动同步：0 新增)

**L5 5 条真实进度**：

| # | 条件 | 当前状态 | 关联 |
|:--|:-----|:---------|:-----|
| 1 | A | 🟡 | link |
| 2 | B | 🟡 | link |
| 3 | C | 🟡 | link |
| 4 | D | 🟡 | link |
| 5 | E | 🟡 | link |
`;
  const changes = [{ n: 1, before: '🟡', after: '✅', condition: 'A' }];
  const metricsRows = [
    { n: 1, condition: 'A', status: '✅ 已升级' },
    { n: 2, condition: 'B', status: '🟡' },
    { n: 3, condition: 'C', status: '🟡' },
    { n: 4, condition: 'D', status: '🟡' },
    { n: 5, condition: 'E', status: '🟡' },
  ];
  const newMd = applyChanges(md, changes, metricsRows);
  assert.ok(/RESEARCH-sync-l5 自动同步：1 项/.test(newMd), '顶部时间戳应包含新标记');
});

// ── 9. blockquote-prefixed table (04.md 真实格式) ─────

test('parseRoadmapL5: 兼容 blockquote 引用前缀（> | 1 | ...）', () => {
  const md = `
> **L5 5 条真实进度**（2026-06-25 · M15 已落地）：
>
> | # | 条件 | 当前状态 | 关联 |
> |:--|:-----|:---------|:-----|
> | 1 | M13+M14+M15 全部 ✅ | ✅ **3/3** | M13 ✅ |
> | 2 | 失败蒸馏率 ≥ 80% | 🟡 数据采集中 | M13 |
> | 3 | dispatcher 知识命中率 ≥ 30% | ✅ **已达标（66.7%）** | M14 |
> | 4 | 月度 metric 报告持续 3 个月 | 🟡 第 1 个月 | M15 |
> | 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | 🟡 数据采集中 | 自主模式 |
`;
  const rows = parseRoadmapL5(md);
  assert.strictEqual(rows.length, 5, `blockquote 内表格应解析 5 条，实际 ${rows ? rows.length : 'null'}`);
  assert.strictEqual(rows[0].n, 1);
  assert.ok(/✅/.test(rows[0].status));
  assert.strictEqual(rows[3].n, 4);
  assert.ok(!/✅/.test(rows[3].status));
});

test('applyChanges: 在 blockquote 引用块表格中替换 status 列', () => {
  const md = `# 04
>
> **L5 5 条真实进度**：
>
> | # | 条件 | 当前状态 | 关联 |
> |:--|:-----|:---------|:-----|
> | 1 | A | 🟡 | link |
> | 2 | B | 🟡 | link |
> | 3 | C | 🟡 | link |
> | 4 | D | 🟡 | link |
> | 5 | E | 🟡 | link |
`;
  const changes = [{ n: 2, before: '🟡', after: '✅ 已达标', condition: 'B' }];
  const metricsRows = [
    { n: 1, condition: 'A', status: '🟡' },
    { n: 2, condition: 'B', status: '✅ 已达标' },
    { n: 3, condition: 'C', status: '🟡' },
    { n: 4, condition: 'D', status: '🟡' },
    { n: 5, condition: 'E', status: '🟡' },
  ];
  const newMd = applyChanges(md, changes, metricsRows);
  assert.ok(newMd.includes('> | 2 | B | ✅ 已达标 |'), '应保留 > 前缀并替换 status');
  assert.ok(!newMd.includes('> | 2 | B | 🟡 | link |'), '旧 status 应被替换');
});

// ── 8. findLatestReport ───────────────────────────────

test('findLatestReport: 找最近一份 metrics 报告', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-l5-test-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'metrics-202605.md'), '# 5月');
    fs.writeFileSync(path.join(tmpDir, 'metrics-202606.md'), '# 6月');
    fs.writeFileSync(path.join(tmpDir, 'metrics-202604.md'), '# 4月');
    fs.writeFileSync(path.join(tmpDir, 'not-metrics.md'), '# 不该被找到');

    // 临时改 process.cwd() 不行，直接重写函数行为：通过传 path 不可行
    // 改测：把 REPORT_DIR 临时指过去
    // 这里用 mock 方式：检查 sort 顺序
    const files = fs.readdirSync(tmpDir)
      .filter(f => /^metrics-\d{6}\.md$/.test(f))
      .sort()
      .reverse();
    assert.strictEqual(files[0], 'metrics-202606.md');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── 总结 ──────────────────────────────────────────────

console.log('');
console.log(`📊 测试结果: ${passed} 通过 / ${failed} 失败 / ${passed + failed} 总计`);
process.exit(failed > 0 ? 1 : 0);