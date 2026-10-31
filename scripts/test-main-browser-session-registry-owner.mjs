import assert from "node:assert/strict";
import fs from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [join(root, "src/main/main-app/browser-use/session-registry.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createBrowserSessionRegistryRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const owner = { id: 70 };
const ownerWindow = { id: 7, isDestroyed: () => false };
const loggerEvents = [];
const logger = {
  info: (...args) => loggerEvents.push(["info", ...args]),
  warning: (...args) => loggerEvents.push(["warning", ...args]),
};
const serverStates = [];
const apiInstances = [];
const consumeDownload = Symbol("consume-download");
const notifyDownload = Symbol("notify-download");

class BrowserUseApi {
  constructor(...args) {
    this.args = args;
    this.disposedRoutes = [];
    this.reassignedRoutes = [];
    this.cursorEvents = [];
    this.downloadChanges = [];
    apiInstances.push(this);
  }
  dispose() { this.disposed = true; }
  disposeRoute(route) { this.disposedRoutes.push(route); }
  reassignRoute(...args) { this.reassignedRoutes.push(args); }
  releaseSessionControl() { return Promise.resolve(); }
  notifyCursorArrived(payload) { this.cursorEvents.push(payload); }
  notifyPageEvent() {}
  async focusTabForBrowserRoute(_route, tabId) { return tabId === 9; }
  [consumeDownload](payload) { return payload.url === "https://allowed" ? { allowed: true } : null; }
  [notifyDownload](payload) { this.downloadChanges.push(payload); }
}

const browserRouteKey = ({ conversationId, windowId }) => `${windowId}\0${conversationId}`;
const pageRecordKey = ({ browserTabId, conversationId, windowId }) =>
  `${windowId}\0${conversationId}\0${browserTabId}`;
const { BrowserSessionRegistry, BrowserUseHost } = createBrowserSessionRegistryRuntime({
  bootstrap: { on: "app-session", in: { Dev: "dev" } },
  electron: {
    app: { getVersion: () => "1.2.3" },
    BrowserWindow: { fromWebContents: (candidate) => candidate === owner ? ownerWindow : null },
  },
  createLogger: () => () => logger,
  BrowserUseApi,
  createNativePipeServer: async ({ apiImpl, socketPeerAuthorizer }) => {
    const state = { apiImpl, socketPeerAuthorizer, disposed: false };
    serverStates.push(state);
    return {
      pipePath: "/tmp/browser-use.sock",
      dispose: async () => { state.disposed = true; },
    };
  },
  createPeerAuthorizer: () => "authorizer",
  browserRouteKey,
  pageRecordKey,
  consumeAllowedDownloadSymbol: consumeDownload,
  notifyDownloadChangeSymbol: notifyDownload,
});

const activeChanges = [];
const disposedRoutes = [];
const openedPages = [];
const delegate = {
  addBrowserUseNavigationBlockedListener: () => () => {},
  closePageForBrowserUse: (...args) => activeChanges.push(["close", ...args]),
  disposeBrowserUseRoute: (...args) => disposedRoutes.push(args),
  getBrowserSession: () => ({ id: "browser-session" }),
  getPageForBrowserUse: (route, tabId) => ({ route, tabId }),
  getTabsForBrowserUse: () => [{ browserTabId: 9, lifetime: "persistent", sessionControlled: true }],
  isBrowserVisibleForBrowserUse: () => true,
  isDetachedCursorOwner: () => false,
  isWindowAlive: (windowId) => windowId === 7 || windowId === 8,
  openPageForBrowserUse: async (route, options) => {
    openedPages.push([route, options]);
    return { pageKey: "page-opened", webContents: { id: 101 } };
  },
  releasePageForBrowserUse: (...args) => activeChanges.push(["release", ...args]),
  setBrowserUseActive: (...args) => activeChanges.push(["active", ...args]),
  setBrowserUseCursor: (...args) => activeChanges.push(["cursor", ...args]),
  setBrowserVisibleForBrowserUse: (...args) => activeChanges.push(["visible", ...args]),
  setCaptureSurfaceForBrowserUse: (...args) => activeChanges.push(["surface", ...args]),
  setViewportForBrowserUse: (...args) => activeChanges.push(["viewport", ...args]),
  setWebMcpToolActivity: (...args) => activeChanges.push(["webmcp", ...args]),
  activateBrowserUseNavigationRestriction() {},
  assertBrowserUseNavigationAllowed() {},
  clearPendingBrowserUseNavigation() {},
  trackPendingBrowserUseNavigation() {},
  waitForPageReady: async () => true,
  waitForPendingDebuggerSync: async () => true,
};

const registry = new BrowserSessionRegistry("app-session", "dev", { reportNonFatal() {} });
registry.setDelegate(delegate);
registry.registerWindow({ ownerWebContentsId: owner.id, windowId: 7 });
registry.registerThread({ conversationId: "browser-conversation", windowId: 7 });
registry.recordPageCreated({ browserTabId: "tab-a", conversationId: "browser-conversation", windowId: 7 });
registry.recordGuestAttached({
  browserTabId: "tab-a",
  conversationId: "browser-conversation",
  guestWebContentsId: 91,
  pageKey: "page-a",
  windowId: 7,
});
registry.recordPageSnapshot({
  browserTabId: "tab-a",
  conversationId: "browser-conversation",
  guestWebContentsId: 91,
  isLoading: true,
  pageKey: "page-a",
  url: "https://example.test",
  windowId: 7,
});
equal(registry.getPageSnapshot({ browserTabId: "tab-a", conversationId: "browser-conversation", windowId: 7 }), {
  browserTabId: "tab-a",
  conversationId: "browser-conversation",
  guestWebContentsId: 91,
  isLoading: true,
  pageKey: "page-a",
  url: "https://example.test",
  windowId: 7,
});
equal(registry.getSnapshotFields(), {
  browser_use_window_count: 1,
  browser_use_conversation_count: 1,
  browser_use_page_count: 1,
  browser_use_guest_webcontents_count: 1,
  browser_use_loading_page_count: 1,
  browser_use_session_route_count: 0,
});

registry.captureSessionRoute({
  browserConversationId: "browser-conversation",
  conversationId: "session-1",
  owner,
});
equal(registry.getBrowserRouteForSession("session-1"), {
  conversationId: "browser-conversation",
  windowId: 7,
});
equal(registry.resolveBrowserRoute({ conversationId: "session-1" }), {
  conversationId: "browser-conversation",
  windowId: 7,
});
equal(registry.ensureSessionRoute({ conversationId: "session-1" }), true);

const host = registry.getBrowserUseHost({ conversationId: "session-1" });
equal(host instanceof BrowserUseHost, true);
equal(host.route, { conversationId: "browser-conversation", windowId: 7 });
equal(registry.getBrowserUseHost({ conversationId: "session-1" }), host);
equal(host.getPageForBrowserUse("tab-a"), {
  route: { conversationId: "browser-conversation", windowId: 7 },
  tabId: "tab-a",
});

const openA = host.openPageForBrowserUse({ browserTabId: "tab-new", createPanelTab: true, startingUrl: "https://open.test" });
const openB = host.openPageForBrowserUse({ browserTabId: "tab-new", createPanelTab: true, startingUrl: "https://open.test" });
equal(openA, openB);
equal(await openA, { pageKey: "page-opened", webContents: { id: 101 } });
equal(openedPages.length, 1);
host.setViewportForBrowserUse({ width: 1000, height: 700 }, "tab-new");
equal(activeChanges.some(([kind]) => kind === "viewport"), true);

registry.setBrowserUseNativePipeEnabled(true);
await registry.backendStatesBySessionId.get("session-1").starting;
equal(apiInstances.length, 1);
equal(serverStates.length, 1);
equal(serverStates[0].socketPeerAuthorizer, "authorizer");
equal(await registry.focusBrowserUseTab({ conversationId: "session-1", tabId: "9" }), true);
equal(registry.consumeAllowedBrowserUseDownload({ url: "https://allowed", urlChain: [], webContentsId: 91 }), { allowed: true });
registry.notifyBrowserUseDownloadChange({ session_id: "session-1", state: "completed" });
equal(apiInstances[0].downloadChanges.length, 1);

registry.recordPageTornDown({
  browserTabId: "tab-a",
  conversationId: "browser-conversation",
  guestWebContentsId: 91,
  windowId: 7,
});
equal(registry.getPageSnapshot({ browserTabId: "tab-a", conversationId: "browser-conversation", windowId: 7 }).guestWebContentsId, null);
registry.recordPageReleased({ browserTabId: "tab-a", conversationId: "browser-conversation", windowId: 7 });
equal(registry.getPageSnapshot({ browserTabId: "tab-a", conversationId: "browser-conversation", windowId: 7 }), null);

for (let index = 0; index < 205; index += 1) {
  registry.recordDebugEvent({ kind: "test", message: String(index) });
}
equal(registry.getDebugSnapshot().events.length, 200);
equal(registry.getDebugSnapshot().events.at(-1).message, "204");

registry.setBrowserUseNativePipeEnabled(false);
await Promise.all([...registry.backendDisposalsBySessionId.values()]);
equal(serverStates[0].disposed, true);
registry.handleWindowClosed(7);
equal(registry.getWindowSnapshot(7), null);
equal(registry.getBrowserRouteForSession("session-1"), null);

const registryMembers = Object.getOwnPropertyNames(BrowserSessionRegistry.prototype).sort();
const hostMembers = Object.getOwnPropertyNames(BrowserUseHost.prototype).sort();
equal(registryMembers.length, 50);
equal(hostMembers.length, 21);
for (const member of [
  "captureSessionRoute",
  "bindSessionRouteOwner",
  "ensureBackendForSession",
  "reassignRoute",
  "recordPageSnapshot",
  "disposeBrowserUseRoute",
]) equal(registryMembers.includes(member), true);

const main = fs.readFileSync(join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/browser-use/session-registry.js")'), true);
equal(main.includes("BrowserSessionRegistry: cX, BrowserUseHost: ZYe"), true);
equal(main.includes("cX = class"), false);
equal(main.includes("ZYe = class"), false);
equal(main.includes("new cX("), true);

console.log(`${assertions} main browser session registry owner assertions passed`);
