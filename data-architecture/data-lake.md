---
layout: docs-section
title: Data Lake
docs_slug: data-lake
docs_title: Data Architecture
docs_base: /data-architecture/
docs_nav: data_architecture_nav
section_slug: data-architecture
description: Object storage, schema-on-read, ingestion, informal medallion zones, and the data swamp problem.
permalink: /data-architecture/data-lake/
---
> **Scope:** This document covers **data lake** topics only — object storage, schema-on-read, ingestion, storage/compute separation, informal medallion zones, and the data swamp problem.
>
> For **warehouse fundamentals** (OLTP, OLAP, star schema, etc.) → [data-warehouse.md](/data-architecture/data-warehouse/) · For **lakehouse** → [data-lakehouse.md](/data-architecture/data-lakehouse/)

A **data lake** is a centralized repository that stores **raw data in its native format** at **massive scale**, typically on **cheap cloud object storage** (S3, ADLS, GCS).

Think of it as a **giant shared drive for all company data** — structured tables, JSON logs, CSV exports, images, videos, and more — without forcing everything into one rigid schema upfront.

---

## What problem it solved

[Data warehouses](/data-architecture/data-warehouse/) were too slow and expensive to onboard new data types. Meanwhile, companies were generating huge volumes of:

- Web and mobile clickstreams
- IoT sensor readings
- Application logs
- JSON from APIs
- Data science experiments

The lake answered:

> "Store everything cheaply now; figure out how to use it later."

---

## How it works (architecture)

```mermaid
flowchart LR
    subgraph Sources["Source Systems"]
        DB["Databases"]
        API["APIs"]
        LOG["Logs & Streams"]
        FILES["Files & Media"]
    end

    ING["Ingestion<br/><i>batch or streaming</i>"]

    subgraph Lake["Data Lake — Object Storage"]
        RAW["/raw/orders/2024/01/"]
        EVENTS["/raw/events/json/"]
        IMG["/raw/images/"]
        CUR["/curated/<br/><i>optional</i>"]
        RAW --> CUR
        EVENTS --> CUR
    end

    subgraph Consumers["Consumers"]
        SPARK["Spark Jobs"]
        DS["Data Scientists"]
        ML["ML Training"]
    end

    DB --> ING
    API --> ING
    LOG --> ING
    FILES --> ING
    ING --> RAW
    ING --> EVENTS
    ING --> IMG
    CUR --> SPARK
    CUR --> DS
    CUR --> ML

    style Lake fill:#E8F8E8,stroke:#50C878
```

### Key components

| Component | Role |
|-----------|------|
| **Object storage** | Durable, low-cost files (the lake itself) |
| **Ingestion** | Batch uploads, streaming (Kafka/Kinesis), copy jobs |
| **Processing engine** | Spark, Presto/Trino, Hive — read files and run transformations |
| **Catalog (optional)** | Hive Metastore, AWS Glue — track what files mean |
| **Zones / folders** | Often `raw`, `processed`, `curated` — informal layering |

---

## Core characteristics

### 1. Schema-on-read
Structure is applied **when you query**, not when you store.

```mermaid
flowchart LR
    JSON["JSON file lands in lake<br/><i>no schema enforced</i>"]
    STORE["Stored as-is<br/><i>raw bytes on S3/ADLS</i>"]
    READ["Spark / SQL reads later<br/><i>infers structure at query time</i>"]
    JSON --> STORE --> READ

    style STORE fill:#FFF3CD,stroke:#856404
```

**Benefit:** Ingest fast; no upfront modeling.  
**Trade-off:** Easy to accumulate messy, undocumented, duplicate data.

### 2. Store any data type
- Structured: Parquet, CSV, ORC
- Semi-structured: JSON, XML, Avro
- Unstructured: images, PDFs, video, audio

### 3. Decouple storage and compute
Storage is cheap and always on. Compute clusters spin up only when needed, process files, then shut down. This is the foundation of modern cloud data platforms.

```mermaid
flowchart LR
    OS[("Object Store<br/><b>always on</b><br/>S3 / ADLS / GCS")]
    SC["Spark Cluster<br/><b>on demand</b><br/>spin up → process → shut down"]

    SC <-->|"read / write"| OS

    style OS fill:#E8F8E8,stroke:#50C878
    style SC fill:#E8F4FD,stroke:#4A90D9
```

### 4. Scale-out by design
Add more files and more machines — no single database server to upgrade.

### 5. Great for exploration and ML
Data scientists can access raw data, build features, train models, and experiment without waiting for a warehouse modeling cycle.

---

## Common layering (informal medallion)

Many lakes adopt folder-based zones — not always enforced:

| Zone | Contents |
|------|----------|
| **Raw / Bronze** | Data as landed from source |
| **Processed / Silver** | Cleaned, deduplicated, joined |
| **Curated / Gold** | Business-ready datasets |

Unlike a [data warehouse](/data-architecture/data-warehouse/), these zones are often **just directories** with weak enforcement.

```mermaid
flowchart LR
    B["Bronze / Raw<br/><i>as landed</i>"]
    S["Silver / Processed<br/><i>cleaned & joined</i>"]
    G["Gold / Curated<br/><i>business-ready</i>"]
    B --> S --> G

    style B fill:#CD7F32,color:#fff
    style S fill:#C0C0C0,color:#333
    style G fill:#FFD700,color:#333
```

---

## Strengths

- **Low cost at scale** — object storage is pennies per GB
- **Flexibility** — any format, any schema, fast ingestion
- **One copy for many workloads** — engineering, science, and ad-hoc exploration
- **ML-ready** — raw features and unstructured data stay accessible

---

## Problems (the "data swamp")

Without strict governance, lakes often failed to deliver the trust that [warehouses](/data-architecture/data-warehouse/) provide natively:

| Problem | What happens |
|---------|--------------|
| **No ACID** | Concurrent writes corrupt files; partial updates leave bad state |
| **Small files** | Millions of tiny files → slow queries |
| **No single truth** | Ten teams create ten versions of "customers" |
| **Poor performance for BI** | SQL on raw files is slow without heavy optimization |
| **Weak governance** | Who owns this folder? Who can see PII? Hard to audit |
| **Schema drift** | Same JSON field changes type; downstream jobs break silently |

```mermaid
flowchart LR
    subgraph Intended["Intended: Data Lake"]
        I1["Flexible"]
        I2["Cheap"]
        I3["Powerful"]
    end

    subgraph Reality["Reality: Data Swamp"]
        R1["No ACID"]
        R2["No governance"]
        R3["Nobody trusts it"]
    end

    Intended -.->|"without discipline"| Reality

    style Intended fill:#E8F8E8,stroke:#50C878
    style Reality fill:#FFE0E0,stroke:#C0392B
```

This gap — lake flexibility without warehouse reliability — is what the [lakehouse](/data-architecture/data-lakehouse/) was built to close.

---

## Examples (technologies)

- **Storage:** Amazon S3, Azure Data Lake Storage Gen2, Google Cloud Storage
- **Processing:** Apache Spark, Hadoop MapReduce, Presto/Trino
- **Catalogs:** Hive Metastore, AWS Glue Data Catalog
- **Formats:** Parquet, ORC, Avro, JSON (files on object storage)

---

## How the lake differs from a warehouse

This section covers **only the lake side**. Full warehouse depth (OLTP/OLAP, star schema, ETL, Kimball, Snowflake platform, etc.) lives in [data-warehouse.md](/data-architecture/data-warehouse/).

| Lake trait | Warehouse trait (see other doc) |
|------------|--------------------------------|
| Schema-on-read | Schema-on-write |
| Cheap object storage (S3, ADLS) | Proprietary / managed DB storage |
| Any data type | Mostly structured tables |
| Weak governance by default | Strong governance natively |
| Best for engineering & ML | Best for BI & SQL dashboards |

Many enterprises ran **both** in parallel — see the two-tier problem in [data-lakehouse.md](/data-architecture/data-lakehouse/).

---

## One-sentence summary

> A **data lake** is cheap, scalable storage for all data types with flexible schema-on-read — but without extra layers it often lacks the reliability, performance, and governance that [warehouses](/data-architecture/data-warehouse/) provide.

**Next:** [Data Lakehouse](/data-architecture/data-lakehouse/) — how lake storage gained warehouse capabilities.
