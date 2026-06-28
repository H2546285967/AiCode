---
name: dispatch
description: 智能派发子代理 - 自动分析任务复杂度，按需派 1-3 个 Agent 并行执行
---

# /dispatch <任务描述>

> **v3.0.5 升格**：本命令的完整说明已沉淀为 skill → **查看 [`.claude/skills/dispatch/SKILL.md`](../../skills/dispatch/SKILL.md)** 获取 30 秒上手、4 步骤决策流程、M9 评分权重、M14 知识图谱反哺、输出字段契约、测试覆盖。
>
> 本文件仅保留精简入口（向后兼容）。

## 入口

```bash
/dispatch <任务描述>

# 或直接跑规则引擎（不依赖 Claude）
node scripts/orchestrator/dispatcher.js "你的任务描述"
```

## 一句话总结

`/dispatch` = **规则引擎** (`scripts/orchestrator/dispatcher.js` v3.0.0) →
M9 复杂度评分 (0-10) + M10 动态 Agent 数量 (1-3) + M14 KB 反哺 (reuse/similar/miss) →
Claude 根据 `dispatch` + `agents` 字段决定派几个 Explore 子代理。

## 关联

- 完整 skill：[`.claude/skills/dispatch/SKILL.md`](../../skills/dispatch/SKILL.md)
- 规则引擎：`scripts/orchestrator/dispatcher.js`
- 测试：`scripts/orchestrator/test-dispatcher.js` + `test-dispatch-skill.js`
- M44 升格：`04_自我演进路线.md` §0.4 增量 M44