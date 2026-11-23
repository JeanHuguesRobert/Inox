# JavascriptInox stage-4: Inox lexer handles quoted strings

**Scope:** bounded step towards Inox Image Zero, [Inox #41](https://github.com/JeanHuguesRobert/Inox/issues/41).
Author: GPT-6 coding agent under Jean Hugues Noël Robert's direction, 23 November 2026.

The previous whitespace-only `scan-token` lexical loop has been extended **in Inox**, not replaced by a new host-side JavaScript parser. The relocatable compiled image in `lexer-image.json` now recognizes double-quoted strings containing spaces and escaped quotes or backslashes, and reports an unterminated string at EOF. The host adds only elementary predicates `char.quote?`, `char.backslash?` and an error primitive `lex.error`. `VM.lex` is bypassed when `lexWithInox` is selected.

The stage-2 `compiler-image.json` remains unchanged: a fresh VM created with `bootstrapCompiler:false` can load the compiler image followed by this lexer image, compile new definitions and execute them.

An observed **FixBugsFirst** defect was also repaired: exceptions thrown inside a primitive previously left `IP` and the control stack in an active state. `invoke` now clears the failed control context and drops data-stack temporaries above the entry depth before propagating the error. The original existing values remain; this is not a full transactional rollback of mutations or host effects.

## Reproduce

```sh
node experiments/javascript-inox/build-lexer-image.mjs --check
node --test experiments/javascript-inox/toy-runner.test.js experiments/javascript-inox/definition-image.test.js experiments/javascript-inox/compiler-image.test.js experiments/javascript-inox/lexer-image.test.js experiments/javascript-inox/lexer-quoted.test.js
```

## Scope boundary

The experimental reader treats a quote specially **at the beginning of a token**, and the stage-0 host uses JSON literal decoding for the resulting double-quoted token. This is a partial lexer, **not a declaration that these rules fully reproduce historical Inox**. The TypeScript reference in `lib/inox.ts` contains more lexical states, including text, comments, indentation and aliases. In particular, the new lexer does not yet implement those states or move `VM.literal` and `def.emit` into Inox. The JSON image is not the production binary `.xnx` format.

Next: compare explicit historical lexical fixtures against the new reader, add the simplest compatible token classes, then address the top-level literal interpreter and binary image integration.
