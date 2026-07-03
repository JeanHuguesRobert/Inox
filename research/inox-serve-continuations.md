---
title: "Inox serve — worker threads and continuations (IoC)"
status: "working-note"
corpus_role: "source"
document_kind: "operational-note"
visibility: "public"
lifecycle_state: "active"
summary: "Replace CGI-style subprocesses with a worker pool; emit inox.continuation.v1 when external capabilities are required."
---

# Worker threads and continuations

## Problem: CGI-style `/run`

Early HTTP servers spawned a **new process per request** (CGI). The first `inox-serve` prototype did the same: each `POST /run` called `spawn(bin/inox.js)`.

That is simple and isolated, but expensive: cold V8 isolate, re-parse Inox bootstrap, no reuse.

## Sidecar process pool (default)

`POST /run` uses a **fixed pool** of persistent sidecar child processes (`INOX_SERVE_RUNTIME=sidecar`, default). Each sidecar dispatches jobs by spawning a fresh `bin/inox.js` — correct per-job isolation without CGI from the HTTP thread.

## Worker thread pool (experimental)

`INOX_SERVE_RUNTIME=worker` uses `worker_threads` and loads Inox once per worker. **Blocked for multi-job reuse** until runtime reset lands ([#23](https://github.com/JeanHuguesRobert/Inox/issues/23)).

| Piece | Path |
|-------|------|
| Sidecar pool | `scripts/serve/sidecar-pool.mjs` |
| Sidecar entry | `scripts/serve/inox-sidecar.mjs` |
| Worker pool (experimental) | `scripts/serve/worker-pool.mjs` + `inox-worker.mjs` |

Each worker:

1. Loads `builds/inox.js` **once** at startup.
2. Receives jobs `{ file, source, input }` via `postMessage` (by value).
3. Runs `runtime.processor(...)` and returns `{ stdout, stderr, exit_code }`.

Messages are structured clones — same constraint as subprocess IPC, but lighter than `fork()` per request.

Fallbacks: `INOX_SERVE_RUNTIME=process` (CGI from HTTP thread); `worker` (threads, awaits #23).

```
Client ──POST /run──► inox-serve (main thread)
                          │
                    worker-pool.mjs
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           worker-1    worker-2    worker-N
         (Inox loaded once each)
```

## Continuations: inversion of control

When Inox (or a fulfiller script) needs a capability it does not own — OpenAI embeddings, Supabase RPC, human judgment — it **emits a continuation** instead of failing or embedding secrets.

Protocol: `inox.continuation.v1` (aligned with `cogentia.continuation.v2` and COP `cop/continuation`).

| Piece | Path |
|-------|------|
| Continuation store | `scripts/serve/continuation.mjs` |
| Capability host | `scripts/serve/capability-host.mjs` |
| Retrieval fulfiller | `scripts/remote/retrieval-batch.mjs` |

### Capability host

```javascript
const host = createCapabilityHost(env, { inline: true });
const answer = await host.request("openai.embeddings", { model, input, dimensions });
```

- **Inline** (secrets in server env): host calls OpenAI / Supabase directly.
- **No secrets**: host returns a pending step; `packBatch` aggregates all steps and responds with `status: "continuation_required"` (HTTP **202**).

Capabilities today:

| Capability | Inline when |
|------------|-------------|
| `openai.embeddings` | `OPENAI_API_KEY` or `COGENTIA_OPENAI_API_KEY` |
| `supabase.rpc` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

### Retrieval without secrets

```bash
curl -s -X POST http://127.0.0.1:8792/retrieval/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"queries":["Guide"],"mode":"hybrid","limit":4}'
```

Response (202):

```json
{
  "ok": false,
  "status": "continuation_required",
  "protocol": "inox.continuation.v1",
  "continuation": {
    "id": "...",
    "pending": [
      { "id": "...", "capability": "openai.embeddings", "request": { "model": "...", "input": "Guide" } },
      { "id": "...", "capability": "supabase.rpc", "request": { "fn": "match_retrieval_chunks", "args": { ... } } }
    ],
    "state": { "operation": "retrieval.batch", "payload": { ... } }
  },
  "resume": { "method": "POST", "path": "/continuation/fulfill", "body": { "continuation_id": "...", "fulfillments": [] } }
}
```

### Fulfill and resume

The invoker (fracta MCP, Cogentia Guide, any COP worker) performs the external calls, then:

```bash
curl -s -X POST http://127.0.0.1:8792/continuation/fulfill \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "continuation_id": "<id>",
    "fulfillments": [
      { "id": "<embed-step-id>", "ok": true, "result": { "ok": true, "embedding": [0.1, ...] } },
      { "id": "<rpc-step-id>", "ok": true, "result": { "ok": true, "data": [ { "source_id": "...", "text": "..." } ] } }
    ]
  }'
```

Server resolves the continuation and **resumes** `retrieval.batch` with injected fulfillments → final `packs[]` (HTTP 200).

## Relation to Cogentia and COP

| Layer | Protocol | Pattern |
|-------|----------|---------|
| Cogentia CLI | `cogentia.continuation.v2` | `emitContinuation()` for judgments, embeddings |
| Inox serve | `inox.continuation.v1` | capability steps + HTTP fulfill |
| COP core | `cop/continuation` | typed artifact; fulfiller provides missing capacity |

Fracta (weak node) becomes the **invoker**: it holds no Supabase/OpenAI secrets, receives continuations from inox-serve, fulfills them locally or via regional services, posts fulfillments back.

## Environment

| Variable | Default | Role |
|----------|---------|------|
| `INOX_SERVE_RUNTIME` | `sidecar` | `sidecar`, `worker`, or `process` |
| `INOX_SERVE_WORKERS` | `min(4, cpus)` | Pool size |

## Tests

```bash
npm run test:serve
npm run test:continuations
npm run test:retrieval
```

## Next steps

1. Native Inox syntax for `continuation emit` inside `.nox` scripts (today: JS fulfiller + future mandat packets).
2. Wire Cogentia Guide MCP to `INOX_RETRIEVAL_URL` with continuation-aware client.
3. Map `inox.continuation.v1` ↔ `cop/continuation` artifact envelope for COP routers.