#!/usr/bin/env node
/**
 * llm-scorer.js v1.6 —— 薄层入口，分发到不同 backend
 *
 * 改动（v1.6.0）：
 *   - 把启发式逻辑拆到 heuristic-scorer.js
 *   - 新建 llm-adapter.js 暴露 4 种 backend
 *   - 本文件只做"选择 backend + 调 scoreWithFallback"
 *   - 默认行为完全兼容（仍返回原 scores 字段）
 *
 * 用法：
 *   node llm-scorer.js "<任务>"
 *   LLM_BACKEND=anthropic node llm-scorer.js "<任务>"
 *
 * @since v1.2.0 (2026-06-22) 原始启发式实现
 * @changed v1.6.0 (2026-06-22) 重构为接口 + adapter 模式
 */

const { scoreWithFallback, createAdapter } = require('./llm-adapter');

/**
 * 同步版 score（向后兼容原 API）
 * 内部仍调 async version，但用同步接口包装方便旧调用方
 */
function llmScore(taskText, grayData) {
  // 同步调用：用 deasync 模式不可靠，这里返回 Promise
  // 但保持向后兼容：返回带 backend 字段的对象
  return scoreWithFallback(taskText, grayData);
}

/**
 * 决策函数：基于 LLM 评分决定是否派 Agent
 * （保持原签名）
 */
function decideFromScore(scoreResult, threshold = 6) {
  if (scoreResult.composite >= threshold + 2) {
    return { dispatch: true, agents: 3, reason: `LLM 评分高（${scoreResult.composite}），派 3 个` };
  }
  if (scoreResult.composite >= threshold) {
    return { dispatch: true, agents: 2, reason: `LLM 评分中（${scoreResult.composite}），派 2 个` };
  }
  return { dispatch: false, agents: 0, reason: `LLM 评分低（${scoreResult.composite} < ${threshold}），不派` };
}

// CLI 入口
if (require.main === module) {
  const taskText = process.argv.slice(2).join(' ');
  if (!taskText) {
    console.error('用法: node llm-scorer.js "<任务>"');
    console.error('      LLM_BACKEND=anthropic node llm-scorer.js "<任务>"');
    process.exit(1);
  }

  const grayData = { fileCount: 1, moduleCount: 1, taskType: 'unknown' };

  // 异步执行
  scoreWithFallback(taskText, grayData).then(score => {
    const decision = decideFromScore(score);
    console.log(JSON.stringify({
      ...score,
      decision,
      note: `当前 backend: ${score.backend}（heuristic 始终可用，anthropic/ollama/cli 仅保留接口）`,
    }, null, 2));
  }).catch(e => {
    console.error(`[llm-scorer] 评分失败（应该不会发生，因为有 fallback）: ${e.message}`);
    process.exit(1);
  });
}

module.exports = { llmScore, decideFromScore };
