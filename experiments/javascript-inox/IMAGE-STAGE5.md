# JavascriptInox — Stage 5: round-trip image → minimal Inox → image

Date: 2026-11-23. GPT-6 coding agent under Jean Hugues Noël Robert's direction. Owner: Inox #41.

## Verified objective

This checkpoint provides a concrete bootstrap round-trip for the stage-1 definition-image format:

1. Start from the precompiled compiler and lexer definition images.
2. Convert a selected image to a restricted, valid Inox source using definitionImageToInox(image).
3. Load the existing compiled compiler and lexer into a fresh VM with bootstrapCompiler:false.
4. Evaluate the generated source using the lexer written in Inox.
5. Capture the recompiled definition and compare its serialized representation to the original.

Both compiler-image.json and lexer-image.json round-trip through this path. Definition dependencies are topologically ordered; cyclic local dependencies are rejected because the current compiling verb cannot resolve forward references.

## Compatible Cell metadata correction

Named scalar Cells are represented with an optional name attribute in the stage-1 JSON format and reloaded without dropping their name. The toy compiler accepts a small genuine Inox subset of named literals, for example x:21. Unnamed image fixtures remain identical. Scientific-notation decimal literals are accepted. Negative zero is rejected in image capture because JSON serialization would silently erase its sign.

This is specifically an image integrity and future-protocol compatibility change: it does not claim that named parameter protocols, scopes, attached runnable references or complete historical Inox parsing exist in JavascriptInox.

## Reproduction

From a directory containing the experiment files:

    node build-compiler-image.mjs --check
    node build-lexer-image.mjs --check
    node --test toy-runner.test.js definition-image.test.js compiler-image.test.js lexer-image.test.js lexer-quoted.test.js definition-source.test.js

## Deliberate boundaries

This experimental JSON image is not .xnx and is not the host binary image prototype at tools/inox-image. The text renderer produces source for the restricted stage-2 compiling verb, not a universal source decompiler for the historical VM. Named string values with embedded whitespace are rejected at this lexical stage rather than silently corrupted. Non-scalar references (including future attached blocks, mutable boxes, actor state and continuations) will require new versioned image types, not JSON coercion.

The evaluation loop currently scans whole source before running it. A later incremental scanner is necessary to support runtime-modifiable style/dialect rules. No such style implementation is claimed here.

## Next increment

Move token classification and definition emission from the host toward Inox verbs, while protecting the executable Cell format from the future attachment/call-protocol requirements. Keep compilation cost separate from runtime performance and continue writing/validating each phase image.
