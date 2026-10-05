import assert from "node:assert/strict";
import { IabBrowserUseApi } from "../app/.vite/build/main-app/browser-use/iab-api.js";

const api = new IabBrowserUseApi(() => null, undefined, {
  ensureSessionRoute: ({ conversationId }) => conversationId === "c-1",
  buildFlavor: "test",
  appSessionId: "app-1",
});
const host = { routeKey: "r-1" };
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
routedApi.recordBrowserUseTurn({ conversationId: "c-1" }, { turn_id: "t-1" });
routedApi.clearRecordedBrowserUseTurn({ conversationId: "c-1" }, "t-1");
assert.equal(routedApi.getTab("missing"), null);
assert.throws(() => routedApi.requireLiveTab("missing"), /Unknown tab/);
console.log("main IAB API boundary: 12 assertions passed");
