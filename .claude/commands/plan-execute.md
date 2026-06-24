---
name: plan-execute
description: 执行最新 approved plan（v1.9.3 增量 B 方案 A）
---

执行 plan-bridge.js 引擎，按 plan.steps 逐个派 claude -p 子会话完成。

## 用法

```bash
# 完整执行
node scripts/orchestrator/planning/plan-bridge.js execute-latest

# 干跑（不真调 claude -p）
node scripts/orchestrator/planning/plan-bridge.js execute-latest --dry-run

# 列出已批准 plan
node scripts/orchestrator/planning/plan-bridge.js list-approved

# 看执行日志
node scripts/orchestrator/planning/plan-bridge.js log

# 走 npm
npm run plan:execute
```

## 前置流程

```
1. Claude 主会话输出 [plan] 块（自动被 plan-detect 捕获到 pending-plans.json）
2. 用户 /ok → plan 状态: pending → approved
3. /plan-execute → plan-bridge 按 steps 派 claude -p 子会话执行
4. plan 状态: approved → executing → done
```

## Plan 协议增强

可在 step 下加可选行让 bridge 知道派谁：

```
[plan]
任务: 重构 dispatcher
步骤:
  1. 读 dispatcher.js 现状
     agent: explorer        # 可选：explorer/planner/qa-reviewer/claude/code-reviewer
     files: dispatcher.js   # 可选：逗号分隔文件路径
  2. 拆成 3 个子模块
     agent: planner
     files: dispatcher.js, sub-router.js
  3. 写测试
     agent: qa-reviewer
[/plan]
```

**向后兼容**：缺省 `agent:` 默认 `claude`（通用 agent），缺省 `files:` 从 step 文本自动提取文件路径。

## 失败处理

- 单 step 失败 → 记 error + 继续下个 step（不全盘崩）
- plan 状态: executing → partial（部分完成）/ done（全部成功）

## 输出位置

- 状态变更：`.claude/skills/left-brain/memory/pending-plans.json`
- 执行日志：`.claude/skills/left-brain/memory/plan-execution-log.json`（gitignore）