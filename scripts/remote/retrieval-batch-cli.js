#!/usr/bin/env node
import { packBatch } from "./retrieval-batch.js";

const raw = process.env.INOX_RUN_INPUT || "";
let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  console.log(JSON.stringify({ ok: false, error: "invalid_input_json" }));
  process.exit(1);
}

const result = await packBatch(payload, process.env);
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);