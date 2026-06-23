#!/bin/bash
# daily-evolution-cron.sh — 每日自动进化扫描
#
# 建议加入系统 cron：
#   0 2 * * * /h/AI-han/AiCode/scripts/evolution/daily-evolution-cron.sh
#
# 流程：
#   1. 扫描 GitHub 热门项目
#   2. 评估候选项目
#   3. 运行每日感知检查
#   4. 写入日志

set -e

WORKSPACE_ROOT="/h/AI-han/AiCode"
LOG_DIR="$WORKSPACE_ROOT/scripts/logs"
LOG_FILE="$LOG_DIR/evolution-cron.log"

mkdir -p "$LOG_DIR"

echo "=== $(date -Iseconds) 开始每日进化扫描 ===" >> "$LOG_FILE"

cd "$WORKSPACE_ROOT" || exit 1

# Step 1: 扫描
echo "--- $(date +%H:%M:%S) 扫描 GitHub ---" >> "$LOG_FILE"
node scripts/evolution/daily-evolution.js scan >> "$LOG_FILE" 2>&1 || echo "扫描失败" >> "$LOG_FILE"

# Step 2: 分析
echo "--- $(date +%H:%M:%S) 分析候选 ---" >> "$LOG_FILE"
node scripts/evolution/daily-evolution.js analyze >> "$LOG_FILE" 2>&1 || echo "分析失败" >> "$LOG_FILE"

# Step 3: 感知检查
echo "--- $(date +%H:%M:%S) 持续感知 ---" >> "$LOG_FILE"
node scripts/evolution/trend-watcher.js daily >> "$LOG_FILE" 2>&1 || echo "感知失败" >> "$LOG_FILE"

echo "=== $(date -Iseconds) 每日进化完成 ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 保留最近 30 天的日志
find "$LOG_DIR" -name "evolution-cron.log" -mtime +30 -delete 2>/dev/null || true