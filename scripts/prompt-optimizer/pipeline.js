#!/usr/bin/env node
/**
 * prompt-optimizer/pipeline.js
 * analyze → evaluate → compare → rewrite 闭环
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const { analyze } = require('./analyzer');
const { evaluate } = require('./evaluator');
const { compare } = require('./comparator');
const { rewrite } = require('./rewriter');
const { isPositive } = require('../aris-poc/verdict');

/**
 * 跑一轮优化
 * @param {string} prompt
 * @param {object} [opts]
 * @returns {Promise<{round: number, original: string, optimized: string, verdict: object, weaknesses: string[], divergence: object, backend: string}>}
 */
async function runRound(prompt, opts = {}) {
  const round = opts.round || 1;
  const backends = opts.backends || ['heuristic'];

  const analysis = await analyze(prompt, opts.analyze);
  const evaluation = await evaluate(prompt, opts.evaluate);
  const comparison = await compare(prompt, { backends, strategy: opts.strategy });

  // 如果已经 positive，不需要改写
  if (isPositive(evaluation) && comparison.divergence.level === 'none') {
    return {
      round,
      original: prompt,
      optimized: prompt,
      verdict: evaluation,
      weaknesses: analysis.weaknesses,
      divergence: comparison.divergence,
      backend: evaluation.reviewer,
      improved: false,
    };
  }

  const allWeaknesses = [
    ...new Set([
      ...(evaluation.weaknesses || []),
      ...(analysis.weaknesses || []),
      ...(comparison.aggregated.weaknesses || []),
    ]),
  ];

  const rewritten = await rewrite(prompt, allWeaknesses, opts.rewrite);

  return {
    round,
    original: prompt,
    optimized: rewritten.text,
    verdict: evaluation,
    weaknesses: allWeaknesses,
    divergence: comparison.divergence,
    backend: rewritten.backend,
    improved: rewritten.text !== prompt,
  };
}

/**
 * 多轮优化 pipeline
 * @param {string} prompt
 * @param {object} [opts]
 * @param {number} [opts.rounds=3]
 * @returns {Promise<{rounds: object[], finalPrompt: string, finalVerdict: object, status: string}>}
 */
async function run(prompt, opts = {}) {
  const maxRounds = opts.rounds || 3;
  const rounds = [];
  let current = prompt;
  let finalVerdict = null;

  for (let i = 1; i <= maxRounds; i++) {
    const result = await runRound(current, { ...opts, round: i });
    rounds.push(result);
    finalVerdict = result.verdict;

    if (!result.improved || isPositive(result.verdict)) {
      return {
        rounds,
        finalPrompt: result.optimized,
        finalVerdict,
        status: result.improved ? 'positive' : 'no_improvement',
      };
    }

    current = result.optimized;
  }

  return {
    rounds,
    finalPrompt: current,
    finalVerdict,
    status: 'max_rounds_reached',
  };
}

function formatReport(result) {
  const lines = [];
  lines.push('# Prompt Optimization Report');
  lines.push('');
  lines.push(`**Status**: ${result.status}`);
  lines.push(`**Rounds**: ${result.rounds.length}`);
  lines.push(`**Final Verdict**: ${result.finalVerdict?.verdict || 'N/A'} (score=${result.finalVerdict?.score?.toFixed(2) || 0})`);
  lines.push('');

  for (const r of result.rounds) {
    lines.push(`## Round ${r.round}`);
    lines.push(`- Verdict: ${r.verdict.verdict} (score=${r.verdict.score.toFixed(2)})`);
    lines.push(`- Backend: ${r.backend}`);
    lines.push(`- Divergence: ${r.divergence.level} (${r.divergence.positiveCount}/${r.divergence.count} positive)`);
    if (r.weaknesses.length) {
      lines.push('- Weaknesses:');
      for (const w of r.weaknesses) lines.push(`  - ${w}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('## Final Prompt');
  lines.push('');
  lines.push(result.finalPrompt);
  return lines.join('\n');
}

module.exports = { run, runRound, formatReport };
