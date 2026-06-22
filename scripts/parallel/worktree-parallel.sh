#!/usr/bin/env bash
# ==============================================================================
# worktree-parallel.sh - 创建 2-3 个并行 worktree，让多个子代理在不同分支干活
# 用法: bash worktree-parallel.sh <任务名> [N=2]
# 示例: bash worktree-parallel.sh v1.2-改进
#       bash worktree-parallel.sh v1.2-改进 3
# ==============================================================================

set -e

TASK_NAME="${1:?用法: bash worktree-parallel.sh <任务名> [N=2]}"
N="${2:-2}"

# 工作空间根目录
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# 主分支名
MAIN_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")

# 任务 ID（用时间戳避免冲突）
TIMESTAMP=$(date +%H%M%S)
TASK_ID="${TASK_NAME}-${TIMESTAMP}"

echo "================================================"
echo "🚀 Worktree 并行任务：$TASK_NAME"
echo "================================================"
echo "主分支:    $MAIN_BRANCH"
echo "并行数:    $N"
echo "任务 ID:   $TASK_ID"
echo ""

# 创建 N 个 worktree
WORKTREES=()
for i in $(seq 1 $N); do
  BRANCH_NAME="${TASK_ID}-worker-${i}"
  # 用绝对路径（避免 git worktree 解析 ../ 时跳到 H:/AI-han/）
  WORKTREE_DIR="${ROOT}/.worktrees/${TASK_ID}/w${i}"

  echo "📦 创建 worker $i:"
  echo "   分支: $BRANCH_NAME"
  echo "   目录: $WORKTREE_DIR"

  git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$MAIN_BRANCH" 2>&1 | tail -2
  WORKTREES+=("$BRANCH_NAME:$WORKTREE_DIR")
  echo ""
done

echo "================================================"
echo "✅ 全部 worktree 创建完成"
echo "================================================"
echo ""
echo "📋 使用说明："
echo ""
for wt in "${WORKTREES[@]}"; do
  IFS=':' read -r BR DIR <<< "$wt"
  echo "  Worker: $BR"
  echo "  目录:   $DIR"
  echo "  启动:   cd $DIR && claude --worktree"
  echo ""
done

echo "🔀 合并回主分支：跑 worktree-merge.sh $TASK_NAME"