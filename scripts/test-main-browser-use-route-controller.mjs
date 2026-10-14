import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-use-route-controller.ts")],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createBrowserUseRouteControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const calls = [];
const owner = { id: 10, isDestroyed: () => false };
const thread = {
  conversationId: "conversation",
  browserTabId: "tab",
  browserUseTabLifetime: "persistent",
  isBrowserUsePage: true,
  pendingTeardown: null,
  snapshot: { title: "Title", url: "https://example.test", tabType: "web" },
  page: { title: "Page", view: { webContents: null } },
};
const windowState = {
  owner,
  window: { id: 10, isFocused: () => true, isVisible: () => true },
  threads: new Map([["tab", thread]]),
  activeConversationId: "conversation",
  activeBrowserTabId: "tab",
  tabSourceWindow: null,
};
const host = {
  windows: new Map([[10, windowState]]),
  inAppBrowserFeatureEnabled: true,
  browserSessionRegistry: { recordPageReleased: (...args) => calls.push(["released", ...args]) },
  browserUseOpenRequests: { waitForOpen: () => "pending", rejectForRoute: (...args) => calls.push(["reject", ...args]) },
  comments: { close: (...args) => calls.push(["close", ...args]) },
  tabBudget: { enforceDetachedPageBudget: () => undefined, markTabActivity: () => undefined },
  browserPageHostLifecycle: { requestThreadTeardown: (...args) => calls.push(["teardown", ...args]), updateThreadSessionState: () => undefined },
  windowManager: { sendMessageToWebContents: (...args) => calls.push(["message", ...args]) },
  getPageWindowState: () => windowState,
  getLiveWindowState: () => windowState,
  getDetachedWindowStates: () => [],
  getPreferredWindowStateForConversation: () => windowState,
  getThreadStateForWindow: (window, conversationId, browserTabId) =>
    conversationId === "conversation" && browserTabId === "tab" ? thread : null,
  ensureThreadStateForWindow: () => thread,
  materializeThreadPageState: () => thread.page,
  navigatePageToUrl: (...args) => calls.push(["navigate", ...args]),
  queuePageDeviceMetricsSync: (...args) => calls.push(["viewport", ...args]),
  syncThreadState: (...args) => calls.push(["sync", ...args]),
  updateThreadSessionState: () => undefined,
  requestThreadTeardown: (...args) => calls.push(["teardown", ...args]),
};
const Controller = createBrowserUseRouteControllerClass({
  hX: (window, conversationId, browserTabId) => host.getThreadStateForWindow(window, conversationId, browserTabId),
  n: { lu: { NEW_TAB_PAGE: "new-tab" } }, qU: () => "page-key", oX: (value) => value,
  QU: (page) => page.snapshot?.url ?? "", iW: (value) => value, wU: { minWidth: 1, maxWidth: 2000, minHeight: 1, maxHeight: 2000 },
  aW: (value) => value, mX: () => "tab", mXe: () => undefined, lW: () => null, OX: () => ["tab"], hXe: () => false,
  dZ: () => undefined, WU: (manager, target, message) => manager.sendMessageToWebContents(target, message), fq: () => undefined,
  gX: (window, conversationId, browserTabId) => host.getThreadStateForWindow(window, conversationId, browserTabId)?.page ?? null,
  logger: () => ({ warning: () => undefined, info: () => undefined }),
});
const controller = new Controller(host);

equal(controller.getPageForBrowserUseForRoute({ conversationId: "conversation", windowId: 10 }, "tab"), thread.page);
equal(controller.getTabsForBrowserUseForRoute({ conversationId: "conversation", windowId: 10 }), [{ active: true, browserTabId: "tab", lifetime: "persistent", sessionControlled: true, title: "Title", url: "https://example.test" }]);
equal(controller.isBrowserVisibleForBrowserUseForRoute({ conversationId: "conversation", windowId: 10 }, "tab"), false);
equal(await controller.openPageForBrowserUseForRoute({ conversationId: "conversation", browserTabId: "tab", windowId: 10 }), "pending");
controller.setCaptureSurfaceForBrowserUseForRoute({ conversationId: "conversation", windowId: 10 }, { width: 640, height: 480 }, "tab");
assert.equal(calls.some(([kind, , message]) => kind === "message" && message.type === "browser-sidebar-browser-use-capture-surface"), true);
assert.equal(typeof controller.getBrowserUseRouteActionHelpers().getPageWindowState, "function");
assert.equal(typeof controller.setBrowserUseActiveForConversation, "function");
assertions += 3;

console.log(`main browser use route controller tests passed (${assertions} assertions)`);
