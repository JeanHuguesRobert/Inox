---
title: "Inox Documentation Index"
subtitle: "Orientation map for specification, doctrine, tutorials, and pending documentation patches"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-06-02"
license: "MIT (code) · CC BY-SA 4.0 (text)"
status: "working-note"
version: "0.1"
corpus_role: "index"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-docs-index.md"
document_role: "index"
document_kind: "navigation"
visibility: "public"
lifecycle_state: "working"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "explicit-index"
classification_confidence: "medium"
---

# Inox Documentation Index

## 1. Purpose

This index maps the current documentation files related to the Inox programming language, with a focus on the recent clarification of named values, named stack cells, and the absence of an assignment operator in core Inox.

It is intended for:

- human readers discovering Inox;
- future maintainers of the specification;
- tutorial generators;
- LLM agents working on Inox documentation;
- implementation audits comparing specification and source code.

## 2. Core specification

### [`inox-spec.md`](inox-spec.md)

Main working specification of the Inox programming language.

Role:

- defines the language vision;
- introduces named values, stacks, verbs, notations, dialects, variables, objects, actors and control structures;
- remains the primary design document, but still contains historical terminology that should be progressively aligned with the newer naming doctrine.

Status:

```text
primary specification, in progress
```

Related pending patch:

- [`inox-spec-naming.patch`](inox-spec-naming.patch)

## 3. Naming and assignment doctrine

### [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)

Short doctrinal note clarifying that core Inox has no assignment operator.

Central rule:

```text
Inox has no assignment operator.
`=` is not assignment.
```

The file defines the preferred distinction:

```text
beginner-facing term: named value
precise term: named stack cell
implementation term: named stack cell
```

It also maps the main surface forms:

```text
>xxx      create local named value
xxx>      retrieve local named value
$xxx      retrieve local named value
>xxx!     update local named value
_xxx      retrieve data-stack named value
_xxx!     update data-stack named value
:xxx      rename top stack value
```

Status:

```text
new doctrinal anchor
```

## 4. Tutorial-generation rules

### [`inox-tutorial-generation-guidelines.md`](inox-tutorial-generation-guidelines.md)

Rules for generating beginner-facing Inox tutorials without importing classical assignment semantics.

Use this file when asking an LLM or another documentation generator to produce a tutorial.

It forbids valid-looking examples such as:

```text
x = 42
y = x + 1
```

unless they are explicitly marked as anti-examples.

It requires tutorials to explain examples through stack effects:

```text
push → consume → produce → name → retrieve → update
```

Status:

```text
guardrail for generated tutorials
```

## 5. Basic tutorial

### [`inox-tutorial-basic.md`](inox-tutorial-basic.md)

Minimal beginner tutorial written under the new doctrine.

It introduces:

- literal values;
- verbs;
- stack effects;
- local named values;
- retrieval with `x>` and `$x`;
- updates with `>x!`;
- data-stack named values with `_x` and `_x!`;
- renaming with `:x`;
- tags `/x` and `x/`;
- global getter/setter variables;
- anti-examples for `x = value`.

Status:

```text
basic tutorial, v0.1
```

## 6. Pending patch: specification alignment

### [`inox-spec-naming.patch`](inox-spec-naming.patch)

Patch intended to align `inox-spec.md` with the newer doctrine.

It adds:

- a link from the specification to `inox-naming-and-assignment.md`;
- a stronger definition of variables as named stack cells;
- a clear statement that core Inox has no assignment operator;
- examples of `>x`, `x>`, `$x`, `>x!`, `_x`, `_x!`, and `:x`;
- replacement of “set variable” vocabulary with “update named cell” vocabulary.

Status:

```text
pending patch, not yet applied to inox-spec.md
```

Reason for separate patch:

```text
Safer than replacing a large specification file through a truncated tool response.
```

## 7. Pending patch: source-comment cleanup

### [`inox-comment-cleanup.patch`](inox-comment-cleanup.patch)

Patch intended to clean up ambiguous comments in `lib/inox.ts`.

It replaces wording such as:

```text
assign a value to a local variable
```

with wording such as:

```text
update an existing local named cell from the data stack
```

This matters because some generated documentation is built from comments in the source file.

Status:

```text
pending patch, not yet applied to lib/inox.ts
```

Reason for separate patch:

```text
lib/inox.ts is very large; direct full-file replacement is unsafe without a proper patch workflow.
```

## 8. Recommended reading order

For a new reader:

1. [`inox-tutorial-basic.md`](inox-tutorial-basic.md)
2. [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)
3. [`inox-spec.md`](inox-spec.md)

For a documentation generator:

1. [`inox-tutorial-generation-guidelines.md`](inox-tutorial-generation-guidelines.md)
2. [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)
3. [`inox-tutorial-basic.md`](inox-tutorial-basic.md)

For a maintainer:

1. [`inox-spec.md`](inox-spec.md)
2. [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)
3. [`inox-spec-naming.patch`](inox-spec-naming.patch)
4. [`inox-comment-cleanup.patch`](inox-comment-cleanup.patch)
5. `lib/inox.ts`

For an implementation audit:

1. `lib/inox.ts`
2. [`inox-spec.md`](inox-spec.md)
3. [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)
4. [`inox-tutorial-generation-guidelines.md`](inox-tutorial-generation-guidelines.md)

## 9. Current doctrine snapshot

```text
Inox is stack-first, not expression-first.

A value is pushed.
A verb consumes or produces values.
A value may be named.
A named value may be retrieved.
An existing named value may be updated.

Core Inox has no assignment operator.
`=` is not assignment.
```

Core naming/update forms:

```text
>x       create local named value
x>       retrieve local named value, postfix style
$x       retrieve local named value, prefix style
>x!      update local named value
_x       retrieve data-stack named value
_x!      update data-stack named value
:x       rename top stack value
/x x/    tag/name literals
```

Implementation-level expansion:

```text
>xxx      → /xxx make.local
>xxx!     → /xxx local!
$xxx      → /xxx local
xxx>      → /xxx local
_xxx      → /xxx data
_xxx!     → /xxx data!
:xxx      → /xxx rename
```

## 10. Open tasks

The following tasks remain open:

1. Apply `inox-spec-naming.patch` to `inox-spec.md` using a safe patch workflow.
2. Apply `inox-comment-cleanup.patch` to `lib/inox.ts` using a safe patch workflow.
3. Regenerate any generated primitive documentation after source-comment cleanup.
4. Audit examples in the repository for invalid `=` assignment explanations.
5. Decide whether `named value`, `named stack cell`, or `variable` should dominate each documentation layer.
6. Decide whether `local`, `local!`, `data`, and `data!` are public advanced vocabulary or implementation-level vocabulary.

## 11. Proposed terminology by layer

| Layer | Recommended term |
|---|---|
| Beginner tutorial | named value |
| Specification | named value, more precisely named stack cell |
| Implementation comments | named stack cell |
| VM/runtime | cell |
| Contrast with mainstream languages | variable, but explicitly redefined |

## 12. Anti-regression rule

Any future tutorial, README section, generated documentation or LLM-produced explanation must pass this rule:

```text
If it presents `x = value` as valid core Inox, it is wrong.
```

Correct model:

```inox
value >x
x>
value >x!
```
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](index.md)
<!-- END_AUTO: backlinks -->
