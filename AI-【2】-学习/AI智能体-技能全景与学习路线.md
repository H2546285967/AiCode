# AI智能体开发者 — 技能全景图与学习路线

# 图1、你现在在哪里

## Java底座 ⭐⭐⭐⭐⭐
- Spring Boot/Cloud
- 微服务架构
- MySQL/Redis/MQ/ES
- Docker/K8s

## AI应用框架 ⭐⭐（教学级demo）
### Spring AI Alibaba
- ChatModel/ChatClient ✅
- Prompt/PromptTemplate ✅
- 结构化输出 ✅
- 对话记忆 ✅
- RAG基础 ✅
- MCP协议 ✅
- 多模态 ✅

### LangChain4j
- 基础链路 ✅
- RAG基础 ✅
- Tool Calling ✅
- 知识图谱 ❌
- 多Agent ❌

## RAG体系 ⭐（调用方，非优化方）
### 了解链路但不深入
- 文档加载/分块 ⚪ 了解
- Embedding向量化 ⚪ 了解
- 向量检索 ⚪ 了解
- Prompt增强 ⚪ 了解

### 高级RAG ❌
- 多路召回
- Rerank重排序
- 知识图谱融合
- 推理增强RAG
- 评估体系

## 向量数据库 ⭐（云API调用）
- Redis Stack ✅ 接触过
- Milvus ❌ 未直接操作
- Qdrant ❌ 未直接操作
- 分块策略 ❌
- 索引优化 ❌

## 模型层 ⭐（对接接口，非设计者）
- API对接 ✅ 按文档调用
- 多模型路由 ⚪ 了解架构，不是设计者
- 模型选型 ❌
- 微调 ❌
- 评估 ❌

## SSE流式输出 ⭐⭐⭐⭐（生产级）
- SSE流式推送 ✅
- chunk逐块解析 ✅
- 流式与下游节点冲突处理 ✅

## Camunda工作流 ⭐⭐⭐⭐（生产级）
- 自定义节点开发 ✅
- 流程变量赋值 ✅
- 节点间数据流转 ✅
- 异常和超时处理 ✅

## 算法接口对接 ⭐⭐⭐⭐（生产级）
- 按文档调用NL2SQL接口 ✅
- CURL+Postman问题定位 ✅
- 跨团队协作Debug ✅

## Agent架构 ⭐⭐（Camunda BPMN经验）
- 单Agent ❌ 不懂ReAct
- 多Agent协作 ❌
- 工作流引擎 ✅ Camunda BPMN
- 任务分解 ❌

## 工程化 ⭐⭐
- Agent评估 ❌
- 安全合规 ⚪ 了解（JWT/限流/脱敏）
- 成本控制 ❌
- 可观测性 ❌



---

# 图2：学习路线图（未来6个月）

```mermaid
gantt
    title AI智能体开发者 6个月学习路线
    dateFormat  YYYY-MM-DD
    axisFormat  %m月

    section Phase 1 - 框架深度实战
    Spring AI 生产级深入           :a1, 2026-06-09, 30d
    重构工作项目(智能体)           :a2, after a1, 30d

    section Phase 2 - RAG+向量深度
    高级RAG(多路召回/Rerank)       :b1, after a2, 25d
    Milvus生产实战                 :b2, after b1, 20d
    RAG评估体系                    :b3, after b2, 15d

    section Phase 3 - Agent系统设计
    单Agent架构模式                :c1, after b3, 20d
    多Agent协作框架                :c2, after c1, 25d
    工作流引擎设计                 :c3, after c2, 20d

    section Phase 4 - 工程化+面试
    Agent评估与安全                :d1, after c3, 15d
    面试项目包装+模拟              :d2, after d1, 15d
```

---

# 图3：技术栈选型决策树

```mermaid
flowchart TD
    A[AI应用开发需求] --> B{需要什么能力?}

    B -->|对话/问答| C[ChatModel + Prompt工程]
    B -->|知识检索| D[RAG Pipeline]
    B -->|外部工具调用| E[Tool Calling / MCP]
    B -->|复杂任务编排| F[Agent / 工作流]

    C --> C1[Spring AI ChatClient]
    C --> C2[LangChain4j]

    D --> D1{数据规模?}
    D1 -->|小规模/学习| D2[Redis Stack]
    D1 -->|生产级| D3[Milvus / Elasticsearch]

    D --> D4{检索策略?}
    D4 -->|简单| D5[向量相似度]
    D4 -->|需要精度| D6[向量+关键词混合检索]
    D4 -->|高精度| D7[多路召回 + Rerank]

    E --> E1[Spring AI MCP]
    E --> E2[LangChain4j Tools]

    F --> F1{复杂度?}
    F1 -->|单任务| F2[ReAct Agent]
    F1 -->|多步骤| F3[工作流引擎]
    F1 -->|多角色协作| F4[Multi-Agent]

    style A fill:#e1f5fe
    style D3 fill:#c8e6c9
    style D7 fill:#c8e6c9
    style F4 fill:#fff9c4
```

---

# 图4：RAG 知识体系全景（面试核心）

```mermaid
flowchart LR
    subgraph 数据准备
        A1[文档加载] --> A2[文本分块]
        A2 --> A3[清洗去重]
        A3 --> A4[Embedding向量化]
        A4 --> A5[存入向量数据库]
    end

    subgraph 检索阶段
        B1[用户问题] --> B2[Query改写/扩展]
        B2 --> B3{检索策略}
        B3 --> B4[向量检索]
        B3 --> B5[关键词检索]
        B3 --> B6[知识图谱检索]
        B4 --> B7[混合排序/融合]
        B5 --> B7
        B6 --> B7
        B7 --> B8[Rerank重排序]
        B8 --> B9[Top-K文档]
    end

    subgraph 生成阶段
        B9 --> C1[Prompt增强]
        C1 --> C2[LLM生成回答]
        C2 --> C3[后处理/引用标注]
    end

    A5 -.->|向量检索| B4

    style A2 fill:#ffecb3
    style B2 fill:#ffecb3
    style B8 fill:#ffecb3
    style C1 fill:#c8e6c9
```

---

# 图5：Agent 架构模式（面试高频）

```mermaid
flowchart TD
    subgraph 单Agent模式
        U1[用户输入] --> AG1[Agent]
        AG1 --> T1[Tool A]
        AG1 --> T2[Tool B]
        AG1 --> T3[Tool C]
        AG1 --> R1[输出]
    end

    subgraph Multi-Agent模式
        U2[用户输入] --> OR[编排Agent/路由]
        OR --> A1[研究Agent]
        OR --> A2[写作Agent]
        OR --> A3[审核Agent]
        A1 -->|结果| A2
        A2 -->|草稿| A3
        A3 -->|通过| R2[输出]
        A3 -->|驳回| A2
    end

    subgraph 工作流模式
        U3[用户输入] --> S1[Step1:意图识别]
        S1 --> S2{路由}
        S2 -->|问答| S3[RAG检索]
        S2 -->|问数| S4[Text2SQL]
        S2 -->|闲聊| S5[直接对话]
        S3 --> S6[Step:回答生成]
        S4 --> S6
        S5 --> S6
        S6 --> R3[输出]
    end

    style OR fill:#e1f5fe
    style S2 fill:#fff9c4
```

---

# 图6：仓颉项目 vs 学习demo — 深度对比（2026-06-06新增）

```mermaid
graph LR
    subgraph demo
        demo_title["学习Demo（横向知识面）"]
        D1["Spring AI Alibaba 18模块\n- 教学级覆盖"]
        D2["LangChain4j 12模块\n- 教学级覆盖"]
        D3["MCP协议\n- 基础理解"]
        D4["多模态（图/音）\n- 基础了解"]
    end

    subgraph work
        work_title["仓颉项目（纵向生产深度）"]
        W1["多模型策略路由\n- 生产级"]
        W2["RAG适配器+多后端\n- 生产级"]
        W3["工作流BPMN引擎\n- 生产级"]
        W4["NL2SQL智能问数\n- 生产级"]
        W5["插件化工具体系\n- 生产级"]
        W6["流式输出WebFlux\n- 生产级"]
        W7["权限/多租户/APIKey\n- 生产级"]
    end

    subgraph gap
        gap_title["两者都没覆盖（核心短板）"]
        G1["RAG高级优化\n多路召回/Rerank/评估"]
        G2["向量数据库\nMilvus/Qdrant实操"]
        G3["Agent编排\nReAct/Multi-Agent"]
        G4["模型微调\nLORA/QLoRA"]
        G5["评估监控\nRAG评估/Agent评估"]
    end

    demo -.-> gap
    work -.-> gap
```

---

# 图7：串联路径 — 从3个分散状态到1个完整能力体系

```mermaid
flowchart TD
    subgraph 现在["📍 你现在：3个分散的能力碎片"]
        S1["Java微服务底座<br/>⭐⭐⭐⭐⭐ 10年经验"]
        S2["仓颉项目经验<br/>⭐⭐⭐ 生产级但自研框架"]
        S3["框架学习<br/>⭐⭐ 教学级知识面"]
    end

    subgraph 串联["🔗 怎么串起来"]
        direction TB
        L1["第一步：翻译<br/>把仓颉经验翻译成<br/>通用AI术语"]
        L2["第二步：桥接<br/>用Spring AI/LangChain4j<br/>重构一个仓颉模块"]
        L3["第三步：深化<br/>补齐RAG优化+Agent编排<br/>的理论深度"]
        L4["第四步：输出<br/>形成面试叙事<br/>1个完整能力故事"]
    end

    subgraph 目标["🎯 目标：完整能力体系"]
        T1["Java AI智能体全栈工程师<br/>工程能力 + AI应用 + 理论深度"]
    end

    S1 --> L1
    S2 --> L1
    S3 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> T1

    style 现在 fill:#fff3e0
    style 串联 fill:#e8eaf6
    style 目标 fill:#e8f5e9
```

---

# 图8：串联后的完整技术栈（目标架构）

```mermaid
flowchart TB
    subgraph 完整能力["🎯 串联后的完整能力体系"]
        direction TB

        subgraph L1["第一层：Java工程底座（最强）"]
            J1["Spring Boot微服务"]
            J2["Docker/K8s部署"]
            J3["MySQL/Redis/MQ/ES"]
            J4["系统架构设计"]
        end

        subgraph L2["第二层：AI框架能力（正在桥接）"]
            F1["Spring AI Alibaba<br/>生产级应用"]
            F2["LangChain4j<br/>生产级应用"]
            F3["MCP协议<br/>工具标准化"]
        end

        subgraph L3["第三层：核心AI能力（正在深化）"]
            R1["RAG系统<br/>多路召回+Rerank+评估"]
            R2["Agent编排<br/>ReAct+Multi-Agent"]
            R3["向量数据库<br/>Milvus生产级"]
            R4["Prompt工程<br/>系统化方法论"]
        end

        subgraph L4["第四层：模型能力（了解为主）"]
            M1["模型选型与评估"]
            M2["模型微调LoRA"]
            M3["Embedding/Rerank模型"]
        end

        subgraph L5["第五层：工程化（补齐）"]
            E1["Agent评估体系"]
            E2["可观测性"]
            E3["安全合规"]
            E4["成本优化"]
        end
    end

    L1 --> L2 --> L3 --> L4 --> L5

    style L1 fill:#c8e6c9,stroke:#2e7d32
    style L2 fill:#e1f5fe,stroke:#0277bd
    style L3 fill:#fff9c4,stroke:#f57f17
    style L4 fill:#f3e5f5,stroke:#7b1fa2
    style L5 fill:#ffebee,stroke:#c62828
```

---

# 图9：面试叙事地图 — 怎么讲你的故事

```mermaid
flowchart LR
    subgraph 故事线["🎬 面试叙事线"]
        START["开场：定位"] --> P1["第一幕：架构"]
        P1 --> P2["第二幕：深入"]
        P2 --> P3["第三幕：优化"]
        P3 --> END["收尾：视野"]
    end

    START -->|"我是10年Java微服务<br/>+半年AI智能体开发"| S1["建立信任"]
    P1 -->|"仓颉项目4大模块<br/>+整体架构设计"| S2["展示能力"]
    P2 -->|"RAG优化/模型路由<br/>/工作流引擎"| S3["证明深度"]
    P3 -->|"框架学习+前沿探索<br/>+持续进化"| S4["展示潜力"]

    style START fill:#e8f5e9
    style P1 fill:#e3f2fd
    style P2 fill:#fff3e0
    style P3 fill:#f3e5f5
    style END fill:#e8f5e9
```

---

# 图10：学习优先级矩阵（投入 vs 回报）

```mermaid
quadrantChart
    title "学习投入 vs 面试回报"
    x-axis "学习成本低" --> "学习成本高"
    y-axis "面试回报低" --> "面试回报高"
    quadrant-1 "必学（高回报+可接受成本）"
    quadrant-2 "优先学（高回报+低成本）"
    quadrant-3 "看情况（低回报+高成本）"
    quadrant-4 "有空再学（低回报+低成本）"
    "翻译仓颉经验": [0.20, 0.85]
    "RAG高级优化": [0.45, 0.90]
    "Agent编排模式": [0.55, 0.80]
    "框架重构项目": [0.50, 0.75]
    "向量数据库深入": [0.40, 0.60]
    "模型微调": [0.80, 0.50]
    "评估监控体系": [0.60, 0.55]
```
