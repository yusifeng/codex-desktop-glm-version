import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__loginAuthModelTest = {
  analytics: [],
  authCalls: [],
  browserEligibility: {
    arm64: true,
    browserHasVisibleWindow: true,
    browserIsRunning: true,
    deviceCheck: true,
    eligible: true,
    macOS: true,
  },
  canceledProbes: [],
  cookies: new Map(),
  counters: [],
  disposed: 0,
  flushes: [],
  location: {
    hash: "",
    key: "key-1",
    pathname: "/auth",
    search: "",
    state: null,
  },
  loginOptions: null,
  profile: { id: "profile-1" },
  queryOptions: null,
  queryResult: {
    data: undefined,
    isError: false,
    isFetching: true,
    refetch: async () => {},
  },
  scopedFamilies: [],
  scopedSignals: [],
  stableId: "stable-1",
  stateCursor: 0,
  stateValues: [],
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: { randomUUID: () => "uuid-1" },
});

async function bundle(directory) {
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
    const reactRuntime = { useRef: initial => ({ current: initial }), useState(initial) { const index = globalThis.__loginAuthModelTest.stateCursor++; const value = globalThis.__loginAuthModelTest.stateValues[index] ?? (typeof initial === "function" ? initial() : initial); return [value, next => { globalThis.__loginAuthModelTest.stateValues[index] = next; }]; } };
    export const $3 = () => {}; export const FX = () => {}; export const QI = () => {}; export const wL = () => {}; export const gL = () => {};
    export const I3 = () => globalThis.__loginAuthModelTest.jsx; export const ZI = { id: "app" }; export const e6 = Object.assign(() => reactRuntime, reactRuntime);
    const scope = { get(signal) { if (signal?.id === "product") return { flush: async timeout => globalThis.__loginAuthModelTest.flushes.push(timeout) }; if (signal?.id === "version") return { data: { version: "1.2.3" } }; return {}; }, value: {}, scope: {}, queryClient: {}, query: {} };
    export const LX = () => scope; export const _L = options => { globalThis.__loginAuthModelTest.queryOptions = options; return globalThis.__loginAuthModelTest.queryResult; };
    export const VJ = () => true; export const Cq = { allowDebugMenu: () => true };
    export const eZ = (scopeValue, factory) => { const value = { kind: "signal", factory, scope: scopeValue }; globalThis.__loginAuthModelTest.scopedSignals.push(value); return value; };
    export const QX = (scopeValue, factory) => { const value = { kind: "family", factory, scope: scopeValue }; globalThis.__loginAuthModelTest.scopedFamilies.push(value); return value; };
  `;
  if (name === "app-initial")
    return `
    export const Bfn = () => {}; export const Bgn = () => {}; export const Eon = () => {}; export const Lfn = () => {}; export const Wgn = () => {}; export const l$t = () => {};
    export const Ifn = { id: "capabilities" }; export const Ton = () => new Error("aborted"); export const ugn = "local"; export const zgn = "origin";
    export const Ugn = () => ({ createChatGptLoginSession(options) { globalThis.__loginAuthModelTest.loginOptions = options; return globalThis.__loginAuthModelTest.loginSession; } });
    export const Vgn = () => ({ StableID: { get: () => globalThis.__loginAuthModelTest.stableId } }); export const c$t = { id: "version" };
    export const _s = () => {}; export const gs = { id: "eligibility-event" }; export const hs = { id: "profile-event" }; export const mnt = () => {}; export const ypn = () => {};
    export const Oun = () => "desktop"; export const xpn = (scope, event, fields) => globalThis.__loginAuthModelTest.analytics.push({ scope, event, fields });
    export const pnt = {
      appInfo: { get: async () => ({ chatGptDesktopAuthOrigin: "https://desktop.example" }) },
      chatGptBrowserSession: {
        getLookupEligibility: async () => globalThis.__loginAuthModelTest.browserEligibility,
        cancelProbe: id => globalThis.__loginAuthModelTest.canceledProbes.push(id),
        probe: async (id, url, securityLevel, onDebug) => { globalThis.__loginAuthModelTest.probe = { id, url, securityLevel }; onDebug?.({ source: "renderer", stage: "probe" }); return globalThis.__loginAuthModelTest.profile; },
      },
    };
    export const Cpn = { id: "product" }; export const Qgn = () => {}; export const Ix = () => {}; export const mn = () => {}; export const cc = () => {};
    export const an = { ACCESS_FLOW_ENTRY_ACTION_TYPE_PAGE_LOADED: "page-loaded" }; export const on = { ACCESS_FLOW_ENTRY_POINT_AUTH_LOGIN_PAGE: "login-page" }; export const sn = { ACCESS_FLOW_ENTRY_TRIGGER_AUTOMATIC: "automatic" }; const entryEvent = { id: "entry-event" }; export { entryEvent as in };
    export const sc = { count: (...args) => globalThis.__loginAuthModelTest.counters.push(args) };
    export const Fx = (target, fallback) => new URL(target ?? fallback ?? "/", "https://chatgpt.com").toString();
    export const Rx = async (url, parameters, signal, flow) => { globalThis.__loginAuthModelTest.authCalls.push({ url, parameters, signal, flow }); return { ok: true, url }; };
    export const Ycn = () => ({ getCookie: name => globalThis.__loginAuthModelTest.cookies.get(name), setCookie: (name, value, options) => { globalThis.__loginAuthModelTest.cookies.set(name, value); globalThis.__loginAuthModelTest.cookieOptions = options; } });
    export const i_n = () => globalThis.__loginAuthModelTest.location;
  `;
  if (name === "auth-handoff-page")
    return `export const n = () => {}; export const t = "AuthHandoffPage";`;
  return "export const sideEffect = true;";
}

state.loginSession = {
  cancel: async () => {
    state.canceledLogin = true;
  },
  getStartResult: async () => ({ authUrl: "https://auth.example" }),
  waitForCompletion: async () => "complete",
  [Symbol.dispose]: () => state.disposed++,
};
const desktopAuth = await bundle("chatgpt-desktop-auth-url");
assert.equal(
  desktopAuth.t({
    authUrl: "https://auth.example/login",
    useDesktopAuth: false,
    useStreamlinedLoginUx: false,
    sourceSurfaceStableId: null,
  }),
  "https://auth.example/login",
);
let builtUrl = desktopAuth.t({
  authUrl: "https://auth.example/login",
  allowedWorkspaceId: "workspace-1",
  codexAppVersion: "1.2.3",
  currentWorkspaceId: "workspace-2",
  loginHint: "person@example.com",
  includeCodexOriginStableId: true,
  useDesktopAuth: false,
  useStreamlinedLoginUx: true,
});
let parsed = new URL(builtUrl);
assert.equal(parsed.searchParams.get("allowed_workspace_id"), "workspace-1");
assert.equal(parsed.searchParams.get("source_surface_stable_id"), "stable-1");
assert.equal(parsed.searchParams.get("codex_origin_stable_id"), "stable-1");
assert.equal(parsed.searchParams.get("codex_streamlined_login"), "true");
builtUrl = desktopAuth.t({
  authUrl: "https://auth.example/login",
  useDesktopAuth: true,
  useStreamlinedLoginUx: false,
  sourceSurfaceStableId: null,
  desktopAuthOrigin: "https://desktop.example",
});
parsed = new URL(builtUrl);
assert.equal(parsed.pathname, "/codex/desktop-auth");
assert.equal(
  new URL(parsed.searchParams.get("authorize_url")).hostname,
  "auth.example",
);
assert.equal(
  desktopAuth.t({
    authUrl: "not a url",
    useDesktopAuth: true,
    useStreamlinedLoginUx: true,
  }),
  "not a url",
);
assert.equal(
  desktopAuth.n({ get: () => ({ data: { version: "1.2.3" } }) }),
  "1.2.3",
);
const loginStart = await desktopAuth.a({
  scope: { get: () => ({}) },
  useHostedLoginSuccessPage: true,
  useStreamlinedLogin: true,
});
assert.equal(loginStart.authUrl, "https://auth.example");
assert.equal(state.loginOptions.appBrand, "chatgpt");
assert.equal(await loginStart.completion, "complete");
assert.equal(state.disposed, 1);

const browserSession = await bundle("browser-session-queries");
browserSession.r();
const eligibilityOptions = state.scopedSignals
  .at(-1)
  .factory({ scope: { id: "scope" } });
assert.deepEqual(eligibilityOptions.queryKey, [
  "chatgpt-browser-session-lookup-eligibility",
]);
assert.equal((await eligibilityOptions.queryFn()).eligible, true);
assert.equal(state.analytics.at(-1).fields.browserIsRunning, true);
const profileOptions = state.scopedFamilies
  .at(-1)
  .factory("high", { scope: { id: "scope" } });
assert.deepEqual(profileOptions.queryKey, [
  "chatgpt-browser-session-profile",
  "high",
]);
assert.equal(
  (await profileOptions.queryFn({ signal: new AbortController().signal })).id,
  "profile-1",
);
assert.equal(state.probe.url, "https://desktop.example/codex/desktop-session");
assert.equal(state.probe.securityLevel, "high");
assert.equal(browserSession.i().at(-1).stage, "profile_query_completed");
let listenerCalls = 0;
const unsubscribe = browserSession.o(() => listenerCalls++);
state.scopedFamilies
  .at(-1)
  .factory("low", { scope: { id: "scope" } })
  .queryFn({ signal: new AbortController().signal });
await Promise.resolve();
assert.ok(listenerCalls > 0);
unsubscribe();

const loginHandoff = await bundle("browser-login-handoff-page-core");
loginHandoff.n();
state.cookies.set("oai-asli", "existing-session");
state.location = {
  hash: "",
  key: "login-1",
  pathname: "/auth",
  search:
    "?connection=google-oauth2&login_hint=person%40example.com&screen_hint=signup&ext-web-mobile-direct-social-login=true&callback_path=%2Fhome",
  state: null,
};
state.queryResult = {
  data: undefined,
  isError: false,
  isFetching: true,
  refetch: async (options) => {
    state.refetchOptions = options;
  },
};
state.stateValues = [];
state.stateCursor = 0;
let loginNode = loginHandoff.t({ flow: "login" });
assert.equal(loginNode.type, "AuthHandoffPage");
assert.equal(loginNode.props.pending, true);
await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(
  state.authCalls.at(-1).parameters.auth_session_logging_id,
  "existing-session",
);
assert.equal(
  state.authCalls.at(-1).parameters.login_hint,
  "person@example.com",
);
assert.equal(state.authCalls.at(-1).parameters.screen_hint, "signup");
assert.equal(
  state.authCalls.at(-1).parameters["ext-web-mobile-direct-social-login"],
  "true",
);
loginNode.props.onRetry();
assert.deepEqual(state.refetchOptions, { cancelRefetch: false });
state.location = {
  hash: "#offer",
  key: "sso-1",
  pathname: "/auth",
  search: "?connection=conn_enterprise&next=%2Fpurchase%2Fpro",
  state: null,
};
state.stateValues = [];
state.stateCursor = 0;
loginHandoff.t({ flow: "sso" });
await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.authCalls.at(-1).parameters.connection_provider, "2");
assert.match(state.authCalls.at(-1).url, /purchase\/pro#offer$/);
assert.equal(state.analytics.at(-1).fields.selectedPlanType, "pro");
assert.deepEqual(state.flushes, [1000]);

console.log("33 login auth model cluster assertions passed");
