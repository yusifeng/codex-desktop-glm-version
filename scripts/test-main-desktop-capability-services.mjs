import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/window/desktop-capability-services.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class RpcHandlerBase {}
const calls = [];
let dialogResponse = 0;
let applicationMenu = null;
let focusedWebContents = null;
let browserWindow = { id: "parent" };
const electron = {
  app: {
    getVersion: () => "1.2.3",
    getLocale: () => "en-US",
    getPreferredSystemLanguages: () => ["en-US", "fr-FR"],
  },
  BrowserWindow: {
    fromWebContents(origin) {
      calls.push(["fromWebContents", origin.id]);
      return browserWindow;
    },
  },
  dialog: {
    async showMessageBox(...args) {
      calls.push(["dialog", ...args]);
      return { response: dialogResponse };
    },
  },
  Menu: { getApplicationMenu: () => applicationMenu },
  screen: {
    getPrimaryDisplay: () => ({ size: { height: 900, width: 1440 }, scaleFactor: 2 }),
  },
  webContents: { getFocusedWebContents: () => focusedWebContents },
};
const baseDependencies = {
  RpcHandlerBase,
  electron,
  menuSectionIds: { file: "file", edit: "edit", view: "view", help: "help" },
  persistedStateKey: "persisted",
  updateResumeStateKey: "resume",
  parseThreadId(value) {
    if (!value.startsWith("thread-")) throw new Error("invalid thread id");
    return value.toUpperCase();
  },
  parseVersion: (value) => ({ version: `parsed:${value}` }),
  getBuildNumber: () => "build-7",
  getReleaseChannel: () => null,
  getDefaultReleaseChannel: () => "stable",
  getNativeIntl: () => ({
    formatMessage: ({ messageId, defaultMessage }) => `${messageId}:${defaultMessage}`,
  }),
  isRemoteControlSessionActive: () => false,
  appSessionId: "session-1",
  platform: "linux",
  timezone: "Asia/Shanghai",
};
const services = runtime.createDesktopCapabilityServices(baseDependencies);

const persisted = new Map();
let flushCount = 0;
const globalState = {
  get: (key) => persisted.get(key),
  set: (key, value) => persisted.set(key, value),
  async flushOrThrow() { flushCount += 1; },
};
const sparkle = {
  checkForUpdates: () => calls.push(["check"]),
  async checkForUpdateInformation() { return { availableVersion: "2.0.0" }; },
  setSparkleQueryParams: (params) => calls.push(["params", params]),
  installUpdatesIfAvailable: () => calls.push(["install"]),
};
const origin = { id: 17, isDestroyed: () => false };
const update = new services.AppUpdateService(
  { getPrimaryWindow: () => ({ id: "primary" }) },
  origin,
  sparkle,
  globalState,
);
equal(update instanceof RpcHandlerBase, true);
update.checkForUpdates();
equal(calls.at(-1), ["check"]);
equal(await update.checkForUpdateInformation(), {
  installedVersion: "parsed:1.2.3",
  installedBuildVersion: "build-7",
  installedReleaseChannel: "stable",
  availableVersion: "2.0.0",
});
update.setSparkleQueryParams({ channel: "beta" });
equal(calls.at(-1), ["params", { channel: "beta" }]);
equal(await update.takeResumeState(), null);
equal(flushCount, 0);
persisted.set("persisted", {
  keep: true,
  resume: {
    accountId: "account",
    userId: "user",
    threadIds: ["thread-one", "thread-two"],
    expiresAtMs: 123,
    ignored: true,
  },
});
equal(await update.takeResumeState(), {
  accountId: "account",
  userId: "user",
  threadIds: ["THREAD-ONE", "THREAD-TWO"],
  expiresAtMs: 123,
});
equal(persisted.get("persisted"), { keep: true, resume: null });
equal(flushCount, 1);
persisted.set("persisted", { resume: { accountId: "account", threadIds: [], expiresAtMs: 1 } });
equal(await update.takeResumeState(), null);
equal(persisted.get("persisted"), { resume: null });
equal(flushCount, 2);
await update.installUpdate();
equal(calls.at(-1), ["install"]);

const macServices = runtime.createDesktopCapabilityServices({
  ...baseDependencies,
  platform: "darwin",
  isRemoteControlSessionActive: () => true,
});
const macUpdate = new macServices.AppUpdateService(
  { getPrimaryWindow: () => ({ id: "primary" }) },
  origin,
  sparkle,
  globalState,
);
dialogResponse = 1;
await macUpdate.installUpdate();
equal(calls.at(-1)[0], "dialog");
equal(calls.at(-1)[1], browserWindow);
equal(calls.at(-1)[2].defaultId, 0);
equal(calls.at(-1)[2].cancelId, 1);
equal(calls.at(-1)[2].buttons.length, 2);
const installCountBefore = calls.filter(([name]) => name === "install").length;
equal(calls.filter(([name]) => name === "install").length, installCountBefore);
dialogResponse = 0;
await macUpdate.installUpdate();
equal(calls.at(-1), ["install"]);
browserWindow = null;
await macUpdate.installUpdate();
equal(calls.at(-2)[0], "dialog");
equal(calls.at(-2)[1], { id: "primary" });
equal(calls.at(-2).length, 3);

const clicks = [];
function menuItem(commandId, type, label, options = {}) {
  return {
    commandId,
    type,
    label,
    visible: options.visible ?? true,
    enabled: options.enabled ?? true,
    accelerator: options.accelerator,
    submenu: options.submenu,
    click(...args) { clicks.push([commandId, this.commandId, ...args]); },
  };
}
const normal = menuItem(11, "normal", "Open", { accelerator: "Cmd+O" });
const hidden = menuItem(12, "normal", "Hidden", { visible: false });
const disabled = menuItem(13, "normal", "Disabled", { enabled: false });
const nested = menuItem(14, "normal", "Nested");
const submenu = menuItem(15, "submenu", "More", { submenu: { items: [nested] } });
const separator = menuItem(16, "separator", "");
const sections = {
  file: { submenu: { items: [normal, hidden, disabled, separator, submenu] } },
  edit: { submenu: { items: [] } },
  view: { submenu: { items: [] } },
  help: { submenu: { items: [] } },
};
applicationMenu = { getMenuItemById: (id) => sections[id] ?? null };
const menuService = new services.ApplicationMenuSnapshotService(origin);
equal(menuService instanceof RpcHandlerBase, true);
const snapshot = menuService.getSnapshot();
equal(snapshot.file.length, 4);
equal(snapshot.file[0], {
  type: "item",
  nativeCommandId: 11,
  label: "Open",
  accelerator: "Cmd+O",
  enabled: true,
});
equal(snapshot.file[2], { type: "separator", nativeCommandId: 16 });
equal(snapshot.file[3].items[0].nativeCommandId, 14);
equal(snapshot.edit, []);
menuService.invokeItem("11");
equal(clicks.length, 0);
menuService.invokeItem(13);
equal(clicks.length, 0);
focusedWebContents = { id: 18, isDestroyed: () => false, hostWebContents: origin };
browserWindow = { id: "parent" };
menuService.invokeItem(11);
equal(clicks.length, 1);
equal(clicks[0][0], 11);
equal(clicks[0][1], 11);
equal(clicks[0][2], { triggeredByAccelerator: false });
equal(clicks[0][3], browserWindow);
equal(clicks[0][4], focusedWebContents);
focusedWebContents = { id: 19, isDestroyed: () => true };
menuService.invokeItem(14);
equal(clicks.at(-1)[4], origin);
applicationMenu = null;
equal(menuService.getSnapshot(), null);
menuService.invokeItem(11);
equal(clicks.length, 2);

const hotkeyCalls = [];
const appshot = new services.AppshotCapabilityService(
  {
    getState: () => ({ hotkey: "Cmd+Shift+A" }),
    setHotkey: (value) => hotkeyCalls.push(["hotkey", value]),
  },
  (request) => (hotkeyCalls.push(["capture", request]), true),
);
equal(appshot.getState(), { hotkey: "Cmd+Shift+A" });
equal(appshot.setHotkey("Alt+A"), 1);
equal(appshot.requestFinalUpdate({ requestId: "capture-1" }), true);
equal(hotkeyCalls, [
  ["hotkey", "Alt+A"],
  ["capture", { requestId: "capture-1" }],
]);

equal(services.getDesktopEnvironmentSignals(), {
  schemaVersion: 1,
  preferredLanguages: ["en-US", "fr-FR"],
  locale: "en-US",
  timezone: "Asia/Shanghai",
  screenSizeSum: 2340,
  screenScale: 2,
  appSessionId: "session-1",
});
equal(
  runtime.projectDesktopEnvironmentSignals(
    "s".repeat(140),
    -10,
    -20,
    1.5,
    "",
    [],
    "",
  ),
  {
    schemaVersion: 1,
    preferredLanguages: ["unknown"],
    locale: "unknown",
    timezone: "unknown",
    screenSizeSum: 0,
    screenScale: 1.5,
    appSessionId: "s".repeat(128),
  },
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/window/desktop-capability-services.js")'), true);
equal(main.includes("createDesktopCapabilityServices({"), true);
equal(main.includes("cOe = class extends"), false);
equal(main.includes("lOe = class extends"), false);
equal(main.includes("function YE("), false);
equal(main.includes("yOe = class extends"), false);
equal(main.includes("function EOe("), false);
equal(windowContext.includes("new AppUpdateService("), true);
equal(windowContext.includes("new ApplicationMenuSnapshotService(e)"), true);
equal(windowContext.includes("new AppshotCapabilityService("), true);
equal(windowContext.includes("getSignals: getDesktopEnvironmentSignals"), true);

console.log(`${assertions} main desktop capability service assertions passed`);
