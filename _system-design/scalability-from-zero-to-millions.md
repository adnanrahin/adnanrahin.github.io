---
title: Scalability — From Single Server to Sharding
date: 2026-03-01
description: How to scale an application tier by tier — app servers, caching, read replicas, and sharding.
tags: [scalability, databases, load-balancing]
---

Scaling is not one decision — it is a sequence of bottleneck fixes. Each growth stage reveals the next constraint.

## Measure first

Before scaling anything, identify the bottleneck with metrics: CPU, latency percentiles, QPS, and error rate.

| Metric | Example target |
|--------|----------------|
| Requests per second | 10,000 RPS |
| Concurrent users | 50,000 |
| Query rate | 50,000 QPS |

## Common progression

1. **Single server** — app + DB together (0–10K users)
2. **Separate database** — independent tuning (10K–100K)
3. **Add Redis cache** — 80–90% reads never hit DB (100K–500K)
4. **Multiple app servers + load balancer** — horizontal scale (500K–2M)
5. **Read replicas** — multiply read capacity (2M–10M)
6. **Sharding** — partition writes across databases (10M+)

> Always scale the component that is actually limiting you — adding app servers does not help if the database is the bottleneck.
