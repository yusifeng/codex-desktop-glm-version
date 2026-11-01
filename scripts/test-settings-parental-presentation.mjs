import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeMock =
  "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
const appSharedMock = String.raw`
export const $O = { ONE_MINUTE: 60000 };
export const FX = () => {};
export const H3 = () => {};
export const QI = () => {};
export const ZI = { key: "application-scope" };
export const ek = () => {};
export const sZ = (_scope, derive) => ({ key: "family-invite", derive });
const React = {
  lazy: loader => props => ({ kind: "lazy", loader, props }),
  useCallback: callback => callback,
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
};
export const e6 = Object.assign(() => React, React);
export const $3 = () => ({ c: size => Array(size).fill(Symbol.for("react.memo_cache_sentinel")) });
export const V3 = async loader => loader();
`;
const appInitialMock = String.raw`
export class Sdn extends Error { constructor(status) { super("http " + status); this.status = status; } }
export const U6t = { key: "active-account" };
export const _un = { key: "active-user" };
export const mun = { key: "family-account" };
export const bL = { key: "parental-access" };
export const Hzt = () => false;
export const Uzt = (_scope, _component, props, options) => {
  globalThis.__parentalPresentationCalls.push({ type: "open", props, options });
};
export const zzt = () => globalThis.__parentalPresentationCalls.push({ type: "close" });
export const hdn = () => "en-US";
export const mdn = "OpenAI-Locale";
export const rJt = {
  safeGet: async (requestPath, options) =>
    requestPath === "/amphora/notifications"
      ? { items: [{ id: "notification-1", seen_at: null, reacted_to_at: null }], requestPath }
      : { requestPath, options },
};
export const Sqt=()=>{}, Sun=()=>{}, Vzt=()=>{}, cJt=()=>{}, fpn=()=>{}, gdn=()=>{}, wdn=()=>{}, xL=()=>{};
`;
const familySurfaceMock = "export const FamilyNotification=props=>props;";

async function bundle(entry, exact) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "parental-presentation-runtime",
        setup(build) {
          build.onResolve(
            {
              filter: exact ? /^(?:\.\/|@exact-chunk\/).*\.js$/ : /^@rchunk\//,
            },
            ({ path: modulePath }) => {
              const id = modulePath.includes("rolldown-runtime")
                ? "runtime"
                : modulePath.includes("app-shared")
                  ? "app-shared"
                  : modulePath.includes("app-initial")
                    ? "app-initial"
                    : "family-surface";
              return { path: id, namespace: "mock" };
            },
          );
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: id }) => ({
            contents:
              id === "runtime"
                ? runtimeMock
                : id === "app-shared"
                  ? appSharedMock
                  : id === "app-initial"
                    ? appInitialMock
                    : familySurfaceMock,
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${exact ? "exact" : "semantic"}`
  );
}

const semantic = await bundle(
  "src/renderer/settings-parental-presentation/index.ts",
  false,
);
const exact = await bundle(
  ".reference/app-original/webview/assets/presentation-eeb7ac6fced2.js",
  true,
);
semantic.a();
exact.a();
semantic.u();
exact.u();

function createScope(overrides = {}) {
  const state = {
    access: { status: "allowed", userId: "user-1", accountId: "account-1" },
    activeUser: "user-1",
    activeAccount: "account-1",
    familyAccount: "account-1",
    familyInvite: false,
    ...overrides,
  };
  const listeners = new Set();
  const scope = {
    node: {},
    value: state,
    get(signal) {
      if (signal?.key === "parental-access") return state.access;
      if (signal?.key === "active-user") return state.activeUser;
      if (signal?.key === "active-account") return state.activeAccount;
      if (signal?.key === "family-account") return state.familyAccount;
      if (signal?.key === "family-invite") return state.familyInvite;
      return undefined;
    },
    watch(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(next) {
      Object.assign(state, next);
      for (const listener of listeners) listener(scope);
    },
  };
  return scope;
}

function queryClient(dataByKey = new Map()) {
  const queries = [];
  return {
    queries,
    cancelQueries() {},
    getQueryData(key) {
      return dataByKey.get(JSON.stringify(key));
    },
    getQueryCache() {
      return {
        find: () => undefined,
        findAll: () => queries,
      };
    },
  };
}

const semanticQueries = semantic.d("user-1", "account-1", "zh-CN");
const exactQueries = exact.d("user-1", "account-1", "zh-CN");
for (const key of ["current", "layout"]) {
  assert.deepEqual(semanticQueries[key].queryKey, exactQueries[key].queryKey);
  assert.equal(semanticQueries[key].staleTime, exactQueries[key].staleTime);
  assert.equal(semanticQueries[key].retry, exactQueries[key].retry);
}
assert.deepEqual(
  semanticQueries.settings("family-1", "member-1").queryKey,
  exactQueries.settings("family-1", "member-1").queryKey,
);
assert.deepEqual(
  semanticQueries.members("family-1").queryKey,
  exactQueries.members("family-1").queryKey,
);
assert.deepEqual(
  semanticQueries.notifications("cursor-1").queryKey,
  exactQueries.notifications("cursor-1").queryKey,
);

const context = {
  client: queryClient(),
  queryKey: semanticQueries.current.queryKey,
  signal: new AbortController().signal,
};
assert.deepEqual(
  await semanticQueries.current.queryFn(context),
  await exactQueries.current.queryFn({
    ...context,
    queryKey: exactQueries.current.queryKey,
  }),
);
assert.deepEqual(
  await semanticQueries.layout.queryFn(context),
  await exactQueries.layout.queryFn(context),
);
assert.deepEqual(
  await semanticQueries.settings("family-1", "member-1").queryFn(context),
  await exactQueries.settings("family-1", "member-1").queryFn(context),
);
assert.deepEqual(
  await semanticQueries.members("family-1").queryFn(context),
  await exactQueries.members("family-1").queryFn(context),
);

const optimisticKey = semanticQueries.notifications("cursor-1").queryKey;
const optimistic = new Map([
  [
    JSON.stringify(optimisticKey),
    {
      items: [
        { id: "notification-1", seen_at: "seen", reacted_to_at: "reacted" },
        { id: "notification-2", seen_at: null, reacted_to_at: null },
      ],
    },
  ],
]);
const notificationContext = {
  client: queryClient(optimistic),
  queryKey: optimisticKey,
  signal: new AbortController().signal,
};
assert.deepEqual(
  await semanticQueries.notifications("cursor-1").queryFn(notificationContext),
  await exactQueries.notifications("cursor-1").queryFn(notificationContext),
);

const account = { userId: "user-1", accountId: "account-1" };
const semanticScope = createScope();
const exactScope = createScope();
assert.equal(semantic.p(semanticScope, account), exact.p(exactScope, account));
assert.equal(semantic.l(semanticScope, account, "notification-1"), false);
assert.equal(exact.l(exactScope, account, "notification-1"), false);
semantic.s(semanticScope, account, "decision-1", "allow");
exact.s(exactScope, account, "decision-1", "allow");
assert.equal(
  semantic.i(semanticScope, account, "decision-1"),
  exact.i(exactScope, account, "decision-1"),
);

const notification = { type: "notice", item: { id: "notification-1" } };
globalThis.__parentalPresentationCalls = [];
assert.equal(semantic.o(semanticScope, notification, account, "info"), true);
const normalizeCalls = (calls) =>
  calls.map((call) =>
    call.type === "open"
      ? {
          type: call.type,
          notification: call.props.notification,
          account: call.props.account,
          initialSurface: call.props.initialSurface,
          blocksOtherModals: call.options.blocksOtherModals,
        }
      : call,
  );
const semanticCalls = normalizeCalls(globalThis.__parentalPresentationCalls);
globalThis.__parentalPresentationCalls = [];
assert.equal(exact.o(exactScope, notification, account, "info"), true);
const exactCalls = normalizeCalls(globalThis.__parentalPresentationCalls);
assert.deepEqual(semanticCalls, exactCalls);
assert.equal(semantic.l(semanticScope, account, "notification-1"), true);
assert.equal(exact.l(exactScope, account, "notification-1"), true);

semanticScope.update({
  access: { status: "denied", userId: "user-1", accountId: "account-1" },
});
exactScope.update({
  access: { status: "denied", userId: "user-1", accountId: "account-1" },
});
assert.equal(
  semantic.i(semanticScope, account, "decision-1"),
  exact.i(exactScope, account, "decision-1"),
);

console.log("24 parental presentation parity assertions passed");
