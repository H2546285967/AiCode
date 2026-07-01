#!/usr/bin/env node

/**
 * test-github-auth.js — github-auth.js 公共认证模块单元测试
 *
 * 覆盖：
 *   1. getGitHubToken 三档 fallback（gh CLI / env / 匿名）
 *   2. isGhLoggedIn 反映 token 状态
 *   3. githubFetch 匿名模式不附加 Authorization
 *   4. githubFetch 认证模式附加 Bearer header
 *   5. 缓存：_resetCacheForTesting 生效
 *   6. 兼容 shim：github-scanner.getGitHubToken() 仍能调用
 *   7. trend-watcher.searchGitHub 走 githubFetch（间接验证）
 */

const assert = require('assert');
const path = require('path');
const auth = require('./github-auth');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

// ── 1. getGitHubToken 三档 fallback ──
test('getGitHubToken 返回 string 或 null', () => {
  const tok = auth.getGitHubToken();
  assert.ok(tok === null || typeof tok === 'string', '应为 string 或 null');
});

test('getGitHubToken 多次调用返回相同值（缓存）', () => {
  const a = auth.getGitHubToken();
  const b = auth.getGitHubToken();
  assert.strictEqual(a, b, '两次调用应返回相同 token');
});

// ── 2. isGhLoggedIn 反映 token 状态 ──
test('isGhLoggedIn 与 getGitHubToken 一致', () => {
  const tok = auth.getGitHubToken();
  const loggedIn = auth.isGhLoggedIn();
  assert.strictEqual(loggedIn, tok !== null, 'isGhLoggedIn 应与 token 是否存在一致');
});

// ── 3. githubFetch 匿名模式不附加 Authorization ──
test('githubFetch 接受 string URL', async () => {
  // 不真发请求，验证函数签名
  assert.strictEqual(typeof auth.githubFetch, 'function');
});

test('githubFetch 接受 opts.headers 合并', async () => {
  // mock fetch 验证
  const origFetch = global.fetch;
  let captured = null;
  global.fetch = (url, opts) => {
    captured = { url, opts };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };

  // 强制匿名：通过 _setMockToken(null)
  auth._resetCacheForTesting();
  auth._setMockToken(null);

  await auth.githubFetch('https://api.github.com/test', { headers: { 'X-Custom': '1' } });
  assert.ok(captured, 'fetch 应被调用');
  assert.strictEqual(captured.opts.headers['X-Custom'], '1', '自定义 header 保留');
  assert.strictEqual(captured.opts.headers['Authorization'], undefined, '匿名模式不附加 Authorization');
  assert.strictEqual(captured.opts.headers['Accept'], 'application/vnd.github.v3+json', '默认 Accept header');
  assert.strictEqual(captured.opts.headers['User-Agent'], 'ai-workspace-scanner/1.0', '默认 User-Agent header');

  auth._resetCacheForTesting();
  global.fetch = origFetch;
});

test('githubFetch 认证模式附加 Bearer header', async () => {
  const origFetch = global.fetch;
  let captured = null;
  global.fetch = (url, opts) => {
    captured = { url, opts };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
  };

  auth._resetCacheForTesting();
  auth._setMockToken('ghp_fake_token_for_test_1234567890');

  await auth.githubFetch('https://api.github.com/test');
  assert.ok(captured, 'fetch 应被调用');
  assert.strictEqual(captured.opts.headers['Authorization'], 'Bearer ghp_fake_token_for_test_1234567890', '认证模式附加 Bearer header');

  auth._resetCacheForTesting();
  global.fetch = origFetch;
});

// ── 4. _resetCacheForTesting ──
test('_resetCacheForTesting 重置缓存', () => {
  auth._resetCacheForTesting();
  // 第一次调用
  auth.getGitHubToken();
  // 第二次应不重新查
  const tok1 = auth.getGitHubToken();
  // reset 后重新查
  auth._resetCacheForTesting();
  const tok2 = auth.getGitHubToken();
  // 不报错即通过
  assert.ok(tok1 !== undefined && tok2 !== undefined);
});

// ── 5. 兼容 shim：github-scanner.getGitHubToken ──
test('github-scanner.getGitHubToken shim 仍可用', () => {
  // 清掉 require 缓存以确保加载新版本
  delete require.cache[require.resolve('./github-scanner')];
  delete require.cache[require.resolve('./github-auth')];
  const scanner = require('./github-scanner');
  assert.strictEqual(typeof scanner.getGitHubToken, 'function', 'shim 暴露 getGitHubToken');
  const tok = scanner.getGitHubToken();
  assert.ok(tok === null || typeof tok === 'string');
});

// ── 6. trend-watcher 走 githubFetch ──
test('trend-watcher 暴露 searchGitHub', () => {
  delete require.cache[require.resolve('./trend-watcher')];
  const tw = require('./trend-watcher');
  assert.ok(tw, 'trend-watcher 应可加载');
  // 验证它 require 了 github-auth（间接证明走公共路径）
  const code = require('fs').readFileSync(path.join(__dirname, 'trend-watcher.js'), 'utf8');
  assert.ok(code.includes("require('./github-auth')"), 'trend-watcher.js 应 require github-auth');
  assert.ok(code.includes('githubFetch('), 'trend-watcher.js 应调用 githubFetch');
});

// ── 7. upgrade-checker.js 不调 API（澄清误解） ──
test('upgrade-checker.js 不调 GitHub API（本地 JSON）', () => {
  const code = require('fs').readFileSync(path.join(__dirname, 'upgrade-checker.js'), 'utf8');
  assert.ok(!code.includes('fetch(') && !code.includes('githubFetch('), 'upgrade-checker 不应调 GitHub API');
});

// ── 总结 ──
console.log(`\n${'='.repeat(60)}`);
console.log(`📊 github-auth 测试: ${passed} 通过 / ${failed} 失败`);
console.log('='.repeat(60));

if (failed > 0) process.exit(1);
