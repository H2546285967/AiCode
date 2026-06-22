# 项目信息

## 项目概述
- **项目类型**: AI 学习项目，主要学习 Spring AI Alibaba (SAA) 框架
- **技术栈**: Java, Spring Boot, Spring AI Alibaba, Maven
- **开发环境**: Windows 10, IntelliJ IDEA
- **API 平台**: DeepSeek V4 API（通过阿里云百炼平台）

## 项目结构
```
AI学习/
├── 1、尚硅谷AI大模型应用技术/   # 学习资料
├── 2、代码/
│   └── SpringAIAlibaba-atguiguV1/  # SAA 学习项目（多模块 Maven 项目）
│       ├── SAA-01HelloWorld
│       ├── SAA-02Ollama
│       ├── SAA-03ChatModelChatClient
│       ├── SAA-04StreamingOutput
│       ├── SAA-05Prompt
│       ├── SAA-06PromptTemplate
│       ├── SAA-07StructuredOutput
│       ├── SAA-08Persistent
│       ├── SAA-09Text2image
│       ├── SAA-10Text2voice
│       ├── SAA-11Embed2vector
│       ├── SAA-12RAG4AiOps
│       ├── SAA-13ToolCalling
│       ├── SAA-14LocalMcpServer
│       └── SAA-15LocalMcpClient
├── AI笔记_完整版.md            # 学习笔记
└── Spring AI Alibaba速通实战笔记.mmap  # 思维导图
```

## 学习模块说明
- **SAA-01~02**: 基础入门（HelloWorld、Ollama 本地模型）
- **SAA-03~04**: ChatModel 和流式输出
- **SAA-05~07**: Prompt、模板、结构化输出
- **SAA-08**: 会话持久化
- **SAA-09~10**: 多模态（图片生成、语音）
- **SAA-11~12**: 向量嵌入和 RAG
- **SAA-13**: 工具调用（Tool Calling）
- **SAA-14~15**: MCP Server/Client

---

# 行为指令（重要）

## Token 优化指令
1. **简洁回答**: 简单问题用一句话回答，不要长篇大论
2. **精准上下文**: 读取文件时只读相关文件，不要主动扫描整个项目
3. **直接给代码**: 代码问题直接给出可复制的代码片段，减少解释
4. **避免重复**: 不要重复我已经说过的内容

## 代码风格
- 使用中文注释
- 遵循 Spring Boot 和 Spring AI Alibaba 最佳实践
- 优先使用阿里云百炼平台的 API

## 回答风格
- 技术问题: 直接给代码和关键解释
- 概念问题: 用表格或简洁列表
- 调试问题: 先给解决方案，再解释原因（如果需要的话）

## 禁止行为
- 不要主动读取 pom.xml 除非明确需要
- 不要扫描 .idea 目录
- 不要在用户没有明确要求时给出"最佳实践"建议
- 不要重复已经解释过的内容
