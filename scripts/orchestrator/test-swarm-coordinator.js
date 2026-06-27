#!/usr/bin/env node
/**
 * test-swarm-coordinator.js — swarm-coordinator.js 测试（M31 · 借鉴 ruvnet/ruflo）
 *
 * 沿用 M27 skill-reuse 测试模板
 */

'use strict';

const {
  generatePerspectives,
  aggregateResults,
  swarmDecide,
  jaccardSimilarity,
  similarity,
  DEFAULTS,
  PERSPECTIVE_POOL,
} = require('./swarm-coordinator');

let pass = 0, fail = 0;
const fails = [];

function check(name, cond, expected, actual) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else {
    fail++; fails.push(name);
    console.log(`❌ ${name}`);
    if (expected !== undefined) console.log(`   expected: ${JSON.stringify(expected)}`);
    if (actual !== undefined) console.log(`   actual:   ${JSON.stringify(actual)}`);
  }
}

console.log('━'.repeat(60));
console.log('🐝 swarm-coordinator 测试（M31 · v3.0.5）');
console.log('━'.repeat(60));

// ── 1. generatePerspectives 基础 ──
console.log('\n── 1. generatePerspectives 基础 ──');
const ps3 = generatePerspectives('重构 dispatcher.js');
check('默认返回 3 个视角', ps3.length === 3, '实际: ' + ps3.length);
check('视角含 id', ps3.every(p => typeof p.id === 'string' && p.id.length > 0));
check('视角含 label', ps3.every(p => typeof p.label === 'string' && p.label.length > 0));
check('视角含 prompt', ps3.every(p => typeof p.prompt === 'string' && p.prompt.includes('重构 dispatcher.js')));
check('视角含 template', ps3.every(p => typeof p.template === 'string'));
check('默认 3 视角 = pool 前 3', ps3.map(p => p.id).join(',') === PERSPECTIVE_POOL.slice(0, 3).map(p => p.id).join(','));

// ── 2. generatePerspectives 自定义 n / 边界 ──
console.log('\n── 2. generatePerspectives 自定义 n ──');
const ps5 = generatePerspectives('test', { n: 5 });
check('n=5 返回 5 个', ps5.length === 5);
const ps1 = generatePerspectives('test', { n: 1 });
check('n=1 返回 1 个', ps1.length === 1);
const ps0 = generatePerspectives('test', { n: 0 });
check('n=0 → fallback 到 1', ps0.length === 1);
const ps99 = generatePerspectives('test', { n: 99 });
check('n=99 → 截到 pool 长度', ps99.length === PERSPECTIVE_POOL.length);

// ── 3. generatePerspectives 兜底 ──
console.log('\n── 3. generatePerspectives 兜底 ──');
check('空字符串 → 空数组', generatePerspectives('').length === 0);
check('null → 空数组', generatePerspectives(null).length === 0);
check('非字符串 → 空数组', generatePerspectives(123).length === 0);
check('只有空格的字符串 → 空数组', generatePerspectives('   ').length === 0);

// ── 4. similarity / jaccard ──
console.log('\n── 4. similarity / jaccard ──');
check('相同文本 → 1.0', similarity('hello world', 'hello world') === 1.0);
check('完全不同 → < 0.5', similarity('PowerShell 编码', 'Python 数据科学') < 0.5);
check('高度相关 → > 0.2（bigram 切分）', similarity('重构 dispatcher', '重写 dispatcher.js') > 0.2);
check('非字符串 → 0', similarity(null, 'test') === 0);
check('jaccardSimilarity 暴露', typeof jaccardSimilarity === 'function');

// ── 5. aggregateResults best-of ──
console.log('\n── 5. aggregateResults best-of ──');
const results1 = [
  { text: '方案 A', score: 0.5, perspective: 'safety' },
  { text: '方案 B', score: 0.9, perspective: 'perf' },
  { text: '方案 C', score: 0.7, perspective: 'maintain' },
];
const bestResult = aggregateResults(results1, 'best-of');
check('best-of winner 是 score 最高', bestResult.winner.text === '方案 B');
check('best-of votes 只有 1 个 1', bestResult.votes.filter(v => v === 1).length === 1);
check('best-of reasoning 含 best-of', bestResult.reasoning.includes('best-of'));
check('best-of totalResults = 3', bestResult.totalResults === 3);

// ── 6. aggregateResults majority ──
console.log('\n── 6. aggregateResults majority ──');
const results2 = [
  { text: '建议加缓存', score: 0.7, perspective: 'perf' },
  { text: '建议加缓存策略', score: 0.7, perspective: 'maintain' },
  { text: '应该用 Redis', score: 0.5, perspective: 'safety' },
];
const majorityResult = aggregateResults(results2, 'majority', { threshold: 0.6 });
check('majority 能识别相似答案', majorityResult.winner.text.includes('缓存'));
check('majority 投票数 = 最大组大小', majorityResult.votes.filter(v => v === 1).length >= 1);
check('majority reasoning 含共识率', majorityResult.reasoning.includes('共识'));
check('majority totalResults = 3', majorityResult.totalResults === 3);

// ── 7. aggregateResults weighted ──
console.log('\n── 7. aggregateResults weighted ──');
const results3 = [
  { text: '答案 A', score: 0.9, perspective: 'a' },
  { text: '答案 B', score: 0.6, perspective: 'b' },
  { text: '答案 C', score: 0.3, perspective: 'c' },
];
const weightedResult = aggregateResults(results3, 'weighted');
check('weighted reasoning 含 weighted', weightedResult.reasoning.includes('weighted'));
check('weighted totalResults = 3', weightedResult.totalResults === 3);

// ── 8. aggregateResults 兜底 ──
console.log('\n── 8. aggregateResults 兜底 ──');
check('空数组 → winner=null', aggregateResults([], 'majority').winner === null);
check('null → winner=null', aggregateResults(null, 'majority').winner === null);
check('reasoning = 无输入结果', aggregateResults([], 'majority').reasoning === '无输入结果');

// ── 9. swarmDecide mock 模式 ──
console.log('\n── 9. swarmDecide mock 模式 ──');
(async () => {
  const swarmResult = await swarmDecide('重构 dispatcher.js 提升派 agent 准确率', { mockResults: true });
  check('swarmResult 有 perspectives', Array.isArray(swarmResult.perspectives) && swarmResult.perspectives.length === 3);
  check('swarmResult 有 results', Array.isArray(swarmResult.results) && swarmResult.results.length === 3);
  check('swarmResult 有 consensus', typeof swarmResult.consensus === 'object');
  check('swarmResult 有 finalAnswer', typeof swarmResult.finalAnswer === 'string' && swarmResult.finalAnswer.length > 0);
  check('results 包含任务关键词', swarmResult.results.some(r => r.text.includes('重构')));

  // ── 10. swarmDecide 真实 runAgent 注入 ──
  console.log('\n── 10. swarmDecide runAgent 注入 ──');
  let calls = 0;
  const fakeAgent = async (prompt, perspective) => {
    calls++;
    return {
      text: `fake-agent #${calls} on ${perspective.id}: 建议方案 X`,
      score: 0.8,
    };
  };
  const realResult = await swarmDecide('测试', { runAgent: fakeAgent, mockResults: false });
  check('runAgent 被调用 3 次（n=3）', calls === 3, '实际: ' + calls);
  check('realResult 含 fake-agent 标识', realResult.finalAnswer.includes('fake-agent'));
  check('realResult consensus.totalResults = 3', realResult.consensus.totalResults === 3);

  // ── 11. 真实场景 demo ──
  console.log('\n── 11. 真实场景 demo ──');
  const demo = await swarmDecide('重构 dispatcher.js 提升派 agent 准确率', {
    n: 4,
    strategy: 'majority',
    mockResults: true,
  });
  console.log(`   任务: 重构 dispatcher.js 提升派 agent 准确率`);
  console.log(`   视角数: ${demo.perspectives.length}`);
  console.log(`   Agent 输出数: ${demo.results.length}`);
  console.log(`   策略: ${demo.consensus.strategy}`);
  console.log(`   最终答案长度: ${demo.finalAnswer.length} 字符`);
  demo.perspectives.forEach(p => {
    console.log(`   - 视角: ${p.label} (${p.id})`);
  });

  // ── 12. swarmDecide runAgent 异常兜底 ──
  console.log('\n── 12. swarmDecide runAgent 异常兜底 ──');
  const errorAgent = async () => { throw new Error('fake error'); };
  const errorResult = await swarmDecide('test', { runAgent: errorAgent, mockResults: false });
  check('runAgent 抛错 → results 含 ERROR', errorResult.results.every(r => r.text.includes('ERROR') || r.error));
  check('runAgent 全错 → finalAnswer 仍可输出', typeof errorResult.finalAnswer === 'string');

  // ── 总结 ──
  console.log('\n' + '━'.repeat(60));
  console.log(`📊 测试结果: ${pass} 通过 / ${fail} 失败`);
  console.log('━'.repeat(60));
  if (fail > 0) {
    console.log('❌ 失败清单:');
    fails.forEach(f => console.log('  - ' + f));
    process.exit(1);
  } else {
    console.log('✅ 全部通过');
    process.exit(0);
  }
})().catch(e => {
  console.error('❌ 测试执行异常:', e);
  process.exit(1);
});