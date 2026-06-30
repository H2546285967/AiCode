#!/usr/bin/env node
/**
 * prompt-optimizer 单元测试
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const fs = require('fs');
const path = require('path');
const { analyze } = require('./analyzer');
const { evaluate, DEFAULT_DIMENSIONS } = require('./evaluator');
const { compare } = require('./comparator');
const { rewrite } = require('./rewriter');
const { run, runRound, formatReport } = require('./pipeline');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

const SAMPLE_PROMPT = `You are a coding assistant. Help the user write code.`;
const BETTER_PROMPT = `You are an expert code reviewer. Review the user's code for correctness, security, and style. Provide specific line-level feedback and actionable suggestions. Output your review in markdown with PASS/WARN/FAIL verdicts.`;

(async () => {
  console.log('========================================');
  console.log('🧪 prompt-optimizer 测试');
  console.log('========================================\n');

  // 1. analyzer
  try {
    const a = await analyze(SAMPLE_PROMPT);
    check('analyzer 返回 weaknesses 数组', Array.isArray(a.weaknesses));
    check('analyzer 返回 backend', typeof a.backend === 'string');
  } catch (e) {
    check('analyzer 异常', false);
    console.error('  err:', e.message);
  }

  // 2. evaluator
  try {
    const e = await evaluate(SAMPLE_PROMPT);
    check('evaluator 返回 verdict', typeof e.verdict === 'string');
    check('evaluator score 在 0-10 之间', e.score >= 0 && e.score <= 10);
    check('evaluator 返回 weaknesses', Array.isArray(e.weaknesses));
  } catch (e) {
    check('evaluator 异常', false);
    console.error('  err:', e.message);
  }

  // 3. evaluator：better prompt 分数更高
  try {
    const e1 = await evaluate(SAMPLE_PROMPT);
    const e2 = await evaluate(BETTER_PROMPT);
    check('better prompt 分数不低于简单 prompt', e2.score >= e1.score);
  } catch (e) {
    check('evaluator 对比异常', false);
    console.error('  err:', e.message);
  }

  // 4. comparator
  try {
    const c = await compare(SAMPLE_PROMPT, { backends: ['heuristic'] });
    check('comparator 返回 verdicts 数组', Array.isArray(c.verdicts));
    check('comparator 返回 aggregated', c.aggregated && typeof c.aggregated.verdict === 'string');
    check('comparator 返回 divergence', c.divergence && typeof c.divergence.level === 'string');
  } catch (e) {
    check('comparator 异常', false);
    console.error('  err:', e.message);
  }

  // 5. rewriter
  try {
    const r = await rewrite(SAMPLE_PROMPT, ['too vague', 'no output format']);
    check('rewriter 返回 text', typeof r.text === 'string' && r.text.length > 0);
    check('rewriter 返回 backend', typeof r.backend === 'string');
  } catch (e) {
    check('rewriter 异常', false);
    console.error('  err:', e.message);
  }

  // 6. pipeline runRound
  try {
    const round = await runRound(SAMPLE_PROMPT, { backends: ['heuristic'] });
    check('runRound 返回 round 编号', typeof round.round === 'number');
    check('runRound 返回 optimized', typeof round.optimized === 'string');
    check('runRound 返回 verdict', round.verdict && typeof round.verdict.verdict === 'string');
  } catch (e) {
    check('runRound 异常', false);
    console.error('  err:', e.message);
  }

  // 7. pipeline run
  try {
    const result = await run(SAMPLE_PROMPT, { rounds: 2, backends: ['heuristic'] });
    check('run 返回 rounds 数组', Array.isArray(result.rounds) && result.rounds.length > 0);
    check('run 返回 finalPrompt', typeof result.finalPrompt === 'string');
    check('run 返回 status', typeof result.status === 'string');
  } catch (e) {
    check('run 异常', false);
    console.error('  err:', e.message);
  }

  // 8. formatReport
  try {
    const result = await run(SAMPLE_PROMPT, { rounds: 1, backends: ['heuristic'] });
    const report = formatReport(result);
    check('formatReport 返回字符串', typeof report === 'string' && report.length > 0);
    check('formatReport 含 Final Prompt', report.includes('Final Prompt'));
  } catch (e) {
    check('formatReport 异常', false);
    console.error('  err:', e.message);
  }

  // 9. CLI 帮助
  try {
    const { execFileSync } = require('child_process');
    const out = execFileSync('node', [path.join(__dirname, 'cli.js'), '--help'], { encoding: 'utf8' });
    check('CLI --help 输出 usage', out.includes('--file') && out.includes('--text'));
  } catch (e) {
    check('CLI --help 异常', false);
    console.error('  err:', e.message);
  }

  // 10. CLI 跑真实 pipeline（heuristic only）
  try {
    const { execFileSync } = require('child_process');
    const out = execFileSync('node', [path.join(__dirname, 'cli.js'), '--text', SAMPLE_PROMPT, '--rounds', '1', '--json'], { encoding: 'utf8' });
    const parsed = JSON.parse(out);
    check('CLI JSON 输出含 rounds', Array.isArray(parsed.rounds));
    check('CLI JSON 输出含 finalPrompt', typeof parsed.finalPrompt === 'string');
  } catch (e) {
    check('CLI pipeline 异常', false);
    console.error('  err:', e.message);
  }

  console.log(`\n📊 prompt-optimizer 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();
