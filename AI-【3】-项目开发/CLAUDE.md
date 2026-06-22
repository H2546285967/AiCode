# AI-【3】-项目开发

> 本目录下所有项目的 AI 助手通用入口（支持多工具）

---

## 启动必读（进入本目录时按顺序执行）

1. 读取工作空间根目录 `AI-ClaudeCode-最佳实践精简.md` — 遵守行为约定
2. 读取 `AI-【0】-AI规则与范式/00-目录索引.md` — 了解可用开发范式（SDD 等）
3. 读取本目录下的 `项目快速开发与迭代.md` — 了解项目创建和迭代流程
4. 如果在具体项目子目录中，读取该项目的 CLAUDE.md

---

## 通用约定

**所有行为规范继承根目录约定文件**：
`AI-ClaudeCode-最佳实践精简.md`（工作空间根目录）

## 多工具支持

| 工具 | 指令文件 | 加载方式 |
|:-----|:---------|:---------|
| Claude Code | `CLAUDE.md` | 自动加载 |
| Cursor | `.cursorrules` | 自动加载 |
| 通义灵码 | `.lingma/instructions.md` | 自动加载 |
| Qoder | `.qoderrules` | 自动加载 |
| MiniMax Code | `.minimaxrc` | 自动加载 |
| ZCode | `AGENTS.md` | 自动加载 |
| 其他工具 | 直接读 `AI-ClaudeCode-最佳实践精简.md` | 手动引用 |

---

## 新建项目流程

### 1. 创建项目目录
```
AI-【3】-项目开发/项目名/
```

### 2. 创建项目指令文件（按需选择工具）

**通用模板**（所有工具适用）— 创建 `AGENTS.md`：
```markdown
# 项目名称
> 一句话描述

## 通用约定
继承根目录 AI 约定：AI-ClaudeCode-最佳实践精简.md（工作空间根目录）

## 项目信息
- 技术栈：
- 项目类型：
- 开发目标：

## TODO
- [ ] 待办事项
```

**Claude Code** — 额外创建 `CLAUDE.md`（内容同上）

**Cursor** — 额外创建 `.cursorrules`（内容同上）

**通义灵码** — 额外创建 `.lingma/instructions.md`（内容同上）

**Qoder** — 额外创建 `.qoderrules`（内容同上）

**MiniMax Code** — 额外创建 `.minimaxrc`（内容同上）

### 3. 开始开发
在对应工具中打开项目目录即可，工具会自动加载指令文件。
