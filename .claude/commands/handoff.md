---
name: handoff
description: 🚀 会话交接 — 自动存快照 + 生成接续 prompt
---

# 🚀 会话交接助手（v3.0.4 M21 + M22）

> **作用**：当前会话收尾时，自动保存进度并生成"下个会话第一句 prompt"，实现无缝上下文切换。
> **典型场景**：上下文太长 / 想 /clear 但不想丢状态 / 想换 Claude Code 窗口继续。

## 用法

```bash
node scripts/orchestrator/handoff.js "当前标题" "下一阶段标题"
node scripts/orchestrator/handoff.js "当前标题" --dry-run                  # 预览
node scripts/orchestrator/handoff.js "当前标题" "下一阶段" --auto           # 全自动接续
```

参数：

| 位置 | 必填 | 说明 |
|:----:|:----:|:-----|
| 第一个 | ✅ | 当前会话标题（写快照用） |
| 第二个 | ❌ | 下一阶段标题（默认 = 第一个） |

选项：

| 选项 | 说明 |
|:-----|:-----|
| `--dry-run` | 只打印接续 prompt，不写快照（默认安全）|
| `--auto` / `-a` | 全自动：入队 next + spawn 新 `claude -p` 子会话接续 |
| `--tags "tag1 tag2"` | 自定义快照标签（默认 `handoff`）|

## 自动执行的动作

1. **存快照**（强制）：调 `session-summary.sh save --force`
2. **更新状态**：写 `autonomous-state.json.awaiting_handoff = true` + `next_action = <下一阶段>`
3. **next 入队**：把下一阶段写入 `evolution-plan.json` next 队列（ID 不重复）
4. **生成接续 prompt**：4 段拼装（会话摘要 / 待办 / 下阶段 / 约束）
5. **--auto 时 spawn 新子会话**：直接启动 `claude -p <prompt>`，不需要手动 /clear 粘贴

## 下个会话怎么接续

```
┌─ 当前会话（你正在看的） ─┐         ┌─ 新会话 ──────────┐
│ 1. /handoff "标题" "下一阶段" │         │ 1. /clear 或 New Chat  │
│ 2. 看 CLI 输出接续 prompt    │  ────>  │ 2. 粘贴 prompt 到开头  │
│ 3. 自动存快照                │         │ 3. session-init 自动加载│
│ 4. 关闭当前会话              │         │ 4. 继续干活           │
└────────────────────────────┘         └──────────────────────┘
```

## 典型场景

| 场景 | 用法 |
|:-----|:-----|
| 上线前收尾 | `/handoff "M20 完成" "M21: /handoff 命令"` |
| 想换 Claude Code 窗口 | `/handoff "决策完成" --dry-run` 先看 prompt |
| **一条命令自动接续** | `/handoff "M20 完成" "M21: /handoff 命令" --auto` |
| 离开几小时 | `/handoff "当前会话结束" "下一会话待定"` + `/autonomous always` |
| 完成里程碑 | `/handoff "v3.0.4 完成" "v3.0.5 待规划" --tags "milestone handoff"` |

## 与 /autonomous / /snap-save 的关系

| 命令 | 何时用 |
|:-----|:-----|
| `/snap-save` | **手动存一次快照**（不生成接续 prompt） |
| `/autonomous` | **循环跑 next 队列**（自动快照 + 新子会话） |
| **`/handoff`** | **当前会话收尾**（自动快照 + 生成接续 prompt） |

3 个命令各管一段，不冲突：
- `/snap-save` = 纯存档
- `/autonomous` = 机器接续
- **`/handoff` = 人工接续**

## 接续 prompt 模板（自动生成）

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 会话交接 — 继续工作模式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你正在接续上一会话的工作（<title>）。

## 📋 上一会话快照

### 会话摘要
<最新 summary>

### 待办列表
- <todo 1>
- <todo 2>

## 🎯 下一阶段目标

**<nextTitle>**

## ⚠️ 当前状态与约束
- 自主模式: <ON/OFF>
- 演进锁: <🟢 空闲 / 占用>
- ...
```

## 关联

- 复用 `session-summary.sh save --force`（v1.8 已建）
- 复用 `autonomous-state.json` schema（v2.2.0 已建）
- 不破坏 `/autonomous` / `/snap-save` / `/clear` / `/compact`
