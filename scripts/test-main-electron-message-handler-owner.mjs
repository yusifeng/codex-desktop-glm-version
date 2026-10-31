import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [join(root, "src/main/main-app/window/electron-message-handler.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createElectronMessageHandlerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class DynamicResponses {
  constructor() { this.values = new Map(); this.disposed = false; }
  wait(id) { return this.values.get(id) ?? null; }
  discard(id) { this.values.delete(id); }
  cancel(id) { this.values.set(id, "canceled"); }
  dispose() { this.disposed = true; }
}
class ProjectFolderPicker {
  constructor(...args) { this.args = args; }
  createOrSelectProject(value) { return { selected: value }; }
}
class BrowserSessionRegistry { constructor(...args) { this.args = args; } }
class BrowserAutocompleteCoordinator { constructor(...args) { this.args = args; } }
class BrowserHostManager {
  constructor(...args) { this.args = args; this.enabled = null; }
  setInAppBrowserFeatureEnabled(value) { this.enabled = value; }
  refreshSiteAnnotationFeatures() { this.refreshed = true; }
  setOnBrowserStateChanged(callback) { this.stateCallback = callback; }
  getBrowserSession() { return null; }
  getCurrentPageWebContents() { return null; }
  isPrimaryWindowPersistenceOwner() { return true; }
  deletePersistedBrowserConversation() { return true; }
}
class SamplerController {
  constructor(options) { this.options = options; this.disposed = false; }
  startPerformanceSpanCpuSampling(...args) { this.started = args; }
  cancelPerformanceSpanCpuSampling(...args) { this.canceled = args; }
  finishPerformanceSpanCpuSampling(...args) { return args; }
  dispose() { this.disposed = true; }
}
class PerformanceTriggerGate { constructor(options) { this.options = options; } }
class MainThreadJankSampler { constructor(options) { this.options = options; } }
class WorktreeService {
  constructor(options) { this.options = options; this.disposed = false; }
  dispose() { this.disposed = true; }
  getPendingWorktrees() { return []; }
}
class RequestRegistry { constructor(options) { this.options = options; } }

const powerMonitor = new EventEmitter();
powerMonitor.isOnBatteryPower = () => false;
const powerSaveEvents = [];
let blockerId = 0;
const focusedWindow = { id: 1, isFocused: () => true };
const electron = {
  app: {
    isPackaged: false,
    getPath: (name) => `/tmp/${name}`,
  },
  BrowserWindow: {
    fromWebContents: () => focusedWindow,
    getAllWindows: () => [focusedWindow],
    getFocusedWindow: () => focusedWindow,
  },
  powerMonitor,
  powerSaveBlocker: {
    start: (type) => { powerSaveEvents.push(["start", type]); return ++blockerId; },
    stop: (id) => powerSaveEvents.push(["stop", id]),
  },
  shell: { openPath: async () => "" },
};
const shared = {
  Ba: {
    disabledSiteAnnotationHostnames: { key: "disabled-sites" },
    downloadDirectory: { key: "download-directory" },
    promptForDownloadLocation: { key: "prompt-download" },
  },
  Ia: { primaryNumberShortcutTarget: { key: "primary-shortcut" } },
  Ct: () => ({ bindings: [] }),
  Sc: RequestRegistry,
  zi: () => false,
  Es: () => false,
  u: async () => [],
};
const logs = [];
const createLogger = (tag) => ({
  debug: (...args) => logs.push([tag, "debug", ...args]),
  error: (...args) => logs.push([tag, "error", ...args]),
  info: (...args) => logs.push([tag, "info", ...args]),
  log: (...args) => logs.push([tag, "log", ...args]),
  warning: (...args) => logs.push([tag, "warning", ...args]),
});
const persistedBroadcasts = [];
const remoteControlStates = [];
const dependencies = {
  GBe: () => false,
  GD: () => null,
  IH: async () => {},
  KBe: async () => {},
  LUe: () => {},
  Lr: () => {},
  MainThreadJankSampler,
  Mze: () => {},
  OZ: (options) => options,
  Vt: (id) => `view:${id}`,
  XQe: WorktreeService,
  ZBe: () => ({}),
  applySparseStateWrite: (_oldValue, value) => value,
  broadcastPersistedAtomUpdate: (...args) => persistedBroadcasts.push(args),
  combinePerformanceSpanSnapshots: () => ({}),
  deletePersistedBrowserConversation: () => true,
  forwardBrowserNavigationUrl: () => null,
  lWe: () => {},
  performanceHeartbeatIntervalMs: 500,
  performanceRequestTtlMs: 1_000,
  performanceTriggerMinIntervalMs: 100,
  readHostWorktreeSettings: () => ({}),
  rZe: () => null,
  rt: (id) => `route:${id}`,
  setRemoteControlEnabled: (value) => remoteControlStates.push(["enabled", value]),
  setRemoteControlSessionActive: (value) => remoteControlStates.push(["active", value]),
  summarizeWindowAttention: () => ({}),
  tee: (id) => `tabs:${id}`,
  toggleTraceRecording: async () => {},
  uEe: { send: () => ({ type: "response", response: {} }) },
};
const ElectronMessageHandler = createElectronMessageHandlerClass({
  shared,
  bootstrap: { on: "app-session", At: "ipc-message" },
  electron,
  crypto: { randomUUID: () => "request-uuid" },
  path,
  fsPromises: fs.promises,
  perfHooks: { performance },
  deepEqual: { default: (left, right) => JSON.stringify(left) === JSON.stringify(right) },
  createLogger,
  DynamicAppToolResponses: DynamicResponses,
  ProjectFolderPicker,
  BrowserSessionRegistry,
  BrowserAutocompleteCoordinator,
  BrowserHostManager,
  MessageReply: class {},
  SamplerController,
  PerformanceTriggerGate,
  featureFlags: () => ({ browserExtensions: false, unifiedTabStrip: false }),
  dependencies,
});

const webContents = new EventEmitter();
webContents.id = 11;
webContents.isDestroyed = () => false;
const primaryWindow = { id: 1, webContents, isDestroyed: () => false };
const sent = [];
const windowMessages = [];
const windowManager = {
  getPrimaryWindow: () => primaryWindow,
  getPrimaryWindows: () => [primaryWindow],
  sendMessageToWebContents: (...args) => windowMessages.push(args),
  sendMessageToAllWindows: (message) => windowMessages.push(["all", message]),
  sendMessageToWindow: (...args) => windowMessages.push(args),
  setSystemFocusSuppressed: (value) => windowMessages.push(["focus-suppressed", value]),
  shouldSyncPersistedAtom: () => true,
};
const chunkedMessageSender = {
  sendInlineMessageForView: (...args) => sent.push(["inline", ...args]),
  sendCritical: (...args) => sent.push(["critical", ...args]),
};
let sharedSubscriber;
const sharedObjectWrites = [];
const sharedObjectRepository = {
  addSubscriber: (callback) => { sharedSubscriber = callback; },
  get: (key) => key === "is_default_browser",
  set: (...args) => sharedObjectWrites.push(args),
};
const globalValues = new Map();
const globalState = {
  get: (key) => globalValues.get(key),
  set: (key, value) => globalValues.set(key, value),
};
const appServerConnection = { getStdioIoStatsSnapshot: () => ({}) };
const appServerConnectionRegistry = { getConnection: () => appServerConnection };
let settingsListener;
let settingsUnsubscribed = false;
const settingsStore = {
  getEffective: () => undefined,
  onDidChange: (_key, callback) => {
    settingsListener = callback;
    return () => { settingsUnsubscribed = true; };
  },
};
const projectsManager = {
  assignUnassignedThreadsBeforeProjectRootsChange: async () => {},
  createProjectForRoots: async () => {},
};
const handler = new ElectronMessageHandler(
  "host-a",
  { type: "local" },
  {},
  windowManager,
  chunkedMessageSender,
  {},
  appServerConnectionRegistry,
  async () => {},
  globalState,
  projectsManager,
  sharedObjectRepository,
  async () => {},
  {},
  { reportNonFatal() {} },
  {},
  () => {},
  null,
  {},
  "info",
  "dev",
  () => () => {},
  {},
  () => ({ type: "local" }),
  () => false,
  settingsStore,
  () => [],
  () => {},
);

equal(handler.hostId, "host-a");
equal(handler.browserSessionRegistry instanceof BrowserSessionRegistry, true);
equal(handler.browserHostManager instanceof BrowserHostManager, true);
equal(handler.browserHostManager.enabled, false);
equal(handler.projectFolderPicker instanceof ProjectFolderPicker, true);
equal(handler.samplerManager instanceof SamplerController, true);
equal(handler.worktreeServicesByHostId.size, 1);
equal(powerMonitor.listenerCount("suspend"), 1);
equal(typeof sharedSubscriber, "function");

handler.sendMessageToView(webContents, { type: "hello" });
equal(sent.at(-1), ["inline", webContents, { type: "hello" }]);
equal(handler.isDefaultBrowser(), true);
equal(handler.createOrSelectProject("/workspace"), { selected: "/workspace" });
handler.startPerformanceSpanCpuSampling("span", 1);
equal(handler.samplerManager.started, ["span", 1]);
equal(handler.finishPerformanceSpanCpuSampling("span"), ["span"]);

equal(handler.sanitizeDefaultProjectName("  Demo Project. "), "Demo Project");
equal(handler.sanitizeDefaultProjectName("CON"), "_CON");
equal(handler.sanitizeDefaultProjectName("<>"), "__");

const dynamicResult = handler.requestDynamicToolsForThreadStart({ flag: true }, true, "new-thread");
equal(windowMessages.at(-1)[1].type, "dynamic-tools-for-thread-start-requested");
equal(windowMessages.at(-1)[1].requestId, "request-uuid");
handler.handleDynamicToolsForThreadStartResponse(webContents, {
  requestId: "request-uuid",
  dynamicTools: [{ name: "tool" }],
  hostedAutomationsAvailable: true,
});
equal(await dynamicResult, [{ name: "tool" }]);
equal(handler.pendingDynamicToolsForThreadStartRequests.size, 0);

handler.updatePowerSaveBlocker(webContents, true, false, false);
equal(powerSaveEvents.at(-1), ["start", "prevent-app-suspension"]);
handler.updatePowerSaveBlocker(webContents, false, false, true);
equal(powerSaveEvents.some(([kind]) => kind === "stop"), true);
equal(powerSaveEvents.at(-1), ["start", "prevent-display-sleep"]);
webContents.emit("destroyed");
equal(handler.powerSaveTrackedWebContentsIds.size, 0);

handler.setSystemFocusState("suspended", true, 123);
equal(windowMessages.some(([target, message]) => target === "all" && message.occurredAtMs === 123), true);
handler.setSystemFocusState("suspended", false);
equal(windowMessages.some(([target, value]) => target === "focus-suppressed" && value === false), true);

settingsListener();
equal(handler.browserHostManager.refreshed, true);
const worktreeService = handler.getWorktreeService();
handler.dispose();
equal(settingsUnsubscribed, true);
equal(handler.dynamicAppToolResponses.disposed, true);
equal(handler.samplerManager.disposed, true);
equal(worktreeService.disposed, true);
equal(handler.worktreeServicesByHostId.size, 0);
equal(powerMonitor.listenerCount("suspend"), 0);

const members = Object.getOwnPropertyNames(ElectronMessageHandler.prototype).sort();
equal(members.length, 56);
for (const member of [
  "handleMessage",
  "sendAppServerResponseToView",
  "requestDynamicToolsForThreadStart",
  "updatePersistedAtomState",
  "setPrimaryWindowMode",
  "initializeDefaultWorkspace",
  "updatePowerSaveBlocker",
  "dispose",
]) equal(members.includes(member), true);

const main = fs.readFileSync(join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/window/electron-message-handler.js")'), true);
equal(main.includes("var r$e = createElectronMessageHandlerClass({"), true);
equal(main.includes("r$e = class"), false);
equal(main.includes("new r$e("), false);
const windowContext = fs.readFileSync(join(root, "src/main/main-app/window/window-context.ts"), "utf8");
equal(windowContext.includes("this.messageHandler = new r$e("), true);

console.log(`${assertions} main Electron message handler owner assertions passed`);
