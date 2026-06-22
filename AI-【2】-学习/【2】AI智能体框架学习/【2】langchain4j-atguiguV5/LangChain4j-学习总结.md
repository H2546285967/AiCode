# LangChain4j 完整学习笔记

> **项目来源**: 尚硅谷 LangChain4j 教学项目  
> **技术栈**: Java 17 + Spring Boot 3.5.0 + LangChain4j 1.0.1  
> **API密钥**: sk-b10fab4eef52480e9ebc051687850e50

---

##  学习进度总览

✅ 已完成模块

📅 待学习模块

| 模块 | 端口 | 功能 | 状态 | 学习时间 |
|------|------|------|------|----------|
| langchain4j-01helloworld | 9001 | HelloWorld示例 | ✅ 已测试 | 2026-06-05 |
| langchain4j-02multi-model-together | 9002 | 多模型共存 | ✅ 已测试 | 2026-06-05 |
| langchain4j-03boot-integration | 9003 | Spring Boot集成 | ✅ 已测试 | 2026-06-05 |
| langchain4j-04low-high-api | 9004 | 低级API与高级API | ✅ 已测试 | 2026-06-05 |
| langchain4j-05model-parameters | 9005 | 模型参数配置 | ✅ 已测试 | 2026-06-05 |
| langchain4j-06chat-image | 9006 | 图像对话 | ✅ 已测试 | 2026-06-05 |
| langchain4j-07chat-stream | 9007 | 流式对话 | ✅ 已测试 | 2026-06-05 |
| langchain4j-08chat-memory | 9008 | 对话记忆 | ✅ 已测试 | 2026-06-05 |
| langchain4j-09chat-prompt | 9009 | Prompt提示词 | ✅ 已测试 | 2026-06-05 |
| langchain4j-10chat-persistence | 9010 | 对话持久化 | ✅ 已测试 | 2026-06-05 |
| langchain4j-11chat-functioncalling | 9011 | 函数调用 | ✅ 已测试 | 2026-06-05 |
| langchain4j-12chat-embedding | 9012 | 向量化 | ✅ 已测试 | 2026-06-05 |
| langchain4j-13chat-rag01 | - | RAG检索增强 | 📅待学习 | - |
| langchain4j-14chat-mcp | - | MCP协议 | 📅待学习 | - |

---

## 📝 笔记整理标准格式

> **说明**: 本学习笔记采用统一的标准化格式整理每个模块，确保内容完整、结构清晰、易于理解。

### 📋 标准格式结构

每个模块的学习笔记必须包含以下章节和内容：

#### 1️⃣ **模块概述**
- **端口**: 服务运行端口号
- **功能**: 模块的核心功能描述
- **核心概念**: 涉及的关键技术和概念

#### 2️⃣ **核心代码**（按调用流程顺序）

**📋 流程总览** - 文字流程图展示整体调用链
```
用户输入 → 控制器 → 服务层 → 模型调用 → 返回结果
```

**📊 完整调用流程图** - ASCII 艺术图展示详细流程
```
┌─────────────┐
│   用户请求   │
└──────┬──────┘
       ▼
┌─────────────┐
│   控制器     │
└──────┬──────┘
       ▼
┌─────────────┐
│   服务层     │
└──────┬──────┘
       ▼
┌─────────────┐
│   返回结果   │
└─────────────┘
```

**代码类说明顺序**（必须按照实际调用流程）：

1. **定义接口** - LangChain4j 高级 API 的标准做法
   - 文件路径
   - 完整代码
   - 作用说明
   - 关键点

2. **实现工具/服务** - 具体业务逻辑实现
   - 文件路径
   - 完整代码
   - 关键注解（如 @Tool、@P）
   - 作用说明
   - 关键点

3. **第三方服务**（如有）- 演示工具嵌套调用
   - 文件路径
   - 完整代码
   - 作用说明
   - 关键点

4. **配置类初始化** - Bean 配置和依赖注入
   - chatModel() - 原始 ChatModel 初始化
   - xxxService() - 高阶 AiServices 初始化：
     * 绑定接口
     * 注入模型
     * 注册工具
     * 构建代理
   - 两种 API 对比（如 Low Level vs High Level）

5. **控制器使用** - 实际调用示例
   - 文件路径
   - 完整代码
   - 注入方式
   - 调用方法
   - 内部流程详解

**配置文件和 POM 依赖**：
- application.properties/yml 配置
- pom.xml 依赖说明
- 关键点标注

#### 3️⃣ **测试接口与返回**
- 接口 URL
- 请求参数
- 返回示例（完整输出）
- 响应时间
- 控制台输出（如有）
- 流程详解（逐步说明执行过程）

#### 4️⃣ **知识点总结**
使用 ✅ 符号列出核心知识点，每个知识点包含：
- 概念名称
- 详细说明
- 使用场景
- 注意事项

#### 5️⃣ **详细讲解**

**工作流程** -  numbered list 详细步骤
```
1. 第一步
   ↓
2. 第二步
   ↓
3. 第三步
```

**形象比喻** - 用生活化场景解释技术概念
```
技术概念 = 生活中的某个事物

传统方式：
- 特点1
- 特点2

新方式：
- 特点1
- 特点2

就像...（比喻说明）
```

**代码示例对比** - 有/无某功能的对比
```java
// 方式一：传统方式
// 代码示例

// 方式二：新功能方式
// 代码示例
```

#### 6️⃣ **API 对比**（如适用）

**对比表格**：
| 对比维度 | API A | API B |
|---------|-------|-------|
| 优点 | ✅ ... | ✅ ... |
| 缺点 | ❌ ... | ❌ ... |
| 适用场景 | ... | ... |

**代码对比** - 两种 API 的完整代码示例

**选择建议** - 🎯 如何选择？
- ✅ 场景1 → 推荐 API A
- ✅ 场景2 → 推荐 API B

#### 7️⃣ **三方对比**（LangChain4j vs Spring AI vs Spring AI Alibaba）

**能力对比表格**：
| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| 特性1 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 特性2 | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |

**详细代码对比** - 三个框架的实现代码

**对比总结表格**：
| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| 维度1 | ✅ ... | ... |
| 维度2 | ... | ✅ ... |

**选择建议** - 🎯 如何选择？

#### 8️⃣ **技术要点**

分主题列出关键技术点：
- **主题1的要点**
  - 要点1
  - 要点2
  
- **主题2的要点**
  - 要点1
  - 要点2

**适用场景**：
- ✅ 场景1
- ✅ 场景2

**注意事项**：
- ⚠️ 注意1
- ⚠️ 注意2

#### 9️⃣ **常见问题**

**问题1：XXX？**
- **原因**：...
- **解决方案**：...
```java
// 代码示例
```

**问题2：YYY？**
- **方法**：...
```java
// 代码示例
```

---

### 🎯 标准要求

**必须包含的元素**：
- ✅ 流程总览（文字流程图）
- ✅ 完整调用流程图（ASCII 箭头图）
- ✅ 关键技术点表格
- ✅ 核心概念讲解（含形象比喻）
- ✅ API 对比（如 Low Level vs High Level）
- ✅ 三方对比（LangChain4j vs Spring AI vs Spring AI Alibaba）

**代码说明要求**：
- ✅ 按照实际调用流程顺序说明
- ✅ 每个类必须包含：文件路径、完整代码、作用说明、关键点
- ✅ 关键注解必须详细解释（如 @Tool、@P、@AiService）
- ✅ 配置类必须说明初始化的每个步骤

**讲解风格要求**：
- ✅ 使用形象比喻帮助理解
- ✅ 提供代码对比示例
- ✅ 详细的步骤说明
- ✅ 新手友好的详细讲解

**目的**：让读者清晰理解整个模块的工作流程和类之间的调用关系，即使初学者也能快速掌握！

---

## 📚 模块学习记录

### 模块1：langchain4j-01helloworld - HelloWorld示例

#### 1.1 模块概述
- **端口**: 9001
- **功能**: 最基本的AI对话调用，演示 LangChain4j 的基础使用
- **核心概念**: ChatModel、OpenAiChatModel、兼容模式调用阿里云模型

#### 1.2 核心代码

**📋 流程总览**：
```
用户请求 → Controller接收 → 注入ChatModel → 调用chat()方法 
→ 发送到阿里云DashScope → 接收响应 → 返回给用户
```

**📊 完整调用流程图**：
```
┌─────────────┐
│   用户请求   │ "你是谁"
└──────┬──────┘
       │ HTTP GET
       ▼
┌─────────────────────────┐
│ HelloLangChain4JCtrl    │ hello() 方法接收请求
└──────┬──────────────────┘
       │ @Resource 注入
       ▼
┌─────────────────────────┐
│    ChatModel            │ OpenAiChatModel 实例
│  (LLMConfig配置)        │
└──────┬──────────────────┘
       │ .chat(question)
       ▼
┌─────────────────────────┐
│ 阿里云 DashScope API    │ OpenAI 兼容端点
│ qwen-plus 模型          │ https://dashscope...
└──────┬──────────────────┘
       │ 返回 AI 响应
       ▼
┌─────────────────────────┐
│   返回给用户            │ "你好！我是 Qwen..."
└─────────────────────────┘
```

---

**1️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @auther zzyybs@126.com
 * @Date 2025-05-27 22:04
 * @Description: 知识出处 https://docs.langchain4j.dev/get-started
 */
@Configuration
public class LLMConfig
{
    @Bean
    public ChatModel chatModelQwen()
    {
        return OpenAiChatModel.builder()
                        .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                        .modelName("qwen-plus")
                        .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }
}
```

**作用说明**：
- **Spring 配置类** - 使用 `@Configuration` 标注，启动时自动扫描
- **创建 ChatModel Bean** - 通过 `@Bean` 注解将 ChatModel 实例放入 Spring 容器
- **OpenAiChatModel** - LangChain4j 提供的 OpenAI 兼容接口
- **Builder 模式** - 链式调用配置参数，最后 `.build()` 创建实例

**关键点**：
- ✅ **`OpenAiChatModel`** - LangChain4j 提供的 OpenAI 兼容接口
  - 可以调用任何兼容 OpenAI 协议的模型（OpenAI、Azure、阿里云DashScope、本地Ollama等）
  - 通过修改 `baseUrl` 即可切换不同的模型提供商
- ✅ **`baseUrl`** - 阿里云 DashScope 的兼容模式端点
  - `https://dashscope.aliyuncs.com/compatible-mode/v1`
  - 这是关键！通过这个端点，可以用 OpenAI 协议调用阿里云模型
- ✅ **`modelName`** - 使用 qwen-plus 模型
  - 阿里云通义千问系列模型
  - 其他可选：qwen-turbo、qwen-max 等
- ✅ **`apiKey`** - API 密钥，用于身份认证
  - 实际项目中建议从环境变量或配置文件读取
  - 避免硬编码在代码中
- ✅ **兼容模式** - 通过 OpenAI 协议调用阿里云模型，无需额外依赖
  - 一套代码可调用多个模型提供商
  - 降低厂商锁定风险

---

**2️⃣ 控制器使用：HelloLangChain4JController.java**
```java
package com.atguigu.study.controller;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.util.buf.Utf8Encoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @auther zzyybs@126.com
 * @Date 2025-05-27 21:43
 * @Description: TODO
 */
@RestController
@Slf4j
public class HelloLangChain4JController
{
    // http://localhost:9001/langchain4j/hello?question=如何学习java

    @Resource
    private ChatModel chatModel;

    @GetMapping(value = "/langchain4j/hello")
    public String hello(@RequestParam(value = "question",defaultValue = "你是谁") String question)
    {
        String result = chatModel.chat(question);

        System.out.println("调用大模型回复: "+result);

        return result;
    }

    public void test1(String question)
    {

    }
}
```

**作用说明**：
- **REST 控制器** - 使用 `@RestController` 标注，处理 HTTP 请求
- **依赖注入** - 通过 `@Resource` 注入 LLMConfig 中配置的 ChatModel
- **HTTP 接口** - `/langchain4j/hello` 接收用户问题
- **同步调用** - `chatModel.chat()` 等待完整响应后返回

**关键点**：
- ✅ **`@Resource`** - Spring 依赖注入注解
  - 自动从容器中查找 ChatModel 类型的 Bean
  - 也可以使用 `@Autowired`
- ✅ **`chatModel.chat()`** - 同步调用方式
  - 等待模型完整响应后返回
  - 返回类型为 String，简单直接
  - 适合基础问答场景
  - 缺点：用户需要等待完整响应，体验不如流式
- ✅ **`@RequestParam`** - 接收 URL 参数
  - `defaultValue = "你是谁"` - 默认问题
  - 用户可以通过 `?question=xxx` 自定义问题
- ✅ **接口路径**: `/langchain4j/hello`
  - 完整URL: `http://localhost:9001/langchain4j/hello`

---

**配置文件：application.properties**
```properties
server.port=9001

spring.application.name=langchain4j-01helloworld
```

**关键点**：
- **端口**: 9001
- **应用名称**: langchain4j-01helloworld

---

**POM依赖**：
```xml
<!-- 1️ LangChain4j OpenAI 基础依赖（类似于 MyBatis，提供原生接口） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- 2️ LangChain4j 高阶API（类似于 MyBatis-Plus，提供增强功能） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>
```

**关键点**：
- **`langchain4j-open-ai`** - 基础依赖，提供 OpenAI 兼容的原生接口（如 OpenAiChatModel）
  - 核心类：`OpenAiChatModel`、`ChatModel`
  - 功能：基础的模型调用、同步/流式对话
  - 适用场景：简单对话、快速原型
- **`langchain4j`** - 高阶依赖，提供增强的 API（如 AiServices、Memory、Tool 等高级功能）
  - 核心类：`AiServices`、`ChatMemory`、`@Tool`
  - 功能：声明式服务、对话记忆、工具调用、RAG 等
  - 适用场景：企业级应用、复杂业务
- **依赖关系**：`langchain4j` 依赖 `langchain4j-open-ai`，两者配合使用

#### 1.3 测试接口与返回

**接口1：基础对话（默认问题）**
```
http://localhost:9001/langchain4j/hello
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你：
- 回答问题
- 创作文字（写故事、写公文、写邮件、写剧本等）
- 进行逻辑推理和编程
- 表达观点、玩游戏
- 以及其他各种任务

有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

**流程详解**：
1. 浏览器访问 `http://localhost:9001/langchain4j/hello`
2. Controller 的 `hello()` 方法被调用
3. 由于没有传 `question` 参数，使用默认值 "你是谁"
4. 调用 `chatModel.chat("你是谁")`
5. LangChain4j 发送请求到阿里云 DashScope
6. qwen-plus 模型生成响应
7. 返回响应字符串
8. 控制台打印：`调用大模型回复: 你好！我是 Qwen...`
9. 浏览器显示响应内容

---

**接口2：自定义问题**
```
http://localhost:9001/langchain4j/hello?question=如何学习java
```
**返回示例**：
```
学习Java可以遵循以下系统化路径：

📚 一、基础入门（1-2个月）
1. Java语法基础
   - 数据类型、变量、运算符
   - 控制流程（if-else、循环、switch）
   - 数组和字符串处理
2. 面向对象编程
   - 类与对象
   - 封装、继承、多态
   - 接口和抽象类
3. 常用API
   - 集合框架（List、Map、Set）
   - 异常处理
   - 泛型

 二、进阶提升（2-3个月）
1. Java核心
   - IO/NIO
   - 多线程与并发
   - 反射与注解
   - 网络编程
2. 开发工具
   - Maven/Gradle
   - Git版本控制
   - IDE使用技巧（IntelliJ IDEA）

🌐 三、框架学习（3-4个月）
1. Spring Boot
2. MyBatis/JPA
3. Spring Cloud（微服务）

 推荐学习资源：
- 官方文档：https://docs.oracle.com/javase/tutorial/
- 书籍：《Java核心技术》《Effective Java》
- 视频：尚硅谷Java系列教程
- 练习平台：LeetCode、牛客网
```
**响应时间**: 约 2.8 秒（回答内容较长）

---

**接口3：技术问题**
```
http://localhost:9001/langchain4j/hello?question=解释一下Spring Boot的自动配置原理
```
**返回示例**：
```
Spring Boot的自动配置（Auto-Configuration）原理如下：

1. 核心注解：@EnableAutoConfiguration
2. 实现机制：
   - 通过SpringFactoriesLoader加载META-INF/spring.factories
   - 根据条件注解（@Conditional）判断是否启用配置
   - 常见条件：@ConditionalOnClass、@ConditionalOnMissingBean等
3. 工作流程：
   - 启动时扫描所有自动配置类
   - 检查依赖和条件
   - 符合条件的配置类会被加载到Spring容器
4. 优势：
   - 减少手动配置
   - 约定优于配置
   - 快速搭建项目
```
**响应时间**: 约 3.2 秒

#### 1.4 知识点总结

✅ **OpenAiChatModel** - LangChain4j 提供的 OpenAI 兼容接口  
   - 可以调用任何兼容 OpenAI 协议的模型（OpenAI、Azure、阿里云DashScope、本地Ollama等）  
   - 通过 Builder 模式构建，配置灵活  
   - 只需修改 `baseUrl` 即可切换模型提供商

✅ **兼容模式（Compatible Mode）** - 阿里云 DashScope 提供 OpenAI 兼容端点  
   - baseUrl: `https://dashscope.aliyuncs.com/compatible-mode/v1`  
   - 无需使用专门的 DashScope 依赖，一套代码可切换多个模型提供商  
   - 降低了对特定提供商的依赖，提高代码可移植性

✅ **ChatModel.chat()** - 同步调用方式  
   - 等待模型完整响应后返回  
   - 返回类型为 String，简单直接  
   - 适合基础问答场景  
   - 缺点：用户需要等待完整响应，体验不如流式

✅ **Builder模式** - LangChain4j 推荐的配置方式  
   - 使用 `OpenAiChatModel.builder()` 创建实例  
   - 链式调用设置参数（apiKey、modelName、baseUrl等）  
   - 最后调用 `.build()` 完成构建

✅ **@Bean注解** - Spring 依赖注入  
   - 在配置类中使用 `@Bean` 创建 ChatModel 实例  
   - 控制器中通过 `@Resource` 或 `@Autowired` 注入  
   - 实现配置与业务逻辑分离

✅ **两个核心依赖的关系**  
   - **`langchain4j-open-ai`**（基础依赖，类似于 MyBatis）  
     - 提供原生的 OpenAI 兼容接口  
     - 核心类：`OpenAiChatModel`、`ChatModel`  
     - 功能：基础的模型调用、同步/流式对话  
     - 适用场景：简单对话、快速原型  
   - **`langchain4j`**（高阶依赖，类似于 MyBatis-Plus）  
     - 提供增强的高级 API  
     - 核心类：`AiServices`、`ChatMemory`、`@Tool`  
     - 功能：声明式服务、对话记忆、工具调用、RAG 等  
     - 适用场景：企业级应用、复杂业务  
   - **依赖关系**：`langchain4j` 依赖 `langchain4j-open-ai`，两者配合使用

#### 1.5 详细讲解

**工作流程**：
```
1. 用户发起 HTTP 请求
   ↓
2. Spring Boot 启动，扫描 @Configuration 配置类
   ↓
3. LLMConfig.chatModelQwen() 方法被执行
   ↓
4. 创建 OpenAiChatModel 实例，配置 apiKey、modelName、baseUrl
   ↓
5. ChatModel Bean 注册到 Spring 容器
   ↓
6. 用户访问 /langchain4j/hello 接口
   ↓
7. HelloLangChain4JController.hello() 方法被调用
   ↓
8. @Resource 注入 ChatModel 实例
   ↓
9. 调用 chatModel.chat(question)
   ↓
10. LangChain4j 构造 HTTP 请求，发送到阿里云 DashScope
   ↓
11. qwen-plus 模型处理请求，生成响应
   ↓
12. 响应返回给 LangChain4j
   ↓
13. LangChain4j 解析响应，返回 String
   ↓
14. Controller 返回响应给用户
```

**形象比喻**：
```
LangChain4j = 万能遥控器

传统方式（直接使用模型SDK）：
- 每个模型提供商都有自己的 SDK（如阿里云SDK、OpenAI SDK）
- 就像每个电器都有自己的遥控器
- 想换模型？需要换整套代码（换遥控器）

LangChain4j 方式：
- 提供一个统一的接口（ChatModel）
- 就像万能遥控器，可以控制所有电器
- 想换模型？只需修改 baseUrl（换个频道）
- 代码不需要改动！

兼容模式 = 翻译器
- 阿里云 DashScope 有自己的协议
- OpenAI 有自己的协议
- 兼容模式让阿里云"说"OpenAI的语言
- 这样万能遥控器就能控制阿里云了！
```

**代码示例对比**：

**不使用 LangChain4j（直接使用阿里云SDK）**：
```java
// 需要引入阿里云 SDK
import com.aliyun.dashscope.*;

// 代码复杂，需要处理 HTTP 请求、JSON 解析等
DashScopeClient client = new DashScopeClient(apiKey);
Response response = client.call(modelName, prompt);
String result = response.parse();
```

**使用 LangChain4j**：
```java
// 只需两行代码
ChatModel chatModel = OpenAiChatModel.builder()
    .apiKey("sk-xxx")
    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
    .build();

String result = chatModel.chat("你是谁");
```

#### 1.6 两个依赖的详细对比

| 对比维度 | langchain4j-open-ai（基础） | langchain4j（高阶） |
|---------|---------------------------|-------------------|
| **定位** | 原生接口（底层 API） | 增强 API（上层封装） |
| **类比** | MyBatis（基础 ORM） | MyBatis-Plus（增强 ORM） |
| **核心功能** | 模型调用、同步/流式对话 | 声明式服务、记忆、工具、RAG |
| **核心类** | `OpenAiChatModel`、`ChatModel` | `AiServices`、`ChatMemory`、`@Tool` |
| **使用方式** | 手动创建实例、直接调用 | 注解驱动、声明式编程 |
| **学习曲线** | 低（容易理解） | 中（需理解框架设计） |
| **灵活性** | ✅ 高（完全控制） | 中（框架封装） |
| **代码量** | 较多（需写调用逻辑） | ✅ 少（声明式） |
| **适用场景** | 简单对话、快速原型 | 企业级应用、复杂业务 |
| **依赖关系** | 独立可用 | 依赖 `langchain4j-open-ai` |  

#### 1.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| 框架来源 | 社区开源项目 | Spring 官方 | 阿里巴巴官方 |
| **调用协议** | ✅ OpenAI 兼容协议 | ✅ OpenAI 兼容协议 | ✅ DashScope 原生协议（底层基于 Spring AI，也可调用 OpenAI 协议） |
| **模型提供商** | 多模型（OpenAI、Azure、阿里云、Ollama等） | 多模型（OpenAI、Azure、阿里云、Ollama等） | 主要面向阿里云 DashScope |
| 配置方式 | Java Config (@Bean) | 配置文件 + 自动配置 | 配置文件 + 自动配置 |
| API 调用 | chatModel.chat() | chatClient.prompt().call().content() | chatClient.prompt().call().content() |
| 模型切换 | 修改 baseUrl | 修改配置项 | 修改配置项 |
| 学习曲线 | 中等（需手动配置） | 较低（自动配置） | 较低（自动配置） |
| 依赖管理 | 需手动引入 | Starter 自动引入 | Starter 自动引入 |
| 代码风格 | 偏向 Java 原生 | 偏向 Spring 生态 | 偏向 Spring 生态 |

**💡 核心区别总结**：
- **LangChain4j**：通过 OpenAI 兼容协议调用任何模型（包括阿里云 DashScope）
- **Spring AI**：通过 OpenAI 兼容协议调用任何模型（包括阿里云 DashScope）
- **Spring AI Alibaba**：默认使用 DashScope 原生协议（性能最优），但底层基于 Spring AI，也支持调用 OpenAI 协议

**代码对比**：

**1️⃣ LangChain4j 配置方式**（调用 OpenAI 兼容协议 → 阿里云 DashScope）
```java
@Configuration
public class LLMConfig {
    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .apiKey("sk-xxx")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")  // OpenAI 兼容端点
                .build();
    }
}
```
**📖 详细讲解（新手必看）**：
- `@Configuration` - 标注这是一个 Spring 配置类，启动时会被自动扫描
- `@Bean` - 告诉 Spring 这个方法的返回值要放入 IoC 容器，供其他地方注入使用
- `OpenAiChatModel.builder()` - LangChain4j 提供的 Builder 模式构建器
  - **为什么叫 OpenAiChatModel？** 因为它是基于 OpenAI API 协议实现的，但可以通过修改 baseUrl 调用任何兼容 OpenAI 协议的模型（如阿里云、Azure、本地 Ollama 等）
  - `.apiKey("sk-xxx")` - 你的 API 密钥，用于身份认证
  - `.modelName("qwen-plus")` - 指定使用的模型名称
  - `.baseUrl("...")` - **关键！** 这里配置的是阿里云 DashScope 的 OpenAI 兼容端点，而不是 OpenAI 官方端点
  - `.build()` - 完成构建，返回 ChatModel 实例

**💡 形象理解**：
```
想象你在配置一个"万能遥控器"：
- OpenAiChatModel = 遥控器本体（支持 OpenAI 协议）
- baseUrl = 你要控制的设备地址（阿里云、OpenAI、Azure 等）
- apiKey = 遥控器配对码
- modelName = 选择设备的哪个功能

只要设备支持 OpenAI 协议，这个遥控器就能控制它！
```

---

**2️⃣ Spring AI 配置方式**（调用 OpenAI 兼容协议 → 阿里云 DashScope）
```properties
# application.properties
spring.ai.openai.api-key=sk-xxx
spring.ai.openai.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
spring.ai.openai.chat.options.model=qwen-plus
```
**📖 详细讲解**：
- `spring.ai.openai.*` - Spring AI 的 OpenAI 兼容配置前缀
- 通过修改 `base-url` 可以切换不同的模型提供商
- 配置简单，无需写 Java 代码

---

**3️⃣ Spring AI Alibaba 配置方式**（直接调用 DashScope 原生协议）
```properties
# application.properties
spring.ai.dashscope.api-key=sk-xxx
spring.ai.dashscope.chat.options.model=qwen-plus
```
**📖 详细讲解（新手必看）**：
- `spring.ai.dashscope.*` - 这是 Spring AI Alibaba **专属**的配置前缀
  - **为什么是 dashscope？** 因为 Spring AI Alibaba 是阿里云官方出品，专门针对 DashScope（阿里云百炼平台）优化
  - 它直接调用 DashScope **原生协议**，不是通过 OpenAI 兼容层
- `api-key` - 你的 API 密钥
- `chat.options.model` - 指定使用的模型名称

**形象理解**：
```
想象你在配置一个"原厂专用遥控器"：
- spring.ai.dashscope = 阿里云原厂遥控器（专为 DashScope 设计）
- api-key = 配对码
- model = 选择功能

这个遥控器只能控制阿里云的设备，但控制效果最好（原生协议，性能最优）
```

**🔍 两种配置方式的本质区别**：

| 对比维度 | LangChain4j / Spring AI (OpenAI 兼容) | Spring AI Alibaba (DashScope 原生) |
|---------|---------------------------------------|-------------------------------------|
| 协议类型 | OpenAI 兼容协议（通用） | DashScope 原生协议（专用） |
| 灵活性 | ✅ 高（可切换任何兼容模型） | ❌ 低（只能调用阿里云模型） |
| 性能 | 良好（有一层兼容转换） | ✅ 最优（直接调用，无转换） |
| 配置复杂度 | 中等（需写 Java 代码或配置） | ✅ 简单（只需改配置文件） |
| 适用场景 | 需要切换多个模型提供商 | 只使用阿里云模型 |

**🎯 如何选择？**
- ✅ 如果你只需要用阿里云模型 → 推荐 **Spring AI Alibaba**（配置简单，性能好）
- ✅ 如果你需要切换多个模型（如阿里云、OpenAI、本地模型） → 推荐 **LangChain4j**（灵活性强）

#### 1.8 技术要点

**兼容模式的优势**：
- 🔄 **模型无关** - 一套代码可调用 OpenAI、Azure、阿里云、本地模型
- 🔧 **快速切换** - 只需修改 baseUrl 即可切换模型提供商
- 🔑 **依赖简化** - 无需为每个模型引入专门依赖
- 🌐 **生态统一** - 遵循 OpenAI 协议，社区资源丰富

**适用场景**：
- ✅ 快速原型开发
- ✅ 模型对比测试
- ✅ 多模型切换需求
- ✅ 避免厂商锁定

**注意事项**：
- ⚠️ 兼容模式可能不支持某些模型的专属功能
- ⚠️ 性能可能略低于原生SDK
- ⚠️ 需要确保模型提供商支持 OpenAI 兼容接口

#### 1.9 常见问题

**问题1：API Key为null**
- **错误信息**：`apiKey cannot be null`
- **原因**：使用 `System.getenv()` 读取环境变量，但IDE未配置环境变量
- **解决方案**：直接写入 API Key 或使用 `@Value` 从配置文件读取
```java
// 方案1：直接写入（仅用于测试）
.apiKey("sk-b10fab4eef52480e9ebc051687850e50")

// 方案2：从配置文件读取（推荐）
@Value("${langchain4j.api-key}")
private String apiKey;
```

---

**问题2：中文乱码**
- **原因**：未配置UTF-8编码
- **解决方案**：在 application.properties 中添加：
```properties
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
server.servlet.encoding.charset=UTF-8
```

---

**问题3：连接超时**
- **原因**：网络问题或baseUrl配置错误
- **解决方案**：
  1. 检查网络代理配置
  2. 确认 baseUrl 是否正确
  3. 测试网络连通性：`curl https://dashscope.aliyuncs.com/compatible-mode/v1`

---

**问题4：如何切换到其他模型？**
- **方法**：修改 `baseUrl` 和 `modelName`
```java
// 切换到 OpenAI
.baseUrl("https://api.openai.com/v1")
.modelName("gpt-3.5-turbo")

// 切换到 Azure OpenAI
.baseUrl("https://your-resource.openai.azure.com/openai/deployments/your-deployment")
.modelName("gpt-35-turbo")

// 切换到本地 Ollama
.baseUrl("http://localhost:11434/v1")
.modelName("llama2")
```

---

#### 1.4.1 两个依赖的详细对比

| 对比维度 | langchain4j-open-ai（基础） | langchain4j（高阶） |
|---------|---------------------------|-------------------|
| **定位** | 原生接口（底层 API） | 增强 API（上层封装） |
| **类比** | MyBatis（基础 ORM） | MyBatis-Plus（增强 ORM） |
| **核心功能** | 模型调用、同步/流式对话 | 声明式服务、记忆、工具、RAG |
| **核心类** | `OpenAiChatModel`、`ChatModel` | `AiServices`、`ChatMemory`、`@Tool` |
| **使用方式** | 手动创建实例、直接调用 | 注解驱动、声明式编程 |
| **学习曲线** | 低（容易理解） | 中（需理解框架设计） |
| **灵活性** | ✅ 高（完全控制） | 中（框架封装） |
| **代码量** | 较多（需写调用逻辑） | ✅ 少（声明式） |
| **适用场景** | 简单对话、快速原型 | 企业级应用、复杂业务 |
| **依赖关系** | 独立可用 | 依赖 `langchain4j-open-ai` |  

#### 1.5 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| 框架来源 | 社区开源项目 | Spring 官方 | 阿里巴巴官方 |
| **调用协议** | ✅ OpenAI 兼容协议 | ✅ OpenAI 兼容协议 | ✅ DashScope 原生协议（底层基于 Spring AI，也可调用 OpenAI 协议） |
| **模型提供商** | 多模型（OpenAI、Azure、阿里云、Ollama等） | 多模型（OpenAI、Azure、阿里云、Ollama等） | 主要面向阿里云 DashScope |
| 配置方式 | Java Config (@Bean) | 配置文件 + 自动配置 | 配置文件 + 自动配置 |
| API 调用 | chatModel.chat() | chatClient.prompt().call().content() | chatClient.prompt().call().content() |
| 模型切换 | 修改 baseUrl | 修改配置项 | 修改配置项 |
| 学习曲线 | 中等（需手动配置） | 较低（自动配置） | 较低（自动配置） |
| 依赖管理 | 需手动引入 | Starter 自动引入 | Starter 自动引入 |
| 代码风格 | 偏向 Java 原生 | 偏向 Spring 生态 | 偏向 Spring 生态 |

**💡 核心区别总结**：
- **LangChain4j**：通过 OpenAI 兼容协议调用任何模型（包括阿里云 DashScope）
- **Spring AI**：通过 OpenAI 兼容协议调用任何模型（包括阿里云 DashScope）
- **Spring AI Alibaba**：默认使用 DashScope 原生协议（性能最优），但底层基于 Spring AI，也支持调用 OpenAI 协议

**代码对比**：

**1️⃣ LangChain4j 配置方式**（调用 OpenAI 兼容协议 → 阿里云 DashScope）
```
@Configuration
public class LLMConfig {
    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .apiKey("sk-xxx")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")  // OpenAI 兼容端点
                .build();
    }
}
```
**📖 详细讲解（新手必看）**：
- `@Configuration` - 标注这是一个 Spring 配置类，启动时会被自动扫描
- `@Bean` - 告诉 Spring 这个方法的返回值要放入 IoC 容器，供其他地方注入使用
- `OpenAiChatModel.builder()` - LangChain4j 提供的 Builder 模式构建器
  - **为什么叫 OpenAiChatModel？** 因为它是基于 OpenAI API 协议实现的，但可以通过修改 baseUrl 调用任何兼容 OpenAI 协议的模型（如阿里云、Azure、本地 Ollama 等）
  - `.apiKey("sk-xxx")` - 你的 API 密钥，用于身份认证
  - `.modelName("qwen-plus")` - 指定使用的模型名称
  - `.baseUrl("...")` - **关键！** 这里配置的是阿里云 DashScope 的 OpenAI 兼容端点，而不是 OpenAI 官方端点
  - `.build()` - 完成构建，返回 ChatModel 实例

**💡 形象理解**：
```
想象你在配置一个"万能遥控器"：
- OpenAiChatModel = 遥控器本体（支持 OpenAI 协议）
- baseUrl = 你要控制的设备地址（阿里云、OpenAI、Azure 等）
- apiKey = 遥控器配对码
- modelName = 选择设备的哪个功能

只要设备支持 OpenAI 协议，这个遥控器就能控制它！
```

---

**2️⃣ Spring AI 配置方式**（调用 OpenAI 兼容协议 → 阿里云 DashScope）
```
# application.properties
spring.ai.openai.api-key=sk-xxx
spring.ai.openai.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
spring.ai.openai.chat.options.model=qwen-plus
```
**📖 详细讲解**：
- `spring.ai.openai.*` - Spring AI 的 OpenAI 兼容配置前缀
- 通过修改 `base-url` 可以切换不同的模型提供商
- 配置简单，无需写 Java 代码

---

**3️ Spring AI Alibaba 配置方式**（直接调用 DashScope 原生协议）
```
# application.properties
spring.ai.dashscope.api-key=sk-xxx
spring.ai.dashscope.chat.options.model=qwen-plus
```
**📖 详细讲解（新手必看）**：
- `spring.ai.dashscope.*` - 这是 Spring AI Alibaba **专属**的配置前缀
  - **为什么是 dashscope？** 因为 Spring AI Alibaba 是阿里云官方出品，专门针对 DashScope（阿里云百炼平台）优化
  - 它直接调用 DashScope **原生协议**，不是通过 OpenAI 兼容层
- `api-key` - 你的 API 密钥
- `chat.options.model` - 指定使用的模型名称

** 形象理解**：
```
想象你在配置一个"原厂专用遥控器"：
- spring.ai.dashscope = 阿里云原厂遥控器（专为 DashScope 设计）
- api-key = 配对码
- model = 选择功能

这个遥控器只能控制阿里云的设备，但控制效果最好（原生协议，性能最优）
```

**🔍 两种配置方式的本质区别**：

| 对比维度 | LangChain4j / Spring AI (OpenAI 兼容) | Spring AI Alibaba (DashScope 原生) |
|---------|---------------------------------------|-------------------------------------|
| 协议类型 | OpenAI 兼容协议（通用） | DashScope 原生协议（专用） |
| 灵活性 | ✅ 高（可切换任何兼容模型） | ❌ 低（只能调用阿里云模型） |
| 性能 | 良好（有一层兼容转换） | ✅ 最优（直接调用，无转换） |
| 配置复杂度 | 中等（需写 Java 代码或配置） | ✅ 简单（只需改配置文件） |
| 适用场景 | 需要切换多个模型提供商 | 只使用阿里云模型 |

**🎯 如何选择？**
- ✅ 如果你只需要用阿里云模型 → 推荐 **Spring AI Alibaba**（配置简单，性能好）
- ✅ 如果你需要切换多个模型（如阿里云、OpenAI、本地模型） → 推荐 **LangChain4j**（灵活性强）

#### 1.6 技术要点

**兼容模式的优势**：
- 🔄 **模型无关** - 一套代码可调用 OpenAI、Azure、阿里云、本地模型
- 🔧 **快速切换** - 只需修改 baseUrl 即可切换模型提供商
-  **依赖简化** - 无需为每个模型引入专门依赖
-  **生态统一** - 遵循 OpenAI 协议，社区资源丰富

**适用场景**：
- ✅ 快速原型开发
- ✅ 模型对比测试
- ✅ 多模型切换需求
- ✅ 避免厂商锁定

**注意事项**：
- ⚠️ 兼容模式可能不支持某些模型的专属功能
- ️ 性能可能略低于原生SDK
- ⚠️ 需要确保模型提供商支持 OpenAI 兼容接口

#### 1.7 常见问题

**问题1：API Key为null**
- **错误信息**：`apiKey cannot be null`
- **原因**：使用 `System.getenv()` 读取环境变量，但IDE未配置环境变量
- **解决方案**：直接写入 API Key 或使用 `@Value` 从配置文件读取

**问题2：中文乱码**
- **原因**：未配置UTF-8编码
- **解决方案**：在 application.properties 中添加：
  ```properties
  server.servlet.encoding.enabled=true
  server.servlet.encoding.force=true
  server.servlet.encoding.charset=UTF-8
  ```

**问题3：连接超时**
- **原因**：网络问题或baseUrl配置错误
- **解决方案**：检查网络代理、确认baseUrl是否正确

---

### 模块2：langchain4j-02multi-model-together - 多模型共存

#### 2.1 模块概述
- **端口**: 9002
- **功能**: 演示在同一应用中同时使用多个 AI 模型(通义千问 + DeepSeek)
- **核心概念**: 多模型共存、@Bean命名、@Resource指定注入、模型切换

#### 2.2 核心代码

**📋 流程总览**：
```
用户请求 → Controller接收 → @Resource(name="xxx")注入指定模型 
→ 调用chat()方法 → 发送到对应模型API → 接收响应 → 返回给用户
```

**📊 完整调用流程图**：
```
┌─────────────┐
│   用户请求   │ "你是谁"
└──────┬──────┘
       │ HTTP GET /multimodel/qwen
       ▼
┌─────────────────────────┐
│  MultiModelController   │ qwenCall() 方法接收请求
└──────┬──────────────────┘
       │ @Resource(name="qwen") 注入
       ▼
┌─────────────────────────┐
│  ChatModel (qwen)       │ 通义千问模型实例
│  LLMConfig.chatModelQwen│
└──────┬──────────────────┘
       │ .chat(prompt)
       ▼
┌─────────────────────────┐
│ 阿里云 DashScope API    │ OpenAI 兼容端点
│ qwen-plus 模型          │
└──────┬──────────────────┘
       │ 返回 AI 响应
       ▼
┌─────────────────────────┐
│   返回给用户            │ "你好！我是 Qwen..."
└─────────────────────────┘

(另一个分支：/multimodel/deepseek → ChatModel (deepseek) → DeepSeek API)
```

---

**1️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @auther zzyybs@126.com
 * @Date 2025-05-27 22:04
 * @Description: 知识出处 https://docs.langchain4j.dev/get-started
 */
@Configuration
public class LLMConfig
{
    @Bean(name = "qwen")
    public ChatModel chatModelQwen()
    {
        return OpenAiChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-plus")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    /**
    * @Description: 知识出处，https://api-docs.deepseek.com/zh-cn/
    * @Auther: zzyybs@126.com
    * @Note: DeepSeek API Key 需要替换为你的实际密钥
    */
    @Bean(name = "deepseek")
    public ChatModel chatModelDeepSeek()
    {
        return
                OpenAiChatModel.builder()
                        .apiKey("sk-8bef83d468c848179422f7b1f1d8de86")
                        .modelName("deepseek-chat")
                        //.modelName("deepseek-reasoner")
                        .baseUrl("https://api.deepseek.com/v1")
                .build();
    }
}
```

**作用说明**：
- **Spring 配置类** - 创建两个 ChatModel Bean
- **@Bean(name = "xxx")** - 为每个 Bean 指定名称，便于区分不同模型
- **两个模型** - 通义千问（qwen-plus）和 DeepSeek（deepseek-chat）
- **不同 baseUrl** - 阿里云 DashScope 和 DeepSeek 官方接口

**关键点**：
- ✅ **`@Bean(name = "xxx")`** - 为 Spring Bean 指定名称
  - 当同一类型有多个 Bean 时，必须通过名称区分
  - 示例：`@Bean(name = "qwen")` 和 `@Bean(name = "deepseek")`
  - 不使用 name 属性会导致 Spring 无法确定注入哪个 Bean
- ✅ **两个模型独立配置** - 每个模型有自己的 apiKey、modelName、baseUrl
  - qwen: 阿里云 DashScope (`https://dashscope.aliyuncs.com/compatible-mode/v1`)
  - deepseek: DeepSeek 官方 (`https://api.deepseek.com/v1`)
- ✅ **模型切换** - 可以通过注释切换 DeepSeek 的普通模型和推理模型
  - `.modelName("deepseek-chat")` - 普通对话模型
  - `.modelName("deepseek-reasoner")` - 推理模型（更强）

---

**2️⃣ 控制器使用：MultiModelController.java**
```java
package com.atguigu.study.controller;

import dev.langchain4j.model.chat.ChatModel;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @auther zzyybs@126.com
 * @Date 2025-05-28 11:27
 * @Description: TODO
 */
@RestController
@Slf4j
public class MultiModelController
{
    @Resource(name = "qwen")
    private ChatModel chatModelQwen;

    @Resource(name = "deepseek")
    private ChatModel chatModelDeepSeek;

    // http://localhost:9002/multimodel/qwen
    @GetMapping(value = "/multimodel/qwen")
    public String qwenCall(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        String result = chatModelQwen.chat(prompt);

        System.out.println("通过langchain4j调用模型返回结果：\n"+result);

        return result;
    }

    // http://localhost:9002/multimodel/deepseek
    @GetMapping(value = "/multimodel/deepseek")
    public String deepseekCall(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        String result = chatModelDeepSeek.chat(prompt);

        System.out.println("通过langchain4j调用模型返回结果：\n"+result);

        return result;
    }
}
```

**作用说明**：
- **REST 控制器** - 提供两个接口，分别调用不同模型
- **@Resource(name = "xxx")** - 通过 Bean 名称注入指定的模型
- **两个接口** - `/multimodel/qwen` 和 `/multimodel/deepseek`
- **模型隔离** - 不同模型互不干扰，可独立调用

**关键点**：
- ✅ **`@Resource(name = "xxx")`** - 通过名称注入指定的 Bean
  - 与 `@Autowired` 不同，`@Resource` 可以通过 name 属性指定
  - 示例：`@Resource(name = "qwen")` 注入通义千问模型
  - 实现精确的依赖注入控制
- ✅ **模型隔离** - 两个模型完全独立
  - 调用 qwen 不会影响 deepseek
  - 可以同时进行 A/B 测试
- ✅ **统一接口** - LangChain4j 提供统一的 ChatModel 接口
  - 无论使用哪个模型，调用方式完全相同
  - `chatModel.chat(prompt)` 适用于所有模型

---

**配置文件：application.properties**
```properties
server.port=9002

spring.application.name=langchain4j-02multi-model-together
```

**关键点**：
- **端口**: 9002
- **应用名称**: langchain4j-02multi-model-together

---

**POM依赖**：与模块1相同
```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>
```

**关键点**：
- **`langchain4j-open-ai`** - 基础依赖，提供 OpenAI 兼容的原生接口
- **`langchain4j`** - 高阶依赖，提供增强的 API

#### 2.3 测试接口与返回

**接口1：调用通义千问（默认问题）**
```
http://localhost:9002/multimodel/qwen
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

**接口2：调用通义千问（自定义问题）**
```
http://localhost:9002/multimodel/qwen?prompt=解释一下什么是RAG
```
**返回示例**：
```
RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合了信息检索和文本生成的AI技术架构：

1. 检索阶段（Retrieval）
   - 从外部知识库中检索与问题相关的文档
   - 使用向量相似度搜索找到最相关的信息

2. 增强阶段（Augmented）
   - 将检索到的文档作为上下文提供给大语言模型
   - 增强模型的上下文理解能力

3. 生成阶段（Generation）
   - 模型基于检索到的信息生成回答
   - 提高回答的准确性和可靠性

优势：减少幻觉、答案有据可查、可更新知识库
```
**响应时间**: 约 2.8 秒

**接口3：调用 DeepSeek（默认问题）**
```
http://localhost:9002/multimodel/deepseek
```
**返回示例**：
```
你好！我是 DeepSeek-V3，是由深度求索（DeepSeek）开发的大型语言模型。我旨在提供准确、有用的信息和帮助。有什么我可以为你解答的问题吗？
```
**响应时间**: 约 1.2 秒（DeepSeek 响应较快）

**接口4：调用 DeepSeek（技术问题）**
```
http://localhost:9002/multimodel/deepseek?prompt=Java和Python的主要区别
```
**返回示例**：
```
Java 和 Python 的主要区别：

1. 类型系统
   - Java: 静态类型，编译时检查
   - Python: 动态类型，运行时检查

2. 执行方式
   - Java: 编译为字节码，JVM执行
   - Python: 解释执行

3. 语法简洁度
   - Java: 语法较严格，代码量大
   - Python: 语法简洁，代码量少

4. 性能
   - Java: 性能较高，适合大型应用
   - Python: 性能较低，但开发效率高

5. 应用场景
   - Java: 企业级应用、Android开发
   - Python: 数据科学、AI、Web开发
```
**响应时间**: 约 2.5 秒

#### 2.4 知识点总结

✅ **@Bean(name = "xxx")** - 为 Spring Bean 指定名称  
   - 当同一类型有多个 Bean 时，必须通过名称区分  
   - 示例：`@Bean(name = "qwen")` 和 `@Bean(name = "deepseek")`  
   - 不使用 name 属性会导致 Spring 无法确定注入哪个 Bean  

✅ **@Resource(name = "xxx")** - 通过名称注入指定的 Bean  
   - 与 `@Autowired` 不同，`@Resource` 可以通过 name 属性指定  
   - 示例：`@Resource(name = "qwen")` 注入通义千问模型  
   - 实现精确的依赖注入控制  

✅ **多模型共存** - 同一应用中可以使用多个 AI 模型  
   - 每个模型独立配置（apiKey、modelName、baseUrl）  
   - 不同模型可以来自不同提供商（阿里云、DeepSeek、OpenAI等）  
   - 模型之间互不干扰，可按需选择  

✅ **模型切换** - 通过代码注释快速切换模型  
   - DeepSeek 提供两种模型：`deepseek-chat`（普通）和 `deepseek-reasoner`（推理）  
   - 注释切换即可，无需修改其他代码  
   - 示例：`.modelName("deepseek-chat")` vs `.modelName("deepseek-reasoner")`  

✅ **统一接口** - LangChain4j 提供统一的 ChatModel 接口  
   - 无论使用哪个模型，调用方式完全相同  
   - `chatModel.chat(prompt)` 适用于所有模型  
   - 降低学习和使用成本  

#### 2.5 详细讲解

**工作流程**：
```
1. Spring Boot 启动，扫描 @Configuration 配置类
   ↓
2. LLMConfig 中创建两个 ChatModel Bean（qwen、deepseek）
   ↓
3. 每个 Bean 有独立的名称、apiKey、modelName、baseUrl
   ↓
4. 用户访问 /multimodel/qwen 或 /multimodel/deepseek
   ↓
5. Controller 通过 @Resource(name="xxx") 注入指定模型
   ↓
6. 调用 chatModel.chat(prompt)
   ↓
7. LangChain4j 发送请求到对应模型 API
   ↓
8. 模型生成响应并返回
   ↓
9. Controller 返回响应给用户
```

**形象比喻**：
```
多模型共存 = 多语言翻译团队

传统方式（单模型）：
- 只有一个翻译员，只能翻译一种语言
- 想换语言？需要换人

多模型方式：
- 团队里有多个翻译员（英语、法语、德语...）
- 每个翻译员有自己的专长
- 根据需求选择对应的翻译员
- 互不干扰，各司其职

@Bean(name="xxx") = 给每个翻译员起名字
- 如果都叫"翻译员"，不知道找谁
- 起了名字（张三、李四），就能精确找到了

@Resource(name="xxx") = 点名要找哪个翻译员
- "我要找张三翻译"
- 系统就知道找哪个翻译员了
```

**代码示例对比**：

**不使用 @Bean name（会报错）**：
```java
@Configuration
public class LLMConfig {
    @Bean
    public ChatModel chatModel1() { ... }  // 无名称
    
    @Bean
    public ChatModel chatModel2() { ... }  // 无名称
}

// ❌ Spring 启动报错：NoUniqueBeanDefinitionException
// 原因：两个 ChatModel 类型相同，Spring 不知道注入哪个
```

**使用 @Bean name（正确方式）**：
```java
@Configuration
public class LLMConfig {
    @Bean(name = "qwen")
    public ChatModel chatModelQwen() { ... }  // 有名称
    
    @Bean(name = "deepseek")
    public ChatModel chatModelDeepSeek() { ... }  // 有名称
}

@RestController
public class MultiModelController {
    @Resource(name = "qwen")  // ✅ 指定名称
    private ChatModel chatModelQwen;
    
    @Resource(name = "deepseek")  // ✅ 指定名称
    private ChatModel chatModelDeepSeek;
}

// ✅ Spring 能精确识别，不会报错
```

#### 2.6 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| 多模型配置 | @Bean(name="xxx") + @Resource(name="xxx") | @Bean(name="xxx") + @Qualifier("xxx") | @Bean(name="xxx") + @Qualifier("xxx") |
| 模型注入 | @Resource(name = "xxx") | @Qualifier("xxx") | @Qualifier("xxx") |
| 配置方式 | Java Config | Java Config | Java Config |
| 代码风格 | 相似 | 相似 | 相似 |
| 调用协议 | OpenAI 兼容协议 | OpenAI 兼容协议 | DashScope 原生协议 |

** 详细讲解（新手必看）**：

**为什么需要 @Bean(name = "xxx") ？**
```
想象你在一个房间里有两个人都叫"张三"：
- 如果你只说"找张三"，系统不知道找哪个
- 如果你说"找张三（穿红衣服的）"，系统就知道找谁了

同理：
- 两个 ChatModel 类型相同，Spring 不知道注入哪个
- 通过 name 属性给每个 Bean 起个"昵称"，就能精确区分了
```

**@Resource vs @Qualifier 的区别**：
- `@Resource(name = "xxx")` - Java 标准注解，通过 name 属性指定
- `@Qualifier("xxx")` + `@Autowired` - Spring 专属注解，配合使用
- 两者效果相同，看个人习惯

**代码对比**：

**1️⃣ LangChain4j 多模型配置**（OpenAI 兼容协议）：
```java
@Configuration
public class LLMConfig {
    // 配置通义千问
    @Bean(name = "qwen")
    public ChatModel chatModelQwen() {
        return OpenAiChatModel.builder()
                .apiKey("sk-xxx")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    // 配置 DeepSeek
    @Bean(name = "deepseek")
    public ChatModel chatModelDeepSeek() {
        return OpenAiChatModel.builder()
                .apiKey("sk-xxx")
                .modelName("deepseek-chat")
                .baseUrl("https://api.deepseek.com/v1")
                .build();
    }
}

@RestController
public class MultiModelController {
    @Resource(name = "qwen")
    private ChatModel chatModelQwen;

    @Resource(name = "deepseek")
    private ChatModel chatModelDeepSeek;
}
```

**2️⃣ Spring AI 多模型配置**（OpenAI 兼容协议）：
```java
@Configuration
public class LLMConfig {
    @Bean(name = "qwen")
    public ChatModel qwenChatModel(OpenAiChatProperties properties) {
        return OpenAiChatModel.builder()
                .apiKey(properties.getApiKey())
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    @Bean(name = "deepseek")
    public ChatModel deepseekChatModel(OpenAiChatProperties properties) {
        return OpenAiChatModel.builder()
                .apiKey(properties.getApiKey())
                .baseUrl(properties.getBaseUrl())
                .build();
    }
}

@RestController
public class MultiModelController {
    @Autowired
    @Qualifier("qwen")
    private ChatModel qwenChatModel;

    @Autowired
    @Qualifier("deepseek")
    private ChatModel deepseekChatModel;
}
```

**3️⃣ Spring AI Alibaba 多模型配置**（DashScope 原生协议）：
```java
@Configuration
public class LLMConfig {
    @Bean(name = "qwen")
    public ChatModel qwenChatModel() {
        return DashScopeChatModel.builder()
                .apiKey("sk-xxx")
                .defaultOptions(DashScopeChatOptions.builder()
                        .withModel("qwen-plus")
                        .build())
                .build();
    }

    @Bean(name = "deepseek")
    public ChatModel deepseekChatModel() {
        return DashScopeChatModel.builder()
                .apiKey("sk-xxx")
                .defaultOptions(DashScopeChatOptions.builder()
                        .withModel("deepseek-chat")
                        .build())
                .build();
    }
}

@RestController
public class MultiModelController {
    @Autowired
    @Qualifier("qwen")
    private ChatModel qwenChatModel;
}
```

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI | Spring AI Alibaba |
|---------|-------------|-----------|-------------------|
| 多模型支持 | ✅ 完美支持 | ✅ 完美支持 | ✅ 完美支持 |
| 配置方式 | @Bean + @Resource | @Bean + @Qualifier | @Bean + @Qualifier |
| 模型来源 | 可混合（阿里云、DeepSeek、OpenAI） | 可混合 | 主要阿里云 |
| 协议类型 | OpenAI 兼容 | OpenAI 兼容 | DashScope 原生 |
| 灵活性 | ✅ 最高 | ✅ 高 | ❌ 较低 |

**🎯 如何选择？**
- ✅ 需要混合使用多个提供商的模型（阿里云 + DeepSeek + OpenAI）→ 推荐 **LangChain4j** 或 **Spring AI**
- ✅ 只使用阿里云模型，追求最佳性能 → 推荐 **Spring AI Alibaba**
- ✅ 已经在用 Spring AI，想多模型支持 → 直接用 **Spring AI**

---

#### 2.7 技术要点

**多模型共存的优势**：
- 🔄 **模型对比** - 可以同时测试不同模型的效果和性能
-  **场景适配** - 不同模型有不同特长，可按场景选择
-  **A/B 测试** - 实现模型的 A/B 测试和灰度发布
- 🔧 **故障容灾** - 一个模型不可用时，可切换到其他模型
- 💰 **成本优化** - 根据需求选择性价比最高的模型

**适用场景**：
- ✅ 模型性能对比测试
- ✅ 多模型负载均衡
- ✅ 故障切换和容灾
- ✅ 不同场景使用不同模型（如：简单问题用快速模型，复杂问题用深度模型）

**注意事项**：
- ⚠️ 每个模型需要独立的 API Key
- ⚠️ 不同模型的 baseUrl 不同，需正确配置
- ⚠️ 模型响应时间和质量可能不同
- ⚠️ 注意 API 调用频率限制

#### 2.8 常见问题

**问题1：Bean 冲突**
- **错误信息**：`NoUniqueBeanDefinitionException: expected single matching bean but found 2`
- **原因**：同一类型有多个 Bean，Spring 无法确定注入哪个
- **解决方案**：使用 `@Bean(name = "xxx")` 和 `@Resource(name = "xxx")` 指定名称

**问题2：API Key 为 null**
- **错误信息**：`apiKey cannot be null`
- **原因**：使用 `System.getenv()` 但未配置环境变量
- **解决方案**：直接写入 API Key 或使用 `@Value` 从配置文件读取

**问题3：DeepSeek 模型切换**
- **需求**：在 `deepseek-chat` 和 `deepseek-reasoner` 之间切换
- **解决方案**：修改 `modelName` 配置即可
  ```java
  .modelName("deepseek-chat")      // 普通对话模型
  .modelName("deepseek-reasoner")  // 推理模型（更强）
  ```

**问题4：如何添加更多模型？**
- **步骤**：
  1. 在 LLMConfig 中添加新的 `@Bean(name = "xxx")`
  2. 配置 apiKey、modelName、baseUrl
  3. 在控制器中使用 `@Resource(name = "xxx")` 注入
  4. 添加新的接口方法调用该模型

---

### 模块3：langchain4j-03boot-integration - Spring Boot集成

#### 3.1 模块概述
- **端口**: 9003
- **功能**: 演示 LangChain4j 与 Spring Boot 的深度集成，包括自动配置和声明式 AI 服务
- **核心概念**: Spring Boot Starter、自动配置、@AiService 声明式服务

#### 3.2 核心代码

**📋 流程总览**：
```
方式一：配置文件 → Spring Boot自动配置ChatModel → Controller注入 → 调用chat()
方式二：@AiService接口 → Starter自动扫描创建代理 → Controller注入 → 调用方法
```

**📊 完整调用流程图**：
```
方式一（ChatModel直接调用）：
┌─────────────┐
│ application │ langchain4j.open-ai.chat-model.*
│ .properties │ 配置项
└──────┬──────┘
       │ Spring Boot自动配置
       ▼
┌─────────────┐
│  ChatModel  │ 自动创建的Bean
│   (Bean)    │
└──────┬──────┘
       │ @Resource注入
       ▼
┌─────────────┐
│ Controller  │ chatModel.chat(prompt)
└──────┬──────┘
       ▼
┌─────────────┐
│  返回结果   │
└─────────────┘

方式二（@AiService声明式服务）：
┌─────────────┐
│ @AiService  │ 接口定义
│  Interface  │
└──────┬──────┘
       │ Starter自动扫描
       ▼
┌─────────────┐
│  AiServices │ 自动生成代理实现
│   Proxy     │
└──────┬──────┘
       │ @Resource注入
       ▼
┌─────────────┐
│ Controller  │ chatAssistant.chat(prompt)
└──────┬──────┘
       ▼
┌─────────────┐
│  返回结果   │
└─────────────┘
```

---

**1️⃣ 定义接口：ChatAssistant.java**
```java
package com.atguigu.study.service;

import dev.langchain4j.service.AiService;

/**
 * @AiService 声明式 AI 服务接口
 * Spring Boot Starter 会自动扫描并创建实现类
 */
@AiService
public interface ChatAssistant
{
    String chat(String prompt);
}
```

**作用说明**：
- **@AiService 接口** - LangChain4j 的声明式 AI 服务注解
- **接口即服务** - 只需定义接口，框架自动生成实现类
- **自动扫描** - Spring Boot Starter 启动时自动扫描并创建代理对象
- **方法签名** - `chat(String prompt)` 返回 String，简单直接

**关键点**：
- ✅ **`@AiService`** - 标注这是一个 AI 服务接口
  - Starter 会自动扫描所有标注了 @AiService 的接口
  - 自动生成实现类（代理模式）
  - 实现类内部调用 ChatModel.chat() 方法
- ✅ **无需实现类** - 框架自动生成，不需要手动编写
- ✅ **类似于 MyBatis Mapper** - 声明式编程，接口定义即可

---

**2️⃣ 配置文件：application.properties**
```properties
server.port=9003

spring.application.name=langchain4j-12boot-integration

# LangChain4j Spring Boot Starter 自动配置
langchain4j.open-ai.chat-model.api-key=sk-b10fab4eef52480e9ebc051687850e50
langchain4j.open-ai.chat-model.model-name=qwen-plus
langchain4j.open-ai.chat-model.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
```

**关键点**：
- **`langchain4j.open-ai.chat-model.*`** - LangChain4j Spring Boot Starter 的配置前缀
- **自动配置** - 只需配置文件，Spring Boot 自动创建 ChatModel Bean
- **无需 Java Config** - 不需要写 @Bean 配置类

---

**3️⃣ 控制器使用（方式一）：PopularIntegrationController.java**
```java
@RestController
public class PopularIntegrationController
{
    @Resource
    private ChatModel chatModel;

    // http://localhost:9003/lc4j/boot/chat
    @GetMapping(value = "/lc4j/boot/chat")
    public String chat(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        return chatModel.chat(prompt);
    }
}
```

**关键点**：
- **`@Resource`** - 自动注入 ChatModel（由 Starter 自动配置）
- **`chatModel.chat()`** - 直接调用，与模块1相同
- **接口路径**: `/lc4j/boot/chat`

---

**4️⃣ 控制器使用（方式二）：DeclarativeAIServiceController.java**
```java
@RestController
public class DeclarativeAIServiceController
{
    @Resource
    private ChatAssistant chatAssistantQwen;

    // http://localhost:9003/lc4j/boot/declarative
    @GetMapping(value = "/lc4j/boot/declarative")
    public String declarative(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        return chatAssistantQwen.chat(prompt);
    }
}
```

**关键点**：
- **`@AiService`** - LangChain4j 的声明式 AI 服务注解
- **接口即服务** - 只需定义接口，框架自动生成实现类
- **`chatAssistantQwen.chat()`** - 像调用普通方法一样调用 AI

---

**POM依赖**：
```xml
<!-- 1️ LangChain4j 整合boot底层支持（类似于 MyBatis） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
</dependency>

<!-- 2️⃣ LangChain4j 整合boot高阶支持（类似于 MyBatis-Plus） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
</dependency>
```

**关键点**：
- **`langchain4j-open-ai-spring-boot-starter`** - 底层支持，提供 ChatModel 自动配置
- **`langchain4j-spring-boot-starter`** - 高阶支持，提供 @AiService 声明式服务

** 与模块1依赖的对应关系（新手必看）**：

模块3的两个 Starter 依赖，其实是模块1两个基础依赖的 **Spring Boot 封装版本**：

| 模块1（基础依赖） | 模块3（Starter 依赖） | 对应关系 |
|------------------|----------------------|----------|
| `langchain4j-open-ai` | `langchain4j-open-ai-spring-boot-starter` | 基础接口 + Spring Boot 自动配置 |
| `langchain4j` | `langchain4j-spring-boot-starter` | 高阶 API + Spring Boot 自动配置 |

**详细讲解**：

**1️ `langchain4j-open-ai-spring-boot-starter` = `langchain4j-open-ai` + Spring Boot 自动配置**
```
模块1：需要手动写 @Configuration + @Bean 创建 ChatModel
模块3：只需写配置文件，Starter 自动创建 ChatModel

类比：
- 模块1 = 手动装配汽车（自己买零件组装）
- 模块3 = 买整车（厂家已经装配好）
```

**支持的用法**：
- ✅ ChatModel 直接调用（方式一：PopularIntegrationController）
- ✅ 同步对话、流式对话
- ✅ 基础的模型调用

**2️⃣ `langchain4j-spring-boot-starter` = `langchain4j` + Spring Boot 自动配置**
```
模块1：需要手动使用 AiServices.builder() 创建声明式服务
模块3：只需定义接口 + @AiService 注解，Starter 自动扫描并创建

类比：
- 模块1 = 手动注册服务（自己写注册代码）
- 模块3 = 自动扫描注册（贴个标签就自动识别）
```

**支持的用法**：
- ✅ @AiService 声明式服务（方式二：DeclarativeAIServiceController）
- ✅ 对话记忆（ChatMemory）
- ✅ 工具调用（@Tool）
- ✅ RAG 检索增强
- ✅ 其他高级功能

#### 3.3 测试接口与返回

**接口1：ChatModel 直接调用**
```
http://localhost:9003/lc4j/boot/chat?prompt=你是谁
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

**接口2：@AiService 声明式服务调用**
```
http://localhost:9003/lc4j/boot/declarative?prompt=你是谁
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

#### 3.4 知识点总结

✅ **Spring Boot Starter 自动配置**  
   - 只需在配置文件中写配置项，Spring Boot 自动创建 ChatModel Bean  
   - 无需手动编写 @Configuration 和 @Bean  
   - 符合 Spring Boot "约定优于配置"的理念  
   - 配置前缀：`langchain4j.open-ai.chat-model.*`

✅ **@AiService 声明式 AI 服务**  
   - LangChain4j 提供的高阶 API  
   - 只需定义接口并标注 @AiService，框架自动生成实现类  
   - 实现类内部调用 ChatModel.chat() 方法  
   - 类似于 MyBatis 的 Mapper 接口，声明式编程  
   - 优势：代码简洁、职责分离、易于测试、易于扩展

✅ **两个 Starter 依赖的关系**  
   - **`langchain4j-open-ai-spring-boot-starter`**（底层基础）  
     - 类似于 MyBatis：提供基础的 ORM 功能  
     - 提供 ChatModel 自动配置  
     - 独立可用，适合简单项目  
   - **`langchain4j-spring-boot-starter`**（高阶增强）  
     - 类似于 MyBatis-Plus：提供增强的 ORM 功能  
     - 提供 @AiService 等高级功能  
     - 依赖底层 Starter，适合企业级项目

✅ **两种调用方式对比**  
   - **ChatModel 直接调用**：简单直接，适合快速原型  
   - **@AiService 声明式服务**：代码简洁，适合企业级应用

#### 3.5 详细讲解

**工作流程**：
```
方式一（ChatModel 直接调用）：
1. Spring Boot 启动，读取 application.properties 配置
   ↓
2. Starter 自动创建 ChatModel Bean（根据配置）
   ↓
3. Controller 通过 @Resource 注入 ChatModel
   ↓
4. 调用 chatModel.chat(prompt)
   ↓
5. 返回结果给用户

方式二（@AiService 声明式服务）：
1. Spring Boot 启动，读取 application.properties 配置
   ↓
2. Starter 自动创建 ChatModel Bean
   ↓
3. Starter 扫描 @AiService 接口，自动生成代理实现类
   ↓
4. Controller 通过 @Resource 注入 ChatAssistant
   ↓
5. 调用 chatAssistant.chat(prompt)
   ↓
6. 代理内部调用 ChatModel.chat()
   ↓
7. 返回结果给用户
```

**形象比喻**：
```
Spring Boot Starter = 自动化生产线

传统方式（模块1）：
- 需要手动装配每个零件（写 @Configuration + @Bean）
- 就像手工打造汽车，每辆车都要自己组装
- 灵活但费时

Starter 方式（模块3）：
- 只需提供配置清单（application.properties）
- 生产线自动装配（Starter 自动配置）
- 快速高效，适合批量生产

@AiService = 智能机器人助手

传统方式：
- 需要自己写服务实现类
- 就像自己雇佣员工，需要培训、管理

@AiService 方式：
- 只需定义接口（告诉机器人要做什么）
- 机器人自动完成（框架生成实现类）
- 省时省力，专注于业务逻辑
```

**代码示例对比**：

**不使用 Starter（模块1的方式）**：
```java
// 需要手动写配置类
@Configuration
public class LLMConfig {
    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .apiKey("sk-xxx")
                .modelName("qwen-plus")
                .baseUrl("...")
                .build();
    }
}

// 控制器中注入
@Resource
private ChatModel chatModel;
```

**使用 Starter（模块3的方式）**：
```properties
# 只需配置文件
langchain4j.open-ai.chat-model.api-key=sk-xxx
langchain4j.open-ai.chat-model.model-name=qwen-plus
langchain4j.open-ai.chat-model.base-url=...
```

```java
// 控制器中直接注入（无需配置类）
@Resource
private ChatModel chatModel;  // ✅ Starter 自动配置
```

#### 3.6 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **Spring Boot 集成方式对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **Starter 依赖** | langchain4j-spring-boot-starter | spring-ai-openai-spring-boot-starter | spring-ai-alibaba-starter |
| **自动配置** | ✅ 支持（配置文件） | ✅ 支持（配置文件） | ✅ 支持（配置文件） |
| **声明式服务** | ✅ @AiService | ❌ 不支持 |  不支持 |
| **配置前缀** | langchain4j.open-ai.* | spring.ai.openai.* | spring.ai.dashscope.* |
| **调用协议** | OpenAI 兼容协议 | OpenAI 兼容协议 | DashScope 原生协议 |

#### **详细代码对比**

**1️⃣ LangChain4j（配置文件 + @AiService）**：
```properties
# application.properties
langchain4j.open-ai.chat-model.api-key=sk-xxx
langchain4j.open-ai.chat-model.model-name=qwen-plus
langchain4j.open-ai.chat-model.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
```

```java
// 声明式服务
@AiService
public interface ChatAssistant {
    String chat(String prompt);
}

// 使用
@Resource
private ChatAssistant chatAssistant;

public String chat(String prompt) {
    return chatAssistant.chat(prompt);  // 像调用普通方法一样
}
```

**📖 详细讲解（新手必看）**：
- `@AiService` - LangChain4j 的声明式 AI 服务注解
- 只需定义接口，框架自动生成实现类
- 实现类内部调用 ChatModel.chat() 方法
- 优势：代码简洁、职责分离、易于测试

---

**2️⃣ Spring AI（配置文件）**：
```properties
# application.properties
spring.ai.openai.api-key=sk-xxx
spring.ai.openai.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
spring.ai.openai.chat.options.model=qwen-plus
```

```java
// 没有 @AiService，需要手动注入 ChatClient
@Autowired
private ChatClient chatClient;

public String chat(String prompt) {
    return chatClient.prompt(prompt).call().content();  // 需要手动调用
}
```

**📖 详细讲解**：
- Spring AI 不支持声明式服务
- 需要手动注入 ChatClient 并调用
- 配置前缀：`spring.ai.openai.*`

---

**3️⃣ Spring AI Alibaba（配置文件）**：
```properties
# application.properties
spring.ai.dashscope.api-key=sk-xxx
spring.ai.dashscope.chat.options.model=qwen-plus
```

```java
// 没有 @AiService，需要手动注入 ChatClient
@Autowired
private ChatClient chatClient;

public String chat(String prompt) {
    return chatClient.prompt(prompt).call().content();  // 需要手动调用
}
```

** 详细讲解**：
- Spring AI Alibaba 不支持声明式服务
- 需要手动注入 ChatClient 并调用
- 配置前缀：`spring.ai.dashscope.*`（DashScope 原生协议）

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| 配置复杂度 | 简单（配置文件） | 简单（配置文件） |
| 代码简洁度 | ✅ 高（@AiService 声明式） | 中（需手动调用） |
| 学习曲线 | 中（需理解 @AiService） | 低（直接调用） |
| 灵活性 | 中（框架封装） | ✅ 高（完全控制） |
| 适用场景 | 企业级应用、复杂业务 | 快速原型、简单项目 |

**🎯 如何选择？**
- ✅ 追求代码简洁、企业级应用 → 推荐 **LangChain4j**（@AiService 声明式）
- ✅ 追求灵活性、需要精细控制 → 推荐 **Spring AI / Spring AI Alibaba**

#### 3.7 技术要点

**Spring Boot Starter 的优势**：
- 🔄 **自动配置** - 无需手动创建 @Bean，配置文件自动生效
- 🔧 **约定优于配置** - 遵循 Spring Boot 最佳实践
- 📦 **依赖管理** - Starter 自动引入所需依赖
- 🚀 **快速开发** - 减少样板代码，提升开发效率

**@AiService 的优势**：
- 📝 **声明式编程** - 接口即服务，无需写实现类
-  **职责分离** - 业务逻辑与 AI 调用分离
- 🧪 **易于测试** - 可以 Mock 接口进行单元测试
- 🔌 **易于扩展** - 可以轻松添加多个方法

**适用场景**：
- ✅ 企业级应用开发
- ✅ 需要快速迭代的项目
- ✅ 团队多人协作（接口定义清晰）
- ✅ 需要单元测试的项目

**注意事项**：
- ⚠️ @AiService 接口不能有实现类（框架自动生成）
- ️ 需要引入 `langchain4j-spring-boot-starter` 依赖
- ️ 接口方法名可以自定义，但参数和返回值需符合规范

#### 3.8 常见问题

**问题1：@AiService 接口无法注入**
- **错误信息**：`NoSuchBeanDefinitionException: No qualifying bean of type 'ChatAssistant' available`
- **原因**：未引入 `langchain4j-spring-boot-starter` 依赖
- **解决方案**：添加依赖并重启应用
  ```xml
  <dependency>
      <groupId>dev.langchain4j</groupId>
      <artifactId>langchain4j-spring-boot-starter</artifactId>
  </dependency>
  ```

**问题2：配置文件不生效**
- **原因**：配置前缀错误（应为 `langchain4j.open-ai.*`）
- **解决方案**：检查配置前缀是否正确

**问题3：ChatModel 和 @AiService 的区别**
- **ChatModel** - 底层 API，直接调用模型
- **@AiService** - 高阶 API，声明式服务（底层也是调用 ChatModel）
- **关系**：@AiService 底层通过 ChatModel 实现

---

### 模块4：langchain4j-04low-high-api - 低级API与高级API

#### 4.1 模块概述
- **端口**: 9004
- **功能**: 演示 LangChain4j 的低级 API 和高级 API 的对比使用，包括 Token 用量统计
- **核心概念**: Low-Level API（底层 API）、High-Level API（高级 API）、AiServices、TokenUsage

#### 4.2 核心代码

**📋 流程总览**：
```
低级API：用户请求 → Controller注入ChatModel → chat()或chat(UserMessage) → 返回String或ChatResponse
高级API：用户请求 → Controller注入ChatAssistant → chat() → AiServices代理 → ChatModel → 返回String
```

**📊 完整调用流程图**：
```
低级API流程：
┌─────────────┐
│   用户请求   │ "你是谁"
└──────┬──────┘
       ▼
┌─────────────────────────┐
│   LowApiController      │ api01() 或 api02()
└──────┬──────────────────┘
       │ @Resource(name="qwen") 注入
       ▼
┌─────────────────────────┐
│    ChatModel            │ OpenAiChatModel 实例
└──────┬──────────────────┘
       │ .chat(prompt) 或 .chat(UserMessage)
       ▼
┌─────────────────────────┐
│   返回结果              │ String 或 ChatResponse
└─────────────────────────┘

高级API流程：
┌─────────────┐
│   用户请求   │ "你是谁"
└──────┬──────┘
       ▼
┌─────────────────────────┐
│  HighApiController      │ highApi()
└──────┬──────────────────┘
       │ @Resource 注入
       ▼
┌─────────────────────────┐
│  ChatAssistant          │ AiServices 生成的代理
│  (Proxy)                │
└──────┬──────────────────┘
       │ .chat(prompt)
       ▼
┌─────────────────────────┐
│    ChatModel            │ 内部调用
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ String
└─────────────────────────┘
```

---

**1️⃣ 定义接口：ChatAssistant.java**
```java
package com.atguigu.study.service;

/**
 * 声明式 AI 服务接口
 * 注意：这里没有 @AiService 注解，因为没用 Spring Boot Starter
 * 需要通过 AiServices.create() 手动创建
 */
public interface ChatAssistant
{
    String chat(String prompt);
}
```

**作用说明**：
- **接口定义** - 定义 AI 服务的方法签名
- **无 @AiService 注解** - 因为模块4没有使用 Spring Boot Starter
- **手动创建** - 需要在配置类中通过 `AiServices.create()` 显式创建

**关键点**：
- ✅ **无需注解** - 不需要 `@AiService` 注解
  - 与模块3不同，模块3使用 `@AiService` + Starter 自动扫描
  - 模块4使用 `AiServices.create()` 手动创建
- ✅ **方法签名** - `String chat(String prompt)` 简单直接
- ✅ **类似于 MyBatis Mapper** - 只需定义接口，框架生成实现

---

**2️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;

@Configuration
public class LLMConfig
{
    @Bean(name = "qwen")
    public ChatModel chatModelQwen()
    {
        return OpenAiChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-plus")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    @Bean(name = "deepseek")
    public ChatModel chatModelDeepSeek()
    {
        return OpenAiChatModel.builder()
                        .apiKey("sk-8bef83d468c848179422f7b1f1d8de86")
                        .modelName("deepseek-chat")
                        .baseUrl("https://api.deepseek.com/v1")
                .build();
    }

    // High-Api：手动创建 ChatAssistant（非 Spring Boot Starter 方式）
    @Bean
    public ChatAssistant chatAssistant(@Qualifier("qwen") ChatModel chatModelQwen)
    {
        return AiServices.create(ChatAssistant.class, chatModelQwen);
    }
}
```

**作用说明**：
- **Spring 配置类** - 使用 `@Configuration` 标注，启动时自动扫描
- **多模型配置** - 创建两个 ChatModel Bean（qwen、deepseek）
- **手动创建声明式服务** - 通过 `AiServices.create()` 创建 ChatAssistant
- **`@Qualifier`** - 指定使用哪个 ChatModel

**关键点**：
- ✅ **`@Bean(name = "xxx")`** - 为每个 Bean 指定名称
  - qwen: 通义千问模型
  - deepseek: DeepSeek 模型
- ✅ **`AiServices.create()`** - 手动创建声明式服务
  - 与模块3的 `@AiService` 不同
  - 适用于非 Spring Boot 项目或需要精确控制的场景
- ✅ **`@Qualifier("qwen")`** - 指定使用 qwen 模型
  - 因为有两个 ChatModel，需要明确指定

---

**3️⃣ 低级 API 控制器：LowApiController.java**

**接口1：简单调用**
```java
@RestController
@Slf4j
public class LowApiController
{
    @Resource(name = "qwen")
    private ChatModel chatModelQwen;

    @GetMapping(value = "/lowapi/api01")
    public String api01(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        String result = chatModelQwen.chat(prompt);
        System.out.println("通过langchain4j调用模型返回结果："+result);
        return result;
    }
}
```

**关键点**：
- **`chatModel.chat()`** - 直接调用，最简单的方式
- **返回 String** - 只获取文本内容
- **适用场景**：快速原型、简单对话

---

**接口2：Token 用量统计**
```java
@GetMapping(value = "/lowapi/api02")
public String api02(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
{
    // 使用 ChatResponse 获取完整响应对象
    ChatResponse chatResponse = chatModelDeepSeek.chat(UserMessage.from(prompt));

    String result = chatResponse.aiMessage().text();
    System.out.println("通过调用大模型返回结果："+result);

    // Token 用量计算的底层 API
    TokenUsage tokenUsage = chatResponse.tokenUsage();

    System.out.println("本次调用消耗的token："+tokenUsage);

    result = result +"\t\n"+tokenUsage;

    return result;
}
```

**关键点**：
- **`ChatResponse`** - 完整响应对象，包含更多信息
- **`UserMessage.from()`** - 将字符串包装为用户消息
- **`chatResponse.aiMessage().text()`** - 提取 AI 回复文本
- **`chatResponse.tokenUsage()`** - 获取 Token 使用情况
- **`TokenUsage`** - 包含输入 Token、输出 Token、总 Token 数
- **适用场景**：需要监控 Token 消耗、计费统计

---

**高级 API 控制器：HighApiController.java**
```java
@RestController
@Slf4j
public class HighApiController
{
    @Resource
    private ChatAssistant chatAssistant;

    @GetMapping(value = "/highapi/highapi")
    public String highApi(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        return chatAssistant.chat(prompt);
    }
}
```

**关键点**：
- **`chatAssistant.chat()`** - 声明式服务调用
- **代码简洁** - 像调用普通方法一样
- **底层实现** - 框架自动生成实现类，内部调用 ChatModel

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>
```

**关键点**：
- **`langchain4j-open-ai`** - 提供 OpenAiChatModel、ChatModel 等基础类
- **`langchain4j`** - 提供 AiServices、ChatResponse、TokenUsage 等高级类

#### 4.3 测试接口与返回
```
http://localhost:9004/lowapi/api01?prompt=你是谁
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

---

**接口2：低级 API - Token 用量统计**
```
http://localhost:9004/lowapi/api02?prompt=你是谁
```
**返回示例**：
```
你好！我是通义千问，由阿里巴巴通义实验室研发的大语言模型。

TokenUsage{inputTokenCount=10, outputTokenCount=35, totalTokenCount=45}
```
**响应时间**: 约 1.8 秒（DeepSeek 模型）

**Token 用量说明**：
- `inputTokenCount=10` - 输入 Token 数（用户问题）
- `outputTokenCount=35` - 输出 Token 数（AI 回答）
- `totalTokenCount=45` - 总 Token 数（输入 + 输出）

---

**接口3：高级 API - 声明式服务**
```
http://localhost:9004/highapi/highapi?prompt=你是谁
```
**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```
**响应时间**: 约 1.5 秒

#### 4.4 知识点总结

✅ **低级 API vs 高级 API**  
   - **低级 API**（Low-Level API）  
     - 直接操作 ChatModel  
     - 可以获取详细信息（ChatResponse、TokenUsage 等）  
     - 灵活性高，适合需要精细控制的场景  
     - 代码量较多，需要手动处理响应对象  
   - **高级 API**（High-Level API）  
     - 通过 AiServices 声明式调用  
     - 代码简洁，像调用普通方法一样  
     - 框架自动处理底层细节  
     - 适合企业级应用、快速开发  

✅ **AiServices.create() vs @AiService**  
   - **`AiServices.create()`**（模块4，非 Spring Boot）  
     - 手动创建声明式服务  
     - 需要在配置类中显式调用  
     - 适用于非 Spring Boot 项目  
   - **`@AiService`**（模块3，Spring Boot Starter）  
     - 自动扫描并创建  
     - 只需标注注解，Starter 自动处理  
     - 适用于 Spring Boot 项目  
   - **关系**：两者底层都是使用 AiServices，只是创建方式不同  

✅ **Token 用量统计**  
   - **`ChatResponse`** - 完整响应对象，包含 AI 消息、Token 用量等信息  
   - **`TokenUsage`** - Token 使用情况  
     - `inputTokenCount` - 输入 Token 数（用户问题）  
     - `outputTokenCount` - 输出 Token 数（AI 回答）  
     - `totalTokenCount` - 总 Token 数  
   - **应用场景**：计费统计、性能监控、成本控制  

✅ **两个依赖的作用**  
   - **`langchain4j-open-ai`**（基础依赖）  
     - 提供 OpenAiChatModel、ChatModel 等基础类  
     - 支持低级 API 调用  
   - **`langchain4j`**（高阶依赖）  
     - 提供 AiServices、ChatResponse、TokenUsage 等高级类  
     - 支持高级 API 调用  
   - **依赖关系**：`langchain4j` 依赖 `langchain4j-open-ai`  

#### 4.5 详细讲解

**工作流程**：
```
低级API流程：
1. 用户发起 HTTP 请求
   ↓
2. LowApiController 接收请求
   ↓
3. @Resource(name="qwen") 注入 ChatModel
   ↓
4. 调用 chatModel.chat(prompt) 或 chatModel.chat(UserMessage)
   ↓
5. LangChain4j 发送请求到大模型
   ↓
6. 返回 String 或 ChatResponse
   ↓
7. Controller 返回给用户

高级API流程：
1. Spring Boot 启动，扫描 @Configuration
   ↓
2. LLMConfig 创建 ChatModel Bean
   ↓
3. LLMConfig 通过 AiServices.create() 创建 ChatAssistant Bean
   ↓
4. 用户发起 HTTP 请求
   ↓
5. HighApiController 接收请求
   ↓
6. @Resource 注入 ChatAssistant（代理对象）
   ↓
7. 调用 chatAssistant.chat(prompt)
   ↓
8. 代理内部调用 ChatModel.chat()
   ↓
9. 返回 String
   ↓
10. Controller 返回给用户
```

**形象比喻**：
```
低级 API = 手动挡汽车
- 需要自己换挡、踩油门
- 可以精确控制每一个细节
- 适合赛车手、需要精细控制的场景
- 可以查看仪表盘（TokenUsage）

高级 API = 自动挡汽车
- 自动换挡，操作简单
- 专注于开车，不用关心细节
- 适合日常驾驶、快速出行
- 仪表盘被封装了（无法直接查看 TokenUsage）

AiServices.create() = 定制机器人
- 你需要告诉机器人要做什么（定义接口）
- 然后手动组装机器人（AiServices.create）
- 机器人会按照你的要求工作
- 灵活，但需要自己动手

@AiService = 智能机器人商店
- 你只需要下订单（定义接口 + @AiService）
- 商店自动给你装配好机器人（Starter 自动创建）
- 开箱即用，省时省力
```

**代码示例对比**：

**低级 API - 简单调用**：
```java
// 直接调用，返回 String
String result = chatModel.chat("你是谁");
```

**低级 API - 获取 Token 用量**：
```java
// 使用 ChatResponse 获取完整响应
ChatResponse response = chatModel.chat(UserMessage.from("你是谁"));
String result = response.aiMessage().text();
TokenUsage usage = response.tokenUsage();
System.out.println("Token用量: " + usage);
// 输出: TokenUsage{inputTokenCount=10, outputTokenCount=35, totalTokenCount=45}
```

**高级 API - 声明式服务**：
```java
// 像调用普通方法一样
String result = chatAssistant.chat("你是谁");
```

#### 4.6 低级 API vs 高级 API 详细对比

| 对比维度 | 低级 API（Low-Level） | 高级 API（High-Level） |
|---------|---------------------|----------------------|
| **调用方式** | `chatModel.chat()` | `chatAssistant.chat()` |
| **返回类型** | String / ChatResponse | String |
| **代码复杂度** | 较多（需处理响应对象） | ✅ 少（声明式） |
| **灵活性** | ✅ 高（可获取详细信息） | 中（框架封装） |
| **Token 统计** | ✅ 支持（ChatResponse.tokenUsage()） | ❌ 不支持（需额外配置） |
| **学习曲线** | 低（容易理解） | 中（需理解框架设计） |
| **适用场景** | 需要精细控制、监控 Token | 快速开发、企业级应用 |
| **示例代码** | LowApiController | HighApiController |

#### 4.7 AiServices.create() vs @AiService 详细对比

| 对比维度 | AiServices.create()（模块4） | @AiService（模块3） |
|---------|----------------------------|-------------------|
| **使用方式** | 手动创建 | 自动扫描 |
| **配置位置** | 配置类中显式调用 | 接口上标注注解 |
| **适用场景** | 非 Spring Boot 项目 | Spring Boot 项目 |
| **依赖要求** | langchain4j | langchain4j-spring-boot-starter |
| **代码示例** | `AiServices.create(ChatAssistant.class, chatModel)` | `@AiService` + 自动注入 |
| **灵活性** | ✅ 高（可以动态创建） | 中（启动时自动创建） |
| **学习曲线** | 低（容易理解） | 中（需理解 Starter） |

**代码对比**：

**模块4：AiServices.create()**
```java
// 配置类
@Bean
public ChatAssistant chatAssistant(@Qualifier("qwen") ChatModel chatModelQwen)
{
    return AiServices.create(ChatAssistant.class, chatModelQwen);
}

// 接口（无需注解）
public interface ChatAssistant {
    String chat(String prompt);
}
```

**模块3：@AiService**
```java
// 配置类（无需手动创建）
// Starter 自动扫描并创建

// 接口（需要注解）
@AiService
public interface ChatAssistant {
    String chat(String prompt);
}
```

**📖 详细讲解（新手必看）**：
- **为什么有两种方式？**  
  - `AiServices.create()` - 适用于任何 Java 项目（包括非 Spring Boot）  
  - `@AiService` - 专为 Spring Boot 设计，利用 Starter 自动配置  
- **如何选择？**  
  - 如果是 Spring Boot 项目 → 推荐 `@AiService`（更简洁）  
  - 如果是普通 Java 项目 → 只能用 `AiServices.create()`  

#### 4.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **低级 API 与高级 API 对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **低级 API** | ✅ ChatModel.chat() | ChatClient.prompt().call() | ChatClient.prompt().call() |
| **高级 API** | ✅ AiServices / @AiService | ❌ 不支持 | ❌ 不支持 |
| **Token 统计** | ✅ ChatResponse.tokenUsage() | ✅ ChatResponse.getMetadata() | ✅ ChatResponse.getMetadata() |
| **声明式服务** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **手动创建** | ✅ AiServices.create() | ❌ 不支持 | ❌ 不支持 |

#### **详细代码对比**

**1️⃣ LangChain4j（低级 API + 高级 API）**：
```java
// 低级 API
String result = chatModel.chat(prompt);  // 简单调用
ChatResponse response = chatModel.chat(UserMessage.from(prompt));  // 获取完整响应
TokenUsage usage = response.tokenUsage();  // Token 统计

// 高级 API
@AiService  // 或 AiServices.create()
public interface ChatAssistant {
    String chat(String prompt);
}
```

**📖 详细讲解**：
- LangChain4j 同时支持低级 API 和高级 API
- 低级 API 可以获取 Token 用量等详细信息
- 高级 API 通过声明式服务简化代码

---

**2️⃣ Spring AI（仅低级 API）**：
```java
// 低级 API
String result = chatClient.prompt(prompt).call().content();  // 简单调用
ChatResponse response = chatClient.prompt(prompt).call();  // 获取完整响应
Map<String, Object> metadata = response.getMetadata();  // 元数据（包含 Token）

// 高级 API
// ❌ Spring AI 不支持声明式服务
```

**📖 详细讲解**：
- Spring AI 只支持低级 API（ChatClient）
- 可以通过 `getMetadata()` 获取 Token 信息
- 不支持声明式服务

---

**3️⃣ Spring AI Alibaba（仅低级 API）**：
```java
// 低级 API
String result = chatClient.prompt(prompt).call().content();  // 简单调用
ChatResponse response = chatClient.prompt(prompt).call();  // 获取完整响应
Map<String, Object> metadata = response.getMetadata();  // 元数据（包含 Token）

// 高级 API
// ❌ Spring AI Alibaba 不支持声明式服务
```

**📖 详细讲解**：
- Spring AI Alibaba 只支持低级 API（ChatClient）
- 可以通过 `getMetadata()` 获取 Token 信息
- 不支持声明式服务

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| API 层次 | ✅ 低级 + 高级 | 仅低级 |
| 声明式服务 | ✅ 支持 | ❌ 不支持 |
| Token 统计 | ✅ 支持 | ✅ 支持 |
| 代码简洁度 | ✅ 高（高级 API） | 中（需手动调用） |
| 灵活性 | ✅ 高（两种 API 可选） | 中（仅一种 API） |
| 适用场景 | 企业级应用、复杂业务 | 快速原型、简单项目 |

**🎯 如何选择？**
- ✅ 需要声明式服务、代码简洁 → 推荐 **LangChain4j**
- ✅ 需要精细控制、监控 Token → 三个框架都支持
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 4.8 技术要点

**低级 API 的优势**：
- 🔍 **详细信息** - 可以获取 Token 用量、响应元数据等
- 🎯 **精细控制** - 可以自定义消息类型、系统提示等
- 📊 **监控统计** - 适合计费、性能监控场景

**高级 API 的优势**：
- 📝 **代码简洁** - 声明式编程，减少样板代码
- 🚀 **快速开发** - 框架自动处理底层细节
- 🔌 **易于扩展** - 可以轻松添加多个方法

**AiServices.create() 的优势**：
- 🌐 **跨框架** - 适用于任何 Java 项目
- 🔧 **灵活配置** - 可以动态创建多个实例
- 🎯 **精确控制** - 可以指定使用哪个 ChatModel

**适用场景**：
- ✅ 需要监控 Token 消耗 → 使用低级 API（ChatResponse）
- ✅ 快速开发、代码简洁 → 使用高级 API（AiServices）
- ✅ 非 Spring Boot 项目 → 使用 AiServices.create()
- ✅ Spring Boot 项目 → 使用 @AiService + Starter

**注意事项**：
- ⚠️ 低级 API 需要手动处理响应对象
- ⚠️ 高级 API 无法直接获取 Token 用量（需额外配置）
- ⚠️ AiServices.create() 需要手动管理生命周期

#### 4.9 常见问题

**问题1：为什么模块4不用 @AiService 注解？**
- **原因**：模块4没有引入 `langchain4j-spring-boot-starter` 依赖
- **解决方案**：使用 `AiServices.create()` 手动创建

**问题2：如何获取 Token 用量？**
- **方法**：使用 `ChatResponse` 而不是直接调用 `chatModel.chat()`
- **代码**：
  ```java
  ChatResponse response = chatModel.chat(UserMessage.from(prompt));
  TokenUsage usage = response.tokenUsage();
  ```

**问题3：低级 API 和高级 API 如何选择？**
- **低级 API** - 需要监控 Token、精细控制时使用
- **高级 API** - 快速开发、代码简洁时使用
- **建议**：大部分场景使用高级 API，特殊需求使用低级 API

---

### 模块5：langchain4j-05model-parameters - 模型参数配置

#### 5.1 模块概述
- **端口**: 9005
- **功能**: 演示 LangChain4j 的模型参数配置，包括日志、监听器、重试、超时等高级功能
- **核心概念**: ChatModelListener（监听器）、logRequests/logResponses（日志）、maxRetries（重试）、timeout（超时）

#### 5.2 核心代码

**📋 流程总览**：
```
用户请求 → Controller注入ChatModel → 调用chat() → 触发监听器onRequest() 
→ 发送请求到大模型 → 接收响应 → 触发监听器onResponse() → 返回结果
```

**📊 完整调用流程图**：
```
┌─────────────┐
│   用户请求   │ "你是谁"
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ ModelParameterController│ config() 方法
└──────┬──────────────────┘
       │ @Resource 注入
       ▼
┌─────────────────────────┐
│    ChatModel            │ 带监听器、日志、重试、超时配置
└──────┬──────────────────┘
       │ .chat(prompt)
       ▼
┌─────────────────────────┐
│ TestChatModelListener   │ onRequest() 触发
│ (监听器)                │ 生成 TraceID
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│  发送请求到大模型       │ 记录请求日志(DEBUG)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│  接收响应               │ 记录响应日志(DEBUG)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ TestChatModelListener   │ onResponse() 触发
│ (监听器)                │ 获取 TraceID
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ String
└─────────────────────────┘
```

---

**1️⃣ 实现工具/服务：TestChatModelListener.java**
```java
package com.atguigu.study.listener;

import cn.hutool.core.util.IdUtil;
import dev.langchain4j.model.chat.listener.ChatModelErrorContext;
import dev.langchain4j.model.chat.listener.ChatModelListener;
import dev.langchain4j.model.chat.listener.ChatModelRequestContext;
import dev.langchain4j.model.chat.listener.ChatModelResponseContext;
import lombok.extern.slf4j.Slf4j;

/**
 * 自定义 ChatModel 监听器
 * 用于链路追踪、性能监控、日志审计
 */
@Slf4j
public class TestChatModelListener implements ChatModelListener
{
    @Override
    public void onRequest(ChatModelRequestContext requestContext)
    {
        // onRequest配置的k:v键值对，在onResponse阶段可以获得，上下文传递参数好用
        String uuidValue = IdUtil.simpleUUID();
        requestContext.attributes().put("TraceID",uuidValue);
        log.info("请求参数requestContext:{}\t"+uuidValue, requestContext);
    }

    @Override
    public void onResponse(ChatModelResponseContext responseContext)
    {
        Object object = responseContext.attributes().get("TraceID");
        log.info("返回结果responseContext:{}", object);
    }

    @Override
    public void onError(ChatModelErrorContext errorContext)
    {
        log.error("请求异常ChatModelErrorContext:{}", errorContext);
    }
}
```

**作用说明**：
- **实现 `ChatModelListener` 接口** - 自定义监听器
- **三个生命周期方法** - onRequest、onResponse、onError
- **上下文参数传递** - 通过 attributes() 在请求和响应之间传递数据

**关键点**：
- ✅ **`onRequest()`** - 请求前触发
  - 生成唯一的 TraceID
  - 存入上下文 `requestContext.attributes().put("TraceID", uuidValue)`
  - 记录请求日志
- ✅ **`onResponse()`** - 响应后触发
  - 从上下文获取 TraceID `responseContext.attributes().get("TraceID")`
  - 记录响应日志
- ✅ **`onError()`** - 错误时触发
  - 记录错误信息
  - 可以用于告警、重试等逻辑
- ✅ **`attributes()`** - 上下文参数传递
  - 类似于 HTTP 请求中的 Session
  - 可以在请求和响应之间共享数据

---

**2️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import com.atguigu.study.listener.TestChatModelListener;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
public class LLMConfig
{
    @Bean(name = "qwen")
    public ChatModel chatModelQwen()
    {
        return OpenAiChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-plus")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .logRequests(true) // 日志级别设置为debug才有效
                .logResponses(true)// 日志级别设置为debug才有效
                .listeners(List.of(new TestChatModelListener()))
                .maxRetries(2)
                .timeout(Duration.ofSeconds(2))//向大模型发送请求时，如在指定时间内没有收到响应，该请求将被中断并报request timed out
                .build();
    }
}
```

**作用说明**：
- **Spring 配置类** - 使用 `@Configuration` 标注
- **创建 ChatModel Bean** - 配置各种高级参数
- **监听器注册** - 通过 `.listeners()` 注册自定义监听器

**关键点**：
- ✅ **`logRequests(true)`** - 记录请求日志
  - 需要设置日志级别为 DEBUG 才生效
  - 可以看到发送给模型的完整请求
- ✅ **`logResponses(true)`** - 记录响应日志
  - 需要设置日志级别为 DEBUG 才生效
  - 可以看到模型返回的完整响应
- ✅ **`listeners()`** - 注册监听器
  - `List.of(new TestChatModelListener())`
  - 可以注册多个监听器
- ✅ **`maxRetries(2)`** - 重试机制
  - 失败后最多重试 2 次
  - 提高系统容错能力
- ✅ **`timeout(Duration.ofSeconds(2))`** - 超时控制
  - 2 秒内未收到响应则中断
  - 防止长时间等待

---

**监听器：TestChatModelListener.java**
```java
@Slf4j
public class TestChatModelListener implements ChatModelListener
{
    @Override
    public void onRequest(ChatModelRequestContext requestContext)
    {
        // onRequest配置的k:v键值对，在onResponse阶段可以获得，上下文传递参数好用
        String uuidValue = IdUtil.simpleUUID();
        requestContext.attributes().put("TraceID",uuidValue);
        log.info("请求参数requestContext:{}", requestContext+"\t"+uuidValue);
    }

    @Override
    public void onResponse(ChatModelResponseContext responseContext)
    {
        Object object = responseContext.attributes().get("TraceID");
        log.info("返回结果responseContext:{}", object);
    }

    @Override
    public void onError(ChatModelErrorContext errorContext)
    {
        log.error("请求异常ChatModelErrorContext:{}", errorContext);
    }
}
```

**关键点**：
- **实现 `ChatModelListener` 接口** - 自定义监听器
- **`onRequest()`** - 请求前触发，可以传递上下文参数（如 TraceID）
- **`onResponse()`** - 响应后触发，可以获取上下文参数
- **`onError()`** - 错误时触发，可以记录错误信息
- **`attributes()`** - 用于在请求和响应之间传递上下文数据
- **应用场景**：链路追踪、性能监控、日志审计

---

**控制器：ModelParameterController.java**
```java
@RestController
@Slf4j
public class ModelParameterController
{
    @Resource
    private ChatModel chatModelQwen;

    // http://localhost:9005/modelparam/config
    @GetMapping(value = "/modelparam/config")
    public String config(@RequestParam(value = "prompt", defaultValue = "你是谁") String prompt)
    {
        String result = chatModelQwen.chat(prompt);
        System.out.println("通过langchain4j调用模型返回结果："+result);
        return result;
    }
}
```

**关键点**：
- **简单调用** - 与之前的模块相同
- **后台会打印日志** - 因为配置了 logRequests 和 logResponses
- **监听器会执行** - 会在控制台打印 TraceID

---

**配置文件：application.properties**
```properties
server.port=9005

spring.application.name=langchain4j-05model-parameters

# 只有日志级别调整为debug级别，同时配置以上 langchain 日志输出开关才有效
logging.level.dev.langchain4j = DEBUG
```

**关键点**：
- **`logging.level.dev.langchain4j = DEBUG`** - 必须设置为 DEBUG 级别，日志和监听器才生效

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- hutool（用于生成 UUID） -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.22</version>
</dependency>
```

**关键点**：
- **新增了 `hutool-all` 依赖** - 用于生成 UUID（TraceID）

#### 5.3 测试接口与返回

**接口**：模型参数配置测试
```
http://localhost:9005/modelparam/config?prompt=你是谁
```

**返回示例**：
```
你好！我是 Qwen（通义千问），由阿里巴巴通义实验室研发的超大规模语言模型。我可以帮助你回答问题、创作文字、进行逻辑推理、编程等任务。有什么我可以帮助你的吗？
```

**响应时间**: 约 1.5 秒

**控制台日志输出**：
```
# 监听器 onRequest
请求参数requestContext:ChatModelRequestContext{...}	a1b2c3d4e5f6...

# LangChain4j 请求日志（DEBUG级别）
Request: {...}

# LangChain4j 响应日志（DEBUG级别）
Response: {...}

# 监听器 onResponse
返回结果responseContext:a1b2c3d4e5f6...
```

**日志说明**：
- 监听器的 `onRequest()` 和 `onResponse()` 会被触发
- TraceID 在两个方法之间传递，用于链路追踪
- LangChain4j 的请求和响应日志也会打印（DEBUG级别）

#### 5.4 知识点总结

✅ **ChatModelListener 监听器**  
   - 可以在请求前、响应后、错误时执行自定义逻辑  
   - 通过 `attributes()` 传递上下文参数（类似 TraceID）  
   - 三个方法：`onRequest()`、`onResponse()`、`onError()`  
   - 应用场景：链路追踪、性能监控、日志审计  

✅ **日志配置**  
   - `logRequests(true)` - 记录发送给模型的请求  
   - `logResponses(true)` - 记录模型返回的响应  
   - **注意**：需要设置日志级别为 DEBUG 才生效  
   - 配置方式：`logging.level.dev.langchain4j = DEBUG`  

✅ **重试机制**  
   - `maxRetries(2)` - 失败后最多重试 2 次  
   - 应用场景：网络不稳定、临时故障  
   - 提高系统的容错能力  

✅ **超时控制**  
   - `timeout(Duration.ofSeconds(2))` - 2 秒内未收到响应则中断  
   - 应用场景：防止长时间等待、快速失败  
   - 避免资源浪费  

✅ **上下文参数传递**  
   - `requestContext.attributes().put("key", value)` - 设置参数  
   - `responseContext.attributes().get("key")` - 获取参数  
   - 类似于 HTTP 请求中的 Header 或 Session  

#### 5.5 监听器详细讲解

**监听器的生命周期**：
```
用户请求
  ↓
onRequest()  ← 请求前触发（可以设置 TraceID）
  ↓
发送请求到大模型
  ↓
接收响应
  ↓
onResponse()  ← 响应后触发（可以获取 TraceID）
  ↓
返回给用户

如果出错：
  ↓
onError()  ← 错误时触发
```

**形象比喻**：
```
监听器 = 快递跟踪系统

onRequest() = 快递员取件（生成运单号 TraceID）
  ↓
运输过程 = 发送请求到大模型
  ↓
onResponse() = 快递送达（根据运单号确认签收）
  ↓
onError() = 快递丢失/损坏（记录异常信息）

通过运单号（TraceID），可以追踪整个快递流程！
```

**代码示例**：
```java
@Override
public void onRequest(ChatModelRequestContext requestContext)
{
    // 生成唯一的 TraceID
    String traceId = IdUtil.simpleUUID();
    
    // 将 TraceID 存入上下文
    requestContext.attributes().put("TraceID", traceId);
    
    // 记录请求日志
    log.info("[{}] 开始请求: {}", traceId, requestContext.request());
}

@Override
public void onResponse(ChatModelResponseContext responseContext)
{
    // 从上下文获取 TraceID
    String traceId = (String) responseContext.attributes().get("TraceID");
    
    // 记录响应日志
    log.info("[{}] 请求成功", traceId);
}

@Override
public void onError(ChatModelErrorContext errorContext)
{
    // 从上下文获取 TraceID
    String traceId = (String) errorContext.attributes().get("TraceID");
    
    // 记录错误日志
    log.error("[{}] 请求失败: {}", traceId, errorContext.error().getMessage());
}
```

#### 5.6 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **模型参数配置对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **监听器** | ✅ ChatModelListener | ❌ 不支持 | ❌ 不支持 |
| **日志配置** | ✅ logRequests/logResponses | ✅ 需配置 LoggingAdvisor | ✅ 需配置 LoggingAdvisor |
| **重试机制** | ✅ maxRetries | ✅ RetryTemplate | ✅ RetryTemplate |
| **超时控制** | ✅ timeout | ✅ timeout | ✅ timeout |
| **上下文传递** | ✅ attributes() | ❌ 不支持 | ❌ 不支持 |

#### **详细代码对比**

**1️⃣ LangChain4j（监听器 + 日志 + 重试 + 超时）**：
```java
OpenAiChatModel.builder()
    .apiKey("sk-xxx")
    .modelName("qwen-plus")
    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
    .logRequests(true)  // 记录请求日志
    .logResponses(true) // 记录响应日志
    .listeners(List.of(new TestChatModelListener())) // 添加监听器
    .maxRetries(2)      // 重试 2 次
    .timeout(Duration.ofSeconds(2)) // 超时 2 秒
    .build();
```

**📖 详细讲解**：
- LangChain4j 提供了最丰富的参数配置选项
- 支持监听器，可以在请求前后执行自定义逻辑
- 支持上下文参数传递（attributes）
- 配置简洁，链式调用

---

**2️⃣ Spring AI（重试 + 超时）**：
```java
// 通过 RetryTemplate 配置重试
RetryTemplate retryTemplate = RetryTemplate.builder()
    .maxAttempts(3)
    .fixedBackoff(1000)
    .build();

// 通过 timeout 配置超时
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(new RetryAdvisor(retryTemplate))
    .build();

// 日志需要通过 LoggingAdvisor
chatClient.prompt(prompt)
    .advisors(new LoggingAdvisor())
    .call()
    .content();
```

**📖 详细讲解**：
- Spring AI 不支持监听器
- 重试需要通过 RetryTemplate 配置
- 日志需要通过 LoggingAdvisor
- 配置相对复杂

---

**3️⃣ Spring AI Alibaba（重试 + 超时）**：
```java
// 与 Spring AI 相同，通过 RetryTemplate 和 Advisor 配置
RetryTemplate retryTemplate = RetryTemplate.builder()
    .maxAttempts(3)
    .fixedBackoff(1000)
    .build();

ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(new RetryAdvisor(retryTemplate))
    .build();
```

**📖 详细讲解**：
- Spring AI Alibaba 不支持监听器
- 重试需要通过 RetryTemplate 配置
- 配置相对复杂

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| 监听器支持 | ✅ 支持 | ❌ 不支持 |
| 日志配置 | ✅ 简单（布尔值） | 中（需 Advisor） |
| 重试配置 | ✅ 简单（maxRetries） | 中（需 RetryTemplate） |
| 超时配置 | ✅ 简单（timeout） | ✅ 简单（timeout） |
| 上下文传递 | ✅ 支持（attributes） | ❌ 不支持 |
| 配置复杂度 | ✅ 低（链式调用） | 中（需多个组件） |
| 灵活性 | ✅ 高（监听器） | 中（Advisor） |

**🎯 如何选择？**
- ✅ 需要监听器、链路追踪 → 推荐 **LangChain4j**
- ✅ 需要简单的重试和超时 → 三个框架都支持
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 5.7 技术要点

**监听器的优势**：
- 🔍 **链路追踪** - 可以追踪每个请求的完整生命周期
- 📊 **性能监控** - 可以记录请求耗时、Token 用量等
- 🐛 **问题排查** - 可以快速定位问题（通过 TraceID）
- 📝 **日志审计** - 可以记录所有请求和响应

**日志配置的优势**：
- 📋 **调试方便** - 可以看到发送给模型的完整请求
- 🔍 **问题排查** - 可以看到模型返回的完整响应
- 📊 **性能分析** - 可以分析请求和响应的内容

**重试机制的优势**：
- 🔄 **提高稳定性** - 网络波动时自动重试
- 💪 **容错能力** - 临时故障不影响用户体验
- ⚙️ **可配置** - 可以自定义重试次数

**超时控制的优势**：
- ⏱️ **防止阻塞** - 避免长时间等待
- 💰 **节省成本** - 避免无效请求消耗 Token
- 🚀 **快速失败** - 及时返回错误信息

**适用场景**：
- ✅ 生产环境 → 建议启用监听器、日志、重试、超时
- ✅ 开发环境 → 建议启用日志，方便调试
- ✅ 测试环境 → 建议启用所有功能，全面监控

**注意事项**：
- ⚠️ 日志级别必须设置为 DEBUG，否则日志和监听器不生效
- ⚠️ 监听器会影响性能，生产环境建议异步记录日志
- ⚠️ 超时时间不宜过短，否则容易误判
- ⚠️ 重试次数不宜过多，否则会加重服务器负担

#### 5.8 常见问题

**问题1：为什么监听器没有触发？**
- **原因**：日志级别不是 DEBUG
- **解决方案**：在 application.properties 中添加 `logging.level.dev.langchain4j = DEBUG`

**问题2：如何获取 TraceID？**
- **方法**：在 `onRequest()` 中生成并存储，在 `onResponse()` 中获取
- **代码**：
  ```java
  // onRequest
  requestContext.attributes().put("TraceID", uuid);
  
  // onResponse
  String traceId = (String) responseContext.attributes().get("TraceID");
  ```

**问题3：重试机制如何工作？**
- **原理**：请求失败后，自动重新发送请求，最多重试 `maxRetries` 次
- **适用场景**：网络波动、临时故障
- **不适用场景**：API Key 错误、模型不存在等永久性错误

**问题4：超时时间设置多少合适？**
- **建议**：根据模型响应时间设置，一般 5-30 秒
- **参考**：
  - 简单对话：5-10 秒
  - 复杂任务：10-30 秒
  - 流式输出：30-60 秒

---

### 模块6：langchain4j-06chat-image - 图像对话

#### 6.1 模块概述
- **端口**: 9006
- **功能**: 演示 LangChain4j 的图像对话能力，包括图片理解（多模态）和图片生成
- **核心概念**: 多模态模型（qwen-vl-max）、通义万象（WanxImageModel）、Base64编码、ImageContent

#### 6.2 核心代码

**📋 流程总览**：
```
图片理解：用户请求 → Controller读取图片 → Base64编码 → 创建UserMessage(文本+图片) 
→ ChatModel.chat() → qwen-vl-max识别 → 返回描述

图片生成：用户请求 → Controller调用WanxImageModel.generate() → wanx模型生成 
→ 返回图片URL
```

**📊 完整调用流程图**：
```
图片理解流程：
┌─────────────┐
│   用户请求   │ /image/call
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ ImageModelController    │ readImageContent()
└──────┬──────────────────┘
       │ @Value 读取图片资源
       ▼
┌─────────────────────────┐
│  Base64 编码            │ 图片转字符串
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│  UserMessage            │ TextContent + ImageContent
└──────┬──────────────────┘
       │ chatModel.chat(userMessage)
       ▼
┌─────────────────────────┐
│ qwen-vl-max 模型        │ 多模态识别
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回描述              │ String
└─────────────────────────┘

图片生成流程：
┌─────────────┐
│   用户请求   │ /image/create2
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ WanxImageModelController│ createImageContent2()
└──────┬──────────────────┘
       │ wanxImageModel.generate("美女")
       ▼
┌─────────────────────────┐
│ wanx2.1-t2i-turbo 模型  │ 根据文本生成图片
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回图片URL           │ Response<Image>
└─────────────────────────┘
```

---

**1️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import dev.langchain4j.community.model.dashscope.WanxImageModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LLMConfig
{
    // 多模态模型：用于图片理解
    @Bean
    public ChatModel ImageModel() {
        return OpenAiChatModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                // qwen-vl-max 是一个多模态大模型，支持图片和文本的结合输入
                .modelName("qwen-vl-max")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    // 通义万象模型：用于图片生成
    @Bean
    public WanxImageModel wanxImageModel()
    {
        return WanxImageModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .modelName("wanx2.1-t2i-turbo") // 图片生成模型
                .build();
    }
}
```

**作用说明**：
- **Spring 配置类** - 创建两个 Bean
- **多模态模型** - qwen-vl-max 用于图片理解
- **图片生成模型** - wanx2.1-t2i-turbo 用于图片生成

**关键点**：
- ✅ **`qwen-vl-max`** - 多模态模型
  - 可以识别图片内容并回答问题
  - 支持 OCR、图片描述、视觉问答
- ✅ **`wanx2.1-t2i-turbo`** - 通义万象模型
  - 可以根据文本描述生成图片
  - Text-to-Image（文生图）
- ✅ **两个不同的模型** - 各司其职
  - 一个用于理解图片（输入图片）
  - 一个用于生成图片（输出图片）

---

**2️⃣ 控制器使用（图片理解）：ImageModelController.java**
```java
@RestController
@Slf4j
public class ImageModelController
{
    @Autowired
    private ChatModel chatModel;

    @Value("classpath:static/images/mi.jpg")
    private Resource resource; // 图片资源

    @GetMapping(value = "/image/call")
    public String readImageContent() throws IOException
    {
        // 第一步：图片转 Base64 编码
        byte[] byteArray = resource.getContentAsByteArray();
        String base64Data = Base64.getEncoder().encodeToString(byteArray);

        // 第二步：创建 UserMessage（包含文本 + 图片）
        UserMessage userMessage = UserMessage.from(
                TextContent.from("从下面图片种获取来源网站名称，股价走势和5月30号股价"),
                ImageContent.from(base64Data, "image/jpg")
        );

        // 第三步：调用模型
        ChatResponse chatResponse = chatModel.chat(userMessage);

        // 第四步：解析响应
        String result = chatResponse.aiMessage().text();

        System.out.println(result);
        return result;
    }
}
```

**关键点**：
- **Base64 编码** - 将图片转换为字符串格式
- **`TextContent`** - 文本提示词，告诉模型要做什么
- **`ImageContent`** - 图片内容，Base64 编码后的图片
- **`UserMessage.from()`** - 组合文本和图片，形成多模态输入
- **应用场景**：OCR、图片描述、视觉问答

---

**图片生成控制器：WanxImageModelController.java**

**接口1：使用 WanxImageModel 生成图片**
```java
@RestController
@Slf4j
public class WanxImageModelController
{
    @Autowired
    private WanxImageModel wanxImageModel;

    @GetMapping(value = "/image/create2")
    public String createImageContent2() throws IOException
    {
        Response<Image> imageResponse = wanxImageModel.generate("美女");
        
        System.out.println(imageResponse.content().url());
        
        return imageResponse.content().url().toString();
    }
}
```

**关键点**：
- **`wanxImageModel.generate()`** - 根据文本描述生成图片
- **返回 `Response<Image>`** - 包含生成的图片 URL
- **简单直接** - 一行代码即可生成图片

---

**接口2：使用 DashScope 原生 API 生成图片**
```java
@GetMapping(value = "/image/create3")
public String createImageContent3() throws IOException
{
    String prompt = "近景镜头，18岁的中国女孩，古代服饰，圆脸，正面看着镜头，" +
            "民族优雅的服装，商业摄影，室外，电影级光照，半身特写，精致的淡妆，锐利的边缘。";
    
    ImageSynthesisParam param = ImageSynthesisParam.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .model(ImageSynthesis.Models.WANX_V1)
                .prompt(prompt)
                .style("<watercolor>")
                .n(1)
                .size("1024*1024")
            .build();

    ImageSynthesis imageSynthesis = new ImageSynthesis();
    ImageSynthesisResult result = imageSynthesis.call(param);

    System.out.println(JsonUtils.toJson(result));
    
    return JsonUtils.toJson(result);
}
```

**关键点**：
- **`ImageSynthesisParam`** - 图片生成参数
- **`style`** - 图片风格（如水彩画）
- **`n`** - 生成图片数量
- **`size`** - 图片尺寸
- **DashScope 原生 API** - 不通过 LangChain4j，直接调用阿里云 API

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- DashScope (Qwen) 接入阿里云百炼平台 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-community-dashscope-spring-boot-starter</artifactId>
</dependency>

<!-- hutool -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.22</version>
</dependency>
```

**关键点**：
- **新增了 `langchain4j-community-dashscope-spring-boot-starter`** - 社区提供的 DashScope 集成
- **提供了 `WanxImageModel`** - 通义万象图片生成模型

#### 6.3 测试接口与返回

**接口1：图片理解**
```
http://localhost:9006/image/call
```

**返回示例**：
```
图片来源网站：东方财富网

股价走势：该股票在近期呈现上涨趋势，从5月初的约XX元上涨至5月30日的XX元。

5月30日股价：XX元
```

**响应时间**: 约 3-5 秒（图片理解需要较长时间）

**说明**：
- 模型会识别图片中的内容
- 提取网站名称、股价信息
- 回答用户的问题

---

**接口2：图片生成（LangChain4j）**
```
http://localhost:9006/image/create2
```

**返回示例**：
```
https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com/xxx/xxx.png
```

**响应时间**: 约 5-10 秒（图片生成需要较长时间）

**说明**：
- 返回生成的图片 URL
- 可以直接在浏览器中访问查看图片
- 图片会保存在阿里云 OSS 上

---

**接口3：图片生成（DashScope 原生 API）**
```
http://localhost:9006/image/create3
```

**返回示例**：
```json
{
  "output": {
    "task_id": "xxx",
    "task_status": "SUCCEEDED",
    "results": [
      {
        "url": "https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com/xxx/xxx.png"
      }
    ]
  },
  "usage": {
    "image_count": 1
  }
}
```

**响应时间**: 约 5-10 秒

**说明**：
- 返回完整的 JSON 结果
- 包含任务 ID、状态、图片 URL 等信息
- 可以获取更多详细信息

#### 6.4 知识点总结

✅ **多模态模型（Multimodal Model）**  
   - qwen-vl-max 支持图片和文本的结合输入  
   - 可以识别图片中的内容并回答问题  
   - 应用场景：OCR、图片描述、视觉问答、文档分析  

✅ **Base64 编码**  
   - 将图片转换为字符串格式  
   - 通过 `ImageContent.from(base64Data, "image/jpg")` 传递给模型  
   - 优点：可以在 HTTP 请求中传输图片  
   - 缺点：文件大小会增加约 33%  

✅ **UserMessage 组合**  
   - `TextContent` - 文本提示词  
   - `ImageContent` - 图片内容  
   - 两者结合形成多模态输入  
   - 模型可以同时理解文本和图片  

✅ **通义万象（WanxImageModel）**  
   - 阿里云的图片生成模型  
   - 通过文本描述生成图片  
   - 支持多种风格（水彩画、油画、素描等）  
   - 返回图片 URL  

✅ **两种图片生成方式**  
   - **LangChain4j 封装** - 简单直接，一行代码  
   - **DashScope 原生 API** - 更灵活，可以配置更多参数  

#### 6.5 图片理解详细讲解

**图片理解的流程**：
```
1. 加载图片文件
   ↓
2. 转换为 Base64 编码
   ↓
3. 创建 ImageContent（图片内容）
   ↓
4. 创建 TextContent（文本提示）
   ↓
5. 组合成 UserMessage
   ↓
6. 发送给多模态模型
   ↓
7. 模型分析图片并返回结果
   ↓
8. 解析响应并展示
```

**形象比喻**：
```
图片理解 = 给 AI 看照片并提问

步骤：
1. 准备照片（图片文件）
2. 把照片数字化（Base64 编码）
3. 写下问题（TextContent）
4. 把照片和问题一起交给 AI（UserMessage）
5. AI 看照片并回答问题（模型处理）
6. 得到答案（解析响应）

就像你给朋友看照片并问："这张照片里有什么？"
```

**代码示例**：
```java
// 1. 加载图片
Resource resource = new ClassPathResource("static/images/mi.jpg");
byte[] byteArray = resource.getContentAsByteArray();

// 2. Base64 编码
String base64Data = Base64.getEncoder().encodeToString(byteArray);

// 3. 创建图片内容
ImageContent imageContent = ImageContent.from(base64Data, "image/jpg");

// 4. 创建文本提示
TextContent textContent = TextContent.from("请描述这张图片的内容");

// 5. 组合成 UserMessage
UserMessage userMessage = UserMessage.from(textContent, imageContent);

// 6. 调用模型
ChatResponse response = chatModel.chat(userMessage);

// 7. 获取结果
String result = response.aiMessage().text();
```

#### 6.6 图片生成详细讲解

**图片生成的流程**：
```
1. 编写文本描述（Prompt）
   ↓
2. 配置生成参数（风格、尺寸、数量）
   ↓
3. 调用图片生成模型
   ↓
4. 等待生成完成
   ↓
5. 获取图片 URL
   ↓
6. 访问 URL 查看图片
```

**形象比喻**：
```
图片生成 = 让 AI 画家根据你的描述画画

步骤：
1. 告诉画家你想要什么（Prompt）
   - "画一个美女"
   - "画一幅水彩画风格的风景"
2. 指定画布大小（size）
   - 1024*1024
3. 指定画风（style）
   - 水彩画、油画、素描
4. 画家开始作画（模型生成）
5. 完成后给你看（返回 URL）

就像你请画家画画一样！
```

**两种方式对比**：

**方式1：LangChain4j 封装（推荐）**
```java
WanxImageModel wanxImageModel = WanxImageModel.builder()
    .apiKey("sk-xxx")
    .modelName("wanx2.1-t2i-turbo")
    .build();

Response<Image> response = wanxImageModel.generate("美女");
String imageUrl = response.content().url().toString();
```

**优点**：
- ✅ 代码简洁
- ✅ 易于使用
- ✅ 统一 API 风格

**缺点**：
- ❌ 配置选项较少

---

**方式2：DashScope 原生 API**
```java
ImageSynthesisParam param = ImageSynthesisParam.builder()
    .apiKey("sk-xxx")
    .model(ImageSynthesis.Models.WANX_V1)
    .prompt("美女")
    .style("<watercolor>")
    .n(1)
    .size("1024*1024")
    .build();

ImageSynthesis imageSynthesis = new ImageSynthesis();
ImageSynthesisResult result = imageSynthesis.call(param);
```

**优点**：
- ✅ 配置选项丰富
- ✅ 可以控制更多细节
- ✅ 返回更多信息

**缺点**：
- ❌ 代码复杂
- ❌ 需要处理更多细节

#### 6.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **图像能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **图片理解** | ✅ 支持（多模态模型） | ✅ 支持（多模态模型） | ✅ 支持（多模态模型） |
| **图片生成** | ✅ 支持（WanxImageModel） | ❌ 不支持 | ✅ 支持（DashScope API） |
| **Base64 编码** | ✅ 内置支持 | ✅ 需手动处理 | ✅ 需手动处理 |
| **ImageContent** | ✅ 内置类 | ❌ 需自定义 | ❌ 需自定义 |
| **社区集成** | ✅ langchain4j-community-dashscope | ❌ 无 | ✅ 官方支持 |

#### **详细代码对比**

**1️⃣ LangChain4j（图片理解 + 图片生成）**：
```java
// 图片理解
UserMessage userMessage = UserMessage.from(
    TextContent.from("描述这张图片"),
    ImageContent.from(base64Data, "image/jpg")
);
ChatResponse response = chatModel.chat(userMessage);

// 图片生成
WanxImageModel wanxModel = WanxImageModel.builder()
    .apiKey("sk-xxx")
    .modelName("wanx2.1-t2i-turbo")
    .build();
Response<Image> imageResponse = wanxModel.generate("美女");
```

**📖 详细讲解**：
- LangChain4j 同时支持图片理解和图片生成
- 图片理解通过多模态模型实现
- 图片生成通过 WanxImageModel 实现
- 社区提供了 DashScope 集成

---

**2️⃣ Spring AI（仅图片理解）**：
```java
// 图片理解
UserMessage userMessage = UserMessage.builder()
    .text("描述这张图片")
    .media(MediaType.IMAGE_JPEG, base64Data)
    .build();
ChatResponse response = chatClient.prompt(userMessage).call();

// 图片生成
// ❌ Spring AI 不支持图片生成
```

**📖 详细讲解**：
- Spring AI 支持图片理解
- 需要通过 `UserMessage.builder()` 构建消息
- 不支持图片生成

---

**3️⃣ Spring AI Alibaba（图片理解 + 图片生成）**：
```java
// 图片理解（与 Spring AI 相同）
UserMessage userMessage = UserMessage.builder()
    .text("描述这张图片")
    .media(MediaType.IMAGE_JPEG, base64Data)
    .build();
ChatResponse response = chatClient.prompt(userMessage).call();

// 图片生成（通过 DashScope API）
ImageSynthesisParam param = ImageSynthesisParam.builder()
    .apiKey("sk-xxx")
    .model(ImageSynthesis.Models.WANX_V1)
    .prompt("美女")
    .build();
ImageSynthesis imageSynthesis = new ImageSynthesis();
ImageSynthesisResult result = imageSynthesis.call(param);
```

**📖 详细讲解**：
- Spring AI Alibaba 支持图片理解和图片生成
- 图片理解通过多模态模型实现
- 图片生成需要直接使用 DashScope API

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI | Spring AI Alibaba |
|---------|-------------|-----------|-------------------|
| 图片理解 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 图片生成 | ✅ 支持（封装好） | ❌ 不支持 | ✅ 支持（需原生 API） |
| API 简洁度 | ✅ 高 | 中 | 中 |
| 社区支持 | ✅ 有社区集成 | ❌ 无 | ✅ 官方支持 |
| 灵活性 | ✅ 高 | 中 | ✅ 高 |

**🎯 如何选择？**
- ✅ 需要图片生成 + 简洁 API → 推荐 **LangChain4j**
- ✅ 仅需图片理解 → 三个框架都支持
- ✅ Spring 生态深度集成 → 推荐 **Spring AI Alibaba**

#### 6.8 技术要点

**图片理解的要点**：
- 🖼️ **图片格式** - 支持 JPG、PNG 等常见格式
- 📏 **图片大小** - 建议不超过 10MB，否则会影响性能
- 🔤 **Base64 编码** - 必须正确编码，否则模型无法识别
- 💬 **提示词** - 清晰的提示词可以获得更好的结果

**图片生成的要点**：
- ✍️ **Prompt 质量** - 详细的描述可以生成更好的图片
- 🎨 **风格选择** - 不同风格适合不同场景
- 📐 **尺寸选择** - 根据需求选择合适的尺寸
- ⏱️ **生成时间** - 通常需要 5-10 秒，需要耐心等待

**多模态模型的优势**：
- 👁️ **视觉理解** - 可以识别图片中的物体、文字、场景
- 📝 **图文结合** - 可以同时理解文本和图片
- 🎯 **精准回答** - 基于图片内容回答问题
- 🌐 **广泛应用** - OCR、文档分析、医疗影像等

**适用场景**：
- ✅ 图片理解：OCR、文档分析、医疗影像、工业检测
- ✅ 图片生成：艺术设计、广告创意、游戏素材、教育插图

**注意事项**：
- ⚠️ 图片理解需要多模态模型（如 qwen-vl-max）
- ⚠️ 图片生成需要专门的模型（如 wanx2.1-t2i-turbo）
- ⚠️ Base64 编码会增加文件大小
- ⚠️ 图片生成需要较长时间，建议异步处理

#### 6.9 常见问题

**问题1：为什么图片理解返回空结果？**
- **原因**：可能是图片格式错误或 Base64 编码错误
- **解决方案**：检查图片文件格式和编码方式

**问题2：如何优化图片理解的效果？**
- **方法**：
  1. 使用清晰的提示词
  2. 确保图片质量良好
  3. 选择合适的多模态模型

**问题3：图片生成的 URL 有效期多久？**
- **答案**：通常有效期为 24-72 小时，建议及时下载保存

**问题4：如何批量生成图片？**
- **方法**：循环调用 `generate()` 方法，注意控制并发数量

---

### 模块7：langchain4j-07chat-stream - 流式对话

#### 7.1 模块概述
- **端口**: 9007
- **功能**: 演示 LangChain4j 的流式对话能力，实现类似 ChatGPT 的逐字输出效果
- **核心概念**: StreamingChatModel、Flux、TokenStream、流式响应、响应式编程

#### 7.2 核心代码

**📋 流程总览**：
```
同步对话：用户请求 → Controller注入ChatModel → chat() → 等待完整响应 → 返回String
流式对话：用户请求 → Controller注入StreamingChatModel → chat(handler) → onPartialResponse()逐字返回 → Flux发射
```

**📊 完整调用流程图**：
```
流式对话流程：
┌─────────────┐
│   用户请求   │ /chatstream/chat?prompt=xxx
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ StreamingChatModelCtrl  │ chat() 方法
└──────┬──────────────────┘
       │ Flux.create()
       ▼
┌─────────────────────────┐
│ StreamingChatModel      │ .chat(prompt, handler)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ onPartialResponse()     │ 逐字接收部分响应
│ (回调)                  │ emitter.next(partial)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│  Flux 发射数据          │ 前端逐字显示
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ onCompleteResponse()    │ 流完成
│ (回调)                  │ emitter.complete()
└─────────────────────────┘
```

---

**1️⃣ 定义接口：ChatAssistant.java**
```java
@Configuration
public class LLMConfig
{
    // 普通对话模型（同步）
    @Bean(name = "qwen")
    public ChatModel chatModelQwen()
    {
        return OpenAiChatModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    // 流式对话模型（异步）
    @Bean
    public StreamingChatModel streamingChatModel(){
        return OpenAiStreamingChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-plus")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    // 使用 AiServices.create() 创建 ChatAssistant
    @Bean
    public ChatAssistant chatAssistant(StreamingChatModel streamingChatModel){
        return AiServices.create(ChatAssistant.class, streamingChatModel);
    }
}
```

**关键点**：
- **`ChatModel` vs `StreamingChatModel`** - 两个不同的接口
  - `ChatModel` - 同步调用，等待完整响应
  - `StreamingChatModel` - 异步调用，逐字返回
- **`OpenAiStreamingChatModel`** - 支持流式响应的模型实现
- **`AiServices.create()`** - 手动创建声明式服务（非 Spring Boot Starter 方式）

**💡 重要说明：为什么 ChatAssistant 接口不需要 @AiService 注解？**

这是因为使用了 **`AiServices.create()`** 手动创建的方式，而不是 Spring Boot Starter 的自动扫描方式。

**两种方式对比**：

| 特性 | `AiServices.create()` | `@AiService` 注解 |
|------|---------------------|------------------|
| **是否需要注解** | ❌ 不需要 | ✅ 需要 |
| **创建方式** | 手动创建 | 自动扫描 |
| **依赖** | `langchain4j` | `langchain4j-spring-boot-starter` |
| **灵活性** | ✅ 高（可以动态配置） | 中（基于约定） |
| **代码量** | 稍多 | ✅ 少 |
| **适用场景** | 非 Spring Boot 或需要精细控制 | Spring Boot 项目 |

**方式1：手动创建（当前模块7使用的方式）**
```java
// 配置类中手动创建
@Bean
public ChatAssistant chatAssistant(StreamingChatModel streamingChatModel){
    return AiServices.create(ChatAssistant.class, streamingChatModel);
}

// 接口定义（不需要注解）
public interface ChatAssistant {
    String chat(String prompt);
    Flux<String> chatFlux(String prompt);
}
```

**方式2：注解驱动（模块3、模块4使用的方式）**
```java
// 配置类中不需要手动创建
// Spring Boot Starter 会自动扫描 @AiService 注解

// 接口定义（需要注解）
@AiService
public interface ChatAssistant {
    String chat(String prompt);
}
```

**形象比喻**：
```
方式1（AiServices.create()）= 手动装配汽车
- 你自己选择发动机、轮胎、座椅
- 灵活，但需要自己动手

方式2（@AiService）= 买整车
- 厂家已经装配好
- 简单，但配置固定
```

**🎯 如何选择？**
- ✅ 需要精细控制、动态配置 → 推荐 **`AiServices.create()`**
- ✅ 追求代码简洁、Spring Boot 项目 → 推荐 **`@AiService`**
- ✅ 生产环境 → 根据项目需求选择

---

**服务接口：ChatAssistant.java**
```java
public interface ChatAssistant
{
    String chat(String prompt);           // 同步对话
    Flux<String> chatFlux(String prompt); // 流式对话
}
```

**关键点**：
- **`String chat()`** - 返回完整字符串（同步）
- **`Flux<String> chatFlux()`** - 返回响应式数据流（异步）
- **方法名约定** - LangChain4j 会自动识别 `Flux` 返回类型并启用流式模式

---

**控制器：StreamingChatModelController.java**

**接口1：低级 API 流式对话（返回 Flux）**
```java
@GetMapping(value = "/chatstream/chat")
public Flux<String> chat(@RequestParam("prompt") String prompt)
{
    System.out.println("---come in chat");

    return Flux.create(emitter -> {
        streamingChatLanguageModel.chat(prompt, new StreamingChatResponseHandler()
        {
            @Override
            public void onPartialResponse(String partialResponse)
            {
                emitter.next(partialResponse); // 逐个发射数据
            }

            @Override
            public void onCompleteResponse(ChatResponse completeResponse)
            {
                emitter.complete(); // 完成流
            }

            @Override
            public void onError(Throwable throwable)
            {
                emitter.error(throwable); // 错误处理
            }
        });
    });
}
```

**关键点**：
- **`Flux.create()`** - 创建响应式数据流
- **`emitter.next()`** - 逐个发射部分响应
- **`emitter.complete()`** - 标记流完成
- **`emitter.error()`** - 错误处理
- **`StreamingChatResponseHandler`** - 流式响应回调接口

---

**接口2：低级 API 流式对话（控制台打印）**
```java
@GetMapping(value = "/chatstream/chat2")
public void chat2(@RequestParam(value = "prompt", defaultValue = "北京有什么好吃") String prompt)
{
    System.out.println("---come in chat2");
    
    streamingChatLanguageModel.chat(prompt, new StreamingChatResponseHandler()
    {
        @Override
        public void onPartialResponse(String partialResponse)
        {
            System.out.println(partialResponse); // 控制台逐字打印
        }

        @Override
        public void onCompleteResponse(ChatResponse completeResponse)
        {
            System.out.println("---response over: "+completeResponse);
        }

        @Override
        public void onError(Throwable throwable)
        {
            throwable.printStackTrace();
        }
    });
}
```

**关键点**：
- **返回类型 `void`** - 不返回给浏览器
- **`System.out.println()`** - 在 IDEA 控制台查看结果
- **用途** - 后台测试、调试、日志记录

---

**接口3：高级 API 流式对话（返回 Flux）**
```java
@GetMapping(value = "/chatstream/chat3")
public Flux<String> chat3(@RequestParam(value = "prompt", defaultValue = "南京有什么好吃") String prompt)
{
    System.out.println("---come in chat3");
    
    return chatAssistant.chatFlux(prompt); // 一行代码搞定！
}
```

**关键点**：
- **`chatAssistant.chatFlux()`** - 声明式调用，代码简洁
- **自动流式化** - LangChain4j 自动处理流式逻辑
- **推荐使用** - 生产环境首选这种方式

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- langchain4j-reactor（新增！用于支持 Flux） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
</dependency>
```

**关键点**：
- **新增了 `langchain4j-reactor`** - 提供 Project Reactor 支持
- **`Flux` 来自 Reactor** - 响应式编程库
- **必须引入** - 否则无法使用流式功能

---

**配置文件：application.properties**
```properties
server.port=9007
spring.application.name=langchain4j-07chat-stream

# 设置响应的字符编码，避免流式返回输出乱码
server.servlet.encoding.charset=utf-8
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
```

**关键点**：
- **UTF-8 编码** - 避免中文乱码
- **流式响应** - 对编码要求更高

#### 7.3 测试接口与返回

**接口1：低级 API 流式对话（Flux）**
```
http://localhost:9007/chatstream/chat?prompt=天津有什么好吃的
```

**返回示例**（浏览器中逐字显示）：
```
天津有很多好吃的美食，以下是一些著名的天津美食：

1. **狗不理包子**：天津最著名的传统小吃之一...
2. **煎饼果子**：天津人的早餐必备...
3. **耳朵眼炸糕**：香甜可口的传统甜点...
...
```

**响应时间**: 首字约 1-2 秒，完整响应约 5-8 秒

**说明**：
- 浏览器会逐字显示内容
- 类似 ChatGPT 的效果
- 用户体验更好

---

**接口2：低级 API 流式对话（控制台）**
```
http://localhost:9007/chatstream/chat2?prompt=北京有什么好吃
```

**IDEA 控制台输出**：
```
---come in chat2
北
京
有
很
多
好
吃
的
美
食
...
---response over: ChatResponse{...}
```

**说明**：
- 每个字单独一行（因为 `println` 会换行）
- 在 IDEA 控制台查看
- 适合调试和测试

---

**接口3：高级 API 流式对话（Flux）**
```
http://localhost:9007/chatstream/chat3?prompt=南京有什么好吃
```

**返回示例**（浏览器中逐字显示）：
```
南京有很多特色美食，以下是一些著名的南京美食：

1. **盐水鸭**：南京最著名的特产...
2. **鸭血粉丝汤**：南京传统小吃...
3. **小笼包**：皮薄馅大...
...
```

**响应时间**: 首字约 1-2 秒，完整响应约 5-8 秒

**说明**：
- 与接口1效果相同
- 但代码更简洁
- 推荐使用这种方式

#### 7.4 知识点总结

✅ **流式对话（Streaming）**  
   - 逐字输出，用户体验更好  
   - 不需要等待完整响应  
   - 类似 ChatGPT 的效果  
   - 减少用户等待焦虑  

✅ **StreamingChatModel**  
   - 流式对话模型接口  
   - 通过回调函数处理部分响应  
   - 三个回调方法：  
     - `onPartialResponse()` - 接收部分响应  
     - `onCompleteResponse()` - 接收完整响应  
     - `onError()` - 错误处理  

✅ **Flux（响应式编程）**  
   - Project Reactor 的核心类  
   - 表示一个异步的数据流  
   - 可以逐个发射数据  
   - 支持背压（Backpressure）  

✅ **两种 API 方式**  
   - **低级 API** - 直接使用 `StreamingChatModel.chat()` + 回调  
   - **高级 API** - 通过 `ChatAssistant.chatFlux()` 声明式调用  

✅ **依赖说明**  
   - 新增了 `langchain4j-reactor` 依赖  
   - 提供了 Flux 支持  
   - 基于 Project Reactor 实现  

#### 7.5 流式对话详细讲解

**流式对话的流程**：
```
1. 用户发送请求
   ↓
2. 模型开始生成响应
   ↓
3. 逐字/逐词返回部分响应（onPartialResponse）
   ↓
4. 前端逐字显示
   ↓
5. 继续生成，继续返回
   ↓
6. 生成完成，返回完整响应（onCompleteResponse）
   ↓
7. 结束流（emitter.complete）
```

**形象比喻**：
```
流式对话 = 打字员逐字打字给你看

传统对话（同步）：
- 打字员在后台打完所有字
- 然后一次性把整篇文章给你
- 你需要等待很长时间

流式对话（异步）：
- 打字员边打边给你看
- 你马上能看到第一个字
- 虽然总时间一样，但体验更好
- 不会觉得等待太久

就像 ChatGPT 一样！
```

**代码示例对比**：

**传统对话（同步）**：
```java
// 等待完整响应
String result = chatModel.chat(prompt);
System.out.println(result); // 一次性输出
```

**流式对话（异步）**：
```java
// 逐字返回
Flux<String> flux = Flux.create(emitter -> {
    streamingChatModel.chat(prompt, new StreamingChatResponseHandler() {
        @Override
        public void onPartialResponse(String partialResponse) {
            emitter.next(partialResponse); // 逐字发射
        }
        
        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            emitter.complete(); // 完成
        }
        
        @Override
        public void onError(Throwable throwable) {
            emitter.error(throwable); // 错误
        }
    });
});

// 订阅流
flux.subscribe(
    chunk -> System.out.print(chunk), // 逐字打印
    error -> error.printStackTrace(), // 错误处理
    () -> System.out.println("\n完成") // 完成回调
);
```

#### 7.6 低级 API vs 高级 API 对比

**低级 API（接口1、接口2）**：
```java
@GetMapping(value = "/chatstream/chat")
public Flux<String> chat(@RequestParam("prompt") String prompt)
{
    return Flux.create(emitter -> {
        streamingChatLanguageModel.chat(prompt, new StreamingChatResponseHandler()
        {
            @Override
            public void onPartialResponse(String partialResponse)
            {
                emitter.next(partialResponse);
            }

            @Override
            public void onCompleteResponse(ChatResponse completeResponse)
            {
                emitter.complete();
            }

            @Override
            public void onError(Throwable throwable)
            {
                emitter.error(throwable);
            }
        });
    });
}
```

**优点**：
- ✅ 灵活控制
- ✅ 可以自定义逻辑
- ✅ 适合复杂场景

**缺点**：
- ❌ 代码复杂
- ❌ 需要手动处理回调
- ❌ 容易出错

---

**高级 API（接口3）**：
```java
@GetMapping(value = "/chatstream/chat3")
public Flux<String> chat3(@RequestParam(value = "prompt", defaultValue = "南京有什么好吃") String prompt)
{
    return chatAssistant.chatFlux(prompt); // 一行代码！
}
```

**优点**：
- ✅ 代码简洁
- ✅ 易于维护
- ✅ 自动处理流式逻辑
- ✅ 推荐使用

**缺点**：
- ❌ 灵活性较低

---

**🎯 如何选择？**
- ✅ 简单场景 → 推荐 **高级 API**（`chatFlux()`）
- ✅ 复杂场景 → 使用 **低级 API**（`StreamingChatModel.chat()`）
- ✅ 生产环境 → 优先使用 **高级 API**

#### 7.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **流式对话能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **流式支持** | ✅ 支持（Flux） | ✅ 支持（Flux） | ✅ 支持（Flux） |
| **低级 API** | ✅ `StreamingChatModel` | ✅ `StreamingChatClient` | ✅ `StreamingChatClient` |
| **高级 API** | ✅ `chatFlux()` | ✅ `stream()` | ✅ `stream()` |
| **响应式编程** | ✅ Project Reactor | ✅ Project Reactor | ✅ Project Reactor |
| **回调接口** | ✅ `StreamingChatResponseHandler` | ❌ 无 | ❌ 无 |
| **社区集成** | ✅ `langchain4j-reactor` | ✅ 内置 | ✅ 内置 |

#### **详细代码对比**

**1️⃣ LangChain4j（低级 API + 高级 API）**：
```java
// 低级 API
Flux<String> flux = Flux.create(emitter -> {
    streamingChatModel.chat(prompt, new StreamingChatResponseHandler() {
        @Override
        public void onPartialResponse(String partialResponse) {
            emitter.next(partialResponse);
        }
        
        @Override
        public void onCompleteResponse(ChatResponse completeResponse) {
            emitter.complete();
        }
        
        @Override
        public void onError(Throwable throwable) {
            emitter.error(throwable);
        }
    });
});

// 高级 API
public interface ChatAssistant {
    Flux<String> chatFlux(String prompt);
}

Flux<String> flux = chatAssistant.chatFlux(prompt);
```

**📖 详细讲解**：
- LangChain4j 同时支持低级和高级 API
- 低级 API 提供完整的回调控制
- 高级 API 通过方法名约定自动识别
- 需要引入 `langchain4j-reactor` 依赖

---

**2️⃣ Spring AI（仅高级 API）**：
```java
// Spring AI 不提供低级 API
// 直接使用 stream()
Flux<String> flux = chatClient.prompt(prompt)
    .stream()
    .content();
```

**📖 详细讲解**：
- Spring AI 仅提供高级 API
- 通过 `.stream()` 方法启用流式
- 代码简洁，但灵活性较低

---

**3️⃣ Spring AI Alibaba（仅高级 API）**：
```java
// 与 Spring AI 相同
Flux<String> flux = chatClient.prompt(prompt)
    .stream()
    .content();
```

**📖 详细讲解**：
- Spring AI Alibaba 继承 Spring AI 的 API
- 流式调用方式相同
- 底层使用 DashScope 流式接口

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI | Spring AI Alibaba |
|---------|-------------|-----------|-------------------|
| 流式支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 低级 API | ✅ 有（回调） | ❌ 无 | ❌ 无 |
| 高级 API | ✅ 有 | ✅ 有 | ✅ 有 |
| API 简洁度 | 中（低级复杂，高级简洁） | ✅ 高 | ✅ 高 |
| 灵活性 | ✅ 高 | 中 | 中 |
| 学习曲线 | 中 | ✅ 低 | ✅ 低 |

**🎯 如何选择？**
- ✅ 需要精细控制 → 推荐 **LangChain4j**（低级 API）
- ✅ 追求简洁 → 推荐 **Spring AI / Spring AI Alibaba**
- ✅ 生产环境 → 三个框架都支持，根据项目技术栈选择

#### 7.8 技术要点

**流式对话的要点**：
- 🚀 **首字延迟** - 通常 1-2 秒，用户体验关键指标
- 📊 **吞吐量** - 每秒返回的 Token 数量
- 🔄 **背压（Backpressure）** - 防止消费者处理不过来
- ⚠️ **错误处理** - 流式过程中可能出现网络错误

**Flux 的要点**：
- 📡 **异步数据流** - 非阻塞，高性能
- 🔢 **逐个发射** - `emitter.next()` 逐个发送数据
- ✅ **完成信号** - `emitter.complete()` 标记流结束
- ❌ **错误信号** - `emitter.error()` 传递错误

**回调接口的要点**：
- 📝 **onPartialResponse** - 接收部分响应（逐字/逐词）
- ✅ **onCompleteResponse** - 接收完整响应（包含 Token 用量等）
- ❌ **onError** - 错误处理（网络异常、API 错误等）

**适用场景**：
- ✅ 聊天机器人 - 提升用户体验
- ✅ 长文本生成 - 减少等待时间
- ✅ 实时翻译 - 即时反馈
- ✅ 代码补全 - 快速响应

**注意事项**：
- ⚠️ 必须引入 `langchain4j-reactor` 依赖
- ⚠️ 设置 UTF-8 编码，避免中文乱码
- ⚠️ 流式响应不支持重试机制
- ⚠️ 注意内存管理，避免长时间占用资源

#### 7.9 常见问题

**问题1：为什么浏览器看到的是完整内容，不是逐字显示？**
- **原因**：浏览器默认会缓冲响应
- **解决方案**：
  1. 使用 Server-Sent Events (SSE)
  2. 使用 WebSocket
  3. 前端使用 Fetch API 并正确处理流

**问题2：如何在前端实现逐字显示效果？**
- **方法**：
```javascript
fetch('/chatstream/chat?prompt=你好')
  .then(response => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    function read() {
      return reader.read().then(({ done, value }) => {
        if (done) return;
        const chunk = decoder.decode(value, { stream: true });
        document.getElementById('output').innerHTML += chunk;
        return read();
      });
    }
    
    return read();
  });
```

**问题3：流式对话能获取 Token 用量吗？**
- **答案**：可以，在 `onCompleteResponse()` 中获取
```java
@Override
public void onCompleteResponse(ChatResponse completeResponse) {
    TokenUsage tokenUsage = completeResponse.tokenUsage();
    System.out.println("Token 用量: " + tokenUsage);
}
```

**问题4：流式对话支持图片理解吗？**
- **答案**：支持，但需要使用多模态模型
- **方法**：将 `ImageContent` 添加到 `UserMessage` 中

---

### 模块8：langchain4j-08chat-memory - 对话记忆

#### 8.1 模块概述
- **端口**: 9008
- **功能**: 演示 LangChain4j 的对话记忆能力，让 AI 能够记住上下文信息
- **核心概念**: ChatMemory、MessageWindowChatMemory、TokenWindowChatMemory、MemoryId、Eviction Policy

#### 8.2 核心代码

**📋 流程总览**：
```
无记忆：用户请求 → chat() → 每次独立 → 无法记住历史
有记忆：用户请求 → chatWithChatMemory(userId, prompt) → 保存历史 → 下次能记住
```

**📊 完整调用流程图**：
```
有记忆对话流程：
┌─────────────┐
│   用户请求   │ userId=1, prompt="我叫张三"
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ ChatMemoryController    │ test2()
└──────┬──────────────────┘
       │ @MemoryId=1L
       ▼
┌─────────────────────────┐
│ ChatMemoryAssistant     │ chatWithChatMemory(1L, prompt)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ MessageWindowChatMemory │ 保存消息到 userId=1 的记忆空间
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   ChatModel             │ 发送请求(包含历史消息)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ AI 能记住"我叫张三"
└─────────────────────────┘

下次请求：userId=1, prompt="我叫什么"
       ↓
从记忆空间读取历史 → AI 回答"你叫张三"
```

---

**1️⃣ 定义接口：ChatAssistant.java（无记忆）**
```java
@Configuration
public class LLMConfig
{
    // 普通对话模型（无记忆）
    @Bean
    public ChatModel chatModel()
    {
        return OpenAiChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-long")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    // 普通对话助手（无记忆）
    @Bean(name = "chat")
    public ChatAssistant chatAssistant(ChatModel chatModel)
    {
        return AiServices.create(ChatAssistant.class, chatModel);
    }

    // 基于消息数量的记忆
    @Bean(name = "chatMessageWindowChatMemory")
    public ChatMemoryAssistant chatMessageWindowChatMemory(ChatModel chatModel)
    {
        return AiServices.builder(ChatMemoryAssistant.class)
                .chatModel(chatModel)
                // 按照 memoryId 对应创建了一个 chatMemory
                .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(100))
                .build();
    }

    // 基于 Token 数量的记忆
    @Bean(name = "chatTokenWindowChatMemory")
    public ChatMemoryAssistant chatTokenWindowChatMemory(ChatModel chatModel)
    {
        // TokenCountEstimator 默认的 token 分词器
        TokenCountEstimator openAiTokenCountEstimator = new OpenAiTokenCountEstimator("gpt-4");

        return AiServices.builder(ChatMemoryAssistant.class)
                .chatModel(chatModel)
                .chatMemoryProvider(memoryId -> TokenWindowChatMemory.withMaxTokens(1000, openAiTokenCountEstimator))
                .build();
    }
}
```

**关键点**：
- **三个不同的 Bean** - 分别演示无记忆、按消息数量记忆、按 Token 数量记忆
- **`AiServices.builder()`** - 使用 builder 模式构建服务
- **`.chatMemoryProvider()`** - 配置记忆提供者
- **`memoryId`** - 用于区分不同用户的记忆空间
- **`MessageWindowChatMemory.withMaxMessages(100)`** - 最多保留100条消息
- **`TokenWindowChatMemory.withMaxTokens(1000, estimator)`** - 最多保留1000个Token

---

**服务接口：ChatAssistant.java（无记忆）**
```java
public interface ChatAssistant
{
    /**
     * 普通聊天对话，不带记忆缓存功能
     */
    String chat(String prompt);
}
```

**关键点**：
- **简单接口** - 只有一个方法
- **无记忆** - 每次对话都是独立的
- **不使用 `@MemoryId`**

---

**服务接口：ChatMemoryAssistant.java（带记忆）**
```java
public interface ChatMemoryAssistant
{
    /**
     * 聊天带记忆缓存功能
     *
     * @param userId  用户 ID
     * @param prompt 消息
     * @return {@link String }
     */
    String chatWithChatMemory(@MemoryId Long userId, @UserMessage String prompt);
}
```

**关键点**：
- **`@MemoryId`** - 标记用户ID，用于区分不同用户的记忆
- **`@UserMessage`** - 标记用户消息（可选，但推荐）
- **每个用户有独立的记忆空间** - userId=1 和 userId=3 的记忆互不影响

---

**控制器：ChatMemoryController.java**

**接口1：无记忆对话（演示问题）**
```java
@GetMapping(value = "/chatmemory/test1")
public String chat()
{
    String answer01 = chatAssistant.chat("你好，我的名字叫张三");
    System.out.println("answer01返回结果："+answer01);

    String answer02 = chatAssistant.chat("我的名字是什么");
    System.out.println("answer02返回结果："+answer02);

    return "success : "+ DateUtil.now()+"<br> \n\n answer01: "+answer01+"<br> \n\n answer02: "+answer02;
}
```

**关键点**：
- **无记忆** - 第二次问“我的名字是什么”时，AI 不知道
- **演示问题** - 展示没有记忆的局限性
- **每次对话独立** - 不保存历史

---

**接口2：基于消息数量的记忆**
```java
@GetMapping(value = "/chatmemory/test2")
public String chatMessageWindowChatMemory()
{
    // 用户1 的对话
    chatMessageWindowChatMemory.chatWithChatMemory(1L, "你好！我的名字是Java.");
    String answer01 = chatMessageWindowChatMemory.chatWithChatMemory(1L, "我的名字是什么");
    System.out.println("answer01返回结果："+answer01);

    // 用户3 的对话（独立记忆）
    chatMessageWindowChatMemory.chatWithChatMemory(3L, "你好！我的名字是C++");
    String answer02 = chatMessageWindowChatMemory.chatWithChatMemory(3L, "我的名字是什么");
    System.out.println("answer02返回结果："+answer02);

    return "chatMessageWindowChatMemory success : "
            + DateUtil.now()+"<br> \n\n answer01: "+answer01+"<br> \n\n answer02: "+answer02;
}
```

**关键点**：
- **`userId=1L`** - 用户1的记忆
- **`userId=3L`** - 用户3的记忆（独立）
- **能记住名字** - AI 可以回答“我的名字是什么”
- **最多100条消息** - 超出后自动删除最早的消息

---

**接口3：基于 Token 数量的记忆**
```java
@GetMapping(value = "/chatmemory/test3")
public String chatTokenWindowChatMemory()
{
    // 用户1 的对话
    chatTokenWindowChatMemory.chatWithChatMemory(1L, "你好！我的名字是mysql");
    String answer01 = chatTokenWindowChatMemory.chatWithChatMemory(1L, "我的名字是什么");
    System.out.println("answer01返回结果："+answer01);

    // 用户3 的对话（独立记忆）
    chatTokenWindowChatMemory.chatWithChatMemory(3L, "你好！我的名字是oracle");
    String answer02 = chatTokenWindowChatMemory.chatWithChatMemory(3L, "我的名字是什么");
    System.out.println("answer02返回结果："+answer02);

    return "chatTokenWindowChatMemory success : "
            + DateUtil.now()+"<br> \n\n answer01: "+answer01+"<br> \n\n answer02: "+answer02;
}
```

**关键点**：
- **基于 Token 数量** - 更精确的控制
- **最多1000个Token** - 超出后自动删除最早的 Token
- **需要 TokenCountEstimator** - 计算每条消息的 Token 数量

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- langchain4j-reactor（响应式编程） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
</dependency>
```

**关键点**：
- **与模块7相同** - 不需要额外的依赖
- **记忆功能内置** - LangChain4j 核心库已包含

#### 8.3 测试接口与返回

**接口1：无记忆对话**
```
http://localhost:9008/chatmemory/test1
```

**返回示例**：
```
success : 2026-06-05 10:30:00

answer01: 你好，张三！很高兴认识你。有什么我可以帮助你的吗？

answer02: 抱歉，我无法知道您的名字。在之前的对话中，您并没有告诉我您的名字。
```

**说明**：
- **answer01** - AI 记住了名字（因为在这条消息中提到了）
- **answer02** - AI 忘记了名字（因为没有记忆功能）
- **问题** - 无法进行多轮对话

---

**接口2：基于消息数量的记忆**
```
http://localhost:9008/chatmemory/test2
```

**返回示例**：
```
chatMessageWindowChatMemory success : 2026-06-05 10:30:00

answer01: 您的名字是 Java。

answer02: 您的名字是 C++。
```

**说明**：
- **answer01** - AI 记得用户1的名字是 Java
- **answer02** - AI 记得用户3的名字是 C++
- **独立记忆** - 两个用户的记忆互不影响
- **最多100条消息** - 超出后自动删除最早的消息

---

**接口3：基于 Token 数量的记忆**
```
http://localhost:9008/chatmemory/test3
```

**返回示例**：
```
chatTokenWindowChatMemory success : 2026-06-05 10:30:00

answer01: 您的名字是 mysql。

answer02: 您的名字是 oracle。
```

**说明**：
- **answer01** - AI 记得用户1的名字是 mysql
- **answer02** - AI 记得用户3的名字是 oracle
- **独立记忆** - 两个用户的记忆互不影响
- **最多1000个Token** - 超出后自动删除最早的 Token

#### 8.4 知识点总结

✅ **对话记忆（Chat Memory）**  
   - 让 AI 能够记住之前的对话内容  
   - 实现多轮对话的上下文理解  
   - 类似人类的短期记忆  
   - 提升用户体验  

✅ **两种记忆策略**  
   - **MessageWindowChatMemory** - 按消息数量限制（如最多保留100条消息）  
   - **TokenWindowChatMemory** - 按 Token 数量限制（如最多保留1000个Token）  

✅ **MemoryId（记忆ID）**  
   - 用于区分不同用户的对话记忆  
   - 每个用户有独立的记忆空间  
   - 通过 `@MemoryId` 注解传递  
   - 支持多用户并发对话  

✅ **Eviction Policy（驱逐策略）**  
   - 当记忆超出限制时，自动删除旧的记忆  
   - MessageWindowChatMemory - 删除最早的消息  
   - TokenWindowChatMemory - 删除最早的 Token  
   - 防止内存溢出  

✅ **TokenCountEstimator**  
   - Token 计数器  
   - 用于计算每条消息的 Token 数量  
   - OpenAiTokenCountEstimator - OpenAI 格式的 Token 计算器  
   - 必须与 TokenWindowChatMemory 配合使用  

#### 8.5 对话记忆详细讲解

**对话记忆的流程**：
```
1. 用户发送第一条消息
   ↓
2. 系统创建记忆空间（根据 memoryId）
   ↓
3. 保存用户消息到记忆
   ↓
4. 发送消息 + 历史记忆给模型
   ↓
5. 模型返回响应
   ↓
6. 保存 AI 响应到记忆
   ↓
7. 检查是否超出限制
   ↓
8. 如果超出，删除最早的记忆（Eviction）
   ↓
9. 返回响应给用户
```

**形象比喻**：
```
对话记忆 = 笔记本记录对话历史

传统对话（无记忆）：
- 每次对话都像第一次见面
- AI 不记得之前说过什么
- 就像金鱼记忆，只有7秒

带记忆的对话：
- AI 有一个笔记本，记录对话历史
- 每次对话前，先翻看笔记本
- 笔记本有大小限制（100条消息或1000个Token）
- 写满后，擦掉最早的记录
- 这样既能记住上下文，又不会无限占用空间

就像你和朋友聊天，你会记得之前说过的话！
```

**代码示例对比**：

**无记忆对话**：
```java
// 接口定义
public interface ChatAssistant {
    String chat(String prompt);
}

// 使用
String answer1 = chatAssistant.chat("我的名字是张三");
String answer2 = chatAssistant.chat("我的名字是什么");
// answer2: "我不知道你的名字"
```

**带记忆对话**：
```java
// 接口定义
public interface ChatMemoryAssistant {
    String chatWithChatMemory(@MemoryId Long userId, @UserMessage String prompt);
}

// 配置
@Bean
public ChatMemoryAssistant chatMemoryAssistant(ChatModel chatModel) {
    return AiServices.builder(ChatMemoryAssistant.class)
            .chatModel(chatModel)
            .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(100))
            .build();
}

// 使用
String answer1 = chatMemoryAssistant.chatWithChatMemory(1L, "我的名字是张三");
String answer2 = chatMemoryAssistant.chatWithChatMemory(1L, "我的名字是什么");
// answer2: "你的名字是张三"
```

#### 8.6 MessageWindowChatMemory vs TokenWindowChatMemory 对比

**MessageWindowChatMemory（按消息数量）**：
```java
.chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(100))
```

**优点**：
- ✅ 配置简单
- ✅ 容易理解
- ✅ 性能较好（不需要计算 Token）

**缺点**：
- ❌ 不够精确（长消息和短消息一样计数）
- ❌ 可能超出 Token 限制

**适用场景**：
- 消息长度相对均匀
- 对性能要求较高
- 快速原型开发

---

**TokenWindowChatMemory（按 Token 数量）**：
```java
TokenCountEstimator estimator = new OpenAiTokenCountEstimator("gpt-4");
.chatMemoryProvider(memoryId -> TokenWindowChatMemory.withMaxTokens(1000, estimator))
```

**优点**：
- ✅ 精确控制（基于 Token 数量）
- ✅ 避免超出模型的上下文窗口
- ✅ 更适合生产环境

**缺点**：
- ❌ 配置复杂（需要 TokenCountEstimator）
- ❌ 性能稍差（需要计算 Token）

**适用场景**：
- 消息长度差异大
- 需要精确控制 Token 用量
- 生产环境

---

**🎯 如何选择？**
- ✅ 简单场景、快速开发 → 推荐 **MessageWindowChatMemory**
- ✅ 生产环境、精确控制 → 推荐 **TokenWindowChatMemory**
- ✅ 消息长度均匀 → **MessageWindowChatMemory**
- ✅ 消息长度差异大 → **TokenWindowChatMemory**

#### 8.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **对话记忆能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **记忆支持** | ✅ 支持（多种策略） | ✅ 支持（ChatMemory） | ✅ 支持（ChatMemory） |
| **MessageWindow** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **TokenWindow** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **MemoryId** | ✅ 支持（@MemoryId） | ✅ 支持 | ✅ 支持 |
| **持久化** | ✅ 支持（Redis、DB等） | ✅ 支持 | ✅ 支持 |
| **驱逐策略** | ✅ 自动驱逐 | ✅ 自动驱逐 | ✅ 自动驱逐 |

#### **详细代码对比**

**1️⃣ LangChain4j（MessageWindow + TokenWindow）**：
```java
// MessageWindowChatMemory
@Bean
public ChatMemoryAssistant chatMessageWindow(ChatModel chatModel) {
    return AiServices.builder(ChatMemoryAssistant.class)
            .chatModel(chatModel)
            .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(100))
            .build();
}

// TokenWindowChatMemory
@Bean
public ChatMemoryAssistant chatTokenWindow(ChatModel chatModel) {
    TokenCountEstimator estimator = new OpenAiTokenCountEstimator("gpt-4");
    return AiServices.builder(ChatMemoryAssistant.class)
            .chatModel(chatModel)
            .chatMemoryProvider(memoryId -> TokenWindowChatMemory.withMaxTokens(1000, estimator))
            .build();
}
```

**📖 详细讲解**：
- LangChain4j 提供两种记忆策略
- MessageWindow - 按消息数量
- TokenWindow - 按 Token 数量
- 支持多种持久化存储（Redis、DB等）

---

**2️⃣ Spring AI（仅 MessageWindow）**：
```java
// Spring AI 默认使用 MessageWindowChatMemory
@Bean
public ChatClient chatClient(ChatModel chatModel) {
    return ChatClient.builder(chatModel)
            .defaultAdvisors(new MessageChatMemoryAdvisor(
                new InMemoryChatMemoryRepository()
            ))
            .build();
}
```

**📖 详细讲解**：
- Spring AI 默认使用 MessageWindowChatMemory
- 不支持 TokenWindowChatMemory
- 需要通过 Advisor 配置

---

**3️⃣ Spring AI Alibaba（仅 MessageWindow）**：
```java
// 与 Spring AI 相同
@Bean
public ChatClient chatClient(ChatModel chatModel) {
    return ChatClient.builder(chatModel)
            .defaultAdvisors(new MessageChatMemoryAdvisor(
                new InMemoryChatMemoryRepository()
            ))
            .build();
}
```

**📖 详细讲解**：
- Spring AI Alibaba 继承 Spring AI 的记忆机制
- 默认使用 MessageWindowChatMemory
- 不支持 TokenWindowChatMemory

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| 记忆策略 | ✅ 两种（Message + Token） | 一种（Message） |
| 配置复杂度 | 中（builder 模式） | 中（Advisor 模式） |
| 灵活性 | ✅ 高 | 中 |
| 精确控制 | ✅ TokenWindow | ❌ 无 |
| 持久化支持 | ✅ 多种存储 | ✅ 多种存储 |

**🎯 如何选择？**
- ✅ 需要精确控制 Token → 推荐 **LangChain4j**（TokenWindow）
- ✅ 简单场景 → 三个框架都支持
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 8.8 技术要点

**对话记忆的要点**：
- 🧠 **上下文理解** - 让 AI 能够理解多轮对话
- 👥 **多用户隔离** - 每个用户有独立的记忆空间
- 🔄 **自动驱逐** - 超出限制时自动删除旧记忆
- 💾 **持久化** - 可以将记忆保存到数据库或 Redis

**MemoryId 的要点**：
- 🔑 **唯一标识** - 用于区分不同用户或会话
- 📊 **类型灵活** - 可以是 Long、String 等
- 🎯 **注解传递** - 通过 `@MemoryId` 注解标记参数
- 🚀 **并发安全** - 支持多用户并发对话

**驱逐策略的要点**：
- 🗑️ **FIFO（先进先出）** - 删除最早的记忆
- 📏 **限制大小** - 防止内存溢出
- ⚙️ **可配置** - 可以自定义限制大小
- 🔄 **自动执行** - 无需手动干预

**适用场景**：
- ✅ 聊天机器人 - 记住用户的偏好和历史
- ✅ 客服系统 - 理解用户的问题上下文
- ✅ 个人助理 - 提供个性化的服务
- ✅ 教育应用 - 跟踪学生的学习进度

**注意事项**：
- ⚠️ 记忆会占用内存，注意设置合理的限制
- ⚠️ 多用户场景下，确保 MemoryId 唯一
- ⚠️ 生产环境建议使用持久化存储（Redis、DB）
- ⚠️ TokenWindowChatMemory 需要 TokenCountEstimator

#### 8.9 常见问题

**问题1：为什么 AI 记不住我的名字？**
- **原因**：没有配置对话记忆
- **解决方案**：使用 `ChatMemoryAssistant` 并配置 `.chatMemoryProvider()`

**问题2：如何区分不同用户的记忆？**
- **方法**：使用 `@MemoryId` 注解传递用户ID
```java
String chatWithChatMemory(@MemoryId Long userId, @UserMessage String prompt);
```

**问题3：MessageWindowChatMemory 和 TokenWindowChatMemory 有什么区别？**
- **MessageWindowChatMemory** - 按消息数量限制（简单、快速）
- **TokenWindowChatMemory** - 按 Token 数量限制（精确、可控）

**问题4：如何将记忆持久化到 Redis？**
- **方法**：使用 `RedisChatMemoryStore`
```java
ChatMemoryProvider provider = memoryId -> MessageWindowChatMemory.builder()
    .id(memoryId)
    .maxMessages(100)
    .chatMemoryStore(redisChatMemoryStore)
    .build();
```

**问题5：记忆的限制大小设置多少合适？**
- **建议**：
  - MessageWindowChatMemory：50-200条消息
  - TokenWindowChatMemory：1000-5000个Token
  - 根据实际需求和模型上下文窗口调整

---

### 模块9：langchain4j-09chat-prompt - Prompt提示词

#### 9.1 模块概述
- **端口**: 9009
- **功能**: 演示 LangChain4j 的 Prompt 提示词模板功能，包括系统消息、用户消息、变量替换等
- **核心概念**: @SystemMessage、@UserMessage、@V、PromptTemplate、StructuredPrompt

#### 9.2 核心代码

**📋 流程总览**：
```
方式1(@V)：用户请求 → 接口方法传参 → @V映射变量 → 替换模板 → 发送请求 → 返回结果
方式2(StructuredPrompt)：用户请求 → 创建实体对象 → @StructuredPrompt模板 → 字段替换 → 发送请求 → 返回结果
```

**📊 完整调用流程图**：
```
@V 方式流程：
┌─────────────┐
│   用户请求   │ test1()
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ ChatPromptController    │ lawAssistant.chat(question, length)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ LawAssistant 接口       │ @V("question") + @V("length")
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ PromptTemplate          │ {{question}} → 实际值
│                         │ {{length}} → 实际值
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   ChatModel             │ 发送请求(含SystemMessage+UserMessage)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ String
└─────────────────────────┘

StructuredPrompt 方式流程：
┌─────────────┐
│   用户请求   │ test2()
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ ChatPromptController    │ new LawPrompt()
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ LawPrompt 实体类        │ @StructuredPrompt模板
│ legal="知识产权"         │ {{legal}} → "知识产权"
│ question="TRIPS协议?"    │ {{question}} → "TRIPS协议?"
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   ChatModel             │ 发送请求
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ String
└─────────────────────────┘
```

---

**1️⃣ 定义接口：LawAssistant.java**
```java
@Configuration
public class LLMConfig
{
    @Bean
    public ChatModel chatModel()
    {
        return OpenAiChatModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .modelName("qwen-long")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    @Bean
    public LawAssistant lawAssistant(ChatModel chatModel) {
        return AiServices.create(LawAssistant.class, chatModel);
    }
}
```

**关键点**：
- **`AiServices.create()`** - 手动创建声明式服务
- **不需要 `@AiService` 注解** - 因为是手动创建
- **使用 `qwen-long` 模型** - 支持长上下文

---

**服务接口：LawAssistant.java**

**方法1：使用 @V 注解传递参数**
```java
public interface LawAssistant
{
    // 案例1：@SystemMessage + @UserMessage + @V
    @SystemMessage("你是一位专业的中国法律顾问，只回答与中国法律相关的问题。" +
            "输出限制：对于其他领域的问题禁止回答，直接返回'抱歉，我只能回答中国法律相关的问题。'")

    @UserMessage("请回答以下法律问题：{{question}},字数控制在{{length}}以内")

    String chat(@V("question") String question, @V("length") int length);
}
```

**关键点**：
- **`@SystemMessage`** - 定义 AI 的角色和行为准则（人设）
- **`@UserMessage`** - 定义用户消息的模板
- **`{{question}}` 和 `{{length}}`** - 占位符，会被实际参数替换
- **`@V("question")`** - 将方法参数映射到模板变量
- **`@V("length")`** - 支持多个参数

---

**方法2：使用 StructuredPrompt 实体类**
```java
public interface LawAssistant
{
    // 案例2：新建带着 @StructuredPrompt 的业务实体类
    @SystemMessage("你是一位专业的中国法律顾问，只回答与中国法律相关的问题。" +
            "输出限制：对于其他领域的问题禁止回答，直接返回'抱歉，我只能回答中国法律相关的问题。'")
    String chat(LawPrompt lawPrompt);
}
```

**关键点**：
- **传入实体类** - 更面向对象的方式
- **实体类上有 `@StructuredPrompt`** - 定义提示词模板

---

**实体类：LawPrompt.java**
```java
@Data
@StructuredPrompt("根据中国{{legal}}法律，解答以下问题：{{question}}")
public class LawPrompt
{
    private String legal;    // 法律领域
    private String question; // 问题
}
```

**关键点**：
- **`@StructuredPrompt`** - 在实体类上定义提示词模板
- **字段名对应模板变量** - `legal` 对应 `{{legal}}`，`question` 对应 `{{question}}`
- **更清晰的结构** - 适合复杂场景

---

**控制器：ChatPromptController.java**

**接口1：使用 @V 注解传递参数**
```java
@GetMapping(value = "/chatprompt/test1")
public String test1()
{
    String chat = lawAssistant.chat("什么是知识产权？", 2000);
    System.out.println(chat);

    String chat2 = lawAssistant.chat("什么是java？", 2000);
    System.out.println(chat2);

    String chat3 = lawAssistant.chat("介绍下西瓜和芒果", 2000);
    System.out.println(chat3);

    String chat4 = lawAssistant.chat("飞机发动机原理", 2000);
    System.out.println(chat4);

    return "success : "+ DateUtil.now()+"<br> \n\n chat: "+chat+"<br> \n\n chat2: "+chat2;
}
```

**关键点**：
- **传递两个参数** - `question` 和 `length`
- **测试非法律问题** - 验证 `@SystemMessage` 的限制是否生效
- **预期结果** - 非法律问题应该被拒绝回答

---

**接口2：使用 StructuredPrompt 实体类**
```java
@GetMapping(value = "/chatprompt/test2")
public String test2()
{
    LawPrompt prompt = new LawPrompt();
    prompt.setLegal("知识产权");
    prompt.setQuestion("TRIPS协议?");

    String chat = lawAssistant.chat(prompt);
    System.out.println(chat);

    return "success : "+ DateUtil.now()+"<br> \n\n chat: "+chat;
}
```

**关键点**：
- **创建实体对象** - 设置 `legal` 和 `question` 字段
- **传入实体对象** - LangChain4j 自动替换模板变量
- **更优雅的方式** - 适合复杂参数

---

**接口3：手动使用 PromptTemplate**
```java
@GetMapping(value = "/chatprompt/test3")
public String test3()
{
    String role = "财务会计";
    String question = "人民币大写";

    // 1. 构造 PromptTemplate 模板
    PromptTemplate template = PromptTemplate.from("你是一个{{it}}助手,{{question}}怎么办");
    
    // 2. 由 PromptTemplate 生成 Prompt
    Prompt prompt = template.apply(Map.of("it", role, "question", question));
    
    // 3. Prompt 提示词变成 UserMessage
    UserMessage userMessage = prompt.toUserMessage();
    
    // 4. 调用大模型
    ChatResponse chatResponse = chatModel.chat(userMessage);

    System.out.println(chatResponse.aiMessage().text());
    
    return "success : "+ DateUtil.now()+"<br> \n\n chat: "+chatResponse.aiMessage().text();
}
```

**关键点**：
- **`PromptTemplate.from()`** - 创建提示词模板
- **`{{it}}`** - 默认占位符（可以自定义）
- **`template.apply()`** - 替换变量，生成 Prompt
- **`prompt.toUserMessage()`** - 转换为 UserMessage
- **低级 API** - 更灵活，但代码较多

---

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- langchain4j-reactor（响应式编程） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
</dependency>
```

**关键点**：
- **与模块7、8相同** - 不需要额外的依赖
- **Prompt 功能内置** - LangChain4j 核心库已包含

#### 9.3 测试接口与返回

**接口1：使用 @V 注解传递参数**
```
http://localhost:9009/chatprompt/test1
```

**返回示例**：
```
success : 2026-06-05 11:00:00

chat: 知识产权是指权利人对其智力劳动成果所享有的专有权利...

chat2: 抱歉，我只能回答中国法律相关的问题。
```

**说明**：
- **chat** - 回答了知识产权问题（法律相关）
- **chat2** - 拒绝了 Java 问题（非法律领域）
- **chat3** - 拒绝了水果问题（非法律领域）
- **chat4** - 拒绝了飞机问题（非法律领域）
- **@SystemMessage 生效** - 成功限制了 AI 的回答范围

---

**接口2：使用 StructuredPrompt 实体类**
```
http://localhost:9009/chatprompt/test2
```

**返回示例**：
```
success : 2026-06-05 11:00:00

chat: TRIPS协议（与贸易有关的知识产权协议）是世界贸易组织（WTO）成员间的一个重要协议...
```

**说明**：
- **成功回答** - TRIPS 协议是知识产权相关的国际协议
- **实体类方式** - 代码更清晰，易于维护
- **模板替换** - `{{legal}}` 替换为"知识产权"，`{{question}}` 替换为"TRIPS协议?"

---

**接口3：手动使用 PromptTemplate**
```
http://localhost:9009/chatprompt/test3
```

**返回示例**：
```
success : 2026-06-05 11:00:00

chat: 作为财务会计助手，人民币大写需要按照以下规则书写：壹、贰、叁、肆、伍、陆、柒、捌、玖、拾、佰、仟、万...
```

**说明**：
- **手动构建** - 通过 PromptTemplate 构建提示词
- **灵活控制** - 可以动态拼接提示词
- **低级 API** - 适合复杂场景

#### 9.4 知识点总结

✅ **@SystemMessage（系统消息）**  
   - 定义 AI 的角色和行为准则  
   - 在每次对话前自动添加  
   - 类似"人设"设定  
   - 可以限制 AI 的回答范围  

✅ **@UserMessage（用户消息）**  
   - 定义用户消息的模板  
   - 支持变量占位符 `{{variable}}`  
   - 动态替换变量内容  
   - 提高提示词的可复用性  

✅ **@V 注解（变量注解）**  
   - 标记方法参数为模板变量  
   - `@V("question")` - 将参数映射到模板中的 `{{question}}`  
   - 支持多个参数  
   - 类型安全  

✅ **@StructuredPrompt（结构化提示词）**  
   - 在实体类上定义提示词模板  
   - 字段名对应模板变量  
   - 更面向对象的方式  
   - 适合复杂参数场景  

✅ **PromptTemplate（提示词模板）**  
   - 手动构建提示词模板  
   - 使用 `{{it}}` 或 `{{变量名}}` 作为占位符  
   - 通过 `apply()` 方法替换变量  
   - 低级 API，更灵活  

#### 9.5 Prompt 提示词详细讲解

**Prompt 的作用**：
```
Prompt = 给 AI 的指令

就像你给员工下达任务：
1. 你是谁（角色）
2. 你要做什么（任务）
3. 有什么限制（约束）
4. 输出格式（要求）

好的 Prompt = 清晰的指令 = 更好的结果
```

**形象比喻**：
```
Prompt 模板 = 填空题试卷

传统方式（硬编码）：
"请回答：什么是知识产权？"
"请回答：什么是 Java？"
"请回答：介绍下西瓜和芒果"
- 每个问题都要写一遍
- 重复代码多
- 难以维护

模板方式（Prompt Template）：
"请回答以下法律问题：{{question}},字数控制在{{length}}以内"
- 只需定义一次模板
- 动态替换变量
- 代码简洁、易维护

就像老师出试卷，只需准备一份模板，填入不同的题目即可！
```

**三种方式对比**：

**方式1：@V 注解（推荐）**
```java
@UserMessage("请回答以下法律问题：{{question}},字数控制在{{length}}以内")
String chat(@V("question") String question, @V("length") int length);

// 使用
lawAssistant.chat("什么是知识产权？", 2000);
```

**优点**：
- ✅ 代码简洁
- ✅ 类型安全
- ✅ IDE 支持好

**缺点**：
- ❌ 参数多时代码较长

---

**方式2：@StructuredPrompt（推荐复杂场景）**
```java
@StructuredPrompt("根据中国{{legal}}法律，解答以下问题：{{question}}")
public class LawPrompt {
    private String legal;
    private String question;
}

@SystemMessage("...")
String chat(LawPrompt lawPrompt);

// 使用
LawPrompt prompt = new LawPrompt();
prompt.setLegal("知识产权");
prompt.setQuestion("TRIPS协议?");
lawAssistant.chat(prompt);
```

**优点**：
- ✅ 结构清晰
- ✅ 易于扩展
- ✅ 适合复杂参数

**缺点**：
- ❌ 需要额外创建实体类

---

**方式3：PromptTemplate（低级 API）**
```java
PromptTemplate template = PromptTemplate.from("你是一个{{it}}助手,{{question}}怎么办");
Prompt prompt = template.apply(Map.of("it", role, "question", question));
UserMessage userMessage = prompt.toUserMessage();
ChatResponse response = chatModel.chat(userMessage);
```

**优点**：
- ✅ 灵活控制
- ✅ 可以动态拼接

**缺点**：
- ❌ 代码复杂
- ❌ 容易出错

---

**🎯 如何选择？**
- ✅ 简单场景 → 推荐 **@V 注解**
- ✅ 复杂参数 → 推荐 **@StructuredPrompt**
- ✅ 需要动态拼接 → 使用 **PromptTemplate**
- ✅ 生产环境 → 优先使用 **@V 或 @StructuredPrompt**

#### 9.6 @SystemMessage 详细讲解

**@SystemMessage 的作用**：
```
@SystemMessage = AI 的人设设定

就像你面试员工时告诉他：
1. 你的职位是什么（角色）
2. 你的职责是什么（任务）
3. 什么不能做（限制）
4. 工作标准是什么（要求）
```

**示例**：
```java
@SystemMessage("你是一位专业的中国法律顾问，只回答与中国法律相关的问题。" +
        "输出限制：对于其他领域的问题禁止回答，直接返回'抱歉，我只能回答中国法律相关的问题。'")
```

**效果**：
- ✅ 法律问题 → 正常回答
- ❌ 非法律问题 → 拒绝回答

**应用场景**：
- 🎯 **角色限定** - 让 AI 扮演特定角色（律师、医生、教师等）
- 🔒 **安全限制** - 防止 AI 回答敏感问题
- 📋 **格式规范** - 统一输出格式
- 🚫 **内容过滤** - 过滤不当内容

#### 9.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **Prompt 提示词能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **@SystemMessage** | ✅ 支持 | ✅ 支持（SystemPromptTemplate） | ✅ 支持（SystemPromptTemplate） |
| **@UserMessage** | ✅ 支持 | ✅ 支持（UserPromptTemplate） | ✅ 支持（UserPromptTemplate） |
| **@V 注解** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **@StructuredPrompt** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| **PromptTemplate** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **变量替换** | ✅ `{{variable}}` | ✅ `{variable}` | ✅ `{variable}` |

#### **详细代码对比**

**1️⃣ LangChain4j（@SystemMessage + @UserMessage + @V）**：
```java
@SystemMessage("你是一位专业的中国法律顾问")
@UserMessage("请回答以下法律问题：{{question}},字数控制在{{length}}以内")
String chat(@V("question") String question, @V("length") int length);
```

**📖 详细讲解**：
- LangChain4j 提供完整的 Prompt 注解支持
- @SystemMessage - 系统消息
- @UserMessage - 用户消息模板
- @V - 变量映射
- 代码简洁，类型安全

---

**2️⃣ Spring AI（PromptTemplate）**：
```java
// Spring AI 不支持 @SystemMessage 和 @UserMessage 注解
// 需要手动构建 Prompt
Prompt prompt = new Prompt(
    "你是一位专业的中国法律顾问\n请回答以下法律问题：" + question
);
ChatResponse response = chatClient.prompt(prompt).call();
```

**📖 详细讲解**：
- Spring AI 不支持声明式 Prompt
- 需要手动拼接字符串
- 代码较复杂

---

**3️⃣ Spring AI Alibaba（PromptTemplate）**：
```java
// 与 Spring AI 相同
Prompt prompt = new Prompt(
    "你是一位专业的中国法律顾问\n请回答以下法律问题：" + question
);
ChatResponse response = chatClient.prompt(prompt).call();
```

**📖 详细讲解**：
- Spring AI Alibaba 继承 Spring AI 的 Prompt 机制
- 不支持声明式 Prompt
- 需要手动拼接字符串

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| 声明式 Prompt | ✅ 支持（注解） | ❌ 不支持 |
| 代码简洁度 | ✅ 高 | 中 |
| 类型安全 | ✅ 高（@V 注解） | 低（字符串拼接） |
| 灵活性 | ✅ 高 | ✅ 高 |
| 学习曲线 | 中 | ✅ 低 |

**🎯 如何选择？**
- ✅ 需要声明式 Prompt → 推荐 **LangChain4j**
- ✅ 追求代码简洁 → 推荐 **LangChain4j**
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 9.8 技术要点

**@SystemMessage 的要点**：
- 🎭 **角色设定** - 明确 AI 的身份和职责
- 🔒 **安全限制** - 防止 AI 回答不当内容
- 📋 **格式规范** - 统一输出格式
- ⚠️ **优先级最高** - SystemMessage 会覆盖用户指令

**@UserMessage 的要点**：
- 📝 **模板化** - 提高代码复用性
- 🔤 **变量替换** - 动态生成提示词
- 🎯 **占位符** - 使用 `{{variable}}` 格式
- ✅ **类型安全** - 配合 @V 注解使用

**@V 注解的要点**：
- 🔑 **变量映射** - 将方法参数映射到模板变量
- 📊 **支持多种类型** - String、int、double 等
- 🎯 **名称匹配** - `@V("name")` 对应 `{{name}}`
- ✅ **可选** - 参数名与变量名相同时可省略

**@StructuredPrompt 的要点**：
- 🏗️ **结构化** - 用实体类组织参数
- 📦 **字段映射** - 字段名对应模板变量
- 🔄 **易于扩展** - 添加新字段即可
- 💼 **适合复杂场景** - 参数多时使用

**适用场景**：
- ✅ 角色扮演 - 客服、顾问、教师等
- ✅ 内容生成 - 文章、代码、翻译等
- ✅ 数据分析 - 提取、分类、总结等
- ✅ 安全控制 - 过滤敏感内容

**注意事项**：
- ⚠️ @SystemMessage 会影响 AI 的行为，谨慎使用
- ⚠️ 占位符格式必须正确（`{{variable}}`）
- ⚠️ @V 注解的参数名必须与占位符一致
- ⚠️ StructuredPrompt 的字段必须有 getter/setter

#### 9.10 低级 API vs 高级 API 详细对比

**核心概念**：
LangChain4j 提供了两种不同层次的 API，分别适用于不同的场景。

---

##### **📊 对比总览**

| 对比维度 | 低级 API（Low Level） | 高级 API（High Level） |
|---------|---------------------|----------------------|
| **代表类** | `ChatModel` | `AiServices.create()` |
| **使用方式** | 手动构建 Prompt | 声明式接口 + 注解 |
| **代码复杂度** | 高（需要手动拼接） | 低（自动处理） |
| **灵活性** | ✅ 高（完全控制） | 中（基于约定） |
| **类型安全** | ❌ 低（字符串拼接） | ✅ 高（编译期检查） |
| **提示词模板** | ❌ 手动管理 | ✅ 自动管理 |
| **适用场景** | 底层开发、精细控制 | 业务开发、快速迭代 |
| **类比** | MyBatis（原生SQL） | MyBatis-Plus（增强API） |

---

##### **1️⃣ 低级 API（Low Level API）**

**定义**：直接操作 `ChatModel`，手动构建 Prompt，直接调用模型。

**示例代码**（模块9 - test3）：
```java
@GetMapping(value = "/chatprompt/test3")
public String test3()
{
    String role = "财务会计";
    String question = "人民币大写";

    // 1. 构造 PromptTemplate 模板
    PromptTemplate template = PromptTemplate.from("你是一个{{it}}助手,{{question}}怎么办");
    
    // 2. 由 PromptTemplate 生成 Prompt
    Prompt prompt = template.apply(Map.of("it", role, "question", question));
    
    // 3. Prompt 提示词变成 UserMessage
    UserMessage userMessage = prompt.toUserMessage();
    
    // 4. 调用大模型
    ChatResponse chatResponse = chatModel.chat(userMessage);

    System.out.println(chatResponse.aiMessage().text());
    
    return "success : "+ DateUtil.now()+"<br> \n\n chat: "+chatResponse.aiMessage().text();
}
```

**关键点**：
- ✅ **完全控制** - 你可以精确控制每一步
- ✅ **灵活性高** - 可以动态拼接任何内容
- ❌ **代码复杂** - 需要手动构建 Prompt、转换 Message
- ❌ **容易出错** - 字符串拼接容易遗漏或格式错误
- ❌ **难以维护** - 提示词分散在代码中

**流程详解**：
```
1. 创建 PromptTemplate（提示词模板）
   ↓
2. 应用变量替换（apply）
   ↓
3. 转换为 UserMessage
   ↓
4. 调用 ChatModel.chat()
   ↓
5. 获取 ChatResponse
   ↓
6. 提取 AI 消息文本
```

**形象比喻**：
```
低级 API = 手动挡汽车

优点：
- 你可以精确控制每一个档位
- 适合赛车手（高级开发者）
- 灵活性最高

缺点：
- 需要频繁换挡（手动构建 Prompt）
- 容易熄火（容易出错）
- 学习曲线陡峭
```

---

##### **2️⃣ 高级 API（High Level API）**

##### **定义**：通过 `AiServices.create()` 创建声明式服务，使用注解定义提示词模板。

**示例代码**（模块9 - LawAssistant）：

**步骤1：定义接口**
```java
public interface LawAssistant
{
    @SystemMessage("你是一位专业的中国法律顾问，只回答与中国法律相关的问题。" +
            "输出限制：对于其他领域的问题禁止回答，直接返回'抱歉，我只能回答中国法律相关的问题。'")

    @UserMessage("请回答以下法律问题：{{question}},字数控制在{{length}}以内")

    String chat(@V("question") String question, @V("length") int length);
}
```

**步骤2：配置 Bean**
```java
@Bean
public LawAssistant lawAssistant(ChatModel chatModel) {
    return AiServices.create(LawAssistant.class, chatModel);
}
```

**步骤3：注入使用**
```java
@Resource
private LawAssistant lawAssistant;

@GetMapping("/test")
public String test() {
    // 一行代码完成所有操作！
    String answer = lawAssistant.chat("什么是知识产权？", 2000);
    return answer;
}
```

**关键点**：
- ✅ **代码简洁** - 一行代码完成复杂操作
- ✅ **类型安全** - 编译期检查参数类型
- ✅ **易于维护** - 提示词集中在接口上
- ✅ **可读性好** - 像调用普通方法一样
- ❌ **灵活性稍低** - 基于约定的方式

**流程详解**（自动完成）：
```
1. 开发者调用 lawAssistant.chat("什么是知识产权？", 2000)
   ↓
2. LangChain4j 代理拦截方法调用（自动）
   ↓
3. 读取 @SystemMessage 和 @UserMessage（自动）
   ↓
4. 替换变量：{{question}} → "什么是知识产权？"，{{length}} → 2000（自动）
   ↓
5. 拼接完整的 Prompt（自动）
   ↓
6. 调用 ChatModel.chat()（自动）
   ↓
7. 接收 AI 响应并返回（自动）
```

**形象比喻**：
```
高级 API = 自动挡汽车

优点：
- 只需踩油门和刹车（调用方法）
- 自动换挡（自动构建 Prompt）
- 适合日常驾驶（业务开发）

缺点：
- 无法精确控制每个档位
- 不适合赛车（特殊场景）
```

---

##### **3️⃣ 两种方式对比示例**

**场景**：创建一个法律顾问 AI，回答知识产权问题。

---

**❌ 低级 API 实现**：
```java
@RestController
public class LegalController {
    @Resource
    private ChatModel chatModel;
    
    @GetMapping("/legal/query")
    public String queryLegal(String question) {
        // 1. 手动拼接系统消息
        String systemMessage = "你是一位专业的中国法律顾问，只回答与中国法律相关的问题。";
        
        // 2. 手动拼接用户消息
        String userMessage = String.format(
            "请回答以下法律问题：%s,字数控制在%d以内",
            question,
            2000
        );
        
        // 3. 构建完整的 Prompt
        String fullPrompt = systemMessage + "\n" + userMessage;
        
        // 4. 创建 UserMessage 对象
        UserMessage userMsg = UserMessage.from(fullPrompt);
        
        // 5. 调用模型
        ChatResponse response = chatModel.chat(userMsg);
        
        // 6. 提取结果
        return response.aiMessage().text();
    }
}
```

**问题分析**：
- ❌ 代码冗长（6个步骤）
- ❌ 字符串拼接容易出错
- ❌ 提示词硬编码在控制器中
- ❌ 难以复用和维护

---

**✅ 高级 API 实现**：
```java
// 1. 定义接口（提示词集中管理）
public interface LawAssistant {
    @SystemMessage("你是一位专业的中国法律顾问，只回答与中国法律相关的问题。")
    @UserMessage("请回答以下法律问题：{{question}},字数控制在{{length}}以内")
    String chat(@V("question") String question, @V("length") int length);
}

// 2. 配置 Bean
@Configuration
public class LLMConfig {
    @Bean
    public LawAssistant lawAssistant(ChatModel chatModel) {
        return AiServices.create(LawAssistant.class, chatModel);
    }
}

// 3. 控制器（简洁明了）
@RestController
public class LegalController {
    @Resource
    private LawAssistant lawAssistant;
    
    @GetMapping("/legal/query")
    public String queryLegal(String question) {
        // 一行代码搞定！
        return lawAssistant.chat(question, 2000);
    }
}
```

**优势分析**：
- ✅ 代码简洁（1行 vs 6行）
- ✅ 类型安全（编译期检查）
- ✅ 提示词集中管理（接口上）
- ✅ 易于复用和维护

---

##### **4️⃣ 何时使用哪种 API？**

**推荐使用高级 API 的场景**：
- ✅ **业务开发** - 大部分应用场景
- ✅ **快速原型** - 快速验证想法
- ✅ **团队协作** - 代码易读易维护
- ✅ **提示词复杂** - 需要模板化、变量替换
- ✅ **多轮对话** - 需要记忆、工具调用等

**推荐使用低级 API 的场景**：
- ✅ **底层框架开发** - 需要精细控制
- ✅ **特殊需求** - 高级 API 无法满足
- ✅ **性能优化** - 需要绕过某些抽象层
- ✅ **调试排查** - 查看中间过程
- ✅ **学习理解** - 理解底层原理

---

##### **5️⃣ 混合使用**

在实际项目中，可以**混合使用**两种 API：

```java
@RestController
public class MixedController {
    @Resource
    private LawAssistant lawAssistant;  // 高级 API
    
    @Resource
    private ChatModel chatModel;        // 低级 API
    
    // 常规业务 - 使用高级 API
    @GetMapping("/legal/query")
    public String queryLegal(String question) {
        return lawAssistant.chat(question, 2000);
    }
    
    // 特殊需求 - 使用低级 API
    @GetMapping("/custom/prompt")
    public String customPrompt() {
        // 动态构建复杂的 Prompt
        PromptTemplate template = PromptTemplate.from("...");
        Prompt prompt = template.apply(...);
        ChatResponse response = chatModel.chat(prompt.toUserMessage());
        return response.aiMessage().text();
    }
}
```

---

##### **6️⃣ 类比总结**

| 类比 | 低级 API | 高级 API |
|------|---------|---------|
| **数据库** | JDBC（原生SQL） | MyBatis-Plus（ORM） |
| **Web开发** | Servlet（原生） | Spring MVC（框架） |
| **汽车** | 手动挡 | 自动挡 |
| **烹饪** | 从买菜开始 | 预制菜加热 |
| **编程** | 汇编语言 | Java/Python |

**核心理念**：
- **低级 API** - 提供最大灵活性，但需要更多代码
- **高级 API** - 简化开发，提高生产力，但牺牲部分灵活性
- **最佳实践** - 优先使用高级 API，特殊场景再用低级 API

---

##### **7️⃣ 模块9中的三种方式对比**

模块9演示了三种不同的 Prompt 构建方式：

| 方式 | API 层次 | 代码示例 | 适用场景 |
|------|---------|---------|---------|
| **@V 注解** | 高级 API | `lawAssistant.chat(question, length)` | ✅ 推荐，简单场景 |
| **@StructuredPrompt** | 高级 API | `lawAssistant.chat(lawPrompt)` | ✅ 推荐，复杂参数 |
| **PromptTemplate** | 低级 API | `template.apply(Map.of(...))` | ⚠️ 特殊需求 |

**选择建议**：
- ✅ **优先使用 @V 注解** - 代码最简洁
- ✅ **参数多用 @StructuredPrompt** - 结构清晰
- ⚠️ **必要时用 PromptTemplate** - 灵活控制

---

### 模块10：langchain4j-10chat-persistence - 对话持久化

#### 10.1 模块概述
- **端口**：`9010`
- **功能**：演示 LangChain4j 的对话记忆持久化功能，将对话历史保存到 Redis
- **核心概念**：`ChatMemoryStore`、`RedisChatMemoryStore`、持久化、序列化 / 反序列化
- **测试结果**：✅ Redis 容器数据持久化成功，多用户隔离正常工作

---

#### 10.2 核心代码

**📋 流程总览**：
```
对话请求 → chatMemoryAssistant.chat(userId, message) → MessageWindowChatMemory 
→ RedisChatMemoryStore.getMessages() → 从Redis读取历史 → ChatModel发送请求(含历史) 
→ RedisChatMemoryStore.updateMessages() → 保存新消息到Redis → 返回结果
```

**📊 完整调用流程图**：
```
持久化对话流程：
┌─────────────┐
│   用户请求   │ userId=1, message="我叫张三"
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ Controller              │ chatPersistenceAssistant.chat(1L, msg)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ ChatPersistenceAssistant│ @MemoryId=1L
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ MessageWindowChatMemory │ 管理记忆窗口
└──────┬──────────────────┘
       │ .getMessages(1L)
       ▼
┌─────────────────────────┐
│ RedisChatMemoryStore    │ getMessages()
│                         │ redisTemplate.get("CHAT_MEMORY:1")
└──────┬──────────────────┘
       │ 反序列化JSON
       ▼
┌─────────────────────────┐
│   List<ChatMessage>     │ 历史消息列表
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   ChatModel             │ 发送请求(含历史消息)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   AI 响应               │ "你好，张三"
└──────┬──────────────────┘
       │ .updateMessages(1L, messages)
       ▼
┌─────────────────────────┐
│ RedisChatMemoryStore    │ updateMessages()
│                         │ redisTemplate.set(...)
└──────┬──────────────────┘
       │ 序列化JSON
       ▼
┌─────────────────────────┐
│   Redis 存储            │ CHAT_MEMORY:1 = JSON
└─────────────────────────┘

下次重启应用后：
       ↓
从 Redis 读取历史 → AI 仍然记得"我叫张三"
```

---

##### **1️⃣ 配置类初始化：LLMConfig.java**

```java
@Configuration
public class LLMConfig {

    @Resource
    private RedisChatMemoryStore redisChatMemoryStore;

    @Bean
    public ChatModel chatModel() {
        return OpenAiChatModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    @Bean
    public ChatPersistenceAssistant chatMemoryAssistant(ChatModel chatModel) {
        ChatMemoryProvider chatMemoryProvider = memoryId -> MessageWindowChatMemory.builder()
                .id(memoryId)
                .maxMessages(1000)
                .chatMemoryStore(redisChatMemoryStore)
                .build();

        return AiServices.builder(ChatPersistenceAssistant.class)
                .chatModel(chatModel)
                .chatMemoryProvider(chatMemoryProvider)
                .build();
    }
}
```

**关键点**：
- `.chatMemoryStore(redisChatMemoryStore)`：配置 Redis 作为持久化存储
- 与模块 8 的区别：模块 8 使用内存存储，模块 10 使用 Redis 持久化

---

##### ② Redis 存储实现：`RedisChatMemoryStore.java`

```java
@Component
public class RedisChatMemoryStore implements ChatMemoryStore {

    public static final String CHAT_MEMORY_PREFIX = "CHAT_MEMORY:";

    @Resource
    private RedisTemplate<String, String> redisTemplate;

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String retValue = redisTemplate.opsForValue().get(CHAT_MEMORY_PREFIX + memoryId);
        return ChatMessageDeserializer.messagesFromJson(retValue);
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        redisTemplate.opsForValue()
                .set(CHAT_MEMORY_PREFIX + memoryId, ChatMessageSerializer.messagesToJson(messages));
    }

    @Override
    public void deleteMessages(Object memoryId) {
        redisTemplate.delete(CHAT_MEMORY_PREFIX + memoryId);
    }
}
```

**关键点**：
- 实现 `ChatMemoryStore` 接口：LangChain4j 提供的持久化接口
- 三个核心方法：`getMessages`、`updateMessages`、`deleteMessages`
- 序列化 / 反序列化：`ChatMessageSerializer` / `ChatMessageDeserializer`

---

##### ③ 服务接口：`ChatPersistenceAssistant.java`

```java
public interface ChatPersistenceAssistant {
    String chat(@MemoryId Long userId, @UserMessage String message);
}
```

---

##### ④ 控制器：`ChatPersistenceController.java`

```java
@GetMapping(value = "/chatpersistence/redis")
public String testChatPersistence() {
    chatPersistenceAssistant.chat(1L, "你好！我的名字是redis");
    chatPersistenceAssistant.chat(2L, "你好！我的名字是nacos");

    String chat = chatPersistenceAssistant.chat(1L, "我的名字是什么");
    System.out.println(chat);

    chat = chatPersistenceAssistant.chat(2L, "我的名字是什么");
    System.out.println(chat);

    return "testChatPersistence success : " + DateUtil.now();
}
```

##### ⑤ POM 依赖

```xml
<!-- Redis 支持 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

---

##### ⑥ 配置文件：`application.properties`

```properties
# Redis 配置
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.database=0
spring.data.redis.connect-timeout=3s
spring.data.redis.timeout=2s
```

---

#### 10.3 测试接口与返回

| 项目          | 内容                                                |
| :------------ | :-------------------------------------------------- |
| **接口地址**  | `http://localhost:9010/chatpersistence/redis`       |
| **返回结果**  | `testChatPersistence success : 2026-06-05 20:34:56` |
| **Redis Key** | `CHAT_MEMORY:1`、`CHAT_MEMORY:2`                    |

**Redis 容器截图关键证据**：
- 第 14 行：`"CHAT_MEMORY:2"` — 用户 2 的对话记忆
- 第 17 行：`"CHAT_MEMORY:1"` — 用户 1 的对话记忆

**验证结论**：
- ✅ 对话已成功持久化到 Redis
- ✅ 多用户隔离正常工作（userId=1 和 userId=2 的记忆分开存储）
- ✅ Key 命名符合预期（`CHAT_MEMORY:` + memoryId）

---

#### 10.4 知识点总结

| 知识点                   | 说明                                                |
| :----------------------- | :-------------------------------------------------- |
| ✅ `ChatMemoryStore` 接口 | LangChain4j 提供的持久化接口标准                    |
| ✅ Redis 持久化           | 通过 `RedisChatMemoryStore` 实现                    |
| ✅ 序列化 / 反序列化      | `ChatMessageSerializer` / `ChatMessageDeserializer` |
| ✅ 多用户隔离             | 通过 `@MemoryId` 注解区分不同用户                   |
| ✅ 与内存存储的区别       | 模块 8（内存）vs 模块 10（Redis）                   |

---

#### 10.5 持久化详细讲解（形象比喻）

| 存储方式                    | 比喻   | 特点                                 |
| :-------------------------- | :----- | :----------------------------------- |
| **内存存储（模块 8）**      | 便签纸 | 写在便签上，关机就丢了，适合临时记忆 |
| **Redis 持久化（模块 10）** | 笔记本 | 写在笔记本上，关机也在，适合长期记忆 |

---

#### 10.6 模块 8 vs 模块 10 对比

| 特性         | 模块 8（内存） | 模块 10（Redis） |
| :----------- | :------------- | :--------------- |
| **存储位置** | JVM 内存       | Redis 数据库     |
| **持久化**   | ❌ 应用重启丢失 | ✅ 应用重启保留   |
| **分布式**   | ❌ 不支持       | ✅ 支持           |
| **性能**     | 快             | 中等             |
| **适用场景** | 开发测试       | 生产环境         |

---

### 模块11：langchain4j-11chat-functioncalling - 函数调用

#### 11.1 模块概述
- **端口**: 9011（推测，未在配置文件中明确）
- **功能**: 演示 LangChain4j 的函数调用（Function Calling）功能，让 AI 能够调用自定义工具执行实际业务操作
- **核心概念**: @Tool、@P、AiServices、ToolSpecification、Low Level API vs High Level API

#### 11.2 核心代码

**📋 流程总览**：
```
用户输入 → FunctionAssistant.chat() → AiServices代理 → ChatModel分析意图 
→ 识别需要调用工具 → InvoiceHandler.handle() → WeatherService.getWeatherV2()
→ 返回结果 → 组装响应 → 返回给用户
```

**📊 完整调用流程图**：
```
┌─────────────┐
│   用户请求   │ "开张发票,公司：尚硅谷教育科技有限公司 税号：atguigu533 金额：668.12"
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ ChatFunctionCallingCtrl │ test1() 方法接收请求
└──────┬──────────────────┘
       │ @Resource 注入
       ▼
┌─────────────────────────┐
│  FunctionAssistant      │ 接口定义（声明式服务）
│  (AiServices 代理)      │
└──────┬──────────────────┘
       │ .chat() 调用
       ▼
┌─────────────────────────┐
│    ChatModel            │ qwen-plus 模型分析用户意图
│  (OpenAiChatModel)      │ 识别需要调用开票工具
└──────┬──────────────────┘
       │ 提取参数
       ▼
┌─────────────────────────┐
│   InvoiceHandler        │ @Tool 标注的工具类
│   .handle()             │ 执行开票业务逻辑
└──────┬──────────────────┘
       │ 内部调用
       ▼
┌─────────────────────────┐
│   WeatherService        │ 第三方服务示例
│   .getWeatherV2()       │ 调用和风天气API
└──────┬──────────────────┘
       │ 返回结果
       ▼
┌─────────────────────────┐
│   返回"开票成功"        │ 最终响应给用户
└─────────────────────────┘
```

---

**1️⃣ 定义接口：FunctionAssistant.java**
```java
package com.atguigu.study.service;

/**
 * @auther zzyybs@126.com
 * @Date 2025-06-02 16:56
 * @Description: TODO
 */
public interface FunctionAssistant
{
    //客户指令：出差住宿发票开票，
    // 开票信息:    公司名称xxx
    // 税号序列:    xx
    // 开票金额:    xxx.00元
    String chat(String message);
}
```

**作用说明**：
- **声明式 AI 服务接口** - LangChain4j 高级 API 的标准做法
- **单一方法** - `chat(String message)` 接收用户消息
- **无需实现类** - 由 `AiServices.builder()` 自动生成代理实现
- **类似 MyBatis Mapper** - 只需定义接口，框架自动实现

**关键点**：
- ✅ 这是 LangChain4j 高阶 API 的核心用法
- ✅ 通过接口抽象，实现业务逻辑与 AI 调用的解耦
- ✅ 支持依赖注入，便于在控制器中使用

---

**2️⃣ 实现工具：InvoiceHandler.java**
```java
package com.atguigu.study.service;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;

/**
 * @auther zzyy
 * @create 2025-03-12 23:28
 * 知识出处，https://docs.langchain4j.dev/tutorials/tools/#tool
 */
@Slf4j
public class InvoiceHandler
{

    @Tool("根据用户提交的开票信息进行开票")
    public String handle(@P("公司名称") String companyName,
                         @P("税号") String dutyNumber,
                         @P("金额保留两位有效数字") String amount) throws Exception
    {
        log.info("companyName =>>>> {} dutyNumber =>>>> {} amount =>>>> {}", companyName, dutyNumber, amount);
        //----------------------------------
        // 这块写自己的业务逻辑，调用redis/rabbitmq/kafka/mybatis/顺丰单据/医疗化验报告/支付接口等第3方
        //----------------------------------
        System.out.println(new WeatherService().getWeatherV2("101010100"));

        return "开票成功";
    }
}
```

**作用说明**：
- **工具类** - 封装具体的业务逻辑（开票功能）
- **@Tool 注解** - 标记这是一个可供 AI 调用的工具
  - 描述文本："根据用户提交的开票信息进行开票"
  - AI 会根据这个描述判断何时调用此工具
- **@P 注解** - 为参数添加描述，帮助 AI 理解参数含义
  - `@P("公司名称")` - 告诉 AI 这个参数是公司名称
  - `@P("税号")` - 告诉 AI 这个参数是税号
  - `@P("金额保留两位有效数字")` - 告诉 AI 这个参数是金额
- **业务逻辑** - 可以调用任何第三方服务（Redis、RabbitMQ、MyBatis、支付接口等）
- **嵌套调用** - 示例中调用了 `WeatherService` 演示工具嵌套

**关键点**：
- ✅ `@Tool` 注解是核心，没有它 AI 无法发现这个工具
- ✅ `@P` 注解提升 AI 理解能力，非必需但强烈推荐
- ✅ 工具方法可以是任意复杂的业务逻辑
- ✅ 返回值会被 AI 用来生成最终响应

---

**3️⃣ 第三方服务：WeatherService.java**
```java
package com.atguigu.study.service;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.Resource;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @auther zzyy
 * @create 2025-03-12 23:24
 */
@Service
public class WeatherService
{
    //和风天气开发服务 https://dev.qweather.com/

    // 替换成你自己的和风天气API密钥
    private static final String API_KEY = System.getenv("weatherAPI");
    // 调用的url地址和指定的城市，本案例以北京为例
    private static final String BASE_URL = "https://devapi.qweather.com/v7/weather/now?location=%s&key=%s";

    public JsonNode getWeatherV2(String city) throws Exception
    {
        //1 传入调用地址url和apikey
        String url = String.format(BASE_URL, city, API_KEY);

        //2 使用默认配置创建HttpClient实例
        var httpClient = HttpClients.createDefault();

        //3 创建请求工厂并将其设置给RestTemplate，开启微服务调用和风天气开发服务
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
        //4 RestTemplate微服务调用
        String response = new RestTemplate(factory).getForObject(url, String.class);

        //5 解析JSON响应获得第3方和风天气返回的天气预报信息
        JsonNode jsonNode = new ObjectMapper().readTree(response);

        //6 想知道具体信息和结果请查看https://dev.qweather.com/docs/api/weather/weather-now/#response
        return jsonNode;
    }
}
```

**作用说明**：
- **第三方服务示例** - 演示工具内部可以调用外部 API
- **和风天气 API** - 真实的天气查询服务
- **RestTemplate 调用** - Spring 标准的 HTTP 客户端
- **JSON 解析** - 使用 Jackson 解析响应数据
- **环境变量读取** - API Key 从环境变量获取（`System.getenv("weatherAPI")`）

**关键点**：
- ⚠️ 需要配置环境变量 `weatherAPI` 才能正常使用
- ✅ 展示了工具可以嵌套调用其他服务
- ✅ 实际项目中可以替换为任何业务相关的第三方服务

---

**4️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import com.atguigu.study.service.FunctionAssistant;
import com.atguigu.study.service.InvoiceHandler;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.json.JsonObjectSchema;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.tool.ToolExecutor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * @auther zzyybs@126.com
 * @Date 2025-06-02 16:59
 * @Description: TODO
 */
@Configuration
public class LLMConfig
{
    @Bean
    public ChatModel chatModel()
    {
        return OpenAiChatModel.builder()
                .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                .modelName("qwen-plus")
                .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    /**
    * @Description: 第一组 Low Level Tool API
     * https://docs.langchain4j.dev/tutorials/tools#low-level-tool-api
    * @Auther: zzyybs@126.com
    */
    /*@Bean
    public FunctionAssistant functionAssistant(ChatModel chatModel)
    {
        // 工具说明 ToolSpecification
        ToolSpecification toolSpecification = ToolSpecification.builder()
                    .name("开具发票助手")
                    .description("根据用户提交的开票信息，开具发票")
                    .parameters(JsonObjectSchema.builder()
                                .addStringProperty("companyName", "公司名称")
                                .addStringProperty("dutyNumber", "税号序列")
                                .addStringProperty("amount", "开票金额，保留两位有效数字")
                            .build())
                .build();


        // 业务逻辑 ToolExecutor
        ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
            System.out.println(toolExecutionRequest.id());
            System.out.println(toolExecutionRequest.name());
            String arguments1 = toolExecutionRequest.arguments();
            System.out.println("arguments1****》 " + arguments1);
            return "开具成功";
        };

        return AiServices.builder(FunctionAssistant.class)
                .chatModel(chatModel)
                .tools(Map.of(toolSpecification, toolExecutor)) // Tools (Function Calling)
                .build();
    }*/



    /**
    * @Description: 第二组 High Level Tool API
     * https://docs.langchain4j.dev/tutorials/tools#high-level-tool-api
    * @Auther: zzyybs@126.com
    */
    @Bean
    public FunctionAssistant functionAssistant(ChatModel chatModel)
    {
        return AiServices.builder(FunctionAssistant.class)
                    .chatModel(chatModel)
                    .tools(new InvoiceHandler())
                .build();
    }
}
```

**作用说明**：

**chatModel() - 原始 ChatModel 初始化**：
- 创建 `OpenAiChatModel` 实例
- 配置 API Key、模型名称、baseUrl
- 与其他模块相同的基础配置

**functionAssistant() - 高阶 AiServices 初始化**：
- **绑定接口** - `FunctionAssistant.class`
- **注入模型** - `.chatModel(chatModel)`
- **注册工具** - `.tools(new InvoiceHandler())`
- **构建代理** - `.build()` 返回代理实例

**两种 API 对比**：

**Low Level Tool API（已注释）**：
```java
// 手动定义工具规范
ToolSpecification toolSpecification = ToolSpecification.builder()
    .name("开具发票助手")
    .description("根据用户提交的开票信息，开具发票")
    .parameters(JsonObjectSchema.builder()
        .addStringProperty("companyName", "公司名称")
        .addStringProperty("dutyNumber", "税号序列")
        .addStringProperty("amount", "开票金额，保留两位有效数字")
        .build())
    .build();

// 手动实现工具执行器
ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
    // 手动解析参数
    String arguments = toolExecutionRequest.arguments();
    // 执行业务逻辑
    return "开具成功";
};

// 注册工具
.tools(Map.of(toolSpecification, toolExecutor))
```

**High Level Tool API（当前使用）**：
```java
// 只需传入工具对象，框架自动解析 @Tool 和 @P 注解
.tools(new InvoiceHandler())
```

**关键点**：
- ✅ **推荐 High Level API** - 代码简洁，易于维护
- ✅ **Low Level API 更灵活** - 适合动态注册工具的场景
- ✅ **AiServices.builder()** - 核心构建器，负责创建代理
- ✅ **.tools()** - 注册工具，可以传入多个工具对象

---

**5️⃣ 控制器使用：ChatFunctionCallingController.java**
```java
package com.atguigu.study.controller;

import cn.hutool.core.date.DateUtil;
import com.atguigu.study.service.FunctionAssistant;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @auther zzyybs@126.com
 * @Date 2025-06-02 17:01
 * @Description: TODO
 */
@RestController
@Slf4j
public class ChatFunctionCallingController
{
    @Resource
    private FunctionAssistant functionAssistant;

    //  http://localhost:9011/chatfunction/test1
    @GetMapping(value = "/chatfunction/test1")
    public String test1()
    {
        String chat = functionAssistant.chat("开张发票,公司：尚硅谷教育科技有限公司 税号：atguigu533 金额：668.12");

        System.out.println(chat);

        return "success : "+ DateUtil.now() + "\t"+chat;
    }
}
```

**作用说明**：
- **注入代理实例** - `@Resource` 注入 `FunctionAssistant` 代理
- **调用方法** - `functionAssistant.chat()` 像普通方法一样调用
- **用户消息** - 包含开票信息的自然语言描述
- **内部流程**：
  1. 代理将消息发送给 ChatModel
  2. ChatModel 分析意图，识别需要调用开票工具
  3. 提取参数（公司名称、税号、金额）
  4. 调用 `InvoiceHandler.handle()` 方法
  5. 获取返回结果 "开票成功"
  6. 组装最终响应返回给用户

**关键点**：
- ✅ **声明式调用** - 开发者无需关心工具调用细节
- ✅ **自然语言交互** - 用户用自然语言描述需求
- ✅ **自动参数提取** - AI 自动从消息中提取结构化参数
- ✅ **业务逻辑解耦** - AI 调用与业务实现完全分离

---

**配置文件：application.properties**（推测）
```properties
server.port=9011

spring.application.name=langchain4j-11chat-functioncalling
```

**POM依赖**：
```xml
<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- langchain4j-reactor（响应式编程） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-reactor</artifactId>
</dependency>

<!-- httpclient5（HTTP 客户端） -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.5</version>
</dependency>

<!-- hutool（工具类库） -->
<dependency>
    <groupId>cn.hutool</groupId>
    <artifactId>hutool-all</artifactId>
    <version>5.8.22</version>
</dependency>
```

**关键点**：
- **httpclient5** - 用于 `WeatherService` 调用和风天气 API
- **hutool** - 用于日期格式化等工具功能
- **其他依赖** - 与前几个模块相同

#### 11.3 测试接口与返回

**接口1：函数调用测试**
```
http://localhost:9011/chatfunction/test1
```

**返回示例**：
```
success : 2026-06-05 11:30:00	开票成功
```

**控制台输出**：
```
companyName =>>>> 尚硅谷教育科技有限公司 dutyNumber =>>>> atguigu533 amount =>>>> 668.12
{...天气数据...}
开票成功
```

**响应时间**: 约 2-3 秒（取决于模型响应速度和第三方 API 调用）

**流程详解**：
1. 用户访问接口
2. `FunctionAssistant.chat()` 被调用
3. AI 分析消息："开张发票,公司：尚硅谷教育科技有限公司 税号：atguigu533 金额：668.12"
4. AI 识别需要调用开票工具
5. AI 提取参数：
   - companyName = "尚硅谷教育科技有限公司"
   - dutyNumber = "atguigu533"
   - amount = "668.12"
6. 调用 `InvoiceHandler.handle(companyName, dutyNumber, amount)`
7. `InvoiceHandler` 打印日志
8. `InvoiceHandler` 调用 `WeatherService.getWeatherV2("101010100")`（北京天气）
9. 返回 "开票成功"
10. AI 将结果组装成最终响应
11. 返回给用户

#### 11.4 知识点总结

✅ **@Tool 注解** - 标记工具方法  
   - 告诉 LangChain4j 这个方法可以被 AI 调用
   - 描述文本帮助 AI 理解工具的用途
   - 示例：`@Tool("根据用户提交的开票信息进行开票")`

✅ **@P 注解** - 参数描述  
   - 为方法参数添加语义描述
   - 帮助 AI 理解每个参数的含义
   - 提升参数提取的准确性
   - 示例：`@P("公司名称") String companyName`

✅ **AiServices.builder()** - 构建声明式 AI 服务  
   - 核心构建器，负责创建代理实例
   - 绑定接口、注入模型、注册工具
   - 自动生成接口的实现类
   - 内部处理工具调用逻辑

✅ **Low Level vs High Level API**  
   - **Low Level** - 手动定义 `ToolSpecification` 和 `ToolExecutor`
     - 优点：灵活性高，可动态注册工具
     - 缺点：代码复杂，需要手动解析参数
   - **High Level** - 直接使用 `@Tool` 注解的对象
     - 优点：代码简洁，易于维护
     - 缺点：需要在编译时确定工具
   - **推荐** - 大多数场景使用 High Level API

✅ **工具嵌套调用**  
   - 工具方法内部可以调用其他服务
   - 示例：`InvoiceHandler` 调用 `WeatherService`
   - 实现复杂的业务流程

✅ **自然语言到结构化数据**  
   - AI 自动从自然语言中提取结构化参数
   - 示例：从 "开张发票,公司：xxx 税号：yyy 金额：zzz" 提取三个参数
   - 减少前端表单验证工作

✅ **业务逻辑解耦**  
   - AI 调用层与业务实现层完全分离
   - 修改业务逻辑不影响 AI 调用
   - 便于单元测试和维护

#### 11.5 函数调用详细讲解

**函数调用的工作流程**：
```
1. 用户发送消息
   ↓
2. AiServices 代理接收消息
   ↓
3. 发送消息 + 工具描述给 ChatModel
   ↓
4. ChatModel 分析意图
   ↓
5a. 如果不需要工具 → 直接返回响应
5b. 如果需要工具 → 返回工具调用请求
   ↓
6. AiServices 解析工具调用请求
   ↓
7. 提取参数，调用对应的工具方法
   ↓
8. 工具方法执行业务逻辑
   ↓
9. 返回工具执行结果
   ↓
10. 将结果发送给 ChatModel
   ↓
11. ChatModel 基于结果生成最终响应
   ↓
12. 返回给用户
```

**形象比喻**：
```
函数调用 = AI 助手 + 工具箱

传统对话（无工具）：
- AI 只能基于训练数据回答问题
- 无法执行实际操作（如查询数据库、调用 API）
- 就像一位博学但手无缚鸡之力的学者

带工具的对话：
- AI 有一个工具箱，里面有各种工具（开票、查询天气、发送邮件等）
- 当用户提出需求时，AI 先分析问题
- 如果需要实际操作，AI 选择合适的工具并填写参数
- 工具执行后返回结果
- AI 基于结果生成最终回答
- 就像一位既有知识又有实操能力的助手！

示例：
用户："帮我开一张发票，公司是尚硅谷，税号是123456，金额是100元"
AI 思考：
  1. 用户想要开发票
  2. 我有"开票工具"可以用
  3. 需要从消息中提取参数：
     - 公司名称 = "尚硅谷"
     - 税号 = "123456"
     - 金额 = "100"
  4. 调用开票工具
  5. 工具返回"开票成功"
  6. 告诉用户"发票已开具成功"
```

**代码示例对比**：

**无工具调用（传统对话）**：
```java
// 接口定义
public interface ChatAssistant {
    String chat(String prompt);
}

// 使用
String answer = chatAssistant.chat("帮我开一张发票");
// AI 只能回答："抱歉，我无法为您开具发票，我是一个语言模型..."
```

**带工具调用（Function Calling）**：
```java
// 接口定义
public interface FunctionAssistant {
    String chat(String message);
}

// 工具定义
public class InvoiceHandler {
    @Tool("根据用户提交的开票信息进行开票")
    public String handle(@P("公司名称") String companyName,
                         @P("税号") String dutyNumber,
                         @P("金额") String amount) {
        // 实际开票逻辑
        return "开票成功";
    }
}

// 配置
@Bean
public FunctionAssistant functionAssistant(ChatModel chatModel) {
    return AiServices.builder(FunctionAssistant.class)
            .chatModel(chatModel)
            .tools(new InvoiceHandler())  // 注册工具
            .build();
}

// 使用
String answer = functionAssistant.chat("帮我开一张发票，公司是尚硅谷，税号是123456，金额是100元");
// AI 自动调用工具，返回："发票已开具成功"
```

#### 11.6 Low Level API vs High Level API 对比

**Low Level Tool API（底层 API）**：
```java
@Bean
public FunctionAssistant functionAssistant(ChatModel chatModel)
{
    // 1. 手动定义工具规范
    ToolSpecification toolSpecification = ToolSpecification.builder()
                .name("开具发票助手")
                .description("根据用户提交的开票信息，开具发票")
                .parameters(JsonObjectSchema.builder()
                            .addStringProperty("companyName", "公司名称")
                            .addStringProperty("dutyNumber", "税号序列")
                            .addStringProperty("amount", "开票金额，保留两位有效数字")
                        .build())
            .build();

    // 2. 手动实现工具执行器
    ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
        System.out.println(toolExecutionRequest.id());
        System.out.println(toolExecutionRequest.name());
        String arguments = toolExecutionRequest.arguments();
        System.out.println("arguments****》 " + arguments);
        // 需要手动解析 JSON 参数
        return "开具成功";
    };

    // 3. 注册工具
    return AiServices.builder(FunctionAssistant.class)
            .chatModel(chatModel)
            .tools(Map.of(toolSpecification, toolExecutor))
            .build();
}
```

**优点**：
- ✅ 灵活性高 - 可以动态注册工具
- ✅ 细粒度控制 - 完全控制工具的执行过程
- ✅ 适合动态场景 - 运行时决定使用哪些工具

**缺点**：
- ❌ 代码复杂 - 需要手动定义规范和执行器
- ❌ 参数解析麻烦 - 需要手动解析 JSON
- ❌ 不易维护 - 代码量大，容易出错

**适用场景**：
- 动态工具注册（根据配置加载工具）
- 需要精细控制工具执行流程
- 工具来自外部插件系统

---

**High Level Tool API（高层 API）**：
```java
@Bean
public FunctionAssistant functionAssistant(ChatModel chatModel)
{
    return AiServices.builder(FunctionAssistant.class)
                .chatModel(chatModel)
                .tools(new InvoiceHandler())  // 只需传入对象
            .build();
}

// 工具类使用注解
public class InvoiceHandler {
    @Tool("根据用户提交的开票信息进行开票")
    public String handle(@P("公司名称") String companyName,
                         @P("税号") String dutyNumber,
                         @P("金额") String amount) {
        return "开票成功";
    }
}
```

**优点**：
- ✅ 代码简洁 - 只需注解 + 传入对象
- ✅ 易于维护 - 结构清晰，一目了然
- ✅ 类型安全 - 编译时检查参数类型
- ✅ 自动参数提取 - 框架自动处理

**缺点**：
- ❌ 灵活性较低 - 需要在编译时确定工具
- ❌ 不适合动态场景 - 无法运行时动态添加

**适用场景**：
- ✅ 大多数业务场景
- ✅ 工具在编译时已知
- ✅ 追求代码简洁和可维护性

---

**🎯 如何选择？**
- ✅ 90% 的场景 → 推荐 **High Level API**（简洁、易用）
- ✅ 需要动态注册工具 → 推荐 **Low Level API**（灵活）
- ✅ 初学者 → 先用 **High Level API**，理解后再学 Low Level

#### 11.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **函数调用能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **工具支持** | ✅ 支持（@Tool） | ✅ 支持（@Tool） | ✅ 支持（@Tool） |
| **注解驱动** | ✅ @Tool + @P | ✅ @Tool + @ToolParam | ✅ @Tool + @ToolParam |
| **Low Level API** | ✅ 支持（ToolSpecification） | ❌ 不支持 | ❌ 不支持 |
| **High Level API** | ✅ 支持（直接传入对象） | ✅ 支持 | ✅ 支持 |
| **多工具注册** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **工具嵌套** | ✅ 支持 | ✅ 支持 | ✅ 支持 |

#### **详细代码对比**

**1️⃣ LangChain4j（High Level API）**：
```java
// 工具定义
public class InvoiceHandler {
    @Tool("根据用户提交的开票信息进行开票")
    public String handle(@P("公司名称") String companyName,
                         @P("税号") String dutyNumber,
                         @P("金额") String amount) {
        return "开票成功";
    }
}

// 配置
@Bean
public FunctionAssistant functionAssistant(ChatModel chatModel) {
    return AiServices.builder(FunctionAssistant.class)
            .chatModel(chatModel)
            .tools(new InvoiceHandler())
            .build();
}
```

**📖 详细讲解**：
- LangChain4j 提供两种 API（Low Level + High Level）
- High Level API 使用 `@Tool` 和 `@P` 注解
- 通过 `AiServices.builder()` 注册工具
- 支持多个工具：`.tools(new Tool1(), new Tool2())`

---

**2️⃣ Spring AI（仅 High Level API）**：
```java
// 工具定义
@Component
public class InvoiceHandler {
    @Tool(description = "根据用户提交的开票信息进行开票")
    public String handle(
        @ToolParam(description = "公司名称") String companyName,
        @ToolParam(description = "税号") String dutyNumber,
        @ToolParam(description = "金额") String amount) {
        return "开票成功";
    }
}

// 配置（自动扫描）
@Bean
public ChatClient chatClient(ChatModel chatModel, List<FunctionCallback> callbacks) {
    return ChatClient.builder(chatModel)
            .defaultFunctions(callbacks.toArray(new FunctionCallback[0]))
            .build();
}
```

**📖 详细讲解**：
- Spring AI 只支持 High Level API
- 使用 `@Tool` 和 `@ToolParam` 注解
- 通过 `FunctionCallback` 自动扫描注册
- 需要 Spring Bean 管理

---

**3️⃣ Spring AI Alibaba（仅 High Level API）**：
```java
// 与 Spring AI 相同
@Component
public class InvoiceHandler {
    @Tool(description = "根据用户提交的开票信息进行开票")
    public String handle(
        @ToolParam(description = "公司名称") String companyName,
        @ToolParam(description = "税号") String dutyNumber,
        @ToolParam(description = "金额") String amount) {
        return "开票成功";
    }
}
```

**📖 详细讲解**：
- Spring AI Alibaba 继承 Spring AI 的工具机制
- 使用相同的注解和配置方式
- 主要差异在底层模型调用

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| API 种类 | ✅ 两种（Low + High） | 一种（High） |
| 注解名称 | @Tool + @P | @Tool + @ToolParam |
| 配置方式 | AiServices.builder() | ChatClient.builder() |
| 灵活性 | ✅ 高（支持 Low Level） | 中 |
| 代码简洁度 | ✅ 简洁 | ✅ 简洁 |
| 学习曲线 | 中（需理解两种 API） | ✅ 低（只有一种） |

**🎯 如何选择？**
- ✅ 需要灵活控制工具 → 推荐 **LangChain4j**（Low Level API）
- ✅ 追求简单易用 → 三个框架都支持 High Level API
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 11.8 技术要点

**函数调用的要点**：
- 🛠️ **工具注册** - 通过 `@Tool` 注解标记工具方法
- 📝 **参数描述** - 使用 `@P` 注解提升 AI 理解能力
- 🔄 **自动调用** - AI 自动判断何时调用工具
- 📊 **参数提取** - AI 从自然语言中提取结构化参数
- 🔗 **工具组合** - 可以注册多个工具，AI 自动选择

**@Tool 注解的要点**：
- 🏷️ **描述文本** - 清晰描述工具的用途
- 📍 **方法级别** - 标注在具体方法上
- 🎯 **返回值** - 返回字符串，AI 用来生成响应
- ⚙️ **异常处理** - 方法可以抛出异常，需妥善处理

**@P 注解的要点**：
- 📖 **参数描述** - 帮助 AI 理解参数含义
- 🔤 **字符串类型** - 描述文本应简洁明了
- ✅ **可选但推荐** - 不写也能工作，但准确率会降低
- 🎨 **命名规范** - 使用用户友好的名称

**AiServices 的要点**：
- 🏗️ **构建器模式** - 使用 `builder()` 创建实例
- 🔌 **工具注册** - `.tools()` 方法注册一个或多个工具
- 🧠 **模型注入** - `.chatModel()` 注入 ChatModel
- 🎭 **代理模式** - 返回接口的代理实现

**适用场景**：
- ✅ 客服系统 - 调用订单查询、退款等工具
- ✅ 个人助理 - 调用日历、邮件、天气等工具
- ✅ 数据分析 - 调用数据库查询、报表生成等工具
- ✅ IoT 控制 - 调用设备控制、状态查询等工具

**注意事项**：
- ⚠️ 工具描述要清晰准确，影响 AI 的判断
- ⚠️ 参数描述要详细，提升提取准确率
- ⚠️ 工具方法应该是幂等的（多次调用结果一致）
- ⚠️ 注意工具的权限和安全问题
- ⚠️ 工具执行可能耗时，考虑异步处理

#### 11.9 常见问题

**问题1：AI 不调用我的工具？**
- **原因**：`@Tool` 描述不清晰，AI 不知道何时调用
- **解决方案**：优化 `@Tool` 的描述文本，使其更具体
```java
@Tool("当用户要求开具发票时，调用此工具。需要提供公司名称、税号和金额。")
```

**问题2：参数提取不准确？**
- **原因**：缺少 `@P` 注解或描述不清晰
- **解决方案**：为所有参数添加 `@P` 注解，并提供详细描述
```java
public String handle(
    @P("公司全称，例如：阿里巴巴集团") String companyName,
    @P("统一社会信用代码，18位数字和字母组合") String dutyNumber,
    @P("开票金额，保留两位小数，例如：100.00") String amount)
```

**问题3：如何注册多个工具？**
- **方法**：在 `.tools()` 中传入多个对象
```java
.tools(new InvoiceHandler(), new WeatherService(), new EmailService())
```

**问题4：Low Level API 如何解析参数？**
- **方法**：使用 JSON 解析库
```java
ToolExecutor toolExecutor = (toolExecutionRequest, memoryId) -> {
    String arguments = toolExecutionRequest.arguments();
    // 使用 Jackson 解析 JSON
    JsonNode json = new ObjectMapper().readTree(arguments);
    String companyName = json.get("companyName").asText();
    String dutyNumber = json.get("dutyNumber").asText();
    String amount = json.get("amount").asText();
    // 执行业务逻辑
    return "开具成功";
};
```

**问题5：工具执行失败怎么办？**
- **方法**：在工具方法中捕获异常并返回错误信息
```java
@Tool("根据用户提交的开票信息进行开票")
public String handle(...) {
    try {
        // 业务逻辑
        return "开票成功";
    } catch (Exception e) {
        log.error("开票失败", e);
        return "开票失败：" + e.getMessage();
    }
}
```

**问题6：如何在工具中访问 Spring Bean？**
- **方法**：将工具类标注为 `@Component`，通过构造函数注入
```java
@Component
public class InvoiceHandler {
    @Autowired
    private InvoiceService invoiceService;
    
    @Tool("开具发票")
    public String handle(...) {
        return invoiceService.createInvoice(...);
    }
}
```

---

### 模块12：langchain4j-12chat-embedding - 向量化

#### 12.1 模块概述
- **端口**: 9012（推测，未在配置文件中明确）
- **功能**: 演示 LangChain4j 的文本向量化（Embedding）功能，包括文本转向量、向量存储、相似度搜索等
- **核心概念**: EmbeddingModel、TextSegment、EmbeddingStore、Qdrant、向量数据库、语义搜索

#### 12.2 核心代码

**📋 流程总览**：
```
文本输入 → EmbeddingModel 向量化 → 生成向量数组 
→ 存储到 EmbeddingStore(Qdrant) → 查询时再次向量化 
→ 向量相似度搜索 → 返回最相似的文本
```

**📊 完整调用流程图**：
```
┌─────────────┐
│   用户请求   │ "咏鸡说的是什么"
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  EmbeddinglController   │ query1() 方法接收请求
└──────┬──────────────────┘
       │ @Resource 注入
       ▼
┌─────────────────────────┐
│   EmbeddingModel        │ OpenAiEmbeddingModel
│   .embed()              │ 将查询文本转换为向量
└──────┬──────────────────┘
       │ 生成向量 [0.1, 0.2, ...]
       ▼
┌─────────────────────────┐
│ EmbeddingSearchRequest  │ 构建搜索请求
│   .queryEmbedding()     │ 设置查询向量
│   .maxResults(1)        │ 设置返回数量
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   EmbeddingStore        │ QdrantEmbeddingStore
│   .search()             │ 在向量数据库中搜索
└──────┬──────────────────┘
       │ 计算余弦相似度
       ▼
┌─────────────────────────┐
│  返回最相似的文本片段    │ "咏鸡\n鸡鸣破晓光..."
└─────────────────────────┘
```

---

**1️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @auther zzyybs@126.com
 * @Date 2025-06-02 20:44
 * @Description: TODO
 */
@Configuration
public class LLMConfig
{
    @Bean
    public EmbeddingModel embeddingModel()
    {
        return OpenAiEmbeddingModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("text-embedding-v3")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    /**
     * 创建Qdrant客户端
     * @return
     */
    @Bean
    public QdrantClient qdrantClient() {
        QdrantGrpcClient.Builder grpcClientBuilder =
                QdrantGrpcClient.newBuilder("127.0.0.1", 6334, false);
        return new QdrantClient(grpcClientBuilder.build());
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        return QdrantEmbeddingStore.builder()
                .host("127.0.0.1")
                .port(6334)
                .collectionName("test-qdrant")
                .build();
    }
}
```

**作用说明**：

**embeddingModel() - 向量化模型初始化**：
- 创建 `OpenAiEmbeddingModel` 实例
- 使用阿里云 DashScope 的 `text-embedding-v3` 模型
- 通过 OpenAI 兼容协议调用
- 负责将文本转换为向量数组

**qdrantClient() - Qdrant 客户端初始化**：
- 创建 Qdrant gRPC 客户端
- 连接本地 Qdrant 服务（127.0.0.1:6334）
- 用于管理向量数据库集合（创建、删除等）

**embeddingStore() - 向量存储初始化**：
- 创建 `QdrantEmbeddingStore` 实例
- 连接到 Qdrant 向量数据库
- 指定集合名称：`test-qdrant`
- 负责存储和检索向量数据

**关键点**：
- ✅ **EmbeddingModel** - 负责文本向量化（类似翻译器，将文字翻译成数字）
- ✅ **EmbeddingStore** - 负责向量存储和检索（类似数据库）
- ✅ **Qdrant** - 高性能向量数据库，支持相似度搜索
- ✅ **三个 Bean 各司其职** - 向量化、客户端管理、数据存储

---

**2️⃣ 控制器使用：EmbeddinglController.java**
```java
package com.atguigu.study.controller;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static dev.langchain4j.store.embedding.filter.MetadataFilterBuilder.metadataKey;

/**
 * @auther zzyybs@126.com
 * @Date 2025-06-02 20:47
 * @Description: 知识出处，https://docs.langchain4j.dev/tutorials/rag#embedding-store
 */
@RestController
@Slf4j
public class EmbeddinglController
{
    @Resource
    private EmbeddingModel embeddingModel;
    @Resource
    private QdrantClient qdrantClient;
    @Resource
    private EmbeddingStore<TextSegment> embeddingStore;

    /**
     * 文本向量化测试，看看形成向量后的文本
     * http://localhost:9012/embedding/embed
     * @return
     */
    @GetMapping(value = "/embedding/embed")
    public String embed()
    {
        String prompt = """
                   咏鸡
                鸡鸣破晓光，
                红冠映朝阳。
                金羽披霞彩，
                昂首步高岗。
                """;
        Response<Embedding> embeddingResponse = embeddingModel.embed(prompt);

        System.out.println(embeddingResponse);

        return embeddingResponse.content().toString();
    }

    /**
     * 新建向量数据库实例和创建索引：test-qdrant
     * 类似mysql create database test-qdrant
     * http://localhost:9012/embedding/createCollection
     */
    @GetMapping(value = "/embedding/createCollection")
    public void createCollection()
    {
        var vectorParams = Collections.VectorParams.newBuilder()
                .setDistance(Collections.Distance.Cosine)
                .setSize(1024)
                .build();
        qdrantClient.createCollectionAsync("test-qdrant", vectorParams);
    }

    /*
     往向量数据库新增文本记录
     */
    @GetMapping(value = "/embedding/add")
    public String add()
    {
        String prompt = """
                咏鸡
                鸡鸣破晓光，
                红冠映朝阳。
                金羽披霞彩，
                昂首步高岗。
                """;
        TextSegment segment1 = TextSegment.from(prompt);
        segment1.metadata().put("author", "zzyy");
        Embedding embedding1 = embeddingModel.embed(segment1).content();
        String result = embeddingStore.add(embedding1, segment1);

        System.out.println(result);

        return result;
    }

    @GetMapping(value = "/embedding/query1")
    public void query1(){
        Embedding queryEmbedding = embeddingModel.embed("咏鸡说的是什么").content();
        EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(1)
                .build();
        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(embeddingSearchRequest);
        System.out.println(searchResult.matches().get(0).embedded().text());
    }

    @GetMapping(value = "/embedding/query2")
    public void query2(){
        Embedding queryEmbedding = embeddingModel.embed("咏鸡").content();

        EmbeddingSearchRequest embeddingSearchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .filter(metadataKey("author").isEqualTo("zzyy2"))
                .maxResults(1)
                .build();

        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(embeddingSearchRequest);

        System.out.println(searchResult.matches().get(0).embedded().text());
    }
}
```

**作用说明**：

**五个接口方法**：

1. **embed() - 文本向量化测试**
   - 将诗歌《咏鸡》转换为向量
   - 返回向量数组的字符串表示
   - 演示 EmbeddingModel 的基本用法

2. **createCollection() - 创建向量集合**
   - 类似 MySQL 的 `CREATE DATABASE`
   - 设置向量维度：1024
   - 设置距离算法：Cosine（余弦相似度）
   - 异步创建集合

3. **add() - 添加文本到向量数据库**
   - 创建 TextSegment（文本片段）
   - 添加元数据：author = "zzyy"
   - 将文本转换为向量
   - 存储到 EmbeddingStore
   - 返回存储 ID

4. **query1() - 语义搜索（无条件）**
   - 将查询文本 "咏鸡说的是什么" 转换为向量
   - 构建搜索请求，最多返回 1 条结果
   - 在向量数据库中搜索最相似的文本
   - 打印搜索结果

5. **query2() - 语义搜索（带过滤条件）**
   - 将查询文本 "咏鸡" 转换为向量
   - 添加过滤条件：author = "zzyy2"
   - 搜索符合条件的最相似文本
   - 演示元数据过滤功能

**关键点**：
- ✅ **TextSegment** - 文本片段，包含文本内容和元数据
- ✅ **Embedding** - 向量对象，是浮点数数组
- ✅ **metadata** - 元数据，可以添加自定义属性（如作者、标签等）
- ✅ **相似度搜索** - 基于向量距离，而非关键词匹配
- ✅ **过滤条件** - 可以结合元数据进行精确过滤

---

**配置文件：application.properties**（推测）
```properties
server.port=9012

spring.application.name=langchain4j-12chat-embedding
```

**POM依赖**：
```xml
<!-- langchain4j 高阶 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- langchain4j-open-ai 基础 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- qdrant 向量数据库 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-qdrant</artifactId>
</dependency>
```

**关键点**：
- **langchain4j-qdrant** - Qdrant 向量数据库集成
- **其他依赖** - 与前几个模块相同

#### 12.3 测试接口与返回

**前置准备**：
需要先启动 Qdrant 向量数据库：

```shell
#方式一：启动并且设置开启启动
docker run -d --name qdrant --restart always -p 6333:6333 -p 6334:6334 -v qdrant_data:/qdrant/storage qdrant/qdrant
```

```bash
#方式二：直接启动
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

---

**接口1：文本向量化测试**
```
http://localhost:9012/embedding/embed
```

**返回示例**：
```
[0.0123, -0.0456, 0.0789, ..., 0.0234]  // 1024维向量
```

**控制台输出**：
```
Response { content = Embedding { vector = [0.0123, -0.0456, ...], dimension = 1024 } }
```

**说明**：
- 返回一个 1024 维的向量数组
- 每个元素是浮点数（float）
- 这个向量代表了文本的语义信息
- 相似的文本会有相似的向量

---

**接口2：创建向量集合**
```
http://localhost:9012/embedding/createCollection
```

**返回**：无返回值（void）

**控制台输出**：
```
// Qdrant 创建集合成功
```

**说明**：
- 类似 MySQL 的 `CREATE DATABASE test-qdrant`
- 设置向量维度为 1024（与 text-embedding-v3 模型匹配）
- 使用余弦相似度算法
- 只需执行一次

---

**接口3：添加文本到向量数据库**
```
http://localhost:9012/embedding/add
```

**返回示例**：
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890  // 存储ID
```

**控制台输出**：
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**说明**：
- 将《咏鸡》诗歌转换为向量并存储
- 添加元数据：author = "zzyy"
- 返回唯一标识符（UUID）
- 可以在 Qdrant Web UI 中查看：http://localhost:6333/dashboard

---

**接口4：语义搜索（无条件）**
```
http://localhost:9012/embedding/query1
```

**控制台输出**：
```
咏鸡
鸡鸣破晓光，
红冠映朝阳。
金羽披霞彩，
昂首步高岗。
```

**说明**：
- 查询文本："咏鸡说的是什么"
- AI 理解语义，找到最相关的文本
- 即使查询文本和存储文本不完全相同，也能找到
- 这就是**语义搜索**的魅力！

---

**接口5：语义搜索（带过滤条件）**
```
http://localhost:9012/embedding/query2
```

**控制台输出**：
```
// 如果 author = "zzyy2" 的记录不存在，会报错或返回空
// 如果存在，返回对应的文本
```

**说明**：
- 查询文本："咏鸡"
- 过滤条件：author = "zzyy2"
- 由于我们添加时用的是 "zzyy"，所以找不到 "zzyy2"
- 演示了元数据过滤功能
- 实际应用中可以用于权限控制、分类筛选等

#### 12.4 知识点总结

✅ **Embedding（向量化）** - 将文本转换为向量数组  
   - 文本 → 数字数组（如 [0.1, -0.2, 0.3, ...]）
   - 向量代表文本的语义信息
   - 相似的文本有相似的向量
   - 维度通常是 768、1024、1536 等

✅ **EmbeddingModel** - 向量化模型  
   - 负责将文本转换为向量
   - OpenAiEmbeddingModel - 使用 OpenAI 兼容协议
   - 阿里云 text-embedding-v3 - 高质量中文向量化模型
   - 其他模型：text-embedding-ada-002、bge-m3 等

✅ **TextSegment** - 文本片段  
   - 包含文本内容（text）
   - 包含元数据（metadata）
   - 元数据可以是任意键值对（如作者、标签、时间等）
   - 用于存储和检索

✅ **EmbeddingStore** - 向量存储  
   - 存储向量和对应的文本
   - 支持相似度搜索
   - QdrantEmbeddingStore - Qdrant 向量数据库
   - 其他实现：Chroma、Milvus、Pinecone 等

✅ **Qdrant** - 向量数据库  
   - 高性能向量搜索引擎
   - 支持多种距离算法（Cosine、Euclidean、Dot Product）
   - 支持元数据过滤
   - 提供 REST API 和 gRPC API
   - 支持 Docker 部署

✅ **相似度搜索** - 基于向量距离的搜索  
   - 不是关键词匹配，而是语义匹配
   - 余弦相似度（Cosine Similarity）- 常用算法
   - 值范围：-1 到 1，越接近 1 越相似
   - 示例："苹果" 和 "水果" 的向量很接近

✅ **元数据过滤** - 结合元数据进行精确筛选  
   - 在相似度搜索的基础上添加过滤条件
   - 示例：只搜索某个作者的文档
   - 提高搜索精度
   - 支持多种过滤操作（等于、不等于、大于、小于等）

#### 12.5 向量化详细讲解

**向量化的工作流程**：
```
1. 准备文本
   ↓
2. 调用 EmbeddingModel.embed(text)
   ↓
3. 模型分析文本语义
   ↓
4. 生成向量数组（如 1024 维）
   ↓
5. 存储到 EmbeddingStore（可选）
   ↓
6. 查询时，将查询文本也转换为向量
   ↓
7. 计算查询向量与存储向量的相似度
   ↓
8. 返回最相似的文本
```

**形象比喻**：
```
向量化 = 将文字翻译成"语义坐标"

传统搜索（关键词匹配）：
- 就像在图书馆按书名查找
- 必须知道确切的书名
- "苹果" 找不到 "iPhone"

向量搜索（语义搜索）：
- 就像有一个智能图书管理员
- 他理解每本书的内容
- 你说"我想看关于手机的书"
- 他会推荐 iPhone、Android、华为等相关书籍
- 即使书名中没有"手机"两个字

向量是什么？
- 想象一个 1024 维的空间（坐标系）
- 每个文本是这个空间中的一个点
- 相似的文本，它们的点距离很近
- "苹果" 和 "水果" 的点很近
- "苹果" 和 "汽车" 的点很远

就像地图上的位置：
- 北京和上海的距离较远
- 北京和天津的距离较近
- 向量空间中的"距离"代表语义相似度
```

**代码示例对比**：

**传统关键词搜索**：
```java
// SQL 查询
SELECT * FROM articles WHERE title LIKE '%苹果%';
// 只能找到标题中包含"苹果"的文章
// 找不到"iPhone评测"、"水果介绍"等相关文章
```

**向量语义搜索**：
```java
// 1. 将查询文本转换为向量
Embedding queryEmbedding = embeddingModel.embed("苹果手机").content();

// 2. 搜索相似向量
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .build();

// 3. 返回结果
EmbeddingSearchResult<TextSegment> result = embeddingStore.search(request);
// 可能返回：
// - "iPhone 15 评测"
// - "iOS 系统介绍"
// - "苹果公司财报"
// - "智能手机发展趋势"
// - "水果苹果的营养价值"
```

#### 12.6 Qdrant 向量数据库详解

**Qdrant 是什么？**
- 开源向量数据库
- Rust 编写，性能极高
- 支持云原生部署
- 提供 REST API 和 gRPC API
- 支持 Docker、Kubernetes 部署

**为什么选择 Qdrant？**
- ✅ 性能好 - Rust 编写，速度快
- ✅ 易用 - 简单的 API，清晰的文档
- ✅ 灵活 - 支持多种距离算法
- ✅ 功能丰富 - 支持过滤、分页、批量操作
- ✅ 社区活跃 - GitHub Star 数高

**Qdrant vs 其他向量数据库**：

| 特性 | Qdrant | Milvus | Chroma | Pinecone |
|------|--------|--------|--------|----------|
| 开源 | ✅ 是 | ✅ 是 | ✅ 是 | ❌ 否（SaaS） |
| 语言 | Rust | Go/C++ | Python | - |
| 性能 | ✅ 高 | ✅ 高 | 中 | ✅ 高 |
| 部署 | 简单 | 复杂 | 简单 | 云端 |
| 适用场景 | 中小规模 | 大规模 | 小规模 | 云端服务 |

**Qdrant 核心概念**：

1. **Collection（集合）** - 类似 MySQL 的 Database
   ```java
   qdrantClient.createCollectionAsync("test-qdrant", vectorParams);
   ```

2. **Vector（向量）** - 浮点数数组
   ```java
   [0.0123, -0.0456, 0.0789, ..., 0.0234]  // 1024维
   ```

3. **Payload（负载/元数据）** - 附加信息
   ```java
   segment1.metadata().put("author", "zzyy");
   segment1.metadata().put("category", "poetry");
   ```

4. **Distance（距离算法）** - 相似度计算方式
   - Cosine（余弦相似度）- 最常用
   - Euclidean（欧氏距离）
   - Dot Product（点积）

**Qdrant Web UI**：
- 访问地址：http://localhost:6333/dashboard
- 可以可视化查看集合、向量、元数据
- 方便调试和管理

#### 12.7 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **向量化能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **Embedding 支持** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **向量数据库** | ✅ 多种（Qdrant、Milvus、Chroma等） | ✅ 多种 | ✅ 多种 |
| **API 风格** | EmbeddingModel + EmbeddingStore | EmbeddingClient | EmbeddingClient |
| **元数据过滤** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **批量操作** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **流式处理** | ✅ 支持 | ✅ 支持 | ✅ 支持 |

#### **详细代码对比**

**1️⃣ LangChain4j**：
```java
// 配置
@Bean
public EmbeddingModel embeddingModel() {
    return OpenAiEmbeddingModel.builder()
            .apiKey("sk-xxx")
            .modelName("text-embedding-v3")
            .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
            .build();
}

@Bean
public EmbeddingStore<TextSegment> embeddingStore() {
    return QdrantEmbeddingStore.builder()
            .host("127.0.0.1")
            .port(6334)
            .collectionName("test-qdrant")
            .build();
}

// 使用
Embedding embedding = embeddingModel.embed("文本").content();
String id = embeddingStore.add(embedding, textSegment);

// 搜索
Embedding queryEmbedding = embeddingModel.embed("查询").content();
EmbeddingSearchRequest request = EmbeddingSearchRequest.builder()
    .queryEmbedding(queryEmbedding)
    .maxResults(5)
    .build();
EmbeddingSearchResult<TextSegment> result = embeddingStore.search(request);
```

**📖 详细讲解**：
- LangChain4j 提供统一的 EmbeddingModel 接口
- 支持多种向量数据库（Qdrant、Milvus、Chroma 等）
- API 简洁，易于使用
- 支持元数据过滤和批量操作

---

**2️⃣ Spring AI**：
```java
// 配置（application.properties）
spring.ai.openai.embedding.api-key=sk-xxx
spring.ai.openai.embedding.base-url=https://dashscope.aliyuncs.com/compatible-mode/v1
spring.ai.openai.embedding.options.model=text-embedding-v3

// 使用
@Autowired
private EmbeddingClient embeddingClient;

List<float[]> embeddings = embeddingClient.embed(List.of("文本1", "文本2"));
```

**📖 详细讲解**：
- Spring AI 使用 EmbeddingClient
- 通过配置文件自动配置
- 支持批量向量化
- 需要配合 VectorStore 使用

---

**3️⃣ Spring AI Alibaba**：
```java
// 配置（application.properties）
spring.ai.dashscope.embedding.api-key=sk-xxx
spring.ai.dashscope.embedding.options.model=text-embedding-v3

// 使用
@Autowired
private EmbeddingClient embeddingClient;

List<float[]> embeddings = embeddingClient.embed(List.of("文本"));
```

**📖 详细讲解**：
- Spring AI Alibaba 继承 Spring AI 的 EmbeddingClient
- 默认使用 DashScope 原生协议
- 配置更简单
- 性能略优

---

**🔍 三方对比总结**：

| 对比维度 | LangChain4j | Spring AI / Spring AI Alibaba |
|---------|-------------|-------------------------------|
| API 设计 | EmbeddingModel + EmbeddingStore | EmbeddingClient + VectorStore |
| 配置方式 | Java Config | 配置文件 + 自动配置 |
| 灵活性 | ✅ 高（手动控制） | 中（自动配置） |
| 代码量 | 稍多 | ✅ 少 |
| 学习曲线 | 中 | ✅ 低 |
| 向量数据库支持 | ✅ 多种 | ✅ 多种 |

**🎯 如何选择？**
- ✅ 需要精细控制向量化流程 → 推荐 **LangChain4j**
- ✅ 追求简单易用 → 推荐 **Spring AI / Spring AI Alibaba**
- ✅ Spring 生态深度集成 → 推荐 **Spring AI / Spring AI Alibaba**

#### 12.8 技术要点

**向量化的要点**：
- 📊 **向量维度** - 通常为 768、1024、1536，取决于模型
- 🔢 **浮点数数组** - 每个元素是 float 类型
- 🧠 **语义表示** - 向量捕捉文本的语义信息
- 📏 **相似度计算** - 余弦相似度最常用

**EmbeddingModel 的要点**：
- 🎯 **模型选择** - text-embedding-v3（阿里云）、text-embedding-ada-002（OpenAI）
- 💰 **成本考虑** - 按 Token 计费，注意成本控制
- ⚡ **性能优化** - 支持批量向量化，减少 API 调用次数
- 🌐 **多语言支持** - 不同模型对不同语言的支持程度不同

**EmbeddingStore 的要点**：
- 💾 **持久化** - 向量存储在数据库中，重启不丢失
- 🔍 **索引优化** - 向量数据库使用特殊索引加速搜索
- 📈 **可扩展性** - 支持海量向量存储（百万、千万级）
- 🔐 **权限控制** - 通过元数据实现细粒度权限控制

**Qdrant 的要点**：
- 🚀 **高性能** - Rust 编写，速度快
- 🐳 **Docker 部署** - 一行命令启动
- 🌐 **Web UI** - 可视化管理界面
- 📊 **监控** - 提供详细的性能指标

**适用场景**：
- ✅ RAG（检索增强生成）- 核心组件
- ✅ 语义搜索 - 超越关键词匹配
- ✅ 推荐系统 - 基于内容相似度
- ✅ 去重检测 - 识别相似文本
- ✅ 聚类分析 - 文本分类和分组

**注意事项**：
- ⚠️ 向量维度必须与模型匹配（如 1024 维）
- ⚠️ 距离算法选择影响搜索结果
- ⚠️ 元数据过滤会降低搜索速度
- ⚠️ 批量操作比单次操作效率高
- ⚠️ 定期清理无用向量，节省存储空间

#### 12.9 常见问题

**问题1：如何启动 Qdrant？**
- **方法**：使用 Docker
```bash
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
```
- **验证**：访问 http://localhost:6333/dashboard

---

**问题2：向量维度不匹配怎么办？**
- **原因**：模型输出的维度与集合设置的维度不一致
- **解决方案**：确保两者一致
```java
// 模型输出 1024 维
.modelName("text-embedding-v3")  // 输出 1024 维

// 集合也要设置 1024 维
.setSize(1024)
```

---

**问题3：如何提高搜索精度？**
- **方法1**：选择更好的 Embedding 模型
  - text-embedding-v3 > text-embedding-ada-002
- **方法2**：调整 maxResults
  - 返回更多结果，然后人工筛选
- **方法3**：添加元数据过滤
  - 缩小搜索范围
- **方法4**：使用混合搜索
  - 向量搜索 + 关键词搜索

---

**问题4：如何批量添加向量？**
- **方法**：使用 `addAll()` 方法
```java
List<Embedding> embeddings = new ArrayList<>();
List<TextSegment> segments = new ArrayList<>();

for (String text : texts) {
    TextSegment segment = TextSegment.from(text);
    Embedding embedding = embeddingModel.embed(segment).content();
    embeddings.add(embedding);
    segments.add(segment);
}

List<String> ids = embeddingStore.addAll(embeddings, segments);
```

---

**问题5：如何删除向量？**
- **方法**：使用 `remove()` 方法
```java
embeddingStore.remove("vector-id");

// 或者批量删除
embeddingStore.removeAll(Arrays.asList("id1", "id2", "id3"));
```

---

**问题6：如何查看 Qdrant 中的数据？**
- **方法1**：Web UI
  - 访问 http://localhost:6333/dashboard
  - 可视化查看集合、向量、元数据
- **方法2**：API
```java
// 通过 QdrantClient 查询
qdrantClient.getPointsAsync("test-qdrant", ...);
```

---

**问题7：向量化失败怎么办？**
- **原因1**：API Key 无效
  - 检查 apiKey 是否正确
- **原因2**：网络问题
  - 检查 baseUrl 是否可访问
- **原因3**：文本过长
  - 检查文本长度是否超过模型限制
- **解决方案**：查看错误日志，针对性解决

---

### 模块13：langchain4j-13chat-rag01 - RAG检索增强

#### 13.1 模块概述
- **端口**: 9013
- **功能**: 演示 LangChain4j 的 RAG（Retrieval Augmented Generation，检索增强生成）能力，让 AI 能够基于私有文档回答问题
- **核心概念**: EmbeddingStore、InMemoryEmbeddingStore、EmbeddingStoreIngestor、ContentRetriever、RAG流程

#### 13.2 核心代码

**📋 流程总览**：
```
文档加载 → 解析文档 → EmbeddingStoreIngestor.ingest() → 向量化存储到EmbeddingStore 
→ 用户提问 → ContentRetriever检索相关片段 → ChatModel结合上下文生成答案 → 返回结果
```

**📊 完整调用流程图**：
```
RAG 完整流程：

【阶段1：文档预处理】
┌─────────────┐
│   用户请求   │ /rag/add
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ RAGController           │ testAdd()
└──────┬──────────────────┘
       │ FileSystemDocumentLoader.loadDocument()
       ▼
┌─────────────────────────┐
│ Document                │ 加载 alibaba-java.docx
└──────┬──────────────────┘
       │ ApacheTikaDocumentParser.parse()
       ▼
┌─────────────────────────┐
│ EmbeddingStoreIngestor  │ .ingest(document, embeddingStore)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ InMemoryEmbeddingStore  │ 文档分片 + 向量化 + 存储
│ (内存向量数据库)         │ TextSegment[]
└─────────────────────────┘

【阶段2：问答检索】
       │ chatAssistant.chat("错误码00000是什么")
       ▼
┌─────────────────────────┐
│ ChatAssistant           │ AiServices 构建
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ ContentRetriever        │ 从 EmbeddingStore 检索相关片段
│ (内容检索器)             │ 相似度匹配
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   ChatModel             │ 发送请求(问题 + 检索到的上下文)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│   返回结果              │ 基于文档的回答
└─────────────────────────┘
```

---

**1️⃣ 定义接口：ChatAssistant.java**
```java
package com.atguigu.study.service;

/**
 * RAG 聊天助手接口
 */
public interface ChatAssistant {

    /**
     * 聊天
     *
     * @param message 消息
     * @return {@link String }
     */
    String chat(String message);
}
```

**作用说明**：
- **简单接口** - 只有一个 chat() 方法
- **高级 API** - LangChain4j 会自动实现该接口
- **无需注解** - 因为使用 AiServices.builder() 手动创建

---

**2️⃣ 配置类初始化：LLMConfig.java**
```java
package com.atguigu.study.config;

import com.atguigu.study.service.ChatAssistant;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LLMConfig
{
    @Bean
    public ChatModel chatModel()
    {
        return OpenAiChatModel.builder()
                    .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
                    .modelName("qwen-plus")
                    .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
                .build();
    }

    /**
     * 需要预处理文档并将其存储在专门的嵌入存储（也称为矢量数据库）中。
     * 当用户提出问题时，这对于快速找到相关信息是必要的。
     * 为了简单起见，我们将使用内存中的嵌入存储：
     * https://docs.langchain4j.dev/integrations/embedding-stores/in-memory
     */
    @Bean
    public InMemoryEmbeddingStore<TextSegment> embeddingStore() {
        return new InMemoryEmbeddingStore<>();
    }

    @Bean
    public ChatAssistant assistant(ChatModel chatModel, EmbeddingStore<TextSegment> embeddingStore)
    {
        return AiServices.builder(ChatAssistant.class)
                    .chatModel(chatModel)
                    .chatMemory(MessageWindowChatMemory.withMaxMessages(50))
                    .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
                .build();
    }
}
```

**作用说明**：
- **Spring 配置类** - 创建三个 Bean
- **ChatModel** - 用于对话的模型
- **InMemoryEmbeddingStore** - 内存向量数据库，存储文档片段
- **ChatAssistant** - RAG 助手，整合模型、记忆和内容检索器

**关键点**：
- ✅ **`InMemoryEmbeddingStore<TextSegment>`** - 内存向量数据库
  - 存储文档的分片和向量表示
  - 支持相似度搜索
  - 生产环境可替换为 Qdrant、Milvus 等
- ✅ **`AiServices.builder()`** - 构建 RAG 助手
  - `.chatModel(chatModel)` - 设置对话模型
  - `.chatMemory(MessageWindowChatMemory.withMaxMessages(50))` - 设置对话记忆（最多50条）
  - `.contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))` - 设置内容检索器
- ✅ **`EmbeddingStoreContentRetriever`** - 从向量数据库检索相关内容
  - 根据用户问题检索最相关的文档片段
  - 自动将检索到的上下文传递给 ChatModel

---

**3️⃣ 控制器使用：RAGController.java**
```java
package com.atguigu.study.controller;

import com.atguigu.study.service.ChatAssistant;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import dev.langchain4j.data.segment.TextSegment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.FileInputStream;
import java.io.FileNotFoundException;

@RestController
@Slf4j
public class RAGController
{
    @Resource
    InMemoryEmbeddingStore<TextSegment> embeddingStore;

    @Resource
    ChatAssistant chatAssistant;

    // http://localhost:9013/rag/add
    @GetMapping(value = "/rag/add")
    public String testAdd() throws FileNotFoundException
    {
        //Document document = FileSystemDocumentLoader.loadDocument("D:\\44\\alibaba-java.docx");

        FileInputStream fileInputStream = new FileInputStream("D:\\44\\alibaba-java.docx");
        Document document = new ApacheTikaDocumentParser().parse(fileInputStream);

        EmbeddingStoreIngestor.ingest(document, embeddingStore);

        String result = chatAssistant.chat("错误码00000和A0001分别是什么");

        System.out.println(result);

        return result;
    }
}
```

**作用说明**：
- **REST 控制器** - 提供 RAG 功能测试接口
- **文档加载与解析** - 使用 Apache Tika 解析 Word 文档
- **文档向量化存储** - 使用 EmbeddingStoreIngestor 处理文档
- **RAG 问答** - 调用 ChatAssistant 进行基于文档的问答

**关键点**：
- ✅ **`FileSystemDocumentLoader.loadDocument()`** - 加载文档
  - 支持多种格式（docx、pdf、txt等）
  - 也可以使用 FileInputStream + ApacheTikaDocumentParser
- ✅ **`ApacheTikaDocumentParser.parse()`** - 解析文档
  - Apache Tika 是一个强大的文档解析库
  - 可以提取文本内容、元数据等
- ✅ **`EmbeddingStoreIngestor.ingest()`** - 文档 ingest（摄取）
  - 自动分片（Split）
  - 自动向量化（Embedding）
  - 自动存储到 EmbeddingStore
- ✅ **`chatAssistant.chat()`** - RAG 问答
  - 自动检索相关文档片段
  - 结合上下文生成答案

#### 13.3 测试接口与返回

**接口**：RAG 文档问答
```
http://localhost:9013/rag/add
```

**返回示例**：
```
错误码00000表示成功，A0001表示参数校验失败。
```

**响应时间**: 约 2-3 秒（取决于文档大小）

**控制台日志输出**：
```
# EmbeddingStoreIngestor 处理文档
Splitting document into segments...
Generating embeddings for segments...
Storing segments in embedding store...

# ChatAssistant 问答
Retrieving relevant content from embedding store...
Found 3 relevant segments.
Sending request to ChatModel with context...
Response received.
```

#### 13.4 知识点总结

✅ **RAG (Retrieval Augmented Generation)**  
   - 检索增强生成，让 AI 能够基于私有知识回答问题  
   - 解决大模型的知识截止问题和幻觉问题  
   - 核心流程：文档加载 → 分片 → 向量化 → 存储 → 检索 → 生成  

✅ **EmbeddingStore (向量数据库)**  
   - 存储文档的向量表示  
   - 支持相似度搜索（余弦相似度、欧氏距离等）  
   - LangChain4j 支持多种向量数据库：  
     - InMemoryEmbeddingStore（内存，适合测试）  
     - QdrantEmbeddingStore（生产环境推荐）  
     - MilvusEmbeddingStore（大规模数据）  
     - ChromaEmbeddingStore、PineconeEmbeddingStore 等  

✅ **EmbeddingStoreIngestor (文档摄取器)**  
   - 自动化文档处理流程  
   - 三个步骤：  
     1. **Split** - 将文档分成多个 TextSegment  
     2. **Embed** - 为每个 TextSegment 生成向量  
     3. **Store** - 存储到 EmbeddingStore  

✅ **ContentRetriever (内容检索器)**  
   - 根据用户问题检索相关文档片段  
   - EmbeddingStoreContentRetriever - 从向量数据库检索  
   - 可以配置检索数量、相似度阈值等参数  

✅ **AiServices.builder() 构建 RAG 助手**  
   - `.chatModel()` - 设置对话模型  
   - `.chatMemory()` - 设置对话记忆  
   - `.contentRetriever()` - 设置内容检索器（关键！）  
   - 自动整合所有组件，实现 RAG 功能  

#### 13.5 RAG 详细讲解

**RAG 的工作原理**：
```
传统 LLM 的局限性：
- 训练数据有截止日期（知识过时）
- 无法访问私有数据（企业内部文档）
- 容易产生幻觉（编造事实）

RAG 的解决方案：
1. 将私有文档转换为向量并存储
2. 用户提问时，先检索相关文档片段
3. 将检索到的片段作为上下文发送给 LLM
4. LLM 基于上下文生成准确的答案

优势：
- ✅ 答案基于真实文档，减少幻觉
- ✅ 可以访问最新、私有的知识
- ✅ 不需要重新训练模型
```

**形象比喻**：
```
RAG = 开卷考试

传统 LLM = 闭卷考试
- 只能依靠记忆（训练数据）
- 可能记错或不知道最新信息

RAG = 开卷考试
- 可以查阅参考书（向量数据库）
- 找到相关内容后再作答
- 答案更准确、更可靠

步骤：
1. 准备参考书（文档预处理）
   - 把书拆成章节（分片）
   - 给每章做索引（向量化）
   - 放到书架上（存储）

2. 考试答题（问答过程）
   - 看题目（用户问题）
   - 查参考书（检索相关片段）
   - 结合题目和参考书作答（生成答案）
```

**代码示例**：
```java
// 1. 文档预处理（一次性操作）
Document document = FileSystemDocumentLoader.loadDocument("alibaba-java.docx");
EmbeddingStoreIngestor.ingest(document, embeddingStore);

// 2. 问答（多次调用）
String answer1 = chatAssistant.chat("错误码00000是什么？");
String answer2 = chatAssistant.chat("A0001是什么意思？");
String answer3 = chatAssistant.chat("如何处理超时问题？");
```

#### 13.6 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **RAG 能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **向量数据库支持** | ✅ 15+ 种 | ✅ 多种 | ✅ 多种 |
| **文档加载器** | ✅ 内置多种 | ✅ 需自定义 | ✅ 需自定义 |
| **文档解析器** | ✅ Apache Tika | ❌ 需自行集成 | ❌ 需自行集成 |
| **自动分片** | ✅ EmbeddingStoreIngestor | ❌ 需手动 | ❌ 需手动 |
| **内容检索器** | ✅ ContentRetriever | ✅ VectorStore | ✅ VectorStore |
| **RAG 集成** | ✅ AiServices 一键集成 | ⚠️ 需手动组装 | ⚠️ 需手动组装 |

#### **详细代码对比**

**1️⃣ LangChain4j（最简洁）**：
```java
// 一行代码完成 RAG 助手构建
ChatAssistant assistant = AiServices.builder(ChatAssistant.class)
    .chatModel(chatModel)
    .chatMemory(MessageWindowChatMemory.withMaxMessages(50))
    .contentRetriever(EmbeddingStoreContentRetriever.from(embeddingStore))
    .build();

// 一行代码完成文档摄取
EmbeddingStoreIngestor.ingest(document, embeddingStore);

// 一行代码完成问答
String answer = assistant.chat("问题");
```

**📖 详细讲解**：
- LangChain4j 提供了最完整的 RAG 解决方案
- 内置文档加载器、解析器、分片器、向量化器
- AiServices 自动整合所有组件
- 代码最简洁，开发效率最高

---

**2️⃣ Spring AI（需手动组装）**：
```java
// 需要手动组装各个组件
VectorStore vectorStore = new QdrantVectorStore(...);
DocumentReader reader = new PdfDocumentReader(...);
List<Document> documents = reader.get();
vectorStore.add(documents);

// 手动检索
List<Document> relevantDocs = vectorStore.similaritySearch(query);

// 手动构建 Prompt
String context = relevantDocs.stream()
    .map(Document::getContent)
    .collect(Collectors.joining("\n"));

Prompt prompt = new Prompt(
    "Context: " + context + "\nQuestion: " + query
);

ChatResponse response = chatClient.call(prompt);
```

**📖 详细讲解**：
- Spring AI 提供了基础组件，但需要手动组装
- 没有内置的文档加载器和解析器
- 需要自己实现分片、向量化逻辑
- 灵活性高，但代码量大

---

**3️⃣ Spring AI Alibaba（类似 Spring AI）**：
- 基于 Spring AI，能力类似
- 针对阿里云服务做了优化
- 同样需要手动组装 RAG 流程

#### 13.7 技术要点

**RAG 最佳实践**：
1. **文档分片策略**
   - 按段落分片（适合结构化文档）
   - 按固定字符数分片（适合非结构化文档）
   - 建议：200-500 字符/片，重叠 50-100 字符

2. **向量模型选择**
   - OpenAI Embedding（text-embedding-ada-002）
   - DashScope Embedding（text-embedding-v1/v2）
   - 本地模型：BGE、M3E 等

3. **检索参数调优**
   - `maxResults` - 检索结果数量（建议 3-5）
   - `minScore` - 最低相似度阈值（建议 0.7-0.8）
   - 根据实际效果调整

4. **向量数据库选型**
   - 小规模（<10万条）：InMemory、Chroma
   - 中规模（10万-100万）：Qdrant、Milvus
   - 大规模（>100万）：Milvus、Pinecone

#### 13.8 常见问题

**问题1：为什么 AI 回答不准确？**
- **原因**：检索到的文档片段不相关
- **解决方案**：
  - 调整分片策略（更小、更精确的片段）
  - 提高 minScore 阈值
  - 增加 maxResults 数量

**问题2：如何提高检索速度？**
- **方法**：
  - 使用高性能向量数据库（Qdrant、Milvus）
  - 建立索引（HNSW、IVF）
  - 缓存热门查询结果

**问题3：如何处理大型文档？**
- **方法**：
  - 批量处理（分批 ingest）
  - 异步处理（后台任务）
  - 增量更新（只处理新增/修改的文档）

**问题4：如何评估 RAG 效果？**
- **指标**：
  - 检索准确率（Retrieval Accuracy）
  - 答案相关性（Answer Relevance）
  - 答案忠实度（Faithfulness）
- **工具**：RAGAS、TruLens 等

---

---

### 模块14：langchain4j-14chat-mcp - MCP协议

#### 14.1 模块概述
- **端口**: 9014
- **功能**: 演示 LangChain4j 的 MCP（Model Context Protocol，模型上下文协议）能力，让 AI 能够调用外部工具和服务
- **核心概念**: MCP协议、McpClient、McpTransport、McpToolProvider、工具调用、流式响应

#### 14.2 核心代码

**📋 流程总览**：
```
用户提问 → Controller构建McpTransport → 创建McpClient → McpToolProvider注册工具 
→ AiServices构建McpService(带工具集) → streamingChatModel.chat() → 自动调用MCP工具 
→ Flux流式返回结果
```

**📊 完整调用流程图**：
```
MCP 工具调用流程：
┌─────────────┐
│   用户请求   │ /mcp/chat?question=查询北京天气
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ McpCallServerController │ chat(question)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ StdioMcpTransport       │ 启动 MCP Server
│                         │ npx @baidumap/mcp-server-baidu-map
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ DefaultMcpClient        │ 创建 MCP 客户端
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ McpToolProvider         │ 注册 MCP 工具集
│                         │ (地理编码、路线规划等)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ AiServices.builder()    │ 构建 McpService
│                         │ .toolProvider(toolProvider)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ McpService.chat()       │ 流式调用
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ StreamingChatModel      │ 分析意图,决定调用哪个工具
└──────┬──────────────────┘
       │ 需要调用工具?
       ├─ Yes → 调用 MCP 工具 → 获取结果 → 生成答案
       └─ No  → 直接生成答案
       ▼
┌─────────────────────────┐
│   Flux<String>          │ 流式返回结果
└─────────────────────────┘
```

---

**1️⃣ 定义接口：McpService.java**
```java
package com.atguigu.study.service;

import reactor.core.publisher.Flux;

/**
 * MCP 服务接口
 */
public interface McpService
{
    Flux<String> chat(String question);
}
```

**作用说明**：
- **流式接口** - 返回 Flux<String>，支持逐字输出
- **高级 API** - LangChain4j 会自动实现该接口
- **工具调用** - 自动调用 MCP 工具集

---

**2️⃣ 控制器使用：McpCallServerController.java**
```java
package com.atguigu.study.controller;

import com.atguigu.study.service.McpService;
import dev.langchain4j.mcp.McpToolProvider;
import dev.langchain4j.mcp.client.DefaultMcpClient;
import dev.langchain4j.mcp.client.McpClient;
import dev.langchain4j.mcp.client.transport.McpTransport;
import dev.langchain4j.mcp.client.transport.stdio.StdioMcpTransport;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.tool.ToolProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RestController
public class McpCallServerController
{
    @Autowired
    private StreamingChatModel streamingChatModel;

    @GetMapping("/mcp/chat")
    public Flux<String> chat(@RequestParam("question") String question) throws Exception
    {
        /**1.构建McpTransport协议
         *
         * 1.1 cmd：启动 Windows 命令行解释器。
         * 1.2 /c：告诉 cmd 执行完后面的命令后关闭自身。
         * 1.3 npx：npx = npm execute package，Node.js 的一个工具，用于执行 npm 包中的可执行文件。
         * 1.4 -y 或 --yes：自动确认操作（类似于默认接受所有提示）。
         * 1.5 @baidumap/mcp-server-baidu-map：要通过 npx 执行的 npm 包名
         * 1.6 BAIDU_MAP_API_KEY 是访问百度地图开放平台API的AK
        */
        McpTransport transport = new StdioMcpTransport.Builder()
                .command(List.of("cmd", "/c", "npx", "-y", "@baidumap/mcp-server-baidu-map"))
                .environment(Map.of("BAIDU_MAP_API_KEY", System.getenv("BAIDU_MAP_API_KEY")))
                .build();

        // 2.构建McpClient客户端
        McpClient mcpClient = new DefaultMcpClient.Builder()
                .transport(transport)
                .build();

        // 3.创建工具集和原生的FunctionCalling类似
        ToolProvider toolProvider = McpToolProvider.builder()
                .mcpClients(mcpClient)
                .build();

        // 4.通过AiServivces给我们自定义接口McpService构建实现类并将工具集和大模型赋值给AiService
        McpService mcpService = AiServices.builder(McpService.class)
                .streamingChatModel(streamingChatModel)
                .toolProvider(toolProvider)
                .build();

        // 5.调用我们定义的HighApi接口,通过大模型对百度mcpserver调用
        try {
            return mcpService.chat(question);
        } finally {
            mcpClient.close();
        }
    }
}
```

**作用说明**：
- **REST 控制器** - 提供 MCP 工具调用接口
- **动态构建 MCP 客户端** - 每次请求都创建新的 MCP 连接
- **流式响应** - 返回 Flux<String>，支持逐字输出
- **自动资源清理** - finally 块中关闭 mcpClient

**关键点**：
- ✅ **`StdioMcpTransport`** - 标准输入输出传输协议
  - 通过命令行启动 MCP Server
  - `command` - 启动命令（npx 执行 npm 包）
  - `environment` - 环境变量（API Key）
- ✅ **`DefaultMcpClient`** - MCP 客户端
  - 与 MCP Server 通信
  - 获取可用的工具列表
- ✅ **`McpToolProvider`** - 工具提供者
  - 将 MCP 工具注册到 LangChain4j
  - 类似于 Function Calling 的工具集
- ✅ **`AiServices.builder()`** - 构建 MCP 服务
  - `.streamingChatModel()` - 设置流式对话模型
  - `.toolProvider(toolProvider)` - 设置工具提供者（关键！）
- ✅ **`mcpService.chat()`** - 流式调用
  - 自动分析意图
  - 自动决定调用哪个工具
  - 自动获取工具结果并生成答案

#### 14.3 测试接口与返回

**接口1**：查询IP归属地
```
http://localhost:9014/mcp/chat?question=查询61.149.121.66归属地
```

**返回示例**：
```
该IP地址归属于中国北京市海淀区。
```

---

**接口2**：查询天气
```
http://localhost:9014/mcp/chat?question=查询北京天气
```

**返回示例**：
```
北京今天天气晴朗，气温15-25°C，空气质量良好。
```

---

**接口3**：路线规划
```
http://localhost:9014/mcp/chat?question=查询昌平到天安门路线规划
```

**返回示例**：
```
从昌平区到天安门广场，建议乘坐地铁：
1. 乘坐昌平线到西二旗站
2. 换乘13号线到东直门站
3. 换乘2号线到天安门东站
预计用时约1小时30分钟。
```

**响应时间**: 约 3-5 秒（取决于MCP Server响应速度）

**控制台日志输出**：
```
# MCP Server 启动
Starting MCP server: @baidumap/mcp-server-baidu-map
Server started successfully.

# 工具调用
Analyzing user intent...
Detected tool call: baidu_map_geocoding
Calling tool with parameters: {"address": "北京"}
Tool response received: {"status": "success", "data": {...}}

# 生成答案
Generating response based on tool result...
Streaming response to client...
```

#### 14.4 知识点总结

✅ **MCP (Model Context Protocol)**  
   - 模型上下文协议，由 Anthropic 提出  
   - 标准化的 AI 工具调用协议  
   - 让 AI 能够安全、可控地访问外部数据和工具  
   - 类似于 Function Calling，但更标准化  

✅ **McpTransport (传输协议)**  
   - 定义如何与 MCP Server 通信  
   - 支持多种传输方式：  
     - `StdioMcpTransport` - 标准输入输出（通过命令行）  
     - `SseMcpTransport` - Server-Sent Events（HTTP）  
     - `WebSocketMcpTransport` - WebSocket  

✅ **McpClient (MCP 客户端)**  
   - 与 MCP Server 建立连接  
   - 获取可用的工具列表  
   - 调用工具并获取结果  

✅ **McpToolProvider (工具提供者)**  
   - 将 MCP 工具注册到 LangChain4j  
   - 类似于 Function Calling 的工具集  
   - 自动处理工具调用的细节  

✅ **AiServices + ToolProvider**  
   - 通过 `.toolProvider()` 注册工具集  
   - AI 自动决定何时调用工具  
   - 自动获取工具结果并整合到答案中  

#### 14.5 MCP 详细讲解

**MCP 的工作原理**：
```
传统 Function Calling 的局限性：
- 每个平台有自己的实现（OpenAI、Anthropic、Google）
- 不兼容，需要为每个平台单独开发
- 工具管理复杂

MCP 的解决方案：
1. 标准化协议 - 所有平台使用同一套协议
2. 独立的 MCP Server - 工具提供者只需实现一次
3. 统一的客户端 - LangChain4j 提供通用客户端

优势：
- ✅ 跨平台兼容（OpenAI、Anthropic、Google 等）
- ✅ 工具复用（一个 MCP Server 可供多个 AI 使用）
- ✅ 易于扩展（新增工具只需部署新的 MCP Server）
```

**形象比喻**：
```
MCP = USB 接口

传统 Function Calling = 各种专用接口
- OpenAI 用 Lightning 接口
- Anthropic 用 USB-C 接口
- Google 用 Micro-USB 接口
- 每个设备需要不同的线缆

MCP = 标准 USB 接口
- 所有设备使用同一套标准
- 一个 U 盘可以在任何电脑上使用
- 即插即用，无需驱动

步骤：
1. 准备 U 盘（MCP Server）
   - 实现标准接口
   - 提供工具功能

2. 插入电脑（McpClient 连接）
   - 自动识别设备
   - 加载驱动程序

3. 读取文件（调用工具）
   - 发送请求
   - 获取数据
   - 处理结果
```

**代码示例**：
```java
// 1. 构建传输协议
McpTransport transport = new StdioMcpTransport.Builder()
    .command(List.of("cmd", "/c", "npx", "-y", "@baidumap/mcp-server-baidu-map"))
    .environment(Map.of("BAIDU_MAP_API_KEY", apiKey))
    .build();

// 2. 创建客户端
McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .build();

// 3. 注册工具
ToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .build();

// 4. 构建服务
McpService service = AiServices.builder(McpService.class)
    .streamingChatModel(model)
    .toolProvider(toolProvider)
    .build();

// 5. 调用
Flux<String> response = service.chat("查询北京天气");
```

#### 14.6 LangChain4j vs Spring AI vs Spring AI Alibaba 三方对比

#### **MCP 能力对比**

| 特性 | LangChain4j | Spring AI | Spring AI Alibaba |
|------|-------------|-----------|-------------------|
| **MCP 支持** | ✅ 官方支持 | ❌ 不支持 | ❌ 不支持 |
| **传输协议** | ✅ Stdio/SSE/WebSocket | ❌ 无 | ❌ 无 |
| **工具提供者** | ✅ McpToolProvider | ❌ 无 | ❌ 无 |
| **客户端** | ✅ DefaultMcpClient | ❌ 无 | ❌ 无 |
| **生态集成** | ✅ 丰富的 MCP Servers | ❌ 无 | ❌ 无 |

#### **详细代码对比**

**1️⃣ LangChain4j（唯一支持 MCP）**：
```java
// LangChain4j 是目前唯一支持 MCP 的 Java 框架
McpTransport transport = new StdioMcpTransport.Builder()
    .command(List.of("npx", "-y", "@baidumap/mcp-server-baidu-map"))
    .build();

McpClient mcpClient = new DefaultMcpClient.Builder()
    .transport(transport)
    .build();

ToolProvider toolProvider = McpToolProvider.builder()
    .mcpClients(mcpClient)
    .build();

McpService service = AiServices.builder(McpService.class)
    .streamingChatModel(model)
    .toolProvider(toolProvider)
    .build();
```

**📖 详细讲解**：
- LangChain4j 是 Java 生态中唯一支持 MCP 的框架
- 提供了完整的 MCP 客户端实现
- 支持多种传输协议
- 与 AiServices 无缝集成

---

**2️⃣ Spring AI（不支持 MCP）**：
- 目前不支持 MCP 协议
- 只能使用传统的 Function Calling
- 需要为每个平台单独实现

---

**3️⃣ Spring AI Alibaba（不支持 MCP）**：
- 目前不支持 MCP 协议
- 主要集成阿里云服务
- 未来可能会支持

#### 14.7 技术要点

**MCP 最佳实践**：
1. **选择合适的 MCP Server**
   - 根据需求选择（地图、搜索、数据库等）
   - 参考 https://mcp.so/ 查找可用的 MCP Servers
   - 也可以自己开发 MCP Server

2. **资源管理**
   - 及时关闭 McpClient（finally 块）
   - 避免频繁创建/销毁（可以缓存）
   - 注意内存泄漏

3. **错误处理**
   - MCP Server 可能启动失败
   - 工具调用可能超时
   - 需要完善的异常处理

4. **性能优化**
   - 复用 McpClient（单例模式）
   - 异步调用（非阻塞）
   - 缓存工具结果

#### 14.8 常见问题

**问题1：MCP Server 启动失败？**
- **原因**：npx 未安装、网络问题、API Key 错误
- **解决方案**：
  - 确保已安装 Node.js 和 npm
  - 检查网络连接
  - 验证 API Key 是否正确

**问题2：工具调用超时？**
- **原因**：MCP Server 响应慢、网络延迟
- **解决方案**：
  - 增加超时时间
  - 优化 MCP Server 性能
  - 使用本地部署的 MCP Server

**问题3：如何调试 MCP 工具调用？**
- **方法**：
  - 启用 DEBUG 日志
  - 查看 MCP Server 日志
  - 使用 MCP Inspector 工具

**问题4：如何开发自己的 MCP Server？**
- **步骤**：
  1. 选择语言（TypeScript、Python 等）
  2. 实现 MCP 协议接口
  3. 发布为 npm 包或 Docker 镜像
  4. 参考官方文档：https://modelcontextprotocol.io/

---

## 🌐 三大框架全面对比（LangChain4j vs Spring AI vs Spring AI Alibaba）

> **说明**: 本章节提供 LangChain4j、Spring AI、Spring AI Alibaba 三大框架的全面对比，帮助开发者进行技术选型。

### 📖 定义统一

- **低阶 API（底层）**：以 `ChatModel` / `StreamingChatModel` 为核心，原生消息、Prompt、参数手动构造，自由度最高、代码量大、精细化可控请求细节
- **高阶 API（上层）**：框架封装链式/注解声明式，屏蔽消息组装、系统提示词、参数配置，快速开发、少样板代码

---

### 一、总览对比表

| 框架 | 分层划分 | 低阶 API 核心入口 | 高阶 API 核心入口 | 核心设计思想 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LangChain4j** | 两层：底层组件 / AiService 注解 | `ChatModel`、`UserMessage`、`PromptTemplate`、`EmbeddingStore` | `@AiService` 声明式接口（MyBatis 风格） | 积木式组件拼装，非 Spring 也可独立运行 | 通用 RAG、Agent、非 Spring 项目、精细自定义链路 |
| **Spring AI（原生）** | 两层：原生 ChatModel / ChatClient 流式 | `ChatModel`、`Prompt`、`Message`、`ChatOptions` | `ChatClient.builder()` 流式 Builder API | Spring 规范统一抽象，多模型一键切换配置 | 标准 SpringBoot 项目、多模型灵活切换、轻量化 AI 能力 |
| **Spring AI Alibaba** | 继承 Spring AI 分层 + 企业增强 | `DashScopeChatModel`（底层原生对接 DashScope） | `ChatClient` + 阿里增强 Agent/Graph 工作流 | 基于 Spring AI 规范 + 阿里云百炼深度定制 | 通义千问/百炼平台、企业多 Agent、云原生微服务 |

---

### 二、Maven 依赖对比（低阶 / 高阶分开）

#### 1. LangChain4j

**① 低阶 API 依赖**（只引入模型厂商包，无高层封装）

```xml
<!-- BOM 统一版本管理（推荐） -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-bom</artifactId>
            <version>1.0.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- 低阶：仅 OpenAI/通义兼容接口实现包，无 AiService -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai</artifactId>
</dependency>

<!-- SpringBoot 场景：starter 低阶包 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
</dependency>
```

**② 高阶 API 依赖**（必须引入核心包，开启 @AiService）

```xml
<!-- 在低阶依赖基础上追加核心包，启用 AiService 高阶注解 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
</dependency>

<!-- SpringBoot 一站式 starter（高低阶全部包含） -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-spring-boot-starter</artifactId>
</dependency>
```

> **配置 yml**：`langchain4j.open-ai.api-key=xxx`、`base-url` 兼容 dashscope

---

#### 2. Spring AI（官方原生）

**① 低阶 API 依赖**（ChatModel 原生接口，无 ChatClient）

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>1.0.0-M6</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- 底层模型实现包（仅 ChatModel） -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai</artifactId>
</dependency>
```

**② 高阶 API 依赖**（ChatClient 流式，推荐 starter 自动装配）

```xml
<!-- starter 自动注入 ChatModel + ChatClient，一行配置启用 -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>
```

> **配置 yml**：`spring.ai.openai.api-key=xxx`、`model=gpt-3.5-turbo`

---

#### 3. Spring AI Alibaba（阿里基于 Spring AI 规范实现）

**① 低阶 API 依赖**（原生 DashScopeChatModel 底层调用）

```xml
<!-- 阿里 BOM 管理 -->
<dependencyManagement>
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-ai-alibaba-bom</artifactId>
        <version>1.0.0-M3.2</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
</dependencyManagement>

<!-- 底层 DashScope 原生实现 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-ai-alibaba-starter</artifactId>
</dependency>
```

> **配置 yml**：`spring.ai.dashscope.api-key=xxx`、`model=qwen-plus`

---

### 三、代码用法对比（低阶 VS 高阶，同需求：单次对话）

#### 3.1 LangChain4j

**✅ 低阶 API**（手动拼装 Message、Prompt、参数）

```java
// 1. 手动构建模型
ChatModel chatModel = OpenAiChatModel.builder()
        .apiKey("sk-b10fab4eef52480e9ebc051687850e50")
        .baseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1")
        .modelName("qwen-plus")
        .temperature(0.7d)
        .build();

// 2. 手动组装消息
List<Message> messages = List.of(
        SystemMessage.from("你是Java技术助手"),
        UserMessage.from("解释SpringAI高低阶区别")
);
Prompt prompt = Prompt.from(messages);
String res = chatModel.chat(prompt).aiMessage().text();
```

**✅ 高阶 API**（@AiService 注解，声明式无实现类）

```java
// 1. 定义接口（无需写实现）
@AiService
public interface Assistant {
    @SystemMessage("你是Java技术助手")
    String chat(@UserMessage String msg);
}

// 2. 构建代理对象（非 Spring Boot 方式）
Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(chatModel)
        .build();

// 3. 直接调用
String res = assistant.chat("解释SpringAI高低阶区别");

// Spring Boot 方式：只需定义接口，Starter 自动扫描创建 Bean
// 控制器中直接 @Resource 注入即可使用
```

---

#### 3.2 Spring AI 原生

**✅ 低阶 API**（ChatModel 原生，手动 Prompt）

```java
@Autowired
private ChatModel chatModel;

// 手动构造消息
Prompt prompt = new Prompt(List.of(
        new SystemMessage("你是Java技术助手"),
        new UserMessage("解释SpringAI高低阶区别")
));
ChatResponse resp = chatModel.call(prompt);
String res = resp.getResult().getOutput().getText();
```

**✅ 高阶 API**（ChatClient 链式 Builder）

```java
// 配置 Bean 全局预设系统提示词
@Bean
public ChatClient chatClient(ChatModel chatModel) {
    return ChatClient.builder(chatModel)
            .defaultSystem("你是Java技术助手") // 全局系统提示
            .build();
}

// 调用
@Autowired
private ChatClient chatClient;

String res = chatClient.prompt()
        .user("解释SpringAI高低阶区别")
        .call()
        .content();
```

---

#### 3.3 Spring AI Alibaba

**✅ 低阶 API**（DashScopeChatModel 底层，原生 DashScope 参数）

```java
@Autowired
private ChatModel dashScopeChatModel; // 自动配置

// 阿里专属参数配置
DashScopeChatOptions options = DashScopeChatOptions.builder()
        .withTemperature(0.7f)
        .withTopP(0.9f)
        .build();

Prompt prompt = new Prompt("解释SpringAI高低阶区别", options);
String res = dashScopeChatModel.call(prompt)
        .getResult()
        .getOutput()
        .getText();
```

**✅ 高阶 API**（ChatClient + 阿里增强，兼容原生链式 + Agent 扩展）

```java
@Autowired
private ChatClient chatClient;

// 复用 Spring AI 标准 ChatClient，底层自动对接通义千问
String res = chatClient.prompt()
        .system("你是Java技术助手")
        .user("解释SpringAI高低阶区别")
        .call()
        .content();

// 高阶增强：阿里独有的 Agent / StateGraph 编排（Spring AI 原生无）
```

---

### 四、高低阶关键特性横向对比

| 维度 | 低阶 API（全框架通用特点） | 高阶 API（全框架通用特点） |
| :--- | :--- | :--- |
| **参数控制** | ✅ 可精细配置 temperature、topP、topK、工具入参、请求头、超时、流式分片规则 | 全局默认参数预置，单次调用少量覆盖，底层参数封装隐藏 |
| **消息构造** | ✅ 手动组装 System/User/Assistant 多轮消息、自定义 Prompt 模板 | 系统提示词全局统一配置，入参仅传用户文本 |
| **记忆管理** | ✅ 手动维护 `ChatMemory`、存入/读取历史消息 | ✅ 高阶封装自动绑定会话记忆（LangChain4j `@MemoryId`、ChatClient 默认记忆） |
| **函数调用** | ✅ 手动组装 `FunctionDefinition`、绑定入参映射 | ✅ 注解/配置注册工具，框架自动解析入参、触发回调 |
| **代码量** | ❌ 多，大量样板消息组装代码 | ✅ 极少，聚焦业务入参 |
| **灵活性** | ✅ 高，完全控制每个细节 | 中，框架封装部分逻辑 |
| **学习曲线** | ✅ 低，容易理解 | 中，需理解框架设计 |

---

### 五、三大框架核心差异对比

| 对比维度 | LangChain4j | Spring AI | Spring AI Alibaba |
|---------|-------------|-----------|-------------------|
| **框架来源** | 社区开源项目 | Spring 官方 | 阿里巴巴官方 |
| **调用协议** | ✅ OpenAI 兼容协议 | ✅ OpenAI 兼容协议 | ✅ DashScope 原生协议（性能最优） |
| **模型支持** | ✅ 多模型（OpenAI、Azure、阿里云、Ollama等） | ✅ 多模型（OpenAI、Azure、阿里云、Ollama等） | 主要面向阿里云 DashScope |
| **声明式服务** | ✅ @AiService（MyBatis 风格） | ❌ 不支持 | ❌ 不支持 |
| **配置方式** | Java Config (@Bean) 或配置文件 | 配置文件 + 自动配置 | 配置文件 + 自动配置 |
| **Agent 支持** | ✅ 内置 Agent 框架 | ❌ 基础支持 | ✅ 阿里增强 Agent/Graph |
| **RAG 支持** | ✅ 完整的 RAG 组件 | ✅ 基础 RAG | ✅ 阿里增强 RAG |
| **学习曲线** | 中等（需理解组件拼装） | 较低（Spring 生态熟悉者） | 较低（Spring 生态熟悉者） |
| **社区活跃度** | ✅ 高（国际社区） | ✅ 高（Spring 官方） | ✅ 高（国内社区） |
| **文档完善度** | ✅ 英文文档完善 | ✅ 英文文档完善 | ✅ 中文文档友好 |

---

### 六、形象比喻帮助理解

#### 🎮 比喻1：三种框架就像三种汽车

**LangChain4j = 改装车**
- 你可以自己选择发动机（模型）、变速箱（组件）、内饰（功能）
- 需要自己动手拼装，但自由度最高
- 适合喜欢 DIY 的玩家
- 可以在任何地方开（非 Spring 项目也能用）

**Spring AI = 标准轿车**
- 厂家已经装配好，开箱即用
- 符合国家标准（Spring 规范）
- 可以换不同品牌的发动机（多模型切换）
- 适合日常通勤（标准 Spring Boot 项目）

**Spring AI Alibaba = 原厂高性能车**
- 专为阿里云赛道优化
- 性能最好（原生协议，无转换层）
- 只能在阿里云赛道跑（主要支持 DashScope）
- 适合专业赛车手（企业级阿里云用户）

---

#### 🍳 比喻2：做饭的方式

**低阶 API = 从买菜开始**
- 自己去菜市场买菜（手动构造消息）
- 自己切菜、调味（配置参数）
- 自己掌握火候（控制流程）
- 优点：想做什么菜都可以
- 缺点：费时费力

**高阶 API = 点外卖/预制菜**
- 告诉厨师要吃什么（定义接口）
- 厨师做好送上门（框架自动生成）
- 优点：省时省力
- 缺点： customization 有限

---

### 七、选型建议

#### 🎯 场景化推荐

| 场景 | 推荐方案 | 理由 |
| :--- | :--- | :--- |
| **精细定制 RAG / 自定义请求逻辑** | 全框架选用 **低阶 API** | 需要完全控制每个细节 |
| **快速业务开发、对接通义千问** | Spring AI Alibaba 高阶 `ChatClient` | 配置简单，性能最优 |
| **非 Spring 项目、跨多模型、灵活组件拼装** | LangChain4j 高阶 `@AiService` | 不依赖 Spring，组件丰富 |
| **多模型动态切换（OpenAI / 智谱 / Ollama）** | Spring AI 原生高阶 `ChatClient` | Spring 生态，多模型支持好 |
| **企业级应用、需要声明式服务** | LangChain4j `@AiService` | MyBatis 风格，代码简洁 |
| **已有 Spring AI 项目，想接入阿里云** | Spring AI Alibaba | 无缝迁移，兼容性好 |
| **学习 AI 开发、做实验** | LangChain4j | 文档完善，社区活跃 |
| **生产环境、追求稳定性** | Spring AI / Spring AI Alibaba | Spring 官方背书 |

---

### 八、常见问题 FAQ

#### Q1: 三个框架可以同时使用吗？
**答**: 不建议。虽然技术上可行，但会导致依赖冲突和维护困难。建议选择其中一个作为主框架。

#### Q2: LangChain4j 的 @AiService 和 Spring AI 的 ChatClient 哪个更好？
**答**: 
- **@AiService** - 代码更简洁，类似 MyBatis Mapper，适合复杂业务
- **ChatClient** - 链式调用直观，适合简单场景
- 选择取决于团队习惯和项目需求

#### Q3: Spring AI Alibaba 只能调用阿里云模型吗？
**答**: 不是。虽然主要针对 DashScope 优化，但也可以通过配置调用其他兼容 OpenAI 协议的模型。

#### Q4: 如何查看 Token 用量？
**答**:
- **LangChain4j**: `ChatResponse.tokenUsage()`
- **Spring AI**: `response.getMetadata()`
- **Spring AI Alibaba**: `response.getMetadata()`

#### Q5: 三个框架的性能差异大吗？
**答**:
- **Spring AI Alibaba** - 性能最优（原生协议，无转换层）
- **LangChain4j / Spring AI** - 性能良好（有一层兼容转换）
- 实际差异不大，除非高并发场景

#### Q6: 如何选择低阶 API 还是高阶 API？
**答**:
- **低阶 API** - 需要监控 Token、精细控制、自定义逻辑时使用
- **高阶 API** - 快速开发、代码简洁、标准业务场景时使用
- **建议**: 80% 场景使用高阶 API，20% 特殊场景使用低阶 API

#### Q7: LangChain4j 是否必须使用 Spring Boot？
**答**: 不是。LangChain4j 可以独立运行在任何 Java 项目中，Spring Boot 只是提供了更便捷的集成方式（Starter）。

#### Q8: 三个框架的学习资源哪里找？
**答**:
- **LangChain4j**: https://docs.langchain4j.dev/ （英文）
- **Spring AI**: https://spring.io/projects/spring-ai （英文）
- **Spring AI Alibaba**: https://java2ai.com/ （中文）

---

### 九、总结

#### 📊 一句话总结

- **LangChain4j** - 功能最全面、灵活性最高、适合各种场景
- **Spring AI** - Spring 官方标准、多模型支持好、生态完善
- **Spring AI Alibaba** - 阿里云深度优化、性能最优、中文友好

#### 🎓 学习建议

1. **初学者** - 先学 LangChain4j（本笔记），理解 AI 开发核心概念
2. **Spring 开发者** - 直接上手 Spring AI / Spring AI Alibaba
3. **企业项目** - 根据模型提供商选择（阿里云 → Spring AI Alibaba，多模型 → LangChain4j/Spring AI）
4. **实验项目** - 三个框架都可以尝试，找到最适合的

#### 🔗 与本项目笔记的关系

- **本笔记** - 深入讲解 LangChain4j 的 14 个模块，适合系统学习
- **本章节** - 提供三大框架的全局对比，适合技术选型
- **建议** - 先学习前面的模块，再阅读本章节进行对比

