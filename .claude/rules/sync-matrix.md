# 🗺️ 变更影响矩阵（Sync-Matrix）

> **作用**：遇到不确定"这次改动要同步哪些文件"时查这张表。**两个方向都要查**：补漏（加到哪些文件）+ 防膨胀（应该从哪些文件删）。
> **来源**：neat-freak `references/sync-matrix.md` + AiCode 8 文档体系适配
> **创建日期**：2026-06-29（M48-B neat-freak 完整借鉴）

---

## 🚦 反向：哪些信息该从 CLAUDE.md / 记忆里删除

CLAUDE.md / AGENTS.md **不是变更日志**。下面这些反模式发现了就删 / 迁：

| 反模式 | 处理 |
|:------|:-----|
| "X 时刻起 Y 功能上线，详见 docs/Z.md" 形式的 blockquote | 删除——指针角色已被 8 文档同步表占用，叙事归 git log / CHANGELOG / docs/CHANGES.md |
| 在 CLAUDE.md 里抄 `02.md` 已有的详细机制 / 数据流 / 评分公式 | 删除——AI 改到这块自然会读 02.md，CLAUDE.md 只留"边界规则" |
| 已经稳定 ≥ 7 天的"新功能上线"叙事 | 该融入项目概览的融入；纯历史的删 |
| 一次性事故的复盘细节（"X 时 Y 服务挂了 30min 因为 Z"）| 留 1 行红线规则（"不要裸跑 systemctl stop X"），事故详情归 docs/PLAYBOOK.md 或删 |
| 已被新版本取代的"中间态"叙事（"5/6 改了 X，5/8 又改成 Y"）| 只留最终态规则；中间历史删 |
| 单条 memory > 100 行 + 全是事故复盘 | 提炼成一条 ≤ 30 行的"规则 + Why + How to apply"；多余的删（参考 [memory-promote.md](memory-promote.md)） |
| 记忆条目里"已被 X 取代 / 已废弃 / 保留作历史"字样 | 99% 真的可以删，docs 已经是权威 |
| 顶部 200 行 blockquote 历史叙事 | 全部删，迁 CHANGELOG |

**判断标准**：这条信息**在下次 AI 写代码时如果没看到，会犯错吗？** 不会就删 / 迁。

---

## 🔼 代码层变更 → 文档层变更（AiCode 8 文档体系）

| 本次改动 | 必改文件（按受众）| 可选 |
|:---------|:-----------------|:-----|
| **新增 API / 路由** | `CLAUDE.md` 路由清单 · `01.md` §三 速查（用户最常用入口）· `02.md` §2.X 实现 · `README.md` 用法示例 | `04.md` §0.4 增量 |
| **新增 / 改名 环境变量** | `CLAUDE.md` 环境变量表 · `02.md` §2.X 配置章节 · `04.md` §十二里程碑 | — |
| **新增数据库表** | `02.md` §2.X Data Model（如果独立工程）· `CLAUDE.md` | `04.md` |
| **新增 / 改动 用户流程** | `01.md` §三 命令/速查 · `02.md` §2.X 用法 · `CHANGELOG.md` Added 段 | — |
| **新增大特性（跨多文件）** | 以上全部 + `04.md` §0.4 增量段 + `CLAUDE.md` 核心能力表 + 8 文档自检清单 | `03.md` 第四节 P0/P1 |
| **新增术语 / 改命名** | `02.md` 术语表（如果有）+ 全局搜索旧术语替换 + `01.md` 速查表 | — |
| **新增 npm script** | `package.json` · `01.md` §三 · `CLAUDE.md` 快速操作 | — |
| **修改既有命令行为** | `01.md` §三（如影响用户最常用路径）· `02.md` §2.X · `commands/<cmd>.md` 字典 | — |
| **新增子模块（A+B+C+D）** | `02.md` §2.X 章节 + `04.md` §0.4 增量段 + `CHANGELOG.md` Added 段 | `03.md` 计划表 |

**8 文档总是先看**（参考 [doc-sync.md](doc-sync.md)）：
1. README.md（GitHub 首页）
2. PROJECT-CONTEXT.md（session-init 加载）
3. 01_AI-ClaudeCode-最佳实践精简.md（用户速查）
4. 02_工作空间功能介绍.md（功能字典）
5. 04_自我演进路线.md（状态汇总）
6. 03_版本迭代计划.md（路线图）
7. CLAUDE.md（启动导航）
8. CHANGELOG.md（事实源）

---

## 🧠 记忆层变更

| 情况 | 处理方式 |
|:-----|:---------|
| 过期事实 | 改记忆文件，同时更新索引（`MEMORY.md`）的 description |
| 相对时间词（`今天 / 最近 / 昨天 / today`） | 全部转成绝对日期（`2026-04-29` 而非"今天"）|
| 重复记录（多条说同一件事）| 合并为一条，改索引（参考 [memory-promote.md](memory-promote.md) 触发 1）|
| 已完成的待办 | 删除——知识库不是历史档案 |
| 推翻的决策 | 删除旧条目，留新决策 |
| 跨会话只用一次的临时上下文 | 删除 |
| 系统机制描述 / 14 天前事件 / 反复 ≥ 3 次 | **毕业**——升 docs + 缩源（参考 [memory-promote.md](memory-promote.md)）|

---

## 🌐 跨项目影响检查（最容易漏改的场景）

- **上游 API 变了 → 下游 SDK 文档**：协议变化必须两边对齐
- **共享子域 / 路由 / 环境变量改了 → 所有 consumer 项目的 setup 文档**
- **认证中台变更 → 所有接入应用的 integration guide**
- **公共组件 / 基础设施 升级 → 各项目的 operator-runbook 提及版本号的地方**

**判断方法**：这次改的东西有没有 SDK、子域、共享配置、跨进程协议？有就要在所有依赖项目里搜一遍提到这件事的文档。

> **AiCode 特殊场景**：本工程是个人工程，无下游 SDK。但 `scripts/orchestrator/` 改接口会波及其他脚本 → 必跑 `npm test`。

---

## 📋 文档结构通用约定

新增一个能力（API / flow / feature）的标准动作是**至少四处都补**：

1. **`01.md` §三 / 用户速查主表**：一句 + 一行命令（用户最常查）
2. **`02.md` §2.X / 功能字典**：完整章节（实现 + 用法 + 测试 + 命令参数）
3. **`CLAUDE.md` 核心能力表**：极简（"这条信息下次 AI 写代码时没看到会犯错吗？"）
4. **`CHANGELOG.md` Added 段**：事实源（"改了 X + 原因 + 测试通过"）

可选附加：
5. `04.md` §0.4 增量段（如果是 M_N 级别）
6. `04.md` §十二 里程碑表（如果是完整的 Mx 级别）
7. `03.md` 第四节 P0/P1 进度表（如果是路线图核心项）
8. `.claude/commands/<cmd>.md`（如果是新增命令/参数）

**API 速查表、环境变量表、术语表**是高频查询的结构化信息，**必须保持"所见即最新"**。

---

## 🛠 自检工具

| 工具 | 作用 | 命令 |
|:-----|:-----|:-----|
| `npm run doc:check` | 跑 `test-doc-sync.js` 验证 6 文档日期一致性 | `scripts/orchestrator/test-doc-sync.js` |
| `npm run kb:promote -- --report` | 看哪些 KB 达到毕业条件 | `scripts/knowledge/promote-kb.js` |
| `npm run memory:health` | （M48-D）体检 MEMORY.md 200行/25KB | `scripts/knowledge/memory-health-check.js` |
| `npm run roadmap:sync` | 04.md 自动同步 .claude/audits + evolution-plan | `scripts/orchestrator/sync-roadmap.js` |

---

## 🔗 关联

- [`.claude/rules/doc-sync.md`](doc-sync.md) — 8 文档同步强制规则（同步这张表）
- [`.claude/rules/memory-promote.md`](memory-promote.md) — 毕业机制（记忆层治理）
- [`.claude/rules/special-cases.md`](special-cases.md) — 特殊情况（"项目无 README" 等兜底）
- [`.claude/rules/self-discipline.md`](self-discipline.md) — 5 步法（决策树主入口）
- `scripts/orchestrator/test-doc-sync.js` — 6 文档一致性兜底测试
- `04_自我演进路线.md` §0.4 M48-B — 增量详情
