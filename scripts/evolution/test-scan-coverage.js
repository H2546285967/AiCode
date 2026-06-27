#!/usr/bin/env node

/**
 * 测试：M35-scan-coverage 扫描盲区覆盖
 *
 * 覆盖：
 *   1. 能力导向评分（Hermes-style 不含 claude 关键字）
 *   2. 新星加成（30 天内创建 + stars >= 30）
 *   3. 能力关键词数量验证
 *   4. 向后兼容（claude-code 关键词仍是高分）
 *   5. detectRisingStars() 单元（无需 token，mock fetch）
 *   6. SEARCH_KEYWORDS 扩增到包含能力词
 *
 * 用法：node scripts/evolution/test-scan-coverage.js
 */

const path = require('path')

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

// ── 测试 1：能力导向评分（Hermes-style，name/desc 无 claude）──

const { calcRelevance, CAPABILITY_KEYWORDS, SEARCH_KEYWORDS, detectRisingStars } = require('./github-scanner')

// Hermes-style：name 不含 claude，desc 含 "agent memory system"
const hermesLike = {
  full_name: 'nousresearch/hermes-agent-memory',
  description: 'Agent memory system with vector retrieval for LLM agents',
  topics: ['agent', 'memory', 'vector', 'llm'],
  stargazers_count: 250,
  language: 'Python',
  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 天前
  updated_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
}
const hermesScore = calcRelevance(hermesLike)
assert(hermesScore >= 13,
  `Hermes-style（能力导向+新星）总分 >= 13: 实际 ${hermesScore}`)

// ── 测试 2：新星加成（30 天内 + stars >= 30）──

const newStar = {
  full_name: 'user/cool-agent-tool',
  description: 'cool tool',
  topics: [],
  stargazers_count: 50,
  language: 'TypeScript',
  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
}
const newStarScore = calcRelevance(newStar)
// 期望：name 无 claude → 0；topics 0；capHits (tool 命中 1) → +1；新星 +3；stars>30 → +2；活跃 +2+2；TS → +2；desc 无 → 0 = 12
assert(newStarScore >= 10,
  `新星加成生效（5 天前 + 50 star）: 实际 ${newStarScore}`)

// ── 测试 3：非新星（60 天前创建，无加成）──

const oldProject = {
  full_name: 'user/old-agent-tool',
  description: 'cool tool',
  topics: [],
  stargazers_count: 50,
  language: 'TypeScript',
  created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
}
const oldScore = calcRelevance(oldProject)
assert(oldScore < newStarScore,
  `60 天前项目无新星加成: oldScore=${oldScore} < newStarScore=${newStarScore}`)

// ── 测试 4：能力词 3+ 命中强信号 ──

const multiCap = {
  full_name: 'foo/agent-orchestration-workflow',
  description: 'agent orchestration and workflow automation',
  topics: ['agent', 'workflow', 'orchestration'],
  stargazers_count: 100,
  language: 'TypeScript',
  created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
}
const multiScore = calcRelevance(multiCap)
// agent/workflow/orchestration/automation 命中 4 个 → +5
// topics agent/workflow 命中 2 个 → +3 + +3
// stars>100 → +3；活跃 → +2+2；TS → +2；desc agent → +3
// = 23
assert(multiScore >= 18,
  `4+ 能力词命中强信号: 实际 ${multiScore}`)

// ── 测试 5：能力词 0 命中低相关 ──

const noCap = {
  full_name: 'user/random-junk',
  description: 'random stuff',
  topics: ['random'],
  stargazers_count: 2,
  language: 'Ruby',
  created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  pushed_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
}
const noCapScore = calcRelevance(noCap)
assert(noCapScore < 5,
  `无能力词低相关: 实际 ${noCapScore}`)

// ── 测试 6：向后兼容（claude-code 仍是最高分）──

const legacyClaude = {
  full_name: 'user/claude-code-tools',
  description: 'claude code tools',
  topics: ['claude'],
  stargazers_count: 100,
  language: 'TypeScript',
  created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  pushed_at: new Date().toISOString(),
}
const legacyScore = calcRelevance(legacyClaude)
// 期望：name claude-code → +10；topics claude → +5；stars>100 → +3；活跃 +2+2；TS +2；desc → +3
// = 27
assert(legacyScore >= 20,
  `claude-code 关键词仍是高分（向后兼容）: 实际 ${legacyScore}`)

// ── 测试 7：CAPABILITY_KEYWORDS 非空且包含核心能力词 ──

assert(CAPABILITY_KEYWORDS.length >= 10,
  `CAPABILITY_KEYWORDS 数量 >= 10: ${CAPABILITY_KEYWORDS.length}`)
const expectedCore = ['memory', 'agent', 'mcp', 'workflow']
for (const kw of expectedCore) {
  assert(CAPABILITY_KEYWORDS.includes(kw),
    `CAPABILITY_KEYWORDS 含核心能力词 "${kw}"`)
}

// ── 测试 8：SEARCH_KEYWORDS 扩展到包含能力导向词 ──

assert(SEARCH_KEYWORDS.length >= 18,
  `SEARCH_KEYWORDS 扩增到 >= 18 个: ${SEARCH_KEYWORDS.length}`)
assert(SEARCH_KEYWORDS.some(k => k.includes('agent memory')),
  `SEARCH_KEYWORDS 含能力导向词 "agent memory"`)
assert(SEARCH_KEYWORDS.some(k => k.includes('mcp server')),
  `SEARCH_KEYWORDS 含能力导向词 "mcp server"`)
assert(SEARCH_KEYWORDS.some(k => k.includes('context engineering')),
  `SEARCH_KEYWORDS 含 2026 热门词 "context engineering"`)

// ── 测试 9：detectRisingStars() 单元（mock fetch）──

;(async () => {
  // mock global fetch
  const mockRisingRepo = {
    full_name: 'mock/rising-star',
    description: 'just born',
    html_url: 'https://github.com/mock/rising-star',
    stargazers_count: 150,
    language: 'TypeScript',
    topics: ['agent', 'memory'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    pushed_at: new Date().toISOString(),
  }
  const mockResponse = {
    ok: true,
    status: 200,
    json: async () => ({ items: [mockRisingRepo] }),
  }
  const originalFetch = global.fetch
  global.fetch = async () => mockResponse

  try {
    const result = await detectRisingStars({ days: 7, perPage: 10 })
    assert(result.length === 1, `detectRisingStars 返回 1 条 mock 结果: ${result.length}`)
    assert(result[0].source === 'rising', `source 字段标记为 "rising"`)
    assert(result[0].full_name === 'mock/rising-star', `full_name 正确`)
  } finally {
    global.fetch = originalFetch
  }

  // ── 测试 10：detectRisingStars 限流处理（403 → 返回空）──

  global.fetch = async () => ({ ok: false, status: 403, json: async () => ({}) })
  try {
    const result = await detectRisingStars({ days: 7 })
    assert(Array.isArray(result) && result.length === 0,
      `detectRisingStars 403 限流时返回空数组: length=${result.length}`)
  } finally {
    global.fetch = originalFetch
  }

  // ── 输出 ──

  console.log('\n📊 M35-scan-coverage 测试结果：')
  console.log('='.repeat(50))
  for (const r of results) {
    console.log(`  ${r.status} ${r.msg}`)
  }
  console.log('='.repeat(50))
  console.log(`  通过: ${passed}  失败: ${failed}  总计: ${passed + failed}`)

  if (failed > 0) {
    process.exit(1)
  }
})().catch(err => {
  console.error('❌ 测试异常:', err)
  process.exit(1)
})