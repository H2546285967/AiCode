---
name: dispatch
displayName: 🧠 智能调度 — 任务复杂度评分 + 知识图谱反哺 + Agent 派发
version: 1.0
description: >
  智能派发子代理 — 自动分析任务复杂度（M9 scoreComplexity 0-10 数字）+ M10 动态 Agent 数量 + M14 知识图谱反哺（reuse/similar/miss 三档命中）。
  派 Agent 前先查 KB：命中复用不派（附 KB id）、类似案例按复杂度派 + 附参考、未知场景按规则派。
  让 Claude 把"该不该派 Agent / 派几个"的判断交给规则引擎而非人工。
tags:
  - dispatch
  - agent-routing
  - complexity-scoring
  - knowledge-graph
  - decision-engine
author: 韩宗辉
icon: 🧠
---

# 🧠 智能调度 Skill (v1.0)

> **v1.0 · M9 复杂度评分 + M10 动态 Agent 数量 + M14 知识图谱反哺 · 沉淀 dispatcher.js v3.0.0**

---

## ⚡ 30 秒上手

```bash
/dispatch 排查订单添加菜品失败 BUG，前端 el-select 提示 + 后端 categoryId 校验
/dispatch 全面重构 UserService 的缓存逻辑
/dispatch 实现完整的用户登录功能（全栈）
/dispatch 解释下 Java 的 CountDownLatch   # 简单解释 → 不派

# CLI 直接跑（不依赖 Claude）
node scripts/orchestrator/dispatcher.js "你的任务描述"

# 输出格式：{ dispatch, agents, reason, complexity_score, complexity_band, graph }
```

---

## 🎯 解决什么问题

**没有 /dispatch 之前**：
- 改完代码 → 凭感觉"这任务复杂吗？要不要派 Agent？"
- 简单任务（解释 / 改一个文件）也派 Agent → 浪费 token
- 复杂任务（全栈重构）不派 → Claude 上下文爆 + 漏视角
- KB 里已有答案 → Claude 还是从头分析 → 重复踩坑

**有 /dispatch 之后**：
- **M9 复杂度评分**：0-10 数字打分，三档阈值（<4 不派 / 4-7 灰区 / >7 派）
- **M10 动态 Agent 数量**：`Math.min(3, Math.ceil(score / 3))`（1-3 个动态分配）
- **M14 知识图谱反哺**：派之前查 KB，三档命中（reuse≥0.5 不派 / similar≥0.2 附参考 / miss 正常派）
- **失败兜底**：任何 KB 引擎不可用 → 降级为 no-graph，不阻塞主流程

---

## 🧠 决策流程（4 步串行）

```
用户任务文本
  │
  ├─→ Step 1: recallBeforeDispatch(task)              ← M14 知识图谱
  │     ├─ hit=reuse (score≥0.5) → 强制不派，附 KB id
  │     ├─ hit=similar (0.2≤score<0.5) → 按复杂度派，附 KB 案例
  │     ├─ hit=miss → 按规则派
  │     └─ hit=no-graph → KB 引擎不可用，降级（不算 miss）
  │
  ├─→ Step 2: scoreComplexity(task) → { score, band } ← M9 复杂度评分
  │     ├─ score ≤ 3 → no_dispatch
  │     ├─ 4 ≤ score ≤ 7 → gray_zone
  │     └─ score ≥ 8 → dispatch
  │
  ├─→ Step 3: 关键词强约束（优先级最高）              ← 覆盖 Step 2 结果
  │     ├─ dont_dispatch 命中（"快速/简单/只改"）→ 强制不派
  │     └─ should_dispatch 命中（"全面/彻底/多模块"）→ 强制派
  │
  └─→ Step 4: 多维度信号综合（文件数 / 模块数 / 任务类型）
        ├─ fileCount ≥ 5 → dispatch (Math.min(3, ceil(fileCount/3)))
        ├─ moduleCount ≥ 2 → dispatch (Math.min(3, moduleCount))
        ├─ taskType ∈ {bug_fix, refactor, feature_full, ...} → dispatch
        └─ 全部不命中 → gray_zone（按 suggested_action 派 1-3 个）
```

---

## 🔧 评分权重（M9 `scoreComplexity`）

| 信号 | 权重 | 说明 |
|:-----|:----:|:-----|
| 每个文件 | +0.6 | `estimateFileCount` 启发式（路径 + 关键词） |
| 每个模块 | +1.2 | `estimateModuleCount` Set 去重 |
| 强信号关键词（"全面/彻底"） | +3 | 命中 should_dispatch 列表 |
| 抑制信号（"快速/简单"） | -1.5 | 命中 dont_dispatch 列表 |
| 任务类型（bug_fix/refactor/...） | +2 | 命中 should_dispatch.task_types |
| 任务类型（explanation/question/...） | -1 | 命中 dont_dispatch.task_types |

**总分钳制 0-10**，四舍五入到小数点后 1 位。

---

## 🚦 输出字段

```json
{
  "dispatch": true | false | null,   // true=派 / false=不派 / null=灰区
  "agents": 1 | 2 | 3,                // 建议 Agent 数量（M10 动态分配）
  "reason": "命中'派子代理'关键词: \"全面\"",  // 决策理由（人类可读）
  "layer": 1,                         // Layer 1 规则引擎
  "confidence": 0.9,                  // 0-1 数字（high=0.9/medium=0.6/low=0.3）
  "complexity_score": 8.4,            // M9 评分 0-10
  "complexity_band": "dispatch",      // no_dispatch / gray_zone / dispatch
  "graph": {                          // M14 知识图谱
    "matched": true,
    "hit": "similar",                 // reuse / similar / miss / no-graph
    "kb": { "id": "KB-20260620-001", "score": 0.35, "category": "工程经验" },
    "threshold": { "reuse": 0.5, "similar": 0.2 }
  },
  "reuse_kb": { ... }                 // hit=reuse 时附带完整 KB 条目
}
```

---

## 🧪 测试覆盖

`scripts/orchestrator/test-dispatcher.js` + `test-dispatcher-unit.js` + `test-dispatcher-scoring.js`

| 测试文件 | 覆盖范围 | 测试数 |
|:---------|:---------|:------:|
| `test-dispatcher.js` | 端到端决策（17 个用例 · 强信号/抑制信号/灰区） | 17/17 |
| `test-dispatcher-unit.js` | 内部函数边界（estimateFileCount / detectTaskType / agentsFromScore / CLI） | N/N |
| `test-dispatcher-scoring.js` | scoreComplexity 评分（边界/权重/钳制） | N/N |
| `test-dispatch-skill.js` | **本 skill 升格新增**：graph 字段契约 + reuse_kb 完整性 + 4 步骤流程 | 10/10 |

**npm scripts**：

```bash
npm run test:dispatcher          # 跑原有 3 个 dispatcher 测试
npm run test:dispatch-skill      # 跑本 skill 升格测试（10/10）
```

---

## 🔧 核心脚本

| 文件 | 作用 | 版本 |
|:-----|:-----|:----:|
| `scripts/orchestrator/dispatcher.js` | 规则引擎（decide + scoreComplexity + recallBeforeDispatch） | v3.0.0 |
| `scripts/orchestrator/hooks/dispatch-decision.js` | PreToolUse 钩子（CC 工具调用前提示） | v1.2.0 |
| `scripts/orchestrator/test-dispatcher.js` | 端到端测试 | — |
| `scripts/orchestrator/test-dispatcher-unit.js` | 单元测试 | — |
| `scripts/orchestrator/test-dispatcher-scoring.js` | 评分测试 | — |
| `scripts/orchestrator/test-dispatch-skill.js` | **本 skill 升格新增** | v1.0 |

---

## 📊 L5 影响

- **L3 主动决策** ↑：从"凭感觉派 Agent" → 规则引擎 + KB 反哺双轨制（量化决策）
- **L4 复用闭环** ↑：M14 知识图谱命中复用时直接答 + 附 KB id，避免重复劳动
- **L5 第 3 条"知识命中率 ≥ 30%"**：dispatcher 是唯一数据源，每条决策的 graph 字段被 metrics 采集

---

## 🎯 使用示例

### 场景 1：BUG 排查（推荐派 Agent）

```
/dispatch 排查订单添加菜品失败 BUG，可能涉及后端 categoryId 校验和前端 el-select.placeholder
```

→ 派 2 个 Explore 子代理：代码层（看后端 + 前端）+ 数据/配置层（看 .env / DB schema）

### 场景 2：复杂全栈（派 3 个 Agent）

```
/dispatch 实现完整的用户登录功能，前端 Vue + 后端 Spring Boot + Redis 缓存
```

→ 派 3 个 Explore 子代理：前端 / 后端 / 数据层

### 场景 3：解释类（不派）

```
/dispatch 解释下 Java 的 CountDownLatch 怎么用
```

→ 主会话直接答，节省 token

### 场景 4：KB 命中复用（不派 + 附 KB）

```
/dispatch 修复 PowerShell 中文乱码
```

→ M14 命中 reuse（KB-20260627-001 已有答案），不派 Agent，直接返回 KB 内容

---

## 🔗 关联

- 命令入口：`.claude/commands/dispatch.md`（保留向后兼容）
- 规则引擎：`scripts/orchestrator/dispatcher.js`
- 决策指南：`scripts/orchestrator/决策指南.md`
- M9 评分增量：`04_自我演进路线.md` §0.4 增量 M9
- M10 Agent 数量：`04_自我演进路线.md` §0.4 增量 M10
- M14 知识图谱：`04_自我演进路线.md` §0.4 增量 M14
- 本升格增量：**M44**（`04_自我演进路线.md` §0.4 增量 M44）

---

*升级自 `/dispatch` 命令（v1.0 · 2026-06-28 · M44 skill 升格 · 沉淀 M10 + M14）*