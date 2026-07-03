---
title: "Inox serve — remote execution benchmarks"
status: "working-note"
corpus_role: "source"
document_kind: "operational-note"
visibility: "public"
lifecycle_state: "active"
summary: "Re-runnable cold/warm latency benchmarks for POST /run (sidecar, process, local CLI)."
---

# Remote execution benchmarks

Measure how long it takes to run Inox code remotely via `inox-serve`, with explicit **cold** vs **warm** semantics.

## Run

```bash
cd Inox
npm run bench:serve
# or
node scripts/bench-inox-serve.mjs --iterations=20 --runtimes=sidecar,process,worker
```

Outputs:

- `results/inox-serve-bench-latest.json` — overwrite on each run
- `results/inox-serve-bench-<timestamp>.json` — historical snapshot

`results/` is gitignored; copy a snapshot into `research/` if you want to keep a reference point in git.

## Terminology

| Term | Meaning |
|------|---------|
| **server_cold** | First `POST /run` after `inox-serve` reached `/health`, pool never used |
| **server_warm** | Later `POST /run` on the same server process |
| **sidecar_warm** | Sidecar dispatcher child is alive and pipe-connected (`runtime=sidecar` only) |
| **inox_isolate_cold_per_job** | Each sidecar/process `/run` still spawns a **fresh** `bin/inox.js` — Inox bootstrap is **not** amortized today |
| **client_rtt_ms** | HTTP round-trip measured by the benchmark client |
| **server_duration_ms** | `duration_ms` returned by `inox-serve` (server-side job timing) |

True in-isolate reuse (warm Inox VM across jobs) requires runtime reset ([#23](https://github.com/JeanHuguesRobert/Inox/issues/23)). The experimental `worker` runtime is included optionally but multi-job warm reuse is not valid until then.

## Scenarios

| Scenario | What it measures |
|----------|------------------|
| `local_cli` | Baseline: `node bin/inox.js examples/remote-ping.nox` (no HTTP) |
| `serve_sidecar` | Default pool (`INOX_SERVE_WORKERS=1` in bench for slot reuse) |
| `serve_process` | CGI-style spawn from HTTP thread |
| `serve_worker` | Optional; thread pool (experimental) |

Each serve scenario runs `iterations` file runs + `iterations` inline source runs.

## Reading results

Check `scenarios[].highlights` for a quick comparison:

```json
{
  "health_ready_ms": 120,
  "file_server_cold_client_ms": 620,
  "file_server_warm_client_ms": { "mean": 480, "p50": 470, "p95": 520 },
  "inox_isolate_note": "Each /run still spawns fresh bin/inox.js; warm gain is pool/pipe only"
}
```

**Expected pattern (order of magnitude, local dev machine):**

- `local_cli` warm ≈ 300–600 ms (OS process cache helps after first run)
- `serve_sidecar` warm &lt; server_cold (pool + pipe amortized)
- `serve_process` cold ≈ warm (no pool; each request pays full spawn from HTTP thread)
- Gap between `server_duration_ms` and `client_rtt_ms` ≈ HTTP/JSON overhead (small on loopback)

## Environment knobs

| Variable | Default in bench | Role |
|----------|------------------|------|
| `INOX_BENCH_ITERATIONS` | `10` | Override iteration count |
| `INOX_BENCH_RUNTIMES` | `sidecar,process` | Comma-separated runtimes |

Bench forces `INOX_SERVE_WORKERS=1` so the second run hits the same sidecar slot (clear sidecar_warm effect).