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
