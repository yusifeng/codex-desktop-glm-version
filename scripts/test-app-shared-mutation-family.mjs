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

const scope = signals.createScope("MutationFamilyWorkspace");
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient: { name: "first-client" } },
);
const suffixSignal = signals.createScopedSignal(scope, "v1");
const calls = [];
const saveFamily = signals.createMutationFamily(
  scope,
  (parameter, { get, scope: activeScope }) => ({
    mutationKey: ["save", parameter.kind, activeScope.value.workspaceId, get(suffixSignal)],
    async mutationFn(variables, mutation) {
      calls.push({ mutation, parameter, variables });
      return `${parameter.kind}:${variables.value}`;
    },
  }),
  { excludeFieldsFromKey: ["requestId"] },
);

check(saveFamily.kind === "readable-family", "marks mutations as a readable family");
check(saveFamily.autoDisposeMs === Infinity, "does not auto-dispose mutation members by default");

const firstParameter = { kind: "draft", requestId: "request-1" };
const equivalentParameter = { requestId: "request-2", kind: "draft" };
const first = signals.resolveScopedMutationFamily(saveFamily, firstParameter, state);
const equivalent = signals.resolveScopedMutationFamily(saveFamily, equivalentParameter, state);
check(first.atom === equivalent.atom, "uses structural keys and excluded fields for member caching");
const published = signals.resolveScopedMutationFamily(
  saveFamily,
  { kind: "published", requestId: "request-3" },
  state,
);
check(published.atom !== first.atom, "creates distinct atoms for distinct family keys");

const initial = first.store.get(first.atom);
check(initial.isIdle, "starts each mutation family member idle");
const saved = await initial.mutateAsync({ value: "hello" });
check(saved === "draft:hello", "binds the family parameter into mutation options");
check(first.store.get(first.atom).data === saved, "stores results on the selected family member");
check(published.store.get(published.atom).isIdle, "keeps sibling mutation members isolated");
check(calls[0].mutation.mutationKey.at(-1) === "v1", "reads scoped option dependencies at mutation time");

state.store.set(suffixSignal.resolve(state), "v2");
await first.store.get(first.atom).mutateAsync({ value: "again" });
check(calls.at(-1).mutation.mutationKey.at(-1) === "v2", "refreshes dynamic options for later mutations");

const scopeApi = signals.getScopeApi(state);
check(scopeApi.get(saveFamily, equivalentParameter).isSuccess, "reads family members through ScopeApi.get");
const familyStateSignal = signals.createDerivedSignal(
  scope,
  ({ get }) => get(saveFamily, equivalentParameter).status,
);
check(
  signals.resolveScopedDerivedSignal(familyStateSignal, state).store.get(
    signals.resolveScopedDerivedSignal(familyStateSignal, state).atom,
  ) === "success",
  "reads mutation families from derived signal context",
);

check(saveFamily.evict(state, firstParameter), "explicitly evicts a mutation family member");
check(!saveFamily.evict(state, firstParameter), "reports an already-evicted member");
const recreated = signals.resolveScopedMutationFamily(saveFamily, equivalentParameter, state);
check(recreated.atom !== first.atom, "creates a fresh atom after eviction");
check(recreated.store.get(recreated.atom).isIdle, "recreated members start with fresh state");

const oldResult = first.store.get(first.atom);
await oldResult.mutateAsync({ value: "redirected" });
check(
  recreated.store.get(recreated.atom).data === "draft:redirected",
  "redirects stale member mutations to the current family member",
);
check(
  first.store.get(first.atom).data === "draft:again",
  "does not update an evicted stale member after redirection",
);

check(saveFamily.evict(state, equivalentParameter), "evicts the recreated member");
await oldResult.mutateAsync({ value: "detached" });
check(
  first.store.get(first.atom).data === "draft:detached",
  "lets a stale member execute locally when no replacement exists",
);

const disposableFamily = signals.createMutationFamily(
  scope,
  (parameter) => ({ mutationFn: (value) => `${parameter}:${value}` }),
  { autoDispose: true },
);
check(disposableFamily.autoDisposeMs === 0, "normalizes immediate auto-disposal");
const disposable = signals.resolveScopedMutationFamily(disposableFamily, "draft", state);
const unsubscribe = disposable.store.sub(disposable.atom, () => {});
unsubscribe();
await new Promise((resolve) => setTimeout(resolve, 0));
const disposed = signals.resolveScopedMutationFamily(disposableFamily, "draft", state);
check(disposed.atom !== disposable.atom, "evicts an unmounted member after its disposal delay");

const retained = signals.resolveScopedMutationFamily(disposableFamily, "retained", state);
const release = retained.store.sub(retained.atom, () => {});
release();
const keepMounted = retained.store.sub(retained.atom, () => {});
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  signals.resolveScopedMutationFamily(disposableFamily, "retained", state).atom === retained.atom,
  "cancels pending disposal when a member remounts",
);
keepMounted();

const keyedFamily = signals.createMutationFamily(
  scope,
  (parameter) => ({ mutationFn: () => parameter.slug }),
  { key: (parameter) => parameter.slug },
);
const keyedFirst = signals.resolveScopedMutationFamily(
  keyedFamily,
  { slug: "same", transient: 1 },
  state,
);
const keyedAgain = signals.resolveScopedMutationFamily(
  keyedFamily,
  { slug: "same", transient: 2 },
  state,
);
check(keyedFirst.atom === keyedAgain.atom, "supports custom family key functions");

const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: { name: "second-client" } },
);
const second = signals.resolveScopedMutationFamily(saveFamily, firstParameter, secondState);
check(second.atom !== first.atom, "isolates mutation family members across scope instances");

const noClientState = signals.createScopeState(scope, { workspaceId: "missing" });
assert.throws(
  () => signals.resolveScopedMutationFamily(saveFamily, firstParameter, noClientState),
  /mutationSignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(
  `app-shared mutation family behavior: ${assertions}/${assertions} assertions passed`,
);
