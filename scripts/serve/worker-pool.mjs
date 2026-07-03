/**
 * Fixed pool of worker_threads for Inox /run (avoids per-request process spawn).
 */
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const workerScript = path.join(root, "scripts", "serve", "inox-worker.mjs");

export function createWorkerPool(options = {}) {
  const size = Math.max(1, Number(options.size || process.env.INOX_SERVE_WORKERS || Math.min(4, os.cpus().length || 2)));
  const workers = [];
  const waiters = [];
  const queue = [];
  let jobSeq = 0;

  for (let index = 0; index < size; index++) {
    spawnWorker(index);
  }

  function spawnWorker(index) {
    const worker = new Worker(workerScript, { workerData: { root } });
    const slot = {
      index,
      worker,
      busy: false,
      ready: false,
    };
    workers[index] = slot;

    worker.on("message", (message) => {
      if (message?.type === "ready") {
        slot.ready = true;
        pump();
        return;
      }
      if (message?.type === "result") {
        const pending = slot.pending;
        slot.pending = null;
        slot.busy = false;
        if (pending) pending.resolve(message);
        pump();
      }
    });

    worker.on("error", (error) => {
      const pending = slot.pending;
      slot.pending = null;
      slot.busy = false;
      if (pending) {
        pending.resolve({
          ok: false,
          exit_code: 1,
          stdout: "",
          stderr: String(error?.message || error),
          runtime: "worker",
          error: "worker_error",
        });
      }
      worker.terminate().catch(() => {});
      setTimeout(() => spawnWorker(index), 50);
    });
  }

  function pump() {
    while (queue.length) {
      const slot = workers.find(item => item?.ready && !item.busy);
      if (!slot) return;
      const job = queue.shift();
      slot.busy = true;
      slot.pending = job;
      slot.worker.postMessage({
        type: "run",
        id: job.id,
        file: job.file,
        source: job.source,
        input: job.input,
      });
    }
    while (waiters.length) {
      const slot = workers.find(item => item?.ready && !item.busy);
      if (!slot) return;
      const resolve = waiters.shift();
      resolve(slot);
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
            stderr: "worker_timeout",
            timed_out: true,
            runtime: "worker",
          });
        }, timeoutMs)
        : null;

      const wrapped = {
        id,
        file: job.file,
        source: job.source,
        input: job.input,
        resolve: (result) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          resolve(result);
        },
      };

      queue.push(wrapped);
      pump();
    });
  }

  async function close() {
    await Promise.all(workers.map(slot => slot?.worker?.terminate().catch(() => {})));
  }

  return { size, run, close };
}