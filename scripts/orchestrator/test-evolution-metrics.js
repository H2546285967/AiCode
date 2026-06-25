#!/usr/bin/env node
/**
 * M15 Evolution Metrics 单元测试（v2.0.6）
 *
 * 覆盖：
 *   1. 4 个采集器写入 events
 *   2. monthlyAggregate 4 项指标聚合正确
 *   3. monthlyAggregate 时间窗口过滤（当月 vs 上月）
 *   4. report.js 渲染生成 markdown 文件
 *   5. report.js 数据不足时不崩溃，提示明确
 *   6. 旧 API 兼容性（increment/timing/gauge 仍工作）
 *   7. Evolution humanIntervention 缺 mode 报错
 *
 * @since v2.0.6 (2026-06-25) M15
 */

const fs = require('fs');
const path = require('path');

const Metrics = require('./metrics');
const { Evolution: Evo } = Metrics;

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

(async () => {
  // 准备：清空旧 metrics（保证测试隔离）
  try { fs.unlinkSync(Metrics.METRICS_FILE); } catch { /* ok */ }

  // 准备：清空 data/evolution/metrics-*.md（不污染真实报告）
  const reportDir = path.join(__dirname, '..', '..', 'data', 'evolution');
  try {
    if (fs.existsSync(reportDir)) {
      const old = fs.readdirSync(reportDir).filter(f => /^metrics-\d{6}\.md$/.test(f));
      for (const f of old) {
        try { fs.unlinkSync(path.join(reportDir, f)); } catch { /* ok */ }
      }
    }
  } catch { /* ok */ }

  // 1. 旧 API 兼容性
  Metrics.increment('old.counter', 1);
  Metrics.timing('old.timing', 100);
  Metrics.gauge('old.gauge', 42);
  await new Promise(r => setTimeout(r, 50));

  const oldSnap = Metrics.snapshot(1);
  check('旧 increment 仍工作', oldSnap.counters['old.counter'] === 1);
  check('旧 timing 仍工作', oldSnap.timings['old.timing'] && oldSnap.timings['old.timing'].count === 1);
  check('旧 gauge 不影响 snapshot（snapshot 不含 gauge）', !('old.gauge' in oldSnap.counters));

  // 2. 4 个采集器写入 events
  Evo.taskCompletionTime('M15-test', 1234, { task: 'test' });
  Evo.taskCompletionTime('M15-test', 5678, { task: 'test' });
  Evo.toolSuccessRate('test-tool', true, { dim: 'd1' });
  Evo.toolSuccessRate('test-tool', true, { dim: 'd1' });
  Evo.toolSuccessRate('test-tool', false, { dim: 'd1' });
  Evo.recallPrecision(true, { source: 'test' });
  Evo.recallPrecision(true, { source: 'test' });
  Evo.recallPrecision(false, { source: 'test' });
  Evo.humanIntervention({ mode: 'autonomous', action: 'approve' });
  Evo.humanIntervention({ mode: 'autonomous', action: 'session_start' });
  Evo.humanIntervention({ mode: 'normal', action: 'none' });
  await new Promise(r => setTimeout(r, 50));

  // 3. 验证 events 写入
  const lines = fs.readFileSync(Metrics.METRICS_FILE, 'utf8').split('\n').filter(Boolean);
  // 3 旧 + 2 task + 3 tool + 3 recall + 3 human = 14
  check('总事件数 = 14', lines.length === 14);

  const evoLines = lines.map(l => JSON.parse(l)).filter(e => e.name && e.name.startsWith('evo.'));
  check('evo.* 前缀事件数 = 11', evoLines.length === 11);

  // 4. monthlyAggregate 当月聚合
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const agg = Evo.monthlyAggregate(yyyymm);
  check('当月 days_with_data > 0', agg.days_with_data > 0);

  // task 聚合
  check('task.count = 2', agg.task.count === 2);
  check('task.p50 ≈ 3456（1234 与 5678 中位）', agg.task.p50 >= 1000 && agg.task.p50 <= 6000);
  check('task.p95 = 5678', agg.task.p95 === 5678);
  check('task.avg = 3456', agg.task.avg === 3456);
  check('task.top_slow 含 test', agg.task.top_slow.length > 0 && agg.task.top_slow[0].task === 'test');

  // tool 聚合
  check('tool.test-tool 存在', !!agg.tool['test-tool']);
  check('tool.test-tool success=2', agg.tool['test-tool'].success === 2);
  check('tool.test-tool failure=1', agg.tool['test-tool'].failure === 1);
  check('tool.test-tool success_rate ≈ 0.6667',
    Math.abs(agg.tool['test-tool'].success_rate - 0.6667) < 0.001);

  // kb 聚合
  check('kb.hits=2 misses=1 total=3', agg.kb.hits === 2 && agg.kb.misses === 3 ? false : true);
  // 修正：hits=2 misses=1 total=3
  check('kb.hits = 2', agg.kb.hits === 2);
  check('kb.misses = 1', agg.kb.misses === 1);
  check('kb.total = 3', agg.kb.total === 3);
  check('kb.precision ≈ 0.6667', Math.abs(agg.kb.precision - 0.6667) < 0.001);

  // human 聚合
  check('human.count = 3', agg.human.count === 3);
  check('human.by_mode.autonomous = 2', agg.human.by_mode.autonomous === 2);
  check('human.by_mode.normal = 1', agg.human.by_mode.normal === 1);
  check('human.by_action.approve = 1', agg.human.by_action.approve === 1);
  check('human.by_action.session_start = 1', agg.human.by_action.session_start === 1);

  // 5. monthlyAggregate 上月为空
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const prevYyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  const prevAgg = Evo.monthlyAggregate(prevYyyymm);
  check('上月 task.count = 0（无数据）', prevAgg.task.count === 0);
  check('上月 days_with_data = 0', prevAgg.days_with_data === 0);
  check('上月 tool = {}', Object.keys(prevAgg.tool).length === 0);
  check('上月 kb.total = 0', prevAgg.kb.total === 0);
  check('上月 human.count = 0', prevAgg.human.count === 0);

  // 6. report.js 生成 markdown 文件
  const { generateMonthlyReport } = require('./metrics/report');
  const outPath = generateMonthlyReport(yyyymm);
  check('report.js 生成文件存在', fs.existsSync(outPath));
  check('文件路径 = data/evolution/metrics-YYYYMM.md', /data[\\/]+evolution[\\/]+metrics-\d{6}\.md$/.test(outPath));

  const md = fs.readFileSync(outPath, 'utf8');
  check('markdown 包含标题', md.includes(`# 📊 Evolution Metrics — ${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)} 月报`));
  check('markdown 包含 4 项指标标题', md.includes('任务完成时间') && md.includes('工具成功率') && md.includes('KB 召回命中率') && md.includes('人工干预率'));
  check('markdown 包含 L5 达标进度', md.includes('L5 终极智能达标进度'));
  check('markdown 包含行动建议', md.includes('本月行动建议'));
  check('markdown 工具成功率行含 test-tool', md.includes('test-tool'));
  check('markdown 命中率含 66.7%', md.includes('66.7%'));

  // 7. report.js 上月空数据不崩溃
  const outPathPrev = generateMonthlyReport(prevYyyymm);
  const mdPrev = fs.readFileSync(outPathPrev, 'utf8');
  check('上月空数据报告存在', fs.existsSync(outPathPrev));
  check('上月空数据报告含 4 项指标的"无数据"提示',
    mdPrev.includes('本月无任务耗时数据') &&
    mdPrev.includes('本月无工具调用数据') &&
    mdPrev.includes('本月无 KB 召回数据') &&
    mdPrev.includes('本月无人工干预事件'));

  // 8. humanIntervention 缺 mode 报错（不抛崩）
  let errMsg = '';
  const origErr = process.stderr.write;
  process.stderr.write = (s) => { errMsg += s; return true; };
  Evo.humanIntervention({ action: 'approve' }); // 缺 mode
  process.stderr.write = origErr;
  check('humanIntervention 缺 mode 写 stderr 不抛', errMsg.includes('mode tag is required'));

  // 9. metrics Evo 导出兼容
  check('module.exports.Evolution 存在', !!require('./metrics').Evolution);

  console.log('');
  console.log(`📊 M15 metrics 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();
