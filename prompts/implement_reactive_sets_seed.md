---
title: "Implement Inox Reactive Sets Seed"
subtitle: "Minimal coding continuation for ReactiveSet, ReactiveQuery, PacketAttractor and pressure strategies"
version: "0.1"
status: "coding-prompt — continuation"
date: "2026-06-01"
author: "Jean Hugues Noël Robert"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
license: "CC BY-SA 4.0"
language: "en"
repository: "JeanHuguesRobert/Inox"
intended_path: "prompts/implement_reactive_sets_seed.md"
derived_from: "research/reactive_sets_inox_cop_implementation.md"
tags:
  - inox
  - coding-prompt
  - reactive-sets
  - reactive-query
  - packet-attractor
  - pressure-strategies
  - cop
  - fractanet
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/prompts/implement_reactive_sets_seed.md
last_stamped_at: 2026-06-01
---

# Implement Inox Reactive Sets Seed

## Instruction to the coding agent

You are working in repository:

```text
JeanHuguesRobert/Inox
```

You are **not** implementing Toubkal.

You are **not** creating an `@inseme/reactive-cognitive` package.

You are implementing a minimal Inox-side seed for Reactive Sets, inspired by Toubkal and aligned with COP / Cogentia / Fractanet.

Read first:

- `README.md`
- `research/inox-spec.md`
- `research/reactive_sets_inox_cop_implementation.md`
- Inseme source document: `https://github.com/JeanHuguesRobert/inseme/blob/main/research/reactive_cognitive_cop_extension.md`
- COP operational note: `https://github.com/JeanHuguesRobert/inseme/blob/main/packages/cop-core/REACTIVE_COGNITIVE_EXTENSION.md`

## Goal

Create a small, readable, tested TypeScript seed under:

```text
lib/reactive/
```

This seed is a future Inox runtime primitive candidate. It is not a standalone framework.

## Files to create

```text
lib/reactive/
  README.md
  index.ts
  reactive_query.ts
  reactive_set.ts
  reactive_transaction.ts
  packet_attractor.ts
  pressure.ts

test/reactive/
  reactive_query.test.ts
  reactive_set.test.ts
  reactive_transaction.test.ts
  packet_attractor.test.ts
  pressure.test.ts
```

If the existing test infrastructure is not ready, use the simplest Node-compatible test style already present or add a minimal no-dependency test runner script only if necessary.

Do not introduce heavy dependencies.

## Design constraints

### 1. Control Plane / Data Plane

Every exported structure must make the split visible.

Control Plane:

- query;
- attractor;
- pressure strategy;
- ttl;
- durability;
- transaction metadata;
- routing hints.

Data Plane:

- packet payload;
- set value;
- add/remove/update operation;
- emitted state change.

### 2. ReactiveQuery

Implement the initial Toubkal-style grammar:

```ts
export type ReactiveQuery = Array<Record<string, unknown>>;
```

Semantics:

- array = OR;
- object = AND;
- attribute equality by default;
- supported operators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `in`.

Required functions:

```ts
matchesQuery(value: Record<string, unknown>, query: ReactiveQuery): boolean
normalizeQuery(query: ReactiveQuery): ReactiveQuery
```

Do not implement a full Query Tree yet.

### 3. ReactiveSet

Implement a keyed set.

Default key: `id`.

Required methods:

```ts
add(value)
remove(valueOrKey)
update(oldValueOrKey, newValue)
fetch(query)
subscribe(query, receiver)
unsubscribe(subscriptionId)
values()
size()
```

Subscriptions should receive simple operation notifications:

```ts
{
  operation: "add" | "remove" | "update",
  value?: object,
  oldValue?: object,
  newValue?: object,
  control?: object
}
```

### 4. ReactiveTransaction

Minimal transaction grouping.

Fields:

```ts
id
more
forks
operations
```

Required methods:

```ts
addOperation(operation)
complete()
isComplete()
```

Do not claim ACID rollback.

### 5. PacketAttractor

Implement declarative matching by:

- `packetKind`;
- query over payload;
- pressure strategy;
- source;
- metadata if easy.

Required function:

```ts
matchesAttractor(packet, attractor): boolean
```

### 6. PressureStrategy

Initial values:

```text
best-effort
ttl
bounded
demand
durable
```

Implement minimal helpers:

```ts
isExpired(policy, now): boolean
shouldDrop(policy, context): boolean
```

Required behavior:

- `best-effort` may drop without throwing;
- `ttl` expires after `ttlMs`;
- `durable` flag is preserved but does not require persistence yet;
- `bounded` may drop when simple limits are exceeded;
- `demand` should not propagate without an active demand flag.

## Tests required

1. equality query match;
2. OR query match;
3. comparison operator match;
4. `in` operator match;
5. ReactiveSet add/fetch;
6. ReactiveSet remove;
7. ReactiveSet update;
8. subscription receives matching add;
9. subscription ignores non-matching add;
10. transaction groups operations;
11. PacketAttractor matches packet kind and query;
12. TTL expiration works;
13. best-effort drop does not throw;
14. durable flag is preserved.

## Non-goals

Do not implement:

- full Toubkal clone;
- optimized Query Tree;
- antistate;
- VM verbs;
- COP bridge;
- npm package publication;
- browser build;
- ESP32 target;
- database persistence.

## Documentation requirements

`lib/reactive/README.md` must state:

- this is an Inox-native seed;
- it is inspired by Toubkal;
- it is aligned with COP and Cogentia;
- it is not `@inseme/reactive-cognitive`;
- Inseme owns the COP protocol surface, not the runtime;
- Inox owns the future native implementation path.

## Acceptance condition

The first acceptable result is small and boring:

- files compile or are syntactically coherent;
- tests demonstrate the minimal semantics;
- no large framework;
- no hidden dependency;
- no claim of full Toubkal compatibility.

## Output expected from the coding agent

After implementation, report:

1. files created;
2. tests added;
3. tests run and result;
4. known limitations;
5. next continuation.


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](../research/index.md)

<!-- END_AUTO: backlinks -->
