import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-host-policy-controller.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserHostPolicyControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const calls = [];
const windowState = { id: 7, window: { id: 7 }, browserSettingsWebviewMountIds: new Set(), threads: new Map() };
const owner = { id: 11 };
const currentWindow = { id: 7 };
const host = {
  onBrowserStateChanged: null,
  siteBootstrapController: new AbortController(),
  inAppBrowserFeatureEnabled: true,
  browserSessionService: { configure: () => ({ clear: true }) },
  reportedBrowserAdmissionDenials: new Set(),
  errorReporter: { reportNonFatal: (...args) => calls.push(["report", ...args]) },
  logger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  getCommandKeymapState: () => ({ key: "value" }),
  ownerCommandAccelerators: null,
  ensureCurrentWindowState: () => windowState,
  getCurrentWindowState: () => windowState,
  getCurrentWindow: () => currentWindow,
  browserSessionRegistry: {
    getBrowserRouteForSession: () => ({ windowId: 7, conversationId: "c1" }),
  },
  browserUseOpenRequests: {},
  browserPageSnapshots: { getDebugMetadata: () => ({ pages: 1 }) },
  windows: new Map([[7, windowState]]),
  getLiveWindowState: () => windowState,
  windowManager: {},
  syncThreadState: (...args) => calls.push(["sync", ...args]),
  browserUseNavigationRestriction: {
    activate: (...args) => calls.push(["activate", ...args]),
    assertAllowed: (...args) => calls.push(["assert", ...args]),
  },
  browserPersistence: {
    getPageRestoreResults: (...args) => ["restore", ...args],
    deleteConversation: (...args) => ["delete", ...args],
    isPersistenceOwner: (state) => state?.id === 7,
  },
};
const deps = {
  DXe: (value) => ({ kind: "debug", value }),
  OXe: (value) => ({ kind: "feedback", value }),
  kXe: (value) => ({ kind: "open-debug", value }),
  mq: (value) => ({ ...value, refreshed: true }),
  VG: (state, theme) => { state.theme = theme; },
  Yc: (...args) => calls.push(["clear-auth", ...args]),
  Xc: async (...args) => calls.push(["flush-auth", ...args]),
  DZ: "unavailable",
  hX: (state, conversationId, browserTabId) => state.threads.get(`${conversationId}:${browserTabId}`),
};
const Controller = createBrowserHostPolicyControllerClass(deps);
const controller = new Controller(host);

controller.setOnBrowserStateChanged("listener");
assert.equal(host.onBrowserStateChanged, "listener");
controller.browserSettingsWebviewMounted(owner, "mount-1", "dark");
assert.equal(windowState.theme, "dark");
assert.deepEqual([...windowState.browserSettingsWebviewMountIds], ["mount-1"]);
controller.browserSettingsWebviewUnmounted(owner, "mount-1");
assert.equal(windowState.browserSettingsWebviewMountIds.size, 0);

host.inAppBrowserFeatureEnabled = false;
assert.equal(controller.admitBrowserTab("test"), false);
assert.equal(controller.admitBrowserTab("test"), false);
assert.equal(calls.filter(([kind]) => kind === "report").length, 1);
await controller.setInAppBrowserFeatureEnabled(true, true);
assert.equal(host.inAppBrowserFeatureEnabled, true);
assert.equal(controller.getBrowserSession().clear, true);

controller.refreshOwnerCommandAccelerators();
assert.equal(host.ownerCommandAccelerators.refreshed, true);
assert.equal(controller.isPrimaryWindowPersistenceOwner(owner), true);
assert.equal(controller.getBrowserPageRestoreResults(owner, ["x"])[0], "restore");
assert.equal(controller.deletePersistedBrowserConversation(owner, "c1")[0], "delete");

const thread = { conversationId: "c1", page: { webMcpParentCallIds: new Set(["p1"]), lastWebMcpToolCall: {} } };
windowState.threads.set("c1:tab-1", thread);
thread.browserTabId = "tab-1";
controller.onMcpToolCallCompleted("session", "p1");
assert.equal(thread.page.lastWebMcpToolCall, null);
assert.equal(calls.some(([kind]) => kind === "sync"), true);

controller.activateBrowserUseNavigationRestriction("route");
controller.assertBrowserUseNavigationAllowed("page", "https://example.com");
assert.equal(calls.some(([kind]) => kind === "activate"), true);
assert.equal(calls.some(([kind]) => kind === "assert"), true);
assert.equal(controller.getDebugSnapshot().kind, "debug");
assert.equal(controller.getFeedbackDiagnostics().kind, "feedback");
assert.equal(controller.openDebugTabOwner({ id: "debug" }).kind, "open-debug");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-host-policy-controller.js")'), true);

console.log("host policy controller assertions: 18");
