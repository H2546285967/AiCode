# 🧠 左脑记忆系统

> 自动记忆 + 知识图谱 + 语义搜索 + 上下文注入

## 快速命令

```bash
left-brain.sh remember "内容"    # 记忆知识
left-brain.sh recall "关键词"    # 搜索知识
left-brain.sh preference "纠正"  # 纠正学习
left-brain.sh graph              # 知识图谱
left-brain.sh list               # 列表
left-brain.sh dashboard          # 监控面板
left-brain.sh status             # 系统状态
```

## 核心能力

| 能力 | 说明 |
|:-----|:-----|
| **自动记忆** | 对话中检测事实/决策/偏好/纠正，自动存 KB |
| **纠正学习** | 用户说"不对，应该用 X"，系统记住并遵守 |
| **语义搜索** | 关键词匹配 + 相似度 + 图谱扩散（2 跳） |
| **会话记忆** | 会话结束自动保存摘要，新会话自动加载 |

## 自动记忆触发词

| 类型 | 触发词 |
|:-----|:-------|
| 事实 | 日期、时间、地点、数字 |
| 决策 | 决定用、选择了、确认 |
| 偏好 | 我喜欢、习惯用、总是 |
| 纠正 | 不对、错了、别这样 |

## 会话管理

```bash
bash .claude/skills/left-brain/scripts/session-init.sh        # 会话开始
bash .claude/skills/left-brain/scripts/session-summary.sh save "摘要"  # 会话结束
bash .claude/skills/left-brain/scripts/session-summary.sh load         # 加载上次
```

## 目录结构

```
.claude/skills/left-brain/memory/
├── MEMORY.md               # 知识索引
├── knowledge/KB-*.md       # 知识条目
├── sessions/               # 会话摘要
└── associations/graph.json # 知识图谱
```

## 已知限制

- 自动感知依赖 AI 合规性，非 100% 确定性
- 图谱扩散只有 1 跳（减少 context 消耗）
- 语义搜索实际是 grep 关键字匹配（非向量/NLP）
- Token 监控是估算值
