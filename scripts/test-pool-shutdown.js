#!/usr/bin/env node
import assert from "node:assert/strict";
import { createSidecarPool } from "./serve/sidecar-pool.js";
import { createSessionPool } from "./serve/session-pool.js";

// Closing before the first worker is ready must settle queued work and must
// not restart that worker. The test process must also exit naturally.
for (const kind of ["sidecar", "session"]) {
  const pool = kind === "sidecar" ? createSidecarPool({ size: 1 }) : createSessionPool({ size: 1 });
  const submit = () => kind === "sidecar"
    ? pool.run({ source: "0 exit" }, 30000)
    : pool.turn({ id: "shutdown-test", event: { kind: "test" } }, 30000);
  const queued = submit();
  await pool.close();
  await pool.close(); // Closing twice must be harmless.
  assert.equal((await queued).error, `${kind === "session" ? "session" : "sidecar"}_pool_closed`);
  assert.equal((await submit()).error, `${kind === "session" ? "session" : "sidecar"}_pool_closed`);
}
console.log("Pool shutdown: queued work settled; later work rejected; no respawn");
