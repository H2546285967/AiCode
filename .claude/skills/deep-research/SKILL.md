# 横纵双轴深度研究（deep-research · M49）

> **核心方法论**：借鉴 [khazix/hv-analysis](https://github.com/KKKKhazix/khazix-skills) 的"双轴分析"框架。
> **作用**：让 Claude 在面对"研究一下 XX / 帮我分析 XX / 摸清楚 XX"等需求时，用系统化的方法论生成深度研究报告（不是简单的概念解释）。
> **创建日期**：2026-06-29（M49 deep-research 升级）

---

## 🎯 何时使用本 Skill

**触发词**（中文 + 英文）：
- 研究 / 帮我分析 / 摸清楚 / 摸清 / 调研 / 深度研究 / 竞品分析 / 帮我看看这个东西
- 横纵分析 / 做个 deep research / research / deep dive / analyze this

**适用对象**：
- 产品（如 Claude Code、Cursor）
- 公司（如 Anthropic、OpenAI）
- 概念（如 RAG、MCP、Agent）
- 人物（如 Sam Altman、Dario Amodei）
- 技术（如 LLM 微调、向量检索）

**不适用**：
- 简单名词解释（"X 是什么？"）
- 公众号写作（用其他 skill）
- 纯标题摘要生成

---

## 🧬 方法论：横纵双轴

### 三个分析段

1. **纵向分析（Diachronic / Longitudinal）** — 沿时间轴还原从诞生到现在的发展全貌
2. **横向分析（Synchronic / Cross-sectional）** — 以当前时间点为切面与竞品对比
3. **横纵交汇洞察** — 交叉两条轴产出新判断（不是前两段缩写版）

### 三步工作流

| 步 | 名称 | 工具 |
|:---|:-----|:-----|
| **1. 准备** | 拿研究对象 + 必要澄清 | `npm run deep-research -- analyze "对象名"` |
| **2. 收集** | 填模板（纵向时间线 + 横向竞品表）| `npm run deep-research -- template "对象名"` |
| **3. 生成** | 输出最终报告 | `npm run deep-research -- from-data data.json` |

**关键**：
- **方法论 = 双轴 + 三段 + 子场景判断**（保持）
- ❌ **砍掉**：PDF 输出（WeasyPrint 不适合工程）+ 卡兹克个人文风
- ✅ **保留**：方法论核心 + 离线纯函数 + 模板驱动

---

## 🛠 用法

```bash
# 1. 直接生成报告框架（按对象名）
npm run deep-research -- analyze "Claude Code"

# 2. 输出 JSON 结构（便于程序处理）
npm run deep-research -- analyze "Claude Code" --json

# 3. 输出空模板（用户填数据）
npm run deep-research -- template "Claude Code"

# 4. 从 JSON 数据生成报告
npm run deep-research -- from-data data.json
```

**报告框架字段**（按方法论）：

| 段 | 重点 | 字数参考 |
|:---|:-----|:--------:|
| 一、定义 | 一句话定位研究对象 | 100-300 字 |
| 二、纵向 | 5 维度：起源/诞生/演进/决策/阶段 | 6000-15000 字 |
| 三、横向 | 竞品场景 A/B/C + 4 维度对比 | 3000-10000 字 |
| 四、交汇 | 5 核心问题 + 3 剧本（最可能/最危险/最乐观）| 1500-3000 字 |
| 五、来源 | 所有引用 URL + 访问时间 | — |
| 六、方法论 | 简要说明双轴法来源 | 50-100 字 |

**全文参考**：10,000 - 30,000 字

---

## 📋 竞品场景判断（第一步）

| 场景 | 特征 | 处理 |
|:-----|:-----|:-----|
| **A** | 无直接竞品（全新品类 / 独占性极强）| 跳过逐一对比 → 分析壁垒 + 间接替代方案 |
| **B** | 少量竞品（1-2 个）| 逐一深入对比 |
| **C** | 竞品充分（3+）| 选 3-5 个代表性深入，其余简要提及 |

---

## ⚠️ 写作禁区（与 karzix 借鉴一致）

**绝对避免**：
- ❌ 套话："首先...其次...最后" / "综上所述" / "值得注意的是"
- ❌ 空洞形容词："赋能" / "抓手" / "打造闭环" / "价值洼地"
- ❌ 教科书开头："在当今 AI 快速发展的时代"
- ❌ 高频踩雷词："说白了" / "本质上" / "不可否认"
- ❌ 编造场景（搜不到的信息诚实标注「暂缺」）

**鼓励**：
- ✅ 叙事驱动（不是流水账）
- ✅ 敢下判断（每个判断有事实支撑）
- ✅ 层层剥开的修辞（现象 → 表面解释 → 更深的追问 → 核心洞察）
- ✅ 回环呼应（开头埋的细节在结尾 callback）

---

## 🔗 关联

- [`.claude/rules/sync-matrix.md`](../.claude/rules/sync-matrix.md) — 涉及 8 文档映射时查
- [`.claude/rules/special-cases.md`](../.claude/rules/special-cases.md) — 跨项目/无新事实时查
- [`.claude/rules/memory-promote.md`](../.claude/rules/memory-promote.md) — 研究产出进 KB 后再考虑毕业
- [`scripts/orchestrator/deep-research.js`](../../scripts/orchestrator/deep-research.js) — CLI 工具实现
- `04_自我演进路线.md` §0.4 M49 — 增量详情
- 上游：[github.com/KKKKhazix/khazix-skills/hv-analysis](https://github.com/KKKKhazix/khazix-skills) (MIT)
