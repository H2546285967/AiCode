#!/usr/bin/env node

/**
 * GitHub Auth — 公共 GitHub Token 读取器
 *
 * 优先级：
 *   1. `gh auth token`（gh CLI 已登录时返回 token）— 推荐路径
 *   2. 环境变量 GH_TOKEN / GITHUB_TOKEN（fallback）
 *   3. null（匿名模式，限流 60 次/小时）
 *
 * 配套：
 *   - github-scanner.js — 主扫描器（M18）
 *   - trend-watcher.js — 持续感知（v3.0.5+）
 *   - upgrade-checker.js — 升级评估（仅本地 JSON，不调 API）
 *
 * 用法：
 *   const { getGitHubToken, githubFetch } = require('./github-auth');
 *   const token = getGitHubToken();
 *   const resp = await githubFetch(url);
 */

const { execSync } = require('child_process');

let _cachedToken = null;
let _tokenChecked = false;
let _mockToken = undefined; // 测试用：未定义时走正常 fallback

/**
 * 读 GitHub Token（通过 gh CLI 拿，不进对话）
 * @returns {string|null}
 */
function getGitHubToken() {
  // 测试 mock 优先
  if (_mockToken !== undefined) return _mockToken;

  if (_tokenChecked) return _cachedToken;
  _tokenChecked = true;

  // 1. gh auth token
  try {
    const out = execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const tok = (out || '').trim();
    if (tok && tok.length > 10) {
      _cachedToken = tok;
      return tok;
    }
  } catch { /* gh 未登录或不存在 */ }

  // 2. 环境变量
  const envTok = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (envTok && envTok.length > 10) {
    _cachedToken = envTok;
    return envTok;
  }

  // 3. 匿名
  _cachedToken = null;
  return null;
}

/**
 * 检查 gh CLI 是否已登录（仅给登录态判断，性能考虑另开缓存）
 * @returns {boolean}
 */
function isGhLoggedIn() {
  return getGitHubToken() !== null;
}

/**
 * 带认证的 fetch（token 存在时附加 Authorization header）
 * @param {string} url
 * @param {object} [opts] - 同 fetch options
 * @returns {Promise<Response>}
 */
async function githubFetch(url, opts = {}) {
  const headers = {
    'User-Agent': 'ai-workspace-scanner/1.0',
    'Accept': 'application/vnd.github.v3+json',
    ...(opts.headers || {}),
  };

  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...opts, headers });
}

// ── Reset（仅供测试用） ─────────────────────────────────

/**
 * 重置 token 缓存（测试时换 token 用）
 * 仅 module 内部测试暴露，生产代码不应调
 */
function _resetCacheForTesting() {
  _cachedToken = null;
  _tokenChecked = false;
  _mockToken = undefined;
}

/**
 * Mock token（测试专用）— null 强制匿名，string 强制 token
 */
function _setMockToken(value) {
  _mockToken = value;
}

module.exports = {
  getGitHubToken,
  isGhLoggedIn,
  githubFetch,
  _resetCacheForTesting,
  _setMockToken,
};
