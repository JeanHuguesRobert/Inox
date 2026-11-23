---
title: "Inox: Two Versions — Scripting vs System Programming"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-06-05"
last_modified_at: "2026-11-23"
license: "CC BY-SA 4.0"
status: "working-note"
corpus_role: "source"
keywords: "Inox, scripting, system programming, l9, COP, coding agents"
summary: "Primary design note distinguishing the agent-obvious Inox scripting layer from the l9/COP system programming layer."
document_role: "source"
document_kind: "working-note"
visibility: "public"
lifecycle_state: "working"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "working-note"
classification_confidence: "medium"
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
   - Budget visibility at this level should remain simple: estimated cost, remaining budget, degraded mode, ask/abort. The full CXU accounting machinery belongs below, in the system layer.

2. **System programming layer** (l9 + COP + future dynamic objects/actors)
   - Opt-in: `INOX_WITH_L9=1` (or `INOX_FULL=1`).
   - **FBF status (2026-11-22, GPT-6 coding agent under Jean Hugues Noel Robert):** the opt-in startup now loads `l9.nox` **and** `stdlib.nox` without the previous assertion; the focused `npm run test:l9` suite exercises class extension, basic integer method dispatch, recursion and `integer.times`. This is **bootstrap + verified subset**, not completion of the actor/task/promise layer.
   - **FBF loop-core repair (2026-11-22, GPT-6 under Jean Hugues Noel Robert):** `loop-while` and `loop-until` now repeat according to their respective booleans, preserve their permanent control frames, and resume at the correct instruction after the loop sentinel. The formerly unconditional `debug()` in `loop-until` was removed. `from:to:do:`, `from:down-to:do:` and `from:to:by:do:` use explicit postfix comparisons and the repaired **iterative** loop core, not recursive fallback. `npm run test:loop-control` validates 82 cases across both modes (including zero-step rejection with a pending FATAL diagnostic issue): results, break-if, after-loop continuation, nested iteration and constant control depth through 1,000 iterations in both modes.
   - **L9 integer.times repair (2026-11-22, GPT-6 under Jean Hugues Noel Robert):** removed the former recursive `stdlib.times-loop` workaround. The direct `times/it-method{ >blk from: 1 to: it do: { $blk .run }; }` is valid once the nested infix `do:` is terminated by `;` and the block is retrieved explicitly as a local value (`$blk`), rather than invoking an unrelated word `block`. The first failure was a syntax error in generated `stdlib.nox`, **not evidence of a compiler defect**. The L9 suite now verifies 22 cases including nested `.times` and 1,000 repetitions; the caller continuation and control-stack depth are preserved.
   - **L9 task-structure FBF (2026-11-23, GPT-6 under Jean Hugues Noel Robert):** the early `make.task` stub was removed. The actual class `maker{` consumes its class tag plus three stack arguments, and root initialization dynamically resolves the newly registered constructor *after* `task/class{` registration. `l9-root` is now a real task (`reference`, label `root`, id `1`, paused initially); children have parent references, unique IDs and correct `a-fork?` / `a-spawn?` flags, and are registered in the parent's `subtasks` / `forks` arrays. Corrected the unrelated but blocking core defects in extensible-object `object.!` (invalid exact forwarding-area-length assertion), `array.get` (discarded returned element), `stack.push` (overwrote length header and bypassed growth) and `stack.fetch` (off-by-one). Added native `array.each{` using actual array length/index access. `npm run test:l9-tasks` validates 29 runnable cases including collection growth to 100 items, not merely green startup.
   - **L9 elementary lifecycle FBF (2026-11-23, GPT-6 under Jean Hugues Noel Robert):** `@subtasks .each{...}` correctly separates the attribute receiver from dispatch; this repairs **root** cancellation without disabling child propagation. Added missing `list.each{`, using canonical stack length/fetch because list does not inherit stack iteration. Elementary promise `resolve`/`reject` now invoke `it .schedule` as a method, rather than treating `@schedule` as an object field; the handler list uses `@handlers .each{...}` and `@handlers .clear`. `npm run test:l9-lifecycle-basics` checks **15 cases** including list iteration, root cancellation idempotence, pending/settled states, stored values/reasons and first-settlement-wins. These checks do not imply callbacks or actor scheduling work.
   - **Remaining defects:** cancellation of an actual child now reaches the unimplemented `task.raise`/exception path and remains red. `task.resume` calls `schedule`, which is not implemented as a functioning task scheduler. `promise.then` still cannot reliably construct or propagate promise handlers. They remain **red** in `node scripts/probe-l9-task-lifecycle.js`, outside green suites. Full actor scheduling, further method dispatch and cross-target execution remain unverified. A zero step in `from:to:by:do:` is rejected but the historical `FATAL` hook produces a noisy diagnostic. General recursive CSP overflow detection at context switches was **deferred by the Principal** in `CPKT-2026-11-22-INOX-CSP-CONTEXT-SWITCH`; no per-call/defer checks were added.
   - **Inox source encoding:** the current parser is not robust to non-ASCII characters even in comments. Agent attribution inside `.nox` uses ASCII `Noel`; full names and richer provenance belong in the commit, issue and Cognitive Packet. The derived `stdlib.nox` has no checked-in generator today, so these fixes are attributed in the file while a reproducible generator remains future work.
   - Goal: a **dynamic system programming language** for the cognitive substrate itself.
   - **Cannot (and should not) be "obvious"**: it manipulates the richer, less usual, traceable concepts required for rational exploration at scale:
     - Continuations as first-class input/closure delivery.
     - Cognitive packets (COP) as the currency of coordination.
     - Artifacts as projections with `stabilityLevel`, `derivesFrom`, `cacheKey`, `retentionPolicy` (until_superseded / legal_hold / right_to_forget / forever ...).
     - Capitalization (lookupReusableArtifact / stabilizeTaskArtifacts), obsolescence by judgment (human or AI marking dead-ends), fork/join of cogitors.
     - Control/data plane separation, reactive sets, pressure, tasks as sagas, JobScheduler routing/retry, partial consistency as a feature for AI agents.
     - Full dynamic objects (metaclasses, `attribute`, `it-method{}`, `extend-class`, thing dispatch), actors.
     - CXU-style runtime accounting: compute budgets, mandate-bound spending, replay-safe cost tracking, no double spend, no commit without trace, and anti-gaming rules ensuring that a large budget cannot buy cognitive legitimacy.
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
- When you need distribution, traceability, human+AI judgment in the loop, artifact retention sweeps, reactive dataflow, full actor model, or CXU-like accounting of compute under mandate — graduate the relevant pieces to the l9 + COP layer (or use the l8-face bridges from COP/inseme while Inox is stabilizing).
- Both layers are Inox (`.nox`). We avoid producing new portable JS/TS for the agent logic itself (per the overarching "move out of Javascript and move in to Inox" constraint), except for transitional COP/inseme "face" adapters and the deliberate, thin `js.*` escape hatch in the scripting layer.

## Philosophy notes

- **Occam**: two versions is the minimal cut that keeps the agent-facing surface obvious while allowing the full power of the system layer where needed. One single "obvious for everything" language would either hide the complex concepts (bad for system programming) or force agents to confront them constantly (bad for the rational exploration use case).
- **Rossignol / traceability**: all of this is recorded (this doc, the cli-stdlib banner, Inox#17, research notes, git). The dispositif must be able to produce its own attestation.
- **Carte et territoire**: the scripting layer is closer to Cogentigram (the model / the working memory the agent reasons on). The system layer deals with the full Cogentia (the territory, provenance, multiple projections, retention obligations, judgment over dead-ends).
- **Budget is not legitimacy**: CXU-style accounting should make compute scarce, attributable and traceable; it must not let the richest actor buy the result of the cognitive game. Cost creates seriousness, not authority.

See `cli-stdlib.nox` (top banner + the recall/remember/with-update/obsolete section) for the current "obvious" surface implementation.

This document is the primary codification of the user's idea.
<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Inox: Two Versions — Scripting (Obvious for Agents) vs System Programming (l9 + COP)](../docs/two-versions-scripting-vs-system.md)
- [Research Index — Inox](index.md)
<!-- END_AUTO: backlinks -->
