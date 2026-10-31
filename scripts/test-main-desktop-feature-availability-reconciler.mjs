import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const settle = async () => {
  for (let index = 0; index < 4; index += 1) await Promise.resolve();
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/desktop-feature-availability-reconciler.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createDesktopFeatureAvailabilityReconciler } = loaded.exports;

function createHarness(options = {}) {
  const calls = [];
  let current = options.previous ?? {
    appshotsEnabled: true,
    browserSettingsCloudSync: false,
    browserUseTinysky: false,
    computerUse: false,
    externalBrowserUse: false,
    inAppBrowserUse: false,
    skysight: false,
    unifiedTabStrip: false,
  };
  const recorder = options.recorder === null
    ? null
    : { stop: async () => {
        calls.push(["stop-recorder"]);
        if (options.stopError != null) throw options.stopError;
      } };
  const managedService = options.managedService === null
    ? null
    : { setEnabledFeatures: async (features) => {
        calls.push(["managed-features", features]);
        if (options.managedError != null) throw options.managedError;
      } };
  const reconcile = createDesktopFeatureAvailabilityReconciler({
    applyDesktopFeatureAvailability: (availability) => {
      calls.push(["apply", availability]);
      current = options.keepPreviousIdentity ? current : availability;
    },
    broadcastQueryCacheInvalidation: (keys) => calls.push(["invalidate", keys]),
    getDesktopFeatureAvailability: () => current,
    getLocalAppServerConnection: () => ({
      reconcileChronicle: () => calls.push(["reconcile-chronicle"]),
    }),
    getLogger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
    getManagedComputerUseService: () => managedService,
    getRecorder: () => recorder,
    hasWindowsCaptureBridge: () => options.hasCaptureBridge ?? false,
    isWindows: options.isWindows ?? true,
    notifyDesktopFeatureAvailabilityChanged: () => calls.push(["notify"]),
    reconcileRemoteHostedPipAvailability: () => calls.push(["reconcile-pip"]),
    refreshBrowserSettingsSync: () => calls.push(["refresh-browser-settings"]),
    refreshOwnerCommandAccelerators: () => calls.push(["refresh-accelerators"]),
    resolveDesktopFeatureAvailability: (input) => ({ ...current, ...input }),
    setAppshotHotkeysEnabled: (enabled) => calls.push(["appshot-hotkey", enabled]),
    setBrowserSessionFeatureAvailability: (availability) => calls.push(["browser-session", availability]),
    setComputerUseFeatureAvailability: (availability) => calls.push(["computer-use", availability]),
    setPluginFeatureAvailability: async (availability, reasons) => {
      calls.push(["plugins", availability, reasons]);
      if (options.pluginError != null) throw options.pluginError;
    },
    startConversationExecutor: () => calls.push(["start-executor"]),
  });
  return { calls, reconcile, getCurrent: () => current };
}

{
  const harness = createHarness();
  harness.reconcile({
    appshotsEnabled: true,
    browserSettingsCloudSync: true,
    browserUseTinysky: true,
    computerUse: true,
    skysight: true,
    unifiedTabStrip: true,
  }, ["reason"]);
  const current = harness.getCurrent();
  equal(current.appshotsEnabled, false);
  equal(harness.calls.slice(0, 5), [
    ["apply", current],
    ["refresh-browser-settings"],
    ["refresh-accelerators"],
    ["invalidate", ["vscode", "codex-command-keymap-state"]],
    ["notify"],
  ]);
  equal(harness.calls.some(([type, , reasons]) => type === "plugins" && reasons?.[0] === "reason"), true);
  equal(harness.calls.some(([type]) => type === "browser-session"), true);
  equal(harness.calls.some(([type]) => type === "computer-use"), true);
  equal(harness.calls.some((call) => call[0] === "appshot-hotkey" && call[1] === false), true);
  equal(harness.calls.some((call) => call[0] === "invalidate" && call[1][0] === "chronicle-history"), true);
  equal(harness.calls.some((call) => call[0] === "managed-features" && call[1].skysightEnabled === true), true);
  equal(harness.calls.some(([type]) => type === "reconcile-pip"), true);
  await settle();
  equal(harness.calls.some(([type]) => type === "start-executor"), true);
  equal(harness.calls.some(([type]) => type === "stop-recorder"), false);
  equal(harness.calls.some(([type]) => type === "reconcile-chronicle"), true);
}

{
  const previous = {
    appshotsEnabled: true,
    browserSettingsCloudSync: true,
    browserUseTinysky: true,
    computerUse: true,
    externalBrowserUse: false,
    inAppBrowserUse: false,
    skysight: true,
    unifiedTabStrip: true,
  };
  const harness = createHarness({ previous, hasCaptureBridge: true, isWindows: false });
  harness.reconcile({ skysight: false });
  await settle();
  equal(harness.getCurrent().appshotsEnabled, true);
  equal(harness.calls.some(([type]) => type === "appshot-hotkey"), false);
  equal(harness.calls.some(([type]) => type === "stop-recorder"), true);
  equal(harness.calls.findIndex(([type]) => type === "stop-recorder") < harness.calls.findIndex(([type]) => type === "reconcile-chronicle"), true);
  equal(harness.calls.some(([type]) => type === "start-executor"), false);
}

{
  const error = new Error("managed failed");
  const stopError = new Error("stop failed");
  const previous = {
    appshotsEnabled: false,
    browserSettingsCloudSync: false,
    browserUseTinysky: false,
    computerUse: false,
    externalBrowserUse: false,
    inAppBrowserUse: false,
    skysight: true,
    unifiedTabStrip: false,
  };
  const harness = createHarness({ managedError: error, previous, stopError });
  harness.reconcile({ skysight: false });
  await settle();
  const warnings = harness.calls.filter(([type]) => type === "warning");
  equal(warnings.length, 2);
  equal(warnings[0][1], "Failed to reconcile managed Computer Use service");
  equal(warnings[0][2].sensitive.error, error);
  equal(warnings[1][1], "Failed to transition Chronicle recorder backend");
  equal(warnings[1][2].sensitive.error, stopError);
  equal(harness.calls.some(([type]) => type === "reconcile-chronicle"), false);
}

console.log(`${assertions} desktop feature-availability reconciler assertions passed`);
