---
title: "Reactive Sets in Inox — Native Implementation Path"
subtitle: "From Toubkal dataflow to Fractanet/COP reactive cognitive runtime"
version: "0.1"
status: "working-paper — implementation path"
date: "2026-06-01"
author: "Jean Hugues Noël Robert"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
license: "CC BY-SA 4.0"
language: "en"
repository: "JeanHuguesRobert/Inox"
intended_path: "research/reactive_sets_inox_cop_implementation.md"
tags:
  - inox
  - reactive-sets
  - toubkal
  - cop
  - cogentia
  - fractanet
  - control-plane
  - data-plane
  - packet-attractor
  - pressure-strategies
related_projects:
  - "Inox"
  - "COP"
  - "Cogentia"
  - "Fractanet"
  - "Toubkal"
ai_assisted_by:
  - "ChatGPT"
  - "Grok"
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/reactive_sets_inox_cop_implementation.md
last_stamped_at: 2026-06-01
---

# Reactive Sets in Inox — Native Implementation Path

## Object and associated documents

### Object of this document

This document defines the Inox-native implementation path for Reactive Sets, CogQueries, Packet Attractors and pressure strategies.

It is the counterpart of the COP-side protocol document in Inseme. It exists to make one point explicit:

> The deep implementation of Reactive Sets in the Jean Hugues Robert corpus belongs in Inox, not in a new pure-JavaScript Inseme package.

Inseme/COP defines protocol surfaces. Inox should carry the future runtime primitive.

### Associated documents

This document should be read together with:

- [The Inox Programming Language — Specification](inox-spec.md) — existing language reference where Reactive Sets are already listed as a design feature;
- [Research Index — Inox](index.md) — repository map;
- [Reactive Cognitive COP Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/research/reactive_cognitive_cop_extension.md) — COP-side source document;
- [COP Reactive Cognitive Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/packages/cop-core/REACTIVE_COGNITIVE_EXTENSION.md) — protocol-facing operational note;
- [Cogentia Pipeline](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/pipeline.md) — method followed for this artifact;
- [Cognitive Packets](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cognitive_packets.md) — envelope/payload pattern;
- [Toubkal](https://github.com/ReactiveSets/toubkal) — original Reactive Sets / Pipelets framework.

---

## Assisted genesis note

This document follows a correction made during the Toubkal modernization discussion. A first implementation direction proposed a package `@inseme/reactive-cognitive`. That would have been useful as a COP adapter, but misleading as a primary runtime destination.

Inox already names Reactive Sets as part of its intended language design. Therefore the native implementation path must be recorded here.

---

## Abstract

Toubkal provides a powerful architecture for distributed reactive dataflow: Reactive Sets, Reactive Queries, Query Tree, Pipelets, transactions, fetch/subscribe, and antistate. These concepts match several prior Inox concerns: actors, enhanced stacks, distributed dataflow, edge execution, control/data-plane separation, and future Fractanet nodes.

This document defines a minimal Inox-native path. The first objective is not to recreate Toubkal. The objective is to create a small, testable seed that can later support COP event projection and Cogentia Cognitive Packets.

The initial implementation should define: `ReactiveSet`, `ReactiveQuery`, `ReactiveTransaction`, `PacketAttractor`, pressure strategies, and explicit Control Plane / Data Plane separation. It should be small enough to understand and test before being integrated into the larger Inox VM.

---

## Transformation map

```text
Toubkal repository analysis
→ identification of Reactive Sets / Queries / Query Tree / transactions / antistate
→ Grok proposal of @inseme/reactive-cognitive
→ verification that Inox already contains Reactive Sets as a design feature
→ correction: Inseme should host COP protocol artifacts, Inox should host native implementation path
→ addition by Jean Hugues Robert of pressure strategies and control/data-plane split
→ present Inox implementation path
→ future small code seed
```

---

## Main hypothesis

Inox should implement reactive cognitive dataflow as a language/runtime capability, not as an external application library.

This means:

- Reactive Sets should eventually become native Inox structures;
- Reactive Queries should eventually be compiled or optimized by Inox;
- Packet Attractors should become routing/control-plane structures;
- pressure strategies should become runtime policies;
- COP events should be projected from or into Inox runtime state;
- JavaScript may remain a reference/prototype layer, but not the conceptual owner.

**Lineage note (l8 / side → Inox + COP)**: l8 (cooperative Tasks/Steps in JS) and side (retry + slot capitalization + delayed side-effect commit for "sync face") are the historical JS-era expressions of ideas now evolving here. See Inox#17 for the destiny discussion and user confirmation: the goal is to move out of Javascript into Inox; while there is no stabilized Inox yet we keep producing (plain) Javascript code for transitional bridges and interop (l8 face for Cogitors, side-style wrappers, artifact stability/granularity, etc.) and avoid TypeScript investment on that portable/transitional code when reasonable. The primary homes are Inox (native runtime primitives, l9.nox as direct "from l8.js" descendant) for the substrate and inseme/COP for the distributed protocol surfaces (Cogitors as generalized steps, continuations, artifacts with stability/cache/retention, judgment-driven exploration). Historical code and attestations are preserved in the l8 and side repositories with pointers; new work on the ideas happens in Inox + inseme. See also inseme/packages/cop-kernel/docs/task-step-continuation-lineage.md .

---

## Implementation layers

### Layer 0 — Documentation seed

This document.

Goal: stabilize the architecture before code.

### Layer 1 — Pure TypeScript seed outside the VM core

A minimal implementation MAY start in TypeScript, but inside the Inox repository and explicitly as an Inox seed.

Suggested path:

```text
lib/reactive/
  reactive_query.ts
  reactive_set.ts
  reactive_transaction.ts
  packet_attractor.ts
  pressure.ts
  index.ts

test/reactive/
  reactive_query.test.ts
  reactive_set.test.ts
  reactive_transaction.test.ts
  packet_attractor.test.ts
```

This is not an npm package for Inseme.

### Layer 2 — VM integration

Once the seed is stable, expose Inox-level verbs and structures.

Possible verbs:

```text
reactive-set
reactive-query
attractor
emit-packet
subscribe
fetch
add-op
remove-op
update-op
```

These names are provisional.

### Layer 3 — COP bridge

COP bridge emits and consumes COP events/artifacts without owning the runtime.

```text
Inox ReactiveSet
→ operation stream
→ COP event log
→ COP projections

COP reactive-query artifact
→ Inox query / attractor
→ runtime demand
```

### Layer 4 — Fractanet node runtime

Later, Inox can descend toward WASM, C/C++ and ESP32-like targets, carrying the same semantics at smaller scales.

---

## Control Plane / Data Plane in Inox

### Control Plane

In Inox, the Control Plane should contain:

- query definitions;
- attractor definitions;
- pressure strategy;
- TTL;
- fan-out limits;
- retry limits;
- durability requirements;
- transaction metadata;
- authorization hints;
- continuation references.

### Data Plane

The Data Plane should contain:

- values;
- packets;
- `add/remove/update` operations;
- transaction fragments;
- emitted state changes;
- payload references.

### Rule

```text
Control structures guide circulation.
Data structures circulate.
```

This matches the existing Inox concern for strict control/data-plane separation.

---

## Minimal structures

### `ReactiveQuery`

Seed grammar inherited from Toubkal:

```ts
export type ReactiveQuery = Array<Record<string, unknown>>;
```

Semantics:

- array = OR;
- object = AND;
- field equality by default;
- array expression for operators may be added gradually.

Initial supported operators:

```text
==
!=
>
>=
<
<=
in
```

### `ReactiveSet`

A keyed set supporting:

```text
add(value)
remove(valueOrKey)
update(oldValue, newValue)
fetch(query)
subscribe(query, receiver)
```

The implementation must preserve identity. Default key: `id`. Optional composite key later.

### `ReactiveTransaction`

Carries:

```text
id
more
forks
operations
```

It should support only minimal grouping at first. No ACID claim.

### `PacketAttractor`

A declarative structure that matches packets by:

- packet kind;
- query over payload;
- metadata;
- pressure strategy;
- trace/cause;
- source.

### `PressureStrategy`

Initial values:

```text
best-effort
ttl
bounded
demand
durable
```

Default:

```text
best-effort
```

---

## Antistate

Toubkal's antistate concept is important for distributed, out-of-order operations.

Inox should implement a minimal antistate only after the simple `ReactiveSet` seed works.

Minimal role:

```text
remember remove/update operations that arrive before the corresponding add
```

This is not an error by default. It is a pending negative state.

Possible states:

```text
pending-remove
pending-update
resolved
expired
conflict
```

TTL and bounded pressure policies should apply to antistate memory.

---

## Native/COP boundary

Inox-native structures should be able to project into COP.

Example:

```text
ReactiveSet.add(value)
→ operation { type: "add", value }
→ optional CognitivePacket
→ optional COP event
```

COP should be optional at this layer. Inox must not depend on Inseme to run a local reactive set.

---

## Cognitive packets YAML

```yaml
cognitive_packet:
  id: reactive_sets_inox_native_path.v0.1
  title: "Reactive Sets in Inox"
  type: "implementation path"
  definition: >
    Native Inox path for implementing Reactive Sets, Reactive Queries,
    transactions, Packet Attractors and pressure strategies as runtime
    primitives or near-runtime structures.
  repository: "JeanHuguesRobert/Inox"
  status: "working implementation artifact"
```

```yaml
cognitive_packet:
  id: inox_reactive_query.v0.1
  title: "Reactive Query in Inox"
  type: "runtime primitive seed"
  definition: >
    Query structure derived from Toubkal's OR-of-ANDs model and intended
    for native matching, dispatch and attraction in Inox.
  status: "seed"
```

```yaml
cognitive_packet:
  id: inox_antistate.v0.1
  title: "Antistate in Inox"
  type: "distributed consistency packet"
  definition: >
    Temporary negative memory used to handle remove/update operations that
    arrive before their corresponding add in distributed or out-of-order flows.
  status: "planned after simple ReactiveSet seed"
```

```yaml
cognitive_packet:
  id: inox_pressure_strategy.v0.1
  title: "Pressure Strategy in Inox"
  type: "runtime policy packet"
  definition: >
    Execution policy controlling packet and operation circulation: best-effort,
    ttl, bounded, demand or durable.
  origin: "Jean Hugues Robert continuation"
  status: "seed"
```

---

## Objections and safeguards

### Objection 1 — TypeScript seed may look like just another JS package

Response: keep it inside Inox, do not publish it as the Inseme package, and document it as a future VM primitive seed.

### Objection 2 — Implementing too much of Toubkal would stall the project

Response: implement only query matching, set operations, simple subscription and basic pressure policies first.

### Objection 3 — Antistate is subtle and may introduce complexity too early

Response: postpone antistate until the simple seed is tested.

### Objection 4 — COP bridge may contaminate the native runtime

Response: COP projection must be optional and boundary-based. Inox can emit or consume COP-compatible structures without depending on Inseme.

### Objection 5 — Control/data-plane separation may remain merely verbal

Response: every structure must explicitly classify fields as control-plane or data-plane.

---

## Levels of evidence

### Level A — Established repository facts

- Inox specification already lists Reactive Sets as a language feature.
- Toubkal documents Reactive Sets, Reactive Queries, transactions and antistate.
- COP defines protocol-level events, artifacts, continuations and projections.
- Cogentia defines Cognitive Packets and the pipeline used to stabilize this artifact.

### Level B — Defensible interpretation

- Inox is the right home for native reactive-set implementation.
- COP is the right home for protocol exposure.
- Toubkal can serve as conceptual ancestor without being cloned.

### Level C — Corpus-specific hypothesis

- A minimal Inox ReactiveSet seed can become the runtime nucleus of Fractanet cognitive packet routing.
- Pressure strategies and Control Plane / Data Plane separation are necessary to make reactive dataflow usable on edge nodes and human-like cognition flows.

### Level D — Source of inspiration

- Packet switching and Toubkal dataflow are used as deep analogies and design ancestors.

---

## Self-evaluation according to the second method

| Criterion | Evaluation v0.1 | Comment |
|---|---|---|
| Hypothesis clarity | Strong | Native Inox destination is explicit. |
| Contestability | Strong | Risks and objections are listed. |
| Evidence separation | Strong | Facts and hypotheses separated. |
| Machine-readability | Medium | Packets included; schemas still informal. |
| Implementation readiness | Medium | Good enough for a small coding continuation. |
| Anti-duplication | Strong | Avoids competing Inseme runtime. |
| Scope control | Strong | Does not attempt full Toubkal clone. |

### Internal bullshit meter

Provisional score: **1.0/10**.

Reason: the artifact is architectural but directly constrains code location, code scope and repository ownership.

---

## Coding continuation

A future coding agent should implement a **minimal seed**, not a framework.

Target:

```text
JeanHuguesRobert/Inox
```

Suggested first code path:

```text
lib/reactive/
```

Required first tests:

1. query equality matching;
2. query OR/AND matching;
3. `add/remove/update` on keyed set;
4. subscription by query;
5. packet attractor match;
6. TTL expiry;
7. best-effort drop accepted without failure;
8. durable flag preserved but not yet fully implemented.

Do not implement:

- full Query Tree optimization;
- full antistate;
- full COP bridge;
- VM verbs;
- package publication;
- Toubkal clone.

---

## Continuation

1. Add a concise prompt for a coding agent targeting `JeanHuguesRobert/Inox`.
2. Update `research/index.md` to list this document.
3. Consider adding a small `lib/reactive/README.md` before code.
4. After a working seed, define the COP bridge in Inseme.


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- For researchers
- [Research Index — Inox](index.md)
- [The Iɴᴏx programming language](../README.md)
- COP Reactive Cognitive Extension
- [Reactive Cognitive COP Extension](https://github.com/JeanHuguesRobert/inseme/blob/main/research/reactive_cognitive_cop_extension.md)
- [Research Index — Inseme](https://github.com/JeanHuguesRobert/inseme/blob/main/research/index.md)
- [Documents - All Tracked Repos](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/documents.md)
<!-- END_AUTO: backlinks -->
