# 📋 智能任务规划协议（plan-protocol）

> **作用**：规定 `[plan]...[/plan]` 块的标准格式 + 触发条件 + agent/files/verification 字段 + 状态机 + 与 dispatcher 关系。
> **来源**：实现见 [`scripts/orchestrator/planning/plan-detect.js`](../../scripts/orchestrator/planning/plan-detect.js) + [`plan-bridge.js`](../../scripts/orchestrator/planning/plan-bridge.js)
> **创建日期**：2026-06-29（深度审计 P0 #11 补建）
> **关联**：[CLAUDE.md §🧠 智能任务规划协议](../../CLAUDE.md) · [`/ok`](../../commands/ok.md) · [`/no`](../../commands/no.md) · [`/plan-execute`](../../commands/plan-execute.md)

---

## 🎯 触发条件（什么时候必须出 plan）

满足以下 **任意 2 条** 时，AI 必须先出 `[plan]...[/plan]` 块，等 `/ok` 批准再执行：

1. 涉及文件数 **≥ 3**
2. 涉及模块数 **≥ 2**
3. 改根目录配置（`package.json` / `CLAUDE.md` / `04_*.md` / `CHANGELOG.md` 等）
4. 5 类任务类型（新增大特性 / 跨模块重构 / 数据库变更 / 关键 bug fix / 用户说"先评估"）
5. 用户明确说"先评估 / 先出方案 / 别急"

简单任务（单文件 / 单模块 / 改 ≤ 2 行）直接干，不需要 plan。

---

## 📐 标准格式

```markdown
[plan]
任务: <一句话标题，≤30字>
目标: <完成什么 + 验收标准>
步骤:
  1. <步骤 1 描述>
     agent: <explorer|planner|qa-reviewer|claude，默认 claude>
     files: <a.js, b.md，回车逗号分隔>
     验证: <该步骤完成的可验证标准>
  2. <步骤 2 描述>
     agent: explorer
     files: scripts/foo.js
     验证: <该步骤完成的可验证标准>
  ...
预计改动: <N> 个文件
预计风险: <低/中/高>
回退方案: <怎么撤回，git revert / 删文件 / 禁用某段>
[/plan]
```

### 字段说明

| 字段 | 必填 | 说明 |
|:-----|:----:|:-----|
| 任务 | ✅ | 一句话标题，会写进 pending-plans.json |
| 目标 | 🟡 | 完成标准（用于验收） |
| 步骤 | ✅ | 至少 1 步，每步可带 `agent:` / `files:` / `验证:` 字段 |
| `step.agent` | 🟡 | 派哪种子代理（explorer/planner/qa-reviewer/claude），缺省 `claude` |
| `step.files` | 🟡 | 涉及文件列表（可从 `step.text` 自动提取） |
| `step.验证` | 🟡 | 该步骤完成的可验证标准（Karpathy「目标驱动执行」：步骤 → 验证） |
| 预计改动 | 🟡 | 文件数（帮助用户判断规模）|
| 预计风险 | 🟡 | 低/中/高（影响 `/ok` 后是否需要 review）|
| 回退方案 | 🟡 | 怎么撤回 |

**agent 缺省 fallback**：当 `step.agent` 缺失时回退 `claude` 通用 agent（plan-bridge.js:188）。

**files 缺省 fallback**：当 `step.files` 缺失时从 `step.text` 提取文件路径（plan-detect.js:172 extractFilesFromText）。

**验证缺省 fallback**：当 `step.验证` 缺失时，默认值为"步骤完成且无回归"（plan-detect.js）。

---

## 🎯 目标驱动执行（Karpathy 原则在 plan 中的体现）

每个 plan 步骤都应该能回答：**"我怎么知道这一步完成了？"**

| 弱标准 | 强标准（带验证） |
|:-------|:-----------------|
| "修改 plan-protocol.md" | "修改 plan-protocol.md，使其包含 `验证:` 字段说明 → 验证: test-plan-detect.js 新增用例通过" |
| "跑测试" | "跑 npm test → 验证: 全部测试通过" |
| "同步文档" | "同步 CHANGELOG + 04/03/01/02/CLAUDE → 验证: `npm run doc:check` 无漂移" |

**原则**：把指令式任务转化为带有验证循环的声明式目标。没有 `验证:` 的步骤，默认 fallback 为"步骤完成且无回归"。

---

## 🔄 状态机

```
pending → approved → executing → done
   ↓          ↓
cancelled  cancelled
   ↓
partial（执行中部分步骤失败）
```

| 状态 | 含义 | 触发 |
|:-----|:-----|:-----|
| `pending` | 已写入 pending-plans.json 等用户决策 | plan-detect.detect() |
| `approved` | 用户 `/ok` 批准 | plan-detect.approve() |
| `cancelled` | 用户 `/no` 取消 | plan-detect.cancel() |
| `executing` | `/plan-execute` 启动派子会话 | plan-bridge.execute() |
| `done` | 全部步骤成功 | plan-bridge.executePlan() |
| `partial` | 部分步骤失败 | plan-bridge.executePlan() |

状态持久化：`.claude/skills/left-brain/memory/pending-plans.json`（gitignore 排除）

---

## 🤖 与 dispatcher 的边界

| 场景 | 用 plan | 用 dispatcher |
|:-----|:-------|:-------------|
| 复杂任务（≥ 3 文件 + ≥ 2 模块）| ✅ | ❌（dispatcher 默认不派）|
| 单点 bug fix（1 文件 ≤ 5 行）| ❌ | ❌ |
| 简单重构（2 文件）| ❌ | 🟡 dispatcher 可能派 1 个 explorer |
| 跨模块大特性（5+ 文件）| ✅ | ❌ |
| 用户要求"先评估" | ✅ | ❌ |

**关键差异**：
- **plan-bridge**：派 `claude -p` 独立子会话（5 分钟 timeout），适合"用户已经想好步骤，让 AI 照做"
- **dispatcher**：派 in-process 子 Agent（in-context），适合"AI 临时决定需要并行调研"

**深层差异**：plan 由用户**主导**（用户 `/ok` 决定要不要做），dispatcher 由 AI **自治**（AI 觉得需要就派）。

---

## 🛠 三个命令

### `/ok` — 批准

```bash
node scripts/orchestrator/planning/plan-detect.js approve
```

把最新一个 `pending` 改成 `approved`。

### `/no` — 取消

```bash
node scripts/orchestrator/planning/plan-detect.js cancel [index]
```

把指定 index 的 plan 改成 `cancelled`，可选 index 不传则取消最新。

### `/plan-execute` — 执行

```bash
node scripts/orchestrator/planning/plan-bridge.js execute-latest [--dry-run]
```

读取最新 `approved` plan，逐个 step 派 `claude -p` 执行（默认 5 分钟 timeout，串行）。
- 成功：状态变 `done`
- 部分失败：状态变 `partial`，已成功的 step 记录到 plan-execution-log.json

---

## ⚠️ 已知限制（深度审计发现）

| 限制 | 影响 | 计划 |
|:-----|:-----|:-----|
| 单 step 串行 spawnSync 5 分钟 timeout | 大计划 5+ step 全跑需 25+ 分钟 | 远期支持并行 |
| 无并行、无断点续传 | 进程崩溃 = 全部重来 | 远期：增量断点 |
| 步骤延续行判断 `!/^[A-Za-z一-龥]+[：:]/` 易误切 | 中文冒号开头会被当新字段 | 改用 YAML 缩进 |
| approved plan 执行中崩溃 → 永远卡 `executing` | 需手动改 JSON | 计划 P1 加 stale 检测（5 分钟前 executing 自动回退 approved）|
| `pending-plans.json` append-only 无清理 | 历史累积 | 远期：定期归档 |

---

## 🔗 关联

- [`.claude/rules/sync-matrix.md`](sync-matrix.md) — 改 planning 涉及的文档映射
- [`.claude/rules/self-discipline.md`](self-discipline.md) — 6 步法
- [`scripts/orchestrator/planning/plan-detect.js`](../../scripts/orchestrator/planning/plan-detect.js) — 检测器实现
- [`scripts/orchestrator/planning/plan-bridge.js`](../../scripts/orchestrator/planning/plan-bridge.js) — 执行桥实现
- [`.claude/commands/ok.md`](../../commands/ok.md) · [`.claude/commands/no.md`](../../commands/no.md) · [`.claude/commands/plan-execute.md`](../../commands/plan-execute.md)
- `/audit full 2026-06-29` 深度审计 P0 #11
