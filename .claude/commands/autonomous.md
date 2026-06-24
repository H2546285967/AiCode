---
name: autonomous
description: 开启自主演进模式（v2.0 P0-1）—— 开关 ON 后 Claude 自主决策开发，不逐步确认
---

打开**自主模式开关**。开关 ON 期间，Claude 会：

- 完成一个功能/增量后**自动选下一个**做（不询问"接下来做啥？"）
- 关键决策点**写入快照**而不是问
- 完成后**自动 commit**（如果安全）

## 用法

```bash
# 打开开关（无原因）
/autonomous

# 打开开关（带原因）
/autonomous 我离开1小时
/autonomous 周末出去办事，自动跑
```

## 行为对比

| 场景 | OFF（默认） | ON（自主） |
|:-----|:-----------|:----------|
| 完成 1 个增量后 | "接下来做啥？" | 自动选下一个 |
| 关键决策 | 询问 | 写入快照继续 |
| commit | 询问 | 自动（安全时） |
| 失败 | 询问 | 5 次后自动停 + 汇报 |

## 安全边界

- ✅ 自主做：智能增量深化、bug 修、文档、commit
- ⚠️ 慎做：修改 `scripts/orchestrator/`、`.claude/`、CLAUDE.md（commit 前先 snapshot）
- ❌ 不做：push 到远程、删分支、删文件、改主目录外文件

## 关闭

```bash
/autonomous-stop
# 或
/autonomous toggle
```

## 顶部提示

session-init 顶部 Step 7 会显示当前开关状态：
- 🤖 自主模式: ON（开启于 2026/6/24 17:11）
- 🙋 正常模式: OFF（逐步确认）

## 状态文件

`.claude/skills/left-brain/memory/autonomous-state.json`（gitignore 排除）