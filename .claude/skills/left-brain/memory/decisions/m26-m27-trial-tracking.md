# M26/M27 Hook 接入试用期跟踪记录

> **目的**：跟踪 M26（sandbox）+ M27（skill-reuse）POC 试用进度，记录"是否接 hook"决策依据
> **创建日期**：2026-06-28（M41 完成后第 1 天）
> **关联**：
> - 04_自我演进路线.md §0.4 M26/M27 增量段
> - evolution-plan.json `试用 1 周后决定 M26/M27 是否接 hook`
> - CHANGELOG.md v3.0.5 M26/M27 条目

---

## 🎯 试用边界（来自 M26/M27 设计）

| POC | 算法验证状态 | 是否接 hook | 试用周期 | 决策条件 |
|:----|:------------|:-----------|:---------|:---------|
| **M26 sandbox-tool-output** | ✅ 37/37 测试 + 真实 demo 64K→2.4K (-96%) | ❌ 不接（避免误伤）| **1 周（2026-06-27 → 2026-07-04）** | 实际使用中是否触发 + sandbox 后是否有信息丢失 |
| **M27 skill-reuse** | ✅ 24/24 测试 + 真实 demo 召回 3 条 / 574 字符 | ❌ 不接（避免误注入）| **1 周（2026-06-27 → 2026-07-04）** | 任务开始前 recall 的 KB 是否真有指导价值 |

**完整策略**（来自 04.md §M26/M27）：
1. ✅ M26/M27 POC 完成（2026-06-27）
2. ⏳ **试用 1 周（2026-06-27 → 2026-07-04）** ← 当前阶段
3. 🔜 决定：接 hook / 调整参数 / 放弃 / 换实现

---

## 📅 Day 1/7 状态快照（2026-06-28 · M41 完成后）

### M26 sandbox-tool-output 试用情况
| 维度 | 状态 | 备注 |
|:-----|:-----|:-----|
| 代码稳定性 | ✅ 37/37 测试通过（今日重跑） | 无 regression |
| 真实使用场景 | ⚪ 0 次主动触发 | 用户未调用 `npm run sandbox` / `sandbox-tool-output` |
| 自动触发（已接部分）| ⚪ 0 次 | 未接 hook，**设计如此**（观察期）|
| Bug 报告 | ⚪ 0 个 | — |

### M27 skill-reuse 试用情况
| 维度 | 状态 | 备注 |
|:-----|:-----|:-----|
| 代码稳定性 | ✅ 24/24 测试通过（今日重跑） | 无 regression |
| 真实使用场景 | ⚪ 0 次主动触发 | 用户未调用 `npm run skill-reuse` / `recall` |
| 召回质量 | 🟡 1 次 demo 召回 2 条 / 473 字符（M27 完成时跑）| demo 数据；非真实任务 |
| Bug 报告 | ⚪ 0 个 | — |

### M41 后续（security-skills-poc 修复）
- 用户实际使用时也没主动调 M26/M27 — 说明：**日常任务 token 没到需要 sandbox 的程度** + **任务开始前未感到 recall 痛点**

---

## 🚦 决策结论

**当前**：未到 1 周试用期，**不做最终决定**。

**理由**：
1. **1 天数据 ≠ 7 天数据** — 决策质量差异巨大
2. **用户明文要求"试用 1 周"**（04.md §M26/M27 增量段）— 自主模式不应绕过
3. **当前无负面信号**（无 bug / 无回归 / 无抱怨）也无正面信号（无主动调用 / 无迫切需求）
4. **截止日 2026-07-04**（周五）才到 → 留给用户决定

**建议下一步**（留给用户/下次 stage）：
- ✅ **继续观察 6 天**（2026-06-28 → 2026-07-04）
- 🔜 **Day 7/7 阶段**：重跑测试 + 收集真实使用数据 + 出 1 份"接 hook vs 不接"对比报告
- 🔜 **决策选项**：
  - A. 接 hook（M26 PostToolUse 包裹 Read/Bash/Grep；M27 SessionStart 注入 top-3 KB）
  - B. 调整参数（threshold / topK / maxChars）后接 hook
  - C. 继续不接（仅手动调用 npm script）
  - D. 放弃（算法不够好 / 痛点不够强）

---

## 📊 跟踪元数据

| 字段 | 值 |
|:-----|:--|
| 跟踪 ID | `M26-M27-TRIAL-20260628` |
| 创建 stage | 试用 1 周后决定 M26/M27 是否接 hook |
| 当前 Day | 1/7 |
| 下次评估日 | 2026-07-04（周五）|
| 关联 stage 名 | `M26-M27-trial-day7-decision` |
| 关联 owner | `main-session-20260628` |

---

## 🔗 关联

- `04_自我演进路线.md` §0.4 M26/M27 增量段（设计边界）
- `CHANGELOG.md` v3.0.5 M26/M27 条目（实现状态）
- `evolution-plan.json` `试用 1 周后决定 M26/M27 是否接 hook`（队列项）
- `.claude/skills/left-brain/memory/evolution-plan.json` `history` M26/M27（已完成的 POC）
- `scripts/orchestrator/sandbox-tool-output.js`（M26 实现）
- `scripts/orchestrator/skill-reuse.js`（M27 实现）

---

**维护规则**：
- 每天 stage 跑一次更新本文件
- Day 7 时改标题为 "M26/M27 试用 Day 7/7 决策报告"
- 决策后移到 `evolution-plan.json` history 并从 next 删除