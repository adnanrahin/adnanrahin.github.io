---
layout: docs-section
title: Overview
docs_slug: overview
docs_title: Data Architecture
docs_base: /data-architecture/
docs_nav: data_architecture_nav
section_slug: data-architecture
description: Warehouse, lake, and lakehouse patterns - evolution, comparison, and where to start.
permalink: /data-architecture/overview/
---
> **Goal:** Understand why warehouses, lakes, and lakehouses exist - and when to reach for each.  
> **Rule:** Pick the pattern that matches your workload, not the vendor slide deck.

Most teams outgrow a single Postgres instance for reporting. The question is not "warehouse or lake?" but **which problem you are solving right now**: trusted BI on structured history, cheap storage for messy data, or both on one platform.

Start with the [Architecture Map](/data-architecture/architecture-map/) if you want the wiring diagram first. Otherwise jump straight to a topic:

| Topic | Page | Covers |
|-------|------|--------|
| Data Warehouse | [Data Warehouse](/data-architecture/data-warehouse/) | OLTP, OLAP, ETL, star schema, Kimball |
| Data Lake | [Data Lake](/data-architecture/data-lake/) | S3/ADLS, schema-on-read, data swamp |
| Data Lakehouse | [Data Lakehouse](/data-architecture/data-lakehouse/) | Delta/Iceberg, medallion, Unity Catalog |

---

## Three waves, one story

| Era | Pattern | Fixed | Left open |
|-----|---------|-------|-----------|
| 1990s-2000s | [Warehouse](/data-architecture/data-warehouse/) | Reliable SQL BI on structured data | Too rigid and costly for logs, JSON, ML |
| 2010s | [Lake](/data-architecture/data-lake/) | Cheap storage for any format at scale | Weak governance, no ACID - swamps |
| 2020s | [Lakehouse](/data-architecture/data-lakehouse/) | Lake cost + warehouse trust | Still ops-heavy |

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

**Warehouse** - OLTP runs checkout and inventory; the warehouse copies that history into fact/dimension tables so finance and ops share one definition of revenue.

**Lake** - clickstreams, driver GPS pings, and menu JSON do not fit a star schema on day one. Land them on S3, shape them later.

**Lakehouse** - running a warehouse *and* a lake means two copies, two pipelines, two governance models. Table formats (Delta, Iceberg) plus a catalog (Unity) let BI and ML read the same Parquet.

---

## Quick comparison

| | Warehouse | Lake | Lakehouse |
|---|-----------|------|-----------|
| **Storage** | Managed columnar DB | Object storage (S3, ADLS) | Object storage |
| **Schema** | On write | On read | Enforced when needed |
| **ACID** | Native | No (raw files) | Via Delta/Iceberg/Hudi |
| **Best for** | Dashboards, SQL KPIs | Ingestion, ML, exploration | All of the above, one copy |
| **Typical pain** | Cost at PB scale | Data swamp | Cluster tuning, migration |

---

## Suggested reading order

1. [Architecture Map](/data-architecture/architecture-map/)
2. [Data Warehouse](/data-architecture/data-warehouse/)
3. [Data Lake](/data-architecture/data-lake/)
4. [Data Lakehouse](/data-architecture/data-lakehouse/)

**In interviews, say something like:** *"I start with the consumer - BI needs modeled tables, ML needs raw features. That tells me warehouse, lake, or lakehouse - not the other way around."*
