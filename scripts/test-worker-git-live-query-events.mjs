import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitLiveQueryUpdatedEvent } = require("../app/.vite/build/worker/git-live-query-events.js");

const state = { subscriptionId: "sub-1", requiresRecovery: false };
const event = createGitLiveQueryUpdatedEvent(state, 7, { method: "status-summary", result: { ok: true } }, 1234);
assert.deepEqual(event, {
  type: "git-live-query-updated",
  emittedAtMs: 1234,
  generation: 7,
  requiresRecovery: false,
  subscriptionId: "sub-1",
  method: "status-summary",
  result: { ok: true },
});

const traced = createGitLiveQueryUpdatedEvent({ subscriptionId: 2, requiresRecovery: true }, 8, { method: "recent-branches" }, 5, { sampled: true });
assert.deepEqual(traced.trace, { sampled: true });
assert.equal(traced.requiresRecovery, true);
assert.equal(traced.subscriptionId, 2);
console.log("git live query events tests passed (4 assertions)");
