# JavascriptInox stage-0 toy runner (Inox #41)

This is a standalone **JavaScript ESM** semantic experiment. It does not import the historical TypeScript runtime, use external packages or implement the `.xnx` image format. It deliberately avoids making JavaScript object prototypes part of the Inox language.

Run from the Inox repository root:

```sh
node --test experiments/javascript-inox/toy-runner.test.js
```

Minimal Inox-style source recognized by the stage-0 reader:

```text
to double dup + .
to quadruple double double .
21 double
21 quadruple
```

The final data stack contains `[42, 84]`.

## What the experiment proves

The runner manages `IP`, `CSP`, `DSP`, and **one logical address space** `vm.cells` of `{name,type,value}` Cells. The two stacks store references to Cells allocated in that address space. Primitive Cells hold ordinary JavaScript functions; literal Cells accept JS values without deep cloning. Verb definitions are **contiguous addressable sequences of Cells**. Compiled calls save return addresses in the control stack and jump by `IP`; they do not recursively invoke JavaScript functions for user-defined verb calls.

Only bootstrap primitives and the initial `to` verb are assembled by JavaScript. Crucially, **all subsequent user definitions are compiled by running `to` inside the VM**, using its own loop and primitive helpers: `next-token`, `def.begin`, `token.end?`, `def.emit`, `def.finish`, `branch-if`, `jump`. A JS-side compiler does not create `double` or `quadruple`. Redefinitions do not silently retarget old compiled calls.

## What it does not claim

The tiny stage-0 tokenizer recognizes a subset (whitespace-delimited words, simple numeric/Boolean/null literals and quoted JSON strings); it is **not** the historical Inox tokenizer or compiler. The current runner is synchronous and append-only, does not implement actors, `l9.nox`, a shell, Image Zéro, `inox.image.v1` serialization, snapshot, native FFI ABI, or a C runner. Direct functions inside primitive Cells are local JS conveniences, **not** a portable image representation.

Next useful checkpoint: extract a portable primitive import/ABI contract, then bootstrap an Inox-written tokenizer/compiler from the historical TS implementation and validate its compilation in the minimal runner. Reuse the existing `tools/inox-image` prototype rather than invent a second image container.

Author: GPT-6 coding agent, under Jean Hugues Noël Robert's direction (2026-11-23).


### 2026-11-26: source convergence, blocks and locals

Compiled definitions now support plain first-class blocks `{ ... }` inside
verbs, `run`, conditional invocation, and local creation/read/update
(`>x`, `$x` or `x>`, `>x!`). Blocks resolve locals dynamically at invocation,
not by capturing an enclosing JavaScript closure. Each invocation owns local
scopes; inline structured control opens and closes explicit scopes, including
on loop exits. Blocks are represented by a typed Cell referencing threaded code.
The experimental image keeps symbolic primitive imports and relative offsets,
so no native JS object or absolute block address needs to be serialized.
The differential suite `source-control.test.js` compares the same source with
the existing historical CLI, both JavascriptInox bootstraps, and image replay.

This remains a subset: top-level block expressions, specialized scoped blocks
(`>{ ... }`, `/{ ... }`), other runnable types and full grammar are not yet
implemented. The binary Cell ABI is intentionally not a compatibility goal.

### 2026-11-26: incremental source convergence policy

Principal's decision: implement primitives in response to actual needs, not
from an exhaustive porting inventory. At each such need, prefer an Inox
definition when the execution time, memory and complexity are reasonable;
otherwise use a native JavaScript implementation. Keep the working historical
TypeScript implementation intact except in specifically justified cases.
Converge on source syntax and semantics, not on the concrete binary Cell ABI.
A distinction between abstract language operations, representation-specific
mechanisms and Inox libraries is useful, but does not mandate a rewrite.

Retrospective review of the existing experiment:

- Keep native stack operations, scalar arithmetic/comparison/boolean
  operations, instruction dispatch, branches, frame/local storage, block
  invocation, compiler storage and source character access. These touch the
  representation or are small hot-path operations. In particular, the
  native `over` avoids the extra literal and stack operation of `1 pick`.
- Keep native object projection, regular expression matching, whitespace
  classification, text concatenation and error construction for now; these
  delegate to inexpensive host mechanisms. Their source-language contracts
  still require differential verification where a historical equivalent exists.
- `token.end?`, `char.end?`, `char.quote?`, `char.backslash?`,
  `text.empty-null` can be expressed in Inox, but are lexer/compiler hot
  paths. Retain for now rather than incur additional instructions and
  allocations merely to reduce the JS line count.
- Structured syntax lowering in `emitSourceToken` is language policy rather
  than representation. Consider moving individual rules into Inox as they
  are next needed, keeping low-level emission/linking native. Do not make
  wholesale migration a prerequisite for source convergence.
- ZeroBrowser originally exposed `count`, raw `field` and legacy aliases
  `eq`, `lt`, `secret?`. These redundant adapters were removed in the
  consolidation described below; use `count` and projected `field.object`.

Measured on Fracta2, Node v26.13.1: 10,000 iterations of identical loops
using `over` versus `1 pick` executed 180,013 versus 190,013 instructions,
and retained 100,009 versus 110,009 new Cells. Native `token.end?`,
inline `"." equal?`, and a called Inox verb containing that expression
executed respectively 170,013, 180,013 and 200,013 instructions and retained
100,009, 110,009 and 120,009 new Cells. Wall-clock samples for over/pick
were noisy and do not establish a timing advantage.

**Memory cost: measured, not an automatic FBF blocker.** The append-only
logical address space retains transient Cells (809 / 8,009 / 80,009 for
100 / 1,000 / 10,000 loop iterations, even with DSP=CSP=0).
The Principal clarified that the intended scripts are short-lived: judge
the actual cost against the whole execution environment, expected
concurrency, and lifetime, rather than imposing bounded allocation in
all cases.

On Fracta2, Node v26.13.1, post-GC incremental heap measurements:

| Workload | Retained heap (approx.) |
|---|---:|
| Bare VM (batch of 100) | 12 KB/VM |
| Compiler + lexer (batch of 100) | 17 KB/VM |
| Browser selection, 1 / 10 / 80 rejected fields (batch of 100 each) | 23 / 53 / 300 KB/VM |
| Simple loop, 100 / 1,000 / 10,000 iterations (median of 5) | 70 / 480 / 4,774 KB |

A fresh Node process with imports used about 51 MB RSS and 4.38 MB heap.
The current Cogentia recipe adapter creates a VM for each selection, limits
each invocation to 100,000 instructions and accepts at most 80 fields via
the registry. After dropping the VM reference and forcing GC, heap returned
near baseline (4.48 MB after the 80-field test; 4.46 MB after the 10,000
iteration test). RSS and retained heap are different metrics.

However, popped Cells currently retain their values: a direct test of
`drop` with an object payload confirmed the original object remains
referenced by `vm.cells` while the VM survives. Distinguish clearing dead
payload references from recycling address slots. The former is relevant
when handling larger host objects; the latter is not an immediate
requirement for current short scripts. Do not introduce a free-list or
compacting allocator merely to eliminate modest transient accumulation.
Revisit when measured memory, concurrency or lifetime warrants it.
Continue incremental source convergence; no memory-management rewrite is
a prerequisite. Measurements are workload-specific, not a general memory cap.

### Target blocks (incremental source convergence)

The tested historical forms `target >{ ... }` and
`target { ... } run-with-it` now bind a dynamic local `it` in the
called block's frame. `it`, `$it` and `it!` access/update that target;
return restores the caller's binding. The new native primitives reuse
existing frame lookup and threaded invocation; the syntax emits a normal
block followed by `run-with-it`. No binary representation dependency.
Seven differential cases cover nested targets, update, conditional
invocation and continuation after the block. Historical `/{ ... }`
parameter binding and `.{ ... }` syntax are deferred: probes of the
existing CLI did not establish expected continuation behavior.
No memory allocator changes.

### Named parameter blocks (2026-11-26)

After fixing the historical runtime (Inox d0445e2), the experiment now
supports `actuals with /a /b /{ ... }`, suffix tags `a/ b/`,
the explicit `/with` sentinel, and `{ ... } run-with-parameters`.
The compiler lowers the special block to an ordinary relocatable block
and the frame-binding primitive. Tags use native Cells with string
names/values; the image still contains only scalar literals and symbolic
imports (`tag.literal` constructs the runtime tag). No binary ABI change.

The parameter primitive scans the formal tags to the sentinel, derives
the actual argument boundary from the count, and binds the existing
dynamic frame. Return restores the caller. No arbitrary arity limit.
The existing JS experiment retains its checked-mode validation; no
extra fast-mode architecture is introduced. Invalid calls fail before
entering the block. This is the needed tag subset, not a general
implementation of tag operations, `as-tag`, or method dispatch.
Thirteen new source-differential cases exercise parameter binding,
including eleven arguments, shadowing, nested calls and image relocation.

### Dynamic verb invocation (2026-11-26)

The reference engine distinguishes a symbolic verb (via `as-verb`) from
a bound definition (via `tag.to-verb`): redefining its name changes the
former, not the latter. The experiment now supports this distinction,
`tag.run`, `text.run`, `as-tag`, `text.as-verb`, and `verb.run`,
including primitive calls. `verb.run` retains its operand as in the
reference; generic `run` consumes the tag/verb, not a void or boolean.
All execution uses the existing threaded VM call frames. An unknown tag
is a no-op, an unknown conversion to verb is void, and `text.as-verb`
falls back to noop. `text.run` is checked for a known verb.

The source tag subset includes dotted method-like names. Scalar names
and symbolic imports in definition images are unchanged; bound runtime
verb Cells are not serialized. A relocated caller resolves the callee
in the receiving VM. The new tests cover 12 single-body cases and five
multi-definition cases, including late versus bound redefinition.

Scope remains incremental: generic non-text conversion, integer-address
execution, named/renamed symbolic verb metadata (the historical engine
can lose the symbolic name when creating a local), full tag interning,
and object/method dispatch are not established by this subset. The attached numeric terminal dot is addressed in the next section.

### Definition termination and indentation (2026-11-26)

Both experimental readers now retain token source positions and accept
an attached terminal dot (including after an integer), implicit
termination at a new column-one `to`, and dedent from an indented
body back to column one. The outer compiler's existing `next-token`
primitive supplies a synthetic dot without consuming the following
token; explicit nested blocks keep their own punctuation. EOF alone
does not publish an unfinished definition. Internal dots in names and
decimal literals are preserved. The position pass examines spans of
already-scanned tokens and intervening whitespace, not a second lexer.

Eleven source cases checked against the historical runtime cover
attached dots, successive definitions, indentation, blank lines,
nested indentation and block bodies. Both bootstrap and image-loaded
readers pass. The experiment continues to accept a redundant explicit
dot at column one after dedent (used by existing experimental sources,
although the historical engine treats it as a top-level missing verb).
The experiment's decimal arithmetic is not claimed to match the
historical integer parser. No general indentation-sensitive block
grammar or full historical tokenizer is introduced. Compiler and
lexer image contents remain unchanged.

### Direct method dispatch (2026-11-26)

The first OO convergence step is the historical direct dictionary lookup
`class.method`, with `.method` lowered to a tag and `run-method`.
`run-method-by-name` and `class-method-tag` share the same naming
convention. The receiver remains on the data stack and method invocation
uses the existing VM call frames. Native scalar classification is a
small host primitive; there is no separate JS object hierarchy or cache.
Nine differential programs cover integer/text/tag receivers, method
composition, explicit invocation and late redefinition. Relocated caller
images use the receiving dictionary.

This is only the successful direct-lookup path. Missing methods currently
raise an explicit unsupported-resolution error; the historical fallback
to class verbs/thing, interpret, L9 metaclasses, inheritance, user-defined
objects and attribute/it-method protocols are not implemented here. JS
numeric classification uses Number.isInteger, not the historical packed
numeric type distinction. Do not interpret this as general L9 parity.

### First reuse of canonical L9 source (2026-11-27)

The OO layer is already in lib/l9.nox. Do not create a second OO library.
The experimental VM now executes the actual unmodified definitions
`method-text-name`, `method-name`, and `define-method`, extracted directly
from the canonical file in l9-source.test.js. The historical comparison
runs the full existing L9 bootstrap, not translated versions of these
verbs. The three definitions can themselves be captured as an image and
relocated to a new VM.

Minimal new dependencies: parenthesized prefix calls, comma separators,
parenthesized left-associative text concatenation, `&` for text/tag
operands, `parameters` using the same formal binder as
`run-with-parameters`, `attach` and `define-verb`. Runtime-created
blocks/definitions use captured Cells and normal threaded calls, not JS
closures. Runtime-literal instructions are explicitly outside the
existing portable definition-image format; capturing a method created
with define-verb is rejected rather than silently losing its captures.
The wrapper adds a VM call frame; optimize only if actual costs warrant.

Nine differential cases (including dynamic method registration and
replacement, block capture/reuse, and caller continuation) plus a
relocation test exercise this first shared-source path. The prefix/infix
grammar and parameter support are deliberately bounded; full L9
bootstrap, comments/dialects, class declaration syntax, object storage
and class fallback are not yet implemented. The historical parameters
primitive contains special-case behavior for L9 meta words; the
experiment implements the ordinary explicit formal binding needed by
define-method, not a copy of those historical parser workarounds.

### Reuse of L9 receiver methods and attributes (2026-11-27)

The same canonical-source test now also compiles and executes the existing
`it-method{` and `attribute` definitions directly from lib/l9.nox.
The generic adjacent `name/verb{ ... }` form supplies a tag and block
to a brace-named defining verb. Brace-named definitions are supported.
Postfix `:name` uses `rename`; `/!` supplies the suffix tag used by
the canonical attribute definition.

Native fixed objects are represented by a shared payload containing
the class name and an ordered array of member Cells. The historical
`make.object` length includes its class/length descriptor; fields are
consumed in stack order. `object.@` takes object then tag,
`object.?@` takes tag then object and returns void when absent, and
`object.!` takes value, object, tag and preserves the member name.
Object class is independent of the referencing Cell name; copying a
reference shares the payload, not the Cell container. Local creation
and update now name their stored Cells as the historical VM does
(FBF exposed by name-of on a local object reference).

Ten additional historical differential cases cover canonical receiver
binding, getter/setter generation, object aliases and independent
instances, field lookup and naming. A separate missing-field test
checks explicit failure and optional void. The five canonical L9
definitions can be relocated as a definition image. Runtime-created
objects and captured methods remain outside the current image format.
No changes to lib/l9.nox. Fixed-object member access is implemented,
not the entire object model: extensible objects, the common L9 maker
protocol, metaclasses, inheritance, and class fallback remain to port.


### Canonical L9 object construction and extensibility (2026-11-27)

The source test also extracts and compiles the unchanged `drop-with`,
`with-length`, `with-length{` and `make{` definitions in lib/l9.nox.
The native payload keeps its identity on extension; ordered member Cells
can grow, and aliases observe the changes. No second maker or class system.
The initial capacity of a native JS array is not a physical reservation.

Dependencies are generic brace calls, comma separators, standalone
`~~` line-comment handling for the scanned-token subset, `duplicate`,
`top`, `with?`, `data-index`, and `>control`/`control>`.
Saved Cells occupy the actual logical control stack, alongside return
frames; balanced transfers and dynamic locals coexist. `assert` and
the historical bootstrap alias `assert{` use a VM checker continuation,
not a nested JS interpreter. This experiment is always checked; it has
no fast-mode assertion switch. Comments containing arbitrary lexical
errors (e.g. unclosed quotes) are not yet supported by the raw scanners.

The historical differential cases exposed real defects in lib/inox.ts:
extension of an already extended object with padded forwarding storage,
confusion between fixed total length and extended member count, and
lookup bounds derived from the forwarding area. The correction preserves
the class, converts the count, and makes getter/setter share a bounded
payload lookup. Optional absence is valid even in fast mode; a lookup
must terminate in that case. The historical regression suite exercises
these invariants separately, including fast-mode absence. No changes to
L9 source. Nine canonical definitions are now reused and relocatable;
runtime-created captures and objects still require a richer image format.
Next: the L9 metaclass registry and fallback dispatch; do not duplicate
the inheritance mechanism in JavaScript.

### Canonical L9 registry and inherited method resolution (2026-11-27)

The experiment now executes eight more unchanged L9 definitions:
`map[]`, `classes.get`, `make.metaclass`, `resolve-method-name`,
`understand?`, `thing.understand?`, `thing`, and `map`.
The actual `global: classes/ is: map[] :classes;` declaration is
executed too. Metaclasses are ordinary Inox objects in an Inox map,
not a parallel host-side hierarchy. Direct lookup falls back to the
receiver's class verb or `thing`, passing the receiver, class and
method tags as in the reference. Inherited resolution, overrides and
reflection therefore execute the existing L9 code.

New kernel dependencies include native globals (getter and setter
over one captured Cell), map insertion/optional lookup over the
existing ordered member Cells, void/presence predicates, typed
equality, verb existence and definition lookup. The compiler supports
the subset of global declarations and parenthesized equality and
break-if used by these definitions. The cache-update/clear operations
consume and validate their operands but do not maintain a method
cache: lookup remains uncached. The historical cache can retain an
old inherited definition when the low-level define-method is invoked
without invalidation (observed 77 vs uncached 78); the differential
redefinition case explicitly clears the cache, as the normal L9
class-update path does. This is not full cache-primitive conformance,
nor a change to the historical runtime.

Ten inheritance/reflection programs and one global declaration case
compare against the full historical L9 bootstrap. The fixture uses
make.metaclass and explicit superclass-name assignment, not an
alternative class implementation. Two additional tests check image
relocation and observable missing-method failure. The 17 source
definitions are relocatable; the receiving VM initializes its own
registry before importing dependent definitions. Runtime global state
and captured methods are not serialized by the existing codec.
Remaining work: execute the actual class{ / extend-class{ /
update-classes protocol, then use the existing full object-core suite.
No changes to lib/l9.nox or historical runtime.

### Canonical class declarations and shared object-core suite (2026-11-27)

The actual L9 `class{`, `extend-class{`, `superclass`,
`class-method{`, `method{`, `getter`, `setter`, `update-classes`,
`update-class`, `update-all-classes` and `initialize-classes` now run
in both experimental readers. The 28 source definitions and a separately
initialized classes global are sufficient for the L9 class hierarchy;
no host-side replacement hierarchy. The source initializer itself is
executed, rather than manually registering a fixture's parent metadata.

FBF in the common historical source: `definitions` used the numeric
packed-memory address as a host array and returned an empty collection.
It now enumerates via get_definition, retaining named integer-address
Cells. The old L9 update-classes scan also confused these addresses with
method-name text, and stopped at the first nonmatching dictionary item.
The corrected common L9 implementation refreshes a registered class
directly, or iterates the existing registry once for "*", dropping
the temporary metaclass result and preserving the superclass through
make.metaclass. Cache invalidation remains explicit. This is a deliberate
repair of L9 source, not a parallel JavaScript implementation.

Kernel additions: single-component name/verb and @method syntax,
block.run, type-of, stack.fetch, definitions and logical control-depth.
Captured verb Cells in attach now execute, as they do in the historical
threaded engine; the earlier experimental quoting was incorrect.
The common tests import the historical object-core cases rather than
duplicate them. Five cases remain explicitly deferred: two stdlib
method registrations, fast! mode, absolute packed control depth,
and from: range syntax. Separate experimental tests verify equal
control depth before/after dispatch, 200 inherited invocations via
while:, and relocation of all 28 definitions before initialization.
No change to image encoding or production. The common source still
needs native C++ compilation verification.

### Dogfooding: unique field selection using native Inox objects (2026-11-27)

`browser-unique-field.nox` adds the distinct behavior `unique-field`:
return an eligible field's index only when exactly one exists; return
-1 when none exists and -2 when ambiguous. Stop at the second match.
It uses the existing sensitive-field predicate, local variables,
structured loops, and native `object.?@` rather than host property
access. ZeroBrowser's `field.object` projects only tag/type/disabled/
readonly/autocomplete metadata; missing properties are absent and
unsupported nonscalar metadata fails closed. No DOM handles or values
are exposed to this new behavior. The original projection and image
remain available unchanged.

The separate image imports sensitive-field? from the existing
browser-fields image. Reproducibility, missing/unique/ambiguous cases,
80-field bounds, and 100 deterministic mixed observations are tested.
No complete L9 initialization is needed by this short-lived script.
The Cogentia generic.unique-text@1 recipe is an explicit new choice,
not a change to the existing first-match recipes. The comparison
registry still treats JavaScript as its reference and rejects any
disagreement. No authorization or transport change.


### Consolidation by subsumption (2026-11-27)

The Principal directs us to remove superseded capabilities, not merely
accumulate more general ones. The three historical browser selectors
(first text, first by type, unique by type) are replaced by a single
`browser-select-field.nox`, one definition image and one shared test file.
`select-field` receives the requested input type and the explicitly
validated selection policy ("first" or "unique"). Both choices remain
available; there is no duplicate named implementation. The sensitive
predicate and native metadata projection are shared. ZeroBrowser no longer
exports raw `field` or the three legacy aliases `eq`, `lt`, `secret?`.
The earlier source/image filenames in this dated record refer to prior
Git revisions, not maintained alternatives. Historical source and images
remain recoverable from Git. Tests retain the earlier first-text cases,
image reproducibility, missing-import rejection, ambiguity and maximum
field count, and compare both policies against the same reference over
100 deterministic mixed observations. No VM core or L9 changes.
