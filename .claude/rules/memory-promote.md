# 🧠 Memory 毕业（Promote）机制

> **作用**：治理 memory 膨胀的唯一治本手段——把稳定知识"升 docs + 缩源为 pointer"。
> **来源**：neat-freak "毕业机制" + AiCode 工程化
> **创建日期**：2026-06-29（M48-A neat-freak 完整借鉴）

---

## 🚨 为什么需要这条规则

**docs 靠就地编辑收敛**（系统改 10 次，还是那一份 `ARCHITECTURE.md`），**而 agent 记忆天生只追加**（每条教训生一个新文件，旧的不删）。

没有反向阀门，memory 会一路堆到比 docs 还大。**真正稳定的知识被困在几十个松散文件里——既进不了 prompt（索引 25KB 截断），也没沉淀成给别人看的文档。**

➡️ **反向阀门 = 毕业（promote）。** 把稳定 KB 升 docs，原文件缩为 1 行 pointer（或删除）。

---

## 🎯 毕业三触发（任一即触发）

| 触发 | 判定 | 操作 |
|:-----|:-----|:-----|
| **1. 同一主题反复 ≥ 3 次** | `npm run kb:promote --report` 看体检报告中"触发 1" | 升 docs + 缩源为 pointer |
| **2. 系统机制描述** | category ∈ {`技术`, `概念澄清`, `feature_full` 且讲"怎么工作"} | 升 docs（这本就属 docs 职责）|
| **3. 事件类 > 14 天** | category = `事件` 且 `now - created >= 14 天` | 过程归 git log / CHANGELOG，memory 不留 |

**判据一句话**：「下一个接手的人（不只是我自己）需要知道这件事吗？」需要 → 升 docs；不需要 → 缩 pointer。

**例外（不毕业，常驻）**：
- `reference` 类 KB（API 速查、命令清单等稳定速查内容）
- `偏好` 类（用户习惯，跨项目复用）

---

## 🛠 工具：`npm run kb:promote`

```bash
npm run kb:promote -- --report      # 看哪些 KB 达到毕业条件（默认）
npm run kb:promote -- --dry-run     # 输出将做的动作，不写文件
npm run kb:promote -- --apply       # 实际执行（默认缩为 pointer）
npm run kb:promote -- --apply --delete  # 升 docs 后删源
npm run kb:promote -- --target 02.md   # 升 02.md 功能字典
npm run kb:promote -- --kb KB-20260629-001  # 只对单条
```

**底层脚本**：`scripts/knowledge/promote-kb.js`
**测试**：`scripts/knowledge/test-promote-kb.js`（17/17 通过）

---

## 📋 推荐工作流

| 时机 | 动作 |
|:-----|:-----|
| 每月末 / 季度末 | 跑 `npm run kb:promote -- --report` 看建议毕业清单 |
| 用户明确"清理 KB" | 跑 `--apply` 默认（缩 pointer） |
| 用户明确"彻底清理" | 跑 `--apply --delete`（删源，仅保留 docs 副本） |
| CI/集成（可选） | 跑 `--report`，输出条数 > 50 时写入 task backlog |

---

## 🧠 编辑原则（来自 neat-freak）

> **减优于加 / 合并优于追加 / 删除优于保留 / 毕业优于内部挪腾 / 精确优于冗长**

- KB **顶多留指针**——详细机制归 docs，memory 只留一行 reference
- 单条 memory > 100 行 → 拆 / 删 / 改成 reference
- "已被 X 取代 / 已废弃" 的字样 → 99% 真的可以删，docs 是权威
- 相对时间词（`今天 / 最近 / 昨天`）→ 改为绝对日期 `2026-06-29`

---

## 🔗 关联

- [`sync-matrix.md`](sync-matrix.md) — 记忆层变更与代码→文档映射（同等重要）
- [`doc-sync.md`](doc-sync.md) — 8 文档同步规则（毕业动作可能触发多文档改）
- [`self-discipline.md`](self-discipline.md) — 动作 5 步法（含毕业审计）
- [`memory-health-check.md`](special-cases.md) — 体检脚本（与 promote 配套，体检→毕业→体检）
- `scripts/knowledge/promote-kb.js` — 工具实现
- `04_自我演进路线.md` §0.4 M48-A — 增量详情
