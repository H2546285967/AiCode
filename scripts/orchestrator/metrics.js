#!/usr/bin/env node
/**
 * Metrics 暴露（v1.9 P0-4 → v2.0.6 M15 评价闭环）
 *
 * 作用：
 *   - 收集 counter / timing / gauge 三类指标 → logs/metrics.jsonl
 *   - 提供 snapshot() 聚合最近 N 小时数据
 *   - **v2.0.6 M15**：新增 Evolution 命名空间，4 项评价采集器 + 月度聚合
 *       1. task.completion_time   — 主线任务耗时（dispatcher 决策时间）
 *       2. tool.success_rate      — 工具调用成功率（proactive-scan / mcp）
 *       3. kb.recall_precision    — KB 召回命中率（session-init 召回 / 总召回）
 *       4. human.intervention_rate — 自主模式人工干预率
 *
 * 用法：
 *   const Metrics = require('./metrics');
 *   Metrics.increment('dispatcher.decision', 1, { dispatch: 'true' });
 *   const t0 = Date.now();
 *   // ... do work ...
 *   Metrics.timing('mcp.fetch', Date.now() - t0, { tool: 'fetch' });
 *
 *   // M15 评价采集
 *   const Evo = require('./metrics').Evolution;
 *   Evo.taskCompletionTime(taskId, durationMs, { milestone: 'M15' });
 *   Evo.toolSuccessRate('proactive-scan', true, { dim: 'ci-status' });
 *   Evo.recallPrecision(hit=true, { source: 'session-init' });
 *   Evo.humanIntervention({ mode: 'autonomous', action: 'approve' });
 *
 * 接入点（v1.9 + v2.0.6）：
 *   - dispatcher.js（决策耗时 → task.completion_time + 决策计数）
 *   - proactive-scan.js（维度跑过/失败 → tool.success_rate）
 *   - session-init.sh（启动时 → 召回命中 + 自主模式干预率）
 *   - autonomous-state.json（人工干预事件 → human.intervention_rate）
 *
 * 设计原则：
 *   - 零依赖（fs + path）
 *   - 写入失败不影响主流程（catch 住，写 stderr）
 *   - 不在 hot path 加锁（appendFileSync 原子追加）
 *   - M15 新增 API 与 v1.9 旧 API 并存，旧调用方零改动
 *
 * @since v1.9.0 (2026-06-24) P0-4
 * @updated v2.0.6 (2026-06-25) M15 Evolution Metrics
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

// ==================== v1.9 旧 API ====================

const Metrics = {
  /**
   * 计数器（单调递增）
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
   */
  snapshot(hours = 1) {
    const since = Date.now() - hours * 60 * 60 * 1000;
    const counters = {};
    const timings = {};

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

// ==================== v2.0.6 M15 Evolution 命名空间 ====================

/**
 * Evolution 评价采集器（4 项 L4/L5 量化指标）
 *
 * 数据格式（统一前缀 evo.*，方便月度聚合按前缀过滤）：
 *   evo.task.completion_time      type=timing,  name=evo.task.completion_time
 *   evo.tool.success              type=counter, name=evo.tool.success, tags.{tool, hit}
 *                                 （成功 1 次 +1，失败 1 次 +1，分母=成功+失败）
 *   evo.kb.recall                 type=counter, name=evo.kb.recall, tags.{hit}
 *   evo.human.intervention        type=counter, name=evo.human.intervention, tags.{mode, action}
 */
const Evolution = {
  /**
   * 1. 任务完成时间（主线任务耗时）
   * @param {string} taskId  任务标识（如 'M15-evolution-metrics' 或 'dispatcher.decision'）
   * @param {number} durationMs
   * @param {object} [tags]
   */
  taskCompletionTime(taskId, durationMs, tags = {}) {
    Metrics.timing('evo.task.completion_time', durationMs, { task: taskId, ...tags });
  },

  /**
   * 2. 工具调用成功率
   * 写入两条事件：tool.success（success=1 累加）和 tool.failure（failure=1 累加）
   * 聚合时：rate = success / (success + failure)
   * @param {string} tool  工具名（如 'proactive-scan' / 'mcp.fetch'）
   * @param {boolean} success
   * @param {object} [tags]
   */
  toolSuccessRate(tool, success, tags = {}) {
    Metrics.increment(
      success ? 'evo.tool.success' : 'evo.tool.failure',
      1,
      { tool, ...tags }
    );
  },

  /**
   * 3. KB 召回命中率
   * 写入 hit=true 时记 1 次命中，hit=false 时记 1 次未命中
   * 聚合时：precision = hits / (hits + misses)
   * @param {boolean} hit
   * @param {object} [tags]  source（如 'session-init' / 'dispatcher'）
   */
  recallPrecision(hit, tags = {}) {
    Metrics.increment(
      hit ? 'evo.kb.recall.hit' : 'evo.kb.recall.miss',
      1,
      tags
    );
  },

  /**
   * 4. 人工干预率
   * 自主模式开启后，用户手动确认/纠正/取消的事件
   * 聚合时：rate = intervention / (intervention + autonomous)
   * @param {object} tags  mode='autonomous' 时必填
   *   mode: 'autonomous' / 'normal'
   *   action: 'approve' / 'reject' / 'redirect' / 'cancel'
   */
  humanIntervention(tags = {}) {
    if (!tags.mode) {
      process.stderr.write('[metrics.Evolution.humanIntervention] mode tag is required\n');
      return;
    }
    Metrics.increment('evo.human.intervention', 1, tags);
  },

  /**
   * 月度聚合（按月份过滤 metrics.jsonl，统计 4 项指标的当月数据）
   * @param {string} [yyyymm]  形如 '202606'，默认上个月
   * @returns {object} { month, days_with_data, task, tool, kb, human, raw_count }
   */
  monthlyAggregate(yyyymm) {
    // 默认上个月（避免当月数据不全导致误导）
    if (!yyyymm) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const year = parseInt(yyyymm.slice(0, 4), 10);
    const month = parseInt(yyyymm.slice(4, 6), 10) - 1; // 0-indexed
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 1).getTime();

    if (!fs.existsSync(METRICS_FILE)) {
      return {
        month: yyyymm,
        days_with_data: 0,
        task: { count: 0, p50: 0, p95: 0, avg: 0, top_slow: [] },
        tool: {},
        kb: { hits: 0, misses: 0, precision: 0 },
        human: { count: 0, by_mode: {}, by_action: {} },
        raw_count: 0,
      };
    }

    const lines = fs.readFileSync(METRICS_FILE, 'utf8').split('\n');
    const taskTimings = [];
    const toolStats = {}; // {tool: {success: 0, failure: 0}}
    const kbStats = { hits: 0, misses: 0 };
    const humanStats = { count: 0, by_mode: {}, by_action: {} };
    const days = new Set();
    let raw = 0;

    for (const line of lines) {
      if (!line) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      const ts = new Date(ev.ts).getTime();
      if (ts < monthStart || ts >= monthEnd) continue;
      if (!ev.name || !ev.name.startsWith('evo.')) continue;
      raw++;

      const day = ev.ts.slice(0, 10);
      days.add(day);

      // 1. task.completion_time
      if (ev.name === 'evo.task.completion_time' && ev.type === 'timing') {
        taskTimings.push({ durationMs: ev.durationMs, task: ev.tags?.task || 'unknown' });
      }
      // 2. tool.success_rate
      else if (ev.name === 'evo.tool.success' || ev.name === 'evo.tool.failure') {
        const tool = ev.tags?.tool || 'unknown';
        if (!toolStats[tool]) toolStats[tool] = { success: 0, failure: 0 };
        if (ev.name === 'evo.tool.success') toolStats[tool].success += ev.value;
        else toolStats[tool].failure += ev.value;
      }
      // 3. kb.recall_precision
      else if (ev.name === 'evo.kb.recall.hit') {
        kbStats.hits += ev.value;
      } else if (ev.name === 'evo.kb.recall.miss') {
        kbStats.misses += ev.value;
      }
      // 4. human.intervention
      else if (ev.name === 'evo.human.intervention') {
        humanStats.count += ev.value;
        const mode = ev.tags?.mode || 'unknown';
        const action = ev.tags?.action || 'unknown';
        humanStats.by_mode[mode] = (humanStats.by_mode[mode] || 0) + ev.value;
        humanStats.by_action[action] = (humanStats.by_action[action] || 0) + ev.value;
      }
    }

    // task P50/P95/avg
    let taskAgg = { count: 0, p50: 0, p95: 0, avg: 0, top_slow: [] };
    if (taskTimings.length > 0) {
      const durations = taskTimings.map(t => t.durationMs).sort((a, b) => a - b);
      const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
      const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
      const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      // 按 task 分组找最慢的 3 个
      const byTask = {};
      for (const t of taskTimings) {
        if (!byTask[t.task]) byTask[t.task] = [];
        byTask[t.task].push(t.durationMs);
      }
      const topSlow = Object.entries(byTask)
        .map(([task, durs]) => ({
          task,
          count: durs.length,
          avg: Math.round(durs.reduce((a, b) => a + b, 0) / durs.length),
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);
      taskAgg = { count: durations.length, p50, p95, avg, top_slow: topSlow };
    }

    // tool 计算成功率
    const toolAgg = {};
    for (const [tool, s] of Object.entries(toolStats)) {
      const total = s.success + s.failure;
      toolAgg[tool] = {
        success: s.success,
        failure: s.failure,
        total,
        success_rate: total > 0 ? +(s.success / total).toFixed(4) : 0,
      };
    }

    // kb precision
    const kbTotal = kbStats.hits + kbStats.misses;
    const kbAgg = {
      hits: kbStats.hits,
      misses: kbStats.misses,
      total: kbTotal,
      precision: kbTotal > 0 ? +(kbStats.hits / kbTotal).toFixed(4) : 0,
    };

    return {
      month: yyyymm,
      days_with_data: days.size,
      task: taskAgg,
      tool: toolAgg,
      kb: kbAgg,
      human: humanStats,
      raw_count: raw,
    };
  },
};

module.exports = Metrics;
module.exports.Evolution = Evolution;

// ==================== CLI 自测 ====================
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'report') {
    // 月度报告：node metrics.js report [YYYYMM]
    const yyyymm = process.argv[3];
    const { generateMonthlyReport } = require('./metrics/report');
    const out = generateMonthlyReport(yyyymm);
    console.log(out);
  } else if (cmd === 'aggregate') {
    // 仅聚合不生成报告：node metrics.js aggregate [YYYYMM]
    const yyyymm = process.argv[3];
    console.log(JSON.stringify(Evolution.monthlyAggregate(yyyymm), null, 2));
  } else {
    // 默认 dashboard
    const hours = parseFloat(process.argv[2]) || 1;
    Metrics.printDashboard(hours);
  }
}
