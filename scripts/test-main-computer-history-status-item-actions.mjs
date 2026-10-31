import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/computer-use/native-status-item-actions.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createComputerHistoryStatusItemActions } = loaded.exports;

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness(options = {}) {
  const calls = [];
  const warnings = [];
  const service = options.service === null
    ? null
    : {
        getServiceProcessIdentifier: () => options.initialPid ?? 41,
        async ensureServicePid() {
          calls.push(["ensure-service"]);
          return options.ensuredPid ?? 42;
        },
      };
  const recorder = options.recorder === null
    ? null
    : {
        async pause(duration) { calls.push(["pause", duration]); },
        async resume() { calls.push(["resume"]); },
        async clearHistory(scope, range) { calls.push(["clear", scope, range]); },
      };
  const statusItem = createComputerHistoryStatusItemActions({
    getConnection: () => options.connection === null
      ? null
      : {
          getChronicleControlState: () => ({ enabled: options.historyEnabled ?? true }),
        },
    getFeatureAvailability: () => ({
      skysight: options.skysight ?? true,
      computerUse: options.computerUse ?? true,
    }),
    getManagedService: () => service,
    getRecorder: () => recorder,
    invalidateQuery: (key) => calls.push(["invalidate", key]),
    logComputerHistoryStatusItemAction: (action) => calls.push(["analytics", action]),
    navigate: async (path) => { calls.push(["navigate", path]); },
    quit: () => calls.push(["quit"]),
    requestComputerUseWorker: async (request) => {
      calls.push(["worker", request]);
      if (options.workerError != null) throw options.workerError;
      return options.menuState ?? { applications: [] };
    },
    historyClearActions: {
      application_session: "clear_application_session",
      last_ten_minutes: "clear_last_ten_minutes",
      last_hour: "clear_last_hour",
      last_day: "clear_last_day",
    },
    historyClearRange: (scope, startedAt, endedAt) => {
      calls.push(["range", scope, startedAt, endedAt]);
      return scope === "application_session" && startedAt != null
        ? { startMs: 10, endMs: 20 }
        : null;
    },
    historyScopeAction: (scope, observe) => `${observe ? "include" : "exclude"}_${scope}`,
    logger: { n: () => ({ warning: (...args) => warnings.push(args) }) },
  });
  return { calls, recorder, service, statusItem, warnings };
}

{
  const harness = createHarness();
  equal(harness.statusItem.getComputerUseServiceProcessIdentifier(), 41);
  equal(await harness.statusItem.getNativeStatusItemState(), {
    computerHistoryAvailable: true,
    computerHistoryEnabled: true,
    computerUseAvailable: true,
    serviceProcessIdentifier: 42,
    menuState: { applications: [] },
  });
  equal(harness.calls, [
    ["ensure-service"],
    ["worker", { method: "statusItemMenuState", params: {} }],
  ]);
}

{
  const harness = createHarness({ service: null, connection: null, computerUse: false });
  equal(harness.statusItem.getComputerUseServiceProcessIdentifier(), null);
  equal(await harness.statusItem.getNativeStatusItemState(), {
    computerHistoryAvailable: true,
    computerHistoryEnabled: false,
    computerUseAvailable: false,
    serviceProcessIdentifier: null,
    menuState: null,
  });
  equal(harness.calls, []);
}

{
  const failure = new Error("menu failed");
  const harness = createHarness({ workerError: failure, skysight: false, computerUse: true });
  equal(await harness.statusItem.getNativeStatusItemState(), {
    computerHistoryAvailable: false,
    computerHistoryEnabled: false,
    computerUseAvailable: true,
    serviceProcessIdentifier: 42,
    menuState: null,
  });
  equal(harness.warnings.length, 1);
  equal(harness.warnings[0][0], "Failed to load the native Computer Use menu state");
  equal(harness.warnings[0][1].sensitive.error, failure);
}

{
  const harness = createHarness();
  await harness.statusItem.onNativeStatusItemMenuAction({ type: "open-thread", path: "/thread/one" });
  await harness.statusItem.onNativeStatusItemMenuAction({ type: "quit" });
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-use/stop-application",
    applicationId: "app-1",
  });
  await harness.statusItem.onNativeStatusItemMenuAction({ type: "computer-history/show-history" });
  await harness.statusItem.onNativeStatusItemMenuAction({ type: "computer-history/open-settings" });
  equal(harness.calls, [
    ["navigate", "/thread/one"],
    ["quit"],
    ["worker", { method: "stopApplication", params: { applicationId: "app-1" } }],
    ["navigate", "/settings/chronicle#history"],
    ["analytics", "show_all_history"],
    ["navigate", "/settings/chronicle"],
    ["analytics", "open_settings"],
  ]);
}

{
  const harness = createHarness();
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/pause",
    duration: "one_hour",
  });
  await harness.statusItem.onNativeStatusItemMenuAction({ type: "computer-history/resume" });
  equal(harness.calls, [
    ["pause", "one_hour"],
    ["analytics", "pause"],
    ["invalidate", ["chronicle-state"]],
    ["resume"],
    ["analytics", "resume"],
    ["invalidate", ["chronicle-state"]],
  ]);
}

{
  const harness = createHarness();
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/update-observation",
    scope: "app",
    target: "com.example.app",
    observe: false,
  });
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/update-observation",
    scope: "url",
    target: "example.com",
    observe: true,
  });
  equal(harness.calls, [
    ["worker", {
      method: "skysightUpdateObservationPolicy",
      params: {
        observe: false,
        target: { scope: "app", bundleID: "com.example.app", urlDomain: null },
      },
    }],
    ["analytics", "exclude_app"],
    ["invalidate", ["chronicle-settings"]],
    ["worker", {
      method: "skysightUpdateObservationPolicy",
      params: {
        observe: true,
        target: { scope: "url", bundleID: null, urlDomain: "example.com" },
      },
    }],
    ["analytics", "include_url"],
    ["invalidate", ["chronicle-settings"]],
  ]);
}

{
  const harness = createHarness();
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/clear-history",
    scope: "application_session",
  });
  equal(harness.calls, [["range", "application_session", undefined, undefined]]);
  harness.calls.length = 0;
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/clear-history",
    scope: "application_session",
    startedAt: "start",
    endedAt: "end",
  });
  equal(harness.calls, [
    ["range", "application_session", "start", "end"],
    ["clear", "application_session", { startMs: 10, endMs: 20 }],
    ["analytics", "clear_application_session"],
    ["invalidate", ["chronicle-history"]],
  ]);
  harness.calls.length = 0;
  await harness.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/clear-history",
    scope: "last_hour",
  });
  equal(harness.calls, [
    ["range", "last_hour", undefined, undefined],
    ["clear", "last_hour", null],
    ["analytics", "clear_last_hour"],
    ["invalidate", ["chronicle-history"]],
  ]);
}

{
  const noService = createHarness({ service: null });
  await noService.statusItem.onNativeStatusItemMenuAction({
    type: "computer-history/pause",
    duration: "one_hour",
  });
  equal(noService.calls, []);
  const noRecorder = createHarness({ recorder: null });
  await noRecorder.statusItem.onNativeStatusItemMenuAction({ type: "computer-history/resume" });
  equal(noRecorder.calls, []);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createComputerHistoryStatusItemActions"), true);
equal(main.includes("...createComputerHistoryStatusItemActions({"), true);
equal(main.includes("historyClearActions: HISTORY_CLEAR_ACTIONS"), true);
equal(main.includes("function kst("), false);
equal(main.includes("var Dst = HISTORY_SCOPE_ACTIONS"), false);
equal(main.includes("Ost = HISTORY_CLEAR_ACTIONS"), false);

console.log(`${assertions} main computer-history status-item action assertions passed`);
