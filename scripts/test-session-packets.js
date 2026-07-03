#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EVENT, PACKET } from "./serve/session-protocol.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const token = "test-session-packets-token";

const child = spawn(process.execPath, ["bin/inox-serve.js"], {
  cwd: root,
  env: {
    ...process.env,
    INOX_SERVE_HOST: "127.0.0.1",
    INOX_SERVE_PORT: String(port),
    INOX_SERVE_TOKEN: token,
    INOX_SERVE_SESSION_WORKERS: "1",
    SUPABASE_URL: "",
    OPENAI_API_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", chunk => { stderr += chunk; });

try {
  await waitForHealth();

  const health = await getJson(`${base}/health`);
  assert.equal(health.session_protocol, "inox.session.v1");
  assert.ok(health.session_pool_size >= 1);

  const turn1 = await postTurn({
    event: {
      kind: EVENT.RETRIEVAL_BATCH,
      payload: {
        queries: ["session packet test"],
        mode: "keyword",
        corpus_key: "cogentia-public",
        limit: 1,
        budget: 500,
      },
    },
  }, { expectStatus: 202 });

  assert.equal(turn1.type, PACKET.CONTINUATION);
  assert.equal(turn1.artifact_type, "cop/continuation");
  assert.ok(turn1.session_id);
  assert.ok(turn1.continuation?.pending?.length >= 1);

  const fulfillments = turn1.continuation.pending.map(step => ({
    id: step.id,
    ok: true,
    result: {
      ok: true,
      data: [{
        source_id: "doc:session",
        text: "session packet loop ok",
        repo: "cogentia",
        path: "docs/session.md",
        title: "Session",
      }],
    },
  }));

  const turn2 = await postTurn({
    session_id: turn1.session_id,
    event: {
      kind: EVENT.FULFILLMENT,
      continuation_id: turn1.continuation.id,
      fulfillments,
    },
  });

  assert.equal(turn2.type, PACKET.RESULT);
  assert.equal(turn2.ok, true);
  assert.equal(turn2.session_id, turn1.session_id);
  assert.ok(turn2.body?.packs?.[0]?.sources?.length > 0);

  const turn3 = await postTurn({
    session_id: turn1.session_id,
    event: {
      kind: EVENT.MANDATE_RUN,
      file: "examples/remote-ping.nox",
    },
  });

  assert.equal(turn3.type, PACKET.RESULT);
  assert.equal(turn3.ok, true);
  assert.match(turn3.body.stdout, /inox-remote-ping ok/);
  assert.ok(turn3.session_turns >= 3);

  console.log(JSON.stringify({
    ok: true,
    session_id: turn1.session_id,
    loop: "retrieval.continuation → fulfillment → mandate.run",
    session_turns: turn3.session_turns,
  }, null, 2));
} finally {
  child.kill();
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 80; attempt++) {
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

async function postTurn(payload, options = {}) {
  const response = await fetch(`${base}/session/turn`, {
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