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

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const scope = signals.createScope("ExternalWorkspace");
const queryClient = { name: "query-client" };
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient },
);
const sourceSignal = signals.createScopedSignal(scope, "alpha");
const contexts = [];
const cleanupValues = [];
const externalSignal = signals.createExternalSignal(
  scope,
  ({ get, scope: activeScope }) =>
    `${activeScope.value.workspaceId}:${get(sourceSignal)}:initial`,
  (context) => {
    const source = context.get(sourceSignal);
    contexts.push(context);
    context.set(`${context.scope.value.workspaceId}:${source}:subscribed`);
    return () => cleanupValues.push(source);
  },
);

check(externalSignal.cache === "cached", "marks external signals as cached bindings");
const first = signals.resolveScopedExternalSignal(externalSignal, state);
const firstAgain = signals.resolveScopedExternalSignal(externalSignal, state);
check(first.atom === firstAgain.atom, "reuses one external atom per scope instance");
check(contexts.length === 0, "does not subscribe before the atom is read or mounted");
check(
  first.store.get(first.atom) === "workspace-1:alpha:subscribed",
  "mounts the external subscription on first store read",
);
check(contexts.length === 1, "subscribes when the atom first mounts");
check(contexts[0].queryClient === queryClient, "passes the owning query client to subscribers");

let notifications = 0;
const unsubscribe = first.store.sub(first.atom, () => {
  notifications += 1;
});
check(
  first.store.get(first.atom) === "workspace-1:alpha:subscribed",
  "lets the subscriber publish its current external value",
);

const firstContext = contexts[0];
firstContext.set((current) => `${current}:updated`);
check(
  first.store.get(first.atom).endsWith(":updated"),
  "supports functional external updates",
);
check(notifications >= 1, "notifies mounted readers about subscriber updates");

state.store.set(sourceSignal.resolve(state), "beta");
check(cleanupValues.join(",") === "alpha", "cleans up before a dependency-driven resubscribe");
check(contexts.length === 2, "resubscribes when scoped dependencies change");
check(
  first.store.get(first.atom) === "workspace-1:beta:subscribed",
  "recomputes initial and subscribed values for the new dependency",
);
firstContext.set("stale-update");
check(
  first.store.get(first.atom) === "workspace-1:beta:subscribed",
  "ignores updates from a stale subscription context",
);

unsubscribe();
check(cleanupValues.join(",") === "alpha,beta", "cleans up the active subscription on unmount");
contexts.at(-1).set("after-unmount");
check(
  first.store.get(first.atom) === "workspace-1:beta:subscribed",
  "ignores updates after unmount",
);

const parityContexts = [];
const paritySignal = signals.createExternalSignal(
  scope,
  1,
  (context) => {
    parityContexts.push(context);
  },
  { isEqual: (previous, next) => previous % 2 === next % 2 },
);
const parity = signals.resolveScopedExternalSignal(paritySignal, state);
const releaseParity = parity.store.sub(parity.atom, () => {});
parityContexts[0].set(3);
check(parity.store.get(parity.atom) === 1, "preserves the current value when isEqual matches");
parityContexts[0].set(2);
check(parity.store.get(parity.atom) === 2, "accepts external values when isEqual differs");
releaseParity();

const pendingCleanup = deferred();
let asyncCleanupCount = 0;
const asyncSignal = signals.createExternalSignal(
  scope,
  "pending",
  () => pendingCleanup.promise,
);
const asyncBinding = signals.resolveScopedExternalSignal(asyncSignal, state);
const releaseAsync = asyncBinding.store.sub(asyncBinding.atom, () => {});
releaseAsync();
pendingCleanup.resolve(() => {
  asyncCleanupCount += 1;
});
await Promise.resolve();
await Promise.resolve();
check(asyncCleanupCount === 1, "disposes async cleanup resolved after unmount");

let disposableCleanupCount = 0;
const disposableSignal = signals.createExternalSignal(scope, 0, () => ({
  [Symbol.dispose]() {
    disposableCleanupCount += 1;
  },
}));
const disposable = signals.resolveScopedExternalSignal(disposableSignal, state);
const releaseDisposable = disposable.store.sub(disposable.atom, () => {});
releaseDisposable();
check(disposableCleanupCount === 1, "supports Symbol.dispose subscription cleanup");

const secondClient = { name: "second-client" };
const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: secondClient },
);
const second = signals.resolveScopedExternalSignal(externalSignal, secondState);
check(second.atom !== first.atom, "isolates external atoms across scope instances");
const releaseSecond = second.store.sub(second.atom, () => {});
check(
  second.store.get(second.atom) === "workspace-2:alpha:subscribed",
  "binds external subscriptions to the owning scope value",
);
check(contexts.at(-1).queryClient === secondClient, "isolates query clients across scope instances");
releaseSecond();

console.log(
  `app-shared external signal behavior: ${assertions}/${assertions} assertions passed`,
);
