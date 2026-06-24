---
name: no
description: 取消最近的 plan（v1.9.1 智能增量 B）
---

# /no — 取消 plan

取消 `.claude/skills/left-brain/memory/pending-plans.json` 中最近一个待处理的 plan。

## 执行流程

### 第 1 步：取消 plan

```bash
node H:/AI-han/AiCode/scripts/orchestrator/planning/plan-detect.js cancel
```

读取输出。如果输出 "已取消" → 继续。如果输出 "无待取消 plan" → 提示用户无 plan 可取消。

### 第 2 步：展示被取消的 plan

从 pending-plans.json 读取被取消的 plan，**展示给用户**：

```
❌ 已取消 plan: <task>
原步骤:
  1. <step 1>
  2. <step 2>
  ...
```

### 第 3 步：询问用户调整方向

询问用户：
- "这个 plan 哪里不对？"
- "需要调整什么？"

根据用户反馈：
- 如果是 plan 本身错了 → 重新输出新 plan
- 如果是方向错了 → 重新理解需求

## 提示

- 简单任务（无 plan）也能用 `/no`，会提示"无待取消 plan"
- 配合 CLAUDE.md 智能任务规划协议使用
- `/ok` 是反向操作：批准 plan 继续执行
