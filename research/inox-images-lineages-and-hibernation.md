---
title: "Inox Images, Lineages, Hibernation, and Wake"
subtitle: "Semantic truth, native materializations, content-addressed state, and graceful reconstruction across Fractanet nodes"
description: "Source architecture note defining the Inox model-to-image-to-instance lifecycle, immutable semantic images, target-specific native materializations, snapshots, lineages, hibernation, wake, memory placement, and degraded reconstruction."
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-07-17"
version: "0.1-draft"
status: "source working paper — draft under human validation"
license: "CC BY-SA 4.0"
language: "en"
repository: "JeanHuguesRobert/Inox"
canonical_path: "Inox/research/inox-images-lineages-and-hibernation.md"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-images-lineages-and-hibernation.md"
document_role: "source"
document_kind: "architecture-contract"
visibility: "public"
lifecycle_state: "working"
source_or_derived: "source-document"
human_validation_required: true
related_documents:
  - "Inox/research/inox-spec.md"
  - "Inox/research/fractanet_language_abstractions.md"
  - "Inox/research/inox-cpp-micro-runtime-and-images.md"
  - "Inox/profiles/inox-micro-v0.json"
  - "cogentia/research/memory_and_corpus_sleep_cycle.md"
  - "FractaVolta/research/capability_regimes.md"
  - "FractaVolta/research/generalized_packet_networks.md"
  - "inseme/packages/cop-core/Invariants.md"
provenance:
  origin_type: "conversation"
  origin_repository: "unknown"
  origin_ref: "Conversation checkpoint on Inox images, Smalltalk images, cross-compilation, hibernation, content-addressed buckets, and degraded wake — 2026-07-16/17"
  origin_date: "2026-07-16"
  derived_from:
    - "Inox/research/inox-spec.md"
    - "Inox/research/fractanet_language_abstractions.md"
    - "Inox/research/inox-cpp-micro-runtime-and-images.md"
    - "cogentia/research/memory_and_corpus_sleep_cycle.md"
    - "FractaVolta/research/capability_regimes.md"
review:
  status: "unreviewed"
  reviewed_by: []
update_policy: "UP-DEFAULT-REVIEWED"
tags:
  - inox
  - image
  - lineage
  - hibernation
  - wake
  - snapshot
  - content-addressing
  - cross-compilation
  - fractanet
  - degraded-mode
---

# Inox Images, Lineages, Hibernation, and Wake

## Semantic truth, native materializations, content-addressed state, and graceful reconstruction across Fractanet nodes

*Source working paper — v0.1-draft — human validation required*

---

## 1. Purpose

Inox needs an image model that spans very different execution environments:

- a Linux development host;
- a browser or WebAssembly runtime;
- an ESP32-class microcontroller;
- a dormant object stored in a remote bucket;
- a Fractanet actor that is activated only when addressed;
- a recovered instance rebuilt after the fast path has failed.

The word *image* is already overloaded in computing. It may mean a Smalltalk
object memory, a VM snapshot, a native executable, a container filesystem, a
firmware binary, a serialized object graph, or a machine-learning artifact.
This document gives Inox a precise vocabulary and lifecycle so that those
meanings do not collapse into one another.

The central proposal is:

```text
model
  -> semantic image
  -> native materialization
  -> active instance
  -> trace + mutable state
  -> snapshot or delta
  -> hibernated artifact
  -> wake / reconstruction
  -> new active instance
  -> lineage
```

The semantic image is the portable source of executable meaning. Native images
are replaceable target artifacts. Instances are temporary activations. Traces
and lineage preserve what happened across activations.

This document is an architecture contract, not a claim that all mechanisms are
implemented today.

---

## 2. Design thesis

### 2.1 Bring process to data

One of the founding Inox intuitions is to move a small process close to the
data, device, or capability it manipulates. This is especially useful when:

- round trips are too slow;
- a sequence must be temporally atomic;
- connectivity is intermittent;
- the data should not leave its local boundary;
- a low-power node must keep operating after its host disappears;
- a capability must be exercised under local safety constraints.

An Inox image is therefore not only an application package. It can be a small,
bounded unit of executable structure placed next to the relevant state.

### 2.2 Freeze what does not need RAM

A bootstrap does not need to occupy mutable memory merely because it is
executable. Immutable code, constants, symbol tables, and validated base graphs
may remain in flash, ROM, a memory-mapped file, or another read-only region.

RAM should primarily contain what becomes mutable after activation:

- stacks;
- mailboxes and bounded queues;
- overlays;
- scratch space;
- device state;
- active continuations;
- changed objects.

This is normal microcontroller memory placement, generalized into the Inox
image model.

### 2.3 Resilience may cost time rather than correctness

The architecture seeks both efficient hot paths and resilient cold paths.
There is no claim that resilience is free.

```text
hot local materialization available
  -> fast activation

hot materialization missing
  -> fetch immutable base
  -> verify content
  -> fetch or rebuild target materialization
  -> restore mutable overlay
  -> slower activation
```

The compact rule is:

> In degraded mode, the system may pay with time. It must not pay by relaxing
> identity, integrity, authority, or traceability.

In French, the intuition can be stated as:

> On peut avoir le beurre et l'argent du beurre en mode dégradé : cela prend
> simplement plus de temps.

---

## 3. Scope

This document defines:

- the distinction between model, semantic image, native materialization,
  instance, snapshot, artifact, and lineage;
- immutable and mutable image regions;
- content identity and logical identity;
- composition and derivation;
- hibernation and wake;
- target profiles and cross-compilation;
- degraded reconstruction;
- minimum trace and security invariants;
- the relationship to Inox Micro and Fractanet activation.

It does not yet define:

- the complete binary encoding of every future image version;
- a final distributed garbage collector;
- a universal trust or signature infrastructure;
- commercial SLA pricing;
- a specific cloud bucket provider;
- live migration with zero pause;
- compatibility with arbitrary Smalltalk or Docker images.

Those mechanisms may be derived later without weakening the invariants below.

---

## 4. Vocabulary

### 4.1 Model

A **model** is the editable semantic source from which executable structure is
derived. It may include Inox source, declarations, schemas, tests, capabilities,
or other governed inputs.

A model is not required to be directly executable.

### 4.2 Semantic image

A **semantic image** is a canonical, portable representation of executable Inox
meaning. It contains logical objects, code, names, imports, immutable data, and
declared requirements without embedding process-local native pointers.

The semantic image is the portable source of truth for execution.

### 4.3 Native materialization

A **native materialization** is a target-specific artifact derived from a
semantic image for a declared execution profile.

Examples:

- an ESP32 flash image;
- a C++ compiled object;
- a WebAssembly module;
- a Linux memory-mapped layout;
- a predecoded dispatch table;
- a cached machine-code tier.

It is a cache or deployment artifact, not the semantic authority.

### 4.4 Instance

An **instance** is an activation of a semantic image, usually through one native
materialization, with a particular mutable state, capability set, execution
budget, and trace context.

An instance has a lifecycle. It is not identical to the immutable image from
which it was activated.

### 4.5 Overlay

A **mutable overlay** contains state that differs from the immutable base. It may
be held in RAM while active and serialized as a snapshot or delta when dormant.

### 4.6 Snapshot

A **snapshot** is a bounded serialization of mutable instance state. It is
explicitly bound to the semantic base and relevant ABI/profile identifiers.

A snapshot is not a free-standing semantic image unless it has been deliberately
promoted through a governed derivation step.

### 4.7 Delta

A **delta** is a content-addressed description of change relative to one or more
declared bases. A snapshot may use deltas internally, but the two terms are not
synonyms: snapshot names lifecycle intent; delta names representation.

### 4.8 Artifact

An **artifact** is any immutable stored object with an address, media type,
digest, size, provenance, and declared role. Semantic images, native
materializations, snapshots, manifests, and trace segments may all be artifacts.

### 4.9 Bucket

A **bucket** is a capability-addressed storage boundary. It may be implemented
by a local directory, object store, database, removable medium, peer, archive,
or future Fractanet storage service.

The image model MUST NOT depend on one vendor's bucket API.

### 4.10 Lineage

A **lineage** is the append-only graph of derivations and activations linking
models, semantic images, native materializations, instances, snapshots, and
promotions.

Lineage answers:

- What was this derived from?
- Under which toolchain and profile?
- Which immutable base was activated?
- Which mutable state was restored?
- Which capabilities were granted?
- What trace records the activation?
- Which later artifact supersedes or descends from it?

---

## 5. Core ontology

The minimum ontology is:

```text
Model
  compiles-to -> SemanticImage

SemanticImage
  materializes-as -> NativeImage(profile)
  activates-as    -> Instance
  derives-to      -> SemanticImage

NativeImage
  realizes        -> SemanticImage
  activates       -> Instance

Instance
  based-on        -> SemanticImage
  uses            -> NativeImage(profile)
  emits           -> Trace
  hibernates-as   -> Snapshot

Snapshot
  restores        -> Instance
  requires-base   -> SemanticImage

Artifact
  stored-in       -> Bucket
  addressed-by    -> Digest

Lineage
  links all governed derivations and activations
```

The graph is a DAG for immutable derivations. Active instances and events add a
temporal trace without mutating prior nodes.

---

## 6. Normative invariants

### I-01 — Semantic authority

The semantic image MUST remain the portable authority for executable meaning.
A native materialization MUST declare which semantic image and profile it
realizes.

### I-02 — Immutable content identity

An artifact identified by a cryptographic content digest MUST be immutable.
Changing one byte creates a different artifact identity.

### I-03 — No serialized native pointers

Portable semantic images, snapshots, and deltas MUST NOT contain native process
pointers. They MUST use logical handles, region-relative offsets, stable IDs, or
another declared portable reference form.

### I-04 — Explicit base binding

Every snapshot or delta MUST identify the exact base image or parent artifacts
required to interpret it. Restore against an incompatible base MUST fail.

### I-05 — Explicit target profile

A native materialization MUST identify its target profile, including the
relevant ABI, cell layout, endianness, feature set, and toolchain identity.

### I-06 — Derivation is traceable

Compilation, materialization, promotion, hibernation, restoration, and lineage
merge MUST leave inspectable derivation or lifecycle records.

### I-07 — Reconstruction before relaxation

When a hot artifact is unavailable, the system MAY fetch or rebuild it and MAY
take longer. It MUST NOT silently disable hash verification, widen capabilities,
accept incompatible state, or erase provenance to meet a latency objective.

### I-08 — Authority is not stored ambiently

An image may declare capability requirements. An instance receives capabilities
from an activation mandate. A dormant snapshot MUST NOT turn stale ambient
authority into permanent authority.

### I-09 — Wake is a new governed activation

Restoring state does not resurrect the old process identity blindly. Wake MUST
create a new activation record and re-evaluate current capability, policy,
profile, and regime constraints.

### I-10 — Native artifacts are disposable

Deleting a native materialization MUST NOT destroy semantic truth when the
semantic image and required derivation inputs remain available.

### I-11 — Promotion is explicit

Mutable state MUST NOT become a new semantic base merely because it was
snapshotted. Promotion requires an explicit operation with provenance, checks,
and a new content identity.

### I-12 — Missing trace is degraded observability

Absence of a trace MUST NOT be interpreted as proof of success or innocence.
It is an observable loss of assurance and may make activation inadmissible in a
critical regime.

---

## 7. Semantic images and Smalltalk images

Smalltalk demonstrated that an object world can be persisted as an image and
resumed later. Inox retains the productive part of that intuition:

- executable structure and state can be captured;
- activation can continue from a previously meaningful world;
- development and runtime may share one semantic object model.

Inox adds stronger separations for heterogeneous and constrained nodes:

- immutable semantic base versus mutable instance overlay;
- portable logical handles versus native addresses;
- semantic image versus target-specific materialization;
- capability requirements versus activation authority;
- content identity versus friendly logical name;
- snapshot restoration versus governed wake;
- image state versus external consequence trace.

The goal is not to serialize an entire host process indiscriminately. The goal
is to persist the smallest sufficient executable world with explicit boundaries.

---

## 8. Relationship to Docker and OCI images

An Inox image library may superficially resemble a container registry:

- immutable digests;
- reusable layers;
- manifests;
- target variants;
- remote distribution;
- local caches;
- garbage collection.

The analogy is useful but limited.

| Container image | Inox image model |
|---|---|
| Filesystem and process environment | Semantic executable object graph |
| Usually OS/process granularity | Potentially function, actor, dialect, or micro-node granularity |
| Platform manifest selects binary layers | Profile selects semantic-compatible native materialization |
| Runtime process state is separate | Mutable overlay and snapshot are first-class but distinct |
| Layer order is mostly filesystem overlay | Composition follows typed semantic dependencies |
| Container identity does not define actor lineage | Activation and derivation lineage are explicit |
| Capability policy is largely external | Capability requirements are declared and re-evaluated at wake |

The intended result is finer-grained and more recomposable than Docker, while
remaining more disciplined than arbitrary object serialization.

---

## 9. Content addressing and logical naming

Two identities are needed.

### 9.1 Content identity

The content identity is derived from canonical bytes:

```text
sha256:<digest>
```

It answers: *Which exact artifact is this?*

### 9.2 Logical identity

A logical name is a mutable or versioned reference such as:

```text
inox://actors/house/voice-router
inox://profiles/micro-v0
inox://images/voice-router/stable
```

It answers: *Which role or selected version is intended?*

A logical name MUST resolve to a content identity under an inspectable policy.
It MUST NOT replace the digest inside a snapshot or provenance record.

### 9.3 Canonical bytes

Content addressing is meaningful only if canonicalization is explicit.

The canonical form MUST define:

- byte order;
- field order;
- integer encoding;
- string normalization;
- reserved bytes;
- section alignment;
- dependency ordering;
- treatment of timestamps and non-semantic metadata.

Non-deterministic build metadata belongs in a trace or envelope, not in the
content-addressed semantic core.

---

## 10. Composition and recomposition

An image may depend on other semantic images or declared imports.

Composition MUST be explicit. A composition manifest should state:

- root semantic image;
- dependency digests;
- import names and required ABI/features;
- conflict policy;
- capability requirements;
- target profile constraints;
- deterministic ordering;
- optional components and fallbacks.

### 10.1 Structural sharing

Two images SHOULD share identical immutable artifacts by content identity rather
than copying them. Sharing reduces storage and transfer without creating shared
mutable state.

### 10.2 Recomposition

Recomposition creates a new manifest or semantic image from existing immutable
parts. It does not mutate those parts.

Examples:

- the same voice-routing logic with a DECT adapter or fake adapter;
- the same actor logic materialized for Linux and ESP32;
- the same immutable base with territory-specific policy data;
- a reduced micro profile containing only reachable primitives.

### 10.3 Reachability reduction

A materializer MAY omit unreachable code or data for a constrained target, but
the reduction algorithm, roots, profile, and resulting digest MUST be recorded.

---

## 11. Native materialization and cross-compilation

Cross-compilation is treated as a governed derivation:

```text
semantic image digest
+ target profile digest
+ materializer/toolchain identity
+ declared build inputs
-> native materialization digest
```

The materialization record MUST include enough information to determine:

- which semantic image was used;
- which target profile was selected;
- which toolchain produced the artifact;
- which features were enabled or removed;
- whether the result is reproducible;
- which tests or conformance vectors were run.

Native equivalence is semantic, not byte-level across targets. A Linux and an
ESP32 materialization need not share machine bytes. They MUST preserve the same
declared profile semantics and pass the same applicable conformance vectors.

---

## 12. Memory placement

An activation profile maps logical image regions to physical storage classes.

| Logical region | Typical Linux placement | Typical ESP32 placement |
|---|---|---|
| Immutable code | mmap/read-only pages | flash/XIP |
| Immutable constants | mmap/read-only pages | flash/rodata |
| Symbol/name table | mapped file or cache | flash, optionally compressed |
| Mutable overlay | heap or mapped writable pages | internal SRAM or PSRAM |
| Data/return stacks | bounded heap | internal SRAM |
| Scratch | bounded arena | internal SRAM |
| Snapshot staging | file/object stream | flash partition, host stream, or PSRAM |
| Trace buffer | local queue | bounded ring buffer |

The profile MUST declare which regions are mutable and which survive reset.

The immutable base SHOULD NOT be copied wholesale into RAM when the target can
map or read it safely from non-volatile storage.

---

## 13. Instance lifecycle

The minimum lifecycle is:

```text
ABSENT
  -> RESOLVING
  -> VERIFYING
  -> MATERIALIZING (optional)
  -> ACTIVATING
  -> RUNNING
  -> QUIESCING
  -> HIBERNATING
  -> DORMANT
  -> WAKING
  -> RUNNING
  -> TERMINATED
```

Failure states are explicit:

```text
REJECTED_INTEGRITY
REJECTED_PROFILE
REJECTED_AUTHORITY
REJECTED_BASE_MISMATCH
DEGRADED_WAITING_FOR_ARTIFACT
DEGRADED_REBUILDING
FAILED_RESOURCE_LIMIT
FAILED_EXTERNAL_DEPENDENCY
```

A state transition SHOULD be idempotent or carry an operation identity so that
retry does not duplicate consequences.

---

## 14. Hibernation

Hibernation transforms a quiescent active instance into durable, bounded state.

### 14.1 Preconditions

Before hibernation, the runtime MUST:

1. stop or bound new input;
2. reach an explicit safe point;
3. identify external operations that remain in flight;
4. flush or record required trace segments;
5. validate serializable handles;
6. exclude native pointers and ephemeral transport handles;
7. bind the snapshot to its semantic base and profile;
8. compute and verify the snapshot digest;
9. record the storage result before declaring the instance dormant.

### 14.2 External resources

Files, sockets, USB endpoints, radios, locks, credentials, and device sessions
cannot be assumed to survive hibernation.

They MUST be represented by one of:

- a rebindable logical capability reference;
- a resumable protocol token with explicit expiry;
- a compensating action record;
- an unresolved external dependency that blocks wake;
- a declared non-hibernatable resource that blocks hibernation.

### 14.3 Snapshot minimality

A snapshot SHOULD contain mutable state only. Immutable base objects SHOULD be
referenced by content identity.

### 14.4 Completion rule

Hibernation is complete only when:

- the artifact is durably stored according to the requested assurance class;
- its digest is known;
- the lineage event is recorded;
- the active instance can be terminated without losing committed state.

---

## 15. Buckets and storage classes

A bucket reference should be logical and capability-bound:

```yaml
bucket_ref: fractanet://storage/cold-corsica-1
artifact: sha256:...
media_type: application/vnd.inox.snapshot.v1
size: 48312
assurance:
  replicas: 2
  durability_class: cold-reviewed
  encryption: required
  jurisdiction: FR
```

Storage classes may include:

| Class | Purpose | Expected wake behavior |
|---|---|---|
| Hot | local, immediately addressable | low latency |
| Warm | indexed nearby cache | short fetch |
| Cold | durable remote/object storage | slower fetch |
| Frozen | archival or legal preservation | manual or expensive recovery |
| Rebuildable | native cache only | regenerate from semantic inputs |

The class affects expected time and cost, not semantic identity.

---

## 16. Wake and restoration

Wake is a new activation using prior mutable state.

### 16.1 Required algorithm

The runtime or orchestrator MUST:

1. resolve the requested logical instance or snapshot to exact digests;
2. fetch the snapshot manifest;
3. verify its digest and structural bounds;
4. resolve and verify the semantic base;
5. reject a base-hash or ABI mismatch;
6. select or build a compatible native materialization;
7. obtain a fresh activation mandate and capabilities;
8. allocate bounded mutable regions;
9. restore logical handles and state;
10. rebind eligible external capabilities explicitly;
11. run restore invariants before external effects are enabled;
12. emit a new activation/lineage event;
13. enter RUNNING only after all required checks pass.

### 16.2 Partial wake

A future runtime MAY support lazy or partial restoration. If so:

- unresolved pages or objects remain immutable until materialized;
- faults are bounded and traceable;
- capability checks occur before fetching protected state;
- a missing cold object produces a deterministic wait/failure state;
- partial availability MUST NOT appear as complete restoration.

### 16.3 Wake on another target

Cross-target wake is allowed when:

- semantic cell/handle formats are compatible or migratable;
- the target profile implements required primitives;
- snapshot state excludes target-native pointers;
- required external capabilities can be rebound;
- a declared migration transforms profile-specific mutable state.

The semantic image and mutable state may travel. The native materialization is
normally rebuilt or selected for the destination target.

---

## 17. Degraded reconstruction

The wake path SHOULD expose its current assurance and delay cause.

| Regime | Available state | Action |
|---|---|---|
| Ordinary | local verified native image + local snapshot | activate immediately |
| Perturbed | local semantic base, native cache missing | rebuild locally |
| Degraded | remote base or snapshot required | fetch, verify, then activate |
| Critical | preferred sources unavailable | use authorized replicas and stronger trace |
| Vital | only minimal profile can run | activate explicitly reduced capability set |
| Recovery | normal sources return | reconcile, verify, cool temporary replicas |

The system MUST report the regime. It MUST NOT pretend that a reduced profile is
the full one.

### 17.1 Time as resilience budget

Recovery time is an explicit resource. An orchestrator may trade:

- money for faster retrieval;
- energy for local rebuild;
- bandwidth for prefetch;
- storage for hot replicas;
- reduced functionality for faster minimal wake.

It may not trade away integrity checks or invent authority.

### 17.2 SLA boundary

This image model exposes measurable activation stages and timestamps. Pricing,
reservation, insurance, and penalties belong to the FractaVolta assured-capacity
doctrine, not to the image format itself.

---

## 18. Lineage graph

### 18.1 Required edge verbs

Initial lineage verbs are:

```text
compiles-to
materializes-as
composes-with
derives-from
activates-as
hibernates-as
restores-from
promotes-to
migrates-to
supersedes
invalidates
```

### 18.2 Lineage record

A minimal lineage record should contain:

```yaml
lineage_event_id: urn:uuid:...
verb: materializes-as
subject: sha256:<semantic-image>
object: sha256:<native-image>
profile: sha256:<target-profile>
toolchain: sha256:<toolchain-manifest>
principal: <stable identity or unknown>
mandate: <traceable reference>
time: <timestamp or unknown>
checks:
  - conformance:micro-v0/cell.pack
trace: <COP event or repository trace>
review_status: unreviewed
```

Unknown values MUST be recorded as unknown, not inferred.

### 18.3 Forks and merges

A lineage may fork. Two mutable histories may not be merged by pretending that
one overwrote the other.

A merge MUST declare:

- both parents;
- the merge policy;
- conflicts and resolutions;
- the responsible principal or mandate;
- the resulting new artifact identity.

---

## 19. Promotion of state into a new image

Some mutable discoveries should become reusable semantic structure. This is a
promotion, not ordinary hibernation.

```text
instance state
  -> selected candidate structure
  -> normalization
  -> tests and validation
  -> human or governed acceptance
  -> new semantic image
  -> new lineage edge: promotes-to
```

This mirrors the corpus rule:

```text
raw trace != active memory
conversation != source document
snapshot != semantic image
```

Promotion preserves the raw parent snapshot or trace by reference where policy
requires it.

---

## 20. Security and anti-capture

### 20.1 Integrity

- Verify every externally supplied length before allocation.
- Verify digests before activation.
- Reject incompatible base/profile combinations.
- Keep mutable and immutable regions distinct by construction.
- Treat decompression and delta application as untrusted parsing.

### 20.2 Authority

- Images declare requirements; mandates grant authority.
- Wake re-evaluates authority.
- Dormant credentials expire normally.
- External capability rebinding is explicit and traceable.
- A snapshot copied to another node does not carry ownership of that node.

### 20.3 Confidentiality

Content addressing does not imply public readability. A snapshot may reveal
private state even when encrypted storage hides its bytes.

Storage policy should support:

- encryption at rest;
- capability-scoped retrieval;
- digest visibility distinct from content visibility;
- retention and lawful deletion policy;
- private lineage details with public proof anchors when appropriate.

### 20.4 Availability

No single registry or bucket should become semantic authority. Important bases
may be replicated across independent stores. Logical-name resolution should be
portable and inspectable.

### 20.5 Anti-rollback

Content validity is not freshness. An old valid snapshot may be unsafe.

Activation policy SHOULD support:

- minimum accepted lineage generation;
- revocation or invalidation events;
- monotonic actor sequence where required;
- explicit choice to restore an older state;
- stronger rules in critical regimes.

---

## 21. Minimal manifests

### 21.1 Semantic image manifest

```yaml
kind: inox.semantic-image.v1
digest: sha256:...
format_version: 1
abi_profile: inox-semantic-v1
roots: []
dependencies: []
primitive_imports: []
capability_requirements: []
regions:
  - kind: immutable-code
  - kind: immutable-data
  - kind: names
```

### 21.2 Native materialization manifest

```yaml
kind: inox.native-image.v1
digest: sha256:...
semantic_base: sha256:...
target_profile: sha256:...
toolchain: sha256:...
features: []
conformance_results: []
```

### 21.3 Snapshot manifest

```yaml
kind: inox.snapshot.v1
digest: sha256:...
semantic_base: sha256:...
snapshot_profile: inox-mutable-v1
parent_snapshot: sha256:... | null
mutable_regions: []
external_rebind_requirements: []
last_trace_event: urn:...
```

These examples are conceptual. The Inox Micro binary contract remains the
normative source for `inox-micro-v0` wire and section identifiers.

---

## 22. Inox Micro mapping

The Inox Micro contract instantiates this general model:

| General concept | Inox Micro v0 realization |
|---|---|
| Semantic image | canonical `.inoximg` content and declared semantics |
| Native materialization | ESP32 flash layout or Linux C++ target artifact |
| Immutable base | flash/mapped immutable regions |
| Mutable overlay | RAM regions, stacks, queues, handles |
| Snapshot | image-container snapshot bound to base hash |
| Wake | verify base, restore mutable regions, resume under new activation |
| Logical handle | region + cell-offset handle, never native pointer |
| Degraded path | reload/rebuild/retry without relaxing checks |

The Micro implementation should remain small. It need not implement the full
distributed lineage service to emit records that a host can later consolidate.

---

## 23. Example: Linux to ESP32

```text
Inox source/model on Linux
  -> deterministic semantic micro image
  -> content digest
  -> ESP32 materialization/profile check
  -> immutable base written or mapped in flash
  -> mutable overlay allocated in RAM
  -> bounded execution
  -> snapshot streamed to host bucket
  -> ESP32 powers down
  -> later wake verifies base + snapshot
  -> execution resumes with fresh device capabilities
```

If the ESP32 native cache is absent, Linux may rebuild it. If Linux is absent,
the node may start a minimal already-verified profile. Both outcomes must be
visible in the activation trace.

---

## 24. Example: virtual actor activation

```text
packet targets actor logical identity
  -> router resolves latest admissible snapshot
  -> semantic base found locally or remotely
  -> native profile selected
  -> actor wakes
  -> packet processed under budget
  -> effects traced
  -> actor remains hot or hibernates
```

The packet targets a stable actor identity, not a fragile process address.

---

## 25. Observability

An activation should expose at least:

- requested logical identity;
- resolved semantic digest;
- snapshot digest, if any;
- selected native materialization and target profile;
- source bucket/cache class;
- verification results;
- time spent resolving, fetching, rebuilding, restoring, and rebinding;
- capability grant reference;
- operating regime;
- reduced-functionality declarations;
- terminal result or failure reason.

This makes the cost of resilience measurable and enables future SLA contracts
without embedding commercial terms in the runtime.

---

## 26. Garbage collection and retention

Content-addressed storage accumulates artifacts. Collection must preserve
lineage and policy.

An artifact is collectible only when:

- no protected logical name resolves to it;
- no retained snapshot requires it as a base or parent;
- no retention policy requires it;
- no legal hold or dispute references it;
- required proof has been preserved elsewhere;
- the collection decision itself is traceable.

Native materializations may normally be collected more aggressively than
semantic images and governed snapshots because they are rebuildable caches.

Deletion from one bucket does not erase the existence of another replica or the
historical lineage record.

---

## 27. Implementation sequence

### L0 — Vocabulary and manifest fixtures

- accept this document for experiment;
- create JSON/YAML fixtures for the three manifest kinds;
- add validation and negative tests;
- keep them independent from storage vendors.

### L1 — Local artifact store

- content-addressed directory store;
- atomic put/get/verify;
- logical-name resolver with history;
- local lineage append log;
- deterministic garbage-collection dry run.

### L2 — Inox Micro integration

- connect `.inoximg` and snapshot formats to the general manifests;
- emit activation and hibernation records through the host link;
- demonstrate base-in-flash and overlay-in-RAM;
- restore after reboot.

### L3 — Cross-target materialization

- Linux and ESP32 materializations from one semantic base;
- applicable conformance vectors on both;
- cross-target snapshot migration for a deliberately small fixture;
- reject an incompatible profile deterministically.

### L4 — Bucket abstraction

- local and remote bucket adapters;
- capability-scoped retrieval;
- hot/warm/cold policies;
- interrupted upload/download recovery;
- replica verification.

### L5 — Fractanet activation

- logical actor targeting;
- on-demand wake;
- regime-aware routing;
- measured degraded reconstruction;
- hibernate-on-idle policy;
- lineage query and replay.

Each level must remain independently reviewable.

---

## 28. Conformance categories

Future conformance suites should cover:

- canonical semantic digest;
- native manifest/base linkage;
- snapshot/base mismatch;
- pointer-free portable state;
- deterministic materialization inputs;
- immutable artifact behavior;
- interrupted hibernation;
- duplicate hibernation retry;
- wake with expired capability;
- wake with missing native cache;
- wake with missing cold base;
- cross-target compatible restore;
- cross-target incompatible restore;
- rollback policy;
- lineage fork and merge;
- garbage-collection reachability;
- reduced-profile disclosure.

---

## 29. Decisions proposed for experiment

| ID | Decision | Status |
|---|---|---|
| IMG-001 | Semantic images are portable authority; native images are replaceable materializations | proposed |
| IMG-002 | Immutable artifacts are identified by canonical content digest | proposed |
| IMG-003 | Instances use immutable base plus mutable overlay | proposed |
| IMG-004 | Snapshots bind explicitly to semantic base and profile | proposed |
| IMG-005 | Wake is a new governed activation, not blind process resurrection | proposed |
| IMG-006 | Logical handles replace native pointers in portable state | proposed |
| IMG-007 | Lineage is an append-only derivation/activation graph | proposed |
| IMG-008 | Native materializations are disposable caches | proposed |
| IMG-009 | Degraded reconstruction may increase time but not relax integrity or authority | proposed |
| IMG-010 | Promotion from mutable state to semantic image is explicit and reviewed | proposed |

Human acceptance moves these to `accepted-for-experiment`, not to final language
standard status.

---

## 30. Open questions

- Which canonical semantic encoding follows Inox Micro v0?
- Does the long-term digest remain SHA-256 or become algorithm-agile?
- Which lineage subset must a disconnected micro-node retain locally?
- How are encrypted artifacts deduplicated without leaking sensitive equality?
- Which mutable objects may be restored lazily?
- How are external capabilities rebound across jurisdictions or owners?
- What constitutes a safe point for every Inox dialect?
- Which promotion operations require direct human validation?
- How are conflicting offline actor histories reconciled?
- Which artifact classes may be forgotten under policy while preserving proof?

These questions do not block local content-addressed fixtures or the Inox Micro
base-plus-overlay experiment.

---

## 31. Definition of success

The architecture is demonstrated when the following scenario is reproducible:

```text
one semantic Inox image
  -> deterministic content identity
  -> native Linux materialization
  -> native ESP32 materialization
  -> activation with immutable base outside mutable RAM
  -> state change under bounded capabilities
  -> content-addressed snapshot in a bucket
  -> shutdown
  -> loss of the hot native cache
  -> verified rebuild or refetch
  -> restore against the exact base
  -> fresh governed activation
  -> preserved lineage and trace
```

The important result is not merely persistence. It is the preservation of
meaning, identity, authority, and inspectability while executable structure
moves between memory classes, machines, and time.

---

## 32. Compact doctrine

```text
The model explains.
The semantic image preserves meaning.
The native image accelerates a target.
The instance acts.
The trace records consequences.
The snapshot preserves mutable state.
The bucket lets it sleep.
The wake re-evaluates authority.
The lineage preserves continuity.

When the fast path disappears, rebuild slowly.
Never counterfeit speed by weakening integrity.
```
