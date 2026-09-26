import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

let currentScopeState = null;
globalThis.__RENDERER_REACT__ = {
  createContext(defaultValue) {
    return { Consumer: {}, Provider: {}, defaultValue };
  },
  useCallback(callback) {
    return callback;
  },
  useContext(context) {
    return currentScopeState ?? context.defaultValue;
  },
  useSyncExternalStore(_subscribe, getSnapshot) {
    return getSnapshot();
  },
};

const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const queryClient = {
  getOrFetch(query, key) {
    return Promise.resolve({ query, key });
  },
};
const rootScope = signals.createScope("Root");
const childScope = signals.createScope("Child", { parent: rootScope });
const rootState = signals.createScopeState(rootScope, { name: "root" }, {
  queryClient,
});
const childState = signals.createScopeState(childScope, { name: "child" }, {
  parent: rootState,
});
currentScopeState = childState;

const rootApi = signals.useScope(rootScope);
const rootApiAgain = signals.useScope(rootScope);
const childApi = signals.useScope(childScope);
check(rootApi === rootApiAgain, "keeps a stable ScopeApi for the same scope node");
check(rootApi.value.name === "root", "resolves an ancestor scope from the active React context");
check(childApi.value.name === "child", "resolves the current child scope");
check(childApi.getOwnValue(rootScope).name === "root", "reads an ancestor own value");
check(childApi.queryClient === queryClient, "exposes the inherited query client");
check((await childApi.query.getOrFetch("query", "key")).key === "key", "delegates query getOrFetch to the query client");

const countSignal = signals.createScopedSignal(rootScope, 1);
const doubledFamily = signals.createDerivedFamily(
  rootScope,
  (factor, { get }) => get(countSignal) * factor,
);
check(childApi.get(countSignal) === 1, "reads a scoped signal through the hook API");
check(childApi.get(doubledFamily, 2) === 2, "reads a derived family through the hook API");

const watchedValues = [];
let cleanups = 0;
const stopWatching = childApi.watch((scope) => {
  watchedValues.push(scope.get(countSignal));
  return () => {
    cleanups += 1;
  };
});
childApi.set(countSignal, 2);
check(watchedValues.join(",") === "1,2", "reruns watch when a read signal changes");
check(cleanups === 1, "cleans up the previous watch effect before rerunning");

const reachedThree = childApi.when((scope) => scope.get(countSignal) === 3);
childApi.set(countSignal, 3);
await reachedThree;
check(watchedValues.at(-1) === 3, "keeps active watchers synchronized");
stopWatching();
check(cleanups === 3, "cleans up watch effects on every rerun and final stop");

assert.throws(
  () => {
    currentScopeState = null;
    signals.useScope(rootScope);
  },
  /Missing scope instance: Root/,
);
assertions += 1;

delete globalThis.__RENDERER_REACT__;
console.log(`${assertions} app-shared useScope assertions passed`);
