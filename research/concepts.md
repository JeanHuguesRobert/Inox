---
title: "Concept Index — Inox"
description: "Typed concept registry for the Inox programming language; structure only, not semantic authority."
layout: default
nav_order: 3
last_modified_at: 2026-05-21
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/concepts.md
last_stamped_at: 2026-06-01
license: CC BY-SA 4.0
affiliation: Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica
date: 2026-05-21
creator: Jean Hugues Noël Robert, baron Mariani
---

# Concept Index — Inox

This file maps concepts used in the Inox programming language.

`cogentia.js` maintains structure, links, scopes, status and graphs. It does not infer semantic truth.

## Status scale

- **Seed** — intuition not yet stabilized.
- **Working** — recurring and usable, but still evolving.
- **Defined** — explicit definition exists.
- **Operational** — connected to implementation, protocol, code, governance or legal use.
- **Canonical** — should be treated as a reference concept unless revised.

---

## Concatenative language

**Type:** language paradigm
**Scope:** Global
**Status:** Canonical

**Short definition:**
A programming paradigm in which programs are built by juxtaposing verbs (functions) rather than nesting them as expressions. Composition is the default; each verb consumes and produces values on a stack. Forth (1970) is the canonical ancestor; Inox is in that lineage.

**Related concepts:**
- Stack VM
- Named values

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Stack VM

**Type:** runtime architecture
**Scope:** Global
**Status:** Operational

**Short definition:**
A virtual machine in which the primary data structure is one or more stacks, rather than registers or random-access memory. In Inox, the basic data element is a 64-bit cell composed of a typed value and a name; stacks of these cells carry the entire computational state.

**Related concepts:**
- Concatenative language
- Control/data plane separation
- Named values

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Control/data plane separation

**Type:** architectural principle
**Scope:** Global
**Status:** Canonical

**Short definition:**
The architectural separation of the *control plane* (what the machine is currently doing — call stack, instruction pointer, conditionals, loops) from the *data plane* (what it is operating on — values being manipulated, accumulated, transformed). In Inox, the control stack and the data stack are distinct; data can stay on the data stack long enough to express state machines natively, without needing external storage.

This is the same pattern as the EPN's separation between routing protocol and operation, asked at the language level. See [UNCONSCIOUS_GRID §8](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md).

**Parent concepts:**
- Stack VM

**Related concepts:**
- Energy Packet Network (FractaVolta)
- Cognitive Packet envelope/payload (Cogentia)

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Named values

**Type:** language primitive
**Scope:** Global
**Status:** Defined

**Short definition:**
Every Inox value carries a name (a tag) in addition to its type and content. Names allow access without index-based positioning; they are how variables are addressed in stacks, how control structures are expressed without instruction-pointer manipulation, and how dialects can rebind verbs without breaking existing code. Distinct from object identity: many values may share the same name.

**Parent concepts:**
- Stack VM

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Reactive sets

**Type:** distributed primitive
**Scope:** Global
**Status:** Seed

**Short definition:**
Inox sets that propagate changes to dependent computations across distributed nodes. Intended as the foundation of dataflow processing in the future *Fractanet*. Implementation is exploratory.

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Actors

**Type:** concurrency model
**Scope:** Global
**Status:** Working

**Short definition:**
Concurrency unit in Inox: an actor owns a stack, exchanges messages asynchronously with other actors, and may be local or remote. Lineage: Erlang. Used to express asynchronicity, parallelism, and distribution across the *Fractanet*.

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Dialects

**Type:** language facility
**Scope:** Global
**Status:** Defined

**Short definition:**
Multiple predefined and custom notations (prefix, infix, postfix) for the same underlying concatenative semantics. Inox supports several dialects so the same program can be written in the form most appropriate to its audience or its domain. This is a deliberate refusal of the *one true syntax* assumption common to mainstream languages.

**Reference documents:**
- [`research/inox-spec.md`](inox-spec.md)

---

## Fractanet

**Type:** distributed system
**Scope:** Global
**Status:** Seed

**Short definition:**
Working name for the FractaVolta network — the distributed mesh of autonomous nodes (sensors, edge compute, energy packet routers, civic instances) that the corpus aims to operate. Inox is the intended runtime substrate for *Fractanet* nodes, descending from Node.js to bare-metal microcontrollers (ESP32) as the network matures.

**Related concepts:**
- Energy Packet Network (FractaVolta)
- Auxilia (Inseme brique — human-scale Fractanet exchange)
- Actors

**Reference documents:**
- `README.md`
- [UNCONSCIOUS_GRID](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/UNCONSCIOUS_GRID.md)


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](index.md)
<!-- END_AUTO: backlinks -->
