#!/usr/bin/env node
/**
 * 启发式评分器（从 llm-scorer.js v1.2 提取，保持原有行为）
 *
 * 输入：用户任务文本 + Layer 1 灰区数据
 * 输出：{ scores, composite, reasons }
 *
 * 这是一个**确定性、可解释、零依赖**的评分器。
 * 作为 LLM 失败时的降级路径（默认 backend）。
 *
 * @since v1.6.0 (2026-06-22) 从 llm-scorer.js 拆出
 */

function heuristicScore(taskText, grayData = {}) {
  const scores = {
    decomposability: 0,  // 可拆性 0-10
    workload: 0,         // 工作量 0-10
    risk: 0,             // 风险度 0-10
  };
  const reasons = [];

  // === 维度 1: 可拆性 ===
  // 文本里有多个并列对象 → 可拆性高
  const andPatterns = /(和|与|以及|同时|还有|另外)/g;
  const andMatches = (taskText.match(andPatterns) || []).length;
  scores.decomposability = Math.min(10, andMatches * 3 + 2);

  // === 维度 2: 工作量 ===
  // 涉及文件/模块越多，工作量越大
  const fileCount = grayData.fileCount || 0;
  const moduleCount = grayData.moduleCount || 0;
  scores.workload = Math.min(10, fileCount * 1.5 + moduleCount * 2);

  // === 维度 3: 风险度 ===
  // 涉及数据库/迁移/生产环境 → 风险高
  if (/数据库|migration|迁移|生产|删除|drop/i.test(taskText)) {
    scores.risk = 8;
    reasons.push('涉及数据库/迁移/生产环境');
  } else if (/重构|优化|整理/i.test(taskText)) {
    scores.risk = 5;
    reasons.push('涉及重构/优化');
  } else {
    scores.risk = 3;
    reasons.push('普通任务');
  }

  // === 综合分（加权平均） ===
  const composite = (
    scores.decomposability * 0.4 +
    scores.workload * 0.4 +
    scores.risk * 0.2
  );

  return {
    scores,
    composite: Math.round(composite * 10) / 10,
    reasons,
    backend: 'heuristic',
  };
}

module.exports = { heuristicScore };

// CLI 入口（向后兼容原 llm-scorer.js 的 CLI）
if (require.main === module) {
  const taskText = process.argv.slice(2).join(' ');
  if (!taskText) {
    console.error('用法: node heuristic-scorer.js "<任务>"');
    process.exit(1);
  }

  const score = heuristicScore(taskText, { fileCount: 1, moduleCount: 1 });
  console.log(JSON.stringify(score, null, 2));
}
