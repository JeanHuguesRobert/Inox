---
title: "Library packets — when the library is a specification, not code"
subtitle: "LLM-generation as a defensive heterogeneity layer against supply-chain attacks, and as a substrate-specific instance of the packet framework"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A."
status: working-paper — working hypothesis, accumulating evidence
date: "2026-05-23"
license: "CC BY-SA 4.0"
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/library_packets.md
last_stamped_at: 2026-06-01
---

# Library packets — when the library is a specification, not code

> This is a **living research note**, not a paper. The "Evidence log"
> at the bottom accumulates observations as we encounter them. Some
> support the hypothesis, some refute it; both are kept. Promotion to
> a real paper happens only when the evidence is strong enough to
> ground empirical or formal claims.
>
> The note is hosted in `Inox/research/` by locality principle —
> the thinking emerged while building the Inox runtime and CLI, and
> belongs near that work. The connection to
> [`FractaVolta/research/generalized_packet_networks.md`](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/generalized_packet_networks.md) and
> [`cogentia/research/cogentia_commons_method_packets.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cogentia_commons_method_packets.md) is by
> reference, not by relocation.

## Hypothesis

The open-source library, as a distribution unit, has become the
dominant supply-chain attack surface in modern software: XZ Utils
(2024), polyfill.io (2024), event-stream (2018), and a steady stream
of npm/PyPI/crates.io compromises. Each shared binary or shared
package is a concentration of risk: one mainteneur compromis, one
account takeover, one domain expiration, and millions of downstream
installs become vulnerable.

In parallel, LLM code generation has crossed a threshold for routine
library-shaped tasks. Given a precise specification, an LLM produces
a competent implementation in seconds.

The hypothesis: **the future shipping unit for many libraries should
be the specification, not the implementation.** Each consumer
generates their own implementation, locally, on demand, from a signed
spec. We call this unit a **library packet** — a specification
treated as a discrete, addressable, reproducible thing, in the same
sense as [`cognitive_packets.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/cognitive_packets.md) (envelope + payload) and
[`generalized_packet_networks.md`](https://github.com/JeanHuguesRobert/FractaVolta/blob/main/research/generalized_packet_networks.md) (cross-domain framework). Library
packets are the **code-substrate declination** of the packet
framework.

## Why this could matter

- **Heterogeneity as defence.** No two consumers have bit-identical
  binaries. An exploit targeting a specific binary signature fails
  across the population. Genetic diversity applied to code.
- **Minimal local surface.** The generated implementation includes
  only what the consumer uses. No `node_modules/lodash` carrying 800
  unused helpers when three are called.
- **Trust localised.** The audit boundary moves from "audit 800
  transitive maintainers" to "audit one spec author + one LLM
  invocation". Verification is local and finite.
- **Resilience to abandonment.** When a lib upstream dies, its spec
  survives. The capability is regenerable; the binary is not.
- **Substrate-specific declination of the packet framework**, with
  CODE as the substrate. Joins thermal, electric, hydraulic,
  cognitive, etc. as a domain where the same operational pattern
  (store / forward / address / decay / cache) yields the same
  architectural intuitions.

## Steelman: what library packets are good for

1. **Routine utility code** — string manipulation, validation,
   formatting, basic data structures. Spec is small, implementation
   is mechanical, LLM regeneration is reliable.
2. **Adapter code** — bindings to a remote API, parsing a config
   format, transforming between two data shapes. Often dominated by
   the spec's accidental complexity; once the spec is given, the
   implementation writes itself.
3. **Glue code** — small bridge between two well-defined components.
   No deep algorithmic content; the value is in the precise interface.
4. **Test fixtures and mocks** — generated per consumer from a spec
   for *what the dependency does in this test*; no shared mock
   library carrying behaviour the consumer doesn't need.

## Carve-outs: what library packets are NOT good for

1. **Cryptography and security primitives.** You want NIST-validated,
   formally-audited, shared code. Heterogeneity here is a threat,
   not a defence. AES, TLS, signature schemes, PRNGs, hash functions
   stay shared.
2. **Performance-critical hot paths.** Optimised mathematical
   libraries (BLAS, FFTW, SIMD vector ops) carry decades of tuning
   that an LLM is not going to reproduce.
3. **Code where mechanical verification is more reliable than LLM
   generation.** seL4, CompCert. The investment of formal proof is
   worth amortising across all users.
4. **Large frameworks with deep behavioural contracts.** A spec for
   "React" or "Django" is the size of the implementation, defeating
   the point. The spec/impl ratio matters: when the spec is small
   relative to the impl, the model works.

## Honest counter-arguments

1. **The spec becomes the attack surface.** A malicious spec specifies
   subtly compromised behaviour. Specs are *prose*; reviewing them
   adversarially is harder than reading code in some respects.
2. **The LLM is a new single point of failure**, potentially worse
   concentrated than the package registry it replaces. If an LLM
   provider's weights are compromised, all generations are. The
   threat model moves; it does not disappear.
3. **Non-reproducibility.** Two LLM generations of the same spec may
   diverge. Bug reports become "send me your version", not "issue on
   the canonical implementation". Possible mitigation: reproducible
   generation (deterministic decode, fixed seed, pinned model). But
   then you have a *spec-and-model* package, which is bigger.
4. **Composition without contracts.** Two locally-generated libraries
   composed in one program need their interfaces to align. Without
   shared verification, mismatch goes undetected.
5. **Verification cost multiplied by N consumers.** Each consumer
   must verify their generation matches the spec. The amortisation
   that made shared libraries economical is lost.
6. **Specs are often larger than implementations.** A complete,
   unambiguous spec for `sort` may be longer than the implementation.
   The compression direction is not what one would naively assume.

## Threat model — what library packets defend against

| Threat | Library packets help? | How |
|---|---|---|
| Maintainer account takeover | Yes | No shared package to push malicious update into. |
| Typosquatting / dependency confusion | Yes | The spec is the named reference; the binary is local. |
| Subtle backdoor in pre-built binary | Yes | No shared binary; backdoor would have to live in the spec or the model. |
| Domain hijacking (polyfill.io style) | Yes | Specs are content-addressed, not URL-fetched at runtime. |
| Compromised CI/CD signing key | Partial | Reduces concentration; if specs are signed, that signing key is itself a vector. |
| Malicious spec author | No | Same problem as malicious package author, just moved up a level. |
| Compromised LLM provider | No | Worse than the status quo if the LLM is more concentrated than the package ecosystem. |
| Performance regression | No | LLM generation has no SLA for code quality. |

The pattern is clear: **defends against attacks that exploit
concentrated distribution; does not defend against attacks at the
authoring or generation layer**. Moves the boundary, does not
eliminate the threat.

## Methodology sketch (when the evidence is ready)

A workshop or position paper would need:

1. **Threat model formalised** with specific recent attacks mapped to
   the table above, plus an honest discussion of attacks the model
   does *not* prevent.
2. **Pilot case study.** Pick a single popular utility library (e.g.
   a validator, a date formatter). Write a precise spec for the
   parts an actual project uses. Generate implementations with two
   LLMs. Compare against the original library across attack surface
   (LOC, dependency count, optional features), behaviour (test
   suite), and performance.
3. **Discussion of carve-outs.** Where it doesn't apply, why, and
   what the boundary looks like in practice.
4. **Infrastructure sketch.** Spec registry (signed, content-
   addressed), reproducible-generation protocol (seed + model hash +
   prompt template), local verification (spec → generated impl →
   property tests).

A full paper would also include:
5. **A larger empirical study** — N libraries × M generation
   parameters × K target tasks, comparing security and behaviour
   properties.
6. **Relation to existing supply-chain defences** — SLSA, Sigstore,
   in-toto, reproducible builds, formally verified libs.
7. **Connection to the packet framework** in the corpus (cf. the
   cross-references above).

## Status

- **Hypothesis stated, not tested.**
- **No pilot yet.**
- **Open for evidence in either direction.**

## Evidence log

Each entry: date, what was observed, which part of the hypothesis
it bears on, one-line interpretation. Entries are factual; the
interpretation may be revised later.

---

*(2026-05-23, initial)* During the Inox CLI build we observed that
the runtime is ~24 500 lines of TypeScript with substantial dormant
code (~10 latent bugs found in code paths that had not been
exercised in 3 years). **The point:** even author-written code
that ships under one name accumulates hidden risk when it is
shared and unrun. A library packet, regenerated on demand, would
not have accumulated this exposure for downstream consumers in the
same way — but it would also not have had the same *opportunity to
be debugged once and benefit all consumers*. The trade is real and
ambidirectional.

*(2026-05-23, initial)* The Inox dispatch fixes that finally
enabled `to fact ... fact ... .` self-recursion (commit `0efb8ee`)
involved four interlocking changes across the compile-time inline
decision, the run-loop late-binding lookup, and the
`definition_of` assertion. **Implication for the spec-as-package
idea:** specifying "fact recurses on its own definition once it is
finished being defined" is *one sentence*; getting the runtime to
honour that semantic took four code changes. **Specs are often
much smaller than the runtime invariants they imply** —
compression direction is favourable here, contrary to the
counter-argument that specs are bigger than implementations. The
ratio is task-dependent.

*(2026-05-26, cross-corpus convergence)* Between 2026-05-22 and
2026-05-26 the `cogentia` repository formalised the **Cogentia
Pipeline method** in [`cogentia/research/pipeline.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/pipeline.md) v0.4 and
[`cogentia/research/derived_products.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/derived_products.md) v0.2. The companion paper
defines a **source corpus / derived products** split: the
substantive content belongs to a versioned source corpus; academic
papers, blogposts, social posts, parliamentary notes, public
dashboards are all *derived products* adapted to a specific
audience/platform/persona. Operating rule: *do not popularize from
the academic paper; derive from the corpus*. **The point for
library packets:** this is the same anti-concentration
heterogeneity argument applied to *publications* rather than to
*code*. Two parallel formulations:

| Domain | Concentrated unit (risk) | Distributed unit (defence) |
|---|---|---|
| **Code (this paper)** | Shared implementation binary | Per-consumer generation from signed spec |
| **Publications (Cogentia)** | Sovereign academic paper | Per-audience derivation from versioned source corpus |

Both share three structural properties: (a) the *source* is
versioned, signed, content-addressed; (b) the *form* (binary /
publication) is generated late, on demand, for the specific
consumer; (c) no two consumers receive bit-identical artefacts.
The mature Cogentia practice is already deploying the source ↔
derived discipline on real documents ([`projet_1755.md`](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/autonomia/projet_1755.md) source +
[`1755.md`](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/autonomia/1755.md) dashboard; [`christianity_verticalization.md`](https://github.com/JeanHuguesRobert/barons-Mariani/blob/main/research/christianity_verticalization.md) source +
`_blogpost.md` derived). This is **empirical existence proof** that
the pattern is workable on prose; it does not yet show it is
workable on code, but it does show the underlying epistemology
(source-first, form-late) is operationally tractable. Cross-link:
[[cogentia-pipeline-method]] (memory), [`cogentia/research/pipeline.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/pipeline.md),
[`cogentia/research/derived_products.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/derived_products.md).

---

*Add new entries here as observations accumulate.*


<!-- BEGIN_AUTO: backlinks -->
### Backlinks

*These documents link to this file:*
- [Research Index — Inox](index.md)
- [Test du critère Rossignol — Inox](test_critere_rossignol_inox.md)

<!-- END_AUTO: backlinks -->
