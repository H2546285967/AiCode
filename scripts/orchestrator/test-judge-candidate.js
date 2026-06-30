#!/usr/bin/env node
/**
 * judgeCandidateWithFallback 单元测试（M12 LLM-judge 闸门）
 * 验证：
 *   1. 4 种 adapter 都有 judge() 方法（接口契约）
 *   2. HeuristicAdapter.judge 判定逻辑（accept/reject/skip）
 *   3. AnthropicAdapter.judge 抛错（接口预留）
 *   4. judgeCandidateWithFallback 永不抛错 + 默认 backend
 *   5. criteria 自定义阈值生效
 *   6. fallback 链路：heuristic 直接跑通 / anthropic 失败降级
 */

const {
  createAdapter,
  judgeCandidateWithFallback,
  HeuristicAdapter,
  AnthropicAdapter,
  OllamaAdapter,
  CliAdapter,
} = require('./llm-adapter');

let pass = 0, fail = 0;

function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

// 测试夹具：构造一个"高评分小工作量"的典型 accept 候选
const acceptCandidate = {
  name: 'mcp-fs-cache',
  description: '文件系统 MCP 加一层 LRU 缓存',
  summary: '加速高频读',
  composite_score: 8.2,
  estimated_effort: 'small',
  suggestion: 'adopt',
};

// ========== 1. 接口契约：4 adapter 都有 judge 方法 ==========

check('HeuristicAdapter.prototype 有 judge', typeof HeuristicAdapter.prototype.judge === 'function');
check('AnthropicAdapter.prototype 有 judge', typeof AnthropicAdapter.prototype.judge === 'function');
check('OllamaAdapter.prototype 有 judge', typeof OllamaAdapter.prototype.judge === 'function');
check('CliAdapter.prototype 有 judge', typeof CliAdapter.prototype.judge === 'function');

(async () => {
  // ========== 2. HeuristicAdapter.judge 判定逻辑 ==========

  // 2.1 accept
  const r1 = await new HeuristicAdapter().judge(acceptCandidate);
  check('高分小工作量 + adopt → accept', r1.verdict === 'accept');
  check('accept 返回 score 字段', typeof r1.score === 'number' && r1.score === 8.2);
  check('accept 返回 reasons 数组', Array.isArray(r1.reasons) && r1.reasons.length > 0);
  check('accept 返回 backend=heuristic', r1.backend === 'heuristic');

  // 2.2 reject: composite_score 太低
  const lowScore = { ...acceptCandidate, composite_score: 5.5 };
  const r2 = await new HeuristicAdapter().judge(lowScore);
  check('composite 5.5 < 7.0 → reject', r2.verdict === 'reject');
  check('reject reasons 包含阈值', r2.reasons[0].includes('5.5 < 7'));

  // 2.3 skip: effort=medium（不在 allowedEffort）
  const mediumEffort = { ...acceptCandidate, estimated_effort: 'medium' };
  const r3 = await new HeuristicAdapter().judge(mediumEffort);
  check('effort=medium → skip（需人工确认）', r3.verdict === 'skip');
  check('skip reasons 包含 effort', r3.reasons[0].includes('medium'));

  // 2.4 reject: 包含禁止依赖
  const forbiddenDep = { ...acceptCandidate, description: 'uses @anthropic-ai/sdk for fast inference' };
  const r4 = await new HeuristicAdapter().judge(forbiddenDep, { forbiddenDeps: ['@anthropic-ai'] });
  check('含禁止依赖 → reject（一票否决）', r4.verdict === 'reject');
  check('forbidden reasons 包含 dep 名字', r4.reasons[0].includes('@anthropic-ai'));

  // 2.5 skip: suggestion=skip
  const skipSug = { ...acceptCandidate, suggestion: 'skip' };
  const r5 = await new HeuristicAdapter().judge(skipSug);
  check('suggestion=skip → skip', r5.verdict === 'skip');

  // 2.6 字段别名兼容（composite_score / score；estimated_effort / effort）
  const altFields = { name: 'x', score: 8.0, effort: 'small', suggestion: 'adopt' };
  const r6 = await new HeuristicAdapter().judge(altFields);
  check('score/effort 字段别名兼容 → accept', r6.verdict === 'accept');

  // ========== 3. AnthropicAdapter.judge 已实现（M54 Phase 2）============

  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9'; // 无效地址，确保快速失败
  const anthropic = new AnthropicAdapter();
  check('AnthropicAdapter 有 judge 方法', typeof anthropic.judge === 'function');
  let anthropicRejected = false;
  try { await anthropic.judge(acceptCandidate); } catch (e) { anthropicRejected = true; }
  check('AnthropicAdapter.judge 无效 key/地址时拒绝', anthropicRejected);
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_BASE_URL;

  // ========== 4. judgeCandidateWithFallback 永不抛错 ==========

  // 4.1 默认 heuristic 跑通
  const j1 = await judgeCandidateWithFallback(acceptCandidate);
  check('judgeCandidateWithFallback(默认) backend=heuristic', j1.backend === 'heuristic');
  check('judgeCandidateWithFallback 返回 verdict', ['accept', 'reject', 'skip'].includes(j1.verdict));

  // 4.2 anthropic 失败 → 降级到 heuristic
  const j2 = await judgeCandidateWithFallback(acceptCandidate, {}, {});
  check('anthropic 失败 → fallback 仍返回 backend=heuristic', j2.backend === 'heuristic');
  check('fallback 后 verdict 仍合理', ['accept', 'reject', 'skip'].includes(j2.verdict));

  // 4.3 异常输入也不抛错
  const j3 = await judgeCandidateWithFallback(null);
  check('null candidate 不抛错', j3 && typeof j3.verdict === 'string');
  const j4 = await judgeCandidateWithFallback({});
  check('空对象 candidate 不抛错', j4 && typeof j4.verdict === 'string');

  // ========== 5. criteria 自定义阈值生效 ==========

  // 5.1 降低 minComposite 后 accept
  const loose = await judgeCandidateWithFallback(
    { ...acceptCandidate, composite_score: 6.0 },
    { minComposite: 5.0 }
  );
  check('minComposite=5.0 时 score=6.0 → accept', loose.verdict === 'accept');

  // 5.2 提高 minComposite 后 reject
  const strict = await judgeCandidateWithFallback(
    { ...acceptCandidate, composite_score: 6.5 },
    { minComposite: 7.0 }
  );
  check('minComposite=7.0 时 score=6.5 → reject', strict.verdict === 'reject');

  // 5.3 扩展 allowedEffort
  const medAccept = await judgeCandidateWithFallback(
    { ...acceptCandidate, estimated_effort: 'medium' },
    { allowedEffort: ['small', 'medium'] }
  );
  check('allowedEffort=[small,medium] 时 effort=medium → accept', medAccept.verdict === 'accept');

  // ========== 6. 总结 ==========

  console.log(`\n📊 judge 测试结果: ${pass} pass / ${fail} fail`);
  if (fail > 0) process.exit(1);
})();
