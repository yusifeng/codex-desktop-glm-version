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
const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const rootScope = signals.createScope("Root");
const retainedScope = signals.createScope("Retained", {
  key: (value) => value.id,
  parent: rootScope,
  retain: { max: 2 },
});
const transientScope = signals.createScope("Transient", {
  key: (value) => value.id,
  parent: rootScope,
});
const rootState = signals.createScopeState(rootScope, { id: "root" });
const rootApi = signals.getScopeApi(rootState);

const first = signals.createScopeState(retainedScope, { id: "first" }, {
  parent: rootState,
});
const second = signals.createScopeState(retainedScope, { id: "second" }, {
  parent: rootState,
});

const firstApi = signals.getRetainedScopeState(rootApi, retainedScope, "first");
check(firstApi?.value.id === "first", "returns a retained child by its semantic key");
check(firstApi === signals.getScopeApi(first), "returns the stable API for the retained node");
check(signals.getRetainedScopeState(rootApi, retainedScope, "second") === signals.getScopeApi(second), "keeps sibling retained scopes separate");
check(signals.getRetainedScopeState(rootApi, retainedScope, "missing") === null, "returns null for a missing retained key");
check(signals.getRetainedScopeState(rootApi, rootScope, "root") === null, "does not look up a root scope");

signals.createScopeState(transientScope, { id: "temporary" }, {
  parent: rootState,
});
check(signals.getRetainedScopeState(rootApi, transientScope, "temporary") === null, "does not retain scopes without a retain policy");

signals.createScopeState(retainedScope, { id: "third" }, {
  parent: rootState,
});
check(signals.getRetainedScopeState(rootApi, retainedScope, "first") === null, "evicts the oldest entry when retain.max is exceeded");
check(signals.getRetainedScopeState(rootApi, retainedScope, "second")?.value.id === "second", "keeps newer entries after max eviction");
check(signals.getRetainedScopeState(rootApi, retainedScope, "third")?.value.id === "third", "registers the newest retained entry");

const replacement = signals.createScopeState(retainedScope, { id: "replacement" }, {
  parent: rootState,
  retainKey: "third",
});
check(signals.getRetainedScopeState(rootApi, retainedScope, "third") === signals.getScopeApi(replacement), "replaces an existing retained key without growing the cache");
check(rootState.retainedScopeEntries.get(retainedScope).size === 2, "enforces the configured retained scope limit");

assert.throws(
  () => signals.getRetainedScopeState({}, retainedScope, "third"),
  /Missing scope state/,
);
assertions += 1;
assert.throws(
  () => signals.createScope("InvalidRetainMax", { retain: { max: -1 } }),
  /retain.max must be a nonnegative integer/,
);
assertions += 1;

console.log(`${assertions} app-shared retained scope assertions passed`);
