# 个人 AI 工作空间

> 可移植、自包含的个人开发工作空间——拷贝到任何机器，运行 `setup.sh` 即可用

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
├── AI-【0】-打破信息茧房/        AI 工具说明文档（agent-reach、last30days、aihot）
├── AI-【2】-学习/                学习资料
│   ├── 【0】AI大模型教程/        教程手册
│   ├── 【1】原工作资料/          前公司项目文档
│   ├── 【2】AI智能体框架学习/    SpringAIAlibaba + LangChain4j（28 个可运行 demo）
│   └── *.md                     学习笔记、面试题、能力评估
│
├── AI-【3】-项目开发/             个人项目开发目录
│   ├── CLAUDE.md                 Claude Code 自动读取
│   ├── AGENTS.md                 ZCode / 通用指令
│   ├── .cursorrules              Cursor 自动读取
│   ├── .lingma/instructions.md   通义灵码自动读取
│   ├── .qoderrules               Qoder 自动读取
│   ├── .minimaxrc                MiniMax Code 自动读取
│   └── 项目快速开发与迭代.md      操作指南（首次创建 + 迭代 + 提示词构建）
│
├── AI-【4】-公司项目/             公司项目（git clone 放这里，独立管理）
│
├── AI-ClaudeCode-最佳实践精简.md             AI 行为约定 + 最佳实践说明
├── CLAUDE.md                     根级指令（记忆系统 + 行为规则）
│
├── .automation/                  项目自动化
│   ├── new-project.sh            一键创建项目脚手架
│   ├── templates/                模板文件（7 个）
│   └── README.md                 使用文档
│
├── .workspace/                   工作空间适配
│   ├── setup.sh                  一键适配脚本（搬机器后运行一次）
│   ├── workspace.env             动态路径（setup.sh 生成）
│   └── README.md                 移植指南
│
├── .ai-memory/                   跨 IDE 共享记忆
├── .claude/                      Claude Code 配置 + 命令
└── .Codex/                       Codex 记忆
```

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
