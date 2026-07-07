---
layout: docs-section
title: Architecture Map
docs_slug: architecture-map
docs_title: Data Architecture
docs_base: /data-architecture/
docs_nav: data_architecture_nav
section_slug: data-architecture
description: End-to-end component diagram — where every layer sits and how they connect.
permalink: /data-architecture/architecture-map/
---

This page is the map — where each component lives and how data moves from source systems to dashboards. Read it once, then jump to the topic pages for depth.

| Page | Topics |
|------|--------|
| [Data Warehouse](/data-architecture/data-warehouse/) | OLTP, OLAP, ETL, fact/dimension, star/snowflake schema |
| [Data Lake](/data-architecture/data-lake/) | Object storage, schema-on-read, data swamp |
| [Data Lakehouse](/data-architecture/data-lakehouse/) | Delta Lake, medallion, Unity Catalog |

---

## 1. The full journey (left → right)

One line from live transactions to business insight:

```mermaid
flowchart LR
    OLTP["① OLTP<br/><i>live transactions</i>"]
    ETL["② ETL / ELT<br/><i>extract · transform · load</i>"]
    STORE["③ Storage<br/><i>warehouse / lake / lakehouse</i>"]
    MODEL["④ Model<br/><i>facts · dims · medallion</i>"]
    GOV["⑤ Governance<br/><i>access · lineage</i>"]
    OUT["⑥ Output<br/><i>BI · ML · reports</i>"]

    OLTP --> ETL --> STORE --> MODEL --> GOV --> OUT

    style OLTP fill:#FFE0E0,stroke:#C0392B
    style ETL fill:#FFF3CD,stroke:#856404
    style STORE fill:#E8F4FD,stroke:#4A90D9
    style MODEL fill:#E8D4F8,stroke:#7D3C98
    style GOV fill:#F0E6FF,stroke:#9B59B6
    style OUT fill:#D5F5E3,stroke:#27AE60
```

| Step | Component | What happens |
|------|-----------|--------------|
| ① | **OLTP** | Apps record orders, payments, logins in real time |
| ② | **ETL / ELT** | Data is copied, cleaned, and reshaped |
| ③ | **Storage** | Data lands in a warehouse, lake, or lakehouse |
| ④ | **Model** | Facts, dimensions, bronze/silver/gold layers |
| ⑤ | **Governance** | Permissions, catalog, lineage, audit |
| ⑥ | **Output** | Dashboards, SQL reports, ML models |

---

## 2. Layer stack — where components sit

Vertical view: each layer has a job. Data flows **down through ingestion**, sits in **storage**, is shaped by **modeling**, controlled by **governance**, and consumed at the top.

```mermaid
flowchart TB
    subgraph L6["⑥ CONSUMPTION — who uses the data"]
        direction LR
        BI["BI & Dashboards<br/>Tableau, Power BI"]
        SQL["SQL Analysts"]
        ML["ML & Data Science"]
    end

    subgraph L5["⑤ GOVERNANCE — who can see what"]
        UC["Unity Catalog / Warehouse ACLs<br/><i>permissions · lineage · audit</i>"]
    end

    subgraph L4["④ MODELING — how data is organized"]
        direction LR
        FACT["Fact tables<br/><i>how much</i>"]
        DIM["Dimension tables<br/><i>who / what / when</i>"]
        STAR["Star / Snowflake schema"]
        MED["Medallion<br/>Bronze → Silver → Gold"]
    end

    subgraph L3["③ STORAGE — where data lives"]
        direction LR
        WH["Data Warehouse<br/><i>OLAP · columnar</i>"]
        LAKE["Data Lake<br/><i>S3 / ADLS / GCS</i>"]
        LH["Lakehouse<br/><i>Delta / Iceberg on object storage</i>"]
    end

    subgraph L2["② INGESTION — how data moves in"]
        ETL["ETL / ELT pipeline<br/><i>Extract → Transform → Load</i>"]
        STG["Staging area<br/><i>temporary landing</i>"]
    end

    subgraph L1["① SOURCES — where data is born"]
        direction LR
        OLTP["OLTP databases<br/>PostgreSQL, SAP, CRM"]
        API["APIs & SaaS"]
        LOG["Logs, IoT, files"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6

    style L1 fill:#FFE0E0,stroke:#C0392B
    style L2 fill:#FFF3CD,stroke:#856404
    style L3 fill:#E8F4FD,stroke:#4A90D9
    style L4 fill:#E8D4F8,stroke:#7D3C98
    style L5 fill:#F0E6FF,stroke:#9B59B6
    style L6 fill:#D5F5E3,stroke:#27AE60
```

---

## 3. Data warehouse path — internal wiring

How warehouse-specific components connect. Full detail → [Data Warehouse](/data-architecture/data-warehouse/).

```mermaid
flowchart TB
    subgraph SOURCES["Sources"]
        OLTP2["OLTP<br/><i>PostgreSQL, SAP, CRM</i>"]
    end

    subgraph INGEST2["Ingestion"]
        ETL2["ETL / ELT"]
        STG2["Staging<br/><i>raw landing</i>"]
        ETL2 --> STG2
    end

    subgraph OLAP_BOX["Data Warehouse = OLAP system"]
        direction TB
        ENGINE["OLAP engine<br/><i>columnar · MPP</i>"]

        subgraph SCHEMA["Dimensional model"]
            direction LR
            FACT2["Fact tables<br/><i>amount, quantity</i>"]
            DIM2["Dimension tables<br/><i>product, date, customer</i>"]
        end

        subgraph MARTS["Data marts"]
            SM["Sales mart"]
            FM["Finance mart"]
        end

        STAR2["Star / Snowflake schema"]
        ENGINE --> SCHEMA
        SCHEMA --> STAR2
        STAR2 --> MARTS
    end

    subgraph OUT2["Output"]
        BI2["BI dashboards"]
        RPT["Reports & KPIs"]
    end

    OLTP2 -->|"copy only<br/>never query directly"| ETL2
    STG2 --> ENGINE
    MARTS --> BI2
    MARTS --> RPT

    style OLTP2 fill:#FFE0E0,stroke:#C0392B
    style OLAP_BOX fill:#E8F4FD,stroke:#4A90D9
    style OUT2 fill:#D5F5E3,stroke:#27AE60
```

### Warehouse component reference

| Component | Sits at | Connected to | Role |
|-----------|---------|--------------|------|
| **OLTP** | Source layer | → ETL | Live transaction data (input) |
| **ETL / ELT** | Ingestion layer | OLTP → Staging | Extract, transform, load |
| **Staging** | Ingestion layer | → OLAP engine | Temporary raw landing |
| **OLAP engine** | Storage layer | Fact + Dim tables | Analytics-optimized compute + storage |
| **Fact table** | Model layer | Dimensions via keys | Numbers — how much, how many |
| **Dimension table** | Model layer | Facts via keys | Labels — who, what, when, where |
| **Star / Snowflake schema** | Model layer | Facts + Dims | Layout of the dimensional model |
| **Data mart** | Model layer | → BI | Department-specific subset |
| **BI / Reports** | Consumption layer | ← Data marts | Dashboards, KPIs (output) |

---

## 4. Data lake path — internal wiring

Lake-specific components. Full detail → [Data Lake](/data-architecture/data-lake/).

```mermaid
flowchart TB
    subgraph SRC3["Sources"]
        direction LR
        DB["Databases"]
        API3["APIs"]
        FILES["Files & logs"]
    end

    subgraph ING3["Ingestion"]
        BATCH["Batch upload"]
        STREAM["Streaming<br/>Kafka, Kinesis"]
    end

    subgraph LAKE3["Data Lake — Object Storage"]
        RAW3["/raw/<br/><i>as landed</i>"]
        PROC3["/processed/<br/><i>optional</i>"]
        CUR3["/curated/<br/><i>optional</i>"]
        RAW3 --> PROC3 --> CUR3
    end

    subgraph COMPUTE3["Compute — on demand"]
        SPARK3["Spark / Trino<br/><i>spin up · process · shut down</i>"]
    end

    subgraph USE3["Consumers"]
        DS3["Data scientists"]
        ML3["ML training"]
    end

    SRC3 --> ING3 --> RAW3
    LAKE3 <-->|read / write| COMPUTE3
    COMPUTE3 --> USE3
    CUR3 --> USE3

    style LAKE3 fill:#E8F8E8,stroke:#50C878
    style COMPUTE3 fill:#E8F4FD,stroke:#4A90D9
```

---

## 5. Lakehouse path — unified wiring (modern)

How lake + warehouse capabilities merge on one platform. Full detail → [Data Lakehouse](/data-architecture/data-lakehouse/).

```mermaid
flowchart TB
    subgraph SRC4["Sources"]
        OLTP4["OLTP"]
        FILES4["Files & streams"]
    end

    ING4["Ingestion"]

    subgraph STORAGE4["Object Storage — S3 / ADLS / GCS"]
        PARQUET["Parquet files"]
    end

    subgraph TABLE_FMT["Table format layer"]
        DELTA["Delta Lake / Iceberg / Hudi<br/><i>ACID · transaction log</i>"]
    end

    subgraph MED4["Medallion — governed layers"]
        B["Bronze<br/><i>raw</i>"]
        S["Silver<br/><i>cleaned</i>"]
        G["Gold<br/><i>BI-ready · star schema</i>"]
        B --> S --> G
    end

    subgraph GOV4["Governance"]
        UC4["Unity Catalog<br/><i>catalog.schema.table</i>"]
    end

    subgraph COMPUTE4["Compute — shared storage"]
        direction LR
        SPARK4["Spark<br/><i>engineering</i>"]
        SQLW["SQL Warehouse<br/><i>BI queries</i>"]
        NB4["Notebooks"]
        SERVE4["Model serving"]
    end

    subgraph USE4["Consumers"]
        direction LR
        BI4["BI dashboards"]
        ML4["ML / features"]
        PIPE4["Pipelines / DLT"]
    end

    SRC4 --> ING4 --> STORAGE4 --> TABLE_FMT --> MED4
    MED4 --- GOV4
    TABLE_FMT --> COMPUTE4
    COMPUTE4 --> USE4
    GOV4 --> USE4

    style STORAGE4 fill:#E8F8E8,stroke:#50C878
    style TABLE_FMT fill:#9B59B6,color:#fff
    style MED4 fill:#E8D4F8,stroke:#7D3C98
    style GOV4 fill:#F0E6FF,stroke:#9B59B6
    style USE4 fill:#D5F5E3,stroke:#27AE60
```

### Where warehouse concepts sit inside a lakehouse

| Warehouse concept | Lakehouse location |
|-------------------|-------------------|
| OLTP (source) | Same — feeds ingestion |
| ETL / ELT | Pipelines, DLT, Jobs |
| OLAP engine | SQL Warehouse + Spark |
| Fact / Dimension tables | **Gold layer** (star schema) |
| Data marts | Gold schemas per department |
| BI output | Dashboards query Gold via SQL Warehouse |

---

## 6. All three paradigms — side by side

Same sources, three different architecture choices (and why lakehouse replaced the two-tier split):

```mermaid
flowchart TB
    SRC["Source Systems<br/>OLTP · APIs · Logs"]

    subgraph PATH1["Path A — Data Warehouse"]
        direction TB
        ETL_W["ETL / ELT"]
        WH_W["Warehouse / OLAP"]
        FD["Facts + Dimensions"]
        BI_W["BI & SQL"]
        SRC --> ETL_W --> WH_W --> FD --> BI_W
    end

    subgraph PATH2["Path B — Data Lake"]
        direction TB
        ING_L["Ingestion"]
        S3_L["Object storage"]
        SPARK_L["Spark compute"]
        ML_L["ML & exploration"]
        SRC --> ING_L --> S3_L --> SPARK_L --> ML_L
    end

    subgraph PATH3["Path C — Data Lakehouse"]
        direction TB
        ING_H["Ingestion"]
        OBJ_H["Object storage"]
        DELTA_H["Delta / Iceberg"]
        MED_H["Bronze → Silver → Gold"]
        ALL_H["BI + ML + Engineering"]
        SRC --> ING_H --> OBJ_H --> DELTA_H --> MED_H --> ALL_H
    end

    PATH1 -.-x|"two-tier problem<br/>duplicate copies"| PATH2

    style PATH1 fill:#E8F4FD,stroke:#4A90D9
    style PATH2 fill:#E8F8E8,stroke:#50C878
    style PATH3 fill:#F0E6FF,stroke:#9B59B6
```

---

## 7. Star schema — fact & dimension seating

Where fact and dimension tables sit inside the warehouse model:

```mermaid
flowchart TD
    subgraph DIMS["Dimension tables — the context"]
        direction LR
        DD["dim_date<br/><i>when</i>"]
        DP["dim_product<br/><i>what</i>"]
        DC["dim_customer<br/><i>who</i>"]
        DS["dim_store<br/><i>where</i>"]
    end

    FACT["fact_sales — center<br/><i>amount · quantity · profit</i><br/><i>+ foreign keys to each dim</i>"]

    DD --> FACT
    DP --> FACT
    DC --> FACT
    DS --> FACT

    FACT --> BI5["BI query<br/>SUM(amount) BY category, month"]

    style FACT fill:#4A90D9,color:#fff,stroke:#2E6DA4
    style DIMS fill:#E8F4FD,stroke:#4A90D9
    style BI5 fill:#D5F5E3,stroke:#27AE60
```

---

## 8. Component index — quick lookup

| Component | Layer | Paradigm | Read more |
|-----------|-------|----------|-----------|
| OLTP | Source | All | [Data Warehouse — OLTP](/data-architecture/data-warehouse/#oltp-vs-olap) |
| ETL / ELT | Ingestion | Warehouse, Lakehouse | [Data Warehouse — ETL](/data-architecture/data-warehouse/#etl-vs-elt) |
| Staging | Ingestion | Warehouse | [Data Warehouse — Architecture](/data-architecture/data-warehouse/#how-it-works-architecture) |
| OLAP / Warehouse | Storage | Warehouse | [Data Warehouse — OLAP](/data-architecture/data-warehouse/#oltp-vs-olap) |
| Fact table | Model | Warehouse, Lakehouse Gold | [Data Warehouse — Facts](/data-architecture/data-warehouse/#fact-tables) |
| Dimension table | Model | Warehouse, Lakehouse Gold | [Data Warehouse — Dimensions](/data-architecture/data-warehouse/#dimension-tables) |
| Star schema | Model | Warehouse | [Data Warehouse — Star](/data-architecture/data-warehouse/#star-schema) |
| Snowflake schema | Model | Warehouse | [Data Warehouse — Snowflake](/data-architecture/data-warehouse/#snowflake-schema) |
| SCD | Model | Warehouse | [Data Warehouse — SCD](/data-architecture/data-warehouse/#grain-keys--slowly-changing-dimensions) |
| Data mart | Model | Warehouse | [Data Warehouse — Marts](/data-architecture/data-warehouse/#data-marts--conformed-dimensions) |
| Object storage | Storage | Lake, Lakehouse | [Data Lake — Architecture](/data-architecture/data-lake/#how-it-works-architecture) |
| Schema-on-read | Model | Lake | [Data Lake — Schema-on-read](/data-architecture/data-lake/#core-characteristics) |
| Delta / Iceberg / Hudi | Storage | Lakehouse | [Data Lakehouse — Table format](/data-architecture/data-lakehouse/#1-open-table-format-the-technical-foundation) |
| Medallion (Bronze/Silver/Gold) | Model | Lakehouse | [Data Lakehouse — Medallion](/data-architecture/data-lakehouse/#2-medallion-architecture-organizational-pattern) |
| Unity Catalog | Governance | Lakehouse | [Data Lakehouse — Governance](/data-architecture/data-lakehouse/#3-unified-governance) |
| SQL Warehouse | Compute | Lakehouse, Databricks | [Data Lakehouse — Compute](/data-architecture/data-lakehouse/#4-separate-compute-shared-storage) |
| BI / Dashboards | Consumption | All | [Data Warehouse — Architecture](/data-architecture/data-warehouse/#how-it-works-architecture) |

---

**Back to overview:** [Overview](/data-architecture/overview/)
