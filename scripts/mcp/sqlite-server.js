#!/usr/bin/env node
/**
 * 本地 SQLite MCP Server
 * 功能：执行 SQL 查询和命令
 * 依赖：Node.js 22+ 内置 sqlite 模块
 *
 * 工具：
 *   - query { sql: string }
 *   - execute { sql: string }
 *
 * v1.9 接入 _shared.js：
 *   - safeCall 包装所有 tool handler
 *   - 自动接入 metrics（counter + timing）
 *   - 自动接入 logger（debug/warn）
 *   - 错误消息统一格式 "[local-sqlite-server/<tool>] ..."
 *
 * @since v1.7.0 (2026-06-22)
 * @changed v1.9.0 (2026-06-24) 接入 _shared.js 统一错误处理
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const sqlite = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// v1.9 P0-3 接入：统一 server 名（影响 metrics / logs 标签）
process.env.MCP_SERVER_NAME = 'local-sqlite-server';
const { safeCall } = require('./_shared');

const dbPath = process.argv[2];
if (!dbPath) {
  console.error('用法: node sqlite-server.js <db-path>');
  process.exit(1);
}

// 自动创建数据库文件所在目录，避免父目录不存在时崩溃
const dbDir = path.dirname(dbPath);
try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (e) {
  console.error(`[sqlite-server] 无法创建数据库目录 ${dbDir}: ${e.message}`);
  process.exit(1);
}

const db = new sqlite.DatabaseSync(dbPath);

const server = new Server(
  { name: 'local-sqlite-server', version: '1.0.0' },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query',
        description: '执行只读 SQL 查询',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SELECT 语句' },
          },
          required: ['sql'],
        },
      },
      {
        name: 'execute',
        description: '执行写操作 SQL',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'INSERT/UPDATE/CREATE 等语句' },
          },
          required: ['sql'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'query') {
    return safeCall('query', args, () => {
      const stmt = db.prepare(args.sql);
      const rows = stmt.all();
      return {
        content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }],
      };
    });
  }

  if (name === 'execute') {
    return safeCall('execute', args, () => {
      const result = db.exec(args.sql);
      return {
        content: [{ type: 'text', text: `执行成功，影响行数: ${result}` }],
      };
    });
  }

  // 未知工具：直接抛（safeCall 也会接，但显式抛更清晰）
  throw new Error(`未知工具: ${name}`);
});

const transport = new StdioServerTransport();
server.connect(transport).catch((e) => {
  console.error('[sqlite-server] 启动失败:', e.message);
  process.exit(1);
});
