---
name: snap-mode
description: 📸 切换快照模式 (off|manual|milestone|auto|reset)
---

# 📸 快照模式切换（会话级）

> **作用**：在当前会话内切换快照保存行为，不改全局配置。
> **下拉补全**：输入 `/snap` 自动出现本命令与 `/snap-save`。

## 模式详解

| 模式 | Stop hook 自动 | 手动 save.js | 显式 + `--force` |
|:-----|:----------------|:--------------|:------------------|
| `off` | 不存 | 不存 | **存** |
| `manual` | 不存 | 存 | 存 |
| `milestone` | 仅含"完成/里程碑/交付"等关键词时存 | 同左 | 存 |
| `auto` | 每次都存 | 存 | 存 |

**优先级**：`.claude/session-snap-mode.json`（会话级） > `.claude/snapshot-config.json`（全局） > 默认 milestone

---

## 用法

### 1. 无参数 / `--status` / `?` / `状态` → 显示当前

```bash
node scripts/会话快照/snap-mode.js --status
```

### 2. 指定模式 → 切换

支持模式：`off` `manual` `milestone` `auto` `reset`

```bash
node scripts/会话快照/snap-mode.js off
node scripts/会话快照/snap-mode.js manual
node scripts/会话快照/snap-mode.js milestone
node scripts/会话快照/snap-mode.js auto
node scripts/会话快照/snap-mode.js reset    # 清除会话覆盖，回到全局配置
```

### 3. 智能识别用户意图

如果用户没明确说模式，根据关键词推断：

| 用户说法 | 推断模式 |
|:---------|:---------|
| "关闭快照"/"不存了"/"暂停"/"先关掉" | `off` |
| "切手动"/"我手动存"/"停止自动" | `manual` |
| "回到默认"/"恢复"/"reset"/"清掉" | `reset` |
| "每次都存"/"全自动" | `auto` |
| "里程碑才存"/"完成才存" | `milestone` |
| "/snap-mode"（无参数） | `--status` |

### 4. 切换后展示

- 当前生效模式 + 来源（session 覆盖 / 全局配置）
- 该模式的具体行为
- 如何恢复默认（`/snap-mode reset`）

### 5. 副作用

- 写入 `.claude/session-snap-mode.json`（git 已忽略，会话级）
- **不修改** `.claude/snapshot-config.json`（全局配置）
- 终端状态栏会立即反映新模式（status-line.sh）

## 配套命令

- `/snap-save "标题" "标签"` — 立即手动存一次（不受模式限制）
- `node scripts/会话快照/load.js latest` — 恢复最新快照
- 状态栏 `📸mstone` / `📌off` — 实时可见当前模式
