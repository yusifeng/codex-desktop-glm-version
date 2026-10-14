import assert from "node:assert/strict";
import { createBrowserPagePersistenceControllerClass } from "../src/main/main-app/browser-sidebar/browser-page-persistence-controller.ts";

const events = [];
const snapshots = new Map();
const primaryWindow = { id: 1 };
const manager = {
  getPrimaryWindows: () => [primaryWindow],
  sendMessageToWebContents: (_owner, message) => events.push(message),
};
const registry = {
  recordDebugEvent: (...args) => events.push(args),
};
const lifecycle = {
  materializePageState: (_window, thread, request) => {
    thread.page = { isColdRestore: request.kind === `cold-restore`, view: { webContents: null }, dispose() {} };
    return thread.page;
  },
  removeClosedPage: (_window, thread) => { thread.page = null; },
};
const persistence = {
  enablePersistence: () => {},
  get: (thread) => snapshots.get(thread),
  deleteClosedPageAndFlush: () => {},
  hasDurableStorageIdentity: () => false,
  isDurableStorageIdentityOwnedBy: () => true,
};
const windows = new Map([[1, { id: 1, window: primaryWindow, threads: new Map(), registeredWebviewHostsByRoutePartition: new Map(), ignoredConversationIds: new Set(), owner: {} }]]);
const windowState = windows.get(1);
const Controller = createBrowserPagePersistenceControllerClass({
  pX: () => ({ canGoBack: false, canGoForward: false }),
  n: { lu: { WEB: `web` } },
  PG: ({ browserTabId, conversationId }) => `${conversationId}:${browserTabId}`,
  qU: ({ browserTabId, conversationId }) => `${conversationId}:${browserTabId}`,
  it: (conversationId, browserTabId) => `${conversationId}:${browserTabId}`,
  NX: (...args) => registry.recordDebugEvent(...args),
});
const controller = new Controller(persistence, registry, manager, windows, lifecycle);
const thread = {
  browserTabId: `tab`,
  conversationId: `conversation`,
  browserStorageId: `conversation:tab`,
  sessionState: `cold`,
  page: null,
  pendingTeardown: null,
  isBrowserUsePage: false,
};
windows.get(1).threads.set(`conversation:tab`, thread);
assert.equal(controller.getPagePersistence(windowState, { browserStorageId: `conversation:tab` }).browserStorageId, `conversation:tab`);
assert.equal(controller.preparePage(windowState, thread, { browserStorageId: `conversation:tab`, restore: `required` }).kind, `missing`);
assert.equal(events.at(-1).type, `close-browser-tab`);

events.length = 0;
const snapshot = { navigation: { currentIndex: 0, entries: [{ url: `https://example.test` }] }, title: `Example`, url: `https://example.test`, faviconUrl: `` };
snapshots.set(thread, snapshot);
assert.equal(controller.preparePage(windowState, thread, { browserStorageId: `conversation:tab`, restore: `required` }).kind, `ready`);
assert.equal(thread.page.isColdRestore, true);
assert.equal(events.some((entry) => entry[3] === `browser-restore-page-materialized`), true);

console.log(`browser page persistence controller tests passed`);
