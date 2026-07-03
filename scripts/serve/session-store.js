import crypto from "node:crypto";

const sessions = new Map();

export function getOrCreateSession(sessionId = null) {
  const id = sessionId ? String(sessionId) : crypto.randomUUID();
  if (sessions.has(id)) return sessions.get(id);
  const session = {
    id,
    state: {},
    turns: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  sessions.set(id, session);
  return session;
}

export function getSession(sessionId) {
  return sessions.get(String(sessionId || "")) || null;
}

export function touchSession(session, patch = {}) {
  session.state = { ...session.state, ...patch };
  session.turns += 1;
  session.updated_at = new Date().toISOString();
  return session;
}

export function clearSessions() {
  sessions.clear();
}