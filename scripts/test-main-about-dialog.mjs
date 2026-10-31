import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildAboutDialogHtml,
  clamp,
  createAboutDialog,
  formatReleaseDate,
} from "../src/main/main-app/app-shell/about-dialog.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createImage(name, empty = false) {
  return {
    name,
    isEmpty: () => empty,
    toDataURL: () => `data:image/mock,${name}`,
  };
}

function createHarness(platform, options = {}) {
  const createdWindows = [];
  const iconPaths = [];
  const windowsIconCalls = [];
  const lightIcon = createImage("light");
  const darkIcon = createImage("dark");
  class BrowserWindow {
    constructor(windowOptions) {
      this.options = windowOptions;
      this.destroyed = false;
      this.minimized = false;
      this.events = new Map();
      this.calls = [];
      this.bounds = { x: 0, y: 0, width: 380, height: 360 };
      this.webContents = {
        executeJavaScript: async (...args) => {
          this.calls.push(["execute", ...args]);
          return options.measuredHeight ?? 412;
        },
        on: (event, handler) => { this.webContents.navigateHandler = [event, handler]; },
        setWindowOpenHandler: (handler) => { this.webContents.openHandler = handler; },
      };
      createdWindows.push(this);
    }
    center() { this.calls.push(["center"]); }
    destroy() { this.destroyed = true; this.calls.push(["destroy"]); }
    focus() { this.calls.push(["focus"]); }
    getBounds() { return this.bounds; }
    isDestroyed() { return this.destroyed; }
    isMinimized() { return this.minimized; }
    async loadURL(url) {
      this.url = url;
      this.calls.push(["loadURL"]);
      if (options.loadError) throw new Error("load failed");
      if (options.destroyDuringLoad) this.destroyed = true;
    }
    once(event, handler) { this.events.set(event, handler); }
    removeMenu() { this.calls.push(["removeMenu"]); }
    restore() { this.minimized = false; this.calls.push(["restore"]); }
    setContentSize(...args) { this.calls.push(["setContentSize", ...args]); }
    setMenuBarVisibility(value) { this.calls.push(["setMenuBarVisibility", value]); }
    setPosition(...args) { this.calls.push(["setPosition", ...args]); }
    show() { this.calls.push(["show"]); }
  }
  const app = {
    isPackaged: options.packaged ?? false,
    getAppPath: () => "/app",
    getName: () => options.appName ?? "Codex <Beta>",
    getVersion: () => "1.2.3",
    getFileIcon: async (iconPath, iconOptions) => {
      iconPaths.push([iconPath, iconOptions]);
      if (options.fileIconError) throw new Error("icon failed");
      return lightIcon;
    },
  };
  const nativeIntl = {
    formatMessage({ defaultMessage, values = {} }) {
      return Object.entries(values).reduce(
        (message, [key, value]) => message.replace(`{${key}}`, String(value)),
        defaultMessage,
      );
    },
  };
  const runtime = createAboutDialog({
    app,
    BrowserWindow,
    screen: {
      getDisplayMatching: () => ({
        workArea: options.workArea ?? { x: 0, y: 0, width: 1000, height: 800 },
      }),
    },
    nativeImage: {
      createEmpty: () => createImage("empty", true),
      createFromPath: (iconPath) => {
        iconPaths.push(iconPath);
        return iconPath.includes("dark") ? darkIcon : lightIcon;
      },
    },
    nativeTheme: { shouldUseDarkColors: options.dark ?? false },
    platform,
    execPath: "/bin/codex",
    resourcesPath: "/resources",
    join: (...parts) => parts.join("/"),
    getNativeIntl: () => nativeIntl,
    parseReleaseDate: () => options.releaseDate ?? null,
    formatBuildFlavor: () => options.flavor ?? "Internal",
    resolveMacAppIconPath: () => "/Applications/Codex.icns",
    readMacIconDataUrl: async (iconPath) => {
      iconPaths.push(["mac-data", iconPath]);
      return options.macDataUrl ?? "data:image/mock,mac";
    },
    resolveWindowsIcon: (flavor, iconOptions) => {
      windowsIconCalls.push([flavor, iconOptions]);
      return iconOptions?.isDark ? "/icons/dark.ico" : "/icons/light.ico";
    },
    resolveLinuxIcon: () => "/icons/linux.png",
    iconBaseName: () => "codex",
    escapeHtml: (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;"),
  });
  return { createdWindows, darkIcon, iconPaths, lightIcon, runtime, windowsIconCalls };
}

{
  const parent = {
    isDestroyed: () => false,
    getBounds: () => ({ x: 900, y: 700, width: 200, height: 100 }),
  };
  const harness = createHarness("win32", { dark: true });
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent });
  const window = harness.createdWindows[0];
  equal(harness.createdWindows.length, 1);
  equal(window.options.width, 380);
  equal(window.options.height, 360);
  equal(window.options.modal, true);
  equal(window.options.parent, parent);
  equal(window.options.backgroundColor, "#202020");
  equal(window.options.icon, harness.lightIcon);
  equal(window.options.webPreferences, {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
    devTools: false,
  });
  equal(harness.windowsIconCalls, [["dev", undefined], ["dev", { isDark: true }]]);
  equal(window.calls.filter(([name]) => name === "setPosition"), [
    ["setPosition", 620, 440, false],
    ["setPosition", 620, 440, false],
  ]);
  equal(window.calls.some(([name]) => name === "removeMenu"), true);
  equal(window.calls.find(([name]) => name === "setContentSize"), ["setContentSize", 380, 412, false]);
  equal(window.webContents.openHandler(), { action: "deny" });
  let prevented = 0;
  window.webContents.navigateHandler[1]({ preventDefault: () => { prevented += 1; } });
  equal(prevented, 1);
  const html = decodeURIComponent(window.url.split(",")[1]);
  equal(html.includes("Codex &lt;Beta&gt;"), true);
  equal(html.includes("data:image/mock,dark"), true);
  equal(html.includes("Powered by Codex &amp; OWL"), true);
  equal(html.includes("Version 1.2.3 • Internal"), true);
  equal(html.includes('id="ok"'), true);
  window.minimized = true;
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent: null });
  equal(harness.createdWindows.length, 1);
  equal(window.calls.slice(-3), [["restore"], ["show"], ["focus"]]);
  window.events.get("closed")();
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent: null });
  equal(harness.createdWindows.length, 2);
}

{
  const harness = createHarness("darwin", { measuredHeight: Number.NaN });
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent: null });
  const window = harness.createdWindows[0];
  equal(window.options.modal, undefined);
  equal(window.calls.some(([name]) => name === "removeMenu"), false);
  equal(window.calls.filter(([name]) => name === "center").length, 2);
  equal(window.calls.find(([name]) => name === "setContentSize"), ["setContentSize", 380, 360, false]);
  equal(harness.iconPaths.some((entry) => Array.isArray(entry) && entry[0] === "/Applications/Codex.icns"), true);
  equal(harness.iconPaths.some((entry) => Array.isArray(entry) && entry[0] === "mac-data"), true);
  const html = decodeURIComponent(window.url.split(",")[1]);
  equal(html.includes('id="ok"'), false);
  equal(html.includes("data:image/mock,mac"), true);
}

{
  const harness = createHarness("linux", { loadError: true });
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent: null });
  equal(harness.createdWindows[0].calls.some(([name]) => name === "destroy"), true);
  await harness.runtime.showAboutDialog({ buildFlavor: "dev", parent: null });
  equal(harness.createdWindows.length, 2);
}

equal(clamp(12, 0, 10), 10);
equal(clamp(-2, 0, 10), 0);
equal(formatReleaseDate("1.0", () => null), null);
equal(typeof formatReleaseDate("1.0", () => new Date("2026-01-02T00:00:00Z")), "string");
const escapedHtml = buildAboutDialogHtml({
  appDisplayName: "<name>",
  buildInfoLabel: "build",
  buildInfoText: "a&b",
  iconDataUrl: null,
  isDark: false,
  okLabel: null,
  title: "<title>",
  escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
});
equal(escapedHtml.includes("&lt;title&gt;"), true);
equal(escapedHtml.includes("&lt;name&gt;"), true);
equal(escapedHtml.includes("a&amp;b"), true);
equal(escapedHtml.includes("default-src 'none'"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("const { createAboutDialog }"), true);
equal(main.includes("showAboutDialog: Qrt"), true);
equal(main.includes("function Qrt("), false);
equal(main.includes("function $rt("), false);
equal(main.includes("function nit("), false);
equal(main.includes("function rit("), false);
equal(main.includes("p7 = null"), false);

console.log(`${assertions} main about-dialog assertions passed`);
