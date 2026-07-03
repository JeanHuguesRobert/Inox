/**
 * Session actor loop: cognitive packets on stdin → packets on stdout.
 * Fulfillments are reinjected as turn packets on the same stream.
 */
import readline from "node:readline";
import { handleTurn } from "./session-runner.mjs";
import { INOX_SESSION_PROTOCOL, PACKET, packet, validateTurnPacket } from "./session-protocol.mjs";
import { clearSessions } from "./session-store.mjs";

process.stderr.write(`[inox-session-sidecar] protocol=${INOX_SESSION_PROTOCOL} pid=${process.pid}\n`);
process.stdout.write(`${JSON.stringify(packet(PACKET.READY, { pid: process.pid }))}\n`);

const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let raw;
  try {
    raw = JSON.parse(trimmed);
  } catch (error) {
    write(packet(PACKET.ERROR, { ok: false, error: "invalid_json", message: error.message }));
    return;
  }

  if (raw?.type === "ping") {
    write(packet(PACKET.PONG, { id: raw.id }));
    return;
  }

  const validated = validateTurnPacket(raw);
  if (!validated.ok) {
    write(packet(PACKET.ERROR, { ok: false, error: validated.error, turn_id: raw?.id }));
    return;
  }

  handleTurn(validated.packet, {
    env: process.env,
    timeout_ms: Number(process.env.INOX_SERVE_TIMEOUT_MS || 30000),
  })
    .then(write)
    .catch(error => write(packet(PACKET.ERROR, {
      ok: false,
      error: "sidecar_turn_failed",
      message: error.message,
      turn_id: raw.id,
    })));
});

rl.on("close", () => {
  clearSessions();
  process.exit(0);
});

function write(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}