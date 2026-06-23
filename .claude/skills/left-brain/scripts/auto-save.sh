#!/bin/bash
# Stop hook 自动快照（v3.0 - 委托给 save.js）
#
# 职责收窄：
#   1. 读 snapshot-config.json 决定 mode
#   2. 检查最小间隔
#   3. 收集"自动"场景的上下文（KB 增量 + 感知队列）
#   4. 调用 save.js 写快照（统一位置/格式/索引更新）
#
# 不再自己拼 markdown，不再写独立的 sessions/snapshots/ 目录。

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
# SKILL_DIR = .claude/skills/left-brain，需要升三级回到 AiCode 仓库根
ROOT_DIR="$(cd "${SKILL_DIR}/../../.." && pwd)"
SAVE_JS="${ROOT_DIR}/scripts/会话快照/save.js"
CONFIG_FILE="${ROOT_DIR}/.claude/snapshot-config.json"
GUARD_FILE="${SKILL_DIR}/memory/.stop_hook_guard"
KNOWLEDGE_DIR="${SKILL_DIR}/memory/knowledge"
SESSIONS_DIR="${SKILL_DIR}/memory/sessions"
SUMMARY_FILE="${SESSIONS_DIR}/latest_summary.md"
SNAPSHOT_DIR="${SESSIONS_DIR}/snapshots"  # 旧目录，3.0 起仅用于兼容读取

# Guard file：auto-perceive.sh 已提醒时，不再执行保存
if [ -f "$GUARD_FILE" ]; then
    rm -f "$GUARD_FILE"
    exit 0
fi

# 读生效模式（session 覆盖 > 全局配置 > 默认 milestone）
GET_MODE_JS="${SCRIPT_DIR}/get-snap-mode.js"
if [ -f "$GET_MODE_JS" ]; then
    MODE_INFO=$(node "$GET_MODE_JS" --include-config 2>/dev/null)
    MODE=$(echo "$MODE_INFO" | sed -n 's/.*"mode":"\([^"]*\)".*/\1/p')
    MIN_INTERVAL=$(echo "$MODE_INFO" | sed -n 's/.*"minIntervalMinutes":\([0-9]*\).*/\1/p')
    MODE=${MODE:-milestone}
    MIN_INTERVAL=${MIN_INTERVAL:-30}
else
    MODE="milestone"
    MIN_INTERVAL=30
fi

# mode=off 完全跳过
if [ "$MODE" = "off" ]; then
    exit 0
fi

# mode=manual：Stop hook 跳过，只有显式 save.js 才保存
if [ "$MODE" = "manual" ]; then
    exit 0
fi

# 最小间隔检查
if [ -f "$SUMMARY_FILE" ]; then
    saved_time=$(grep 'saved_at:' "$SUMMARY_FILE" 2>/dev/null | sed 's/saved_at: //')
    if [ -n "$saved_time" ]; then
        saved_ts=$(date -d "$saved_time" +%s 2>/dev/null || echo 0)
        now_ts=$(date +%s)
        if [ "$saved_ts" != "0" ] && [ $((now_ts - saved_ts)) -lt $((MIN_INTERVAL * 60)) ]; then
            exit 0
        fi
    fi
fi

# 收集最近 1 小时内的新增/修改知识
recent_knowledge=""
for file in $(ls -1t "${KNOWLEDGE_DIR}"/*.md 2>/dev/null | head -10); do
    file_time=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null || echo 0)
    now_time=$(date +%s)
    age=$((now_time - file_time))
    if [ $age -lt 3600 ]; then
        id=$(basename "$file" .md)
        content=$(grep -E '^content:' "$file" | sed 's/^content: //')
        recent_knowledge="${recent_knowledge}- [$id] ${content}\n"
    fi
done

queue_content=""
if [ -f "${SKILL_DIR}/memory/perceive_queue.txt" ] && [ -s "${SKILL_DIR}/memory/perceive_queue.txt" ]; then
    queue_content=$(cat "${SKILL_DIR}/memory/perceive_queue.txt")
fi

if [ -z "$recent_knowledge" ] && [ -z "$queue_content" ]; then
    exit 0
fi

# 决定 tag
TAG="auto-stop"
MILESTONE_KEYWORDS='完成|里程碑|交付|done|milestone|verified|completed'
if echo "$recent_knowledge $queue_content" | grep -qiE "$MILESTONE_KEYWORDS"; then
    TAG="auto-stop-milestone"
fi

# mode=milestone 时，只在命中里程碑关键词时保存
if [ "$MODE" = "milestone" ] && [ "$TAG" != "auto-stop-milestone" ]; then
    exit 0
fi

# 生成标题：取最近 1 条 KB 的首句
TITLE="Stop hook 自动快照"
if [ -n "$recent_knowledge" ]; then
    first=$(echo -e "$recent_knowledge" | head -1 | sed 's/^- \[[^]]*\] //' | head -c 60)
    TITLE="Stop自动: ${first}"
fi

# 写 latest_summary.md（作为下次 session-summary.sh load 的兜底源）
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
cat > "$SUMMARY_FILE" <<EOFINNER
---
session_id: $(date '+%Y%m%d-%H%M%S')
saved_at: ${TIMESTAMP}
type: session_summary
source: auto-save.sh
---
# 会话摘要（Stop hook 自动保存）
**保存时间**: ${TIMESTAMP}

## 本次新增/修改的知识
$(echo -e "$recent_knowledge")
## 未处理的感知队列
${queue_content:-"(空)"}
EOFINNER

# 调用 save.js 写入统一快照（走 .claude/snapshots/ + 更新 ROOT 索引）
if [ -f "$SAVE_JS" ]; then
    SNAPSHOT_AUTO=1 node "$SAVE_JS" "$TITLE" "$TAG" --force 2>&1 | tail -5
else
    echo "⚠️ save.js 不存在: $SAVE_JS" >&2
fi

# 清理旧 sessions/snapshots/ 目录（兼容读取可用，但不再写入）
if [ -d "$SNAPSHOT_DIR" ]; then
    # 保留 5 个最近作为历史兼容，不影响主流程
    count=$(ls -1 "$SNAPSHOT_DIR"/snapshot_*.md 2>/dev/null | wc -l)
    if [ "$count" -gt 5 ]; then
        ls -1t "$SNAPSHOT_DIR"/snapshot_*.md 2>/dev/null | tail -n $((count - 5)) | while read old; do
            rm -f "$old"
        done
    fi
fi

exit 0
