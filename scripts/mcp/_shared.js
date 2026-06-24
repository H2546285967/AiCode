#!/usr/bin/env node
/**
 * MCP Server 共享工具（v1.9 P0-3）
 *
 * 提供：
 *   - safeHandle(name, fn): 包装 tool handler，统一错误处理
 *   - formatError(name, err): 标准化错误消息
 *   - logCall(name, args, durationMs, err): 统一日志格式
 *
 * 接入方式：
 *   const { safeHandle } = require('./_shared');
 *   server.setRequestHandler(CallToolRequestSchema, async (request) => {
 *     return safeHandle(request.params.name, async () => {
 *       // 原 tool 逻辑
 *     });
 *   });
 *
 * 设计原则：
 *   - 不改 tool handler 的业务逻辑
 *   - 错误信息包含 server 名 + 工具名 + 原始错误
 *   - 失败的 tool 返回 isError: true（不抛给 MCP 框架，避免连接中断）
 *
 * @since v1.9.0 (2026-06-24) P0-3
 */

const SERVER_NAME = process.env.MCP_SERVER_NAME || 'unknown-mcp';

/**
 * 标准化错误消息
 * @param {string} toolName
 * @param {Error|string} err
 * @returns {string}
 */
function formatError(toolName, err) {
  const msg = err instanceof Error ? err.message : String(err);
  return `[${SERVER_NAME}/${toolName}] ${msg}`;
}

/**
 * 统一日志：每次 tool 调用一行
 * 输出到 stderr（避免污染 MCP stdio 协议通道）
 * @param {string} toolName
 * @param {object} args
 * @param {number} durationMs
 * @param {Error|null} err
 */
function logCall(toolName, args, durationMs, err) {
  const argKeys = args ? Object.keys(args).join(',') : '';
  const status = err ? 'FAIL' : 'OK';
  const errMsg = err ? ` err="${err.message.replace(/"/g, '\\"').slice(0, 100)}"` : '';
  // 写到 stderr（mcp 协议用 stdin/stdout，stderr 不会被协议解析）
  process.stderr.write(
    `[${SERVER_NAME}] tool=${toolName} status=${status} duration=${durationMs}ms args={${argKeys}}${errMsg}\n`
  );
}

/**
 * 包装 tool handler，统一错误处理 + 日志
 *
 * @param {string} name  工具名
 * @param {(args: object) => Promise<object>} fn  业务逻辑，必须返回 MCP tool 响应对象
 * @returns {Promise<object>}  MCP tool 响应（成功或带 isError）
 */
async function safeHandle(name, fn) {
  const start = Date.now();
  let args = null;
  try {
    // 试着抓 args（fn 是 handler 时，第二个参数才是 args；这里简化）
    // 调用方可在 fn 内部通过闭包捕获 args
    const result = await fn(args);
    const duration = Date.now() - start;
    logCall(name, args, duration, null);
    emitMetricSafe(name, duration, false);
    emitLogSafe(name, duration, false, args);
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logCall(name, args, duration, err);
    emitMetricSafe(name, duration, true);
    emitLogSafe(name, duration, true, args);
    return {
      content: [
        { type: 'text', text: formatError(name, err) },
      ],
      isError: true,
    };
  }
}

/**
 * 改进版 safeHandle：把 args 通过 fn 闭包传入
 * @param {string} name
 * @param {object} args
 * @param {() => Promise<object>} fn
 */
async function safeCall(name, args, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logCall(name, args, duration, null);
    emitMetricSafe(name, duration, false);
    emitLogSafe(name, duration, false, args);
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logCall(name, args, duration, err);
    emitMetricSafe(name, duration, true);
    emitLogSafe(name, duration, true, args);
    return {
      content: [
        { type: 'text', text: formatError(name, err) },
      ],
      isError: true,
    };
  }
}

/**
 * 安全发送 metrics（失败不抛）
 */
function emitMetricSafe(name, durationMs, isError) {
  try {
    const Metrics = require('../orchestrator/metrics');
    Metrics.increment('mcp.tool.call', 1, { tool: name, error: String(isError) });
    Metrics.timing('mcp.tool.duration', durationMs, { tool: name });
  } catch { /* metrics 不可用不影响主流程 */ }
}

/**
 * 安全写日志（失败不抛）
 */
function emitLogSafe(name, durationMs, isError, args) {
  try {
    const { createLogger } = require('../orchestrator/logger');
    const log = createLogger('mcp');
    if (isError) {
      log.warn({ tool: name, durationMs, args }, 'mcp tool failed');
    } else {
      log.debug({ tool: name, durationMs }, 'mcp tool ok');
    }
  } catch { /* log 不可用不影响主流程 */ }
}

module.exports = { safeHandle, safeCall, formatError, logCall, SERVER_NAME };

// ==================== CLI 自测 ====================
if (require.main === module) {
  (async () => {
    // 测试 1：成功路径
    const r1 = await safeCall('test-ok', { foo: 'bar' }, async () => ({
      content: [{ type: 'text', text: 'success' }],
    }));
    if (r1.isError) { console.error('❌ 成功路径返回了 isError'); process.exit(1); }
    console.log('✅ 成功路径通过');

    // 测试 2：失败路径
    const r2 = await safeCall('test-fail', { x: 1 }, async () => {
      throw new Error('mock boom');
    });
    if (!r2.isError) { console.error('❌ 失败路径没返回 isError'); process.exit(1); }
    if (!r2.content[0].text.includes('mock boom')) { console.error('❌ 错误信息丢失'); process.exit(1); }
    console.log('✅ 失败路径通过');

    console.log('---');
    console.log('注意：stderr 输出来自 logCall（已通过 ✓）');
  })();
}