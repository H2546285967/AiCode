#!/usr/bin/env node

/**
 * GitHub Scanner — 从 GitHub Trending + Search API 抓取 Claude 相关项目
 *
 * 数据源：
 *   1. GitHub Trending（HTML 解析）
 *   2. GitHub Search API（按关键词搜索）
 *
 * 输出：data/github/trending.json
 *
 * 用法：
 *   node github-scanner.js              # 完整扫描
 *   node github-scanner.js --trending   # 只扫 Trending
 *   node github-scanner.js --search     # 只搜 Search API
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { getGitHubToken, githubFetch: _ghFetch } = require('./github-auth')

// ── 配置 ──────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'github')
const TRENDING_FILE = path.join(DATA_DIR, 'trending.json')
const CACHE_FILE = path.join(DATA_DIR, 'scanner-cache.json')

// v3.0.2 M18 + v3.0.5 M35-scan-coverage:
//   - 能力导向关键词（不硬绑 claude）→ 让 Hermes/Nous Research 类项目可入扫描
//   - 保留原 claude 硬匹配词组（向后兼容）
const SEARCH_KEYWORDS = [
  // ── Claude 硬匹配（保留 M18 历史行为）──
  'claude code', 'claude-code', 'claude code extensions',
  'claude code hooks', 'claude code agent', 'claude code mcp',
  'claude code automation', 'claude code self-improvement',
  'claude memory', 'claude code tools',
  'anthropic claude code', 'claude code custom',
  // ── M35-scan-coverage 新增：能力导向（不绑 claude）──
  'agent memory system',      // Hermes / MemGPT / Letta 类
  'agent orchestration',      // Swarm / MetaGPT 类
  'ai agent framework',       // AutoGPT / LangChain Agents
  'mcp server',               // 通用 MCP（不绑 claude）
  'claude code alternative',  // Aider / Cursor CLI / Continue
  'ai coding assistant',      // 通用 AI 编程
  'llm agent tools',          // LLM 工具链
  'context engineering',      // 上下文工程（2026 热门词）
]

const GITHUB_API = 'https://api.github.com'
const GITHUB_TRENDING = 'https://github.com/trending'

// v3.0.5 M35: 能力导向关键词 — 用于 calcRelevance 加分
//   Hermes 这类项目描述里多半会含 "agent memory" / "memory system" / "agent orchestration"
const CAPABILITY_KEYWORDS = [
  'memory', 'agent', 'automation', 'orchestration', 'extension',
  'hook', 'mcp', 'tool', 'self-improve', 'self-evolve',
  'context', 'vector', 'rag', 'workflow', 'dispatcher',
]

// ── GitHub Auth（v3.0.2 M18）────────────────────────────

/**
 * v3.0.5 M18 auth 已迁出至 ./github-auth（P0-005 公共化）
 *   本文件顶部已 require 解构，新代码请直接用 getGitHubToken
 *   （保留 JSDoc 仅作实现参考）
 */

/**
 * 测试 gh CLI 是否已登录（给用户友好提示用）
 * @returns {boolean}
 */
function isGhLoggedIn() {
  try {
    execSync('gh auth status', { stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * 构建带 token 的 headers（如有）
 * @param {object} baseHeaders
 * @returns {object}
 */
function authHeaders(baseHeaders) {
  const headers = { ...baseHeaders };
  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

// ── 工具函数 ──────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return { seen: {}, lastScan: null }
  }
}

function saveCache(cache) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// ── 相关度评分 ────────────────────────────────────────

// v3.0.5 M35: calcRelevance v2 — 能力加权 + 新星加成
//   - 旧版 (v1)：硬绑 "claude" 关键词，没 "claude" 字样的能力项目直接低分
//   - 新版 (v2)：CAPABILITY_KEYWORDS 在 desc/topics 命中也加分 → Hermes 类项目可入
//   - 新星加成：created_at 距今 < 30 天且 stars > 30 → +3（24h 增长项目探测）
function calcRelevance(repo) {
  let score = 0
  const name = (repo.full_name || '').toLowerCase()
  const desc = (repo.description || '').toLowerCase()
  const topics = (repo.topics || []).map(t => t.toLowerCase())
  const combined = `${name} ${desc} ${topics.join(' ')}`

  // ── 名称匹配（v1 保留）──
  if (name.includes('claude-code') || name.includes('claude_code')) score += 10
  else if (name.includes('claude') && /(extension|hook|tool|agent|mcp|memory)/i.test(name)) score += 8
  else if (name.includes('claude')) score += 5
  else if (name.includes('mcp') && name.includes('claude')) score += 7

  // ── topics 匹配（v1 保留）──
  if (topics.some(t => t.includes('claude'))) score += 5
  if (topics.some(t => t.includes('mcp'))) score += 3
  if (topics.some(t => /(agent|memory|automation|extension)/i.test(t))) score += 3

  // ── M35 新增：能力导向关键词命中 ──
  //   Hermes / Nous Research 类项目：name 不含 claude，但 desc 含 "agent memory system"
  //   → 不绑死关键词，能力词命中就给分（解决盲区 #1）
  const capHits = CAPABILITY_KEYWORDS.filter(kw => combined.includes(kw)).length
  if (capHits >= 3) score += 5       // 3+ 个能力词命中 → 强信号
  else if (capHits === 2) score += 3  // 2 个能力词命中
  else if (capHits === 1) score += 1  // 1 个能力词命中

  // ── M35 新增：新星加成（探测 30 天内新晋项目）──
  //   解决盲区 #2：star 总量不高但 24h 增长快的新项目
  if (repo.created_at) {
    const ageMs = Date.now() - new Date(repo.created_at).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays <= 30 && (repo.stargazers_count || 0) >= 30) score += 3
  }

  // ── stars（v1 保留）──
  if (repo.stargazers_count > 100) score += 3
  else if (repo.stargazers_count > 30) score += 2
  else if (repo.stargazers_count > 10) score += 1

  // ── 活跃度（v1 保留）──
  if (repo.updated_at && new Date(repo.updated_at) > new Date(daysAgo(7))) score += 2
  if (repo.pushed_at && new Date(repo.pushed_at) > new Date(daysAgo(3))) score += 2

  // ── 语言（v1 保留）──
  const lang = (repo.language || '').toLowerCase()
  if (['javascript', 'typescript', 'shell', 'bash'].includes(lang)) score += 2

  // ── description 方向匹配（v1 保留，向后兼容）──
  if (/(memory|agent|automation|extension|hook|mcp)/i.test(desc)) score += 3

  return score
}

// ── GitHub Trending 解析 ──────────────────────────────

async function fetchTrending() {
  console.log('📡 抓取 GitHub Trending...')

  try {
    const headers = authHeaders({
      'User-Agent': 'Mozilla/5.0 (compatible; ai-workspace-scanner/1.0)',
      'Accept': 'text/html',
    });
    if (headers.Authorization) console.log('  🔑 使用 GitHub Token 认证');

    const resp = await fetch(GITHUB_TRENDING, { headers });

    if (!resp.ok) {
      console.warn(`  ⚠ Trending 返回 ${resp.status}，跳过`)
      return []
    }

    const html = await resp.text()
    return parseTrendingHTML(html)
  } catch (err) {
    console.warn(`  ⚠ Trending 抓取失败: ${err.message}`)
    return []
  }
}

function parseTrendingHTML(html) {
  const repos = []

  // 匹配 article 块中的 repo 信息
  // GitHub Trending 页面结构：<h2 class="h3 lh-condensed"> <a href="/owner/repo"> ...
  const repoPattern = /href="\/([^"\/]+\/[^"\/]+)"/g
  const seen = new Set()

  let match
  while ((match = repoPattern.exec(html)) !== null) {
    const fullName = match[1]
    // 过滤非 repo 链接
    if (fullName.includes('/') && !fullName.includes('.') && !seen.has(fullName)) {
      seen.add(fullName)
      repos.push({
        full_name: fullName,
        source: 'trending',
      })
    }
  }

  // 去重（Trending 页面可能有重复链接）
  const unique = []
  const namesSeen = new Set()
  for (const r of repos) {
    if (!namesSeen.has(r.full_name)) {
      namesSeen.add(r.full_name)
      unique.push(r)
    }
  }

  console.log(`  ✅ Trending 解析到 ${unique.length} 个 repo`)
  return unique
}

// ── GitHub Search API ─────────────────────────────────

async function searchGitHub(keyword, perPage = 10) {
  const encoded = encodeURIComponent(keyword)
  const url = `${GITHUB_API}/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=${perPage}`

  try {
    const headers = authHeaders({
      'User-Agent': 'ai-workspace-scanner/1.0',
      'Accept': 'application/vnd.github.v3+json',
    });

    const resp = await fetch(url, { headers });

    if (resp.status === 403) {
      const hasToken = !!getGitHubToken();
      const hint = hasToken
        ? '（token 已用但仍限流，可能超额）'
        : '（未认证模式 60 次/小时限制，建议 gh auth login）';
      console.warn(`  ⚠ API 限流，跳过关键词: ${keyword} ${hint}`);
      return []
    }

    if (!resp.ok) {
      console.warn(`  ⚠ 搜索 "${keyword}" 返回 ${resp.status}`)
      return []
    }

    const data = await resp.json()
    return (data.items || []).map(item => ({
      full_name: item.full_name,
      description: item.description,
      html_url: item.html_url,
      stargazers_count: item.stargazers_count,
      language: item.language,
      topics: item.topics || [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      pushed_at: item.pushed_at,
      source: 'search',
      matched_keyword: keyword,
    }))
  } catch (err) {
    console.warn(`  ⚠ 搜索 "${keyword}" 失败: ${err.message}`)
    return []
  }
}

async function fetchSearchResults() {
  console.log('🔍 搜索 GitHub 关键词...')

  const allRepos = []

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`  搜索: "${keyword}"`)
    const results = await searchGitHub(keyword)
    allRepos.push(...results)

    // GitHub API 限流保护：每请求间隔 1 秒
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`  ✅ 搜索共获取 ${allRepos.length} 条结果`)
  return allRepos
}

// ── 新星探测（M35-scan-coverage · 解决盲区 #2）─────────────────────
//
// 场景：Hermes 这种"24h 增长 50+ star 但总数还不高"的项目，
//       按 stars 总量排序搜不到 → 需要按 created_at 反向过滤
//
// 策略：GitHub Search API 支持 `created:>YYYY-MM-DD`，筛出最近 N 天创建的项目
//       按 stars 排序，取 top 30，再喂给 calcRelevance 二次过滤
//
// 实现要点：
//   - 默认查最近 7 天创建的项目（避免全表扫描）
//   - 按 stars desc 排序
//   - 每关键词间隔 1 秒（限流保护，复用 SEARCH_KEYWORDS 限流节奏）
async function detectRisingStars(opts = {}) {
  const days = opts.days || 7
  const perPage = opts.perPage || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  console.log(`🌟 新星探测 — 找最近 ${days} 天创建的项目（since=${since}）...`)

  try {
    // 查询语法：created:>YYYY-MM-DD 按 stars 排序
    //   不限定 keyword（只看新 + 高 star），让盲区项目也能浮现
    const q = `created:>${since}`
    const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`

    const headers = authHeaders({
      'User-Agent': 'ai-workspace-scanner/1.0',
      'Accept': 'application/vnd.github.v3+json',
    });

    const resp = await fetch(url, { headers });

    if (resp.status === 403) {
      console.warn(`  ⚠ 新星探测限流，跳过（建议 gh auth login）`)
      return []
    }

    if (!resp.ok) {
      console.warn(`  ⚠ 新星探测返回 ${resp.status}`)
      return []
    }

    const data = await resp.json()
    const repos = (data.items || []).map(item => ({
      full_name: item.full_name,
      description: item.description,
      html_url: item.html_url,
      stargazers_count: item.stargazers_count,
      language: item.language,
      topics: item.topics || [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      pushed_at: item.pushed_at,
      source: 'rising',
    }))

    console.log(`  ✅ 新星探测获取 ${repos.length} 个项目`)
    return repos
  } catch (err) {
    console.warn(`  ⚠ 新星探测失败: ${err.message}`)
    return []
  }
}

// ── 补全 Trending 的 repo 信息 ────────────────────────

async function enrichTrendingRepos(trendingRepos) {
  console.log(' enrich Trending repo 信息...')

  const enriched = []

  // 只 enrich 名称看起来和 Claude Code 生态相关的 repo，避免 832 次 API 调用
  const relevantPattern = /claude|mcp|agent|memory|automation|extension|hook|tool|anthropic/i
  const candidatesToEnrich = trendingRepos.filter(repo =>
    relevantPattern.test(repo.full_name) || relevantPattern.test(repo.description || '')
  )

  console.log(`  📌 命中相关过滤: ${candidatesToEnrich.length}/${trendingRepos.length} 个需要 enrich`)

  for (const repo of candidatesToEnrich) {
    // 对 Trending 里没搜到详细信息的，调 API 补全
    if (repo.stargazers_count !== undefined) {
      enriched.push(repo)
      continue
    }

    try {
      const url = `${GITHUB_API}/repos/${repo.full_name}`
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'ai-workspace-scanner/1.0',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (resp.ok) {
        const data = await resp.json()
        enriched.push({
          full_name: data.full_name,
          description: data.description,
          html_url: data.html_url,
          stargazers_count: data.stargazers_count,
          language: data.language,
          topics: data.topics || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          pushed_at: data.pushed_at,
          source: 'trending',
        })
      }

      await new Promise(r => setTimeout(r, 1000))
    } catch {
      // 补全失败就跳过
    }
  }

  // 未被 enrich 的 repo 也保留（带基本字段），后续评分会自然过滤掉低相关度的
  const enrichedNames = new Set(enriched.map(r => r.full_name))
  for (const repo of trendingRepos) {
    if (!enrichedNames.has(repo.full_name)) {
      enriched.push(repo)
    }
  }

  return enriched
}

// ── 去重 + 合并 + 评分 ───────────────────────────────

function dedupeAndScore(repos) {
  const map = new Map()

  for (const repo of repos) {
    const key = repo.full_name
    if (map.has(key)) {
      // 合并：保留信息更完整的
      const existing = map.get(key)
      if (!existing.stargazers_count && repo.stargazers_count) {
        map.set(key, { ...repo, source: `${existing.source}+${repo.source}` })
      }
    } else {
      map.set(key, repo)
    }
  }

  // 评分 + 过滤
  const scored = []
  for (const repo of map.values()) {
    const relevance = calcRelevance(repo)
    // 只保留相关度 >= 5 的
    if (relevance >= 5) {
      scored.push({
        ...repo,
        relevance_score: relevance,
      })
    }
  }

  // 按相关度排序，取 top 20
  scored.sort((a, b) => b.relevance_score - a.relevance_score)
  return scored.slice(0, 20)
}

// ── 保留历史（7天）──────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(TRENDING_FILE, 'utf8'))
  } catch {
    return { history: [] }
  }
}

function saveHistory(data) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(TRENDING_FILE, JSON.stringify(data, null, 2))
}

// ── 主入口 ────────────────────────────────────────────

async function scan(mode = 'full') {
  const scanDate = today()
  console.log(`\n🧬 AiCode 自我进化 — GitHub 扫描 (${scanDate})`)
  console.log('='.repeat(50))

  let trendingRepos = []
  let searchRepos = []
  let risingRepos = []

  // 1. Trending
  if (mode === 'full' || mode === 'trending') {
    trendingRepos = await fetchTrending()
    trendingRepos = await enrichTrendingRepos(trendingRepos)
  }

  // 2. Search API
  if (mode === 'full' || mode === 'search') {
    searchRepos = await fetchSearchResults()
  }

  // 3. v3.0.5 M35: 新星探测（最近 N 天创建 + 高 star）
  //    默认 full 模式才跑（避免 trending/search 单跑时多 1 次 API）
  if (mode === 'full' || mode === 'rising') {
    risingRepos = await detectRisingStars({ days: 7, perPage: 30 })
    // 限流保护
    await new Promise(r => setTimeout(r, 1000))
  }

  // 4. 合并去重 + 评分
  const allRepos = [...trendingRepos, ...searchRepos, ...risingRepos]
  const candidates = dedupeAndScore(allRepos)

  console.log(`\n📊 结果：${allRepos.length} 条原始（trending=${trendingRepos.length} + search=${searchRepos.length} + rising=${risingRepos.length}） → ${candidates.length} 个高相关候选`)

  // 5. 保存
  const history = loadHistory()
  const todayEntry = {
    date: scanDate,
    trending_count: trendingRepos.length,
    search_count: searchRepos.length,
    rising_count: risingRepos.length,
    candidates: candidates,
  }

  // 更新历史（保留最近 7 天）
  history.history = history.history.filter(h => {
    const d = new Date(h.date)
    return d > new Date(daysAgo(7))
  })
  history.history.push(todayEntry)
  history.lastScan = scanDate

  saveHistory(history)

  // 5. 输出当前候选
  console.log('\n🏆 今日高相关候选：')
  console.log('-'.repeat(50))
  for (const [i, c] of candidates.entries()) {
    const stars = c.stargazers_count || '?'
    console.log(`  ${i + 1}. [${c.relevance_score}分] ${c.full_name} (⭐${stars})`)
    if (c.description) console.log(`     ${c.description.slice(0, 80)}`)
  }
  console.log('-'.repeat(50))

  return candidates
}

// ── CLI ───────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  let mode = 'full'

  if (args.includes('--trending')) mode = 'trending'
  else if (args.includes('--search')) mode = 'search'

  // v3.0.2 M18: Token 状态检查（友好提示）
  if (isGhLoggedIn()) {
    console.log('🔑 检测到 gh CLI 已登录 — /evolve 走认证模式（5000 次/小时）');
  } else if (getGitHubToken()) {
    console.log('🔑 检测到 GH_TOKEN 环境变量 — /evolve 走认证模式');
  } else {
    console.log('⚠️  未配置 GitHub Token — /evolve 走匿名模式（60 次/小时限制）');
    console.log('   建议：gh auth login --web （token 存 Credential Manager，不进对话）');
  }
  console.log('');

  await scan(mode)
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ 扫描失败:', err.message)
    process.exit(1)
  })
}

module.exports = {
  scan,
  calcRelevance,
  parseTrendingHTML,
  fetchTrending,   // v3.0.2 M18（测试用）
  searchGitHub,    // v3.0.2 M18（测试用）
  detectRisingStars,  // v3.0.5 M35（测试用）
  SEARCH_KEYWORDS,
  CAPABILITY_KEYWORDS,  // v3.0.5 M35
  getGitHubToken,    // v3.0.2 M18
  isGhLoggedIn,      // v3.0.2 M18
  authHeaders,       // v3.0.2 M18
}
