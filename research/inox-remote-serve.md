---
title: "Inox remote serve — remote runtime, sessions, and optional retrieval"
author: unknown
affiliation: unknown
date: null
last_modified_at: 2026-10-27
license: unknown
language: en
canonical_url: https://github.com/JeanHuguesRobert/Inox/blob/master/research/inox-remote-serve.md
status: working-paper
corpus_role: "source"
document_kind: "operational-note"
visibility: "public"
lifecycle_state: "active"
summary: "HTTP adapter for remote Inox execution, stateful sessions, continuations, and an optional Cogentia retrieval batch route."
document_role: "source"
update_policy: UP-DEFAULT-REVIEWED
provenance:
  origin_type: unknown
  origin_repository: unknown
  origin_ref: unknown
  origin_date: unknown
  derived_from: []
review:
  status: unreviewed
  reviewed_by: []
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "explicit-metadata"
classification_confidence: "medium"
---

# Inox remote serve

Remote Inox runtime for executing `.nox` work on a capable host, carrying
stateful session turns, and exchanging continuations. It also exposes an
optional Cogentia retrieval batch endpoint.

The earlier proposal to connect this service to Guide retrieval is parked. The
live Guide currently uses Supabase and does not route requests to Inox; the
presence of `/retrieval/batch` describes a server capability, not a Guide
integration.

## Components

| Piece | Path |
|-------|------|
| HTTP adapter | `bin/inox-serve.js` |
| Sidecar pool (default) | `scripts/serve/sidecar-pool.js` + `inox-sidecar.js` |
| Worker pool (experimental) | `scripts/serve/worker-pool.js` + `inox-worker.js` — blocked on [#23](https://github.com/JeanHuguesRobert/Inox/issues/23) |
| Continuations (IoC) | `scripts/serve/continuation.js` + `capability-host.js` |
| Run arbitrary `.nox` | `POST /run` (worker pool, default) |
| Retrieval fulfiller | `POST /retrieval/batch` → `scripts/remote/retrieval-batch.js` |
| Resume continuations | `POST /continuation/fulfill` |
| CLI (env input) | `scripts/remote/retrieval-batch-cli.js` |
| Mandate stub | `scripts/remote/retrieval-batch.nox` |
| Smoke script | `examples/remote-ping.nox` |

The optional retrieval plugin uses the **direct `/retrieval/batch` route**
(async `import()` of the `.js` module). The `.nox` file documents the mandate
contract until Inox handles async I/O natively. This route remains available to
authorized clients independently of the Guide.

## Quick start

```bash
cd Inox
INOX_SERVE_TOKEN=your-secret \
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
OPENAI_API_KEY=... \
npm run serve
```

```bash
curl -fsS http://127.0.0.1:8792/health
curl -fsS -X POST http://127.0.0.1:8792/retrieval/batch \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": ["FractaVolta public Guide"],
    "mode": "hybrid",
    "corpus_key": "cogentia-public",
    "limit": 4,
    "budget": 2000
  }'
```

## Routes

### `GET /health`

```json
{ "ok": true, "service": "inox-remote", "version": "0.4.0", "auth_required": true, "runtime": "sidecar", "pool_size": 4, "continuation_protocol": "inox.continuation.v1", "routes": ["/health", "/run", "/retrieval/batch", "/continuation/fulfill"] }
```

### `POST /run`

Run a `.nox` file or inline source. Default runtime is a **sidecar process pool**: persistent dispatchers spawn a fresh `bin/inox.js` per job (FastCGI-style — correct isolation, parallel pool). Set `INOX_SERVE_RUNTIME=process` for direct CGI spawn from the HTTP thread; `worker` for experimental thread pool (requires runtime reset, [#23](https://github.com/JeanHuguesRobert/Inox/issues/23)).

```json
{ "file": "examples/remote-ping.nox" }
```

Optional `input` object → `INOX_RUN_INPUT` env for the child process.

Allowed file roots: `examples/`, `scripts/remote/`, `lib/test/`.

### `POST /retrieval/batch`

Same JSON contract as Cogentia `docs/retrieval-roadmap.md` batch request. Response: `retrieval-supabase-batch-v1` with `packs[]`.

When secrets are present, fulfills inline. Otherwise returns HTTP **202** with `inox.continuation.v1` pending capability steps; the invoker fulfills via `POST /continuation/fulfill`. See `research/inox-serve-continuations.md`.

## Environment

| Variable | Default | Role |
|----------|---------|------|
| `INOX_SERVE_HOST` | `127.0.0.1` | Bind address |
| `INOX_SERVE_PORT` | `8792` | Listen port |
| `INOX_SERVE_TOKEN` | (unset) | Bearer auth; **set before non-loopback bind** |
| `INOX_SERVE_TIMEOUT_MS` | `30000` | Job timeout for `/run` |
| `INOX_SERVE_RUNTIME` | `sidecar` | `sidecar` (pool), `worker` (threads, experimental), or `process` (CGI) |
| `INOX_SERVE_WORKERS` | `min(4, cpus)` | Sidecar or worker pool size |
| `SUPABASE_URL` | — | Retrieval backend |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Retrieval backend |
| `OPENAI_API_KEY` | — | Query embeddings |
| `COGENTIA_RETRIEVAL_CORPUS_KEY` | `cogentia-public` | Default corpus |

## Security

- Default bind is loopback.
- Without `INOX_SERVE_TOKEN`, auth is disabled (local dev only).
- `/run` file paths are allowlisted; inline source capped at 64 KiB.
- Do not expose without TLS termination (Caddy/nginx) and a strong token.

## Tests

```bash
npm run test:serve
npm run test:continuations
npm run test:retrieval   # uses ../survey/.env credentials when present
npm run bench:serve      # cold/warm latency benchmarks → results/inox-serve-bench-latest.json
```

See `research/inox-serve-benchmarks.md` for terminology (server_cold, sidecar_warm, inox_isolate_cold_per_job).

## Relation to Fractanet

```text
authorized client  --HTTPS /run or /session/turn-->  inox-serve (capable host)
                                                        |
                                                optional /retrieval/batch
                                                        |
                                                Supabase pgvector
```

See also: `research/inox-serve-continuations.md` (worker threads + IoC).

Guide wiring is parked; do not treat `INOX_RETRIEVAL_URL` as current Guide
configuration. Continue the generic runtime work: native `continuation emit`
in `.nox` and COP artifact mapping.
