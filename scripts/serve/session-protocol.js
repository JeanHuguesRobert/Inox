/**
 * inox.session.v1 — cognitive packet framing for stateful actor loops.
 * Transport: one JSON packet per line (stdin/stdout); semantic unit = packet.
 */
import crypto from "node:crypto";

export const INOX_SESSION_PROTOCOL = "inox.session.v1";
export const COP_ARTIFACT_CONTINUATION = "cop/continuation";

export const PACKET = {
  READY: "ready",
  TURN: "turn",
  CONTINUATION: "continuation",
  RESULT: "result",
  ERROR: "error",
  CANCELLED: "cancelled",
  PONG: "pong",
};

export const EVENT = {
  MANDATE_RUN: "mandate.run",
  RETRIEVAL_BATCH: "retrieval.batch",
  FULFILLMENT: "fulfillment",
  CANCEL: "cancel",
};

export function packet(type, fields = {}) {
  return {
    protocol: INOX_SESSION_PROTOCOL,
    type,
    id: fields.id || crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...fields,
  };
}

export function validateTurnPacket(raw) {
  if (!raw || raw.protocol !== INOX_SESSION_PROTOCOL || raw.type !== PACKET.TURN) {
    return { ok: false, error: "invalid_turn_packet" };
  }
  if (!raw.event || typeof raw.event !== "object" || !raw.event.kind) {
    return { ok: false, error: "missing_event_kind" };
  }
  return { ok: true, packet: raw };
}