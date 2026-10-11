import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { startGitWatchSession } = require("../app/.vite/build/worker/git-watch-session-start-controller.js");

const target = { generation: 1, session: null, retryTimer: null, sessionStartPromise: null, metadataDirectory: { missing: false } };
const events = [];
await startGitWatchSession({ target, recovering: false, isDisposed: () => false, isRegistered: () => true,
  start: async () => { events.push("start"); target.session = {}; }, shouldRetryAfterStart: () => false,
  scheduleRetry: () => events.push("retry"), updateRecovery: () => events.push("recovery") });
assert.deepEqual(events, ["recovery", "start"]); assert.equal(target.sessionStartPromise, null);

let resolveDispose;
target.session = null; target.sessionDisposePromise = new Promise((resolve) => { resolveDispose = resolve; });
const waiting = startGitWatchSession({ target, recovering: true, isDisposed: () => false, isRegistered: () => true,
  start: async () => { events.push("restart"); target.session = {}; }, shouldRetryAfterStart: () => false,
  scheduleRetry: () => {}, updateRecovery: () => {} });
resolveDispose(); target.sessionDisposePromise = null; await waiting; assert.equal(events.at(-1), "restart");

target.session = null; target.sessionStartPromise = Promise.resolve(); target.generation = 4;
await startGitWatchSession({ target, recovering: true, isDisposed: () => false, isRegistered: () => true,
  start: async () => {}, shouldRetryAfterStart: () => true, scheduleRetry: () => events.push("retry"), updateRecovery: () => {} });
assert.equal(events.at(-1), "retry");
console.log("9 worker Git watch session start-controller assertions passed");
