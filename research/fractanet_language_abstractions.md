---
title: "Inox as the Fractanet Language — External Abstractions Absorption Map"
subtitle: "Supervision, actors, streams, adapters, reactive sets, memory and progressive native coverage"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-07-03"
status: "working-note"
version: "0.1"
license: "CC BY-SA 4.0"
language: "en"
repository: "JeanHuguesRobert/Inox"
canonical_path: "Inox/research/fractanet_language_abstractions.md"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/fractanet_language_abstractions.md"
document_role: "source"
document_kind: "working-note"
visibility: "public"
lifecycle_state: "working"
source_or_derived: "source-document"
human_validation_required: true
related_documents:
  - "Inox/research/inox-spec.md"
  - "Inox/research/two-versions-scripting-vs-system.md"
  - "Inox/research/js-interop-api-for-scripting-layer.md"
  - "Inox/research/reactive_sets_inox_cop_implementation.md"
  - "FractaVolta/research/fractanet.md"
  - "inseme/packages/cop-core/Invariants.md"
  - "inseme/packages/cop-core/ImplementationProfiles.md"
  - "cogentia/research/pipeline.md"
  - "cogentia/research/cognitive_packets.md"
  - "cogentia/research/memory_and_corpus_sleep_cycle.md"
tags:
  - inox
  - fractanet
  - language
  - dialects
  - external-abstractions
  - supervision
  - actors
  - reactive-sets
  - cop
  - adapters
  - memory
  - corpus-sleep-cycle
---

# Inox as the Fractanet Language

## External Abstractions Absorption Map

## 0. Orientation

This note records a correction of architectural priority.

**Inox is intended to become the language of Fractanet.** External systems such as Erlang/OTP, Elixir, Orleans, Dapr, NATS, MQTT, ESPHome, Home Assistant, Rust/Tokio, Python and Unix shell are not competing centers. They are reservoirs of abstractions, temporary substrates, implementation profiles, adapters, or package ecosystems to be absorbed when useful.

The goal is not purity. The goal is progressive sovereignty:

```text
use fast
wrap early
trace always
migrate progressively
```

The long-term direction is:

```text
external package
→ thin Inox wrapper
→ traceable Inox wrapper
→ Fractanet capability verb
→ Inox dialect
→ native Inox primitive when justified
```

A package may remain external indefinitely when its domain is large, fast-moving, hardware-specific, model-specific, or better maintained by an existing community. A recurring, critical, trace-sensitive or anti-capture-sensitive abstraction should progressively move inward.

---

## 1. Core rule

```text
Inox is the language.
Packages are adapters.
Dialects are migration surfaces.
COP is the trace and supervision grammar.
Fractanet is the capability network.
```

A Fractanet node should not be defined by its host language. It should be defined by the invariants it preserves:

- capability verbs rather than fixed endpoints;
- strict control-plane / data-plane separation;
- explicit envelope / payload distinction;
- durable events and artifacts where consequences matter;
- replayable traces;
- bounded side effects;
- regime-aware execution;
- local degraded modes;
- anti-capture redundancy;
- progressive migration from foreign adapters to native Inox coverage.

---

## 2. Graduation ladder

| Level | Name | Description | Example |
|---|---|---|---|
| L0 | Foreign package | Direct dependency in JS, Python, shell, Rust, etc. | `npm mqtt`, `python transformers`, `scanimage` |
| L1 | Thin Inox wrapper | Minimal verb around the foreign call | `mqtt.publish`, `python.call`, `unix.run` |
| L2 | Traceable wrapper | Inputs, outputs, errors, cost and exit state captured | `unix.run/traced`, `ai.infer/traced` |
| L3 | Fractanet capability verb | Mandate, rights, TTL, regime and routing metadata included | `/capability/load-shed/propose` |
| L4 | Dialect | Stable surface for a domain | `iot{}`, `energy{}`, `ai{}`, `unix{}` |
| L5 | Native Inox primitive | Implemented as part of the Inox runtime or near-runtime | `reactive-set`, `actor`, `packet-attractor` |
| L6 | Portable target | Same semantics carried to WASM, C/C++, ESP32-like targets | `inox-micro` subset |

Migration is justified by recurrence, criticality, auditability, portability, anti-capture value and runtime constraints.

---

## 3. Abstraction map

| Source ecosystem | Abstraction worth taking | Inox / Fractanet translation |
|---|---|---|
| Erlang/OTP | supervision tree, crash isolation, restart strategy | `supervisor`, `child`, `restart-policy`, `escalate` |
| Elixir/OTP | modern ergonomic access to BEAM supervision | readable Inox dialect for service trees |
| Orleans | virtual actors, stable identity, activation on demand | `actor-id`, `activate`, `deactivate`, `route-to` |
| Dapr | portable building blocks and sidecar boundary | `capability adapter`, `binding`, `state`, `pubsub` |
| NATS/JetStream | subjects, durable streams, replay, consumers | `topic`, `stream`, `consumer`, `ack`, `replay` |
| MQTT | lightweight IoT pub/sub | `iot.mqtt.publish`, `iot.mqtt.subscribe` |
| ESPHome | declarative micro-node profiles | generated or mirrored `micro-node` profile |
| Home Assistant | integration reservoir and dashboard | adaptor plane, not control plane |
| Rust/Tokio | safe low-level async adapters | backend for critical I/O verbs |
| Python | AI and scientific ecosystem | `python.worker`, `ai.adapter`, model calls |
| Unix shell | process, pipe, exit code, files | `unix.run`, `unix.pipe`, `unix.capture` |
| Toubkal / Reactive Sets | reactive queries, antistate, transactions | native `ReactiveSet`, `ReactiveQuery`, `PacketAttractor` |

---

## 4. Erlang/OTP abstraction: supervision

The useful abstraction is not Erlang syntax. It is the fault discipline:

```text
something fails
→ the runtime knows what failed
→ a supervisor decides what to restart
→ repeated failure is bounded
→ escalation is explicit
```

Inox should express this as a Fractanet supervision dialect:

```text
supervisor{
  strategy: /one-for-one
  intensity: 5
  period: 30s

  child: /mqtt-bridge restart: /permanent
  child: /tic-linky  restart: /transient
  child: /phone-sync restart: /temporary
}
```

COP-compatible rule:

```text
process recovery is not state recovery
state recovery comes from Events and Artifacts
```

A supervised actor may cache local state for performance, but meaningful state must be durable, inspectable and reconstructible when consequences matter.

---

## 5. Orleans abstraction: virtual actors

The useful abstraction is stable addressability:

```text
capability-id > process-id
```

A Fractanet packet should target a capability, actor identity or route, not a fragile process instance.

Example target identities:

```text
/capability/hot-water/diagnose
/capability/load-shed/propose
/capability/senior-alert/escalate
/actor/domestic-relay/minesteggio/water-heater
```

Inox should eventually support actor-like structures where activation, deactivation, routing, mailbox policy and persistence are explicit.

---

## 6. Dapr abstraction: building blocks without capture

The useful abstraction is the portable service boundary:

```text
state.get
state.put
pubsub.publish
binding.invoke
secret.read
workflow.start
```

Fractanet must add what generic building blocks usually omit:

- mandate;
- capability rights;
- regime;
- trace requirement;
- exergy or cost metadata;
- anti-capture constraints;
- human validation anchors when responsibility is engaged.

Therefore:

```text
Dapr building block = technical API
Fractanet capability verb = technical API + mandate + trace + regime + anti-capture
```

---

## 7. NATS and MQTT abstraction: topics, streams and transport

NATS-like systems contribute the vocabulary of subjects, streams, consumers, durable subscriptions and replay. MQTT contributes lightweight local publish/subscribe for IoT.

Inox should distinguish transport topics from COP topics:

```text
transport subject = how a message circulates
COP Topic = logical ordering and replay domain
Fractanet packet = governed unit of useful capacity
```

Possible verbs:

```text
mqtt.publish
mqtt.subscribe
nats.publish
nats.subscribe
stream.append
stream.replay
consumer.ack
topic.project
```

Transport can help preserve COP invariants. It must not replace them.

---

## 8. ESPHome and Home Assistant abstraction: micro-node and integration reservoir

For domestic and energy use, the practical pattern is:

```text
ESP32 / ESPHome = sensor or actuator
MQTT = local transport
Home Assistant = integration and dashboard reservoir
Inox = language of control and capability composition
COP = trace and supervision
Fractanet = capability network
```

Home Assistant should remain useful but non-sovereign:

```text
compatible with Home Assistant
not dependent on Home Assistant
```

ESPHome-like YAML profiles can be generated, mirrored, or imported by Inox, but YAML must not become the Fractanet language.

---

## 9. Rust, Python and shell abstraction: foreign execution under envelope

Rust/Tokio is suitable for low-level, performance-sensitive or safety-sensitive adapters. Python is suitable for AI, scientific libraries and model ecosystems. Unix shell is suitable for local process composition.

Inox should not reject them. It should envelope them.

```text
foreign execution must be explicit, bounded, captured and traceable
```

Example:

```text
unix.run "scanimage --format=png"
  with timeout 30s
  with cwd "/data/scans"
  with env sanitized
  capture stdout stderr exit-code
  emit cop-event
```

Repeated use of a foreign call should trigger a migration question:

```text
Does this remain an adapter,
or should it become an Inox verb, dialect or primitive?
```

---

## 10. Reactive Sets as native destiny

Reactive Sets are not just another package category. They are a deep match for Inox and Fractanet.

The target abstractions are:

- `ReactiveSet`;
- `ReactiveQuery`;
- `ReactiveTransaction`;
- `PacketAttractor`;
- `PressureStrategy`;
- antistate;
- `fetch` / `subscribe`;
- `add` / `remove` / `update`.

This provides a stronger abstraction than plain pub/sub:

```text
pub/sub = receive what is published on a channel
reactive query = receive what matches a structured demand
packet attractor = attract packets one is capable and legitimate to handle
```

Reactive Sets should migrate toward native Inox runtime structures, while COP remains the trace and protocol boundary.

---

## 11. Dialect roadmap

| Dialect | Audience | Purpose |
|---|---|---|
| `inox-script` | agents and humans | obvious scripting, files, maps, JS bridge |
| `inox-cop` | Cogentia / Inseme | Events, Artifacts, Topics, Continuations, replay |
| `inox-fractanet` | Fractanet nodes | packets, capability verbs, routing, regimes |
| `inox-reactive` | dataflow runtime | Reactive Sets, queries, antistate, attractors |
| `inox-iot` | domestic relays | MQTT, ESPHome, sensors, actuators |
| `inox-energy` | FractaVolta | Linky, batteries, load shedding, exergy |
| `inox-ai` | Cogentia / AI | model workers, inference packets, costs, artifacts |
| `inox-unix` | local automation | process, pipes, files, exit codes |
| `inox-micro` | constrained targets | minimal safe subset for ESP32/OpenWrt/WASM-like targets |

---

## 12. Memory and consolidation constraint

Fractanet and Inox must not assume that all traces should remain hot, fine-grained and active forever.

Keeping everything indefinitely at small granularity is neither efficient nor robust over time. It increases noise, cost, attack surface, retrieval ambiguity, stale-context risk, and capture by accumulated irrelevant detail.

The memory problem has at least two axes:

```text
individual ↔ collective
working / ephemeral ↔ long-term / consolidated
```

This creates four memory regimes:

| Regime | Description | Typical substrate |
|---|---|---|
| Individual working memory | current context, scratchpad, active task state | hot cache, continuation, local agent context |
| Individual long-term memory | stable personal corpus, commitments, biography, doctrine | source corpus, validated artifacts, cold archive |
| Collective working memory | issue, debate, PR, incident room, project tension | GitHub issue, branch, board, temporary workspace |
| Collective long-term memory | statutes, doctrine, decisions, source documents, public archives | canonical docs, releases, institutional records |

A Fractanet node needs verbs and policies for memory temperature:

```text
remember
recall
promote
cool
freeze
summarize
supersede
obsolete
forget
consolidate
```

The corresponding Cogentia concept is a **Corpus Sleep Cycle**: a periodic consolidation pass that deduplicates, clusters, summarizes, links, classifies, cools, stabilizes, forgets or escalates traces. The sleep analogy is an engineering metaphor and a design inspiration, not a neuroscience claim.

Inox implication:

```text
working memory is operational
long-term memory is governed
consolidation is a first-class operation
forgetting is not a bug when it is explicit, lawful and traceable
```

---

## 13. Migration checklist

For every external package, adapter or new verb, answer:

1. What abstraction is being borrowed?
2. Is the borrowed abstraction technical, cognitive, operational, institutional, or energetic?
3. What is the smallest Inox wrapper that makes it usable?
4. What side effects must be captured?
5. What COP Events or Artifacts are required?
6. What regime applies: normal, degraded, critical, vital, recovery?
7. What memory temperature applies to produced traces?
8. What would justify migration from wrapper to dialect?
9. What would justify migration from dialect to native primitive?
10. What must remain external for maintenance, safety or ecosystem reasons?

---

## 14. Non-capture safeguards

Avoid:

- actors with hidden critical state;
- untraced shell commands;
- opaque AI workers;
- Home Assistant as final control plane;
- Dapr-like sidecars as unexamined dependencies;
- transport-level replay confused with COP replay;
- YAML as de facto sovereign language;
- external packages becoming architectural owners by convenience;
- infinite raw retention mistaken for memory.

Prefer:

- explicit capability verbs;
- bounded foreign execution;
- traceable wrappers;
- native Inox migration roadmaps;
- memory temperature policies;
- human validation anchors where responsibility is engaged;
- redundant but non-capturable stores for long-term memory.

---

## 15. Next artifacts

Candidate follow-up documents:

- `Inox/research/fractanet_dialect_roadmap.md`;
- `Inox/research/inox_foreign_adapter_policy.md`;
- `Inox/research/inox_supervision_model.md`;
- `Inox/research/inox_memory_verbs.md`;
- `cogentia/research/memory_and_corpus_sleep_cycle.md`;
- `FractaVolta/research/fractanet_node_profiles.md`.

The next practical checkpoint is to choose one small vertical slice:

```text
MQTT foreign package
→ Inox wrapper
→ COP-traced event
→ simple Fractanet capability verb
→ documented migration note
```

Suggested first slice:

```text
button → relay → local log → mqtt publish → smartphone ack → COP event → replay check
```
