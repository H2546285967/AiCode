# AI 素材审核 MVP Demo v2

> 面试演示版 · 投递公司：济南汇咚网络（AI 赋能营销投放全栈开发）
> 基于方案文档：[`../一、系统架构总览.md`](../一、系统架构总览.md)

---

## 🚀 30 秒启动

```bash
cd H:\AI-han\AiCode\project\audit-mvp-v2
npm install
cp .env.example .env
# 编辑 .env：填 KIMI_API_KEY（留空则走 Mock 模式）
npm start
```

打开浏览器：`http://localhost:3000`

**Mock 模式小技巧**：上传文件时文件名包含 `合规`/`违规`/其他，可分别触发 **通过 / 拒绝 / 复审** 三种结果。

---

## 🎬 演示流程（5 分钟版）

| 步骤 | 操作 | 话术 |
|:----:|------|------|
| 1 | 打开页面 | "这是基于我自己设计的'AI 素材审核系统'架构做的 MVP，用 Node.js + Kimi AI 实现。" |
| 2 | 拖入「合规测试.png」 | "支持图片和视频，视频会自动抽帧。" |
| 3 | 等待 1 秒 | "AI 在做 4 维度审核：合规性、品牌安全、内容质量、平台适配。" |
| 4 | 报告出来（92分 通过）| "总分 92，每一维度都有评分 + 具体问题 + 可执行修改建议。" |
| 5 | 切到「违规测试.png」 | "32 分直接拒绝——'最''100% 有效'都是广告法第九条明确禁止的。" |
| 6 | 切到「边界测试.png」 | "68 分触发人工复审——'顶级'用词处于合规边界。" |
| 7 | 切到历史 | "审核结果全部入库，可追溯，可接人工复审工作流。" |
| 8 | 切到代码 | "审核引擎在 `src/audit-engine.js`——Prompt 是 4 维度评分 + JSON 强制输出。" |

### 演示话术（30 秒电梯版）

> "素材审核是营销投放的第一道关，传统靠人工效率低漏判多。我设计的是'三层审核'架构：**第一层云 API 快速过滤**（毫秒级，处理明显违规），**第二层 Kimi AI 深度分析**（秒级，处理语义/品牌调性/平台适配），**第三层规则引擎综合决策**。
>
> 这个 Demo 跑通了第二层核心能力：上传素材 10 秒出结构化审核报告，包括 4 维度评分 + 可执行的修改建议。入职后我会接入腾讯云内容审核做第一层，再加 BullMQ 做异步队列和监控告警。"

---

## 🏗️ 架构图

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  拖拽上传    │───▶│  ffmpeg 抽帧 │───▶│  Kimi Vision │───▶│  4 维度审核  │
│  multer      │    │  (视频场景)   │    │  (K2/vision) │    │  + 综合判定  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                                                        │
       ▼                                                        ▼
┌──────────────┐                                         ┌──────────────┐
│  node:sqlite │◀────────────────────────────────────────│  JSON 报告   │
│  materials + │                                         │  pass/review │
│  audit_logs  │                                         │  /reject     │
└──────────────┘                                         └──────────────┘
```

## 📁 目录结构

```
audit-mvp-v2/
├── src/
│   ├── server.js          # Express 入口
│   ├── db.js              # SQLite 初始化（node:sqlite 内置）
│   ├── media.js           # ffmpeg 抽帧（可选依赖）
│   ├── audit-engine.js    # ⭐ Kimi AI 审核核心
│   └── routes/
│       ├── upload.js      # POST /api/upload
│       ├── audit.js       # POST /api/audit
│       └── materials.js   # GET  /api/materials
├── public/                # 单页 Demo UI
├── tests/smoke.js         # 5 个冒烟用例
├── uploads/               # 素材暂存（gitignore）
├── data/                  # SQLite 文件（gitignore）
├── .env.example
├── package.json
└── README.md
```

## 🔌 API 速查

| 方法 | 路径 | 用途 |
|:----:|:-----|:-----|
| GET  | `/api/health` | 健康检查 + 模式（MOCK/KIMI） |
| POST | `/api/upload` | 上传素材（multipart/form-data，字段 `file`） |
| POST | `/api/audit`  | 审核（body: `{ materialId }`） |
| GET  | `/api/materials` | 列表 |
| GET  | `/api/materials/:id` | 详情 + 审核日志 |

---

## 🛠️ Mock / Kimi 切换

`.env`：
- `USE_MOCK=true` 或 `KIMI_API_KEY=` 留空 → Mock 模式（演示推荐）
- `USE_MOCK=false` + `KIMI_API_KEY=sk-xxxx` → 真实 API

**接入真实 Kimi 步骤**：
1. 编辑 `.env`，填入 `KIMI_API_KEY=sk-xxxxx`
2. 设置 `USE_MOCK=false`
3. 重启 `npm start`
4. 上传任意图片 → 真实 AI 审核（10 秒内出报告）

---

## 🧪 测试

```bash
npm test
```

---

## 🚧 未实现（演示话术用）

| 模块 | 状态 | 演示话术 |
|:-----|:-----|:---------|
| 抖音/小红书 API 对接 | 🟡 设计已写 | "入职后第 1 周对接，需要企业资质" |
| 腾讯云内容审核（第一层） | 🟡 设计已写 | "在 `audit-engine.js` 加 1 个 `_filterLayer()` 函数即可" |
| BullMQ 异步队列 | ⏳ 未做 | "Demo 同步调用是方便演示，生产要异步" |
| 数据监控大屏 | ⏳ 未做 | "接 Prometheus + Grafana，或前端 ECharts" |
| 人工复审工作流 | ⏳ 未做 | "status='human_review' 的进复审队列" |
| 视频抽帧 | ✅ ffmpeg-static 可用 | 抽 3 帧 + 多帧综合判定 |

---

## 💡 关键设计决策

1. **为什么选 Kimi 而不是 Claude** —— 目标平台是抖音/小红书，Kimi 对中国广告法和平台社区规范的理解比 Claude 准
2. **为什么 Prompt 要 4 维度** —— 单一总分粒度太粗，运营需要知道"哪里扣分 + 怎么改"
3. **为什么 Demo 同步调用** —— 演示场景越简单越好，10 秒出结果比"异步队列实时进度条"说服力强
4. **为什么用 node:sqlite 不是 better-sqlite3** —— Node 22+ 内置，零依赖零编译；better-sqlite3 在 Windows 需要 Visual Studio 编译

---

## 🆚 v2 vs v1（audit-mvp）差异

| 项 | v1 | v2 |
|:---|:---|:---|
| SQLite | better-sqlite3（编译失败）| node:sqlite（内置）|
| ffmpeg-static | 必需依赖（卡 EBUSY）| optionalDependencies（缺失时降级）|
| 目录结构 | 完整（13 文件）| 同（13 文件）|
| 前端 | 同 | 同 + 加 Mock 模式提示 |
| `.gitkeep` | 已加 | 已加 |

**v1 现在被锁住文件，建议先删 v1 目录**（如果你觉得 v2 OK）：
```bash
rm -rf H:\AI-han\AiCode\project\audit-mvp
```