---
title: "Basic Inox Tutorial"
subtitle: "A stack-first introduction to literals, verbs, named values, and updates"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-06-02"
license: "MIT (code) · CC BY-SA 4.0 (text)"
status: "working-note"
version: "0.1"
corpus_role: "source"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-tutorial-basic.md"
---

# Basic Inox Tutorial

## 1. What Inox is

Inox is a concatenative, stack-based language inspired by Forth.

This means that Inox code is not primarily a tree of expressions. It is primarily a sequence of values and verbs.

```text
values are pushed;
verbs consume values;
verbs may produce values;
some forms name, retrieve, update, or rename stack cells.
```

Core Inox has no assignment operator. In particular, `=` is not assignment.

## 2. First example

```inox
"hello" out
```

Step by step:

```text
"hello"   pushes a text value onto the data stack
out       consumes the top value and writes it to the output
```

The postfix form is natural in Inox: data first, verb after.

Some dialects or styles may also allow prefix-like forms such as:

```inox
out( "hello" )
```

Both styles should still be understood through stack effects.

**Two syntax conveniences you will meet:**

- A verb definition starts with `to` and ends with `.`. That `.` is usually optional: a `to` at the **start of a line** automatically ends the previous definition. Write an explicit `.` when a definition is followed by code that runs it.
- A `, ` (a comma followed by a blank) is mostly for readability, but it also **closes the current item** — it applies a pending operator before the next one, e.g. in `f( a, x & y, b )` the comma after `y` finishes `x & y`. A comma with no blank after it is an ordinary character.

## 3. Numbers and verbs

```inox
2 3 + out
```

Step by step:

```text
2     pushes integer 2
3     pushes integer 3
+     consumes two numbers and pushes their sum
out   consumes the result and writes it
```

The important point is not that `+` is an expression operator. In Inox, it is a verb/operator with a stack effect.

## 4. Local named values

A local named value is a value captured from the data stack and stored as a named cell in the control stack.

Create one:

```inox
42 >x
```

Step by step:

```text
42    pushes integer 42 onto the data stack
>x    consumes TOS and creates local named value x in the control stack
```

Do not read this as:

```text
x = 42
```

That is not Inox.

A better paraphrase is:

```text
push 42, then capture it as local named value x.
```

## 5. Retrieve a local named value

There are two equivalent retrieval styles:

```inox
x>
```

or:

```inox
$x
```

Both retrieve the nearest matching local named value `x` and push its value onto the data stack.

Example:

```inox
42 >x
x> out
```

Step by step:

```text
42    pushes 42
>x    creates local named value x
x>    retrieves x and pushes its value
out   writes the value
```

## 6. Create a derived local named value

```inox
42 >x
x> 1 + >y
y> out
```

Step by step:

```text
42     pushes 42
>x     creates local named value x
x>     retrieves x
1      pushes 1
+      consumes 42 and 1, then pushes 43
>y     creates local named value y from the result
y>     retrieves y
out    writes it
```

Do not explain this as:

```text
y = x + 1
```

Correct explanation:

```text
retrieve x, add 1, then capture the result as y.
```

## 7. Update an existing local named value

Use `!` to update an existing named value.

```inox
10 >counter
counter> 1 + >counter!
counter> out
```

Step by step:

```text
10          pushes 10
>counter    creates local named value counter
counter>    retrieves counter
1           pushes 1
+           increments the retrieved value
>counter!   updates the existing local named value counter
counter>    retrieves the updated value
out         writes it
```

The suffix `!` marks update / mutation / side effect.

This is not classical assignment. It is a stack effect over an existing named cell.

## 8. Data-stack named values

Inox also supports named values in the data stack.

Retrieve from the data stack:

```inox
_x
```

Update an existing data-stack named value:

```inox
99 _x!
```

Conceptual expansion:

```inox
/x data
99 /x data!
```

The `_` prefix targets the data stack. Lookup is dynamic: the stack is searched from top to bottom, and the nearest matching name is used.

## 9. Rename the top stack value

Use `:x` to rename the top stack value:

```inox
42 :answer
```

Conceptually:

```text
push 42;
rename the top stack value as answer.
```

This is not the same as creating a local named value in the control stack. It renames the value currently on the data stack.

## 10. Tags

A tag is a name as data.

Two common forms are:

```inox
/x
x/
```

Both push the tag/name `x`, depending on the accepted style.

Tags are used by lower-level primitives such as:

```inox
/x make.local
/x local
/x local!
/x data
/x data!
/x rename
```

Beginner tutorials should usually teach the surface forms first:

```inox
>x
x>
$x
>x!
_x
_x!
:x
```

and only later show their expansion.

## 11. Surface syntax and conceptual expansion

| Surface form | Conceptual expansion | Meaning |
|---|---|---|
| `42 >x` | `42 /x make.local` | Create local named value `x`. |
| `x>` | `/x local` | Retrieve local named value `x`. |
| `$x` | `/x local` | Retrieve local named value `x`, prefix style. |
| `43 >x!` | `43 /x local!` | Update existing local named value `x`. |
| `_x` | `/x data` | Retrieve named value `x` from the data stack. |
| `_x!` | `/x data!` | Update named value `x` in the data stack. |
| `:x` | `/x rename` | Rename the top stack value as `x`. |

These are not assignment expressions. They are stack effects.

## 12. Global variables

Global variables are different from local named values.

A global variable creates two verbs:

```text
name     getter verb
name!    setter/update verb
```

Example:

```inox
variable: /global-state is: "initial state".

global-state out
"next" global-state!
global-state out
```

Explanation:

```text
global-state     pushes or returns the current global value
global-state!    updates the global value using the top of the data stack
```

Again, do not explain this as:

```text
global-state = "next"
```

The Inox form is verb-based and stack-based:

```inox
"next" global-state!
```

## 13. Equality and comparison

Comparison is separate from update.

A comparison form may look like:

```inox
x> 42 =?
```

depending on the current equality predicate in the specification and implementation.

The doctrine is:

```text
`=` belongs to comparison-oriented vocabulary.
`!` marks update-oriented vocabulary.
```

Do not use `=` to update a value.

## 14. Anti-example section

Invalid Inox:

```inox
x = 42
```

Invalid Inox explanation:

```text
x receives 42 through the assignment operator.
```

Correct Inox:

```inox
42 >x
```

Correct explanation:

```text
42 is pushed onto the data stack, then captured as local named value x.
```

Invalid Inox:

```inox
y = x + 1
```

Correct Inox:

```inox
x> 1 + >y
```

Correct explanation:

```text
retrieve x, push 1, add, then capture the result as y.
```

## 15. Summary

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

Core forms:

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
