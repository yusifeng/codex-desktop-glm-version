import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const routerSource = fs.readFileSync(
  new URL("../src/main/main-app/app-shell/main-ipc-router.ts", import.meta.url),
  "utf8",
);
const routerOutput = await transform(routerSource, { loader: "ts", format: "cjs", target: "es2022" });
const routerModule = { exports: {} };
Function("module", "exports", routerOutput.code)(routerModule, routerModule.exports);
const { registerMainIpcRouter } = routerModule.exports;

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const settle = async () => {
  for (let index = 0; index < 4; index += 1) await new Promise((resolve) => setImmediate(resolve));
};

function createHarness(options = {}) {
  const handled = new Map();
  const listened = new Map();
  const calls = [];
  const warnings = [];
  const primaryWindow = {
    webContents: "primary-contents",
    minimized: options.minimized ?? true,
    isMinimized() { return this.minimized; },
    restore() { this.minimized = false; calls.push("restore-window"); },
    show() { calls.push("show-window"); },
    focus() { calls.push("focus-window"); },
    isVisible: () => options.visible ?? false,
    isFocused: () => options.focused ?? false,
  };
  const browserHostManager = {
    getPreferredWindowStateForConversation: () => options.preferredWindow
      ? { window: primaryWindow }
      : null,
    handlePageEvent: (sender, payload) => calls.push(["page-event", sender, payload]),
  };
  const context = {
    getBrowserHostManager: () => browserHostManager,
    handleMessage: async (sender, message) => calls.push(["context-message", sender, message]),
    createAppHost: (sender) => ({ sender }),
    registerAppView: async (sender, remoteMain) => {
      calls.push(["app-view", sender, remoteMain]);
      if (options.appViewError != null) throw options.appViewError;
    },
  };
  let currentContext = options.noContext ? null : context;
  let currentPrimary = options.noPrimary ? null : primaryWindow;
  const trayController = { handleMessage: async (message) => calls.push(["tray", message]) };
  const dockController = { handleMessage: async (message) => calls.push(["dock", message]) };
  let prewarmAttempts = 0;
  registerMainIpcRouter({
    app: { quit: () => calls.push("quit") },
    ipcMain: {
      handle: (channel, handler) => handled.set(channel, handler),
      on: (channel, handler) => listened.set(channel, handler),
    },
    BrowserWindow: { fromWebContents: (sender) => sender.ownerWindow ?? null },
    channels: {
      mainMessage: "main",
      browserSidebarMessage: "sidebar",
      browserPageEvent: "page",
      codexHomeRequest: "home",
      sentryTest: "sentry",
      appViewPort: "app-view",
    },
    logger: { n: () => ({ warning: (...args) => warnings.push(args) }) },
    loadInternalRuntime: () => { calls.push("load-runtime"); return Promise.resolve(options.internalRuntime ?? {}); },
    isInternalBuild: () => options.internalBuild ?? true,
    assertPrimaryRuntimeAvailable: (available) => calls.push(["assert-runtime", available]),
    setInternalUpdateCdn: async (_state, enabled) => calls.push(["internal-cdn", enabled]),
    setWindowsRuntimeFrameworks: async (_state, frameworks) => calls.push(["frameworks", frameworks]),
    registerContextMenu: () => calls.push("register-context-menu"),
    getDesktopFeatureAvailability: () => ({ browserPane: options.browserPane ?? true }),
    isSafeRoute: (route) => !route.startsWith("unsafe"),
    parseBrowserSidebarMessage: (payload) => payload.valid
      ? { success: true, data: payload.data }
      : { success: false },
    isBrowserPageEvent: (payload) => payload.valid === true,
    guardedBrowserPageEventTypes: new Set(["guarded"]),
    resolveCodexHomeRequest: async (params) => ({ home: params }),
    createMessagePortRemoteMain: (port, host) => ({ port, host }),
    isTrayMenuThreadsChangedMessage: (message) => message.type === "tray-menu-threads-changed",
    relaunchApp: (request) => calls.push(["relaunch", request]),
    desktopSentry: { captureException: (error, captureOptions) => calls.push(["sentry", error.message, captureOptions]) },
    hotkeyWindowLifecycleManager: { hide: () => calls.push("hide-hotkey") },
    globalDictationLifecycleManager: {
      handleMessage: async (_event, message) => {
        calls.push(["dictation", message.type]);
        return message.handledByDictation === true;
      },
    },
    globalState: {},
    productionAppcastStateStore: { setBackendAppcastEnabled: (enabled) => calls.push(["appcast", enabled]) },
    getContextForWebContents: () => currentContext,
    getPrimaryWindow: () => currentPrimary,
    showPrimaryWindow: (showOptions) => calls.push(["show-primary", showOptions]),
    sendMessageToWindow: (window, message) => calls.push(["send-window", window, message]),
    ensureWindow: async () => { calls.push("ensure-window"); return options.ensureNull ? null : primaryWindow; },
    createFreshWindow: async (route) => { calls.push(["fresh-window", route]); return options.freshNull ? null : primaryWindow; },
    setDesktopFeatureAvailability: (features, reasons) => calls.push(["features", features, reasons]),
    setAvatarOverlayFeedbackDiagnosticsEnabled: (enabled) => calls.push(["feedback-diagnostics", enabled]),
    latchInAppUpdatesEnabledForLaunch: (enabled) => calls.push(["in-app-updates", enabled]),
    setAutomaticBackgroundDownloadsEnabled: (enabled) => calls.push(["background-downloads", enabled]),
    restoreAvatarOverlayOpenState: async (sender) => calls.push(["restore-avatar", sender]),
    prewarmAvatarOverlay: async (sender) => {
      prewarmAttempts += 1;
      calls.push(["prewarm-avatar", sender, prewarmAttempts]);
      if (options.failFirstPrewarm && prewarmAttempts === 1) throw new Error("retry");
      if (options.failAllPrewarm) throw new Error("prewarm failed");
    },
    reloadBundledPlugins: async () => calls.push("reload-plugins"),
    setMacMenuBarEnabled: async (enabled) => calls.push(["menu-bar", enabled]),
    navigateToRoute: (window, route, state) => calls.push(["navigate", window, route, state]),
    setRemoteHostedPIPActiveThreadID: (sender, id) => calls.push(["pip-thread", sender, id]),
    setRemoteHostedPIPHostLayout: (sender, layout) => calls.push(["pip-layout", sender, layout]),
    getDockMenuController: () => dockController,
    getTrayController: () => trayController,
    onAppEntrySource: (attribution, contents) => calls.push(["entry", attribution, contents]),
    isTrustedIpcEvent: (event) => event.trusted !== false,
    requestDevRelaunch: "dev-relaunch",
    quitState: { allowQuitTemporarily: () => calls.push("allow-quit") },
  });
  const sender = { ownerWindow: { webContents: "owner-contents" }, mainFrame: { processId: 1, routingId: 2 } };
  return {
    browserHostManager,
    calls,
    context,
    handled,
    listened,
    primaryWindow,
    sender,
    setContext: (value) => { currentContext = value; },
    setPrimary: (value) => { currentPrimary = value; },
    warnings,
  };
}

{
  const harness = createHarness({ failFirstPrewarm: true });
  equal(harness.calls.slice(0, 2), ["load-runtime", "register-context-menu"]);
  const event = { sender: harness.sender, trusted: false };
  await harness.handled.get("main")(event, { type: "reload-bundled-plugins" });
  equal(harness.calls.includes("reload-plugins"), false);
  await harness.handled.get("main")(
    { sender: harness.sender },
    { type: "electron-avatar-overlay-restore-ready", shouldPrewarmAvatarOverlay: true },
  );
  await harness.handled.get("main")(
    { sender: harness.sender },
    { type: "electron-avatar-overlay-restore-ready", shouldPrewarmAvatarOverlay: true },
  );
  equal(harness.calls.filter((call) => Array.isArray(call) && call[0] === "restore-avatar").length, 1);
  equal(harness.calls.filter((call) => Array.isArray(call) && call[0] === "prewarm-avatar").length, 2);
}

{
  const harness = createHarness();
  const main = harness.handled.get("main");
  await main({ sender: harness.sender }, { type: "remote-hosted-pip-active-thread-changed", conversationId: "thread" });
  await main({ sender: harness.sender }, { type: "remote-hosted-pip-host-layout-changed", layout: { x: 1 } });
  await main({ sender: harness.sender }, { type: "electron-avatar-overlay-feedback-diagnostics-changed", enabled: true });
  equal(harness.calls.slice(-3), [
    ["pip-thread", harness.sender, "thread"],
    ["pip-layout", harness.sender, { x: 1 }],
    ["feedback-diagnostics", true],
  ]);
}

{
  const harness = createHarness({ internalRuntime: null });
  await harness.handled.get("main")({ sender: harness.sender }, {
    type: "electron-sparkle-gates-changed",
    useWindowsCoreRuntimeFrameworks: true,
    useWindowsPrimaryRuntimeFrameworks: true,
    disableInAppUpdates: true,
    disableSparkleAutodownload: false,
    useBackendAppcast: true,
    useInternalUpdateCdn: true,
  });
  equal(harness.calls.slice(-6), [
    ["assert-runtime", true],
    ["in-app-updates", false],
    ["background-downloads", true],
    ["appcast", true],
    ["internal-cdn", true],
    ["frameworks", { core: true, primary: true }],
  ]);
}

{
  const harness = createHarness();
  await harness.handled.get("main")({ sender: harness.sender }, {
    type: "electron-desktop-features-changed",
    browserPane: true,
    visualizeTreatment: true,
    workLocalAccess: true,
    bundledPluginEligibilityReasons: ["reason"],
  });
  const featureCall = harness.calls.find((call) => Array.isArray(call) && call[0] === "features");
  equal(featureCall[1].browserPane, true);
  equal(featureCall[1].workLocalAccess, true);
  equal(featureCall[1].visualizeTreatment, false);
  equal(featureCall[2], ["reason"]);
}

{
  const harness = createHarness();
  const main = harness.handled.get("main");
  const trayMessage = { type: "tray-menu-threads-changed", trayMenuThreads: { recent: [] } };
  await main({ sender: harness.sender }, trayMessage);
  await main({ sender: harness.sender }, { type: "mac-menu-bar-enabled-changed", enabled: true });
  await main({ sender: harness.sender }, { type: "reload-bundled-plugins" });
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "tray" && call[1] === trayMessage), true);
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "dock"), true);
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "menu-bar"), true);
  equal(harness.calls.includes("reload-plugins"), true);
}

{
  const harness = createHarness({ preferredWindow: true });
  const main = harness.handled.get("main");
  await main({ sender: harness.sender }, {
    type: "open-browser-in-main-window",
    path: "/browser",
    browserPanel: { conversationId: "one", type: "panel" },
  });
  equal(harness.calls.slice(-6), [
    "hide-hotkey", "restore-window", "show-window", "focus-window",
    ["send-window", harness.primaryWindow, { conversationId: "one", type: "panel" }],
    ["navigate", harness.primaryWindow, "/browser", undefined],
  ]);
  const before = harness.calls.length;
  await main({ sender: harness.sender }, {
    type: "open-browser-in-main-window",
    path: "unsafe://route",
    browserPanel: { conversationId: "one" },
  });
  equal(harness.calls.length, before);
}

{
  const harness = createHarness({ noPrimary: true });
  const main = harness.handled.get("main");
  await main({ sender: harness.sender }, { type: "open-in-main-window", path: "/one", appEntryAttribution: { source: "x" } });
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "fresh-window"), true);
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "show-primary"), true);
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "entry"), true);
  await main({ sender: harness.sender }, { type: "open-current-main-window", stealFocus: true, focusComposer: true });
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "show-primary" && call[1].focusComposer), true);
  await main({ sender: harness.sender }, { type: "open-in-new-window", path: "/new" });
  await main({ sender: harness.sender }, { type: "show-settings", section: "general", state: { tab: 1 } });
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "navigate" && call[2] === "/settings/general"), true);
}

{
  const harness = createHarness();
  const main = harness.handled.get("main");
  await main({ sender: harness.sender }, { type: "quit-app", relaunch: true });
  await main({ sender: harness.sender }, { type: "quit-app", relaunch: false });
  equal(harness.calls.slice(-3), ["allow-quit", ["relaunch", "dev-relaunch"], "quit"]);
  await main({ sender: harness.sender }, { type: "dictation", handledByDictation: true });
  equal(harness.calls.at(-1), ["dictation", "dictation"]);
  harness.setContext(null);
  await main({ sender: harness.sender }, { type: "unknown" });
  equal(harness.warnings.at(-1)[0], "Message received for unknown window context");
  harness.setContext(harness.context);
  await main({ sender: harness.sender }, { type: "forward" });
  equal(harness.calls.at(-1), ["context-message", harness.sender, { type: "forward" }]);
}

{
  const harness = createHarness();
  const sidebar = harness.handled.get("sidebar");
  await sidebar({ sender: harness.sender }, { valid: false });
  equal(harness.warnings.at(-1)[0], "Invalid browser sidebar runtime message received");
  await sidebar({ sender: {} }, { valid: true, data: { type: "side" } });
  equal(harness.warnings.at(-1)[0], "Browser sidebar runtime message received without owner window");
  harness.setContext(null);
  await sidebar({ sender: harness.sender }, { valid: true, data: { type: "side" } });
  equal(harness.warnings.at(-1)[0], "Browser sidebar runtime message received for unknown window context");
  harness.setContext(harness.context);
  await sidebar({ sender: harness.sender }, { valid: true, data: { type: "side" } });
  equal(harness.calls.at(-1), ["context-message", harness.sender, { type: "side" }]);
}

{
  const harness = createHarness();
  const page = harness.listened.get("page");
  page({ sender: harness.sender, processId: 1, frameId: 2 }, { valid: false });
  equal(harness.warnings.at(-1)[0], "Invalid browser page event received");
  const before = harness.calls.length;
  page({ sender: harness.sender, processId: 9, frameId: 2 }, { valid: true, type: "guarded" });
  equal(harness.calls.length, before);
  page({ sender: harness.sender, processId: 1, frameId: 2 }, { valid: true, type: "guarded" });
  equal(harness.calls.at(-1), ["page-event", harness.sender, { valid: true, type: "guarded" }]);
}

{
  const failure = new Error("view failed");
  const harness = createHarness({ appViewError: failure });
  equal(await harness.handled.get("home")({ trusted: false }, { path: "/x" }), null);
  equal(await harness.handled.get("home")({ trusted: true }, { path: "/x" }), { home: { path: "/x" } });
  harness.handled.get("sentry")({ trusted: true });
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "sentry"), true);
  harness.listened.get("app-view")({ trusted: true, sender: harness.sender, ports: ["port"] });
  await settle();
  equal(harness.calls.some((call) => Array.isArray(call) && call[0] === "app-view"), true);
  equal(harness.warnings.at(-1)[0], "Failed to register AppView RPC services");
  equal(harness.warnings.at(-1)[1].sensitive.error, failure);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("registerMainIpcRouter"), true);
equal(main.includes("registerMainIpcRouter({"), true);
equal(main.includes("WEBMCP_UI_TOOLS_CHANGED_EVENT.type"), true);
equal(main.includes("SITE_ANNOTATION_FEATURES_CHANGED_EVENT.type"), true);
equal(main.includes("function Rrt("), false);
equal(main.includes("setRealtimeSessionRecordingEnabled: je.setRealtimeSessionRecordingEnabled"), false);

console.log(`${assertions} main IPC router assertions passed`);
