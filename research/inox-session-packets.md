---
title: "Inox serve — session cognitive packets (inox.session.v1)"
status: "working-note"
corpus_role: "source"
document_kind: "operational-note"
visibility: "public"
lifecycle_state: "active"
summary: "Stateful actor loop: continuations on stdout, fulfillments reinjected on stdin; COP-aligned packets."
---

# Session cognitive packets

Evolution from **line = one job** (CGI/sidecar) to **packet = one turn** in a conversation.

## Model

```text
Client / COP router                Session actor (sidecar loop)
        │  turn { event: retrieval.batch }
        ├──────────────────────────────►
        │  packet { type: continuation }   ← cop/continuation
        ◄──────────────────────────────┤
        │  (host fulfills capability)
        │  turn { event: fulfillment, fulfillments }
        ├──────────────────────────────►
        │  packet { type: result, body: packs[] }
        ◄──────────────────────────────┤
        │  turn { event: mandate.run, file }
        ├──────────────────────────────►
        │  packet { type: result }         same session_id
        ◄──────────────────────────────┤
```

Transport framing remains **one JSON packet per line** on stdin/stdout; the semantic unit is the **cognitive packet**, not a raw byte stream.

## Protocol: `inox.session.v1`

| Packet `type` | Role |
|---------------|------|
| `turn` | Input: mandate, retrieval, fulfillment, cancel |
| `continuation` | Output: suspended work (`artifact_type: cop/continuation`) |
| `result` | Output: completed turn |
| `error` / `cancelled` | Output: failure paths |

### Event kinds (`turn.event.kind`)

| Kind | Purpose |
|------|---------|
| `mandate.run` | Run `.nox` file or inline source |
| `retrieval.batch` | Cogentia retrieval (may emit continuation) |
| `fulfillment` | Reinject capability results (loop closure) |
| `cancel` | Cancel active continuation |

## HTTP adapter

```bash
curl -s -X POST http://127.0.0.1:8792/session/turn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "kind": "retrieval.batch",
      "payload": { "queries": ["Guide"], "mode": "keyword", "limit": 2 }
    }
  }'
```

HTTP **202** = continuation packet. Reply with same `session_id`:

```bash
curl -s -X POST http://127.0.0.1:8792/session/turn \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<from continuation response>",
    "event": {
      "kind": "fulfillment",
      "continuation_id": "<id>",
      "fulfillments": [ { "id": "<step>", "ok": true, "result": { "ok": true, "data": [] } } ]
    }
  }'
```

## Components

| Piece | Path |
|-------|------|
| Protocol | `scripts/serve/session-protocol.mjs` |
| Session store | `scripts/serve/session-store.mjs` |
| Turn handler | `scripts/serve/session-runner.mjs` |
| Actor loop | `scripts/serve/inox-session-sidecar.mjs` |
| Pool (sticky `session_id`) | `scripts/serve/session-pool.mjs` |

## Relation to `processor(json_state, json_event, source)`

Session `state` in packets maps to the orchestration layer around `processor()` — state carried between turns without requiring VM reset ([#23](https://github.com/JeanHuguesRobert/Inox/issues/23)) for multi-step **mandates**.

## Tests

```bash
npm run test:session
```

## Next steps

- Native `.nox` `continuation emit` → packet on stdout
- Map `inox.session.v1` ↔ COP artifact router
- WebSocket or COP stream instead of HTTP request/response per turn