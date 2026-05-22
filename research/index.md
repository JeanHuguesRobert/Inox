---
title: "Research Index — Inox"
description: "A map of what is, what is in progress, and what could be."
layout: default
nav_order: 1
last_modified_at: 2026-05-21
---

# Research Index — Inox

## Foundation

This repository instantiates the **language and runtime substrate layer** of the [DHITL](https://github.com/JeanHuguesRobert/marenostrum/blob/main/DHITL.md) AI Safety anti-capture proposal — a concatenative stack VM with strict control/data plane separation, designed for the agents and nodes of the future *Fractanet* (the FractaVolta network).

---

*A map of what is, what is in progress, and what could be.*
*See sibling indexes in [MareNostrum](https://github.com/JeanHuguesRobert/marenostrum/blob/main/research/index.md), [FractaVolta](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/index.md), [Cogentia](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/index.md), [barons-Mariani](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/index.md), [Inseme](https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md).*

---

## Published

| Title | Location | Date |
|---|---|---|
| [The Inox Programming Language — Specification](inox-spec.md) *(language reference, control structures, named values, dialects, actors, design notes)* | this repo | 2021-06 → |
| [Corpus Status](corpus-status.md) *(living view — auto-refreshed by `cogentia.js corpus-status`)* | this repo | refreshable |
| [Concept Index](concepts.md) *(typed concept registry — mapped by `cogentia.js concepts`)* | this repo | refreshable |

---

## Referenced

*Hosted elsewhere, intellectually connected here.*

| Title | Location |
|---|---|
| [DHITL — Democratic Humans in the Loop](https://github.com/JeanHuguesRobert/marenostrum/blob/main/DHITL.md) | marenostrum |
| [The Unconscious Grid](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md) *(§8 names the cross-layer packetization pattern of which Inox is the language-level instance)* | FractaVolta |
| [VIGILIA — Distributed avoidance, signalling, and territorial perception](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/vigilia.md) | barons-Mariani |
| [Discours de la seconde méthode](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/second_method.md) | barons-Mariani |

---

## In Progress

- WebAssembly target — bridge from TypeScript reference implementation to browser-embedded edge runtime
- C/C++ implementation — Linux first, broader OS coverage
- Formal grammar specification — current spec is descriptive, not yet a formal BNF

---

## Open Possibilities

*Ideas that trotte — no commitment, no deadline.*

- Bare-metal port to ESP32 and similar microcontrollers
- Inox as the implementation language of a future `cop-core` (currently TypeScript)
- Inox dialect for cognitive packets (continuation-as-language-primitive)
- Reactive-set primitives as the basis for a distributed dataflow Fractanet runtime

---

*Priority established by first public commit. License: MIT (code) · CC BY-SA 4.0 (text).*
*Fork to explore alternatives. Challenge via issues.*


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Corpus Status — Inox](corpus-status.md)
- [The Inox Programming Language — Specification](inox-spec.md)
- [Concept Index — Inox](concepts.md)

<!-- END_AUTO: backlinks -->
