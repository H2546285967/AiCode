# Agent Reach — 详细说明文档

> **版本**: v1.5.0  
> **项目地址**: https://github.com/Panniantong/Agent-Reach  
> **本地安装路径**: `~/.agent-reach-venv/`  
> **配置目录**: `~/.agent-reach/`  
> **文档生成日期**: 2026-06-15

---

## 一、Agent Reach 是什么

Agent Reach 是一个 **AI Agent 互联网能力路由工具**。它不是内容抓取库，而是一个**选择器、安装器、健康检查器和路由器**——负责安装和管理一系列上游工具，让 AI Agent 拥有访问整个互联网的能力。

核心理念：安装完成后，Agent Reach 本身不再做包装，而是让 Agent **直接使用上游工具**（OpenCLI、twitter-cli、bili-cli、rdt-cli、yt-dlp、mcporter、gh CLI 等）。

---

## 二、支持的 13 个平台

### 2.1 免配置渠道（装好即用）

| 平台 | 用途 | 底层工具 | 备注 |
|------|------|---------|------|
| 🌐 **任意网页** | 读取任意 URL 内容 | Jina Reader (`curl https://r.jina.ai/URL`) | 零配置 |
| 📰 **RSS/Atom** | 读取订阅源 | feedparser (Python 内置) | 零配置 |
| 📺 **YouTube** | 视频信息、字幕提取 | yt-dlp | 需配置 JS runtime |
| 📺 **B站** | 搜索视频 | B站搜索 API (curl 直连) | 完整功能需装 bili-cli |
| 🌐 **V2EX** | 节点、主题、回复 | V2EX API | 可能需要代理 |
| 💻 **GitHub** | 仓库、代码搜索 | gh CLI | 需单独安装 gh CLI |

### 2.2 可选渠道（需额外安装/配置）

| 平台 | 用途 | 后端选择 | 配置要求 |
|------|------|---------|---------|
| 🐦 **Twitter/X** | 搜推文、看时间线 | twitter-cli / OpenCLI | 需登录 Cookie |
| 📕 **小红书** | 搜索、阅读笔记 | OpenCLI(桌面) / xiaohongshu-mcp(服务器) / xhs-cli(存量) | 需登录态 |
| 📖 **Reddit** | 搜索帖子和评论 | OpenCLI(桌面) / rdt-cli(服务器) | 必须登录，无匿名路径 |
| 🎙️ **小宇宙播客** | 音频转文字 | Groq Whisper API | 需免费 Groq Key |
| 📈 **雪球** | 股票行情、社区动态 | xueqiu-cli / OpenCLI | 需登录 Cookie |
| 💼 **LinkedIn** | Profile、职位搜索 | linkedin-cli | 需登录态 |
| 🌟 **OpenCLI** | 一次安装解锁多个平台 | Chrome 扩展 + CLI | 需安装 Chrome 扩展 |
| 🔍 **全网语义搜索** | AI 语义搜索 | Exa MCP + mcporter | 需安装 mcporter |

---

## 三、安装与配置

### 3.1 安装方式

```bash
# 方式一：pipx（推荐）
pipx install https://github.com/Panniantong/agent-reach/archive/main.zip

# 方式二：venv（当前环境使用的方式）
python3 -m venv ~/.agent-reach-venv
source ~/.agent-reach-venv/bin/activate   # Linux/macOS
source ~/.agent-reach-venv/Scripts/activate  # Windows (Git Bash)
pip install https://github.com/Panniantong/agent-reach/archive/main.zip

# 安装核心基础设施
agent-reach install --env=auto
```

### 3.2 安装参数

| 参数 | 说明 |
|------|------|
| `--env={local,server,auto}` | 运行环境：本地 / 服务器 / 自动检测 |
| `--proxy http://user:pass@ip:port` | 配置网络代理（中国大陆等需要翻墙的环境） |
| `--safe` | 安全模式：不自动安装系统包，只显示需要什么 |
| `--dry-run` | 预览模式：显示将要做什么但不执行 |
| `--channels=<channels>` | 安装可选渠道，逗号分隔 |

### 3.3 安装可选渠道

```bash
# 安装指定渠道
agent-reach install --env=auto --channels=twitter,xiaohongshu

# 安装全部可选渠道
agent-reach install --env=auto --channels=all
```

支持的渠道名：`opencli`, `twitter`, `xiaoyuzhou`, `xueqiu`, `xiaohongshu`, `reddit`, `bilibili`, `linkedin`, `all`

### 3.4 配置命令

```bash
# 交互式配置向导
agent-reach setup

# 配置代理（中国大陆必须）
agent-reach configure proxy http://user:pass@ip:port

# 配置 Twitter Cookie
agent-reach configure twitter-cookies "PASTED_COOKIE_STRING"

# 配置小红书 Cookie
agent-reach configure xhs-cookies "key1=val1; key2=val2; ..."

# 配置 Groq Key（小宇宙播客转文字用）
agent-reach configure groq-key "YOUR_GROQ_KEY"

# 从浏览器自动提取所有 Cookie（支持 chrome/firefox/edge/brave/opera）
agent-reach configure --from-browser chrome
```

### 3.5 健康检查

```bash
# 检查所有渠道状态
agent-reach doctor

# JSON 格式输出（适合程序解析）
agent-reach doctor --json
```

---

## 四、日常使用（零配置命令速查）

### 4.1 网页与搜索

```bash
# 读取任意网页内容
curl -s "https://r.jina.ai/https://example.com/article"

# Exa AI 语义搜索（需安装 mcporter + Exa MCP）
mcporter call 'exa.web_search_exa(query: "your query", numResults: 5)'
```

### 4.2 视频平台

```bash
# YouTube 字幕提取
yt-dlp --write-sub --skip-download -o "/tmp/%(id)s" "YOUTUBE_URL"

# B站搜索
bili search "关键词" --type video -n 5
```

### 4.3 社交平台

```bash
# Twitter 搜索
twitter search "query" -n 10

# Reddit 搜索（需登录）
opencli reddit search "query" -f yaml   # 桌面端
rdt search "query" --limit 10            # 服务器端

# 小红书搜索（需登录）
opencli xiaohongshu search "query" -f yaml
```

### 4.4 开发者工具

```bash
# GitHub 仓库搜索
gh search repos "query" --sort stars --limit 10
```

### 4.5 社区论坛

```bash
# V2EX 热门主题
curl -s "https://www.v2ex.com/api/topics/hot.json" -H "User-Agent: agent-reach/1.0"
```

---

## 五、目录结构与文件规则

### 5.1 目录布局

| 用途 | 目录 | 示例 |
|------|------|------|
| 配置与 Token | `~/.agent-reach/` | `~/.agent-reach/config.json` |
| 上游工具仓库 | `~/.agent-reach/tools/` | `~/.agent-reach/tools/xiaoyuzhou/` |
| 临时文件 | `/tmp/` | `/tmp/yt-dlp-output/` |
| Claude Code Skill | `~/.claude/skills/agent-reach/` | SKILL.md + references/ |

### 5.2 重要规则

- **永远不要在 Agent 工作目录中创建文件**——所有文件放在 `~/.agent-reach/` 或 `/tmp/`
- **不要修改系统文件**（`~/.agent-reach/` 之外）
- **不要 `sudo`**——除非用户明确同意
- **不要安装不在本指南中的包**

---

## 六、命令完整参考

### 6.1 顶层命令

| 命令 | 说明 |
|------|------|
| `agent-reach setup` | 交互式配置向导 |
| `agent-reach install` | 一键安装（支持 `--env`, `--channels`, `--safe`, `--dry-run`, `--proxy`） |
| `agent-reach configure` | 配置特定值（支持 `--from-browser` 自动提取） |
| `agent-reach doctor` | 健康检查（支持 `--json`） |
| `agent-reach uninstall` | 卸载所有配置、Token 和 Skill 文件 |
| `agent-reach skill` | 管理 Agent Skill 注册 |
| `agent-reach format` | 清理和格式化平台 API 输出 |
| `agent-reach transcribe` | 转录音频文件（通过 Groq/OpenAI Whisper） |
| `agent-reach check-update` | 检查新版本 |
| `agent-reach watch` | 快速健康检查 + 更新检查（适合定时任务） |
| `agent-reach version` | 显示版本号 |

### 6.2 configure 子命令

| 配置项 | 说明 |
|--------|------|
| `proxy` | 网络代理地址 |
| `github-token` | GitHub Personal Access Token |
| `groq-key` | Groq API Key（播客转文字） |
| `openai-key` | OpenAI API Key |
| `twitter-cookies` | Twitter/X 登录 Cookie |
| `youtube-cookies` | YouTube 登录 Cookie |
| `xhs-cookies` | 小红书登录 Cookie |

---

## 七、中国大陆网络环境注意事项

1. **代理配置是必须的**——V2EX、Twitter、Reddit 等需要翻墙
2. **Cookie 导入优先用 Cookie-Editor**——Chrome 插件导出 Header String 最简单
3. **推荐使用小号**——Cookie 登录有封号风险，建议用非主力账号
4. **代理设置方式**：
   ```bash
   agent-reach configure proxy http://user:pass@ip:port
   ```
   设置后 Agent Reach 会自动通过环境变量 `HTTP_PROXY` / `HTTPS_PROXY` 传递给上游工具。

---

## 八、安全须知

| 风险 | 说明 | 防范 |
|------|------|------|
| 账号封禁 | 平台可能检测非浏览器 API 调用 | 使用小号/备用账号 |
| Cookie 泄露 | Cookie 等同于完整登录凭证 | 仅存在 `~/.agent-reach/`，不上传 |
| 权限滥用 | 上游工具可能请求过高权限 | `--safe` 模式 + 目录隔离 |
| 系统污染 | 在工作目录创建文件会污染项目 | 严格遵守目录规则 |

---

## 九、当前环境状态（2026-06-15）

```
✅ 可用：
  - YouTube 视频和字幕
  - RSS/Atom 订阅源
  - 任意网页 (Jina Reader)
  - B站视频搜索

⚠️ 需配置：
  - GitHub（gh CLI 未安装）
  - V2EX（SSL 证书问题，需代理）

❌ 未安装：
  - 全网语义搜索 (mcporter + Exa)
  - Twitter/X
  - 小红书
  - Reddit
  - 小宇宙播客
  - 雪球
  - LinkedIn
  - OpenCLI
```

---

## 十、与其他工具的关系

Agent Reach **不是**替代品，而是**路由器**：

```
用户请求 → Agent → agent-reach doctor（检查可用性）
                   → 选择最佳后端
                   → 调用上游工具（yt-dlp / twitter-cli / bili-cli / ...）
                   → 格式化输出
```

它与 Claude Code 的 Skill 系统集成——安装后自动注册为 Claude Code Skill，Agent 在需要互联网访问时自动触发。
