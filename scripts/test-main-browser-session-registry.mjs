import assert from "node:assert/strict";
import { BrowserSessionRegistry } from "../app/.vite/build/main-app/browser-use/session-registry.js";

const registry = new BrowserSessionRegistry();
const route = { conversationId: "conversation-1", routeKey: "route-1", windowId: 7 };
registry.captureSessionRoute(route);
assert.deepEqual(registry.resolveBrowserRoute("route-1"), route);
assert.equal(registry.resolveBrowserRoute("missing"), null);

const first = await registry.ensureBackendForSession("conversation-1");
assert.equal((await registry.ensureBackendForSession("conversation-1")), first);
assert.equal(registry.canServeSession("conversation-1"), true);
await registry.moveBackendSession("conversation-1", "conversation-2");
assert.equal(registry.canServeSession("conversation-1"), false);
assert.equal(registry.canServeSession("conversation-2"), true);

registry.recordPageCreated({ browserTabId: "tab-1", conversationId: "conversation-2", createdAtMs: 1, pageKey: "page-1", windowId: 7 });
assert.equal(registry.getPageRecordForConversation("conversation-2")?.pageKey, "page-1");
registry.forgetPageRecord("page-1");
assert.equal(registry.getPageRecordForConversation("conversation-2"), null);
await registry.disposeBackendForSession("conversation-2");
assert.equal(registry.canServeSession("conversation-2"), false);
await registry.disposeConversation("conversation-1");
assert.equal(registry.resolveBrowserRoute("route-1"), null);

console.log("main browser session registry: 11 assertions passed");
