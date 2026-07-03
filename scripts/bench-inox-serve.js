#!/usr/bin/env node
/**
 * inox-serve remote execution benchmarks (re-runnable).
 *
 * Terminology:
 *   server_cold   — first /run after inox-serve just reached /health (pool never used).
 *   server_warm   — subsequent /run on an already-running server.
 *   sidecar_warm  — sidecar dispatcher process alive (stdin/stdout pipe hot); only
 *                   applies to runtime=sidecar. Each /run still spawns a fresh
 *                   bin/inox.js isolate (inox_isolate_cold_per_job).
 *   inox_isolate  — every sidecar/process /run pays a new Node child + Inox bootstrap.
 *                   True isolate reuse awaits runtime reset (issue #23); worker
 *                   runtime is measured but multi-job reuse is not valid today.
 *
 * Usage:
 *   node scripts/bench-inox-serve.js
 *   node scripts/bench-inox-serve.js --iterations=20 --runtimes=sidecar,process
 *   npm run bench:serve
 */
import fs from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const iterations = args.iterations;
const runtimes = args.runtimes;
const token = "bench-inox-serve-token";
const pingFile = "examples/remote-ping.nox";
const sourcePayload = { source: "\"bench-source ok\" out \"\\n\" out 0 exit" };
const filePayload = { file: pingFile };

const report = {
  benchmark: "inox-serve-remote-run",
  version: readPkgVersion(),
  timestamp: new Date().toISOString(),
  host: {
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    node: process.version,
  },
  config: {
    iterations,
    runtimes,
    pool_workers: 1,
    script_file: pingFile,
    note: "pool_workers=1 isolates sidecar warm slot reuse",
  },
  terminology: {
    server_cold: "First /run after inox-serve /health, before any job completed",
    server_warm: "Later /run on same inox-serve process",
    sidecar_warm: "Sidecar child alive; pipe connected (runtime=sidecar only)",
    inox_isolate_cold_per_job: "Each /run spawns fresh bin/inox.js (sidecar/process)",
    client_rtt_ms: "fetch round-trip including JSON parse",
    server_duration_ms: "duration_ms field from inox-serve response",
  },
  scenarios: [],
};

report.scenarios.push(await benchLocalCli(iterations));

for (const runtime of runtimes) {
  report.scenarios.push(await benchServeRuntime(runtime, iterations));
}

const resultsDir = path.join(root, "results");
fs.mkdirSync(resultsDir, { recursive: true });
const stamp = report.timestamp.replace(/[:.]/g, "-");
const latestPath = path.join(resultsDir, "inox-serve-bench-latest.json");
const stampedPath = path.join(resultsDir, `inox-serve-bench-${stamp}.json`);
fs.writeFileSync(latestPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(stampedPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({
  ok: true,
  latest: latestPath,
  stamped: stampedPath,
  summary: summarize(report),
}, null, 2));

async function benchLocalCli(count) {
  const launcher = path.join(root, "bin", "inox.js");
  const target = path.join(root, pingFile);
  const samples = [];
  for (let i = 0; i < count; i++) {
    const started = performance.now();
    const code = await runChild(process.execPath, [launcher, target]);
    samples.push({
      index: i,
      kind: i === 0 ? "cli_cold_process" : "cli_warm_os_cache",
      client_ms: round(performance.now() - started),
      exit_code: code,
      ok: code === 0,
    });
  }
  return {
    name: "local_cli",
    description: "Baseline: node bin/inox.js file.nox (no HTTP, no pool)",
    samples,
    stats: stats(samples.map(item => item.client_ms)),
  };
}

async function benchServeRuntime(runtime, count) {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const serverStart = performance.now();
  const child = spawn(process.execPath, ["bin/inox-serve.js"], {
    cwd: root,
    env: {
      ...process.env,
      INOX_SERVE_HOST: "127.0.0.1",
      INOX_SERVE_PORT: String(port),
      INOX_SERVE_TOKEN: token,
      INOX_SERVE_RUNTIME: runtime,
      INOX_SERVE_WORKERS: "1",
      INOX_SERVE_TIMEOUT_MS: "60000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const healthReadyMs = await waitForHealth(base, serverStart);
    const health = await getJson(`${base}/health`);
    const fileRuns = [];
    const sourceRuns = [];
    let serverRunIndex = 0;

    for (let i = 0; i < count; i++) {
      fileRuns.push(await timedRun(base, filePayload, {
        index: i,
        server_run_index: serverRunIndex,
        kind: classifyRunKind(runtime, serverRunIndex++, "file"),
      }));
    }
    for (let i = 0; i < count; i++) {
      sourceRuns.push(await timedRun(base, sourcePayload, {
        index: i,
        server_run_index: serverRunIndex,
        kind: classifyRunKind(runtime, serverRunIndex++, "source"),
      }));
    }

    return {
      name: `serve_${runtime}`,
      description: `POST /run via inox-serve runtime=${runtime}`,
      server_boot: {
        health_ready_ms: round(healthReadyMs),
        pool_size: health.pool_size,
        runtime: health.runtime,
      },
      file_runs: {
        samples: fileRuns,
        stats_client: stats(fileRuns.map(item => item.client_rtt_ms)),
        stats_server: stats(fileRuns.map(item => item.server_duration_ms)),
      },
      source_runs: {
        samples: sourceRuns,
        stats_client: stats(sourceRuns.map(item => item.client_rtt_ms)),
        stats_server: stats(sourceRuns.map(item => item.server_duration_ms)),
      },
      highlights: highlights(runtime, fileRuns, sourceRuns, healthReadyMs),
    };
  } finally {
    child.kill("SIGTERM");
  }
}

function classifyRunKind(runtime, serverRunIndex, mode) {
  if (serverRunIndex === 0) return `server_cold_first_${mode}`;
  if (runtime === "sidecar" && serverRunIndex === 1) return `server_warm_sidecar_slot_warm_${mode}`;
  return `server_warm_${mode}`;
}

function highlights(runtime, fileRuns, sourceRuns, healthReadyMs) {
  const firstFile = fileRuns[0];
  const warmFile = fileRuns.slice(1);
  const firstSource = sourceRuns[0];
  const warmSource = sourceRuns.slice(1);
  const secondFile = fileRuns[1] || null;
  return {
    health_ready_ms: round(healthReadyMs),
    server_cold: {
      first_run_kind: firstFile.kind,
      file_client_ms: firstFile.client_rtt_ms,
      file_server_ms: firstFile.server_duration_ms,
    },
    server_warm: {
      file_client_ms: stats(warmFile.map(item => item.client_rtt_ms)),
      file_server_ms: stats(warmFile.map(item => item.server_duration_ms)),
      source_client_ms: stats(warmSource.map(item => item.client_rtt_ms)),
      source_server_ms: stats(warmSource.map(item => item.server_duration_ms)),
    },
    sidecar_slot_warm: runtime === "sidecar" && secondFile
      ? { file_client_ms: secondFile.client_rtt_ms, file_server_ms: secondFile.server_duration_ms }
      : null,
    source_first_after_files: {
      kind: firstSource.kind,
      client_ms: firstSource.client_rtt_ms,
      server_ms: firstSource.server_duration_ms,
    },
    inox_isolate_note: runtime === "worker"
      ? "Worker loads Inox once per thread; multi-job warm reuse blocked (#23)"
      : "Each /run still spawns fresh bin/inox.js; warm gain is pool/pipe only",
  };
}

async function timedRun(base, payload, meta) {
  const started = performance.now();
  const response = await fetch(`${base}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  const clientMs = round(performance.now() - started);
  return {
    ...meta,
    ok: response.ok && body.ok,
    status: response.status,
    client_rtt_ms: clientMs,
    server_duration_ms: body.duration_ms ?? null,
    runtime: body.runtime ?? null,
    exit_code: body.exit_code ?? null,
  };
}

async function waitForHealth(base, serverStart) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return performance.now() - serverStart;
      }
    } catch {}
    await sleep(50);
  }
  throw new Error("server did not become healthy");
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} failed`);
  return response.json();
}

function runChild(exec, argv) {
  return new Promise((resolve) => {
    const child = spawn(exec, argv, {
      cwd: root,
      env: { ...process.env, INOX_VERBOSE: "" },
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.on("close", code => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

function stats(values) {
  const list = values.filter(value => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!list.length) return null;
  const sum = list.reduce((acc, value) => acc + value, 0);
  return {
    n: list.length,
    min: round(list[0]),
    max: round(list[list.length - 1]),
    mean: round(sum / list.length),
    p50: round(percentile(list, 0.5)),
    p95: round(percentile(list, 0.95)),
  };
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index];
}

function summarize(report) {
  const out = {};
  for (const scenario of report.scenarios) {
    if (scenario.highlights) {
      out[scenario.name] = scenario.highlights;
      continue;
    }
    if (scenario.stats) {
      out[scenario.name] = scenario.stats;
    }
  }
  return out;
}

function parseArgs(argv) {
  const out = {
    iterations: 10,
    runtimes: ["sidecar", "process"],
  };
  for (const arg of argv) {
    if (arg.startsWith("--iterations=")) out.iterations = Math.max(1, Number(arg.split("=")[1]) || 10);
    if (arg.startsWith("--runtimes=")) {
      out.runtimes = arg.split("=")[1].split(",").map(item => item.trim()).filter(Boolean);
    }
  }
  if (process.env.INOX_BENCH_RUNTIMES) {
    out.runtimes = process.env.INOX_BENCH_RUNTIMES.split(",").map(item => item.trim()).filter(Boolean);
  }
  if (process.env.INOX_BENCH_ITERATIONS) {
    out.iterations = Math.max(1, Number(process.env.INOX_BENCH_ITERATIONS) || out.iterations);
  }
  return out;
}

function readPkgVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function round(value) {
  return Math.round(value * 100) / 100;
}