import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/window/browser-window-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserWindowManagerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class Emitter {
  listeners = new Map();
  on(name, listener) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }
  once(name, listener) {
    const wrapped = (...args) => {
      this.off(name, wrapped);
      listener(...args);
    };
    this.on(name, wrapped);
  }
  off(name, listener) {
    this.listeners.set(name, (this.listeners.get(name) ?? []).filter((value) => value !== listener));
  }
  removeListener(name, listener) {
    this.off(name, listener);
  }
  emit(name, ...args) {
    for (const listener of [...(this.listeners.get(name) ?? [])]) listener(...args);
  }
}

function createWebContents(id) {
  const webContents = new Emitter();
  Object.assign(webContents, {
    id,
    destroyed: false,
    sent: [],
    focused: 0,
    isDestroyed() { return this.destroyed; },
    send(channel, message) { this.sent.push([channel, message]); },
    focus() { this.focused += 1; },
  });
  return webContents;
}

function createWindow(id, webContents, values = {}) {
  const window = new Emitter();
  Object.assign(window, {
    id,
    webContents,
    destroyed: false,
    focused: values.focused ?? false,
    minimized: values.minimized ?? false,
    visible: values.visible ?? true,
    bounds: values.bounds ?? { x: 10, y: 20, width: 900, height: 700 },
    normalBounds: values.normalBounds ?? { x: 10, y: 20, width: 900, height: 700 },
    isDestroyed() { return this.destroyed; },
    isFocused() { return this.focused; },
    isMinimized() { return this.minimized; },
    isVisible() { return this.visible; },
    isMaximized() { return values.maximized ?? false; },
    isFullScreen() { return false; },
    isAlwaysOnTop() { return false; },
    restore() { this.minimized = false; this.restored = true; },
    show() { this.visible = true; this.shown = true; },
    focus() { this.focused = true; this.focusCalls = (this.focusCalls ?? 0) + 1; },
    setAlwaysOnTop(value) { this.alwaysOnTop = value; },
    getBounds() { return this.bounds; },
    getNormalBounds() { return this.normalBounds; },
    setBounds(value) { this.bounds = value; },
    setMinimumSize(width, height) { this.minimumSize = { width, height }; },
    setBackgroundColor(value) { this.backgroundColor = value; },
    setBackgroundMaterial(value) { this.backgroundMaterial = value; },
    setVibrancy(value) { this.vibrancy = value; },
    setWindowButtonPosition(value) { this.buttonPosition = value; },
    setTitleBarOverlay(value) { this.titleBarOverlay = value; },
    close() { this.destroyed = true; this.emit("closed"); },
  });
  return window;
}

function createHarness() {
  const windows = [];
  const byWebContents = new Map();
  const inline = [];
  const critical = [];
  const registered = [];
  const globalValues = new Map();
  const l = {
    BrowserWindow: {
      fromWebContents: (webContents) => byWebContents.get(webContents) ?? null,
      getAllWindows: () => windows,
    },
    app: { focus() {} },
    nativeTheme: { shouldUseDarkColors: false },
    screen: {
      getAllDisplays: () => [{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }],
      getDisplayMatching: () => ({ scaleFactor: 1 }),
    },
    systemPreferences: {},
  };
  const installPrimaryWindowTracking = (dependencies) => {
    dependencies.addPrimaryWindow();
    dependencies.setLastActiveAt(dependencies.now());
    if (!dependencies.hasLastActiveWindow()) dependencies.setLastActiveWindow();
    dependencies.emitChange();
    dependencies.on("focus", () => {
      dependencies.setLastActiveWindow();
      dependencies.setLastActiveAt(dependencies.now());
      dependencies.emitChange();
    });
    dependencies.on("blur", () => dependencies.setLastActiveAt(dependencies.now()));
  };
  const dependencies = {
    n: {
      At: () => new Set(["CmdOrCtrl+W"]),
      Ct: () => ({ bindings: [] }),
      Ha: { theme: { key: "theme" }, lightChromeTheme: { key: "light" }, darkChromeTheme: { key: "dark" } },
      iu: { SIDEBAR_THREAD_METADATA: "sidebar-thread-metadata" },
    },
    l,
    a: { At: "host-message" },
    xot: new Set(["private-key"]),
    IH: async () => undefined,
    A9: (zoom) => ({ x: zoom, y: zoom }),
    j9: (zoom) => ({ height: zoom ?? 1 }),
    Yot: 5_000,
    Xot: 1_000,
    Zot: 5_000,
    installDisplayChangeGeometryRefresh: () => () => undefined,
    est: () => true,
    U: { url: () => null },
    J: "local",
    O9: () => ({ info() {}, warning() {} }),
    initializeMcpSandbox: () => undefined,
    kot: class { constructor(globalState, notify) { this.globalState = globalState; this.notify = notify; } },
    Cot: class {},
    r9: 1200,
    sst: () => ({ width: 480, height: 600 }),
    z9: () => ({}),
    ost: () => false,
    L9: () => ({ backgroundColor: "transparent", backgroundMaterial: null }),
    buildBrowserWindowOptions: (value) => value,
    S2e: () => undefined,
    RUe: () => undefined,
    uWe: () => undefined,
    lUe: () => undefined,
    uVe: () => () => undefined,
    installWindowTitlebarOverlaySync: () => () => undefined,
    M9: () => "app://codex/index.html",
    N9: () => "app://codex",
    Oe: () => null,
    De: { BROWSER_COMMENT_POPUP: "popup" },
    P9: () => true,
    E9: () => false,
    MH: () => false,
    wot: () => true,
    F9: () => false,
    h: { join: path.join },
    v: { existsSync: () => false },
    Pot: () => "error",
    installPrimaryWindowTracking,
    $ot: () => "light",
    ast: () => false,
    rst: () => false,
    ist: () => false,
    BH: () => true,
    I9: (appearance) => appearance === "avatarOverlay",
    cst: () => null,
    bot: () => undefined,
    Not: "Reveal",
    installNativeContextMenu: () => () => undefined,
    installWebContentsDiagnostics: () => undefined,
    shouldRecoverRendererCrash: () => false,
    fT: (value) => value,
  };
  const BrowserWindowManager = createBrowserWindowManagerClass(dependencies);
  const manager = new BrowserWindowManager({}, {
    allowDebugMenu: false,
    chunkedMessageSender: {
      sendInlineMessageForView(webContents, message) { inline.push([webContents.id, message]); },
      sendCritical(webContents, channel, message) { critical.push([webContents.id, channel, message]); },
    },
    globalState: {
      get(key) { return globalValues.get(key); },
      set(key, value) { globalValues.set(key, value); },
    },
    settingsStore: { getEffective: () => null },
    onWindowRegistered: (window) => registered.push(window.id),
  });
  const addWindow = (window) => {
    windows.push(window);
    byWebContents.set(window.webContents, window);
  };
  return { addWindow, critical, globalValues, inline, manager, registered };
}

{
  const harness = createHarness();
  const webContents = createWebContents(101);
  const window = createWindow(1, webContents, { focused: true });
  harness.addWindow(window);
  const primaryChanges = [];
  harness.manager.subscribePrimaryWindowChanges((value) => primaryChanges.push(value?.id ?? null));
  harness.manager.registerWindow(window, "host-1", true, "primary", "register");
  equal(harness.registered, [1]);
  equal(harness.manager.hasRegisteredWebContents(webContents), true);
  equal(harness.manager.isAppServiceWindow(window), true);
  equal(harness.manager.getHostIdForWebContents(webContents), "host-1");
  equal(harness.manager.getPrimaryWindow(), window);
  equal(harness.manager.getPrimaryWindows(), [window]);
  equal(primaryChanges, [null, 1]);

  harness.manager.sendMessageToWebContents(webContents, { type: "queued" });
  equal(harness.inline, []);
  harness.manager.markWebContentsReady(webContents);
  equal(harness.inline, [[101, { type: "queued" }]]);
  harness.manager.sendMessageToWebContents(
    webContents,
    { type: "critical" },
    { priority: "critical" },
  );
  equal(harness.critical, [[101, "host-message", { type: "critical" }]]);
  equal(harness.manager.isWebContentsReady(101), true);

  harness.manager.setAppShellShortcutState(101, { temporaryChatEnabled: true });
  equal(harness.manager.getAppShellShortcutState(101), { temporaryChatEnabled: true });
  harness.manager.setWindowZoom(webContents, 1.5);
  equal(window.buttonPosition, { x: 1.5, y: 1.5 });
  harness.manager.applyWindowBackdrop(window, "primary", true);
  equal(window.backgroundColor, "transparent");

  harness.manager.markAppQuitting();
  equal(harness.manager.appQuitting, true);
  equal(harness.globalValues.get("electron-main-window-bounds"), {
    x: 10,
    y: 20,
    width: 900,
    height: 700,
    isMaximized: false,
  });

  window.close();
  equal(harness.manager.hasRegisteredWebContents(webContents), false);
  equal(harness.manager.isAppServiceWindow(window), false);
  equal(harness.manager.getHostIdForWebContents(webContents), null);
  equal(harness.manager.getPrimaryWindow(), null);
  equal(harness.manager.getAppShellShortcutState(101), null);
  equal(primaryChanges.at(-1), null);
}

{
  const harness = createHarness();
  const webContents = createWebContents(202);
  const window = createWindow(2, webContents, { minimized: true, visible: false });
  harness.addWindow(window);
  harness.manager.registerAuxiliaryWindow(window, "avatarOverlay", "auxiliary");
  harness.manager.markWebContentsReady(webContents);
  harness.manager.sendMessageToWebContents(webContents, {
    type: "persisted-atom-updated",
    key: "private-key",
  });
  equal(harness.inline, []);
  equal(harness.manager.isAvatarOverlayWindow(window), true);
  equal(harness.manager.showWindow(window, { stealFocus: true, focusComposer: true }), true);
  equal(window.restored, true);
  equal(window.shown, true);
  equal(window.focusCalls, 1);
  equal(harness.inline.at(-1), [202, { type: "focus-composer" }]);

  const fields = harness.manager.getRendererWindowLogFields(webContents);
  equal(fields.rendererWindowId, 2);
  equal(fields.rendererWindowAppearance, "avatarOverlay");
  equal(fields.rendererWindowVisible, true);
  equal(fields.rendererWindowFocused, true);
}

console.log(`${assertions} main browser window manager assertions passed`);
