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

function createQueryClient() {
  const data = new Map();
  const states = new Map();
  const listeners = new Set();
  const keyOf = (queryKey) => JSON.stringify(queryKey);
  const emit = () => {
    for (const listener of listeners) listener({ type: "updated" });
  };
  return {
    fetchCount: 0,
    fetchQuery(options) {
      this.fetchCount += 1;
      const key = keyOf(options.queryKey);
      states.set(key, { fetchStatus: "fetching", status: "pending" });
      emit();
      return Promise.resolve(options.queryFn({
        client: this,
        meta: options.meta,
        queryKey: options.queryKey,
        signal: new AbortController().signal,
      })).then((value) => {
        data.set(key, value);
        states.set(key, {
          data: value,
          dataUpdatedAt: Date.now(),
          error: null,
          fetchStatus: "idle",
          status: "success",
        });
        emit();
        return value;
      });
    },
    getQueryCache() {
      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      };
    },
    getQueryData(queryKey) {
      return data.get(keyOf(queryKey));
    },
    getQueryState(queryKey) {
      return states.get(keyOf(queryKey));
    },
    setQueryData(queryKey, value) {
      data.set(keyOf(queryKey), value);
    },
  };
}

const scope = signals.createScope("Workspace");
const queryClient = createQueryClient();
const state = signals.createScopeState(scope, { workspaceId: "workspace-1" }, { queryClient });
const suffixSignal = signals.createScopedSignal(scope, "active");
let observedContext;
const taskFamily = signals.createQueryFamily(
  scope,
  (parameter, context) => {
    observedContext = context;
    return {
      queryKey: ["task", context.scope.value.workspaceId, parameter.id, context.get(suffixSignal)],
      queryFn: () => ({ id: parameter.id, suffix: context.get(suffixSignal) }),
      staleTime: Infinity,
    };
  },
  { excludeFieldsFromKey: ["requestId"] },
);

check(taskFamily.kind === "readable-family", "marks query families as readable families");
check(taskFamily.queryKind === "query", "marks the family as a finite query family");
check(taskFamily.autoDisposeMs === 0, "enables immediate auto disposal by default");
const first = signals.resolveScopedQueryFamily(
  taskFamily,
  { id: "task-1", requestId: "first" },
  state,
);
const equivalent = signals.resolveScopedQueryFamily(
  taskFamily,
  { requestId: "second", id: "task-1" },
  state,
);
check(first.atom === equivalent.atom, "uses stable parameter keys and excluded fields");
check(first.store.get(first.atom).isFetching, "starts an enabled family member query");
await new Promise((resolve) => setTimeout(resolve, 0));
const success = first.store.get(first.atom);
check(success.isSuccess, "publishes a successful family member result");
check(success.data.id === "task-1" && success.data.suffix === "active", "binds the member parameter and scoped state");
check(observedContext.queryClient === queryClient, "provides the owning query client");
check(queryClient.fetchCount === 1, "fetches a cached member once");

const scopeApi = signals.getScopeApi(state);
check(
  scopeApi.get(taskFamily, { id: "task-1" }).data.id === "task-1",
  "reads query family members through ScopeApi",
);

const disabledFamily = signals.withQueryReadOptions(taskFamily, { enabled: false });
check(disabledFamily !== taskFamily, "creates a disabled family reader variant");
const disabledClient = createQueryClient();
const disabledState = signals.createScopeState(scope, { workspaceId: "workspace-2" }, {
  queryClient: disabledClient,
});
const disabled = signals.resolveScopedQueryFamily(disabledFamily, { id: "task-2" }, disabledState);
check(!disabled.store.get(disabled.atom).isEnabled, "reports disabled family members");
check(disabledClient.fetchCount === 0, "does not fetch disabled family members");

const secondClient = createQueryClient();
const secondState = signals.createScopeState(scope, { workspaceId: "workspace-3" }, {
  queryClient: secondClient,
});
const second = signals.resolveScopedQueryFamily(taskFamily, { id: "task-1" }, secondState);
check(second.atom !== first.atom, "isolates members across scope instances");

const disposable = signals.resolveScopedQueryFamily(taskFamily, { id: "task-3" }, state);
const unsubscribe = disposable.store.sub(disposable.atom, () => {});
await new Promise((resolve) => setTimeout(resolve, 0));
unsubscribe();
await new Promise((resolve) => setTimeout(resolve, 10));
const recreated = signals.resolveScopedQueryFamily(taskFamily, { id: "task-3" }, state);
check(recreated.atom !== disposable.atom, "recreates an auto-disposed member");

check(taskFamily.evict(state, { id: "task-1" }), "evicts a member explicitly");
const afterEviction = signals.resolveScopedQueryFamily(taskFamily, { id: "task-1" }, state);
check(afterEviction.atom !== first.atom, "creates a fresh member after eviction");

const noClientState = signals.createScopeState(scope, { workspaceId: "missing" });
assert.throws(
  () => signals.resolveScopedQueryFamily(taskFamily, { id: "task-4" }, noClientState),
  /querySignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(`app-shared query family behavior: ${assertions}/${assertions} assertions passed`);
