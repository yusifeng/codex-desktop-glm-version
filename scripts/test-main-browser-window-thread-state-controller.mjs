import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-window-thread-state-controller.ts")],
  format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
});
const { createBrowserWindowThreadStateControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`,
);

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const calls = [];
const windows = new Map();
let focusedWindow = null;
const host = {
  windows,
  lastSyncedWindowId: null,
  windowManager: { getPrimaryWindows: () => [], sendMessageToWebContents: (...args) => calls.push(["send", ...args]) },
  browserSessionRegistry: { registerWindow: (value) => calls.push(["register", value]) },
  browserPageHostLifecycle: {
    cancelPendingWebviewAttaches: (...args) => calls.push(["cancel", ...args]),
    requestThreadTeardown: (...args) => calls.push(["teardown", ...args]),
    attachedWebviewHosts: new Map(),
    isBrowserUseManagedBrowserTab: () => false,
  },
  browserPersistence: { hasBrowserStorageOwner: () => false }, browserPageSnapshots: { deleteClosedPageAndFlush: () => calls.push(["delete"]) },
  browserUseOpenRequests: { rejectForRoute: (...args) => calls.push(["reject", ...args]), resolveForWindow: () => undefined },
  siteAnnotationPermissions: { cancel: () => undefined }, comments: {}, downloadStore: {},
  disposeThreadState: () => undefined, setBrowserUseActiveForRoute: () => undefined,
  syncRuntimeStateToPage: () => undefined, syncThreadState: () => undefined, tabBudget: { markTabSelected: () => undefined },
  iabTabMentions: { notifyInvalidated: () => undefined }, admitBrowserTab: () => true,
  getBrowserSession: () => null, siteAnnotationFeatures: { getPolicy: () => null, subscribeAvailability: () => () => undefined },
  findPageStateForRuntimeSender: () => null, ensureThreadStateForWindow: () => null,
  setAnnotationPresentation: () => undefined, getCurrentWindowState: () => windows.get(1) ?? null, ensureCurrentWindowState: () => windows.get(1) ?? null,
};
const controller = new (createBrowserWindowThreadStateControllerClass({
  hX: (state, conversationId, browserTabId) => state?.threads.get(`${conversationId}:${browserTabId}`) ?? null,
  fq: () => undefined, gXe: () => undefined, oX: (value) => value, SWe: () => () => undefined,
  aXe: (state, conversationId) => [...state.threads.values()].some((thread) => thread.conversationId === conversationId), gX: () => null, qU: (route) => `${route.conversationId}:${route.browserTabId}`,
  oXe: ({ windowState, conversationId, browserTabId }) => windowState.threads.get(`${conversationId}:${browserTabId}`) ?? null,
  vX: () => ({}), tq: () => undefined, KU: (...values) => values.join(":"),
  logger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  l: { BrowserWindow: {
    fromWebContents: () => window,
    fromId: (id) => windows.get(id)?.window ?? null,
    getFocusedWindow: () => focusedWindow,
    getAllWindows: () => [...windows.values()].map((state) => state.window),
  } },
}))(host);
const window = { id: 1, webContents: { isDestroyed: () => false }, on: () => undefined, removeListener: () => undefined, isDestroyed: () => false, getContentBounds: () => ({}) };
const owner = { id: 42, isDestroyed: () => false };
const state = controller.ensureWindowState(window, owner);
host.ensureWindowState = controller.ensureWindowState.bind(controller);
host.getLiveWindowState = controller.getLiveWindowState.bind(controller);
host.getFocusedWindowState = controller.getFocusedWindowState.bind(controller);
equal(state.owner, owner);
equal(controller.getLiveWindowState(1), state);
equal(controller.getCurrentWindowState(owner), state);
equal(controller.getThreadStateForWindow(state, "conversation", "tab"), null);
equal(controller.getDetachedWindowStates(1), []);
state.threads.set("conversation:tab", { conversationId: "conversation", browserTabId: "tab", browserStorageId: "storage", isBrowserUseActive: false, snapshot: { isAnnotationSuspended: false } });
const detachedWindow = { id: 2, webContents: { isDestroyed: () => false }, on: () => undefined, removeListener: () => undefined, isDestroyed: () => false, getContentBounds: () => ({}) };
const detachedOwner = { id: 43, isDestroyed: () => false };
const detached = controller.ensureWindowState(detachedWindow, detachedOwner);
detached.tabSourceWindow = state;
detached.threads.set("conversation:detached", { conversationId: "conversation", browserTabId: "detached" });
equal(controller.getDetachedWindowStates(1), [detached]);
equal(controller.getPageWindowState({ conversationId: "conversation", windowId: 1 }, "detached"), detached);
equal(controller.getPageWindowState({ conversationId: "conversation", windowId: 1 }, null), state);
focusedWindow = detachedWindow;
equal(controller.getFocusedWindowState(), detached);
equal(controller.getFocusedOwnerWebContents(), detachedWindow.webContents);
equal(controller.getPreferredWindowStateForConversation("conversation"), state, "detached preference resolves to source window");
focusedWindow = null;
host.lastSyncedWindowId = 1;
equal(controller.getFocusedOwnerWebContents(), owner);
controller.closePage(owner, "conversation", "tab", "other-storage");
equal(calls[0][0], "delete");

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
for (const oldOwner of ["function AX(", "function vXe(", "function yXe(", "function bXe(", "function xXe(", "function SXe("]) {
  equal(main.includes(oldOwner), false);
}
console.log(`main browser window thread state controller tests passed (${assertions} assertions)`);
