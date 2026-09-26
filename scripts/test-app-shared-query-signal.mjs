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
    lastOptions: undefined,
    fetchQuery(options) {
      this.fetchCount += 1;
      this.lastOptions = options;
      const key = keyOf(options.queryKey);
      states.set(key, {
        ...states.get(key),
        fetchStatus: "fetching",
        status: data.has(key) ? "success" : "pending",
      });
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
    setExternalData(queryKey, value) {
      const key = keyOf(queryKey);
      data.set(key, value);
      states.set(key, {
        data: value,
        dataUpdatedAt: Date.now(),
        error: null,
        fetchStatus: "idle",
        status: "success",
      });
      emit();
    },
    setQueryData(queryKey, value) {
      data.set(keyOf(queryKey), value);
    },
  };
}

const scope = signals.createScope("Workspace");
const queryClient = createQueryClient();
const state = signals.createScopeState(scope, { workspaceId: "workspace-1" }, { queryClient });
const filterSignal = signals.createScopedSignal(scope, "open");
let queryContext;
const tasksQuery = signals.createQuerySignal(scope, ({ get, queryClient: activeClient, scope: activeScope }) => ({
  meta: { source: "tasks" },
  queryFn(context) {
    queryContext = context;
    return [{ id: `${activeScope.value.workspaceId}:${get(filterSignal)}` }];
  },
  queryKey: ["tasks", activeScope.value.workspaceId, get(filterSignal)],
  staleTime: Infinity,
}));

check(tasksQuery.cache === "cached", "marks query signals as cached bindings");
check(tasksQuery.queryKind === "query", "marks the binding as a finite query");
const first = signals.resolveScopedQuerySignal(tasksQuery, state);
const firstAgain = signals.resolveScopedQuerySignal(tasksQuery, state);
check(first.atom === firstAgain.atom, "reuses one query atom per scope instance");

const initial = first.store.get(first.atom);
check(initial.isPending && initial.isFetching, "starts an enabled empty query on mount");
check(initial.refetch === first.store.get(first.atom).refetch, "keeps a stable refetch function");
await new Promise((resolve) => setTimeout(resolve, 0));
const success = first.store.get(first.atom);
check(success.isSuccess && !success.isFetching, "publishes a successful settled result");
check(success.data[0].id === "workspace-1:open", "derives options from scope and signal state");
check(queryContext.queryKey.join("/") === "tasks/workspace-1/open", "passes the semantic query key to queryFn");
check(queryContext.meta.source === "tasks", "passes query metadata to queryFn");
check(queryContext.client === queryClient, "passes the owning query client to queryFn");
check(queryContext.signal instanceof AbortSignal, "passes an abort signal to queryFn");
check(!success.isStale, "honors an infinite stale time");
check(queryClient.fetchCount === 1, "fetches once for the initial mount");

let notifications = 0;
const unsubscribe = first.store.sub(first.atom, () => {
  notifications += 1;
});
queryClient.setExternalData(["tasks", "workspace-1", "open"], [{ id: "external" }]);
check(first.store.get(first.atom).data[0].id === "external", "reacts to query-cache updates");
check(notifications > 0, "notifies subscribers after a cache update");

state.store.set(filterSignal.resolve(state), "closed");
const changedKey = first.store.get(first.atom);
check(changedKey.isPending && changedKey.data === undefined, "does not leak data across query keys");
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  first.store.get(first.atom).data[0].id === "workspace-1:closed",
  "refetches when a scoped dependency changes the query key",
);
unsubscribe();

await success.refetch();
check(queryClient.fetchCount === 3, "refetch delegates to the query client");

const disabled = signals.withQueryReadOptions(tasksQuery, { enabled: false });
check(disabled !== tasksQuery, "creates a cached disabled reader variant");
const disabledState = signals.createScopeState(scope, { workspaceId: "workspace-2" }, {
  queryClient: createQueryClient(),
});
const disabledBinding = signals.resolveScopedQuerySignal(disabled, disabledState);
const disabledResult = disabledBinding.store.get(disabledBinding.atom);
check(!disabledResult.isEnabled, "reports disabled query readers");
check(disabledState.queryClient.fetchCount === 0, "does not fetch a disabled query reader");

const secondClient = createQueryClient();
const secondState = signals.createScopeState(scope, { workspaceId: "workspace-3" }, {
  queryClient: secondClient,
});
const second = signals.resolveScopedQuerySignal(tasksQuery, secondState);
check(second.atom !== first.atom, "isolates query atoms across scope instances");

const noClientState = signals.createScopeState(scope, { workspaceId: "missing" });
assert.throws(
  () => signals.resolveScopedQuerySignal(tasksQuery, noClientState),
  /querySignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(`app-shared query signal behavior: ${assertions}/${assertions} assertions passed`);
