#!/usr/bin/env node
/**
 * Dashboard 脚本（v1.9 P1-2）
 *
 * 作用：
 *   - 聚合 metrics + logs 输出 24h ASCII dashboard
 *   - 模块：dispatcher / mcp / left-brain / evolution（按 component 聚合）
 *
 * 用法：
 *   node scripts/orchestrator/dashboard.js           # 默认 24h
 *   node scripts/orchestrator/dashboard.js 6         # 最近 6 小时
 *   node scripts/orchestrator/dashboard.js --json    # JSON 输出（供程序消费）
 *
 * 输出示例（24h）：
 *   ============================================================
 *   AiCode Dashboard (last 24h)
 *   ============================================================
 *   📊 Metrics
 *     dispatcher.decision: 247 calls
 *     mcp.tool.call:       1024 calls (errors: 3, 0.29%)
 *     mcp.tool.duration:   p50=12ms  p95=145ms  p95/avg=2.1x
 *   📝 Logs (by level)
 *     info:  320
 *     warn:  18
 *     error: 3
 *   ============================================================
 *
 * @since v1.9.0 (2026-06-24) P1-2
 */

const fs = require('fs');
const path = require('path');
const Metrics = require('./metrics');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.jsonl');
const HOURS = parseFloat(process.argv[2]) || 24;
const JSON_MODE = process.argv.includes('--json');

/**
 * 聚合 logs（按 level + component）
 * @param {number} sinceMs
 * @returns {object}
 */
function aggregateLogs(sinceMs) {
  const byLevel = {};
  const byComponent = {};
  let total = 0;
  let errors = 0;

  if (!fs.existsSync(LOG_FILE)) {
    return { byLevel, byComponent, total, errors };
  }

  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n');
  for (const line of lines) {
    if (!line) continue;
    try {
      const ev = JSON.parse(line);
      const ts = new Date(ev.ts).getTime();
      if (ts < sinceMs) continue;
      total++;
      byLevel[ev.level] = (byLevel[ev.level] || 0) + 1;
      byComponent[ev.component] = (byComponent[ev.component] || 0) + 1;
      if (ev.level === 'error' || ev.level === 'fatal') errors++;
    } catch { /* skip */ }
  }

  return { byLevel, byComponent, total, errors };
}

/**
 * 错误率计算
 * @param {object} snap
 * @returns {object} { total, errors, rate }
 */
function errorRate(snap) {
  const errCounter = snap.counters['mcp.tool.call'] || 0;
  // 错误数：tag.error='true' 的需要单独算，但 metrics snapshot 不分 tag
  // 用 logs 的 errors 作为近似
  return { total: errCounter, errors: 0, rate: 0 };
}

/**
 * 渲染文本 dashboard
 */
function printTextDashboard(snap, logs, hours) {
  const divider = '='.repeat(65);
  console.log(divider);
  console.log(`AiCode Dashboard (last ${hours}h)`);
  console.log(divider);

  // Metrics
  console.log('\n📊 Metrics (top 10 counters)');
  const counterEntries = Object.entries(snap.counters).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (counterEntries.length === 0) {
    console.log('   (暂无数据)');
  } else {
    for (const [name, val] of counterEntries) {
      const padded = name.padEnd(38);
      console.log(`   ${padded} ${val}`);
    }
  }

  // Timings
  console.log('\n⏱️  Timings (top 5 by call count)');
  const timingEntries = Object.entries(snap.timings).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  if (timingEntries.length === 0) {
    console.log('   (暂无数据)');
  } else {
    for (const [name, agg] of timingEntries) {
      const padded = name.padEnd(38);
      console.log(`   ${padded} count=${String(agg.count).padStart(4)}  p50=${String(agg.p50).padStart(5)}ms  p95=${String(agg.p95).padStart(5)}ms  avg=${String(agg.avg).padStart(5)}ms`);
    }
  }

  // Logs by level
  console.log('\n📝 Logs (by level)');
  const levelOrder = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  let hasLogs = false;
  for (const lvl of levelOrder) {
    if (logs.byLevel[lvl]) {
      hasLogs = true;
      const padded = lvl.padEnd(8);
      console.log(`   ${padded} ${logs.byLevel[lvl]}`);
    }
  }
  if (!hasLogs) console.log('   (暂无数据)');

  // Logs by component
  if (Object.keys(logs.byComponent).length > 0) {
    console.log('\n🧩 Logs (by component)');
    const compEntries = Object.entries(logs.byComponent).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [comp, count] of compEntries) {
      const padded = comp.padEnd(38);
      console.log(`   ${padded} ${count}`);
    }
  }

  // Summary
  console.log('\n📈 Summary');
  console.log(`   events:        ${snap.count} (metrics) + ${logs.total} (logs)`);
  console.log(`   errors:        ${logs.errors} (${((logs.errors / logs.total) * 100 || 0).toFixed(2)}% of logs)`);
  console.log(`   components:    ${Object.keys(logs.byComponent).length} active`);

  console.log('\n' + divider);
}

/**
 * JSON 输出（供后续工具消费）
 */
function printJsonDashboard(snap, logs, hours) {
  const out = {
    window: { hours, since: snap.since, until: snap.until },
    metrics: {
      counters: snap.counters,
      timings: snap.timings,
      eventCount: snap.count,
    },
    logs: {
      byLevel: logs.byLevel,
      byComponent: logs.byComponent,
      total: logs.total,
      errors: logs.errors,
    },
  };
  console.log(JSON.stringify(out, null, 2));
}

// ==================== 入口 ====================
function main() {
  const since = Date.now() - HOURS * 60 * 60 * 1000;
  const snap = Metrics.snapshot(HOURS);
  const logs = aggregateLogs(since);

  if (JSON_MODE) {
    printJsonDashboard(snap, logs, HOURS);
  } else {
    printTextDashboard(snap, logs, HOURS);
  }
}

if (require.main === module) {
  main();
}

module.exports = { aggregateLogs, HOURS };