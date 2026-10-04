import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitWorkerResponse } = require("../app/.vite/build/worker/git-response-envelope.js");

const withoutTrace = createGitWorkerResponse({ id: "req-1", method: "status", result: { ok: true } });
assert.deepEqual(withoutTrace, { id: "req-1", method: "status", result: { ok: true } });
const withTrace = createGitWorkerResponse({
  id: "req-2", method: "review-summary", result: [1, 2], trace: { spanId: "span" }, emittedAtMs: 123,
});
assert.deepEqual(withTrace, {
  emittedAtMs: 123, trace: { spanId: "span" }, id: "req-2", method: "review-summary", result: [1, 2],
});
assert.equal(createGitWorkerResponse({ id: "req-3", method: "x", result: null, trace: null }).emittedAtMs, undefined);
assert.equal(createGitWorkerResponse({ id: "req-4", method: "x", result: 0, trace: false, emittedAtMs: 1 }).trace, false);
assert.equal(createGitWorkerResponse({ id: "req-5", method: "x", result: "ok", trace: "trace", emittedAtMs: 0 }).emittedAtMs, 0);
assert.equal(Object.keys(withTrace).length, 5);
console.log("test-worker-git-response-envelope: 6 assertions passed");
