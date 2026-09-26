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

const scope = signals.createScope("Root");
const firstState = signals.createScopeState(scope, { multiplier: 2 }, {
  queryClient: { id: "first-client" },
});
const secondState = signals.createScopeState(scope, { multiplier: 3 }, {
  queryClient: { id: "second-client" },
});
const countSignal = signals.createScopedSignal(scope, 4);
let derivations = 0;
const doubledSignal = signals.createDerivedSignal(
  scope,
  ({ get, scope: scopeApi, queryClient }) => {
    derivations += 1;
    check(queryClient.id.endsWith("client"), "provides the owning query client");
    return get(countSignal) * scopeApi.value.multiplier;
  },
);

check(doubledSignal.cache === "cached", "marks the binding as a cached derived signal");
const first = signals.resolveScopedDerivedSignal(doubledSignal, firstState);
const firstAgain = signals.resolveScopedDerivedSignal(doubledSignal, firstState);
const second = signals.resolveScopedDerivedSignal(doubledSignal, secondState);
check(first.atom === firstAgain.atom, "reuses one derived atom per scope instance");
check(first.atom !== second.atom, "isolates derived atoms across scope instances");
check(first.store.get(first.atom) === 8, "derives from the first scope value");
check(second.store.get(second.atom) === 12, "derives from the second scope value");
check(derivations === 2, "evaluates once per scope while inputs stay stable");

first.store.set(countSignal.resolve(firstState), 5);
check(first.store.get(first.atom) === 10, "recomputes after a scoped dependency changes");
check(second.store.get(second.atom) === 12, "does not leak dependency updates across scopes");

const roundedSignal = signals.createDerivedSignal(
  scope,
  ({ get }) => get(countSignal) / 10,
  { isEqual: (previous, next) => Math.round(previous) === Math.round(next) },
);
const rounded = signals.resolveScopedDerivedSignal(roundedSignal, firstState);
check(rounded.store.get(rounded.atom) === 0.5, "reads the initial custom-equality value");
first.store.set(countSignal.resolve(firstState), 6);
check(rounded.store.get(rounded.atom) === 0.5, "keeps the previous derived value when isEqual matches");

const firstApi = signals.getScopeApi(firstState);
check(firstApi.get(doubledSignal) === 12, "reads derived signals through ScopeApi");

const otherScope = signals.createScope("Other");
const otherState = signals.createScopeState(otherScope, {});
assert.throws(
  () => signals.resolveScopedDerivedSignal(doubledSignal, otherState),
  /Missing scope instance: Root/,
);
assertions += 1;

console.log(`${assertions} app-shared derived signal assertions passed`);
