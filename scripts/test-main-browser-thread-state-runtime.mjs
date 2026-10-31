import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-thread-state-runtime.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserThreadStateRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const order = [];
let findStateCount = 0;
let snapshotCount = 0;
const runtime = createBrowserThreadStateRuntime({
  createDefaultBrowserSnapshot: () => { snapshotCount += 1; return { title: "New tab" }; },
  createFindState: () => { findStateCount += 1; return { query: "" }; },
  makeBrowserStorageId: ({ browserTabId, conversationId }) => `storage:${conversationId}:${browserTabId}`,
  makePageRecordKey: ({ browserTabId, conversationId }) => `${conversationId}:${browserTabId}`,
  makePageKey: (ownerId, conversationId, browserTabId) => `${ownerId}:${conversationId}:${browserTabId}`,
  makePartitionKey: (conversationId, browserTabId) => `partition:${conversationId}:${browserTabId}`,
  makeTransferKey: (source, target) => `${source}->${target}`,
  normalizeWindowId: (windowId) => `window-${windowId}`,
  pageHandleForThread: (windowState, conversationId, page) => ({ windowState, conversationId, page }),
  registerThreadAndRecordOpened: (...args) => { order.push("register"); equal(args.length, 5); },
  runtimeIntlConfig: { locale: "en" },
});

const page = { view: { webContents: { isDestroyed: () => false } } };
const activeThread = { browserTabId: "tab-a", conversationId: "conversation-a", page };
const inheritedRouteThread = { browserTabId: "tab-old", conversationId: "conversation-b", ownerRoutePath: "/route" };
const windowState = {
  activeBrowserTabId: "tab-a",
  activeConversationId: "conversation-a",
  threads: new Map([
    ["conversation-a:tab-a", activeThread],
    ["conversation-b:tab-old", inheritedRouteThread],
  ]),
};

equal(runtime.resolveBrowserTabId(windowState, "conversation-a"), "tab-a");
equal(runtime.resolveBrowserTabId(windowState, "conversation-b"), null);
equal(runtime.resolveBrowserTabId(windowState, "conversation-b", "explicit"), "explicit");
equal(runtime.getThreadStateForWindow(windowState, "conversation-a"), activeThread);
equal(runtime.getThreadStateForWindow(windowState, "conversation-a", "missing"), null);
equal(runtime.getPageHandleForConversation(windowState, null), null);
equal(runtime.getPageHandleForConversation(windowState, "conversation-a"), { windowState, conversationId: "conversation-a", page });

activeThread.pendingTeardown = { reason: "closed" };
equal(runtime.getPageHandleForConversation(windowState, "conversation-a"), null);
activeThread.pendingTeardown = null;
page.view.webContents.isDestroyed = () => true;
equal(runtime.getPageHandleForConversation(windowState, "conversation-a"), null);
page.view.webContents.isDestroyed = () => false;
equal(runtime.hasThreadForConversation(windowState, "conversation-a"), true);
equal(runtime.hasThreadForConversation(windowState, "missing"), false);
equal(runtime.findOwnerRoutePath(windowState, "conversation-b"), "/route");
equal(runtime.findOwnerRoutePath(windowState, "conversation-a"), null);
activeThread.isBrowserUseActive = true;
inheritedRouteThread.isBrowserUsePage = true;
equal(runtime.getBrowserUseTabIds(windowState, "conversation-a"), ["tab-a"]);
equal(runtime.getBrowserUseTabIds(windowState, "conversation-b"), ["tab-old"]);
equal(runtime.getBrowserUseTabIds(windowState, "missing"), []);

const cold = runtime.createThreadState({
  annotationModeEnabled: true,
  browserStorageId: "storage",
  browserTabId: "tab",
  conversationId: "conversation",
  cwd: "/tmp",
  emulatedViewportSize: { width: 800, height: 600 },
  hostKind: "sidebar",
  isBrowserUsePage: true,
  ownerRoutePath: "/owner",
  runtimeIntlConfig: { locale: "zh" },
});
equal(cold.findState, { query: "" });
equal(cold.snapshot, { title: "New tab" });
equal(cold.sessionState, "cold");
equal(cold.browserUseTabLifetime, "temporary");
equal(cold.isAnnotationModeEnabled, true);
equal(cold.isBrowserUseActive, false);
equal(cold.pendingTeardown, null);
equal(cold.viewportScale, 1);
equal(cold.emulatedViewportSize, { width: 800, height: 600 });
equal(findStateCount, 1);
equal(snapshotCount, 1);
equal(runtime.createThreadState({ isBrowserUsePage: false }).browserUseTabLifetime, "persistent");

const materializationState = {
  activeBrowserTabId: null,
  activeConversationId: null,
  threads: new Map([["conversation-b:tab-old", inheritedRouteThread]]),
};
const materializationOrder = [];
const created = runtime.ensureThreadStateForWindow({
  browserSessionRegistry: {},
  browserTabId: "tab-new",
  conversationId: "conversation-b",
  options: { isBrowserUseTab: true },
  tabBudget: { markTabActivity(threadState) { materializationOrder.push("activity"); equal(threadState.browserTabId, "tab-new"); } },
  windowManager: {},
  windows: new Map(),
  windowState: {
    ...materializationState,
    threads: new Map(materializationState.threads),
  },
});
equal(created.browserStorageId, "storage:conversation-b:tab-new");
equal(created.ownerRoutePath, "/route");
equal(created.runtimeIntlConfig, { locale: "en" });
equal(created.isBrowserUsePage, true);
equal(materializationOrder, ["activity"]);
equal(order, ["register"]);

const existing = { browserTabId: "existing" };
const existingWindow = { threads: new Map([["conversation:existing", existing]]) };
equal(runtime.ensureThreadStateForWindow({ browserTabId: "existing", conversationId: "conversation", windowState: existingWindow }), existing);
equal(order, ["register"], "existing threads do not register twice");

const presentation = {
  bounds: null,
  emulatedViewportSize: { width: 100, height: 200 },
  hostKind: null,
};
equal(runtime.applyThreadPresentation(presentation, {
  bounds: { x: 1.2, y: 2.7, width: 300.4, height: 400.6 },
  emulatedViewportSize: { width: 101, height: 200 },
  hostKind: "detached",
  mountGeneration: 4,
  presented: true,
  viewportScale: 0.5,
  visible: true,
}), true);
equal(presentation.bounds, { x: 1, y: 3, width: 300, height: 401 });
equal(presentation.emulatedViewportSize, { width: 101, height: 200 });
equal(presentation.hostKind, "detached");
equal(presentation.mountGeneration, 4);
equal(presentation.presented, true);
equal(presentation.visible, true);
equal(presentation.viewportScale, 0.5);
equal(runtime.applyThreadPresentation(presentation, {
  bounds: null,
  hostKind: "sidebar",
  mountGeneration: 5,
  presented: false,
  viewportScale: 1,
  visible: false,
}), false);
equal(presentation.bounds, null);
equal(presentation.emulatedViewportSize, { width: 101, height: 200 }, "undefined viewport preserves the prior value");

const transferCalls = [];
const transferThread = {
  browserTabId: "source-tab",
  conversationId: "source-conversation",
  isBrowserUseActive: false,
  isBrowserUsePage: false,
  ownerRoutePath: "/source",
  page: { browserTabId: "source-tab", conversationId: "source-conversation", view: { webContents: { id: 90 } } },
};
const registeredHost = { browserTabId: "source-tab", conversationId: "source-conversation", pagePersistence: { id: 1 } };
const pendingAdopted = { route: { browserTabId: "source-tab", conversationId: "source-conversation" } };
const pendingRoute = { route: { browserTabId: "source-tab", conversationId: "source-conversation" }, token: 1 };
const transferWindow = {
  activeBrowserTabId: "source-tab",
  activeConversationId: "source-conversation",
  ignoredConversationIds: new Set(["target-conversation:target-tab"]),
  owner: { id: 7 },
  pendingAdoptedWebviewsByWebContentsId: new Map([[90, pendingAdopted]]),
  pendingWebviewRoutesByInstanceId: new Map([["instance", pendingRoute]]),
  registeredWebviewHostsByRoutePartition: new Map([["partition:source-conversation:source-tab", registeredHost]]),
  threads: new Map([
    ["source-conversation:source-tab", transferThread],
    ["target-conversation:owner", { browserTabId: "owner", conversationId: "target-conversation", ownerRoutePath: "/target" }],
  ]),
  transferredConversationStateKeys: new Set(),
  window: { id: 12 },
};
runtime.transferConversationState({
  browserSessionRegistry: {
    recordDebugEvent: (event) => transferCalls.push(["debug", event.kind]),
    registerThread: (route) => transferCalls.push(["register", route]),
  },
  comments: { transferConversation: (...args) => transferCalls.push(["comments", ...args]) },
  downloadStore: { reassignActiveDownloadRoute: (...args) => transferCalls.push(["download", ...args]) },
  disposeThreadState: () => transferCalls.push(["dispose"]),
  getThreadStateForWindow: (state, conversationId, browserTabId) => state.threads.get(`${conversationId}:${browserTabId}`) ?? null,
  isBrowserUseManagedBrowserTab: () => false,
  setBrowserUseActiveForRoute: (...args) => transferCalls.push(["active", ...args]),
  sourceBrowserTabId: "source-tab",
  sourceConversationId: "source-conversation",
  syncRuntimeStateToPage: (...args) => transferCalls.push(["runtime-sync", ...args]),
  syncThreadState: (...args) => transferCalls.push(["thread-sync", ...args]),
  targetBrowserTabId: "target-tab",
  targetConversationId: "target-conversation",
  windowState: transferWindow,
});
equal(transferWindow.threads.get("target-conversation:target-tab"), transferThread);
equal(transferWindow.threads.has("source-conversation:source-tab"), false);
equal(transferWindow.activeConversationId, "target-conversation");
equal(transferWindow.activeBrowserTabId, "target-tab");
equal(transferThread.ownerRoutePath, "/target");
equal(transferThread.page.conversationId, "target-conversation");
equal(transferThread.page.browserTabId, "target-tab");
equal(pendingAdopted.route, { browserTabId: "target-tab", conversationId: "target-conversation" });
equal(transferWindow.pendingWebviewRoutesByInstanceId.get("instance").route, { browserTabId: "target-tab", conversationId: "target-conversation" });
equal(transferWindow.registeredWebviewHostsByRoutePartition.has("partition:target-conversation:target-tab"), true);
equal(transferWindow.ignoredConversationIds.has("source-conversation:source-tab"), true);
equal(transferWindow.transferredConversationStateKeys.has("source-conversation:source-tab->target-conversation:target-tab"), true);
equal(transferCalls.map(([kind]) => kind), ["download", "register", "comments", "debug", "thread-sync", "runtime-sync"]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-thread-state-runtime.js")'), true);
for (const oldOwner of ["function mX(", "function hX(", "function gX(", "function rXe(", "function iXe(", "function aXe(", "function _X(", "function oXe(", "function vX(", "function sXe(", "function gXe(", "function kX("]) {
  equal(main.includes(oldOwner), false, `${oldOwner} is removed`);
}

console.log(`${assertions} main browser thread state runtime assertions passed`);
