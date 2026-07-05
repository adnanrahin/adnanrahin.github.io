---
title: How to read these designs
order: 5
description: Framework for requirements, capacity, APIs, and trade-offs.
tags: [fundamentals, framework]
---

Each system design in this series follows the same structure so you can compare patterns across problems.

## The framework

1. **Requirements** — functional vs non-functional (latency, availability, consistency)
2. **Capacity estimate** — back-of-the-envelope math (QPS, storage, bandwidth)
3. **High-level design** — clients, services, data stores, async paths
4. **API & data model** — key endpoints and schema choices
5. **Deep dives** — bottlenecks, scaling, failure modes
6. **Trade-offs** — what you gain and what you give up

## Diagrams

Posts use **Mermaid** for architecture diagrams. GitHub Pages renders them when viewed on the site.

## Adding your own

Create a file in `_system_design/` with front matter:

```yaml
---
title: Design a Chat System
order: 4
description: One-line summary for the sidebar.
tags: [messaging, websocket]
---
```

Use the `order` field to control sidebar sequence. Lower numbers appear first.

---

**Next:** [Scalability]({{ '/system-design/scalability/' | relative_url }}) — the first topic in the series.
