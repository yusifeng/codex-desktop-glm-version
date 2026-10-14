import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-tab-working-set-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { BrowserTabWorkingSetManager } = await import(
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

function createThread(index, overrides = {}) {
  return {
    browserTabId: `tab-${String(index).padStart(2, "0")}`,
    conversationId: `conversation-${index}`,
    isBrowserUseActive: false,
    lastTabActivitySequence: index,
    page: {
      isAudible: false,
      isCapturingUserMedia: false,
      isLoading: false,
      isRestoring: false,
      view: { webContents: { id: 1_000 + index, isDestroyed: () => false } },
    },
    pendingTeardown: null,
    presented: false,
    sessionState: "live-detached",
    ...overrides,
  };
}

function createWindow(threads, overrides = {}) {
  return {
    activeBrowserTabId: null,
    activeConversationId: null,
    owner: { id: 10 },
    threads: new Map(threads.map((thread) => [thread.browserTabId, thread])),
    window: { id: 20 },
    ...overrides,
  };
}

function createHarness({ threads = [createThread(1)], windowState, now = 1_000 } = {}) {
  const state = windowState ?? createWindow(threads);
  const windows = new Map([[state.window.id, state]]);
  const calls = [];
  let currentTime = now;
  const downloads = new Set();
  const manager = new BrowserTabWorkingSetManager({
    browserSessionRegistry: {
      recordDebugEvent(event) { calls.push(["event", event]); },
    },
    hasActiveDownload(thread) { return downloads.has(thread.browserTabId); },
    now() { return currentTime; },
    onTabActivity() { calls.push(["activity"]); },
    suspendDetachedThread(window, thread) { calls.push(["suspend", window, thread]); },
    windows,
  });
  return {
    calls,
    downloads,
    manager,
    setNow(value) { currentTime = value; },
    threads,
    windowState: state,
    windows,
  };
}

{
  const first = createThread(1);
  const second = createThread(2);
  const harness = createHarness({ threads: [first, second], now: 100 });
  harness.manager.markTabActivity(first);
  equal(first.lastTabActivitySequence, 1);
  equal(first.lastTabActivityTime, 100);
  harness.setNow(90);
  harness.manager.markTabActivity(second);
  equal(second.lastTabActivitySequence, 2);
  equal(second.lastTabActivityTime, 101);
  equal(harness.calls.filter(([name]) => name === "activity").length, 2);
}

{
  const first = createThread(1);
  const second = createThread(2);
  const harness = createHarness({ threads: [first, second], now: 1_000 });
  harness.manager.markTabSelected(harness.windowState, first);
  harness.setNow(2_000);
  harness.manager.markTabSelected(harness.windowState, second);
  equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, first), true);
  equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, second), true);
  equal(first.lastTabActivitySequence, 1);
  equal(second.lastTabActivitySequence, 2);
  harness.setNow(2_000 + 30 * 60 * 1_000);
  equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, first), false);
  equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, second), false);
}

{
  const fields = [
    ["presented", true],
    ["isBrowserUseActive", true],
    ["isTabCaptureActive", true],
  ];
  for (const [field, value] of fields) {
    const thread = createThread(1, { [field]: value });
    const harness = createHarness({ threads: [thread] });
    equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, thread), true);
  }
  for (const field of ["isAudible", "isCapturingUserMedia", "isLoading", "isRestoring"]) {
    const thread = createThread(1);
    thread.page[field] = true;
    const harness = createHarness({ threads: [thread] });
    equal(harness.manager.isTabProtectedFromSuspension(harness.windowState, thread), true);
  }
  const downloadThread = createThread(1);
  const downloadHarness = createHarness({ threads: [downloadThread] });
  downloadHarness.downloads.add(downloadThread.browserTabId);
  equal(
    downloadHarness.manager.isTabProtectedFromSuspension(
      downloadHarness.windowState,
      downloadThread,
    ),
    true,
  );
  downloadHarness.windowState.activeConversationId = downloadThread.conversationId;
  downloadHarness.windowState.activeBrowserTabId = downloadThread.browserTabId;
  equal(
    downloadHarness.manager.isTabProtectedFromSuspension(
      downloadHarness.windowState,
      downloadThread,
    ),
    true,
  );
}

{
  const threads = Array.from({ length: 32 }, (_, index) => createThread(index));
  const harness = createHarness({ threads });
  harness.manager.enforceDetachedPageBudget(harness.windowState);
  equal(harness.calls.filter(([name]) => name === "suspend").length, 0);
  equal(harness.calls.filter(([name]) => name === "event").length, 0);
}

{
  const threads = Array.from({ length: 33 }, (_, index) => createThread(index));
  threads[0].lastTabActivitySequence = 50;
  threads[1].lastTabActivitySequence = 1;
  threads[2].lastTabActivitySequence = 1;
  const windowState = createWindow(threads, {
    activeBrowserTabId: threads[0].browserTabId,
    activeConversationId: threads[0].conversationId,
  });
  const harness = createHarness({ threads, windowState });
  harness.manager.enforceDetachedPageBudget(windowState);
  const suspended = harness.calls.find(([name]) => name === "suspend")[2];
  equal(suspended, threads[1]);
  const event = harness.calls.find(([name]) => name === "event")[1];
  equal(event.kind, "browser-tab-budget-suspension-selected");
  equal(event.browserTabId, threads[1].browserTabId);
  equal(event.guestWebContentsId, threads[1].page.view.webContents.id);
  equal(event.details, [
    { label: "budget", value: "32" },
    { label: "candidateRank", value: "inactive-secondary" },
    { label: "activeTabProtectedCount", value: "1" },
    { label: "liveDetachedRendererCount", value: "33" },
    { label: "pressureReason", value: "count" },
    { label: "workingSetSelectedProtectedCount", value: "0" },
  ]);
}

{
  const threads = Array.from({ length: 33 }, (_, index) => createThread(index));
  threads[0].page.isRestoring = true;
  const harness = createHarness({ threads });
  harness.manager.enforceDetachedPageBudget(harness.windowState);
  equal(harness.calls.filter(([name]) => name === "suspend").length, 0);
  threads[0].page.isRestoring = false;
  threads[0].pendingTeardown = { reason: "suspended" };
  harness.manager.enforceDetachedPageBudget(harness.windowState);
  equal(harness.calls.filter(([name]) => name === "suspend").length, 0);
}

{
  const threads = Array.from({ length: 33 }, (_, index) => createThread(index));
  const harness = createHarness({ threads });
  for (const thread of threads) harness.manager.markTabSelected(harness.windowState, thread);
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timers = [];
  const cleared = [];
  globalThis.setTimeout = (callback, delay) => {
    const timer = { callback, delay, unrefCalls: 0, unref() { this.unrefCalls += 1; } };
    timers.push(timer);
    return timer;
  };
  globalThis.clearTimeout = (timer) => cleared.push(timer);
  try {
    harness.manager.enforceDetachedPageBudget(harness.windowState);
    equal(timers.length, 1);
    ok(timers[0].delay > 0);
    equal(timers[0].unrefCalls, 1);
    harness.manager.enforceDetachedPageBudget(harness.windowState);
    equal(cleared[0], timers[0]);
    equal(timers.length, 2);
    harness.manager.handleWindowClosed(harness.windowState.window.id);
    equal(cleared[1], timers[1]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
}

{
  const thread = createThread(1);
  const harness = createHarness({ threads: [thread] });
  harness.manager.recordTabSuspended(harness.windowState, thread);
  const event = harness.calls.find(([name]) => name === "event")[1];
  equal(event.kind, "browser-tab-budget-tab-suspended");
  equal(event.details, [{ label: "pressureReason", value: "count" }]);
  equal(event.ownerWebContentsId, 10);
  equal(event.windowId, 20);
}

{
  const live = createThread(1);
  const cold = createThread(2, { sessionState: "cold" });
  const destroyed = createThread(3);
  destroyed.page.view.webContents.isDestroyed = () => true;
  const threads = [live, cold, destroyed, ...Array.from({ length: 32 }, (_, index) => createThread(index + 4))];
  const harness = createHarness({ threads });
  harness.manager.enforceDetachedPageBudget(harness.windowState);
  equal(harness.calls.filter(([name]) => name === "suspend").length, 1);
  equal(harness.calls.find(([name]) => name === "suspend")[2], live);
}

console.log(`${assertions} main browser-tab working-set manager assertions passed`);
