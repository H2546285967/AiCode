#!/usr/bin/env node
/**
 * logger 单元测试（v1.9 P1-1）
 *
 * 覆盖：
 *   1. 各 level 方法都能写入
 *   2. msg 参数（string）正确放入 event.msg
 *   3. obj 参数（object）正确展开为字段
 *   4. child() 绑定字段合并
 *   5. level 过滤生效
 *   6. 错误对象作为 obj 时序列化
 *
 * @since v1.9.0 (2026-06-24) P1-1
 */

const fs = require('fs');
const { createLogger, LOG_FILE } = require('./logger');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

// 清空旧日志
try { fs.unlinkSync(LOG_FILE); } catch { /* ok */ }

(async () => {
  const log = createLogger('test', { level: 'trace' });

  // 1. 各 level
  log.info('msg-info');
  log.warn({ w: 1 }, 'msg-warn');
  log.error('msg-error');
  log.debug({ d: 1 }, 'msg-debug');

  // 2. child 绑定
  const child = log.child({ requestId: 'r-1', user: 'alice' });
  child.info({ action: 'login' }, 'user logged in');

  // 3. level 过滤
  const silentLog = createLogger('silent', { level: 'error' });
  silentLog.info('should NOT appear');
  silentLog.error('should appear');

  // 4. Error 对象作为 obj
  const err = new Error('boom');
  err.code = 'EBOOM';
  log.error(err, 'caught error');

  // 等 flush
  await new Promise(r => setTimeout(r, 50));

  // 读文件验证
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
  check('写入 7 条日志（info+warn+error+debug+child+silent-error+error-obj）', lines.length === 7);

  const events = lines.map(l => JSON.parse(l));

  // 验证 level 字段
  check('info level', events[0].level === 'info' && events[0].msg === 'msg-info');
  check('warn level + obj', events[1].level === 'warn' && events[1].w === 1 && events[1].msg === 'msg-warn');
  check('error level', events[2].level === 'error' && events[2].msg === 'msg-error');
  check('debug level + obj', events[3].level === 'debug' && events[3].d === 1);

  // 验证 child 字段合并
  const childEvent = events[4];
  check('child 合并 requestId', childEvent.requestId === 'r-1');
  check('child 合并 user', childEvent.user === 'alice');
  check('child obj 字段 action', childEvent.action === 'login');
  check('child msg', childEvent.msg === 'user logged in');

  // 验证 level 过滤
  const silentEvents = events.filter(e => e.component === 'silent');
  check('silent log 只保留 error（过滤掉 info）', silentEvents.length === 1 && silentEvents[0].level === 'error');

  // 验证 Error 对象
  const errEvent = events.find(e => e.msg === 'caught error');
  check('Error 对象被序列化', errEvent && errEvent.code === 'EBOOM');

  console.log('');
  console.log(`📊 logger 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();