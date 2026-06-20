---
title: "Corpus Status — Inox"
description: "Current state of the Inox knowledge corpus — what is proved, what is open, what remains possible"
layout: default
nav_order: 2
last_modified_at: 2026-06-08
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
| Repository | research/index.md | Branch | Policy | Visibility | Public presence |
|---|---|---|---|---|---|
| cogentia | yes | main | all | public | full |
| FractaVolta | yes | main | all | public | full |
| marenostrum | yes | main | all | public | full |
| barons-Mariani | yes | main | all | public | full |
| inseme | yes | main | research | public | full |
| Inox | yes | master | all | public | full |
| registre-mariani | yes | main | all | private | stub |
| ubikia | yes | main | all | public | full |
| JeanHuguesRobert | yes | main | all | public | full |
| privai | yes | main | all | public | full |
| gouvernance | yes | main | all | public | full |
| marianivillage | yes | main | all | public | full |
| institut-mariani | yes | main | all | public | full |
| Kudos | yes | main | all | public | full |
| .github | yes | main | all | public | full |
| acorsica.org | yes | main | all | public | full |
<!-- END_AUTO: registered_repos -->
---

## Cross-Reference Graph
<!-- BEGIN_AUTO: graph -->
```mermaid
graph LR
  r_cogentia["cogentia"]
  r_fractavolta["FractaVolta"]
  r_marenostrum["marenostrum"]
  r_barons_mariani["barons-Mariani"]
  r_inseme["inseme"]
  r_inox["Inox"]
  r_registre_mariani["registre-mariani"]
  r_ubikia["ubikia"]
  r_jeanhuguesrobert["JeanHuguesRobert"]
  r_privai["privai"]
  r_gouvernance["gouvernance"]
  r_marianivillage["marianivillage"]
  r_institut_mariani["institut-mariani"]
  r_kudos["Kudos"]
  r_github[".github"]
  r_acorsica_org["acorsica.org"]
  r_jeanhuguesrobert -->|168| r_barons_mariani
  r_cogentia -->|98| r_barons_mariani
  r_jeanhuguesrobert -->|84| r_cogentia
  r_barons_mariani -->|62| r_cogentia
  r_jeanhuguesrobert -->|55| r_marenostrum
  r_jeanhuguesrobert -->|42| r_fractavolta
  r_fractavolta -->|41| r_cogentia
  r_fractavolta -->|37| r_marenostrum
  r_barons_mariani -->|23| r_marenostrum
  r_cogentia -->|22| r_inseme
  r_jeanhuguesrobert -->|20| r_kudos
  r_cogentia -->|19| r_marenostrum
  r_jeanhuguesrobert -->|19| r_inox
  r_fractavolta -->|18| r_inseme
  r_fractavolta -->|18| r_barons_mariani
  r_barons_mariani -->|17| r_fractavolta
  r_barons_mariani -->|16| r_inseme
  r_inseme -->|15| r_cogentia
  r_marenostrum -->|13| r_cogentia
  r_marenostrum -->|12| r_fractavolta
  r_inox -->|11| r_barons_mariani
  r_inox -->|11| r_cogentia
  r_marenostrum -->|11| r_barons_mariani
  r_inox -->|10| r_fractavolta
  r_jeanhuguesrobert -->|10| r_inseme
  r_jeanhuguesrobert -->|10| r_gouvernance
  r_fractavolta -->|8| r_inox
  r_inox -->|8| r_marenostrum
  r_inox -->|7| r_inseme
  r_inseme -->|7| r_inox
  r_jeanhuguesrobert -->|7| r_ubikia
  r_jeanhuguesrobert -->|6| r_privai
  r_barons_mariani -->|5| r_inox
  r_barons_mariani -->|5| r_jeanhuguesrobert
  r_cogentia -->|5| r_fractavolta
  r_barons_mariani -->|4| r_ubikia
  r_cogentia -->|4| r_jeanhuguesrobert
  r_jeanhuguesrobert -->|4| r_institut_mariani
  r_jeanhuguesrobert -->|4| r_marianivillage
  r_marianivillage -->|4| r_fractavolta
  r_github -->|3| r_gouvernance
  r_inseme -->|3| r_barons_mariani
  r_inseme -->|3| r_jeanhuguesrobert
  r_kudos -->|3| r_barons_mariani
  r_cogentia -->|2| r_inox
  r_fractavolta -->|2| r_jeanhuguesrobert
  r_gouvernance -->|2| r_barons_mariani
  r_gouvernance -->|2| r_fractavolta
  r_inox -->|2| r_jeanhuguesrobert
  r_inseme -->|2| r_marenostrum
  r_inseme -->|2| r_fractavolta
  r_institut_mariani -->|2| r_barons_mariani
  r_institut_mariani -->|2| r_fractavolta
  r_jeanhuguesrobert -->|2| r_github
  r_jeanhuguesrobert -->|2| r_acorsica_org
  r_marenostrum -->|2| r_jeanhuguesrobert
  r_marenostrum -->|2| r_inseme
  r_marenostrum -->|2| r_inox
  r_privai -->|2| r_institut_mariani
  r_github -->|1| r_institut_mariani
  r_gouvernance -->|1| r_jeanhuguesrobert
  r_gouvernance -->|1| r_cogentia
  r_gouvernance -->|1| r_inseme
  r_gouvernance -->|1| r_marenostrum
  r_gouvernance -->|1| r_inox
  r_gouvernance -->|1| r_kudos
  r_gouvernance -->|1| r_marianivillage
  r_inseme -->|1| r_ubikia
  r_institut_mariani -->|1| r_privai
  r_institut_mariani -->|1| r_kudos
  r_institut_mariani -->|1| r_marianivillage
  r_institut_mariani -->|1| r_inseme
  r_institut_mariani -->|1| r_cogentia
  r_institut_mariani -->|1| r_marenostrum
  r_institut_mariani -->|1| r_inox
  r_kudos -->|1| r_institut_mariani
  r_marianivillage -->|1| r_institut_mariani
  r_ubikia -->|1| r_cogentia
```
<!-- END_AUTO: graph -->
---

## Published in this repo
<!-- BEGIN_AUTO: published -->
| Title | Location | Date |
|---|---|---|
| [The Inox Programming Language — Specification](inox-spec.md) *(language reference, control structures, named values, dialects, actors, design notes)* | this repo | 2021-06 → |
| [Lien avec C.O.R.S.I.C.A. et l’Institut Mariani](acorsica-institut-mariani.md) *(institutional boundary note — Inox, C.O.R.S.I.C.A. and Institut Mariani)* | this repo | 2026-06-03 |
| [Test du critère Rossignol — Inox (FR)](test_critere_rossignol_inox.md) *(working-note v0.1, 2026-05-31 — Inox au crible du critère « pas de stabilisateur sans Rossignol » ; hiérarchie 7 étages ; frontière courante = étage 5→6)* | this repo | 2026-05-31 |
| [Reactive Sets in Inox — Native Implementation Path](reactive_sets_inox_cop_implementation.md) *(Toubkal/COP/Cogentia implementation path for native reactive sets, queries, attractors and pressure strategies)* | this repo | 2026-06-01 |
| [JS Interop API for the "Inox for scripts" layer](js-interop-api-for-scripting-layer.md) *(working API note — explicit bridge to the underlying JavaScript VM for scripting and agent extension)* | this repo | 2026-06-05 |
| [Inox: Two Versions — Scripting vs System Programming](two-versions-scripting-vs-system.md) *(source design note — scripting layer obvious for agents; system layer for l9 + COP complexity)* | this repo | 2026-06-05 |
| [Inox Documentation Index](inox-docs-index.md) *(working index v0.1 — documentation map for current Inox learning and design notes)* | this repo | 2026-06-02 |
| [Basic Inox Tutorial](inox-tutorial-basic.md) *(working tutorial v0.1)* | this repo | 2026-06-02 |
| [Inox Naming and the Absence of Assignment](inox-naming-and-assignment.md) *(working note v0.1)* | this repo | 2026-06-02 |
| [Inox Tutorial Generation Guidelines](inox-tutorial-generation-guidelines.md) *(working note v0.1)* | this repo | 2026-06-02 |
| [Learning Inox — A tutorial for AI agents (and humans in a hurry)](learning-inox.md) *(working-paper tutorial — sections marked ⚠️ need author review)* | this repo | 2026-05-22 |
| [Library packets — when the library is a specification, not code](library_packets.md) *(working hypothesis — LLM-generation as defensive heterogeneity against supply-chain attacks and as a substrate-specific packet pattern)* | this repo | 2026-05-23 |
| [Inox naming conventions and design influences](naming-conventions.md) *(working notes)* | this repo | 2026-05-22 |
| [Inox token-efficiency for LLMs — open hypothesis](llm_token_efficiency.md) *(working hypothesis — does concatenative composition + named values + multi-dialect dispatch align Inox with autoregressive code generation? Living note accumulating evidence over time)* | this repo | 2026-05-23 |
| [AGENTS.md — Inox agent mandate](../AGENTS.md) *(local operational mandate for AI agents working in this repository)* | this repo | 2026-06-13 |
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
| [Control/data plane separation](./concepts.md#control-data-plane-separation) | Global | Canonical | architectural principle |
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
- [Research Index — barons-Mariani](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/index.md)
- [Research Index — Cogentia](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/index.md)
- [Research Index — FractaVolta](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/index.md)
- [Corpus Status — Inox](corpus-status.md)
- [Reactive Sets in Inox — Native Implementation Path](reactive_sets_inox_cop_implementation.md)
- [The Iɴᴏx programming language](../README.md)
- [Research Index — Inseme](https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md)
- [Research Index — Jean Hugues Noël Robert (Profile / Entry Point)](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/index.md)
- [Research Index — MareNostrum](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/index.md)
<!-- END_AUTO: possibilities -->
---

*Generated with `cogentia.js corpus-status` — [scripts/cogentia.js](https://github.com/JeanHuguesRobert/cogentia/blob/main/scripts/cogentia.js)*
*Challenge via issues. Fork to explore alternatives.*
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](index.md)
- [The Iɴᴏx programming language](../README.md)
<!-- END_AUTO: backlinks -->
