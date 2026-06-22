# last30days-cn — 中国平台深度研究引擎

> **版本**: v3.0.0  
> **仓库**: https://github.com/hanzonghui/last30days-skill-cn  
> **原版**: https://github.com/mvanhorn/last30days-skill  
> **作者**: Jesse ([@Jesseovo](https://github.com/Jesseovo))  
> **本地安装路径**: `~/.claude/skills/last30days/`  
> **文档生成日期**: 2026-06-15

---

## 一、last30days-cn 是什么

**last30days-cn** 是一个 Claude Code AI Agent 技能（Skill），能够自动搜索中国互联网 **8 大主流平台**最近 30 天的内容，综合分析后生成有据可查的研究报告。

核心理念：**30 天的研究，30 秒的结果。**

本项目基于 [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) 进行深度本土化改造，完全面向中国用户和中文互联网平台。

---

## 二、支持的 8 大平台

| 平台 | 模块 | 数据获取方式 | 需要配置 |
|:---:|:---:|:---:|:---:|
| 🔴 **微博** | `weibo.py` | API / 🕷️爬虫 / 公开接口 | ✅ 爬虫模式无需配置 |
| 📕 **小红书** | `xiaohongshu.py` | API / 🕷️爬虫 / 公开接口 | ✅ 爬虫模式无需配置 |
| 📺 **B站** | `bilibili.py` | 公开 API / 🕷️爬虫备用 | ✅ 无需配置 |
| 💬 **知乎** | `zhihu.py` | 公开搜索 / 🕷️爬虫备用 | ✅ 无需配置 |
| 🎵 **抖音** | `douyin.py` | API / 🕷️爬虫 / 公开接口 | ✅ 爬虫模式无需配置 |
| 💬 **微信公众号** | `wechat.py` | API | ❌ 需要 WECHAT_API_KEY |
| 🔍 **百度** | `baidu.py` | API / Bing 兜底 | ❌ 需要 BAIDU_API_KEY + SECRET |
| 📰 **今日头条** | `toutiao.py` | 公开接口 | ✅ 无需配置 |

**当前环境诊断结果**（2026-06-15）：
- ✅ 微博、小红书、B站、知乎、抖音、头条 — 免配置可用
- ✅ Playwright 爬虫引擎 — 已安装，支持浏览器自动化
- ❌ 微信、百度 — 需要 API Key

---

## 三、安装方式

### 3.1 Skill 安装（已通过 Claude Code Skill 方式安装）

```
~/.claude/skills/last30days/
├── SKILL.md              # Skill 定义文件
└── scripts/
    ├── last30days.py     # 主入口
    ├── sync.sh
    └── lib/              # 平台模块库
        ├── __init__.py
        ├── weibo.py
        ├── xiaohongshu.py
        ├── bilibili.py
        ├── zhihu.py
        ├── douyin.py
        ├── wechat.py
        ├── baidu.py
        ├── toutiao.py
        ├── dates.py      # 日期处理
        ├── dedupe.py     # 去重
        ├── normalize.py  # 数据标准化
        ├── score.py      # 排序评分
        ├── render.py     # 输出渲染
        ├── schema.py     # 数据结构
        ├── query.py      # 查询处理
        ├── query_type.py # 查询类型检测
        ├── relevance.py  # 相关性过滤
        ├── env.py        # 环境配置
        ├── http.py       # HTTP 工具
        ├── cache.py      # 缓存
        ├── crawler_bridge.py  # Playwright 爬虫桥接
        ├── entity_extract.py  # 实体提取
        ├── setup_wizard.py    # 配置向导
        └── ui.py         # UI 工具
```

### 3.2 Python 依赖

```bash
pip install jieba>=0.42.1 playwright>=1.40.0
python -m playwright install chromium
```

---

## 四、使用方式

### 4.1 在 Claude Code 中使用（推荐）

直接输入斜杠命令：

```
/last30days AI 编程助手
/last30days 最近 30 天中文平台舆情
/last30days 具身智能 --html
```

### 4.2 命令行直接使用

```bash
# 基础搜索（compact 输出）
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --emit compact

# 快速搜索
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --quick --emit compact

# 深度搜索
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --deep --emit md

# 指定平台
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --search weibo,bilibili,zhihu --emit compact

# 生成 HTML 报告
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --emit html-path

# 诊断数据源
python ~/.claude/skills/last30days/scripts/last30days.py --diagnose
```

### 4.3 命令参数

| 参数 | 说明 |
|------|------|
| `--emit MODE` | 输出模式：`compact` \| `json` \| `md` \| `html` \| `context` \| `path` \| `html-path` |
| `--quick` | 快速搜索，减少数据源，缩短超时 |
| `--deep` | 深度搜索，更多数据源，延长超时 |
| `--debug` | 启用调试日志 |
| `--days N` | 回溯天数（1-30，默认 30） |
| `--search SOURCES` | 指定搜索源（逗号分隔） |
| `--diagnose` | 显示数据源可用性诊断 |
| `--timeout SECS` | 全局超时秒数 |
| `--save-dir DIR` | 自动保存原始输出到指定目录 |

### 4.4 输出模式说明

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `compact` | 简洁 Markdown 证据 | Agent 内部综合（默认） |
| `md` | 完整 Markdown 报告 | 人类阅读、归档 |
| `html` | 完整独立 HTML 报告 | 浏览器查看、打印 |
| `html-path` | 输出 HTML 文件路径 | 生成后打开 |
| `json` | 结构化 JSON 数据 | 程序处理 |
| `context` | 可复用的上下文片段 | 多轮对话 |
| `path` | 上下文文件路径 | 文件引用 |

---

## 五、配置说明

### 5.1 配置文件位置

```
~/.config/last30days-cn/.env
```

### 5.2 可选 API Key

| 环境变量 | 平台 | 说明 |
|---------|------|------|
| `WEIBO_ACCESS_TOKEN` | 微博 | 提升稳定性，爬虫模式可免 |
| `SCRAPECREATORS_API_KEY` | 小红书 | 提升稳定性，爬虫模式可免 |
| `ZHIHU_COOKIE` | 知乎 | 提升稳定性 |
| `TIKHUB_API_KEY` | 抖音 | TikHub API |
| `DOUYIN_API_KEY` | 抖音 | 备用 |
| `WECHAT_API_KEY` | 微信公众号 | **必需**，无免费替代 |
| `BAIDU_API_KEY` | 百度 | 百度搜索 API |
| `BAIDU_SECRET_KEY` | 百度 | 百度搜索 API 密钥 |

### 5.3 交互式配置向导

```bash
python ~/.claude/skills/last30days/scripts/last30days.py setup
```

---

## 六、技术架构

### 6.1 智能降级策略

```
API 优先 → 爬虫模式 → 公开接口 → Bing 兜底
```

三级自动降级，确保在各种环境下都能获取数据。

### 6.2 Playwright 爬虫引擎

- 基于 Playwright 浏览器自动化，模拟正常用户浏览行为
- **不涉及**逆向加密算法或破解安全机制
- 支持 Cookie 持久化，减少重复登录
- 安装后微博/小红书/抖音/B站/知乎可无需 API Key 使用

### 6.3 处理流程

```
搜索请求 → 并发查询 8 大平台
         → 数据标准化 (normalize)
         → 日期过滤 (filter_by_date_range)
         → 评分排序 (score)
         → 去重 (dedupe)
         → 相关性过滤 (relevance_filter)
         → 跨平台关联 (cross_source_link)
         → 渲染输出 (render)
```

### 6.4 超时控制

| 模式 | 全局超时 | 单平台超时 |
|------|---------|-----------|
| `--quick` | 90s | 30s |
| 默认 | 180s | 60s |
| `--deep` | 300s | 90s |

---

## 七、使用示例

### 示例 1：AI 行业趋势

```bash
/last30days AI 编程助手 --emit compact
```

输出：微博、小红书、B站、知乎、抖音、头条等平台关于"AI 编程助手"最近 30 天的讨论摘要。

### 示例 2：指定平台深度搜索

```bash
/last30days 具身智能 --search weibo,xiaohongshu,bilibili --emit md
```

输出：仅从微博、小红书、B站搜索"具身智能"的完整 Markdown 报告。

### 示例 3：生成 HTML 报告

```bash
/last30days 大模型应用 --emit html-path
```

输出：生成独立 HTML 报告文件路径，可在浏览器中打开查看。

---

## 八、法律合规声明

> ⚠️ **本项目仅供学习和研究目的**

1. 所有爬虫功能仅用于技术学习与研究交流，**严禁用于商业用途**
2. 使用者必须遵守《网络安全法》《数据安全法》《个人信息保护法》
3. 爬虫模拟正常用户浏览行为，**不涉及**逆向加密或破解安全机制
4. 建议请求频率控制在合理范围内（每次搜索间隔 ≥ 5 秒）
5. 本项目开发者不承担因使用本项目而产生的任何法律责任

---

## 九、与 Agent Reach 的关系

| 工具 | 定位 | 覆盖范围 |
|------|------|---------|
| **Agent Reach** | 互联网能力路由器 | 国际平台（YouTube、Twitter、Reddit、GitHub 等）+ B站/V2EX |
| **last30days-cn** | 中国平台研究引擎 | 中国 8 大平台（微博、小红书、B站、知乎、抖音、微信、百度、头条） |

两者互补：
- Agent Reach 负责**国际互联网**访问
- last30days-cn 负责**中国互联网**深度研究
- 合在一起 = 全球 + 中国全覆盖

---

## 十、故障排查

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| 某平台返回空结果 | 运行 `--diagnose` 检查状态；尝试 `--deep` 模式 |
| Playwright 报错 | 重新安装：`python -m playwright install chromium` |
| 超时 | 使用 `--timeout 600` 延长，或 `--search` 指定单个平台 |
| 编码错误 | Windows 下自动处理 UTF-8，如仍有问题设置 `PYTHONIOENCODING=utf-8` |
| 小红书/知乎空结果 | 通常是登录态失效或验证码，爬虫模式会自动重试 |

### 诊断命令

```bash
# 检查所有数据源状态
python ~/.claude/skills/last30days/scripts/last30days.py --diagnose

# 调试模式
python ~/.claude/skills/last30days/scripts/last30days.py "主题" --debug --emit json
```
