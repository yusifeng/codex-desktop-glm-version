import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitRequestLifecycle } = require("../app/.vite/build/worker/git-request-lifecycle.js");

const lifecycle = createGitRequestLifecycle();
const controller = new AbortController();
assert.equal(lifecycle.cancel("queued"), "queued");
assert.equal(lifecycle.begin("queued", true, controller), "canceled");
assert.equal(controller.signal.aborted, true);
assert.deepEqual(lifecycle.snapshot(), { inFlight: 0, canceledBeforeStart: 0, uncancelable: 0 });

const active = new AbortController();
assert.equal(lifecycle.begin("active", true, active), "started");
assert.equal(lifecycle.cancel("active"), "aborted");
assert.equal(active.signal.aborted, true);
assert.equal(lifecycle.cancel("active"), "queued");
assert.equal(lifecycle.begin("active", true, new AbortController()), "canceled");

const uncancelable = new AbortController();
assert.equal(lifecycle.begin("uncancelable", false, uncancelable), "started");
assert.equal(lifecycle.cancel("uncancelable"), "ignored");
lifecycle.finish("uncancelable", false);
assert.deepEqual(lifecycle.snapshot(), { inFlight: 0, canceledBeforeStart: 0, uncancelable: 0 });

console.log("test-git-request-lifecycle: 11 assertions passed");
