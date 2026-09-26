import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/atom-signal.ts")],
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

const scope = signals.createScope("ExternalFamilyWorkspace");
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient: { name: "first-client" } },
);
const sourceSignal = signals.createScopedSignal(scope, "alpha");
const contexts = [];
const cleanups = [];
const presenceFamily = signals.createExternalSignalFamily(
  scope,
  (parameter, { get, scope: activeScope }) =>
    `${activeScope.value.workspaceId}:${parameter.userId}:${get(sourceSignal)}:initial`,
  (parameter, context) => {
    const source = context.get(sourceSignal);
    contexts.push({ context, parameter, source });
    context.set(`${context.scope.value.workspaceId}:${parameter.userId}:${source}:online`);
    return () => cleanups.push(`${parameter.userId}:${source}`);
  },
  { excludeFieldsFromKey: ["requestId"] },
);

check(presenceFamily.kind === "readable-family", "marks external members as a readable family");
check(presenceFamily.autoDisposeMs === Infinity, "does not auto-dispose external members by default");
const firstParameter = { requestId: "one", userId: "user-1" };
const equivalentParameter = { userId: "user-1", requestId: "two" };
const first = signals.resolveScopedExternalSignalFamily(presenceFamily, firstParameter, state);
const equivalent = signals.resolveScopedExternalSignalFamily(
  presenceFamily,
  equivalentParameter,
  state,
);
check(first.atom === equivalent.atom, "uses structural keys and excluded fields for caching");
check(contexts.length === 0, "does not subscribe before a family member is read");
check(
  first.store.get(first.atom) === "workspace-1:user-1:alpha:online",
  "binds the family parameter and scope into the subscription",
);
check(contexts.length === 1, "subscribes the selected family member once");

const secondMember = signals.resolveScopedExternalSignalFamily(
  presenceFamily,
  { userId: "user-2", requestId: "three" },
  state,
);
check(secondMember.atom !== first.atom, "creates distinct atoms for distinct family keys");
check(secondMember.store.get(secondMember.atom).includes("user-2"), "binds sibling parameters independently");

const releaseFirst = first.store.sub(first.atom, () => {});
state.store.set(sourceSignal.resolve(state), "beta");
check(cleanups.includes("user-1:alpha"), "cleans up before dependency-driven resubscribe");
check(
  first.store.get(first.atom) === "workspace-1:user-1:beta:online",
  "resubscribes family members when scoped dependencies change",
);
const staleContext = contexts.find((entry) => entry.parameter.userId === "user-1" && entry.source === "alpha").context;
staleContext.set("stale");
check(
  first.store.get(first.atom) === "workspace-1:user-1:beta:online",
  "ignores updates from stale member subscriptions",
);
releaseFirst();

const scopeApi = signals.getScopeApi(state);
check(
  scopeApi.get(presenceFamily, equivalentParameter).includes("user-1"),
  "reads external family members through ScopeApi.get",
);

check(presenceFamily.evict(state, firstParameter), "explicitly evicts external family members");
check(!presenceFamily.evict(state, firstParameter), "reports already-evicted members");
const recreated = signals.resolveScopedExternalSignalFamily(
  presenceFamily,
  equivalentParameter,
  state,
);
check(recreated.atom !== first.atom, "creates a fresh external atom after eviction");

const disposableFamily = signals.createExternalSignalFamily(
  scope,
  (parameter) => parameter,
  () => {},
  { autoDispose: true },
);
check(disposableFamily.autoDisposeMs === 0, "normalizes immediate family auto-disposal");
const disposable = signals.resolveScopedExternalSignalFamily(disposableFamily, "member", state);
const releaseDisposable = disposable.store.sub(disposable.atom, () => {});
releaseDisposable();
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  signals.resolveScopedExternalSignalFamily(disposableFamily, "member", state).atom !== disposable.atom,
  "evicts unmounted family members after the disposal delay",
);

const parityContexts = [];
const parityFamily = signals.createExternalSignalFamily(
  scope,
  1,
  (_parameter, context) => {
    parityContexts.push(context);
  },
  { isEqual: (previous, next) => previous % 2 === next % 2 },
);
const parity = signals.resolveScopedExternalSignalFamily(parityFamily, "parity", state);
const releaseParity = parity.store.sub(parity.atom, () => {});
parityContexts[0].set(3);
check(parity.store.get(parity.atom) === 1, "applies family member equality semantics");
parityContexts[0].set(2);
check(parity.store.get(parity.atom) === 2, "accepts unequal family member updates");
releaseParity();

const keyedFamily = signals.createExternalSignalFamily(
  scope,
  (parameter) => parameter.slug,
  () => {},
  { key: (parameter) => parameter.slug },
);
const keyedFirst = signals.resolveScopedExternalSignalFamily(
  keyedFamily,
  { slug: "same", transient: 1 },
  state,
);
const keyedAgain = signals.resolveScopedExternalSignalFamily(
  keyedFamily,
  { slug: "same", transient: 2 },
  state,
);
check(keyedFirst.atom === keyedAgain.atom, "supports custom external family keys");

const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: { name: "second-client" } },
);
const isolated = signals.resolveScopedExternalSignalFamily(
  presenceFamily,
  firstParameter,
  secondState,
);
check(isolated.atom !== first.atom, "isolates external family members across scope instances");
check(
  isolated.store.get(isolated.atom).startsWith("workspace-2"),
  "binds isolated members to their owning scope value",
);

console.log(
  `app-shared external signal family behavior: ${assertions}/${assertions} assertions passed`,
);
