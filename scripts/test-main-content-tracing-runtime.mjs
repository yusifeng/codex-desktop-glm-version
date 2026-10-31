import assert from "node:assert/strict";
import {
  PERFORMANCE_HEARTBEAT_INTERVAL_MS,
  PERFORMANCE_REQUEST_TTL_MS,
  PERFORMANCE_TRIGGER_MIN_INTERVAL_MS,
  combinePerformanceSpanSnapshots,
  createContentTracingRuntime,
  summarizeWindowAttention,
} from "../src/main/main-app/diagnostics/content-tracing-runtime.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

equal(PERFORMANCE_HEARTBEAT_INTERVAL_MS, 30_000);
equal(PERFORMANCE_TRIGGER_MIN_INTERVAL_MS, 5_000);
equal(PERFORMANCE_REQUEST_TTL_MS, 60_000);

const initialSnapshot = {
  capturedAtMonotonicMs: 1_000,
  mainProcessCumulativeCpuSeconds: 2,
  rendererProcessCumulativeCpuSeconds: 5,
  rendererProcessCreationTimeMs: 10,
  rendererProcessId: 7,
};
const finalSnapshot = {
  capturedAtMonotonicMs: 3_000,
  electronProcessWorkingSetKbTotal: 100,
  mainProcessCumulativeCpuSeconds: 3,
  mainProcessHandleCount: 11,
  mainProcessRssBytes: 12,
  rendererProcessCount: 2,
  rendererProcessCumulativeCpuSeconds: 5.5,
  rendererProcessCreationTimeMs: 10,
  rendererProcessId: 7,
  rendererProcessWorkingSetKb: 13,
  rendererProcessWorkingSetKbTotal: 14,
  systemTotalMemoryBytes: 15,
  systemFreeMemoryBytes: 16,
  systemCommitTotalBytes: 17,
  systemCommitLimitBytes: 18,
  systemKernelPagedPoolBytes: 19,
  systemKernelNonpagedPoolBytes: 20,
  systemHandleCount: 21,
  systemProcessCount: 22,
  systemThreadCount: 23,
  systemUptimeMs: 24,
};
const combined = combinePerformanceSpanSnapshots(initialSnapshot, finalSnapshot);
equal(combined.samplingWindowDurationMs, 2_000);
equal(combined.mainProcessCpuPercentAvg, 50);
equal(combined.rendererProcessCpuPercentAvg, 25);
equal(combined.systemThreadCount, 23);
equal(
  combinePerformanceSpanSnapshots(initialSnapshot, {
    ...finalSnapshot,
    rendererProcessId: 8,
  }).rendererProcessCpuPercentAvg,
  undefined,
);
equal(
  combinePerformanceSpanSnapshots(initialSnapshot, {
    ...finalSnapshot,
    capturedAtMonotonicMs: 500,
  }).samplingWindowDurationMs,
  0,
);
equal(
  combinePerformanceSpanSnapshots(initialSnapshot, {
    ...finalSnapshot,
    mainProcessCumulativeCpuSeconds: 1,
  }).mainProcessCpuPercentAvg,
  undefined,
);

equal(summarizeWindowAttention([]), {
  processRole: "browser_main",
  windowAttention: "no_window",
});
equal(summarizeWindowAttention([{ isFocused: () => true, isVisible: () => true }]), {
  processRole: "browser_main",
  windowAttention: "focused",
});
equal(summarizeWindowAttention([{ isFocused: () => false, isVisible: () => true }]), {
  processRole: "browser_main",
  windowAttention: "visible_unfocused",
});
equal(summarizeWindowAttention([{ isFocused: () => false, isVisible: () => false }]), {
  processRole: "browser_main",
  windowAttention: "background",
});

const state = {
  broadcasts: [],
  clearedTimers: [],
  dialogs: [],
  logger: [],
  shownPaths: [],
  startOptions: [],
  stopPaths: [],
  timers: [],
  uploadAttempts: 0,
  uploadOptions: [],
};
let now = 1_000;
let applicationMenu = null;
let bufferPercentage = 0.25;
const focusedWindow = {
  id: 9,
  isDestroyed: () => false,
  webContents: {
    getProcessMemoryInfo: async () => ({ private: 31, shared: 32, residentSet: 33 }),
  },
};
const electron = {
  app: {
    commandLine: { hasSwitch: (name) => name === "disable-gpu" },
    getAppMetrics: () => [
      {
        pid: 42,
        type: "Tab",
        memory: { workingSetSize: 41, peakWorkingSetSize: 42, privateBytes: 43 },
      },
    ],
    getGPUFeatureStatus: () => ({ webgl: "enabled" }),
    getGPUInfo: async () => ({
      gpuDevice: [{ active: true, vendorString: "GPU Vendor" }],
      auxAttributes: { glRenderer: "GPU Renderer" },
    }),
  },
  BrowserWindow: { getFocusedWindow: () => focusedWindow },
  contentTracing: {
    async getTraceBufferUsage() { return { percentage: bufferPercentage }; },
    async startRecording(options) { state.startOptions.push(options); },
    async stopRecording(path) {
      state.stopPaths.push(path);
      return path;
    },
  },
  dialog: {
    async showMessageBox(options) {
      state.dialogs.push(options);
      return { response: options.type === "warning" ? 0 : 2 };
    },
  },
  Menu: { getApplicationMenu: () => applicationMenu },
  shell: { showItemInFolder: (path) => state.shownPaths.push(path) },
};
const windowManager = {
  hasRegisteredWebContents: (webContents) => webContents === focusedWindow.webContents,
  sendMessageToAllRegisteredWindows: (message) => state.broadcasts.push(message),
};
const runtime = createContentTracingRuntime({
  electron,
  getIntl: () => ({ formatMessage: (descriptor) => descriptor.defaultMessage }),
  join: (...parts) => parts.join("/"),
  temporaryDirectory: () => "/tmp",
  localHostId: "local-host",
  loadUploadTraceRecording: async () => ({
    async uploadTraceRecording(options) {
      state.uploadAttempts += 1;
      state.uploadOptions.push(options);
      if (state.uploadAttempts === 1) throw new Error("retry upload");
      return "report-1";
    },
  }),
  createLogger: (name) => () => ({
    info: (...args) => state.logger.push([name, "info", ...args]),
    warning: (...args) => state.logger.push([name, "warning", ...args]),
  }),
  now: () => now,
  setTimer(callback, delayMs) {
    const timer = { callback, delayMs, unrefCalls: 0, unref() { this.unrefCalls += 1; } };
    state.timers.push(timer);
    return timer;
  },
  clearTimer: (timer) => state.clearedTimers.push(timer),
  traceShortcutEnabled: true,
});

const menuItem = runtime.createTraceMenuItem({
  allowDevtools: true,
  accelerator: "CmdOrCtrl+Shift+T",
  windowManager,
  traceRecordingUploadOptions: { endpoint: "trace-endpoint" },
});
applicationMenu = { getMenuItemById: (id) => id === menuItem.id ? menuItem : null };
equal(menuItem.id, "toggle-trace-recording");
equal(menuItem.label, "Start Performance Trace");
equal(menuItem.accelerator, "CmdOrCtrl+Shift+T");
equal(runtime.confirmTraceRecordingStart(), false);
equal(runtime.cancelTraceRecordingStart(), false);
equal(runtime.submitTraceRecording({ conversationId: "none", note: "" }), false);
equal(runtime.keepTraceRecordingLocal(), false);

const canceledStart = menuItem.click(menuItem);
await Promise.resolve();
equal(menuItem.label, "Waiting to Start Trace…");
equal(state.broadcasts.at(-1), {
  type: "trace-recording-state-changed",
  state: "awaiting-start-confirmation",
});
equal(runtime.cancelTraceRecordingStart(), true);
await canceledStart;
equal(menuItem.label, "Start Performance Trace");
equal(state.startOptions.length, 0);

const acceptedStart = menuItem.click(menuItem);
await Promise.resolve();
equal(runtime.confirmTraceRecordingStart(), true);
await acceptedStart;
equal(menuItem.label, "Stop Performance Trace");
equal(state.startOptions[0], {
  excluded_categories: ["IndexedDB", "toplevel.flow"],
  included_categories: [
    "*",
    "disabled-by-default-v8.cpu_profiler",
    "disabled-by-default-v8.cpu_profiler.hires",
  ],
  recording_mode: "record-until-full",
});
equal(state.timers[0].delayMs, 1_000);
equal(state.timers[0].unrefCalls, 1);

runtime.publishTraceState(windowManager);
equal(state.broadcasts.at(-1), {
  type: "trace-recording-state-changed",
  state: "recording",
});

now = 4_000;
const stopAndUpload = runtime.toggleTraceRecording();
for (let index = 0; index < 5; index += 1) await Promise.resolve();
equal(menuItem.label, "Waiting for Trace Details…");
equal(state.clearedTimers, [state.timers[0]]);
equal(state.stopPaths, ["/tmp/codex-trace-4000.json"]);
equal(runtime.submitTraceRecording({ conversationId: "conversation-1", note: "trace note" }), true);
await stopAndUpload;
equal(menuItem.label, "Start Performance Trace");
equal(state.uploadAttempts, 2);
equal(state.dialogs.some((dialog) => dialog.type === "warning"), true);
equal(state.uploadOptions.at(-1).correlation, {
  conversationId: "conversation-1",
  hostId: "local-host",
  windowId: 9,
});
equal(state.uploadOptions.at(-1).recordingDurationMs, 3_000);
equal(state.uploadOptions.at(-1).runtimeHealth.gpuVendor, "GPU Vendor");
equal(state.uploadOptions.at(-1).runtimeHealth.gpuRenderer, "GPU Renderer");
equal(state.uploadOptions.at(-1).runtimeHealth.rendererMemory, {
  private: 31,
  shared: 32,
  residentSet: 33,
});
equal(state.uploadOptions.at(-1).runtimeHealth.hardwareAccelerationEnabled, false);
equal(state.broadcasts.at(-2), {
  type: "trace-recording-state-changed",
  state: "idle",
});
equal(state.broadcasts.at(-1), {
  type: "trace-recording-uploaded",
  reportId: "report-1",
  tracePath: "/tmp/codex-trace-4000.json",
});

const localStart = menuItem.click(menuItem);
await Promise.resolve();
runtime.confirmTraceRecordingStart();
await localStart;
now = 5_000;
const localStop = menuItem.click(menuItem);
for (let index = 0; index < 5; index += 1) await Promise.resolve();
equal(runtime.keepTraceRecordingLocal(), true);
await localStop;
equal(state.shownPaths, ["/tmp/codex-trace-5000.json"]);
equal(menuItem.label, "Start Performance Trace");

const noShortcutRuntime = createContentTracingRuntime({
  electron,
  getIntl: () => ({ formatMessage: (descriptor) => descriptor.defaultMessage }),
  join: (...parts) => parts.join("/"),
  temporaryDirectory: () => "/tmp",
  localHostId: "local-host",
  loadUploadTraceRecording: async () => ({ uploadTraceRecording: async () => "unused" }),
  createLogger: () => () => ({ info() {}, warning() {} }),
  now: () => now,
  setTimer: () => ({ unref() {} }),
  clearTimer() {},
  traceShortcutEnabled: false,
});
equal(
  noShortcutRuntime.createTraceMenuItem({
    allowDevtools: true,
    accelerator: "shortcut",
    windowManager,
  }).accelerator,
  undefined,
);

equal(state.logger.some((entry) => entry[1] === "warning"), true);
console.log(`${assertions} main content-tracing runtime assertions passed`);
