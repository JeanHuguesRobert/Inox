---
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/AGENTS.md
last_stamped_at: 2026-07-13
document_role: "operational"
document_kind: "agent-mandate"
visibility: "public"
lifecycle_state: "active"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "agent-mandate"
classification_confidence: "strong"
---

# AGENTS.md — Inox agent mandate

This file gives operational instructions to AI agents and human assistants working in the `JeanHuguesRobert/Inox` repository.

It is not the full doctrine. It is a compact mandate for acting inside this repository without confusing language design, runtime implementation, examples, and speculative architecture.

## Shared baseline and read order

Before acting here:

1. read this repository-local `AGENTS.md`;
2. read the shared [`cogentia/AGENTS.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/AGENTS.md);
3. apply this local mandate wherever it is more specific or more restrictive;
4. consult the linked source doctrine when interpretation is needed.

The shared baseline supplies the default corpus workflow. This file specializes it for language design and runtime implementation; it does not silently widen permissions.

## Repository role

`Inox` is the language and runtime repository of the ecosystem.

Treat it as the technical layer for controlled execution, capabilities, programmable composition, and future gateway / dispatch logic.

## Core instruction

Before modifying this repository, distinguish:

```text
language concept
runtime behavior
implementation detail
example
specification
experiment
documentation
temporary trace
```

Do not let an implementation shortcut silently redefine the language or capability model.

## Corpus-wide rule

Apply the Cogentia Agent Configuration Layer:

```text
AGENTS.md is an operational projection, not the corpus itself.
The corpus remains the source of truth.
Human authorization governs stabilization.
```

References:

- [`cogentia/AGENTS.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/AGENTS.md)
- [`cogentia/research/agent_configuration_layer.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/agent_configuration_layer.md)
- [`cogentia/research/optimistic_mainline_governance.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/optimistic_mainline_governance.md)

## Direct-default-branch rule

This repository follows **Optimistic Mainline Governance** on its current default branch, `master`.

Small direct commits to `master` are acceptable when explicitly authorized, scoped, reversible, inspectable by diff, validated when possible, and reported after completion.

Do not create a branch or PR by default. Use one only when explicit instruction, collaboration, repository protection, high risk, semantic or architectural change, or genuine isolation value justifies it.

## Technical discipline

When touching code or technical documents:

- preserve existing behavior unless the change explicitly proposes a versioned alteration;
- separate specification, implementation, examples, and tests;
- avoid vendor lock-in assumptions;
- keep capability boundaries explicit;
- prefer small reversible changes;
- report commands run and checks not run.

## Routing discipline

Use the smallest sufficient container:

```text
concept        -> issue or design note
language rule  -> specification note
runtime change -> code + validation
example        -> example file or documentation
commit         -> durable trace
```

## Validation

Before presenting work as ready, report:

```text
Scope:
Files changed:
Commands run:
Tests passed or missing:
Behavior changed: yes/no
Known risks:
Next step:
Human validation needed: yes/no
```

## Authorization rule

Agents may prepare, draft, summarize, route, compare, code, and propose.

Agents must not commit, push, publish, tag a release, change licensing, change language semantics, or otherwise stabilize an action unless Jean Hugues Robert has given explicit, scoped authorization for that operation.

When authorization is ambiguous, prepare the batch and ask before acting.
