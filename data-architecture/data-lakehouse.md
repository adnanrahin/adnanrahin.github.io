---
layout: docs-section
title: Data Lakehouse
docs_slug: data-lakehouse
docs_title: Data Architecture
docs_base: /data-architecture/
docs_nav: data_architecture_nav
section_slug: data-architecture
description: Delta Lake, Iceberg, Hudi, medallion architecture, Unity Catalog, and unified BI + ML.
permalink: /data-architecture/data-lakehouse/
---
> **Goal:** One copy of data for BI, engineering, and ML - with ACID guarantees on lake storage.  
> **Rule:** The lakehouse fixes the two-tier problem; it does not remove the need for modeling in Gold.

A lakehouse keeps files on cheap object storage but adds **transactional table formats** (Delta Lake, Iceberg, Hudi) and **shared governance** (Unity Catalog, Lake Formation). You get lake economics without maintaining a separate warehouse copy. Background: [Data Warehouse](/data-architecture/data-warehouse/) · [Data Lake](/data-architecture/data-lake/).

---

## Walkthrough: the two-tier problem

Many teams end up running **both**:

- **Snowflake** (or Redshift) for finance dashboards - `fact_orders`, `dim_restaurant`, nightly ETL from Postgres
- **S3 + Spark** for data science - raw clickstreams, driver GPS, A/B test logs

```mermaid
flowchart TD
    PG["PostgreSQL<br/>live orders"]
    PG --> WH["Warehouse<br/>BI dashboards"]
    PG --> S3["S3 lake<br/>ML features"]
    WH <-->|"fragile sync ETL"| S3

    style WH fill:#E8F4FD,stroke:#4A90D9
    style S3 fill:#E8F8E8,stroke:#50C878
```

**Pain points that show up in production:**

- Order counts differ between the dashboard and the churn model (two pipelines, two definitions)
- Storage bill pays twice for overlapping history
- Incremental loads to S3 fail mid-write; downstream notebooks read half-updated partitions
- PII policy lives in the warehouse; the lake folder has open read access

**Lakehouse move:** Land Bronze on S3 as **Delta tables**, build Silver/Gold with DLT or Spark, point SQL Warehouse and notebooks at the same Gold `fact_orders`. Unity Catalog holds grants and lineage once.

---

## How it works

```mermaid
flowchart TD
    SRC["Sources"]
    ING["Ingestion"]
    OBJ[("S3 / ADLS<br/>Parquet files")]
    TF["Delta / Iceberg / Hudi<br/>transaction log"]
    MED["Bronze → Silver → Gold"]
    BI["SQL / BI"]
    ML["ML / features"]
    GOV["Unity Catalog"]

    SRC --> ING --> OBJ --> TF --> MED
    TF --> BI
    TF --> ML
    MED --- GOV

    style OBJ fill:#E8F8E8,stroke:#50C878
    style TF fill:#9B59B6,color:#fff
```

### What changed vs plain lake or warehouse

| Lake gap | Lakehouse fix |
|----------|---------------|
| Files in folders | **Tables** with ACID |
| Schema-on-read only | Schema enforcement + evolution |
| Weak catalog | Unity Catalog - grants, lineage |

| Warehouse gap | Lakehouse fix |
|---------------|---------------|
| Expensive storage at PB scale | S3/ADLS pricing |
| ML on a separate copy | Features on same Gold tables |
| Rigid ingest | ELT on elastic Spark/SQL |

Star schema and SCD still live in the **Gold layer** - see [Data Warehouse](/data-architecture/data-warehouse/).

---

## Building blocks

### Open table format (Delta Lake example)

Parquet files plus a `_delta_log/` of JSON commits = atomic writes, time travel, MERGE for CDC.

```mermaid
flowchart TD
    ROOT["orders/"]
    P1["part-00000.parquet"]
    P2["part-00001.parquet"]
    LOG["_delta_log/"]
    ROOT --> P1
    ROOT --> P2
    ROOT --> LOG
    style LOG fill:#9B59B6,color:#fff
```

### Medallion layers

| Layer | Example |
|-------|-------------------|
| **Bronze** | Raw Kafka events, Postgres CDC |
| **Silver** | Deduped orders, typed columns, PII hashed |
| **Gold** | `fact_orders` star schema for BI + ML features |

```mermaid
flowchart LR
    B["Bronze"] --> S["Silver"] --> G["Gold"]
    style B fill:#CD7F32,color:#fff
    style S fill:#C0C0C0,color:#333
    style G fill:#FFD700,color:#333
```

Pipelines (DLT, Airflow + Spark) enforce the layers - not folder naming alone.

### Shared compute on one storage layer

```mermaid
flowchart TD
    STORAGE[("S3 Delta tables")]
    SPARK["Spark<br/>engineering"]
    SQLW["SQL Warehouse<br/>BI"]
    NB["Notebooks<br/>ad hoc"]
    SPARK --> STORAGE
    SQLW --> STORAGE
    NB --> STORAGE
```

---

## Databricks as a reference stack

Not the only option, but the names map cleanly:

| Component | Role |
|-----------|------|
| **Delta Lake** | ACID on object storage |
| **Unity Catalog** | Permissions, lineage |
| **Jobs / DLT** | Medallion pipelines |
| **SQL Warehouses** | BI latency on Gold |
| **MLflow** | Models on same data |

---

## Honest trade-offs

- **Ops complexity** - file sizing, `OPTIMIZE`, Z-order, cluster sizing still matter
- **Migration cost** - moving off warehouse-only or swampy S3 takes planning
- **Not magic** - bad Gold modeling still produces bad dashboards

---

## Summary

| Idea | Remember |
|------|----------|
| **Two-tier problem** | Warehouse + lake = duplicate truth |
| **Table format** | Delta/Iceberg turns files into tables |
| **Medallion** | Bronze/Silver/Gold with enforced pipelines |
| **One catalog** | Same grants for BI and ML |

**In interviews, say something like:** *"Lakehouse means Parquet on S3 with ACID and a catalog - not a new database vendor, a storage pattern."*

**Back:** [Overview](/data-architecture/overview/)
