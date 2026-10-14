import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-page-materialization-controller.ts")],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createBrowserPageMaterializationControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`,
);

const calls = [];
const lifecycle = {
  updateThreadSessionState: (thread) => calls.push(["lifecycle", thread.sessionState]),
  isBrowserUseManagedBrowserTab: () => true,
};
const host = {
  browserPageHostLifecycle: lifecycle,
  browserSessionRegistry: { recordPageCreated: (event) => calls.push(["created", event]) },
  syncThreadState: (...args) => calls.push(["thread", ...args]),
  syncRuntimeStateToPage: (...args) => calls.push(["runtime", ...args]),
  comments: { prepare: (...args) => calls.push(["comments", ...args]) },
};
const Controller = createBrowserPageMaterializationControllerClass({
  eW: ({ faviconUrl, title, url }) => ({ runtime: "electron-webview", faviconUrl, title, url }),
  KX: () => ({ dispose() {} }),
  oX: (value) => value,
  n: { lu: { WEB: "web" } },
});
const controller = new Controller(host);
const windowState = { window: { id: 7 }, owner: {} };
const thread = {
  browserStorageId: "storage",
  browserTabId: "tab",
  conversationId: "conversation",
  isAnnotationModeEnabled: true,
};

const fresh = controller.materializeThreadPageState(windowState, thread, {
  kind: "fresh",
  page: { title: "Example", url: "https://example.test" },
});
assert.equal(fresh.title, "Example");
assert.equal(fresh.pendingUrl, "https://example.test");
assert.equal(fresh.url, "");
assert.equal(thread.page, fresh);
assert.equal(calls.filter(([kind]) => kind === "created").length, 1);

const snapshot = {
  title: "Restored",
  url: "https://restored.test",
  faviconUrl: "favicon",
  navigation: { currentIndex: 1, entries: [{ url: "https://a.test" }, { url: "https://restored.test" }] },
};
const cold = controller.materializeThreadPageState(windowState, thread, { kind: "cold-restore", snapshot });
assert.equal(cold.isColdRestore, true);
assert.equal(cold.isSuspended, true);
assert.equal(cold.canGoBack, true);
assert.equal(cold.canGoForward, false);
assert.equal(cold.serializedPageState, snapshot);
assert.equal(calls.filter(([kind]) => kind === "comments").length, 2);

console.log(`main browser page materialization controller tests passed`);
