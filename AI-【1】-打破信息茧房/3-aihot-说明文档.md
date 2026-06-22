# AI HOT — 中文 AI 资讯日报 Skill

> **版本**: v0.2.0  
> **来源**: https://aihot.virxact.com  
> **Skill 地址**: `~/.claude/skills/aihot/SKILL.md`  
> **依赖**: 无（纯 curl + 公开 API，零配置）  
> **文档生成日期**: 2026-06-15

---

## 一、AI HOT 是什么

**AI HOT** 是一个 Claude Code AI Agent 技能（Skill），直接通过 curl 调用 aihot.virxact.com 的公开 REST API，获取每天的 AI 行业资讯并整理成中文 Markdown 简报。

核心特点：
- **零配置** — 不需要任何 API Key 或 MCP Server
- **零安装** — 纯 SKILL.md，无 Python 依赖
- **实时数据** — 比 AI 训练数据新得多，永远走 API 不脑补
- **中文优先** — 所有输出中文，标题/摘要均由 LLM 生成

---

## 二、5 大分类

| 分类 | API slug | 说明 |
|------|---------|------|
| 🧠 **模型发布/更新** | `ai-models` | 大模型发布、权重开源、版本更新 |
| 🚀 **产品发布/更新** | `ai-products` | AI 产品上线、功能更新 |
| 📊 **行业动态** | `industry` | 融资、收购、政策、公司战略 |
| 📄 **论文研究** | `paper` | 最新 AI 论文、技术突破 |
| 💡 **技巧与观点** | `tip` | 使用技巧、行业观点、教程 |

---

## 三、使用方式

### 3.1 在 Claude Code 中使用（推荐）

直接用自然语言提问，Skill 自动触发：

```
今天 AI 圈有什么大新闻
看一下 AI 日报
最近一周的 AI 论文
OpenAI 最近发布了什么
AI HOT 精选
看下今天的全部 AI 动态
```

### 3.2 命令行直接使用

```bash
# 设置 User-Agent（必须，否则被 403）
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0"

# 拉今日精选（默认路径）
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/items?mode=selected&take=20"

# 拉日报
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/daily"

# 拉指定日期日报
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/daily/2026-06-14"

# 按关键词搜索
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/items?q=OpenAI&take=30"

# 按分类拉
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/items?mode=selected&category=paper&take=20"
```

---

## 四、API 端点速览

| 端点 | 用途 | 主要参数 |
|------|------|---------|
| `/api/public/daily` | 最新日报 | 无 |
| `/api/public/daily/{YYYY-MM-DD}` | 指定日期日报 | path: date |
| `/api/public/dailies` | 日报归档列表 | `take` (1-180) |
| `/api/public/items` | 全部 AI 动态 | `mode` / `category` / `since` / `take` / `q` |

### 关键参数

| 参数 | 说明 |
|------|------|
| `mode=selected` | 精选条目（默认，推荐） |
| `mode=all` | 全部条目（含未精选，量大但杂） |
| `category` | 分类过滤：`ai-models` / `ai-products` / `industry` / `paper` / `tip` |
| `since` | 时间窗口，ISO 8601 格式（最多回溯 7 天） |
| `take` | 返回条数（1-100） |
| `q` | 关键词搜索（≥2 字符，在标题+摘要中匹配） |
| `cursor` | 翻页 token（不透明，原样传入） |

---

## 五、路由规则

| 用户意图 | 走的接口 |
|---------|---------|
| "今天 AI 圈有什么"、"最近 AI 圈" | `items?mode=selected&since=<24h前>` |
| "AI 日报"、"今天的日报" | `daily` |
| "全部 AI 动态"、"完整列表" | `items?mode=all` |
| "昨天的日报"、"5月6号的日报" | `daily/2026-05-06` |
| "最近的模型发布" | `items?mode=selected&category=ai-models&since=<7d前>` |
| "OpenAI 最近发的" | `items?q=OpenAI` |
| "RAG 论文" | `items?category=paper&q=RAG` |

**核心原则**：默认走精选 `mode=selected`，只有用户明确说"日报"/"全部"才切接口。

---

## 六、返回数据结构

### items 端点返回示例

```json
{
  "count": 50,
  "hasNext": true,
  "nextCursor": "eyJh...",
  "items": [
    {
      "id": "cmqfccohd008esl2a2ofz86v0",
      "title": "MiniMax 开源 M3 模型权重及 MSA 技术论文",
      "title_en": "我们开源了 MiniMax M3",
      "url": "https://mp.weixin.qq.com/s/...",
      "source": "公众号：MiniMax（稀宇科技）",
      "publishedAt": "2026-06-15T14:40:02.000Z",
      "summary": "MiniMax 上周五开源了 428B 总参数...",
      "category": "ai-models",
      "score": 76,
      "selected": true
    }
  ]
}
```

### 关键字段

| 字段 | 说明 |
|------|------|
| `title` | 中文标题（已 normalize） |
| `title_en` | 原英文标题（仅与 title 不同时存在） |
| `url` | 原文链接 |
| `source` | 来源（如 "OpenAI Blog"） |
| `publishedAt` | 发布时间（ISO 8601 UTC） |
| `summary` | 中文摘要（LLM 生成） |
| `category` | 分类 slug |
| `score` | 内容总分 0-100（越高越值得读） |
| `selected` | 是否精选 |

---

## 七、限制与注意事项

| 限制 | 说明 |
|------|------|
| **User-Agent 必须带** | API 端点拦截默认 curl UA，必须带浏览器 UA + `aihot-skill` 标识 |
| **限流 600 req/min** | 串行调用，不要并发猛拉 |
| **items since 最多 7 天** | 服务端硬上限，更早的走日报存档 |
| **take 上限 100** | 更多走 cursor 翻页 |
| **q 至少 2 字符** | 单字符退化为全表扫 |
| **日报每天 08:00 生成** | 北京时间 08:00 前查当天日报会 404 |
| **公众号不在 items 里** | 公众号爆文走 `https://aihot.virxact.com/mp` 页面 |

---

## 八、与其他 Skill 的关系

| Skill | 覆盖范围 | 数据来源 |
|-------|---------|---------|
| **AI HOT** | AI 行业资讯日报 | aihot.virxact.com（编辑精选） |
| **Agent Reach** | 国际互联网访问 | YouTube/Twitter/Reddit/GitHub 等 |
| **last30days-cn** | 中国 8 大平台研究 | 微博/小红书/B站/知乎/抖音等 |

三者互补：
- **AI HOT** → AI 行业**专业日报**（编辑精选，质量高）
- **Agent Reach** → **国际平台**实时搜索（广度）
- **last30days-cn** → **中国平台**深度研究（本土舆情）

典型组合用法：
```
用户："最近 AI 圈有什么大事"

→ 先调 AI HOT 拉精选（专业视角）
→ 再调 last30days-cn 搜微博/B站/知乎（中文舆论场）
→ 如需英文源，调 Agent Reach 搜 Twitter/Reddit
→ 综合三源输出完整简报
```

---

## 九、故障排查

| 问题 | 解决方案 |
|------|---------|
| 403 Forbidden | User-Agent 没带对，必须含 `aihot-skill/0.2.0` |
| 429 Too Many Requests | 超限流，等待后串行重试 |
| 日报 404 | 当天日报未生成（北京时间 08:00 前），改查昨天 |
| items 返回空 | 检查 since 是否过期（最多 7 天），或换 mode=selected |
| 关键词无结果 | q 至少 2 字符，检查拼写 |
