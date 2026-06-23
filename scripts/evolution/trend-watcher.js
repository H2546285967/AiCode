#!/usr/bin/env node

/**
 * Trend Watcher — 持续感知层（防闭门造车）
 *
 * 三层感知机制：
 *   Layer 1: 每日扫描 — 轻量对比已实现特性 vs GitHub 新趋势
 *   Layer 2: 每周对比 — 深度分析哪些可能过时
 *   Layer 3: 月度审计 — 战略级分析，输出报告
 *
 * 用法：
 *   node trend-watcher.js daily        # 每日轻量检查
 *   node trend-watcher.js weekly       # 每周深度对比
 *   node trend-watcher.js monthly      # 月度战略审计
 *   node trend-watcher.js check        # 自动判断执行哪一层
 *   node trend-watcher.js status       # 查看已实现特性状态
 */

const fs = require('fs')
const path = require('path')

// ── 配置 ──────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..')
const DATA_DIR = path.join(WORKSPACE_ROOT, 'data', 'github')
const EVOLVED_FEATURES_FILE = path.join(DATA_DIR, 'evolved-features.json')
const TREND_WATCH_LOG = path.join(DATA_DIR, 'trend-watch-log.json')
const TREND_REPORTS_DIR = path.join(DATA_DIR, 'trend-reports')

const GITHUB_API = 'https://api.github.com'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString()
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

// ── 数据加载 ──────────────────────────────────────────

function loadEvolvedFeatures() {
  try {
    return JSON.parse(fs.readFileSync(EVOLVED_FEATURES_FILE, 'utf8'))
  } catch {
    return { features: [] }
  }
}

function saveEvolvedFeatures(data) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(EVOLVED_FEATURES_FILE, JSON.stringify(data, null, 2))
}

function loadWatchLog() {
  try {
    return JSON.parse(fs.readFileSync(TREND_WATCH_LOG, 'utf8'))
  } catch {
    return { entries: [], lastDaily: null, lastWeekly: null, lastMonthly: null }
  }
}

function saveWatchLog(data) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(TREND_WATCH_LOG, JSON.stringify(data, null, 2))
}

// ── GitHub 搜索 ───────────────────────────────────────

async function searchGitHub(keyword, perPage = 5) {
  const encoded = encodeURIComponent(keyword)
  const url = `${GITHUB_API}/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=${perPage}`

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'ai-workspace-scanner/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (resp.status === 403) {
      console.warn(`  ⚠ API 限流，跳过: ${keyword}`)
      return []
    }

    if (!resp.ok) return []

    const data = await resp.json()
    return (data.items || []).map(item => ({
      full_name: item.full_name,
      description: item.description,
      stargazers_count: item.stargazers_count,
      language: item.language,
      updated_at: item.updated_at,
      html_url: item.html_url,
    }))
  } catch {
    return []
  }
}

// ── Layer 1: 每日轻量检查 ─────────────────────────────

async function dailyCheck() {
  console.log('\n👁️  Layer 1: 每日轻量检查')
  console.log('='.repeat(50))

  const features = loadEvolvedFeatures()
  if (features.features.length === 0) {
    console.log('  ⚠ 暂无已实现特性，跳过检查')
    return { alerts: [] }
  }

  const alerts = []
  const todayDate = today()

  for (const feature of features.features) {
    // 只检查 current 状态的
    if (feature.status !== 'current') continue

    // 用特性名称搜 GitHub
    const keywords = feature.github_keywords || [feature.feature]
    let found = []

    for (const kw of keywords.slice(0, 2)) { // 每个特性最多搜 2 个关键词
      const results = await searchGitHub(kw, 3)
      found.push(...results)
      await new Promise(r => setTimeout(r, 1000))
    }

    // 对比：有没有比我们源头更好的项目
    const sourceStars = feature.source_stars || 0
    const betterAlternatives = found.filter(r =>
      r.stargazers_count > sourceStars * 2 && // stars 是源头的 2 倍以上
      r.full_name !== feature.source_repo
    )

    if (betterAlternatives.length > 0) {
      alerts.push({
        feature: feature.feature,
        type: 'potential_upgrade',
        alternatives: betterAlternatives.map(a => ({
          name: a.full_name,
          stars: a.stargazers_count,
          description: a.description,
        })),
        checked_at: todayDate,
      })
      console.log(`  ⚠ ${feature.feature}: 发现 ${betterAlternatives.length} 个更强的替代方案`)
    } else {
      console.log(`  ✅ ${feature.feature}: 无替代方案，保持当前`)
    }

    // 更新 last_checked
    feature.last_checked = todayDate
  }

  // 保存更新
  saveEvolvedFeatures(features)

  // 记录日志
  const log = loadWatchLog()
  log.entries.push({
    date: todayDate,
    timestamp: now(),
    layer: 'daily',
    alerts: alerts.length,
  })
  log.lastDaily = todayDate
  saveWatchLog(log)

  console.log(`\n  📊 检查完成: ${features.features.length} 个特性, ${alerts.length} 个警报`)
  return { alerts }
}

// ── Layer 2: 每周深度对比 ─────────────────────────────

async function weeklyCheck() {
  console.log('\n🔍 Layer 2: 每周深度对比')
  console.log('='.repeat(50))

  const features = loadEvolvedFeatures()
  if (features.features.length === 0) {
    console.log('  ⚠ 暂无已实现特性，跳过检查')
    return { outdated: [] }
  }

  const outdated = []
  const todayDate = today()

  for (const feature of features.features) {
    if (feature.status !== 'current') continue

    console.log(`\n  🔍 分析: ${feature.feature}`)

    // 用多个关键词搜索
    const keywords = feature.github_keywords || [feature.feature]
    let allResults = []

    for (const kw of keywords) {
      const results = await searchGitHub(kw, 5)
      allResults.push(...results)
      await new Promise(r => setTimeout(r, 1000))
    }

    // 去重
    const unique = new Map()
    for (const r of allResults) {
      if (!unique.has(r.full_name)) {
        unique.set(r.full_name, r)
      }
    }

    // 分析
    const sourceStars = feature.source_stars || 0
    const alternatives = []

    for (const [, repo] of unique) {
      if (repo.full_name === feature.source_repo) continue

      // 判断是否是更好的替代
      const isBetter = repo.stargazers_count > sourceStars * 1.5
      const isMoreActive = new Date(repo.updated_at) > new Date(daysAgo(30))

      if (isBetter && isMoreActive) {
        alternatives.push({
          name: repo.full_name,
          stars: repo.stargazers_count,
          description: repo.description,
          updated: repo.updated_at,
        })
      }
    }

    if (alternatives.length > 0) {
      // 按 stars 排序
      alternatives.sort((a, b) => b.stars - a.stars)

      outdated.push({
        feature: feature.feature,
        source_repo: feature.source_repo,
        alternatives: alternatives,
        checked_at: todayDate,
      })

      feature.status = 'outdated'
      feature.alternatives_found = alternatives.map(a => a.name)

      console.log(`    ⚠ 发现 ${alternatives.length} 个替代方案:`)
      for (const a of alternatives.slice(0, 3)) {
        console.log(`      ${a.name} (⭐${a.stars})`)
      }
    } else {
      console.log(`    ✅ 无更好替代方案`)
    }
  }

  // 保存
  saveEvolvedFeatures(features)

  // 生成报告
  if (outdated.length > 0) {
    const reportDir = path.join(TREND_REPORTS_DIR, 'weekly')
    ensureDir(reportDir)
    const reportFile = path.join(reportDir, `weekly-${todayDate}.md`)

    let report = `# 每周趋势对比报告\n\n`
    report += `> 生成时间: ${now()}\n\n`
    report += `## 可能过时的特性 (${outdated.length} 个)\n\n`

    for (const item of outdated) {
      report += `### ${item.feature}\n\n`
      report += `- 当前来源: ${item.source_repo}\n`
      report += `- 替代方案:\n`
      for (const a of item.alternatives) {
        report += `  - [${a.name}](https://github.com/${a.name}) (⭐${a.stars})\n`
      }
      report += '\n'
    }

    fs.writeFileSync(reportFile, report)
    console.log(`\n  📄 报告已生成: ${reportFile}`)
  }

  // 记录日志
  const log = loadWatchLog()
  log.entries.push({
    date: todayDate,
    timestamp: now(),
    layer: 'weekly',
    outdated: outdated.length,
  })
  log.lastWeekly = todayDate
  saveWatchLog(log)

  console.log(`\n  📊 深度对比完成: ${outdated.length} 个可能过时`)
  return { outdated }
}

// ── Layer 3: 月度审计 ─────────────────────────────────

async function monthlyAudit() {
  console.log('\n📊 Layer 3: 月度战略审计')
  console.log('='.repeat(50))

  const features = loadEvolvedFeatures()
  const log = loadWatchLog()
  const todayDate = today()

  // 统计
  const stats = {
    total: features.features.length,
    current: features.features.filter(f => f.status === 'current').length,
    outdated: features.features.filter(f => f.status === 'outdated').length,
    superseded: features.features.filter(f => f.status === 'superseded').length,
  }

  console.log('\n  📈 特性状态分布：')
  console.log(`    总计: ${stats.total}`)
  console.log(`    ✅ 当前: ${stats.current}`)
  console.log(`    ⚠️  可能过时: ${stats.outdated}`)
  console.log(`    🔄 需升级: ${stats.superseded}`)

  // 检查哪些方向突然火了但我们还没跟上
  console.log('\n  🔍 检查热门方向...')
  const hotKeywords = [
    'claude code memory',
    'claude code agent',
    'claude code mcp',
    'claude code automation',
    'claude code hooks',
  ]

  const trending = []
  for (const kw of hotKeywords) {
    const results = await searchGitHub(kw, 5)
    trending.push(...results)
    await new Promise(r => setTimeout(r, 1000))
  }

  // 找到我们没有实现的热门项目
  const implementedRepos = new Set(features.features.map(f => f.source_repo))
  const newTrending = trending.filter(r =>
    r.stargazers_count > 50 && !implementedRepos.has(r.full_name)
  )

  if (newTrending.length > 0) {
    console.log(`\n  🔥 发现 ${newTrending.length} 个热门但我们未实现的项目:`)
    for (const r of newTrending.slice(0, 5)) {
      console.log(`    ${r.full_name} (⭐${r.stargazers_count}) — ${r.description?.slice(0, 60) || ''}`)
    }
  } else {
    console.log('  ✅ 没有发现需要关注的新热门项目')
  }

  // 生成月度报告
  const reportDir = path.join(TREND_REPORTS_DIR, 'monthly')
  ensureDir(reportDir)
  const reportFile = path.join(reportDir, `monthly-${todayDate}.md`)

  let report = `# 月度进化审计报告\n\n`
  report += `> 生成时间: ${now()}\n\n`
  report += `## 特性状态\n\n`
  report += `| 状态 | 数量 |\n|:-----|:-----|\n`
  report += `| ✅ 当前 | ${stats.current} |\n`
  report += `| ⚠️ 过时 | ${stats.outdated} |\n`
  report += `| 🔄 需升级 | ${stats.superseded} |\n`
  report += `| **总计** | **${stats.total}** |\n\n`

  if (newTrending.length > 0) {
    report += `## 未实现的热门项目\n\n`
    for (const r of newTrending.slice(0, 10)) {
      report += `- [${r.full_name}](https://github.com/${r.full_name}) (⭐${r.stargazers_count}) — ${r.description || ''}\n`
    }
  }

  report += `\n## 建议\n\n`
  if (stats.outdated > 0) {
    report += `- 考虑升级 ${stats.outdated} 个可能过时的特性\n`
  }
  if (newTrending.length > 0) {
    report += `- 关注 ${newTrending.length} 个新热门项目\n`
  }
  if (stats.outdated === 0 && newTrending.length === 0) {
    report += `- 当前状态良好，继续保持\n`
  }

  fs.writeFileSync(reportFile, report)
  console.log(`\n  📄 报告已生成: ${reportFile}`)

  // 记录日志
  log.entries.push({
    date: todayDate,
    timestamp: now(),
    layer: 'monthly',
    stats,
    new_trending: newTrending.length,
  })
  log.lastMonthly = todayDate
  saveWatchLog(log)

  return { stats, newTrending }
}

// ── 自动判断 ──────────────────────────────────────────

async function autoCheck() {
  const log = loadWatchLog()
  const todayDate = today()
  const now = new Date()

  // 检查上次执行时间
  const lastDaily = log.lastDaily ? new Date(log.lastDaily) : null
  const lastWeekly = log.lastWeekly ? new Date(log.lastWeekly) : null
  const lastMonthly = log.lastMonthly ? new Date(log.lastMonthly) : null

  const dayOfWeek = now.getDay() // 0=Sunday
  const dayOfMonth = now.getDate()

  // Layer 3: 月度（每月 1 号）
  if (dayOfMonth === 1 && (!lastMonthly || lastMonthly.getMonth() < now.getMonth())) {
    await monthlyAudit()
    return
  }

  // Layer 2: 每周（周日）
  if (dayOfWeek === 0 && (!lastWeekly || (now - lastWeekly) > 5 * 24 * 60 * 60 * 1000)) {
    await weeklyCheck()
    return
  }

  // Layer 1: 每日
  if (!lastDaily || lastDaily.toDateString() !== now.toDateString()) {
    await dailyCheck()
    return
  }

  console.log('  ℹ 今天已检查过，无需重复')
}

// ── 状态 ──────────────────────────────────────────────

function status() {
  const features = loadEvolvedFeatures()
  const log = loadWatchLog()

  console.log('\n👁️  持续感知状态：')
  console.log('='.repeat(50))
  console.log(`  已实现特性: ${features.features.length}`)
  console.log(`  当前: ${features.features.filter(f => f.status === 'current').length}`)
  console.log(`  过时: ${features.features.filter(f => f.status === 'outdated').length}`)
  console.log(`  需升级: ${features.features.filter(f => f.status === 'superseded').length}`)
  console.log(`\n  检查历史:`)
  console.log(`    上次每日检查: ${log.lastDaily || '从未'}`)
  console.log(`    上次每周检查: ${log.lastWeekly || '从未'}`)
  console.log(`    上次月度审计: ${log.lastMonthly || '从未'}`)
  console.log(`    总检查次数: ${log.entries.length}`)
}

// ── CLI ───────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0] || 'check'

  switch (cmd) {
    case 'daily':
      await dailyCheck()
      break
    case 'weekly':
      await weeklyCheck()
      break
    case 'monthly':
      await monthlyAudit()
      break
    case 'check':
      await autoCheck()
      break
    case 'status':
      status()
      break
    default:
      console.log(`
AiCode 持续感知引擎 v1.0

用法：
  node trend-watcher.js check     # 自动判断执行哪一层
  node trend-watcher.js daily     # 每日轻量检查
  node trend-watcher.js weekly    # 每周深度对比
  node trend-watcher.js monthly   # 月度战略审计
  node trend-watcher.js status    # 查看状态
`)
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ 执行失败:', err.message)
    process.exit(1)
  })
}

module.exports = { dailyCheck, weeklyCheck, monthlyAudit, autoCheck, status }
