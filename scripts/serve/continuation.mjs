/**
 * Inox serve continuations — inversion of control for external capabilities.
 * Aligned with cogentia.continuation.v2 and COP cop/continuation semantics.
 */
import crypto from "node:crypto";

export const INOX_CONTINUATION_PROTOCOL = "inox.continuation.v1";

const store = new Map();

export function continuationRequired({ kind, title, pending, state = {}, subject = {} }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const continuation = {
    type: "continuation",
    protocol: INOX_CONTINUATION_PROTOCOL,
    id,
    status: "active",
    kind: kind || "capability",
    title: title || "External capability required",
    subject,
    pending,
    state,
    expected_response: {
      format: "json",
      required: ["fulfillments"],
      fulfillments_shape: {
        id: "pending step id",
        ok: true,
        result: {},
      },
    },
    created_at: now,
    updated_at: now,
  };
  store.set(id, continuation);
  return {
    ok: false,
    status: "continuation_required",
    protocol: INOX_CONTINUATION_PROTOCOL,
    continuation,
    resume: {
      method: "POST",
      path: "/continuation/fulfill",
      body: { continuation_id: id, fulfillments: [] },
    },
  };
}

export function getContinuation(id) {
  return store.get(String(id || "")) || null;
}

export function fulfillContinuation(id, fulfillments = []) {
  const continuation = getContinuation(id);
  if (!continuation) return { ok: false, error: "continuation_not_found" };
  if (continuation.status !== "active") {
    return { ok: false, error: "continuation_not_active", status: continuation.status };
  }

  const byId = new Map(
    (Array.isArray(fulfillments) ? fulfillments : []).map(item => [String(item.id || ""), item])
  );
  const resolved = [];
  const missing = [];

  for (const step of continuation.pending || []) {
    const answer = byId.get(step.id);
    if (!answer || answer.ok === false) {
      missing.push(step.id);
      continue;
    }
    resolved.push({ step, result: answer.result });
  }

  if (missing.length) {
    return {
      ok: false,
      error: "continuation_incomplete",
      missing,
      continuation,
    };
  }

  continuation.status = "resolved";
  continuation.updated_at = new Date().toISOString();
  continuation.resolution = { fulfillments: [...byId.values()] };
  store.set(id, continuation);

  return {
    ok: true,
    continuation,
    resolved,
  };
}

export function clearContinuations() {
  store.clear();
}