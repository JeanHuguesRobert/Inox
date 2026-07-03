/**
 * Persistent sidecar: reads NDJSON jobs on stdin, runs each via bin/inox.js (fresh isolate).
 * Amortizes pool management; full Inox reuse awaits runtime reset (see issue #23).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = process.env.INOX_SERVE_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const launcher = path.join(root, "bin", "inox.js");
const defaultTimeoutMs = Number(process.env.INOX_SERVE_TIMEOUT_MS || 30000);

process.chdir(root);
process.stderr.write(`[inox-sidecar] ready pid=${process.pid}\n`);
process.stdout.write(`${JSON.stringify({ type: "ready", pid: process.pid })}\n`);

const rl = readline.createInterface({ input: process.stdin });
let busy = false;
const pending = [];

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let job;
  try {
    job = JSON.parse(trimmed);
  } catch (error) {
    writeResult({
      type: "result",
      ok: false,
      exit_code: 1,
      stdout: "",
      stderr: `invalid_job_json:${error.message}`,
      runtime: "sidecar",
      error: "invalid_job_json",
    });
    return;
  }
  if (job?.type === "ping") {
    writeResult({ type: "pong", id: job.id });
    return;
  }
  if (job?.type !== "run") return;
  pending.push(job);
  pump();
});

rl.on("close", () => process.exit(0));

function pump() {
  if (busy || !pending.length) return;
  busy = true;
  const job = pending.shift();
  runJob(job)
    .then(result => writeResult({ type: "result", ...result, id: job.id }))
    .catch(error => writeResult({
      type: "result",
      id: job.id,
      ok: false,
      exit_code: 1,
      stdout: "",
      stderr: String(error?.stack || error?.message || error),
      runtime: "sidecar",
      error: "sidecar_run_failed",
    }))
    .finally(() => {
      busy = false;
      pump();
    });
}

function writeResult(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function runJob(job) {
  const timeoutMs = Number(job.timeout_ms || defaultTimeoutMs);
  const args = job.file
    ? [launcher, job.file]
    : [launcher, "-e", job.source];
  const childEnv = {
    ...process.env,
    INOX_VERBOSE: "",
  };
  if (job.input && typeof job.input === "object") {
    childEnv.INOX_RUN_INPUT = JSON.stringify(job.input);
  }

  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });

    child.on("close", code => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && code === 0,
        stdout,
        stderr,
        exit_code: timedOut ? 124 : (code ?? 1),
        timed_out: timedOut,
        runtime: "sidecar",
      });
    });

    child.on("error", error => {
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exit_code: 1,
        timed_out: false,
        runtime: "sidecar",
      });
    });
  });
}