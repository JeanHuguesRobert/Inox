---
title: "Learning Inox — A tutorial for AI agents (and humans in a hurry)"
author: "Written collaboratively by an AI agent under jhrobert's review"
canonical_source: "research/inox-spec.md"
status: "working draft — sections marked ⚠️ need author review"
date: "2026-05-22"
---

> **Post-draft note (2026-05-22).** §3 and §4.5 of this draft framed the
> 2023 OO bootstrap crash as Inox-level. Step-by-step instrumentation
> revealed it was actually **two latent runtime bugs** in `lib/inox.ts`:
> (a) a double-free in `stack_extend` and (b) an inverted loop condition
> in `primitive_forget_parameters`. Both fixes are in the accompanying
> commit. A third crash (in `primitive_make_local`) remains, location
> unknown — could be runtime or Inox. The advice in §3 ("treat the
> runtime as ground truth") still stands as a starting assumption, but
> in *this codebase, in 2023-2026*, runtime bugs are still common
> enough that the default needs to be held loosely.

# Learning Inox — a tutorial for AI agents

> This document is **not** the Inox specification. The canonical reference is [`inox-spec.md`](inox-spec.md). This tutorial exists so that an agent (or a fresh human reader) can become productive on the Inox codebase in one session, without having to read 1500+ lines of spec first. The audience is someone who already knows Forth-family or stack-based languages by reputation, but has not internalised Inox specifically.
>
> Read this top to bottom. Run the examples. Cross-check against `inox-spec.md` when this tutorial sounds vague — it is intentionally lossy.

---

## Section 1 — What Inox is, in 200 words

Inox is a **concatenative, stack-based language** with a Forth lineage and Smalltalk/Erlang ambitions. Its design questions: *how do autonomous agents coordinate without a capturable centre?* — at the language level. The answer is a small, traceable runtime intended to descend from Node.js down to ESP32-class microcontrollers.

Four ideas distinguish it from plain Forth:

1. **Named values.** Every value is a 64-bit cell carrying both a typed payload *and* a name (a "tag"). Access by name is first-class, on a par with access by stack position.
2. **Two stacks, strictly separated.** A *data stack* (where data flows) and a *control stack* (where call frames and local variables live). Most Forths fudge this; Inox does not.
3. **Multiple dialects.** Prefix, infix, postfix all coexist. The parser handles `out( x )`, `x out`, and `out: x;`. Programmers pick their style; verbs defined in one dialect work in all.
4. **Reference-counted automatic memory.** The runtime owns memory. Objects are GC'd when refcount drops to zero. **An Inox programmer is not supposed to manage memory.**

The reference implementation lives in `lib/inox.ts` — one ~24 500-line TypeScript file ("OneBigSourceFile"). The runtime is written *as if* it were portable to C++ and AssemblyScript via comment-gated cross-compilation directives (`/*c{ ... }*/`, `//c/ ...`). You can ignore those when reading the JS-target behaviour.

---

## Section 2 — Reading Inox code

### 2.1 The shape of a verb definition

```
to hello  "hello" out.
```

That's a complete verb definition: `to NAME BODY .` (or `;` — both terminate).

- `to` starts compilation: subsequent tokens are appended to the new verb's definition rather than executed immediately.
- The body is a sequence of *verbs* and *literals*, separated by whitespace.
- `.` (period) or `;` ends the definition and returns to normal evaluation.

Verbs can have **any printable name**: `hello`, `even?`, `>R`, `@!`, `make.metaclass`, `if:then:else:`. Suffix conventions:

| Suffix | Meaning | Example |
|---|---|---|
| `?` | predicate (returns boolean) | `even?`, `something?` |
| `!` | mutation / side effect | `>x!`, `name!` |
| `/` | "applied on" (function-style verb) | `tell-to/`, `fib/` |
| `.foo` | method on class to the left | `point.dump`, `text.box` |

### 2.2 Comments

```
~~ single-line comment to end of line
~| multi-line
   comment |~
( stack effect comment — also valid, Forth style )
~| a b -- b a |~   ~~ Forth-style stack effect inside a multi-line comment
```

### 2.3 Three notations, one meaning

```
out( "hello" )         ~~ prefix
"hello" out            ~~ postfix
"hello" /out call      ~~ explicit
```

All three push `"hello"` then run `out`. Prefix uses `( ... )` to group arguments. Postfix is the bare concatenative form. Operators (`+`, `&`, `=?`) work in infix between two operands: `3 + 2`, `"a" & "b"`.

Smalltalk-style keyword form for multi-part verbs:

```
say: "Hello" to: "Bob";    ~~ calls a verb named  say:to:
```

The verb name is the concatenation of the keyword parts including their colons. The final `;` terminates the call.

### 2.4 Local variables and scope

```
to greet  >name           ~~ pop the data stack, create local 'name'
  out( "Hello, " & $name )
.
```

| Form | Meaning |
|---|---|
| `>x` | pop data stack TOS, create local variable `x` |
| `$x` | push the value of local `x` onto data stack |
| `x>` | same as `$x` (postfix style) |
| `>x!` or `$x!` | assign top of data stack to existing local `x` |

Locals live on the **control stack** and are scoped to the surrounding block. Scope opens with `>{ ... }`, `/{ ... }`, or implicitly with control structures.

### 2.5 Tags

```
/red          ~~ the tag named 'red' (a value of type tag)
red/          ~~ same — alternative syntax
#red          ~~ same — third syntax
x:3           ~~ an integer value 3 with the name tag /x
msg:"hello"   ~~ a text value "hello" with the name tag /msg
```

A **tag** is an interned, immortal symbol — like Lisp atoms or Ruby/Smalltalk symbols. Tags are how named values get their names. They are also values in their own right.

The "concise shortcut" — `white/color/led-setup` — chains tags as prefix arguments: it means `/white /color led-setup`, which means `led-setup( /white, /color )`.

### 2.6 Blocks

```
{ body }        ~~ a runnable block — a value of type 'block' or 'verb'
```

A block is a first-class value: it can be pushed, stored, passed to verbs that run it (`run`, `if`, `loop{ }`, `while:do:`). Blocks **do not** open a new scope by default. Two variants do:

- `/{ body }` — opens a scope, fills it with named parameters of the enclosing function.
- `>{ body }` — opens a scope with a single local `it` (the *target*).
- `.{ body }` — same as `>{`, conventional for value-methods.

### 2.7 Methods and objects (preview — see §4 for the bootstrap)

```
to point.dump  method: { out( "(x:" & it .x & ", y:" & it .y & ")" ) }.
```

- `point.dump` is a verb whose name marks it as a method of class `point`. Late-binding lookup uses the class of the value on top of the data stack.
- `it` inside a method is the target (the object the method was invoked on).
- `.attr` reads an object attribute; `.attr!` writes it.
- `.method(...)` invokes a method on the target.

Objects are created with `make-object` (low-level) or `make.object` (Inox-level, in `l9.nox`). Their class is a tag; their value is an internal stack of named cells (the attributes).

---

## Section 3 — Memory model from an Inox author's point of view

> ⚠️ This section reflects the author's intent: **refcount-based GC is the runtime's job, not the programmer's**. As a programmer of `.nox` code you should never need to `ref` or `unref` anything manually. This section is therefore deliberately short — it gives you just enough vocabulary to read tracebacks when something goes wrong, not enough to "tune" memory.

### 3.1 Cells

The whole runtime memory is one big flat array of **cells**. Each cell is 64 bits, packed as `(value, name-tag, type)`. Type 0 means void, then boolean, integer, float, tag, verb, text, reference, range, and various object types (stack, queue, array, map, native, proxy).

You generally don't address cells directly. The verbs `value-of`, `type-of`, `name-of` exist if you need to introspect, but they are **low-level** and unsafe.

### 3.2 Areas

Some values (texts, objects, stacks) need more than one cell. They live in a contiguous run of cells called an **area**. Every area has a refcount header. Operations that share an area increment its refcount; dropping the last reference frees the area.

Three operations the runtime performs on areas — relevant because they show up in error tracebacks:

- `area_allocate` — reserve a fresh area.
- `area_free` — refcount reached zero (or someone passed an invalid header); release the cells.
- `stack_extend` — when an internal stack/map/array grows past its capacity, the runtime allocates a bigger area, copies, and frees the old one. The old-area `area_free` checks invariants and will assert if something looks wrong.

### 3.3 What an Inox author needs to remember

- **You never call `area_*` yourself.** They are runtime internals.
- Push and pop on the data stack are refcount-aware. If you `dup`, the cell's reference is bumped; if you `drop`, it's decremented.
- Local variables (`>x`, `$x`) and object attributes (`.attr`, `.attr!`) all participate in the refcount protocol automatically.
- A primitive that complains about a refcount/area is **almost certainly** signalling that the Inox program violated a contract — e.g. passed a freed reference, an uninitialised cell, or a value of the wrong type — not that the runtime is wrong. Treat the runtime as ground truth.

### 3.4 The "strict" / "fast" duality

The runtime has a global flag `fast` (toggled by primitives `fast!`, `debug`, `normal-debug`). When fast is *off*, many invariants are checked at runtime via `mand( cond )` assertions. When fast is *on*, those checks are stripped. Programs that work in fast mode but assert in normal mode are usually **right** about the result and **wrong** about something subtle (e.g. they relied on an undefined order, or they freed something one step too early). Always debug with `fast` *off*.

---

## Section 4 — The OO bootstrap (walkthrough of `lib/l9.nox`)

> ⚠️ This section is the heart of the tutorial *and* the heart of the open bug. Read with two attitudes simultaneously: (a) "this is what the code wants to do" and (b) "this is what the runtime is complaining about". The bug lives somewhere between these two.

### 4.1 The loading order

When the runtime starts, `bootstrap()` (in `inox.ts`, line 24292) evaluates three files in order:

1. **`bootstrap.nox`** — minimal Inox vocabulary on top of primitives.
2. **`forth.nox`** — the Forth dialect, ~95 lines, classical Forth words.
3. **`l9.nox`** — the *L9 kernel*: object system, classes, methods, actors, dataflow. ~480 lines.

Crashes during the bootstrap will be diagnosed by looking at the *last successful* line and what `l9.nox` was trying to do next.

### 4.2 The class machinery built by `l9.nox`

`l9.nox` introduces a self-bootstrapping object system. The pattern is the classic "metaclass" trick: classes are themselves objects, instances of a *metaclass*. Building this without an existing class system requires a careful order of operations.

Key verbs introduced (file location in parentheses):

| Verb | Purpose | Line |
|---|---|---|
| `make.metaclass` | construct the per-class descriptor object (a metaclass instance) | 121 |
| `define-method` | register a method verb under `Class.method` | 106 |
| `update-classes` | recompute method lookup caches for a set of classes | 133 |
| `class{` | the user-facing form: `class{ … }` declares a new class | 160 |
| `method{` | declare a method inside a `class{` body | 185 |
| `attribute` | declare an object attribute with getter/setter | 197 |
| `superclass` | record a parent class relationship | 177 |

The global `classes` map (line 96) holds all known classes, keyed by their tag name.

### 4.3 The structure of `make.metaclass`

```
to make.metaclass  >class-name
  metaclass/make{
    $class-name :name
    map[]       :definitions
    map[]       :class-definitions
    map[]       :attributes
    /metaclass  :class
    /thing      :superclass-name
  } >metaclass
  $metaclass $class-name classes debugger .!
  $metaclass
.
```

What it does, line by line:

1. Pop the class name (a tag) into local `class-name`.
2. `metaclass/make{ ... }` is the concise tag-prefix form: it pushes the tag `/metaclass` then invokes the verb `make{` with the trailing block as its argument. `make{` is defined just above at line 116; its job is to open a `with` region on the data stack, run the block (which leaves named cells), then call `make.object` to seal them into a new object of class `/metaclass`.
3. The block builds **six** named attributes: `name` (the class name tag), `definitions`, `class-definitions`, `attributes` (three fresh empty maps), `class` (the literal `/metaclass`), `superclass-name` (`/thing`). The `value :name` form here is a **runtime rename** — it does not create new memory, it relabels the cell already on TOS.
4. Store that metaclass object in the global `classes` map, keyed by the class's name. ← *probable crash region.*
5. Leave the new metaclass on the data stack as the return value.

> ⚠️ Line 130 still contains an inline `debugger` call between the operands and the `.!` setter — that's a runtime breakpoint primitive. It's clearly a debug residue from a session in progress, not a stable construct. When the bug is fixed, this `debugger` should be removed. **It may be useful to keep it during the debug session: with `node --inspect-brk` it stops execution right before the crashing `.!`.**

> ⚠️ The runtime stack trace shows `primitive_map_put` as the Inox-level entry, but doesn't tell us *which* `map_put` triggered the assert. Candidates: (a) one of the three `map[]` constructions inside the block (probably benign — they are fresh maps with no other references), (b) `make.object` packing the six cells into the metaclass's internal stack (more interesting — the metaclass object's value is itself a map-like structure that the runtime grows during construction), or (c) `classes .!` writing the result into the global map (most interesting — `classes` already exists from line 96 and may have a non-trivial state). Bisect to find out.

### 4.4 The first call: `class{`

`class{` (line 160) is where the bootstrap first uses `make.metaclass`. The very first class declared will be `thing` itself (the root of the hierarchy). At that moment, the global `classes` map exists (line 96 created it) but contains nothing.

```
to class{  with class-name/ code/ parameters
  verb.exist?( $class-name ) then{
    $class-name extend-class{ $code run }
    return
  }
  assert{ verb.exist?( $class-name ) not }
  $class-name >it
  make.metaclass( it ) >metaclass        ~~ line 167 — first call
  define-method( it, /class, attach( it, {} ) )
  classes.get( thing/ ) >class-superclass
  ...
```

### 4.5 What the crash actually says

Stack trace at the failure point:

```
mand           ← assertion failed (line 1524)
area_free      ← freeing an area (line 4409)
stack_free     ← freeing an internal stack/map area (line 5307)
stack_extend   ← growing an internal stack/map past its capacity (line 5635)
primitive_map_put ← Inox-level: writing to a map (line 13576)
```

Reading bottom up: the Inox program asked to **put** something in a map. The map was full, so the runtime grew it. Growing means *allocating a bigger area, copying, freeing the old one*. The free of the old area asserted.

Map sites in the surrounding `make.metaclass` code:

- `metaclass/make{ ... }` creates the new metaclass object — its attributes are an internal map.
- Multiple `map[]` calls inside that block create the embedded maps (`definitions`, `class-definitions`, `attributes`).
- `$metaclass $class-name classes .!` writes into the global `classes` map.

> ⚠️ The most likely culprit is the `classes .!` write on line 130: it is the only operation that mutates a map *whose old buffer might already be held by another reference somewhere*, since `classes` is a global. But this is a hypothesis. The repro path is: reduce `l9.nox` to the smallest snippet that still crashes, then bisect from there.

### 4.6 Where to look next

When attacking this bug:

1. **Keep the `debugger` for now.** Run under `node --inspect-brk` so it acts as a breakpoint right before the crashing `.!`. Inspect TOS, NOS, and the state of the `classes` map at that point.
2. **Bisect by reducing `make.metaclass`:** keep `make.metaclass` itself but reduce its body. Try with fewer attributes (just `$class-name :name`). Try without the `classes .!` registration. Try without `make.object` (just `with` + named cells, no sealing).
3. **Try the embedded maps in isolation:** does `to test  metaclass/make{ map[] :a map[] :b } .  test` already crash, with no `classes .!` at all? If yes, the bug is in `make.object` (or in renaming an area-owning value via `:tag`). If no, the bug is in `classes .!`.
4. **Inspect `make.object`** — it lives in `inox.ts` (search for `primitive_make_object` or similar). Read what invariants it expects on the cells it consumes.
5. **Check `:tag` rename semantics on map values:** `value :name` is supposed to relabel the cell, not duplicate it. For values that own areas (the `map[]` results), does the rename properly transfer ownership of the area, or does it accidentally drop a refcount?
6. **Check whether `classes` global was correctly initialised.** Line 96: `. global: classes/ is: map[] :classes;` — the leading `.` terminates the previous definition (`make-list` etc. — verify which). If `classes` is somehow void at the time of the first `.!`, the runtime would still try to do the put and assert deep inside.

---

## Section 5 — Debugging primitives

### 5.1 Toggling traces

These primitives change runtime verbosity. They can be called from `.nox` code or from a REPL session:

| Primitive | Effect |
|---|---|
| `debug` | enable many trace categories (very verbose) |
| `normal-debug` | disable verbose traces, keep type and assert checks |
| `fast!` | go to fast mode, strip asserts, return previous state |
| `breakpoint` | host-language breakpoint (Node debugger) — useful when running under `node --inspect-brk` |
| `debugger` | same as `breakpoint` — language-level call |

### 5.2 Inspecting state

| Primitive | Output |
|---|---|
| `data-dump` | dump the data stack |
| `control-dump` | dump the control stack |
| `data-depth` | number of cells on the data stack |
| `memory-dump` | dump the whole cell memory (huge) |
| `type-of`, `name-of`, `value-of` | introspect TOS |
| `class-of` | tag of the most specific class of TOS |

### 5.3 The TS-side debug flags

In `lib/inox.ts`, near line 680-960, there is a battery of `let xxx_de = ...` flags (de = debug enable). They gate `if( xxx_de ) trace(...)` calls throughout the source:

```
de, nde, blabla_de, legacy_de, mem_de, alloc_de, check_de,
info_de, warn_de, stack_de, token_de, parse_de, eval_de, run_de,
verbose_stack_de, step_de
```

When debugging the runtime *or* a bootstrap crash, edit these flags directly in `inox.ts`, rebuild with `npx tsc`, re-run. They are coarse but effective.

### 5.4 Building a minimal `.nox` repro

When chasing a bootstrap bug:

1. Copy the suspicious fragment from `l9.nox` into a new file `lib/repro.nox`.
2. Replace `eval_file( "l9.nox" )` in `bootstrap()` with `eval_file( "repro.nox" )` temporarily, **or** comment out the `l9.nox` line entirely and load your fragment manually after startup.
3. Remove dependencies one by one until you have the smallest crashing input. That fragment is the repro.

---

## Exit checklist — am I ready to work on Inox?

Before claiming productivity on this codebase, an agent should be able to answer:

- [ ] Read a 20-line .nox fragment using prefix, postfix, infix, and keyword notation. Predict the data-stack state at each step.
- [ ] Explain the difference between data stack and control stack, and which of `>x` / `$x` / `x:3` / `:x` uses which.
- [ ] Name the three notations a tag can take (`/x`, `x/`, `#x`) and one place where the concise form `red/color/foo` is shorthand for something else.
- [ ] Locate a primitive in `lib/inox.ts` given its name (search for `primitive( "name"` or `primitive_name`).
- [ ] Read a runtime stack trace and decide whether the bug is at the runtime level (TS) or the Inox level (.nox). **Default: Inox level.**
- [ ] Build the runtime: `npx tsc`. Run it: `node builds/lib/inox.js`. Know that the entry script also (currently) tries to load `l9.nox` which crashes during OO bootstrap — see §4.

When all six are checked, the agent is calibrated. Open `lib/l9.nox` and good luck.

---

## Author review log

Lines below are for jhrobert to track corrections.

- [ ] §3 memory model — verify wording about refcount being "the runtime's job, not the programmer's".
- [ ] §4.3 — verify the per-line interpretation of `make.metaclass`, in particular the claim that `metaclass/make{ ... }` ≡ `/metaclass` push + `make{` call (the concise tag-prefix expansion).
- [ ] §4.3 — verify the `value :name` "runtime rename, no new memory" claim and especially whether it transfers area ownership correctly for `map[]` results.
- [ ] §4.5 — three candidate crash sites listed (embedded `map[]`, `make.object`, `classes .!`); confirm the framing.
- [ ] §4.6 step 6 — verify that the leading `.` on line 96 terminates the previous definition (which one?) before `global: classes/ is: map[] :classes;`.
- [ ] §5.1 — confirm `debugger` and `breakpoint` are interchangeable in the current runtime.
