# AI 自我约束（Self-Discipline）

> **作用**：让 AI 在完成改动后**自动**保存快照、更新文档、写 KB，**不需要用户提醒**。
> **完整规范**：[`scripts/orchestrator/自我约束规范.md`](../../scripts/orchestrator/自我约束规范.md)
> **最后更新**：2026-06-22

---

## 🚦 必做（不需询问）

完成任何 ≥ 🟡 小 的改动后，**自动**执行：

```bash
# 1. 跑测试
node scripts/orchestrator/test-dispatcher.js
node scripts/orchestrator/test-e2e.js

# 2. 存快照（自动更新 ROOT_快速加载会话.md）
node scripts/会话快照/save.js "<标题>" "<标签>" -m "<下一步>"

# 3. 写 KB
bash .claude/skills/left-brain/scripts/left-brain.sh remember "<事实>"

# 4. 改 ≥ 1 章节 → 同步更新精简版+详细版
#    AI-ClaudeCode-最佳实践精简.md
#    Claude工程实践操作手册.md

# 5. 是里程碑 → 全局归档
bash scripts/parallel/global-archive.sh "<任务名>"
```

## 📊 改动分级

| 级别 | 触发 | 自动动作 |
|:-----|:-----|:---------|
| 🟢 微小 | typo/注释 | 跳过 |
| 🟡 小 | bug fix/参数 | 1+2+3 |
| 🔴 大 | 新功能/架构 | 1+2+3+4 |
| 🏁 里程碑 | v1.X 完成 | 1+2+3+4+5 |

## 🎯 触发关键词

用户说"做完了"/"OK"/"完成"/"搞定" → 跑自动收尾

## 💡 关键原则

1. **不打扰用户**：做完自动收尾
2. **不过度**：小改动不触发全套
3. **文档准确**：大改动必更新
4. **可追溯**：每次改动有快照
5. **可回滚**：归档有 Git tag

---

**详见**：[`scripts/orchestrator/自我约束规范.md`](../../scripts/orchestrator/自我约束规范.md)（完整决策树）