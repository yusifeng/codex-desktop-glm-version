import assert from "node:assert/strict";
import { IabBrowserUseApi } from "../app/.vite/build/main-app/browser-use/iab-api.js";

const api = new IabBrowserUseApi(() => null, undefined, {
  ensureSessionRoute: ({ conversationId }) => conversationId === "c-1",
  buildFlavor: "test",
  appSessionId: "app-1",
});

assert.equal(api.ping(), "pong");
assert.deepEqual(api.requireBrowserUseSession({ conversationId: "c-1", routeKey: "r-1" }), { conversationId: "c-1" });
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
console.log("main IAB API boundary: 5 assertions passed");
