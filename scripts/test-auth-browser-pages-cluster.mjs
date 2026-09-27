import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__authBrowserPagesTest = {
  assigned: [],
  authStatus: "logged_out",
  clipboardRejects: false,
  cookieWrites: [],
  fetchResult: { ok: true, json: async () => ({ user: { id: "user-1" } }) },
  handoffCalls: [],
  location: {
    hash: "",
    key: "location-1",
    pathname: "/auth",
    search: "",
    state: null,
  },
  navigated: [],
  queryOptions: null,
  queryResult: null,
  refetchCalls: [],
  replaced: [],
  searchParams: new URLSearchParams(),
  stateCursor: 0,
  stateValues: [],
  timeouts: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});
Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: { randomUUID: () => "uuid-1" },
});
globalThis.fetch = async () => state.fetchResult;
globalThis.window = {
  location: {
    origin: "https://chatgpt.com",
    assign: (url) => state.assigned.push(url),
    replace: (url) => state.replaced.push(url),
  },
  setTimeout: (callback, delay) => {
    state.timeouts.push({ callback, delay });
    return state.timeouts.length;
  },
  clearTimeout: () => {},
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    userAgent: "Macintosh",
    clipboard: {
      writeText: async (value) => {
        state.copied = value;
        if (state.clipboardRejects) throw new Error("denied");
      },
    },
  },
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
    const reactRuntime = {
      useRef(initial) { return { current: initial }; },
      useState(initial) { const index = globalThis.__authBrowserPagesTest.stateCursor++; const current = globalThis.__authBrowserPagesTest.stateValues[index] ?? initial; const setter = value => { globalThis.__authBrowserPagesTest.stateValues[index] = typeof value === "function" ? value(current) : value; }; return [current, setter]; },
    };
    export const $3 = () => {}; export const I3 = () => globalThis.__authBrowserPagesTest.jsx; export const K2 = () => {}; export const Y2 = "FormattedMessage"; export const Yh = "Button"; export const Zh = () => {};
    export const e6 = Object.assign(() => reactRuntime, reactRuntime); export const gL = () => {}; export const g4 = () => {};
    export const _L = options => { globalThis.__authBrowserPagesTest.queryOptions = options; return globalThis.__authBrowserPagesTest.queryResult; };
    export const q4 = () => ({ min() { return this; }, optional() { return this; } });
    export const H4 = () => ({ safeParse(value) { return value && typeof value === "object" ? { success: true, data: value } : { success: false }; }, nullish() { return this; } });
  `;
  if (name === "app-initial")
    return `
    export const Fx = (target, fallback) => new URL(target ?? fallback ?? "/", "https://chatgpt.com").toString(); export const Ix = () => {}; export const Qgn = () => {};
    export const Pun = flow => new URL("https://chatgpt.com/auth/" + flow); export const Run = () => {}; export const dJt = () => {}; export const uJt = () => "device-1";
    export const Rx = async (url, parameters, signal, flow) => { globalThis.__authBrowserPagesTest.handoffCalls.push({ url, parameters, signal, flow }); return { ok: true, url: "https://auth.example/continue" }; };
    export const i_n = () => globalThis.__authBrowserPagesTest.location; export const d_n = () => [globalThis.__authBrowserPagesTest.searchParams];
    export const o_n = () => (destination, options) => globalThis.__authBrowserPagesTest.navigated.push({ destination, options });
    export const Ycn = () => ({ getCookie: () => undefined, setCookie: (...args) => globalThis.__authBrowserPagesTest.cookieWrites.push(args) });
    export const bfn = () => {}; export const yfn = () => ({ authStatus: globalThis.__authBrowserPagesTest.authStatus });
  `;
  if (name === "page-layout")
    return `export const n = () => {}; export const t = "PageLayout";`;
  if (name === "auth-handoff-page")
    return `export const n = () => {}; export const t = "AuthHandoffPage";`;
  return "export const sideEffect = true;";
}

const handoff = await bundle("auth-handoff-page");
let retryCalls = 0;
let handoffNode = handoff.t({ pending: true, onRetry: () => retryCalls++ });
assert.equal(handoffNode.type, "PageLayout");
assert.equal(handoffNode.props.children[1].props.role, "status");
handoffNode = handoff.t({
  pending: false,
  result: { ok: false },
  onRetry: () => retryCalls++,
});
assert.equal(
  handoffNode.props.children[2].props.children[0].props.role,
  "alert",
);
handoffNode.props.children[2].props.children[1].props.onClick();
assert.equal(retryCalls, 1);
handoffNode = handoff.t({
  pending: false,
  result: { ok: true, url: "https://auth.example/done" },
  onRetry: () => {},
});
assert.equal(
  handoffNode.props.children[0].props.href,
  "https://auth.example/done",
);
handoffNode.props.children[0].props.ref({});
assert.equal(state.replaced.at(-1), "https://auth.example/done");

state.location.search = "?next=%2Fsettings%3Ftab%3Dapps%23linked";
state.queryResult = {
  data: undefined,
  isError: false,
  isFetching: true,
  refetch: async (options) => state.refetchCalls.push(options),
};
const external = await bundle("external-signup-page");
let externalNode = external.BrowserExternalSignupPage({ refresh: false });
assert.equal(externalNode.type, "AuthHandoffPage");
assert.equal(externalNode.props.pending, true);
assert.deepEqual(state.queryOptions.queryKey, [
  "browser-external-signup",
  false,
  state.location.search,
]);
const externalResult = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(externalResult.ok, true);
assert.match(state.handoffCalls.at(-1).url, /ext_callback_refresh/);
assert.equal(state.handoffCalls.at(-1).parameters["ext-oai-did"], "device-1");
externalNode.props.onRetry();
assert.deepEqual(state.refetchCalls.at(-1), { cancelRefetch: false });
state.queryResult = {
  data: undefined,
  isError: false,
  isFetching: false,
  refetch: async () => {},
};
external.BrowserExternalSignupPage({ refresh: true });
let refreshed = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(refreshed.url, "https://chatgpt.com/settings?tab=apps#linked");
state.fetchResult = { ok: true, json: async () => ({ user: null }) };
refreshed = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.match(refreshed.url, /auth\/login/);
assert.match(refreshed.url, /next=%2Fsettings/);

const desktop = await bundle("desktop-page");
state.searchParams = new URLSearchParams();
state.stateCursor = 0;
let desktopNode = desktop.BrowserOpenInDesktopPage();
assert.equal(desktopNode.props.children.props.role, "alert");
state.searchParams = new URLSearchParams({
  path: "/callback",
  code: "code 1",
  state: "state-1",
});
state.stateValues = [];
state.stateCursor = 0;
desktopNode = desktop.BrowserOpenInDesktopPage();
const desktopContent = desktopNode.props.children;
desktopContent.props.ref();
assert.match(
  state.assigned.at(-1),
  /^chatgpt-alt:\/\/oauth_complete\/callback/,
);
assert.match(state.assigned.at(-1), /code=code\+1/);
assert.equal(state.timeouts.at(-1).delay, 3000);
state.timeouts.at(-1).callback();
state.stateCursor = 0;
desktopNode = desktop.BrowserOpenInDesktopPage();
assert.equal(desktopNode.props.children.props.children[1].type, "Button");
state.clipboardRejects = true;
await desktopNode.props.children.props.children[1].props.onClick();
await Promise.resolve();
state.stateCursor = 0;
desktopNode = desktop.BrowserOpenInDesktopPage();
assert.equal(desktopNode.props.children.props.children[2].props.role, "alert");

state.location = {
  hash: "",
  key: "magic-1",
  pathname: "/auth/magic",
  search: "?next=%2Fprojects%2F1",
  state: null,
};
state.queryResult = {
  data: undefined,
  isError: false,
  isFetching: true,
  refetch: async () => {},
};
const magic = await bundle("magic-link-page");
let magicNode = magic.BrowserMagicLinkPage();
assert.equal(magicNode.type, "PageLayout");
assert.equal(magicNode.props.children[1].props.role, "status");
assert.deepEqual(state.queryOptions.queryKey, [
  "browser-magic-link",
  "magic-1",
  state.location.search,
]);
state.authStatus = "logged_in";
let magicResult = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.deepEqual(magicResult, {
  ok: true,
  url: "https://chatgpt.com/projects/1",
});
state.authStatus = "logged_out";
magicResult = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(magicResult.ok, true);
assert.deepEqual(state.cookieWrites.at(-1), [
  "oai-asli",
  "uuid-1",
  { path: "/", sameSite: "lax" },
]);
assert.equal(
  state.handoffCalls.at(-1).parameters.standalone_magic_link,
  "true",
);
state.queryResult = {
  data: { ok: false },
  isError: true,
  isFetching: false,
  refetch: async () => {},
};
magicNode = magic.BrowserMagicLinkPage();
magicNode.props.children[2].props.children[1].props.onClick();
assert.equal(
  state.navigated.at(-1).destination,
  "/auth/login?next=%2Fprojects%2F1",
);
assert.deepEqual(state.navigated.at(-1).options, { replace: true });
state.queryResult = {
  data: { ok: true, url: "https://auth.example/magic" },
  isError: false,
  isFetching: false,
  refetch: async () => {},
};
magicNode = magic.BrowserMagicLinkPage();
assert.equal(
  magicNode.props.children[0].props.href,
  "https://auth.example/magic",
);
magicNode.props.children[0].props.ref({});
assert.equal(state.replaced.at(-1), "https://auth.example/magic");

console.log("33 auth browser page cluster assertions passed");
