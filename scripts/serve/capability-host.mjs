/**
 * Capability host: fulfill inline when secrets exist, else emit continuation (IoC).
 */
import crypto from "node:crypto";
import { continuationRequired } from "./continuation.mjs";

export function createCapabilityHost(env = process.env, options = {}) {
  const inline = options.inline !== false;
  const fulfillments = options.fulfillments || null;

  async function request(capability, requestBody, meta = {}) {
    const injected = findInjectedFulfillment(fulfillments, capability, requestBody);
    if (injected) {
      return { ok: true, inline: false, injected: true, capability, result: injected };
    }

    if (inline && canInlineCapability(capability, env)) {
      const result = await inlineFulfill(capability, requestBody, env);
      return { ok: true, inline: true, capability, result };
    }

    const stepId = crypto.randomUUID();
    return {
      ok: false,
      continuation: true,
      step: {
        id: stepId,
        capability,
        request: requestBody,
        meta,
      },
    };
  }

  return { request, inlineEnabled: inline };
}

export function buildContinuationFromSteps(steps, state, subject) {
  return continuationRequired({
    kind: "capability",
    title: "Inox runtime requires external capability fulfillment",
    pending: steps.map(step => ({
      id: step.id,
      capability: step.capability,
      request: step.request,
      meta: step.meta || {},
    })),
    state,
    subject,
  });
}

function findInjectedFulfillment(fulfillments, capability, requestBody) {
  if (!fulfillments) return null;
  if (fulfillments instanceof Map) {
    for (const result of fulfillments.values()) {
      if (matchesFulfillment(result, capability, requestBody)) return result;
    }
    return null;
  }
  if (Array.isArray(fulfillments)) {
    for (const item of fulfillments) {
      if (item?.ok === false) continue;
      if (matchesFulfillment(item.result, capability, requestBody, item)) return item.result;
    }
  }
  return null;
}

function matchesFulfillment(result, capability, requestBody, envelope = null) {
  if (!result) return false;
  if (envelope?.capability && envelope.capability !== capability) return false;
  if (capability === "supabase.rpc") {
    return envelope?.request?.fn === requestBody.fn || result.fn === requestBody.fn;
  }
  if (capability === "openai.embeddings") {
    const input = requestBody.input;
    return envelope?.request?.input === input
      || (Array.isArray(result.embedding) && input !== undefined);
  }
  return true;
}

export function canInlineCapability(capability, env) {
  if (capability === "openai.embeddings") {
    return Boolean(env.OPENAI_API_KEY || env.COGENTIA_OPENAI_API_KEY);
  }
  if (capability === "supabase.rpc") {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return false;
}

async function inlineFulfill(capability, requestBody, env) {
  if (capability === "openai.embeddings") {
    return embedQuery(requestBody, env);
  }
  if (capability === "supabase.rpc") {
    return supabaseRpc(requestBody, env);
  }
  throw new Error(`unknown_capability:${capability}`);
}

async function embedQuery(body, env) {
  const apiKey = String(env.OPENAI_API_KEY || env.COGENTIA_OPENAI_API_KEY || "");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const parsed = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: "query_embedding_failed", message: parsed?.error?.message || response.statusText };
  }
  const embedding = parsed?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) return { ok: false, error: "invalid_embedding_response" };
  return { ok: true, embedding };
}

async function supabaseRpc(body, env) {
  const supabaseUrl = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "");
  const { fn, args } = body;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = typeof data === "object" ? (data.message || data.error || text) : text;
    return { ok: false, error: "supabase_rpc_failed", message, fn };
  }
  return { ok: true, data };
}