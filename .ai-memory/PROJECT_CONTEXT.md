# 项目核心上下文 - Project Context

> **最后更新**: 2026-06-17  
> **适用工具**: Claude Code, 通义灵码, Cursor, GitHub Copilot 等所有AI助手  
> **同步位置**: `H:\AI-han\AiCode\.ai-memory\PROJECT_CONTEXT.md`
> **配套记忆**: L2 工具层 `.claude/memory.md` / L3 项目层 `.lingma/instructions.md`

---

## 📌 项目概览

### 工作区根目录
```
H:\AI-han\AiCode\
```

### 用户信息
- **姓名**: 韩宗辉
- **经验**: 10年Java后端开发
- **当前状态**: 求职中（济南）
- **目标岗位**: Java高级后端 + AI应用开发 + AI智能体开发

### 职业轨迹
```
中软国际(5年) → 山东高速信联(2年) → 青岛方天(1.5年) → 神州数码(半年)
```

---

## ️ 项目结构

### 核心项目目录

```
H:\AI-han\AiCode\
├── 【0】AI大模型教程（指导手册）/      # AI基础入门教程
│   └── AI大模型教程完整版.md + assets/
│
├── 【1】SpringAIAlibaba-atguiguV1/     # Spring AI Alibaba教程（18模块）
│   ├── SAA-01HelloWorld/ ~ SAA-18TodayMenu/
│   └── pom.xml
│
├── 【2】langchain4j-atguiguV5/         # LangChain4j教程（14模块）
│   ├── langchain4j-01helloworld/ ~ langchain4j-14chat-mcp/
│   └── pom.xml
│
├── 【3】工作资料/                      # 实战项目代码与文档
│   ├── code/                           # 源代码仓库
│   │   ├── 云库系统/knowledge-backend-boot/
│   │   ├── 云库系统/sheno-system/
│   │   ├── 仓颉智能体/nlp-agent/       # 后端（生产项目）
│   │   └── 仓颉智能体/nlp-frontend-web/ # 前端
│   └── 仓颉项目系统功能文档梳理/       # 项目文档（26个文件）
│
├── AI-0-打破信息茧房/                  # 新增（2026-06-15）
│
├── .claude/                            # Claude Code记忆（L2工具层）
│   └── memory.md
│
── CLAUDE.md                           # Claude Code配置
│
└── 【学习笔记与面试准备】（编号文档 0-9 + 补充）
    ├── 0、项目全景图谱.md              # 总纲：一图看懂全部情况
    ├── 1、个人现状分析与能力评估报告.md # 了解自己
    ├── 2、仓颉智能体项目—之前工作中开发维护的项目.md # 项目经验
    ├── 3、SpringAIAlibaba-完整学习总结笔记.md # 学习记录
    ├── 4、LangChain4j-完整学习总结笔记.md # 学习记录
    ├── 5、AI智能体完整学习与实施方案.md # 学习方向
    ├── 6、AI智能体—技能全景与学习路线.md # 技能地图
    ├── 7、AI智能体—面试高频问题与回答框架.md # 面试准备
    ├── 8、AI助手全局通用记忆规范.md    # 记忆系统规范
    ├── 9、工具分工与文件体系评价.md    # 工具分工记录
    └── 微服务架构-高频面试题.md        # 补充面试题（2026-06-14）
```

---

## 🎯 核心技术栈

### 仓颉智能体平台 (nlp-agent)
- **Java版本**: Java 8
- **Spring Boot**: 2.6.13
- **工作流引擎**: Camunda BPMN
- **流式输出**: SSE (Server-Sent Events)
- **数据库**: PostgreSQL + Redis
- **对象存储**: MinIO
- **向量检索**: LakeSearch / Milvus (云API)
- **大模型**: DashScope(通义千问) / OneAPI(OpenAI兼容)

### 学习项目
- **Spring AI Alibaba**: 1.0.0.2 (18模块已完成)
- **LangChain4j**: 最新版本 (12/14模块完成)
- **Java版本**: Java 21 (学习项目使用)

---

## 👤 用户在仓颉项目的真实角色

**不是架构师，而是应用层开发维护工程师**

### 具体工作内容
1. ✅ **SSE流式输出对接** - 处理过流式和下游节点冲突
2. ✅ **Camunda自定义节点开发** - 文本提取节点等
3. ✅ **节点间变量赋值** - 流程变量key-value传递
4. ✅ **NL2SQL算法接口对接** - 按文档调用+CURL定位问题
5. ✅ **LakeSearch知识库系统维护** - 数据权限+知识库CRUD
6. ✅ **对话流维护** - 会话管理+消息存储

### 技术能力评级
- ⭐⭐⭐⭐⭐ Java微服务架构（10年经验）
- ⭐⭐⭐⭐⭐ Spring Boot开发
- ⭐⭐⭐⭐ SSE流式输出（生产级）
- ⭐⭐⭐⭐ Camunda工作流开发
- ⭐⭐⭐⭐ 跨系统接口对接
- ⭐⭐⭐ 对话系统维护
- ⭐ RAG深度理解（只是调用方）
- ⭐ 向量数据库（依赖云API）
- ⭐⭐ Agent编排（只有BPMN经验）

---

## 📚 学习进度

### 已完成
- ✅ Spring AI Alibaba - 18模块全部完成（教学级demo）
- ✅ LangChain4j - 12/14模块完成（RAG和MCP待学）

### 待学习
- 🔴 RAG优化方法论（多路召回/Rerank/查询重写）
- 🔴 Agent编排模式（ReAct/Plan-and-Execute）
- ⚪ 向量数据库实操（Milvus/Qdrant）
- 🔴 模型微调（LoRA/QLoRA概念）
- ⚪ 评估体系（RAG评估/Agent评估）

---

##  面试核心叙事

```
"我有10年Java后端经验，最近半年在神州数码的仓颉智能体平台做AI应用层开发维护。
 平台覆盖知识问答、智能问数、对话流、工作流四大模块。
 我主要负责：基于Camunda BPMN做自定义工作流节点开发，
 对接大模型SSE流式输出并处理工程问题，
 对接NL2SQL算法团队接口做智能问数的应用层联调。
 同时我系统学习了Spring AI Alibaba和LangChain4j框架，
 对RAG、Agent等AI技术有实际理解。"
```

---

## 📋 下一步行动优先级

| 优先级 | 行动 | 目的 |
|:------|:-----|:-----|
| **P0** | 翻译仓颉经验成通用AI术语 | 最大的面试资产 |
| **P1** | 用Spring AI/LangChain4j重构仓颉一个模块 | 证明框架能力+生产经验兼备 |
| **P2** | 深入RAG优化（多路召回/Rerank/评估） | 面试高频必问 |
| **P3** | 学Agent编排（ReAct/Multi-Agent） | AI智能体工程师核心竞争力 |

---

##  开发环境

### VSCode工作区
- **路径**: `H:\AI-han\AiCode\`
- **AI助手**: Claude Code
- **记忆文件**: `.claude/memory.md`, `CLAUDE.md`

### IDEA项目
- **【1】SpringAIAlibaba-atguiguV1**: `H:\AI-han\AiCode\【1】SpringAIAlibaba-atguiguV1\`
- **【2】langchain4j-atguiguV5**: `H:\AI-han\AiCode\【2】langchain4j-atguiguV5\`
- **仓颉智能体后端**: `H:\AI-han\AiCode\【3】工作资料\code\仓颉智能体\nlp-agent\`
- **AI助手**: 通义灵码
- **记忆加载**: 见 `.ai-memory/README_IDEA.md`

---

## 📖 关键文档索引

| 文档 | 用途 | 位置 |
|:-----|:-----|:-----|
| 项目全景图谱 | 一图看懂全部情况 | `0、项目全景图谱.md` |
| 个人能力评估 | 了解自己，面试前复习 | `1、个人现状分析与能力评估报告.md` |
| 仓颉项目详情 | 面试讲项目时的核心参考 | `2、仓颉智能体项目—之前工作中开发维护的项目.md` |
| Spring AI笔记 | 快速回忆API | `3、SpringAIAlibaba-完整学习总结笔记.md` |
| LangChain4j笔记 | 快速回忆API | `4、LangChain4j-完整学习总结笔记.md` |
| 学习实施方案 | 指导学习方向 | `5、AI智能体完整学习与实施方案.md` |
| 技能全景图 | 可视化技术体系 | `6、AI智能体—技能全景与学习路线.md` |
| 面试问题对照 | 面试核心准备材料 | `7、AI智能体—面试高频问题与回答框架.md` |
| 记忆系统规范 | 三层记忆架构说明 | `8、AI助手全局通用记忆规范.md` |
| 工具分工评价 | 工作流设计思路记录 | `9、工具分工与文件体系评价.md` |
| 微服务面试题 | Java 基础面试补充 | `微服务架构-高频面试题.md` |

---

## 💡 给AI助手的提示

当你帮助我时，请记住：

1. **我的背景**: 10年Java后端，半年AI应用层开发经验，正在找工作
2. **我的优势**: Java工程能力强 + 有生产级智能体项目经验 + SSE/Camunda实战
3. **我的短板**: RAG理论深度不够、Agent编排不懂、框架经验demo级
4. **我的目标**: 补齐AI理论，用框架重构项目，形成完整面试叙事
5. **沟通风格**: 喜欢详细解释，重视实战案例，需要明确的行动步骤

---

**重要**: 这个文件是所有AI助手的共享记忆源，任何重要的项目信息、学习进度、决策都应该同步更新到这里。
