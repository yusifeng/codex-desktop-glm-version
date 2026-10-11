import assert from "node:assert/strict";
import { createRequire } from "node:module";
Object.defineProperty(process.versions, "electron", { value: "42.3.0" });
globalThis.createLogger = () => ({ warning() {} });
globalThis.isSameAuthIdentity = (a, b) => a?.kind === b?.kind && a?.accountId === b?.accountId && a?.userId === b?.userId && a?.authMode === b?.authMode;
const require = createRequire(import.meta.url);
const { createHostThreadReadState } = require("../app/.vite/build/main-app/conversation/thread-read-state-controller.js");

const events = [];
let callback;
let disposed = 0;
const owner = {
  async open(onEvent) {
    callback = onEvent;
    return {
      status: "ready",
      identity: { kind: "account", accountId: "a" },
      executionHostKeysByHostId: { local: "host" },
      unreadThreadIdsByHostId: { local: ["t1"] },
      session: { async set(input) { events.push(input); return { status: "ok" }; }, [Symbol.dispose]() { disposed += 1; } },
    };
  },
};
const unsubscribe = () => {};
const state = await createHostThreadReadState({
  owner,
  hostId: "local",
  context: { identity: { kind: "account", accountId: "a" }, executionHostKey: "host" },
  assertCurrent() {},
  assertLifetimeCurrent() {},
  subscribeIdentityChanges() { return unsubscribe; },
  isSameAuthIdentity(left, right) { return left.kind === right.kind && left.accountId === right.accountId; },
});
assert.equal(state.state.has("t1"), true);
const changes = [];
const remove = state.state.subscribe((change) => changes.push(change));
callback({ type: "changed", hostId: "local", threadId: "t1", hasUnreadTurn: false });
assert.deepEqual(changes, [{ threadId: "t1", hasUnreadTurn: false }]);
state.state.set("t2", true);
await new Promise((resolve) => setImmediate(resolve));
assert.deepEqual(events, [{ hostId: "local", threadId: "t2", hasUnreadTurn: true }]);
remove();
state.dispose();
assert.equal(disposed, 1);
assert.equal(state.state.isReady(), false);
console.log("7 thread read-state controller assertions passed");
