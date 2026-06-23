#!/usr/bin/env node
/**
 * MCP 失败路径测试
 * 验证 MCP server 异常时系统正确降级/暴露
 *
 * 覆盖：
 *   1. MCP server 命令不存在 → 连接失败
 *   2. 调用未知 tool → 返回错误而非崩溃
 *   3. SQLite 数据库路径无效 → 启动失败
 *
 * @since v1.7.0 (2026-06-22)
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

async function expectConnectionFailure(name, command, args) {
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StdioClientTransport({ command, args });
  try {
    await client.connect(transport);
    check(`${name}: 应该失败但没有`, false);
    await client.close();
  } catch (e) {
    check(`${name}: 失败被正确暴露`, true);
  }
}

(async () => {
  console.log('========================================');
  console.log('🔌 MCP 失败路径测试');
  console.log('========================================\n');

  const root = process.cwd().replace(/\\/g, '/');

  // 1. 命令不存在
  await expectConnectionFailure(
    'sqlite-server 命令不存在',
    'this-command-does-not-exist-12345',
    []
  );

  // 2. 调用未知 tool
  {
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(root, 'scripts/mcp/fetch-server.js').replace(/\\/g, '/')],
    });
    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'nonexistent_tool',
        arguments: {},
      });
      check('未知 tool 返回错误标记', result.isError === true);
      await client.close();
    } catch (e) {
      check('未知 tool 调用失败被暴露', true);
    }
  }

  // 3. fetch 访问本地地址应被拒绝（P0-2 安全白名单）
  {
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(root, 'scripts/mcp/fetch-server.js').replace(/\\/g, '/')],
    });
    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'fetch',
        arguments: { url: 'http://localhost:3000/secret' },
      });
      const text = result.content?.[0]?.text || '';
      check('fetch: 访问 localhost 被拒绝', result.isError === true && text.includes('拒绝'));
      await client.close();
    } catch (e) {
      check('fetch: 访问 localhost 异常被暴露', false);
    }
  }

  // 4. sqlite 数据库父路径是文件，应无法创建目录而启动失败
  await expectConnectionFailure(
    'sqlite 数据库父路径无效（是文件）',
    'node',
    [path.join(root, 'scripts/mcp/sqlite-server.js').replace(/\\/g, '/'), path.join(root, 'package.json/test.db').replace(/\\/g, '/')]
  );

  console.log(`\n📊 MCP 失败路径测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();
