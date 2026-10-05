import assert from "node:assert/strict";
import { CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD, IabBrowserUseApi } from "../app/.vite/build/main-app/browser-use/iab-api.js";

const api = new IabBrowserUseApi(() => null, undefined, {
  ensureSessionRoute: ({ conversationId }) => conversationId === "c-1",
  buildFlavor: "test",
  appSessionId: "app-1",
});
const host = { routeKey: "r-1" };
const activity = [];
const pageEvents = [];
host.setWebMcpToolActivity = (...args) => activity.push(args);
host.activateBrowserUseNavigationRestriction = (pageKey) => pageEvents.push(["restrict", pageKey]);
host.setBrowserUseActive = (...args) => pageEvents.push(["active", ...args]);
const routedApi = new IabBrowserUseApi(() => host, undefined, {
  ensureSessionRoute: () => true,
});

assert.equal(api.ping(), "pong");
assert.deepEqual(api.requireBrowserUseSession({ conversationId: "c-1", routeKey: "r-1" }), { conversationId: "c-1" });
assert.deepEqual(api.getBrowserUseSession({ conversationId: "fallback", session_id: "c-1", routeKey: "r-1" }), { conversationId: "c-1" });
assert.throws(() => api.getBrowserUseSession({ conversationId: "", routeKey: "r-3" }), /Missing required browser session_id/);
assert.throws(() => api.requireBrowserUseSession({ conversationId: "c-2", routeKey: "r-2" }), /No ChatGPT browser route/);
assert.deepEqual(api.getMetadata({ conversationId: "c-1" }), {
  codexAppBuildFlavor: "test",
  codexAppSessionId: "app-1",
  codexSessionId: "c-1",
});
assert.deepEqual(api.getRequestSafeFields({ conversationId: "c-1" }, { turn_id: "t-1" }, "getTabs"), {
  conversationId: "c-1",
  request: "getTabs",
  turnId: "t-1",
});
assert.equal(routedApi.getRequiredBrowserHost({ conversationId: "c-1", routeKey: "r-1" }), host);
routedApi.rememberBrowserHost({ routeKey: "r-1" }, host);
assert.equal(routedApi.getBrowserHostsForSession({ routeKey: "r-1" }), host);
routedApi.allowDownload(7, 5000, { url: "https://example.test/file", sessionId: "c-1" });
assert.equal(routedApi[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://other.test/file", webContentsId: 7 }), null);
assert.deepEqual(routedApi[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://example.test/file", webContentsId: 7 }), { sessionId: "c-1", url: "https://example.test/file" });
routedApi.allowDownload(8, 5000, { url: "https://example.test/once" });
assert.equal(routedApi[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://example.test/once", webContentsId: 8 })?.url, "https://example.test/once");
assert.equal(routedApi[CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD]({ url: "https://example.test/once", webContentsId: 8 }), null);
routedApi.recordBrowserUseTurn({ conversationId: "c-1" }, { turn_id: "t-1" });
routedApi.clearRecordedBrowserUseTurn({ conversationId: "c-1" }, "t-1");
assert.equal(routedApi.getTab("missing"), null);
assert.throws(() => routedApi.requireLiveTab("missing"), /Unknown tab/);

// Native IAB notifications must preserve route ownership and enrich page events
// with the browser session/tab identity before broadcasting to listeners.
routedApi.tabsById.set("tab-1", {
  browser_id: "browser-1", browserTabId: "provider-1", id: "tab-1", routeKey: "r-1", webContentsId: 42,
});
routedApi.notifyWebMcpToolInvoked({ session_id: "c-1", tabId: "tab-1", toolName: "click", turn_id: "t-2", parentCallId: "p-1" });
assert.deepEqual(activity, [["click", "provider-1", "p-1"]]);
assert.deepEqual(pageEvents, [["restrict", "tab-1"], ["active", true, "provider-1"]]);
routedApi.tabsById.set("tab-other-route", { browser_id: "browser-2", id: "tab-other-route", routeKey: "r-2" });
routedApi.notifyWebMcpToolInvoked({ session_id: "c-1", tabId: "tab-other-route", toolName: "ignored", turn_id: "t-3" });
assert.equal(activity.length, 1);
const unsubscribePage = routedApi.addPageEventListener((event) => pageEvents.push(["page", event]));
routedApi.notifyPageEvent("c-1", 42, { type: "page-load", url: "https://example.test" });
routedApi.notifyPageEvent("c-1", 404, { type: "ignored" });
unsubscribePage();
assert.deepEqual(pageEvents[2], ["page", { type: "page-load", url: "https://example.test", session_id: "c-1", tabId: "tab-1" }]);
routedApi.notifyPageEvent("c-1", 42, { type: "after-unsubscribe" });
assert.equal(pageEvents.length, 3);
console.log("main IAB API boundary: 21 assertions passed");
