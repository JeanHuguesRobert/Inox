/**
 * Pool of persistent inox-sidecar child processes (FastCGI-style dispatchers).
 */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sidecarScript = path.join(root, "scripts", "serve", "inox-sidecar.mjs");

export function createSidecarPool(options = {}) {
  const size = Math.max(1, Number(options.size || process.env.INOX_SERVE_WORKERS || Math.min(4, os.cpus().length || 2)));
  const slots = [];
  const queue = [];
  let jobSeq = 0;

  for (let index = 0; index < size; index++) {
    spawnSlot(index);
  }

  function spawnSlot(index) {
    const child = spawn(process.execPath, [sidecarScript], {
      cwd: root,
      env: {
        ...process.env,
        INOX_SERVE_ROOT: root,
      },
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
        if (message?.type === "result" && slot.pending) {
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
        process.stderr.write(`[sidecar-${index}] ${chunk}`);
      }
    });

    child.on("close", () => {
      const pending = slot.pending;
      slot.pending = null;
      slot.busy = false;
      slot.ready = false;
      if (pending) {
        pending.resolve({
          ok: false,
          exit_code: 1,
          stdout: "",
          stderr: "sidecar_exited",
          runtime: "sidecar",
          error: "sidecar_exited",
        });
      }
      setTimeout(() => spawnSlot(index), 50);
    });
  }

  function pump() {
    while (queue.length) {
      const slot = slots.find(item => item?.ready && !item.busy && item.child?.stdin?.writable);
      if (!slot) return;
      const job = queue.shift();
      slot.busy = true;
      slot.pending = job;
      slot.child.stdin.write(`${JSON.stringify({
        type: "run",
        id: job.id,
        file: job.file,
        source: job.source,
        input: job.input,
        timeout_ms: job.timeout_ms,
      })}\n`);
    }
  }

  function run(job, timeoutMs) {
    const id = `job-${++jobSeq}`;
    return new Promise((resolve) => {
      let settled = false;
      const timer = timeoutMs > 0
        ? setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve({
            ok: false,
            exit_code: 124,
            stdout: "",
            stderr: "sidecar_pool_timeout",
            timed_out: true,
            runtime: "sidecar",
          });
        }, timeoutMs + 5000)
        : null;

      queue.push({
        id,
        file: job.file,
        source: job.source,
        input: job.input,
        timeout_ms: timeoutMs,
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

  return { size, run, close };
}