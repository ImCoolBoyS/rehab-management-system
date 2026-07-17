# AI Agent 核心概念详解（用你的系统举例）

---

## 一、为什么是 RAG？

### RAG = Retrieval-Augmented Generation（检索增强生成）

**本质**：让 LLM 在回答前，先查你的数据库/文档，再基于查到的内容回答。

### 在你的系统里，RAG 解决什么问题？

假设你问 AI："2024 年 3 月基线评估低于 60 分的学员有哪些？"

**如果不做 RAG（纯 LLM）**：
LLM 只能凭训练数据中的记忆回答 → 大概率编造/幻觉。因为你的学员数据是私有数据，LLM 没训练过。

**如果只做 SQL 查询（规则引擎）**：
能查出准确数据，但只会返回表格，无法理解上下文。问"为什么这些学员评分低？"就答不上来。

**RAG 的做法 = SQL 查询 + LLM 理解**：
```
第一步（检索/查询）：你的 SQL 引擎查出 12 名学员的数据
    → [张三, ADL=45], [李四, SDSS=12], ...
第二步（生成）：把这 12 条数据作为"上下文"发给 LLM
    → LLM 基于真实数据生成分析："这 12 名学员中，ADL 评分普遍偏低..."
```

### RAG 的三段式
```
用户提问 → 检索（SQL/向量） → 增强（拼入Prompt） → 生成（LLM回答）
```

> 为什么第一阶段用规则引擎而不是 RAG？
> 因为你的数据全是结构化的（PostgreSQL 表格），直接用 SQL 查更准更快。
> RAG 主要用于非结构化数据（政策文档、评估标准 PDF、病历文本）。

---

## 二、什么是 LangChain？

### 一句话本质

**LangChain 是一个 LLM 应用开发框架**，就像 FastAPI 之于 Web 开发。
它解决的核心问题是：把 LLM 和各种工具粘在一起。

### 不用框架 vs 用框架

**不用 LangChain（自己手写）**：
你需要自己处理：Prompt 模板、上下文管理、重试、流式输出、工具调用...

**用了 LangChain**：
```python
from langchain import ...
chain = load_sql_tools(db) | memory_manager() | llm_chat(model="gpt")
result = chain.invoke("哪些学员评估分数低？")
```

### LangChain 的核心组件

| 组件 | 说明 | 在你的项目里对应 |
|------|------|----------------|
| Prompt Templates | 提示词模板 | 你的系统提示词 |
| Memory | 对话历史管理 | 多轮对话上下文 |
| Tools | 工具函数定义 | SQL 查询函数、API 调用 |
| Agents | 自主决策循环 | 意图识别 → 执行 → 反馈 |
| Chains | 处理流水线 | 输入 → 处理 → 输出 |
| Retrievers | 检索器 | 从 DB/文档中查数据 |

---

## 三、有哪些主流框架？（对比表）

| 框架 | 定位 | 适合场景 | 学习曲线 | 你的选择 |
|------|------|---------|---------|---------|
| LangChain | 全能型 LLM 框架 | 企业级、RAG、Agent | ⭐⭐⭐ | 推荐第二阶段用 |
| LangGraph | 图状 Agent 工作流 | 多 Agent 协作、复杂流程 | ⭐⭐⭐⭐ | 第三阶段用 |
| CrewAI | 多 Agent 分工 | 团队式协作（角色分配） | ⭐⭐ | 适合报告生成场景 |
| AutoGen | 多 Agent 对话 | 对话式多 Agent | ⭐⭐⭐ | 微软出品，适合研究 |
| Semantic Kernel | 微软的 LLM 框架 | .NET 生态、企业集成 | ⭐⭐ | 你是 Python 栈，先跳过 |
| Vercel AI SDK | 前端 AI SDK | React 流式输出 | ⭐ | 推荐前端接入用 |
| FastAPI + 自研 | 轻量级自建 | 小而精、完全可控 | ⭐ | 你现在正在做的 |

### 对你来说最务实的选型

```
第一阶段（现在）：FastAPI + 自研规则引擎
  └─ 零成本、完全可控、够用

第二阶段（1-2天）：接入 LangChain 作为 LLM 层
  └─ 主要用：Prompt Template + Memory + Tools

第三阶段（3-5天）：LangGraph 做 Multi-Agent
  └─ 分析师 Agent → 报告 Agent → 审核 Agent
```

---

## 四、用一个实际例子串联所有概念

### 场景：社工问 AI 助手

"帮我分析一下测试1镇最近三个月的康复训练效果"

### 完整的处理流程

```
① 意图识别（你的规则引擎）
   → 匹配到：训练效果分析 + 测试1镇 + 最近三个月

② 数据检索（RAG 的"检索"阶段）
   → SQL 查出 45 条训练记录

③ 上下文构建
   → 把 45 条记录摘要 + 训练类型分布 + 时长统计 拼成一段文本

④ LLM 生成（LangChain 处理）
   → 你的系统 Prompt + 检索到的数据 → LLM
   → LLM 输出结构化分析报告

⑤ 流式返回（SSE）
   → 前端逐字显示，打字机效果
```

### 这里面的关键点

| 你的项目里做了 | 对应行业术语 |
|--------------|------------|
| 关键词匹配用户问题 | 意图识别 / Intent Classification |
| 根据意图生成 SQL 查询 | 工具调用 / Function Calling |
| 把查询结果发给 LLM | RAG / 检索增强生成 |
| LLM 根据数据生成回答 | 生成 / Generation |
| 多轮对话上下文 | 记忆 / Memory |
| 打字机效果输出 | 流式 / Streaming |

---

## 五、一句话总结

| 概念 | 一句话 |
|------|--------|
| RAG | 先查数据库再让 LLM 回答，保证答案有依据、不瞎编 |
| LangChain | LLM 应用的"胶水框架"，帮你把 Prompt/记忆/工具/模型粘在一起 |
| Agent | LLM 自己决定"下一步做什么"——查 DB？算数据？写报告？ |
| Function Calling | 让 LLM 能调用你的 SQL/API 函数 |
| Streaming | 打字机效果输出，用户体验更好 |
