---
name: go
displayName: 🚀 交付流水线 — 一键测试→简化→审查→提交
version: 1.0
description: >
  /go skill 自动完成 4 阶段交付流水线：测试 → 简化 → 审查 → 提交。
  任一阶段失败立即停止并报告，不继续提交。支持 --dry-run / --skip / --only 灵活控制，
  让 Claude 把"该跑测试/该提交"的判断交给自动化而非人工。
tags:
  - delivery
  - pipeline
  - commit
  - test
  - automation
author: 韩宗辉
icon: 🚀
---

# 🚀 交付流水线 Skill (v1.0)

> **v1.0 · 4 阶段自动化 · 失败立即停止 · 支持 dry-run / skip / only**

---

## ⚡ 30 秒上手

```bash
/go                # 跑完整流水线（测试→简化→审查→提交）
/go --dry-run      # 预演（不真跑命令）
/go --skip review  # 跳过 review 阶段
/go --only test    # 只跑测试
```

---

## 🎯 解决什么问题

**没有 /go 之前**：
- 改完代码 → 手动跑 `npm test` → 跑通再手动 commit
- 漏一步就出错：忘跑测试就提交 → CI 红 / 漏 review → 上线 BUG
- 上下文里反复出现"现在该跑测试了吗 / 可以提交了吗"

**有 /go 之后**：
- 一条命令覆盖 4 个步骤
- 任一失败立即停止（不会带着 broken 测试提交）
- `--dry-run` 让 Claude 在不确定时先确认计划

---

## 🔧 4 阶段定义

| 阶段 | 默认命令 | 跳过建议 |
|:-----|:---------|:---------|
| **test** | `npm test --silent` | ❌ 不建议（流水线入口） |
| **simplify** | （预留，当前无独立脚本） | ✅ 可安全跳过 |
| **review** | （预留，当前无独立脚本） | ✅ 可安全跳过 |
| **commit** | `git commit --allow-empty -m '...'` | ❌ 不建议 |

**当前 simplify / review 无独立脚本** → 自动标记为 skipped（不视为失败）。

---

## 📋 CLI 完整参数

```bash
node scripts/orchestrator/go-pipeline.js [options]

  --dry-run           只打印计划，不真跑命令
  --skip <stages>     跳过指定阶段（逗号分隔，如 simplify,review）
  --only <stage>      只跑一个阶段（test/simplify/review/commit）
  --test-cmd <cmd>    自定义测试命令（覆盖默认 npm test）
  --commit-msg <msg>  自定义 commit 信息
  --cwd <path>        工作目录（默认工程根）
```

---

## 🧪 测试覆盖

- 12 单元测试（`scripts/orchestrator/test-go-pipeline.js`）
- 覆盖：parseArgs / runStage 5 状态 / runPipeline 失败立即停止 / --only / --skip / --dry-run / formatHuman
- npm script: `npm run test:go`

---

## 📊 L5 影响

- **第 4 条"完成质量"↑**：从"人工记得跑测试" → 自动化强制 4 阶段
- **第 5 条"人工干预率" ↓**：交付场景不再需要人脑判断"该提交了吗"
- **AI 越用越顺手**：让 Claude 把"流程类判断"交给脚本而非对话

---

## 🔗 关联

- [`.claude/commands/go.md`](../commands/go.md) — 旧版纯 markdown 命令（保留向后兼容）
- [`scripts/orchestrator/go-pipeline.js`](../../scripts/orchestrator/go-pipeline.js) — 流水线引擎
- [`scripts/orchestrator/test-go-pipeline.js`](../../scripts/orchestrator/test-go-pipeline.js) — 12 单元测试
- `04_自我演进路线.md` §0.4 增量 M43 — 立项文档
- `research-skill-ecosystem-20260626.md` — 调研来源（P2 建议）
- 关联 M25 skill 生态扩展（已升格 evolve + autonomous）/ M36A ui-skill-installer / M42 L5 进度可视化