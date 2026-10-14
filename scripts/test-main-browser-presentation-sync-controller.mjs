import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-presentation-sync-controller.ts")],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createBrowserPresentationSyncControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`,
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const calls = [];
const thread = {
  conversationId: "conversation",
  browserTabId: "tab",
  presented: true,
  visible: true,
  page: { view: { webContents: {} } },
  pendingTeardown: null,
};
const windowState = {
  window: { id: 10 },
  owner: "owner",
  activeConversationId: "conversation",
  activeBrowserTabId: "tab",
  threads: new Map([["conversation:tab", thread]]),
};
const host = {
  windows: new Map([[1, windowState]]),
  presentedBrowserTabIdsByOwner: new WeakMap(),
  browserSessionRegistry: { getBrowserRouteForSession: () => null },
  getCurrentWindowState: () => windowState,
  ensureCurrentWindowState: () => windowState,
  closeActiveExtensionActionMenu: () => calls.push("close-menu"),
  siteAnnotationPermissions: { cancel: () => calls.push("cancel") },
  browserPageHostLifecycle: { updateThreadSessionState: () => calls.push("session") },
  syncThreadState: () => calls.push("thread"),
  syncRuntimeStateToPage: () => calls.push("runtime"),
};
const Controller = createBrowserPresentationSyncControllerClass({
  hX: (state, conversationId, browserTabId) => state.threads.get(`${conversationId}:${browserTabId}`),
  sXe: () => false,
  qU: ({ conversationId, browserTabId }) => `${conversationId}:${browserTabId}`,
  DU: () => false,
  oX: (value) => value,
  KU: (...values) => values.join(":"),
});
const controller = new Controller(host);

controller.syncView({ id: 1 }, { conversationId: "conversation", browserTabId: "tab", presented: true, visible: true });
equal(calls, ["session", "thread", "runtime"]);
equal(controller.isBrowserPresentedForConversation({ id: 1 }, "conversation"), true);

console.log(`main browser presentation sync controller tests passed (${assertions} assertions)`);
