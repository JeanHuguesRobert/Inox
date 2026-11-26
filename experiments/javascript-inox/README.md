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

**Measured implementation defect to address before performance-based
library placement decisions:** transient data and return-address Cells are
currently retained by the append-only logical address space. A simple
10,000-iteration loop leaves 80,009 extra Cells even after DSP and CSP return
to zero (809 after 100 iterations; 8,009 after 1,000). The bounded control
stack tests do not demonstrate bounded live memory. Next FBF checkpoint:
make transient stack/return Cells reclaimable without invalidating code
addresses, retained values or block references; add a bounded-memory
regression. Reassess the measured costs after that correction.
