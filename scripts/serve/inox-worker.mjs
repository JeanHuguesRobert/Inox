/**
 * Worker thread: loads Inox once, runs .nox jobs via structured messages (by value).
 */
import fs from "node:fs";
import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import { pathToFileURL } from "node:url";

const root = workerData.root;

class InoxExit extends Error {
  constructor(code = 0) {
    super(`inox_exit:${code}`);
    this.name = "InoxExit";
    this.code = code;
  }
}

const originalExit = process.exit.bind(process);
process.exit = (code = 0) => {
  throw new InoxExit(Number(code) || 0);
};

const builds = pathToFileURL(path.join(root, "builds", "inox.js")).href;
const { inox } = await import(builds);
const runtime = inox();

let stdoutHooked = false;
let captured = [];
let originalWriteSync = null;

function hookStdout() {
  captured = [];
  if (stdoutHooked) return;

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => {
    captured.push(String(chunk));
    return true;
  };

  originalWriteSync = fs.writeSync.bind(fs);
  fs.writeSync = (fd, buffer, ...rest) => {
    if (fd === 1 || fd === process.stdout.fd) {
      const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : String(buffer);
      captured.push(text);
      return Buffer.byteLength(text, "utf8");
    }
    return originalWriteSync(fd, buffer, ...rest);
  };

  stdoutHooked = true;
}

function drainStdout() {
  const text = captured.join("");
  captured = [];
  return text;
}

parentPort.postMessage({ type: "ready", pid: process.pid });

parentPort.on("message", (job) => {
  if (!job || job.type !== "run") return;
  const { id, file, source, input } = job;
  const savedInput = process.env.INOX_RUN_INPUT;
  let exitCode = 0;
  try {
    hookStdout();
    if (input && typeof input === "object") {
      process.env.INOX_RUN_INPUT = JSON.stringify(input);
    } else {
      delete process.env.INOX_RUN_INPUT;
    }

    if (file) {
      const src = fs.readFileSync(file, "utf8");
      runtime.processor("{}", "{}", src);
    } else if (source) {
      const code = String(source).startsWith("~~") ? String(source) : `~~\n${source}`;
      runtime.processor("{}", "{}", code);
    } else {
      throw new Error("missing_file_or_source");
    }

    parentPort.postMessage({
      type: "result",
      id,
      ok: true,
      stdout: drainStdout(),
      stderr: "",
      exit_code: exitCode,
      runtime: "worker",
    });
  } catch (error) {
    if (error instanceof InoxExit) {
      exitCode = error.code;
      parentPort.postMessage({
        type: "result",
        id,
        ok: exitCode === 0,
        stdout: drainStdout(),
        stderr: "",
        exit_code: exitCode,
        runtime: "worker",
      });
      return;
    }
    parentPort.postMessage({
      type: "result",
      id,
      ok: false,
      stdout: drainStdout(),
      stderr: String(error?.stack || error?.message || error),
      exit_code: 1,
      runtime: "worker",
      error: error?.message || "inox_run_failed",
    });
  } finally {
    if (savedInput === undefined) delete process.env.INOX_RUN_INPUT;
    else process.env.INOX_RUN_INPUT = savedInput;
  }
});

process.on("uncaughtException", (error) => {
  if (error instanceof InoxExit) return;
  parentPort.postMessage({
    type: "result",
    ok: false,
    stdout: drainStdout(),
    stderr: String(error?.stack || error?.message || error),
    exit_code: 1,
    runtime: "worker",
    error: "uncaught_exception",
  });
});