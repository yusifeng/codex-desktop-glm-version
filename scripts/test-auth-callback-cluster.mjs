import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__authCallbackTest = {
  accountId: null,
  closed: 0,
  confirmPlaid: true,
  effects: [],
  navigated: [],
  queryFamilyFactory: null,
  queryResult: { data: undefined, isError: false },
  safePostCalls: [],
  stateCursor: 0,
  stateValues: [],
  toastDanger: [],
  toastSuccess: [],
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});
globalThis.window = {
  location: { origin: "https://chatgpt.com" },
  close: () => state.closed++,
  setTimeout: (callback, delay) => {
    state.timeout = { callback, delay };
    return 1;
  },
  clearTimeout: () => {},
};

async function bundle(directory) {
  state.effects = [];
  state.stateCursor = 0;
  state.stateValues = [];
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents: mockChunk(importPath),
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

function mockChunk(name) {
  if (name === "app-shared")
    return `
    const toast = { success: message => globalThis.__authCallbackTest.toastSuccess.push(message), danger: (message, options) => globalThis.__authCallbackTest.toastDanger.push({ message, options }) };
    const reactRuntime = {
      useEffect(effect) { globalThis.__authCallbackTest.effects.push(effect()); },
      useState(initial) { const index = globalThis.__authCallbackTest.stateCursor++; const current = globalThis.__authCallbackTest.stateValues[index] ?? initial; return [current, value => { globalThis.__authCallbackTest.stateValues[index] = value; }]; },
    };
    export const $3 = () => {}; export const $h = () => {}; export const FX = () => {}; export const K2 = () => {}; export const QI = () => {}; export const jZ = () => {}; export const lk = () => {};
    export const I3 = () => globalThis.__authCallbackTest.jsx; export const Qh = "LoadingSpinner"; export const Y2 = "FormattedMessage"; export const ZI = { id: "app-scope" };
    export const e6 = Object.assign(() => reactRuntime, reactRuntime); export const HX = () => globalThis.__authCallbackTest.accountId;
    export const BX = () => globalThis.__authCallbackTest.queryResult;
    export const QX = (scope, factory) => { globalThis.__authCallbackTest.queryFamilyFactory = factory; return { scope, factory }; };
    export const FZ = async () => { throw new Error("missing parameter"); };
    export const LX = () => ({ get: () => toast }); export const pk = { id: "toast" };
    export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });
  `;
  if (name === "app-initial")
    return `
    export const Qgn = () => {}; export const Sun = () => {}; export const cJt = () => {}; export const M6t = () => {};
    export const mun = { id: "account" }; export const i_n = () => ({ pathname: "/oauth/callback", search: "?code=1", hash: "#done" });
    export const o_n = () => (destination, options) => globalThis.__authCallbackTest.navigated.push({ destination, options });
    export const rJt = { safePost: async (url, options) => { globalThis.__authCallbackTest.safePostCalls.push({ url, options }); return { postAuthRedirectPath: "/health" }; } };
    export const N6t = () => ({ accountId: globalThis.__authCallbackTest.accountId });
  `;
  if (name === "plaid-link")
    return `
    export const n = () => {}; export const t = accountId => "/finance/" + accountId;
    export const r = async () => { if (globalThis.__authCallbackTest.confirmPlaid instanceof Error) throw globalThis.__authCallbackTest.confirmPlaid; return globalThis.__authCallbackTest.confirmPlaid; };
  `;
  return "export const sideEffect = true;";
}

const callback = await bundle("callback-utility");
assert.equal(await callback.r(Promise.resolve("done"), 20), "done");
await assert.rejects(callback.r(new Promise(() => {}), 5), /Promise timed out/);
const telemetry = {
  logs: [],
  increments: [],
  log(level, message, context) {
    this.logs.push({ level, message, context });
  },
  stats: {
    increment(metric) {
      telemetry.increments.push(metric);
    },
  },
};
assert.equal(await callback.n(telemetry, () => "ok", 0), telemetry);
assert.equal(telemetry.logs.length, 0);
await callback.n(
  telemetry,
  () => {
    throw new Error("boom");
  },
  0,
);
assert.equal(telemetry.logs[0].message, "Callback Error");
assert.deepEqual(telemetry.increments, ["callback_error"]);

const health = await bundle("health-oauth-callback-page");
state.accountId = null;
assert.equal(health.HealthOAuthCallbackPage().type, "LoadingSpinner");
state.accountId = "account-1";
state.queryResult = { data: undefined, isError: false };
state.stateValues = [];
state.stateCursor = 0;
let healthNode = health.HealthOAuthCallbackPage();
assert.equal(healthNode.type.name, "HealthOAuthCallbackContent");
assert.equal(healthNode.type(healthNode.props).props.role, "status");
const queryOptions = state.queryFamilyFactory(
  { accountId: "account-1", url: "https://chatgpt.com/oauth" },
  { get: () => "account-1" },
);
assert.deepEqual(queryOptions.queryKey, [
  "health",
  "account-1",
  "oauth-callback",
  "https://chatgpt.com/oauth",
]);
assert.equal(queryOptions.enabled, true);
await queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.safePostCalls.at(-1).url, "/aip/olympic/oauth/callback");
assert.equal(
  state.safePostCalls.at(-1).options.additionalHeaders["ChatGPT-Account-ID"],
  "account-1",
);
state.queryResult = { data: undefined, isError: true };
state.stateValues = ["account-1"];
state.stateCursor = 0;
healthNode = health.HealthOAuthCallbackPage();
healthNode.type(healthNode.props);
assert.equal(state.navigated.at(-1).destination, "/");
state.queryResult = {
  data: { postAuthRedirectPath: "/health" },
  isError: false,
};
state.stateValues = ["account-1"];
state.stateCursor = 0;
healthNode = health.HealthOAuthCallbackPage();
healthNode.type(healthNode.props);
assert.equal(state.closed, 1);
assert.equal(state.timeout.delay, 150);
state.timeout.callback();
assert.equal(state.navigated.at(-1).destination, "/health");
state.accountId = "account-2";
state.stateValues = ["account-1"];
state.stateCursor = 0;
healthNode = health.HealthOAuthCallbackPage();
const changedAccountNode = healthNode.type(healthNode.props);
assert.equal(changedAccountNode.props.children.props.id, "health.oauth.error");

const plaid = await bundle("plaid-callback-page");
state.accountId = null;
let plaidNode = plaid.PersonalFinancePlaidCallbackPage();
assert.equal(plaidNode.props.children.type, "LoadingSpinner");
assert.equal(state.toastSuccess.length, 0);
state.accountId = "account-3";
state.confirmPlaid = true;
plaid.PersonalFinancePlaidCallbackPage();
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(state.toastSuccess, [
  "Your financial account is now connected",
]);
assert.equal(state.navigated.at(-1).destination, "/finance/account-3");
assert.deepEqual(state.navigated.at(-1).options, { replace: true });
state.confirmPlaid = new Error("failed");
plaid.PersonalFinancePlaidCallbackPage();
await Promise.resolve();
await Promise.resolve();
assert.equal(
  state.toastDanger.at(-1).options.errorAnalytics.toastId,
  "personalFinance.accounts.connectionError",
);

console.log("24 auth callback cluster assertions passed");
