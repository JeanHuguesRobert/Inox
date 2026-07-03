/**
 * Pool of inox-session-sidecar processes (packet loop actors).
 */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sidecarScript = path.join(root, "scripts", "serve", "inox-session-sidecar.mjs");

export function createSessionPool(options = {}) {
  const size = Math.max(1, Number(options.size || process.env.INOX_SERVE_SESSION_WORKERS || Math.min(2, os.cpus().length || 1)));
  const slots = [];
  const queue = [];
  let turnSeq = 0;

  for (let index = 0; index < size; index++) {
    spawnSlot(index);
  }

  function spawnSlot(index) {
    const child = spawn(process.execPath, [sidecarScript], {
      cwd: root,
      env: { ...process.env, INOX_SERVE_ROOT: root },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const slot = {
      index,
      child,
      busy: false,
      ready: false,
      buffer: "",
      pending: null,
    };
    slots[index] = slot;

    child.stdout.on("data", chunk => {
      slot.buffer += chunk;
      let newlineAt;
      while ((newlineAt = slot.buffer.indexOf("\n")) >= 0) {
        const line = slot.buffer.slice(0, newlineAt).trim();
        slot.buffer = slot.buffer.slice(newlineAt + 1);
        if (!line) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          continue;
        }
        if (message?.type === "ready") {
          slot.ready = true;
          pump();
          continue;
        }
        if (slot.pending && message?.turn_id === slot.pending.turn_id) {
          const pending = slot.pending;
          slot.pending = null;
          slot.busy = false;
          pending.resolve(message);
          pump();
        }
      }
    });

    child.stderr.on("data", chunk => {
      if (process.env.INOX_SERVE_DEBUG) {
        process.stderr.write(`[session-${index}] ${chunk}`);
      }
    });

    child.on("close", () => {
      const pending = slot.pending;
      slot.pending = null;
      slot.busy = false;
      slot.ready = false;
      if (pending) {
        pending.resolve({
          type: "error",
          ok: false,
          error: "session_sidecar_exited",
          turn_id: pending.turn_id,
        });
      }
      setTimeout(() => spawnSlot(index), 50);
    });
  }

  function slotForSession(sessionId) {
    if (!sessionId) {
      return slots.find(item => item?.ready && !item.busy && item.child?.stdin?.writable) || null;
    }
    const preferred = slots[hashSession(sessionId) % slots.length];
    if (preferred?.ready && !preferred.busy && preferred.child?.stdin?.writable) return preferred;
    return slots.find(item => item?.ready && !item.busy && item.child?.stdin?.writable) || null;
  }

  function pump() {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      const slot = slotForSession(job.turn_packet?.session_id || null);
      if (!slot) continue;
      queue.splice(i, 1);
      slot.busy = true;
      slot.pending = job;
      slot.child.stdin.write(`${JSON.stringify(job.turn_packet)}\n`);
      i -= 1;
    }
  }

  function hashSession(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  function turn(turnPacket, timeoutMs) {
    const turnId = turnPacket.id || `turn-${++turnSeq}`;
    const packetWithId = { ...turnPacket, id: turnId };
    return new Promise((resolve) => {
      let settled = false;
      const timer = timeoutMs > 0
        ? setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve({
            type: "error",
            ok: false,
            error: "session_pool_timeout",
            turn_id: turnId,
          });
        }, timeoutMs + 5000)
        : null;

      queue.push({
        turn_id: turnId,
        turn_packet: packetWithId,
        resolve: (result) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          resolve(result);
        },
      });
      pump();
    });
  }

  async function close() {
    for (const slot of slots) {
      slot?.child?.stdin?.end();
      slot?.child?.kill("SIGTERM");
    }
  }

  return { size, turn, close };
}