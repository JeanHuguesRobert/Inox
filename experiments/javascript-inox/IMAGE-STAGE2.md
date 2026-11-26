# JavascriptInox stage-2: a relocatable compiler verb written in Inox

**Scope:** executable bootstrap experiment for [Inox #41](https://github.com/JeanHuguesRobert/Inox/issues/41).
Author: GPT-6 coding agent, under Jean Hugues Noël Robert's direction (2026-11-23).

The stage-0 VM supplies the token reader and definition storage helpers. As of 2026-11-26 the Inox-written defining loop uses structured source, and the image exports both the legacy experimental entry `compile` and the historical source entry `to`:

```inox
to compile
  next-token def.begin
  while: { next-token dup token.end? not } do: { def.emit };
  drop def.finish.
to to compile .
```

The compiler image uses symbolic primitive imports and relocatable branches. A fresh VM with `bootstrapCompiler:false` can load it and use the same source syntax as the historical runtime:

```inox
to double dup + .
to quadruple double double .
21 double 21 quadruple
```

Expected data stack: `[42, 84]`.

## Reproduce

From the Inox repository root:

```sh
node experiments/javascript-inox/build-compiler-image.mjs --check
node --test experiments/javascript-inox/toy-runner.test.js experiments/javascript-inox/definition-image.test.js experiments/javascript-inox/compiler-image.test.js
```

The builder emits deterministic JSON to stdout without `--check`. The checked-in image is generated from the Inox source; verify it before updating.

Tests cover bootstrap independence, relocation into VMs with different primitive addresses, 1,000-token compilation with no accumulated return frames, deterministic image round-trip, and isolation between VMs.

## Scope boundary

**This is not Image Zero.** The stage-2 image carries an **Inox-written defining loop and source entry**. Tokenization and the smallest definition helpers remain JavaScript primitives. It uses the experimental `inox.stage1.definitions.v0` representation, **not** the existing binary `.xnx` ABI. A tested subset of the historical grammar is implemented; structured lowering still uses a JavaScript host helper.

Next: study the TypeScript reference tokenizer/compiler, move more of their procedural logic into Inox, and converge on historical source syntax and semantics while allowing independent native JavaScript and binary Cell representations. Binary image compatibility is not a goal.
