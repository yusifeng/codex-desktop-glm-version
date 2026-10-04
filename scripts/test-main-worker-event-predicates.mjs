#!/usr/bin/env node
import assert from "node:assert/strict";
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

console.log("8 main worker event predicate assertions passed");
