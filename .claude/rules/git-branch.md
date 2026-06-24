---
description: Git 分支管理规则 — 个人工程，默认在 main 工作，需要切换分支必须用户确认
---

<important if="涉及 git branch / git checkout / git switch / 创建新分支 / 删除分支">

# 🌿 Git 分支管理规则（个人工程）

> **决策日期**：2026-06-25
> **背景**：之前误以为"开发新功能要开新分支" → 用户澄清这是**个人工程**，无需多分支
> **关联**：[[feat-memos-branch-history]] — feat/memos 已 fast-forward 到 main，不再使用

---

## 🎯 核心原则

**默认在 `main` 分支工作**。只有用户**明确同意**才能切换或创建分支。

---

## ✅ 允许的操作（无需确认）

| 操作 | 场景 |
|:-----|:-----|
| 在 `main` 上 commit | 日常开发、bug 修、小功能、文档更新 |
| `git status` / `git log` / `git diff` | 只读检查 |
| `git stash` / `git stash pop` | 临时保存未提交改动（保留工作进度） |
| `git fetch` / `git pull`（在 main） | 同步远程 |
| 合并已有分支到 main | 用户明确要求时 |

---

## ⚠️ 需要确认的操作（先问再做）

| 操作 | 为什么要确认 |
|:-----|:------------|
| `git checkout <其他分支>` | 切换离开 main 会影响后续所有 commit 落点 |
| `git switch -c <新分支>` | **创建新分支前必须问** — 个人工程可能完全不需要 |
| `git branch -d` / `-D` | 删分支前必须确认（可能丢工作） |
| `git push --force` / `--no-verify` | 危险操作，绝不绕过 |
| `git rebase -i` / `git rebase` | 改写历史需要确认 |

---

## ❌ 禁止的操作

| 操作 | 原因 |
|:-----|:-----|
| 未经用户同意开新分支 | 个人工程默认 main |
| 未经用户同意删除已有分支 | 即使是已合并的分支 |
| `git push --force` 到 `main` / `master` | 破坏共享历史 |
| `git reset --hard` 不先确认 | 可能丢未提交改动 |
| `--no-verify` 跳过 hooks | 绕过质量门 |

---

## 💬 询问模板

需要切换或创建分支时，**先说一句**：

> "这要切换分支 / 开新分支，按规则需要你确认一下。理由：[xxx]。选项：
> 1. 在 main 做
> 2. 开新分支 `feat/xxx`（待你确认命名）
> 3. 切换到已有分支 `xxx`"

---

## 🚫 以前我犯过的错

- 2026-06-24：我在 `feat/memos` 上 commit 2 个 evolve commit，没问就用了历史分支 → 用户纠正"这是个人工程不要开分支"
- 教训：**`feat/memos` 等历史分支名不能复用为"开发新功能"的工作分支**

---

## 🔗 关联

- `.claude/rules/behavior.md` — 总行为约定（含本规则引用）
- [[feat-memos-branch-history]] — 分支命名由来 + 决策记录
- [[evolve-finds-context-mode]] — 我在 feat/memos 上加的 2 个 evolve commit 的来源
</content>
</invoke>