import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-host-service.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createBrowserHostServiceClass } = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };

class RpcHandlerBase {}
class ExtensionActionMenus {
  constructor(origin) { this.origin = origin; this.calls = []; this.disposed = false; }
  begin(...args) { this.calls.push(["begin", ...args]); return "begun"; }
  execute(...args) { this.calls.push(["execute", ...args]); return "executed"; }
  close(...args) { this.calls.push(["close", ...args]); }
  [Symbol.dispose]() { this.disposed = true; }
}
const helperCalls = [];
const BrowserHostService = createBrowserHostServiceClass({
  RpcHandlerBase,
  ExtensionActionMenus,
  browserMessageChannel: "browser-channel",
  browserStorageIdOf: (value) => `storage:${value}`,
  browserTabIdOf: (value) => `tab:${value}`,
  getExtensionActions: async (get) => { helperCalls.push(["actions", get()]); return "actions"; },
  subscribeExtensionProfile: (...args) => { helperCalls.push(["profile", ...args]); return "profile"; },
  setExtensionPinned: (...args) => { helperCalls.push(["pin", args[0]()]); return "pinned"; },
  showExtensionActionContextMenu: (...args) => { helperCalls.push(["menu", args[0](), ...args.slice(1)]); return "menu"; },
  subscribeExtensionActionEvents: (...args) => { helperCalls.push(["events", args[0](), ...args.slice(1)]); return "events"; },
  subscribeFavicon: (...args) => { helperCalls.push(["favicon", ...args]); return "favicon"; },
  triggerExtensionAction: (...args) => { helperCalls.push(["trigger", args[0](), ...args.slice(1)]); return "triggered"; },
});

const originListeners = new Map();
const origin = {
  destroyed: false,
  isDestroyed() { return this.destroyed; },
  once(name, callback) { originListeners.set(name, callback); },
  removeListener(name, callback) { if (originListeners.get(name) === callback) originListeners.delete(name); },
};
const pageListeners = new Map();
let viewportResolve;
const page = {
  destroyed: false,
  sent: [],
  isDestroyed() { return this.destroyed; },
  isLoadingMainFrame: () => false,
  getURL: () => "https://example.test",
  on(name, callback) { pageListeners.set(name, callback); },
  once(name, callback) { pageListeners.set(name, callback); },
  removeListener(name, callback) { if (pageListeners.get(name) === callback) pageListeners.delete(name); },
  send(...args) { this.sent.push(args); },
  waitForViewportSize() { return new Promise((resolve) => { viewportResolve = resolve; }); },
};
const managerCalls = [];
const session = { extensions: { getExtensionCounts: () => 4 } };
const manager = new Proxy({
  permissionPrompts: {
    subscribe: (...args) => ["subscribe", ...args],
    respond: (...args) => ["respond", ...args],
    openSystemSettings: (...args) => ["settings", ...args],
  },
  getBrowserSession: () => session,
  getCurrentPageWebContents: () => page,
  getExtensionActionMenuTarget: () => ({ webContents: page, allowHiddenBlankTab: true }),
  getBrowserPageRestoreResults: (...args) => args,
}, {
  get(target, key) {
    if (key in target) return target[key];
    return (...args) => { managerCalls.push([key, ...args]); return key; };
  },
});
const routeCalls = [];
const owner = { id: "owner" };
const messageHandler = {
  forwardBrowserNavigationUrl: (...args) => routeCalls.push(["forward", ...args]),
  getBrowserOwnerWebContentsForOrigin: () => owner,
  getBrowserSessionRegistry: () => ({
    cancelPendingLocalWorkSessionRoute: (input) => routeCalls.push(["cancel", input]),
    prepareLocalWorkSessionRoute: (input) => routeCalls.push(["prepare", input]),
  }),
  deletePersistedBrowserConversation: (...args) => routeCalls.push(["delete", ...args]),
};
const deleted = [];
const service = new BrowserHostService(messageHandler, manager, origin, "usage", async (id) => deleted.push(id), () => "paired", "detached");

equal(service.detachedTabs, "detached");
equal(service.subscribePermissionPrompts("input", "callback"), ["subscribe", origin, "input", "callback"]);
equal(service.respondToPermissionPrompt("input", "response"), ["respond", origin, "input", "response"]);
equal(service.openPermissionSystemSettings("input"), ["settings", origin, "input"]);
equal(service.getPageRestoreResults({ pages: [{ browserStorageId: "s", browserTabId: "t", conversationId: "c" }] }), [origin, [{ browserStorageId: "storage:s", browserTabId: "tab:t", conversationId: "c" }]]);
equal(await service.getExtensionActions({ conversationId: "c", browserTabId: "t" }), "actions");
equal(await service.subscribeExtensionProfile("profile-input"), "profile");
equal(await service.getExtensionCounts(), 4);
equal(await service.setExtensionPinned({ conversationId: "c", browserTabId: "t" }), "pinned");
equal(await service.showExtensionActionContextMenu({ conversationId: "c", browserTabId: "t" }), "menu");
equal(service.subscribeExtensionActionEvents({ conversationId: "c", browserTabId: "t" }, "callback"), "events");
equal(service.subscribeFavicon({ conversationId: "c", browserTabId: "t", size: 32 }, "callback"), "favicon");
equal(await service.triggerExtensionAction({ conversationId: "c", browserTabId: "t" }), "triggered");

await service.cancelPendingLocalWorkSessionRoute({ browserConversationId: "browser-c" });
await service.prepareLocalWorkSessionRoute({ browserConversationId: "browser-c" });
equal(routeCalls.slice(-2), [["cancel", { browserConversationId: "browser-c", owner }], ["prepare", { browserConversationId: "browser-c", owner }]]);
await service.deleteConversation({ conversationId: "conversation" });
equal(deleted, ["conversation"]);

await service.setSiteAnnotationFeaturePreview({ conversationId: "c", browserTabId: "t", siteUrl: "https://example.test", preview: { enabled: true } });
equal(page.sent[0], ["browser-channel", { type: "browser-site-annotation-feature-preview", preview: { enabled: true } }]);
pageListeners.get("did-start-navigation")({}, "url", 200, true);
equal(page.sent.at(-1), ["browser-channel", { type: "browser-site-annotation-feature-preview", preview: null }]);
equal(pageListeners.has("did-start-navigation"), false);

const viewportPromise = service.waitForViewportSize({ browserTabId: "t", conversationId: "c", requestId: "request", viewportSize: { width: 100 } });
viewportResolve();
equal(await viewportPromise, true);
const cancelledViewport = service.waitForViewportSize({ browserTabId: "t", conversationId: "c", requestId: "cancel", viewportSize: {} });
await service.cancelViewportWait("cancel");
equal(await cancelledViewport, false);

service[Symbol.dispose]();
equal(service.extensionActionMenus.disposed, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("BrowserHostService = createBrowserHostServiceClass({"), true);
equal(main.includes("var Kke = class"), false);
equal(/\bKke\b/.test(main), false);
equal(windowContext.includes("browserHost: new BrowserHostService("), true);

console.log(`${assertions} main browser host service assertions passed`);
