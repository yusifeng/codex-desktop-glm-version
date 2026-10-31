import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-tab-lifecycle-runtime.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserTabLifecycleRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const logs = [];
const messages = [];
const order = [];
const runtime = createBrowserTabLifecycleRuntime({
  createLogger: (name) => () => ({ info: (message, fields) => logs.push({ name, message, fields }) }),
  makePageRecordKey: ({ browserTabId, conversationId }) => `${conversationId}:${browserTabId}`,
  serializeWindowId: (windowId) => `window-${windowId}`,
  shared: { du: "New tab", gu: { BATCH: "batch" }, lu: { NEW_TAB_PAGE: "new-tab" } },
});

equal(runtime.browserRouteKey({ conversationId: "conversation", windowId: "window" }), "window:conversation");
equal(runtime.pageRecordKey({ browserTabId: "tab", conversationId: "conversation" }), "conversation:tab");

const current = { browserTabId: "tab-a", conversationId: "conversation-a", isBrowserUsePage: false };
const browserUse = { browserTabId: "tab-b", conversationId: "conversation-a", isBrowserUsePage: true };
const other = { browserTabId: "tab-c", conversationId: "conversation-b", isBrowserUsePage: true };
const windowState = {
  activeBrowserTabId: "tab-a",
  activeConversationId: "conversation-a",
  ignoredConversationIds: new Set(["conversation-a:tab-a"]),
  owner: { id: 17 },
  threads: new Map([["conversation-a:tab-a", current], ["conversation-a:tab-b", browserUse]]),
  window: { id: 8 },
};
const windows = new Map([[8, windowState], [9, { threads: new Map([["conversation-b:tab-c", other]]) }]]);
const event = runtime.buildTabLifecycleEvent({ action: "opened", threadState: current, windows });
equal(event.type, "browser-sidebar-tab-lifecycle");
equal(event.threadBrowserTabCount, 2);
equal(event.appBrowserTabCount, 3);
equal(event.threadBrowserUseTabCount, 1);
equal(event.appBrowserUseTabCount, 2);
equal(event.isBrowserUseTab, false);
equal(runtime.buildTabLifecycleEvent({ action: "opened", isBrowserUseTab: true, threadState: current, windows }).isBrowserUseTab, true);

const windowManager = {
  sendMessageToWebContents(owner, message) {
    order.push("message");
    messages.push({ owner, message });
  },
};
runtime.emitTabLifecycle({ action: "opened", threadState: current, windowManager, windows, windowState });
equal(messages.length, 1);
equal(messages[0].owner.id, 17);
equal(messages[0].message.appBrowserTabCount, 3);
equal(logs.length, 1);
equal(logs[0].name, "browser-sidebar-manager");
equal(logs[0].fields.safe.ownerWebContentsId, 17);

runtime.registerThreadAndRecordOpened(
  { registerThread(input) { order.push("register"); equal(input, { conversationId: "conversation-a", windowId: "window-8" }); } },
  windowManager,
  windows,
  windowState,
  current,
);
equal(order.slice(-2), ["register", "message"], "registry registration precedes the opened event");

runtime.deleteThreadAndRecordClosed(windowManager, windows, windowState, current);
equal(windowState.threads.has("conversation-a:tab-a"), false);
equal(windowState.ignoredConversationIds.has("conversation-a:tab-a"), false);
equal(windowState.activeConversationId, null);
equal(windowState.activeBrowserTabId, null);
equal(messages.at(-1).message.action, "closed");
equal(messages.at(-1).message.appBrowserTabCount, 2, "closed counts are measured after deletion");
equal(messages.at(-1).message.isBrowserUseTab, false);

const snapshot = runtime.createDefaultBrowserSnapshot();
equal(snapshot.annotationFlow, "batch");
equal(snapshot.tabType, "new-tab");
equal(snapshot.title, "New tab");
equal(snapshot.interactionMode, "browse");
equal(snapshot.siteToolsAvailability, { webMcp: "unavailable", annotations: "unavailable" });
equal(snapshot.comments, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-tab-lifecycle-runtime.js")'), true);
for (const oldOwner of ["function lX(", "function uX(", "function $Ye(", "function dX(", "function eXe(", "function fX(", "function tXe(", "function nXe(", "function pX("]) {
  equal(main.includes(oldOwner), false, `${oldOwner} is removed`);
}

console.log(`${assertions} main browser tab lifecycle runtime assertions passed`);
