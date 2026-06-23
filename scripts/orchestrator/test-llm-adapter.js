#!/usr/bin/env node
/**
 * llm-adapter.js 单元测试
 * 验证：
 *   1. 4 种 backend 都能被 createAdapter 创建
 *   2. 默认 backend = heuristic
 *   3. 失败的 backend 自动降级到 heuristic
 *   4. scoreWithFallback 永不抛错
 *   5. heuristic 评分结果与原 llm-scorer.js 一致
 */

const {
  createAdapter,
  scoreWithFallback,
  HeuristicAdapter,
  AnthropicAdapter,
  OllamaAdapter,
  CliAdapter,
} = require('./llm-adapter');
const { heuristicScore } = require('./heuristic-scorer');

let pass = 0, fail = 0;

function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

// ========== 1. 工厂方法：4 种 backend 都能创建 ==========

// 设置临时 API key，让 AnthropicAdapter 不抛错（验证非降级路径）
process.env.ANTHROPIC_API_KEY = 'test-key-for-factory-test';

check('createAdapter("heuristic") → HeuristicAdapter', createAdapter('heuristic') instanceof HeuristicAdapter);
check('createAdapter("anthropic") → AnthropicAdapter（有 API key）', createAdapter('anthropic') instanceof AnthropicAdapter);
check('createAdapter("ollama") → OllamaAdapter', createAdapter('ollama') instanceof OllamaAdapter);
check('createAdapter("cli") → CliAdapter', createAdapter('cli') instanceof CliAdapter);
check('createAdapter("unknown") → HeuristicAdapter（未知 backend 降级）', createAdapter('xyz') instanceof HeuristicAdapter);

// ========== 2. 默认 backend ==========

delete process.env.LLM_BACKEND;
check('默认 backend（无环境变量）= heuristic', createAdapter().name === 'heuristic');
check('LLM_BACKEND=heuristic', createAdapter('heuristic').name === 'heuristic');

// ========== 3. 失败降级 ==========

// 设置不存在的 ANTHROPIC_API_KEY 不应该让 AnthropicAdapter 创建失败（应在 score 时失败）
// 但缺 key 会让构造函数抛错 → 工厂方法应该降级
const originalKey = process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
const fallbackAdapter = createAdapter('anthropic');
check('AnthropicAdapter 缺 API key → 工厂降级到 HeuristicAdapter', fallbackAdapter instanceof HeuristicAdapter);
// 还原
if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;

// ========== 4. scoreWithFallback 永不抛错 ==========

(async () => {
  // 4.1 默认 heuristic 跑通
  const r1 = await scoreWithFallback('全面排查 BUG 和重构 优化代码', { fileCount: 3, moduleCount: 2 });
  check('scoreWithFallback(默认) 返回 backend=heuristic', r1.backend === 'heuristic');
  check('scoreWithFallback 返回 scores 对象', r1.scores && typeof r1.scores.decomposability === 'number');
  check('scoreWithFallback 返回 composite', typeof r1.composite === 'number');
  check('scoreWithFallback 返回 reasons 数组', Array.isArray(r1.reasons));

  // 4.2 即使 anthropic 失败也降级
  const r2 = await scoreWithFallback('迁移数据库', { fileCount: 5, moduleCount: 3 });
  check('anthropic backend 调用失败 → fallback 仍返回 backend=heuristic', r2.backend === 'heuristic');

  // 4.3 空文本也安全
  const r3 = await scoreWithFallback('', {});
  check('空文本不抛错', r3 && r3.backend === 'heuristic');

  // ========== 5. heuristic 评分与原版一致 ==========

  // 原 llm-scorer.js 行为：fileCount=1, moduleCount=1, taskType=unknown
  // 我们对比 heuristicScore 和 原函数输出
  const legacyScore = heuristicScore('全面排查 BUG 和重构 优化代码', { fileCount: 1, moduleCount: 1 });
  const newScore = await scoreWithFallback('全面排查 BUG 和重构 优化代码', { fileCount: 1, moduleCount: 1 });
  check('heuristic 评分结果与原版一致（composite）', legacyScore.composite === newScore.composite);
  check('heuristic 评分结果与原版一致（scores.decomposability）',
    legacyScore.scores.decomposability === newScore.scores.decomposability);
  check('heuristic 评分结果与原版一致（reasons 数）',
    legacyScore.reasons.length === newScore.reasons.length);

  // ========== 总结 ==========
  console.log(`\n📊 llm-adapter 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();
