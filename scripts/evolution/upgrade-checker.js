#!/usr/bin/env node

/**
 * Upgrade Checker — 升级对比评估
 *
 * 当 trend-watcher 发现 potential_upgrade 时，本模块负责：
 *   1. 读取新方案的信息
 *   2. 与我们当前实现对比
 *   3. 输出升级建议（🟢/🟡/🔴）
 *
 * 用法：
 *   node upgrade-checker.js check        # 检查所有需要升级的特性
 *   node upgrade-checker.js check <name> # 检查指定特性
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'github')
const EVOLVED_FEATURES_FILE = path.join(DATA_DIR, 'evolved-features.json')
const CANDIDATES_FILE = path.join(DATA_DIR, 'candidates.json')

function loadEvolvedFeatures() {
  try {
    return JSON.parse(fs.readFileSync(EVOLVED_FEATURES_FILE, 'utf8'))
  } catch {
    return { features: [] }
  }
}

function loadCandidates() {
  try {
    return JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8'))
  } catch {
    return { candidates: [] }
  }
}

function checkUpgrade(feature, alternatives) {
  if (!alternatives || alternatives.length === 0) {
    return { decision: '🔴 不需要升级', reason: '无替代方案' }
  }

  const best = alternatives[0]
  const sourceStars = feature.source_stars || 0

  // 升级评分
  let score = 0

  // 1. 新方案 stars 远超源头
  if (best.stars > sourceStars * 3) score += 3
  else if (best.stars > sourceStars * 2) score += 2
  else if (best.stars > sourceStars * 1.5) score += 1

  // 2. 新方案有多个（趋势确认）
  if (alternatives.length >= 3) score += 2
  else if (alternatives.length >= 2) score += 1

  // 3. 语言匹配
  if (best.language === 'JavaScript' || best.language === 'TypeScript') score += 1

  // 决策
  if (score >= 5) {
    return {
      decision: '🟢 建议升级',
      reason: `新方案 ${best.name} (⭐${best.stars}) 明显更强，有 ${alternatives.length} 个替代方案`,
      score,
      best_alternative: best.name,
    }
  } else if (score >= 3) {
    return {
      decision: '🟡 可选升级',
      reason: `新方案 ${best.name} (⭐${best.stars}) 有一定优势但不明显`,
      score,
      best_alternative: best.name,
    }
  } else {
    return {
      decision: '🔴 不需要升级',
      reason: `当前实现已足够好`,
      score,
    }
  }
}

function checkAll(targetFeature = null) {
  const features = loadEvolvedFeatures()

  if (features.features.length === 0) {
    console.log('⚠ 暂无已实现特性')
    return
  }

  console.log('\n🔄 升级检查')
  console.log('='.repeat(50))

  for (const feature of features.features) {
    if (feature.status !== 'outdated') continue
    if (targetFeature && !feature.feature.includes(targetFeature)) continue

    const alternatives = feature.alternatives_found || []
    const altObjects = alternatives.map(name => ({ name, stars: 0 })) // 简化

    const result = checkUpgrade(feature, altObjects)

    console.log(`\n  ${feature.feature}`)
    console.log(`    状态: ${feature.status}`)
    console.log(`    ${result.decision}`)
    console.log(`    原因: ${result.reason}`)
  }
}

function main() {
  const args = process.argv.slice(2)
  const cmd = args[0] || 'check'

  if (cmd === 'check') {
    checkAll(args[1])
  } else {
    console.log(`
AiCode 升级检查器 v1.0

用法：
  node upgrade-checker.js check          # 检查所有需要升级的特性
  node upgrade-checker.js check <name>   # 检查指定特性
`)
  }
}

if (require.main === module) {
  main()
}

module.exports = { checkUpgrade, checkAll }
