# 🔒 演进计划锁规则

> **作用**：防止多窗口/多会话同时改 04.md / CLAUDE.md / CHANGELOG 等纲领文档导致状态漂移。
> **背景**：2026-06-25 用户反思「两个窗口自由发挥去优化相互影响了」+「演进计划执行的只能是一个大的核心（防止两个窗口改的不同）」。本规则就是把这个心智模型制度化。
> **创建日期**：2026-06-25
> **关联**：[`evolution-plan.json`](../../skills/left-brain/memory/evolution-plan.json) · [`evolution-lock.js`](../../../scripts/orchestrator/evolution-lock.js)

---

## 🎯 核心原则

**单一权威源**：所有"当前在做什么 / 下一个候选 / 锁持有者"的状态**只在** `evolution-plan.json`。其他文档（04.md / CHANGELOG / CLAUDE.md）是**下游展示**，不是事实源。

**Java 类比**：04.md / CHANGELOG / CLAUDE.md / state-snapshot / autonomous-state.json 是 5 个「内存副本」，没有 `synchronized` 的多线程 = 灾难。本规则就是给它们加 `synchronized`（演进锁）+ `volatile`（单一权威源）。

---

## 🔐 三层锁机制

| 层 | 机制 | 谁执行 | 失败怎么办 |
|:---|:-----|:-------|:----------|
| **L1 软锁** | 窗口启动读 `evolution-plan.json`，看到 `current.owner` 是别人 → 提示「X 正在做 M13，要不要等/换任务」 | Claude 主动检查 | 不强制，AI 自觉 |
| **L2 文件锁** | 写文件前先 `evolution-lock.js acquire`，原子写入 `current.owner + locked_at` | 脚本/Claude | 锁 5 分钟超时自动释放（可被接管） |
| **L3 hook 强制** | PostToolUse hook 拦截 Edit/Write，如文件不在 `current.allowed_docs` → 拒绝并提示 | Claude Code 钩子系统 | 强制，绕过需 `--no-verify` |

**L1 是关键**。L2/L3 是兜底。

---

## 📋 启动协议（CLAUDE.md Step 0 必走）

```
1. 读 evolution-plan.json
   ├─ 锁空闲 → 询问「是否领取下一候选？」
   ├─ 锁占用 + 你持有 → 继续做
   └─ 锁占用 + 不是你 → 提示「窗口 X 正在做 M13」，询问是否等/换任务
2. 读 CLAUDE.md（其余启动步骤）
3. 读 PROJECT-CONTEXT.md
4. ...
```

---

## 🔁 工作流（acquire → work → complete）

```bash
# 1. 申请锁
node scripts/orchestrator/evolution-lock.js acquire P0-0-evo-governance "main-session-20260625" "演进治理基础设施"

# 2. 工作（只能动 current.allowed_docs 里的文件 + scope 目录）
#    04.md / CLAUDE.md 等纲领文档默认不写 allowed_docs
#    实在要改 → 改 allowed_docs 后再 acquire

# 3. 完成（自动 release + 写 history）
node scripts/orchestrator/evolution-lock.js complete P0-0-evo-governance "建 evolution-lock.js + 规则 + 测试 + session-init 集成"
```

---

## 🚦 锁冲突处理

| 场景 | 行为 |
|:-----|:-----|
| 同一 ID 双 owner | 后到者输，提示「X 持有锁」 |
| 不同 ID 但都改 04.md | L3 hook 直接拒绝 |
| 锁超时（5 分钟） | 显式 `acquire` 即可接管（isStale 检查） |
| 进程崩溃 | 下次 `acquire` 检测到 stale 自动接管 |

---

## ❌ 禁止项

- **不**绕过锁直接写 04.md / CLAUDE.md / CHANGELOG（纲领类文档默认 lock-forbidden）
- **不**在未 release 的情况下启动新阶段（会导致 current 指向错的主题）
- **不**把 `evolution-plan.json` commit 到 git（已在 .gitignore）
- **不**在 5 分钟锁内反复 acquire 同 ID（应等超时或显式 release）

---

## 🔗 关联

- [`.claude/rules/autonomous.md`](autonomous.md) — 自主模式规则（互不冲突，自主模式是 ON/OFF 开关，本规则是「在做什么」锁）
- [`.claude/rules/doc-sync.md`](doc-sync.md) — 文档同步规则（完成里程碑后必须同步 4 文档，但要等锁释放后做）
- [`.claude/rules/self-discipline.md`](self-discipline.md) — 自我约束（快照 + 测试 + KB + 文档）
- `04_自我演进路线.md` 第十二章 — 里程碑表（事实源，**禁止在没有锁的情况下改**）
- `scripts/orchestrator/evolution-lock.js` — 锁引擎实现
- `.claude/skills/left-brain/memory/evolution-plan.json` — 状态文件（gitignore）
