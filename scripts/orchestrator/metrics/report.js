#!/usr/bin/env node
/**
 * 月度效果量化报告（v2.0.6 M15 P1-2）
 *
 * 作用：
 *   - 读取 logs/metrics.jsonl 当月数据 → 聚合 4 项指标
 *   - 与上个月对比 → 趋势 + 异常归因
 *   - 输出 data/evolution/metrics-YYYYMM.md（人类可读）
 *
 * 用法：
 *   node report.js                # 默认上个月
 *   node report.js 202605         # 指定月份
 *   node report.js 202605 --stdout # 输出到 stdout 不写文件
 *
 * 设计原则：
 *   - 零依赖（fs + path）
 *   - 复用 Evolution.monthlyAggregate() 聚合逻辑（单一数据源）
 *   - 报告存在即覆盖（不堆积旧月份）；缺失则创建目录
 *   - 数据不足时明确提示"待采集"，不编造
 *
 * @since v2.0.6 (2026-06-25) M15
 */

const fs = require('fs');
const path = require('path');
const Metrics = require('../metrics');
const { Evolution: Evo } = Metrics;

// 路径
const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'data', 'evolution');

/**
 * 把数字格式化为带千分位 + 单位的字符串
 */
function fmtNum(n, unit = '') {
  if (n === 0) return `0${unit}`;
  if (n >= 1000) return `${n.toLocaleString()}${unit}`;
  return `${n}${unit}`;
}

function fmtPct(rate) {
  if (rate === 0) return '0%';
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtTrend(curr, prev) {
  if (prev === 0 && curr === 0) return '— (持平)';
  if (prev === 0) return `🆕 首次记录（${fmtNum(curr)}）`;
  const delta = curr - prev;
  const pct = prev !== 0 ? ((delta / prev) * 100).toFixed(1) : 0;
  if (delta === 0) return '— (持平)';
  if (delta > 0) return `📈 +${fmtNum(delta)} (+${pct}%)`;
  return `📉 ${fmtNum(delta)} (${pct}%)`;
}

/**
 * 找目标月份 + 上个月
 */
function monthRange(yyyymm) {
  const y = parseInt(yyyymm.slice(0, 4), 10);
  const m = parseInt(yyyymm.slice(4, 6), 10);
  const currStart = new Date(y, m - 1, 1);
  const prevStart = new Date(y, m - 2, 1);
  const prevYyyymm = `${prevStart.getFullYear()}${String(prevStart.getMonth() + 1).padStart(2, '0')}`;
  return { curr: yyyymm, prev: prevYyyymm, currStart };
}

/**
 * 渲染报告 markdown
 */
function renderReport(yyyymm) {
  const { curr, prev } = monthRange(yyyymm);
  const data = Evo.monthlyAggregate(curr);
  const prevData = Evo.monthlyAggregate(prev);

  const lines = [];
  lines.push(`# 📊 Evolution Metrics — ${curr.slice(0, 4)}-${curr.slice(4, 6)} 月报`);
  lines.push('');
  lines.push(`> **生成时间**：${new Date().toISOString()}`);
  lines.push(`> **数据范围**：${curr}（当月） + ${prev}（对比）`);
  lines.push(`> **覆盖天数**：${data.days_with_data} 天 / ${prevData.days_with_data} 天（对比）`);
  lines.push(`> **事件总数**：${data.raw_count}（含 4 项指标）`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── 1. 任务完成时间 ──
  lines.push('## ⏱️ 1. 任务完成时间（task.completion_time）');
  lines.push('');
  if (data.task.count === 0) {
    lines.push('> ⚠️ **本月无任务耗时数据** — dispatcher CLI / 关键路径未覆盖。');
    lines.push('> 建议：跑 1-2 次 `node scripts/orchestrator/dispatcher.js "..."` 验证采集。');
  } else {
    lines.push(`- 事件数：${fmtNum(data.task.count)}（${fmtTrend(data.task.count, prevData.task.count)}）`);
    lines.push(`- P50：${fmtNum(data.task.p50, 'ms')}`);
    lines.push(`- P95：${fmtNum(data.task.p95, 'ms')}`);
    lines.push(`- 平均：${fmtNum(data.task.avg, 'ms')}`);
    lines.push(`- 趋势：P50 ${fmtTrend(data.task.p50, prevData.task.p50)}`);
    if (data.task.top_slow.length > 0) {
      lines.push('');
      lines.push('**最慢任务 Top 5**（按平均耗时）');
      lines.push('');
      lines.push('| # | 任务 | 次数 | 平均耗时 |');
      lines.push('|:-:|:-----|:----:|:--------:|');
      data.task.top_slow.forEach((t, i) => {
        lines.push(`| ${i + 1} | \`${t.task}\` | ${t.count} | ${fmtNum(t.avg, 'ms')} |`);
      });
    }
  }
  lines.push('');

  // ── 2. 工具成功率 ──
  lines.push('## 🔧 2. 工具成功率（tool.success_rate）');
  lines.push('');
  const toolNames = Object.keys(data.tool).sort();
  if (toolNames.length === 0) {
    lines.push('> ⚠️ **本月无工具调用数据** — 接入点未触发。');
    lines.push('> 建议：proactive-scan / mcp 调用后会自动采集。');
  } else {
    lines.push('| 工具 | 成功 | 失败 | 总数 | 成功率 | 上月 | 趋势 |');
    lines.push('|:-----|:----:|:----:|:----:|:------:|:----:|:----:|');
    for (const tool of toolNames) {
      const t = data.tool[tool];
      const prevT = prevData.tool[tool];
      const prevRate = prevT ? fmtPct(prevT.success_rate) : '—';
      const prevTotal = prevT ? prevT.total : 0;
      const trend = fmtTrend(t.total, prevTotal);
      lines.push(`| \`${tool}\` | ${fmtNum(t.success)} | ${fmtNum(t.failure)} | ${fmtNum(t.total)} | **${fmtPct(t.success_rate)}** | ${prevRate} | ${trend} |`);
    }
  }
  lines.push('');

  // ── 3. KB 召回命中率 ──
  lines.push('## 🧠 3. KB 召回命中率（kb.recall_precision）');
  lines.push('');
  if (data.kb.total === 0) {
    lines.push('> ⚠️ **本月无 KB 召回数据** — session-init 未触发或 Evo 未挂上。');
    lines.push('> 建议：重启会话触发 session-init.sh。');
  } else {
    const precisionDelta = data.kb.precision - prevData.kb.precision;
    const precisionTrend = precisionDelta === 0
      ? '— (持平)'
      : precisionDelta > 0
        ? `📈 +${(precisionDelta * 100).toFixed(1)}pp`
        : `📉 ${(precisionDelta * 100).toFixed(1)}pp`;
    lines.push(`- 总召回：${fmtNum(data.kb.total)}（${fmtTrend(data.kb.total, prevData.kb.total)}）`);
    lines.push(`- 命中：${fmtNum(data.kb.hits)}`);
    lines.push(`- 未命中：${fmtNum(data.kb.misses)}`);
    lines.push(`- **命中率**：${fmtPct(data.kb.precision)}（上月 ${fmtPct(prevData.kb.precision)}，${precisionTrend}）`);
    lines.push('');
    if (data.kb.precision < 0.5 && data.kb.total >= 5) {
      lines.push('> 🟡 **告警**：命中率 < 50% — 考虑 KB 是否有 stale 条目，或 recall 触发条件过松。');
    } else if (data.kb.precision >= 0.8) {
      lines.push('> ✅ **健康**：命中率 ≥ 80%，KB 真在派上用场。');
    }
  }
  lines.push('');

  // ── 4. 人工干预率 ──
  lines.push('## 👤 4. 人工干预率（human.intervention）');
  lines.push('');
  if (data.human.count === 0) {
    lines.push('> ⚠️ **本月无人工干预事件** — 自主模式未开启，或 Evo.humanIntervention 未挂上。');
    lines.push('> 注意：开启自主模式后每次 session 启动会记 1 次 session_start 基线。');
  } else {
    lines.push(`- 总事件：${fmtNum(data.human.count)}（${fmtTrend(data.human.count, prevData.human.count)}）`);
    lines.push('');
    if (Object.keys(data.human.by_mode).length > 0) {
      lines.push('**按 mode 分布**');
      lines.push('');
      lines.push('| mode | 次数 |');
      lines.push('|:-----|:----:|');
      for (const [mode, count] of Object.entries(data.human.by_mode).sort((a, b) => b[1] - a[1])) {
        lines.push(`| ${mode} | ${fmtNum(count)} |`);
      }
      lines.push('');
    }
    if (Object.keys(data.human.by_action).length > 0) {
      lines.push('**按 action 分布**');
      lines.push('');
      lines.push('| action | 次数 |');
      lines.push('|:-------|:----:|');
      for (const [action, count] of Object.entries(data.human.by_action).sort((a, b) => b[1] - a[1])) {
        lines.push(`| ${action} | ${fmtNum(count)} |`);
      }
    }
  }
  lines.push('');

  // ── L4/L5 达标进度 ──
  lines.push('## 🎯 L5 终极智能达标进度');
  lines.push('');
  lines.push('| # | 条件 | 本月状态 |');
  lines.push('|:-:|:-----|:---------|');
  lines.push('| 1 | M13+M14+M15 全部 ✅ | M13 ✅ + **M15 ✅（本增量）** + M14 ⏳ |');
  if (data.kb.total > 0) {
    const kbStatus = data.kb.precision >= 0.3 ? '🟡 起步' : '❌ 未达';
    lines.push(`| 2 | 失败蒸馏率 ≥ 80% | （M13 distiller 自统计）|`);
    lines.push(`| 3 | dispatcher 知识命中率 ≥ 30% | ${kbStatus}（实测 ${fmtPct(data.kb.precision)}，目标 ≥ 30%）|`);
  } else {
    lines.push('| 2 | 失败蒸馏率 ≥ 80% | 🟡 待实测 |');
    lines.push('| 3 | dispatcher 知识命中率 ≥ 30% | ❌ 待采集 |');
  }
  const monthlyReports = countPreviousReports(curr);
  lines.push(`| 4 | 月度 metric 报告持续 3 个月 | 🟡 **第 ${monthlyReports} 个月**（含本月，目标 3）|`);
  if (data.human.count > 0) {
    lines.push('| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | 🟡 数据采集中 |');
  } else {
    lines.push('| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | ❌ 待采集 |');
  }
  lines.push('');

  // ── 行动建议 ──
  lines.push('## 💡 本月行动建议');
  lines.push('');
  const suggestions = generateSuggestions(data, prevData);
  if (suggestions.length === 0) {
    lines.push('- ✨ 4 项指标全部健康，继续保持。');
  } else {
    suggestions.forEach(s => lines.push(`- ${s}`));
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('> 本报告由 M15 Evolution Metrics 自动生成（v2.0.6）');
  lines.push('> 下次生成：下月同日（或月初 cron 触发）');
  lines.push('');

  return lines.join('\n');
}

/**
 * 生成行动建议
 */
function generateSuggestions(data, prevData) {
  const out = [];
  if (data.task.count === 0) {
    out.push('🔴 任务耗时未采集 — 跑 `node scripts/orchestrator/dispatcher.js "..."` 验证');
  }
  if (Object.keys(data.tool).length === 0) {
    out.push('🔴 工具成功率未采集 — 跑 `npm run proactive:scan` 验证');
  }
  if (data.kb.total === 0) {
    out.push('🔴 KB 召回未采集 — 重启会话触发 session-init.sh');
  }
  // 工具失败率 ≥ 30%
  for (const [tool, t] of Object.entries(data.tool)) {
    if (t.total >= 5 && t.success_rate < 0.7) {
      out.push(`🟡 工具 \`${tool}\` 成功率仅 ${fmtPct(t.success_rate)}（${t.failure}/${t.total} 失败）— 检查调用点`);
    }
  }
  // 任务 P95 暴增
  if (prevData.task.count > 0 && data.task.count > 0) {
    const p95Delta = data.task.p95 - prevData.task.p95;
    if (p95Delta > prevData.task.p95 * 0.5 && p95Delta > 1000) {
      out.push(`🟡 任务 P95 暴增 +${fmtNum(p95Delta, 'ms')}（${prevData.task.p95}ms → ${data.task.p95}ms）— 查 top_slow`);
    }
  }
  return out;
}

/**
 * 数之前已有几个月度报告（含本月）
 *
 * 定义：报告连续覆盖的月份数。本月 = 1，第 N 个月 = N（覆盖 N 个不同月份）。
 * @param {string} currentYyyymm
 * @returns {number}
 */
function countPreviousReports(currentYyyymm) {
  try {
    if (!fs.existsSync(REPORT_DIR)) return 1;
    const files = fs.readdirSync(REPORT_DIR).filter(f => /^metrics-\d{6}\.md$/.test(f));
    const reportMonths = files.map(f => f.match(/(\d{6})/)[1]);
    const allMonths = new Set([...reportMonths, currentYyyymm]);

    // 转成 "距当前月多少个月前" 排序，找最长连续段（含本月）
    const current = parseInt(currentYyyymm, 10);
    const monthOffsets = [...allMonths].map(m => {
      const y = parseInt(m.slice(0, 4), 10);
      const mo = parseInt(m.slice(4, 6), 10);
      return (y * 12 + mo - 1) - (Math.floor(current / 100) * 12 + (current % 100) - 1);
    }).sort((a, b) => a - b);

    // 从 0（当前月）往前数连续段
    let count = 0;
    let expected = 0;
    for (const off of monthOffsets) {
      if (off === expected) {
        count++;
        expected--;
      } else if (off < expected) {
        break;
      }
    }
    return Math.max(1, count);
  } catch {
    return 1;
  }
}

/**
 * 生成月度报告
 * @param {string} [yyyymm]
 * @returns {string} 写出的文件路径
 */
function generateMonthlyReport(yyyymm) {
  // 默认上个月
  if (!yyyymm) {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const md = renderReport(yyyymm);
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  const outPath = path.join(REPORT_DIR, `metrics-${yyyymm}.md`);
  fs.writeFileSync(outPath, md, 'utf8');
  return outPath;
}

module.exports = { generateMonthlyReport, renderReport };

// ==================== CLI ====================
if (require.main === module) {
  const yyyymm = process.argv[2];
  const stdout = process.argv.includes('--stdout');

  if (stdout) {
    process.stdout.write(renderReport(yyyymm || Evo.monthlyAggregate().month));
  } else {
    const out = generateMonthlyReport(yyyymm);
    console.log(`✅ 月度报告已生成: ${out}`);
    console.log('');
    console.log('---');
    console.log('');
    process.stdout.write(fs.readFileSync(out, 'utf8'));
  }
}
