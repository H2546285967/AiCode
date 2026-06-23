# Claude Code 增强工程

> 一个**会自己调度、自己记忆、自己归档、自己兜底**的 Claude Code 工作空间。101 项测试全过，实测提速 20%。

[![CI](https://github.com/<USER>/<REPO>/actions/workflows/test.yml/badge.svg)](https://github.com/<USER>/<REPO>/actions/workflows/test.yml)

---

## 🚀 5 分钟快速开始

**复制这 3 条命令：**

```bash
git clone https://github.com/<USER>/<REPO>.git && cd AiCode
bash .workspace/setup.sh     # 一键适配当前环境
npm test                     # 跑 101 项测试，确认环境正常
```

然后启动 Claude Code：

```bash
claude
```

**就这样。** Claude Code 会自动读取 `CLAUDE.md` 加载行为约定和左脑记忆系统。

### 你会获得什么能力

| 能力 | 效果 |
|:-----|:-----|
| 🧠 智能调度 | 复杂任务自动派 2-3 个 Agent 并行，提速 2-3 倍 |
| 💾 快照系统 | 会话结束一键备份，下次 1 秒接上 |
| 📝 左脑记忆 | 跨会话知识沉淀，自动回忆 |
| 🔧 MCP 工具 | 本地 filesystem + sqlite + fetch |
| ✅ 自我约束 | AI 完成改动后自动跑测试、存快照、写 KB |

---

## 快速开始

### 新机器上使用
```bash
cd /path/to/AiCode
bash .workspace/setup.sh     # 一键适配当前环境
```

### 新建项目
```bash
# Claude Code 内
/new-project

# 或 Bash 脚本
bash .automation/new-project.sh <项目名> -t <类型> -r <需求文档> -d
```

### 公司项目
```bash
cd AI-【4】-公司项目/
git clone <公司仓库地址>
```

---

## 目录结构

```
AiCode/
│
├── AI-ClaudeCode-最佳实践精简.md       AI 行为约定 + 最佳实践说明
├── CLAUDE.md                            根级指令（记忆系统 + 行为规则）
├── README.md                            本文件
│
├── .workspace/                          工作空间适配
│   ├── setup.sh                         一键适配脚本（搬机器后运行一次）
│   ├── workspace.env                    动态路径（setup.sh 生成）
│   └── README.md                        移植指南
│
├── .automation/                         项目自动化
│   ├── new-project.sh                   一键创建项目脚手架
│   ├── templates/                       模板文件
│   └── README.md                        使用文档
│
├── .claude/                             Claude Code 配置 + 命令 + 子代理 + 左脑记忆
│   ├── rules/                           行为规则
│   ├── skills/left-brain/               左脑记忆系统
│   ├── commands/                        常用命令
│   └── agents/                          专业子代理
│
├── scripts/                             核心自动化脚本
│   ├── orchestrator/                    智能调度器
│   ├── parallel/                        worktree 并行 + Mermaid 生成
│   ├── mcp/                             本地 MCP server
│   └── 会话快照/                         快照保存/加载
│
├── benchmarks/                          真实任务性能基准
├── data/                                SQLite 工作空间数据库
├── archives/                            全局归档
└── .github/                             CI 配置
```

> 个人学习资料、项目代码、其他 AI 工具配置已移出到 `H:/AI-han/AiCode-Personal/`，本仓库只保留 Claude Code 增强工程核心。

---

## 核心约定

所有 AI 助手（Claude Code / Cursor / 通义灵码 / Qoder / MiniMax Code / ZCode）共享同一套行为规范，定义在 **`AI-ClaudeCode-最佳实践精简.md`**（根目录）：

- **成本控制**：对话连续 5 轮后提醒压缩上下文
- **文件读取**：按需读取，优先 Grep/Glob 搜索
- **输出精炼**：代码直接可用，不输出教学式代码
- **任务切换**：建议先清空旧上下文

---

## 多工具支持

| 工具 | 指令文件 | 自动加载 |
|:-----|:---------|:---------|
| Claude Code | `CLAUDE.md` | ✅ |
| Cursor | `.cursorrules` | ✅ |
| 通义灵码 | `.lingma/instructions.md` | ✅ |
| Qoder | `.qoderrules` | ✅ |
| MiniMax Code | `.minimaxrc` | ✅ |
| ZCode | `AGENTS.md` | ✅ |

---

## 工作流

### 开发新项目
```
写需求文档 → /new-project 或 bash 脚本 → 自动生成目录 + 6 个工具指令文件
→ AI 助手读取需求自动开发 → 测试验证
```

### 迭代已有项目
```
cd AI-【3】-项目开发/<项目名>
claude
> 读取 REQUIREMENTS_V2.md，在现有代码基础上迭代
```

### 接手公司项目
```
cd AI-【4】-公司项目/
git clone <仓库地址>
cd <项目名>
# 用任意 AI 工具打开，手动添加 CLAUDE.md 引用 AI-ClaudeCode-最佳实践精简.md
```

---

## 适用场景

- 个人学习 + 项目开发
- 入职新公司时整体迁移
- 跨 AI 工具协作开发
- 面试准备（学习资料 + 项目经验）

---

## 测试环境与基线

> 以下环境是当前 `npm test` 和 `npm run benchmark` 的跑通基线，供迁移后对照。

| 项目 | 当前环境 |
|:-----|:---------|
| OS | Windows 10 Pro (10.0.19045) |
| Shell | Git Bash |
| Node.js | v24.16.0 |
| Git | 2.49+ |
| Claude Code | 最新版 |
| 网络 | 可访问 example.com、npm registry |

### 当前测试基线

```text
npm test: 101/101 通过
npm run benchmark: 并行比串行快 20%（3 个 IO 型任务，详见 benchmarks/result.md）
```

> 注意：benchmark 数字会随机器、网络、磁盘 IO 波动。建议在新机器上跑 `npm test` 和 `npm run benchmark` 重新建立基线。
