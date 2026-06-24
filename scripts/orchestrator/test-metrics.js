#!/usr/bin/env node
/**
 * Metrics 单元测试（v1.9 P0-4）
 *
 * 覆盖：
 *   1. increment / timing / gauge 写入 metrics.jsonl
 *   2. snapshot 聚合 counter 求和
 *   3. snapshot 计算 timing P50/P95/avg
 *   4. snapshot 过滤时间窗口
 *
 * @since v1.9.0 (2026-06-24) P0-4
 */

const fs = require('fs');
const path = require('path');
const Metrics = require('./metrics');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

// 准备：清空旧 metrics
try { fs.unlinkSync(Metrics.METRICS_FILE); } catch { /* ok */ }

(async () => {
  // 1. 写入各种类型
  Metrics.increment('test.counter', 1, { tag: 'a' });
  Metrics.increment('test.counter', 2, { tag: 'a' });
  Metrics.timing('test.timing', 100);
  Metrics.timing('test.timing', 200);
  Metrics.timing('test.timing', 300);
  Metrics.gauge('test.gauge', 42);

  // 等一下确保 fs.flush
  await new Promise(r => setTimeout(r, 50));

  // 2. 文件存在且有内容
  const exists = fs.existsSync(Metrics.METRICS_FILE);
  check('metrics.jsonl 已创建', exists);

  const lines = fs.readFileSync(Metrics.METRICS_FILE, 'utf8').split('\n').filter(Boolean);
  check('写入 6 个事件', lines.length === 6);

  // 3. snapshot 聚合
  const snap = Metrics.snapshot(1);
  check('counter 求和正确', snap.counters['test.counter'] === 3);
  check('counter 含 tags（暂时不深查，但 key 存在）', 'test.counter' in snap.counters);

  // 4. timing P50/P95
  const t = snap.timings['test.timing'];
  check('timing count 正确', t && t.count === 3);
  check('timing P50 ≈ 200', t && t.p50 >= 100 && t.p50 <= 300);
  check('timing P95 = 300', t && t.p95 === 300);
  check('timing avg = 200', t && t.avg === 200);

  // 5. 时间窗口过滤：写一个 2 小时前的事件
  const oldEvent = {
    ts: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'counter',
    name: 'old.counter',
    value: 99,
  };
  fs.appendFileSync(Metrics.METRICS_FILE, JSON.stringify(oldEvent) + '\n');
  await new Promise(r => setTimeout(r, 50));

  const snap1h = Metrics.snapshot(1);
  const hasOld = !!snap1h.counters['old.counter'];
  check('时间窗口过滤旧事件（2h 前应不计入 1h 窗口）', !hasOld);

  // 6. printDashboard 不抛
  let dashboardOk = true;
  try { Metrics.printDashboard(1); } catch { dashboardOk = false; }
  check('printDashboard 不抛异常', dashboardOk);

  console.log('');
  console.log(`📊 metrics 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();