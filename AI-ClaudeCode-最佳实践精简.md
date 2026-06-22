# AI 最佳实践与行为约定

> 工作空间通用行为标准。所有 AI 助手和人类开发者共同遵守。
> 最后更新：2026-06-22（含智能调度 v1.2 + 快照系统 v1.1 + 三级检查点 v1.3 + Git worktree）

---

## 一、核心原则

| 原则 | 说明 |
|:-----|:------|
| **成本意识** | 控制 Token 消耗，按需读取，精炼输出 |
| **记忆优先** | 重要信息自动存左脑知识库，跨会话可用 |
| **任务隔离** | 新任务开新 session，避免 context 污染 |
| **回退优于纠错** | 发现方向错误用 `/rewind`，不在错误上修复 |
| **智能调度** | 复杂任务自动派子代理并行，主会话等完工（2-3 倍提速） |
| **快照备份** | 重要节点用 `会话快照` 系统备份，重启 1 秒接上（save.js 自动维护索引） |
| **自我约束** | AI 完成改动后**自动**跑测试+存快照+写KB+更新文档，不需用户提醒 |
| **上下文分片** | `.claudeignore` 排除 2GB+ 数据，理论省 60% token |
| **QA 子代理** | `.claude/agents/qa-reviewer.md`（独立验证，28/28 测试覆盖） |
| **后台异步** | `Ctrl+B` 把当前命令放到后台跑，主线继续。`/tasks` 看所有后台任务 |

---

## 二、快速操作（速查表）

| 操作 | 方法 | 说明 |
|:-----|:-----|:-----|
| 记忆知识 | `/remember 内容` 或自动触发 | 存左脑 |
| 搜索知识 | `recall 关键词` | 左脑搜索 |
| 查看系统 | `/status` | 看监控 |
| 压缩上下文 | `/compact-hint` | 精准压缩 |
| 代码审查 | `/code-review` | 多 Agent 审查 |
| 全自动交付 | `/go` | 测试→简化→审查→提交 |
| 新建项目 | `/new-project` | 项目脚手架 |
| **智能派发** | `/dispatch 任务` | 自动判断要不要派 Agent |
| **强制并行** | `/parallel N 任务` | 强制派 N 个 Agent（1-5） |
| **保存快照** | `node scripts/会话快照/save.js "标题" "标签"` | 结束会话前 |
| **备份对话** | `node scripts/会话快照/backup-history.js "标签"` | 重要里程碑 |
| **加载快照** | 看 `ROOT_快速加载会话.md` | 下次会话开头 |
| **切到后台** | `Ctrl+B` | 把当前命令放到后台跑 |
| **看后台任务** | `/tasks` | 列所有后台运行的任务 |

---

## 三、文件读取策略

- **按需读取** — 用户提到哪个文件就读哪个
- **批量读前确认** — 多文件先列清单让用户确认
- **优先搜索** — 使用 Glob/Grep 而非遍历目录
- **部分读取** — 大文件只读需要的行范围

---

## 四、输出控制

- **精炼** — 避免冗长解释，代码直接可运行
- **最简** — 没特别要求时给最简洁的方案
- **无教学式代码** — 不输出大量注释的"演示代码"

---

## 五、Session 管理

- **新任务 = 新 session**（除非强关联）
- Context > 40% 时主动建议 `/compact` 或重置
- `/compact-hint` 比自动 compact 更精准
- `/rewind` 代替纠错，保持 context 干净
- **会话结束前**：跑 `node scripts/会话快照/save.js "标题" "标签"` 保存快照

---

## 六、AI 能力速查

| 能力 | 入口 | 说明 |
|:-----|:-----|:------|
| 自动感知 | 自动 | 检测事实/决策/偏好/纠正，自动记忆左脑 |
| 知识图谱 | `graph` | 关联推理，2跳扩散搜索 |
| 智能调度 | `/dispatch` 或自动钩子 | Layer 1 规则引擎，12/12 测试 |
| 强制并行 | `/parallel N` | 跳过判断，强制派 N 个 Agent |
| **快照自动维护** | `node scripts/会话快照/save.js` | 跑完自动追加到 ROOT_快速加载会话.md（**无需手动编辑**） |
| Subagent | planner/reviewer/explorer | 隔离执行复杂任务 |
| Hooks | 后台自动 | Setup/Stop/PostToolUse/PreToolUse（含 dispatcher 钩子） |
| Status Line | 底部实时 | `🧠N | HH:MM` 实时水位 |
| Token 监控 | `node scripts/orchestrator/token-monitor.js` | 统计派发率 + 估算成本 |
| 规则学习 | `node scripts/orchestrator/learn-rules.js` | 反馈收集 + 模式分析 |
| 快照系统 | `scripts/会话快照/` | save/load/backup-history |
| **自我约束** | `.claude/rules/self-discipline.md` | **AI 完成后自动收尾（无需提醒）** |

---

## 七、智能调度详解（v1.2.0，已上线）

### 它是什么

抖音视频同款"主从并行加速"效果 —— 派 2-3 个 Agent 并行处理任务，主会话等完工后汇总。

### v1.2 新增能力

| 改进 | 说明 |
|:-----|:-----|
| 灰区 `suggested_action` 字段 | 调用方有明确依据（action / agents / hint） |
| `estimateFileCount` 累加权重 | 多关键词叠加，更准 |
| 中文口语词扩充 | `看下` `瞄一下` `瞄瞄` `扫一眼` `聊聊` `说说` `讲讲` |
| 钩子异常加 `errorType: 'crash'` | 区分"决策不派"vs"调用失败" |
| `learn-rules` 简化为 `bad`/`good` | 一句话反馈 |
| `RULES.version = v1.2.0` | 完整版本追溯 |
| 英文 `deploy`/`rollback`/`migrate` detect | CI/CD 场景 |
| `confidence` 改 0-1 数字 | high=0.9 / medium=0.6 / low=0.3 |
| 4 工具统一入口 `index.js` | 一个口子调所有 |
| `learn-rules` prompt hash 去重 | 同一反馈不重复 |
| 钩子写日志 | `logs/dispatch-decisions.log` |

### 测试覆盖

- 15 个单元测试（test-dispatcher.js）
- 11 个 e2e 测试（test-e2e.js）
- **26/26 全过**

### 怎么用

**方式 1：自动（推荐）** — PreToolUse 钩子已配置
你每次提问，钩子自动跑 `dispatcher.js` 判断要不要派 Agent。

**方式 2：手动** — `/dispatch 任务`
- 输入：`/dispatch 排查订单 BUG`
- 自动派 2 个 Agent 并行
- 主会话汇总结果

**方式 3：强制并行** — `/parallel N 任务`
- 输入：`/parallel 3 全面排查系统问题`
- 强制派 3 个 Agent（跳过判断）

### 提速效果

| 模式 | 耗时 | 提升 |
|:-----|:-----|:-----|
| 串行（主会话自己查） | 3-4 分钟 | 基准 |
| 并行（派 2-3 Agent） | 1-2 分钟 | **2-3 倍** |

### 完整文档

- `scripts/orchestrator/文档/使用文档.md` — 完整使用指南
- `scripts/orchestrator/文档/v1.2-改进清单.md` — 11 项待优化（下一版本路线图）
- `scripts/orchestrator/决策指南.md` — 主会话决策模板

---

## 八、快照系统详解（已上线，save.js 修复后全自动）

### 它解决什么

- 会话太长 context 满了怎么办
- 切换大任务前怕丢上下文
- 下次开会话忘了上次干了啥

### 它自动做什么（save.js 修复后）

跑一次 `save.js`，**全自动完成**：
1. ✅ 快照文件保存到 `.claude/snapshots/`
2. ✅ ROOT_快速加载会话.md **自动追加表格行**（带 ⭐ 最新）
3. ✅ ROOT_快速加载会话.md **自动追加代码块**（启动命令）
4. ✅ 旧快照的"⭐ 最新"标记自动移除

**无需手动编辑 ROOT_快速加载会话.md**。

### 怎么用

**结束会话前**（一句话备份，全自动）：
```bash
node scripts/会话快照/save.js "智能调度 v1.1 完成" "里程碑-智能调度v1.1"
```

**下次会话开头**（1 秒接上）：
```bash
# 方式 1：看根目录索引（自动维护的）
cat ROOT_快速加载会话.md

# 方式 2：命令行加载
node scripts/会话快照/load.js v1.1
```

### 和左脑的关系

**不是替代，是互补**：
- 快照 = 会话状态层（短期，详尽）
- 左脑 = 知识沉淀层（长期，精炼）

**协同工作流**：
1. AI 学到新事实 → 自动存左脑 KB
2. 会话结束前 → 手动跑快照（**save.js 自动维护索引**）
3. 下次会话开头 → 加载快照 + AI recall 左脑

### 完整文档

- `ROOT_快速加载会话.md` — 根目录索引（**每次会话都能看到，save.js 自动维护**）
- `scripts/会话快照/` — 快照脚本
- `.claude/snapshots/` — 快照存放目录

---

---

## 九、文件命名规范（重要！）

为方便操作员识别，**用户能直接看的文件用中文名**，**CC 内部用的保留英文**：

| 类型 | 命名 | 例子 |
|:-----|:-----|:-----|
| **根目录索引** | 中文 | `ROOT_快速加载会话.md` |
| **使用文档** | 中文 | `使用文档.md`、`决策指南.md` |
| **核心代码** | 英文 | `dispatcher.js`、`test-dispatcher.js` |
| **斜杠命令** | 英文 | `dispatch.md`、`parallel.md`（CC 约定） |
| **钩子配置** | 英文 | `dispatch-decision.js`（CC 引用） |
| **目录** | 中文（用户找的） | `会话快照/`、`文档/` |
| **目录** | 英文（CC 引用的） | `hooks/`、`commands/` |

**为什么不全改中文**？
- CC 系统约定（钩子、命令）依赖英文精确路径
- 改错了全仓崩溃
- 双语并存 = 安全 + 友好

---

## 九点五、🔄 三级检查点（v1.3，已上线）

### 它是什么

替代"单独文本备份"，用**计划 → 迭代 → 全局归档**三段式闭环，让任务完整可追溯、可回滚。

### 三段式流程

```
1. 计划快照（开始前）
   node scripts/parallel/plan-snapshot.js "任务" "描述" "mermaid" "文件"
   ↓
2. 迭代快照（每个 worker 完成后）
   node scripts/会话快照/save.js "标题" "标签"
   ↓ 自动检测"完成/里程碑/交付"标签
   ↓ 自动加"💡 三级检查点提示"
3. 全局归档（全部完成后）
   bash scripts/parallel/global-archive.sh "任务"
   ↓
   生成 archives/<任务>-<时间戳>/ 目录
   含：snapshots-index.md + COMPLETION-REPORT.md + Git tag
```

### Git worktree 多工作区（P0 已上线 + v1.3.2 实测）

让多个 worker 在不同分支并行开发，不冲突：

```bash
# 创建 2 个并行 worktree
bash scripts/parallel/worktree-parallel.sh "任务名" 2

# 合并回主分支
bash scripts/parallel/worktree-merge.sh "任务名"
```

**v1.3.2 实测结果**：
- 2 worker 并行：**7 秒**
- 串行估计：**11 秒**
- **提速 36%**（小任务下未达社区 4 倍，但 36% 实打实省时间）
- 大任务下提速更明显（4 个 worker 改 4 个文件）

**注意**：worktree 必须在 Git 仓库下用，工作空间根目录已初始化。

### 完整文档

- `scripts/parallel/plan-snapshot.js` — 计划快照源码
- `scripts/parallel/global-archive.sh` — 全局归档源码
- `scripts/parallel/worktree-parallel.sh` — 多工作区创建
- `scripts/parallel/worktree-merge.sh` — 多工作区合并

---

## 十、相关文件

| 文件 | 说明 |
|:-----|:------|
| `CLAUDE.md` | 启动导航 + 目录结构 |
| `README.md` | 工作空间简介 |
| **`ROOT_快速加载会话.md`** | **根目录索引（每次会话看这个）** |
| `.claude/rules/` | 5 个规则文件（行为/成本/感知/会话/维护） |
| `.claude/commands/` | 斜杠命令（dispatch/parallel/code-review/...） |
| `.claude/agents/` | 3 个子代理定义 |
| `.claude/skills/left-brain/` | 左脑记忆系统（知识库/脚本/图谱） |
| `scripts/orchestrator/` | 智能调度模块（4 工具 + 2 钩子 + 2 命令） |
| `scripts/会话快照/` | 快照系统（save/load/backup-history） |
| `AI-【0】-AI规则与范式/Claude工程实践操作手册.md` | 完整操作指南（用法+示例+FAQ） |
| `AI-【0】-AI规则与范式/` | SDD 范式 + 操作手册 |

---

## 十一、用户使用常用说明（速查）

> 这是**给你（操作员）**看的，不是给 AI 看的。直接复制命令用。

### 📌 智能调度（自动派 Agent）

```bash
# 方式 1：直接提问（钩子自动判断）
"排查订单 BUG"

# 方式 2：手动派发
/dispatch 排查订单 BUG

# 方式 3：强制派 3 个
/parallel 3 全面排查
```

### 📌 快照备份

```bash
# 结束会话前（必做）
node scripts/会话快照/save.js "本次任务标题" "中文标签"

# 重要里程碑
node scripts/会话快照/backup-history.js "中文标签"

# 下次会话加载
cat ROOT_快速加载会话.md
```

### 📌 左脑记忆

```bash
# 手动记忆
bash .claude/skills/left-brain/scripts/left-brain.sh remember "事实"

# 搜索
bash .claude/skills/left-brain/scripts/left-brain.sh recall "关键词"

# 状态
bash .claude/skills/left-brain/scripts/left-brain.sh dashboard
```

### 📌 调试智能调度

```bash
# 跑 12 个测试
node scripts/orchestrator/test-dispatcher.js

# 看决策日志
node scripts/orchestrator/token-monitor.js stats

# 钩子测试
echo '{"tool_name":"UserPromptSubmit","tool_input":{"prompt":"排查 BUG"}}' | node scripts/orchestrator/hooks/dispatch-decision.js
```

### 📌 切换任务前必做

1. 跑快照（上面命令）
2. 加备注到 ROOT_快速加载会话.md
3. `/clear` 重置 session
4. 开始新任务

### 📌 出问题怎么办

| 问题 | 看这个文档 |
|:-----|:----------|
| 不会用智能调度 | `scripts/orchestrator/文档/使用文档.md` |
| 钩子不工作 | `scripts/orchestrator/文档/重启指南.md` |
| 权限弹窗太多 | `scripts/orchestrator/文档/权限设置指南.md` |
| 不知道上版本特性 | `scripts/orchestrator/文档/每日总结-20260622.md` |
| 想看 v1.2 改进 | `scripts/orchestrator/文档/v1.2-改进清单.md` |
| 重启后怎么接上 | `ROOT_快速加载会话.md`（根目录） |

---

_最后更新：2026-06-22 · 含智能调度 v1.2.0 + 快照系统 v1.1 + 三级检查点 v1.3 + Worktree P0 实测（提速 36%）+ 中文化命名 + 28 项测试全过_