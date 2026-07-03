#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const token = "test-retrieval-batch-token";
const surveyEnv = loadSurveyEnv();

const child = spawn(process.execPath, ["bin/inox-serve.js"], {
  cwd: root,
  env: {
    ...process.env,
    ...surveyEnv,
    INOX_SERVE_HOST: "127.0.0.1",
    INOX_SERVE_PORT: String(port),
    INOX_SERVE_TOKEN: token,
    INOX_SERVE_TIMEOUT_MS: "60000",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", chunk => { stderr += chunk; });

try {
  await waitForHealth();

  if (!surveyEnv.SUPABASE_URL) {
    const missing = await postJson("/retrieval/batch", {
      queries: ["FractaVolta"],
      mode: "hybrid",
      corpus_key: "cogentia-public",
      limit: 2,
      budget: 1000,
    }, { expectStatus: 202 });
    assert.equal(missing.status, "continuation_required");
    assert.equal(missing.protocol, "inox.continuation.v1");
  }

  if (surveyEnv.SUPABASE_URL && surveyEnv.SUPABASE_SERVICE_ROLE_KEY && surveyEnv.OPENAI_API_KEY) {
    const batch = await postJson("/retrieval/batch", {
      queries: ["FractaVolta public Guide"],
      mode: "hybrid",
      corpus_key: "cogentia-public",
      limit: 2,
      budget: 2000,
    });
    assert.equal(batch.ok, true);
    assert.equal(batch.strategy, "retrieval-supabase-batch-v1");
    assert.ok(batch.packs[0].sources.length > 0);
  }

  console.log(JSON.stringify({
    ok: true,
    live_supabase: Boolean(surveyEnv.SUPABASE_URL),
    retrieval_route: true,
  }, null, 2));
} finally {
  child.kill();
}

function loadSurveyEnv() {
  const file = path.join(root, "..", "survey", ".env");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY)=(.+)$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
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
  if (options.expectStatus) {
    assert.equal(response.status, options.expectStatus, JSON.stringify(body));
    return body;
  }
  if (options.expectFailure) {
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