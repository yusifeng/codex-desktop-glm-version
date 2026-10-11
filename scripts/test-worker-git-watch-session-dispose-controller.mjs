import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { disposeGitWatchSession } = require("../app/.vite/build/worker/git-watch-session-dispose-controller.js");

const events = [];
const target = { generation: 0, retryTimer: 1, session: { dispose: true }, sessionStartPromise: Promise.resolve(), sessionDisposePromise: null };
let disposed = 0;
const promise = disposeGitWatchSession({ target, cancelRetry: () => events.push("cancel"), disposeSession: async () => { events.push("dispose"); disposed += 1; throw new Error("close"); }, onDisposeError: (error) => events.push(error.message), updateRecovery: () => events.push("recovery"), isDisposed: () => false });
assert.equal(target.generation, 1); assert.equal(target.session, null); assert.equal(target.sessionStartPromise, null); assert.deepEqual(events, ["cancel", "dispose", "recovery"]);
assert.equal(disposeGitWatchSession({ target, cancelRetry: () => {}, disposeSession: async () => { disposed += 1; }, onDisposeError: () => {}, updateRecovery: () => {}, isDisposed: () => false }), promise);
await promise;
assert.equal(disposed, 1); assert.equal(target.sessionDisposePromise, null); assert.equal(events[2], "recovery");
console.log("8 worker Git watch session dispose-controller assertions passed");
