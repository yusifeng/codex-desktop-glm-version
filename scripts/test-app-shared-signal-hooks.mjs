import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appSharedSignalHooksTest = {
  subscriptions: 0,
  notifications: 0,
  unsubscriptions: [],
});
let activeScopeState = null;
globalThis.__RENDERER_REACT__ = {
  createContext: (defaultValue) => ({ Consumer: {}, Provider: {}, defaultValue }),
  useCallback: (callback) => callback,
  useContext: (context) => activeScopeState ?? context.defaultValue,
  useSyncExternalStore: (subscribe, getSnapshot) => {
    state.subscriptions += 1;
    state.unsubscriptions.push(
      subscribe(() => {
        state.notifications += 1;
      }),
    );
    return getSnapshot();
  },
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/atom-signal.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});
const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const store = signals.createStore();
const count = signals.atom(3);
let value = signals.useSignalValue({ atom: count, store });
check(value === 3, "reads a bound atom signal");
store.set(count, 4);
check(state.notifications === 1, "subscribes bound atoms to store updates");

signals.setDefaultAtomStore(store);
value = signals.useSignalValue(count);
check(value === 4, "reads atom definitions through the default store");

let externalValue = "ready";
const externalListeners = new Set();
const externalSignal = {
  get: () => externalValue,
  subscribe: (listener) => {
    externalListeners.add(listener);
    return () => externalListeners.delete(listener);
  },
};
value = signals.useSignalValue(externalSignal);
check(value === "ready", "reads an external subscribable signal");
externalValue = "updated";
for (const listener of externalListeners) listener();
check(state.notifications === 2, "subscribes to external signal updates");

value = signals.useSignalValue("constant");
check(value === "constant", "keeps constant values hook-safe");

const familyMembers = new Map();
const family = (key) => {
  let member = familyMembers.get(key);
  if (member == null) {
    member = signals.atom(`value:${key}`);
    familyMembers.set(key, member);
  }
  return { atom: member, store };
};
value = signals.useSignalFamilyValue(family, "alpha");
check(value === "value:alpha", "resolves parameterized signal families");
check(familyMembers.size === 1, "creates only the requested family member");
signals.useSignalFamilyValue(family, "alpha", { enabled: false });
check(familyMembers.size === 1, "preserves family identity with query options");

const nativeFamily = signals.createFamily(
  (key) => signals.atom(key.length),
  "signal-family",
);
value = signals.useSignalFamilyValue(nativeFamily, "codex");
check(value === 5, "consumes native Maitai families");
check(signals.isSignalFamily(nativeFamily), "retains signal-family metadata");

const scope = signals.createScope("HookFamilyScope");
activeScopeState = signals.createScopeState(
  scope,
  { offset: 2 },
  { queryClient: {} },
);
const scopedFamily = signals.createDerivedFamily(
  scope,
  (factor, { scope: activeScope }) => factor + activeScope.value.offset,
);
const scopedMember = signals.useSignalFamilyMember(scopedFamily, 3);
check(scopedMember.store === activeScopeState.store, "binds scoped family members to their store");
check(scopedMember.store.get(scopedMember.atom) === 5, "returns the selected scoped member signal");
check(
  signals.useSignalFamilyMember(scopedFamily, 3).atom === scopedMember.atom,
  "reuses the cached scoped family member",
);
check(signals.useSignalFamilyValue(scopedFamily, 4) === 6, "keeps BX value reads on the member helper");
activeScopeState = null;
assert.throws(
  () => signals.useSignalFamilyMember(scopedFamily, 3),
  /Missing scope instance: HookFamilyScope/,
);
assertions += 1;

check(
  state.subscriptions === 8,
  "uses a stable external-store subscription for every hook call",
);
for (const unsubscribe of state.unsubscriptions) unsubscribe();
check(externalListeners.size === 0, "releases external signal subscriptions");

console.log(`${assertions} app-shared signal hook assertions passed`);
