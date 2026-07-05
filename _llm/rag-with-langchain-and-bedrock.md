---
title: RAG Pipeline with LangChain and Bedrock
date: 2026-02-15
description: A practical pattern for retrieval-augmented generation — chunking, embeddings, and text-to-SQL.
tags: [rag, langchain, bedrock]
---

Retrieval-Augmented Generation (RAG) grounds LLM responses in your own data instead of relying on model memory alone.

## Architecture

```
User query → Embed → Vector search → Retrieved chunks → LLM prompt → Answer
```

## Key decisions

| Decision | Trade-off |
|----------|-----------|
| **Chunk size** | Smaller = precise retrieval; larger = more context per chunk |
| **Embedding model** | Quality vs cost/latency |
| **Top-k retrieval** | More chunks = richer context but higher token cost |

## Text-to-SQL pattern

For analytics use cases (like Genelytics-AI):

1. Index schema metadata and sample queries
2. Retrieve relevant tables/columns on each question
3. Prompt the LLM to generate SQL against retrieved context only
4. Validate and execute with read-only credentials

This reduces hallucinated table names and improves answer accuracy on structured data.
