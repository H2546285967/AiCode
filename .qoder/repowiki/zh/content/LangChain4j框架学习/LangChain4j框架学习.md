# LangChain4j框架学习

<cite>
**本文引用的文件**
- [HelloLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/java/com/atguigu/study/HelloLangChain4JApp.java)
- [MultiModelLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-02multi-model-together/src/main/java/com/atguigu/study/MultiModelLangChain4JApp.java)
- [BootIntegrationLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-03boot-integration/src/main/java/com/atguigu/study/BootIntegrationLangChain4JApp.java)
- [LowHighApiLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-04low-high-api/src/main/java/com/atguigu/study/LowHighApiLangChain4JApp.java)
- [ModelParametersLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-05model-parameters/src/main/java/com/atguigu/study/ModelParametersLangChain4JApp.java)
- [ChatImageModelLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-06chat-image/src/main/java/com/atguigu/study/ChatImageModelLangChain4JApp.java)
- [ChatStreamLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-07chat-stream/src/main/java/com/atguigu/study/ChatStreamLangChain4JApp.java)
- [ChatMemoryLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-08chat-memory/src/main/java/com/atguigu/study/ChatMemoryLangChain4JApp.java)
- [ChatPromptLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-09chat-prompt/src/main/java/com/atguigu/study/ChatPromptLangChain4JApp.java)
- [ChatPersistenceLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-10chat-persistence/src/main/java/com/atguigu/study/ChatPersistenceLangChain4JApp.java)
- [ChatFunctioncallingLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-11chat-functioncalling/src/main/java/com/atguigu/study/ChatFunctioncallingLangChain4JApp.java)
- [ChatEmbeddingLangChain4JApp.java](file://【2】langchain4j-atguiguV5/langchain4j-12chat-embedding/src/main/java/com/atguigu/study/ChatEmbeddingLangChain4JApp.java)
- [application.properties](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/resources/application.properties)
- [pom.xml](file://【2】langchain4j-atguiguV5/pom.xml)
- [LangChain4j-完整学习总结笔记.md](file://【2】langchain4j-atguiguV5/LangChain4j-完整学习总结笔记.md)
</cite>

## 目录
1. [引言](#引言)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构总览](#架构总览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 引言
本学习指南围绕LangChain4j框架展开，基于仓库中的示例工程，系统讲解从基础聊天到多模型集成、Spring Boot集成、低层/高层API使用、模型参数配置、图像生成、流式输出、记忆与持久化、函数调用、嵌入向量化以及RAG等进阶能力。每个模块均结合具体示例文件进行原理说明与最佳实践建议，并提供性能优化与常见问题解决方案，帮助开发者高效掌握框架。

## 项目结构
LangChain4j示例工程采用按主题分模块的组织方式，每个模块对应一个独立的Spring Boot应用，便于循序渐进地学习不同特性。核心模块包括：
- hello world：基础聊天交互
- 多模型集成：在同一应用中整合多个模型
- Spring Boot集成：在Spring环境中装配LangChain4j
- 低/高层API：对比不同抽象层级的使用方式
- 模型参数：演示如何配置模型参数
- 图像生成：支持图像输入/输出的聊天
- 流式输出：实时流式响应
- 记忆：会话记忆管理
- Prompt：提示词工程
- 持久化：消息与会话持久化
- 函数调用：工具/函数调用
- 嵌入向量化：文本向量化
- RAG：检索增强生成（示例）

```mermaid
graph TB
subgraph "LangChain4j示例模块"
A["01-helloworld<br/>基础聊天"] --> B["02-multi-model<br/>多模型集成"]
B --> C["03-boot-integration<br/>Spring Boot集成"]
C --> D["04-low-high-api<br/>低/高层API"]
D --> E["05-model-parameters<br/>模型参数"]
E --> F["06-chat-image<br/>图像聊天"]
F --> G["07-chat-stream<br/>流式输出"]
G --> H["08-chat-memory<br/>记忆"]
H --> I["09-chat-prompt<br/>提示词工程"]
I --> J["10-chat-persistence<br/>持久化"]
J --> K["11-chat-functioncalling<br/>函数调用"]
K --> L["12-chat-embedding<br/>嵌入向量化"]
L --> M["13-chat-rag01<br/>RAG示例"]
M --> N["14-chat-mcp<br/>MCP工具链"]
end
```

**章节来源**
- [pom.xml:1-200](file://【2】langchain4j-atguiguV5/pom.xml#L1-L200)

## 核心组件
LangChain4j在示例工程中通过以下核心组件实现端到端的AI应用能力：
- ChatModel：负责对话生成，支持文本与图像输入
- ImageModel：负责图像生成或理解
- EmbeddingModel：负责文本向量化
- VectorStore：向量存储与检索
- Memory：会话记忆（如历史消息）
- ToolSpecifications：函数/工具定义
- PromptTemplate：提示词模板
- Stream：流式输出处理器
- Spring Boot自动装配：简化配置与注入

这些组件在各模块中以不同组合出现，形成从简单到复杂的完整能力矩阵。

**章节来源**
- [HelloLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/java/com/atguigu/study/HelloLangChain4JApp.java#L1-L200)
- [ChatFunctioncallingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-11chat-functioncalling/src/main/java/com/atguigu/study/ChatFunctioncallingLangChain4JApp.java#L1-L200)
- [ChatEmbeddingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-12chat-embedding/src/main/java/com/atguigu/study/ChatEmbeddingLangChain4JApp.java#L1-L200)

## 架构总览
LangChain4j在Spring Boot中的典型架构由三层组成：
- 表现层：Controller接收请求，调用Service
- 业务层：Service封装LangChain4j组件，编排ChatModel/EmbeddingModel等
- 配置层：Spring Boot自动装配LangChain4j组件，加载外部模型供应商

```mermaid
graph TB
Client["客户端"] --> Controller["Controller"]
Controller --> Service["Service"]
Service --> ChatModel["ChatModel"]
Service --> EmbeddingModel["EmbeddingModel"]
Service --> VectorStore["VectorStore"]
Service --> Memory["Memory"]
Service --> ToolSpecs["ToolSpecifications"]
ChatModel --> Provider["模型供应商(本地/云端)"]
EmbeddingModel --> Provider
VectorStore --> Storage["向量存储"]
```

**图表来源**
- [BootIntegrationLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-03boot-integration/src/main/java/com/atguigu/study/BootIntegrationLangChain4JApp.java#L1-L200)
- [LowHighApiLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-04low-high-api/src/main/java/com/atguigu/study/LowHighApiLangChain4JApp.java#L1-L200)

## 详细组件分析

### 基础聊天（Hello World）
- 目标：展示最简化的对话流程
- 关键点：创建ChatModel，发送用户消息，接收模型回复
- 最佳实践：合理设置系统提示词，避免上下文污染；对敏感信息做脱敏处理

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "Controller"
participant S as "Service"
participant CM as "ChatModel"
U->>C : "发送消息"
C->>S : "构建消息列表"
S->>CM : "生成回复"
CM-->>S : "返回回复"
S-->>C : "格式化结果"
C-->>U : "显示回复"
```

**图表来源**
- [HelloLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/java/com/atguigu/study/HelloLangChain4JApp.java#L1-L200)

**章节来源**
- [HelloLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/java/com/atguigu/study/HelloLangChain4JApp.java#L1-L200)
- [application.properties:1-100](file://【2】langchain4j-atguiguV5/langchain4j-01helloworld/src/main/resources/application.properties#L1-L100)

### 多模型集成
- 目标：在同一应用中使用多个模型供应商或不同类型的模型
- 关键点：通过配置切换模型；统一接口适配不同供应商
- 最佳实践：为不同场景选择合适模型；统一异常处理与降级策略

```mermaid
flowchart TD
Start(["启动应用"]) --> LoadCfg["加载多模型配置"]
LoadCfg --> SelectModel{"选择模型"}
SelectModel --> |OpenAI| UseOpenAI["使用OpenAI模型"]
SelectModel --> |Ollama| UseOllama["使用Ollama模型"]
SelectModel --> |CloudProvider| UseCloud["使用云模型"]
UseOpenAI --> Chat["执行对话"]
UseOllama --> Chat
UseCloud --> Chat
Chat --> End(["结束"])
```

**图表来源**
- [MultiModelLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-02multi-model-together/src/main/java/com/atguigu/study/MultiModelLangChain4JApp.java#L1-L200)

**章节来源**
- [MultiModelLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-02multi-model-together/src/main/java/com/atguigu/study/MultiModelLangChain4JApp.java#L1-L200)

### Spring Boot集成
- 目标：在Spring Boot中自动装配LangChain4j组件
- 关键点：通过配置文件声明模型供应商；自动注入ChatModel/EmbeddingModel
- 最佳实践：将配置集中管理；区分开发/生产环境配置

```mermaid
classDiagram
class BootIntegrationLangChain4JApp {
+启动Spring Boot应用
+自动装配LangChain4j组件
}
class ChatModel {
+生成回复()
}
class EmbeddingModel {
+生成向量()
}
BootIntegrationLangChain4JApp --> ChatModel : "自动注入"
BootIntegrationLangChain4JApp --> EmbeddingModel : "自动注入"
```

**图表来源**
- [BootIntegrationLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-03boot-integration/src/main/java/com/atguigu/study/BootIntegrationLangChain4JApp.java#L1-L200)

**章节来源**
- [BootIntegrationLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-03boot-integration/src/main/java/com/atguigu/study/BootIntegrationLangChain4JApp.java#L1-L200)

### 低层/高层API使用
- 目标：对比低层API（直接操作模型）与高层API（链式/管道）的差异
- 关键点：高层API更易组合与扩展；低层API更灵活可控
- 最佳实践：优先使用高层API简化开发；复杂场景下使用低层API微调

```mermaid
flowchart TD
A["高层API"] --> A1["链式调用"]
A --> A2["内置工具"]
B["低层API"] --> B1["直接构造消息"]
B --> B2["细粒度控制"]
A1 --> C["推荐用于常规场景"]
A2 --> C
B1 --> D["推荐用于定制场景"]
B2 --> D
```

**图表来源**
- [LowHighApiLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-04low-high-api/src/main/java/com/atguigu/study/LowHighApiLangChain4JApp.java#L1-L200)

**章节来源**
- [LowHighApiLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-04low-high-api/src/main/java/com/atguigu/study/LowHighApiLangChain4JApp.java#L1-L200)

### 模型参数配置
- 目标：演示如何配置温度、最大令牌数、topP等参数
- 关键点：参数直接影响生成质量与稳定性
- 最佳实践：根据任务类型调整参数；记录参数变更与效果对比

```mermaid
flowchart TD
Start(["开始"]) --> SetParams["设置模型参数"]
SetParams --> Validate{"参数校验"}
Validate --> |通过| Apply["应用参数"]
Validate --> |失败| Fix["修正参数"]
Fix --> Validate
Apply --> Run["运行推理"]
Run --> End(["结束"])
```

**图表来源**
- [ModelParametersLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-05model-parameters/src/main/java/com/atguigu/study/ModelParametersLangChain4JApp.java#L1-L200)

**章节来源**
- [ModelParametersLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-05model-parameters/src/main/java/com/atguigu/study/ModelParametersLangChain4JApp.java#L1-L200)

### 图像聊天
- 目标：支持图像输入的多模态对话
- 关键点：ImageModel与ChatModel协同；注意图像尺寸与格式
- 最佳实践：预处理图像；限制并发；缓存常用图像特征

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "Controller"
participant S as "Service"
participant IM as "ImageModel"
participant CM as "ChatModel"
U->>C : "上传图片+文字"
C->>S : "解析请求"
S->>IM : "图像理解"
IM-->>S : "图像描述"
S->>CM : "结合文本与图像描述生成回复"
CM-->>S : "返回回复"
S-->>C : "格式化结果"
C-->>U : "显示回复"
```

**图表来源**
- [ChatImageModelLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-06chat-image/src/main/java/com/atguigu/study/ChatImageModelLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatImageModelLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-06chat-image/src/main/java/com/atguigu/study/ChatImageModelLangChain4JApp.java#L1-L200)

### 流式输出
- 目标：实现实时流式响应，提升用户体验
- 关键点：使用回调/监听器逐段推送；处理中断与重连
- 最佳实践：设置超时与重试；前端做好缓冲与拼接

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "Controller"
participant S as "Service"
participant CM as "ChatModel"
U->>C : "发起请求"
C->>S : "开始流式处理"
loop "逐段生成"
S->>CM : "生成一段"
CM-->>S : "返回片段"
S-->>C : "推送片段"
C-->>U : "实时显示"
end
S-->>C : "完成"
C-->>U : "结束"
```

**图表来源**
- [ChatStreamLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-07chat-stream/src/main/java/com/atguigu/study/ChatStreamLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatStreamLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-07chat-stream/src/main/java/com/atguigu/study/ChatStreamLangChain4JApp.java#L1-L200)

### 记忆与持久化
- 目标：维护会话历史，实现上下文延续
- 关键点：Memory存储消息；持久化保存会话；清理过期记忆
- 最佳实践：分页与压缩；区分用户会话；定期归档

```mermaid
flowchart TD
A["接收消息"] --> B["写入Memory"]
B --> C{"是否持久化?"}
C --> |是| D["写入持久化存储"]
C --> |否| E["仅内存缓存"]
D --> F["返回回复"]
E --> F
F --> G{"是否清理旧记忆?"}
G --> |是| H["清理过期项"]
G --> |否| I["保持不变"]
```

**图表来源**
- [ChatMemoryLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-08chat-memory/src/main/java/com/atguigu/study/ChatMemoryLangChain4JApp.java#L1-L200)
- [ChatPersistenceLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-10chat-persistence/src/main/java/com/atguigu/study/ChatPersistenceLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatMemoryLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-08chat-memory/src/main/java/com/atguigu/study/ChatMemoryLangChain4JApp.java#L1-L200)
- [ChatPersistenceLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-10chat-persistence/src/main/java/com/atguigu/study/ChatPersistenceLangChain4JApp.java#L1-L200)

### 提示词工程
- 目标：通过精心设计的提示词提升模型表现
- 关键点：结构化提示词模板；动态参数注入；A/B测试
- 最佳实践：版本化提示词；监控命中率与满意度

```mermaid
flowchart TD
A["定义提示词模板"] --> B["注入动态参数"]
B --> C["构建最终提示"]
C --> D["发送给模型"]
D --> E["评估效果"]
E --> F{"是否优化?"}
F --> |是| A
F --> |否| G["上线使用"]
```

**图表来源**
- [ChatPromptLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-09chat-prompt/src/main/java/com/atguigu/study/ChatPromptLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatPromptLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-09chat-prompt/src/main/java/com/atguigu/study/ChatPromptLangChain4JApp.java#L1-L200)

### 函数调用
- 目标：让模型调用外部工具/函数，扩展能力边界
- 关键点：定义ToolSpecifications；实现工具逻辑；处理错误与回滚
- 最佳实践：最小权限原则；幂等性设计；可观测性

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "Controller"
participant S as "Service"
participant CM as "ChatModel"
participant T as "Tool"
U->>C : "提出需要工具的任务"
C->>S : "解析意图"
S->>CM : "询问是否需要工具"
CM-->>S : "返回工具调用计划"
S->>T : "执行工具"
T-->>S : "返回结果"
S->>CM : "汇总上下文"
CM-->>S : "生成自然语言回复"
S-->>C : "格式化结果"
C-->>U : "显示回复"
```

**图表来源**
- [ChatFunctioncallingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-11chat-functioncalling/src/main/java/com/atguigu/study/ChatFunctioncallingLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatFunctioncallingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-11chat-functioncalling/src/main/java/com/atguigu/study/ChatFunctioncallingLangChain4JApp.java#L1-L200)

### 嵌入向量化
- 目标：将文本转换为向量，支撑检索与相似度计算
- 关键点：选择合适的EmbeddingModel；批量处理；向量存储
- 最佳实践：向量维度与相似度阈值调优；增量更新策略

```mermaid
flowchart TD
A["输入文本"] --> B["EmbeddingModel生成向量"]
B --> C["写入向量存储"]
C --> D["查询相似向量"]
D --> E["返回匹配结果"]
```

**图表来源**
- [ChatEmbeddingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-12chat-embedding/src/main/java/com/atguigu/study/ChatEmbeddingLangChain4JApp.java#L1-L200)

**章节来源**
- [ChatEmbeddingLangChain4JApp.java:1-200](file://【2】langchain4j-atguiguV5/langchain4j-12chat-embedding/src/main/java/com/atguigu/study/ChatEmbeddingLangChain4JApp.java#L1-L200)

### RAG（检索增强生成）
- 目标：结合检索与生成，提升回答准确性
- 关键点：构建知识库；检索Top-K；拼接上下文
- 最佳实践：分块策略；去重与过滤；缓存检索结果

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "Controller"
participant S as "Service"
participant VS as "VectorStore"
participant EM as "EmbeddingModel"
participant CM as "ChatModel"
U->>C : "提问"
C->>S : "准备RAG流程"
S->>EM : "向量化查询"
EM-->>S : "查询向量"
S->>VS : "检索相似文档"
VS-->>S : "返回上下文"
S->>CM : "拼接上下文与问题"
CM-->>S : "生成答案"
S-->>C : "格式化结果"
C-->>U : "显示答案"
```

**图表来源**
- [LangChain4j-完整学习总结笔记.md:1-300](file://【2】langchain4j-atguiguV5/LangChain4j-完整学习总结笔记.md#L1-L300)

**章节来源**
- [LangChain4j-完整学习总结笔记.md:1-300](file://【2】langchain4j-atguiguV5/LangChain4j-完整学习总结笔记.md#L1-L300)

## 依赖分析
LangChain4j示例工程的依赖关系以模块化方式呈现，核心依赖集中在父pom中，各子模块按需引入。整体依赖关系如下：

```mermaid
graph TB
POM["父pom.xml"] --> M1["langchain4j-01helloworld"]
POM --> M2["langchain4j-02multi-model-together"]
POM --> M3["langchain4j-03boot-integration"]
POM --> M4["langchain4j-04low-high-api"]
POM --> M5["langchain4j-05model-parameters"]
POM --> M6["langchain4j-06chat-image"]
POM --> M7["langchain4j-07chat-stream"]
POM --> M8["langchain4j-08chat-memory"]
POM --> M9["langchain4j-09chat-prompt"]
POM --> M10["langchain4j-10chat-persistence"]
POM --> M11["langchain4j-11chat-functioncalling"]
POM --> M12["langchain4j-12chat-embedding"]
POM --> M13["langchain4j-13chat-rag01"]
POM --> M14["langchain4j-14chat-mcp"]
```

**图表来源**
- [pom.xml:1-200](file://【2】langchain4j-atguiguV5/pom.xml#L1-L200)

**章节来源**
- [pom.xml:1-200](file://【2】langchain4j-atguiguV5/pom.xml#L1-L200)

## 性能考虑
- 模型选择与参数：根据任务选择合适模型与参数，避免过度计算
- 缓存策略：对重复请求与中间结果进行缓存，减少往返
- 并发与限流：控制并发度与速率，防止下游过载
- 流式输出：优先使用流式响应，降低首字节延迟
- 向量化与检索：合理设置向量维度与相似度阈值，平衡精度与速度
- 内存与持久化：及时清理过期记忆，定期归档历史会话

## 故障排除指南
- 连接超时：检查网络与代理；增加超时时间；启用重试
- 参数错误：核对模型参数范围；使用默认参数作为基准
- 权限不足：确认API密钥与访问权限；检查白名单
- 资源耗尽：监控内存/CPU；限制并发；启用降级
- 日志与追踪：开启详细日志；统一追踪ID；聚合告警

## 结论
通过本学习指南，您已从基础聊天起步，逐步掌握了LangChain4j在多模型集成、Spring Boot集成、低/高层API、模型参数配置、图像聊天、流式输出、记忆与持久化、函数调用、嵌入向量化及RAG等领域的实践方法。建议在实际项目中结合业务场景，持续优化参数与流程，建立完善的监控与运维体系，以获得稳定且高性能的AI应用体验。

## 附录
- 示例工程路径：【2】langchain4j-atguiguV5
- 学习笔记参考：LangChain4j-完整学习总结笔记.md
- 配置文件参考：application.properties（各模块resources目录）