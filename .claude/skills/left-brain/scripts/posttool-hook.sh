#!/bin/bash
# PostToolUse hook — 智能增量 A + B 入口（v1.9.1）
#
# 触发：每次 Claude 调用工具后（Edit/Write/Agent 等）
# 作用：并行跑两个智能引擎，永不阻塞主流程
#   A. self-reflect.js — 自我反思（4 规则自检）
#   B. plan-detect.js  — 智能任务规划检测（识别 [plan] 块）
#
# 设计原则：永不阻塞主流程（任何异常都 exit 0）
# @since v1.9.1 (2026-06-24)

# 通过 git 找仓库根（最可靠，跨平台）
WORKSPACE_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)

# 把 stdin 保存一份给两个引擎用（cat 只能消费一次）
INPUT=$(cat)

# 引擎 A：自我反思
if [ -n "$WORKSPACE_ROOT" ] && [ -f "$WORKSPACE_ROOT/scripts/orchestrator/reflection/self-reflect.js" ]; then
  echo "$INPUT" | node "$WORKSPACE_ROOT/scripts/orchestrator/reflection/self-reflect.js" 2>/dev/null
fi

# 引擎 B：智能规划检测
if [ -n "$WORKSPACE_ROOT" ] && [ -f "$WORKSPACE_ROOT/scripts/orchestrator/planning/plan-detect.js" ]; then
  echo "$INPUT" | node "$WORKSPACE_ROOT/scripts/orchestrator/planning/plan-detect.js" detect 2>/dev/null
fi

exit 0