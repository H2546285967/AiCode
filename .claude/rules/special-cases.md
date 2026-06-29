# 🚧 特殊情况段（Special Cases · M48 借鉴 neat-freak）

> **作用**：列出 neat-freak「特殊情况」段总结的 5 种非典型场景的处理方式。
> **来源**：neat-freak SKILL.md §特殊情况（"End-of-session" 流程的兜底段）
> **创建日期**：2026-06-29（M48-D neat-freak 完整借鉴）

---

## 🚦 5 种特殊情况

### 1. 项目还没有 README 或 CLAUDE.md / AGENTS.md

**处理**：判断项目是不是到了"有可运行代码"的阶段。

- ✅ **是**（有 npm test / 可运行 demo）→ 创建最小骨架：1 句定位 + 3 步快速开始 + 测试基线
- ❌ **否**（还在 vibe 阶段）→ 跳过，但在摘要里提一句"项目尚未到 README 阶段"

**本工程已**：`README.md` + `PROJECT-CONTEXT.md` + `CLAUDE.md` 全有，新会话无需处理。

---

### 2. 对话没有产生新事实

**处理**：审查现有记忆和文档**有没有过期 / 冲突 / 相对时间**——审查本身就有价值。

**动作**：
1. 跑 `npm run memory:health` 看 MEMORY.md 状态
2. 跑 `npm run doc:check` 看 6 文档一致性
3. 跑 `npm run kb:promote -- --report` 看哪些 KB 达到毕业条件
4. 如果以上都干净 → 在变更摘要中写"本轮无代码改动，仅做体检"

**Why**：用户可能没让你改什么，但 KB / docs 不一致本身就是问题。

---

### 3. 记忆之间出现无法自动判断的矛盾

**处理**：列在「未处理」让用户决定。**这是唯一需要用户介入的情况**，其他都自己拍板。

**格式**：
```markdown
### 未处理
- KB-A 说 X，KB-B 说 Y。两者同一时间段记录。
  - KB-A 来源：对话 2026-06-21
  - KB-B 来源：对话 2026-06-25
  - 请判断哪个权威
```

**不要拍板**：宁可留 1 天不解决，也不要猜答案。

---

### 4. 跨项目改动

**处理**：本次对话改了多个项目，每个项目都要跑一次完整的**第一步（ls + 读 docs）**。

**AiCode 场景**：本工程是个人工程，无下游 SDK。但 `scripts/orchestrator/` 改接口会波及其他脚本：
- 改 `dispatcher.js` 暴露面 → 必跑 `npm test` 全量回归
- 改 `evolution-lock.js` / `state-snapshot.js` → 必跑 `/autonomous` 状态测试
- 改 `left-brain` 系列 → 必跑 `session-init.sh` 验证

**判断方法**：在 summary 段单独列"跨项目影响"，跑对应测试。

---

### 5. 发现之前的同步漏了东西

**处理**：修掉。**不要说"那不是这次对话的事"——你就是这个项目的持续编辑，过去的漏洞也归你管。**

**动作**：
1. 把发现的问题写进本轮 commit message 的 "fixup" 段
2. 跑对应文档的 `--check` 工具
3. 如果是个系统性问题（比如 K_N 反复漏某文档），在 [self-discipline.md](self-discipline.md) 加一条规则

**黄金法则**："知识腐烂是熵增，治理是熵减。每次同步都是一次熵减机会。"

---

## 📋 与 5 步法的关系

| 5 步法 | 特殊情况触发 |
|:-------|:-------------|
| 零 · 尺寸体检 | 情况 2（体检发现异常 → 进入正式流程）|
| 一 · 盘点现状 | — |
| 二 · 变更矩阵 | 情况 4（跨项目 → 双重盘点）|
| 三 · 实际修改 | 情况 1 / 5（可能要从无到有创建，或补历史漏）|
| 四 · 自检清单 | 情况 3（矛盾 → 列"未处理"）|
| 五 · 变更摘要 | 情况 2 摘要加"无新增，仅体检"；情况 3 摘要加"未处理项" |

---

## 🔗 关联

- [`.claude/rules/self-discipline.md`](self-discipline.md) — 5 步法主流程
- [`.claude/rules/sync-matrix.md`](sync-matrix.md) — 变更映射表
- [`.claude/rules/memory-promote.md`](memory-promote.md) — 毕业机制
- [`scripts/knowledge/memory-health-check.js`](../../scripts/knowledge/memory-health-check.js) — 体检工具（M48-D 新增）
- `04_自我演进路线.md` §0.4 M48-D — 增量详情
