import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-page-host-lifecycle.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { BrowserPageHostLifecycle } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};

function createWebContents(id) {
  return {
    id,
    closed: 0,
    destroyed: 0,
    isDestroyed() { return this.destroyed > 0 || this.closed > 0; },
    close() { this.closed += 1; },
    destroy() { this.destroyed += 1; },
    createWebViewTransfer() { return { token: `transfer-${id}`, cancel: () => {}, finished: Promise.resolve("moved") }; },
  };
}

function createPage(webContents = createWebContents(50)) {
  return {
    disposeCalls: 0,
    isRestoring: true,
    isSuspended: false,
    pendingSuspensionId: null,
    view: { webContents },
    dispose() { this.disposeCalls += 1; },
    takeIncompleteNavigationObservation(timeout) {
      return this.incompleteObservation == null ? null : { ...this.incompleteObservation, timeout };
    },
  };
}

function createThread(overrides = {}) {
  return {
    browserTabId: "tab-1",
    conversationId: "conversation-1",
    hostGeneration: 2,
    isBrowserUseActive: false,
    isBrowserUsePage: true,
    lastLifecycleSequence: 0,
    lastPresentedSequence: 0,
    mountGeneration: 4,
    page: createPage(),
    pendingTeardown: null,
    presented: false,
    sessionState: "cold",
    snapshot: { isSuspended: false, interactionMode: "browse", annotationEditorMode: "browse", isTweaksEditorOpen: false },
    themeVariant: "dark",
    ...overrides,
  };
}

function createWindow(thread = createThread(), overrides = {}) {
  const key = `${thread.conversationId}:${thread.browserTabId}`;
  return {
    activeBrowserTabId: thread.browserTabId,
    activeConversationId: thread.conversationId,
    ignoredConversationIds: new Set(),
    owner: { id: 10 },
    pendingAdoptedWebviewsByWebContentsId: new Map(),
    pendingWebviewRoutesByInstanceId: new Map(),
    rendererInstanceId: "renderer-1",
    threads: new Map([[key, thread]]),
    window: { id: 20, isDestroyed: () => false },
    ...overrides,
  };
}

function createHarness({ thread = createThread(), windowState, overrides = {} } = {}) {
  const state = windowState ?? createWindow(thread);
  const windows = new Map([[state.window.id, state]]);
  const calls = [];
  let protectedTab = false;
  const options = {
    bindPageToWebview(...args) { calls.push(["bind", ...args]); args[2].view.webContents = args[3]; },
    browserPageSnapshots: {
      deleteClosedPageAndFlush(value) { calls.push(["deleteSnapshot", value]); },
      persistCurrentAndFlush(value) { calls.push(["persist", value]); },
    },
    browserPersistence: {
      getPagePersistence(window, key) { calls.push(["getPersistence", window, key]); return { key }; },
      preparePage(...args) { calls.push(["prepare", ...args]); return { kind: "ready" }; },
      reconcileBrowserStorageId(...args) { calls.push(["reconcile", ...args]); return true; },
      registerWebviewHost(...args) { calls.push(["register", ...args]); },
      unregisterWebviewHost(...args) { calls.push(["unregister", ...args]); },
    },
    browserSessionRegistry: {
      recordDebugEvent(value) { calls.push(["debug", value]); },
      recordPageClosed(value) { calls.push(["closed", value]); },
      recordPageTornDown(value) { calls.push(["tornDown", value]); },
    },
    ensureThreadStateForWindow(...args) { calls.push(["ensure", ...args]); return thread; },
    findThreadState(target, conversationId, browserTabId) {
      calls.push(["find", conversationId, browserTabId]);
      return target.threads.get(`${conversationId}:${browserTabId}`) ?? null;
    },
    getPageLifecycleHelpers() { return {
      comments: { dismiss: (...args) => calls.push(["dismiss", ...args]) },
      bindPageToWebview: (...args) => { calls.push(["transferBind", ...args]); args[1].view.webContents = args[2]; },
      syncRuntimeStateToPage: (...args) => calls.push(["runtimeSync", ...args]),
    }; },
    iabTabMentions: { notifyInvalidated() { calls.push(["invalidated"]); } },
    logger: {
      info(event, fields) { calls.push(["info", event, fields]); },
      warning(event, fields) { calls.push(["warning", event, fields]); },
    },
    normalizeWindowId(id) { return `window-${id}`; },
    pageKey(ownerId, conversationId, browserTabId) {
      return `${ownerId}:${conversationId}:${browserTabId}`;
    },
    recordMissingPageAttach(...args) { calls.push(["missingAttach", ...args]); },
    removeClosedThread(...args) { calls.push(["remove", ...args]); },
    reportIncompleteNavigation(value) { calls.push(["incomplete", value]); },
    routeKey(route) { return `${route.conversationId}:${route.browserTabId}`; },
    syncThreadState(...args) { calls.push(["sync", ...args]); },
    tabBudget: {
      enforceDetachedPageBudget(value) { calls.push(["enforce", value]); },
      isTabProtectedFromSuspension() { return protectedTab; },
      recordTabSuspended(...args) { calls.push(["suspended", ...args]); },
    },
    applyAnnotationMode(...args) { calls.push(["annotation", ...args]); },
    sendWindowMessage(...args) { calls.push(["transferMessage", ...args]); },
    transferLogger: { error(...args) { calls.push(["transferError", ...args]); } },
    windowManager: {
      sendMessageToWebContents(...args) { calls.push(["message", ...args]); },
    },
    windows,
    ...overrides,
  };
  return {
    calls,
    lifecycle: new BrowserPageHostLifecycle(options),
    options,
    setProtected(value) { protectedTab = value; },
    thread,
    windowState: state,
    windows,
  };
}

{
  const harness = createHarness();
  equal(harness.lifecycle.registerRendererSession(harness.windowState, "renderer-1"), true);
  equal(harness.thread.hostGeneration, 2);
  const pending = { route: { browserTabId: "tab-1", conversationId: "conversation-1" }, stopTrackingCalls: 0, webContents: createWebContents(91), stopTracking() { this.stopTrackingCalls += 1; } };
  harness.windowState.pendingAdoptedWebviewsByWebContentsId.set(91, pending);
  harness.windowState.pendingWebviewRoutesByInstanceId.set("route", { route: pending.route });
  equal(harness.lifecycle.registerRendererSession(harness.windowState, "renderer-2"), true);
  equal(harness.windowState.rendererInstanceId, "renderer-2");
  equal(harness.thread.hostGeneration, null);
  equal(pending.stopTrackingCalls, 1);
  equal(pending.webContents.destroyed, 1);
  equal(harness.windowState.pendingWebviewRoutesByInstanceId.size, 0);
}

{
  const harness = createHarness();
  equal(harness.lifecycle.registerHost(harness.windowState, "conversation-1", "tab-1", 3, "persist", "bad"), false);
  equal(harness.calls.length, 0);
  equal(harness.lifecycle.registerHost(harness.windowState, "conversation-1", "tab-1", 1, "persist", "renderer-1"), false);
  equal(harness.calls.find(([name]) => name === "find").slice(1), ["conversation-1", "tab-1"]);
  harness.calls.length = 0;
  harness.options.browserPersistence.reconcileBrowserStorageId = () => false;
  equal(harness.lifecycle.registerHost(harness.windowState, "conversation-1", "tab-1", 3, "persist", "renderer-1"), false);
  equal(harness.calls.some(([name]) => name === "prepare"), false);
}

{
  const harness = createHarness();
  harness.thread.hostGeneration = null;
  equal(harness.lifecycle.registerHost(harness.windowState, "conversation-1", "tab-1", 3, "persist", "renderer-1"), true);
  equal(harness.thread.hostGeneration, 3);
  equal(harness.calls.filter(([name]) => name === "register").length, 1);
}

{
  const harness = createHarness({ thread: createThread({ page: null }) });
  const guest = createWebContents(60);
  harness.lifecycle.attachWebview(harness.windowState, guest, {
    hostGeneration: 2,
    rendererInstanceId: "renderer-1",
    route: { conversationId: "conversation-1", browserTabId: "tab-1" },
  });
  equal(harness.calls.filter(([name]) => name === "missingAttach").length, 1);
  equal(guest.closed, 1);
}

{
  const harness = createHarness();
  const guest = createWebContents(61);
  harness.lifecycle.attachWebview(harness.windowState, guest, {
    hostGeneration: 1,
    rendererInstanceId: "renderer-1",
    route: { conversationId: "conversation-1", browserTabId: "tab-1" },
  });
  equal(guest.closed, 1);
  equal(harness.calls.find(([name]) => name === "debug")[1].kind, "browser-runtime-attach-stale");
  equal(harness.calls.filter(([name]) => name === "warning").length, 1);
}

{
  const previous = createWebContents(62);
  const thread = createThread({ page: createPage(previous) });
  const harness = createHarness({ thread });
  const guest = createWebContents(63);
  harness.lifecycle.attachWebview(harness.windowState, guest, {
    hostGeneration: 2,
    initialNavigationOwner: "renderer",
    rendererInstanceId: "renderer-1",
    route: { conversationId: "conversation-1", browserTabId: "tab-1" },
  });
  equal(harness.calls.find(([name]) => name === "debug")[1].kind, "browser-runtime-attached");
  equal(harness.calls.find(([name]) => name === "debug")[1].pageKey, "10:conversation-1:tab-1");
  equal(harness.calls.filter(([name]) => name === "bind").length, 1);
  equal(thread.page.view.webContents, guest);
  equal(previous.closed, 1);
  equal(harness.lifecycle.findPageStateForWebContentsId(63).threadState, thread);
}

{
  const firstThread = createThread();
  firstThread.page.view.webContents.id = 71;
  const firstWindow = createWindow(firstThread);
  const secondThread = createThread({ browserTabId: "tab-2", conversationId: "conversation-2", page: createPage(createWebContents(70)) });
  const secondWindow = createWindow(secondThread, { owner: { id: 11 }, window: { id: 21 } });
  const harness = createHarness({ thread: firstThread, windowState: firstWindow });
  harness.windows.set(21, secondWindow);
  const guest = createWebContents(70);
  harness.lifecycle.attachWebview(firstWindow, guest, {
    hostGeneration: 2,
    rendererInstanceId: "renderer-1",
    route: { conversationId: "conversation-1", browserTabId: "tab-1" },
  });
  equal(guest.closed, 1);
  equal(harness.calls.find(([name]) => name === "debug")[1].kind, "browser-runtime-attach-route-rebind-rejected");
}

{
  const harness = createHarness();
  harness.lifecycle.updateThreadSessionState(harness.thread);
  equal(harness.thread.sessionState, "live-detached");
  equal(harness.thread.lastLifecycleSequence, 1);
  harness.thread.presented = true;
  harness.lifecycle.updateThreadSessionState(harness.thread);
  equal(harness.thread.sessionState, "live-attached");
  equal(harness.thread.lastPresentedSequence, 2);
  harness.thread.page.isSuspended = true;
  harness.lifecycle.updateThreadSessionState(harness.thread);
  equal(harness.thread.sessionState, "suspended");
  harness.thread.page = null;
  harness.thread.snapshot.isSuspended = false;
  harness.lifecycle.updateThreadSessionState(harness.thread);
  equal(harness.thread.sessionState, "cold");
}

{
  const harness = createHarness();
  equal(harness.lifecycle.suspendPage(harness.thread, "suspension-1"), true);
  equal(harness.thread.page.pendingSuspensionId, "suspension-1");
  equal(harness.calls.filter(([name]) => name === "persist").length, 1);
  harness.thread.isBrowserUseActive = true;
  equal(harness.lifecycle.suspendPage(harness.thread, "suspension-2"), false);
}

{
  const harness = createHarness();
  let checks = 0;
  harness.options.tabBudget.isTabProtectedFromSuspension = () => ++checks === 2;
  harness.lifecycle.suspendDetachedThread(harness.windowState, harness.thread);
  equal(checks, 2);
  equal(harness.thread.page.pendingSuspensionId, null);
  equal(harness.calls.filter(([name]) => name === "message").length, 0);
  equal(harness.calls.filter(([name]) => name === "enforce").length, 1);
}

{
  const harness = createHarness();
  harness.thread.page.incompleteObservation = { url: "https://example.com" };
  harness.lifecycle.requestThreadTeardown(harness.windowState, "conversation-1", harness.thread, "closed");
  equal(harness.calls.find(([name]) => name === "incomplete")[1].observation.timeout, 5_000);
  equal(harness.calls.filter(([name]) => name === "deleteSnapshot").length, 1);
  equal(harness.calls.filter(([name]) => name === "invalidated").length, 1);
  const message = harness.calls.find(([name]) => name === "message")[2];
  equal(message.reason, "closed");
  equal(typeof message.teardownId, "string");
  harness.lifecycle.requestThreadTeardown(harness.windowState, "conversation-1", harness.thread, "closed");
  equal(harness.calls.filter(([name]) => name === "message").length, 1);
  const teardownId = harness.thread.pendingTeardown.teardownId;
  harness.lifecycle.finalizeThreadTeardown(harness.windowState, "conversation-1", harness.thread, "wrong");
  equal(harness.thread.pendingTeardown.teardownId, teardownId);
  harness.lifecycle.finalizeThreadTeardown(harness.windowState, "conversation-1", harness.thread, teardownId);
  equal(harness.thread.pendingTeardown, null);
  equal(harness.thread.page.disposeCalls, 1);
  equal(harness.calls.filter(([name]) => name === "closed").length, 1);
  equal(harness.calls.filter(([name]) => name === "remove").length, 1);
}

{
  const harness = createHarness();
  harness.lifecycle.requestThreadTeardown(harness.windowState, "conversation-1", harness.thread, "suspended");
  const teardownId = harness.thread.pendingTeardown.teardownId;
  harness.thread.presented = true;
  harness.lifecycle.finalizeThreadTeardown(harness.windowState, "conversation-1", harness.thread, teardownId);
  equal(harness.thread.pendingTeardown, null);
  equal(harness.thread.page.pendingSuspensionId, null);
  equal(harness.thread.page.disposeCalls, 0);
  equal(harness.calls.filter(([name]) => name === "sync").length, 1);
}

{
  const harness = createHarness();
  harness.lifecycle.requestThreadTeardown(harness.windowState, "conversation-1", harness.thread, "suspended");
  const teardownId = harness.thread.pendingTeardown.teardownId;
  harness.lifecycle.finalizeThreadTeardown(harness.windowState, "conversation-1", harness.thread, teardownId);
  equal(harness.thread.page.isSuspended, true);
  equal(harness.thread.page.disposeCalls, 1);
  equal(harness.calls.filter(([name]) => name === "tornDown").length, 1);
  equal(harness.calls.filter(([name]) => name === "suspended").length, 1);
}

{
  const harness = createHarness();
  const placeholder = createThread({ hostGeneration: 9, mountGeneration: 10, page: createPage(null), isAnnotationModeEnabled: true, visible: true, presented: true });
  const target = createWindow(placeholder, { rendererInstanceId: "renderer-2" });
  const signal = new AbortController();
  const result = await harness.lifecycle.transferToWindow(harness.windowState, target, {
    content: { browserTabId: "tab-1", conversationId: "conversation-1" },
    receiver: { attach: (...args) => { harness.calls.push(["receiver", ...args]); return Promise.resolve(); } },
    signal: signal.signal,
  });
  equal(result, "moved");
  equal(harness.windowState.threads.size, 0);
  equal(target.threads.get("conversation-1:tab-1"), harness.thread);
  equal(harness.thread.hostGeneration, 9);
  equal(harness.calls.filter(([name]) => name === "transferBind").length, 1);
  equal(harness.calls.filter(([name]) => name === "transferMessage").length, 1);
  equal(target.pendingWindowTransfer, undefined);
}

{
  const harness = createHarness();
  const placeholder = createThread({ hostGeneration: 9, page: createPage(null) });
  const target = createWindow(placeholder, { rendererInstanceId: "renderer-2" });
  const abort = new AbortController();
  abort.abort();
  equal(await harness.lifecycle.transferToWindow(harness.windowState, target, {
    content: { browserTabId: "tab-1", conversationId: "conversation-1" },
    receiver: { attach: () => Promise.resolve() }, signal: abort.signal,
  }), "not-moved");
  equal(harness.windowState.threads.get("conversation-1:tab-1"), harness.thread);
}

{
  const harness = createHarness();
  const placeholder = createThread({ hostGeneration: 9, page: createPage(null) });
  const target = createWindow(placeholder, { rendererInstanceId: "renderer-2" });
  harness.options.getPageLifecycleHelpers = () => ({
    comments: { dismiss: () => {} },
    bindPageToWebview: () => { throw Error("bind failed"); },
    syncRuntimeStateToPage: () => {},
  });
  equal(await harness.lifecycle.transferToWindow(harness.windowState, target, {
    content: { browserTabId: "tab-1", conversationId: "conversation-1" },
    receiver: { attach: () => Promise.resolve() }, signal: new AbortController().signal,
  }), "closed");
  equal(harness.calls.filter(([name]) => name === "transferError").length, 1);
  equal(target.pendingWindowTransfer, undefined);
}

console.log(`${assertions} main browser-page host lifecycle assertions passed`);
