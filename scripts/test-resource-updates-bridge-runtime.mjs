import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  accountId: "account-1",
  authAllowed: true,
  callbacks: {},
  cancelCount: 0,
  cleanup: null,
  debounceCalls: 0,
  debounceInitializerCalls: 0,
  debounceOptions: null,
  invalidations: [],
  sharedInitializerCalls: 0,
  subscribeCount: 0,
  unsubscribeCount: 0,
  userId: "user-1",
  watchCleanupCount: 0,
};
globalThis.__resourceUpdatesTest = state;

const mocks = {
  "@rchunk/rolldown-runtime": "export {};",
  "@rchunk/app-shared": `
    export const ZI = Symbol("store");
    export const vW = "ChatGPT-Account-ID";
    export const LX = () => globalThis.__resourceUpdatesTest.store;
    export const e6 = () => ({ useEffect(effect) { globalThis.__resourceUpdatesTest.cleanup = effect(); } });
    export const wL = () => { globalThis.__resourceUpdatesTest.sharedInitializerCalls += 1; };
  `,
  "@rchunk/app-initial": `
    export const mun = Symbol("accountId");
    export const _un = Symbol("userId");
    export const gun = Symbol("authAllowed");
    export const vun = Symbol("permission");
    globalThis.__resourceUpdatesTest.initialTokens = { mun, _un, gun, vun };
    export function IPt() {
      globalThis.__resourceUpdatesTest.debounceInitializerCalls += 1;
      return { default(callback, delay, options) {
        globalThis.__resourceUpdatesTest.debounceOptions = { delay, options };
        const debounced = () => {
          globalThis.__resourceUpdatesTest.debounceCalls += 1;
          callback();
        };
        debounced.cancel = () => { globalThis.__resourceUpdatesTest.cancelCount += 1; };
        return debounced;
      } };
    }
    export const ctt = (_store, accountId) => globalThis.__resourceUpdatesTest.invalidations.push(accountId);
    export const TKt = (name, _connect, key) => {
      globalThis.__resourceUpdatesTest.subscriptionIdentity = { name, key };
      return globalThis.__resourceUpdatesTest.subscription;
    };
    export const rJt = { safeGet: async () => ({ websocket_url: "wss://example.invalid" }) };
  `,
};

const subscription = {
  onMessage(callback) {
    state.callbacks.message = callback;
    return () => { state.callbacks.messageStopped = true; };
  },
  onSubscribed(callback) {
    assert.equal(typeof callback, "function");
    state.callbacks.subscribed = callback;
    return () => { state.callbacks.subscribedStopped = true; };
  },
  onPotentialMissedMessages(callback) {
    assert.equal(typeof callback, "function");
    state.callbacks.missed = callback;
    return () => { state.callbacks.missedStopped = true; };
  },
  subscribe() { state.subscribeCount += 1; },
  unsubscribe() { state.unsubscribeCount += 1; },
};
state.subscription = subscription;
state.store = {
  watch(callback) {
    const cleanup = callback({
      get(token) {
        const initial = state.initialTokens;
        if (token === initial.mun) return state.accountId;
        if (token === initial._un) return state.userId;
        if (token === initial.gun) return state.authAllowed;
        if (token === initial.vun) return { status: "allowed" };
        return undefined;
      },
    });
    return () => {
      state.watchCleanupCount += 1;
      cleanup?.();
    };
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(root, "src/renderer/resource-updates-bridge/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "resource-updates-runtime-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath, namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => ({ contents: mocks[modulePath], loader: "js" }));
    },
  }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

assert.equal(runtime.ResourceUpdatesBridge(), null);
assert.equal(state.sharedInitializerCalls, 1);
assert.equal(state.debounceInitializerCalls, 1);
assert.deepEqual(state.debounceOptions, { delay: 500, options: { leading: false } });
assert.deepEqual(state.subscriptionIdentity, { name: "resource-updates", key: JSON.stringify([state.accountId, state.userId]) });
assert.equal(state.subscribeCount, 1);

state.callbacks.message({ type: "resource-updated", payload: { resource_type: "team" } });
state.callbacks.subscribed();
state.callbacks.missed();
assert.equal(state.debounceCalls, 3);
assert.deepEqual(state.invalidations, [state.accountId, state.accountId, state.accountId]);

state.cleanup();
assert.equal(state.cancelCount, 1);
assert.equal(state.unsubscribeCount, 1);
assert.equal(state.watchCleanupCount, 1);
assert.equal(state.callbacks.messageStopped, true);
assert.equal(state.callbacks.subscribedStopped, true);
assert.equal(state.callbacks.missedStopped, true);

delete globalThis.__resourceUpdatesTest;
console.log("15 resource-updates bridge runtime assertions passed");
