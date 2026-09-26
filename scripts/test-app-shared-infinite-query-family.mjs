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
  const keyOf = (queryKey) => JSON.stringify(queryKey);
  return {
    getQueryCache() {
      return { subscribe: () => () => {} };
    },
    getQueryData(queryKey) {
      return data.get(keyOf(queryKey));
    },
    setQueryData(queryKey, value) {
      data.set(keyOf(queryKey), value);
    },
  };
}

const scope = signals.createScope("InfiniteFamilyWorkspace");
const queryClient = createQueryClient();
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient },
);
let observedContext;
const feedFamily = signals.createInfiniteQueryFamily(
  scope,
  (parameter, context) => {
    observedContext = context;
    return {
      getNextPageParam(lastPage) {
        return lastPage.cursor < 1 ? lastPage.cursor + 1 : undefined;
      },
      initialPageParam: 0,
      queryFn({ pageParam }) {
        return {
          cursor: pageParam,
          id: `${context.scope.value.workspaceId}:${parameter.feedId}:${pageParam}`,
        };
      },
      queryKey: ["feed", context.scope.value.workspaceId, parameter.feedId],
      staleTime: Infinity,
    };
  },
  { excludeFieldsFromKey: ["requestId"] },
);

check(feedFamily.kind === "readable-family", "marks infinite query families as readable families");
check(feedFamily.queryKind === "infinite", "marks the family as an infinite query family");
check(feedFamily.autoDisposeMs === 0, "enables immediate auto disposal by default");
const first = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { feedId: "inbox", requestId: "first" },
  state,
);
const equivalent = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { requestId: "second", feedId: "inbox" },
  state,
);
check(first.atom === equivalent.atom, "uses stable parameter keys and excluded fields");
check(first.store.get(first.atom).isFetching, "starts an enabled family member query");
await new Promise((resolve) => setTimeout(resolve, 0));
const success = first.store.get(first.atom);
check(success.isSuccess, "publishes a successful family member result");
check(
  success.data.pages[0].id === "workspace-1:inbox:0",
  "binds the member parameter and scope value",
);
check(observedContext.queryClient === queryClient, "provides the owning query client");
await success.fetchNextPage();
check(
  first.store.get(first.atom).data.pages.map((page) => page.cursor).join(",") === "0,1",
  "retains member-specific pagination state",
);

const scopeApi = signals.getScopeApi(state);
check(
  scopeApi.get(feedFamily, { feedId: "inbox" }).data.pages.length === 2,
  "reads infinite-query family members through ScopeApi",
);

const disabledFamily = signals.withQueryReadOptions(feedFamily, {
  enabled: false,
});
check(disabledFamily !== feedFamily, "creates a disabled family reader variant");
const disabledState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: createQueryClient() },
);
const disabled = signals.resolveScopedInfiniteQueryFamily(
  disabledFamily,
  { feedId: "archive" },
  disabledState,
);
check(!disabled.store.get(disabled.atom).isEnabled, "reports disabled family members");
await new Promise((resolve) => setTimeout(resolve, 0));
check(disabled.store.get(disabled.atom).data === undefined, "does not fetch disabled family members");

const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-3" },
  { queryClient: createQueryClient() },
);
const second = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { feedId: "inbox" },
  secondState,
);
check(second.atom !== first.atom, "isolates members across scope instances");

const disposable = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { feedId: "temporary" },
  state,
);
const unsubscribe = disposable.store.sub(disposable.atom, () => {});
await new Promise((resolve) => setTimeout(resolve, 0));
unsubscribe();
await new Promise((resolve) => setTimeout(resolve, 10));
const recreated = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { feedId: "temporary" },
  state,
);
check(recreated.atom !== disposable.atom, "recreates an auto-disposed member");

check(feedFamily.evict(state, { feedId: "inbox" }), "evicts a member explicitly");
const afterEviction = signals.resolveScopedInfiniteQueryFamily(
  feedFamily,
  { feedId: "inbox" },
  state,
);
check(afterEviction.atom !== first.atom, "creates a fresh member after eviction");

const noClientState = signals.createScopeState(scope, {
  workspaceId: "missing",
});
assert.throws(
  () =>
    signals.resolveScopedInfiniteQueryFamily(
      feedFamily,
      { feedId: "missing" },
      noClientState,
    ),
  /infiniteQuerySignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(
  `app-shared infinite query family behavior: ${assertions}/${assertions} assertions passed`,
);
