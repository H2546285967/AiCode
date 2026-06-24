#!/usr/bin/env node
/**
 * dashboard 单元测试（v1.9 P1-2）
 *
 * 覆盖：
 *   1. aggregateLogs 正确统计 byLevel / byComponent
 *   2. 时间窗口过滤
 *   3. JSON 模式输出可解析
 *   4. 文本模式包含关键 section
 *
 * @since v1.9.0 (2026-06-24) P1-2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { aggregateLogs } = require('./dashboard');
const { LOG_FILE } = require('./logger');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

// 准备：写入已知日志
try { fs.unlinkSync(LOG_FILE); } catch { /* ok */ }
const { createLogger } = require('./logger');
const log = createLogger('dashboard-test', { level: 'trace' });
log.info('test info 1');
log.info('test info 2');
log.warn('test warn');
log.error('test error');
log.debug('test debug');

const oldEvent = {
  ts: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  level: 'info',
  component: 'old',
  msg: 'old event',
};
fs.appendFileSync(LOG_FILE, JSON.stringify(oldEvent) + '\n');

(async () => {
  await new Promise(r => setTimeout(r, 50));

  // 1. 聚合正确性
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const result = aggregateLogs(since);

  check('info 计数 = 2', result.byLevel.info === 2);
  check('warn 计数 = 1', result.byLevel.warn === 1);
  check('error 计数 = 1', result.byLevel.error === 1);
  check('debug 计数 = 1', result.byLevel.debug === 1);
  check('total = 5', result.total === 5);
  check('errors = 1', result.errors === 1);
  check('component dashboard-test 存在', result.byComponent['dashboard-test'] === 5);

  // 2. 时间窗口过滤：48h 前的事件不应在 24h 窗口
  check('过滤 48h 前事件', !result.byComponent.old);

  // 3. JSON 模式
  try {
    const out = execSync('node scripts/orchestrator/dashboard.js 1 --json', { encoding: 'utf8' });
    const parsed = JSON.parse(out);
    check('JSON 模式可解析', !!parsed);
    check('JSON 含 window 字段', !!parsed.window);
    check('JSON 含 metrics.counters', 'counters' in parsed.metrics);
    check('JSON 含 logs.byLevel', 'byLevel' in parsed.logs);
  } catch (e) {
    check('JSON 模式可解析', false);
    console.log('  error:', e.message);
  }

  // 4. 文本模式包含关键 section
  try {
    const out = execSync('node scripts/orchestrator/dashboard.js 1', { encoding: 'utf8' });
    check('文本模式含 "AiCode Dashboard"', out.includes('AiCode Dashboard'));
    check('文本模式含 "Metrics" section', out.includes('Metrics'));
    check('文本模式含 "Logs" section', out.includes('Logs'));
    check('文本模式含 "Summary" section', out.includes('Summary'));
  } catch (e) {
    check('文本模式可执行', false);
  }

  console.log('');
  console.log(`📊 dashboard 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();