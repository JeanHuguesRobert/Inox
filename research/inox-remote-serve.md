---
title: "Inox remote serve — proto interpreter and retrieval fulfiller"
status: "working-note"
corpus_role: "source"
document_kind: "operational-note"
visibility: "public"
lifecycle_state: "active"
summary: "HTTP adapter to run Inox remotely and fulfill Cogentia retrieval.batch mandates via Supabase."
---

# Inox remote serve

Proto **remote interpreter** for weak nodes (fracta, small VPS) toward [Cogentia retrieval Phase 4](https://github.com/JeanHuguesRobert/cogentia/issues/42).

Heavy retrieval stays on a capable host; clients send a small JSON mandate over HTTPS.

## Components

| Piece | Path |
|-------|------|
| HTTP adapter | `bin/inox-serve.js` |
| Run arbitrary `.nox` | `POST /run` |
| Retrieval fulfiller | `POST /retrieval/batch` → `scripts/remote/retrieval-batch.mjs` |
| CLI (env input) | `scripts/remote/retrieval-batch-cli.mjs` |
| Mandate stub | `scripts/remote/retrieval-batch.nox` |
| Smoke script | `examples/remote-ping.nox` |

Production retrieval uses the **direct `/retrieval/batch` route** (async `import()` of the `.mjs` module). The `.nox` file documents the mandate contract until Inox handles async I/O natively.

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
{ "ok": true, "service": "inox-remote", "version": "0.4.0", "auth_required": true, "routes": ["/health", "/run", "/retrieval/batch"] }
```

### `POST /run`

Run a `.nox` file or inline source (subprocess via `bin/inox.js`).

```json
{ "file": "examples/remote-ping.nox" }
```

Optional `input` object → `INOX_RUN_INPUT` env for the child process.

Allowed file roots: `examples/`, `scripts/remote/`, `lib/test/`.

### `POST /retrieval/batch`

Same JSON contract as Cogentia `docs/retrieval-roadmap.md` batch request. Response: `retrieval-supabase-batch-v1` with `packs[]`.

Requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY` (semantic/hybrid) in the server environment.

## Environment

| Variable | Default | Role |
|----------|---------|------|
| `INOX_SERVE_HOST` | `127.0.0.1` | Bind address |
| `INOX_SERVE_PORT` | `8792` | Listen port |
| `INOX_SERVE_TOKEN` | (unset) | Bearer auth; **set before non-loopback bind** |
| `INOX_SERVE_TIMEOUT_MS` | `30000` | Subprocess timeout for `/run` |
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
npm run test:retrieval   # uses ../survey/.env credentials when present
```

## Relation to Fractanet

```text
weak node (fracta MCP)  --HTTPS mandate-->  inox-serve (capable host)
                                                    |
                                              retrieval-batch.mjs
                                                    |
                                              Supabase pgvector
```

Next steps: wire Cogentia Guide MCP to `INOX_RETRIEVAL_URL` instead of direct Supabase; later replace HTTP with Inox mandate packets + COP fulfill.