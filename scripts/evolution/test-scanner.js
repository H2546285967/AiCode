#!/usr/bin/env node

/**
 * 测试：GitHub 扫描器
 */

const path = require('path')
const fs = require('fs')

// 简单测试框架
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

// ── 测试 calcRelevance ──

const { calcRelevance, parseTrendingHTML, SEARCH_KEYWORDS } = require('./github-scanner')

// 测试 1: claude-code 名称加分
const repo1 = { full_name: 'user/claude-code-tools', description: 'tools', topics: [], stargazers_count: 50 }
assert(calcRelevance(repo1) >= 10, 'claude-code 名称 +10 分')

// 测试 2: 名称含 claude + extension
const repo2 = { full_name: 'user/claude-extension', description: '', topics: [], stargazers_count: 10 }
assert(calcRelevance(repo2) >= 8, 'claude + extension +8 分')

// 测试 3: MCP 相关
const repo3 = { full_name: 'user/mcp-server-claude', description: 'mcp server', topics: ['mcp'], stargazers_count: 100 }
assert(calcRelevance(repo3) >= 10, 'mcp + claude 高相关')

// 测试 4: 低相关（非 claude）
const repo4 = { full_name: 'user/random-project', description: 'random stuff', topics: ['random'], stargazers_count: 5 }
assert(calcRelevance(repo4) < 5, '随机项目低相关')

// 测试 5: stars 加分
const repo5 = { full_name: 'user/claude-tools', description: '', topics: [], stargazers_count: 150 }
const score5 = calcRelevance(repo5)
assert(score5 >= 8, 'stars > 100 加分')

// 测试 6: 语言加分
const repo6 = { full_name: 'user/claude-hook', description: '', topics: [], stargazers_count: 20, language: 'TypeScript' }
assert(calcRelevance(repo6) >= 8, 'TypeScript 语言加分')

// ── 测试 parseTrendingHTML ──

const html1 = `
<article>
  <h2 class="h3 lh-condensed">
    <a href="/anthropics/claude-code">claude-code</a>
  </h2>
</article>
<article>
  <h2 class="h3 lh-condensed">
    <a href="/user/awesome-claude-tools">awesome-tools</a>
  </h2>
</article>
`
const parsed = parseTrendingHTML(html1)
assert(parsed.length === 2, `Trending HTML 解析: ${parsed.length} 个 repo`)
assert(parsed[0].full_name === 'anthropics/claude-code', '解析第一个 repo')

// 测试 7: 空 HTML
const parsed2 = parseTrendingHTML('')
assert(parsed2.length === 0, '空 HTML 返回空数组')

// 测试 8: 搜索关键词列表
assert(SEARCH_KEYWORDS.length >= 10, `搜索关键词: ${SEARCH_KEYWORDS.length} 个`)

// ── 测试 feature-analyzer ──

const { analyzeFeature, EXISTING_CAPABILITIES, MISSING_CAPABILITIES } = require('./feature-analyzer')

// 测试 9: adopt 项目（高分）
const highScoreRepo = {
  full_name: 'user/claude-vector-memory',
  description: 'vector search for claude memory system',
  stargazers_count: 200,
  language: 'TypeScript',
  topics: ['claude', 'memory', 'vector'],
  html_url: 'https://github.com/user/claude-vector-memory',
  source: 'search',
}
const result1 = analyzeFeature(highScoreRepo)
assert(result1.suggestion !== 'skip', `高分项目不跳过: ${result1.suggestion} (${result1.composite_score})`)
assert(result1.composite_score > 5, `高分项目综合分 > 5: ${result1.composite_score}`)

// 测试 10: skip 项目（低分）
const lowScoreRepo = {
  full_name: 'user/random-junk',
  description: 'random stuff',
  stargazers_count: 2,
  language: 'Ruby',
  topics: ['random'],
  html_url: 'https://github.com/user/random-junk',
  source: 'search',
}
const result2 = analyzeFeature(lowScoreRepo)
assert(result2.suggestion === 'skip', `低分项目跳过: ${result2.suggestion} (${result2.composite_score})`)

// 测试 11: 已有能力低新鲜度
const existingRepo = {
  full_name: 'user/claude-dispatcher',
  description: 'smart dispatch for claude code',
  stargazers_count: 50,
  language: 'JavaScript',
  topics: ['claude'],
  html_url: 'https://github.com/user/claude-dispatcher',
  source: 'search',
}
const result3 = analyzeFeature(existingRepo)
assert(result3.scores.freshness <= 5, `已有能力新鲜度低: ${result3.scores.freshness}`)

// 测试 12: 新能力高新鲜度
const newFeatureRepo = {
  full_name: 'user/claude-multi-modal',
  description: 'multi-modal input for claude code',
  stargazers_count: 30,
  language: 'JavaScript',
  topics: ['claude'],
  html_url: 'https://github.com/user/claude-multi-modal',
  source: 'search',
}
const result4 = analyzeFeature(newFeatureRepo)
assert(result4.scores.freshness >= 6, `新能力新鲜度高: ${result4.scores.freshness}`)

// 测试 13: EXISTING_CAPABILITIES 非空
assert(EXISTING_CAPABILITIES.length > 0, `已有能力列表: ${EXISTING_CAPABILITIES.length} 项`)

// 测试 14: MISSING_CAPABILITIES 非空
assert(MISSING_CAPABILITIES.length > 0, `缺失能力列表: ${MISSING_CAPABILITIES.length} 项`)

// ── 输出 ──

console.log('\n📊 扫描器测试结果：')
console.log('='.repeat(40))
for (const r of results) {
  console.log(`  ${r.status} ${r.msg}`)
}
console.log('='.repeat(40))
console.log(`  通过: ${passed}  失败: ${failed}  总计: ${passed + failed}`)

if (failed > 0) {
  process.exit(1)
}
