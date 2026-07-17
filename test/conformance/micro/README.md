---
title: "Inox Micro v0 Conformance Contract"
author: "Jean Hugues Noël Robert, baron Mariani"
drafted_by: "OpenAI Codex (GPT-5)"
principal: "Jean Hugues Noël Robert"
date: "2026-07-16"
status: "draft-for-human-review"
version: "0.1.0-draft"
license: "MIT"
repository: "JeanHuguesRobert/Inox"
document_role: "operational"
document_kind: "conformance-contract"
visibility: "public"
lifecycle_state: "working"
update_policy: "UP-DECISION-REVIEW"
human_validation_required: true
provenance:
  origin_type: "derived-conformance-contract"
  origin_repository: "JeanHuguesRobert/Inox"
  origin_ref: "master@4177159e2096df1512b8001c09ba90e1d563c30c"
  origin_date: "2026-07-16"
  derived_from:
    - "research/inox-cpp-micro-runtime-and-images.md"
    - "profiles/inox-micro-v0.json"
review:
  status: "unreviewed"
  reviewed_by: []
---

# Inox Micro v0 conformance contract

Status: draft for human review.

Normative source:
[`research/inox-cpp-micro-runtime-and-images.md`](../../../research/inox-cpp-micro-runtime-and-images.md).

Machine-readable profile:
[`profiles/inox-micro-v0.json`](../../../profiles/inox-micro-v0.json).

## Agent instructions

Read the repository-local `AGENTS.md` and shared `cogentia/AGENTS.md` before
changing these tests.

A coding agent MUST NOT:

- change an expected value merely to make an implementation pass;
- remove a negative vector;
- renumber a type, region, primitive, status, error, section, or link verb;
- add platform-specific expected behavior to a portable vector;
- proceed when the normative document and manifest disagree.

When a vector appears wrong, stop and request a reviewed contract change.

## Runner contract

Each runner accepts `manifest.json`, executes every vector whose `phase` is not
later than the implemented milestone, and emits one line of JSON per case:

```json
{"id":"cell.pack.integer","status":"pass"}
```

On failure it emits:

```json
{"id":"cell.pack.integer","status":"fail","expected":"...","actual":"..."}
```

The process exits with code zero only when every selected vector passes.

## Required runners

The intended commands are:

```text
npm run test:micro:vectors
cmake --build ports/cpp/build --target test_micro
idf.py -C ports/cpp/platform-esp32 test
```

Exact commands MAY be introduced with their milestones, but all runners MUST
consume the same logical vectors.

## Fixture policy

Binary images and snapshots belong in `fixtures/`. Every binary fixture MUST be
reproducible from a checked-in declarative source and MUST have its SHA-256
recorded in the manifest. Do not hand-edit binary fixtures.

Malformed fixtures SHOULD be generated mechanically by applying one declared
mutation to a valid fixture.

## Completion report

Every change reports:

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
