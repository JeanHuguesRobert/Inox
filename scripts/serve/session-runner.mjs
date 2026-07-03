/**
 * One session turn: mandate, continuation emission, fulfillment reinjection.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fulfillContinuation, getContinuation } from "./continuation.mjs";
import {
  COP_ARTIFACT_CONTINUATION,
  EVENT,
  PACKET,
  packet,
} from "./session-protocol.mjs";
import { getOrCreateSession, touchSession } from "./session-store.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const launcher = path.join(root, "bin", "inox.js");
const retrievalModuleUrl = pathToFileURL(path.join(root, "scripts", "remote", "retrieval-batch.mjs")).href;
const allowDirs = [
  path.join(root, "examples"),
  path.join(root, "scripts", "remote"),
  path.join(root, "lib", "test"),
].map(item => path.resolve(item) + path.sep);

let packBatchFn = null;
let resumePackBatchFn = null;

export async function handleTurn(turnPacket, options = {}) {
  const env = options.env || process.env;
  const timeoutMs = Number(options.timeout_ms || process.env.INOX_SERVE_TIMEOUT_MS || 30000);
  const started = Date.now();
  const turnId = turnPacket.id;
  const session = getOrCreateSession(turnPacket.session_id || null);

  if (turnPacket.state && typeof turnPacket.state === "object") {
    session.state = { ...session.state, ...turnPacket.state };
  }

  const event = turnPacket.event || {};
  let response;

  try {
    switch (event.kind) {
      case EVENT.MANDATE_RUN:
        response = await handleMandateRun(session, event, env, timeoutMs);
        break;
      case EVENT.RETRIEVAL_BATCH:
        response = await handleRetrievalBatch(session, event, env);
        break;
      case EVENT.FULFILLMENT:
        response = await handleFulfillment(session, event, env);
        break;
      case EVENT.CANCEL:
        response = handleCancel(session, event);
        break;
      default:
        response = packet(PACKET.ERROR, {
          session_id: session.id,
          turn_id: turnId,
          ok: false,
          error: "unknown_event_kind",
          message: `Unsupported event.kind: ${event.kind}`,
        });
    }
  } catch (error) {
    response = packet(PACKET.ERROR, {
      session_id: session.id,
      turn_id: turnId,
      ok: false,
      error: "turn_failed",
      message: error.message,
    });
  }

  touchSession(session, { last_packet_type: response.type });
  return {
    ...response,
    session_id: session.id,
    turn_id: turnId,
    duration_ms: Date.now() - started,
    session_turns: session.turns,
    state: session.state,
  };
}

async function handleMandateRun(session, event, env, timeoutMs) {
  const file = typeof event.file === "string" ? event.file.trim() : "";
  const source = typeof event.source === "string" ? event.source : "";
  if (!file && !source) {
    return packet(PACKET.ERROR, {
      ok: false,
      error: "missing_mandate",
      message: "mandate.run requires file or source",
    });
  }

  let args;
  if (file) {
    const resolved = resolveAllowedFile(file);
    if (!resolved.ok) {
      return packet(PACKET.ERROR, { ok: false, ...resolved });
    }
    args = [launcher, resolved.path];
  } else {
    args = [launcher, "-e", source];
  }

  const childEnv = { ...env, INOX_VERBOSE: "" };
  if (session.state.input && typeof session.state.input === "object") {
    childEnv.INOX_RUN_INPUT = JSON.stringify({
      state: session.state,
      event,
    });
  }

  const ran = await runChild(args, timeoutMs, childEnv);
  touchSession(session, {
    last_run: {
      file: file || undefined,
      exit_code: ran.exit_code,
      ok: ran.exit_code === 0,
    },
  });

  return packet(PACKET.RESULT, {
    ok: ran.exit_code === 0,
    event_kind: EVENT.MANDATE_RUN,
    body: {
      stdout: ran.stdout,
      stderr: ran.stderr,
      exit_code: ran.exit_code,
      timed_out: ran.timed_out,
    },
  });
}

async function handleRetrievalBatch(session, event, env) {
  await loadRetrieval();
  const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
  const result = await packBatchFn(payload, env);

  if (result.status === "continuation_required") {
    touchSession(session, {
      awaiting_continuation_id: result.continuation.id,
      last_operation: result.continuation.state?.operation,
    });
    return packet(PACKET.CONTINUATION, {
      ok: false,
      artifact_type: COP_ARTIFACT_CONTINUATION,
      continuation_protocol: result.protocol,
      continuation: result.continuation,
      resume: {
        event: {
          kind: EVENT.FULFILLMENT,
          continuation_id: result.continuation.id,
          fulfillments: [],
        },
      },
    });
  }

  touchSession(session, {
    awaiting_continuation_id: null,
    last_operation: "retrieval.batch",
    last_result_ok: result.ok,
  });

  return packet(PACKET.RESULT, {
    ok: result.ok,
    event_kind: EVENT.RETRIEVAL_BATCH,
    body: result,
  });
}

async function handleFulfillment(session, event, env) {
  const continuationId = String(event.continuation_id || session.state.awaiting_continuation_id || "");
  if (event.status === "cancelled") {
    const continuation = getContinuation(continuationId);
    if (continuation) {
      continuation.status = "cancelled";
      continuation.updated_at = new Date().toISOString();
    }
    touchSession(session, { awaiting_continuation_id: null, last_cancelled: continuationId });
    return packet(PACKET.CANCELLED, {
      ok: false,
      continuation_id: continuationId,
      message: event.reason || "continuation_cancelled",
    });
  }

  const fulfillments = Array.isArray(event.fulfillments) ? event.fulfillments : [];
  const fulfilled = fulfillContinuation(continuationId, fulfillments);
  if (!fulfilled.ok) {
    return packet(PACKET.ERROR, {
      ok: false,
      error: fulfilled.error,
      continuation_id: continuationId,
      missing: fulfilled.missing,
      continuation: fulfilled.continuation,
    });
  }

  const operation = fulfilled.continuation?.state?.operation;
  if (operation === "retrieval.batch") {
    await loadRetrieval();
    const resumed = await resumePackBatchFn(fulfilled.continuation, fulfilled.resolved, env);
    touchSession(session, {
      awaiting_continuation_id: null,
      last_operation: "retrieval.batch",
      last_result_ok: resumed.ok,
      last_resumed_from: continuationId,
    });
    return packet(PACKET.RESULT, {
      ok: resumed.ok,
      event_kind: EVENT.FULFILLMENT,
      continuation_id: continuationId,
      continuation_status: "resolved",
      body: resumed,
    });
  }

  touchSession(session, { awaiting_continuation_id: null });
  return packet(PACKET.RESULT, {
    ok: true,
    event_kind: EVENT.FULFILLMENT,
    continuation_id: continuationId,
    body: { resolved: fulfilled.resolved },
  });
}

function handleCancel(session, event) {
  const continuationId = String(event.continuation_id || session.state.awaiting_continuation_id || "");
  return handleFulfillment(session, {
    kind: EVENT.FULFILLMENT,
    continuation_id: continuationId,
    status: "cancelled",
    reason: event.reason || "cancelled_by_turn",
  });
}

function resolveAllowedFile(file) {
  const resolved = path.resolve(root, file);
  if (!allowDirs.some(prefix => resolved.startsWith(prefix))) {
    return { error: "forbidden_file", message: "File must live under examples/, scripts/remote/, or lib/test/." };
  }
  if (!fs.existsSync(resolved)) {
    return { error: "file_not_found", file };
  }
  return { ok: true, path: resolved };
}

function runChild(args, timeout, extraEnv = {}) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
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

async function loadRetrieval() {
  if (!packBatchFn) {
    const mod = await import(retrievalModuleUrl);
    packBatchFn = mod.packBatch;
    resumePackBatchFn = mod.resumePackBatch;
  }
}

