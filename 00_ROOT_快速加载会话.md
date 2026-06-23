# 🚀 快速加载会话（ROOT_QUICK_LOAD）

> **作用**：会话结束前一键备份，会话开头一键恢复。
> **最后更新**：2026-06-23（v1.9：新增 `/snap-mode` 4 模式会话级切换）

---

## ⚡ 快速操作

```bash
# 结束会话前（一句话备份）
node scripts/会话快照/save.js "任务标题" "标签"

# 复杂任务：开干前先关，写完一个功能再开
/snap-mode off                    # 关闭自动保存
/snap-mode manual                 # 只手动 save.js
/snap-mode milestone              # 默认模式（命中完成/交付才存）
/snap-mode auto                   # 每次 Stop hook 都存
/snap-mode reset                  # 清除会话覆盖，回到全局配置

# 强制存一次（绕过模式限制）
/snap-save "标题" "标签"          # 实际 = save.js --force

# 下次会话开头（一键恢复）
node scripts/会话快照/load.js latest

# 或按关键词匹配
node scripts/会话快照/load.js v1.1
```

> 💡 **状态栏实时可见**：`📸mstone` = 全局配置 · `📌off` = 会话级覆盖

---

## 📦 最近快照

> 旧快照仍在 `.claude/snapshots/` 目录，可用 `load.js` 模糊匹配加载。

| 状态 | 时间 | 中文标签 | 标题 | 启动 |
|:-----|:-----|:---------|:-----|:-----|
| ⭐ **最新** | 2026-06-23 19:09 | milestone-snap-mode-doc-v1.9.1 | v1.9.1: snap-mode 描述精简 + 文档全量同步 | [▶ 复制](#启动-milestone-snap-mode-doc-v1-9-1) |
|                    | 2026-06-23 19:00 | auto-stop-milestone | Stop自动: v1.9 快照模式可控化：4 模式（off/manual/milestone | [▶ 复制](#启动-auto-stop-milestone) |
|                    | 2026-06-23 18:28 | auto-stop-milestone | Stop自动: v1.9 快照模式可控化：4 模式（off/manual/milestone | [▶ 复制](#启动-auto-stop-milestone) |
|                    | 2026-06-23 18:27 | milestone-snap-mode-v1.9 | v1.9: 快照模式可控化（/snap-mode + save.js milestone bug 修复 + 状态栏） | [▶ 复制](#启动-milestone-snap-mode-v1-9) |
|                    | 2026-06-23 18:18 | scen-7 | 测试manual-显式 | [▶ 复制](#启动-scen-7) |
|                    | 2026-06-23 18:18 | scen-5 | 测试auto | [▶ 复制](#启动-scen-5) |
|                    | 2026-06-23 18:18 | scen-4-done | 测试完成 | [▶ 复制](#启动-scen-4-done) |
|                    | 2026-06-23 18:18 | scen-2 | 测试off-force | [▶ 复制](#启动-scen-2) |
|                    | 2026-06-23 18:17 | plain | 测试普通 | [▶ 复制](#启动-plain) |
|                    | 2026-06-23 18:17 | scen-7 | 测试manual-显式 | [▶ 复制](#启动-scen-7) |
|                    | 2026-06-23 18:17 | scen-5 | 测试auto | [▶ 复制](#启动-scen-5) |
|                    | 2026-06-23 18:17 | scen-4-done | 测试完成 | [▶ 复制](#启动-scen-4-done) |
|                    | 2026-06-23 18:17 | scen-3 | 测试普通 | [▶ 复制](#启动-scen-3) |
|                    | 2026-06-23 18:17 | scen-2 | 测试off-force | [▶ 复制](#启动-scen-2) |
|                    | 2026-06-23 18:16 | scen-2 | 测试off-force | [▶ 复制](#启动-scen-2) |
|                    | 2026-06-23 18:15 | scen-clean | 测试 | [▶ 复制](#启动-scen-clean) |
|                    | 2026-06-23 18:14 | scen-2 | 测试off-force | [▶ 复制](#启动-scen-2) |
|                    | 2026-06-23 18:13 | verify-A | 测试1 | [▶ 复制](#启动-verify-A) |
|                    | 2026-06-23 18:12 | scenario-B | 测试off-force | [▶ 复制](#启动-scenario-B) |
|                    | 2026-06-23 18:12 | interval-check | 测试间隔0 | [▶ 复制](#启动-interval-check) |
|                    | 2026-06-23 18:11 | off-force | 测试off-force | [▶ 复制](#启动-off-force) |
|                    | 2026-06-23 18:10 | v1-测试-完成 | 测试强制 | [▶ 复制](#启动-v1-测试-完成) |
|                    | 2026-06-23 18:09 | v1-test-完成 | 测试milestone-完成 | [▶ 复制](#启动-v1-test-完成) |
|                    | 2026-06-23 18:09 | manual-test | 测试off-force | [▶ 复制](#启动-manual-test) |
|                    | 2026-06-23 17:53 | test-all4fixes | 测试：四件套修复验证 | [▶ 复制](#启动-test-all4fixes) |
|                    | 2026-06-23 17:31 | milestone,snapshot-config | 快照保存可配置化 | [▶ 复制](#启动-milestone-snapshot-config) |
|                    | 2026-06-23 13:43 | milestone-test | 测试可配置快照 | [▶ 复制](#启动-milestone-test) |
|                    | 2026-06-23 13:29 | docs-numbering | 核心文档编号完成 | [▶ 复制](#启动-docs-numbering) |
|                    | 2026-06-23 12:59 | docs | 文档合并完成 | [▶ 复制](#启动-docs) |
|                    | 2026-06-23 12:56 | docs,positioning,milestone | 文档完善：客户端 Agent 增强定位作为独立章节写入所有核心文档 | [▶ 复制](#启动-docs-positioning-milestone) |
|                    | 2026-06-23 12:36 | evolution,docs,context-optimiz | v1.8+ 文档+上下文优化：客户端 Agent 定位说明 + 新会话 token 优化 | [▶ 复制](#启动-evolution-docs-context-optimiz) |
|                    | 2026-06-23 12:17 | p0-done | v1.8 P0 清理完成 | [▶ 复制](#启动-p0-done) |
|                    | 2026-06-23 11:18 | commit | v1.8 提交完成 | [▶ 复制](#启动-commit) |
|                    | 2026-06-23 10:26 | evolution,docs,milestone | v1.8 文档同步：最佳实践+功能介绍+CLAUDE 已更新自我进化系统 | [▶ 复制](#启动-evolution-docs-milestone) |
|                    | 2026-06-23 08:06 | evolution,milestone,verified | v1.8 最终验证：自我进化系统完整可用 | [▶ 复制](#启动-evolution-milestone-verified) |
|                    | 2026-06-23 07:40 | P0-done | P0 完成：recall排序 + graph 2-hop + ROOT索引修复 | [▶ 复制](#启动-P0-done) |
|                    | 2026-06-23 05:59 | evolution,milestone,completed | v1.8 完成：自我进化系统全量实现+验证 | [▶ 复制](#启动-evolution-milestone-completed) |
|                    | 2026-06-23 04:58 | evolution,milestone | v1.8: 自我进化循环系统完成 | [▶ 复制](#启动-evolution-milestone) |
|                    | 2026-06-23 02:40 | P0-3-test | 快照索引修复测试 | [▶ 复制](#启动-P0-3-test) |
| | 2026-06-23 02:20 | 优化 | P0+P1+P2优化完成 | `node scripts/会话快照/load.js 优化` |
| | 2026-06-22 19:46 | 文档精简 | 文档瘦身：左脑 62KB→10KB + ROOT 34KB→1.8KB | `node scripts/会话快照/load.js 文档精简` |
| | 2026-06-22 18:30 | p2-8 | P2-8 评估完成：保留本地 MCP server | `node scripts/会话快照/load.js p2-8` |
| | 2026-06-22 16:00 | p3-12 | P3-12 快速开始入口完成 | `node scripts/会话快照/load.js p3-12` |
| | 2026-06-22 14:00 | p2-7 | P2-7 文档合并完成：精简版+功能介绍统一 | `node scripts/会话快照/load.js p2-7` |

---

## 🚀 快速启动命令

```
# 最新快照
node scripts/会话快照/load.js latest
```

---
### <a id="启动-milestone-snap-mode-doc-v1-9-1"></a>📦 milestone-snap-mode-doc-v1.9.1（最新）

**时间**：2026-06-23 19:09:19
**中文标签**：milestone-snap-mode-doc-v1.9.1
**快照文件**：`.claude/snapshots/2026-06-23-19-09-19-milestone-snap-mode-doc-v1.9.1.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-19-09-19-milestone-snap-mode-doc-v1.9.1.md。
标题: v1.9.1: snap-mode 描述精简 + 文档全量同步
标签: milestone-snap-mode-doc-v1.9.1

归档后 git commit
```

---

### <a id="启动-auto-stop-milestone"></a>📦 auto-stop-milestone

**时间**：2026-06-23 19:00:41
**中文标签**：auto-stop-milestone
**快照文件**：`.claude/snapshots/2026-06-23-19-00-41-auto-stop-milestone.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-19-00-41-auto-stop-milestone.md。
标题: Stop自动: v1.9 快照模式可控化：4 模式（off/manual/milestone
标签: auto-stop-milestone

<填入你想继续做的事>
```

---

### <a id="启动-auto-stop-milestone"></a>📦 auto-stop-milestone

**时间**：2026-06-23 18:28:36
**中文标签**：auto-stop-milestone
**快照文件**：`.claude/snapshots/2026-06-23-18-28-36-auto-stop-milestone.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-28-36-auto-stop-milestone.md。
标题: Stop自动: v1.9 快照模式可控化：4 模式（off/manual/milestone
标签: auto-stop-milestone

<填入你想继续做的事>
```

---

### <a id="启动-milestone-snap-mode-v1-9"></a>📦 milestone-snap-mode-v1.9

**时间**：2026-06-23 18:27:27
**中文标签**：milestone-snap-mode-v1.9
**快照文件**：`.claude/snapshots/2026-06-23-18-27-27-milestone-snap-mode-v1.9.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-27-27-milestone-snap-mode-v1.9.md。
标题: v1.9: 快照模式可控化（/snap-mode + save.js milestone bug 修复 + 状态栏）
标签: milestone-snap-mode-v1.9

继续 v1.10 任务
```

---

### <a id="启动-scen-7"></a>📦 scen-7

**时间**：2026-06-23 18:18:51
**中文标签**：scen-7
**快照文件**：`.claude/snapshots/2026-06-23-18-18-51-scen-7.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-18-51-scen-7.md。
标题: 测试manual-显式
标签: scen-7

<填入你想继续做的事>
```

---

### <a id="启动-scen-5"></a>📦 scen-5

**时间**：2026-06-23 18:18:50
**中文标签**：scen-5
**快照文件**：`.claude/snapshots/2026-06-23-18-18-50-scen-5.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-18-50-scen-5.md。
标题: 测试auto
标签: scen-5

<填入你想继续做的事>
```

---

### <a id="启动-scen-4-done"></a>📦 scen-4-done

**时间**：2026-06-23 18:18:50
**中文标签**：scen-4-done
**快照文件**：`.claude/snapshots/2026-06-23-18-18-50-scen-4-done.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-18-50-scen-4-done.md。
标题: 测试完成
标签: scen-4-done

<填入你想继续做的事>
```

---

### <a id="启动-scen-2"></a>📦 scen-2

**时间**：2026-06-23 18:18:49
**中文标签**：scen-2
**快照文件**：`.claude/snapshots/2026-06-23-18-18-49-scen-2.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-18-49-scen-2.md。
标题: 测试off-force
标签: scen-2

<填入你想继续做的事>
```

---

### <a id="启动-plain"></a>📦 plain

**时间**：2026-06-23 18:17:36
**中文标签**：plain
**快照文件**：`.claude/snapshots/2026-06-23-18-17-36-plain.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-36-plain.md。
标题: 测试普通
标签: plain

<填入你想继续做的事>
```

---

### <a id="启动-scen-7"></a>📦 scen-7

**时间**：2026-06-23 18:17:13
**中文标签**：scen-7
**快照文件**：`.claude/snapshots/2026-06-23-18-17-13-scen-7.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-13-scen-7.md。
标题: 测试manual-显式
标签: scen-7

<填入你想继续做的事>
```

---

### <a id="启动-scen-5"></a>📦 scen-5

**时间**：2026-06-23 18:17:12
**中文标签**：scen-5
**快照文件**：`.claude/snapshots/2026-06-23-18-17-12-scen-5.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-12-scen-5.md。
标题: 测试auto
标签: scen-5

<填入你想继续做的事>
```

---

### <a id="启动-scen-4-done"></a>📦 scen-4-done

**时间**：2026-06-23 18:17:11
**中文标签**：scen-4-done
**快照文件**：`.claude/snapshots/2026-06-23-18-17-11-scen-4-done.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-11-scen-4-done.md。
标题: 测试完成
标签: scen-4-done

<填入你想继续做的事>
```

---

### <a id="启动-scen-3"></a>📦 scen-3

**时间**：2026-06-23 18:17:11
**中文标签**：scen-3
**快照文件**：`.claude/snapshots/2026-06-23-18-17-11-scen-3.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-11-scen-3.md。
标题: 测试普通
标签: scen-3

<填入你想继续做的事>
```

---

### <a id="启动-scen-2"></a>📦 scen-2

**时间**：2026-06-23 18:17:10
**中文标签**：scen-2
**快照文件**：`.claude/snapshots/2026-06-23-18-17-10-scen-2.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-17-10-scen-2.md。
标题: 测试off-force
标签: scen-2

<填入你想继续做的事>
```

---

### <a id="启动-scen-2"></a>📦 scen-2

**时间**：2026-06-23 18:16:14
**中文标签**：scen-2
**快照文件**：`.claude/snapshots/2026-06-23-18-16-14-scen-2.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-16-14-scen-2.md。
标题: 测试off-force
标签: scen-2

<填入你想继续做的事>
```

---

### <a id="启动-scen-clean"></a>📦 scen-clean

**时间**：2026-06-23 18:15:33
**中文标签**：scen-clean
**快照文件**：`.claude/snapshots/2026-06-23-18-15-33-scen-clean.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-15-33-scen-clean.md。
标题: 测试
标签: scen-clean

<填入你想继续做的事>
```

---

### <a id="启动-scen-2"></a>📦 scen-2

**时间**：2026-06-23 18:14:24
**中文标签**：scen-2
**快照文件**：`.claude/snapshots/2026-06-23-18-14-24-scen-2.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-14-24-scen-2.md。
标题: 测试off-force
标签: scen-2

<填入你想继续做的事>
```

---

### <a id="启动-verify-A"></a>📦 verify-A

**时间**：2026-06-23 18:13:46
**中文标签**：verify-A
**快照文件**：`.claude/snapshots/2026-06-23-18-13-46-verify-A.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-13-46-verify-A.md。
标题: 测试1
标签: verify-A

<填入你想继续做的事>
```

---

### <a id="启动-scenario-B"></a>📦 scenario-B

**时间**：2026-06-23 18:12:39
**中文标签**：scenario-B
**快照文件**：`.claude/snapshots/2026-06-23-18-12-39-scenario-B.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-12-39-scenario-B.md。
标题: 测试off-force
标签: scenario-B

<填入你想继续做的事>
```

---

### <a id="启动-interval-check"></a>📦 interval-check

**时间**：2026-06-23 18:12:11
**中文标签**：interval-check
**快照文件**：`.claude/snapshots/2026-06-23-18-12-11-interval-check.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-12-11-interval-check.md。
标题: 测试间隔0
标签: interval-check

<填入你想继续做的事>
```

---

### <a id="启动-off-force"></a>📦 off-force

**时间**：2026-06-23 18:11:17
**中文标签**：off-force
**快照文件**：`.claude/snapshots/2026-06-23-18-11-17-off-force.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-11-17-off-force.md。
标题: 测试off-force
标签: off-force

<填入你想继续做的事>
```

---

### <a id="启动-v1-测试-完成"></a>📦 v1-测试-完成

**时间**：2026-06-23 18:10:26
**中文标签**：v1-测试-完成
**快照文件**：`.claude/snapshots/2026-06-23-18-10-26-v1-测试-完成.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-10-26-v1-测试-完成.md。
标题: 测试强制
标签: v1-测试-完成

<填入你想继续做的事>

> 💡 **三级检查点提示**：本任务完成（标签含"完成/里程碑/交付"）。可跑 `bash scripts/parallel/global-archive.sh "测试强制"` 全局归档
```

---

### <a id="启动-v1-test-完成"></a>📦 v1-test-完成

**时间**：2026-06-23 18:09:52
**中文标签**：v1-test-完成
**快照文件**：`.claude/snapshots/2026-06-23-18-09-52-v1-test-完成.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-09-52-v1-test-完成.md。
标题: 测试milestone-完成
标签: v1-test-完成

<填入你想继续做的事>

> 💡 **三级检查点提示**：本任务完成（标签含"完成/里程碑/交付"）。可跑 `bash scripts/parallel/global-archive.sh "测试milestone-完成"` 全局归档
```

---

### <a id="启动-manual-test"></a>📦 manual-test

**时间**：2026-06-23 18:09:51
**中文标签**：manual-test
**快照文件**：`.claude/snapshots/2026-06-23-18-09-51-manual-test.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-18-09-51-manual-test.md。
标题: 测试off-force
标签: manual-test

<填入你想继续做的事>
```

---


---


---


---

### <a id="启动-test-all4fixes"></a>📦 test-all4fixes

**时间**：2026-06-23 17:53:23
**中文标签**：test-all4fixes
**快照文件**：`.claude/snapshots/2026-06-23-17-53-23-test-all4fixes.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-17-53-23-test-all4fixes.md。
标题: 测试：四件套修复验证
标签: test-all4fixes

<填入你想继续做的事>
```

---

### <a id="启动-milestone-snapshot-config"></a>📦 milestone,snapshot-config

**时间**：2026-06-23 17:31:57
**中文标签**：milestone,snapshot-config
**快照文件**：`.claude/snapshots/2026-06-23-17-31-57-milestone,snapshot-config.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-17-31-57-milestone,snapshot-config.md。
标题: 快照保存可配置化
标签: milestone,snapshot-config

继续修复左脑/快照系统其他问题
```

---

### <a id="启动-milestone-test"></a>📦 milestone-test

**时间**：2026-06-23 13:43:25
**中文标签**：milestone-test
**快照文件**：`.claude/snapshots/2026-06-23-13-43-25-milestone-test.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-13-43-25-milestone-test.md。
标题: 测试可配置快照
标签: milestone-test

验证配置生效
```

---

### <a id="启动-docs-numbering"></a>📦 docs-numbering

**时间**：2026-06-23 13:29:53
**中文标签**：docs-numbering
**快照文件**：`.claude/snapshots/2026-06-23-13-29-53-docs-numbering.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-13-29-53-docs-numbering.md。
标题: 核心文档编号完成
标签: docs-numbering

5个核心文档按业务流程编号 00-04，所有引用和脚本路径已同步更新
```

---

### <a id="启动-docs"></a>📦 docs

**时间**：2026-06-23 12:59:45
**中文标签**：docs
**快照文件**：`.claude/snapshots/2026-06-23-12-59-45-docs.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-12-59-45-docs.md。
标题: 文档合并完成
标签: docs

合并下一步优化计划.md 为版本迭代计划.md，更新 .claude/memory.md 引用
```

---

### <a id="启动-docs-positioning-milestone"></a>📦 docs,positioning,milestone

**时间**：2026-06-23 12:56:22
**中文标签**：docs,positioning,milestone
**快照文件**：`.claude/snapshots/2026-06-23-12-56-22-docs,positioning,milestone.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-12-56-22-docs,positioning,milestone.md。
标题: 文档完善：客户端 Agent 增强定位作为独立章节写入所有核心文档
标签: docs,positioning,milestone

README/CLAUDE/最佳实践/功能介绍 均新增独立章节详细说明'客户端 Agent 增强 vs 大模型增强'
```

---

### <a id="启动-evolution-docs-context-optimiz"></a>📦 evolution,docs,context-optimiz

**时间**：2026-06-23 12:36:34
**中文标签**：evolution,docs,context-optimiz
**快照文件**：`.claude/snapshots/2026-06-23-12-36-34-evolution,docs,context-optimiz.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-12-36-34-evolution,docs,context-optimiz.md。
标题: v1.8+ 文档+上下文优化：客户端 Agent 定位说明 + 新会话 token 优化
标签: evolution,docs,context-optimiz

1) README/CLAUDE/最佳实践/功能介绍 增加客户端 Agent 增强定位说明 2) 新增 PROJECT-CONTEXT.md + 增强 .claudeignore 解决新会话扫描耗 token 问题
```

---

### <a id="启动-p0-done"></a>📦 p0-done

**时间**：2026-06-23 12:17:33
**中文标签**：p0-done
**快照文件**：`.claude/snapshots/2026-06-23-12-17-33-p0-done.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-12-17-33-p0-done.md。
标题: v1.8 P0 清理完成
标签: p0-done

完成 P0 全部项：提交 v1.8、推 GitHub、生成 data/github/trending.json、更新 memory.md、优化 github-scanner
```

---

### <a id="启动-commit"></a>📦 commit

**时间**：2026-06-23 11:18:12
**中文标签**：commit
**快照文件**：`.claude/snapshots/2026-06-23-11-18-12-commit.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-11-18-12-commit.md。
标题: v1.8 提交完成
标签: commit

完成 v1.8 全量提交：chore/feat/docs 三个 commit，101 测试全过
```

---

### <a id="启动-evolution-docs-milestone"></a>📦 evolution,docs,milestone

**时间**：2026-06-23 10:26:30
**中文标签**：evolution,docs,milestone
**快照文件**：`.claude/snapshots/2026-06-23-10-26-30-evolution,docs,milestone.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-10-26-30-evolution,docs,milestone.md。
标题: v1.8 文档同步：最佳实践+功能介绍+CLAUDE 已更新自我进化系统
标签: evolution,docs,milestone

自我进化系统已写入核心技术文档，下次 AI 熟悉工作空间时能重点识别此能力
```

---

### <a id="启动-evolution-milestone-verified"></a>📦 evolution,milestone,verified

**时间**：2026-06-23 08:06:46
**中文标签**：evolution,milestone,verified
**快照文件**：`.claude/snapshots/2026-06-23-08-06-46-evolution,milestone,verified.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-08-06-46-evolution,milestone,verified.md。
标题: v1.8 最终验证：自我进化系统完整可用
标签: evolution,milestone,verified

data/github 目录重建，扫描/评估数据已恢复，npm test 全过
```

---

### <a id="启动-P0-done"></a>📦 P0-done

**时间**：2026-06-23 07:40:41
**中文标签**：P0-done
**快照文件**：`.claude/snapshots/2026-06-23-07-40-41-P0-done.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-07-40-41-P0-done.md。
标题: P0 完成：recall排序 + graph 2-hop + ROOT索引修复
标签: P0-done

继续执行 P1-4：推 GitHub 获外部验证
```

---

### <a id="启动-evolution-milestone-completed"></a>📦 evolution,milestone,completed

**时间**：2026-06-23 05:59:56
**中文标签**：evolution,milestone,completed
**快照文件**：`.claude/snapshots/2026-06-23-05-59-56-evolution,milestone,completed.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-05-59-56-evolution,milestone,completed.md。
标题: v1.8 完成：自我进化系统全量实现+验证
标签: evolution,milestone,completed

M1-M5 全部完成，test-scanner 17/17，test-analyzer 24/24，npm test 全过
```

---

### <a id="启动-evolution-milestone"></a>📦 evolution,milestone

**时间**：2026-06-23 04:58:31
**中文标签**：evolution,milestone
**快照文件**：`.claude/snapshots/2026-06-23-04-58-31-evolution,milestone.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-04-58-31-evolution,milestone.md。
标题: v1.8: 自我进化循环系统完成
标签: evolution,milestone

下一步：M1-M5 全部完成，等用户选择要实现哪些候选，或根据分析报告调整关键词/权重
```

---

### <a id="启动-P0-3-test"></a>📦 P0-3-test

**时间**：2026-06-23 02:40:16
**中文标签**：P0-3-test
**快照文件**：`.claude/snapshots/2026-06-23-02-40-16-P0-3-test.md`

```
我们之前的工作已快照在 .claude/snapshots/2026-06-23-02-40-16-P0-3-test.md。
标题: 快照索引修复测试
标签: P0-3-test

验证两个锚点都正常
```

---


## 📁 快照系统文件

| 文件 | 作用 |
|:-----|:-----|
| `scripts/会话快照/save.js` | 保存快照（自动更新本文件） |
| `scripts/会话快照/load.js` | 加载快照 |
| `scripts/会话快照/backup-history.js` | 备份完整对话 |
| `.claude/snapshots/` | 所有快照存放目录 |

---

## ❓ FAQ

**Q: 快照保存太频繁？**
```bash
# 编辑配置，调整 mode / minIntervalMinutes / excludeTags
.claude/snapshot-config.json
```
- `mode: off` — 完全禁止自动保存（可 `--force` 强制）
- `mode: manual` — 只有显式调用 save.js 才保存
- `mode: milestone` — 只有完成/里程碑标签才自动保存（默认）
- `mode: auto` — 保持原有自动行为
- `minIntervalMinutes` — 两次快照最小间隔
- `excludeTags` — 包含这些关键字的标签会被跳过

**Q: 快照文件太多？**
```bash
ls .claude/snapshots/          # 查看
rm .claude/snapshots/*旧标签*   # 按标签删
```
快照目录已加入 `.gitignore`，不会进入 git 历史。

**Q: 加载后 AI 还是不理解？**
```bash
# 1. 加载快照
node scripts/会话快照/load.js latest
# 2. 加载左脑会话摘要
bash .claude/skills/left-brain/scripts/session-summary.sh load
# 3. 查相关知识
bash .claude/skills/left-brain/scripts/left-brain.sh recall "关键词"
```
