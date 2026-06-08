---
title: "Inox Naming and the Absence of Assignment"
subtitle: "Named stack cells, local values, data values, and why `=` is not assignment"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-06-02"
license: "MIT (code) · CC BY-SA 4.0 (text)"
status: "working-note"
version: "0.1"
corpus_role: "source"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-naming-and-assignment.md"
---

# Inox Naming and the Absence of Assignment

## 1. Purpose

This note clarifies a central design point of the Inox programming language:

> Inox has no assignment operator.

The `=` sign must not be explained, generated, or taught as an assignment operator. Inox is a concatenative, stack-based language. Values flow through stacks, then may be named, retrieved, updated, or renamed through explicit stack effects.

This distinction is not cosmetic. Introducing `=` as assignment would import the expression-oriented mental model of C-like, Python-like, or JavaScript-like languages, and would distort the semantics and style of Inox.

## 2. Short rule

```text
Do not write:

x = 42
```

Write instead:

```inox
42 >x
```

This means:

```text
push 42 on the data stack,
then consume the top of the data stack
and create a local named value `x` in the control stack.
```

## 3. Why this matters

In many mainstream languages, a variable is explained as a named storage location and assignment is written as an expression or statement:

```text
x = expression
```

Inox uses a different model. Its natural model is closer to Forth:

```text
values are pushed,
verbs consume values,
verbs produce values,
some verbs create, retrieve, update, or rename named stack cells.
```

Inox therefore should not be taught as a conventional language with unusual syntax. It should be taught as a stack language with named values.

## 4. Terminology

For beginner-facing documentation, the recommended term is:

```text
named value
```

For specification and implementation-facing documentation, the more precise term is:

```text
named stack cell
```

A local variable is more precisely:

```text
a transient named cell in the control stack
```

A data variable is more precisely:

```text
a transient named cell in the data stack
```

The word `variable` may be used as a convenience, but only after this distinction is made. Inox variables are not primarily lexical variables in the usual C/Python/JavaScript sense.

## 5. Core forms

| Surface form | Conceptual expansion | Meaning |
|---|---|---|
| `42 >x` | `42 /x make.local` | Create a local named value from the top of the data stack. |
| `x>` | `/x local` | Retrieve the nearest local named value from the control stack. |
| `$x` | `/x local` | Same as `x>`, prefix-style local retrieval. |
| `43 >x!` | `43 /x local!` | Update the nearest existing local named value. |
| `_x` | `/x data` | Retrieve a named value from the data stack. |
| `_x!` | `/x data!` | Update an existing named value in the data stack. |
| `:x` | `/x rename` | Rename the top stack value. |
| `/x` or `x/` | tag literal | Push the tag/name `x`. |

These forms are stack effects, not assignment expressions.

## 6. Local named values

### Create

```inox
42 >x
```

Stack-level reading:

```text
42       pushes integer 42 onto the data stack
>x       consumes TOS and creates a local named cell `x` in the control stack
```

### Retrieve

```inox
x>
```

or:

```inox
$x
```

Both forms retrieve the nearest local named value `x` from the control stack and push a copy onto the data stack.

### Update

```inox
43 >x!
```

This consumes the top of the data stack and updates the nearest existing local named value `x` in the control stack.

The suffix `!` marks mutation or a side effect. It does not make `=` an assignment operator.

## 7. Data-stack named values

Inox also allows named values to live in the data stack.

Retrieve:

```inox
_x
```

Update:

```inox
99 _x!
```

Conceptually:

```inox
/x data
99 /x data!
```

The lookup is dynamic: the relevant stack is searched from top to bottom, and the nearest matching name is used.

## 8. Global variables are different

Global variables are not local named stack cells.

A global variable is implemented as two verbs:

```text
xxx     getter
xxx!    setter
```

Example:

```inox
variable: /global-state is: "initial state".

global-state
"next" global-state!
```

This still does not introduce `=` as assignment. The setter is a verb whose name conventionally ends with `!`.

## 9. Anti-examples

Do not write or generate:

```inox
x = 42
```

Do not write or generate:

```inox
y = x + 1
```

Do not explain Inox using:

```text
left-hand side
right-hand side
assignment expression
variable receives a value
```

unless these are explicitly marked as anti-examples from another language family.

Correct Inox form:

```inox
42 >x
x> 1 + >y
```

or:

```inox
42 >x
$x 1 + >y
```

## 10. Equality and comparison

The `=` sign is reserved for equality/comparison-oriented use. It must not be overloaded in beginner documentation as assignment.

If a dialect later introduces assignment-like syntax, it must be explicitly marked as a dialectal extension and not presented as core Inox.

Current core doctrine:

```text
`=` compares.
`!` updates.
`>` captures or creates, depending on position and form.
`$` retrieves local named values.
`_` targets the data stack.
`:` names or renames.
```

## 11. Guidance for automatic tutorial generation

A generated Inox tutorial must obey the following rules:

1. Start from stack effects, not expressions.
2. Never introduce `=` as assignment.
3. Use `>x`, `x>`, `$x`, `>x!`, `_x`, `_x!`, and `:x` as the core naming forms.
4. Explain each example by stating what is pushed, consumed, produced, named, retrieved, or updated.
5. Mention the implementation-level primitives only after the surface syntax is understood.
6. Avoid importing C/Python/JavaScript terminology unless explicitly contrasting models.

Recommended teaching sequence:

```text
literal → stack → verb → named value → local retrieval → update → data-stack named value → global getter/setter
```

## 12. Implementation correspondence

The current implementation recognises the surface forms as compiler-level special forms:

```text
>xxx      → tag + make.local
>xxx!     → tag + local!
$xxx      → tag + local
xxx>      → tag + local
_xxx      → tag + data
_xxx!     → tag + data!
:xxx      → tag + rename
```

This means the doctrine is not merely aspirational. It corresponds to the current implementation strategy.

## 13. Stable doctrine

```text
Inox has no assignment operator.

The closest operations to assignment are stack effects over named cells:

- `>x` consumes TOS and creates a local named cell in the control stack.
- `x>` or `$x` retrieves the nearest local named cell from the control stack.
- `>x!` consumes TOS and updates the nearest existing local named cell.
- `_x` retrieves the nearest named cell from the data stack.
- `_x!` consumes TOS and updates the nearest existing named cell in the data stack.
- `:x` renames the top stack value.
- `=` remains comparison-oriented, not mutation-oriented.
```

## 14. Open design questions

The following points remain open for language-design arbitration:

1. Whether beginner documentation should use `named value` exclusively, or introduce `named stack cell` earlier.
2. Whether `local`, `local!`, `data`, and `data!` should remain mostly implementation-level primitives or be taught as advanced public vocabulary.
3. Whether `variable` should be retained as a convenience term or progressively replaced by `named value` / `named cell`.
4. Whether future dialects may introduce assignment-like syntax, and if so, how to prevent confusion with core Inox.

Current recommendation:

```text
Tutorial: named value.
Specification: named value, more precisely named stack cell.
Implementation: named stack cell.
No core assignment operator.
```
