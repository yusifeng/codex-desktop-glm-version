import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-diagnostics-runtime.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
});
const { createBrowserDiagnosticsRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const runtime = createBrowserDiagnosticsRuntime({
  makePageKey: (ownerId, conversationId, browserTabId) => `${ownerId}:${conversationId}:${browserTabId}`,
  pageUrl: (page) => page.url,
});

const thread = {
  bounds: { x: 1 }, browserStorageId: "storage", browserTabId: "tab", conversationId: "conversation",
  hasPendingBrowserUseVisibilityRequest: true, isAgentControllingBrowser: false, isBrowserUseActive: true,
  isBrowserUsePage: true, lastLifecycleSequence: 3, lastPresentedSequence: 2, mountGeneration: 1,
  ownerRoutePath: "/owner", page: { browserTabId: "tab", conversationId: "conversation", isColdRestore: true,
    isLoading: false, isRestoring: true, isSuspended: false, pendingUrl: "", title: "Page", url: "https://example.test",
    view: { webContents: { id: 19 } } }, pendingBrowserUsePanelOpen: true, pendingTeardown: null,
  presented: true, sessionState: "live", snapshot: { isLoading: false, isSuspended: false, title: "Snapshot", url: "" }, visible: true,
};
const windowState = {
  activeBrowserTabId: "tab", activeConversationId: "conversation", ignoredConversationIds: new Set(), owner: { id: 7, isDestroyed: () => false },
  pendingAdoptedWebviewsByWebContentsId: new Map([[19, { acceptedHostIdentity: { hostGeneration: 4 }, route: { browserTabId: "tab", conversationId: "conversation" } }]]),
  pendingWebviewRoutesByInstanceId: new Map([["instance", { hostGeneration: 5, route: { browserTabId: "tab", conversationId: "conversation" } }]]),
  registeredWebviewHostsByRoutePartition: new Map([["partition", { browserTabId: "tab", conversationId: "conversation", pagePersistence: { browserStorageId: "storage" } }]]),
  threads: new Map([["conversation:tab", thread]]), transferredConversationStateKeys: new Set(),
  window: { id: 8, isDestroyed: () => false },
};
const restoreEvent = { browserTabId: "tab", conversationId: "conversation", kind: "browser-restore-snapshot-found" };
const snapshot = runtime.getDebugSnapshot({
  browserSessionRegistry: { getDebugSnapshot: () => ({ events: [restoreEvent], sessionRoutes: [{ id: 1 }] }) },
  browserUseOpenRequests: { getDebugSnapshot: () => [{ browserTabId: "tab", conversationId: "conversation", ownerWebContentsId: 7 }] },
  getPersistedPageMetadata: () => ({ historyEntryCount: 2, updatedAtMs: 10 }),
  getThreadStateForWindow: (state, conversationId, browserTabId) => state.threads.get(`${conversationId}:${browserTabId}`),
  windows: [windowState],
});
equal(snapshot.events, [restoreEvent]);
equal(snapshot.sessionRoutes, [{ id: 1 }]);
equal(snapshot.pendingAttaches.length, 2);
equal(snapshot.openRequests[0].guestWebContentsId, 19);
equal(snapshot.openRequests[0].pendingAttachCount, 2);
equal(snapshot.tabs[0].restorePhase, "snapshot-found");
equal(snapshot.tabs[0].restoreInvariant, null);
equal(snapshot.tabs[0].webviewHostRegistered, true);
equal(snapshot.tabs[0].pageKey, "7:conversation:tab");
equal(snapshot.tabs[0].url, "https://example.test");
equal(snapshot.windows[0].windowId, 8);

const limited = runtime.limitFeedbackDiagnostics({ events: [{ id: "small" }, { data: "x".repeat(600_000) }] });
equal(limited.events, [{ id: "small" }]);
equal(limited.feedbackMetadata.eventsTruncated, true);
equal(limited.feedbackMetadata.omittedEventCount, 1);
equal(limited.feedbackMetadata.eventByteLimit, 524288);

const calls = [];
equal(runtime.openOwner({
  browserSessionRegistry: { recordDebugEvent: (event) => calls.push(["debug", event]) },
  getLiveWindowState: () => windowState,
  getThreadStateForWindow: () => thread,
  options: { browserTabId: "tab", conversationId: "conversation", windowId: 8 },
  windowManager: { sendMessageToWebContents: (...args) => calls.push(["message", ...args]), showWindow: (...args) => { calls.push(["show", ...args]); return true; } },
}), { opened: true });
equal(calls.map(([kind]) => kind), ["message", "message", "show", "debug"]);
equal(calls[1][2], { type: "navigate-to-route", path: "/owner" });
equal(runtime.openOwner({ getLiveWindowState: () => null, options: { windowId: 9 } }), { opened: false, reason: "missing-window" });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-diagnostics-runtime.js")'), true);
for (const oldOwner of ["function jX(", "function DXe(", "function OXe(", "function kXe(", "function AXe(", "function jXe(", "function MXe(", "function NXe(", "function PXe(", "function FX(", "function IX("]) equal(main.includes(oldOwner), false);
console.log(`${assertions} main browser diagnostics runtime assertions passed`);
