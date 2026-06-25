---
name: workflow
description: 个人 workflow 智能化（v2.0 P0-5）—— 学习你的工作模式，主动建议下一步
---

让 Claude 学习你的工作习惯，根据最近行为预测下一步该做什么。

## 用法

```bash
# 获取当前建议（默认）
/workflow

# 重新学习模式
/workflow learn

# 查看 workflow 状态
/workflow status
```

## 建议来源

1. **模式学习**：从 `workflow-events.jsonl` 挖掘高频行为序列
   - 例：改 `scripts/orchestrator/*.js` → 跑 `npm test`
   - 例：改文档 `.md` → 跑 `npm run doc:check`

2. **启发规则**：无足够历史数据时的兜底建议
   - 未提交改动 → 建议 commit
   - 修改特定模块 → 建议跑对应测试
   - 创建 plan 未批准 → 建议 `/ok` 或 `/no`

## 工作原理

```
行为事件（文件修改 / 命令 / 测试 / commit）
  ↓
workflow-observer.js 写入 workflow-events.jsonl
  ↓
pattern-miner.js 挖掘关联规则（支持度 + 置信度）
  ↓
suggestion-engine.js 根据当前上下文生成建议
  ↓
session-init.sh Step 9 / /workflow 命令展示
```

## 数据位置

- 事件：`H:\AI-han\AiCode\.claude\skills\left-brain\memory\workflow-events.jsonl`
- 模式：`.claude/skills/left-brain/memory/workflow-patterns.json`

## 手动记录事件

```bash
node scripts/orchestrator/workflow/workflow-cli.js record command_run '{"command":"npm test"}'
```

## 相关文件

- `scripts/orchestrator/workflow/workflow-observer.js`
- `scripts/orchestrator/workflow/pattern-miner.js`
- `scripts/orchestrator/workflow/suggestion-engine.js`
- `scripts/orchestrator/workflow/workflow-cli.js`
