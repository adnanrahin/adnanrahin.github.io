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
> **Goal:** Land diverse data cheaply without modeling everything upfront.  
> **Rule:** A lake without ownership becomes a swamp - folders are not governance.

A lake is object storage (S3, ADLS, GCS) holding files as they arrive: Parquet exports, JSON event logs, CSV dumps, even images. You apply structure **when you read**, not when you write. Warehouse modeling is on the [Data Warehouse](/data-architecture/data-warehouse/) page; how lakes gained ACID and SQL is on [Data Lakehouse](/data-architecture/data-lakehouse/).

---

## Walkthrough: event data on a lake

A growing food-delivery app generates data the warehouse was never built to ingest on day one:

| Source | Format | Why not straight into the warehouse? |
|--------|--------|--------------------------------------|
| App clickstream | JSON | Schema changes every release |
| Driver location | High-volume events | Too expensive to model before use |
| Menu photos | JPEG on S3 | Unstructured |
| Nightly order export | Parquet | Already structured - but mixed with the above |

The lake path: dump everything under `s3://company-lake/raw/...`, spin up Spark when someone needs an analysis, shut compute down when done.

```mermaid
flowchart LR
    APP["Mobile app"] --> K["Kafka"]
    PG["PostgreSQL<br/>nightly export"] --> S3
    K --> S3["S3 raw zone"]
    S3 --> SPARK["Spark job<br/>on demand"]
    SPARK --> DS["Data science<br/>churn model"]

    style S3 fill:#E8F8E8,stroke:#50C878
```

**First win:** Data science gets raw events without waiting six weeks for a dimensional model.

**First pain point:** Three teams write `s3://.../customers/` differently. Nobody trusts the counts.

**Next step:** Either enforce zones and catalogs, or move toward a [lakehouse](/data-architecture/data-lakehouse/) with Delta tables and Unity Catalog.

---

## Architecture

```mermaid
flowchart LR
    subgraph Sources["Sources"]
        DB["Databases"]
        API["APIs"]
        LOG["Logs & streams"]
    end

    ING["Ingestion"]

    subgraph Lake["Object storage"]
        RAW["/raw/"]
        CUR["/curated/<br/>optional"]
    end

    subgraph Compute["Compute on demand"]
        SPARK["Spark / Trino"]
    end

    DB --> ING
    API --> ING
    LOG --> ING
    ING --> RAW
    RAW --> SPARK
    CUR --> SPARK

    style Lake fill:#E8F8E8,stroke:#50C878
```

| Piece | Role |
|-------|------|
| **Object storage** | The lake itself - durable, pennies per GB |
| **Ingestion** | Batch copy, Kafka/Kinesis streams, Fivetran-style loads |
| **Compute** | Spark, Trino, Hive - separate from storage, billed only when running |
| **Catalog (optional)** | Glue, Hive Metastore - otherwise you grep paths |

---

## Schema-on-read

Structure is inferred at query time, not enforced at landing.

```mermaid
flowchart LR
    JSON["JSON lands<br/>no schema check"]
    S3["Stored as bytes"]
    READ["Spark infers columns<br/>at read time"]
    JSON --> S3 --> READ
```

**Trade-off:** Fast ingest, slow trust. A field that was `string` last month becomes `int` this month and silently breaks downstream jobs.

---

## Storage vs compute

Object storage stays on 24/7. Clusters spin up, process, spin down. That separation is why lakes beat loading everything into a proprietary warehouse when volume spikes.

```mermaid
flowchart LR
    OS[("S3 / ADLS<br/>always on")]
    SC["Spark cluster<br/>on demand"]
    SC <-->|read / write| OS
```

---

## Informal zones (bronze / silver / gold)

Many teams use folder names as quality tiers - **not** enforced unless pipelines say so:

| Zone | Typical contents |
|------|------------------|
| **Bronze / raw** | As landed from source |
| **Silver** | Cleaned, deduped |
| **Gold** | Business-ready aggregates |

Unlike a [warehouse](/data-architecture/data-warehouse/), these are often just paths. The [lakehouse](/data-architecture/data-lakehouse/) makes them real tables with ACID.

---

## When lakes go wrong (the swamp)

| Symptom | What you see |
|---------|--------------|
| No ACID | Two jobs write the same partition; files corrupt |
| Small files | Millions of 4 KB objects; queries crawl |
| Duplicate "truth" | Ten definitions of `active_customer` |
| BI on raw JSON | Analysts wait minutes for a simple `GROUP BY` |

```mermaid
flowchart LR
    subgraph Good["Planned lake"]
        G1["Flexible"]
        G2["Cheap"]
    end
    subgraph Bad["Swamp"]
        B1["No owner"]
        B2["No catalog"]
        B3["Nobody trusts it"]
    end
    Good -.->|"no discipline"| Bad
```

That gap is why [lakehouses](/data-architecture/data-lakehouse/) exist - keep lake economics, add warehouse-grade tables and governance.

---

## Common stack

- **Storage:** S3, ADLS Gen2, GCS
- **Processing:** Spark, Trino
- **Catalogs:** Glue, Hive Metastore
- **Formats:** Parquet, ORC, Avro, JSON

---

## Summary

| Idea | Remember |
|------|----------|
| **Schema-on-read** | Ingest now, shape later |
| **Cheap scale** | Object storage + elastic compute |
| **Swamp risk** | No ACID, no catalog, no owners |
| **Exit ramp** | Delta/Iceberg + medallion → lakehouse |

**Closing thought:** A lake is the right first move when you have volume and variety you cannot model yet. It is the wrong final state if executives still need trusted revenue numbers without a governed Gold layer.

**Next:** [Data Lakehouse](/data-architecture/data-lakehouse/)
