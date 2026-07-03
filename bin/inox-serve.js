#!/usr/bin/env node
/*
 * inox-serve.js — minimal remote Inox interpreter (proto fulfiller)
 *
 *   GET  /health
 *   POST /run                      sidecar pool (default), worker, or process
 *   POST /retrieval/batch          Cogentia retrieval contract
 *   POST /continuation/fulfill     IoC resume for inox.continuation.v1
 *   POST /session/turn             inox.session.v1 cognitive packet loop
 *
 * Env:
 *   INOX_SERVE_HOST=127.0.0.1
 *   INOX_SERVE_PORT=8792
 *   INOX_SERVE_TOKEN=...           optional Bearer auth
 *   INOX_SERVE_TIMEOUT_MS=30000
 *   INOX_SERVE_RUNTIME=sidecar|worker|process   default sidecar
 *   INOX_SERVE_WORKERS=4           pool size (sidecar or worker)
 */
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import crypto from "node:crypto";
import { createSidecarPool } from "../scripts/serve/sidecar-pool.js";
import { createWorkerPool } from "../scripts/serve/worker-pool.js";
import { createSessionPool } from "../scripts/serve/session-pool.js";
import { fulfillContinuation } from "../scripts/serve/continuation.js";
import { INOX_SESSION_PROTOCOL, PACKET, packet } from "../scripts/serve/session-protocol.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.INOX_SERVE_HOST || "127.0.0.1";
const port = Number(process.env.INOX_SERVE_PORT || 8792);
const token = String(process.env.INOX_SERVE_TOKEN || "");
const timeoutMs = Number(process.env.INOX_SERVE_TIMEOUT_MS || 30000);
const runtimeName = String(process.env.INOX_SERVE_RUNTIME || "sidecar").toLowerCase();
const runtime = ["sidecar", "worker", "process"].includes(runtimeName) ? runtimeName : "sidecar";
const maxSourceBytes = 64 * 1024;
const maxBodyBytes = 256 * 1024;
const launcher = path.join(root, "bin", "inox.js");
const retrievalModuleUrl = pathToFileURL(path.join(root, "scripts", "remote", "retrieval-batch.js")).href;
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
let packBatchFn = null;
let resumePackBatchFn = null;
const runPool = runtime === "sidecar"
  ? createSidecarPool()
  : (runtime === "worker" ? createWorkerPool() : null);
const sessionPool = createSessionPool();

const allowDirs = [
  path.join(root, "examples"),
  path.join(root, "scripts", "remote"),
  path.join(root, "lib", "test"),
].map(item => path.resolve(item) + path.sep);

if (!token && host !== "127.0.0.1" && host !== "::1" && host !== "localhost") {
  console.error("[inox-serve] warning: INOX_SERVE_TOKEN unset while binding to non-loopback host");
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, {
        ok: true,
        service: "inox-remote",
        version: pkg.version || "0.4.0",
        auth_required: Boolean(token),
        runtime,
        pool_size: runPool?.size || 0,
        vm_reset_required_for_reuse: runtime === "worker",
        vm_reset_issue: "https://github.com/JeanHuguesRobert/Inox/issues/23",
        continuation_protocol: "inox.continuation.v1",
        session_protocol: INOX_SESSION_PROTOCOL,
        session_pool_size: sessionPool.size,
        routes: ["/health", "/run", "/retrieval/batch", "/continuation/fulfill", "/session/turn"],
      });
    }

    if (req.method === "POST" && req.url === "/session/turn") {
      if (!authorized(req)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
      let payload;
      try {
        payload = JSON.parse(await readBody(req, maxBodyBytes) || "{}");
      } catch (error) {
        const status = error.message === "request_body_too_large" ? 413 : 400;
        return sendJson(res, status, { ok: false, error: error.message });
      }
      const started = Date.now();
      const result = await sessionTurn(payload);
      const status = result.type === PACKET.CONTINUATION
        ? 202
        : (result.type === PACKET.CANCELLED ? 409 : (result.ok === false ? 400 : 200));
      return sendJson(res, status, {
        ...result,
        duration_ms: Date.now() - started,
        transport: "http/session/turn",
      });
    }

    if (req.method === "POST" && req.url === "/retrieval/batch") {
      if (!authorized(req)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
      let payload;
      try {
        payload = JSON.parse(await readBody(req, maxBodyBytes) || "{}");
      } catch (error) {
        const status = error.message === "request_body_too_large" ? 413 : 400;
        return sendJson(res, status, { ok: false, error: error.message });
      }
      const started = Date.now();
      const result = await retrievalBatch(payload);
      const status = result.status === "continuation_required" ? 202 : (result.ok ? 200 : 400);
      return sendJson(res, status, {
        ...result,
        duration_ms: Date.now() - started,
        fulfiller: "retrieval-batch.js",
      });
    }

    if (req.method === "POST" && req.url === "/continuation/fulfill") {
      if (!authorized(req)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
      let payload;
      try {
        payload = JSON.parse(await readBody(req, maxBodyBytes) || "{}");
      } catch (error) {
        const status = error.message === "request_body_too_large" ? 413 : 400;
        return sendJson(res, status, { ok: false, error: error.message });
      }
      const started = Date.now();
      const result = await fulfillContinuationRequest(payload);
      const status = result.ok ? 200 : (result.error === "continuation_incomplete" ? 409 : 400);
      return sendJson(res, status, {
        ...result,
        duration_ms: Date.now() - started,
      });
    }

    if (req.method === "POST" && req.url === "/run") {
      if (!authorized(req)) return sendJson(res, 401, { ok: false, error: "unauthorized" });
      let payload;
      try {
        payload = JSON.parse(await readBody(req, maxBodyBytes) || "{}");
      } catch (error) {
        const status = error.message === "request_body_too_large" ? 413 : 400;
        return sendJson(res, status, { ok: false, error: error.message });
      }
      const result = await runRequest(payload);
      return sendJson(res, result.ok ? 200 : 400, result);
    }

    return sendJson(res, 404, { ok: false, error: "not_found" });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: "server_error", message: error.message });
  }
});

server.listen(port, host, () => {
  console.error(`[inox-serve] listening on http://${host}:${port} runtime=${runtime}`);
});

process.on("SIGTERM", async () => {
  await runPool?.close();
  await sessionPool?.close();
  server.close();
});

async function sessionTurn(payload) {
  const event = payload.event && typeof payload.event === "object" ? payload.event : null;
  if (!event?.kind) {
    return packet(PACKET.ERROR, { ok: false, error: "missing_event", message: "Provide event.kind" });
  }
  const turnPacket = packet(PACKET.TURN, {
    id: payload.id || crypto.randomUUID(),
    session_id: payload.session_id || undefined,
    state: payload.state && typeof payload.state === "object" ? payload.state : {},
    event,
  });
  return sessionPool.turn(turnPacket, timeoutMs);
}

function authorized(req) {
  if (!token) return true;
  const header = String(req.headers.authorization || "");
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  return bearer === token;
}

async function runRequest(payload) {
  const started = Date.now();
  const source = typeof payload.source === "string" ? payload.source : "";
  const file = typeof payload.file === "string" ? payload.file.trim() : "";
  const input = payload.input && typeof payload.input === "object" ? payload.input : null;

  if (source && file) {
    return { ok: false, error: "ambiguous_request", message: "Provide source or file, not both." };
  }
  if (!source && !file) {
    return { ok: false, error: "missing_request", message: "Provide source or file." };
  }

  let mode;
  let resolvedFile;
  if (file) {
    const resolved = resolveAllowedFile(file);
    if (!resolved.ok) return resolved;
    resolvedFile = resolved.path;
    mode = "file";
  } else {
    if (Buffer.byteLength(source, "utf8") > maxSourceBytes) {
      return { ok: false, error: "source_too_large", max_bytes: maxSourceBytes };
    }
    mode = "source";
  }

  const ran = runPool
    ? await runPool.run({
      file: resolvedFile,
      source: source || undefined,
      input,
    }, timeoutMs)
    : await runChildProcess({
      file: resolvedFile,
      source: source || undefined,
      input,
    }, timeoutMs);

  const jsonLine = ran.stdout.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith("{")).pop();
  let result_json;
  if (jsonLine) {
    try {
      result_json = JSON.parse(jsonLine);
    } catch {}
  }
  return {
    ok: ran.exit_code === 0,
    mode,
    runtime,
    file: file || undefined,
    result_json,
    stdout: ran.stdout,
    stderr: ran.stderr,
    exit_code: ran.exit_code,
    duration_ms: Date.now() - started,
    timed_out: ran.timed_out,
  };
}

function resolveAllowedFile(file) {
  const resolved = path.resolve(root, file);
  if (!allowDirs.some(prefix => resolved.startsWith(prefix))) {
    return { ok: false, error: "forbidden_file", message: "File must live under examples/, scripts/remote/, or lib/test/." };
  }
  if (!fs.existsSync(resolved)) {
    return { ok: false, error: "file_not_found", file };
  }
  return { ok: true, path: resolved };
}

async function retrievalBatch(payload) {
  await loadRetrievalModule();
  return packBatchFn(payload, process.env);
}

async function fulfillContinuationRequest(payload) {
  const continuationId = String(payload.continuation_id || "");
  const fulfillments = Array.isArray(payload.fulfillments) ? payload.fulfillments : [];
  const fulfilled = fulfillContinuation(continuationId, fulfillments);
  if (!fulfilled.ok) return fulfilled;

  const continuation = fulfilled.continuation;
  const operation = continuation?.state?.operation;
  if (operation === "retrieval.batch") {
    await loadRetrievalModule();
    const resumed = await resumePackBatchFn(continuation, fulfilled.resolved, process.env);
    return {
      ...resumed,
      continuation_id: continuationId,
      continuation_status: continuation.status,
    };
  }

  return {
    ok: true,
    continuation_id: continuationId,
    continuation_status: continuation.status,
    resolved: fulfilled.resolved,
    message: "Continuation fulfilled; no automatic resume handler for this operation.",
  };
}

async function loadRetrievalModule() {
  if (!packBatchFn) {
    const mod = await import(retrievalModuleUrl);
    packBatchFn = mod.packBatch;
    resumePackBatchFn = mod.resumePackBatch;
  }
}

async function runChildProcess(job, timeout) {
  const args = job.file
    ? [launcher, job.file]
    : [launcher, "-e", job.source];
  const childEnv = {};
  if (job.input) childEnv.INOX_RUN_INPUT = JSON.stringify(job.input);
  return runChild(args, timeout, childEnv);
}

function runChild(args, timeout, extraEnv = {}) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: {
        ...process.env,
        ...extraEnv,
        INOX_VERBOSE: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);

    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });

    child.on("close", code => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exit_code: timedOut ? 124 : (code ?? 1),
        timed_out: timedOut,
        runtime: "process",
      });
    });

    child.on("error", error => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exit_code: 1,
        timed_out: false,
        runtime: "process",
      });
    });
  });
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (Buffer.byteLength(data, "utf8") > maxBytes) {
        reject(new Error("request_body_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}