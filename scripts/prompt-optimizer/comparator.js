#!/usr/bin/env node
/**
 * prompt-optimizer/comparator.js
 * 把同一 prompt 跑过多个 backend，检测分歧
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const { HeuristicAdapter, AnthropicAdapter, createAdapter } = require('../orchestrator/llm-adapter');
const { evaluate } = require('./evaluator');
const { aggregateVerdicts, makeVerdict } = require('../aris-poc/verdict');

/**
 * 比较多个 backend 对同一 prompt 的评估
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string[]} [opts.backends] - backend 名列表
 * @returns {Promise<{verdicts: object[], aggregated: object, divergence: object}>}
 */
async function compare(prompt, opts = {}) {
  const backends = opts.backends || ['heuristic'];
  const adapters = [];

  for (const name of backends) {
    try {
      adapters.push(createAdapter(name));
    } catch (e) {
      process.stderr.write(`[comparator] ${name} adapter 创建失败，跳过: ${e.message}\n`);
    }
  }

  const verdicts = [];
  for (const adapter of adapters) {
    try {
      const raw = await adapter.evaluate(prompt, { dimensions: ['clarity', 'coverage', 'actionability', 'safety'] });
      verdicts.push(makeVerdict({
        score: raw.score,
        verdict: raw.verdict,
        reason: raw.reasons?.[0] || `${adapter.name} evaluation`,
        reviewer: adapter.name,
        weaknesses: raw.weaknesses || [],
        actions: raw.actions || [],
        meta: { backend: adapter.name },
      }));
    } catch (e) {
      verdicts.push(makeVerdict({
        score: 0,
        verdict: 'ERROR',
        reason: `${adapter.name} failed: ${e.message}`,
        reviewer: adapter.name,
        meta: { backend: adapter.name },
      }));
    }
  }

  const aggregated = aggregateVerdicts(verdicts, opts.strategy || 'majority');

  // 分歧检测
  const positiveCount = verdicts.filter(v => v.positive).length;
  const negativeCount = verdicts.length - positiveCount;
  const divergence = {
    count: verdicts.length,
    positiveCount,
    negativeCount,
    level: positiveCount === 0 || negativeCount === 0 ? 'none' : (Math.min(positiveCount, negativeCount) / verdicts.length > 0.33 ? 'high' : 'medium'),
    verdicts: verdicts.map(v => ({ backend: v.reviewer, verdict: v.verdict, score: v.score })),
  };

  return { verdicts, aggregated, divergence };
}

module.exports = { compare };
