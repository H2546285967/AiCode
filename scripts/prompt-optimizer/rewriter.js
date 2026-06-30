#!/usr/bin/env node
/**
 * prompt-optimizer/rewriter.js
 * 根据弱点清单改写 prompt
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const { generateWithFallback } = require('../orchestrator/llm-adapter');

const REWRITE_SYSTEM_PROMPT = `You are an expert prompt engineer. Rewrite the given prompt to address the listed weaknesses.
Keep the original intent and language. Output ONLY the rewritten prompt, no extra explanation.`;

/**
 * 改写 prompt
 * @param {string} prompt
 * @param {string[]} weaknesses
 * @param {object} [opts]
 * @returns {Promise<{text: string, backend: string}>}
 */
async function rewrite(prompt, weaknesses, opts = {}) {
  const weaknessText = weaknesses?.length
    ? `Weaknesses to address:\n${weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\n`
    : '';

  const userPrompt = `${weaknessText}Original prompt:\n---\n${prompt}\n---\n\nRewritten prompt:`;

  const res = await generateWithFallback(userPrompt, {
    system: REWRITE_SYSTEM_PROMPT,
    maxTokens: opts.maxTokens || 2048,
    temperature: opts.temperature ?? 0.4,
  });

  return {
    text: res.text.trim(),
    backend: res.backend,
  };
}

module.exports = { rewrite };
