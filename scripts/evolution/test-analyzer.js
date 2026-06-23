#!/usr/bin/env node

/**
 * 测试：特性评估引擎
 */

let passed = 0
let failed = 0
const results = []

function assert(condition, msg) {
  if (condition) {
    passed++
    results.push({ status: '✅', msg })
  } else {
    failed++
    results.push({ status: '❌', msg })
  }
}

const { analyzeFeature, EXISTING_CAPABILITIES, MISSING_CAPABILITIES } = require('./feature-analyzer')

// ── 测试 1: 高分 adopt 项目 ──
const repo1 = {
  full_name: 'user/claude-vector-memory',
  description: 'vector search for claude memory system',
  stargazers_count: 200,
  language: 'TypeScript',
  topics: ['claude', 'memory', 'vector'],
  html_url: 'https://github.com/user/claude-vector-memory',
  source: 'search',
}
const r1 = analyzeFeature(repo1)
assert(r1.suggestion === 'adopt' || r1.composite_score >= 5, `高分项目: ${r1.suggestion} (${r1.composite_score})`)
assert(r1.scores.relevance > 0, `实用性有评分: ${r1.scores.relevance}`)
assert(r1.scores.feasibility > 0, `可行性有评分: ${r1.scores.feasibility}`)
assert(r1.summary.length > 0, `有摘要`)

// ── 测试 2: 低分 skip 项目 ──
const repo2 = {
  full_name: 'user/random-project',
  description: 'random stuff',
  stargazers_count: 2,
  language: 'Ruby',
  topics: ['random'],
  html_url: 'https://github.com/user/random-project',
  source: 'search',
}
const r2 = analyzeFeature(repo2)
assert(r2.suggestion === 'skip', `低分跳过: ${r2.suggestion} (${r2.composite_score})`)

// ── 测试 3: 已有能力低新鲜度 ──
const repo3 = {
  full_name: 'user/claude-dispatcher',
  description: 'smart dispatch for claude code',
  stargazers_count: 50,
  language: 'JavaScript',
  topics: ['claude'],
  html_url: 'https://github.com/user/claude-dispatcher',
  source: 'search',
}
const r3 = analyzeFeature(repo3)
assert(r3.scores.freshness <= 5, `已有能力低新鲜度: ${r3.scores.freshness}`)

// ── 测试 4: 新能力高新鲜度 ──
const repo4 = {
  full_name: 'user/claude-multi-modal',
  description: 'multi-modal input for claude code',
  stargazers_count: 30,
  language: 'JavaScript',
  topics: ['claude'],
  html_url: 'https://github.com/user/claude-multi-modal',
  source: 'search',
}
const r4 = analyzeFeature(repo4)
assert(r4.scores.freshness >= 6, `新能力高新鲜度: ${r4.scores.freshness}`)

// ── 测试 5: TypeScript 高可行性 ──
const repo5 = {
  full_name: 'user/claude-tool',
  description: 'tool',
  stargazers_count: 10,
  language: 'TypeScript',
  topics: [],
  html_url: 'https://github.com/user/claude-tool',
  source: 'search',
}
const r5 = analyzeFeature(repo5)
assert(r5.scores.feasibility >= 4, `TypeScript 高可行性: ${r5.scores.feasibility}`)

// ── 测试 6: Ruby 低可行性 ──
const repo6 = {
  full_name: 'user/claude-tool-ruby',
  description: 'tool',
  stargazers_count: 10,
  language: 'Ruby',
  topics: [],
  html_url: 'https://github.com/user/claude-tool-ruby',
  source: 'search',
}
const r6 = analyzeFeature(repo6)
assert(r6.scores.feasibility < r5.scores.feasibility, `Ruby 低于 TypeScript: ${r6.scores.feasibility} < ${r5.scores.feasibility}`)

// ── 测试 7: 独立性默认高 ──
const repo7 = {
  full_name: 'user/local-tool',
  description: 'local offline tool',
  stargazers_count: 10,
  language: 'JavaScript',
  topics: [],
  html_url: 'https://github.com/user/local-tool',
  source: 'search',
}
const r7 = analyzeFeature(repo7)
assert(r7.scores.independence >= 5, `独立性高: ${r7.scores.independence}`)

// ── 测试 8: 综合分范围 ──
assert(r1.composite_score >= 0 && r1.composite_score <= 10, `综合分范围: ${r1.composite_score}`)
assert(r2.composite_score >= 0 && r2.composite_score <= 10, `综合分范围: ${r2.composite_score}`)

// ── 测试 9: 三种建议类型 ──
const allSuggestions = new Set([r1.suggestion, r2.suggestion, r3.suggestion, r4.suggestion])
assert(allSuggestions.has('adopt') || allSuggestions.has('adapt'), `有 adopt 或 adapt`)
assert(allSuggestions.has('skip'), `有 skip`)

// ── 测试 10: estimated_effort 存在 ──
assert(['small', 'medium', 'large'].includes(r1.estimated_effort), `复杂度: ${r1.estimated_effort}`)
assert(['small', 'medium', 'large'].includes(r2.estimated_effort), `复杂度: ${r2.estimated_effort}`)

// ── 测试 11: confidence 存在 ──
assert(['high', 'medium', 'low'].includes(r1.confidence), `置信度: ${r1.confidence}`)
assert(['high', 'medium', 'low'].includes(r2.confidence), `置信度: ${r2.confidence}`)

// ── 测试 12: EXISTING_CAPABILITIES 覆盖 ──
assert(EXISTING_CAPABILITIES.includes('smart-dispatch'), `已有 smart-dispatch`)
assert(EXISTING_CAPABILITIES.includes('left-brain-memory'), `已有 left-brain-memory`)
assert(EXISTING_CAPABILITIES.includes('hook-system'), `已有 hook-system`)

// ── 测试 13: MISSING_CAPABILITIES 覆盖 ──
assert(MISSING_CAPABILITIES.includes('vector-search'), `缺失 vector-search`)
assert(MISSING_CAPABILITIES.includes('multi-modal'), `缺失 multi-modal`)
assert(MISSING_CAPABILITIES.includes('failure-memory'), `缺失 failure-memory`)

// ── 输出 ──

console.log('\n📊 评估引擎测试结果：')
console.log('='.repeat(40))
for (const r of results) {
  console.log(`  ${r.status} ${r.msg}`)
}
console.log('='.repeat(40))
console.log(`  通过: ${passed}  失败: ${failed}  总计: ${passed + failed}`)

if (failed > 0) {
  process.exit(1)
}
