# JavascriptInox stage-2: a relocatable compiler verb written in Inox

**Scope:** executable bootstrap experiment for [Inox #41](https://github.com/JeanHuguesRobert/Inox/issues/41).
Author: GPT-6 coding agent, under Jean Hugues Noël Robert's direction (2026-11-23).

The stage-0 VM still implements the **token reader** and **low-level definition storage primitives** in JavaScript, but the defining loop is now an Inox verb written in [`compiler.nox`](./compiler.nox):

```inox
to compile next-token def.begin next-token dup token.end? 3 branch-relative-if def.emit -8 jump-relative drop def.finish .
```

The offsets `3` and `-8` are **relative instruction offsets**, not addresses of a particular VM. `build-compiler-image.mjs` executes this definition in the bootstrap VM and serializes its compiled Cells as [`compiler-image.json`](./compiler-image.json). That image has symbolic primitive imports and can be loaded in a **fresh VM with no JavaScript-assembled `to` verb**. The destination VM uses the loaded `compile` to define and execute stage-0 verbs:

```inox
compile double dup + .
compile quadruple double double .
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

**This is not Image Zero.** The stage-2 image carries one functioning **Inox-written defining verb**. Tokenization and the smallest definition helpers remain JavaScript primitives. It uses the experimental `inox.stage1.definitions.v0` representation, **not** the existing binary `.xnx` ABI. The historical Inox grammar is not implemented by this stage.

Next: study the TypeScript reference tokenizer/compiler, move more of their procedural logic into Inox, and integrate the compiled representation with the existing `.xnx` lineage instead of creating a second permanent image format.
