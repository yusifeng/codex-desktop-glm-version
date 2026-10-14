import assert from "node:assert/strict";
import { createBrowserRuntimeSyncControllerClass } from "../src/main/main-app/browser-sidebar/browser-runtime-sync-controller.ts";

const calls = [];
const uZe = (...args) => calls.push(args);
const hX = (windowState, conversationId, browserTabId) =>
  windowState.threads?.get(`${conversationId}:${browserTabId}`) ?? null;
const kZe = () => () => {};
const Controller = createBrowserRuntimeSyncControllerClass({ uZe, hX, fq: () => {}, kZe, tq: () => {}, KU: () => "page-key" });

const windowState = { owner: { id: 1 }, threads: new Map(), window: { id: 2 } };
const page = { conversationId: "conversation", view: { webContents: null } };
const threadState = { conversationId: "conversation", browserTabId: "tab", page, snapshot: {} };
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
assert.equal(calls.length, 1);
assert.equal(calls[0][1], windowState);
assert.equal(calls[0][2], "conversation");
assert.equal(calls[0][3], threadState);

controller.syncCommentSnapshot(owner.webContents, "conversation", threadState);
assert.equal(tracked, 2);
assert.equal(refreshed, 2);
assert.equal(runtimeSync, 0);

const helpers = controller.getPageLifecycleHelpers();
assert.equal(typeof helpers.syncThreadState, "function");
assert.equal(typeof helpers.syncRuntimeStateToPage, "function");
assert.equal(typeof helpers.getThreadStateForWindow, "function");
console.log("browser runtime sync controller tests passed");
