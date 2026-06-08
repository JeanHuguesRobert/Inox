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

The corpus's **Rossignol criterion** — a dispositif is a valid procedural stabiliser iff it can produce a Rossignol, a *point d'attestation exposable hors-cadre* — is applied reflexively to Inox itself in [`research/test_critere_rossignol_inox.md`](research/test_critere_rossignol_inox.md) (v0.1 working note). The test reveals that a layered dispositif carries **multiple superposed Rossignols**, and shifts the relevant question from *does it have one?* to *which one is its highest living attestation?*

---

## What Inox is, in a few lines

- **Concatenative** — verbs are juxtaposed, not nested. Forth lineage, with Smalltalk's message-passing and Erlang's actor-based concurrency.
- **Stack-based virtual machine** — the basic data element is a 64-bit cell carrying a *typed value AND a name*.
- **Named values** — every value has a name attached; access is by tag rather than by index or pointer identity.
- **Reactive sets** — for distributed dataflow processing. Implementation path from Toubkal-style dataflow toward the [COP Reactive Cognitive Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/packages/cop-core/REACTIVE_COGNITIVE_EXTENSION.md): see [`research/reactive_sets_inox_cop_implementation.md`](research/reactive_sets_inox_cop_implementation.md) (v0.1 working paper). inseme delegates the native runtime of that extension to Inox.
- **Actors** — concurrency, asynchronicity, message passing.
- **Multiple dialects** — prefix, infix, postfix notation; predefined and custom dialects per style.
- **Strict separation of control plane and data plane** — data stays on stacks longer; state machines are expressed natively.

**Current status (2026)**: a first usable *CLI / synchronous* flavour exists and is the default. Run `node builds/inox.js examples/hello.nox` (or `node bin/inox.js ...` / `npx inox` after setup). It uses only the core (bootstrap.nox + forth.nox) — no l9 OO yet — with sync primitives for stdin/args/exit/out so scripts behave like small C/Forth tools. The l9 layer (classes, tasks, actors from the l8 lineage) is still under repair; set `INOX_WITH_L9=1` to exercise it (expect FATALS during bootstrap for now). See `bin/inox.js`, the bottom of `lib/inox.ts` (run_program + direct entry), and `lib/arg-test.nox` (historical) for details. Postfix style is reliable; some parenthesized call syntax lives in l9.

The pattern is old (Forth, 1970). The application is new: building **uncapturable computational nodes** that descend gracefully from Node.js to bare metal as the underlying network matures.

## Two versions / two audiences (scripting vs system programming)

Per the explicit design idea:

> my idea is that the "scripting" version should be fairly "obvious" for coding Agents ; whereas the "system programming" cannot be obvious because it manipulate more complex and much less usual concepts ; hence the two versions

- **Scripting (default, the obvious one for Agents)**: `cli-stdlib.nox` (loaded automatically). Old-school rich stdlib + decent modern script update ergonomics + the `js.*` bridge (js.require / js.eval / js.get+js.call etc.). The fact that it runs on a real JS VM is treated as an advantage for easy extension to specific needs. Agents write natural `.nox` here. See `research/js-interop-api-for-scripting-layer.md` + `examples/js-bridge-demo.nox`.
- **System programming (opt-in, intentionally non-obvious)**: `INOX_WITH_L9=1` loads `l9.nox` (the dynamic objects/actors layer from l8) + future COP integration. This is where continuations-as-input, cognitive packets, artifacts with stability/retention/cache, judgment-based obsolescence, fork/join of cogitors, control/data plane, reactive sets etc. live. It cannot be "obvious" because those are the complex and unusual concepts the substrate must manipulate.

The split keeps agent logic obvious while the full power (and complexity) is available when needed. This is the practical path while the l9 layer stabilizes, and aligns with the larger goal of moving the corpus out of JavaScript and into Inox-native `.nox` (see Inox#17).

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
