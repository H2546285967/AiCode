# 个人工作空间 — 移植指南

> 把这个目录搬到任何机器上，5 分钟内即可开始工作

---

## 搬迁步骤

### 1. 拷贝目录

把整个 `AiCode` 目录拷贝到新机器（U盘 / 网盘 / git 均可）。

### 2. 运行适配脚本

```bash
cd /path/to/AiCode
bash .workspace/setup.sh
```

脚本会自动：
- 检测当前路径，写入 `.workspace/workspace.env`
- 检查目录结构，缺失的自动创建
- 检测已安装的 AI 工具
- 输出适配报告

### 3. 安装缺失工具（如有）

```bash
# Claude Code（必需）
npm install -g @anthropic-ai/claude-code

# Node.js（如缺失）
# 去 https://nodejs.org 下载安装

# Java + Maven（如需 Java 项目）
# 去 https://adoptium.net 下载安装
```

### 4. 验证

```bash
cd /path/to/AiCode
bash .automation/new-project.sh test-demo -t plain --skip-dev --skip-git
# 应该成功创建 test-demo 项目
rm -rf "AI-【3】-项目开发/test-demo"
```

---

## 目录结构

```
AiCode/
├── .workspace/              ← 适配脚本（运行一次即可）
├── .automation/             ← 项目自动化脚本
├── .ai-memory/              ← 跨 IDE 共享记忆
├── AI-ClaudeCode-最佳实践精简.md        ← AI 行为约定
├── CLAUDE.md                ← Claude Code 指令
│
├── 【0】AI大模型教程/         ← 学习资料
├── 【1】SpringAIAlibaba/     ← 学习资料
├── 【2】langchain4j/         ← 学习资料
├── 【3】工作资料/             ← 工作文档
├── AI-【3】-项目开发/             ← 个人项目
├── AI-【3】公司项目/             ← 公司项目（git clone）
└── docs/                    ← 文档汇总
```

## 使用须知

- **个人项目**放 `AI-【3】-项目开发/`
- **公司项目**放 `AI-【3】公司项目/`，每个项目独立 git 管理
- **AI 约定**统一在 `AI-ClaudeCode-最佳实践精简.md`，改一处全生效
- **搬家后**只需运行 `setup.sh`，所有路径自动适配
