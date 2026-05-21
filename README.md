---
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/README.md
last_stamped_at: 2026-05-21
---
# The Iɴᴏx programming language

> *« Le style, c'est l'homme »* — Buffon, 1753.  
> *Programming with style.*

Iɴᴏx is a concatenative script language designed for **edge computing, IoT, and ML-era distributed systems**. It is the intended runtime substrate for the agents and nodes of the future FractaVolta network — working name *Fractanet* — and aims, over time, to descend from comfortable hosts (Node.js, Deno, browsers) all the way down to bare metal on microcontrollers like the ESP32.

Started in June 2021. The reference implementation is in TypeScript. Production-quality versions will be hand-coded for each target (WASM, then C/C++, then progressively smaller runtimes). Inox is **not yet** production-ready; this repository documents the design and the road.

---

## Inox in the corpus

Inox is the **language and runtime substrate** of a six-repository corpus that operationalises the [DHITL](https://github.com/JeanHuguesRobert/marenostrum/blob/main/DHITL.md) AI Safety anti-capture proposal.

| Repository | Role |
|---|---|
| [MareNostrum](https://github.com/JeanHuguesRobert/marenostrum) | Strategic framework. CXU specification, DHITL axiom, Mediterranean solar commons. |
| [FractaVolta](https://github.com/JeanHuguesRobert/FractaVolta) | Engineering firm + software publisher + stack operator. EPN, DC-native nodes, PGN, IPN, Mariani Village. |
| [Cogentia](https://github.com/JeanHuguesRobert/cogentia) | Cognitive infrastructure tooling. `cogentia.js` CLI, Cogentia Commons methodology, continuation protocol. |
| [inseme](https://github.com/JeanHuguesRobert/inseme) | Platform — COP runtime, briques, Kudocracy.Survey, Inseme Agora, Ophélia AI mediator, Atlas of Biodiversity. |
| [barons-Mariani](https://github.com/JeanHuguesRobert/barons-Mariani) | Political and institutional framework. Plan 2038, *Discours de la seconde méthode*. |
| **Inox** | **Language and runtime substrate. Concatenative stack VM, strict control/data plane separation, designed for nodes of the future *Fractanet*. JavaScript today, WASM and C/C++ next, ESP32 bare-metal eventually.** |

Inox is **not yet** the runtime running the other repos. JavaScript and TypeScript do that work today. The vocation is to replace JS progressively, starting at the edge — small, autonomous, traceable nodes that coordinate without a capturable centre. That is the same architectural question the corpus asks at five other scales: at the network level via [Patent US7606221B2](https://patents.google.com/patent/US7606221B2/en), at the territory level via [VIGILIA](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/vigilia.md), at the individual level via [Cogentia](https://github.com/JeanHuguesRobert/cogentia), at the governance level via [DHITL](https://github.com/JeanHuguesRobert/marenostrum/blob/main/DHITL.md), and at the energy level via [the Energy Packet Network](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md).

The strict separation between **control plane** and **data plane** in Inox is the same architectural idea as the EPN's separation between routing protocol (commons) and operation (diverse), expressed at the language level. The corpus's [UNCONSCIOUS_GRID §8](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md) names this pattern across layers; Inox is its language-level instance.

---

## What Inox is, in a few lines

- **Concatenative** — verbs are juxtaposed, not nested. Forth lineage, with Smalltalk's message-passing and Erlang's actor-based concurrency.
- **Stack-based virtual machine** — the basic data element is a 64-bit cell carrying a *typed value AND a name*.
- **Named values** — every value has a name attached; access is by tag rather than by index or pointer identity.
- **Reactive sets** — for distributed dataflow processing.
- **Actors** — concurrency, asynchronicity, message passing.
- **Multiple dialects** — prefix, infix, postfix notation; predefined and custom dialects per style.
- **Strict separation of control plane and data plane** — data stays on stacks longer; state machines are expressed natively.

The pattern is old (Forth, 1970). The application is new: building **uncapturable computational nodes** that descend gracefully from Node.js to bare metal as the underlying network matures.

---

## Implementation roadmap

The reference implementation defines syntax and semantics. Production versions will be hand-coded per target.

1. **Today** — TypeScript reference implementation on **Node.js / Deno / browsers**. Used to validate the language design.
2. **Next** — **WebAssembly** target, for browser-embedded and edge runtimes.
3. **Then** — **C/C++** implementation under Linux, for stronger performance and broader OS coverage.
4. **Smaller OSes** — embedded Linux, real-time OSes.
5. **Bare metal** — **ESP32** and similar microcontrollers. The minimum viable target where every byte counts.

The goal is not to replace every existing language. The goal is to give the *Fractanet* a runtime that travels comfortably across these layers, with the same semantics and the same traceability everywhere.

---

## Specification

The complete language specification — overview, control structures, named values, dialects, actors, examples, design notes, the *grand plan* — lives in [`research/inox-spec.md`](research/inox-spec.md). It is the language-design reference; this README is the corpus-facing entry.

---

## Origin

I started Inox in June 2021, asking a single question: *how do autonomous agents coordinate without a capturable centre?* I have asked the same question at six scales — language (this repo), network ([Patent US7606221B2](https://patents.google.com/patent/US7606221B2/en)), territory ([VIGILIA](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/vigilia.md)), individual ([Cogentia](https://github.com/JeanHuguesRobert/cogentia)), governance ([DHITL](https://github.com/JeanHuguesRobert/marenostrum/blob/main/DHITL.md)), and energy ([EPN](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md)).

Inox is the language-level answer.

The *grand plan* remains, as it was in 2021, an AI-driven distributed system — a computerised living organism that evolves according to the law of evolution. We are not there yet. We are also not far.

Yours,

Jean Hugues Noël Robert, baron Mariani — *Virteal*

---

*License: MIT (code) · CC BY-SA 4.0 (text).*
*Author: Jean Hugues Noël Robert, baron Mariani — Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica — jhr@baronsmariani.org*
