import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-webview-navigation-runtime.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { createBrowserWebviewNavigationRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const warnings = [];
const runtime = createBrowserWebviewNavigationRuntime({
  classifyUrl: (url) => url.startsWith("https:") ? "secure" : "other",
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  deserializeColdHistory: (state) => state.coldHistory,
  deserializeHistory: (state) => state.history,
  isRouteNavigationDisabled: () => false,
  normalizeUrl: (url) => url.replace(/\/$/, ""),
  routePathForUrl: (url) => url.includes("route") ? "/route" : null,
});

const messages = [];
equal(runtime.openRestrictedNavigationRoute({ sendMessageToWebContents: (...args) => messages.push(args) }, { owner: { id: 1 } }, { page: null }, "https://route.test", () => false), true);
equal(messages[0][1], { type: "navigate-to-route", path: "/route" });
equal(runtime.openRestrictedNavigationRoute({}, {}, {}, "https://other.test", () => false), false);
const page = {};
runtime.setPendingBrowserUseNavigation(page, "https://example.test/");
equal(page.pendingNavigationUsage, { expectedUrl: "https://example.test", initiator: "browser_use", source: "browser_use", urlKind: "secure" });
runtime.clearPendingBrowserUseNavigation(page);
equal(page.pendingNavigationUsage, null);
page.pendingNavigationUsage = { source: "manual" };
runtime.clearPendingBrowserUseNavigation(page);
equal(page.pendingNavigationUsage.source, "manual");

const restored = [];
equal(await runtime.restoreNavigationHistory({ errorReporter: {}, pageState: { conversationId: "c", isColdRestore: false, serializedPageState: { history: { currentIndex: 1, entries: ["a", "b"] } } }, webContents: { navigationHistory: { restore: async (value) => restored.push(value) } } }), true);
equal(restored, [{ entries: ["a", "b"], index: 1 }]);
equal(runtime.restoreNavigationHistory({ pageState: { isColdRestore: false, serializedPageState: { history: { currentIndex: 4, entries: [] } } } }), null);
const navigationCalls = [];
equal(runtime.runInitialNavigation({ navigatePageToUrl: (...args) => { navigationCalls.push(args); return true; }, pageState: { pendingUrl: "https://same.test/" }, requiresInitialManagedNavigation: false, webContents: { getURL: () => "https://same.test" } }), false);
equal(navigationCalls.length, 0);
equal(runtime.runInitialNavigation({ navigatePageToUrl: (...args) => { navigationCalls.push(args); return true; }, pageState: { pendingNavigationUsage: { source: "browser_use", initiator: "browser_use" }, pendingUrl: "https://next.test" }, requiresInitialManagedNavigation: true, webContents: { getURL: () => "" } }), true);
equal(navigationCalls[0], ["https://next.test", "browser_use", "browser_use"]);

equal(runtime.isAdoptableWebContents({ destroy() {}, _createWebViewAdoptionLease() {} }), true);
equal(runtime.isAdoptableWebContents({ destroy() {} }), false);
const listeners = new Map();
const webContents = { id: 22, _createWebViewAdoptionLease: () => "lease", isDestroyed: () => false, destroy: () => {}, once: (event, listener) => listeners.set(event, listener), removeListener: (event, listener) => { if (listeners.get(event) === listener) listeners.delete(event); } };
const windowState = { owner: { id: 3 }, pendingAdoptedWebviewsByWebContentsId: new Map() };
equal(runtime.adoptWebContents(windowState, webContents, { conversationId: "c", browserTabId: "t" }, { entries: [] }), "lease");
equal(windowState.pendingAdoptedWebviewsByWebContentsId.get(22).acceptedHostIdentity, null);
equal(listeners.has("destroyed"), true);
listeners.get("destroyed")();
equal(windowState.pendingAdoptedWebviewsByWebContentsId.size, 0);
equal(listeners.size, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-webview-navigation-runtime.js")'), true);
for (const oldOwner of ["function GXe(", "function KXe(", "function qXe(", "function JXe(", "function YXe(", "function WX(", "function GX("]) equal(main.includes(oldOwner), false);
console.log(`${assertions} main browser webview navigation runtime assertions passed`);
