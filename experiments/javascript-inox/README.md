# JavascriptInox stage-0 toy runner (Inox #41)

This is a standalone **JavaScript ESM** semantic experiment. It does not import the historical TypeScript runtime, use external packages or implement the `.xnx` image format. It deliberately avoids making JavaScript object prototypes part of the Inox language.

Run from the Inox repository root:

```sh
node --test experiments/javascript-inox/toy-runner.test.js
```

Minimal Inox-style source recognized by the stage-0 reader:

```text
to double dup + .
to quadruple double double .
21 double
21 quadruple
```

The final data stack contains `[42, 84]`.

## What the experiment proves

The runner manages `IP`, `CSP`, `DSP`, and **one logical address space** `vm.cells` of `{name,type,value}` Cells. The two stacks store references to Cells allocated in that address space. Primitive Cells hold ordinary JavaScript functions; literal Cells accept JS values without deep cloning. Verb definitions are **contiguous addressable sequences of Cells**. Compiled calls save return addresses in the control stack and jump by `IP`; they do not recursively invoke JavaScript functions for user-defined verb calls.

Only bootstrap primitives and the initial `to` verb are assembled by JavaScript. Crucially, **all subsequent user definitions are compiled by running `to` inside the VM**, using its own loop and primitive helpers: `next-token`, `def.begin`, `token.end?`, `def.emit`, `def.finish`, `branch-if`, `jump`. A JS-side compiler does not create `double` or `quadruple`. Redefinitions do not silently retarget old compiled calls.

## What it does not claim

The tiny stage-0 tokenizer recognizes a subset (whitespace-delimited words, simple numeric/Boolean/null literals and quoted JSON strings); it is **not** the historical Inox tokenizer or compiler. The current runner is synchronous and append-only, does not implement actors, `l9.nox`, a shell, Image Zéro, `inox.image.v1` serialization, snapshot, native FFI ABI, or a C runner. Direct functions inside primitive Cells are local JS conveniences, **not** a portable image representation.

Next useful checkpoint: extract a portable primitive import/ABI contract, then bootstrap an Inox-written tokenizer/compiler from the historical TS implementation and validate its compilation in the minimal runner. Reuse the existing `tools/inox-image` prototype rather than invent a second image container.

Author: GPT-6 coding agent, under Jean Hugues Noël Robert's direction (2026-11-23).


### 2026-11-26: source convergence, blocks and locals

Compiled definitions now support plain first-class blocks `{ ... }` inside
verbs, `run`, conditional invocation, and local creation/read/update
(`>x`, `$x` or `x>`, `>x!`). Blocks resolve locals dynamically at invocation,
not by capturing an enclosing JavaScript closure. Each invocation owns local
scopes; inline structured control opens and closes explicit scopes, including
on loop exits. Blocks are represented by a typed Cell referencing threaded code.
The experimental image keeps symbolic primitive imports and relative offsets,
so no native JS object or absolute block address needs to be serialized.
The differential suite `source-control.test.js` compares the same source with
the existing historical CLI, both JavascriptInox bootstraps, and image replay.

This remains a subset: top-level block expressions, specialized scoped blocks
(`>{ ... }`, `/{ ... }`), other runnable types and full grammar are not yet
implemented. The binary Cell ABI is intentionally not a compatibility goal.

### 2026-11-26: incremental source convergence policy

Principal's decision: implement primitives in response to actual needs, not
from an exhaustive porting inventory. At each such need, prefer an Inox
definition when the execution time, memory and complexity are reasonable;
otherwise use a native JavaScript implementation. Keep the working historical
TypeScript implementation intact except in specifically justified cases.
Converge on source syntax and semantics, not on the concrete binary Cell ABI.
A distinction between abstract language operations, representation-specific
mechanisms and Inox libraries is useful, but does not mandate a rewrite.

Retrospective review of the existing experiment:

- Keep native stack operations, scalar arithmetic/comparison/boolean
  operations, instruction dispatch, branches, frame/local storage, block
  invocation, compiler storage and source character access. These touch the
  representation or are small hot-path operations. In particular, the
  native `over` avoids the extra literal and stack operation of `1 pick`.
- Keep native object projection, regular expression matching, whitespace
  classification, text concatenation and error construction for now; these
  delegate to inexpensive host mechanisms. Their source-language contracts
  still require differential verification where a historical equivalent exists.
- `token.end?`, `char.end?`, `char.quote?`, `char.backslash?`,
  `text.empty-null` can be expressed in Inox, but are lexer/compiler hot
  paths. Retain for now rather than incur additional instructions and
  allocations merely to reduce the JS line count.
- Structured syntax lowering in `emitSourceToken` is language policy rather
  than representation. Consider moving individual rules into Inox as they
  are next needed, keeping low-level emission/linking native. Do not make
  wholesale migration a prerequisite for source convergence.
- ZeroBrowser's `count` and `field` are host adapters. Legacy `eq`, `lt`,
  `secret?` are retained for the first experimental image; newer recipes
  already use the generic comparison primitives and Inox selection policy.

Measured on Fracta2, Node v26.13.1: 10,000 iterations of identical loops
using `over` versus `1 pick` executed 180,013 versus 190,013 instructions,
and retained 100,009 versus 110,009 new Cells. Native `token.end?`,
inline `"." equal?`, and a called Inox verb containing that expression
executed respectively 170,013, 180,013 and 200,013 instructions and retained
100,009, 110,009 and 120,009 new Cells. Wall-clock samples for over/pick
were noisy and do not establish a timing advantage.

**Memory cost: measured, not an automatic FBF blocker.** The append-only
logical address space retains transient Cells (809 / 8,009 / 80,009 for
100 / 1,000 / 10,000 loop iterations, even with DSP=CSP=0).
The Principal clarified that the intended scripts are short-lived: judge
the actual cost against the whole execution environment, expected
concurrency, and lifetime, rather than imposing bounded allocation in
all cases.

On Fracta2, Node v26.13.1, post-GC incremental heap measurements:

| Workload | Retained heap (approx.) |
|---|---:|
| Bare VM (batch of 100) | 12 KB/VM |
| Compiler + lexer (batch of 100) | 17 KB/VM |
| Browser selection, 1 / 10 / 80 rejected fields (batch of 100 each) | 23 / 53 / 300 KB/VM |
| Simple loop, 100 / 1,000 / 10,000 iterations (median of 5) | 70 / 480 / 4,774 KB |

A fresh Node process with imports used about 51 MB RSS and 4.38 MB heap.
The current Cogentia recipe adapter creates a VM for each selection, limits
each invocation to 100,000 instructions and accepts at most 80 fields via
the registry. After dropping the VM reference and forcing GC, heap returned
near baseline (4.48 MB after the 80-field test; 4.46 MB after the 10,000
iteration test). RSS and retained heap are different metrics.

However, popped Cells currently retain their values: a direct test of
`drop` with an object payload confirmed the original object remains
referenced by `vm.cells` while the VM survives. Distinguish clearing dead
payload references from recycling address slots. The former is relevant
when handling larger host objects; the latter is not an immediate
requirement for current short scripts. Do not introduce a free-list or
compacting allocator merely to eliminate modest transient accumulation.
Revisit when measured memory, concurrency or lifetime warrants it.
Continue incremental source convergence; no memory-management rewrite is
a prerequisite. Measurements are workload-specific, not a general memory cap.

### Target blocks (incremental source convergence)

The tested historical forms `target >{ ... }` and
`target { ... } run-with-it` now bind a dynamic local `it` in the
called block's frame. `it`, `$it` and `it!` access/update that target;
return restores the caller's binding. The new native primitives reuse
existing frame lookup and threaded invocation; the syntax emits a normal
block followed by `run-with-it`. No binary representation dependency.
Seven differential cases cover nested targets, update, conditional
invocation and continuation after the block. Historical `/{ ... }`
parameter binding and `.{ ... }` syntax are deferred: probes of the
existing CLI did not establish expected continuation behavior.
No memory allocator changes.

### Named parameter blocks (2026-11-26)

After fixing the historical runtime (Inox d0445e2), the experiment now
supports `actuals with /a /b /{ ... }`, suffix tags `a/ b/`,
the explicit `/with` sentinel, and `{ ... } run-with-parameters`.
The compiler lowers the special block to an ordinary relocatable block
and the frame-binding primitive. Tags use native Cells with string
names/values; the image still contains only scalar literals and symbolic
imports (`tag.literal` constructs the runtime tag). No binary ABI change.

The parameter primitive scans the formal tags to the sentinel, derives
the actual argument boundary from the count, and binds the existing
dynamic frame. Return restores the caller. No arbitrary arity limit.
The existing JS experiment retains its checked-mode validation; no
extra fast-mode architecture is introduced. Invalid calls fail before
entering the block. This is the needed tag subset, not a general
implementation of tag operations, `as-tag`, or method dispatch.
Thirteen new source-differential cases exercise parameter binding,
including eleven arguments, shadowing, nested calls and image relocation.

### Dynamic verb invocation (2026-11-26)

The reference engine distinguishes a symbolic verb (via `as-verb`) from
a bound definition (via `tag.to-verb`): redefining its name changes the
former, not the latter. The experiment now supports this distinction,
`tag.run`, `text.run`, `as-tag`, `text.as-verb`, and `verb.run`,
including primitive calls. `verb.run` retains its operand as in the
reference; generic `run` consumes the tag/verb, not a void or boolean.
All execution uses the existing threaded VM call frames. An unknown tag
is a no-op, an unknown conversion to verb is void, and `text.as-verb`
falls back to noop. `text.run` is checked for a known verb.

The source tag subset includes dotted method-like names. Scalar names
and symbolic imports in definition images are unchanged; bound runtime
verb Cells are not serialized. A relocated caller resolves the callee
in the receiving VM. The new tests cover 12 single-body cases and five
multi-definition cases, including late versus bound redefinition.

Scope remains incremental: generic non-text conversion, integer-address
execution, named/renamed symbolic verb metadata (the historical engine
can lose the symbolic name when creating a local), full tag interning,
and object/method dispatch are not established by this subset. A space
before the final period after a numeric literal is still needed by the
experimental lexer (e.g. `to q 7 .`).
