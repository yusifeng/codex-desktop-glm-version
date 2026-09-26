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
const firstState = signals.createScopeState(rootScope, { multiplier: 2 }, {
  queryClient: { id: "query-client" },
});
const secondState = signals.createScopeState(rootScope, { multiplier: 3 }, {
  queryClient: { id: "second-client" },
});
const baseSignal = signals.createScopedSignal(rootScope, 5);
let derivations = 0;
const multipliedFamily = signals.createDerivedFamily(
  rootScope,
  (parameter, { get, scope, queryClient }) => {
    derivations += 1;
    check(queryClient.id.endsWith("client"), "provides the owning query client");
    return get(baseSignal) * parameter.factor * scope.value.multiplier;
  },
  { excludeFieldsFromKey: ["requestId"] },
);

check(multipliedFamily.kind === "readable-family", "marks the binding as a readable family");
check(multipliedFamily.autoDisposeMs === 60_000, "defaults family auto disposal to sixty seconds");
const firstMember = signals.resolveScopedDerivedFamily(
  multipliedFamily,
  { factor: 4, requestId: "first" },
  firstState,
);
const equivalentMember = signals.resolveScopedDerivedFamily(
  multipliedFamily,
  { requestId: "second", factor: 4 },
  firstState,
);
check(firstMember.atom === equivalentMember.atom, "uses sorted structural keys and excluded fields");
check(firstMember.store.get(firstMember.atom) === 40, "derives a family member from scoped state");
check(derivations === 1, "evaluates a cached member once while dependencies stay stable");

firstMember.store.set(baseSignal.resolve(firstState), 6);
check(firstMember.store.get(firstMember.atom) === 48, "recomputes when a scoped dependency changes");
check(derivations === 2, "tracks scoped dependencies through the derived context");

const secondMember = signals.resolveScopedDerivedFamily(
  multipliedFamily,
  { factor: 4, requestId: "third" },
  secondState,
);
check(secondMember.atom !== firstMember.atom, "isolates family members across scope instances");
check(secondMember.store.get(secondMember.atom) === 60, "uses the second scope value independently");

const firstApi = signals.getScopeApi(firstState);
check(firstApi.get(multipliedFamily, { factor: 4 }) === 48, "reads derived family members through ScopeApi");
check(multipliedFamily.evict(firstState, { factor: 4 }), "evicts a cached family member by structural key");
const recreated = signals.resolveScopedDerivedFamily(multipliedFamily, { factor: 4 }, firstState);
check(recreated.atom !== firstMember.atom, "recreates an evicted family member");
check(!multipliedFamily.evict(firstState, { factor: 999 }), "reports a missing family member during eviction");

const immediateFamily = signals.createDerivedFamily(rootScope, (value) => value, {
  autoDispose: true,
  key: (value) => value.id,
});
check(immediateFamily.autoDisposeMs === 0, "normalizes immediate family disposal");
const keyedA = immediateFamily.resolve(firstState, { id: "same", payload: 1 });
const keyedB = immediateFamily.resolve(firstState, { id: "same", payload: 2 });
check(keyedA === keyedB, "honors a custom family key function");
const unsubscribeImmediate = firstState.store.sub(keyedA, () => {});
unsubscribeImmediate();
await new Promise((resolve) => setTimeout(resolve, 0));
const keyedAfterDisposal = immediateFamily.resolve(firstState, {
  id: "same",
  payload: 3,
});
check(keyedAfterDisposal !== keyedA, "evicts an auto-disposed family member after unmount");

assert.throws(
  () => signals.createDerivedFamily(rootScope, (value) => value, { autoDispose: -1 }),
  /finite, nonnegative delay/,
);
assertions += 1;

console.log(`${assertions} app-shared derived family assertions passed`);
