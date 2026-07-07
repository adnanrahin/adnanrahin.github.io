---
layout: docs-section
title: Overview
docs_slug: overview
docs_title: Data Architecture
docs_base: /data-architecture/
docs_nav: data_architecture_nav
section_slug: data-architecture
description: Warehouse, lake, and lakehouse patterns — evolution, comparison, and where to start.
permalink: /data-architecture/overview/
---

These notes cover three data platform patterns that show up in almost every large company: the **warehouse**, the **lake**, and the **lakehouse**. Each has its own page so nothing gets repeated three times.

If you want the wiring diagram first, start with the [Architecture Map](/data-architecture/architecture-map/). Otherwise, pick a topic below.

| Topic | Page | What it covers |
|-------|------|----------------|
| Data Warehouse | [Data Warehouse](/data-architecture/data-warehouse/) | OLTP, OLAP, ETL/ELT, star/snowflake schema, SCD, Kimball |
| Data Lake | [Data Lake](/data-architecture/data-lake/) | Object storage, schema-on-read, ingestion, data swamp |
| Data Lakehouse | [Data Lakehouse](/data-architecture/data-lakehouse/) | Delta/Iceberg/Hudi, medallion layers, Unity Catalog |

---

## Why all three exist

Every team needs to store, process, and analyze data. No single design has nailed all three at once — the industry moved in waves, each wave fixing the last problem and creating a new one.

| Era | Pattern | What it fixed | What it left open |
|-----|---------|---------------|-------------------|
| 1990s–2000s | [Data Warehouse](/data-architecture/data-warehouse/) | Reliable BI and SQL on structured business data | Too expensive and rigid for logs, JSON, IoT, and ML |
| 2010s | [Data Lake](/data-architecture/data-lake/) | Cheap storage for any data type at scale | Weak governance, no ACID — often a data swamp |
| 2020s | [Data Lakehouse](/data-architecture/data-lakehouse/) | Lake economics plus warehouse-grade trust | Still takes a skilled team to run well |

```mermaid
flowchart LR
    P1["Need trusted BI"] --> DW["Data Warehouse"]
    DW -->|"too rigid and costly"| P2["Need cheap scale"]
    P2 --> DL["Data Lake"]
    DL -->|"no governance, no ACID"| P3["Need both"]
    P3 --> LH["Data Lakehouse"]

    style DW fill:#4A90D9,color:#fff
    style DL fill:#50C878,color:#fff
    style LH fill:#9B59B6,color:#fff
```

**Warehouse** — OLTP runs the business, but it cannot power company-wide reporting. The warehouse copies that data into an OLAP store with fact/dimension models so analysts share one view of revenue, customers, and KPIs.

**Lake** — warehouses could not keep up on volume, cost, or new data types (clickstreams, APIs, images). Lakes landed everything cheaply on object storage (S3, ADLS) with schema-on-read: store now, shape later.

**Lakehouse** — many teams ran both, syncing a warehouse for BI and a lake for ML. Duplicate copies, duplicate cost, no single source of truth. Lakehouses added ACID table formats (Delta Lake, Iceberg) and unified governance (Unity Catalog) on lake storage so BI, engineering, and ML read the same data.

These are stages of the same story, not competing products. Platforms like Databricks bet on the lakehouse; understanding the warehouse and lake explains why.

---

## Quick comparison

| | Data Warehouse | Data Lake | Data Lakehouse |
|---|----------------|-----------|----------------|
| **Goal** | Fast, reliable analytics on structured data | Store any data cheaply at scale | One platform for analytics, ML, and pipelines |
| **Data types** | Mostly tables | Structured, semi-structured, unstructured | All types |
| **Storage** | Proprietary DB storage (often expensive) | Object storage (S3, ADLS, GCS) | Object storage |
| **Schema** | Schema-on-write | Schema-on-read | Enforced when you need it |
| **ACID** | Yes (native) | No (by default) | Yes (Delta, Iceberg, Hudi) |
| **Governance** | Strong | Weak (swamp risk) | Strong (Unity Catalog, etc.) |
| **Best for** | BI, SQL dashboards | Ingestion, exploration, ML | BI + ML + engineering on one copy |
| **Typical users** | Analysts, business teams | Engineers, data scientists | Everyone on a governed platform |

---

## Reading order

1. [Architecture Map](/data-architecture/architecture-map/) — where components sit and how they connect
2. [Data Warehouse](/data-architecture/data-warehouse/) — OLTP, OLAP, ETL, dimensional modeling
3. [Data Lake](/data-architecture/data-lake/) — object storage, schema-on-read, the swamp problem
4. [Data Lakehouse](/data-architecture/data-lakehouse/) — Delta Lake, medallion, unified BI + ML
