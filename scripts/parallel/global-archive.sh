#!/usr/bin/env bash
# ==============================================================================
# global-archive.sh —— 三级检查点的阶段 3：全局归档
#
# 用法: bash global-archive.sh "<任务名>"
#
# 流程:
#   1. 找所有相关快照（plan-*, 普通快照）
#   2. 把当前代码状态打包到 archives/<任务名>-<时间戳>/
#   3. 生成"完成报告"（含所有快照索引）
#   4. Git tag 标记可回滚点
#   5. 输出"恢复指令"
# ==============================================================================

set -e

TASK_NAME="${1:?用法: bash global-archive.sh \"<任务名>\"}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

NOW=$(date "+%Y-%m-%d %H:%M:%S")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SAFE_TASK=$(echo "$TASK_NAME" | tr '/\\:*?"<>+' '-' | cut -c1-30)

ARCHIVE_DIR="${ROOT}/archives/${SAFE_TASK}-${TIMESTAMP}"
SNAPSHOT_DIR="${ROOT}/.claude/snapshots"

echo "================================================"
echo "📦 全局归档：$TASK_NAME"
echo "================================================"
echo "时间: $NOW"
echo ""

# 1. 创建归档目录
mkdir -p "$ARCHIVE_DIR"
echo "📁 归档目录: $ARCHIVE_DIR"

# 2. 打包快照
SNAPSHOT_INDEX="${ARCHIVE_DIR}/snapshots-index.md"
cat > "$SNAPSHOT_INDEX" << EOF
# $TASK_NAME - 快照索引

**归档时间**: $NOW

## 相关快照

EOF

echo "" >> "$SNAPSHOT_INDEX"
echo "| 级别 | 时间 | 文件 | 标题 |" >> "$SNAPSHOT_INDEX"
echo "|:-----|:-----|:-----|:-----|" >> "$SNAPSHOT_INDEX"

# 找 plan-* 快照
for snap in "$SNAPSHOT_DIR"/plan-*; do
  [ -f "$snap" ] || continue
  fname=$(basename "$snap")
  # 提取时间戳（前 19 字符去掉 -）
  snap_time=$(echo "$fname" | cut -c6-24 | sed 's/-/:/g' | sed 's/T/ /')
  title=$(grep -m1 "^# 📋" "$snap" 2>/dev/null | sed 's/^# 📋 计划快照：//' || echo "$fname")
  echo "| 计划 | $snap_time | \`$fname\` | $title |" >> "$SNAPSHOT_INDEX"
  cp "$snap" "$ARCHIVE_DIR/"
done

# 找普通摘要快照（最近 10 个相关）
for snap in $(ls -t "$SNAPSHOT_DIR"/*.md 2>/dev/null | grep -v "plan-" | head -10); do
  [ -f "$snap" ] || continue
  fname=$(basename "$snap")
  snap_time=$(echo "$fname" | cut -c1-19 | sed 's/T/ /' | sed 's/-/:/g' | sed 's/:/_/2g' | sed 's/_/:/g')
  title=$(grep -m1 "^# 快照:" "$snap" 2>/dev/null | sed 's/^# 快照: //' || echo "$fname")
  echo "| 迭代 | $snap_time | \`$fname\` | $title |" >> "$SNAPSHOT_INDEX"
done

echo "📄 快照索引: $SNAPSHOT_INDEX"

# 3. Git tag
echo ""
echo "🏷️  创建 Git tag..."
git tag -a "archive-$SAFE_TASK-$TIMESTAMP" -m "归档: $TASK_NAME ($NOW)" 2>&1 | tail -2 || echo "   （可能不是 git 仓库，跳过）"

# 4. 完成报告
REPORT_FILE="${ARCHIVE_DIR}/COMPLETION-REPORT.md"
cat > "$REPORT_FILE" << EOF
# $TASK_NAME - 完成报告

**完成时间**: $NOW
**Git tag**: archive-$SAFE_TASK-$TIMESTAMP

## 摘要

本次任务完成归档。详见 \`snapshots-index.md\` 和原始快照。

## 恢复指令

\`\`\`bash
# 查看 Git 历史
git log --oneline -10

# 回滚到本任务完成点
git checkout archive-$SAFE_TASK-$TIMESTAMP

# 或新建分支查看
git checkout -b recover-$SAFE_TASK archive-$SAFE_TASK-$TIMESTAMP
\`\`\`

## 归档目录

- 归档位置: \`$ARCHIVE_DIR\`
- 快照索引: \`snapshots-index.md\`
- 本报告: \`COMPLETION-REPORT.md\`
EOF

echo "📋 完成报告: $REPORT_FILE"

# 5. 输出总结
echo ""
echo "================================================"
echo "✅ 全局归档完成"
echo "================================================"
echo ""
echo "归档目录:"
echo "  $ARCHIVE_DIR"
echo ""
echo "包含:"
echo "  - snapshots-index.md    (所有快照索引)"
echo "  - COMPLETION-REPORT.md (完成报告)"
ls -la "$ARCHIVE_DIR" | grep -v "^total" | tail -n +2 | awk '{print "  -", $NF}' | head -5

echo ""
echo "Git tag: archive-$SAFE_TASK-$TIMESTAMP"