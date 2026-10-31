import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/page-store.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
  plugins: [{ name: "page-store-stubs", setup(api) {
    api.onResolve({ filter: /^electron$/ }, ({ path }) => ({ path, namespace: "electron" }));
    api.onLoad({ filter: /.*/, namespace: "electron" }, () => ({ contents: `export const screen = { getCursorScreenPoint: () => ({ x: 30, y: 40 }) };`, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/shared$/ }, ({ path }) => ({ path, namespace: "shared" }));
    api.onLoad({ filter: /.*/, namespace: "shared" }, () => ({ contents: `
      const schema = () => ({ optional() { return this; }, nullable() { return this; }, int() { return this; }, max() { return this; }, strict() { return this; }, refine() { return this; }, transform() { return this; }, safeParse(value) { return { success: true, data: value }; } });
      export const wf = () => schema(); export const Of = () => schema(); export const Cf = () => schema(); export const bf = () => schema(); export const hf = () => schema(); export const Ef = () => schema(); export const Mf = () => schema();
    `, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/logger$/ }, ({ path }) => ({ path, namespace: "logger" }));
    api.onLoad({ filter: /.*/, namespace: "logger" }, () => ({ contents: `export const memoizedTaggedLogger = () => () => ({ warning() {} });`, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/bootstrap$/ }, ({ path }) => ({ path, namespace: "bootstrap" }));
    api.onLoad({ filter: /.*/, namespace: "bootstrap" }, () => ({ contents: `export const bn = (value) => value; export const hn = () => { throw new Error("fallback"); };`, loader: "js" }));
    api.onResolve({ filter: /^\.\/error-pages$/ }, ({ path }) => ({ path, namespace: "errors" }));
    api.onLoad({ filter: /.*/, namespace: "errors" }, () => ({ contents: `export const matchesLoadError = (error, url) => error != null && error.pageUrl === url;`, loader: "js" }));
  } }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

equal(runtime.pageKey(7, "conversation", "tab"), "7:conversation:tab");
equal(runtime.conversationTabKey({ conversationId: "conversation", browserTabId: "tab" }), "conversation\0tab");
equal(runtime.blankableUrl("about:blank"), "");
equal(runtime.isCrossOriginNavigation("https://a.example/x", "https://a.example/y"), false);
equal(runtime.isCrossOriginNavigation("https://a.example", "https://b.example"), true);
equal(runtime.urlKind("http://localhost:3000"), "local_http");
equal(runtime.urlKind("https://example.com"), "remote_http");
equal(runtime.effectiveUrl({ pendingUrl: "https://next", url: "https://old" }), "https://next");
equal(runtime.formatMessage({ defaultMessage: "Hello {name}", values: { name: "Codex" } }), "Hello Codex");
equal(runtime.clamp(10.6, 0, 10), 10);
equal(runtime.atLeastOne(0.1), 1);

const fresh = runtime.freshPageState({ faviconUrl: null, title: "Title", url: "https://example.com" });
equal(fresh.navigation.entries.length, 1);
equal(runtime.persistableNavigationOf(fresh), null, "single plain entry is not durable navigation");
const durable = { ...fresh, navigation: { currentIndex: 1, entries: [{ title: "A", url: "https://a" }, { title: "B", url: "https://b", pageState: "state" }] } };
equal(runtime.persistableNavigationOf(durable)?.entries.length, 2);
const withToken = { ...durable, navigation: { currentIndex: 1, entries: [{ title: "token", url: "about:blank#codex-browser-sidebar-attach-token=x" }, { title: "B", url: "https://b" }] } };
equal(runtime.stripAttachTokenEntries(withToken)?.navigation.currentIndex, 0);
equal(runtime.validatedNavigationOf(withToken)?.entries.length, 1);
const versioned = { navigationVersion: 4, managedNavigation: {} };
runtime.bumpNavigationVersion(versioned);
equal(versioned, { navigationVersion: 5, managedNavigation: undefined });
equal(runtime.currentUrlOf({ page: null, snapshot: { url: "https://snapshot" } }), "https://snapshot");

process.env.CODEX_BROWSER_USE_DEFAULT_VIEWPORT_SIZE = "1280x720";
equal(runtime.defaultViewportSize(), { width: 1280, height: 720 });
delete process.env.CODEX_BROWSER_USE_DEFAULT_VIEWPORT_SIZE;

const sent = [];
runtime.sendToTabWindows({ sendMessageToWebContents: (target, message) => sent.push([target.id, message]) }, { owner: { id: 2 }, tabSourceWindow: { owner: { id: 1 } } }, { type: "sync" });
equal(sent, [[1, { type: "sync" }], [2, { type: "sync" }]]);
const mouse = [];
runtime.forwardMouseMove({ isDestroyed: () => false, getContentBounds: () => ({ x: 10, y: 10 }) }, { x: 5, y: 5, width: 50, height: 50 }, { isDestroyed: () => false, sendInputEvent: (event) => mouse.push(event) });
equal(mouse[0].x, 15);
equal(mouse[0].y, 25);

const store = new runtime.BrowserSidebarPageStore(null, 1_000_000, 10);
const identity = { browserStorageId: "storage", browserTabId: "tab", conversationId: "conversation" };
store.set(identity, durable);
equal(store.get("storage")?.title, "Title");
equal(store.getOwner("storage"), { browserTabId: "tab", conversationId: "conversation" });
store.reassociate("storage", { browserTabId: "tab-2", conversationId: "conversation-2" });
equal(store.getOwner("storage"), { browserTabId: "tab-2", conversationId: "conversation-2" });
equal(store.deleteOwnedAndFlush({ browserStorageId: "storage", browserTabId: "wrong", conversationId: "wrong" }), false);
equal(store.deleteOwnedAndFlush({ browserStorageId: "storage", browserTabId: "tab-2", conversationId: "conversation-2" }), true);

const debuggerCalls = [];
let attached = false;
const debugger_ = { isAttached: () => attached, attach: () => { attached = true; }, detach: () => { attached = false; }, sendCommand: async (method, params) => { debuggerCalls.push([method, params]); } };
await runtime.syncColorScheme({ id: 9, debugger: debugger_ }, "dark");
equal(debuggerCalls[0][0], "Emulation.setEmulatedMedia");
equal(attached, false);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/page-store.js")'), true);
for (const oldOwner of ["function WU(", "var zHe =", "GHe = class", "var YHe = class", "function ZHe("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main browser page-store runtime assertions passed`);
