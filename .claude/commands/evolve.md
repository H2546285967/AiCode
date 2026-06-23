---
description: 自我进化系统 - 扫描GitHub爆款Claude项目，分析可行性，自动实现
---

# 🧬 自我进化系统

根据用户指令执行对应操作：

## 子命令

### scan — 扫描 GitHub
```bash
node scripts/evolution/daily-evolution.js scan
```
从 GitHub Trending + Search API 抓取 Claude 相关热门项目。

### analyze — 分析候选
```bash
node scripts/evolution/daily-evolution.js analyze
```
评估候选项目的可行性（实用性/可行性/独立性/风险度/新鲜度）。

### run — 完整流程
```bash
node scripts/evolution/daily-evolution.js run
```
扫描 + 分析 + 输出进化建议。

### candidates — 查看候选
```bash
node scripts/evolution/daily-evolution.js candidates
```
查看当前评估后的候选列表。

### implement — 实现特性
```bash
node scripts/evolution/daily-evolution.js implement <n>
```
实现第 n 个候选（创建分支 → 生成 prompt → 等待 Claude 实现）。

### status — 实现状态
```bash
node scripts/evolution/daily-evolution.js status
```
查看已实现特性和进化记录。

### log — 进化历史
```bash
node scripts/evolution/daily-evolution.js log
```
查看历史进化记录。

### watch — 持续感知
```bash
node scripts/evolution/daily-evolution.js watch
```
自动判断执行哪一层感知（每日/每周/月度），检查已实现特性是否过时。

### report — 趋势报告
```bash
node scripts/evolution/daily-evolution.js report
```
生成进化趋势报告。

## 执行步骤

1. 解析用户输入的子命令（默认 run）
2. 执行对应的命令
3. 如果是 scan/run，展示候选列表
4. 如果用户选择了某个候选，分析如何实现
5. 实现时创建分支 → 写代码 → 测试 → 审查

## 自动化

建议在 SessionStart hook 中添加：
```bash
node scripts/evolution/daily-evolution.js watch
```
每次会话启动时自动检查已实现特性是否过时。
