#!/usr/bin/env node
/**
 * MCP 集成测试（v1.9 C-3）
 *
 * 验证：调用 sqlite-server / fetch-server 后，
 *  metrics.jsonl 和 logs/app.jsonl 都正确记录
 *
 * 用法：
 *   node scripts/mcp/test-integration.js
 *
 * @since v1.9.0 (2026-06-24) C-3
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const ROOT = path.resolve(__dirname, '..', '..');
const METRICS_FILE = path.join(ROOT, 'logs', 'metrics.jsonl');
const LOG_FILE = path.join(ROOT, 'logs', 'app.jsonl');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

function readLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
}

function countByName(events, name) {
  return events.filter(e => e.name === name).length;
}

(async () => {
  // 1. 记录起始位置（用于后续断言）
  const metricsBefore = readLines(METRICS_FILE).map(l => JSON.parse(l));
  const logsBefore = readLines(LOG_FILE).map(l => JSON.parse(l));
  const metricsStartCount = metricsBefore.length;
  const logsStartCount = logsBefore.length;

  // 2. 调用 sqlite-server
  try {
    const client = new Client({ name: 'integration-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(ROOT, 'scripts/mcp/sqlite-server.js'), path.join(ROOT, 'data', 'workspace.db')],
    });
    await client.connect(transport);

    const result = await client.callTool({ name: 'execute', arguments: { sql: "CREATE TABLE IF NOT EXISTS integration_test (id INTEGER)" } });
    check('sqlite execute 调用成功', !result.isError);

    const result2 = await client.callTool({ name: 'query', arguments: { sql: 'SELECT count(*) FROM integration_test' } });
    check('sqlite query 调用成功', !result2.isError);

    await client.close();
  } catch (e) {
    check('sqlite 连接/调用', false);
    console.log('  err:', e.message);
  }

  // 3. 调用 fetch-server
  try {
    const client = new Client({ name: 'integration-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(ROOT, 'scripts/mcp/fetch-server.js')],
    });
    await client.connect(transport);

    const result = await client.callTool({ name: 'fetch', arguments: { url: 'https://example.com', maxLength: 200 } });
    check('fetch 调用成功', !result.isError);

    // 触发一个失败（localhost）
    const failResult = await client.callTool({ name: 'fetch', arguments: { url: 'http://localhost:3000' } });
    check('fetch 失败路径返回 isError', failResult.isError === true);
    // 错误消息格式: [server-name/tool-name] message
    check('fetch 错误消息含 [local-fetch-server/fetch]', failResult.content[0].text.includes('[local-fetch-server/fetch]'));

    await client.close();
  } catch (e) {
    check('fetch 连接/调用', false);
    console.log('  err:', e.message);
  }

  // 4. 等文件 flush
  await new Promise(r => setTimeout(r, 200));

  // 5. 验证 metrics 新增
  const metricsAfter = readLines(METRICS_FILE).map(l => JSON.parse(l));
  const newMetrics = metricsAfter.slice(metricsStartCount);
  check('metrics 至少新增 4 条（sqlite x2 + fetch x2）', newMetrics.length >= 4);

  const newCounterCount = countByName(newMetrics, 'mcp.tool.call');
  check(`metrics 新增 counter 至少 4 次（实际 ${newCounterCount}）`, newCounterCount >= 4);

  const newTimingCount = countByName(newMetrics, 'mcp.tool.duration');
  check(`metrics 新增 timing 至少 4 次（实际 ${newTimingCount}）`, newTimingCount >= 4);

  // 至少有一次 error tag
  const errorMetrics = newMetrics.filter(e => e.name === 'mcp.tool.call' && e.tags && e.tags.error === 'true');
  check('metrics 包含至少 1 条错误（fetch localhost）', errorMetrics.length >= 1);

  // 6. 验证 logs 新增
  // 注意：成功路径 log 级别是 debug，默认 LOG_LEVEL=info 会被过滤
  // 所以只验证至少 1 条 warn（来自 fetch 失败路径）
  const logsAfter = readLines(LOG_FILE).map(l => JSON.parse(l));
  const newLogs = logsAfter.slice(logsStartCount);
  const mcpLogs = newLogs.filter(e => e.component === 'mcp');
  check(`logs 来自 mcp 组件至少 1 条 warn（实际 ${mcpLogs.filter(e => e.level === 'warn').length}）`, mcpLogs.filter(e => e.level === 'warn').length >= 1);
  check(`logs 来自 mcp 组件总共至少 1 条（实际 ${mcpLogs.length}）`, mcpLogs.length >= 1);

  // 7. 工具名出现在 metrics/logs
  const fetchMetrics = newMetrics.filter(e => e.tags && e.tags.tool === 'fetch');
  const sqliteMetrics = newMetrics.filter(e => e.tags && (e.tags.tool === 'execute' || e.tags.tool === 'query'));
  check('metrics 含 fetch 工具调用', fetchMetrics.length >= 1);
  check('metrics 含 sqlite 工具调用', sqliteMetrics.length >= 1);

  console.log('');
  console.log(`📊 mcp 集成测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();