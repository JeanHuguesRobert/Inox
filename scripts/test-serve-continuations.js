#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearContinuations } from "./serve/continuation.js";
import { packBatch, resumePackBatch } from "./remote/retrieval-batch.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

clearContinuations();

const unit = await packBatch({
  queries: ["FractaVolta"],
  mode: "hybrid",
  corpus_key: "cogentia-public",
  limit: 2,
  budget: 1000,
}, {
  SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  OPENAI_API_KEY: "",
});

assert.equal(unit.status, "continuation_required");
assert.equal(unit.protocol, "inox.continuation.v1");
assert.ok(unit.continuation.pending.length >= 2);

const fulfillments = unit.continuation.pending.map(step => {
  if (step.capability === "openai.embeddings") {
    return { id: step.id, ok: true, result: { ok: true, embedding: [0.1, 0.2, 0.3] } };
  }
  if (step.request.fn === "match_retrieval_chunks") {
    return {
      id: step.id,
      ok: true,
      result: {
        ok: true,
        data: [{
          source_id: "doc:test",
          text: "FractaVolta public Guide excerpt",
          repo: "cogentia",
          path: "docs/guide.md",
          title: "Guide",
        }],
      },
    };
  }
  return {
    id: step.id,
    ok: true,
    result: { ok: true, data: [] },
  };
});

const resumed = await resumePackBatch(unit.continuation, unit.continuation.pending.map((step, index) => ({
  step,
  result: fulfillments[index].result,
})));

assert.equal(resumed.ok, true);
assert.equal(resumed.strategy, "retrieval-supabase-batch-v1");
assert.ok(resumed.packs[0].sources.length > 0);

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const token = "test-serve-continuations-token";

const child = spawn(process.execPath, ["bin/inox-serve.js"], {
  cwd: root,
  env: {
    ...process.env,
    INOX_SERVE_HOST: "127.0.0.1",
    INOX_SERVE_PORT: String(port),
    INOX_SERVE_TOKEN: token,
    INOX_SERVE_RUNTIME: "sidecar",
    SUPABASE_URL: "",
    OPENAI_API_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", chunk => { stderr += chunk; });

try {
  await waitForHealth(base, stderr);

  const health = await getJson(`${base}/health`);
  assert.equal(health.runtime, "sidecar");
  assert.ok(health.pool_size >= 1);

  const continuation = await postJson(`${base}/retrieval/batch`, {
    queries: ["test query"],
    mode: "keyword",
    corpus_key: "cogentia-public",
    limit: 1,
    budget: 500,
  }, token, { expectStatus: 202 });
  assert.equal(continuation.status, "continuation_required");

  const fulfill = await postJson(`${base}/continuation/fulfill`, {
    continuation_id: continuation.continuation.id,
    fulfillments: continuation.continuation.pending.map(step => ({
      id: step.id,
      ok: true,
      result: {
        ok: true,
        data: [{
          source_id: "doc:remote",
          text: "remote continuation fulfill ok",
          repo: "cogentia",
          path: "docs/x.md",
          title: "X",
        }],
      },
    })),
  }, token);
  assert.equal(fulfill.ok, true);
  assert.ok(fulfill.packs[0].sources.length > 0);

  console.log(JSON.stringify({
    ok: true,
    unit_resume: true,
    http_continuation: true,
    runtime: health.runtime,
  }, null, 2));
} finally {
  child.kill();
  clearContinuations();
}

async function waitForHealth(base, stderr) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`inox-serve did not start: ${stderr}`);
}

async function getJson(url) {
  const response = await fetch(url);
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function postJson(url, payload, token, options = {}) {
  const response = await fetch(url, {
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