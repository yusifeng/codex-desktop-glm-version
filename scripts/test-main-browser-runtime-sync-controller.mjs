import assert from "node:assert/strict";
import { createBrowserRuntimeSyncControllerClass } from "../src/main/main-app/browser-sidebar/browser-runtime-sync-controller.ts";

const calls = [];
const hX = (windowState, conversationId, browserTabId) =>
  windowState.threads?.get(`${conversationId}:${browserTabId}`) ?? null;
const kZe = () => () => {};
const messages = [];
const Controller = createBrowserRuntimeSyncControllerClass({
  hX, fq: () => {}, kZe, tq: () => {}, KU: () => "page-key", EZ: "preload",
  WU: (_manager, _target, message) => messages.push(message), dZ: (...args) => calls.push(["throttle", ...args]),
  QU: (value) => value.url, Ze: (value = "") => value.replace(/\/$/, ""), n: { lu: { WEB: "web" } },
  pX: () => ({ default: true }), dZe: () => null, oX: (value) => value,
  dq: (...args) => calls.push(["find", ...args]), isEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
});

const windowState = { owner: { id: 1, isDestroyed: () => false }, threads: new Map(), window: { id: 2 } };
const page = {
  browserTabId: "tab", conversationId: "conversation", view: { webContents: null }, url: "https://example.test",
  isRestoring: false, isSuspended: true, isWaitingForResponse: false, loadError: null, title: "Example", fallbackTitle: "Fallback",
  faviconUrl: null, mediaIndicator: { state: { isAudible: false, isCapturingUserMedia: false } }, isMainFrameLoading: false,
  canGoBack: false, canGoForward: false, siteAnnotationFeatures: [], siteToolsAvailability: { webMcp: "unavailable", annotations: "unavailable" },
  webMcpToolsRevision: 0, lastWebMcpToolCall: null, isLoading: false,
};
const threadState = { conversationId: "conversation", browserTabId: "tab", page, isBrowserUsePage: true, snapshot: { url: "", title: "", tabType: "web" } };
windowState.threads.set("conversation:tab", threadState);

let tracked = 0;
let refreshed = 0;
let runtimeSync = 0;
const owner = {
  iabTabMentions: { trackSnapshotUpdate(state, callback) { assert.equal(state, threadState); tracked += 1; callback(); } },
  refreshCommentModeBlockStatus() { refreshed += 1; },
  browserPageHostLifecycle: {
    findPageStateForWebContentsId() { return null; },
    isBrowserUseManagedBrowserTab() { return false; },
    updateThreadSessionState() {},
    finalizeThreadTeardown() {},
  },
  comments: { syncRuntimeStateToPage(...args) { runtimeSync += 1; assert.equal(args[1], "conversation"); } },
  getCurrentWindowState(value) { return value === owner.webContents ? windowState : null; },
  getPageWindowState() { return null; },
  getPreferredWindowStateForConversation() { return null; },
  getSiteBootstrapToken: () => null,
  siteBootstrapController: new AbortController(),
  browserSessionRegistry: {},
  tabBudget: { enforceDetachedPageBudget() {} },
  errorReporter: {},
  windowManager: {},
  iabTabMentions: { notifyInvalidated() {}, trackSnapshotUpdate(state, callback) { assert.equal(state, threadState); tracked += 1; callback(); } },
  browserPageSnapshots: { deleteAndFlush() {} },
  ownerCommandAccelerators: {},
  onBrowserStateChanged() {},
  siteAnnotationFeatures: { isEnabled() { return true; } },
  getThreadStateForWindow: hX,
};
owner.webContents = {};
const controller = new Controller(owner);

controller.syncThreadState(windowState, "conversation", threadState, "https://example.test", null);
assert.equal(tracked, 1);
assert.equal(refreshed, 1);
assert.equal(threadState.snapshot.url, "https://example.test");
assert.equal(threadState.snapshot.title, "Example");
assert.equal(messages.at(-1).type, "browser-sidebar-state");
assert.equal(calls.some(([kind]) => kind === "throttle"), true);
assert.equal(calls.some(([kind]) => kind === "find"), true);

controller.syncCommentSnapshot(owner.webContents, "conversation", threadState);
assert.equal(tracked, 2);
assert.equal(refreshed, 2);
assert.equal(runtimeSync, 0);

const helpers = controller.getPageLifecycleHelpers();
assert.equal(typeof helpers.syncThreadState, "function");
assert.equal(typeof helpers.syncRuntimeStateToPage, "function");
assert.equal(typeof helpers.getThreadStateForWindow, "function");
console.log("browser runtime sync controller tests passed");
