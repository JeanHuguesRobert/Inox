# JavascriptInox stage-1: compiled definition images

This experiment complements [the stage-0 runner](./toy-runner.js). It introduces a
**test-only linkable representation** (`inox.stage1.definitions.v0`) for compiled
Inox verb definitions. It is **not** Image Zero, a snapshot, or the `.xnx` ABI.

Definitions are created by the **Inox `to` verb running inside JavascriptInox**
and captured as ordered Cells. At serialization boundaries:

- literal Cells carry portable finite numbers, strings, booleans, or null;
- primitive Cells carry **symbolic import names**, never JavaScript functions;
- verb Cells carry **symbolic names** and are relinked to logical addresses when loaded;
- JS objects, closures, undefined, symbols, BigInts and other nonportable literals are rejected;
- shadowed old definitions are not silently relinked to newer names.

The loader verifies symbol availability, definition collisions and basic Cell types
before mutating the target VM. Forward references within an image work. The target
runner supplies its own native primitive implementations.

Run, from the Inox repository root:

```sh
node --test experiments/javascript-inox/toy-runner.test.js experiments/javascript-inox/definition-image.test.js
```

The first test compiles `double` and `quadruple` inside VM A, serializes their
definitions into JSON, loads them into VM B, and verifies `21 double = 42` and
`21 quadruple = 84`. The other tests verify host primitive rebinding,
forward references, empty definitions, and rejection of missing or nonportable
imports.

## Architectural boundary

This stage establishes symbolic **primitive and verb imports** without making
JavaScript object prototypes part of AbstractInox. It deliberately does not
serialize the stage-0 `to` bootstrap itself, which still embeds absolute branch
targets; the real Image Zero must ultimately contain a compiler **written in
Inox** and be representable in the existing `.xnx` image lineage.

Next: audit the reference tokenizer/compiler and implement its smallest useful
portion as Inox verbs; expand the image/linker only to support demonstrated needs.
Do not create a second permanent image format.

Authorship: GPT-6 coding agent under Jean Hugues Noël Robert's direction,
23 November 2026.
