#!/usr/bin/env node
/*
 * inox-serve.js — minimal remote Inox interpreter (proto fulfiller)
 *
 *   GET  /health
 *   POST /run   { "source": "..." } | { "file": "...", "input": { ... } }
 *   POST /retrieval/batch   Cogentia retrieval contract (queries, corpus_key, mode, ...)
 *
 * Env:
 *   INOX_SERVE_HOST=127.0.0.1
 *   INOX_SERVE_PORT=8792
 *   INOX_SERVE_TOKEN=...        optional Bearer auth
 *   INOX_SERVE_TIMEOUT_MS=30000
 *
 * Bind defaults to loopback. Set a token before exposing beyond localhost.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.INOX_SERVE_HOST || "127.0.0.1";
const port = Number(process.env.INOX_SERVE_PORT || 8792);
const token = String(process.env.INOX_SERVE_TOKEN || "");
const timeoutMs = Number(process.env.INOX_SERVE_TIMEOUT_MS || 30000);
const maxSourceBytes = 64 * 1024;
const maxBodyBytes = 256 * 1024;
const launcher = path.join(root, "bin", "inox.js");
const retrievalModuleUrl = pathToFileURL(path.join(root, "scripts", "remote", "retrieval-batch.mjs")).href;
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
let packBatchFn = null;

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
        routes: ["/health", "/run", "/retrieval/batch"],
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
      return sendJson(res, result.ok ? 200 : 400, {
        ...result,
        duration_ms: Date.now() - started,
        fulfiller: "retrieval-batch.mjs",
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
  console.error(`[inox-serve] listening on http://${host}:${port}`);
});

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

  let args;
  let mode;
  const childEnv = {};
  if (input) {
    childEnv.INOX_RUN_INPUT = JSON.stringify(input);
  }

  if (file) {
    const resolved = resolveAllowedFile(file);
    if (!resolved.ok) return resolved;
    args = [launcher, resolved.path];
    mode = "file";
  } else {
    if (Buffer.byteLength(source, "utf8") > maxSourceBytes) {
      return { ok: false, error: "source_too_large", max_bytes: maxSourceBytes };
    }
    args = [launcher, "-e", source];
    mode = "source";
  }

  const ran = await runChild(args, timeoutMs, childEnv);
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
  if (!packBatchFn) {
    const mod = await import(retrievalModuleUrl);
    packBatchFn = mod.packBatch;
  }
  return packBatchFn(payload, process.env);
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
      });
    });

    child.on("error", error => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exit_code: 1,
        timed_out: false,
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