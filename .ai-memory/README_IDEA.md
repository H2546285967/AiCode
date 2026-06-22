# IDEA + 通义灵码 - 记忆加载指南

> **适用场景**: 在IDEA中打开子项目（SpringAIAlibaba-atguiguV1、langchain4j-atguiguV5、nlp-agent）时使用通义灵码  
> **最后更新**: 2026-06-08

---

## 🎯 问题说明

当你在IDEA中打开子项目时，会遇到以下问题：
1. ❌ 通义灵码无法自动读取 `H:\AI-han\AiCode\.claude\memory.md`
2. ❌ 通义灵码不认识 `CLAUDE.md` 配置
3.  IDEA的工作区根目录是子项目，不是 `H:\AI-han\AiCode\`

**解决方案**: 使用通用的 `.ai-memory/PROJECT_CONTEXT.md` 文件

---

## ✅ 方案1：手动粘贴上下文（最简单）

### 步骤1：打开 PROJECT_CONTEXT.md
在浏览器或文本编辑器中打开：
```
H:\AI-han\AiCode\.ai-memory\PROJECT_CONTEXT.md
```

### 步骤2：复制关键信息
复制以下内容（约300字）：

```
【用户背景】韩宗辉，10年Java后端，半年AI应用层开发经验，正在济南找工作
【目标岗位】Java高级后端 + AI应用开发 + AI智能体开发
【核心项目】仓颉智能体平台(nlp-agent) - 应用层开发维护
【具体工作】SSE流式输出、Camunda节点开发、NL2SQL接口对接、LakeSearch知识库维护
【学习进度】Spring AI Alibaba(18模块)、LangChain4j(12/14模块)已完成
【技术栈】Java 8/21、Spring Boot 2.6.13、Camunda BPMN、SSE、PostgreSQL、Redis
【面试叙事】"我有10年Java后端经验，最近半年在神州数码的仓颉智能体平台做AI应用层开发维护..."
【下一步】P0翻译仓颉经验 → P1框架重构 → P2 RAG深入 → P3 Agent编排
```

### 步骤3：粘贴到通义灵码对话
在通义灵码的第一次对话中，先粘贴上述信息，然后提出你的问题。

**示例对话**：
```
你：[粘贴上面的关键信息]

请帮我解释一下 SAA-03ChatModelChatClient 模块中的 ChatHelloController.java 代码

通义灵码：[基于你的背景给出针对性回答]
```

---

## ✅ 方案2：使用通义灵码自定义指令（推荐）

### 步骤1：创建 .lingma 目录
在你的IDEA项目根目录下创建 `.lingma` 文件夹：

**对于 【1】SpringAIAlibaba-atguiguV1 项目**：
```
H:\AI-han\AiCode\【1】SpringAIAlibaba-atguiguV1\.lingma\
```

**对于 【2】langchain4j-atguiguV5 项目**：
```
H:\AI-han\AiCode\【2】langchain4j-atguiguV5\.lingma\
```

**对于 仓颉智能体后端（nlp-agent）项目**：
```
H:\AI-han\AiCode\【3】工作资料\code\仓颉智能体\nlp-agent\.lingma\
```

### 步骤2：创建 instructions.md 文件
在 `.lingma` 目录下创建 `instructions.md` 文件，内容如下：

```
# 通义灵码自定义指令

## 用户背景
- 姓名：韩宗辉
- 经验：10年Java后端开发，半年AI应用层开发经验
- 当前状态：求职中（济南）
- 目标岗位：Java高级后端 + AI应用开发 + AI智能体开发

## 核心项目：仓颉智能体平台 (nlp-agent)
- 角色：应用层开发维护工程师（非架构师）
- 具体工作：
  1. SSE流式输出对接（处理过流式和下游节点冲突）
  2. Camunda自定义节点开发（文本提取节点等）
  3. NL2SQL算法接口对接（按文档调用+CURL定位问题）
  4. LakeSearch知识库系统维护（数据权限+知识库CRUD）
  5. 对话流维护（会话管理+消息存储）

## 学习进度
- Spring AI Alibaba: 18模块全部完成（教学级demo）
- LangChain4j: 12/14模块完成（RAG和MCP待学）

## 技术能力
- 强项：Java微服务⭐⭐⭐⭐⭐ | Spring Boot⭐⭐⭐⭐⭐ | SSE流式⭐⭐⭐⭐ | Camunda工作流⭐⭐⭐⭐
- 弱项：RAG深度理解⭐ | 向量数据库⭐ | Agent编排⭐⭐ | 模型微调⭐

## 沟通偏好
- 喜欢详细解释，重视实战案例
- 需要明确的行动步骤
- 希望结合我的实际项目经验给出建议

## 重要提醒
- 我是应用层开发维护，不是架构设计者
- 我有生产级项目经验，但框架学习是demo级
- 面试策略：诚实讲角色，突出具体工作，补齐理论短板
```

### 步骤3：重启IDEA或重新加载通义灵码
通义灵码会自动读取 `.lingma/instructions.md` 作为默认上下文。

---

## ✅ 方案3：创建项目级 README_AI.md（最灵活）

### 步骤1：在每个子项目根目录创建 README_AI.md

**文件位置**：
- `H:\AI-han\AiCode\【1】SpringAIAlibaba-atguiguV1\README_AI.md`
- `H:\AI-han\AiCode\【2】langchain4j-atguiguV5\README_AI.md`
- `H:\AI-han\AiCode\【3】工作资料\code\仓颉智能体\nlp-agent\README_AI.md`

### 步骤2：文件内容模板

```
# AI助手上下文 - README for AI Assistants

> 这个文件供通义灵码、GitHub Copilot等AI助手读取，了解项目背景和用户信息

## 用户信息
- **开发者**: 韩宗辉 | 10年Java后端 | 求职中（济南）
- **目标岗位**: Java高级后端 + AI应用开发 + AI智能体开发

## 项目定位
【这里填写具体项目的定位】

例如 SpringAIAlibaba-atguiguV1：
- 这是尚硅谷Spring AI Alibaba教程项目
- 包含18个模块（SAA-01 ~ SAA-18）
- 我已经全部学完，是教学级demo
- 技术栈：Java 21 + Spring Boot 3.5.5 + Spring AI 1.0.0

例如 nlp-agent：
- 这是我在神州数码工作的生产项目（仓颉智能体平台）
- 我负责应用层开发维护（非架构师）
- 具体工作：SSE流式、Camunda节点、NL2SQL对接、LakeSearch维护
- 技术栈：Java 8 + Spring Boot 2.6.13 + Camunda BPMN + SSE

## 我的优势与短板
- 优势：10年Java工程 + 生产级智能体项目经验 + SSE/Camunda实战
- 短板：RAG理论深度不够、Agent编排不懂、框架经验demo级

## 给AI助手的提示
1. 我是学习者，需要详细解释和实战案例
2. 请结合我的实际项目经验给出建议
3. 我需要明确的行动步骤和代码示例
4. 面试准备是我的重要目标，请帮助我形成完整叙事

## 相关文档
完整的项目上下文请参考：`H:\AI-han\AiCode\.ai-memory\PROJECT_CONTEXT.md`
```

### 步骤3：在通义灵码中引用
在对话开始时说：
```
请先阅读当前项目的 README_AI.md 文件，了解我的背景和项目情况
```

---

## 🎨 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|:-----|:-----|:-----|:------|
| **方案1：手动粘贴** | 最简单，无需配置 | 每次都要复制粘贴 | ⭐⭐⭐ |
| **方案2：自定义指令** | 一次配置，永久生效 | 需要为每个项目单独配置 | ⭐⭐⭐⭐⭐ |
| **方案3：README_AI.md** | 灵活，可定制 | 需要手动引用 | ⭐⭐⭐⭐ |

**推荐使用方案2 + 方案3组合**：
- 方案2作为默认上下文（自动加载）
- 方案3作为补充说明（按需引用）

---

## 🔄 记忆同步机制

### 如何保持 VSCode 和 IDEA 的记忆同步？

#### 方式1：定期更新 PROJECT_CONTEXT.md
1. 在VSCode中使用Claude Code时，重要的信息会保存到 `.claude/memory.md`
2. 每周手动将关键信息复制到 `H:\AI-han\AiCode\.ai-memory\PROJECT_CONTEXT.md`
3. 在IDEA中使用时，通义灵码会读取最新的 PROJECT_CONTEXT.md

#### 方式2：使用 create_memory 工具（数据库级记忆）
- 重要信息使用 `create_memory` 工具保存到数据库
- 这个记忆是跨IDE共享的（因为存储在云端）
- 适合保存：用户偏好、项目配置、经验教训

#### 方式3：建立更新习惯
每次完成重要学习或做出关键决策后：
1. 在VSCode中说："请更新记忆"
2. Claude Code会更新 `.claude/memory.md`
3. 你手动将关键信息复制到 `PROJECT_CONTEXT.md`
4. 下次在IDEA中使用通义灵码时，就能看到最新信息

---

## 💡 最佳实践

### 1. 首次使用通义灵码时的标准开场白

```
你好！我是韩宗辉，10年Java后端开发，正在学习AI智能体开发并准备面试。

【我的背景】
- 工作经验：10年Java后端（中软国际→山东高速信联→青岛方天→神州数码）
- AI经验：半年仓智能体平台应用层开发维护（SSE流式、Camunda节点、NL2SQL对接）
- 学习进度：Spring AI Alibaba(18模块)、LangChain4j(12/14模块)已完成
- 当前状态：求职中（济南），目标岗位是Java高级后端 + AI应用开发

【当前项目】
我正在查看 [项目名称]，这是一个 [项目描述]

【我的需求】
[具体问题或需求]

请结合我的背景和经验，给出针对性的建议和解答。
```

### 2. 常用快捷命令

创建一个快捷文本文件 `H:\AI-han\AiCode\.ai-memory\quick_start.txt`，内容如下：

```
【快速启动模板 - 复制以下内容到通义灵码】

你好！我是韩宗辉，10年Java后端开发，正在学习AI智能体开发并准备面试。

【我的背景】
- 工作经验：10年Java后端，半年AI应用层开发（仓颉智能体平台）
- 具体工作：SSE流式输出、Camunda节点开发、NL2SQL接口对接、LakeSearch知识库维护
- 学习进度：Spring AI Alibaba(18模块)、LangChain4j(12/14模块)已完成
- 当前状态：求职中（济南），目标岗位是Java高级后端 + AI应用开发

【技术能力】
- 强项：Java微服务、Spring Boot、SSE流式、Camunda工作流、跨系统接口对接
- 弱项：RAG深度理解、向量数据库、Agent编排、模型微调

【当前项目】[项目名称]

【我的需求】[具体问题]

请结合我的背景给出针对性建议。
```

### 3. 记忆更新流程

```
graph LR
    A[VSCode + Claude Code] -->|学习/决策| B(.claude/memory.md)
    B -->|每周同步| C(PROJECT_CONTEXT.md)
    C -->|自动读取| D[IDEA + 通义灵码]
    
    E[重要信息] -->|create_memory| F[(数据库)]
    F -->|跨IDE共享| A
    F -->|跨IDE共享| D
```

---

## 📝 总结

**核心思路**：
1. ✅ 创建通用的 `PROJECT_CONTEXT.md` 作为所有AI助手的共享记忆源
2. ✅ 在IDEA项目中使用 `.lingma/instructions.md` 或 `README_AI.md` 提供上下文
3. ✅ 建立定期同步机制，保持VSCode和IDEA的记忆一致
4. ✅ 使用 `create_memory` 工具保存重要的跨IDE共享信息

**立即行动**：
1. 在IDEA中打开 【1】SpringAIAlibaba-atguiguV1 项目
2. 创建 `.lingma/instructions.md` 文件（复制上面的模板）
3. 重启IDEA，打开通义灵码
4. 开始对话，通义灵码会自动读取你的背景信息

祝你学习和面试顺利！
