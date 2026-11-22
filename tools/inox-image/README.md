---
title: "Inox Micro v0 — host image and executable-definition delta prototype"
author: "Jean Hugues Noël Robert, baron Mariani"
drafted_by: "GPT-6 coding agent, under Jean Hugues Noël Robert's direction (2026-11-22)"
date: "2026-11-22"
status: "experimental implementation — host-only, bounded subset"
version: "0.1"
license: "MIT (code) · CC BY-SA 4.0 (documentation)"
document_role: "operational"
document_kind: "implementation-guide"
visibility: "public"
lifecycle_state: "working"
update_policy: "UP-DEFAULT-REVIEWED"
provenance:
  origin_type: "repository"
  origin_repository: "JeanHuguesRobert/Inox"
  origin_ref: "research/inox-cpp-micro-runtime-and-images.md"
  origin_date: "2026-11-22"
  derived_from:
    - "research/inox-cpp-micro-runtime-and-images.md"
    - "research/inox-images-lineages-and-hibernation.md"
---

# Inox Micro v0 host image/delta prototype

**Purpose.** Exercise the shortest verified path from a structured definition to executable 8-byte `Cell` blocks, immutable content-addressed base images, base-bound delta image extensions, a cache plan, and an actual result from a deliberately limited **host-side reference interpreter**. No Inox source parser or Alan compiler is necessary for this fixture.

This implementation uses the existing `inox.image.v1` container contract: 128-byte header, 32-byte section descriptors, SHA-256 (header hash field zeroed), CRC-32 for each section, 4+28-bit `Cell.info`, 32-bit region/offset handles, primitive IDs from the documented Micro v0 profile, and a `DELTA_IMAGE` bound to its base by `base_sha256`.

## Run the complete fixture

From the Inox repository root:

```sh
npm run test:micro:host-image
mkdir -p /tmp/inox-image-demo/cache
node tools/inox-image/cli.mjs build --source tools/inox-image/examples/base.json --output /tmp/inox-image-demo/base.inoximg
node tools/inox-image/cli.mjs build --source tools/inox-image/examples/extension.json --base /tmp/inox-image-demo/base.inoximg --output /tmp/inox-image-demo/extension.inoximg
node tools/inox-image/cli.mjs cache-put --image /tmp/inox-image-demo/base.inoximg --cache /tmp/inox-image-demo/cache
node tools/inox-image/cli.mjs plan --image /tmp/inox-image-demo/extension.inoximg --cache /tmp/inox-image-demo/cache
node tools/inox-image/cli.mjs run --image /tmp/inox-image-demo/extension.inoximg --cache /tmp/inox-image-demo/cache
node tools/inox-image/cli.mjs cache-put --image /tmp/inox-image-demo/extension.inoximg --cache /tmp/inox-image-demo/cache
node tools/inox-image/cli.mjs plan --image /tmp/inox-image-demo/extension.inoximg --cache /tmp/inox-image-demo/cache
```

Expected result: `run` returns `42` from the extension's `answer` definition calling `add_two` in the cached base. Before adding the extension, `plan` lists **only the extension digest as missing**. After adding it, `plan` lists no missing artifacts; the base is never overwritten. `inspect` and `verify` can be used with `--image FILE` to validate files independently.

## Supported subset

- Declarative JSON source containing `definitions`, each with a name and sequential `instructions`: `{ "literal": int32 }`, `{ "primitive": "integer-add" }`, or `{ "call": "known-definition" }`.
- Host builder automatically appends `{ "primitive": "return" }` to each definition. Assembly sorts definitions deterministically by name, resolves calls to both the base and current extension, and encodes canonical `Cell` values.
- Base and one-level append-only immutable extension (no overriding existing definitions). Parent offsets remain stable in the shared logical region-1 address space; the extension's `IMMUTABLE_CELLS` section declares its append offset in `cell_offset`.
- The host-only reference executor supports integer literals, `VERB` calls, `integer-add`, `return`, `halt`, an instruction budget, and an isolated data/return stack. This does **not** claim equivalence with the full JavaScript Inox VM or a C++ target.
- Content-addressed local cache (`cache-put`) and read-only missing-artifact planning (`plan`). `bytesAddedToCache` measures local file addition, not a real network transfer. `currentArtifactBytesToSend` excludes any missing dependency; network delivery must be implemented separately.
- Rejection of mismatched or missing base, corrupted SHA-256/CRC-32, bad metadata/offsets/imports, invalid primitive IDs and unresolved symbols. No effectful primitives or host capabilities.

## What remains open

This is **a host reference fixture, not a complete interoperable `DELTA_IMAGE` ABI**. A production version still needs agreed linker/import and image composition semantics, broader primitive coverage, a loader in the C++ Micro runtime and ESP32 implementation, multiple dependency layers, relocation across execution profiles, persistence of mutable overlays, snapshots/continuations, real Fractanet transfers, and differential conformance with the original JavaScript VM. The latter currently differs from the proposed Micro v0 ABI on return/VOID and primitive dispatch, as already recorded in the Alan specification.

The base-vs-extension scenario makes a concrete, measurable starting point for fixing these gaps without claiming the whole language or actor runtime exists.
