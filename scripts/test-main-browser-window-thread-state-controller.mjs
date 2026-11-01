import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [
    path.join(
      root,
      "src/main/main-app/browser-sidebar/browser-window-thread-state-controller.ts",
    ),
  ],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createBrowserWindowThreadStateControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const calls = [];
const windows = new Map();
let focusedWindow = null;
let webviewOptions = null;
const shutdownRegistrations = new Map();
const host = {
  windows,
  lastSyncedWindowId: null,
  windowManager: {
    getPrimaryWindows: () => [],
    sendMessageToWebContents: (...args) => calls.push(["send", ...args]),
  },
  browserSessionRegistry: {
    registerWindow: (value) => calls.push(["register", value]),
    recordDebugEvent: (value) => calls.push(["debug", value]),
    handleWindowClosed: (value) => calls.push(["session-window-closed", value]),
  },
  browserPageHostLifecycle: {
    cancelPendingWebviewAttaches: (...args) => calls.push(["cancel", ...args]),
    requestThreadTeardown: (...args) => calls.push(["teardown", ...args]),
    attachedWebviewHosts: new Map(),
    isBrowserUseManagedBrowserTab: () => false,
    attachWebview: (...args) => calls.push(["attach-webview", ...args]),
    reportIncompleteNavigationOnClose: (...args) =>
      calls.push(["incomplete", ...args]),
    disposePage: (...args) => calls.push(["dispose-page", ...args]),
  },
  browserPersistence: {
    hasBrowserStorageOwner: () => false,
    isPersistenceOwner: () => true,
    prepareWebviewAttach: (...args) => ["prepared", ...args],
    reconcileBrowserStorageId: (...args) => ["reconciled", ...args],
  },
  browserPageSnapshots: {
    deleteClosedPageAndFlush: () => calls.push(["delete"]),
    persistWindowBeforeShutdown: (...args) => calls.push(["persist", ...args]),
    registerWindowShutdown: (state, onClosing, onClosed) =>
      shutdownRegistrations.set(state.window.id, { onClosing, onClosed }),
  },
  browserUseOpenRequests: {
    rejectForRoute: (...args) => calls.push(["reject", ...args]),
    rejectForOwner: (...args) => calls.push(["reject-owner", ...args]),
    resolveForWindow: () => undefined,
  },
  siteAnnotationPermissions: { cancel: () => undefined },
  comments: { close: (...args) => calls.push(["comments-close", ...args]) },
  downloadStore: {},
  disposeThreadState: () => undefined,
  setBrowserUseActiveForRoute: () => undefined,
  syncRuntimeStateToPage: () => undefined,
  syncThreadState: () => undefined,
  tabBudget: {
    markTabSelected: () => undefined,
    handleWindowClosed: (...args) =>
      calls.push(["budget-window-closed", ...args]),
  },
  iabTabMentions: { notifyInvalidated: () => undefined },
  admitBrowserTab: () => true,
  getBrowserSession: () => null,
  siteAnnotationFeatures: {
    getPolicy: () => null,
    subscribeAvailability: () => () => undefined,
  },
  findPageStateForRuntimeSender: () => null,
  ensureThreadStateForWindow: () => null,
  setAnnotationPresentation: () => undefined,
  getCurrentWindowState: () => windows.get(1) ?? null,
  ensureCurrentWindowState: () => windows.get(1) ?? null,
};
const controller = new (createBrowserWindowThreadStateControllerClass({
  hX: (state, conversationId, browserTabId) =>
    state?.threads.get(`${conversationId}:${browserTabId}`) ?? null,
  fq: () => undefined,
  gXe: () => undefined,
  oX: (value) => value,
  installBrowserWebviewListeners: (options) => {
    webviewOptions = options;
    return () => calls.push(["dispose-webview-listeners"]);
  },
  aXe: (state, conversationId) =>
    [...state.threads.values()].some(
      (thread) => thread.conversationId === conversationId,
    ),
  gX: () => null,
  qU: (route) => `${route.conversationId}:${route.browserTabId}`,
  oXe: ({ windowState, conversationId, browserTabId }) =>
    windowState.threads.get(`${conversationId}:${browserTabId}`) ?? null,
  vX: () => ({}),
  tq: () => undefined,
  KU: (...values) => values.join(":"),
  EZ: "/browser-page-preload.js",
  logger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  l: {
    BrowserWindow: {
      fromWebContents: () => window,
      fromId: (id) => windows.get(id)?.window ?? null,
      getFocusedWindow: () => focusedWindow,
      getAllWindows: () => [...windows.values()].map((state) => state.window),
    },
  },
}))(host);
const window = {
  id: 1,
  webContents: { isDestroyed: () => false },
  on: () => undefined,
  removeListener: () => undefined,
  isDestroyed: () => false,
  getContentBounds: () => ({}),
};
const owner = { id: 42, isDestroyed: () => false };
const state = controller.ensureWindowState(window, owner);
host.ensureWindowState = controller.ensureWindowState.bind(controller);
host.getLiveWindowState = controller.getLiveWindowState.bind(controller);
host.getFocusedWindowState = controller.getFocusedWindowState.bind(controller);
equal(state.owner, owner);
equal(webviewOptions.owner, owner);
equal(webviewOptions.state, state);
equal(webviewOptions.windowId, 1);
equal(webviewOptions.preloadPath, "/browser-page-preload.js");
equal(typeof webviewOptions.prepareWebviewAttach, "function");
equal(typeof webviewOptions.recordDebugEvent, "function");
equal(webviewOptions.prepareWebviewAttach("thread", "input", "persistence"), [
  "prepared",
  state,
  "thread",
  "input",
  "persistence",
]);
webviewOptions.recordDebugEvent({ kind: "event" });
equal(
  calls.some(([kind, value]) => kind === "debug" && value.kind === "event"),
  true,
);
equal(shutdownRegistrations.has(1), true);
equal(
  calls.some(([kind, value]) => kind === "register" && value.windowId === 1),
  true,
);
equal(controller.getLiveWindowState(1), state);
equal(controller.getCurrentWindowState(owner), state);
equal(controller.getThreadStateForWindow(state, "conversation", "tab"), null);
equal(controller.getDetachedWindowStates(1), []);
state.threads.set("conversation:tab", {
  conversationId: "conversation",
  browserTabId: "tab",
  browserStorageId: "storage",
  isBrowserUseActive: false,
  snapshot: { isAnnotationSuspended: false },
});
const detachedWindow = {
  id: 2,
  webContents: { isDestroyed: () => false },
  on: () => undefined,
  removeListener: () => undefined,
  isDestroyed: () => false,
  getContentBounds: () => ({}),
};
const detachedOwner = { id: 43, isDestroyed: () => false };
const detached = controller.ensureWindowState(detachedWindow, detachedOwner);
detached.tabSourceWindow = state;
detached.threads.set("conversation:detached", {
  conversationId: "conversation",
  browserTabId: "detached",
});
equal(controller.getDetachedWindowStates(1), [detached]);
equal(
  controller.getPageWindowState(
    { conversationId: "conversation", windowId: 1 },
    "detached",
  ),
  detached,
);
equal(
  controller.getPageWindowState(
    { conversationId: "conversation", windowId: 1 },
    null,
  ),
  state,
);
focusedWindow = detachedWindow;
equal(controller.getFocusedWindowState(), detached);
equal(controller.getFocusedOwnerWebContents(), detachedWindow.webContents);
equal(
  controller.getPreferredWindowStateForConversation("conversation"),
  state,
  "detached preference resolves to source window",
);
focusedWindow = null;
host.lastSyncedWindowId = 1;
equal(controller.getFocusedOwnerWebContents(), owner);
controller.closePage(owner, "conversation", "tab", "other-storage");
equal(
  calls.some(([kind]) => kind === "delete"),
  true,
);

const page = { id: "page" };
state.threads.get("conversation:tab").page = page;
shutdownRegistrations.get(1).onClosing();
equal(
  calls.some(
    ([kind, value, trigger]) =>
      kind === "incomplete" && value === page && trigger === "window-closed",
  ),
  true,
);
host.lastSyncedWindowId = 1;
shutdownRegistrations.get(1).onClosed();
equal(windows.has(1), false);
equal(host.lastSyncedWindowId, null);
equal(calls.filter(([kind]) => kind === "persist").length, 1);
equal(calls.filter(([kind]) => kind === "reject-owner").length, 1);
equal(calls.filter(([kind]) => kind === "dispose-webview-listeners").length, 1);
equal(
  calls.some(([kind, value]) => kind === "budget-window-closed" && value === 1),
  true,
);
equal(
  calls.some(
    ([kind, value]) => kind === "session-window-closed" && value === 1,
  ),
  true,
);
controller.disposeWindowState(1);
equal(calls.filter(([kind]) => kind === "persist").length, 1);

const main = fs.readFileSync(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
for (const oldOwner of [
  "function AX(",
  "function vXe(",
  "function yXe(",
  "function bXe(",
  "function xXe(",
  "function SXe(",
]) {
  equal(main.includes(oldOwner), false);
}
equal(main.includes("disposeWindowState(...args)"), true);
console.log(
  `main browser window thread state controller tests passed (${assertions} assertions)`,
);
