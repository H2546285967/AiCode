# Claude Code 插件清单

> 跨项目的 Claude 插件配置和安装状态追踪
> **最后更新**: 2026-06-08

---

## 已安装插件

| 序号 | 插件名称 | 核心功能 | 使用场景 |
|:----:|:---------|:---------|:---------|
| 01 | **Chrome** | 让 AI 直接操作浏览器 | 搜索资料、自动化测试 |
| 02 | **GitHub** | 代码仓库管理与协作 | 代码管理、PR协作 |
| 03 | **Computer Use** | 让 AI 拥有双手，操作电脑 | 桌面自动化操作 |
| 04 | **Build Web Apps** | 一句话生成前端网页应用 | 快速构建演示项目 |
| 05 | **Figma** | 设计稿转代码与原型设计 | UI 开发、设计还原 |
| 06 | **Documents** | AI 帮你交付正式文档 | 生成文档、报告 |
| 07 | **Presentations** | AI 帮你生成高质量 PPT | 制作演示文稿 |
| 08 | **Spreadsheets** | AI 数据分析师，处理表格更高效 | 数据分析、整理表格 |
| 09 | **HyperFrames** | HTML 直接生成视频 | 视频制作 |
| 10 | **Remotion** | 用代码生成高质量视频 | 编程生成视频 |

---

## 安装命令参考

```bash
# 格式
claude mcp add <插件名> -- npx -y @anthropic-ai/mcp-server-<插件名>

# 示例
claude mcp add chrome -- npx -y @anthropic-ai/mcp-server-chrome
claude mcp add github -- npx -y @anthropic-ai/mcp-server-github
claude mcp add computeruse -- npx -y @anthropic-ai/mcp-server-computeruse
```

---

## 二、已安装插件

### 当前状态

| 插件名称 | 功能说明 | 安装日期 | 配置状态 | 连接状态 |
|:---------|:---------|:---------|:---------|:---------|
| **chrome** | 操作浏览器 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **github** | 代码仓库管理 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **build-web-apps** | 生成网页应用 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **figma** | 设计稿转代码 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **documents** | 生成文档 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **presentations** | 生成PPT | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **spreadsheets** | 处理表格 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **hyperframes** | HTML生成视频 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |
| **remotion** | 代码生成视频 | 2026-06-08 | ✅ 已配置 | ⚠️ 待测试 |



## 三、使用场景速查

| 需求场景 | 推荐插件 | 使用示例 |
|:---------|:---------|:---------|
| 搜索技术资料 | Chrome | "帮我搜索 Spring AI 最新文档" |
| 管理代码仓库 | GitHub | "创建一个新 PR，提交这个修复" |
| 快速构建演示项目 | Build Web Apps | "用 React 创建一个 Todo 应用" |
| 生成面试文档 | Documents | "帮我整理一份 Java 面试总结文档" |
| 分析数据表格 | Spreadsheets | "分析这份面试题统计表，找出高频考点" |
| 制作演示文稿 | Presentations | "用 PPT 展示我的项目经验" |
---

## 附：完整插件列表

如需查看完整的 Claude Code 插件市场，请访问：
- 官方文档: https://docs.anthropic.com/claude-code
- 插件市场: 通过 `claude plugins` 命令查看

---

**维护者**: 韩宗辉
**最后修订**: 2026-06-08
