---
title: "Inox: Two Versions — Scripting vs System Programming"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-06-05"
license: "CC BY-SA 4.0"
status: "working-note"
corpus_role: "source"
keywords: "Inox, scripting, system programming, l9, COP, coding agents"
summary: "Primary design note distinguishing the agent-obvious Inox scripting layer from the l9/COP system programming layer."
---
# Inox: Two Versions — Scripting (Obvious for Agents) vs System Programming (l9 + COP)

User's explicit framing (2026):

> my idea is that the "scripting" version should be fairly "obvious" for coding Agents ; whereas the "system programming" cannot be obvious because it manipulate more complex and much less usual concepts ; hence the two versions

## The split and why it exists

There are two intended "versions" / layers / audiences for Inox:

1. **Scripting layer** (the default, minimal CLI path)
   - Files: `bootstrap.nox` + `forth.nox` + `cli-stdlib.nox`
   - Activated by default (`node builds/inox.js prog.nox` or `bin/inox.js` etc.). No env var needed.
   - Goal: a **usable, rich enough, old-school** concatenative scripting language (Forth/C/Unix flavour) with modern script ergonomics for data modeling and updates.
   - **"Fairly obvious for coding Agents"**: this is the key point. Agents (whether prompt-driven LLM agents, human coders, or other generators) should be able to write or emit natural `.nox` code for their inner loop without deep surprise.
     - Working memory as maps/records (`map.new`, `remember`/`recall`/`update!`, `/key` tag keys).
     - Easy branching for exploration of the possible (`fork-memory`, `with-update` derivation).
     - Simple control of side-effects (the `begin-turn` / `delay-effect` / `commit-turn` / `obsolete-turn` / `obsolete` pattern sketched in cli-stdlib).
     - Capitalization of reusable sub-results (just remember a sub-map under a cache key).
     - Poor-man's namespacing (`text.length`, `array.get`, `map.put`, `file.read`, `float.sqrt`, `stack.push`... + poly dispatchers where stable).
     - Classic explicit postfix, named values (`>x $x`), `!` for effects, `it` + `with` for context.
   - Relation to mainstream: higher expressiveness in composition, metaprogramming, explicit dataflow, low-ceremony CLI tools; lower (for now) in nested data ergonomics compared to Python dict+dataclass / Ruby hash+Struct / JS object / Lua table — addressed here via records + maps + with-style + the update words.
   - This layer is what we produce while Inox matures, and what transitional JS/COP bridges can consume.

2. **System programming layer** (l9 + COP + future dynamic objects/actors)
   - Opt-in: `INOX_WITH_L9=1` (or `INOX_FULL=1`).
   - Currently still contains bugs (the l9.nox OO/class/actor/task/promise work inherited from l8 is incomplete; parser asserts, it-method resolution, extend non-extensible, etc. — see git history around the Claude sessions and l9 test disable).
   - Goal: a **dynamic system programming language** for the cognitive substrate itself.
   - **Cannot (and should not) be "obvious"**: it manipulates the richer, less usual, traceable concepts required for rational exploration at scale:
     - Continuations as first-class input/closure delivery.
     - Cognitive packets (COP) as the currency of coordination.
     - Artifacts as projections with `stabilityLevel`, `derivesFrom`, `cacheKey`, `retentionPolicy` (until_superseded / legal_hold / right_to_forget / forever ...).
     - Capitalization (lookupReusableArtifact / stabilizeTaskArtifacts), obsolescence by judgment (human or AI marking dead-ends), fork/join of cogitors.
     - Control/data plane separation, reactive sets, pressure, tasks as sagas, JobScheduler routing/retry, partial consistency as a feature for AI agents.
     - Full dynamic objects (metaclasses, `attribute`, `it-method{}`, `extend-class`, thing dispatch), actors.
   - This is the "substrate for the agents". The complexity is earned; the scripting layer stays obvious precisely so agents don't have to think about all of it.

Hence the two versions, as stated.

## Current state (2026)

- The minimal/CLI/scripting path is the pleasant default and is what most `.nox` examples and tools should target first.
- `cli-stdlib.nox` is the place where we improve the "obvious" surface (update ergonomics to decent-script level, agent memory/branch/turn patterns, collections, CLI I/O, and the `js.*` host bridge).
- The `js.*` bridge (`js.eval`, `js.require`, `js.get`/`js.set`/`js.call`, `js.global`, `js.new`, ...) is an explicit, first-class feature of the scripting layer. Being based on a real JS VM is considered an *advantage* for easy per-project extension (see `research/js-interop-api-for-scripting-layer.md` and `examples/js-bridge-demo.nox`).
- l9 path is opt-in and still under repair (the bugs are why the user "moved on" to the CLI solution).
- See also:
  - `Inox#17` (the GitHub issue recording the destiny of l8 / side / hybrid / move-out-of-JS-to-Inox, with the user's "Actually, I know what I want..." statement).
  - `research/` (naming, reactive sets, rossignol criterion, task-step-continuation lineage).
  - `lib/inox.ts` (the `cli_minimal_core` guard + run_program sync entry point).
  - `bin/inox.js` (the launcher).
  - Historical banners on `l8/README.md` and `side/README.md` (local) pointing at the Inox destination.

## Migration / usage guidance

- Write agent "code" (the logic that maintains beliefs, explores paths, capitalizes, judges) in the scripting layer first. It should feel direct. When the agent/script needs "one more thing" that isn't in core + cli-stdlib yet, it reaches out explicitly via the `js.*` bridge (`js.require "foo"`, `js.eval`, property get/call on the result, etc.). This is the intended advantage of the scripting layer running on JS.
- When you need distribution, traceability, human+AI judgment in the loop, artifact retention sweeps, reactive dataflow, or full actor model — graduate the relevant pieces to the l9 + COP layer (or use the l8-face bridges from COP/inseme while Inox is stabilizing).
- Both layers are Inox (`.nox`). We avoid producing new portable JS/TS for the agent logic itself (per the overarching "move out of Javascript and move in to Inox" constraint), except for transitional COP/inseme "face" adapters and the deliberate, thin `js.*` escape hatch in the scripting layer.

## Philosophy notes

- **Occam**: two versions is the minimal cut that keeps the agent-facing surface obvious while allowing the full power of the system layer where needed. One single "obvious for everything" language would either hide the complex concepts (bad for system programming) or force agents to confront them constantly (bad for the rational exploration use case).
- **Rossignol / traceability**: all of this is recorded (this doc, the cli-stdlib banner, Inox#17, research notes, git). The dispositif must be able to produce its own attestation.
- **Carte et territoire**: the scripting layer is closer to Cogentigram (the model / the working memory the agent reasons on). The system layer deals with the full Cogentia (the territory, provenance, multiple projections, retention obligations, judgment over dead-ends).

See `cli-stdlib.nox` (top banner + the recall/remember/with-update/obsolete section) for the current "obvious" surface implementation.

This document is the primary codification of the user's idea.


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Inox: Two Versions — Scripting (Obvious for Agents) vs System Programming (l9 + COP)](../docs/two-versions-scripting-vs-system.md)
- [Research Index — Inox](index.md)
- [Documents - All Tracked Repos](https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/research/documents.md)
<!-- END_AUTO: backlinks -->
