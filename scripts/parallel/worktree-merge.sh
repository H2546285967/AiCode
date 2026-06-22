#!/usr/bin/env bash
# ==============================================================================
# worktree-merge.sh - 合并 worktree 回主分支
# 用法: bash worktree-merge.sh <任务名>
# 流程:
#   1. 检查所有 worktree 状态
#   2. 逐个合并到主分支
#   3. 处理冲突（如果有）
#   4. 清理 worktree
# ==============================================================================

set -e

TASK_NAME="${1:?用法: bash worktree-merge.sh <任务名>}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

MAIN_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "master")

# 找匹配的 worktree（在 .worktrees/<任务名>/ 下，绝对路径）
# 任务名可能带时间戳（如 v1.2-test-124755），所以用前缀匹配
WORKTREE_PARENT=""
if [ -d "${ROOT}/.worktrees/${TASK_NAME}" ]; then
  WORKTREE_PARENT="${ROOT}/.worktrees/${TASK_NAME}"
else
  # 尝试前缀匹配
  for dir in "${ROOT}/.worktrees/${TASK_NAME}"-*; do
    if [ -d "$dir" ]; then
      WORKTREE_PARENT="$dir"
      echo "📂 自动匹配 worktree: $WORKTREE_PARENT"
      break
    fi
  done
fi

if [ -z "$WORKTREE_PARENT" ] || [ ! -d "$WORKTREE_PARENT" ]; then
  echo "❌ 找不到 worktree 目录: ${ROOT}/.worktrees/${TASK_NAME}*"
  echo ""
  echo "现有的 worktree:"
  git worktree list
  exit 1
fi

if [ ! -d "$WORKTREE_PARENT" ]; then
  echo "❌ 找不到 worktree 目录: $WORKTREE_PARENT"
  echo ""
  echo "现有的 worktree:"
  git worktree list
  exit 1
fi

echo "================================================"
echo "🔀 合并 worktree: $TASK_NAME → $MAIN_BRANCH"
echo "================================================"
echo ""

# 逐个合并
for wt_dir in "$WORKTREE_PARENT"/*/; do
  [ -d "$wt_dir" ] || continue
  WT_NAME=$(basename "$wt_dir")
  BR_NAME=$(cd "$wt_dir" && git symbolic-ref --short HEAD)

  echo "📦 处理 $WT_NAME (分支: $BR_NAME)"

  # 1. 检查 worktree 是否有未提交
  if ! (cd "$wt_dir" && git diff --quiet HEAD); then
    echo "   ⚠️  有未提交变更，先 commit"
    (cd "$wt_dir" && git add -A && git commit -m "wip: $TASK_NAME worker $WT_NAME" 2>&1 | tail -2) || true
  fi

  # 2. 合并到主分支
  echo "   合并 $BR_NAME → $MAIN_BRANCH"
  if ! git merge --no-ff "$BR_NAME" -m "合并: $TASK_NAME worker $WT_NAME" 2>&1 | tail -5; then
    echo ""
    echo "   ❌ 合并冲突！请手动处理："
    echo "      git status  # 看冲突文件"
    echo "      # 解决冲突后:"
    echo "      git add ."
    echo "      git commit"
    echo "      bash $0 $TASK_NAME  # 重跑"
    exit 1
  fi
  echo ""
done

# 3. 清理 worktree
echo "🧹 清理 worktree..."
for wt_dir in "$WORKTREE_PARENT"/*/; do
  [ -d "$wt_dir" ] || continue
  WT_NAME=$(basename "$wt_dir")
  BR_NAME=$(cd "$wt_dir" && git symbolic-ref --short HEAD)
  echo "   删除 worktree: $WT_NAME"
  git worktree remove --force "$wt_dir" 2>&1 | tail -1
  echo "   删除分支: $BR_NAME"
  git branch -D "$BR_NAME" 2>&1 | tail -1
done

# 删除 worktree 父目录
rmdir "$WORKTREE_PARENT" 2>/dev/null || true

echo ""
echo "================================================"
echo "✅ 合并完成！"
echo "================================================"
echo ""
echo "当前状态："
git log --oneline -5