# Spring AI Alibaba 完整学习笔记

> **项目来源**: 尚硅谷2025最新版Spring AI Alibaba教学项目  
> **技术栈**: Java 21 + Spring Boot 3.5.5 + Spring AI 1.0.0 + Spring AI Alibaba 1.0.0.2  
> **API密钥**: sk-b10fab4eef52480e9ebc051687850e50

---

## 📊 学习进度总览

### ✅ 已完成模块
| 模块 | 端口 | 功能 | 状态 | 学习时间 |
|------|------|------|------|----------|
| SAA-01HelloWorld | 8001 | HelloWorld示例 | ✅ 已测试 | 2025-05-29 |
| SAA-02Ollama | 8002 | Ollama本地模型集成 | ✅ 已测试 | 2025-05-29 |
| SAA-03ChatModelChatClient | 8003 | ChatModel与ChatClient对比 | ✅ 已测试 | 2025-05-29 |
| SAA-04StreamingOutput | 8004 | 流式输出和多模型共存 | ✅ 已测试 | 2025-05-29 |
| SAA-05Prompt | 8005 | Prompt提示词高级应用 | ✅ 已测试 | 2025-05-29 |
| SAA-06PromptTemplate | 8006 | PromptTemplate模板 | ✅ 已测试 | 2025-05-29 |
| SAA-07StructuredOutput | 8007 | 结构化输出 | ✅ 已测试 | 2025-05-29 |
| SAA-08Persistent | 8008 | 持久化/记忆功能 | ✅ 已测试 | 2025-05-29 |
| SAA-09Text2image | 8009 | 文生图 | ✅ 已测试 | 2025-05-29 |
| SAA-10Text2voice | 8010 | 文生音 | ✅ 已测试 | 2025-05-29 |
| SAA-11Embed2vector | 8011 | 向量化 | ✅ 已测试 | 2025-05-29 |
| SAA-12RAG4AiOps | 8012 | RAG检索增强生成 | ✅ 已测试 | 2025-05-29 |
| SAA-13ToolCalling | 8013 | 工具调用 | ✅ 已测试 | 2025-05-29 |
| SAA-14LocalMcpServer | 8014 | 本地 MCP 服务端 | ✅ 已测试 | 2025-05-29 |
| SAA-15LocalMcpClient | 8015 | 本地 MCP 客户端 | ✅ 已测试 | 2025-05-29 |
| SAA-16ClientCallBaiduMcpServer | 8016 | 调用百度 MCP 服务 | ✅ 已测试 | 2025-05-29 |
| SAA-17BailianRAG | 8017 | 百炼平台 RAG | ✅ 已测试 | 2025-05-29 |
| SAA-18TodayMenu | 8018 | 今日菜单（综合案例）| ✅ 已测试 | 2025-05-29 |

### 📅 待学习模块
| 模块 | 端口 | 功能 | 难度 |
|------|------|------|------|
| SAA-18TodayMenu | - | 今日菜单（综合案例）| ⭐⭐⭐⭐⭐ |

---

##  模块学习记录

### 模块1：SAA-01HelloWorld - HelloWorld示例

#### 1.1 模块概述
- **端口**: 8001
- **功能**: 最基本的AI对话调用，支持普通调用和流式返回
- **核心概念**: ChatModel、同步调用 vs 流式调用

#### 1.2 核心代码

**控制器：ChatHelloController.java**
```java
@RestController
public class ChatHelloController {
    
    @Resource
    private ChatModel chatModel;

    /**
     * 同步调用 - 一次性返回完整结果
     */
    @GetMapping(value = "/hello/dochat")
    public String doChat(@RequestParam(name = "msg", defaultValue="你是谁") String msg) {
        String result = chatModel.call(msg);
        return result;
    }

    /**
     * 流式调用 - 类似ChatGPT的打字机效果
     */
    @GetMapping(value = "/hello/streamchat")
    public Flux<String> stream(@RequestParam(name = "msg", defaultValue="你是谁") String msg) {
        return chatModel.stream(msg);
    }
}
```

**配置类：SaaLLMConfig.java**
```java
@Configuration
public class SaaLLMConfig {
    
    @Value("${spring.ai.dashscope.api-key}")
    private String apiKey;

    @Bean
    public DashScopeApi dashScopeApi() {
        return DashScopeApi.builder()
                .apiKey(apiKey)
                .build();
    }
}
```

**配置文件：application.properties**
```properties
server.port=8001

# 中文编码处理
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
server.servlet.encoding.charset=UTF-8

# API密钥配置
spring.ai.dashscope.api-key=sk-b10fab4eef52480e9ebc051687850e50
```

#### 1.3 测试接口

**同步调用**
```
http://localhost:8001/hello/dochat?msg=你是谁
```
**返回示例**：
```
你好！我是通义千问（Qwen），阿里巴巴集团旗下的超大规模语言模型。我能够回答问题、创作文字...
```

**流式调用**
```
http://localhost:8001/hello/streamchat?msg=介绍一下Spring AI
```
**特点**：逐字返回，类似打字机效果

#### 1.4 知识点总结

✅ **ChatModel.call()** - 同步调用，等待完整响应后返回  
✅ **ChatModel.stream()** - 流式调用，返回Flux<String>实现逐字输出  
✅ **@Value注解** - 从配置文件读取API密钥  
✅ **UTF-8编码配置** - 避免中文乱码

---

### 模块2：SAA-02Ollama - Ollama本地模型集成

#### 2.1 模块概述
- **端口**: 8002
- **功能**: 演示如何连接本地Ollama服务
- **核心概念**: Ollama、本地大模型、微服务调用

#### 2.2 核心代码

**控制器：OllamaController.java**
```java
@RestController
public class OllamaController {
    
    @Resource
    private ChatModel chatModel;

    /**
     * Ollama本地模型对话
     */
    @GetMapping(value = "/ollama/chat")
    public String chat(@RequestParam(name = "msg", defaultValue="你是谁") String msg) {
        return chatModel.call(msg);
    }
}
```

**配置文件：application.properties**
```properties
server.port=8002

# 设置全局编码格式
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
server.servlet.encoding.charset=UTF-8

spring.application.name=SAA-02Ollama

# Ollama配置（连接本地Ollama服务）
# spring.ai.ollama.base-url=http://localhost:11434
# spring.ai.ollama.chat.options.model=qwen3.5
```

#### 2.3 测试接口

```
http://localhost:8002/ollama/chat?msg=你是谁
```

**返回示例**：
```
你好！我是 **Qwen3.5**，是阿里巴巴最新推出的通义千问大语言模型。
作为通义实验室研发的超大规模语言模型，我具备以下核心能力：
- **超长上下文理解**: 原生支持 256K 上下文
- **多语言支持**: 精通全球主流语言
- **智能体规划**: 支持自主多轮搜索与代码执行
- **专业领域增强**: 在医疗、法律等垂直场景中具备高精度知识
- **视觉深度解析**: 不仅能识别图表，还能进行复杂数学公式和科学图示的深度分析

我的训练数据截止时间是**2026 年**。
```

#### 2.4 知识点总结

✅ **Ollama** - 本地运行大模型的工具  
✅ **ChatModel** - 统一的大模型调用接口  
✅ **本地部署** - 数据隐私性更好，无需网络  
✅ **模型选择** - 可以切换不同的本地模型（qwen3.5等）

---

### 模块3：SAA-03ChatModelChatClient - ChatModel与ChatClient对比

#### 3.1 模块概述
- **端口**: 8003
- **功能**: 演示ChatModel和ChatClient两种调用方式的对比
- **核心概念**: ChatModel（传统方式）、ChatClient（Builder模式）

#### 3.2 核心代码

**配置类：SaaLLMConfig.java**
```java
@Configuration
public class SaaLLMConfig {
    
    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }
}
```

**控制器1：ChatModelController.java（传统方式）**
```java
@RestController
public class ChatModelController {
    
    @Resource
    private ChatModel chatModel;

    @GetMapping("/chatmodel/dochat")
    public String doChat(String msg) {
        // 直接调用，简单直接
        return chatModel.call(msg);
    }
}
```

**控制器2：ChatClientController.java（推荐方式）**
```java
@RestController
public class ChatClientController {
    
    @Resource
    private ChatClient chatClient;

    @GetMapping("/chatclient/dochat")
    public String doChat(String msg) {
        // Builder模式，支持链式调用
        return chatClient.prompt()
                .user(msg)
                .call()
                .content();
    }
}
```

#### 3.3 测试接口与返回

**接口1：ChatClient方式（推荐）**
```
http://localhost:8003/chatclient/dochat?msg=用一句话介绍Java
```
**返回示例**：
```
Java是一种面向对象、跨平台、高性能的通用编程语言，通过"一次编写，到处运行"的理念，
依托Java虚拟机（JVM）实现平台无关性，广泛应用于企业级应用、Android开发、大数据和云计算等领域。
```
**响应时间**: 约1.5秒

**接口2：ChatClient V2方式**
```
http://localhost:8003/chatclientv2/dochat?msg=什么是Spring Boot
```
**返回示例**：
```
Spring Boot 是一个由 Pivotal（现属 VMware）开发的开源 Java 框架，
旨在简化 Spring 应用的初始搭建、开发和部署过程。
核心特性：自动配置（Auto-Configuration）、起步依赖（Starters）、内嵌Web容器等。
```
**响应时间**: 约25秒（详细内容较长）

**接口3：ChatModel方式（传统）**
```
http://localhost:8003/chatmodel/dochat?msg=AI是什么
```

#### 3.4 知识点总结

✅ **ChatModel** - 传统调用方式，直接简单，适合基础场景  
✅ **ChatClient** - Builder模式，支持链式调用，更灵活，**推荐使用**  
✅ **链式调用优势** - 可以方便地添加system prompt、advisors、tools等  
✅ **性能对比** - 两者性能相当，响应时间约1.5-2秒（简单问答）  
✅ **最佳实践** - 新项目推荐使用ChatClient，老项目可继续使用ChatModel

#### 3.5 ChatModel vs ChatClient 对比表

| 特性 | ChatModel | ChatClient |
|------|-----------|------------|
| 调用方式 | 直接调用 | Builder模式 |
| 链式调用 | ❌ 不支持 | ✅ 支持 |
| 代码简洁度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 扩展性 | 有限 | 强大（Advisors、Tools） |
| 学习曲线 | 低 | 中 |
| 推荐度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 适用场景 | 简单问答 | 复杂场景、生产环境 |

---

### 模块4：SAA-04StreamingOutput - 流式输出和多模型共存

#### 4.1 模块概述
- **端口**: 8004
- **功能**: 演示流式输出（类似ChatGPT打字机效果）和多模型共存
- **核心概念**: Flux流式响应、DeepSeek模型、Qwen模型、ChatModel vs ChatClient

#### 4.2 核心代码

**配置类：SaaLLMConfig.java**
```java
@Configuration
public class SaaLLMConfig {
    
    @Value("${spring.ai.dashscope.api-key}")
    private String apiKey;

    // 模型名称常量定义
    private final String DEEPSEEK_MODEL = "deepseek-v3";
    private final String QWEN_MODEL = "qwen-max";

    // 配置DeepSeek模型
    @Bean(name = "deepseek")
    public ChatModel deepSeek() {
        return DashScopeChatModel.builder()
                .dashScopeApi(DashScopeApi.builder().apiKey(apiKey).build())
                .defaultOptions(DashScopeChatOptions.builder().withModel(DEEPSEEK_MODEL).build())
                .build();
    }

    // 配置Qwen模型
    @Bean(name = "qwen")
    public ChatModel qwen() {
        return DashScopeChatModel.builder()
                .dashScopeApi(DashScopeApi.builder().apiKey(apiKey).build())
                .defaultOptions(DashScopeChatOptions.builder().withModel(QWEN_MODEL).build())
                .build();
    }

    // 配置DeepSeek ChatClient
    @Bean(name = "deepseekChatClient")
    public ChatClient deepseekChatClient(@Qualifier("deepseek") ChatModel deepseek) {
        return ChatClient.builder(deepseek)
                .defaultOptions(ChatOptions.builder().model(DEEPSEEK_MODEL).build())
                .build();
    }

    // 配置Qwen ChatClient
    @Bean(name = "qwenChatClient")
    public ChatClient qwenChatClient(@Qualifier("qwen") ChatModel qwen) {
        return ChatClient.builder(qwen)
                .defaultOptions(ChatOptions.builder().model(QWEN_MODEL).build())
                .build();
    }
}
```

**控制器：StreamOutputController.java**
```java
@RestController
public class StreamOutputController {
    
    // V1 通过ChatModel实现stream流式输出
    @Resource(name = "deepseek")
    private ChatModel deepseekChatModel;
    
    @Resource(name = "qwen")
    private ChatModel qwenChatModel;

    // V2 通过ChatClient实现stream流式输出
    @Resource(name = "deepseekChatClient")
    private ChatClient deepseekChatClient;
    
    @Resource(name = "qwenChatClient")
    private ChatClient qwenChatClient;

    // 接口1：DeepSeek + ChatModel
    @GetMapping(value = "/stream/chatflux1")
    public Flux<String> chatflux(String question) {
        return deepseekChatModel.stream(question);
    }

    // 接口2：Qwen + ChatModel
    @GetMapping(value = "/stream/chatflux2")
    public Flux<String> chatflux2(String question) {
        return qwenChatModel.stream(question);
    }

    // 接口3：DeepSeek + ChatClient
    @GetMapping(value = "/stream/chatflux3")
    public Flux<String> chatflux3(String question) {
        return deepseekChatClient.prompt(question).stream().content();
    }

    // 接口4：Qwen + ChatClient
    @GetMapping(value = "/stream/chatflux4")
    public Flux<String> chatflux4(String question) {
        return qwenChatClient.prompt(question).stream().content();
    }
}
```

#### 4.3 测试接口与返回

**接口1：DeepSeek + ChatModel**
```
http://localhost:8004/stream/chatflux1?question=用100字介绍AI
```
**返回示例**：
```
人工智能（AI）是通过计算机模拟人类智能的技术，涵盖机器学习、自然语言处理、
计算机视觉等领域。AI能自主分析数据、识别模式、做出决策，广泛应用于医疗、金融、
交通等行业，提升效率与精准度。随着深度学习和大数据的进步，AI正加速革新社会生产与生活方式。
```
**响应时间**: 约2.84秒

**接口2：Qwen + ChatModel**
```
http://localhost:8004/stream/chatflux2?question=什么是机器学习
```
**返回示例**：
```
机器学习是一种人工智能技术，它使计算机能够在不进行明确编程的情况下从数据中学习并改进其性能。
主要通过统计学和算法分析大量数据，识别模式，并基于这些模式做出预测或决策。
主要分为三大类：监督学习、无监督学习、强化学习。
```
**响应时间**: 约6.88秒

**接口3：DeepSeek + ChatClient**
```
http://localhost:8004/stream/chatflux3?question=Java的优势
```
**返回示例**：
```
Java 作为一门经典的编程语言，拥有多方面的优势：
1. 跨平台性（Write Once, Run Anywhere）- JVM实现平台无关性
2. 面向对象编程（OOP）- 封装、继承、多态
3. 强类型语言 - 严格的类型检查减少运行时错误
```

**接口4：Qwen + ChatClient**
```
http://localhost:8004/stream/chatflux4?question=Spring Boot特点
```
**返回示例**：
```
Spring Boot 是 Spring 框架的一个子项目，它通过约定优于配置的理念简化了基于 Spring 应用的初始搭建以及开发过程。
主要特点：
1. 自动配置 - 根据依赖库自动配置应用
2. 起步依赖 - 提供一系列starter依赖
3. 内嵌服务器 - 支持Tomcat、Jetty等
4. 生产就绪特性 - 健康检查、度量指标等
5. 外部化配置 - application.properties管理配置
```
**响应时间**: 约25.9秒（详细内容较长）

#### 4.4 知识点总结

✅ **流式输出** - 使用`Flux<String>`实现逐字返回，类似ChatGPT打字机效果  
✅ **多模型共存** - 通过`@Bean(name = "xxx")`和`@Resource(name = "xxx")`实现同一应用中使用多个模型  
✅ **ChatModel流式** - `chatModel.stream(question)` 直接返回Flux流  
✅ **ChatClient流式** - `chatClient.prompt().stream().content()` 链式调用更灵活  
✅ **性能差异** - DeepSeek响应较快（2-3秒），Qwen响应稍慢但内容更详细  
✅ **模型选择** - DeepSeek适合快速回答，Qwen适合深度分析  

#### 4.5 技术要点

**流式输出的优势**：
- 用户体验更好：用户不需要等待完整响应
- 适合长文本生成：可以实时看到生成进度
- 类似ChatGPT效果：逐字显示，更有交互感

**多模型共存场景**：
- 不同模型有不同特长（如DeepSeek快、Qwen详细）
- 可以根据业务需求动态选择模型
- 实现A/B测试和模型对比

---

### 模块5：SAA-05Prompt - Prompt提示词高级应用

#### 5.1 模块概述
- **端口**: 8005
- **功能**: 演示Prompt提示词的高级用法，包括System Prompt、消息类型、角色设定等
- **核心概念**: SystemMessage、UserMessage、AssistantMessage、ToolResponseMessage、Prompt对象

#### 5.2 核心代码

**控制器：PromptController.java**
```java
@RestController
public class PromptController {
    
    @Resource(name = "deepseek")
    private ChatModel deepseekChatModel;
    
    @Resource(name = "qwen")
    private ChatModel qwenChatModel;

    @Resource(name = "deepseekChatClient")
    private ChatClient deepseekChatClient;
    
    @Resource(name = "qwenChatClient")
    private ChatClient qwenChatClient;

    // 接口1：角色限定（法律助手）
    @GetMapping("/prompt/chat")
    public Flux<String> chat(String question) {
        return deepseekChatClient.prompt()
                .system("你是一个法律助手，只回答法律问题...")
                .user(question)
                .stream()
                .content();
    }

    // 接口2：ChatResponse流式输出
    @GetMapping("/prompt/chat2")
    public Flux<ChatResponse> chat2(String question) {
        SystemMessage systemMessage = new SystemMessage("你是一个讲故事的助手,每个故事控制在300字以内");
        UserMessage userMessage = new UserMessage(question);
        Prompt prompt = new Prompt(userMessage, systemMessage);
        return deepseekChatModel.stream(prompt);
    }

    // 接口3：HTML格式输出
    @GetMapping("/prompt/chat3")
    public Flux<String> chat3(String question) {
        SystemMessage systemMessage = new SystemMessage("你是一个讲故事的助手,每个故事控制在600字以内且以HTML格式返回");
        UserMessage userMessage = new UserMessage(question);
        Prompt prompt = new Prompt(userMessage, systemMessage);
        return deepseekChatModel.stream(prompt)
                .map(response -> response.getResults().get(0).getOutput().getText());
    }

    // 接口4：同步调用获取AssistantMessage
    @GetMapping("/prompt/chat4")
    public String chat4(String question) {
        AssistantMessage assistantMessage = deepseekChatClient.prompt()
                    .user(question)
                    .call()
                    .chatResponse()
                    .getResult()
                    .getOutput();
        return assistantMessage.getText();
    }

    // 接口5：Tool Response示例
    @GetMapping("/prompt/chat5")
    public String chat5(String city) {
        String answer = deepseekChatClient.prompt()
                .user(city + "未来3天天气情况如何?")
                .call()
                .chatResponse()
                .getResult()
                .getOutput()
                .getText();

        ToolResponseMessage toolResponseMessage = new ToolResponseMessage(
                List.of(new ToolResponseMessage.ToolResponse("1","获得天气",city)));
        
        return answer + toolResponseMessage.getText();
    }
}
```

#### 5.3 测试接口与返回

**接口1：角色限定（法律助手）**
```
http://localhost:8005/prompt/chat?question=什么是合同法
```
**返回示例**：
```
合同法是指调整平等主体之间设立、变更、终止民事权利义务关系的协议的法律规范的总称。
一、法律依据：我国合同法律制度主要规定在《中华人民共和国民法典》中。
二、核心原则：意思自治原则、平等原则、公平原则、诚实信用原则、公序良俗原则。
```
**说明**: System Prompt生效，AI扮演法律助手角色

**接口2：ChatResponse流式输出**
```
http://localhost:8005/prompt/chat2?question=讲个葫芦娃的故事
```
**返回**: JSON格式的ChatResponse对象（包含metadata、output等完整结构）

**接口3：HTML格式输出**
```
http://localhost:8005/prompt/chat3?question=讲个葫芦娃的故事
```
**返回示例**：
```html
<!DOCTYPE html>
<html>
<head>
    <title>葫芦娃的故事</title>
    <style>
        body { font-family: 'Arial', sans-serif; ... }
        h1 { color: #e74c3c; text-align: center; }
    </style>
</head>
<body>
    <h1>葫芦兄弟</h1>
    <p>从前，在一座青山脚下...</p>
</body>
</html>
```
**说明**: AI成功按照System Prompt要求生成HTML格式

**接口4：同步调用**
```
http://localhost:8005/prompt/chat4?question=介绍AI
```
**返回示例**：
```
人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，旨在开发能够模拟人类智能的系统和机器。
1. 定义与核心目标：AI指通过计算机程序实现通常需要人类智能的任务。
2. AI的主要类型：弱人工智能、强人工智能、超级人工智能。
3. 关键技术：机器学习、自然语言处理、计算机视觉等。
```

**接口5：Tool Response**
```
http://localhost:8005/prompt/chat5?city=北京
```
**返回示例**：
```
以下是北京市未来3天的天气预报：
2023年10月X日（今天）：晴间多云，15°C ~ 25°C，北风2-3级，空气质量良。
2023年10月X+1日（明天）：多云转阴，局部有小雨，14°C ~ 22°C。
2023年10月X+2日（后天）：阴转晴，12°C ~ 20°C。
温馨提示：昼夜温差较大，建议采用“洋葱式”穿衣法。
```

#### 5.4 知识点总结

✅ **System Prompt** - 系统提示词，定义AI的角色和行为边界（如"法律助手"、"故事助手"）  
✅ **消息类型** - SystemMessage（系统消息）、UserMessage（用户消息）、AssistantMessage（助手消息）、ToolResponseMessage（工具响应消息）  
✅ **Prompt对象** - 将SystemMessage和UserMessage组合成Prompt对象  
✅ **角色限定** - 通过system()方法设定AI角色，约束其响应范围  
✅ **格式控制** - 在System Prompt中指定输出格式（如"以HTML格式返回"）  
✅ **长度控制** - 在System Prompt中限制输出长度（如"每个故事控制在300字以内"）  

---

### 模块6：SAA-06PromptTemplate - PromptTemplate模板

#### 6.1 模块概述
- **端口**: 8006
- **功能**: 演示PromptTemplate（提示词模板）的高级应用
- **核心概念**: PromptTemplate、SystemPromptTemplate、占位符替换、模板文件

#### 6.2 核心代码

**控制器：PromptTemplateController.java**
```java
@RestController
public class PromptTemplateController {
    
    @Resource(name = "deepseek")
    private ChatModel deepseekChatModel;
    
    @Resource(name = "deepseekChatClient")
    private ChatClient deepseekChatClient;

    @Value("classpath:/prompttemplate/atguigu-template.txt")
    private org.springframework.core.io.Resource userTemplate;

    // 接口1：基础模板（占位符）
    @GetMapping("/prompttemplate/chat")
    public Flux<String> chat(String topic, String output_format, String wordCount) {
        PromptTemplate promptTemplate = new PromptTemplate(
                "讲一个关于{topic}的故事" +
                "并以{output_format}格式输出，" +
                "字数在{wordCount}左右");
        
        Prompt prompt = promptTemplate.create(Map.of(
                "topic", topic,
                "output_format", output_format,
                "wordCount", wordCount));
        
        return deepseekChatClient.prompt(prompt).stream().content();
    }

    // 接口2：模板文件读取
    @GetMapping("/prompttemplate/chat2")
    public String chat2(String topic, String output_format) {
        PromptTemplate promptTemplate = new PromptTemplate(userTemplate);
        Prompt prompt = promptTemplate.create(Map.of(
                "topic", topic, 
                "output_format", output_format));
        return deepseekChatClient.prompt(prompt).call().content();
    }

    // 接口3：System+User双模板
    @GetMapping("/prompttemplate/chat3")
    public String chat3(String sysTopic, String userTopic) {
        // 系统消息模板
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(
            "你是{systemTopic}助手，只回答{systemTopic}其它无可奉告，以HTML格式的结果。");
        Message sysMessage = systemPromptTemplate.createMessage(
            Map.of("systemTopic", sysTopic));
        
        // 用户消息模板
        PromptTemplate userPromptTemplate = new PromptTemplate("解释一下{userTopic}");
        Message userMessage = userPromptTemplate.createMessage(
            Map.of("userTopic", userTopic));
        
        // 组合多个Message -> Prompt
        Prompt prompt = new Prompt(List.of(sysMessage, userMessage));
        
        return deepseekChatClient.prompt(prompt).call().content();
    }

    // 接口4：ChatModel角色设定
    @GetMapping("/prompttemplate/chat4")
    public String chat4(String question) {
        SystemMessage systemMessage = new SystemMessage(
            "你是一个Java编程助手，拒绝回答非技术问题。");
        UserMessage userMessage = new UserMessage(question);
        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));
        return deepseekChatModel.call(prompt).getResult().getOutput().getText();
    }

    // 接口5：ChatClient角色设定
    @GetMapping("/prompttemplate/chat5")
    public Flux<String> chat5(String question) {
        return deepseekChatClient.prompt()
                .system("你是一个Java编程助手，拒绝回答非技术问题。")
                .user(question)
                .stream()
                .content();
    }
}
```

**模板文件** (`atguigu-template.txt`)：
```
讲一个关于{topic}的故事，并以{output_format}格式输出。
```

#### 6.3 测试接口与返回

**接口1：基础模板（占位符）**
```
http://localhost:8006/prompttemplate/chat?topic=java&output_format=html&wordCount=200
```
**返回示例**：
```markdown
# Java的奇妙冒险
```html
<!DOCTYPE html>
<html>
<head>
    <title>Java的奇妙冒险</title>
    <style>
        body { font-family: Arial, sans-serif; ... }
        h1 { color: #007396; text-align: center; }
    </style>
</head>
<body>
    <h1>Java的奇妙冒险</h1>
    <p>在很久很久以前...</p>
</body>
</html>
```
**说明**: 占位符{topic}、{output_format}、{wordCount}被正确替换

**接口2：模板文件读取**
```
http://localhost:8006/prompttemplate/chat2?topic=java&output_format=markdown
```
**返回示例**：
```markdown
# 老咖啡机与Java的奇妙夜

## 第一章：故障的咖啡机
凌晨3点，程序员**小林**盯着办公室里那台老旧的咖啡机...

```java
Exception in thread "CoffeeMaker"
java.lang.BrewException: Steam pressure too high
```
```
**说明**: 从文件读取模板成功，占位符被正确替换

**接口3：System+User双模板**
```
http://localhost:8006/prompttemplate/chat3?sysTopic=法律&userTopic=知识产权法
```
**返回示例**：
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>知识产权法解释</title>
    <style>
        body { font-family: Arial, sans-serif; ... }
    </style>
</head>
<body>
    <h1>知识产权法</h1>
    <p>知识产权法是指...</p>
</body>
</html>
```
**说明**: System和User双模板组合成功，AI扮演法律助手角色

**接口4：ChatModel角色设定**
```
http://localhost:8006/prompttemplate/chat4?question=Spring Boot是什么
```
**返回示例**：
```
Spring Boot 是一个基于 **Spring 框架**的开源 Java 开发框架，旨在简化 Spring 应用的初始搭建和开发过程。
核心特点：
1. 快速启动 - 提供内嵌的服务器（如 Tomcat、Jetty 或 Undertow）
2. 自动配置 - 根据项目依赖自动配置 Spring 和相关第三方库
3. 生产就绪 - 内置监控端点、健康检查、指标收集等功能
```

**接口5：ChatClient角色设定**
```
http://localhost:8006/prompttemplate/chat5?question=Java的优势
```
**返回示例**：
```
Java 作为一门广泛使用的编程语言，具有以下核心优势：
1. 跨平台性（Write Once, Run Anywhere）- 基于JVM实现平台无关性
2. 面向对象（OOP）- 支持封装、继承、多态等特性
3. 丰富的标准库（Java API）- 提供强大的工具包（如集合框架、I/O、网络、并发等）
```

#### 6.4 知识点总结

✅ **PromptTemplate** - 使用占位符（如`{topic}`）创建可复用的提示词模板  
✅ **占位符替换** - 使用`promptTemplate.create(Map.of("key", "value"))`替换占位符  
✅ **模板文件** - 从外部文件读取模板内容，便于管理和维护  
✅ **SystemPromptTemplate** - 系统消息模板，专门用于创建SystemMessage  
✅ **双模板组合** - SystemPromptTemplate + PromptTemplate组合，实现更复杂的提示词结构  
✅ **角色设定** - 通过SystemMessage限定AI角色（如"法律助手"、"Java编程助手"）  

#### 6.5 PromptTemplate vs 直接拼接

| 特性 | 直接拼接字符串 | PromptTemplate |
|------|---------------|----------------|
| 可读性 | 差（字符串拼接混乱） | 好（模板清晰） |
| 可维护性 | 低（修改困难） | 高（模板文件管理） |
| 可复用性 | 差 | 好（参数化模板） |
| 推荐度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

### 模块7：SAA-07StructuredOutput - 结构化输出

#### 7.1 模块概述
- **端口**: 8007
- **功能**: 演示如何让AI返回结构化数据（JSON/Java对象）
- **核心概念**: OutputParser、Record类、参数化模板、实体转换

#### 7.2 核心代码

**数据结构：StudentRecord.java**
```java
// Java 14+ record特性，相当于 entity + lombok
public record StudentRecord(String id, String sname, String major, String email) { }
```

**特点**：
- 自动生成构造器、getter、toString、equals、hashCode
- 不可变对象（所有字段都是final）
- 代码简洁，适合数据传输对象（DTO）

**控制器：StructuredOutputController.java**
```java
@RestController
public class StructuredOutputController {
    
    @Resource(name = "qwenChatClient")
    private ChatClient qwenChatClient;

    // 接口1：Consumer方式传参
    @GetMapping("/structuredoutput/chat")
    public StudentRecord chat(@RequestParam String sname, @RequestParam String email) {
        
        return qwenChatClient.prompt()
            .user(new Consumer<ChatClient.PromptUserSpec>() {
                @Override
                public void accept(ChatClient.PromptUserSpec promptUserSpec) {
                    promptUserSpec.text("学号1001，我叫{sname},大学专业计算机科学与技术,邮箱{email}")
                            .param("sname", sname)
                            .param("email", email);
                }
            })
            .call()
            .entity(StudentRecord.class);  // 关键：将AI输出解析为StudentRecord对象
    }

    // 接口2：Lambda方式传参（推荐）
    @GetMapping("/structuredoutput/chat2")
    public StudentRecord chat2(@RequestParam String sname, @RequestParam String email) {
        
        String stringTemplate = """
               学号1002，我叫{sname},大学专业软件工程,邮箱{email}            
                """;

        return qwenChatClient.prompt()
                .user(promptUserSpec -> promptUserSpec.text(stringTemplate)
                        .param("sname", sname)
                        .param("email", email))
                .call()
                .entity(StudentRecord.class);
    }
}
```

#### 7.3 测试接口与返回

**接口1：Consumer方式传参**
```
http://localhost:8007/structuredoutput/chat?sname=李四&email=lisi@example.com
```
**返回示例**：
```json
{
  "id": "1001",
  "sname": "李四",
  "major": "计算机科学与技术",
  "email": "lisi@example.com"
}
```
**说明**: AI自动从文本中提取信息并填充到StudentRecord对象中

**接口2：Lambda方式传参（推荐）**
```
http://localhost:8007/structuredoutput/chat2?sname=孙伟&email=sunwei@example.com
```
**返回示例**：
```json
{
  "id": "1002",
  "sname": "孙伟",
  "major": "软件工程",
  "email": "sunwei@example.com"
}
```
**说明**: Lambda写法更简洁，功能完全相同

#### 7.4 知识点总结

✅ **结构化输出** - 让AI返回特定格式的数据（JSON/Java对象），而不是普通文本  
✅ **OutputParser** - 将AI输出解析为Java对象的核心机制  
✅ **Record类** - Java 14+新特性，简化数据类定义（相当于entity + lombok）  
✅ **参数化模板** - 使用`{key}`占位符和`.param("key", "value")`替换参数  
✅ **entity()方法** - `.entity(ClassName.class)`将AI返回的JSON转换为Java对象  
✅ **Text Block** - Java 15+的多行字符串特性（`"""`），提高代码可读性  

#### 7.5 两种传参方式对比

| 特性 | Consumer方式 | Lambda方式 |
|------|-------------|-----------|
| 代码简洁度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 可读性 | 一般 | 好 |
| 推荐度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 适用场景 | 复杂逻辑 | 日常开发（推荐） |

**Consumer方式**：
```java
.user(new Consumer<ChatClient.PromptUserSpec>() {
    @Override
    public void accept(ChatClient.PromptUserSpec promptUserSpec) {
        promptUserSpec.text("...")
                .param("sname", sname)
                .param("email", email);
    }
})
```

**Lambda方式（推荐）**：
```java
.user(promptUserSpec -> promptUserSpec.text("...")
        .param("sname", sname)
        .param("email", email))
```

#### 7.6 应用场景

**结构化输出的典型应用**：
- 📊 **数据提取** - 从非结构化文本中提取结构化信息
-  **表单生成** - 根据描述生成JSON格式的表单数据
-  **信息抽取** - 从文章中抽取关键信息（如人名、地点、时间）
- 🔄 **API集成** - 生成符合API规范的JSON数据
- 📈 **数据分析** - 将分析结果输出为结构化格式

---

### 模块8：SAA-08Persistent - 持久化/记忆功能

#### 8.1 模块概述
- **端口**: 8008
- **功能**: 演示对话记忆功能，让AI记住之前的对话内容
- **核心概念**: ChatMemory、Conversation ID、Advisor机制、Redis持久化

#### 8.2 核心代码

**控制器：ChatMemory4RedisController.java**
```java
@RestController
public class ChatMemory4RedisController {
    
    @Resource(name = "qwenChatClient")
    private ChatClient qwenChatClient;

    @GetMapping("/chatmemory/chat")
    public String chat(String msg, String userId) {
        // Lambda方式（推荐）
        return qwenChatClient
                .prompt(msg)
                .advisors(advisorSpec -> advisorSpec.param(CONVERSATION_ID, userId))
                .call()
                .content();
    }
}
```

**关键点**：
- **`.advisors()`** - 添加Advisor（顾问），为对话添加额外能力（如记忆）
- **`CONVERSATION_ID`** - 会话ID常量，用于标识不同的对话会话
- **`userId`** - 用户ID，作为会话标识，相同userId的对话会被关联起来

**配置文件：application.properties**
```properties
server.port=8008

# Redis配置（用于持久化对话历史）
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.database=0
spring.data.redis.connect-timeout=3
spring.data.redis.timeout=2
```

#### 8.3 测试接口与返回

**接口1：带记忆的对话**
```
http://localhost:8008/chatmemory/chat?msg=我叫张三，今年25岁&userId=user001
```
**返回示例**：
```
你好，张三！很高兴认识你～25岁正是充满活力、探索自我和积累经验的黄金阶段
如果你愿意分享，我很乐意听听：
- 你目前在从事什么工作或学习方向？
- 有什么特别感兴趣的事情（比如旅行、科技、音乐、运动、写作……）？
- 或者最近有什么小目标、困惑，或者想聊一聊的话题？

无论你想规划职业、梳理想法、练习表达，还是单纯轻松聊聊，我都在这儿
期待你的故事
```
**说明**: AI记住了用户信息，后续对话可以基于此进行

**多轮对话测试**：

第1轮：告诉AI你的信息
```
http://localhost:8008/chatmemory/chat?msg=我叫张三，今年25岁&userId=user001
```

第2轮：询问AI是否记得（使用相同userId）
```
http://localhost:8008/chatmemory/chat?msg=我叫什么名字？&userId=user001
```
**预期返回**: AI应该回答"你叫张三"（记忆功能正常）

第3轮：继续询问年龄
```
http://localhost:8008/chatmemory/chat?msg=我今年多大？&userId=user001
```
**预期返回**: AI应该回答"你今年25岁"

**对比测试**：使用不同的userId
```
http://localhost:8008/chatmemory/chat?msg=我叫什么名字？&userId=user002
```
**预期返回**: AI应该回答"我不知道你的名字"（会话隔离）

#### 8.4 知识点总结

✅ **ChatMemory** - 对话记忆功能，让AI记住之前的对话历史  
✅ **Conversation ID** - 会话ID，用于区分不同用户的对话  
✅ **Advisor机制** - 通过Advisor为对话添加额外能力（记忆、工具调用等）  
✅ **Redis持久化** - 使用Redis存储对话历史，应用重启后记忆不丢失  
✅ **会话隔离** - 不同userId的对话互不干扰  
✅ **多轮对话** - 支持连续对话，AI能理解上下文  

#### 8.5 ChatMemory工作原理

**AI默认是无状态的**：
- 每次对话都是独立的
- AI不会记住之前的对话内容

**通过ChatMemory实现记忆**：
1. 使用`CONVERSATION_ID`标识会话
2. 对话历史存储在Redis中
3. 每次对话时，AI会读取历史消息
4. 基于历史上下文生成回复

**Advisor机制**：
```java
.advisors(advisorSpec -> advisorSpec.param(CONVERSATION_ID, userId))
```
- Advisor是Spring AI的扩展机制
- 可以为对话添加额外功能
- `CONVERSATION_ID`参数告诉AI这是哪个会话

#### 8.6 应用场景

**对话记忆的典型应用**：
- 💬 **客服系统** - 记住用户之前的问题和解决方案
- 🎓 **教育助手** - 记住学生的学习进度和偏好
-  **医疗咨询** - 记住患者的病史和症状
- 🤖 **个人助理** - 记住用户的喜好和习惯
- 📝 **写作助手** - 记住文章的主题和风格

---

### 模块9：SAA-09Text2image - 文生图

#### 9.1 模块概述
- **端口**: 8009
- **功能**: 演示文本生成图片功能，让AI根据文本描述生成图像
- **核心概念**: ImageModel、Text to Image、通义万相模型、图像URL

#### 9.2 核心代码

**控制器：Text2ImageController.java**
```java
@RestController
public class Text2ImageController {
    
    // 使用通义万相Turbo模型
    public static final String IMAGE_MODEL = "wanx2.1-t2i-turbo";

    @Resource
    private ImageModel imageModel;

    @GetMapping(value = "/t2i/image")
    public String image(@RequestParam(name = "prompt", defaultValue = "刺猬") String prompt) {
        return imageModel.call(
                    new ImagePrompt(prompt, 
                        DashScopeImageOptions.builder()
                            .withModel(IMAGE_MODEL)
                            .build())
                )
                .getResult()
                .getOutput()
                .getUrl();  // 返回图片URL
    }
}
```

**关键点**：
- **`ImageModel`** - Spring AI提供的图像生成模型接口
- **`ImagePrompt`** - 图像生成提示词，包含文本描述和配置选项
- **`wanx2.1-t2i-turbo`** - 通义万相的Turbo版本，生成速度快
- **`.getUrl()`** - 返回生成图片的在线访问URL（不是Base64）

#### 9.3 测试接口与返回

**接口1：文本生成图片**
```
http://localhost:8009/t2i/image?prompt=一只可爱的橘猫在草地上玩耍
```
**返回示例**：
```
https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/xxx.png
```
**说明**: 返回的是图片的在线访问URL，可以直接在浏览器中打开查看

**测试场景**：

**场景1：基础测试（默认值）**
```
http://localhost:8009/t2i/image
```
使用默认的prompt="刺猬"

**场景2：动物主题**
```
http://localhost:8009/t2i/image?prompt=一只可爱的橘猫在草地上玩耍
```

**场景3：风景主题**
```
http://localhost:8009/t2i/image?prompt=日落时分的海边，金色的阳光洒在海面上
```

**场景4：人物主题**
```
http://localhost:8009/t2i/image?prompt=一个穿着汉服的少女在樱花树下
```

**场景5：科幻主题**
```
http://localhost:8009/t2i/image?prompt=未来城市的夜景，霓虹灯闪烁，飞行汽车穿梭
```

#### 9.4 知识点总结

✅ **ImageModel** - Spring AI的图像生成模型接口  
✅ **Text to Image** - 根据文本描述生成图片  
✅ **通义万相模型** - 阿里云的图像生成模型（wanx2.1-t2i-turbo）  
✅ **ImagePrompt** - 图像生成提示词，包含描述和配置  
✅ **图像URL** - 返回在线访问URL，不是Base64  
✅ **DashScopeImageOptions** - 图像生成配置选项  

#### 9.5 图像生成流程

**工作原理**：
1. 用户输入文本描述（prompt）
2. 创建`ImagePrompt`对象
3. 调用`imageModel.call()`生成图片
4. 返回图片的在线访问URL
5. 浏览器可以通过URL查看图片

**返回格式**：
```json
https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/xxx.png
```
- 直接返回URL字符串
- 可以在浏览器中直接访问
- URL有效期有限，建议及时下载保存

#### 9.6 通义万相模型

**模型版本**：
- **wanx2.1-t2i-turbo** - Turbo版本，生成速度快（推荐）
- **wanx2.1-t2i-plus** - Plus版本，质量更高（速度较慢）

**特点**：
- ✅ 支持中文提示词
- ✅ 支持多种风格（写实、卡通、油画等）
- ✅ 生成速度快（Turbo版本）
- ✅ 图像质量高

**提示词技巧**：
描述越详细，生成的图片越符合预期。可以尝试添加：
-  **场景描述** - 在哪里（草地、海边、城市）
-  **动作描述** - 在做什么（玩耍、奔跑、飞翔）
- 🎨 **风格描述** - 什么风格（写实、卡通、油画、水彩）
- 💡 **光影描述** - 什么光线（日落、月光、霓虹灯）
-  **情感描述** - 什么氛围（温馨、神秘、欢快）

**示例对比**：

| 提示词 | 效果 |
|--------|------|
| "猫" | 一般，缺乏细节 |
| "一只橘猫" | 好一点，有颜色 |
| "一只可爱的橘猫在草地上玩耍" | 好，有场景和动作 |
| "一只可爱的橘猫在阳光下的草地上玩耍，卡通风格" | 更好，有风格 |

#### 9.7 应用场景

**文生图的典型应用**：
- 🎨 **创意设计** - 快速生成设计素材和灵感图
- 📚 **教育配图** - 为教材和课件生成插图
- 📱 **应用开发** - 为APP生成图标和界面素材
-  **游戏开发** - 生成游戏角色和场景概念图
- 📰 **内容创作** - 为文章和社交媒体生成配图
- 🛍️ **电商设计** - 生成产品展示图和广告素材

---

### 模块10：SAA-10Text2voice - 文生音

#### 10.1 模块概述
- **端口**: 8010
- **功能**: 演示文本生成语音功能（TTS - Text To Speech）
- **核心概念**: SpeechSynthesisModel、通义千问语音模型、MP3文件生成、音色设置

#### 10.2 核心代码

**控制器：Text2VoiceController.java**
```java
@RestController
public class Text2VoiceController {
    
    @Resource
    private SpeechSynthesisModel speechSynthesisModel;

    // 使用通义千问CosyVoice-v2模型
    public static final String BAILIAN_VOICE_MODEL = "cosyvoice-v2";
    // 音色：龙应催
    public static final String BAILIAN_VOICE_TIMBER = "longyingcui";

    @GetMapping("/t2v/voice")
    public String voice(@RequestParam(name = "msg", 
            defaultValue = "温馨提醒，支付宝到账100元请注意查收") String msg) {
        
        // 生成唯一文件名
        String filePath = "d:\\" + UUID.randomUUID() + ".mp3";

        // 1. 语音参数设置
        DashScopeSpeechSynthesisOptions options = DashScopeSpeechSynthesisOptions.builder()
                .model(BAILIAN_VOICE_MODEL)
                .voice(BAILIAN_VOICE_TIMBER)  // 设置音色
                .build();

        // 2. 调用大模型语音生成对象
        SpeechSynthesisResponse response = speechSynthesisModel.call(
            new SpeechSynthesisPrompt(msg, options));

        // 3. 字节流语音转换
        ByteBuffer byteBuffer = response.getResult().getOutput().getAudio();

        // 4. 文件生成
        try (FileOutputStream fileOutputStream = new FileOutputStream(filePath)) {
            fileOutputStream.write(byteBuffer.array());
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        
        // 5. 返回生成路径
        return filePath;
    }
}
```

**关键点**：
- **`SpeechSynthesisModel`** - Spring AI提供的语音合成模型接口
- **`SpeechSynthesisPrompt`** - 语音合成提示词，包含文本和配置选项
- **`cosyvoice-v2`** - 通义千问的CosyVoice-v2语音模型
- **`longyingcui`** - 音色名称（龙应催），可以更换其他音色
- **`ByteBuffer`** - 语音数据以字节流形式返回
- **`FileOutputStream`** - 将字节流写入本地MP3文件

#### 10.3 测试接口与返回

**接口1：文本生成语音**
```
http://localhost:8010/t2v/voice?msg=你好，欢迎使用Spring AI Alibaba
```
**返回示例**：
```
d:\123e4567-e89b-12d3-a456-426614174000.mp3
```
**说明**: 返回的是本地MP3文件路径，可以去该路径找到并播放语音文件

**测试场景**：

**场景1：基础测试（默认值）**
```
http://localhost:8010/t2v/voice
```
使用默认的msg="温馨提醒，支付宝到账100元请注意查收"

**场景2：问候语**
```
http://localhost:8010/t2v/voice?msg=你好，欢迎使用Spring AI Alibaba
```

**场景3：新闻播报**
```
http://localhost:8010/t2v/voice?msg=今天是2025年5月29日，星期四，天气晴朗
```

**场景4：故事朗读**
```
http://localhost:8010/t2v/voice?msg=从前有座山，山里有座庙，庙里有个老和尚在讲故事
```

**场景5：商业提示**
```
http://localhost:8010/t2v/voice?msg=尊敬的客户，您的订单已发货，请注意查收
```

#### 10.4 知识点总结

✅ **SpeechSynthesisModel** - Spring AI的语音合成模型接口  
✅ **Text to Voice** - 根据文本生成语音（TTS）  
✅ **通义千问语音模型** - 阿里云的CosyVoice-v2语音模型  
✅ **SpeechSynthesisPrompt** - 语音合成提示词  
✅ **ByteBuffer** - 语音数据以字节流形式返回  
✅ **MP3文件生成** - 将字节流写入本地MP3文件  

#### 10.5 语音生成流程

**工作原理**：
1. 用户输入文本（msg）
2. 创建`SpeechSynthesisPrompt`对象（包含文本和配置）
3. 调用`speechSynthesisModel.call()`生成语音
4. 获取`ByteBuffer`字节流数据
5. 使用`FileOutputStream`写入本地MP3文件
6. 返回文件路径

**返回格式**：
```
d:\123e4567-e89b-12d3-a456-426614174000.mp3
```
- 返回本地文件路径
- 文件名使用UUID确保唯一性
- 文件保存在D盘根目录
- 可以直接用播放器打开MP3文件

#### 10.6 通义千问语音模型

**模型版本**：
- **cosyvoice-v2** - CosyVoice第二代语音模型

**特点**：
- ✅ 支持多种音色（男声、女声、童声等）
- ✅ 支持中文和英文
- ✅ 语音自然流畅
- ✅ 音色逼真

**音色列表**：
- `longyingcui` - 龙应催
- `longxiaochun` - 龙小春
- 更多音色请参考：https://help.aliyun.com/zh/model-studio/cosyvoice-java-sdk

**修改音色方法**：
```java
public static final String BAILIAN_VOICE_TIMBER = "longxiaochun";  // 改为龙小春
```

#### 10.7 注意事项

**文件存储**：
- 文件生成在 `d:\` 盘根目录
- 确保D盘有写入权限
- 文件名使用UUID，确保唯一性
- 建议定期清理生成的MP3文件

**异常处理**：
- 如果D盘不可用，可以修改文件路径
- 可以改为生成到其他目录（如项目根目录）
- 建议添加更完善的异常处理

**修改文件路径示例**：
```java
// 改为生成到项目根目录的audio文件夹
String filePath = "./audio/" + UUID.randomUUID() + ".mp3";
```

#### 10.8 应用场景

**文生音的典型应用**：
-  **语音助手** - 为智能音箱和语音助手生成语音
-  **教育应用** - 为在线课程和教材生成朗读语音
-  **客服系统** - 为自动客服系统生成语音回复
-  **无障碍服务** - 为视障人士提供文字转语音服务
-  **导航系统** - 为GPS导航生成语音提示
-  **有声书** - 将电子书转换为有声书
-  **游戏开发** - 为游戏角色生成对话语音

---

### 模块11：SAA-11Embed2vector - 向量化

#### 11.1 模块概述
- **端口**: 8011
- **功能**: 演示文本向量化和相似度搜索功能
- **核心概念**: EmbeddingModel、VectorStore、文本向量化、相似度搜索、Redis Stack

#### 11.2 核心代码

**控制器：Embed2VectorController.java**
```java
@RestController
@Slf4j
public class Embed2VectorController {
    
    @Resource
    private EmbeddingModel embeddingModel;  // 向量化模型

    @Resource
    private VectorStore vectorStore;  // 向量数据库

    // 接口1：文本向量化
    @GetMapping("/text2embed")
    public EmbeddingResponse text2Embed(String msg) {
        EmbeddingResponse embeddingResponse = embeddingModel.call(
            new EmbeddingRequest(List.of(msg),
                DashScopeEmbeddingOptions.builder()
                    .withModel("text-embedding-v3")
                    .build()));
        
        // 打印向量数组
        System.out.println(Arrays.toString(
            embeddingResponse.getResult().getOutput()));
        
        return embeddingResponse;
    }

    // 接口2：添加文档到向量库
    @GetMapping("/embed2vector/add")
    public void add() {
        List<Document> documents = List.of(
            new Document("i study LLM"),
            new Document("i love java")
        );
        
        vectorStore.add(documents);  // 向量化后存入Redis
    }

    // 接口3：相似度搜索
    @GetMapping("/embed2vector/get")
    public List getAll(@RequestParam String msg) {
        SearchRequest searchRequest = SearchRequest.builder()
                .query(msg)
                .topK(2)  // 返回最相似的2个结果
                .build();
        
        List<Document> list = vectorStore.similaritySearch(searchRequest);
        
        return list;
    }
}
```

**关键点**：
- **`EmbeddingModel`** - Spring AI提供的文本向量化模型接口
- **`VectorStore`** - 向量数据库接口（使用Redis Stack）
- **`text-embedding-v3`** - 通义千问的文本向量化模型
- **`Document`** - 文档对象，包含文本内容
- **`similaritySearch`** - 相似度搜索，返回最相关的文档
- **`topK`** - 控制返回的相似文档数量

**配置文件：application.properties**
```properties
server.port=8011

# 向量化模型配置
spring.ai.dashscope.embedding.options.model=text-embedding-v3

# Redis Stack配置
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.ai.vectorstore.redis.initialize-schema=true
spring.ai.vectorstore.redis.index-name=custom-index
spring.ai.vectorstore.redis.prefix=custom-prefix
```

#### 11.3 测试接口与返回

**接口1：文本向量化**
```
http://localhost:8011/text2embed?msg=射雕英雄传
```
**返回示例**：
```json
{
  "results": [
    {
      "output": [0.123, -0.456, 0.789, ...],  // 高维向量（1024维）
      "metadata": {}
    }
  ]
}
```
**说明**: 文本被转换为高维向量数组，控制台也会打印这个向量

**接口2：添加文档到向量库**
```
http://localhost:8011/embed2vector/add
```
**返回示例**：无返回（void）
**说明**: 将两段文本向量化后存入Redis向量数据库
- 文档1: "i study LLM"
- 文档2: "i love java"

**接口3：相似度搜索**
```
http://localhost:8011/embed2vector/get?msg=LLM
```
**返回示例**：
```json
[
  {
    "id": "e8383c06-a03d-49e1-a2ee-40e60fd9872a",
    "text": "i love java",
    "metadata": {
      "distance": 0.11498177,
      "vector_score": 0.11498177
    },
    "score": 0.8850182294845581
  },
  {
    "id": "f4a0835d-a142-4806-93bc-65acfbfb7448",
    "text": "i love java",
    "metadata": {
      "distance": 0.11498177,
      "vector_score": 0.11498177
    },
    "score": 0.8850182294845581
  }
]
```
**说明**: 
- `distance`: 距离值（越小越相似）
- `score`: 相似度分数（越大越相似，0-1之间）
- 返回按相似度排序的文档列表

**测试结果**：
```
# 查询 "LLM"
[{
  "id": "9f08eac4-2e30-4a70-b59f-27db389a8f56",
  "text": "i study LLM",  // 最相似（包含LLM关键词）
  "score": 0.8372049927711487
}, ...]

# 查询 "java"
[{
  "id": "e8383c06-a03d-49e1-a2ee-40e60fd9872a",
  "text": "i love java",  // 最相似（包含java关键词）
  "score": 0.8850182294845581
}, ...]
```

#### 11.4 知识点总结

✅ **EmbeddingModel** - Spring AI的文本向量化模型接口  
✅ **Text to Vector** - 将文本转换为高维向量表示  
✅ **VectorStore** - 向量数据库（使用Redis Stack）  
✅ **text-embedding-v3** - 通义千问的文本向量化模型  
✅ **Document** - 文档对象，包含文本内容和元数据  
✅ **相似度搜索** - 通过向量相似度查找相关文本  

#### 11.5 向量化工作原理

**什么是向量化**：
- 将文本转换为高维向量（通常是1024维或1536维）
- 语义相似的文本，其向量在空间中的距离也相近
- 例如：“猫”和“狗”的向量距离较近，“猫”和“汽车”的向量距离较远

**向量化流程**：
1. 用户输入文本
2. 创建`EmbeddingRequest`对象
3. 调用`embeddingModel.call()`生成向量
4. 返回`EmbeddingResponse`（包含向量数组）

**相似度搜索流程**：
1. 将查询文本转换为向量
2. 计算查询向量与数据库中所有向量的距离
3. 按距离排序（距离越小越相似）
4. 返回topK个最相似的文档

#### 11.6 VectorStore向量数据库

**Redis Stack**：
- 支持向量存储和检索的Redis版本
- 使用RediSearch模块提供向量搜索功能
- 配置：`spring.ai.vectorstore.redis.initialize-schema=true`

**VectorStore接口**：
- `add(documents)` - 添加文档（自动向量化）
- `similaritySearch(searchRequest)` - 相似度搜索
- `delete(documentIds)` - 删除文档

**SearchRequest配置**：
```java
SearchRequest searchRequest = SearchRequest.builder()
    .query(msg)      // 查询文本
    .topK(2)         // 返回前2个最相似的结果
    .build();
```

#### 11.7 相似度指标

**distance（距离）**：
- 值越小表示越相似
- 通常使用余弦距离或欧氏距离

**score（分数）**：
- 值越大表示越相似（0-1之间）
- score = 1 - distance（归一化）

**示例**：
```
查询 "LLM":
- "i study LLM": score=0.837, distance=0.163 （相似）
- "i love java": score=0.115, distance=0.885 （不相似）
```

#### 11.8 注意事项

**环境要求**：
- ✅ 需要Redis Stack（支持向量搜索的Redis版本）
- ✅ Redis服务需启动在localhost:6379
- ✅ 如果Redis未启动，接口2和接口3会报错

**常见问题**：
- 如果Redis不支持向量搜索，需要安装Redis Stack
- 可以使用Docker快速部署：`docker run -d -p 6379:6379 redis/redis-stack`

#### 11.9 应用场景

**向量化的典型应用**：
-  **语义搜索** - 基于语义相似度搜索，而不是关键词匹配
-  **推荐系统** - 根据用户历史行为推荐相似内容
-  **问答系统** - 查找最相关的问题和答案
-  **RAG系统** - 检索增强生成的基础（下一模块）
-  **文本聚类** - 将相似文本自动分组
-  **异常检测** - 识别与正常模式不同的文本
-  **重复检测** - 识别重复或高度相似的内容

---

### 模块12：SAA-12RAG4AiOps - RAG检索增强生成

#### 12.1 模块概述
- **端口**: 8012
- **功能**: 演示RAG（检索增强生成）架构，基于向量数据库检索文档后生成回答
- **核心概念**: RAG、RetrievalAugmentationAdvisor、VectorStoreDocumentRetriever、智能运维

#### 12.2 核心代码

**控制器：RagController.java**
```java
@RestController
public class RagController {
    
    @Resource(name = "qwenChatClient")
    private ChatClient chatClient;
    
    @Resource
    private VectorStore vectorStore;  // 向量数据库

    @GetMapping("/rag4aiops")
    public Flux<String> rag(String msg) {
        
        // 系统提示词：定义AI角色（运维工程师）
        String systemInfo = """
            你是一个运维工程师,按照给出的编码给出对应故障解释,否则回复找不到信息。
            """;

        // 创建RAG顾问
        RetrievalAugmentationAdvisor advisor = RetrievalAugmentationAdvisor.builder()
                .documentRetriever(VectorStoreDocumentRetriever.builder()
                    .vectorStore(vectorStore)
                    .build())
                .build();

        // 调用AI，添加RAG顾问
        return chatClient
                .prompt()
                .system(systemInfo)  // 系统提示词
                .user(msg)           // 用户输入（故障编码）
                .advisors(advisor)   // 添加RAG顾问
                .stream()            // 流式输出
                .content();
    }
}
```

**关键点**：
- **`RetrievalAugmentationAdvisor`** - RAG顾问，自动从向量库检索相关文档
- **`VectorStoreDocumentRetriever`** - 文档检索器，从向量数据库检索
- **`system()`** - 设置系统提示词，定义AI角色
- **`advisors(advisor)`** - 添加RAG顾问，启用检索增强
- **`stream().content()`** - 流式输出，逐字返回结果
- **`Flux<String>`** - 响应式流式返回类型

**配置文件：application.properties**
```properties
server.port=8012

# 使用DeepSeek R1模型（适合推理任务）
spring.ai.dashscope.chat.options.model=deepseek-r1
spring.ai.dashscope.embedding.options.model=text-embedding-v3

# Redis Stack配置
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.ai.vectorstore.redis.initialize-schema=true
spring.ai.vectorstore.redis.index-name=atguigu-index
spring.ai.vectorstore.redis.prefix=atguigu-prefix
```

#### 12.3 测试接口与返回

**接口1：RAG智能问答**
```
http://localhost:8012/rag4aiops?msg=00000
```

**测试结果**：

**测试1：查询故障编码 00000**
```
http://localhost:8012/rag4aiops?msg=00000
```
**返回**：
```
系统OK正确执行后的返回
```
**说明**: AI从向量库中检索到00000编码对应的故障解释

**测试2：查询故障编码 C2222**
```
http://localhost:8012/rag4aiops?msg=C2222
```
**返回**：
```
Kafka消息解压严重
```
**说明**: AI检索到C2222编码对应的Kafka故障信息

**测试3：查询不存在的编码 99999**
```
http://localhost:8012/rag4aiops?msg=99999
```
**返回**：
```
找不到信息。
```
**说明**: 向量库中没有99999的相关信息，AI按照系统提示词返回"找不到信息"

#### 12.4 知识点总结

✅ **RAG（检索增强生成）** - Retrieval-Augmented Generation架构  
✅ **RetrievalAugmentationAdvisor** - RAG顾问，自动检索相关文档  
✅ **VectorStoreDocumentRetriever** - 从向量数据库检索文档  
✅ **系统提示词** - 定义AI角色和行为边界  
✅ **流式输出** - Flux<String>逐字返回结果  
✅ **DeepSeek R1** - 适合推理和问答任务的模型  

#### 12.5 RAG工作原理

**什么是RAG？**
- RAG = Retrieval（检索） + Augmented（增强） + Generation（生成）
- 通过检索外部知识库来增强AI的回答能力
- 减少AI幻觉（Hallucination），提高答案准确性

**RAG工作流程**：
```
1. 用户问题 → 
2. 向量化 → 
3. 向量数据库检索 → 
4. 相关文档 → 
5. AI生成回答 → 
6. 返回给用户
```

**RAG的优势**：
- ✅ 可以回答知识库中的专业问题
- ✅ 减少AI幻觉（Hallucination）
- ✅ 答案有据可查
- ✅ 可以更新知识库而不需要重新训练模型
- ✅ 适合企业级应用（智能客服、知识库问答等）

#### 12.6 RetrievalAugmentationAdvisor

**作用**：
- 自动从向量数据库检索相关文档
- 将检索结果作为上下文提供给AI
- 无需手动编写检索逻辑

**配置方式**：
```java
RetrievalAugmentationAdvisor advisor = RetrievalAugmentationAdvisor.builder()
    .documentRetriever(VectorStoreDocumentRetriever.builder()
        .vectorStore(vectorStore)
        .build())
    .build();
```

**使用方式**：
```java
return chatClient
    .prompt()
    .system(systemInfo)
    .user(msg)
    .advisors(advisor)  // 添加RAG顾问
    .stream()
    .content();
```

#### 12.7 系统提示词设计

**示例**：
```java
String systemInfo = """
    你是一个运维工程师,按照给出的编码给出对应故障解释,否则回复找不到信息。
    """;
```

**设计要点**：
- 明确AI的角色（运维工程师）
- 定义任务（根据编码给出故障解释）
- 定义边界（找不到信息时回复"找不到信息"）

**效果**：
- AI会严格按照提示词的要求回答
- 对于不存在的编码，不会编造答案
- 提高回答的准确性和可靠性

#### 12.8 应用场景

**RAG的典型应用**：
- 💼 **智能客服** - 基于产品文档回答客户问题
- 📚 **知识库问答** - 基于企业内部文档回答问题
-  **智能运维** - 基于故障手册解答运维问题（本模块）
- 🎓 **教育问答** - 基于教材内容回答学生问题
- ⚖️ **法律咨询** - 基于法律法规提供法律建议
- 🏥 **医疗咨询** - 基于医疗文献提供健康建议
-  **数据分析** - 基于业务数据生成分析报告

---

### 模块13-18 (待学习)

>  更多模块将在后续学习中逐步记录...

---

## 📚 知识总结

### 核心概念

#### ChatModel vs ChatClient

| 特性 | ChatModel | ChatClient |
|------|-----------|------------|
| 调用方式 | 传统方式 | Builder模式 |
| 链式调用 | ❌ | ✅ |
| Advisor支持 | 有限 | 完整 |
| 推荐度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

#### 同步 vs 流式

| 特性 | 同步调用 | 流式调用 |
|------|----------|----------|
| 方法 | call() | stream() |
| 返回类型 | String | Flux<String> |
| 用户体验 | 等待完整响应 | 逐字显示 |
| 适用场景 | 简单问答 | 长文本生成 |

---

## 📎 附录

### A. 环境配置

#### Java环境
- **Java版本**: 21 (LTS)
- **构建工具**: Maven

#### 依赖版本
```xml
<properties>
    <java.version>21</java.version>
    <spring-boot.version>3.5.5</spring-boot.version>
    <spring-ai.version>1.0.0</spring-ai.version>
    <SpringAIAlibaba.version>1.0.0.2</SpringAIAlibaba.version>
</properties>
```

#### 核心依赖
- Spring Boot 3.5.5
- Spring AI 1.0.0
- Spring AI Alibaba 1.0.0.2

### B. API密钥管理

**配置方式对比**

| 方式 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 配置文件直接写入 | 简单直接 | 安全性较低 | ⭐⭐ |
| 环境变量 | 安全性高 | 配置稍复杂 | ⭐⭐⭐ |
| 配置中心 | 集中管理 | 需要额外组件 | ⭐⭐⭐⭐⭐ |

**当前使用方式**：配置文件直接写入
```
spring.ai.dashscope.api-key=sk-b10fab4eef52480e9ebc051687850e50
```

### C. 测试接口汇总

| 模块 | 接口 | 说明 |
|------|------|------|
| SAA-01HelloWorld | http://localhost:8001/hello/dochat | 同步对话 |
| SAA-01HelloWorld | http://localhost:8001/hello/streamchat | 流式对话 |
| SAA-02Ollama | http://localhost:8002/ollama/chat | Ollama对话 |
| SAA-03ChatModelChatClient | http://localhost:8003/chatclient/dochat | ChatClient调用 |
| SAA-03ChatModelChatClient | http://localhost:8003/chatclientv2/dochat | ChatClientV2调用 |
| SAA-03ChatModelChatClient | http://localhost:8003/chatmodel/dochat | ChatModel调用 |
| SAA-04StreamingOutput | http://localhost:8004/stream/chatflux1 | DeepSeek+ChatModel流式 |
| SAA-04StreamingOutput | http://localhost:8004/stream/chatflux2 | Qwen+ChatModel流式 |
| SAA-04StreamingOutput | http://localhost:8004/stream/chatflux3 | DeepSeek+ChatClient流式 |
| SAA-04StreamingOutput | http://localhost:8004/stream/chatflux4 | Qwen+ChatClient流式 |
| SAA-05Prompt | http://localhost:8005/prompt/chat | 角色限定流式 |
| SAA-05Prompt | http://localhost:8005/prompt/chat2 | ChatResponse流式 |
| SAA-05Prompt | http://localhost:8005/prompt/chat3 | HTML格式流式 |
| SAA-05Prompt | http://localhost:8005/prompt/chat4 | 同步调用 |
| SAA-05Prompt | http://localhost:8005/prompt/chat5 | Tool Response |
| SAA-06PromptTemplate | http://localhost:8006/prompttemplate/chat | 基础模板（占位符） |
| SAA-06PromptTemplate | http://localhost:8006/prompttemplate/chat2 | 模板文件读取 |
| SAA-06PromptTemplate | http://localhost:8006/prompttemplate/chat3 | System+User双模板 |
| SAA-06PromptTemplate | http://localhost:8006/prompttemplate/chat4 | ChatModel角色设定 |
| SAA-06PromptTemplate | http://localhost:8006/prompttemplate/chat5 | ChatClient角色设定 |
| SAA-07StructuredOutput | http://localhost:8007/structuredoutput/chat | Consumer方式结构化输出 |
| SAA-07StructuredOutput | http://localhost:8007/structuredoutput/chat2 | Lambda方式结构化输出 |
| SAA-08Persistent | http://localhost:8008/chatmemory/chat | 带记忆的对话 |
| SAA-09Text2image | http://localhost:8009/t2i/image | 文本生成图片 |
| SAA-10Text2voice | http://localhost:8010/t2v/voice | 文本生成语音 |
| SAA-11Embed2vector | http://localhost:8011/text2embed | 文本向量化 |
| SAA-12RAG4AiOps | http://localhost:8012/rag4aiops | RAG智能问答 |
| SAA-13ToolCalling | http://localhost:8013/toolcall/chat | 工具调用（ChatModel） |
| SAA-15LocalMcpClient | http://localhost:8015/mcpclient/chat | MCP 客户端查询天气 |
| SAA-16ClientCallBaiduMcpServer | http://localhost:8016/mcp/chat | 调用百度地图 MCP 服务 |
| SAA-17BailianRAG | http://localhost:8017/bailian/rag/chat | 百炼平台 RAG 问答 |
| SAA-18TodayMenu | http://localhost:8018/eat | AI 厨师助手（综合案例）|

### D. 常见问题

#### 1. API Key为null错误

**错误信息**：
```
Simple api key cannot be null
```

**原因**：使用`System.getenv()`读取环境变量，但IDEA未继承系统环境变量

**解决方案**：改为使用`@Value`从配置文件读取
```java
@Value("${spring.ai.dashscope.api-key}")
private String apiKey;
```

#### 2. 中文乱码问题

**配置**：
```properties
server.servlet.encoding.enabled=true
server.servlet.encoding.force=true
server.servlet.encoding.charset=UTF-8
```

---

### 模块 14：SAA-14LocalMcpServer - 本地 MCP 服务端

#### 14.1 模块概述
- **端口**: 8014
- **功能**: 搭建 MCP（Model Context Protocol）服务端，暴露工具给外部 MCP 客户端调用
- **核心概念**: MCP Server、ToolCallbackProvider、@Tool 注解、天气查询服务

#### 14.2 核心代码

**服务类：WeatherService.java**
```java
@Service
public class WeatherService {
    
    // 标记该方法为 MCP 工具，供客户端调用
    @Tool(description = "根据城市名称获取天气预报")
    public String getWeatherByCity(String city) {
        Map<String, String> map = Map.of(
            "北京", "11111 降雨频繁，其中今天和后天雨势较强，部分地区有暴雨并伴强对流天气，需注意",
            "上海", "22222 多云，15℃~27℃，南风 3 级，当前温度 27℃。",
            "深圳", "333333 多云 40 天，阴 16 天，雨 30 天，晴 3 天"
        );
        return map.getOrDefault(city, "抱歉：未查询到对应城市！");
    }
}
```

**配置类：McpServerConfig.java**
```java
@Configuration
public class McpServerConfig {
    
    // 将 WeatherService 中的@Tool 方法暴露给 MCP 客户端
    @Bean
    public ToolCallbackProvider weatherTools(WeatherService weatherService) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(weatherService)
                .build();
    }
}
```

**配置文件：application.properties**
```properties
server.port=8014

# MCP Server 配置
spring.ai.mcp.server.type=async                     # 异步模式
spring.ai.mcp.server.name=customer-define-mcp-server # 服务名称
spring.ai.mcp.server.version=1.0.0                  # 服务版本
```

#### 14.3 知识点总结

✅ **MCP Server** - 模型上下文协议服务端，负责暴露工具  
✅ **ToolCallbackProvider** - 将 Java 方法注册为 MCP 工具  
✅ **@Tool 注解** - 标记可被调用的方法，description 描述工具功能  
✅ **MethodToolCallbackProvider** - 基于方法的工具提供者实现  

---

### 模块 15：SAA-15LocalMcpClient - 本地 MCP 客户端

#### 15.1 模块概述
- **端口**: 8015
- **功能**: 搭建 MCP 客户端，连接到 SAA-14 服务端并调用其暴露的天气查询工具
- **核心概念**: MCP Client、SSE 连接、工具调用对比（使用 MCP vs 不使用 MCP）

#### 15.2 核心代码

**控制器：McpClientController.java**
```java
@RestController
public class McpClientController {
    
    @Resource
    private ChatClient chatClient; // 已配置 MCP 支持，可调用远程工具
    
    @Resource
    private ChatModel chatModel;   // 普通调用，无 MCP 工具支持

    // 接口 1：使用 MCP 调用工具
    @GetMapping("/mcpclient/chat")
    public Flux<String> chat(@RequestParam(name = "msg", defaultValue = "北京") String msg) {
        System.out.println("使用了 mcp");
        return chatClient.prompt(msg).stream().content();
    }

    // 接口 2：不使用 MCP（对比测试）
    @RequestMapping("/mcpclient/chat2")
    public Flux<String> chat2(@RequestParam(name = "msg", defaultValue = "北京") String msg) {
        System.out.println("未使用 mcp");
        return chatModel.stream(msg);
    }
}
```

**配置文件：application.properties**
```properties
server.port=8015

# MCP Client 配置
spring.ai.mcp.client.type=async                     # 异步模式
spring.ai.mcp.client.request-timeout=60s            # 请求超时
spring.ai.mcp.client.toolcallback.enabled=true      # 启用工具回调
# 连接到 SAA-14 的 MCP 服务端
spring.ai.mcp.client.sse.connections.mcp-server1.url=http://localhost:8014
```

#### 15.3 测试接口与返回

**测试对比：使用 MCP vs 不使用 MCP**

**测试 1：使用 MCP 查询天气**
```
http://localhost:8015/mcpclient/chat?msg=上海
```
**返回**：
```
上海当前天气为多云，气温在 15℃至 27℃之间，风向为南风，风力 3 级，当前温度为 27℃。
```
**说明**: MCP Client 成功连接到 SAA-14 Server，调用了 `getWeatherByCity` 工具，获取到了精准数据。

**测试 2：不使用 MCP 查询天气**
```
http://localhost:8015/mcpclient/chat2?msg=上海
```
**返回**：
```
你好！你提到“上海”，请问你想了解关于上海的哪些方面呢？例如：- 城市概况... - 生活资讯：天气提醒（当前上海多云，22-28℃）...
```
**说明**: 未使用 MCP 工具，AI 只能根据训练数据给出通用回答，无法获取实时定制数据。

#### 15.4 知识点总结

✅ **MCP Client** - 模型上下文协议客户端，负责发现并调用服务端工具  
✅ **SSE 连接** - 使用 Server-Sent Events 与服务端通信  
✅ **toolcallback.enabled** - 开启工具回调，允许 AI 自动调用工具  
✅ **架构解耦** - 工具实现在 Server 端，Client 端只需连接即可使用  

#### 15.5 MCP 架构优势

| 特性 | 传统 Function Calling | MCP 架构 |
|------|----------------------|----------|
| 部署方式 | 工具与 AI 应用同进程 | 工具独立部署为服务 |
| 复用性 | 低，每个应用需单独实现 | 高，多个 AI 应用共享工具 |
| 扩展性 | 差，修改工具需重启应用 | 好，服务端更新即可 |
| 生态 | 厂商绑定 | 开放标准协议 |

---

### 模块 16：SAA-16ClientCallBaiduMcpServer - 调用百度 MCP 服务

#### 16.1 模块概述
- **端口**: 8016
- **功能**: 调用百度地图 MCP 服务，实现天气查询、IP 归属地查询、路线规划等
- **核心概念**: 外部 MCP 服务调用、stdio 协议、mcp-server.json5 配置、npx 命令

#### 16.2 核心代码

**控制器：McpClientCallBaiDuMcpController.java**
```java
@RestController
public class McpClientCallBaiDuMcpController {
    
    @Resource
    private ChatClient chatClient; // 添加了 MCP 调用能力
    
    @Resource
    private ChatModel chatModel;   // 没有添加 MCP 调用能力

    // 接口 1：使用百度 MCP
    @GetMapping("/mcp/chat")
    public Flux<String> chat(String msg) {
        return chatClient.prompt(msg).stream().content();
    }

    // 接口 2：不使用 MCP
    @RequestMapping("/mcp/chat2")
    public Flux<String> chat2(String msg) {
        return chatModel.stream(msg);
    }
}
```

**MCP 配置文件：mcp-server.json5**
```json5
{
  "mcpServers": {
    "baidu-map": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@baidumap/mcp-server-baidu-map"],
      "env": {"BAIDU_MAP_API_KEY": "yHWFqCBXiiwVrk4psrl7IvqE7IsiBgQ6"}
    }
  }
}
```

**配置文件：application.properties**
```properties
server.port=8016

# MCP Client 配置
spring.ai.mcp.client.request-timeout=20s
spring.ai.mcp.client.toolcallback.enabled=true
spring.ai.mcp.client.stdio.servers-configuration=classpath:/mcp-server.json5
```

#### 16.3 测试接口与返回

**测试对比：使用百度 MCP vs 不使用 MCP**

**测试 1：使用百度 MCP 查询天气**
```
http://localhost:8016/mcp/chat?msg=查询北纬 39.9042 东经 116.4074 天气
```
**返回**：
```
根据查询结果，北纬 39.9042、东经 116.4074（北京市西城区）当前天气情况如下：
- **天气状况**: 晴
- **温度**: 25°C
- **体感温度**: 26°C
- **相对湿度**: 71%
- **风向/风力**: 北风，1 级
- **空气质量指数 (AQI)**: 55（良）
- **能见度**: 7400 米

未来几天预报显示，天气将逐渐转为多云，并在 6 月 7 日和 8 日出现雷阵雨和降雨。
气温最高达 36°C（6 月 2 日），最低为 12°C（6 月 7 日）。
```
**说明**: ChatClient 成功通过 stdio 协议调用百度地图 MCP Server，获取到了精准的实时天气数据。

**测试 2：不使用 MCP 查询天气**
```
http://localhost:8016/mcp/chat2?msg=查询北纬 39.9042 东经 116.4074 天气
```
**返回**：
```
您提供的坐标（北纬 39.9042°，东经 116.4074°）位于**中国北京市中心区域**，非常接近天安门广场（约 500 米范围内），属于典型的温带季风气候。

⚠️ 注意：我无法实时访问互联网或气象 API，因此**无法提供当前实时天气数据**（如温度、湿度、降水等）。

但可以为您提供：
✅ **权威获取实时天气的推荐方式**：
1. **中国气象局官网**: [http://www.cma.gov.cn]
2. **中央气象台**: [https://www.nmc.cn]
3. **手机 App**: 中国天气、墨迹天气、彩云天气
4. **微信小程序**: 搜索“中国天气”或“北京气象”
```
**说明**: 未使用 MCP 工具，AI 只能根据训练数据给出通用建议，无法获取实时定制数据。

#### 16.4 知识点总结

✅ **外部 MCP 服务调用** - 连接第三方 MCP Server（百度地图）  
✅ **stdio 协议** - 使用标准输入输出与 MCP Server 通信  
✅ **mcp-server.json5** - MCP 服务器配置文件  
✅ **npx 命令** - 通过 Node.js 的 npx 工具执行 MCP Server  
✅ **环境变量配置** - 通过 env 传入 API Key  
✅ **百度地图工具** - 天气查询、IP 归属地、路线规划等  

#### 16.5 stdio vs SSE 协议对比

| 特性 | stdio 协议（本模块） | SSE 协议（SAA-15） |
|------|---------------------|-------------------|
| **通信方式** | 标准输入输出 | Server-Sent Events |
| **部署方式** | 本地进程 | 网络服务 |
| **配置文件** | mcp-server.json5 | application.properties |
| **适用场景** | 本地工具、npm 包 | 远程服务、独立部署 |
| **示例** | 百度地图 MCP | 本地天气 MCP Server |

#### 16.6 可测试的场景

| 测试场景 | 测试 URL | 说明 |
|---------|---------|------|
| **查询天气** | `http://localhost:8016/mcp/chat?msg=查询北纬 39.9042 东经 116.4074 天气` | 根据经纬度查询天气 |
| **查询 IP 归属地** | `http://localhost:8016/mcp/chat?msg=查询 61.149.121.66 归属地` | 查询 IP 地址的地理位置 |
| **路线规划** | `http://localhost:8016/mcp/chat?msg=查询昌平到天安门路线规划` | 查询两个地点之间的路线 |

---

### 模块 17：SAA-17BailianRAG - 百炼平台 RAG

#### 17.1 模块概述
- **端口**: 8017
- **功能**: 使用阿里云百炼平台的云端知识库进行 RAG（检索增强生成）问答
- **核心概念**: 百炼平台 RAG、DashScopeDocumentRetriever、DocumentRetrievalAdvisor、云端知识库

#### 17.2 核心代码

**配置类：DashScopeConfig.java**
```java
@Configuration
public class DashScopeConfig {
    
    @Value("${spring.ai.dashscope.api-key}")
    private String apiKey;

    @Bean
    public DashScopeApi dashScopeApi() {
        return DashScopeApi.builder()
                .apiKey(apiKey)
                // .workSpaceId("...")  // 如果 API Key 与工作空间不匹配，注释掉此行
                .build();
    }

    @Bean
    public ChatClient chatClient(ChatModel dashscopeChatModel) {
        return ChatClient.builder(dashscopeChatModel).build();
    }
}
```

**控制器：BailianRagController.java**
```java
@RestController
public class BailianRagController {
    
    @Resource
    private ChatClient chatClient;
    
    @Resource
    private DashScopeApi dashScopeApi;

    @GetMapping("/bailian/rag/chat")
    public Flux<String> chat(@RequestParam(name = "msg", 
            defaultValue = "00000 错误信息") String msg) {
        
        // 百炼 RAG 构建器
        DocumentRetriever retriever = new DashScopeDocumentRetriever(
            dashScopeApi,
            DashScopeDocumentRetrieverOptions.builder()
                .withIndexName("ops")  // 知识库名称
                .build()
        );

        return chatClient.prompt()
                .user(msg)
                .advisors(new DocumentRetrievalAdvisor(retriever))
                .stream()
                .content();
    }
}
```

**配置文件：application.properties**
```properties
server.port=8017

# DashScope API Key
spring.ai.dashscope.api-key=sk-b10fab4eef52480e9ebc051687850e50
```

#### 17.3 测试接口与返回

**测试：百炼 RAG 智能问答**
```
http://localhost:8017/bailian/rag/chat?msg=A0001
```
**返回**：
```
A0001 是用户端错误的一级宏观错误码。
```
**说明**: ChatClient 成功通过 DashScopeDocumentRetriever 从百炼平台的 `ops` 知识库检索到相关文档，AI 基于检索结果返回了准确的回答。

#### 17.4 知识点总结

✅ **百炼平台 RAG** - 使用阿里云百炼平台的云端知识库  
✅ **DashScopeDocumentRetriever** - 百炼平台的文档检索器  
✅ **DocumentRetrievalAdvisor** - 文档检索顾问，自动检索并增强回答  
✅ **云端知识库** - 知识库存储在百炼平台，无需本地维护  
✅ **工作空间 ID** - 如果 API Key 与工作空间不匹配，可注释掉 workSpaceId  
✅ **流式输出** - 逐字返回结果  

#### 17.5 百炼平台准备工作

在使用这个模块之前，需要在百炼平台上完成以下准备工作：

1. **登录百炼平台** - https://bailian.console.aliyun.com/
2. **创建知识库** - 创建名为 `ops` 的知识库
3. **上传文档** - 上传包含错误码信息的文档
4. **等待索引完成** - 文档状态变为"解析完成"
5. **配置 API Key** - 在 application.properties 中配置 API Key

**注意事项**：
- 如果报错 `Workspace.AccessDenied`，注释掉 `workSpaceId` 配置
- 如果报错 `Index:ops NotExist`，需要在百炼平台创建名为 `ops` 的知识库

#### 17.6 百炼 RAG vs 本地 RAG 对比

| 特性 | 百炼 RAG（本模块） | 本地 RAG（SAA-12） |
|------|-------------------|-------------------|
| **知识库位置** | 阿里云百炼平台（云端） | 本地 Redis Stack |
| **维护成本** | 低（平台管理） | 高（自行维护） |
| **扩展性** | 好（平台支持） | 一般（受本地资源限制） |
| **适用场景** | 企业级应用、生产环境 | 学习、测试、小规模应用 |
| **检索器** | DashScopeDocumentRetriever | VectorStoreDocumentRetriever |
| **配置复杂度** | 简单（只需 API Key） | 复杂（需配置 Redis、向量索引等） |

---

### 模块 18：SAA-18TodayMenu - 今日菜单（综合案例）

#### 18.1 模块概述
- **端口**: 8018
- **功能**: 综合性实战案例，演示 AI 厨师助手应用
- **核心概念**: Prompt 系统提示词、角色定义、流式输出、百炼平台 Agent 调用

#### 18.2 核心代码

**控制器 1：MenuController.java（本地 Prompt 方式）**
```java
@RestController
public class MenuController {
    
    @Resource
    private ChatModel chatModel;

    @GetMapping(value = "/eat")
    public Flux<String> eat(@RequestParam(name = "msg", 
            defaultValue = "今天吃什么") String question) {
        
        String info = """
            你是一个 AI 厨师助手，每次随机生成三个家常菜，
            并且提供这些家常菜的详细做法步骤，以 HTML 格式返回
            字数控制在 1500 字以内。
            """;
        
        // 系统消息
        SystemMessage systemMessage = new SystemMessage(info);
        // 用户消息
        UserMessage userMessage = new UserMessage(question);

        Prompt prompt = new Prompt(userMessage, systemMessage);

        return chatModel.stream(prompt)
            .map(response -> response.getResults().get(0).getOutput().getText());
    }
}
```

**控制器 2：MenuCallAgentController.java（调用百炼 Agent）**
```java
@RestController
public class MenuCallAgentController {
    
    @Value("${spring.ai.dashscope.agent.options.app-id}")
    private String appId;

    private DashScopeAgent dashScopeAgent;

    public MenuCallAgentController(DashScopeAgentApi dashScopeAgentApi) {
        this.dashScopeAgent = new DashScopeAgent(dashScopeAgentApi);
    }

    @GetMapping(value = "/eatAgent")
    public String eatAgent(@RequestParam(name = "msg", 
            defaultValue = "今天吃什么") String msg) {
        
        DashScopeAgentOptions options = DashScopeAgentOptions.builder()
            .withAppId(appId)
            .build();

        Prompt prompt = new Prompt(msg, options);

        return dashScopeAgent.call(prompt).getResult().getOutput().getText();
    }
}
```

**配置文件：application.properties**
```properties
server.port=8018

# DashScope API Key
spring.ai.dashscope.api-key=sk-b10fab4eef52480e9ebc051687850e50

# 百炼平台 Agent app-id
spring.ai.dashscope.agent.options.app-id=5b642a2c4abb45e3bd83d14eeb5fc5d2
```

#### 18.3 测试接口与返回

**测试 1：AI 厨师助手（本地 Prompt）**
```
http://localhost:8018/eat?msg=今天吃什么
```
**返回**（HTML 格式，流式输出）：
```html
🌿 今日家常三味 · 温暖上桌

🍅 番茄炒蛋（经典下饭菜）

食材：
- 熟透番茄 2 个（约 300g），切滚刀块
- 鸡蛋 4 个，加 1 小勺盐和半勺料酒搅匀
- 小葱 2 根，切葱花；蒜末 1 瓣
- 盐、糖各 1/2 小勺，生抽 1 小勺，香油几滴

做法：
1. 热锅凉油（比平时多 1/3），油温六成热倒入蛋液，待边缘凝固时用锅铲快速划散，盛出备用。
2. 留底油爆香蒜末，下番茄块翻炒出汁...
...
```
**说明**: AI 完美理解了系统提示词，扮演了"AI 厨师助手"的角色，生成了符合要求的 HTML 格式菜谱，包含详细的食材和做法步骤。

**测试 2：调用百炼平台 Agent**
```
http://localhost:8018/eatAgent?msg=今天吃什么
```
**返回**：
```
报错：App.AccessDenied - App access denied.
```
**说明**: 配置的 AppId 无效或无权限访问。需要登录百炼平台创建智能体应用，获取正确的 AppId 后才能使用。

#### 18.4 知识点总结

✅ **Prompt 系统提示词** - 定义 AI 角色（AI 厨师助手）和行为  
✅ **SystemMessage** - 系统消息，设置 AI 角色和约束  
✅ **UserMessage** - 用户消息，传递用户问题  
✅ **流式输出** - 逐字返回 HTML 格式的菜谱  
✅ **百炼平台 Agent** - 调用云端智能体应用（需要正确配置 AppId）  
✅ **DashScopeAgent** - 百炼平台智能体客户端  
✅ **综合应用** - 整合了 Prompt、流式输出、Agent 调用等知识点  

#### 18.5 本地 Prompt vs 百炼 Agent 对比

| 特性 | 本地 Prompt（/eat） | 百炼 Agent（/eatAgent） |
|------|---------------------|-------------------------|
| **实现方式** | 本地代码定义提示词 | 调用百炼平台智能体 |
| **灵活性** | 需要修改代码 | 在百炼平台配置即可 |
| **维护成本** | 高（代码维护） | 低（平台维护） |
| **输出方式** | 流式输出 | 一次性返回 |
| **适用场景** | 简单场景、快速原型 | 复杂场景、生产环境 |
| **定制能力** | 有限 | 强（可配置工作流、知识库等） |

#### 18.6 常见问题

**问题 1：接口 2 报错 `App.AccessDenied`**
- **原因**: 配置的 AppId 无效或无权限
- **解决**: 登录百炼平台创建智能体应用，获取正确的 AppId 并替换配置文件中的 AppId

**问题 2：HTML 格式显示不正常**
- **原因**: 浏览器直接显示 HTML 源码
- **解决**: 使用浏览器查看渲染后的效果，或者在代码中添加 Content-Type 头

---

## 🎉 学习总结

恭喜！你已经完成了 **Spring AI Alibaba 基础入门阶段** 的所有 18 个模块学习！

### **已掌握的知识点**

1.  **基础概念** - Hello World、Ollama 本地模型、ChatModel & ChatClient
2.  **核心功能** - 流式输出、多模型共存、Prompt 提示词、PromptTemplate 模板
3.  **高级特性** - 结构化输出、对话记忆功能、文生图、文生音
4.  **向量化与 RAG** - 文本向量化、本地 RAG（Redis）、百炼平台 RAG
5.  **工具调用** - Function Calling、MCP 服务端、MCP 客户端、外部 MCP 服务调用
6.  **综合应用** - AI 厨师助手（Prompt + 流式输出 + HTML 生成）

### **技术栈掌握**

- ✅ Spring AI Alibaba 框架
- ✅ 阿里云 DashScope API（文本、图像、音频、向量、RAG）
- ✅ OpenAI 兼容接口
- ✅ Ollama 本地大模型
- ✅ Redis Stack（向量存储、对话记忆）
- ✅ MCP 协议（Model Context Protocol）
- ✅ 百炼平台（知识库、Agent 智能体）

### **下一步学习建议**

1.  **深入实战** - 尝试将所学知识应用到实际项目中
2.  **扩展学习** - 学习 Spring AI 的其他功能（如 Function Calling 的高级用法）
3.  **生产部署** - 学习如何将 AI 应用部署到生产环境
4.  **性能优化** - 学习如何优化 AI 应用的性能和成本

**祝你学习愉快，在 AI 开发的道路上越走越远！** 🚀🚀

---

### 💡 核心疑问解答：为什么 ChatClient 能调用 MCP 而 ChatModel 不能？

在 SAA-15LocalMcpClient 模块中，我们看到了两个极其相似的接口，但结果截然不同。这是 Spring AI 框架设计的核心差异：

#### **1. 为什么 chat (上面的方法) 能调用 MCP？**

**使用的对象**：`ChatClient`

**原因**：在 Spring AI 的配置中，这个 `chatClient` 已经被**注入了 MCP 的能力**。

**详细机制**：
1. Spring AI 会**自动扫描**配置文件中定义的 MCP 连接（`spring.ai.mcp.client.sse.connections...`）
2. 当 `chatClient` 被创建时，框架会**自动把 MCP 服务端暴露的工具**（比如"查询天气"）**注册到这个 chatClient 的"工具箱"里**
3. 这个注册过程是**自动完成的**，开发者无需手动编写代码

**结论**：
当你用 `chatClient` 提问时，它**自带了工具包**。AI 发现需要查天气，就会**自动去工具包里找**，发现正好有 MCP 提供的工具，于是**调用它**。

---

#### **2. 为什么 chat2 (下面的方法) 没有调用？**

**使用的对象**：`ChatModel`

**原因**：这个 `chatModel` 是一个**纯粹的、原始的大语言模型调用接口**。

**详细机制**：
1. 它**只负责把文字发给 AI**，然后接收 AI 返回的文字
2. 它**没有被注入任何工具**（Tool），也**没有连接 MCP**
3. 它就是一个纯粹的文本输入输出通道

**结论**：
当你用 `chatModel` 提问时，AI 就像一个**被断网的普通人**。它不知道你问的是实时的天气，它只能根据它以前学过的知识（训练数据）来回答你，或者告诉你它不知道。

---

#### **3. 形象的类比**

**ChatClient (上面的方法) 就像是一个配备了智能助手的经理**：
```
你问他："上海天气怎么样？"
他心想："我不知道，但我有个助手（MCP）专门管天气。"
他转头问助手，拿到数据后回复你。
```

**ChatModel (下面的方法) 就像是一个被关在小黑屋里的学者**：
```
你问他："上海天气怎么样？"
他只能靠记忆回答："一般来说上海是亚热带季风气候……"
或者："我没法查看实时天气。"
```

---

#### **4. 代码层面的区别**

| 特性 | chat (使用 ChatClient) | chat2 (使用 ChatModel) |
|------|----------------------|------------------------|
| **对象类型** | `ChatClient` | `ChatModel` |
| **工具支持** | ✅ **自动支持** (Auto-registered) | ❌ **不支持** (Plain) |
| **MCP 连接** | ✅ **已连接** | ❌ **未连接** |
| **能力** | 聊天 + 调用外部工具 (MCP) | 仅聊天 |
| **适用场景** | 99% 的日常开发 | 底层定制、完全控制 |

---

#### **5. 原理对比**

| 特性 | `chat` (使用 ChatClient) | `chat2` (使用 ChatModel) |
| :--- | :--- | :--- |
| **底层对象** | `ChatClient` (高级封装) | `ChatModel` (底层接口) |
| **MCP 感知** | ✅ **自动感知** (Auto-discovery) | ❌ **无感知** (Plain) |
| **工具箱** | ✅ **内置工具箱** (已注入工具) | ❌ **空工具箱** (仅文本) |
| **工作方式** | 智能调度：发现需求 -> 匹配工具 -> 调用 -> 整合结果 | 纯文本处理：接收输入 -> 生成输出 |

---

#### **6. 详细工作机制对比**

**ChatClient 的工作流程（智能助手模式）：**
```
1. 启动时：框架扫描配置文件中的 MCP 连接 (spring.ai.mcp.client.sse...)
2. 连接 MCP Server：发现并注册所有可用的工具 (如 getWeatherByCity)
3. 用户提问："上海天气怎么样？"
4. ChatClient 分析：AI 识别到需要"天气数据"
5. 自动调用：从工具箱中找到对应的 MCP 工具并调用
6. 整合返回：将工具返回的数据整合成自然语言回复用户
```

**ChatModel 的工作流程（纯文本模式）：**
```
1. 启动时：无任何外部连接或工具注册
2. 用户提问："上海天气怎么样？"
3. ChatModel 处理：直接发送给大模型
4. 大模型回复：由于没有外部数据源，只能根据训练数据回答
5. 结果：通用性回答或"我不知道"
```

---

#### **7. 为什么这样设计？**

**设计哲学**：
- **ChatModel** = 发动机（提供核心动力/计算能力）
- **ChatClient** = 整车（包含发动机 + 方向盘 + 导航 + 各种传感器）

**使用建议**：
- ✅ **日常开发**：99% 的场景使用 `ChatClient`（功能全、自动化工具调用、流式支持好）
- ⚙️ **底层定制**：只有在需要完全控制底层调用逻辑时才使用 `ChatModel`

---

#### **8. 代码体现**

```java
// ❌ 不使用 MCP（纯文本）
return chatModel.stream(msg);  // 只有文本进，文本出

// ✅ 使用 MCP（智能工具调用）
return chatClient.prompt(msg).stream().content();  // 自带工具包，自动调用
```

**总结**：
`ChatClient` 是 Spring AI 推荐的**高级 API**，它封装了 MCP 连接、工具发现、自动调用等复杂逻辑，让开发者只需关注业务逻辑即可。

**这就是为什么你只需要调用 `chatClient.prompt(msg)`，不需要写任何额外的代码，它就能神奇地调用到 MCP 服务端的工具！这就是 ChatClient 这个高级组件的强大之处。**

---

**最后更新**: 2025 年 5 月 29 日  
**文档版本**: v2.8  
**学习状态**: 基础入门阶段 (18/18 模块完成) ✅ 🎉
