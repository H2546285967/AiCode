#!/usr/bin/env node

/**
 * Self Analyzer — 自我分析引擎（只读，不修改评估引擎）
 *
 * 分析进化历史并输出建议，但不会自动修改任何参数。
 * 所有调整都需要用户手动确认。
 *
 * 用法：
 *   node self-analyzer.js analyze    # 分析历史
 *   node self-analyzer.js keywords   # 关键词建议
 *   node self-analyzer.js weights    # 权重建议
 *   node self-analyzer.js run        # 完整分析
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'github')
const EVOLUTION_LOG_FILE = path.join(DATA_DIR, 'evolution-log.json')
const CANDIDATES_FILE = path.join(DATA_DIR, 'candidates.json')
const ANALYSIS_REPORT_FILE = path.join(DATA_DIR, 'analysis-reports', `report-${new Date().toISOString().slice(0, 10)}.md`)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString()
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadEvolutionLog() {
  try {
    return JSON.parse(fs.readFileSync(EVOLUTION_LOG_FILE, 'utf8'))
  } catch {
    return { entries: [] }
  }
}

function loadCandidates() {
  try {
    return JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8'))
  } catch {
    return { candidates: [] }
  }
}

// ── 分析 ──────────────────────────────────────

function analyze() {
  console.log('\n📊 进化历史分析')
  console.log('='.repeat(50))

  const log = loadEvolutionLog()
  const candidates = loadCandidates()

  console.log(`  进化记录: ${log.entries.length} 条`)
  console.log(`  当前候选: ${candidates.candidates?.length || 0} 个`)

  const adopted = (candidates.candidates || []).filter(c => c.suggestion === 'adopt')
  const adapted = (candidates.candidates || []).filter(c => c.suggestion === 'adapt')
  const skipped = (candidates.candidates || []).filter(c => c.suggestion === 'skip')

  console.log(`\n  采纳率: ${adopted.length}/${candidates.candidates?.length || 0}`)
  console.log(`    🟢 采纳: ${adopted.length}`)
  console.log(`    🟡 改造: ${adapted.length}`)
  console.log(`    🔴 跳过: ${skipped.length}`)

  // 关键词效果
  const keywordStats = {}
  for (const c of candidates.candidates || []) {
    if (c.matched_keyword) {
      if (!keywordStats[c.matched_keyword]) {
        keywordStats[c.matched_keyword] = { total: 0, adopted: 0, adapted: 0, skipped: 0 }
      }
      keywordStats[c.matched_keyword].total++
      if (c.suggestion === 'adopt') keywordStats[c.matched_keyword].adopted++
      else if (c.suggestion === 'adapt') keywordStats[c.matched_keyword].adapted++
      else keywordStats[c.matched_keyword].skipped++
    }
  }

  console.log('\n  关键词效果：')
  for (const [kw, stats] of Object.entries(keywordStats).sort((a, b) => b[1].total - a[1].total)) {
    const adoptRate = stats.total > 0 ? (stats.adopted / stats.total * 100).toFixed(0) : 0
    console.log(`    ${kw}: 总${stats.total} 采纳${stats.adopted} 改造${stats.adapted} 跳过${stats.skipped} (采纳率${adoptRate}%)`)
  }

  return { keywordStats }
}

// ── 关键词建议（不自动改） ────────────────────────

function suggestKeywords() {
  console.log('\n🔧 关键词建议（仅分析，不自动修改）')
  console.log('='.repeat(50))

  const { keywordStats } = analyze()

  const poorKeywords = []
  const goodKeywords = []
  const missingKeywords = []

  for (const [kw, stats] of Object.entries(keywordStats)) {
    const adoptRate = stats.total > 0 ? stats.adopted / stats.total : 0
    if (adoptRate < 0.2 && stats.total >= 3) {
      poorKeywords.push({ kw, adoptRate: (adoptRate * 100).toFixed(0) + '%' })
    } else if (adoptRate > 0.5 && stats.total >= 2) {
      goodKeywords.push({ kw, adoptRate: (adoptRate * 100).toFixed(0) + '%' })
    }
  }

  console.log(`\n  ✅ 效果好的关键词:`)
  for (const k of goodKeywords) {
    console.log(`    ${k.kw} (采纳率${k.adoptRate})`)
    console.log(`      → 建议: 围绕它扩展更多衍生关键词`)
  }

  console.log(`\n  ⚠️ 效果差的关键词:`)
  for (const k of poorKeywords) {
    console.log(`    ${k.kw} (采纳率${k.adoptRate})`)
    console.log(`      → 建议: 优化措辞或降低优先级`)
  }

  console.log('\n  💡 手动调整方法:')
  console.log('    编辑 scripts/evolution/github-scanner.js 的 SEARCH_KEYWORDS 数组')
  console.log('    或运行: npm run evolve:scan -- --keywords <新关键词>')

  return { goodKeywords, poorKeywords }
}

// ── 权重建议（不自动改） ────────────────────────

function suggestWeights() {
  console.log('\n⚖️  权重建议（仅分析，不自动修改）')
  console.log('='.repeat(50))

  const candidates = loadCandidates()
  const currentWeights = { relevance: 0.30, feasibility: 0.25, independence: 0.20, risk: 0.15, freshness: 0.10 }

  const dimensionImpact = {
    relevance: { adopt: 0, skip: 0, total: 0 },
    feasibility: { adopt: 0, skip: 0, total: 0 },
    independence: { adopt: 0, skip: 0, total: 0 },
    risk: { adopt: 0, skip: 0, total: 0 },
    freshness: { adopt: 0, skip: 0, total: 0 },
  }

  for (const c of candidates.candidates || []) {
    if (!c.scores) continue
    for (const dim of Object.keys(dimensionImpact)) {
      dimensionImpact[dim].total++
      if (c.suggestion === 'adopt' && c.scores[dim] > 6) dimensionImpact[dim].adopt++
      if (c.suggestion === 'skip' && c.scores[dim] < 4) dimensionImpact[dim].skip++
    }
  }

  console.log('\n  维度区分度（区分能力）：')
  const suggestions = []
  for (const [dim, impact] of Object.entries(dimensionImpact)) {
    const adoptRate = impact.total > 0 ? impact.adopt / impact.total : 0
    const skipRate = impact.total > 0 ? impact.skip / impact.total : 0
    const discrimination = adoptRate - skipRate
    const fmt = (n) => (n * 100).toFixed(0) + '%'
    console.log(`    ${dim}: 区分度 ${discrimination.toFixed(2)} (采纳时高分率${fmt(adoptRate)} / 跳过时低分率${fmt(skipRate)})`)
    console.log(`      当前权重: ${currentWeights[dim]}`)

    if (discrimination > 0.3 && currentWeights[dim] < 0.35) {
      console.log(`      → 💡 建议: 权重可上调 +0.05`)
      suggestions.push({ dim, action: 'increase', delta: 0.05 })
    } else if (discrimination < 0.1) {
      console.log(`      → 💡 建议: 权重可下调 -0.03`)
      suggestions.push({ dim, action: 'decrease', delta: -0.03 })
    }
  }

  console.log('\n  💡 手动调整方法:')
  console.log('    编辑 scripts/evolution/feature-analyzer.js 的权重配置')
  console.log('    当前权重: relevance=0.30, feasibility=0.25, independence=0.20, risk=0.15, freshness=0.10')

  return { suggestions }
}

// ── 生成报告 ──────────────────────────────────────

function generateReport() {
  ensureDir(path.dirname(ANALYSIS_REPORT_FILE))

  const log = loadEvolutionLog()
  const candidates = loadCandidates()

  let report = `# AiCode 进化系统分析报告\n\n`
  report += `> 生成时间: ${now()}\n`
  report += `> 分析模式: 只读分析（不修改任何配置）\n\n`

  report += `## 总览\n\n`
  report += `- 进化记录: ${log.entries.length} 条\n`
  report += `- 当前候选: ${candidates.candidates?.length || 0} 个\n\n`

  const adopted = (candidates.candidates || []).filter(c => c.suggestion === 'adopt')
  const adapted = (candidates.candidates || []).filter(c => c.suggestion === 'adapt')
  const skipped = (candidates.candidates || []).filter(c => c.suggestion === 'skip')

  report += `## 候选分布\n\n`
  report += `| 建议 | 数量 |\n|:-----|:-----|\n`
  report += `| 🟢 采纳 | ${adopted.length} |\n`
  report += `| 🟡 改造 | ${adapted.length} |\n`
  report += `| 🔴 跳过 | ${skipped.length} |\n\n`

  report += `## 关键词效果\n\n`
  const { keywordStats } = analyze()
  if (Object.keys(keywordStats).length > 0) {
    report += `| 关键词 | 总数 | 采纳 | 改造 | 跳过 | 采纳率 |\n|:-------|:-----|:-----|:-----|:-----|:-------|\n`
    for (const [kw, stats] of Object.entries(keywordStats).sort((a, b) => b[1].total - a[1].total)) {
      const adoptRate = stats.total > 0 ? (stats.adopted / stats.total * 100).toFixed(0) + '%' : '0%'
      report += `| ${kw} | ${stats.total} | ${stats.adopted} | ${stats.adapted} | ${stats.skipped} | ${adoptRate} |\n`
    }
  } else {
    report += `(暂无数据)\n\n`
  }

  report += `\n## 建议（需用户确认）\n\n`
  report += `### 关键词优化建议\n\n`
  suggestKeywords()
  report += `\n### 权重优化建议\n\n`
  suggestWeights()

  report += `\n## 重要说明\n\n`
  report += `本报告由 Self Analyzer 自动生成，**不会自动修改任何配置**。\n\n`
  report += `如需根据建议调整：\n`
  report += `- 关键词: 编辑 scripts/evolution/github-scanner.js\n`
  report += `- 权重: 编辑 scripts/evolution/feature-analyzer.js\n\n`

  fs.writeFileSync(ANALYSIS_REPORT_FILE, report)
  console.log(`\n📄 报告已生成: ${ANALYSIS_REPORT_FILE}`)
}

// ── CLI ──────────────────────────────────────

function main() {
  const args = process.argv.slice(2)
  const cmd = args[0] || 'run'

  switch (cmd) {
    case 'analyze':
      analyze()
      break
    case 'keywords':
      suggestKeywords()
      break
    case 'weights':
      suggestWeights()
      break
    case 'report':
      generateReport()
      break
    case 'run':
      analyze()
      console.log('')
      suggestKeywords()
      console.log('')
      suggestWeights()
      console.log('')
      generateReport()
      break
    default:
      console.log(`
AiCode 自我分析引擎 v1.0（只读模式）

用法：
  node self-analyzer.js analyze    # 分析历史
  node self-analyzer.js keywords   # 关键词建议
  node self-analyzer.js weights    # 权重建议
  node self-analyzer.js report     # 生成分析报告
  node self-analyzer.js run        # 完整分析
`)
  }
}

if (require.main === module) {
  main()
}

module.exports = { analyze, suggestKeywords, suggestWeights, generateReport }
