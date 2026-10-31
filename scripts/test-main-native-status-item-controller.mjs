import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/tray/native-status-item-controller.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createNativeStatusItemControllerClass, resolveNativeQuitLabel } = loaded.exports;

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(resolveNativeQuitLabel({ buildFromTemplate: () => ({ items: [{ label: "Quit Codex" }] }) }, "Codex"), "Quit Codex");
equal(resolveNativeQuitLabel({ buildFromTemplate: () => [] }, "Codex"), "Quit Codex");

function createHarness({ createSucceeds = true, menuStateRejects = false, actionRejects = false } = {}) {
  const addonCalls = [];
  const appCalls = [];
  const logs = [];
  const projections = [];
  const actions = [];
  let settingsListener;
  let removeSettingsCalls = 0;
  let nativeCallback;
  const addon = {
    createStatusItem(iconPath, callback) {
      addonCalls.push(["create", iconPath]);
      nativeCallback = callback;
      return createSucceeds;
    },
    destroyStatusItem() { addonCalls.push(["destroy"]); },
    updateStatusItemMenuState(value) { addonCalls.push(["menu", JSON.parse(value)]); },
    updateStatusItemState(computerUseActive, historyRunning) {
      addonCalls.push(["state", computerUseActive, historyRunning]);
    },
  };
  const app = {
    beginNativeMenuTracking() { appCalls.push("begin"); },
    endNativeMenuTracking() { appCalls.push("end"); },
    getAppPath: () => "/electron-app",
  };
  const Controller = createNativeStatusItemControllerClass({
    app,
    resourcesPath: "/resources",
    createStatusItemAddon(options) { equal(options, { electronAppPath: "/electron-app", resourcesPath: "/resources" }); return addon; },
    parseNativeEvent(event) {
      return event.valid === false ? { success: false } : { success: true, data: event };
    },
    indicatorSetting: { key: "indicator", default: false },
    projectMenuState(input) { projections.push(input); return input; },
    getQuitLabel: (appName) => `Quit ${appName}`,
    logger: { n: () => ({ warning: (message, details) => logs.push({ message, details }) }) },
  });
  const settingsStore = {
    getEffective: () => true,
    onDidChange(key, listener) {
      equal(key, "indicator");
      settingsListener = listener;
      return () => { removeSettingsCalls += 1; };
    },
  };
  let getMenuStateCalls = 0;
  const getMenuState = async () => {
    getMenuStateCalls += 1;
    if (menuStateRejects) throw new Error("menu state failed");
    return {
      computerHistoryAvailable: true,
      computerHistoryEnabled: true,
      computerUseAvailable: true,
      serviceProcessIdentifier: 77,
      menuState: { applications: ["Browser"] },
    };
  };
  const construct = () => new Controller(
    "/status-template.png",
    { formatMessage: ({ defaultMessage }) => defaultMessage },
    "Codex",
    settingsStore,
    getMenuState,
    () => 77,
    async (event) => {
      actions.push(event);
      if (actionRejects) throw new Error("action failed");
    },
  );
  return {
    actions,
    addonCalls,
    appCalls,
    construct,
    get getMenuStateCalls() { return getMenuStateCalls; },
    get removeSettingsCalls() { return removeSettingsCalls; },
    logs,
    nativeEvent: (event) => nativeCallback(JSON.stringify(event)),
    projections,
    refreshSetting: () => settingsListener(),
  };
}

{
  const harness = createHarness();
  const controller = harness.construct();
  await new Promise(setImmediate);
  equal(harness.addonCalls[0], ["create", "/status-template.png"]);
  equal(controller.isReady(), true);
  equal(await controller.waitForReady(), true);
  equal(controller.state.computerHistoryIndicatorEnabled, true);
  equal(controller.state.computerHistoryAvailable, true);
  equal(controller.state.serviceProcessIdentifier, 77);
  equal(harness.getMenuStateCalls, 1);
  equal(harness.projections.at(-1).labels, {
    pinned: "Pinned",
    unread: "Unread",
    running: "Running",
    quit: "Quit Codex",
  });
  equal(harness.projections.at(-1).menuState, { applications: ["Browser"] });

  const threads = {
    runningThreads: [{ path: "/one" }],
    unreadThreads: [],
    pinnedThreads: [],
    recentThreads: [],
    usageLimits: [],
  };
  await controller.handleMessage({ type: "tray-menu-threads-changed", trayMenuThreads: threads });
  equal(harness.projections.at(-1).trayMenuThreads, threads);
  harness.refreshSetting();
  equal(harness.projections.at(-1).computerHistoryIndicatorEnabled, true);

  harness.nativeEvent({ type: "menu-open" });
  harness.nativeEvent({ type: "menu-close" });
  equal(harness.appCalls, ["begin", "end"]);
  const stateCallCount = harness.addonCalls.filter(([type]) => type === "state").length;
  harness.nativeEvent({
    type: "service-state-changed",
    processIdentifier: 999,
    computerUseActive: true,
    computerHistoryState: "running",
  });
  equal(harness.addonCalls.filter(([type]) => type === "state").length, stateCallCount);
  harness.nativeEvent({
    type: "service-state-changed",
    processIdentifier: 77,
    computerUseActive: true,
    computerHistoryState: "running",
  });
  await new Promise(setImmediate);
  equal(harness.addonCalls.findLast(([type]) => type === "state"), ["state", true, true]);
  equal(harness.getMenuStateCalls, 2);

  harness.nativeEvent({ type: "open-thread", path: "/one" });
  await new Promise(setImmediate);
  equal(harness.actions, [{ type: "open-thread", path: "/one" }]);
  harness.nativeEvent({ type: "ignored", valid: false });
  equal(harness.actions.length, 1);

  controller.destroy();
  equal(controller.isReady(), false);
  equal(await controller.waitForReady(), false);
  equal(harness.removeSettingsCalls, 1);
  equal(harness.addonCalls.at(-1), ["destroy"]);
  equal(harness.appCalls.at(-1), "end");
  const menuCalls = harness.addonCalls.filter(([type]) => type === "menu").length;
  controller.refreshMenu();
  equal(harness.addonCalls.filter(([type]) => type === "menu").length, menuCalls);
}

{
  const harness = createHarness({ menuStateRejects: true });
  harness.construct();
  await new Promise(setImmediate);
  equal(harness.logs[0].message, "Failed to load the native menu-bar state");
  equal(harness.logs[0].details.sensitive.error.message, "menu state failed");
}

{
  const harness = createHarness({ actionRejects: true });
  harness.construct();
  await new Promise(setImmediate);
  harness.nativeEvent({ type: "quit" });
  await new Promise(setImmediate);
  equal(harness.logs.at(-1).message, "Failed to handle a native menu-bar action");
  equal(harness.logs.at(-1).details.safe.action, "quit");
  equal(harness.logs.at(-1).details.sensitive.error.message, "action failed");
}

{
  const harness = createHarness({ createSucceeds: false });
  assert.throws(harness.construct, { message: "Failed to create the native macOS status item" });
  assertions += 1;
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("Mst = createNativeStatusItemControllerClass({"), true);
equal(main.includes("NativeStatusItemController: Mst"), true);
equal(main.includes("Mst = class"), false);
equal(main.includes("Failed to handle a native menu-bar action"), false);

console.log(`${assertions} main native status-item controller assertions passed`);
