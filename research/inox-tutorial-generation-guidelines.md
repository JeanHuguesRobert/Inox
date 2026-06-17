---
title: "Inox Tutorial Generation Guidelines"
subtitle: "How to generate beginner-facing Inox tutorials without importing classical assignment semantics"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-06-02"
license: "MIT (code) · CC BY-SA 4.0 (text)"
status: "working-note"
version: "0.1"
corpus_role: "source"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-tutorial-generation-guidelines.md"
---

# Inox Tutorial Generation Guidelines

## 1. Purpose

This document defines mandatory rules for generating beginner-facing tutorials for the Inox programming language.

Its immediate purpose is to prevent a recurring error: explaining Inox as if it had a classical assignment operator such as:

```text
x = value
```

Core Inox has no assignment operator. The `=` sign must not be taught as assignment.

Tutorials must explain Inox as a concatenative, stack-based language with named values / named stack cells.

Reference doctrine:

- [`inox-naming-and-assignment.md`](inox-naming-and-assignment.md)
- [`inox-spec.md`](inox-spec.md)

## 2. Mandatory model

Every generated tutorial must start from this model:

```text
literal values are pushed onto the data stack;
verbs consume values from stacks;
verbs may produce values onto stacks;
some forms name, retrieve, update, or rename stack cells;
control and data planes remain distinct.
```

Do not start from this model:

```text
source → expression parser → AST → assignment → generated code
```

The Inox implementation does contain parsing and compilation machinery, but the surface semantics must be explained first through stack effects.

## 3. Forbidden beginner explanation

Do not generate examples like:

```inox
x = 42
```

Do not generate examples like:

```inox
y = x + 1
```

Do not describe Inox using these expressions unless explicitly presenting them as anti-examples from non-Inox languages:

```text
assignment operator
assignment expression
left-hand side
right-hand side
variable receives a value
store into variable with `=`
```

The only acceptable beginner-facing statement about assignment is:

```text
Inox has no assignment operator. In particular, `=` is not assignment.
```

## 4. Required beginner vocabulary

Use this vocabulary:

| Preferred term | Use |
|---|---|
| named value | beginner-facing explanation |
| named stack cell | precise specification / implementation explanation |
| local named value | value held as a named cell in the control stack |
| data-stack named value | named cell in the data stack |
| update | effect marked by `!` |
| retrieve | reading a named value back to the data stack |
| consume TOS | taking the top of stack as input |
| stack effect | what a form does to stacks |

Avoid using `variable` until after the term has been defined as a convenience for a named stack cell.

## 5. Canonical forms to teach

Teach these forms early:

| Inox form | Explanation |
|---|---|
| `42 >x` | Push `42`, then create local named value `x` from TOS. |
| `x>` | Retrieve local named value `x`, postfix style. |
| `$x` | Retrieve local named value `x`, prefix style. |
| `43 >x!` | Update existing local named value `x` from TOS. |
| `_x` | Retrieve named value `x` from the data stack. |
| `99 _x!` | Update existing data-stack named value `x`. |
| `:x` | Rename the top stack value as `x`. |
| `/x` or `x/` | Push the tag/name `x`. |

## 6. Expansion layer

After the surface syntax is clear, the tutorial may explain the implementation-level expansion:

```text
>xxx      → /xxx make.local
>xxx!     → /xxx local!
$xxx      → /xxx local
xxx>      → /xxx local
_xxx      → /xxx data
_xxx!     → /xxx data!
:xxx      → /xxx rename
```

This must be presented as an explanatory expansion, not as the preferred beginner syntax.

## 7. Example: local named value

Correct tutorial example:

```inox
42 >x
x> out
```

Explanation:

```text
42       pushes integer 42 onto the data stack
>x       consumes TOS and creates local named value x in the control stack
x>       retrieves x and pushes its value onto the data stack
out      consumes the top value and writes it to the output
```

Incorrect explanation:

```text
x is assigned 42.
```

Correct explanation:

```text
The value 42 is pushed, then captured as local named value x.
```

## 8. Example: derived value

Correct:

```inox
42 >x
x> 1 + >y
y> out
```

Explanation:

```text
42       pushes 42
>x       creates local named value x
x>       retrieves x
1        pushes 1
+        consumes two numbers and pushes their sum
>y       creates local named value y from the sum
y>       retrieves y
out      writes it
```

Do not rewrite this as:

```text
y = x + 1
```

The closest explanatory paraphrase is:

```text
Retrieve x, add 1, then capture the result as y.
```

## 9. Example: update

Correct:

```inox
10 >counter
counter> 1 + >counter!
```

Explanation:

```text
10          create local named value counter
counter>    retrieve current counter
1 +         increment
>counter!   update the existing local named value counter
```

Use `update`, not `assign`.

## 10. Equality and comparison

If equality is introduced, explain it separately:

```inox
x> 42 =?
```

or whichever equality predicate is current in the implementation/specification.

The important rule is:

```text
Comparison and update are distinct.
`=` belongs to comparison-oriented vocabulary.
`!` marks mutation/update-oriented vocabulary.
```

## 11. Global variables

Global variables must be explained as getter/setter verbs, not as assignment slots.

Example:

```inox
variable: /global-state is: "initial state".

global-state
"next" global-state!
```

Explanation:

```text
global-state    getter verb
global-state!   setter/update verb
```

Do not explain as:

```text
global-state = "next"
```

## 12. Object variables

Object variables / attributes may have their own access forms. They must still not be explained by importing `=` assignment into core Inox.

Use the object access vocabulary defined by the current specification and implementation.

## 13. Tutorial structure recommended

A generated beginner tutorial should follow this order:

1. What Inox is: concatenative, stack-based, Forth-inspired.
2. Literal values and the data stack.
3. Verbs as stack-effect operators.
4. Output with a simple verb such as `out`.
5. Local named values: `>x`, `x>`, `$x`.
6. Updating local named values: `>x!`.
7. Tags and naming: `/x`, `x/`, `:x`.
8. Data-stack named values: `_x`, `_x!`.
9. Global getter/setter verbs.
10. Blocks and control structures.
11. Prefix, postfix, infix and keyword styles.
12. Implementation expansion, only after the surface model is clear.

## 14. Checklist for generated tutorials

Before accepting a generated tutorial, check:

- [ ] No `x = value` examples are presented as valid Inox.
- [ ] No `=` assignment semantics are introduced.
- [ ] `>x`, `x>`, `$x`, `>x!` are explained as stack effects.
- [ ] `!` is explained as update / mutation / side effect marker.
- [ ] Named values are linked to named stack cells.
- [ ] Local named values are linked to the control stack.
- [ ] Data-stack named values are linked to the data stack.
- [ ] Global variables are explained as getter/setter verbs.
- [ ] Examples are explained step by step in terms of stack effects.
- [ ] Any comparison with C/Python/JavaScript is explicitly marked as contrast.

## 15. Prompt for tutorial regeneration

Use this prompt when regenerating a tutorial with an LLM:

```text
Regenerate the Inox tutorial.

Mandatory constraints:

- Inox is a concatenative, stack-based language inspired by Forth.
- Explain source forms through stack effects.
- Core Inox has no assignment operator.
- Never use `=` as assignment.
- Never present `x = value` as valid Inox.
- Use `42 >x`, `x>`, `$x`, `43 >x!`, `_x`, `_x!`, and `:x` as the canonical naming/update forms.
- Explain `>x` as: consume TOS and create a local named value in the control stack.
- Explain `x>` and `$x` as: retrieve the nearest matching local named value.
- Explain `>x!` as: update the nearest existing local named value from TOS.
- Explain `_x` and `_x!` as data-stack named value access/update.
- Explain `:x` as renaming the top stack value.
- Use “named value” for beginner-facing prose and “named stack cell” for precise implementation notes.
- Mention `local`, `local!`, `data`, `data!`, `make.local`, and `rename` only as implementation-level expansions.
- Do not use “assignment expression”, “left-hand side”, “right-hand side”, or “variable receives a value” except as explicit anti-examples.

The tutorial must include:

1. a short explanation of the stack model;
2. a first working example;
3. local named values;
4. updating local named values;
5. data-stack named values;
6. global getter/setter variables;
7. a short anti-example section explaining why `x = 42` is not Inox.
```

## 16. Stable doctrine for tutorial generators

```text
Inox is stack-first, not expression-first.

A value is pushed.
A verb consumes or produces values.
A value may be named.
A named value may be retrieved.
An existing named value may be updated.

That is not classical assignment.
```
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Inox Documentation Index](inox-docs-index.md)
- [Research Index — Inox](index.md)
- [Documents - All Tracked Repos](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/documents.md)
<!-- END_AUTO: backlinks -->
