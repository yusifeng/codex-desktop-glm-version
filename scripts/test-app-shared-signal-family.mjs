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

const scope = signals.createScope("Workspace");
const firstState = signals.createScopeState(scope, { multiplier: 2 }, {
  queryClient: { id: "first-query-client" },
});
const secondState = signals.createScopeState(scope, { multiplier: 3 }, {
  queryClient: { id: "second-query-client" },
});
const offset = signals.createScopedSignal(scope, 5);
let initializations = 0;
const counts = signals.createSignalFamily(
  scope,
  (parameter, { get, queryClient, scope: activeScope }) => {
    initializations += 1;
    check(queryClient.id.endsWith("query-client"), "provides the owning query client");
    return get(offset) + parameter.factor * activeScope.value.multiplier;
  },
  {
    getServerSnapshot: (parameter) => parameter.factor * 100,
    isEqual: (previous, next) => Math.floor(previous) === Math.floor(next),
  },
  { excludeFieldsFromKey: ["requestId"] },
);

check(counts.kind === "signal-family", "marks the binding as a signal family");
check(counts.autoDisposeMs === Infinity, "disables automatic disposal by default");
const firstMember = signals.resolveScopedSignalFamily(
  counts,
  { factor: 4, requestId: "first" },
  firstState,
);
const equivalentMember = signals.resolveScopedSignalFamily(
  counts,
  { requestId: "second", factor: 4 },
  firstState,
);
check(firstMember.atom === equivalentMember.atom, "uses sorted structural keys and excluded fields");
check(firstMember.store.get(firstMember.atom) === 13, "initializes from parameter and scoped state");
check(initializations === 1, "initializes a cached member once");
check(firstMember.atom.getServerSnapshot?.() === 400, "binds the parameter to the server snapshot");

const firstApi = signals.getScopeApi(firstState);
check(firstApi.get(counts, { factor: 4 }) === 13, "reads a family member through ScopeApi");
firstApi.set(counts, { factor: 4 }, (current) => current + 2);
check(firstApi.get(counts, { factor: 4 }) === 15, "writes updater values through ScopeApi");

let notifications = 0;
const unsubscribeEquality = firstMember.store.sub(firstMember.atom, () => {
  notifications += 1;
});
firstApi.set(counts, { factor: 4 }, 15.8);
check(firstApi.get(counts, { factor: 4 }) === 15, "preserves the previous value when isEqual matches");
check(notifications === 0, "suppresses notifications for equal values");
unsubscribeEquality();

const secondMember = signals.resolveScopedSignalFamily(
  counts,
  { factor: 4 },
  secondState,
);
check(secondMember.atom !== firstMember.atom, "isolates members across scope instances");
check(secondMember.store.get(secondMember.atom) === 17, "uses the second scope value independently");

const keyed = signals.createSignalFamily(scope, 1, undefined, {
  key: (parameter) => parameter.id,
});
check(
  keyed.resolve(firstState, { id: "same", transient: 1 }) ===
    keyed.resolve(firstState, { id: "same", transient: 2 }),
  "supports custom family keys",
);
check(keyed.evict(firstState, { id: "same" }), "evicts a member by its custom key");

let mountedKey;
let cleanupCount = 0;
const disposable = signals.createSignalFamily(
  scope,
  2,
  {
    onMount(setSelf, memberScope) {
      mountedKey = memberScope.key;
      setSelf((current) => current + 1);
      return () => {
        cleanupCount += 1;
      };
    },
  },
  { autoDispose: true },
);
const disposableMember = signals.resolveScopedSignalFamily(disposable, "task-1", firstState);
const unsubscribeDisposable = disposableMember.store.sub(disposableMember.atom, () => {});
check(mountedKey === "task-1", "passes the family key to onMount");
check(disposableMember.store.get(disposableMember.atom) === 3, "allows onMount to update the member");
unsubscribeDisposable();
check(cleanupCount === 1, "runs the member cleanup on unmount");
await new Promise((resolve) => setTimeout(resolve, 10));
const recreated = signals.resolveScopedSignalFamily(disposable, "task-1", firstState);
check(recreated.atom !== disposableMember.atom, "recreates an auto-disposed family member");

const otherScope = signals.createScope("Other");
const otherState = signals.createScopeState(otherScope, {});
assert.throws(
  () => signals.resolveScopedSignalFamily(counts, { factor: 1 }, otherState),
  /Missing scope instance/,
);
assertions += 1;

console.log(`app-shared signal family behavior: ${assertions}/${assertions} assertions passed`);
