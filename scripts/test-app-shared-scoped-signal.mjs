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
const childScope = signals.createScope("Child", { parent: rootScope });
const rootState = signals.createScopeState(rootScope, { name: "root" }, {
  queryClient: { name: "query-client" },
});
const firstChild = signals.createScopeState(childScope, { id: "first" }, {
  parent: rootState,
});
const secondChild = signals.createScopeState(childScope, { id: "second" }, {
  parent: rootState,
});

let initializations = 0;
const countSignal = signals.createScopedSignal(
  childScope,
  ({ scope, queryClient }) => {
    initializations += 1;
    check(scope.value.id === (initializations === 1 ? "first" : "second"), "binds the initializer to the owning scope instance");
    check(queryClient.name === "query-client", "inherits the query client from the parent state");
    return 1;
  },
);

const firstBinding = signals.resolveScopedSignal(countSignal, firstChild);
const firstBindingAgain = signals.resolveScopedSignal(countSignal, firstChild);
const secondBinding = signals.resolveScopedSignal(countSignal, secondChild);
check(firstBinding.atom === firstBindingAgain.atom, "reuses one atom per scope instance");
check(firstBinding.atom !== secondBinding.atom, "isolates atoms across sibling scope instances");
check(initializations === 2, "runs the initializer once for each scope instance");
check(firstBinding.store.get(firstBinding.atom) === 1, "reads the scoped initial value");

firstBinding.store.set(firstBinding.atom, 4);
check(firstBinding.store.get(firstBinding.atom) === 4, "writes the first scoped value");
check(secondBinding.store.get(secondBinding.atom) === 1, "does not leak writes to a sibling scope instance");

const parentSignal = signals.createScopedSignal(rootScope, 10);
const parentBindingFromChild = signals.resolveScopedSignal(parentSignal, firstChild);
const parentBindingFromRoot = signals.resolveScopedSignal(parentSignal, rootState);
check(parentBindingFromChild.atom === parentBindingFromRoot.atom, "resolves parent signals through the active scope chain");

let notifications = 0;
const roundedSignal = signals.createScopedSignal(rootScope, 1, {
  isEqual: (previous, next) => Math.round(previous) === Math.round(next),
  getServerSnapshot: () => 99,
});
const roundedBinding = signals.resolveScopedSignal(roundedSignal, rootState);
const unsubscribe = roundedBinding.store.sub(roundedBinding.atom, () => {
  notifications += 1;
});
roundedBinding.store.set(roundedBinding.atom, 1.2);
check(roundedBinding.store.get(roundedBinding.atom) === 1, "keeps the previous value when isEqual matches");
check(notifications === 0, "does not notify for an equal scoped value");
check(roundedBinding.atom.getServerSnapshot() === 99, "preserves the server snapshot callback");
unsubscribe();

let mountedScopeId;
let cleanedUp = false;
const mountedSignal = signals.createScopedSignal(childScope, 5, {
  onMount: (setSelf, scope) => {
    mountedScopeId = scope.value.id;
    setSelf((current) => current + 1);
    return () => {
      cleanedUp = true;
    };
  },
});
const mountedBinding = signals.resolveScopedSignal(mountedSignal, firstChild);
const unsubscribeMounted = mountedBinding.store.sub(mountedBinding.atom, () => {});
check(mountedScopeId === "first", "binds onMount to the owning scope instance");
check(mountedBinding.store.get(mountedBinding.atom) === 6, "allows onMount to update the scoped value");
unsubscribeMounted();
check(cleanedUp, "runs the scoped onMount cleanup after the final unsubscribe");

assert.throws(
  () => signals.resolveScopedSignal(countSignal, rootState),
  /Missing scope instance: Child/,
);
assertions += 1;
assert.throws(
  () => signals.createScopeState(childScope, { id: "orphan" }),
  /Missing parent scope instance: Root/,
);
assertions += 1;

console.log(`${assertions} app-shared scoped signal assertions passed`);
