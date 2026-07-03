#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const token = "test-inox-serve-token";

const child = spawn(process.execPath, ["bin/inox-serve.js"], {
  cwd: root,
  env: {
    ...process.env,
    INOX_SERVE_HOST: "127.0.0.1",
    INOX_SERVE_PORT: String(port),
    INOX_SERVE_TOKEN: token,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", chunk => { stderr += chunk; });

try {
  await waitForHealth();

  const health = await getJson("/health");
  assert.equal(health.ok, true);
  assert.equal(health.service, "inox-remote");
  assert.equal(health.auth_required, true);

  const unauthorized = await fetch(`${base}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: "examples/remote-ping.nox" }),
  });
  assert.equal(unauthorized.status, 401);

  const fileRun = await postJson("/run", { file: "examples/remote-ping.nox" });
  assert.equal(fileRun.ok, true);
  assert.match(fileRun.stdout, /inox-remote-ping ok/);
  assert.equal(fileRun.exit_code, 0);

  const sourceRun = await postJson("/run", { source: "\"source-run ok\" out \"\\n\" out 0 exit" });
  assert.equal(sourceRun.ok, true);
  assert.match(sourceRun.stdout, /source-run ok/);

  const forbidden = await postJson("/run", { file: "lib/bootstrap.nox" }, { expectOk: false });
  assert.equal(forbidden.error, "forbidden_file");

  console.log(JSON.stringify({
    ok: true,
    port,
    file_run_ms: fileRun.duration_ms,
    source_run_ms: sourceRun.duration_ms,
  }, null, 2));
} finally {
  child.kill();
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`inox-serve did not start: ${stderr}`);
}

async function getJson(route) {
  const response = await fetch(`${base}${route}`);
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function postJson(route, payload, options = {}) {
  const response = await fetch(`${base}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (options.expectOk === false) {
    assert.equal(response.ok, false, JSON.stringify(body));
    return body;
  }
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
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