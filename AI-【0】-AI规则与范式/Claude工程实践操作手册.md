# Claude Code 工程实践操作手册

> 实际可用的能力 + 操作步骤，开箱即用
> 最后更新：2026-06-22（含智能调度 v1.2.0 + 三级检查点 v1.3 + Git worktree P0）

> **精简版**：根目录 [`AI-ClaudeCode-最佳实践精简.md`](../AI-ClaudeCode-最佳实践精简.md)（5分钟速览）
> **详细版**：本文档（完整操作指南）

---

## 目录

1. [快速上手](#1-快速上手)
2. [Commands 命令速查](#2-commands-命令速查)
3. [Agents 子代理使用](#3-agents-子代理使用)
4. [🧠 左脑记忆系统](#4-左脑记忆系统)
5. [Hooks 自动化机制](#5-hooks-自动化机制)
6. [Session 管理策略](#6-session-管理策略)
7. [SDD 开发流程](#7-sdd-开发流程)
8. [日常维护](#8-日常维护)
9. [常见问题](#9-常见问题)
10. [🚀 智能调度（智能派 Agent）](#10-智能调度智能派-agent) ← **新**
11. [📦 快照系统（会话备份与快速恢复）](#11-快照系统会话备份与快速恢复) ← **新**
12. [🔄 三级检查点（v1.3）](#12-三级检查点v1-3-已上线) ← **新**
13. [🌳 Git Worktree 多工作区](#13-🌳-git-worktree-多工作区p0已上线) ← **新**
14. [📊 当前进度速查](#14-📊-当前进度速查2026-06-22) ← **新**

---

## 1. 快速上手

### 新会话启动后

每次新开 Claude Code 会话，系统会自动：

```
1. ✅ PreToolUse — 开始监控工具调用
2. ✅ Setup — 注入记忆索引 + 最近 5 条知识
3. ✅ Status Line — 底部显示 🧠N | HH:MM
```

**你什么都不用做，直接开始工作即可。**

### 想快速记忆一个知识点

```
你说：项目A决定用 Redis 6.0 做缓存
Claude：自动执行 remember 存储到知识库
```

### 想搜索之前的知识

```
你说：/status 项目A
Claude：显示系统状态 + 搜索结果
```

### 想从零开始开发一个项目

```
你说：/new-project
Claude：交互式引导创建项目
```

---

## 2. Commands 命令速查

所有命令在对话中直接输入 `/命令名` 即可使用。

| 命令 | 用途 | 示例 |
|:-----|:-----|:-----|
| **/remember** | 快速记忆知识点 | `/remember 项目A用 Spring Boot 3.2` |
| **/status** | 查看系统状态 + 搜索 | `/status 年会` |
| **/compact-hint** | 带提示的上下文压缩 | `/compact-hint focus on 当前功能，drop 已完成部分` |
| **/go** | 自动测试→简化→审查→提交 | `/go` |
| **/code-review** | 多维度代码审查 | `/code-review` |
| **/new-project** | 新建项目 | `/new-project` |
| **/dispatch** | 智能派发子代理（自动判断要不要派） | `/dispatch 排查订单 BUG` |
| **/parallel** | 强制并行派 N 个 Agent | `/parallel 3 全面排查系统问题` |

### 详细说明

#### `/remember` — 记忆知识
```
用法：/remember <内容>
      /remember            ← 自动从当前语境提炼

示例：
  /remember 公司年会定在12月25号，国际会议中心3楼
  /remember 项目A技术栈：Spring Boot 3.2 + Vue3 + Redis 6.0
```

#### `/status` — 系统状态
```
用法：/status [关键词]

不带关键词：显示系统状态 + 知识图谱 + 仪表盘
带关键词：额外执行 recall 搜索

示例：
  /status               → 系统健康检查
  /status 项目A         → 系统状态 + 搜索项目A相关知识
```

#### `/compact-hint` — 精准压缩
```
用法：/compact-hint [focus on 保留内容] [drop 丢弃内容]

当 context 接近 40% 时使用，比自动 compact 更精准。

示例：
  /compact-hint
  /compact-hint focus on 当前API开发，drop 已完成的数据库设计
```

#### `/go` — 全自动交付流水线
```
用法：/go

自动依次执行：
  1. 测试（检测并运行项目测试）
  2. 简化（运行 /simplify）
  3. 审查（运行 /code-review）
  4. 提交（git add + git commit）
  
任意步骤失败则停止并报告原因。
```

#### `/code-review` — 代码审查
```
用法：/code-review

审查维度：
  🔴 严重 — 逻辑 Bug、安全漏洞
  🟡 警告 — 边界条件、错误处理缺失
  💡 建议 — 命名、注释、设计模式
```

---

## 3. Agents 子代理使用

子代理用于复杂任务的**隔离执行**——它们在独立的 context 中运行，不会污染主对话。

### 可用代理

| 代理 | 用途 | 适用场景 | 模型 |
|:-----|:-----|:---------|:-----|
| **planner** | 架构规划与技术选型 | 系统设计、方案评审 | Opus |
| **reviewer** | 多维度代码审查 | Bug 发现、安全检查 | Opus |
| **explorer** | 代码库探索研究 | 理解项目结构、查找代码 | Opus |

### 使用方式

在对话中直接说：

```
# 使用 planner 代理
用 planner 帮我设计这个系统的架构

# 使用 reviewer 代理
用 reviewer 审查最近的变更

# 使用 explorer 代理
用 explorer 研究这个目录的代码结构
```

### 最佳实践

```
✅ 复杂任务用子代理 → 保持主 context 干净
✅ reviewer 审查 planner 的方案 → 多角度验证
❌ 简单任务（如修一个变量名）不需要子代理
```

---

## 4. 🧠 左脑记忆系统

### 核心命令

```
bash .../left-brain.sh remember "内容"      # 记忆知识
bash .../left-brain.sh recall "关键词"      # 搜索知识
bash .../left-brain.sh preference "纠正..." # 存储偏好/纠正
bash .../left-brain.sh graph                # 显示知识图谱
bash .../left-brain.sh list                 # 列出所有知识
bash .../left-brain.sh dashboard            # 监控面板
bash .../left-brain.sh status               # 系统状态
```

### 自动记忆触发规则

系统会在对话中自动检测并记忆以下信息：

| 信息类型 | 触发词 | 示例 |
|:---------|:-------|:-----|
| 事实信息 | 日期、时间、地点、数字 | "年会定在12月25号" |
| 技术决策 | 决定用、选择了、确认 | "决定用Spring Boot 3.2" |
| 项目信息 | 项目名、技术栈、进度 | "项目A用Vue3+Element" |
| 用户偏好 | 我喜欢、习惯用、总是 | "我喜欢用IntelliJ" |
| 用户纠正 | 不对、错了、不是这样 | "不对，应该用PostgreSQL" |

### 关联推理（知识图谱）

记忆新知识时会自动关联已有知识：

```
你记忆：项目A用 Spring Boot 3.2
你记忆：项目A的缓存用 Redis 6.0
         → 自动关联到第一条（共同关键词：项目A）

搜索 "项目A" 时：
  → 显示两条精确匹配
  → 图谱扩散显示关联的第3条知识
```

### 偏好 / 纠正学习

```
你说：不对，项目A用的是 PostgreSQL 16 不是 MySQL
系统执行：left-brain.sh preference "纠正: 项目A用的是 PostgreSQL 16 不是 MySQL"
         → 自动分类为"偏好"，搜索时 ⭐ 标记置顶
```

---

## 5. Hooks 自动化机制

系统配置了 4 个 hook，在后台自动运行：

### 生命周期

```
PreToolUse ──→ Setup ──→ 对话进行中 ──→ PostToolUse ──→ Stop
    │            │                          │              │
    ├─ 记录工具   ├─ 加载记忆                 ├─ Edit/Write  ├─ 自动保存
    │  调用日志   │  索引 + 知识               │  后触发      │  会话快照
    │            │  仅首次会话                │  可扩展      │  检查感知队列
```

### Hook 详情

| Hook | 触发时机 | 作用 | 备注 |
|:-----|:---------|:-----|:-----|
| **PreToolUse** | 每次工具调用前 | 异步记录 Skill/Bash/Edit/Write 到日志 | 日志文件：`logs/tool_usage.log` |
| **Setup** | 会话启动时 | 加载 MEMORY.md 索引 + 最近 5 条知识 | `once: true` 只执行一次 |
| **PostToolUse** | Edit/Write 后 | 预留自动格式化入口 | matcher: Edit\|Write |
| **Stop** | Claude 停止时 | auto-perceive（检查感知队列）+ auto-save（自动快照） | exit 2 可阻止停止 |

### 感知队列机制

当不方便立即执行 `remember` 时（如正在输出大段代码）：

```
bash .../left-brain/scripts/enqueue.sh "要记忆的内容"
```

Stop hook 会在你停止时提醒你处理。

### 自动快照

每次 Stop 时，auto-save.sh 检查最近 1 小时的新增知识，自动生成快照：
```
sessions/snapshots/snapshot_YYYYMMDD_HHMMSS.md
```

---

## 6. Session 管理策略

### 基本原则

```
新任务 = 新 session
除非强关联（如正在写代码 + 写文档），否则开新 session
```

### Context 水位管理

| 水位 | 表现 | 操作 |
|:-----|:-----|:-----|
| < 30% | 智能正常 | 正常继续 |
| 30-40% | 开始降智 | 建议 `/compact-hint` |
| > 40% | 明显降智 | 主动 /compact 或换 session |

### 推荐流程

```
遇到复杂任务
    │
    ├─→ 用 planner 代理 → 出方案
    │
    ├─→ 开新 session（/clear）
    │     ├─→ 编码实现
    │     └─→ /code-review 审查
    │
    ├─→ 开新 session
    │     └─→ 修复 review 发现的问题
    │
    └─→ /go 提交
```

### /compact 策略

```
/compact focus on [当前任务]，drop [已完成/无关内容]

✅ 推荐：加 hint → 比无提示压缩更精准
❌ 不推荐：自动 compact → 降智时自动触发效果差
```

### rewind 策略

```
发现方向错误时：双击 Esc 或 /rewind
→ 回退到错误前重新 prompt
→ 不要在错误基础上纠错（污染 context）
```

---

## 7. SDD 开发流程

### 流程

```
阶段 1：方案输出
  ├─ 读 spec.md
  ├─ 输出完整开发方案
  └─ 等【确认方案】

阶段 2：垂直切片编码
  ├─ 每切片横跨 DB+API+UI
  ├─ 完成后端到端可验证
  └─ 例：用户登录 = 用户表 + 登录接口 + 登录页面

阶段 3：自动自测
  ├─ 模拟运行
  ├─ 排查 bug/边界
  └─ 自动修复

阶段 4：完整交付
  ├─ 输出 readme
  └─ 打包说明
```

### 项目模板

```
AI-【3】-项目开发/<项目名>/
├── spec.md        ← 需求规范（唯一真值）
├── CLAUDE.md      ← 项目指令
├── index.html/    ← 代码
├── readme.md      ← 运行说明
└── dist说明.txt   ← 打包分发
```

---

## 8. 日常维护

### 推荐习惯

```
每天开始：
  1. npm update -g @anthropic-ai/claude-code
  2. 阅读 changelog：
     https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md

每次会话：
  /status    → 系统健康检查
  /doctor   → 诊断问题（遇到异常时）

每周：
  清理旧会话：bash .../session-summary.sh cleanup 30
  检查 tool 使用统计：cat .../logs/tool_usage.log | sort | uniq -c
```

### 工具调用监控

PreToolUse hook 会异步记录工具调用到：
```
.claude/skills/left-brain/memory/logs/tool_usage.log
```

查看使用频率：
```bash
# 统计最常用的工具
cat tool_usage.log | awk '{print $3}' | sort | uniq -c | sort -rn
```

---

## 9. 常见问题

### Q: 左脑系统不自动记忆了？
检查：
```bash
bash .../left-brain/scripts/left-brain.sh status
# 确认 SKILL.md ✓ 记忆目录 ✓
```

### Q: 感知队列一直提醒？
手动处理队列：
```bash
bash .../left-brain/scripts/left-brain.sh remember "队列中的内容"
# 然后清空
> .../memory/perceive_queue.txt
```

### Q: Status line 不显示？
检查 hooks 配置是否被重置：
```bash
grep statusLine "H:/AI-han/AiCode/.claude/settings.local.json"
```

### Q: 知识太多想清理？
```bash
# 查看所有知识
left-brain.sh list

# 清理旧会话（保留最近30天）
bash .../session-summary.sh cleanup 30
```

### Q: 想禁用某个 hook？
编辑 `settings.local.json`，移除对应 hook 段落后重启 Claude Code。

---

> **快捷键汇总**：双击 Esc = /rewind | Shift+Tab 切换权限模式 | `/focus` 只看结果
> **环境**：Windows 10 + Git Bash | Claude Code v2.1+

---

## 10. 🚀 智能调度（智能派 Agent）

> **核心能力**：让复杂任务自动派 2-3 个 Agent 并行处理，主会话等完工后汇总。
> **效果**：相比串行查全部，**提速 2-3 倍**。

### 10.1 它是什么

抖音视频同款"主从并行加速"—— 像 Java 的 CountDownLatch 模式：

```
你输入"排查订单 BUG"
       ↓
dispatcher.js 智能分析（规则引擎 12/12 测试通过）
       ↓
判断：派 2 个 Agent（后端 + 前端）
       ↓
并行执行（不互相等）
       ↓
主会话等所有完工 → 汇总 → 输出
```

### 10.2 三种使用方式

#### 方式 1：自动（推荐）
你每次提问，**PreToolUse 钩子**自动跑 `dispatcher.js` 判断要不要派 Agent。
**无需任何操作**，全自动。

#### 方式 2：手动 `/dispatch`
```
/dispatch 排查订单 BUG
/dispatch 全面重构 UserService
/dispatch 实现完整的用户登录功能
```
**适用**：明确知道要派 Agent 的复杂任务。

#### 方式 3：强制 `/parallel`
```
/parallel 3 全面排查系统问题    ← 强制派 3 个
/parallel 2 分析前后端         ← 强制派 2 个
```
**适用**：跳过判断，强制多模型并行。

### 10.3 工作原理（Layer 1 规则引擎）

`scripts/orchestrator/dispatcher.js` 用**关键词 + 文件数 + 任务类型**判断：

| 触发条件 | 决策 |
|:---------|:-----|
| 命中关键词："全面"、"排查 BUG"、"前后端一起" | 派 2 个 Agent |
| 预估涉及文件 ≥ 5 | 派 2-3 个 Agent |
| 任务类型：bug_fix / refactor / feature_full | 派 2 个 Agent |
| 命中关键词："快速"、"简单"、"解释"、"推荐" | 不派，主会话直接答 |

### 10.4 提速效果（实测）

| 任务 | 串行 | 并行 | 提升 |
|:-----|:-----|:-----|:-----|
| 点餐系统 BUG 排查 | 3-4 分钟 | 1-2 分钟 | **3 倍** |
| 智能调度模块自检 | 1-2 分钟 | 25 秒 | **3-4 倍** |
| Dishes.vue 重构方案 | 1.5 分钟 | 30 秒 | **3 倍** |

### 10.5 子代理标准模板

派 2 个 Agent 时（最常见）：

```python
# Agent 1: 代码/技术层
Agent(subagent_type="Explore", prompt=f"""
作为代码分析专家，排查任务的【代码层面】：
任务: {TASK}
要求:
- 重点查看相关源代码文件
- 用 Glob/Grep 定位关键路径
- 输出可疑代码片段（带行号）
- 给出修复建议
⚠️ Read/Glob/Grep only，输出中文
""")

# Agent 2: 数据/配置/环境层
Agent(subagent_type="Explore", prompt=f"""
作为数据/配置分析专家，排查任务的【数据层面】：
任务: {TASK}
要求:
- 检查 .env / 配置文件
- 检查数据库表结构 / 缓存配置
- 输出问题清单（带证据）
⚠️ Read/Glob/Grep only，输出中文
""")
```

### 10.6 调试和测试

```bash
# 跑 12 个测试用例
node scripts/orchestrator/test-dispatcher.js

# 看决策日志
node scripts/orchestrator/token-monitor.js stats

# 钩子测试（模拟 UserPromptSubmit）
echo '{"tool_name":"UserPromptSubmit","tool_input":{"prompt":"排查 BUG"}}' | \
  node scripts/orchestrator/hooks/dispatch-decision.js
```

### 10.7 完整文档

- `scripts/orchestrator/文档/使用文档.md` — 完整使用指南
- `scripts/orchestrator/文档/v1.2-改进清单.md` — 11 项下一版本路线图
- `scripts/orchestrator/决策指南.md` — 主会话决策模板
- `scripts/orchestrator/dispatcher.js` — 规则引擎源码

---

## 11. 📦 快照系统（会话备份与快速恢复）

> **核心能力**：会话结束前一键备份，会话开头 1 秒接上。
> **位置**：根目录 `ROOT_快速加载会话.md`（**每次会话都能直接看到**）。

### 11.1 它解决什么

| 痛点 | 解决方案 |
|:-----|:---------|
| 会话太长 context 满了 | 保存快照 → 重启 → 1 秒接上 |
| 切换大任务前怕丢上下文 | 一句话备份完整状态 |
| 下次开会话忘了上次干了啥 | 看快照列表 → 复制启动命令 |
| 想找"上次 XX 任务的结果" | 标签搜索 → 直接定位 |

### 11.2 它自动做什么（save.js 修复后）

跑一次 `save.js`，**全自动完成**：

1. ✅ 快照文件保存到 `.claude/snapshots/`
2. ✅ `ROOT_快速加载会话.md` 自动追加表格行（带 ⭐ 最新）
3. ✅ `ROOT_快速加载会话.md` 自动追加代码块（启动命令）
4. ✅ 旧快照的"⭐ 最新"标记自动移除

**无需手动编辑 ROOT_快速加载会话.md**。

### 11.3 三种加载方式

#### 方式 1：命令行（最快）
```bash
node scripts/会话快照/load.js latest           # 最新快照
node scripts/会话快照/load.js v1.1            # 按版本匹配
node scripts/会话快照/load.js 智能调度         # 按关键词匹配
```

#### 方式 2：手动浏览
1. 打开 `ROOT_快速加载会话.md`
2. 滚到 "## 🚀 快速启动命令" 段
3. 找 "### 📦 XXX（最新）" → 复制代码块

#### 方式 3：快速启动索引
文档顶部有"⚡ 一句话启动"段，列出 3 种方式。

### 11.4 工作流（4 步）

```
1. AI 在对话中学到新事实 → 自动存左脑 KB
2. 会话结束前 → 手动跑快照（save.js + backup-history.js）
3. 下次会话开头 → 加载快照（拿到完整上下文）
4. AI 工作中 → recall 查左脑（跨会话知识）
```

### 11.5 和左脑的关系

**不是替代，是互补**：

| 维度 | 快照 | 左脑 |
|:-----|:-----|:-----|
| **存什么** | 完整快照（对话 + KB + 文件状态） | 1-2 句话 KB 摘要 |
| **何时用** | 会话开头加载 | AI 推理时 recall |
| **数据量** | 大（0.1-1 MB/个） | 小（几百字节/条） |
| **保存触发** | 你手动 | AI 自动 |
| **适合存** | 会话状态、文件状态 | 事实、决策、偏好 |

### 11.6 命名建议（中文标签）

| 场景 | 推荐标签格式 | 举例 |
|:-----|:------------|:-----|
| 重要里程碑 | `里程碑-XXX` | `里程碑-智能调度v1.1` |
| 功能完成 | `完成-XXX` | `完成-登录页重构` |
| 任务切换前 | `切换前-XXX` | `切换前-点餐系统` |
| 日常进度 | `日常-日期` | `日常-20260622` |
| BUG 修复 | `修复-XXX` | `修复-下单失败` |

### 11.7 完整文档

- `ROOT_快速加载会话.md` — 根目录索引（**每次会话第一眼看到**）
- `scripts/会话快照/` — 快照脚本（save.js / load.js / backup-history.js）
- `.claude/snapshots/` — 快照存放目录
- `scripts/orchestrator/文档/重启指南.md` — 重启后接上指南

---

## 12. 🔄 三级检查点（v1.3，已上线）

### 核心思想

替代"单独文本快照"，用 **计划 → 迭代 → 全局归档** 三段式闭环：

| 级别 | 工具 | 何时用 |
|:-----|:-----|:-------|
| **1. 计划快照** | `plan-snapshot.js` | 任务**开始前**保存方案 |
| **2. 迭代快照** | `save.js`（已上线） | 每个 worker **完成后**保存 |
| **3. 全局归档** | `global-archive.sh` | 任务**全部完成后**归档 |

### 完整工作流

```bash
# === 阶段 1：开始任务 ===
node scripts/parallel/plan-snapshot.js \
  "登录页重构" \
  "用 Vue3 重构登录页 + 加单元测试" \
  "graph TD\n  A[开始] --> B[改组件]\n  B --> C[加测试]" \
  "src/views/Login.vue,tests/Login.test.js"

# === 阶段 2：worker 干活（每个完成后）===
node scripts/会话快照/save.js "改完 Login.vue" "迭代-Login"
node scripts/会话快照/save.js "加完测试" "迭代-测试"
node scripts/会话快照/save.js "全部完成" "里程碑-完成"

# === 阶段 3：全部完成后归档 ===
bash scripts/parallel/global-archive.sh "登录页重构"

# 输出：archives/登录页重构-<时间戳>/
#   ├── snapshots-index.md     (所有快照索引)
#   ├── COMPLETION-REPORT.md   (完成报告)
#   └── plan-*.md              (原始计划)
```

### save.js 自动提示归档

当标签含"完成/里程碑/交付"时，**自动在 ROOT_快速加载会话.md 启动段加三级检查点提示**：

```
> 💡 **三级检查点提示**：本任务完成（标签含"完成/里程碑/交付"）。可跑 
> `bash scripts/parallel/global-archive.sh "<任务名>"` 全局归档
```

避免"任务完成忘了归档"。

### 完整文档

- `scripts/parallel/plan-snapshot.js`
- `scripts/parallel/global-archive.sh`

---

## 13. 🌳 Git Worktree 多工作区（P0，已上线）

### 核心思想

**多个 worker 在不同分支/目录并行开发**，最后合并回主分支。

### 流程

```bash
# 1. 创建 2 个并行 worktree（在 .worktrees/ 下）
bash scripts/parallel/worktree-parallel.sh "任务名" 2
# 输出：
#   Worker 1: 任务名-xxx-worker-1
#   目录:    H:/AI-han/AiCode/.worktrees/任务名-xxx/w1
#   Worker 2: 任务名-xxx-worker-2
#   目录:    H:/AI-han/AiCode/.worktrees/任务名-xxx/w2

# 2. 在 w1 改文件（worker 1）
cd H:/AI-han/AiCode/.worktrees/任务名-xxx/w1
# 改完后 git commit

# 3. 在 w2 改文件（worker 2）
cd H:/AI-han/AiCode/.worktrees/任务名-xxx/w2
# 改完后 git commit

# 4. 全部完成后合并回主分支
bash scripts/parallel/worktree-merge.sh "任务名"
# 输出：
#   合并 worker-1 → master
#   合并 worker-2 → master
#   删除 worktree + 分支
#   Git tag: archive-任务名-时间戳
```

### 完整文档

- `scripts/parallel/worktree-parallel.sh` — 创建 worktree
- `scripts/parallel/worktree-merge.sh` — 合并 + 清理

### 注意事项

- ⚠️ 工作空间根目录**必须**是 Git 仓库（已初始化）
- ⚠️ Windows + Git Bash 路径映射坑：脚本已用绝对路径解决
- ⚠️ 并行数不要超过 3 个（社区经验：再多提速不升反降）

---

## 14. 📊 当前进度速查（2026-06-22）

| 版本 | 状态 | 关键能力 |
|:-----|:-----|:---------|
| **v1.0** | ✅ | 智能调度基础 |
| **v1.1** | ✅ | + 快照系统 |
| **v1.2 批次 1** | ✅ | + 6 项改进（15/15 测试） |
| **v1.2 批次 2** | ✅ | + 5 项改进 + 11/11 e2e |
| **P0** | ✅ | + Git worktree |
| **v1.3** | ✅ | + 三级检查点 |

**总测试数**：26/26 全过
**总文件数**：30+ 创建/修改
**RULES.version**：v1.2.0
**左脑 KB**：10 条（KB-013~KB-022）
**快照数**：18 个 + 1 个 archives
