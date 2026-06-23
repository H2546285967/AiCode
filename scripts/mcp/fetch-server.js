#!/usr/bin/env node
/**
 * 本地 Fetch MCP Server
 * 功能：抓取网页内容并返回纯文本
 * 依赖：Node.js 18+ 内置 fetch
 *
 * 工具：
 *   - fetch { url: string, maxLength?: number }
 *
 * @since v1.7.0 (2026-06-22)
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// ============================================================
// 安全配置
// ============================================================

// 默认黑名单：本地、内网、非公开地址
const DEFAULT_DENY_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
]);

function parseList(envVar) {
  if (!envVar) return [];
  return envVar.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

const ALLOWLIST = parseList(process.env.FETCH_ALLOWLIST);
const DENYLIST = parseList(process.env.FETCH_DENYLIST);

function isPrivateIP(ip) {
  // IPv4
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [, a, b, c, d] = m.map(Number);
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 127) return true;                         // 127.0.0.0/8
    if (a === 169 && b === 254) return true;            // 169.254.0.0/16
    if (a === 0) return true;                           // 0.0.0.0/8
    return false;
  }
  // IPv6 简单判断
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;  // fc00::/7
  if (ip.startsWith('fe80:')) return true;                      // fe80::/10
  if (ip === '::1') return true;
  return false;
}

function matchesPattern(host, pattern) {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return host === suffix || host.endsWith('.' + suffix);
  }
  return host === pattern;
}

function checkUrlAllowed(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    return { allowed: false, reason: 'URL 格式无效' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { allowed: false, reason: `不支持的协议: ${url.protocol}` };
  }

  const host = url.hostname.toLowerCase();

  if (DEFAULT_DENY_HOSTS.has(host) || isPrivateIP(host)) {
    return { allowed: false, reason: '禁止访问本地或内网地址' };
  }

  for (const denied of DENYLIST) {
    if (matchesPattern(host, denied)) {
      return { allowed: false, reason: `命中黑名单: ${denied}` };
    }
  }

  if (ALLOWLIST.length > 0) {
    const matched = ALLOWLIST.some(p => matchesPattern(host, p));
    if (!matched) {
      return { allowed: false, reason: `不在白名单中（FETCH_ALLOWLIST=${process.env.FETCH_ALLOWLIST}）` };
    }
  }

  return { allowed: true };
}

const server = new Server(
  { name: 'local-fetch-server', version: '1.0.0' },
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
        name: 'fetch',
        description: '抓取网页并返回纯文本内容',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: '要抓取的 URL' },
            maxLength: { type: 'number', description: '最大返回字符数，默认 5000' },
          },
          required: ['url'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'fetch') {
    throw new Error(`未知工具: ${request.params.name}`);
  }

  const { url, maxLength = 5000 } = request.params.arguments;

  const check = checkUrlAllowed(url);
  if (!check.allowed) {
    return {
      content: [
        { type: 'text', text: `请求被拒绝: ${check.reason}` },
      ],
      isError: true,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ai-workspace-fetch/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let text = '';

    if (contentType.includes('application/json')) {
      const json = await response.json();
      text = JSON.stringify(json, null, 2);
    } else {
      text = await response.text();
      // 简单 HTML 标签剥离
      text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                 .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                 .replace(/<[^>]+>/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
    }

    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n...（已截断）';
    }

    return {
      content: [
        { type: 'text', text },
      ],
    };
  } catch (e) {
    return {
      content: [
        { type: 'text', text: `抓取失败: ${e.message}` },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport).catch((e) => {
  console.error('[fetch-server] 启动失败:', e.message);
  process.exit(1);
});
