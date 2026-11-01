import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = await build({
  entryPoints: [
    path.join(
      root,
      "src/main/main-app/browser-sidebar/browser-webview-listener-runtime.ts",
    ),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { WEB_MCP_LIMITS, createBrowserWebviewListenerRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

equal(WEB_MCP_LIMITS, {
  maxTools: 100,
  maxTotalDescriptorBytes: 65_536,
  maxRegistrationChanges: 10,
});

const calls = [];
let browserSettingsDefinition = null;
let pendingBrowserSettings = null;
let pendingRoute = null;
let isCheckoutParams = false;
let isWorkspaceSettingsParams = false;
let cursor = { x: 25, y: 35 };
const installBrowserWebviewListeners = createBrowserWebviewListenerRuntime({
  adoptionLeaseAttribute: "data-adoption-lease",
  attachPendingAdoptedWebview: (options) =>
    calls.push(["attach-adopted", options]),
  basePartition: () => null,
  bindBrowserSettingsWebview: (options) =>
    calls.push(["bind-settings", options]),
  configureBrowserPageWebviewPreferences: (options) =>
    calls.push(["configure-page", options]),
  configureBrowserSettingsWebviewPreferences: (options) =>
    calls.push(["configure-settings", options]),
  createLogger: (name) => () => ({
    info: (message, fields) => calls.push(["info", name, message, fields]),
    warning: (message, fields) =>
      calls.push(["warning", name, message, fields]),
  }),
  effectivePageUrl: (page) => page.url,
  findBrowserSettingsWebviewDefinition: () => browserSettingsDefinition,
  getAdoptedWebContentsId: () => null,
  getDesktopFeatureAvailability: () => ({
    webMcp: true,
    webMcpMaxTools: 17,
  }),
  getWebviewInstanceId: (params) => params.instanceId ?? null,
  hasWebviewAdoptionLease: () => false,
  hostIdentityFromWebviewParams: (params) => params.hostIdentity ?? null,
  isBrowserRoutePartition: () => false,
  isCheckoutAttachParams: () => isCheckoutParams,
  isCheckoutWebContents: () => false,
  isFirstPartyAuthenticatedPartition: () => false,
  isFirstPartyAuthenticatedSession: () => false,
  isLocalUrl: (url) => url.startsWith("http://localhost"),
  isTrustedSession: () => false,
  isWebMcpEnabled: (_environment, enabled) => enabled,
  isWorkspaceSettingsAttachParams: () => isWorkspaceSettingsParams,
  isWorkspaceSettingsWebContents: () => false,
  makeBrowserStorageId: (route) => `storage:${route.conversationId}:${route.browserTabId}`,
  pageRestoreAttribute: "data-browser-sidebar-page-restore",
  resolveSynchronousAnnotationPolicy: (...args) =>
    calls.push(["annotation-policy", ...args]),
  routeFromWebviewParams: (params) => params.route ?? null,
  routeKey: (route) => `${route.conversationId}:${route.browserTabId}`,
  screen: { getCursorScreenPoint: () => cursor },
  takePendingBrowserSettingsWebview: () => pendingBrowserSettings,
  takePendingWebviewRoute: () => pendingRoute,
  threadBrowserTabKey: (value) => `hashed:${value}`,
  webMcpLimits: WEB_MCP_LIMITS,
});

const owner = new EventEmitter();
owner.id = 42;
const pageWebContents = new EventEmitter();
pageWebContents.id = 88;
pageWebContents.session = {};
pageWebContents.isDestroyed = () => false;
pageWebContents.sendInputEvent = (input) => calls.push(["input", input]);
const route = { conversationId: "conversation", browserTabId: "tab" };
const thread = {
  conversationId: route.conversationId,
  browserTabId: route.browserTabId,
  browserStorageId: "storage:conversation:tab",
  hostGeneration: 3,
  pendingTeardown: null,
  snapshot: {
    title: "Title",
    url: "http://localhost/page",
    interactionMode: "browse",
  },
  visible: true,
  presented: true,
  bounds: { x: 10, y: 20, width: 100, height: 80 },
  page: { view: { webContents: pageWebContents } },
};
const settingsDisposers = [
  () => calls.push(["dispose-settings"]),
];
const state = {
  pendingWindowTransfer: null,
  pendingAdoptedWebviewsByWebContentsId: new Map(),
  threads: new Map([["conversation:tab", thread]]),
  rendererInstanceId: "renderer",
  browserSettingsWebviewMountIds: new Set(),
  pendingBrowserSettingsWebviewsByInstanceId: new Map(),
  registeredWebviewHostsByRoutePartition: new Map(),
  pendingWebviewRoutesByInstanceId: new Map(),
  browserSettingsWebviewNavigationDisposersByWebContentsId: new Map([
    [1, settingsDisposers[0]],
  ]),
  activeConversationId: route.conversationId,
  activeBrowserTabId: route.browserTabId,
  window: {
    getContentBounds: () => ({ x: 0, y: 0, width: 800, height: 600 }),
  },
};
let admitCount = 0;
let cancelCount = 0;
const dispose = installBrowserWebviewListeners({
  admitBrowserTab: () => {
    admitCount += 1;
    return true;
  },
  cancelPendingWebviewAttaches: () => {
    cancelCount += 1;
  },
  reconcileBrowserStorageId: () => true,
  attachWebview: (...args) => calls.push(["attach", ...args]),
  attachedWebviewHosts: new Map(),
  configureBrowserSession: () => ({ id: "session" }),
  getAnnotationApiPolicy: () => ({ enabled: true }),
  subscribeAnnotationApiAvailability: () => () => undefined,
  ensureThreadStateForWindow: () => thread,
  handleWebviewDestroyedBeforeAttach: (value) =>
    calls.push(["destroyed-before-attach", value]),
  isPagePersistenceAllowed: () => true,
  openBrowserSettingsUrlInTab: (url) => calls.push(["open-settings", url]),
  owner,
  prepareWebviewAttach: () => ({
    view: { webContents: null },
    pendingUrl: "",
    url: "http://localhost/page",
  }),
  preloadPath: "/browser-page-preload.js",
  recordDebugEvent: (event) => calls.push(["debug", event]),
  state,
  windowId: 7,
});

for (const event of [
  "current-render-view-deleted",
  "destroyed",
  "did-navigate",
  "render-process-gone",
  "will-attach-webview",
  "did-attach-webview",
  "before-input-event",
])
  equal(owner.listenerCount(event), 1, `${event} listener registered`);

const preventions = [];
const transferWebContents = {};
state.pendingWindowTransfer = { token: "expected", webContents: transferWebContents };
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("transfer") },
  {},
  {},
  { token: "wrong", webContents: transferWebContents },
);
equal(preventions, ["transfer"]);
state.pendingWindowTransfer = null;

isCheckoutParams = true;
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("checkout") },
  {},
  {},
  null,
);
equal(preventions.includes("checkout"), false);
equal(admitCount, 0, "checkout attach bypasses Browser sidebar admission");
isCheckoutParams = false;
isWorkspaceSettingsParams = true;
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("workspace") },
  {},
  {},
  null,
);
equal(preventions.includes("workspace"), false);
equal(admitCount, 0, "workspace settings attach bypasses Browser sidebar admission");
isWorkspaceSettingsParams = false;

browserSettingsDefinition = { partition: "settings" };
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("settings-no-mount") },
  {},
  { instanceId: "settings-instance" },
  null,
);
equal(preventions.includes("settings-no-mount"), true);
state.browserSettingsWebviewMountIds.add("mount");
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("settings-mounted") },
  {},
  { instanceId: "settings-instance" },
  null,
);
equal(
  state.pendingBrowserSettingsWebviewsByInstanceId.get("settings-instance"),
  browserSettingsDefinition,
);
equal(calls.some(([kind]) => kind === "configure-settings"), true);
browserSettingsDefinition = null;

const preferences = {};
owner.emit(
  "will-attach-webview",
  { preventDefault: () => preventions.push("regular"), defaultPrevented: false },
  preferences,
  {
    instanceId: "page-instance",
    route,
    hostIdentity: { hostGeneration: 3, rendererInstanceId: "renderer" },
    src: "initial",
  },
  null,
);
equal(preventions.includes("regular"), false);
equal(admitCount, 1);
equal(preferences.backgroundThrottling, false);
equal(
  state.pendingWebviewRoutesByInstanceId.get("page-instance"),
  {
    hostGeneration: 3,
    initialNavigationOwner: "app",
    rendererInstanceId: "renderer",
    route,
  },
);
equal(calls.some(([kind]) => kind === "configure-page"), true);
equal(
  calls.some(
    ([kind, event]) =>
      kind === "debug" && event.kind === "browser-webview-attach-route-queued",
  ),
  true,
);

const attached = new EventEmitter();
attached.id = 99;
attached.session = {};
attached.isDestroyed = () => false;
pendingRoute = { route, hostGeneration: 3 };
owner.emit("did-attach-webview", {}, attached);
equal(
  calls.some(([kind, webContents]) => kind === "attach" && webContents === attached),
  true,
);
equal(attached.listenerCount("ipc-message-sync"), 1);
const webMcpEvent = {};
attached.emit(
  "ipc-message-sync",
  webMcpEvent,
  "codex_desktop:get-browser-webmcp-policy",
);
equal(webMcpEvent.returnValue, {
  enabled: true,
  limits: { maxTools: 17, maxTotalDescriptorBytes: 65_536 },
});
const annotationEvent = {};
attached.emit(
  "ipc-message-sync",
  annotationEvent,
  "codex_desktop:get-browser-annotation-api-policy",
);
equal(calls.some(([kind]) => kind === "annotation-policy"), true);

owner.emit("before-input-event", {}, {
  type: "keyDown",
  key: "Alt",
  isAutoRepeat: false,
  alt: true,
});
owner.emit("before-input-event", {}, {
  type: "keyUp",
  key: "Alt",
  isAutoRepeat: false,
  alt: false,
});
equal(
  calls.filter(([kind]) => kind === "input").map(([, input]) => input),
  [
    { type: "keyDown", keyCode: "Alt", modifiers: ["alt"] },
    { type: "keyUp", keyCode: "Alt", modifiers: [] },
  ],
);
cursor = { x: 500, y: 500 };
owner.emit("before-input-event", {}, {
  type: "keyDown",
  key: "Alt",
  isAutoRepeat: false,
  alt: true,
});
equal(calls.filter(([kind]) => kind === "input").length, 2);

pendingBrowserSettings = { definition: true };
const settingsWebContents = new EventEmitter();
settingsWebContents.id = 100;
settingsWebContents.session = {};
settingsWebContents.isDestroyed = () => false;
owner.emit("did-attach-webview", {}, settingsWebContents);
equal(calls.some(([kind]) => kind === "bind-settings"), true);
equal(settingsWebContents.listenerCount("ipc-message-sync"), 0);

dispose();
equal(cancelCount, 1);
equal(state.pendingBrowserSettingsWebviewsByInstanceId.size, 0);
equal(calls.some(([kind]) => kind === "dispose-settings"), true);
for (const event of [
  "current-render-view-deleted",
  "destroyed",
  "did-navigate",
  "render-process-gone",
  "will-attach-webview",
  "did-attach-webview",
  "before-input-event",
])
  equal(owner.listenerCount(event), 0, `${event} listener removed`);

const main = fs.readFileSync(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
const controller = fs.readFileSync(
  path.join(
    root,
    "src/main/main-app/browser-sidebar/browser-window-thread-state-controller.ts",
  ),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-webview-listener-runtime.js")',
  ),
  true,
);
equal(main.includes("createBrowserWebviewListenerRuntime({"), true);
equal(main.includes("isCheckoutAttachParams: GW"), true);
equal(main.includes("isWorkspaceSettingsAttachParams: TG"), true);
equal(
  main.includes("WEB_MCP_LIMITS.maxTotalDescriptorBytes"),
  true,
);
equal(main.includes("function SWe("), false);
equal(/^var FG =/m.test(main), false);
equal(/^\s*LG = new WeakSet/m.test(main), false);
equal(/\bpW\.maxTotalDescriptorBytes\b/.test(main), false);
equal(controller.includes("installBrowserWebviewListeners({"), true);
equal(controller.includes("SWe({"), false);

console.log(`${assertions} main browser webview listener runtime assertions passed`);
