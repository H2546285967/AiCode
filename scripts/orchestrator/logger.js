#!/usr/bin/env node
/**
 * 结构化日志（v1.9 P1-1）
 *
 * 作用：
 *   - 提供 pino 兼容的最小 API 子集（info / warn / error / debug）
 *   - 输出 JSON Lines 到 logs/app.jsonl（每行一个事件）
 *   - 同一 logger 实例自动加 component + 时间戳 + level
 *   - 支持 child() 创建子 logger（带绑定字段）
 *
 * 用法：
 *   const log = require('./logger');
 *   const logger = log.createLogger('mcp');
 *   logger.info({ tool: 'fetch', url }, 'fetched');
 *   logger.error({ err: e }, 'failed');
 *
 * 设计原则（v1.9）：
 *   - 零依赖（pino 不引）
 *   - JSON 输出（机器可读 + 可被 dashboard 聚合）
 *   - 写失败不抛（catch 后退到 console.error）
 *
 * @since v1.9.0 (2026-06-24) P1-1
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.jsonl');

const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
const DEFAULT_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * 创建 logger
 * @param {string} component  组件名（如 'mcp', 'dispatcher'）
 * @param {object} [opts]
 * @param {string} [opts.level]  默认 'info'
 * @returns {object} logger
 */
function createLogger(component, opts = {}) {
  const level = LEVELS[opts.level || DEFAULT_LEVEL] || LEVELS.info;

  function log(levelName, obj, msg) {
    if (LEVELS[levelName] < level) return;

    const event = {
      ts: new Date().toISOString(),
      level: levelName,
      component,
      ...(typeof obj === 'object' && obj !== null ? obj : {}),
    };
    // 第二参数是 string 时，把它当 msg
    if (typeof obj === 'string') msg = obj;
    if (msg) event.msg = msg;

    try {
      if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
      fs.appendFileSync(LOG_FILE, JSON.stringify(event) + '\n');
    } catch (e) {
      // 写失败退到 stderr（不要污染主流程）
      process.stderr.write(`[logger] write failed: ${e.message}\n`);
    }

    // 高 level 同时打 stderr（便于本地调试）
    if (LEVELS[levelName] >= LEVELS.warn) {
      process.stderr.write(JSON.stringify(event) + '\n');
    }
  }

  // pino 兼容的 level 方法
  const methods = {};
  for (const lvl of Object.keys(LEVELS)) {
    methods[lvl] = (obj, msg) => log(lvl, obj, msg);
  }

  // child：绑定额外字段
  methods.child = (bindings) => {
    const childLogger = createLogger(component, opts);
    const origMethods = { ...methods };
    for (const lvl of Object.keys(LEVELS)) {
      childLogger[lvl] = (obj, msg) => {
        const merged = typeof obj === 'object' && obj !== null
          ? { ...bindings, ...obj }
          : { ...bindings };
        log(lvl, merged, typeof obj === 'string' ? obj : msg);
      };
    }
    return childLogger;
  };

  return methods;
}

module.exports = { createLogger, LOG_FILE, LOG_DIR };

// ==================== CLI 自测 ====================
if (require.main === module) {
  const log = createLogger('self-test');
  log.info('hello info');
  log.info({ tool: 'fetch', url: 'http://x' }, 'fetched url');
  log.warn({ count: 3 }, 'something to watch');
  log.error(new Error('mock'), 'got error'); // 错误对象作为 obj

  // child
  const child = log.child({ requestId: 'abc-123' });
  child.info('child log');

  // level 过滤
  const debugLog = createLogger('debug-test', { level: 'debug' });
  debugLog.debug('this should appear');
  debugLog.trace('this should NOT appear'); // trace < debug

  console.log('✅ logger self-test 完成，查看 logs/app.jsonl');
}