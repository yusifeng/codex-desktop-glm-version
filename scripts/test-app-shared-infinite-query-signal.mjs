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
  const listeners = new Set();
  const keyOf = (queryKey) => JSON.stringify(queryKey);
  return {
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
    setExternalData(queryKey, value) {
      data.set(keyOf(queryKey), value);
      for (const listener of listeners) listener({ type: "updated" });
    },
    setQueryData(queryKey, value) {
      data.set(keyOf(queryKey), value);
    },
  };
}

const scope = signals.createScope("InfiniteWorkspace");
const queryClient = createQueryClient();
const state = signals.createScopeState(
  scope,
  { workspaceId: "workspace-1" },
  { queryClient },
);
const filterSignal = signals.createScopedSignal(scope, "active");
const queryContexts = [];
const feedQuery = signals.createInfiniteQuerySignal(
  scope,
  ({ get, scope: activeScope }) => ({
    getNextPageParam(lastPage) {
      return lastPage.cursor < 2 ? lastPage.cursor + 1 : undefined;
    },
    getPreviousPageParam(firstPage) {
      return firstPage.cursor > 0 ? firstPage.cursor - 1 : undefined;
    },
    initialPageParam: 0,
    maxPages: 2,
    async queryFn(context) {
      queryContexts.push(context);
      await Promise.resolve();
      return {
        cursor: context.pageParam,
        id: `${activeScope.value.workspaceId}:${get(filterSignal)}:${context.pageParam}`,
      };
    },
    queryKey: ["feed", activeScope.value.workspaceId, get(filterSignal)],
    staleTime: Infinity,
  }),
);

check(feedQuery.cache === "cached", "marks infinite queries as cached bindings");
check(feedQuery.queryKind === "infinite", "marks the binding as an infinite query");
const first = signals.resolveScopedInfiniteQuerySignal(feedQuery, state);
const firstAgain = signals.resolveScopedInfiniteQuerySignal(feedQuery, state);
check(first.atom === firstAgain.atom, "reuses one infinite-query atom per scope instance");

const initial = first.store.get(first.atom);
check(initial.isPending && initial.isFetching, "fetches the initial page on mount");
check(
  !initial.isFetchingNextPage && !initial.isFetchingPreviousPage,
  "does not label the initial request as directional pagination",
);
await new Promise((resolve) => setTimeout(resolve, 0));
const firstPage = first.store.get(first.atom);
check(firstPage.data.pages[0].cursor === 0, "stores the initial page and page parameter");
check(firstPage.data.pageParams[0] === 0, "tracks the initial page parameter");
check(firstPage.hasNextPage && !firstPage.hasPreviousPage, "derives pagination availability");
check(queryContexts[0].direction === "forward", "uses forward direction for the initial page");
check(queryContexts[0].client === queryClient, "passes the owning query client");
check(queryContexts[0].signal instanceof AbortSignal, "passes an abort signal to page queries");

const nextPromise = firstPage.fetchNextPage();
const fetchingNext = first.store.get(first.atom);
check(fetchingNext.isFetchingNextPage, "reports a forward page request in flight");
await nextPromise;
check(
  first.store.get(first.atom).data.pages.map((page) => page.cursor).join(",") === "0,1",
  "appends the next page",
);
await first.store.get(first.atom).fetchNextPage();
const trimmedForward = first.store.get(first.atom);
check(
  trimmedForward.data.pages.map((page) => page.cursor).join(",") === "1,2",
  "drops the oldest page when maxPages is reached",
);
check(!trimmedForward.hasNextPage && trimmedForward.hasPreviousPage, "updates edge availability");
const callsAtEnd = queryContexts.length;
await trimmedForward.fetchNextPage();
check(queryContexts.length === callsAtEnd, "does not fetch beyond the last page");

const previousPromise = first.store.get(first.atom).fetchPreviousPage();
check(first.store.get(first.atom).isFetchingPreviousPage, "reports a backward page request in flight");
await previousPromise;
const trimmedBackward = first.store.get(first.atom);
check(
  trimmedBackward.data.pages.map((page) => page.cursor).join(",") === "0,1",
  "prepends a previous page and trims the newest page",
);
check(queryContexts.at(-1).direction === "backward", "passes backward pagination direction");

await trimmedBackward.refetch();
check(
  first.store.get(first.atom).data.pages.map((page) => page.cursor).join(",") === "0",
  "refetch replaces the pagination window from the initial page",
);

queryClient.setExternalData(
  ["feed", "workspace-1", "active"],
  { pages: [{ cursor: 2, id: "external" }], pageParams: [2] },
);
check(first.store.get(first.atom).data.pages[0].id === "external", "reacts to query-cache updates");

state.store.set(filterSignal.resolve(state), "archived");
const changedKey = first.store.get(first.atom);
check(changedKey.isPending && changedKey.data === undefined, "does not leak pages across query keys");
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  first.store.get(first.atom).data.pages[0].id === "workspace-1:archived:0",
  "refetches the first page when a scoped query-key dependency changes",
);

const disabled = signals.withQueryReadOptions(feedQuery, { enabled: false });
check(disabled !== feedQuery, "creates a cached disabled reader variant");
const disabledState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-2" },
  { queryClient: createQueryClient() },
);
const disabledBinding = signals.resolveScopedInfiniteQuerySignal(disabled, disabledState);
const disabledResult = disabledBinding.store.get(disabledBinding.atom);
check(!disabledResult.isEnabled, "reports disabled infinite-query readers");
await new Promise((resolve) => setTimeout(resolve, 0));
check(disabledResult.data === undefined, "does not fetch a disabled infinite query");

const secondState = signals.createScopeState(
  scope,
  { workspaceId: "workspace-3" },
  { queryClient: createQueryClient() },
);
const second = signals.resolveScopedInfiniteQuerySignal(feedQuery, secondState);
check(second.atom !== first.atom, "isolates infinite-query atoms across scope instances");

const noClientState = signals.createScopeState(scope, { workspaceId: "missing" });
assert.throws(
  () => signals.resolveScopedInfiniteQuerySignal(feedQuery, noClientState),
  /infiniteQuerySignal requires a QueryClient on Scope/,
);
assertions += 1;

console.log(
  `app-shared infinite query signal behavior: ${assertions}/${assertions} assertions passed`,
);
