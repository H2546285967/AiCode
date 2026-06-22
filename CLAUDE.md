# 个人 AI 工作空间

> 可移植的个人开发工作空间。开始前按顺序执行启动步骤。

---

## 启动必读

1. **了解结构** → 读 `README.md`
2. **遵守约定** → 读 `AI-ClaudeCode-最佳实践精简.md` 或 `.claude/rules/` 下规则文件
3. **了解范式** → 读 `AI-【0】-AI规则与范式/00-目录索引.md`
4. **项目级指令** → 如果在子目录工作，读该目录的 `CLAUDE.md`

---

## 工作空间结构

```
AiCode/
├── AI-【0】-AI规则与范式/    ← 范式、规则、最佳实践
├── AI-【1】-打破信息茧房/    ← agent-reach、aihot 等
├── AI-【2】-学习/            ← 教程、面试题
├── AI-【3】-项目开发/        ← 个人项目开发
├── AI-【4】-公司项目/        ← 公司项目（git clone）
│
├── AI-ClaudeCode-最佳实践精简.md     ← 行为约定 + 最佳实践
├── CLAUDE.md                ← 本文件（导航）
├── README.md                ← 工作空间说明
│
├── .automation/             ← 自动化脚本
├── .ai-memory/              ← 跨 IDE 共享记忆
└── .claude/                 ← Claude Code 配置
    ├── rules/               ← 拆分规则（详见下方）
    ├── skills/left-brain/   ← 🧠 左脑记忆系统
    ├── commands/            ← 常用命令
    └── agents/              ← 专业子代理
```

---

## 快速操作

| 操作 | 命令 |
|:-----|:-----|
| 新建项目 | `/new-project` |
| 记忆知识 | `left-brain.sh remember "..."` |
| 搜索知识 | `left-brain.sh recall "关键词"` |
| 查看状态 | `left-brain.sh dashboard` |
| 压缩上下文 | `/compact` |
| 重置会话 | `/clear` |

---

## 规则文件（.claude/rules/）

| 文件 | 作用 |
|:-----|:-----|
| `auto-perceive.md` | 自动感知、纠正学习规则 |
| `behavior.md` | 文件读取、输出控制、任务切换 |
| `session-memory.md` | 会话记忆、智能丢弃 |
| `cost-control.md` | 成本控制 + Git/PR 工作流 |
| `daily-maintenance.md` | 每日更新、Changelog |

---

## 🧠 左脑记忆系统

> 自动记忆 + 知识图谱 + 语义搜索。所有命令见下方。

### 启动协议

```bash
# 每次新会话执行
bash .../left-brain/scripts/session-init.sh
bash .../left-brain/scripts/session-summary.sh load
```

### 常用命令

```bash
left-brain.sh remember "内容"    # 记忆
left-brain.sh recall "关键词"    # 搜索
left-brain.sh preference "..."    # 偏好/纠正
left-brain.sh graph              # 知识图谱
left-brain.sh list               # 列表
left-brain.sh dashboard          # 监控
left-brain.sh status             # 状态
```

### 知识库位置

```
.claude/skills/left-brain/memory/
├── MEMORY.md               # 知识索引
├── knowledge/              # 知识条目（KB-*.md）
├── sessions/               # 会话摘要
├── associations/           # 知识图谱
└── logs/                   # 日志
```
