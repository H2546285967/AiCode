# 📊 Evolution Metrics — 2026-06 月报

> **生成时间**：2026-06-27T01:01:59.530Z
> **数据范围**：202606（当月） + 202605（对比）
> **覆盖天数**：2 天 / 0 天（对比）
> **事件总数**：14（含 4 项指标）

---

## ⏱️ 1. 任务完成时间（task.completion_time）

> ⚠️ **本月无任务耗时数据** — dispatcher CLI / 关键路径未覆盖。
> 建议：跑 1-2 次 `node scripts/orchestrator/dispatcher.js "..."` 验证采集。

## 🔧 2. 工具成功率（tool.success_rate）

| 工具 | 成功 | 失败 | 总数 | 成功率 | 上月 | 趋势 |
|:-----|:----:|:----:|:----:|:------:|:----:|:----:|
| `proactive-scan` | 14 | 0 | 14 | **100.0%** | — | 🆕 首次记录（14） |

## 🧠 3. KB 召回命中率（kb.recall_precision）

> ⚠️ **本月无 KB 召回数据** — session-init 未触发或 Evo 未挂上。
> 建议：重启会话触发 session-init.sh。

## 👤 4. 人工干预率（human.intervention）

> ⚠️ **本月无人工干预事件** — 自主模式未开启，或 Evo.humanIntervention 未挂上。
> 注意：开启自主模式后每次 session 启动会记 1 次 session_start 基线。

## 🎯 L5 终极智能达标进度

| # | 条件 | 本月状态 |
|:-:|:-----|:---------|
| 1 | M13+M14+M15 全部 ✅ | M13 ✅ + **M15 ✅（本增量）** + M14 ⏳ |
| 2 | 失败蒸馏率 ≥ 80% | 🟡 待实测 |
| 3 | dispatcher 知识命中率 ≥ 30% | ❌ 待采集 |
| 4 | 月度 metric 报告持续 3 个月 | 🟡 **第 1 个月**（含本月，目标 3）|
| 5 | 自治覆盖率 + 人工干预率 v3.0.0 起统计有趋势 | ❌ 待采集 |

## 💡 本月行动建议

- 🔴 任务耗时未采集 — 跑 `node scripts/orchestrator/dispatcher.js "..."` 验证
- 🔴 KB 召回未采集 — 重启会话触发 session-init.sh

---

> 本报告由 M15 Evolution Metrics 自动生成（v2.0.6）
> 下次生成：下月同日（或月初 cron 触发）
