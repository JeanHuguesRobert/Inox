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
