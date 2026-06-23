#!/bin/bash
# evolution-hook.sh — 会话启动时自动检查进化状态
#
# 用法：在 SessionStart hook 中调用
# 输出：状态消息 + 警报

set -e

WORKSPACE_ROOT="/h/AI-han/AiCode"

cd "$WORKSPACE_ROOT" || exit 0

# 检查已实现特性数量
FEATURE_COUNT=$(jq '.features | length' data/github/evolved-features.json 2>/dev/null || echo "0")

# 静默运行每日感知检查（不输出，只记录日志）
node scripts/evolution/trend-watcher.js daily > /dev/null 2>&1 || true

# 读取警报
ALERTS=$(jq '[.entries[-1] | select(.layer == "daily") | .alerts] | .[0] // 0' data/github/trend-watch-log.json 2>/dev/null || echo "0")

if [ "$FEATURE_COUNT" -gt 0 ]; then
  echo "🧬 进化系统: 已实现 $FEATURE_COUNT 个特性 | 今日警报: $ALERTS"
else
  echo "🧬 进化系统: 首次启动 (已扫描候选)"
fi

exit 0