---
title: "Inox specification/runtime semantic-drift audit"
date: "2026-08-26"
status: "audit report — language decisions pending where stated"
document_role: "derived"
document_kind: "audit-report"
visibility: "public"
lifecycle_state: "working"
language: "en"
related:
  - "inox-spec.md"
  - "inox-tutorial-basic.md"
  - "learning-inox.md"
  - "inox-naming-and-assignment.md"
  - "https://github.com/JeanHuguesRobert/Inox/issues/4"
  - "https://github.com/JeanHuguesRobert/Inox/issues/34"
  - "https://github.com/JeanHuguesRobert/Inox/issues/35"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "explicit-metadata"
classification_confidence: "strong"
---

# Inox specification/runtime semantic-drift audit

This is an evidence report for Inox #34. It compares the working specification,
tutorials, examples, tests, and the current TypeScript **minimal CLI runtime**.
It does not make that runtime the language authority. A blank/failed probe is
recorded as runtime evidence, not as a language decision.

## Evidence and scope

Sources read: `AGENTS.md`; Cogentia shared instructions; Inox #34 and #4;
`research/inox-spec.md`, `inox-docs-index.md`, `inox-tutorial-basic.md`,
`learning-inox.md`, `inox-naming-and-assignment.md`,
`two-versions-scripting-vs-system.md`, and `llm_token_efficiency.md`;
`examples/*.nox`; `lib/bootstrap.nox`, `lib/forth.nox`, `lib/inox.ts`; and the
existing micro conformance contract. #4 is treated as the already-established
doctrine for named stack cells: core `=` is not assignment. This report audits
its related spellings; it does not reopen or duplicate #4.

The probe command is deliberately observational:

```text
npm run build
npm run probe:spec-runtime-audit
```

It prints one JSON record per source snippet with source, stdout, stderr, and
exit status. It invokes `builds/inox.js -e` with the ordinary minimal profile,
so it cannot establish the behavior of an opt-in l9 or a future dialect.

## Inventory matrix

| Construct | Specification | Basic tutorial | Learning tutorial | Examples/tests | Current minimal runtime | Status |
|---|---|---|---|---|---|---|
| Definition terminator | `.`; a first `to` on the next non-empty line implicitly closes the open definition | dot examples | formerly claimed `.` or `;` | `hello.nox` uses `.` | `.` works; column-1 `to` performs the documented implicit close; `;` leaves definition open and exits 1 | A fixed; D remains only for untested boundary cases |
| Implicit top-level `to` | column 1 terminates prior definition | not precise | not precise | no focused regression | column 1 works; indented `to` fails | D |
| Prefix/postfix/infix | all described | prefix/infix examples | claims all three | factorial uses nested prefix/infix | prefix enclosure and block probes work; un-enclosed top-level infix is not equivalent | D |
| Keyword call | `say:to: ... ;` | keyword terminology | `say: ... to: ... ;` | bootstrap defines keyword words | call works; `;` closes call, not definition | A fixed |
| Comma plus whitespace | not found as grammar rule | explanatory text | examples use commas | `bootstrap.nox` uses commas | comma+blank closes pending infix; no-blank is part of token and produces `missing-verb ,"b"` | D |
| Equality | `=` and `<>`; the former `=?` example is corrected to `=` | formerly used `=?` | formerly advertized `=?` | bootstrap uses `=` | `=` and `<>` work; `=?` is an undefined verb | A corrected |
| Local named values | `>x`, `$x`/`x>`, `>x!`/`$x!` | same | same | #4 doctrine and bootstrap | `>x`, `$x`, `x>`, `>x!` work; `$x!` missing | C implementation bug; separate issue |
| Data named values | `_x`, `_x!`, `:x` | same | discussed | specification examples | `:x`, `_x`, `_x!` work in probe | agreement |
| Named literal | `x:3` used repeatedly | no executable confirmation | claims `x:3` | specification and LLM note use it | parsed as missing verb `x:3` | C |
| Tags | `/x`, `x/`, `#x` | `/x`, `x/` | all three | naming conventions | all three print tag `x` | E/agreeing variation |
| Function shorthand | malformed `tell-to/` abbreviation | not central | function-style naming | spec-only form | historical spelling has `&&`, unbalanced delimiters, and no minimal executable evidence | B corrected; D |

## Probe results for the ten audit seeds

1. **`.` versus `;`** — `to a "dot" out. a` prints `dot`, exit 0.
   `to a "semicolon" out; a` reaches premature EOF and exits 1. A keyword
   call (`say: "Hello" to: "Bob";`) works. The generated tutorial was a
   category **A** error and is corrected. The parser's poor error after a
   missing definition terminator is a candidate **C** implementation defect,
   but not changed here.

2. **Malformed `tell-to/` example** — the exact shorthand contains `&&` and
   lacks closing grammar. The full `function:` example also has no evidence in
   the minimal profile (`function` is reported missing). The malformed snippet
   was a category **B** stale/historical documentation presentation and is now
   explicitly labelled non-executable. Whether an abbreviated function grammar
   is core, library, or dialect syntax is **D**.

3. **Comma plus whitespace** — `&( "a", "b" )` prints `ab`; without the
   blank, `&( "a","b" )`, the tokenizer retains `,"b"` in a word and the
   runtime reports a missing verb. `lib/inox.ts` explicitly implements this
   distinction, but no source grammar makes it a language contract. **D**:
   decide whether to specify and preserve it, move it to a dialect, or change
   it in a versioned design change.

4. **Implicit termination before `to`** — this is established behavior, not an
   ambiguity: a `to` that starts the first next non-empty line (column 1)
   closes the preceding open definition as if a `.` had been pushed back, then
   starts the new definition (probe outputs `AB`). An indented `to` produces
   “unexpected to”. EOF with an unterminated definition emits a premature-EOF
   diagnostic. Only comments, blank lines, and nested constructs were not
   exhaustively enumerated; those boundary cases remain **D**.

5. **Notation boundaries** — `out( 1 + 2 )` and a block-enclosed equivalent
   print `3`; postfix works in ordinary examples. A bare top-level `1 + 2 out`
   leaves an unfinished parsing state and fails. The broad prose claim that all
   forms coexist lacks a context table. **D**: specify parser contexts and
   termination behavior before calling any of these forms universal.

6. **Equality** — `out( 1 = 1 )` and `out( 1 <> 2 )` each print `1`; `=?` is
   an undefined verb in the minimal runtime. Every audited `=?` occurrence was
   a category **A** documentation error and is corrected to `=`. The `?`
   convention applies to worded predicate verbs such as `equal?`; it does not
   mechanically turn the symbolic equality operator `=` into `=?`.

7. **Local named-value forms** — `>x`, `$x`, `x>`, and `>x!` work; a probe
   prints `8` after update. `$x!` is an undefined verb and can destabilize the
   subsequent local lookup. The specification now explicitly establishes
   `$x!` as equivalent to `>x!` and reserves that meaning. Its absence is
   therefore **C**, an implementation bug tracked in [Inox #35](https://github.com/JeanHuguesRobert/Inox/issues/35). This
   extends #4 only as executable confirmation.

8. **Tags and names** — `/x`, `x/`, and `#x` each produce tag `x`. This is
   **E**, intentional equivalent surface variation, not drift. The concise
   slash-chain form remains profile/dialect-sensitive and is not declared core
   by this report.

9. **Keyword syntax** — a local `say:to:` definition and
   `say: "Hello" to: "Bob";` print `Hello to Bob`. The evidence distinguishes
   `;` as keyword-call terminator from `.` as definition terminator. The
   learning tutorial correction is **A**.

10. **Tutorial-only / AI-invented candidates** — the audit found `=?` and the
    claim that `;` ends definitions as unsupported by the minimal runtime
    (**A** documentation errors); `$x!` as a specification/runtime
    implementation discrepancy (**C**); `x:3` as specification/tutorial
    syntax unsupported by it (**C**); and the malformed function shorthand
    (**B/D**). `#x` was verified valid and is not an AI-invented error.

## Discrepancy classification

### A — clear documentation errors (corrected)

- `learning-inox.md`: `;` claimed as a definition terminator.
- `inox-spec.md`, `inox-tutorial-basic.md`,
  `inox-tutorial-generation-guidelines.md`, and `learning-inox.md`: `=?`
  presented as current equality syntax.

### B — stale documentation (corrected while retaining provenance)

- The malformed `tell-to/` abbreviation was presented as an executable
  standard-library syntax. It is now quoted as historical/non-executable
  evidence until a profile-specific grammar is decided.

### C — likely implementation bugs (not fixed)

- `x:3` is used as a named literal in the specification, tutorial, and research
  note but is tokenized as a missing verb by the minimal runtime.
- Unterminated definitions and rejected syntax cascade into assertion failures
  after the useful parser diagnostic. This makes invalid-source probes harder
  to classify safely.
- `$x!` is specified as equivalent to `>x!`, but is not compiled as a local
  update in the current TypeScript runtime.

### D — specification ambiguities or omissions (not fixed)

- Formal comment/blank-line/EOF/nesting boundary rules for definitions. The
  column-1 next-`to` implicit termination rule itself is established.
- Comma-whitespace semantics and its profile ownership.
- Complete context grammar for prefix, postfix, and infix notation.
- Whether `function:`, `/{`, and historical abbreviated function syntax belong
  to core, an optional library, or a dialect.

### E — intentional dialect differences

- `/x`, `x/`, and `#x` are verified equivalent tag forms. They exemplify
  intentional syntax diversity and must not be collapsed merely for tutorial
  uniformity.
- `forth.nox` is explicitly a Forth dialect; its colon/semicolon conventions
  must not be projected backwards onto Inox core.

### F — genuine semantic conflicts

None established by the executed evidence. `x:3` has coherent
specification-side intent versus an absent minimal-runtime implementation, so
it remains C pending further historical evidence rather than being promoted to
F. `=?` is a corrected A documentation error.

## Human language-design decisions needed

### Definition grammar

Question: What are the remaining boundary conditions of the established
definition-termination rule in each profile?

Spec says: `.` terminates a definition when needed; a `to` at the first next
non-empty line (column 1) implicitly closes the prior open definition before
opening the next one.

Runtime does: confirms dot and column-1 `to`; rejects indented `to`; emits a
secondary assertion after EOF.

Examples imply: dot is the reliable portable form.

Compatibility impact: grammar changes can reparse existing sources.

Options: (1) write the established current rule, including its line-start
condition, as formal core grammar; (2) specify a canonical formatting profile
that always writes explicit dots while retaining the core implicit-close rule;
(3) make any further layout-sensitive extensions dialect-specific.

Agent recommendation: option 1 for the established rule, with option 2 only
as a source-formatting convention if desired. Human decision needed: yes, for
the remaining boundary cases and profile presentation.

### Named literal `x:3`

Question: Is `x:3` a core literal, a dialect spelling, or obsolete notation?

Spec says: it creates a value named `/x` and uses it repeatedly.

Runtime does: treats it as an undefined verb.

Examples imply: named data can always be created through `3 :x`.

Compatibility impact: restoring it changes lexical/parser handling; removing
it changes published examples and LLM-facing material.

Options: implement it as a versioned core/dialect feature; document `3 :x` as
canonical while retaining history; or establish a dedicated dialect.

Agent recommendation: decide profile ownership first, then add a focused
positive conformance test. Human decision needed: yes.

### Comma and notation context

Question: Are comma-whitespace and top-level infix restrictions intentional
core grammar, implementation accidents, or dialect rules?

Spec says: syntax styles coexist, but does not define the boundary.

Runtime does: makes comma+blank semantic and accepts infix reliably inside
enclosures, not equivalently bare at top level.

Examples imply: enclosures/semicolon delimit calls.

Compatibility impact: changing either could silently alter parsed programs.

Options: formalize current behavior; version a parser repair; or expose
profile-specific grammar. Agent recommendation: add grammar fixtures only
after selecting a profile contract. Human decision needed: yes.

## Reducing future drift

The smallest high-value next investment is a versioned, machine-readable core
grammar plus a canonical syntax corpus that records source, profile, expected
parse/result, and diagnostic class. Use the observational probe added here as
seed data, not as the grammar itself.

Next, make selected documentation snippets executable in CI against their
declared profile, and generate a concise reference from parser/compiler
introspection only where the emitted data can distinguish core from dialect.
Version-tag dialect documents. A future `inox describe-language --json` can be
useful once its schema is explicitly a projection of those contracts; it must
not simply expose incidental TypeScript implementation detail.

Formal grammar, executable documentation, a conformance corpus, generated
reference fragments, versioned dialect descriptions, and compiler introspection
are all feasible anti-drift mechanisms. None is implemented wholesale here.

## Exact commands and results

```text
git fetch --prune
npm run build                         # passed
node builds/inox.js examples/hello.nox      # passed; Hello from Inox!
node builds/inox.js examples/factorial.nox  # prints 120, 720, 5040, plus missing-verb . diagnostic
npm run probe:spec-runtime-audit      # completed; JSON evidence above
git diff --check                      # passed
```

The repository's existing service/session/retrieval suites were not run: they
do not exercise core syntax and runtime parsing. No language semantics changed.

## Required final report

```text
Scope:
  Core syntax and core-language-semantics evidence only; no standard-library,
  runtime-semantic, or future-dialect redesign.
Files inspected:
  AGENTS.md; Cogentia shared instructions; issues #34 and #4; seven required
  research documents; representative examples; bootstrap/forth/runtime code;
  existing micro-conformance material.
Files changed:
  research/inox-spec-runtime-audit.md
  research/inox-spec.md
  research/inox-tutorial-basic.md
  research/learning-inox.md
  scripts/probe-spec-runtime-audit.js
  package.json
  .gitignore
Runtime probes added/run:
  npm run probe:spec-runtime-audit (19 isolated minimal-runtime snippets;
  JSON includes source, stdout, stderr, and exit status).
Tests passed:
  npm run build. The hello example passed. The probe completed and captured
  both successful and intentionally invalid-source observations.
Discrepancies found:
  A clear documentation errors:
    semicolon definition termination; =? equality.
  B stale documentation:
    malformed tell-to/ abbreviation presented as executable grammar.
  C likely implementation bugs:
    x:3 named literal absent; $x! local update absent (Inox #35); rejected source
    cascades to assertions.
  D specification ambiguities:
    definition-boundary cases; comma-whitespace semantics; notation contexts;
    function/block shorthand profile ownership.
  E intentional dialect differences:
    /x, x/, #x tag forms; Forth dialect conventions.
  F semantic conflicts:
    none established.
Behavior changed: no
Known risks:
  The probe reports current minimal-runtime behavior, not a normative language
  decision. l9/full-profile behavior remains outside this bounded audit.
Human language-design decisions needed:
  Definition grammar, x:3 ownership, comma/notation context, and function
  shorthand/profile status. `$x!` is decided and requires implementation.
Recommended next step:
  Decide a versioned core grammar/profile, then promote selected probes into a
  canonical parser conformance corpus and executable documentation checks.
```
