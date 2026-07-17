---
title: "Inox Micro C++ Runtime and Images — Implementation Contract"
subtitle: "Normative v0 specification for a portable Linux/ESP32 runtime, immutable images, mutable overlays, snapshots, and USB control"
author: "Jean Hugues Noël Robert, baron Mariani"
drafted_by: "OpenAI Codex (GPT-5)"
principal: "Jean Hugues Noël Robert"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
date: "2026-07-16"
status: "draft-for-human-review"
version: "0.1.0-draft"
license: "MIT (code examples) · CC BY-SA 4.0 (text)"
language: "en"
repository: "JeanHuguesRobert/Inox"
canonical_path: "Inox/research/inox-cpp-micro-runtime-and-images.md"
canonical_url: "https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-cpp-micro-runtime-and-images.md"
document_role: "source"
document_kind: "implementation-contract"
visibility: "public"
lifecycle_state: "working"
source_or_derived: "source-document"
update_policy: "UP-DECISION-REVIEW"
human_validation_required: true
provenance:
  origin_type: "conversation-and-repository-audit"
  origin_repository: "JeanHuguesRobert/Inox"
  origin_ref: "master@4177159e2096df1512b8001c09ba90e1d563c30c"
  origin_date: "2026-07-16"
  derived_from:
    - "Inox/AGENTS.md"
    - "Inox/README.md"
    - "Inox/lib/inox.ts"
    - "Inox/research/inox-spec.md"
    - "Inox/research/two-versions-scripting-vs-system.md"
    - "Inox issue #5"
    - "conversation checkpoints R34-R36"
review:
  status: "unreviewed"
  reviewed_by: []
related_documents:
  - "Inox/research/inox-spec.md"
  - "Inox/research/two-versions-scripting-vs-system.md"
  - "Inox/research/fractanet_language_abstractions.md"
  - "Inox/profiles/inox-micro-v0.json"
  - "Inox/test/conformance/micro/README.md"
  - "https://github.com/JeanHuguesRobert/Inox/issues/5"
tags:
  - inox
  - cpp
  - esp32
  - microcontroller
  - runtime
  - image
  - snapshot
  - content-addressing
  - usb
  - fractanet
---

# Inox Micro C++ Runtime and Images

## 0. Status and reading contract

This document is a **normative implementation contract in draft state**. It is
written so that a coding agent with limited reasoning ability can implement one
bounded milestone without reconstructing the architecture from conversation
history.

Until human review changes the frontmatter status, every decision in this
document is a proposal. Once accepted and merged, the keywords **MUST**,
**MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** have their usual normative
meaning.

A coding agent working from this contract MUST:

1. read `Inox/AGENTS.md` and the shared `cogentia/AGENTS.md` first;
2. read this entire document;
3. read `profiles/inox-micro-v0.json`;
4. implement exactly one declared milestone at a time;
5. run the tests declared for that milestone;
6. stop and report any contradiction instead of inventing a resolution;
7. avoid changing Inox language semantics unless a separate, human-approved
   semantic decision explicitly authorizes it.

This document is not a tutorial, a conversation transcript, or a promise of
future functionality. It is the contract for a concrete experiment.

---

## 1. Purpose

The project shall produce a small C/C++ Inox runtime that:

- builds and runs natively on Linux;
- builds for ESP32-S3 using ESP-IDF;
- executes a precompiled, content-addressed Inox image;
- maps immutable bootstrap data directly from flash;
- keeps mutable execution state in RAM;
- can save and restore only the mutable state;
- can be controlled over a transport such as USB;
- can later drive a DECT gateway or another hardware adapter without embedding
  device-specific policy in the VM core.

The experiment validates four architectural claims:

1. Inox semantics can exist independently from Node.js and the JavaScript host.
2. The immutable bootstrap need not consume mutable RAM.
3. An executable image can be composed from a stable base plus mutable overlays.
4. Linux can delegate latency-sensitive operations to a nearby microcontroller
   through a small, generic packet protocol.

---

## 2. Scope

### 2.1 Required in profile `inox-micro-v0`

The first profile includes:

- the 64-bit Inox cell representation;
- named values;
- separate data and control stacks;
- primitive dispatch;
- compiled verb dispatch;
- integer, Boolean, tag, verb, primitive, reference, and invalid cell types;
- immutable image validation and mounting;
- mutable RAM initialization;
- a bounded RAM allocator where needed by the runtime;
- deterministic error reporting;
- Linux/POSIX and ESP32 platform adapters;
- snapshot and restore of mutable runtime state;
- USB-compatible packet framing;
- native conformance tests shared across targets.

### 2.2 Explicitly excluded from profile `inox-micro-v0`

The following are **not** part of the first implementation:

- the Node.js bridge and all `js.*` primitives;
- JavaScript objects, `Map`, `Array`, promises, or Node APIs;
- L9 classes and metaclasses;
- actors, tasks, reactive sets, COP, and distributed scheduling;
- source parsing on the ESP32;
- a REPL on the ESP32;
- garbage collection beyond the bounded allocator/refcount mechanisms explicitly
  required by a later milestone;
- floating-point primitives;
- networking, TLS, authentication, or remote firmware update;
- audio encoding or DECT radio protocol implementation;
- dynamic loading of native code;
- image signatures in format version 1;
- compatibility with big-endian processors.

The host builds images. The microcontroller executes images. This separation is
deliberate and is the principal RAM-saving mechanism.

### 2.3 Non-goal: compiling all of current `lib/inox.ts`

The first milestone MUST NOT attempt to make every current TypeScript feature
compile as C++. Current host-only additions are intentionally outside the micro
profile. Conformance is defined by the accepted profile and its tests, not by
the number of translated lines.

---

## 3. Evidence from the existing implementation

The existing repository already contains useful implementation evidence:

- `lib/inox.ts` contains the historical C++ generation markers and
  `build_targets()`;
- the historical runtime used an initial 64 KiB heap;
- `LeanString` avoids `std::string` in the runtime;
- memory areas use explicit allocation metadata and reference counts;
- generated Doxygen material preserves a historical approximately 20 KLOC C++
  source;
- the present TypeScript file remains the semantic reference, but now contains
  host-only code that cannot be translated mechanically.

The repository audit also found two concrete drifts:

1. the comment-based C++/TypeScript extraction mechanism is fragile, as already
   recorded in Inox issue #5;
2. comments describe a 4-bit type and 28-bit name, while current `pack()` uses
   a shift of 29 and a 24-bit name mask even though `type_invalid` is 8.

This contract resolves the second inconsistency for the micro profile by using
the intended 4+28 layout. Updating the TypeScript reference is a separate,
reviewed change and MUST be accompanied by conformance tests.

---

## 4. Architectural boundaries

The implementation shall be split into five layers.

| Layer | Responsibility | Forbidden responsibility |
|---|---|---|
| `core` | Cells, handles, VM, stacks, image reader, errors | OS, USB, ESP-IDF, files |
| `platform` | Time, trace, memory mapping, transport, panic | Inox language semantics |
| `host-tools` | Compile/build/inspect/verify images | Device execution policy |
| `transport` | Packet framing and request correlation | Direct VM memory access |
| `adapter` | DECT/GPIO/UART-specific capabilities | Redefining VM or image formats |

The core MUST depend only on fixed-width integer types, byte spans, explicitly
provided memory regions, and the platform ABI defined below.

The core MUST NOT include ESP-IDF, POSIX, USB, UART, DECT, or filesystem headers.

---

## 5. Repository layout

The target layout is normative:

```text
tools/
  cppgen.mjs
  inox-image/
    README.md
    ... host implementation ...

profiles/
  inox-micro-v0.json

ports/cpp/
  README.md
  include/
    inox/cell.h
    inox/error.h
    inox/handle.h
    inox/image.h
    inox/platform.h
    inox/runtime.h
  core/
    cell.cpp
    handle.cpp
    image.cpp
    runtime.cpp
    snapshot.cpp
    stack.cpp
  platform-posix/
    platform_posix.cpp
    main.cpp
  platform-esp32/
    CMakeLists.txt
    platform_esp32.cpp
    app_main.cpp

test/conformance/micro/
  README.md
  manifest.json
  fixtures/
```

`ports/cpp/README.md` MUST contain build commands and links to this contract. It
MUST NOT duplicate the normative format definitions.

---

## 6. Toolchain and language subset

### 6.1 Core implementation

- Language: C++17 subset.
- Public ABI: C11-compatible declarations wrapped in `extern "C"`.
- Required integer header: `<stdint.h>` or `<cstdint>`.
- Required size header: `<stddef.h>` or `<cstddef>`.
- Exceptions: disabled.
- RTTI: disabled.
- STL containers: forbidden in `ports/cpp/core`.
- `std::string`, iostreams, locales, regex, threads, and filesystem: forbidden
  in `ports/cpp/core`.
- Hidden allocation from constructors: forbidden.
- Global constructors with observable behavior: forbidden.
- Recursion in the interpreter loop: forbidden.

Host tools MAY use the C++ standard library or Node.js. Their output remains
subject to byte-for-byte format tests.

### 6.2 Compiler flags

The native debug build SHOULD include equivalents of:

```text
-std=c++17
-Wall -Wextra -Wpedantic -Werror
-fno-exceptions
-fno-rtti
```

The ESP32 core MUST compile with exceptions and RTTI disabled. Optimized builds
MUST NOT disable bounds or image validation at trust boundaries.

---

## 7. Fixed-width public types

The public headers shall define aliases with compile-time size checks:

```cpp
typedef uint32_t inox_u32;
typedef int32_t  inox_i32;
typedef uint64_t inox_u64;
typedef uint32_t inox_handle;
typedef uint32_t inox_name;
typedef uint8_t  inox_type;

typedef struct inox_cell {
  inox_u32 value;
  inox_u32 info;
} inox_cell;
```

Required compile-time assertions:

```text
sizeof(inox_u32)  == 4
sizeof(inox_u64)  == 8
sizeof(inox_cell) == 8
alignof(inox_cell) >= 4
```

Native pointers MUST NOT be stored in `inox_u32`, `inox_handle`, `value`, image
cells, snapshot cells, or transport payloads.

---

## 8. Canonical cell format

### 8.1 Logical layout

An Inox cell is exactly 64 bits:

```text
bits  0..31  value (raw unsigned payload; interpreted by type)
bits 32..59  name  (28-bit symbol identifier)
bits 60..63  type  (4-bit type identifier)
```

Equivalent operations:

```cpp
info = ((uint32_t)type << 28) | name;
type = (uint8_t)(info >> 28);
name = info & 0x0fffffffU;
```

Validation rules:

- `type <= 15`;
- `name <= 0x0fffffff`;
- name `0` means `void` or unnamed according to the cell type;
- a serialized cell is always little-endian;
- the in-memory representation on supported v0 targets is little-endian;
- a big-endian runtime MUST reject the image with
  `INOX_E_UNSUPPORTED_ENDIAN`.

### 8.2 Type identifiers

| ID | Constant | `value` interpretation |
|---:|---|---|
| 0 | `INOX_TYPE_VOID` | must normally be zero |
| 1 | `INOX_TYPE_BOOLEAN` | `0` false, `1` true |
| 2 | `INOX_TYPE_INTEGER` | two's-complement signed 32-bit integer |
| 3 | `INOX_TYPE_FLOAT` | reserved in micro-v0; execution traps |
| 4 | `INOX_TYPE_TAG` | symbol identifier or tag value |
| 5 | `INOX_TYPE_VERB` | handle of first instruction cell |
| 6 | `INOX_TYPE_PRIMITIVE` | stable primitive ID |
| 7 | `INOX_TYPE_REFERENCE` | logical handle |
| 8 | `INOX_TYPE_INVALID` | always traps if executed or dereferenced |
| 9..15 | reserved | reject unless a future profile declares them |

The micro profile deliberately preserves current type IDs 0 through 8 while
making enough type bits available to represent ID 8 correctly.

### 8.3 Raw byte order

For cell `{ value = 0x11223344, info = 0x856789ab }`, the serialized bytes are:

```text
44 33 22 11 ab 89 67 85
```

This vector MUST appear in unit tests on every platform.

---

## 9. Logical handles and memory regions

### 9.1 Handle layout

A handle is a 32-bit logical address, not a pointer:

```text
bits  0..27  cell offset inside a region
bits 28..31  region identifier
```

Equivalent operations:

```cpp
handle = ((uint32_t)region << 28) | cell_offset;
region = (uint8_t)(handle >> 28);
cell_offset = handle & 0x0fffffffU;
```

Offsets count 8-byte cells, never bytes. Handle zero is invalid and MUST NOT
identify a real cell.

### 9.2 Region identifiers

| ID | Constant | Mutability | Typical residence | Snapshot |
|---:|---|---|---|---|
| 0 | `INOX_REGION_INVALID` | none | none | no |
| 1 | `INOX_REGION_FLASH_IMMUTABLE` | read-only | mapped flash/host image | referenced by hash |
| 2 | `INOX_REGION_RAM_MUTABLE` | read/write | internal SRAM | yes |
| 3 | `INOX_REGION_PSRAM_OPTIONAL` | read/write | external PSRAM | profile-dependent |
| 4 | `INOX_REGION_HOST_BACKED` | capability only | Linux-owned data | no direct dereference |
| 5 | `INOX_REGION_DEVICE_BOUND` | capability only | peripheral/register facade | no direct dereference |
| 6..14 | reserved | none | none | no |
| 15 | `INOX_REGION_POISON` | none | diagnostic | no |

`HOST_BACKED` and `DEVICE_BOUND` handles MUST NOT be converted to pointers by
the VM. They are opaque capabilities accepted only by declared platform calls.

### 9.3 Handle validation

Every dereference MUST perform these checks before touching memory:

1. region is declared by the current runtime profile;
2. region is directly addressable;
3. offset is smaller than the mapped region cell count;
4. requested access does not overflow the region;
5. writes target a mutable region;
6. alignment is valid by construction because offsets count cells.

Failure returns `INOX_E_BAD_HANDLE` or `INOX_E_READ_ONLY`; it MUST NOT wrap,
truncate, or access native address zero.

---

## 10. Runtime memory model

### 10.1 Immutable base

The bootstrap image resides in `FLASH_IMMUTABLE`. On ESP32 it SHOULD be mapped
directly from flash when the platform permits aligned reads. It MUST NOT be
copied wholesale into RAM.

Immutable cells include:

- compiled bootstrap definitions;
- compiled micro-Forth definitions;
- symbol text and symbol metadata;
- primitive import declarations;
- immutable literal data.

### 10.2 Mutable overlay

`RAM_MUTABLE` contains only state that can change after boot:

- VM state;
- data stack;
- control stack;
- mutable global cells;
- runtime allocator metadata;
- loaded mutable delta sections;
- bounded transport buffers.

The first target budget is:

```text
internal mutable RAM at boot <= 192 KiB
transport buffers             <=   8 KiB total
single frame payload          <=   4 KiB
```

These are acceptance limits, not claims about available board memory.

### 10.3 Optional PSRAM

The minimal image MUST boot and pass core tests without PSRAM. A build MAY use
PSRAM for large overlays, caches, traces, or application data. Absence of PSRAM
MUST result in a declared capability difference, not a boot failure for the
minimal profile.

### 10.4 Allocation

Milestones M0-M2 SHOULD avoid general-purpose dynamic allocation in the core.
Stacks and mutable sections are sized by the image header and profile limits.

When a runtime allocator is introduced, it MUST:

- operate only on a supplied mutable region;
- use explicit sizes and bounds;
- never call host `malloc` from core code;
- expose allocation failure as `INOX_E_NO_MEMORY`;
- make all metadata snapshot-safe;
- use deterministic behavior for identical allocation sequences.

Immutable flash objects have eternal lifetime and MUST NOT carry a mutable
reference count.

---

## 11. Image container format `inox.image.v1`

### 11.1 General rules

- File extension: `.inoximg`.
- All integers: unsigned little-endian unless stated otherwise.
- Maximum v1 file size: 64 MiB.
- Required alignment for sections containing cells: 8 bytes.
- Unknown required section: reject.
- Unknown optional section: ignore after bounds and checksum validation.
- Native pointers: forbidden.
- Compression: forbidden in v1.
- Encryption and signatures: forbidden in v1; integrity is still mandatory.

### 11.2 Header

The header is exactly 128 bytes.

| Offset | Size | Field | Rule |
|---:|---:|---|---|
| 0 | 8 | `magic` | ASCII `INOXIMG` followed by `0x00` |
| 8 | 2 | `format_major` | `1` |
| 10 | 2 | `format_minor` | `0` |
| 12 | 4 | `header_size` | `128` |
| 16 | 4 | `flags` | defined below |
| 20 | 4 | `cell_size` | `8` |
| 24 | 4 | `section_count` | `1..32` |
| 28 | 4 | `section_table_offset` | `128` in v1 |
| 32 | 4 | `file_size` | exact byte length |
| 36 | 4 | `runtime_abi` | `0x00010000` for ABI 1.0 |
| 40 | 4 | `entry_handle` | executable cell in immutable region |
| 44 | 4 | `min_mutable_ram_bytes` | checked before boot |
| 48 | 4 | `data_stack_cells` | non-zero and within profile |
| 52 | 4 | `control_stack_cells` | non-zero and within profile |
| 56 | 4 | `mutable_region_cells` | initial RAM image size |
| 60 | 4 | `reserved0` | must be zero |
| 64 | 32 | `content_sha256` | hash rule below |
| 96 | 32 | `base_sha256` | zero for base image; base hash for delta/snapshot |

Header flags:

```text
bit 0  BASE_IMAGE
bit 1  DELTA_IMAGE
bit 2  SNAPSHOT
bit 3  DEBUG_SYMBOLS_PRESENT
bits 4..31 reserved and must be zero
```

Exactly one of `BASE_IMAGE`, `DELTA_IMAGE`, or `SNAPSHOT` MUST be set.

### 11.3 Section table entry

Each entry is exactly 32 bytes:

| Offset | Size | Field |
|---:|---:|---|
| 0 | 4 | `section_type` |
| 4 | 4 | `section_flags` |
| 8 | 4 | `file_offset` |
| 12 | 4 | `stored_size` |
| 16 | 4 | `logical_size` |
| 20 | 4 | `region_id` |
| 24 | 4 | `cell_offset` |
| 28 | 4 | `crc32` |

Required validation:

- ranges MUST be within `file_size`;
- ranges MUST NOT overlap the header or section table;
- section ranges MUST NOT overlap one another;
- `stored_size == logical_size` in uncompressed v1;
- cell sections MUST be 8-byte aligned and have sizes divisible by 8;
- CRC-32 is the IEEE polynomial over stored section bytes;
- reserved flags MUST be zero.

### 11.4 Section types

| ID | Constant | Required in base | Content |
|---:|---|---|---|
| 1 | `INOX_SECTION_IMMUTABLE_CELLS` | yes | canonical cells for region 1 |
| 2 | `INOX_SECTION_MUTABLE_INIT_CELLS` | yes | initial cells copied into region 2 |
| 3 | `INOX_SECTION_SYMBOLS` | yes | deterministic UTF-8 symbol table |
| 4 | `INOX_SECTION_PRIMITIVE_IMPORTS` | yes | required primitive IDs and names |
| 5 | `INOX_SECTION_VM_STATE` | snapshot only | registers and stack lengths |
| 6 | `INOX_SECTION_METADATA_JSON` | no | canonical UTF-8 JSON |
| 7 | `INOX_SECTION_DEBUG_SYMBOLS` | no | host/debug data |
| 8 | `INOX_SECTION_PSRAM_INIT_CELLS` | no | initial optional region 3 cells |
| 0x80000000.. | vendor optional | no | ignored if optional flag is set |

### 11.5 Symbol section

The symbol section is:

```text
u32 symbol_count
u32 offsets[symbol_count + 1]
u8  utf8_bytes[offsets[symbol_count]]
padding with zero bytes to 8-byte boundary
```

Rules:

- symbol ID zero is the empty/void symbol;
- `offsets[0] == 0`;
- offsets are monotonic;
- each symbol is valid UTF-8 without embedded NUL;
- symbols are sorted by assigned numeric ID, not locale;
- the host builder assigns IDs deterministically for identical inputs;
- padding bytes MUST be zero and are included in hashes.

### 11.6 Primitive import section

Each import is 8 bytes:

```text
u32 primitive_id
u32 symbol_id
```

Imports are sorted by ascending primitive ID and contain no duplicates. Runtime
startup fails with `INOX_E_MISSING_PRIMITIVE` if a required ID is unavailable.

### 11.7 Content addressing

The content address is SHA-256 of the complete file after replacing bytes
64..95 (`content_sha256`) with 32 zero bytes. The computed digest is then stored
at bytes 64..95.

Canonical artifact name:

```text
sha256-<64 lowercase hexadecimal digits>.inoximg
```

The runtime MUST recompute and compare the hash before executing an untrusted or
newly received image. A platform MAY cache a previously verified immutable image
using platform-specific secure metadata, but the cache optimization is outside
the portable core.

---

## 12. Execution model

### 12.1 Runtime state

The logical state is:

```cpp
typedef struct inox_vm_state_v1 {
  inox_handle pc;
  inox_u32 data_stack_length;
  inox_u32 control_stack_length;
  inox_u32 status;
  inox_u32 last_error;
  inox_u64 instruction_count;
} inox_vm_state_v1;
```

The data and control stack contents are stored separately in mutable cells.
Native stack pointers MUST NOT appear in snapshots.

### 12.2 Fetch and dispatch

For each instruction:

1. validate `pc` as a readable cell handle;
2. fetch the cell;
3. increment `pc` by one cell unless the operation replaces it;
4. dispatch according to cell type;
5. increment `instruction_count` after a successful dispatch;
6. stop on halt, yield, budget exhaustion, or error.

Dispatch rules:

- `PRIMITIVE`: execute primitive ID stored in `value`;
- `VERB`: push the already incremented `pc` onto the control stack, then set
  `pc` to the handle in `value`;
- literal types (`BOOLEAN`, `INTEGER`, `TAG`, `REFERENCE`): push a copy of the
  instruction cell onto the data stack;
- `VOID`: perform no action only when both `value` and `name` are zero;
- `FLOAT`: return `INOX_E_UNSUPPORTED_TYPE` in micro-v0;
- `INVALID` or reserved type: return `INOX_E_INVALID_CELL`.

### 12.3 Stack rules

- Stack capacity is fixed at boot from the image header and profile limits.
- Push beyond capacity returns `INOX_E_STACK_OVERFLOW`.
- Pop/fetch without enough values returns `INOX_E_STACK_UNDERFLOW`.
- Errors MUST leave the VM stopped and inspectable.
- A primitive MUST either complete its documented stack effect or leave the
  stack lengths unchanged when it returns an error.

### 12.4 Instruction budget

`inox_vm_run()` accepts a maximum instruction count. Zero means no instructions,
not unlimited execution. The caller MAY repeatedly resume the VM. Budget
exhaustion returns `INOX_YIELDED_BUDGET`, not a fatal error.

This rule is mandatory for cooperative control from Linux and for watchdog-safe
execution on ESP32.

---

## 13. Required primitive ABI

Primitive IDs are stable within runtime ABI 1.x.

| ID | Name | Stack effect | Failure conditions |
|---:|---|---|---|
| 0 | `invalid` | — | always `INOX_E_BAD_PRIMITIVE` |
| 1 | `noop` | `( -- )` | none |
| 2 | `halt` | `( -- )` | none; status becomes halted |
| 3 | `return` | `( -- )` | empty control stack halts cleanly |
| 4 | `branch` | `( -- )` plus one inline handle operand | bad target |
| 5 | `branch-if-false` | `( flag -- )` plus one inline handle operand | bad flag/target |
| 6 | `dup` | `( a -- a a )` | underflow/overflow |
| 7 | `drop` | `( a -- )` | underflow |
| 8 | `swap` | `( a b -- b a )` | underflow |
| 9 | `over` | `( a b -- a b a )` | underflow/overflow |
| 10 | `integer-add` | `( a b -- a+b )` | wrong type/overflow |
| 11 | `integer-subtract` | `( a b -- a-b )` | wrong type/overflow |
| 12 | `integer-multiply` | `( a b -- a*b )` | wrong type/overflow |
| 13 | `integer-divide` | `( a b -- a/b )` | wrong type, zero, overflow |
| 14 | `integer-remainder` | `( a b -- a%b )` | wrong type, zero, overflow |
| 15 | `equal` | `( a b -- flag )` | none for valid cells |
| 16 | `not-equal` | `( a b -- flag )` | none for valid cells |
| 17 | `integer-less` | `( a b -- flag )` | wrong type |
| 18 | `integer-less-equal` | `( a b -- flag )` | wrong type |
| 19 | `integer-greater` | `( a b -- flag )` | wrong type |
| 20 | `integer-greater-equal` | `( a b -- flag )` | wrong type |
| 21 | `integer-and` | `( a b -- a&b )` | wrong type |
| 22 | `integer-or` | `( a b -- a|b )` | wrong type |
| 23 | `integer-xor` | `( a b -- a^b )` | wrong type |
| 24 | `integer-not` | `( a -- ~a )` | wrong type |
| 25 | `boolean-not` | `( flag -- flag )` | non-Boolean |
| 26 | `cell-load` | `( handle -- cell )` | bad/opaque handle |
| 27 | `cell-store` | `( cell handle -- )` | bad/read-only handle |
| 28 | `trace-cell` | `( cell -- )` | platform trace error |
| 29 | `yield` | `( -- )` | none; status becomes yielded |
| 30 | `device-call` | `( request capability -- status )` | capability/platform error |

### 13.1 Inline branch operand

For primitive IDs 4 and 5, the cell immediately following the primitive is a
`REFERENCE` cell whose `value` is the target handle. The interpreter consumes
that operand by advancing `pc` once more whether the conditional branch is
taken or not. A missing or incorrectly typed operand is
`INOX_E_INVALID_INSTRUCTION`.

### 13.2 Integer overflow

Arithmetic uses signed 32-bit values. Overflow MUST be detected without relying
on undefined C++ signed overflow. It returns `INOX_E_INTEGER_OVERFLOW` and does
not alter stack lengths.

### 13.3 Cell equality

`equal` compares the complete 64-bit logical cell: value, type, and name. It
does not dereference references.

---

## 14. Error and status model

No core function throws an exception or terminates the process.

### 14.1 Non-error statuses

| Value | Constant |
|---:|---|
| 0 | `INOX_OK` |
| 1 | `INOX_HALTED` |
| 2 | `INOX_YIELDED` |
| 3 | `INOX_YIELDED_BUDGET` |

### 14.2 Errors

| Value | Constant |
|---:|---|
| 100 | `INOX_E_ARGUMENT` |
| 101 | `INOX_E_UNSUPPORTED_ENDIAN` |
| 102 | `INOX_E_BAD_HANDLE` |
| 103 | `INOX_E_READ_ONLY` |
| 104 | `INOX_E_STACK_OVERFLOW` |
| 105 | `INOX_E_STACK_UNDERFLOW` |
| 106 | `INOX_E_WRONG_TYPE` |
| 107 | `INOX_E_UNSUPPORTED_TYPE` |
| 108 | `INOX_E_INVALID_CELL` |
| 109 | `INOX_E_BAD_PRIMITIVE` |
| 110 | `INOX_E_MISSING_PRIMITIVE` |
| 111 | `INOX_E_INVALID_INSTRUCTION` |
| 112 | `INOX_E_DIVIDE_BY_ZERO` |
| 113 | `INOX_E_INTEGER_OVERFLOW` |
| 114 | `INOX_E_NO_MEMORY` |
| 115 | `INOX_E_BAD_IMAGE` |
| 116 | `INOX_E_IMAGE_HASH` |
| 117 | `INOX_E_IMAGE_VERSION` |
| 118 | `INOX_E_IMAGE_BOUNDS` |
| 119 | `INOX_E_IMAGE_SECTION` |
| 120 | `INOX_E_BASE_MISMATCH` |
| 121 | `INOX_E_TRANSPORT` |
| 122 | `INOX_E_CAPABILITY` |
| 123 | `INOX_E_PLATFORM` |

Functions return one of these integer values. Additional diagnostic information
MAY be written through the trace callback, but program logic MUST NOT depend on
diagnostic text.

---

## 15. Platform ABI 1.0

The platform provides callbacks and memory mappings explicitly.

```cpp
typedef struct inox_region_v1 {
  uint8_t* base;
  uint32_t byte_size;
  uint32_t flags;
} inox_region_v1;

typedef struct inox_platform_v1 {
  void* context;

  uint64_t (*monotonic_us)(void* context);

  int32_t (*trace_write)(
    void* context,
    const uint8_t* data,
    uint32_t size
  );

  int32_t (*transport_read)(
    void* context,
    uint8_t* data,
    uint32_t capacity,
    uint32_t* size,
    uint32_t timeout_ms
  );

  int32_t (*transport_write)(
    void* context,
    const uint8_t* data,
    uint32_t size,
    uint32_t timeout_ms
  );

  int32_t (*device_call)(
    void* context,
    uint32_t capability,
    uint32_t request,
    uint32_t* status
  );

  void (*panic)(void* context, int32_t unrecoverable_error);
} inox_platform_v1;
```

Rules:

- every callback except `panic` returns an Inox status/error code;
- callbacks MAY be null only when the associated capability is absent;
- core code checks null before calling;
- `panic` is reserved for corrupted runtime invariants after recovery is
  impossible; malformed external input MUST NOT call `panic`;
- the POSIX implementation and ESP32 implementation MUST run the same platform
  contract tests.

---

## 16. Runtime API 1.0

Required public functions:

```cpp
int32_t inox_runtime_init(
  inox_runtime* runtime,
  const inox_platform_v1* platform,
  const uint8_t* image,
  uint32_t image_size,
  uint8_t* mutable_memory,
  uint32_t mutable_memory_size
);

int32_t inox_runtime_reset(inox_runtime* runtime);

int32_t inox_vm_run(
  inox_runtime* runtime,
  uint32_t instruction_budget,
  uint32_t* executed
);

int32_t inox_snapshot_size(
  const inox_runtime* runtime,
  uint32_t* required_size
);

int32_t inox_snapshot_write(
  const inox_runtime* runtime,
  uint8_t* output,
  uint32_t output_size,
  uint32_t* written
);

int32_t inox_snapshot_restore(
  inox_runtime* runtime,
  const uint8_t* snapshot,
  uint32_t snapshot_size
);
```

Initialization MUST be deterministic for identical image bytes and zeroed
mutable memory.

---

## 17. Snapshot and restore

A snapshot reuses the `inox.image.v1` container with flag `SNAPSHOT`.

It contains:

- `VM_STATE`;
- the complete used portion of `RAM_MUTABLE`;
- optional used `PSRAM` state only when the active profile declares it
  snapshotable;
- `base_sha256` equal to the mounted base image digest.

It MUST NOT contain:

- immutable flash cells;
- host-backed data;
- device register contents;
- native pointers;
- open file descriptors, USB handles, mutexes, or RTOS task handles;
- transport receive/transmit buffers with partially processed frames.

Before snapshot creation, the runtime enters a quiescent point:

1. finish or roll back the current primitive;
2. stop instruction execution;
3. finish processing the current transport request;
4. clear non-snapshotable transient buffers;
5. serialize state.

Restore MUST reject a snapshot whose `base_sha256` differs from the mounted
base image with `INOX_E_BASE_MISMATCH`.

Snapshots are content-addressed using the same hash rule as images.

---

## 18. USB-compatible packet protocol `inox.link.v0`

The protocol is transport-independent. USB CDC is the first transport, but the
same frames MAY travel over UART, TCP, BLE, or another ordered byte stream.

### 18.1 Frame header

The header is exactly 20 bytes:

| Offset | Size | Field |
|---:|---:|---|
| 0 | 4 | magic ASCII `IXP0` |
| 4 | 1 | major version `0` |
| 5 | 1 | flags |
| 6 | 2 | verb ID |
| 8 | 4 | request ID |
| 12 | 4 | payload size |
| 16 | 4 | payload CRC-32 |

All multibyte fields are little-endian. Maximum payload is 4096 bytes.

Flags:

```text
bit 0 REQUEST
bit 1 RESPONSE
bit 2 ERROR
bit 3 MORE_FRAGMENTS
bits 4..7 reserved
```

Exactly one of REQUEST or RESPONSE is set. ERROR is valid only on responses.

### 18.2 Verb IDs

| ID | Name | Purpose |
|---:|---|---|
| 1 | `HELLO` | versions, runtime identity, base hash |
| 2 | `CAPABILITIES` | regions, PSRAM, devices, limits |
| 3 | `LOAD_IMAGE` | stage and verify a complete image |
| 4 | `LOAD_DELTA` | stage a compatible delta |
| 5 | `RUN` | execute a bounded instruction budget |
| 6 | `READ_CELL` | inspect readable logical cells |
| 7 | `WRITE_CELL` | write mutable logical cells only |
| 8 | `SNAPSHOT` | create or stream snapshot bytes |
| 9 | `RESTORE` | verify and restore snapshot bytes |
| 10 | `RESET` | reset mutable state to image defaults |
| 11 | `DEVICE_CALL` | invoke a declared capability adapter |

The receiver correlates responses by request ID. Duplicate request IDs MAY be
replayed only for explicitly idempotent verbs. `WRITE_CELL`, `RUN`,
`DEVICE_CALL`, and successful `RESTORE` are not assumed idempotent.

### 18.3 Parser safety

The frame parser MUST:

- use a fixed-size header buffer;
- reject reserved flags;
- reject payloads above the configured limit before allocation;
- verify CRC before dispatch;
- recover framing by scanning for `IXP0` after an invalid frame;
- never expose partial payloads to command handlers;
- apply a bounded timeout to incomplete frames.

Authentication is out of scope for local prototype v0. Remote or shared-bus use
MUST NOT be deployed without a separate authenticated capability layer.

---

## 19. Host image tool

The host tool is named `inox-image`. Required commands:

```text
inox-image build   --profile profiles/inox-micro-v0.json --source FILE --output FILE
inox-image inspect IMAGE
inox-image verify  IMAGE
inox-image snapshot-inspect SNAPSHOT
```

`build` MUST be deterministic. Given identical source bytes, compiler version,
profile bytes, and declared inputs, it MUST emit identical image bytes.

`inspect` MUST print at least:

- format and ABI version;
- content hash;
- base hash;
- section list and bounds;
- entry handle;
- mutable RAM requirement;
- stack capacities;
- primitive imports.

The ESP32 does not parse `.nox` source in micro-v0. The host tool may initially
accept a small assembly-like fixture format before integrating the full
TypeScript reference compiler, provided the fixture format is confined to test
and bootstrap tooling.

---

## 20. C++ extraction strategy

Inox issue #5 is the dependency for replacing the fragile comment trick.

The required strategy is:

1. create `tools/cppgen.mjs` as a standalone, deterministic extraction tool;
2. use line-oriented explicit markers rather than nested C/TypeScript block
   comments;
3. add tests for marker nesting, comments inside target blocks, and end-of-file;
4. extract only the declared micro core into the first compiled target;
5. reject unclassified host tokens such as `process`, `fs`, `JSON`, `Map`,
   `Promise`, template literals, or TypeScript type annotations in emitted core;
6. compile the result as part of tests;
7. compare behavior through conformance vectors, not source-line similarity.

The generator MUST fail with a source line number on an unmatched, nested, or
unknown marker. It MUST NOT silently emit mixed-language source.

---

## 21. Milestones and acceptance criteria

Each milestone is independently reviewable. An agent MUST NOT begin the next
milestone until the current one passes.

### M0 — Freeze the contract and conformance skeleton

Deliverables:

- this document;
- `profiles/inox-micro-v0.json`;
- `test/conformance/micro/README.md`;
- `test/conformance/micro/manifest.json`.

Acceptance:

- JSON files parse successfully;
- IDs and limits agree across all files;
- human review resolves or accepts the cell-layout correction;
- no runtime code changes.

### M1 — Robust extraction and standalone core build

Deliverables:

- `tools/cppgen.mjs`;
- extractor tests;
- initial `ports/cpp/include` and `ports/cpp/core` files;
- native debug build.

Acceptance:

- malformed markers fail deterministically;
- emitted C++ contains no declared host-only token;
- core builds with exceptions/RTTI disabled and warnings as errors;
- cell and handle vectors pass;
- no ESP32 dependency in core.

### M2 — Native Linux VM

Deliverables:

- stacks;
- dispatch loop;
- required primitives 0..29;
- POSIX platform adapter;
- in-memory minimal image fixture.

Acceptance:

- integer/stack/control-flow fixtures pass;
- errors preserve stack lengths as specified;
- budgeted execution yields and resumes deterministically;
- AddressSanitizer/UndefinedBehaviorSanitizer run cleanly when available;
- Valgrind is optional, not a substitute for sanitizers.

### M3 — Image builder and verifier

Deliverables:

- deterministic `inox-image` tool;
- `.inoximg` reader/writer;
- malformed-image corpus.

Acceptance:

- two identical builds have identical SHA-256 hashes;
- every mutated header/section bound in the negative corpus is rejected;
- inspection output matches manifest expectations;
- Linux VM runs the image produced by the tool.

### M4 — ESP32-S3 port

Deliverables:

- ESP-IDF component/application;
- flash mapping;
- mutable RAM mapping;
- serial trace;
- emulator configuration where practical.

Acceptance:

- same cell, handle, image, and VM tests pass;
- base image is not copied wholesale into mutable RAM;
- boot mutable-RAM measurement is at or below 192 KiB;
- minimal profile boots without PSRAM;
- invalid image does not execute;
- watchdog-safe budgeted execution works.

### M5 — Link protocol, snapshot, and restore

Deliverables:

- `inox.link.v0` parser;
- POSIX client;
- USB CDC ESP32 adapter;
- snapshot writer/restorer.

Acceptance:

- fragmented and corrupted frame tests pass;
- Linux loads/runs a fixture and reads the result;
- a mutable value survives snapshot, reboot, and restore;
- restore with the wrong base hash fails;
- opaque device/host handles never appear as native pointers in a snapshot.

### M6 — Fake DECT adapter

Deliverables:

- deterministic fake device adapter;
- events `RING`, `OFFHOOK`, `KEY`, `AUDIO_START`, `ONHOOK`;
- Linux scenario test through the packet protocol.

Acceptance:

- different simulated handset identities select different Inox actions;
- adapter code does not modify VM core;
- the same device-call boundary can later host a real DECT/UART adapter.

Real DECT hardware integration is a later FractaVolta-owned adapter milestone.

---

## 22. Conformance rules

### 22.1 Required implementations

The same logical vectors MUST run against:

1. a small reference/vector runner;
2. the Linux C++ runtime;
3. the ESP32 runtime.

The current TypeScript runtime joins a vector only when it implements the same
accepted micro-profile semantics. A failing TypeScript vector is evidence of
semantic drift; it is not permission to weaken the vector silently.

### 22.2 Golden categories

Required categories:

- cell packing and byte order;
- handle packing and region validation;
- image header and section validation;
- content hashing;
- primitive stack effects;
- integer boundary behavior;
- branch and return behavior;
- stack over/underflow;
- budget yield/resume;
- immutable write rejection;
- snapshot/base-hash matching;
- frame parsing, CRC, fragmentation, and payload bounds.

### 22.3 Negative tests

For every accepted external format, at least these mutations are required:

- truncated at every structural boundary;
- size one byte too small and one byte too large;
- integer overflow in offset plus size;
- overlapping sections;
- wrong checksum/hash;
- unknown required type;
- non-zero reserved bits;
- invalid region;
- read-only write;
- duplicate primitive import;
- missing required primitive.

---

## 23. Security and resilience invariants

1. Validate before use.
2. Use logical handles, never serialized native pointers.
3. Keep immutable and mutable regions distinct by construction.
4. Bound every externally supplied length before allocation or copy.
5. Detect integer overflow before computing end offsets.
6. Do not execute an image with a failed hash or incompatible ABI.
7. Do not restore a snapshot against a different base image.
8. Treat missing trace as degraded observability, not proof of success.
9. Make errors inspectable and deterministic.
10. Keep device capabilities explicit; a device handle is not ambient authority.

Degraded operation MAY take more time or require reloading an image. It MUST NOT
silently relax integrity or memory-safety checks.

---

## 24. Coding-agent task template

Every implementation task derived from this contract SHOULD use this template:

```text
Read first:
- AGENTS.md
- shared cogentia/AGENTS.md
- research/inox-cpp-micro-runtime-and-images.md
- profiles/inox-micro-v0.json
- test/conformance/micro/README.md

Implement only: M<n> / <bounded deliverable>

Do not:
- change stable numeric IDs;
- add undeclared dependencies;
- implement later milestones;
- weaken or delete a failing conformance vector;
- store native pointers in portable data;
- publish without explicit authorization.

Required report:
Scope:
Files changed:
Commands run:
Tests passed or missing:
Behavior changed: yes/no
Known risks:
Next step:
Human validation needed: yes/no
```

If an agent cannot state which invariant authorizes a design choice, it MUST
stop and request clarification.

---

## 25. Decision register

| ID | Decision | Status in v0.1 draft |
|---|---|---|
| D-001 | Use one canonical contract plus machine-readable profile/tests | proposed |
| D-002 | Use C++17 subset with C ABI and no embedded STL/exceptions/RTTI | proposed |
| D-003 | Use 64-bit cells with 4-bit type and 28-bit name | proposed; human review required |
| D-004 | Use 4-bit region plus 28-bit cell offset handles | proposed |
| D-005 | Keep bootstrap in immutable flash and mutable overlay in RAM | proposed |
| D-006 | Compile source on host; no ESP32 parser in micro-v0 | proposed |
| D-007 | Use SHA-256 content addresses and CRC-32 per section/frame | proposed |
| D-008 | Reuse image container for snapshots bound to a base hash | proposed |
| D-009 | Use budgeted execution and explicit yield | proposed |
| D-010 | Treat DECT as an adapter beyond the VM boundary | proposed |

Acceptance of this document changes these decisions from `proposed` to
`accepted-for-experiment`; it does not declare the complete Inox language stable.

---

## 26. Open questions that do not block M0

These questions MUST NOT be decided implicitly by a coding agent:

- whether the final production digest remains SHA-256 or later adds BLAKE3;
- how signed images and trust roots are represented after format v1;
- whether PSRAM is included in all snapshots or only selected overlays;
- whether future compact-cell profiles use 4-byte or 6-byte cells;
- how the full TypeScript compiler emits micro-profile images;
- which physical DECT gateway and electrical interface become the first real
  adapter;
- whether USB CDC, USB vendor class, or both are used in production.

M0-M3 can proceed without resolving them because v0 behavior is explicit.

---

## 27. Change control

Substantive changes require:

1. a traceable issue, PR, or decision comment;
2. an update to this document;
3. matching updates to `profiles/inox-micro-v0.json` when machine behavior
   changes;
4. new or changed conformance vectors;
5. human review before acceptance;
6. version increment when a serialized format or stable numeric ID changes.

Do not erase superseded decisions. Record the new decision and the version that
introduced it.

---

## 28. Definition of success

The experiment succeeds when the following scenario is reproducible:

```text
Linux builds a canonical Inox image
  -> the image hash is stable
  -> Linux runs the image through the C++ core
  -> ESP32-S3 boots the same immutable image from flash
  -> ESP32 executes a bounded Inox program
  -> Linux sends a delta or command through USB
  -> mutable state changes
  -> ESP32 produces a snapshot
  -> ESP32 restarts
  -> the snapshot restores against the same base hash
  -> a fake DECT handset event selects an Inox action
```

The important result is not merely that an ESP32 runs some code. The important
result is that the same content-addressed executable structure travels across
Linux and a microcontroller while preserving explicit memory regions,
traceability, bounded execution, and recoverable mutable state.

