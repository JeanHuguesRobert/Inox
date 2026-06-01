---
title: "Corpus Status — Inox"
description: "Current state of the Inox knowledge corpus — what is proved, what is open, what remains possible"
layout: default
nav_order: 2
last_modified_at: 2026-06-01
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/corpus-status.md
last_stamped_at: 2026-06-01
license: CC BY-SA 4.0
affiliation: Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica
date: 2026-05-27
creator: Jean Hugues Noël Robert, baron Mariani (généré automatiquement par les outils du corpus)
---

# Corpus Status — Inox

*Auto-refreshed by `cogentia.js corpus-status`. The structural sections* —
*Registered Repositories, Cross-Reference Graph, Published, What Remains Possible* —
*are regenerated from the registry and from [`research/index.md`](index.md) on every run.*
*The substantive sections* — *What Is Proved* *and* *Open Objections* —
*are manually curated and preserved across refreshes.*

---

## Registered Repositories

<!-- BEGIN_AUTO: registered_repos -->
| Repository | research/index.md | Branch | Last commit |
|---|---|---|---|
| cogentia | ✅ | main | 2026-06-01 |
| FractaVolta | ✅ | main | 2026-05-31 |
| marenostrum | ✅ | main | 2026-05-31 |
| barons-Mariani | ✅ | main | 2026-06-01 |
| inseme | ✅ | main | 2026-06-01 |
| Inox | ✅ | master | 2026-06-01 |
| JeanHuguesRobert | ✅ | main | 2026-06-01 |
<!-- END_AUTO: registered_repos -->

---

## Cross-Reference Graph

<!-- BEGIN_AUTO: graph -->
```mermaid
graph LR
  cogentia["📄 cogentia"]
  FractaVolta["📄 FractaVolta"]
  marenostrum["📄 marenostrum"]
  barons-Mariani["📄 barons-Mariani"]
  inseme["📄 inseme"]
  Inox["📄 Inox"]
  JeanHuguesRobert["📄 JeanHuguesRobert"]
  cogentia --> marenostrum
  cogentia --> JeanHuguesRobert
  cogentia --> barons-Mariani
  cogentia --> FractaVolta
  cogentia --> inseme
  cogentia --> Inox
  FractaVolta --> marenostrum
  FractaVolta --> JeanHuguesRobert
  FractaVolta --> barons-Mariani
  FractaVolta --> cogentia
  FractaVolta --> inseme
  FractaVolta --> Inox
  marenostrum --> barons-Mariani
  marenostrum --> JeanHuguesRobert
  marenostrum --> FractaVolta
  marenostrum --> cogentia
  marenostrum --> inseme
  marenostrum --> Inox
  barons-Mariani --> marenostrum
  barons-Mariani --> JeanHuguesRobert
  barons-Mariani --> FractaVolta
  barons-Mariani --> cogentia
  barons-Mariani --> inseme
  barons-Mariani --> Inox
  inseme --> cogentia
  inseme --> JeanHuguesRobert
  inseme --> marenostrum
  inseme --> FractaVolta
  inseme --> barons-Mariani
  inseme --> Inox
  Inox --> marenostrum
  Inox --> JeanHuguesRobert
  Inox --> FractaVolta
  Inox --> cogentia
  Inox --> barons-Mariani
  Inox --> inseme
  JeanHuguesRobert --> cogentia
  JeanHuguesRobert --> marenostrum
  JeanHuguesRobert --> FractaVolta
  JeanHuguesRobert --> barons-Mariani
  JeanHuguesRobert --> inseme
  JeanHuguesRobert --> Inox
  click cogentia "https://github.com/JeanHuguesRobert/cogentia/blob/main/research/index.md" "Open research/index.md"
  click FractaVolta "https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/index.md" "Open research/index.md"
  click marenostrum "https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/index.md" "Open research/index.md"
  click barons-Mariani "https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/index.md" "Open research/index.md"
  click inseme "https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md" "Open research/index.md"
  click Inox "https://github.com/JeanHuguesRobert/Inox/blob/main/research/index.md" "Open research/index.md"
  click JeanHuguesRobert "https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/index.md" "Open research/index.md"
```
<!-- END_AUTO: graph -->

---

## Published in this repo

<!-- BEGIN_AUTO: published -->
| Title | Location | Date |
|---|---|---|
| [The Inox Programming Language — Specification](inox-spec.md) *(language reference, control structures, named values, dialects, actors, design notes)* | this repo | 2021-06 → |
| [Test du critère Rossignol — Inox (FR)](test_critere_rossignol_inox.md) *(working-note v0.1, 2026-05-31 — Inox au crible du critère « pas de stabilisateur sans Rossignol » ; hiérarchie 7 étages ; frontière courante = étage 5→6)* | this repo | 2026-05-31 |
| [Reactive Sets in Inox — Native Implementation Path](reactive_sets_inox_cop_implementation.md) *(Toubkal/COP/Cogentia implementation path for native reactive sets, queries, attractors and pressure strategies)* | this repo | 2026-06-01 |
| [Corpus Status](corpus-status.md) *(living view — auto-refreshed by `cogentia.js corpus-status`)* | this repo | refreshable |
| [Concept Index](concepts.md) *(typed concept registry — mapped by `cogentia.js concepts`)* | this repo | refreshable |
<!-- END_AUTO: published -->

---

## Concept Status

<!-- BEGIN_AUTO: concepts -->
| Concept | Scope | Status | Type |
|---|---|---|---|
| [Concatenative language](./concepts.md#concatenative-language) | Global | Canonical | language paradigm |
| [Stack VM](./concepts.md#stack-vm) | Global | Operational | runtime architecture |
| [Control/data plane separation](./concepts.md#controldata-plane-separation) | Global | Canonical | architectural principle |
| [Named values](./concepts.md#named-values) | Global | Defined | language primitive |
| [Reactive sets](./concepts.md#reactive-sets) | Global | Seed | distributed primitive |
| [Actors](./concepts.md#actors) | Global | Working | concurrency model |
| [Dialects](./concepts.md#dialects) | Global | Defined | language facility |
| [Fractanet](./concepts.md#fractanet) | Global | Seed | distributed system |
<!-- END_AUTO: concepts -->

---

## What Is Proved

*Manually curated: claims demonstrated by the published work in this corpus.*

| Claim | Status | Evidence |
|---|---|---|
| _(add claims here)_ | | |

---

## Open Objections

*Manually curated: objections received publicly, not yet fully resolved.*

| Objection | Source | Status |
|---|---|---|
| _(add objections here)_ | | |

---

## What Remains Possible

<!-- BEGIN_AUTO: possibilities -->
- Bare-metal port to ESP32 and similar microcontrollers
- Inox as the implementation language of a future `cop-core` (currently TypeScript)
- Inox dialect for cognitive packets (continuation-as-language-primitive)
- Reactive-set primitives as the basis for a distributed dataflow Fractanet runtime
- Native Packet Attractors for routing without fixed addresses
- Pressure strategies (`best-effort`, `ttl`, `bounded`, `demand`, `durable`) as runtime policies
<!-- END_AUTO: possibilities -->

---

*Generated with `cogentia.js corpus-status` — [scripts/cogentia.js](https://github.com/JeanHuguesRobert/cogentia/blob/main/scripts/cogentia.js)*
*Challenge via issues. Fork to explore alternatives.*


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Concept Index — Inox](concepts.md)
- [Corpus Status — Inox](corpus-status.md)
- [Research Index — Inox](index.md)
- [The Inox Programming Language — Specification](inox-spec.md)

<!-- END_AUTO: backlinks -->
