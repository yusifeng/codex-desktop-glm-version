import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/profile/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);
assert.deepEqual([...dependencies].sort(), ["app-shared", "rolldown-runtime"]);
assert.doesNotMatch(source, /import\s*\(/);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\b(?:appSharedChunk|runtimeChunk)\s*\./);

const state = (globalThis.__extensionProfileStoreTest = {
  added: [],
  listeners: new Map(),
  removed: [],
});
globalThis.window = {
  addEventListener(type, listener, options) {
    state.added.push({ type, listener, options });
    state.listeners.set(type, listener);
  },
  removeEventListener(type, listener) {
    state.removed.push({ type, listener });
    if (state.listeners.get(type) === listener) state.listeners.delete(type);
  },
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "extension-profile-store-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          loader: "js",
          contents:
            importPath === "app-shared"
              ? "export const l3=(left,right)=>JSON.stringify(left)===JSON.stringify(right);"
              : "export {};",
        }));
      },
    },
  ],
});
const bundled = Buffer.from(result.outputFiles[0].text).toString("base64");
const loadModule = (label) =>
  import(`data:text/javascript;base64,${bundled}#${label}`);
const resetWindowState = () => {
  state.added = [];
  state.listeners = new Map();
  state.removed = [];
};

let assertions = 4;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

resetWindowState();
const profileModule = await loadModule("store");
check(Object.keys(profileModule).sort().join(",") === "n,t", "preserves n and t exports");
check(profileModule.t === undefined, "defers store creation until initialization");
profileModule.n();
const store = profileModule.t;
profileModule.n();
check(profileModule.t === store, "initializes the store only once");
check(store.getSnapshot() === null, "starts with a null profile snapshot");
let notifications = 0;
const unsubscribe = store.subscribe(() => {
  notifications += 1;
});
store.receive({ id: "profile-1", nested: { enabled: true } });
check(notifications === 1, "notifies subscribers when the profile changes");
store.receive({ id: "profile-1", nested: { enabled: true } });
check(notifications === 1, "suppresses structurally equal profile updates");
unsubscribe();
store.receive({ id: "profile-2" });
check(notifications === 1, "removes unsubscribed listeners");

resetWindowState();
const lifecycleModule = await loadModule("lifecycle");
lifecycleModule.n();
const lifecycleStore = lifecycleModule.t;
let hostCalls = 0;
let receiveFromHost = null;
let disposed = 0;
const host = {
  async subscribeExtensionProfile(listener) {
    hostCalls += 1;
    receiveFromHost = listener;
    return { [Symbol.dispose]: () => { disposed += 1; } };
  },
};
const firstInitialization = lifecycleStore.initialize(host);
const secondInitialization = lifecycleStore.initialize(host);
check(firstInitialization === secondInitialization, "deduplicates subscription initialization");
await firstInitialization;
check(hostCalls === 1, "subscribes to the extension host once");
check(
  state.added[0].type === "pagehide" && state.added[0].options.once === true,
  "registers one-shot pagehide cleanup",
);
receiveFromHost({ id: "live-profile" });
check(lifecycleStore.getSnapshot().id === "live-profile", "accepts live host updates");
state.listeners.get("pagehide")();
check(disposed === 1, "disposes the host subscription on pagehide");
check(state.removed.length === 1, "removes the pagehide listener during cleanup");
receiveFromHost({ id: "ignored-profile" });
check(lifecycleStore.getSnapshot().id === "live-profile", "ignores updates after pagehide");

resetWindowState();
const retryModule = await loadModule("retry");
retryModule.n();
const retryStore = retryModule.t;
const failure = new Error("subscription failed");
await retryStore.initialize({
  async subscribeExtensionProfile() {
    throw failure;
  },
});
check(retryStore.getSnapshot() === null, "resets the snapshot after subscription failure");
check(state.removed.length === 1, "cleans up pagehide after subscription failure");
let retried = 0;
let receiveAfterRetry = null;
retryStore.retry({
  async subscribeExtensionProfile(listener) {
    retried += 1;
    receiveAfterRetry = listener;
    return { [Symbol.dispose]() {} };
  },
});
await Promise.resolve();
check(retried === 1, "retries only after a failed initialization");
receiveAfterRetry({ id: "recovered-profile" });
check(retryStore.getSnapshot().id === "recovered-profile", "receives profiles after retry");

console.log(`${assertions} extension profile store assertions passed`);
