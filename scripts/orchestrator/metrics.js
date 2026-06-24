#!/usr/bin/env node
/**
 * Metrics 暴露（v1.9 P0-4）
 *
 * 作用：
 *   - 收集 counter / timing / gauge 三类指标
 *   - 写入 logs/metrics.jsonl（每行一个事件）
 *   - 提供 snapshot() 聚合最近 N 小时数据
 *
 * 用法：
 *   const Metrics = require('./metrics');
 *   Metrics.increment('dispatcher.decision', 1, { dispatch: 'true' });
 *   const t0 = Date.now();
 *   // ... do work ...
 *   Metrics.timing('mcp.fetch', Date.now() - t0, { tool: 'fetch' });
 *
 * 接入点（v1.9 仅 dispatcher + mcp）：
 *   - scripts/orchestrator/dispatcher.js（decision count + timing）
 *   - scripts/mcp/_shared.js（tool call count + timing + errors）
 *
 * 设计原则：
 *   - 零依赖（fs + path）
 *   - 写入失败不影响主流程（catch 住，写 stderr）
 *   - 不在 hot path 加锁（appendFileSync 原子追加）
 *
 * @since v1.9.0 (2026-06-24) P0-4
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const METRICS_FILE = path.join(LOG_DIR, 'metrics.jsonl');

// 内存聚合（最近 1 小时，按小时窗口）
const RECENT_WINDOW_MS = 60 * 60 * 1000;

/**
 * 写入一行 metrics 事件
 * @param {object} event
 */
function writeEvent(event) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(METRICS_FILE, JSON.stringify(event) + '\n');
  } catch (e) {
    // 写入失败不影响主流程
    process.stderr.write(`[metrics] write failed: ${e.message}\n`);
  }
}

const Metrics = {
  /**
   * 计数器（单调递增）
   * @param {string} name  指标名（点分，如 "dispatcher.decision"）
   * @param {number} [value=1]
   * @param {object} [tags]  维度标签
   */
  increment(name, value = 1, tags = {}) {
    writeEvent({
      ts: new Date().toISOString(),
      type: 'counter',
      name,
      value,
      tags,
    });
  },

  /**
   * 计时器
   * @param {string} name
   * @param {number} durationMs
   * @param {object} [tags]
   */
  timing(name, durationMs, tags = {}) {
    writeEvent({
      ts: new Date().toISOString(),
      type: 'timing',
      name,
      durationMs,
      tags,
    });
  },

  /**
   * 瞬时值（如队列长度、内存）
   * @param {string} name
   * @param {number} value
   * @param {object} [tags]
   */
  gauge(name, value, tags = {}) {
    writeEvent({
      ts: new Date().toISOString(),
      type: 'gauge',
      name,
      value,
      tags,
    });
  },

  /**
   * 读取 metrics.jsonl 聚合（最近 N 小时）
   * @param {number} [hours=1]
   * @returns {object}  { counters: {...}, timings: {name: {count, p50, p95, avg}} }
   */
  snapshot(hours = 1) {
    const since = Date.now() - hours * 60 * 60 * 1000;
    const counters = {};
    const timings = {}; // {name: [durationMs, ...]}

    if (!fs.existsSync(METRICS_FILE)) {
      return { counters, timings, since, until: Date.now(), count: 0 };
    }

    const lines = fs.readFileSync(METRICS_FILE, 'utf8').split('\n');
    let parsed = 0;
    for (const line of lines) {
      if (!line) continue;
      try {
        const ev = JSON.parse(line);
        const ts = new Date(ev.ts).getTime();
        if (ts < since) continue;
        parsed++;
        if (ev.type === 'counter') {
          counters[ev.name] = (counters[ev.name] || 0) + (ev.value || 0);
        } else if (ev.type === 'timing') {
          if (!timings[ev.name]) timings[ev.name] = [];
          timings[ev.name].push(ev.durationMs);
        }
      } catch { /* skip malformed line */ }
    }

    // 计算 P50/P95
    const timingsAgg = {};
    for (const [name, vals] of Object.entries(timings)) {
      vals.sort((a, b) => a - b);
      const p50 = vals[Math.floor(vals.length * 0.5)] || 0;
      const p95 = vals[Math.floor(vals.length * 0.95)] || 0;
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      timingsAgg[name] = { count: vals.length, p50, p95, avg };
    }

    return { counters, timings: timingsAgg, since, until: Date.now(), count: parsed };
  },

  /**
   * 打印人类可读的 dashboard
   * @param {number} [hours=1]
   */
  printDashboard(hours = 1) {
    const snap = Metrics.snapshot(hours);
    const divider = '='.repeat(60);
    console.log(divider);
    console.log(`AiCode Metrics (last ${hours}h, ${snap.count} events)`);
    console.log(divider);

    if (Object.keys(snap.counters).length > 0) {
      console.log('\nCounters:');
      const entries = Object.entries(snap.counters).sort((a, b) => b[1] - a[1]);
      for (const [name, val] of entries) {
        console.log(`  ${name.padEnd(40)} ${val}`);
      }
    }

    if (Object.keys(snap.timings).length > 0) {
      console.log('\nTimings:');
      const entries = Object.entries(snap.timings).sort((a, b) => b[1].count - a[1].count);
      for (const [name, agg] of entries) {
        console.log(`  ${name.padEnd(40)} count=${agg.count}  p50=${agg.p50}ms  p95=${agg.p95}ms  avg=${agg.avg}ms`);
      }
    }

    if (snap.count === 0) {
      console.log('\n暂无数据。运行一些工具后重试。');
    }

    console.log('\n' + divider);
  },

  /** 文件路径（供测试验证） */
  get METRICS_FILE() { return METRICS_FILE; },
  get LOG_DIR() { return LOG_DIR; },
};

module.exports = Metrics;

// ==================== CLI 自测 ====================
if (require.main === module) {
  const hours = parseFloat(process.argv[2]) || 1;
  Metrics.printDashboard(hours);
}