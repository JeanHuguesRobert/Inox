---
title: "JS Interop API for the Inox for scripts layer"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-06-05"
license: "CC BY-SA 4.0"
status: "working-note"
corpus_role: "source"
summary: "API note for the JavaScript bridge in the default Inox scripting layer, treating the JS host as an explicit extension advantage."
keywords: "Inox, JavaScript interop, scripting layer, js.require, js.eval, coding agents"
document_role: "source"
document_kind: "working-note"
visibility: "public"
lifecycle_state: "working"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "working-note"
classification_confidence: "medium"
---

# JS Interop API for the "Inox for scripts" layer

## Guiding principle (user, 2026)

> that "Inox for scripts" is based on Javascript and it should not hide that fact and, on the contrary, consider it an advantage because it means that it is easy to extend for specific needs due to the presence of an API to interface with the underlying Javascript VM

Being hosted on a real, full-featured JS VM (Node today, browsers, future other hosts) is **not** a temporary embarrassment to be abstracted away. It is the pragmatic superpower of the scripting/CLI layer while the pure "system programming" layer (l9 + COP + eventual standalone runtimes) matures.

The existence of an easy, obvious bridge means an agent or tool written in `.nox` can always "one more thing" by reaching into the surrounding ecosystem (a particular npm package, the local `process`, a quick `Date` or `crypto` call, a sidecar local server, whatever) **without** having to patch the Inox core or drop down to C++.

## Two sides of the API

### 1. From inside .nox scripts (the "obvious for Agents" side)

All names live under the `js.` family (consistent with `text.*`, `map.*`, `file.*` poor-man's namespacing).

Implemented as primitives in `lib/inox.ts` (available in the default minimal CLI path).

- `js.eval ( source-text -- result )`  
  The ultimate escape hatch. ` "Math.floor(Math.random()*100)" js.eval ` or even small statements. Errors become a text result starting with "js-eval-error:".

- `js.require ( "module-name" -- proxy )`  
  ` "path" js.require ` → proxied Node module (uses `createRequire` so it works from the ESM-built runtime). Most of the Node/npm world is still CJS-friendly.

- `js.global ( -- proxy )`  
  `globalThis` (or `global`). Then `js.global "process" js.get` etc.

- `js.get ( obj key-text -- val )`  
  Read property. Works on proxies and other values (best effort).

- `js.set ( obj key-text val -- )`  
  Write property.

- `js.call ( argN ... arg1 fn-proxy arity-int -- result )`  
  Call a JS function or a method you obtained with `js.get`.  
  Example:
  ```
  "path" js.require >p
  "a" "b" $p "join" js.get  2 js.call   out
  ```

- `js.new ( ctor-proxy arg1 ... argN arity -- instance )`  
  `new` expression.

- `js.to-text ( val -- text )`  
  Best-effort stringification (JSON for plain objects).

- `a-proxy?` (existing) tells you if something is an opaque JS value held via the proxy mechanism.

Proxies are first-class Inox values (they have a name/tag usually derived from the constructor, e.g. "Object", "Module"). You can store them in maps, pass them around, etc.

### 2. From the host JS/TS side (embedding or "extending Inox itself")

When you do:

```js
import { inox } from "./builds/inox.js";
const I = inox();
```

You get:

- `I.primitive( "name", jsFunction )` — the fundamental extension point. Your JS function is turned into an Inox verb. Inside it you use `I.fun.PUSH(...)`, `I.fun.POP()`, `I.fun.TOS` etc. or the high-level cell helpers to move values between JS and the Inox stacks. This is how `read-file`, `cwd`, the whole `js.*` family, etc. were added.

- `I.fun` — bag of low-level VM operations (great for writing efficient FFI adapters).

- `I.evaluate( source )`, `I.processor( jsonState, jsonEvent, source )`

- `I.on(...)`, `I.signal(...)` (event hooks, still lightweight).

- The returned object also has `.repl` attached by the launcher.

This is deliberately open. A specific project (or an agent that needs a bespoke capability) can, at startup, register a handful of domain-specific words implemented in a few lines of JS, then the rest of the logic stays nice clean `.nox`.

You can also pass objects in at startup and make them available via a `js.injected` or by registering a primitive that pushes a proxy to them.

## Design notes / future

- Marshaling is intentionally "best effort + escape to proxy". Plain data (strings, numbers, bools) convert to native Inox cells. Everything else (objects, functions, arrays, modules, classes, ...) becomes a `proxy` cell that holds the real JS value in a side table (`all_proxied_objects_by_id`). `js.get` / `js.call` / `js.set` know how to unwrap proxies.

- Cycles and deep objects: `js.to-text` and auto-conversion are careful (or conservative).

- Async: the current "Inox for scripts" CLI is synchronous. `js.require` + sync calls are fine. True async / promises would require either a different execution model or explicit "future" / "await" words (future work, related to the COP side anyway).

- Security / sandbox: for untrusted agent scripts you will want a filtered global + no `eval` + controlled `require` (or a virtual module registry). The bridge makes that *possible* to add later without changing the language.

- C++ / standalone: the same words will need shims or "not available" behavior (or a JS engine embedded like QuickJS/Duktape in the future .exe). The `//c/` comments in the primitives mark the spots.

- `js.inox` (or similar) can expose the runtime exports object itself, letting advanced `.nox` code even register new primitives at runtime (meta-extensibility).

## Current status (implemented)

See `lib/inox.ts` (search for `primitive_js_eval` etc.) and `examples/js-bridge-demo.nox`.

The words are registered early so they are available to `cli-stdlib.nox` and all user scripts in the default (minimal) path.

Tested via the processor / `-e` path (some file-run + literate-header interactions in stdlib loading are pre-existing fragile and independent of this feature).

This directly realises the "consider it an advantage" request.

## Relation to the two versions

- Scripting layer (default): this bridge is a first-class part of the "obvious but pragmatic" experience.
- System layer (l9 + COP): will have its own, richer, traceable, distributed "foreign" mechanisms (packets as the universal currency, l8-faces, etc.). The JS bridge is mostly a scripting-layer convenience.

See also: `docs/two-versions-scripting-vs-system.md`, Inox#17, the cli-stdlib banner.
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](index.md)
- [Documents - All Tracked Repos](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/documents.md)
<!-- END_AUTO: backlinks -->
