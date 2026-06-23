#!/bin/bash
# 状态栏脚本 — 显示 context 水位、知识条目、时间、快照模式
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
KNOWLEDGE_DIR="${SKILL_DIR}/memory/knowledge"
GET_MODE_JS="${SCRIPT_DIR}/get-snap-mode.js"

kcount=$(ls -1 "$KNOWLEDGE_DIR"/*.md 2>/dev/null | wc -l)
time=$(date '+%H:%M')

# 读当前快照模式
snap_mode="—"
snap_emoji="📸"
if [ -f "$GET_MODE_JS" ]; then
    mode=$(node "$GET_MODE_JS" 2>/dev/null)
    if [ -n "$mode" ]; then
        case "$mode" in
            off)       snap_mode="off" ;;
            manual)    snap_mode="manual" ;;
            milestone) snap_mode="mstone" ;;
            auto)      snap_mode="auto" ;;
        esac
    fi
fi

# 模式来源提示（覆盖时才显示 📌）
session_file="${SKILL_DIR}/../../../session-snap-mode.json"
if [ -f "${SKILL_DIR}/../../session-snap-mode.json" ] || [ -f "$session_file" ]; then
    snap_emoji="📌"  # 提示用户当前是会话级覆盖
fi

if [ "$kcount" -gt 50 ]; then
  echo "🧠${kcount} ⚠️/compact | ${snap_emoji}${snap_mode} | ${time}"
elif [ "$kcount" -gt 20 ]; then
  echo "🧠${kcount} ℹ️ | ${snap_emoji}${snap_mode} | ${time}"
else
  echo "🧠${kcount} | ${snap_emoji}${snap_mode} | ${time}"
fi
