import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitWatchSessionCloseController } = require("../app/.vite/build/worker/git-watch-session-close-controller.js");
const target = { session: null, retryDelayMs: 9000, watchPath: "/repo" };
const events = [];
const controller = createGitWatchSessionCloseController({ stableThresholdMs: 1000, isDisposed: () => false, getCurrentSession: (value) => value.session, clearSession: (value) => { value.session = null; events.push("clear"); }, resetRetryDelay: (value) => { value.retryDelayMs = 1000; events.push("reset"); }, onWatchError: () => events.push("error"), updateRecovery: () => events.push("recovery"), scheduleRetry: () => events.push("retry") });
const session = {};
target.session = session;
controller.handleClose(target, session, Date.now() - 2000, { reason: "watch-error", error: Error("closed") });
assert.deepEqual(events, ["error", "clear", "reset", "recovery", "retry"]);
assert.equal(target.session, null);
const stale = { session: {} };
controller.handleClose(stale, session, Date.now(), { reason: "watch-error" });
assert.deepEqual(events, ["error", "clear", "reset", "recovery", "retry"]);
console.log("5 worker git watch session close assertions passed");
