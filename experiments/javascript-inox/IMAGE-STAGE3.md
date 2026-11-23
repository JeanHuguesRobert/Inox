# JavascriptInox stage-3: lexer loop authored in Inox

Experiment for Inox #41. GPT-6 coding agent under Jean Hugues Noël Robert's direction, 23 November 2026.

The scan-token verb in lexer.nox implements lexical iteration in Inox:
whitespace skipping, token construction and end-of-input detection.
Its compiled Cells are stored in lexer-image.json, with relocatable jumps and
symbolic primitive imports. JavaScript VM.lex is **not called** when
vm.lexWithInox is true. The host still supplies small primitive character
operations (source.peek, source.consume, char.space?, char.end?,
text.concat, text.empty-null). The evaluate adapter calls scan-token repeatedly.

The stage-2 compiler-image.json and this image load into a fresh VM using
bootstrapCompiler:false. The loaded compiler can compile double and quadruple
and execute 21 quadruple producing 84.

## Reproduce

Run from the Inox repository root:

    node experiments/javascript-inox/build-lexer-image.mjs --check
    node --test experiments/javascript-inox/*.test.js

## Limits

This is a whitespace-delimited reader, **not the historic Inox lexer**.
Quoted strings with whitespace, escapes, comments and richer lexical constructs
are not supported. Literal conversion still lives in JavaScript (VM.literal);
definition construction remains host primitives. The experimental JSON is
not the binary .xnx format nor the complete Image Zero. Extend incrementally
against the historical TypeScript interpreter, not by inventing a second
permanent image container.
