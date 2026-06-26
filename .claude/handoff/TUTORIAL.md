# 🚀 handoff 教程（v3.0.5 M24 · 5 个真实场景）

> **本教程面向"人"**，不讲命令参数（`.claude/commands/handoff.md` 才是那个）。讲的是**你处在什么场景下**该用哪条命令、怎么用、用错会怎样。
>
> 读完本教程后，handoff 命令应该变成肌肉记忆：看到场景→本能用对应模式→不犹豫。

---

## 📖 30 秒先看

| 场景 | 一句话 | 命令 |
|:-----|:-------|:-----|
| 想睡觉了 | 存快照+生成接续 prompt+开 VS Code 新窗口 | `/handoff "今天做 M22" --auto` |
| 上下文快 40% 了 | 1 步切换不丢状态 | `/handoff`（无参数，自动读下一步）|
| 刚完成里程碑 | 存快照并加 milestone tag | `/handoff "v3.0.4 完成" --tags "milestone handoff"` |
| 想开第二个 Claude 窗口 | 不串味工作流 | `/handoff "主任务" --auto` + 新窗口 |
| 离开几小时让 runner 跑 | 机器接续（不是 handoff）| `/autonomous always` + `npm run autonomous:runner` |

**5 场景教程** —— 下面展开：

---

## 🛏️ 场景 1：晚 12 点想睡觉

**问题**：今天的工作做了一半，明天还要继续；直接关电脑=明天从头来。

**错误做法**：
- ❌ /clear 然后关电脑 → 上下文全丢
- ❌ 把进度贴在聊天里 → 还得自己读、自己懂
- ❌ 想着"明天再开新会话" → 明天忘了今天干了啥

**正确做法**（3 步，30 秒）：

```bash
# 第 1 步：写当前进度
/handoff "今天完成 M22 handoff --auto" "明天做 M23 文档清理"

# 第 2 步：等 CLI 输出（30+ 行接续 prompt）

# 第 3 步：关电脑睡觉
```

**明天怎么继续**：
- 开电脑 → Claude Code → `claude --append-system-prompt-file .claude/handoff/continue.prompt.md "继续"`
- 或者更省事：`/handoff "今天完成 M22" --auto` 让它开 VS Code 新窗口+复制命令

**进阶**（推荐）：如果你想"睡觉期间让 Claude 自己干活"：
```bash
# 关闭 handoff 路径，开 runner 路径
/autonomous always
# 离开
```
→ `npm run autonomous:runner` 在另一个终端跑，runner 帮你做 M23
→ 你明天回来 `/autonomous-stop` 切回人工

---

## 🧠 场景 2：上下文 40% 触顶

**问题**：看到 Claude Code 顶部提示"context usage high"——再做两三个回合就降智/截断。

**错误做法**：
- ❌ 死撑 → 第 5 回合开始胡说八道
- ❌ /clear → 全丢，重头解释
- ❌ /compact → 信息有损，重要决策可能丢

**正确做法**（最简单）：

```bash
# 无参数：自动读 latest_state.json 的 next_action
/handoff
```

**做了什么**：
1. 强制存快照（绕过 30 分钟自动间隔）
2. 读 `latest_state.json.next_action` 作为下一阶段标题
3. 生成接续 prompt（4 段拼装：摘要/待办/下阶段/约束）
4. 打印 prompt 让你复制

**新会话开窗**（最快 1 步）：
- 加 `--auto` 开 VS Code 新窗口+复制启动命令
- 你在新窗口终端粘贴执行即可

**识别信号**（什么时候用 handoff 不用 /clear）：
- ✅ 30 轮以后 / 30+ 个 tool call
- ✅ 长文件（CLAUDE.md / 04.md）反复 read
- ✅ 你开始在 prompt 里"重述上下文"
- ✅ 顶部出现"context usage high"

---

## 🏁 场景 3：完成里程碑

**问题**：M22 handoff 完成了，要发版 v3.0.4，需要把这个里程碑**清晰标记**（不光是写 CHANGELOG）。

**做法**：

```bash
# milestone + handoff 双 tag，便于后续检索
/handoff "v3.0.4 M22 完成" "v3.0.5 路线图" --tags "milestone handoff"
```

**tag 作用**：
- `session-summary.sh save` 写入时带 tag
- 未来 `left-brain.sh recall "milestone"` 能搜到所有里程碑时刻
- 跟普通 handoff 区分开（不混）

**配套动作**（不在 handoff 命令里，但要做）：
```bash
# 1. commit
git add -A && git commit -m "feat: M22 v3.0.4"

# 2. CHANGELOG 写完
# 3. 04.md 同步（用 /audit 或手动）
# 4. evolution-lock.js complete M22
node scripts/orchestrator/evolution-lock.js complete M22-handoff-auto

# 5. 才开始 handoff（带 milestone tag）
/handoff "v3.0.4 M22 完成" "v3.0.5 路线图" --tags "milestone handoff"
```

---

## 🪟 场景 4：双会话并行（不串味）

**问题**：你想同时跑两个独立任务（A：写测试 + B：看 GitHub 趋势），但 Claude Code 一次只能跑一个 session。

**方案**：
1. **会话 A 收尾**：
   ```bash
   /handoff "A: 测试写到一半" "A 继续测试" --auto
   ```
   → VS Code 新窗口打开 + 启动命令复制到剪贴板
2. **在新窗口终端粘贴**启动 → 独立 session A 继续
3. **当前窗口**变成会话 B 主题 → 你可以问 B 任何事，**不串味**（因为 A 的上下文都打包到 prompt 文件里，main session 没了）

**为什么不会串味**：
- A 的全部上下文 → `.claude/handoff/continue.prompt.md`（新窗口加载）
- main session 没有 A 的上下文 → 干净
- `.claude/skills/left-brain/memory/sessions/latest_state.json` 只存 main session 的快照
- 不会发生"main 引用了 A 的某个文件路径但 A 已经 /clear"这种错乱

**什么时候不要用**：
- ❌ 如果 A 和 B 共享同一个文件/状态（如都要改 04.md）——会冲突
- ✅ 用 handoff 错开窗口的核心前提是 **两个任务的文件 scope 不重叠**

---

## 🤔 场景 5：handoff vs autonomous 决策树

**核心问题**：现在有 2 个"接续"路径，什么时候用哪个？

```
你现在是？
├─ 想休息（人不在）
│   ├─ 短时间离开（< 2 小时）
│   │   → /handoff --auto
│   │     （下次开电脑手动接续）
│   │
│   └─ 长时间离开（> 2 小时）
│       → /autonomous always + npm run autonomous:runner
│         （runner 帮你跑 next 队列，你回来 /autonomous-stop）
│
├─ 想切换（人不离开）
│   ├─ 上下文 40% 触顶
│   │   → /handoff
│   │     （新会话接续）
│   │
│   ├─ 想换 Claude Code 窗口
│   │   → /handoff --auto
│   │     （VS Code 新窗口）
│   │
│   └─ 想开第二任务窗口
│       → /handoff --auto
│         （见场景 4）
│
└─ 只是存档（不接续）
    → /snap-save "里程碑 X 进度"
      （纯存，不生成接续 prompt）
```

**对照表**（同一份命令字典的两种描述）：

| 命令 | 谁接续 | 时机 |
|:-----|:-------|:-----|
| `/snap-save` | （不接续）| 仅存快照，10 轮 1 次或里程碑 |
| `/handoff` | **你自己** | 收尾 + 准备下次继续 |
| `/handoff --auto` | **你自己** | 收尾 + VS Code 新窗口 + 剪贴板 |
| `/handoff --runner`（M24）| **runner 帮你** | 收尾 + spawn runner 跑 next |
| `/autonomous` | **runner** | 完全交给 runner，你不用管 |

**关键区别**：
- `handoff` = **人工接续**（你 /clear 后粘 prompt 继续）
- `autonomous` = **机器接续**（runner spawn 新 `claude -p` 子会话继续）
- `snap-save` = **纯存档**（不接续，只是存当前状态）

---

## 🎯 实战检查清单

完成 handoff 前自检：

- [ ] 标题写清楚了（"今天完成 M22" > "M22 完事了"）
- [ ] 下一阶段标题具体（"M23: 文档清理" > "接下来"）
- [ ] 不带"完成"以外的状态（中间态也行，"写到一半"也合法）
- [ ] 想开新窗口才加 `--auto`，否则默认即可
- [ ] `--tags` 默认 `handoff`，里程碑时加 `milestone`

完成 handoff 后验证：

- [ ] `latest_state.json` 有新 `next_action`
- [ ] `evolution-plan.json` next 队列多了 1 条（M24 起自动）
- [ ] `04.md §十二 ⏳ 段` 也多了 1 条（M24 起 sync-roadmap 自动）
- [ ] 04.md 顶部"最近一次同步"时间更新（M24 起自动）
- [ ] 04.md 状态统计 数字对（22 + next 数量 = 合计）

---

## 📚 关联

- 命令字典：`.claude/commands/handoff.md`
- 核心引擎：`scripts/orchestrator/handoff.js`
- 测试：`scripts/orchestrator/test-handoff.js`（59/59）
- 状态自愈：`handoff.js` `clearAwaitingHandoffIfStale()`（M24-B）
- 数据基础：`data/handoff_lifecycle.jsonl`（M24-B）
- 双向桥：`--runner` / `--resume` 模式（M24-C）
- 同步机制：`scripts/orchestrator/sync-roadmap.js`（M24-D）
