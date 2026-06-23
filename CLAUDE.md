# 个人 AI 工作空间

> 可移植的 Claude Code 增强工程。开始前按顺序执行启动步骤。
> **上下文分片**（v1.4）：`.claudeignore` 已排除大文件/归档目录，AI 不要主动读这些路径，除非用户明确要求。

---

## 启动必读

1. **了解结构** → 读 `README.md`
2. **遵守约定** → 读 `AI-ClaudeCode-最佳实践精简.md` 或 `.claude/rules/` 下规则文件
3. **项目级指令** → 如果在子目录工作，读该目录的 `CLAUDE.md`
4. **智能调度** → 复杂任务自动派 Agent（见 `AI-ClaudeCode-最佳实践精简.md` 第三节）

---

## 工作空间结构

```
AiCode/
├── AI-ClaudeCode-最佳实践精简.md     ← 行为约定 + 最佳实践
├── Claude工程实践操作手册.md          ← 详细版操作手册（待与精简版合并）
├── CLAUDE.md                          ← 本文件（导航）
├── README.md                          ← 工作空间说明
│
├── .automation/                       ← 自动化脚本
├── .workspace/                        ← 工作空间适配
├── .claude/                           ← Claude Code 配置
│   ├── rules/                         ← 拆分规则（详见下方）
│   ├── skills/left-brain/             ← 🧠 左脑记忆系统
│   ├── commands/                      ← 常用命令
│   └── agents/                        ← 专业子代理
│
├── scripts/                           ← 核心自动化脚本
│   ├── evolution/                     ← 🧬 自我进化系统（v1.8：每日扫描 GitHub 学习新能力）
│   ├── orchestrator/                  ← 智能调度器
│   ├── parallel/                      ← worktree 并行
│   ├── mcp/                           ← 本地 MCP server
│   └── 会话快照/                       ← 快照保存/加载
│
├── benchmarks/                        ← 真实任务性能基准
├── data/                              ← SQLite 工作空间数据库
└── archives/                          ← 全局归档
```

> 个人学习资料、项目代码、其他 AI 工具配置已移出到 `H:/AI-han/AiCode-Personal/`。

---

## 快速操作

| 操作 | 命令 |
|:-----|:-----|
| 新建项目 | `/new-project` |
| 记忆知识 | `left-brain.sh remember "..."` |
| 搜索知识 | `left-brain.sh recall "关键词"` |
| 查看状态 | `left-brain.sh dashboard` |
| 自我进化 | `/evolve run` 或 `npm run evolve` |
| 检查过时 | `/evolve watch` 或 `npm run trend` |
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
