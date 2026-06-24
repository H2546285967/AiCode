---
name: ok
description: 批准最近的 plan 并继续执行（v1.9.1 智能增量 B）
---

# /ok — 批准 plan 继续执行

批准 `.claude/skills/left-brain/memory/pending-plans.json` 中最近一个待处理的 plan。

## 执行流程

### 第 1 步：批准 plan

```bash
node H:/AI-han/AiCode/scripts/orchestrator/planning/plan-detect.js approve
```

读取输出。如果输出 "已批准" → 继续。如果输出 "无待批准 plan" → 提示用户无 plan 可批准。

### 第 2 步：列出 plan 内容

从 pending-plans.json 读取已批准的 plan，**展示给用户**：

```bash
node H:/AI-han/AiCode/scripts/orchestrator/planning/plan-detect.js list
```

把 plan 的 task / goal / steps 输出给用户，让用户清楚下一步要执行什么。

### 第 3 步：按 plan 步骤执行

按 plan 中列出的步骤**逐步执行**。每完成一步，在响应中说明进度。

## 提示

- 简单任务（无 plan）也能用 `/ok`，会提示"无待批准 plan"，不报错
- 配合 CLAUDE.md 智能任务规划协议使用：复杂任务 Claude 先出 plan，用户 `/ok` 批准
- `/no` 是反向操作：取消 plan 重做
