# 🚀 handoff + autonomous 教程

> 3 个命令覆盖所有会话交接场景。

## 30 秒先看

| 你的情况 | 命令 |
|:---------|:-----|
| 任务没处理完，要离开 | `/handoff "正在处理 XXX，进度 YYY，后续 ZZZ"` |
| 让 AI 自主完成单个大功能 | `/autonomous single` |
| 长期离开，让 AI 循环进化 | `/autonomous always` + `npm run autonomous:runner` |

## 场景 1：任务没处理完要离开

```bash
/handoff "M54 G 设计已定，待写 00_会话交接速查.md" "继续写速查文档"
```

AI 会：
1. 存快照到 `sessions/latest_summary.md`
2. 生成接续 prompt
3. 下次开新会话时自动提示"继续 XXX"

> 正常完成任务后不需要 handoff — 文档和快照已经自动更新了。

## 场景 2：让 AI 自主完成单个大功能

```bash
/autonomous single
```

AI 会自主完成当前核心功能，然后自动 commit、保存快照、关闭。

## 场景 3：长期离开循环进化

```bash
/autonomous always
```

然后在另一个 PowerShell 窗口：

```bash
npm run autonomous:runner
```

AI 会循环执行 `evolution-plan.json` 的 next 队列，每个任务完成后自动 commit + 快照，然后取下一个。5 次失败自动停。

---

详细命令参数见 `.claude/commands/handoff.md` 和 `.claude/commands/autonomous.md`。
