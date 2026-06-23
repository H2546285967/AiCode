---
name: snap-save
description: 💾 强制存一次快照 (--force 绕过模式)
---

# 💾 强制存一次快照

> **作用**：立即保存一次会话快照，**绕过当前快照模式**（off 也能存）。
> **下拉补全**：输入 `/snap` 自动出现本命令与 `/snap-mode`。

## 用法

```bash
node scripts/会话快照/save.js "标题" "标签" --force
```

参数：
- 第一个（必填）：快照标题
- 第二个（必填）：标签。含 "完成/里程碑/交付/done/milestone/verified/completed" 在 milestone 模式下也能保存
- `-m "..."`（可选）：写入快照"恢复指令"段，下次加载直接看到继续任务
- `--force`：**强制保存，忽略当前快照模式**

## 典型场景

| 当前模式 | 想保存 | 用 |
|:---------|:-------|:----|
| `off` | 重要里程碑 | `/snap-save "标题" "milestone-X"` |
| `manual` | 任意存档点 | `/snap-save "标题" "tag"` |
| `milestone` | 标签不含关键词 | `/snap-save "标题" "tag" --force` |
| `auto` | 不影响行为（本就自动） | `/snap-save` |

## 保存后展示

```bash
node scripts/会话快照/save.js --show-mode
```

确认模式未变 + 快照落位。
