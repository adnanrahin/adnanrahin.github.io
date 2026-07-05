---
title: Spark ETL — RDD vs DataFrame
date: 2026-01-10
description: Choosing the right Spark API for batch pipelines — performance, readability, and maintenance.
tags: [spark, etl, pyspark]
---

Spark offers multiple APIs. Pick based on team skills, optimization needs, and pipeline age.

## Comparison

| | RDD | DataFrame / Dataset |
|---|-----|---------------------|
| **Optimization** | Manual | Catalyst optimizer |
| **Type safety** | Runtime | Compile-time (Dataset) |
| **Readability** | Verbose | SQL-like, declarative |
| **Best for** | Legacy pipelines, fine control | New ETL, analytics |

## Cache-aside at pipeline level

For hot intermediate results:

```python
df = spark.read.parquet("s3://lake/raw/events/")
df = df.filter(col("date") >= "2026-01-01").cache()
df.count()  # materialize cache
df.write.mode("overwrite").parquet("s3://lake/curated/events/")
```

## Staff-level framing

When migrating Pig/Hive → Spark, measure **cost per TB** and **runtime SLA** — not just "it compiles." Document the abstraction your framework provides so the next engineer does not re-learn RDD internals.
