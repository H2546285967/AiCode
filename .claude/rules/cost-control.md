---
description: 成本控制、Token消耗、上下文压缩、Git/PR 工作流规则
---

<important if="对话超过5轮或上下文接近40%">

## 💰 成本控制

- 每 5 轮对话后执行 `/compact` 压缩上下文
- 每 5 轮后执行 `left-brain.sh dashboard` 查看统计
- 文件按需读取，不盲目遍历目录
- 输出精炼，不冗长
- `/compact` 加 hint 优于自动触发：`/compact focus on [当前任务]，drop [已完成/无关内容]`
- context 达到 ~300-400k tokens（约 40%）时降智，应主动建议 `/compact` 或新建 session
- **new task = new session**，除非强关联否则不延长当前 session
- **rewind > correct** — 发现错误方向时双击 Esc 或 `/rewind` 回退到错误前重新 prompt。不要在错误基础上纠错，这会污染 context
- **`/compact` vs `/clear`** — compact 有损但有 momentum（适合中途）；clear 重置但精准控制（适合切换任务前）
- 使用 `/context` 查看当前 context 使用量，`/usage` 查看 plan 限制

## 📏 Git 工作流（个人工程）

> 2026-06-25 更新：用户明确这是**个人工程**，不开 PR、不 squash merge 到远程 — 主要在本地 main 增量开发。

- **默认在 main 工作** — 详见 [git-branch.md](git-branch.md)，需要切换分支先问用户
- **频繁 commit** — 任务完成即 commit，至少每小时一次
- **commit 保持小且聚焦** — 一个功能/修复一个 commit，便于回退
- **commit 消息中文** — `类型(模块): 中文标题` 格式（如 `fix(dispatcher): 修复派子代理死循环`）
- **不需要 push** — 除非用户明确说 `git push`，否则不主动推远程
- **不需要 PR / squash merge** — 个人工程不涉及这些
- **需要切换分支时** — 先用 `git stash` 保存未提交改动，问用户是否切换

</important>
