# AI智能体岗位 — 面试高频问题与仓颉项目对照

> **核心思路**：每个面试题先看仓颉项目里有没有 → 有的串起来讲 → 没有的补理论  
> **最后更新**：2026-06-17（深化 Q3 RAG 优化 + Q12 ReAct + Q4 RAG 评估 + Q8 向量相似度 + Q13 多 Agent：补全 5 道🔴题的项目关联话术、代码示例、演进路径与回答模板）

---

## 标记说明

| 标记 | 含义                                                         |
| :--- | :----------------------------------------------------------- |
| 🟢    | **项目中有涉及** — 仓颉项目中有对应代码/你接触过，可以讲“我们项目中用到了……” |
| 🔴    | **需要补理论** — 项目中没有或你完全不了解，需要学理论知识    |

---

## 一、RAG 相关（几乎必问）

### Q1：介绍一下你做过的 RAG 项目？

**🟢 你有经验**

**你的回答**：
> 我们公司有一套知识库系统，底层用 LakeSearch 做检索。我在应用层负责：
> 1. **知识库的数据权限管理**：不同角色看到不同知识库，基于工作空间（Workspace）和成员权限体系实现
> 2. **知识库 CRUD**：创建知识库、上传文档、管理文档、配置分块策略
> 3. **完整的 RAG 链路理解和维护**：
>    - 文档上传 → 文件解析（PDF/Word/Excel）→ 分块（ChineseRecursive算法）→ 向量化（Embedding）
>    - → LakeSearch 索引存储 → 用户查询 → 向量检索（topK=10, scoreThreshold=0.5）
>    - → Prompt 增强（注入检索到的文档片段）→ LLM 生成回答（temperature=0.1）
> 4. **问题定位能力**：出问题时用 CURL + Postman 逐层排查，快速定位是应用侧参数问题还是检索侧算法问题
>
> **技术细节**：
> - 通过 `RagProviderAdapterImpl` 适配器模式支持多后端切换（云知/LakeSearch）
> - 每个知识库可独立配置检索参数（topK、scoreThreshold、是否启用Rerank）
> - 支持 FAQ 知识库和文档知识库两种类型
>
> LakeSearch 底层原理我没有深入，但整个 RAG 应用层的调用链路和参数调优我是清楚的。

**项目中的相关代码**：
- `LakeSearchRagProvider.java` — LakeSearch 检索调用
- `RagProviderAdapterImpl.java` — RAG 适配器（多后端切换：云知/LakeSearch）
- `CallRagApiImpl.java` — RAG API 调用
- `FileChunkVO.java` — 文件分块配置
- `KnowledgeFaqService` — FAQ 知识库管理

---

### Q2：RAG 的分块策略怎么做的？

**🟢 项目中有涉及 — 系统中有分块配置模块，你维护过**

**你的回答**：
> 我们系统默认使用 **ChineseRecursive（中文递归字符分割）算法**，支持多级分隔符优先级和灵活配置：
>
> **分隔符优先级**（从高到低）：
> - 第一级：段落分隔（`\n\n`）
> - 第二级：换行符（`\n`）
> - 第三级：中文句号/感叹号/问号（`。|！|？`）
> - 第四级：英文句末（`.\s|!\s|?\s`）
> - 第五级：分号（`；|;\s`）
> - 第六级：逗号（`，|,\s`）
>
> **分割逻辑**：
> - 先按第一级分隔符切分，如果某个块超过 `chunkSize`，就递归用下一级分隔符继续切分
> - 支持 `overlap`（重叠区域），防止在分块边界切断语义（如 `chunk_size=500`，`overlap=50`，相邻两个块之间会有 50 个字符的重叠）
> - 支持 `keepSeparator` 配置，可选择是否保留分隔符
>
> **分块配置管理**（来自项目代码 `FileFO.java`）：
> ```java
> private Integer chunkSize;              // 分块长度（推荐500）
> private Integer chunkOverlap = 10;      // 分块重叠长度
> private String splitMethod = "ChineseRecursive";  // 分段方式
> private String chunkSplitter;           // 自定义分隔符
> private Boolean keepSeparator = false;  // 是否保留分隔符
> private Boolean isSeparatorRegex = false; // 是否是正则表达式
> private Integer headersToSplitOn = 3;   // Markdown分割字段层级
> ```
>
> **3种分块模式**：
> - **auto（自动）**：系统根据文档类型自动选择分块策略
> - **enhance（增强）**：启用关键词提取和元数据增强
> - **custom（自定义）**：用户手动配置所有参数
>
> 在我们系统中，分块配置是可管理的：
> - 知识库创建时可以配置 `chunk_size` 和 `overlap`
> - 不同知识库可以用不同的分块策略
> - 我在应用层负责分块配置的管理和传递（`FileInfoServiceImpl.getAlgorithmChunkConfig`），具体的分块算法是算法团队实现的
>
> **RAG 检索配置**（来自项目代码 `ExternalRetrievalModel`）：
> - `topK = 10`：检索前 10 条结果
> - `scoreThreshold = 0.5`：相似度低于 0.5 的不要
> - `rerankModelEnabled`：支持 Rerank 重排序
> - `rewriteEnabled`：支持 Query 改写（目前关闭）
> - 每个知识库可以单独配置 `topK` 和 `scoreThreshold`

**项目中的相关代码**：
- `FileFO.java` — 文件分块配置 FO（chunkSize、splitMethod、headersToSplitOn等完整参数）
- `BuildFileChunkConfigModel.java` — 分块配置模型
- `EditFileChunkConfigFO.java` — 编辑分块配置
- `FileInfoServiceImpl.java` — `getAlgorithmChunkConfig()` 方法构建分块配置JSON
- `LargeParserHandler.java` — 大文件解析和分块上传处理
- `ChunksBaseRepoFO.java` — 分块基础参数

**需要补的理论**（面试被追问时用）：

| 分块方法         | 说明                        | 优缺点             |
| :--------------- | :-------------------------- | :----------------- |
| **固定大小分块** | 按字符数切分                | 简单但可能切断语义 |
| **递归字符分块** | 按段落→句子→字符逐级切分    | 更智能，你们在用   |
| **语义分块**     | 用 Embedding 相似度判断边界 | 效果最好但最慢     |
| **层次分块**     | 先按章节再按段落            | 适合长文档         |

**关键参数**：
- `chunk_size`：通常 200-1000，推荐 500
- `overlap`：通常 `chunk_size` 的 10%-20%，如 50-100

---

### Q3：RAG 检索效果不好怎么优化？

**🔴 需要补理论 — 面试高频必问**

#### **核心理论补充**

**RAG 优化的四个关键维度：**

```
检索质量提升 → 排序质量提升 → 查询质量提升 → 生成质量提升
```

**1. 多路召回（Multi-Path Retrieval）**

| 检索方式 | 说明 | 优势 |
|:--------|:-----|:-----|
| **向量检索** | 语义相似度匹配 | 捕捉语义相近但关键词不同的内容 |
| **关键词检索** | BM25/TF-IDF 精确匹配 | 准确匹配专业术语、专有名词 |
| **混合检索** | 向量 + 关键词加权融合 | 兼顾语义和精确性 |

**实现方式**：
```python
# 伪代码示例
vector_results = vector_search(query, topK=10)      # 向量检索
keyword_results = bm25_search(query, topK=10)       # 关键词检索

# 融合策略1：RRF（倒数排名融合）
final_results = rrf_fusion(vector_results, keyword_results)

# 融合策略2：加权得分
final_results = weighted_merge(
    vector_results * 0.7, 
    keyword_results * 0.3
)
```

**2. Rerank 重排序**

**原理**：对初步检索的结果进行二次精排

**工作流程**：
```
用户查询 → 粗排检索（topK=50）→ Rerank模型精排 → 返回topK=10
```

**常见 Rerank 模型**：
- **Cross-Encoder**：精度高但速度慢（如 BGE-Reranker）
- **Bi-Encoder**：速度快但精度略低
- **商业 API**：阿里云百炼、百度文心一言的 Rerank 接口

**仓颉项目关联**：
> "我们知识库系统的检索配置中有一个 `rerankModelEnabled` 开关，开启后会先粗排召回50条结果，然后用 Rerank 模型重新打分排序，最终返回最相关的10条。这样既保证了召回率，又提升了准确率。"

**3. Query 改写（Query Rewriting）**

**改写策略**：

| 策略 | 说明 | 示例 |
|:-----|:-----|:-----|
| **同义词扩展** | 添加同义词 | "AI" → "人工智能 OR AI OR 机器学习" |
| **查询分解** | 复杂问题拆成多个子问题 | "对比A和B的优缺点" → ["A的优点", "A的缺点", "B的优点", "B的缺点"] |
| **假设性问题** | 生成假设性文档再检索 | HyDE（Hypothetical Document Embeddings） |
| **上下文增强** | 加入对话历史 | 当前问题 + 前3轮对话 → 完整查询 |

**4. 混合检索（Hybrid Search）**

**公式**：
```
最终得分 = α × 向量得分 + (1-α) × 关键词得分
```

**典型配置**：
- α = 0.7（侧重语义）
- α = 0.5（均衡）
- α = 0.3（侧重关键词）

---

**5. RRF 融合算法原理（面试常被追问）**

> 加权融合需要把不同检索器的分数归一化（向量是 0~1 的相似度，BM25 是无上界的得分），尺度不一致会导致偏差。**RRF 只用排名、不用分数**，巧妙避开了这个问题。

**公式**：
```
RRF(d) = Σ 1 / (k + rank_i(d))    # k 通常取 60
# rank_i(d)：文档 d 在第 i 路检索结果中的排名（第1名 rank=1）
# 多路得分相加，总分越高最终排名越靠前
```

**示例**：
```
向量检索 top3：[docA, docB, docC]      → 排名 1,2,3
关键词检索 top3：[docB, docD, docA]    → 排名 1,2,3

RRF(docA) = 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
RRF(docB) = 1/(60+2) + 1/(60+1) = 0.0161 + 0.0164 = 0.0325  ← 融合后第1
RRF(docC) = 1/(60+3)                 = 0.0159
RRF(docD) = 1/(60+2)                 = 0.0161
```

**优点**：无需分数归一化、对异常值鲁棒、实现简单（Elasticsearch 8.x 内置支持）。

---

**6. 数据预处理优化（第零层，最容易被忽略但最重要）**

> RAG 效果 60% 取决于数据质量。面试官最爱从这里追问——"分块之外你还做了什么？"

**四个抓手**：

| 抓手 | 说明 | 项目关联 |
|:-----|:-----|:---------|
| **分块参数调优** | chunk_size 太小→信息碎片化；太大→稀释相关性。先用 50 条样本跑基线再调 | 仓颉 `FileFO.chunkSize`、`chunkOverlap` |
| **文档清洗** | 去页眉页脚、去乱码、表格转 Markdown 结构化（保留行列关系） | 仓颉 `LargeParserHandler` 大文件解析 |
| **元数据增强** | 给每个 chunk 加 title/source/page/department 等标签，支持 Metadata 过滤召回 | 仓颉知识库 workspace 维度过滤 |
| **分块策略升级** | 递归字符→语义分块→父子分块（parent-child，召回小块、回填大块保留上下文） | 仓颉 `ChineseRecursive` + 3 种模式 |

**面试话术**：
> "优化 RAG 我会先从数据入手。我会先用 50 条样本跑一遍基线，看召回结果再决定调 chunk_size 还是换分块策略。我们系统支持 auto/enhance/custom 三种模式，一般业务文档用 ChineseRecursive + 500 字符，技术手册用父子分块——召回小分块定位精确，回填父分块保留上下文。"

---

**标准答案（分层回答）**：

| 层级                         | 优化策略          | 具体方法                                    |
| :--------------------------- | :---------------- | :------------------------------------------ |
| **第零层：数据预处理**       | 分块参数调优      | chunk_size/overlap 先用样本跑基线           |
|                              | 文档清洗          | 去页眉页脚、表格转 Markdown、元数据增强     |
|                              | 分块策略升级      | 父子分块（召回小块、回填大块）              |
| **第一层：基础调参**         | 调整 `chunk_size` | 太大太小都不行                              |
|                              | 调整 `topK`       | 太少漏信息，太多引入噪声                    |
|                              | 优化 Prompt 模板  | 明确要求"基于上下文回答"                    |
| **第二层：检索策略优化**     | Query 改写        | 用户问题模糊时，用 LLM 改写成更精确的查询   |
|                              | 混合检索          | 向量检索 + BM25 关键词检索，用 RRF 融合排序 |
|                              | Metadata 过滤     | 按文档类型、时间、部门等过滤                |
| **第三层：重排序（Rerank）** | 向量检索取 Top-20 | → Reranker 模型重排序 → 取 Top-5            |
|                              | 常用模型          | `bge-reranker-v2`、Cohere Rerank            |
|                              | 效果              | 精度显著提升，但增加一次模型调用延迟        |
| **第四层：高级策略**         | HyDE              | 先让 LLM 生成假设性答案，用答案去检索       |
|                              | 知识图谱融合      | 结构化关系 + 向量检索                       |
|                              | Self-RAG          | LLM 自判断是否需要检索                      |

---

**面试回答模板（简洁版 - 30秒）**：
> "RAG 优化我从四个层面入手：①**数据层**——调 chunk_size/overlap、做文档清洗和元数据增强；②**检索层**——向量+BM25 混合检索，用 RRF 融合排名；③**排序层**——粗排召回 50 条后用 Rerank 模型精排到 10 条；④**生成层**——Prompt 约束'仅基于上下文回答'，必要时用 Query 改写。我们项目支持 Rerank 开关和 topK 配置，我负责应用层参数管理和链路维护。"

**面试回答模板（详细版 - 2分钟）**：
> "RAG 优化的核心是提升检索质量和生成质量。具体来说：
> 
> **第一，多路召回**。单一检索方式有局限，向量检索擅长语义匹配但可能漏掉精确关键词，BM25 相反。所以我们同时跑两路检索，然后用 RRF（倒数排名融合）或加权融合合并结果。
> 
> **第二，Rerank 重排序**。先粗排召回50-100条，再用 Cross-Encoder 模型精排到10条。我们项目中有 `rerankModelEnabled` 配置，开启后能显著提升准确率，代价是增加200-500ms延迟。
> 
> **第三，Query 改写**。包括同义词扩展、查询分解、HyDE 假设性文档等策略。比如用户问'它的性能'，需要结合对话历史改写成'XX产品的性能'。我们系统有 `rewriteEnabled` 开关。
> 
> **第四，混合检索**。向量得分和关键词得分按权重融合，典型比例是0.7:0.3。
> 
> 在我们项目中，这些优化策略是通过配置项控制的，我负责应用层的参数管理和链路维护，底层算法由算法团队实现。”

---

**RAG 失败诊断三板斧（面试官最爱问”用户反馈答案不准你怎么排查”）**：

```
用户反馈”答案不准”
   ↓
第1步：看检索日志——召回的 topK 文档是否相关？
   ├── 相关但答错了 → 生成侧问题（调 Prompt / 换模型 / 降 temperature）
   └── 不相关       → 检索侧问题（继续第2步）
   ↓
第2步：看 Embedding——query 向量与文档向量的相似度分数
   ├── 相似度高但召回错 → 分块切坏语义（调 chunk_size / overlap / 换分块策略）
   └── 相似度低        → Embedding 模型不匹配业务领域（换 BGE / m3e）
   ↓
第3步：看 Rerank——粗排→精排后顺序是否改善？
   ├── 改善           → 正常，继续观察
   └── 没改善甚至变差 → Rerank 模型不匹配（换 bge-reranker / 关掉换混合检索）
```

**面试话术**：
> “我们项目里有完整的检索日志，记录每次 query、返回的文档ID和相似度分数。用户反馈不准时，我会先查日志看召回的文档相关不相关——相关就是生成问题（Prompt 或模型），不相关就是检索问题。再往下看相似度分数高不高，分数高说明分块切坏了语义，分数低说明 Embedding 模型不匹配。最后看 Rerank 前后顺序有没有改善。这套排查法是我维护知识库时总结的，能快速定位是应用侧还是算法侧的问题。”

---

**项目中的关联**（你可以说”我们系统支持这些配置”）：
- `RerankFn` — 项目中配置了 Rerank 功能
- `EmbeddingFn` — 项目中配置了 Embedding 函数
- `topK` — 项目中传递 topK 参数（61 个文件涉及）
- `RagSearchDTO.java` — RAG 检索参数 DTO
- `KnowledgeConfigBase.java` — 知识库检索配置

---

### Q4：你怎么评估 RAG 的效果？

**🔴 需要补理论**

#### **核心理论补充**

**RAG 评估的两个维度：**
1. **检索质量**：找到的文档是否相关
2. **生成质量**：基于文档生成的答案是否正确

---

**A. 检索质量评估指标**

| 指标 | 全称 | 含义 | 计算方式 |
|:-----|:-----|:-----|:---------|
| **Recall@K** | 召回率@K | 前K个结果中有多少是相关的 | 相关文档数 / 总相关文档数 |
| **Precision@K** | 精确率@K | 前K个结果中有多少是真的相关 | 相关文档数 / K |
| **MRR** | Mean Reciprocal Rank | 第一个相关结果的排名倒数平均值 | 1/rank 的平均值 |
| **NDCG@K** | Normalized DCG | 考虑排名位置的加权相关性 | 越靠前的相关文档权重越高 |

**Recall@K 示例**：
```
用户问题：什么是 Transformer？
真实相关文档：doc1, doc3, doc7（共3篇）

检索结果（topK=5）：doc1, doc2, doc3, doc4, doc5
其中相关的是：doc1, doc3

Recall@5 = 2/3 = 66.7%
```

---

**B. 生成质量评估方法**

| 方法 | 说明 | 优点 | 缺点 |
|:-----|:-----|:-----|:-----|
| **人工标注** | 人工打分（1-5分） | 最准确 | 成本高、速度慢 |
| **LLM-as-Judge** | 用更强的 LLM 当裁判 | 成本低、可批量 | 可能有偏见 |
| **ROUGE/BLEU** | n-gram 重叠度 | 客观指标 | 不适合开放性问答 |
| **事实一致性检查** | 验证答案中的事实是否与文档一致 | 针对幻觉问题 | 实现复杂 |

**LLM-as-Judge Prompt 示例**：
```
你是 RAG 系统的评估专家，请根据以下标准给答案打分（1-5分）：

问题：{question}
参考文档：{context}
生成答案：{answer}

评分标准：
5分：答案完全正确，且完全基于参考文档
4分：答案基本正确，少量无关信息
3分：答案部分正确，但有明显遗漏
2分：答案大部分错误
1分：答案完全错误或幻觉

请给出分数和理由：
```

---

**C. 端到端评估框架 - RAGAS**

**RAGAS（RAG Assessment）**：业界常用的 RAG 评估库

核心指标：
- **Context Precision**：检索到的文档是否有用
- **Context Recall**：检索到的文档是否覆盖了答案所需信息
- **Answer Faithfulness**：答案是否忠实于文档（无幻觉）
- **Answer Relevancy**：答案是否回答了问题

**为什么 RAGAS 用 LLM 当裁判？（面试追问原理）**
> 传统指标（ROUGE/BLEU）只看字面 n-gram 重叠，但 RAG 的好答案可以"换个说法"，字面不重叠但语义正确。所以 RAGAS 用 LLM 做语义级判断：
> - **Faithfulness**：把答案拆成多个事实陈述，逐条让 LLM 判断"这条能不能从 context 推出来"，能推出来的占比就是忠实度
> - **Answer Relevancy**：让 LLM 根据答案反推"可能的问题"，看反推的问题和原问题有多像
>
> **局限**：LLM 裁判本身有偏见（偏爱长答案、偏爱同款模型生成的答案），所以业界一般用 GPT-4 当裁判降低偏差，且要配合人工抽检校准。

---

**D. 业务上线评估闭环（offline → online，面试官最爱问"你这套怎么真正跑起来"）**：

```
┌─────────────────── Offline（迭代期）───────────────────┐
│  1. 构建评测集：从真实 query 抽 100-500 条，人工标注       │
│     相关文档 + 标准答案（gold answer）                    │
│  2. 跑 RAGAS：计算 Recall@K / Faithfulness 等基线指标     │
│  3. 调参对比：改 chunk_size / topK / 换 Rerank 模型，     │
│     每次改动重新跑指标，A>B 才上线                        │
└──────────────────────────────────────────────────────────┘
                         ↓ 发版
┌─────────────────── Online（线上运行期）──────────────────┐
│  4. 检索日志：自动记录每次 query + 召回文档 + 相似度分数    │
│  5. 用户反馈：点赞/点踩收集 → 点踩进入 bad case 队列        │
│  6. 监控告警：当"点踩率"超过阈值时触发告警                  │
│  7. 周度复盘：每周抽 bad case 人工分析 → 沉淀进评测集      │
└──────────────────────────────────────────────────────────┘
                         ↓ 评测集越滚越大
                  回到 Offline 继续迭代
```

**关键认知**：offline 评测集是"金标准"（有 ground truth），online 反馈是"真实分布"（量大但没标注）。两者互补：offline 防止调参倒退，online 发现新 case。

---

**仓颉项目关联**：
> "我们的 RAG 评估走的是**'日志 + 反馈 + 周复盘'的工程化路线**，重点解决线上真实问题：
>
> 1. **检索日志全量记录**：每次检索都记录 query、召回的文档 ID、相似度分数，这是排查问题的第一手数据
> 2. **用户反馈闭环**：前端点赞/点踩 → 点踩的 case 自动进人工审核队列
> 3. **bad case 周度复盘**：每周抽点踩案例，用 Q3 的'诊断三板斧'定位是检索问题还是生成问题，然后把典型 case 沉淀成评测样本
> 4. **A/B 测试**：调 topK、scoreThreshold、开关 Rerank 后，对比线上点踩率变化
>
> 业界的 RAGAS 自动化框架（用 LLM 打分算 Faithfulness、Context Precision）我也研究过，适合 offline 评测集批量打分。我们结合业务场景做了取舍——线上量太大全用 LLM 打分成本扛不住，所以用'人工抽检 + 用户反馈'这种更轻量的方式，效果同样可控。"

---

**面试回答模板（简洁版 - 30秒）**：
> "RAG 评估分两个维度：检索质量看 Recall@K、Precision@K、MRR 等指标，衡量找到的文档是否相关；生成质量用 LLM-as-Judge 或人工标注，评估答案是否正确、是否有幻觉。我们项目有检索日志记录和用户反馈机制，通过 bad case 分析和 A/B 测试持续优化，虽然没用自动化评估框架，但效果也不错。"

**面试回答模板（详细版 - 2分钟）**：
> "RAG 评估需要从检索和生成两个层面来看。
> 
> **检索质量评估**：
> - **Recall@K**：前K个结果中有多少是真正相关的。比如用户问'Transformer是什么'，有3篇相关文档，如果top5召回了2篇，Recall@5就是66.7%。
> - **Precision@K**：前K个结果中有多少是真的相关。同样例子，如果top5里有2篇相关，Precision@5就是40%。
> - **MRR**：第一个相关结果的排名倒数。如果第一篇相关文档排在第2位，MRR就是1/2=0.5。
> - **NDCG@K**：考虑排名位置的加权指标，越靠前的相关文档权重越高。
> 
> **生成质量评估**：
> - **人工标注**：最准确但成本高，适合小样本
> - **LLM-as-Judge**：用 GPT-4 这样的强模型当裁判，给答案打分。成本低但可能有偏见
> - **RAGAS 框架**：业界常用的自动化评估库，核心指标包括：
>   - Context Precision：检索文档是否有用
>   - Context Recall：检索文档是否覆盖答案所需信息
>   - Answer Faithfulness：答案是否忠实于文档（无幻觉）
>   - Answer Relevancy：答案是否回答了问题
> 
> **我们项目的实践**：
> 虽然没有完整的自动化评估体系，但有这几个机制：
> 1. 检索日志：记录每次查询的 query、返回文档、相似度分数
> 2. 用户反馈：点赞/点踩，点踩的进入人工审核
> 3. Bad case 分析：每周分析问题根源（检索不准还是生成有误）
> 4. A/B 测试：调整参数后对比用户满意度
> 
> 这套机制虽然不如 RAGAS 完善，但结合实际业务场景，效果还是不错的。"

---

## 二、大模型参数相关

### Q5：大模型的 temperature、top_p、top_k 这些参数是什么意思？

**🟢 项目中有涉及 — 你知道实际配置值，代码中有完整参数**

**你的回答**：
> 我们调用大模型时的参数配置（来自项目代码 `CompletionParams`）：
>
> - `temperature = 0.1`：控制输出的随机性，范围 0-2。我们设的 0.1，基本接近确定性输出——因为智能体平台是企业级产品，需要回答稳定可靠
> - `topP = 0.9`（核采样）：从概率最高的 token 开始累加，直到累积概率达到 0.9，和 temperature 配合使用
> - `frequencyPenalty = 0.5`（频率惩罚）：对出现频率高的 token 施加惩罚，减少重复词
> - `presencePenalty = 0.5`（存在惩罚）：对已经出现过的 token 施加惩罚，鼓励模型讨论新话题
> - `maxTokens`：控制最大输出长度
> - `stream = true`：默认开启流式输出
>
> 这些参数在系统的模型配置模块中可以配置，不同场景可以设不同参数。
>
> **参数调优策略**：
> - RAG知识问答：temperature=0.1（保证准确性），topK=10（检索10个相关文档）
> - 创意写作：temperature=0.8（激发创造力），topP=0.95（扩大候选集）
> - 代码生成：temperature=0.2（保证语法正确），topP=0.85
> - 对话聊天：temperature=0.7（平衡自然度和准确性）
>
> **调试经验**：我们发现temperature超过0.3时模型容易产生幻觉，低于0.05时又过于死板，最终0.1是最佳平衡点。

**项目中的相关代码**：
- `LlmDto.java` — 模型参数 DTO，包含 temperature、topK 等
- `WorkerLlmConfig.java` — 工作流中的 LLM 配置
- `DefaultModelParamsValue.java` — 默认模型参数值
- `checkMaxToken()` — Token 超长校验
- `AgentAppExportConfigModelParamVO.java` — 模型参数导出配置

**补充：参数区别（面试可能追问）**：

```
temperature vs topP 的区别：
  temperature：改变每个候选词的概率分布，值越高概率越平均（越随机）
  topP：直接砍掉概率太低的词，只保留累计概率前P%的候选词
  → temperature控制"有多随机"，topP控制"最差的要不要"
  → 两个配合使用，我们项目中temperature=0.1保证稳定，topP=0.9排除垃圾词

frequencyPenalty vs presencePenalty 的区别：
  frequencyPenalty：按出现次数惩罚，出现3次惩罚3倍，解决同一个词反复出现
  presencePenalty：按是否出现惩罚，只要出现过就惩罚，鼓励说新内容
  → 两个配合，回答既不重复词也不重复话题
```

**技术原理深度解析**：

| 参数 | 作用范围 | 默认值 | 物理含义 |
|------|---------|--------|----------|
| **temperature** | 0.0 ~ 2.0 | 0.1 | Softmax前的logits缩放，控制输出分布平滑度 |
| **top_p** | 0.0 ~ 1.0 | 0.9 | 累积概率阈值，动态调整候选集大小 |
| **top_k** | 1 ~ 词表大小 | 10(RAG) | 仅从概率最高的K个token中采样 |
| **frequency_penalty** | -2.0 ~ 2.0 | 0.5 | 对已出现token按次数惩罚 |
| **presence_penalty** | -2.0 ~ 2.0 | 0.5 | 对已出现token按存在惩罚（不计次数） |

**常见问题及解决方案**：
- **输出重复**：提高 frequency_penalty (0.5 → 1.0) 或降低 temperature
- **输出过于单一**：提高 temperature (0.1 → 0.5) 或提高 top_p (0.9 → 0.95)
- **输出不稳定**：降低 temperature 和 top_p，增加 max_tokens 限制

---

### Q6：什么是 Token？和中文/英文的关系？

**🟢 你应该知道 — 项目中有 Token 校验逻辑**

**你的回答**：
> Token 是大模型处理文本的最小单位，可以理解为"积木块"——大模型不是按"字"理解文字的，而是按 Token 一块一块地理解和生成。
>
> **Token 的计算方式**：
> - 英文："hello" = 1 个 Token，"artificial" = 2-3 个 Token
> - 中文："你好" = 2 个 Token（中文每个字约 1.5-2 个 Token）
> - 代码："int x = 1;" = 5-6 个 Token（符号和变量名各算 Token）
> - 所以同样字数，中文消耗的 Token 比英文多
>
> **为什么 Token 重要**：
> 1. **计费**：API 按 Token 数量收费（输入 + 输出），Token 越多花的钱越多
> 2. **上下文窗口**：模型有 Token 上限（4K/8K/32K/128K），对话太长模型会"忘掉"前面的内容
> 3. **输出长度**：max_tokens 控制模型最多生成多少 Token，防止模型啰嗦
>
> **我们系统的处理**：
> - `checkMaxToken()` 在调用大模型 API 前校验 Prompt 的 Token 数
> - 如果超过 maxToken 上限，直接拒绝请求，避免 API 报错
> - 既省钱又防止超时

**项目中的相关代码**：
- `checkMaxToken()` in `ChatStrategySelector.java` — Token 校验
- `TokenModel.java` — Token 相关模型

---

## 三、向量数据库相关

### Q7：向量数据库选型怎么做的？

**🟢 项目中有涉及 — 你们用了云向量检索服务，你也操作过**

**你的回答**：
> 我们项目用的是云服务提供的向量检索能力（通过 RAG 适配器对接），我在应用层操作过知识库的入库和检索流程。我了解常见向量数据库的区别……

**需要补的理论**：

| 数据库       | 部署方式  | 数据规模 | 混合检索 | 学习成本 | 适用场景    |
| :----------- | :-------- | :------- | :------- | :------- | :---------- |
| **Milvus**   | 自部署    | 十亿级   | ✅        | 高       | 生产大规模  |
| **Redis**    | 自部署    | 百万级   | ❌        | 低       | 学习/小规模 |
| **Pinecone** | 托管 SaaS | 十亿级   | ✅        | 低       | 快速上线    |

**选型结论**：
- 生产环境 → Milvus（开源、可扩展）
- 学习/原型 → Redis Stack（简单）
- 不想运维 → Pinecone / Zilliz Cloud

**项目中的相关代码**：
- `RagProviderAdapterImpl.java` — RAG 适配器（动态选择 Provider）
- `YunDingRagProvider.java` — 云鼎 RAG 服务
- `LakeSearchRagProvider.java` — LakeSearch 检索

---

### Q8：什么是向量相似度搜索？有哪些距离算法？

**🔴 需要补理论 — 面试基础题**

#### **核心理论补充**

**两个核心问题：**
1. **怎么算相似度**（距离算法）
2. **怎么快速查找**（索引类型）

---

**A. 三种距离算法**

| 算法 | 公式 | 适用场景 | 特点 |
|:-----|:-----|:---------|:-----|
| **余弦相似度** | cos(θ) = A·B / (‖A‖×‖B) | NLP、文本嵌入 | 只关心方向，不关心长度 |
| **欧氏距离** | d = √Σ(A-Bᵢ)² | 图像、物理空间 | 考虑绝对位置 |
| **内积（点积）** | A·B = ΣAᵢ×Bᵢ | 归一化后的向量 | 计算最快，等价于余弦 |

**重要结论**：
- 如果向量已经**归一化**（长度为1），则：**余弦相似度 = 内积**
- 大多数 Embedding 模型输出前都会归一化，所以实际常用**内积**（计算快）

**为什么归一化后内积=余弦？（面试官最爱抓的数学推导）**：

```
设向量 A、B，归一化后 ‖A‖=‖B‖=1

余弦相似度定义：cos(A,B) = (A·B) / (‖A‖ × ‖B‖)
                          = (A·B) / (1 × 1)      ← 归一化后分母=1
                          = A·B
                          = 内积

所以归一化后：cos(A,B) = A·B，两个公式等价！
```

**为什么实际工程都选内积？**
- 余弦公式要做一次除法（÷ ‖A‖×‖B‖）+ 一次开方（算模长），计算更重
- 内积只需一次点乘（Σ Aᵢ×Bᵢ），SIMD 指令可并行加速
- 在 768 维向量上，内积比余弦快约 20-30%

**仓颉项目关联**：
> "我们用的 Embedding 函数（如 text-embedding-v3）输出的向量已经是归一化的，所以底层用的是内积计算相似度。我在配置检索参数时会设置 `scoreThreshold=0.5`，低于这个阈值的就不返回。"

---

**B. 索引类型（ANN 近似最近邻搜索）**

**为什么需要索引？**
- 暴力搜索：100万向量 × 每次查询 = 100万次计算 → **太慢**
- ANN 索引：通过预处理，把查询复杂度从 O(N) 降到 O(log N)

**主流索引类型对比**：

| 索引类型 | 全称 | 原理 | 优点 | 缺点 | 适用场景 |
|:--------|:-----|:-----|:-----|:-----|:---------|
| **HNSW** | Hierarchical Navigable Small World | 多层图结构，上层稀疏下层密集 | 精度高、查询快 | 内存占用大、构建慢 | 中小规模（<1000万） |
| **IVF** | Inverted File Index | 聚类中心 + 倒排列表 | 内存占用小、构建快 | 精度略低 | 大规模（>1000万） |
| **IVF-PQ** | IVF + Product Quantization | IVF + 乘积量化压缩 | 内存极小 | 精度损失较大 | 超大规模 + 资源受限 |
| **Faiss Flat** | 暴力搜索 | 无索引，全量遍历 | 精度最高 | 速度最慢 | 小规模测试 |

**HNSW 核心参数**：
- `M`：每层节点的最大连接数（默认16-64）
- `efConstruction`：构建时的搜索范围（越大精度越高，构建越慢）
- `efSearch`：查询时的搜索范围（越大精度越高，查询越慢）

**IVF 核心参数**：
- `nlist`：聚类中心数量（建议 = √N，N为向量总数）
- `nprobe`：查询时搜索的聚类桶数量（越大精度越高，查询越慢）

**HNSW vs IVF 选型决策树（面试被问"你怎么选"时直接背）**：

```
你的向量数据量是多少？
│
├── < 100 万（中小企业知识库、个人项目）
│   └── 选 HNSW（精度优先，内存可接受）
│       典型配置：M=16, efConstruction=200, efSearch=50
│       预期：Recall@10 > 95%，单次查询 < 10ms
│
├── 100 万 ~ 1000 万（中型业务）
│   └── 看内存预算：
│       ├── 内存充足 → HNSW（M 适当调大）
│       └── 内存紧张 → IVF（nlist=√N, nprobe=8~16）
│
└── > 1000 万（大规模推荐/搜索）
    └── IVF-PQ 或 HNSW+PQ（内存优先，可接受精度损失）
        典型配置：nlist=4096, 用 PQ 把 768 维压到 64 字节
        预期：内存降至 1/10，Recall 下降 5-10%
```

**精度（Recall）vs 召回速度的权衡（核心认知）**：

| 调参方向 | 效果 | 代价 |
|:---------|:-----|:-----|
| HNSW 调大 `efSearch` | Recall↑ | 查询变慢 |
| IVF 调大 `nprobe` | Recall↑ | 查询变慢 |
| PQ 压缩比调低 | 内存↑ | Recall↑ |
| **业界共识** | Recall@10 达到 95% 就够用了，再往上性价比极低 |

**仓颉项目关联**：
> "我们用的是云服务（LakeSearch/Milvus），底层索引类型是云厂商管理的。我知道 HNSW 适合中小规模数据，精度高但内存占用大；IVF 适合大规模数据，内存效率高。我们在配置知识库时会选择索引类型，一般文档量小于100万用 HNSW，大于1000万用 IVF-PQ。"

---

**面试回答模板（简洁版 - 30秒）**：
> "向量相似度主要有三种算法：**余弦相似度**（只关心方向，NLP 常用）、**欧氏距离**（考虑绝对位置）、**内积**（归一化后等价于余弦，计算最快）。索引方面，主流的是 **HNSW**（多层图结构，精度高但内存大）和 **IVF**（聚类+倒排，内存效率高）。我们项目用云服务，向量已归一化，底层用内积计算，索引类型根据数据量选择 HNSW 或 IVF。"

**面试回答模板（详细版 - 2分钟）**：
> "向量检索有两个核心问题：一是怎么算相似度，二是怎么快速查找。
> 
> **关于相似度算法**：
> - **余弦相似度**计算两个向量夹角的余弦值，只关心方向不关心长度，适合 NLP 场景。
> - **欧氏距离**计算两点间的直线距离，适合图像等需要考虑绝对位置的场景。
> - **内积**就是向量点乘，如果向量已经归一化（长度为1），内积就等价于余弦相似度，而且计算更快。
> 
> 我们用的 Embedding 模型输出前会归一化，所以底层实际用的是内积。
> 
> **关于索引类型**：
> 暴力搜索100万向量太慢了，所以要用 ANN（近似最近邻）索引加速。
> 
> - **HNSW** 是多层图结构，上层节点少用于快速定位，下层节点多用于精细搜索。优点是精度高、查询快，缺点是内存占用大（可能是原始数据的10-20倍），适合中小规模数据（<1000万）。
> 
> - **IVF** 是先聚类，把向量分到不同的桶里，查询时只搜索最近的几个桶。优点是内存效率高、构建快，缺点是精度略低，适合大规模数据（>1000万）。还有 **IVF-PQ**，加了乘积量化压缩，内存更小但精度有损失。
> 
> 我们项目用的是云服务，索引类型由云厂商管理。我了解的原则是：数据量小用 HNSW 追求精度，数据量大用 IVF 追求效率。"

---

## 四、SSE 流式输出相关

### Q9：大模型的流式输出怎么实现的？

**🟢 你的强项 — 生产级经验（基于实际项目文档整理）**

**你的回答**：
> 我们系统用 SSE 实现大模型的流式输出，整体架构是 **“生产者-缓冲-消费者”** 模式：
>
> **1. 流式生产（AgentLLmService）**：
> - 调用大模型 API，获取 `Flux<String>` 流式响应
> - 每收到一个 chunk，做两件事：
>   - **存入 Redis List**：作为临时缓冲，key 为 `llm:stream:{sessionId}`
>   - **实时推送前端**：按 10 个字符分块，通过 SSE EventStream 推送到前端
> - 支持思考内容分离：检测 `<think>` 标签，将思考过程和最终回答分开推送
>
> **2. 流式消费（DirectReplyService）**：
> - 从 Redis List 读取完整内容，用于更新数据库消息记录
> - **不再重复推送给前端**（避免重复回复）
> - 等待流式结束后，发送引用信息和剩余内容
>
> **遇到的核心问题**：流式输出和下游回复节点的冲突
> - 最初的问题是：大模型节点已经在实时推送流式数据了，但下游回复节点也会推送完整内容，导致前端出现重复回复
>
> **解决方案：职责分离**
> - 大模型节点负责“推”（实时 SSE 推送到前端）
> - 回复节点负责“存”（从 Redis 读取并更新数据库，不再推前端）
> - 通过 Redis List 解耦两个节点，用 `isStreaming` 状态标记控制生命周期
>
> **其他技术细节**：
> - **智能判断**：检查下一节点的 `isStream` 配置，自动决定流式/非流式模式（`checkNextNodeStreamConfig`）
> - **异步处理**：用独立线程池（`ExecutorConfig`）异步处理流式数据，避免阻塞主流程
> - **超时保护**：有 5 秒超时机制，防止等待流开始时死循环
> - **思考分离**：处理了思考内容（`<think>` 标签）和回答内容的分离
> - **剩余内容**：流结束时发送不足 10 字符的剩余部分 + 引用信息
> - **状态管理**：通过 `LlmRedisMessageService` 管理 `isStreaming` Map，标记流是否进行中
>
> **SSE vs WebSocket**：
> - SSE：单向（服务端→客户端），基于 HTTP，自动重连，适合流式推送
> - WebSocket：双向通信，需要单独协议升级，适合实时交互
> - 大模型流式输出一般用 SSE 就够了

**项目中的相关代码**：
- `AgentLLmService.java` — 大模型节点，负责流式生产和推送
- `DirectReplyService.java` — 回复节点，负责消费和记录（不重复推送）
- `LlmRedisMessageService.java` — Redis 缓存管理，控制 `isStreaming` 状态
- `ChatStrategySelector.java` — `chatWithStream()` 流式调用方法
- `StreamResponse.java` / `StreamChoice.java` — 流式响应模型

**核心设计亮点**：

| 设计点 | 实现方式 | 作用 |
| :------- | :-------------------------- | :----------------------------- |
| **流式缓存** | Redis List (`llm:stream:{sessionId}`) | 临时存储数据块，供回复节点读取，解耦生产和消费 |
| **状态控制** | `isStreaming` Map (ConcurrentHashMap) | 标记流是否进行中，避免死循环和重复推送 |
| **分块推送** | 10 字符/块 + SSE EventStream | 实现真正的流式用户体验，减少首字延迟 |
| **防重复** | 职责分离（LLM节点推，回复节点存） | 避免前端看到重复内容 |
| **智能判断** | `checkNextNodeStreamConfig()` | 根据下一节点配置决定流式策略，自动适配 |
| **异步处理** | 独立线程池 (`ExecutorConfig`) | 避免阻塞主流程，提高并发能力 |
| **超时保护** | 5 秒超时机制 | 防止无限等待流开始，快速失败 |
| **思考分离** | 检测 `<think>` 标签 | 将深度思考过程和最终回答分开推送，提升体验 |
| **剩余内容** | 流结束时 flush 不足10字符的部分 | 保证所有内容都能完整推送 |
| **引用信息** | 流结束后发送 config_references | 展示检索到的文档来源，增强可信度 |

---

## 五、Camunda 工作流相关

### Q10：工作流引擎怎么做的？节点怎么开发？

**🟢 你的强项 — 生产级经验**

**你的回答**：
> 我们用 Camunda BPMN 做工作流引擎。
>
> **节点开发**：
> - 继承 Camunda 的 `JavaDelegate` 接口实现节点逻辑（我们封装了 `AgentBaseAbstractDelegate` 基类）
> - 通过流程变量（`execution.getVariable` / `setVariable`）做节点间数据传递
> - 我新增过文本提取节点（TextExtractService），内部调用大模型 API 从文本中提取结构化信息
>
> **我们系统的节点类型**（20+种）：
> - **LLM 节点**：调用大模型生成回答（AgentLLmService）
> - **分类器节点**：意图分类/路由（QuestionClassifyService）
> - **知识检索节点**：调用 RAG 检索（KnowledgeSearchService）
> - **文本提取节点**：调用大模型提取关键信息（**我新增的**）
> - **HTTP 请求节点**：调用外部 API（HttpRequestService）
> - **代码沙箱节点**：执行用户代码（GraalVM 隔离，CodeRunnerService）
> - **条件路由节点**：动态分支决策（ExclusiveGateway + SpEL表达式）
> - **并行网关**：多任务并发执行（ParallelGateway）
> - **变量操作节点**：变量复制/提取/合并（VariableTogetherService/VariableExtractService）
> - **回复/输出节点**：返回结果给用户（DirectReplyService/OutputService）
> - **工具调用节点**：执行预定义工具（ToolApiService/ToolWorkflowService）
> - **插件执行节点**：执行数据库/图表等插件（PluginExecuteService）
>
> **变量赋值方式**：
> - 节点 A 执行完 → `execution.setVariable("result", value)`
> - 节点 B 启动 → `String result = execution.getVariable("result")`
> - 所有变量变更都会记录到 `BpmProcVariableEntity`，形成完整的执行轨迹
>
> **动态决策能力**（核心亮点）：
> - ExclusiveGateway（互斥网关）支持 SpEL 表达式，如 `${sentiment == "negative" && score < 60}`
> - 运行时从上下文中提取变量值，自动评估条件并选择分支
> - 记录每次网关决策的输入变量和选中条件，便于审计和调试
>
> **BPMN 自动修复机制**：
> - 系统能自动检测并修复流程图结构问题（BpmnPatcherService）
> - 如自动插入 Join 网关保证分支收敛，避免“孤岛”节点
> - 降低用户使用门槛，非技术人员也能绘制合法的工作流

**项目中的相关代码**：
- `AgentBaseAbstractDelegate.java` — 基础节点抽象类（封装通用逻辑）
- `AbstractGatewayIoListener.java` — 条件路由动态决策实现（ExclusiveGateway SpEL表达式评估）
- `BpmnPatcherService.java` — BPMN网关自动修复机制
- `AgentLLmService.java` — LLM 节点
- `TextExtractService.java` — 文本提取节点（我新增的）
- `KnowledgeSearchService.java` — 知识检索节点
- `QuestionClassifyService.java` — 分类器节点
- `HttpRequestService.java` — HTTP 请求节点
- `CodeRunnerService.java` — 代码沙箱节点（GraalVM隔离）
- `VariableTogetherService.java` / `VariableExtractService.java` — 变量操作
- `DirectReplyService.java` / `OutputService.java` — 回复输出
- `ConditionalRouterService.java` — 条件路由（动态决策）
- `ToolApiService.java` / `ToolWorkflowService.java` — 工具调用
- `PluginExecuteService.java` — 插件执行
- `BpmProcVariableEntity.java` — 流程变量实体（记录执行轨迹）

---

## 六、Agent 架构相关

### Q11：什么是 Agent？和普通 AI 应用有什么区别？

**🟢 项目中有涉及 — 你们的条件路由节点有动态决策能力**

**你的回答**：
> Agent是有自主决策能力的智能系统，核心是”感知→决策→执行→反馈”的循环。
> 和普通AI应用的区别：
> - 普通AI应用：固定流程，用户输入→处理→输出
> - Agent：根据上下文动态决策，能感知环境、选择工具、自我调整
>
> 在我们项目中，虽然不是LLM原生的Agent模式，但有类似的动态决策机制：
>
> **1. 问题分类器（QuestionClassifyService）**：
> 用LLM对用户问题做意图分类，根据分类结果路由到不同处理分支：
> - “帮我查上个月销售数据” → LLM判断为”数据查询” → 路由到智能问数分支
> - “公司退货政策是什么” → LLM判断为”知识问答” → 路由到RAG分支
> - “今天天气怎么样” → LLM判断为”闲聊” → 路由到直接回复分支
>
> **2. 条件路由节点（ConditionalRouterService / ExclusiveGateway）**：
> 基于BPMN 2.0工作流引擎，通过SpEL表达式实现运行时动态分支决策：
> - 条件如 `${sentiment == "negative" && score < 60}` 在运行时评估
> - 从上下文中提取变量值，自动选择执行路径
> - 记录完整的决策轨迹（包括判断依据和变量值），便于审计和调试
>
> **3. BPMN网关自动修复机制**：
> 系统能自动检测和修复工作流结构问题，如自动插入ExclusiveGateway或ParallelGateway，
> 保证所有分支都能正确收敛，降低用户使用门槛。
>
> 虽然规则是预定义的（不是LLM完全自主决策），
> 但”根据输入动态选择处理路径”这个思路和Agent是一致的。

**项目中的相关代码**：
- `AbstractGatewayIoListener.java` — 条件路由动态决策实现（ExclusiveGateway）
- `BpmnPatcherService.java` — BPMN网关自动修复机制
- `ConditionalRouterService.java` — 条件路由节点
- `QuestionClassifyService.java` — 问题分类器（调用LLM做意图分类）
- `AgentBaseAbstractDelegate.java` — 基础节点抽象类
- `AgentWorkflowConfigEntity.java` — 工作流配置实体（存储BPMN流程图定义）

**需要补的理论**：

| Agent 核心组件       | 说明                                 |
| :------------------- | :----------------------------------- |
| **LLM（大脑）**      | 理解任务、推理决策                   |
| **Tools（工具）**    | 执行具体操作（搜索、计算、API 调用） |
| **Memory（记忆）**   | 短期（对话历史）+ 长期（知识库）     |
| **Planning（规划）** | 任务分解、步骤安排                   |

**Agent vs 工作流**：
- 工作流：预定义流程，按固定步骤执行（**你们项目**）
- Agent：LLM自主决策，动态选择下一步（ReAct / Plan-and-Execute）
- 你们的问题分类器：介于两者之间（用LLM分类，但分支是预定义的）

---

### Q12：什么是 ReAct 模式？和你们项目中的条件路由节点有什么本质区别？

**🔴 需要补理论 — Agent 高频面试题**

#### **核心理论补充**

**ReAct = Reasoning（推理）+ Acting（行动）交替执行**

**核心思想**：让 LLM 不仅生成答案，还要先生成思考过程，然后根据思考决定调用什么工具，拿到工具结果后再继续思考，循环往复直到得出答案。

---

**工作流程**：

```
用户问题：北京今天天气怎么样？

第1轮 - Reasoning：
LLM：我需要查询北京的天气，应该调用天气API

第1轮 - Acting：
调用 weather_api(city="北京") → 返回 {"temp": 25, "condition": "晴"}

第2轮 - Reasoning：
LLM：我拿到了天气数据，温度25度，晴天，可以回答问题了

第2轮 - Acting：
生成最终答案："北京今天天气晴朗，温度25度"
```

---

**Prompt 模板**：

```
你是一个智能助手，请按以下步骤回答问题：

Thought: 我先思考一下...
Action: 我应该调用某个工具
Action Input: 工具的参数
Observation: 工具返回的结果
Thought: 根据结果我继续思考...
[重复以上步骤]
Final Answer: 最终答案
```

---

**ReAct 的 4 大致命缺陷（面试官必问"ReAct 有什么问题"——这正是用 BPMN 反衬它的绝佳机会）**：

| 缺陷 | 说明 | 后果 |
|:-----|:-----|:-----|
| **① 不稳定** | LLM 在 Thought 环节可能"跑偏"，陷入死循环或重复调用同一工具 | 任务无法收敛，Token 烧穿 |
| **② 成本高** | 每轮都要调 LLM 推理，复杂任务可能调 5-10 次 | 延迟 + Token 成本成倍增加 |
| **③ 不可审计** | 执行路径不可预测，每次走的路都不一样 | 无法满足金融/政务的合规要求 |
| **④ 幻觉工具调用** | LLM 可能"编造"不存在的工具或填错参数 | 调用失败甚至误操作生产系统 |

**核心话术**：
> "ReAct 的灵活性是它的优点也是最大的缺点。在企业级场景里，**确定性、可审计性、可维护性**比灵活性更重要——这正是我们选 BPMN 的根本原因：每一步都有变量轨迹记录，100% 可复现，满足监管审计要求。"

---

**Agent 范式演进谱系（只讲 ReAct 显得知识陈旧，补上演进链显示体系化理解）**：

```
ReAct (2022)                    ← 思考与行动交替，灵活但不可控
   ↓ 解决"LLM 漫无目的探索"
Plan-and-Execute (2023)         ← 先用 LLM 规划完整计划，再逐步执行（更可控）
   ↓ 解决"单 Agent 能力有限"
Multi-Agent (2024)              ← 多个 Agent 分工协作（对应 Q13）
   ↓ 解决"自然语言指令不可靠"
Code-as-Agent (2025)            ← LLM 生成代码而非自然语言指令（如 OpenAI Code Interpreter、DeepSeek）
```

| 范式 | 核心改进 | 代表实现 |
|:-----|:---------|:---------|
| **ReAct** | Thought-Action-Observation 循环 | LangChain ReActAgent |
| **Plan-and-Execute** | 先规划再执行，减少中途 LLM 调用 | LangChain PlanAndExecute |
| **Multi-Agent** | 分工协作，每个 Agent 专精一面 | AutoGen、CrewAI、MetaGPT |
| **Code-as-Agent** | 用代码替代自然语言指令，确定性更高 | OpenAI Code Interpreter、LangGraph |

**话术**：
> "ReAct 是 2022 年的经典范式，现在主流已经演进到 Plan-and-Execute 和 Multi-Agent。Plan-and-Execute 先让 LLM 规划完整计划再执行，比 ReAct 边走边看更可控。再往后是 Code-as-Agent，让 LLM 直接生成代码而非自然语言指令，确定性更高。"

---

**真正的 ReAct 代码长什么样（LangChain4j 风格示例）**：

```java
// LangChain4j 的 ReAct 实现 —— 框架自动维护 Thought-Action-Observation 循环
interface WeatherAgent {
    String ask(String question);
}

// 1. 定义工具（Agent 可以调用的能力）
class WeatherTools {
    @Tool("查询指定城市的天气")
    String getWeather(@P("城市名") String city) {
        return weatherApi.call(city);  // 返回 "北京 25度 晴"
    }
}

// 2. 用 AiServices 构建 ReAct Agent —— 框架会自动实现循环
WeatherAgent agent = AiServices.builder(WeatherAgent.class)
    .chatLanguageModel(model)
    .tools(new WeatherTools())     // 注册工具
    .build();

// 3. 调用 —— LLM 自己决定调哪个工具、传什么参数
String answer = agent.ask("北京今天天气怎么样？");
// 框架底层自动执行：
//   Thought: 我需要查北京天气 → Action: getWeather("北京") 
//   → Observation: 25度晴 → Thought: 可以回答了 → Final Answer
```

**与仓颉条件路由的本质对比（代码层面）**：

```java
// 仓颉条件路由 —— 分支是预定义的，由 SpEL 表达式评估
if (sentiment.equals("negative") && score < 60) {
    routeTo("escalateAgent");     // 路径编译时确定
} else {
    routeTo("autoReply");         // 100% 可复现
}

// ReAct Agent —— 分支由 LLM 实时决定，每次可能不同
String action = llm.think(userQuery + context);  // LLM 自主决策
// action 可能是 "getWeather" / "searchKB" / "directReply" —— 不可预测
```

---

**与仓颉项目的关联**：

**仓颉的条件路由节点 vs ReAct**：

| 维度 | 仓颉条件路由节点 | ReAct 模式 |
|:-----|:---------------|:----------|
| **决策方式** | 预设规则（if-else） | LLM 动态推理 |
| **灵活性** | 固定分支 | 灵活生成 |
| **可控性** | 高（明确知道走哪条路） | 低（LLM 可能出错） |
| **适用场景** | 结构化流程 | 开放性问题 |

**仓颉项目关联话术**：
> "虽然我们项目没有直接用 ReAct 框架，但我们的**条件路由节点**有类似的思想：根据上一步的输出动态决定下一步走哪个分支。区别是 ReAct 是 LLM 自主推理决定调用什么工具，而我们是预设好规则和分支，由引擎判断走哪条路。ReAct 更灵活但不可控，我们的方式更稳定但需要预先设计好所有分支。"

---

**深度对比分析**（面试被追问时用）：

| 维度 | ReAct模式 | 我们的条件路由节点 |
|------|-----------|------------------|
| **决策主体** | **LLM自主决策** | **预定义规则引擎** |
| **执行路径** | **动态生成**，不可预测 | **静态编排**，可视化可见 |
| **循环能力** | ✅ 支持无限迭代 |  DAG有向无环图，无循环 |
| **可解释性** | ⚠️ "黑盒"，难以追溯 | ✅ 完整轨迹记录，每步可审计 |
| **确定性** | ❌ 不稳定，可能幻觉 | ✅ 100%可复现 |
| **开发方式** | Prompt工程为主 | 可视化拖拽+BPMN规范 |
| **适用场景** | 开放域探索任务 | 企业级业务流程 |
| **调试难度** | 困难，需分析Prompt | 简单，查看变量轨迹 |
| **性能开销** | 高，多次LLM调用 | 低，仅分支点评估表达式 |

**本质区别**：

1. **决策机制不同**：
   - ReAct：LLM在运行时自主决定下一步做什么（如"我需要先搜索XX"）
   - 条件路由：SpEL表达式在运行时评估预定义条件（如 `${sentiment == "negative"}`）

2. **执行图拓扑不同**：
   - ReAct：图灵完备，可以形成循环、递归等任意复杂控制流
   - 条件路由：严格DAG（有向无环图），禁止循环，所有路径编译时确定

3. **错误处理哲学不同**：
   - ReAct：可能无限重试或偏离目标，依赖LLM自我修正
   - 条件路由：每种错误都有显式预案（如限流、降级、告警），不会无限重试

**实际案例对比**（智能客服退货场景）：

❌ **ReAct方式**：
```
Agent Thought 1: 用户要退货，我需要先确认订单信息
Action 1: QueryOrders(user_id="12345")
Observation 1: [{order_id: "ORD001", status: "delivered", days_since: 5}]

Agent Thought 2: 找到最近订单，已签收5天，在7天退货期内
Action 2: SearchKB("退货政策 电子产品")
Observation 2: "电子产品拆封后需扣除10%折旧费"

Agent Thought 3: 产品已拆封，需要告知用户折旧费
...

潜在问题：
⚠️ 如果LLM在Thought 2时"忘记"查询政策，直接回复
⚠️ 每次对话的路径都不一样，难以测试
⚠️ 可能陷入无限循环
```

✅ **我们的条件路由方式**：
```xml
<!-- BPMN工作流定义 -->
<process id="return_process">
  <startEvent id="start"/>
<!-- 步骤1：提取订单ID -->
  <serviceTask id="extract_order" delegateExpression="${variableExtractService}"/>

  <!-- 步骤2：查询订单详情 -->
  <serviceTask id="query_order" delegateExpression="${toolApiService}"/>

  <!-- 步骤3：条件判断 - 是否在退货期内 -->
  <exclusiveGateway id="check_return_period">
    <conditionExpression>${days_since_delivery <= 7}</conditionExpression>
  </exclusiveGateway>

  <!-- 分支A：在退货期内 -->
  <sequenceFlow sourceRef="check_return_period" targetRef="check_condition">
    <conditionExpression>${days_since_delivery <= 7}</conditionExpression>
  </sequenceFlow>

  <serviceTask id="check_condition" delegateExpression="${knowledgeSearchService}"/>

  <!-- 分支B：超出退货期 -->
  <sequenceFlow sourceRef="check_return_period" targetRef="reject_return">
    <conditionExpression>${days_since_delivery > 7}</conditionExpression>
  </sequenceFlow>

  <serviceTask id="reject_return" delegateExpression="${directReplyService}"/>

  <endEvent id="end"/>
</process>    
```



**优势**：
- ✅ **流程清晰**：任何人看BPMN图都能理解业务逻辑
- ✅ **易于修改**：产品经理可以直接调整分支条件
- ✅ **完整测试**：可以覆盖所有分支路径
- ✅ **合规审计**：每个决策都有记录，满足监管要求

**能否结合两者优势？**

最佳实践是**混合架构**：

```
外层：BPMN工作流（确定性编排）
  Start → 意图识别 → 条件路由
           ↓
    ┌─────────────┐
    │ 复杂开放任务？│
    └─┬───────┬───┘
      YES   NO
      ↓     ↓
  ReAct Agent  固定子工作流
  动态探索     确定性执行
      ↓     ↓
  后续：结果处理 → 通知 → End
```




**总结回答模板（简洁版 - 30秒，背这一版即可）**：
> "ReAct 是让 LLM 在思考和行动之间迭代、自主决策调用什么工具的 Agent 范式。它适合开放域探索任务，但有不稳定、成本高、不可审计、容易幻觉工具调用这 4 个缺陷。企业级场景更看重确定性和可审计性，所以我们用 BPMN 做骨架——每步有变量轨迹、100% 可复现。最佳实践是混合架构：BPMN 做确定性编排，在需要灵活决策的节点内嵌 ReAct。"

**总结回答模板（详细版 - 2分钟，被追问时用）**：

> "ReAct模式是一种让LLM在推理和行动之间迭代的Agent范式，核心特点是**动态决策**和**自我反思**。它适合处理开放域的探索性任务。
>
> 而我们项目中的条件路由节点是基于**BPMN 2.0规范的规则引擎**，本质区别在于：
> 1. **决策主体不同**：ReAct由LLM自主决策，我们是预定义的SpEL表达式评估
> 2. **执行图不同**：ReAct可以形成任意复杂的控制流（包括循环），我们是严格的DAG
> 3. **确定性不同**：ReAct的输出不稳定，我们100%可复现
> 4. **应用场景不同**：ReAct适合开放探索，我们适合企业级业务流程
>
> 我们认为在企业级应用中，**确定性、可审计性、可维护性**比灵活性更重要。当然，我们也意识到ReAct的价值，正在探索在特定节点中嵌入ReAct能力，形成混合架构。"

---

### Q13：什么是多 Agent 协作？

**🔴 需要补理论**

#### **核心理论补充**

**多 Agent 协作 = 多个 specialized agent 分工合作完成复杂任务**

**类比**：就像一个团队，每个人负责不同的职责，协同完成项目。

---

**主流协作模式**：

| 模式                     | 说明                                      | 优点     | 缺点            | 适用场景     |
| :----------------------- | :---------------------------------------- | :------- | :-------------- | :----------- |
| **Sequential（顺序）**   | Agent A → Agent B → Agent C               | 简单清晰 | 串行慢          | 流水线式任务 |
| **Parallel（并行）**     | Agent A、B、C 同时执行，最后汇总          | 速度快   | 需要结果融合    | 独立子任务   |
| **Hierarchical（分层）** | Manager Agent 分配任务给 Worker Agents    | 可扩展   | 复杂度高        | 大型项目     |
| **Router（路由）**       | Router Agent 根据问题类型分发到不同 Agent | 灵活     | Router 可能出错 | 多领域问答   |
| **Debate（辩论）**       | 多个 Agent 给出不同观点，最后投票或讨论   | 减少偏见 | 成本高          | 决策类任务   |

---

**LangGraph 的实现**：

**StateGraph**：定义状态流转图
```python
from langgraph import StateGraph

workflow = StateGraph()
workflow.add_node("researcher", research_agent)
workflow.add_node("writer", writer_agent)
workflow.add_node("reviewer", reviewer_agent)

workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", "reviewer")
workflow.set_finish_point("reviewer")
```

---

**LangChain4j 版多 Agent 实现（Java 技术栈，更贴合你的能力圈）**：

> LangGraph 是 Python 生态的，面试时如果被追问"你用 Java 怎么实现多 Agent"，可以讲 LangChain4j 的 AiServices 组合模式——本质是用多个专业 Agent 接力，前一个的输出喂给后一个。

```java
// 1. 定义三个专业 Agent（每个 Agent 是一个接口）
interface ResearcherAgent {
    @dev.langchain4j.service.SystemMessage("你是资料检索专家，根据问题检索相关文档")
    String research(@UserMessage String question);
}

interface WriterAgent {
    @SystemMessage("你是技术写作专家，把检索到的资料整理成清晰回答")
    String write(@UserMessage String researchResult);
}

interface ReviewerAgent {
    @SystemMessage("你是质检专家，检查回答是否准确、有无幻觉，给出通过或修改意见")
    String review(@UserMessage String draft);
}

// 2. 编排：顺序协作模式（Sequential）
ResearcherAgent researcher = AiServices.builder(ResearcherAgent.class)
    .chatLanguageModel(model).tools(knowledgeTool).build();
WriterAgent writer = AiServices.builder(WriterAgent.class)
    .chatLanguageModel(model).build();
ReviewerAgent reviewer = AiServices.builder(ReviewerAgent.class)
    .chatLanguageModel(model).build();

// 3. 接力执行 —— 前一个输出作为后一个输入
String research = researcher.research(question);   // Agent1 检索
String draft    = writer.write(research);          // Agent2 写作
String final    = reviewer.review(draft);          // Agent3 质检
// 如果 reviewer 判定不通过，可以循环回 writer 重写（闭环）
```

**与仓颉 BPMN 的映射**：上面的 Researcher → Writer → Reviewer，本质上就是仓颉里的"知识检索节点 → LLM 生成节点 → 条件路由节点（判质检是否通过）"，区别在于仓颉节点是"被动执行"，而 Agent 有"自主判断"能力。

---

**多 Agent 的 3 大痛点（只讲好处不讲代价会被面试官认为没经验）**：

| 痛点 | 说明 | 缓解手段 |
|:-----|:-----|:---------|
| **① 沟通成本爆炸** | Agent 之间用自然语言传递信息，存在信息损失和误解。N 个 Agent 的沟通成本是 O(N²) | 用结构化 schema（JSON）传递，而非自由文本 |
| **② 错误传播** | 上游 Agent 出错，下游基于错误信息继续执行，错误层层放大 | 每个 Agent 加自检/校验，关键步骤加人工审核（HITL） |
| **③ 调试困难** | 多个 Agent 串联，出问题难定位是哪一环 | 全链路 trace（记录每个 Agent 的输入输出），用 LangSmith / Langfuse 观察 |

**关键认知**：多 Agent 不是"越多越好"。业界经验是 **3-5 个 Agent 是甜蜜点**，超过 7 个收益急剧下降、调试成本失控。这就是为什么 AutoGen、CrewAI 都推荐小团队编排。

---

**仓颉项目可演进为多 Agent 的路径（展示你的技术规划能力）**：

```
现状（确定性编排）：
  BPMN 流程图 → 知识检索节点 → 条件路由 → LLM 生成 → 回复
  （节点被动执行，无自主决策）

演进路径 1：节点智能化（轻量改造）
  给 LLM 生成节点加 Memory + 自检：
  生成后让 LLM 自评"这个回答是否准确？是否需要补充检索？"
  → 不满意则触发二次检索（引入轻量 ReAct 循环）

演进路径 2：Router 升级为 Agent（中等改造）
  把问题分类器（QuestionClassifyService）从"规则路由"升级为
  "Router Agent"，让它根据问题复杂度动态选择处理策略：
  简单问题 → 单轮 RAG
  复杂问题 → 分解为子问题 → 并行检索 → 综合回答

演进路径 3：完整多 Agent（重构）
  Research Agent（检索）+ Writer Agent（写作）+ Reviewer Agent（质检）
  顺序协作 + 质检闭环，对应 LangChain4j 的 AiServices 组合
```

**话术**：
> "我们仓颉现在是 BPMN 确定性编排，节点是被动执行。如果要做多 Agent，我会分三步走：先给 LLM 节点加自检能力（最轻），再把分类器升级为 Router Agent（中等），最后才是完整的 Research-Writer-Reviewer 协作。每一步都有明确的业务价值，不会为了用多 Agent 而用。"

---

**与仓颉项目的关联**：

**仓颉的多节点工作流 vs 多 Agent 协作**：

| 维度 | 仓颉工作流 | 多 Agent 协作 |
|:-----|:----------|--------------|
| **节点类型** | 预定义节点（LLM、工具、条件路由等） | 自主 Agent（有记忆、规划能力） |
| **编排方式** | BPMN 流程图 | LangGraph/AutoGen 框架 |
| **智能程度** | 被动执行 | 主动规划 |
| **相似之处** | 都是 DAG（有向无环图）结构 | 都是 DAG 结构 |

**仓项目关联话术**：
> "我们仓颉平台的工作流引擎本质上是**顺序模式**的多节点协作：知识提取节点 → 条件路由节点 → LLM 生成节点 → 后处理节点。虽然不是严格意义上的多 Agent（因为节点没有自主规划能力），但协作模式是类似的：上游节点输出作为下游节点输入，形成数据流转链路。如果要升级为真正的多 Agent，需要给每个节点加上记忆模块和规划能力，让它们能自主决定下一步做什么。"

---

**面试回答模板（简洁版 - 30秒）**：
> "多 Agent 协作是让多个专业 Agent 分工合作，主流有顺序、并行、分层、路由、辩论五种模式。用 LangChain4j 可以用 AiServices 组合多个 Agent 接力执行，比如 Research Agent 检索 → Writer Agent 写作 → Reviewer Agent 质检。但多 Agent 不是越多越好——沟通成本是 O(N²)，错误会层层传播，业界经验 3-5 个 Agent 是甜蜜点。我们仓颉的 BPMN 工作流本质是顺序模式的多节点协作，区别是节点被动执行而 Agent 有自主判断能力。如果要演进，我会分三步：先给 LLM 节点加自检，再把分类器升级为 Router Agent，最后才是完整多 Agent 协作。"

**面试回答模板（详细版 - 2分钟，被追问时用）**：
> "多 Agent 协作解决的是单 Agent 能力有限、上下文窗口装不下复杂任务的问题。
>
> **协作模式**主要有五种：顺序（接力）、并行（同时跑再汇总）、分层（Manager 分配给 Worker）、路由（Router 分发）、辩论（多 Agent 讨论投票）。其中顺序和路由在企业里最常用。
>
> **Java 技术栈的实现**：用 LangChain4j 的 AiServices，定义多个专业 Agent 接口，通过接力编排。比如 Research Agent 用工具检索、Writer Agent 整理、Reviewer Agent 质检，不通过就回 Writer 重写形成闭环。这本质和仓颉的'知识检索节点→LLM 节点→条件路由节点'是对应的。
>
> **但多 Agent 有三大痛点**：一是沟通成本随 Agent 数量 O(N²) 增长；二是错误会传播放大；三是调试困难，需要全链路 trace。所以业界共识是 3-5 个 Agent 是甜蜜点，超过 7 个性价比急剧下降。
>
> **我们项目的演进规划**：现在 BPMN 是确定性编排，下一步我会先给 LLM 节点加自检能力做轻量 ReAct，再把分类器升级成 Router Agent 动态选策略，最后才是完整的多 Agent 协作。每一步都对应明确的业务价值，不为了用而用。"

