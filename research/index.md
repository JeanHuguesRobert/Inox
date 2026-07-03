---
title: "Research Index — Inox"
description: "A map of what is, what is in progress, and what could be."
layout: default
nav_order: 1
last_modified_at: 2026-07-03
license: CC BY-SA 4.0
affiliation: Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica
date: 2026-05-21
creator: Jean Hugues Noël Robert, baron Mariani
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/index.md
document_role: "index"
document_kind: "research-index"
visibility: "public"
lifecycle_state: "active"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "research-index"
classification_confidence: "strong"
---

# Research Index — Inox

## Foundation

This repository instantiates the **language and runtime substrate layer** of the [DHITL](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/DHITL.md) AI Safety anti-capture proposal — a concatenative stack VM with strict control/data plane separation, designed for the agents and nodes of the future *Fractanet* (the FractaVolta network).

---

*A map of what is, what is in progress, and what could be.*
*See sibling indexes in [MareNostrum](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/index.md), [FractaVolta](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/index.md), [Cogentia](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/index.md), [barons-Mariani](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/index.md), [Inseme](https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md).*

---

## Published

| Title | Location | Date |
|---|---|---|
| [The Inox Programming Language — Specification](inox-spec.md) *(language reference, control structures, named values, dialects, actors, design notes)* | this repo | 2021-06 → |
| [Lien avec C.O.R.S.I.C.A. et l’Institut Mariani](acorsica-institut-mariani.md) *(institutional boundary note — Inox, C.O.R.S.I.C.A. and Institut Mariani)* | this repo | 2026-06-03 |
| [Test du critère Rossignol — Inox (FR)](test_critere_rossignol_inox.md) *(working-note v0.1, 2026-05-31 — Inox au crible du critère « pas de stabilisateur sans Rossignol » ; hiérarchie 7 étages ; frontière courante = étage 5→6)* | this repo | 2026-05-31 |
| [Reactive Sets in Inox — Native Implementation Path](reactive_sets_inox_cop_implementation.md) *(Toubkal/COP/Cogentia implementation path for native reactive sets, queries, attractors and pressure strategies)* | this repo | 2026-06-01 |
| [JS Interop API for the "Inox for scripts" layer](js-interop-api-for-scripting-layer.md) *(working API note — explicit bridge to the underlying JavaScript VM for scripting and agent extension)* | this repo | 2026-06-05 |
| [Inox: Two Versions — Scripting vs System Programming](two-versions-scripting-vs-system.md) *(source design note — scripting layer obvious for agents; system layer for l9 + COP complexity)* | this repo | 2026-06-05 |
| [Inox as the Fractanet Language — External Abstractions Absorption Map](fractanet_language_abstractions.md) *(working-note v0.1 — roadmap for absorbing OTP, actors, streams, MQTT, Python, shell and reactive-set abstractions into Inox dialects and native coverage)* | this repo | 2026-07-03 |
| [Packet Attractor — Fractanet routing (canonical COP source)](https://github.com/JeanHuguesRobert/inseme/blob/main/research/packet_attractor_fractanet.md) *(referenced — `cop/packet-attractor`, intermittent capable nodes, distributed blackboard)* | inseme | 2026-07-03 |
| [Inox remote serve — proto interpreter and retrieval fulfiller](inox-remote-serve.md) *(HTTP adapter: `/run`, `/retrieval/batch`; Cogentia Phase 4 proto)* | this repo | 2026-07-03 |
| [Inox serve — remote execution benchmarks](inox-serve-benchmarks.md) *(cold/warm latency; `npm run bench:serve`)* | this repo | 2026-07-03 |
| [Inox serve — session cognitive packets](inox-session-packets.md) *(inox.session.v1 loop; `POST /session/turn`)* | this repo | 2026-07-03 |
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

---

## Referenced

*Hosted elsewhere, intellectually connected here.*

| Title | Location |
|---|---|
| [DHITL — Democratic Humans in the Loop](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/DHITL.md) | marenostrum |
| [The Unconscious Grid](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/UNCONSCIOUS_GRID.md) *(§8 names the cross-layer packetization pattern of which Inox is the language-level instance)* | FractaVolta |
| [VIGILIA — Distributed avoidance, signalling, and territorial perception](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/vigilia.md) | barons-Mariani |
| [Discours de la seconde méthode](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/second_method.md) | barons-Mariani |
| [Cogentia Pipeline](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/pipeline.md) *(method note v0.4 — operational counterpart of the Discours; source-to-derived packet workflow used by the reactive sets artifacts)* | cogentia |
| [Cognitive Packets](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cognitive_packets.md) *(envelope/payload pattern used by the reactive cognitive layer)* | cogentia |
| [Memory, Working Memory, and Corpus Sleep Cycle](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/memory_and_corpus_sleep_cycle.md) *(memory temperature, individual/collective memory and consolidation cycle relevant to Inox memory verbs)* | cogentia |
| [COP — Cognitive Orchestration Protocol (Architecture)](https://github.com/JeanHuguesRobert/inseme/blob/main/packages/cop-core/Architecture.md) *(canonical orchestration substrate; potential future re-implementation target for an Inox-native `cop-core`)* | inseme |
| [Reactive Cognitive COP Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/research/reactive_cognitive_cop_extension.md) *(COP-side source document for Packet Attractors, pressure strategies and control/data plane)* | inseme |
| [COP Reactive Cognitive Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/packages/cop-core/REACTIVE_COGNITIVE_EXTENSION.md) *(operational COP-core protocol note derived from the source document)* | inseme |

---

## In Progress

- WebAssembly target — bridge from TypeScript reference implementation to browser-embedded edge runtime
- C/C++ implementation — Linux first, broader OS coverage
- Formal grammar specification — current spec is descriptive, not yet a formal BNF
- Inox-native Reactive Sets seed — see [`prompts/implement_reactive_sets_seed.md`](../prompts/implement_reactive_sets_seed.md)

---

## Open Possibilities

*Ideas that trotte — no commitment, no deadline.*

- Bare-metal port to ESP32 and similar microcontrollers
- Inox as the implementation language of a future `cop-core` (currently TypeScript)
- Inox dialect for cognitive packets (continuation-as-language-primitive)
- Reactive-set primitives as the basis for a distributed dataflow Fractanet runtime
- Native Packet Attractors for routing without fixed addresses
- Pressure strategies (`best-effort`, `ttl`, `bounded`, `demand`, `durable`) as runtime policies
- Inox memory verbs for working memory, consolidation, cooling, obsolescence and traceable forgetting

---

*Priority established by first public commit. License: MIT (code) · CC BY-SA 4.0 (text).*
*Fork to explore alternatives. Challenge via issues.*
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — barons-Mariani](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/index.md)
- [Research Index — Cogentia](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/index.md)
- [Research Index — FractaVolta](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/index.md)
- [Reactive Sets in Inox — Native Implementation Path](reactive_sets_inox_cop_implementation.md)
- [The Iɴᴏx programming language](../README.md)
- [Research Index — Inseme](https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md)
- [Research Index — Jean Hugues Noël Robert (Profile / Entry Point)](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/index.md)
- [Research Index — MareNostrum](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/index.md)
<!-- END_AUTO: backlinks -->