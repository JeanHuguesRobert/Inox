---
title: "Inox naming conventions and design influences"
author: "Jean Hugues Noël Robert, baron Mariani"
status: working-paper — working notes
date: "2026-05-22"
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/naming-conventions.md
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
license: "CC BY-SA 4.0"
last_stamped_at: 2026-06-01
---

# Inox naming conventions and design influences

This note explains why Inox names the verbs and concepts the way it does,
and which prior languages contributed each idea. It is not normative — the
canonical reference for syntax and semantics remains
[`inox-spec.md`](inox-spec.md). The intent here is to make the design
choices traceable so they can be argued with.

## Principle: prefer the full word

When a verb name in another language is a contraction or abbreviation that
no English-speaking reader would write in ordinary prose, Inox prefers the
full word.

| Tradition (short) | Inox (long) |
|---|---|
| `DUP` | `duplicate` |
| `MEM-DUMP` | `memory-dump` |
| `DEBUG` (cryptic flags) | `normal-debug` for the off-state, named in plain English |
| `DEPTH` | `data-depth`, `control-depth` — which stack? say so |
| `CLR` | `clear-data`, `clear-control` |

The principle is not aesthetic, it is operational: a reader who has never
seen the program before should be able to parse the meaning without a
glossary. Inox is meant to descend, eventually, to small devices where it
will be the lingua franca of agents that interoperate without a shared
human author — the names need to survive without a human to translate
them.

## Exception: canonical names from a tradition

Some short names are not abbreviations at all — they are the proper names
of their concepts in the lineage Inox descends from. Renaming them would
sever the link to a body of prior work. The classics from Forth are
preserved as-is:

```
swap   over   nip   tuck   pick   roll   rotate   drop
```

These are the words a 50-year corpus of Forth literature already uses with
exactly Inox's intent. Spelling them out (`exchange`, `peek-second`,
`discard`) would gain nothing and would isolate Inox from the readership
of every Forth-era text.

## Exception: compound names retain the parts

When a short name appears as a prefix or suffix modifier inside a compound,
the compound is treated as a single name, not a renaming:

```
?dup    2dup    over!    swap!
```

`?dup` is a single Forth-tradition word meaning *duplicate-if-truthy*. The
modifier `?` is part of the name. We do not write `?duplicate`.

## Homage aliases: stdlib, not spec

Where the corrected long form lives in the runtime but the short Forth
form is so canonical that it is part of the language's identity, we keep
the short form as an **alias** in
[`lib/bootstrap.nox`](../lib/bootstrap.nox), not in the spec. The spec
documents `duplicate`; the runtime answers to both.

```
to dup    duplicate    ~~ Forth homage
```

This is the deliberate place to honour a tradition without forking the
canonical name.

## Suffix conventions for verb names

| Suffix | Meaning | Example |
|---|---|---|
| `?` | predicate, returns boolean | `even?`, `something?`, `verb.exist?` |
| `!` | mutates / has a side effect | `>x!`, `name!`, `classes .!` |
| `/` | "applied on", function-style call | `tell-to/`, `fib/` |
| `.foo` | method on the class to the left | `point.dump`, `text.box` |

These are read aloud naturally: `even?` is *"even-question"*, `name!` is
*"name-bang"*, `tell-to/` is *"tell-to-of"*. The suffixes are documented
in the spec; this table is the short reference.

## Design influences

Each row names a tradition Inox draws from, what it took, and where the
debt shows.

| Tradition | What Inox took | Where it shows |
|---|---|---|
| **Forth** (Charles H. "Chuck" Moore, 1970) | Concatenative composition, two stacks, immediate verbs, the `swap / over / drop / nip / tuck` vocabulary, dialect mechanism. | Postfix notation, control/data stack separation, the `forth-dialect` shebang for small targets. |
| **Smalltalk** (Alan Kay et al.) | Keyword-style multi-part message calls, `class.method` syntax, `:` separators. | `say: "Hi" to: "Bob";` and `if:then:else:`. |
| **Erlang** (Joe Armstrong) | Actor-based concurrency, message passing, share-nothing. | The (still WIP) actor model and the `make.actor` primitive. |
| **Lisp** | Symbols as first-class values (Inox calls them *tags*), prefix call syntax as one of the supported dialects. | `/red`, `red/`, `#red` — three syntaxes for the same tag. The prefix `out( "hello" )` call form. |
| **Prolog** | Pattern matching and unification as a planned extension of ranges. | Range syntax (`..`, `...`, `::`) is shaped to receive pattern semantics later. |
| **Toubkal** (the author's own dataflow engine) | Reactive sets — typed streams that flow through processing graphs. | Inox actors handle these as a distinct stack type; the engine is the bridge. |
| **C / AssemblyScript** | The discipline of cross-compilation directives, single-file translation units. | The `lib/inox.ts` source is annotated with `/*c{ ... }*/`, `//c/ ...`, `//as/ ...` so the same file emits the TypeScript reference, a C++ target, and an AssemblyScript target. |
| **US Patent US7606221B2** (the author's autodiscovery work) | The architectural principle that nodes coordinate without a capturable centre. | Why Inox exists at all: a runtime that can descend from Node.js to ESP32-class hardware without depending on any one platform. |
| **Buffon** ("le style, c'est l'homme", 1753) | The motto. | The README, and the disposition to treat code style as a first-class question. |

## What is not Inox

Inox is not a Lisp, not a Smalltalk, not a Forth — even though it borrows
from all three. The compound it composes from these elements is its own:
named values, two strictly separated stacks, multiple dialects, and a
language-level dispatch mechanism implemented in the language itself
(see [`inox-spec.md`](inox-spec.md) §"Method protocol" and §"Polymorphic
methods").

The naming conventions here serve that compound. Where Inox departs from
a tradition, the departure is the point. Where it preserves the tradition
(as with the bare Forth verbs), the preservation is the point.

---

*See also*: [`research/inox-spec.md`](inox-spec.md) for the canonical
syntax and semantics, [`README.md`](../README.md) for the corpus-level
position, and [`research/learning-inox.md`](learning-inox.md) for a
short tutorial.


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Corpus Status — Inox](corpus-status.md)
- [Research Index — Inox](index.md)
- [The Inox Programming Language — Specification](inox-spec.md)
- [Learning Inox — A tutorial for AI agents (and humans in a hurry)](learning-inox.md)

<!-- END_AUTO: backlinks -->
