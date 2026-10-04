import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitRequestCancellationTelemetry } = require("../app/.vite/build/worker/git-request-cancellation.js");

const payload = createGitRequestCancellationTelemetry({
  attribution: { trace: "x" }, durationMs: 12, host: { id: "local" }, operation: "status-summary",
  enqueuedAtMs: 90, startedAtMs: 100, repoIndexSizeBucket: "small", result: undefined,
  reviewSource: "working-tree", source: "conversation",
});
assert.equal(payload.canceled, true);
assert.equal(payload.resultDisposition, "canceled");
assert.equal(payload.trigger, "request");
assert.equal(payload.queueDurationMs, 10);
assert.equal(payload.operation, "status-summary");
assert.equal(payload.reviewSource, "working-tree");
assert.equal(payload.source, "conversation");
assert.equal(payload.durationMs, 12);
assert.deepEqual(createGitRequestCancellationTelemetry({ durationMs: 2, startedAtMs: 3, host: null }), {
  attribution: undefined, canceled: true, durationMs: 2, host: null, operation: undefined,
  queueDurationMs: null, repoIndexSizeBucket: undefined, result: undefined,
  resultDisposition: "canceled", reviewSource: undefined, source: undefined, trigger: "request",
});
console.log("test-worker-request-cancellation: 9 assertions passed");
