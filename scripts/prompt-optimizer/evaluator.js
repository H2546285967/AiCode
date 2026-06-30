#!/usr/bin/env node
/**
 * prompt-optimizer/evaluator.js
 * 按维度评估 prompt，返回 verdict
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const { evaluateWithFallback } = require('../orchestrator/llm-adapter');
const { makeVerdict } = require('../aris-poc/verdict');

const DEFAULT_DIMENSIONS = ['clarity', 'coverage', 'actionability', 'safety'];

/**
 * 评估 prompt
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string[]} [opts.dimensions]
 * @returns {Promise<object>} verdict-like object
 */
async function evaluate(prompt, opts = {}) {
  const dimensions = opts.dimensions || DEFAULT_DIMENSIONS;
  const res = await evaluateWithFallback(prompt, { dimensions });

  return makeVerdict({
    score: res.score,
    verdict: res.verdict,
    reason: res.reasons?.[0] || `evaluated by ${res.backend}`,
    reviewer: res.backend,
    weaknesses: res.weaknesses || [],
    actions: res.actions || [],
    meta: {
      dimensions: res.dimensions || {},
      backend: res.backend,
    },
  });
}

module.exports = { evaluate, DEFAULT_DIMENSIONS };
