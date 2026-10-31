#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  isWorkerStartResult,
  isWorkerEventType,
  isWorkerNotificationType,
} = require("../app/.vite/build/main-app/worker/worker-event-predicates.js");

assert.equal(isWorkerStartResult({ result: "started" }), true);
assert.equal(isWorkerStartResult({ result: "failed" }), false);
assert.equal(isWorkerStartResult(null), false);
assert.equal(isWorkerStartResult({ result: "started", extra: true }), true);
assert.equal(isWorkerEventType({ type: "update" }, "update"), true);
assert.equal(isWorkerEventType({ type: "update" }, "event"), false);
assert.equal(isWorkerNotificationType({ type: "worker-event" }, "worker-event"), true);
assert.equal(isWorkerNotificationType({}, "worker-event"), false);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.equal(main.includes("isWorkerStartResult(r)"), true);
assert.equal(main.includes("function Sst("), false);
assert.equal(main.includes("function Cst("), false);
assert.equal(main.includes("function wst("), false);

console.log("12 main worker event predicate assertions passed");
