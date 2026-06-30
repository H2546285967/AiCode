#!/usr/bin/env node
/**
 * prompt-optimizer/analyzer.js
 * 对 prompt 做语义分析，输出弱点清单
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const { generateWithFallback } = require('../orchestrator/llm-adapter');

const ANALYZE_SYSTEM_PROMPT = `You are an expert prompt engineer. Analyze the given prompt and identify weaknesses.
Respond ONLY with valid JSON (no markdown) matching:
{
  "weaknesses": ["string"],
  "strengths": ["string"],
  "summary": "string"
}`;

/**
 * 分析 prompt 的弱点
 * @param {string} prompt
 * @param {object} [opts]
 * @returns {Promise<{weaknesses: string[], strengths: string[], summary: string, backend: string}>}
 */
async function analyze(prompt, opts = {}) {
  const userPrompt = `Analyze this prompt and return JSON:\n\n---\n${prompt}\n---`;
  const res = await generateWithFallback(userPrompt, {
    system: ANALYZE_SYSTEM_PROMPT,
    maxTokens: opts.maxTokens || 1024,
    temperature: opts.temperature ?? 0.3,
  });

  let parsed;
  try {
    const cleaned = res.text.replace(/^```json\s*|\s*```$/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // fallback：按行拆分 weaknesses
    parsed = {
      weaknesses: res.text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./)).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean),
      strengths: [],
      summary: res.text.slice(0, 200),
    };
  }

  return {
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    summary: parsed.summary || '',
    backend: res.backend,
  };
}

module.exports = { analyze };
