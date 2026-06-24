---
name: autonomous-stop
description: 关闭自主模式，回到正常模式（v2.0 P0-1）
---

关闭**自主模式开关**，回到正常模式（逐步确认）。

## 用法

```bash
/autonomous-stop
```

## 效果

- Claude 重新进入"每完成一个功能 → 询问"模式
- 不再自动选下一个增量
- 关键决策点恢复询问

## 等价命令

```bash
/autonomous off       # 同义
/autonomous toggle    # 切换（如果当前是 ON 则关）
```

## 何时用

- 回到电脑前想接管
- 发现自主模式做了不想做的决定
- 想做需要确认的关键操作（push、删文件等）

## 顶部提示变化

- OFF 前：`🤖 自主模式: ON（开启于 ...）`
- OFF 后：`🙋 正常模式: OFF（逐步确认）`