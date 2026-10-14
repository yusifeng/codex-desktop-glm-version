import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/startup/sampler-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { SamplerManager } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

function webContents(id) {
  const listeners = new Map();
  return {
    id,
    destroyed: false,
    isDestroyed() { return this.destroyed; },
    once(event, listener) { listeners.set(event, listener); },
    removeListener(event, listener) {
      if (listeners.get(event) === listener) listeners.delete(event);
    },
    emit(event) { listeners.get(event)?.(); },
    hasListener(event) { return listeners.has(event); },
  };
}

const requests = new Map();
const sent = [];
const logs = [];
const breadcrumbs = [];
const samples = [];
const removedIntervals = [];
const marks = [];
const gate = { allowed: true, canPass() { return this.allowed; }, mark(now) { marks.push(now); } };
const renderer = webContents(11);
const primary = {
  focused: true,
  isFocused() { return this.focused; },
  isVisible() { return true; },
  webContents: renderer,
};
let ready = true;
let now = 100;
let nextId = 1;
let intervalCallback;
let intervalUnref = 0;
let jankStarts = 0;
let jankStops = 0;
let jankCount = 2;
const intervalHandle = { unref() { intervalUnref += 1; } };
const manager = new SamplerManager({
  browserSessionRegistry: { getSnapshotFields: () => ({ browser_tabs: 3 }) },
  clearInterval: (handle) => removedIntervals.push(handle),
  combineCpuSnapshots: (initial, final) => ({ initial, final }),
  createId: () => `request-${nextId++}`,
  desktopSentry: { addBreadcrumb: (value) => breadcrumbs.push(value) },
  electronSampler: {
    collectPerformanceSpanCpuSnapshot(target, phase) {
      const value = { id: target.id, phase: phase ?? "initial" };
      samples.push(value);
      return value;
    },
    async collectSnapshotFields(target) { return { host_field: target.id }; },
  },
  getAllWindows: () => [primary],
  getStdioIoStatsSnapshot: () => ({
    bytesReadLast30s: 4,
    bytesReadTotal: 10,
    bytesWrittenLast30s: 5,
    bytesWrittenTotal: 20,
  }),
  heartbeatIntervalMs: 30_000,
  hostId: "local",
  jankSampler: {
    start() { jankStarts += 1; },
    stop() { jankStops += 1; },
    takeSnapshotFields() {
      return { main_thread_jank_count_since_last_snapshot: jankCount };
    },
  },
  logger: () => ({
    debug(message, context) { logs.push(["debug", message, context]); },
    info(message, context) { logs.push(["info", message, context]); },
  }),
  now: () => now,
  requestRegistry: {
    delete(id) { requests.delete(id); },
    get(id) { return requests.get(id); },
    set(id, value, capturedAt) { requests.set(id, { ...value, capturedAt }); },
  },
  setInterval(callback, delay) {
    assert.equal(delay, 30_000);
    intervalCallback = callback;
    return intervalHandle;
  },
  summarizeWindowAttention: () => ({ processRole: "browser_main", windowAttention: "focused" }),
  triggerGate: gate,
  windowManager: {
    getPrimaryWindow: () => primary,
    isWebContentsReady: () => ready,
    sendMessageToWebContents(target, message) { sent.push([target, message]); },
  },
});

assert.equal(intervalUnref, 1);
assert.equal(jankStarts, 1);
primary.focused = false;
intervalCallback();
assert.equal(sent.length, 0);
primary.focused = true;
intervalCallback();
assert.equal(sent.length, 1);
assert.deepEqual(sent[0][1], {
  type: "electron-app-state-snapshot-request",
  hostId: "local",
  requestId: "request-1",
  reason: "heartbeat",
});
assert.equal(requests.get("request-1").capturedAt, 100);
assert.deepEqual(marks, [100]);

gate.allowed = false;
await manager.handleMessage(renderer, { type: "electron-app-state-snapshot-trigger", reason: "navigation" });
assert.equal(sent.length, 1);
gate.allowed = true;
now = 150;
await manager.handleMessage(renderer, { type: "electron-app-state-snapshot-trigger", reason: "navigation" });
assert.equal(sent.at(-1)[1].requestId, "request-2");
assert.equal(sent.at(-1)[1].reason, "navigation");
assert.deepEqual(marks, [100, 150]);

ready = false;
manager.handleRendererReady(renderer);
assert.equal(sent.length, 2);
ready = true;
manager.handleRendererReady(renderer);
assert.equal(sent.at(-1)[1].requestId, "request-3");

requests.get("request-3").memoryDiagnosticsSnapshotFields = Promise.resolve({ memory_field: 9 });
await manager.handleMessage(webContents(99), {
  type: "electron-app-state-snapshot-response",
  requestId: "request-3",
  fields: { snapshot_reason: "renderer-ready" },
});
assert.equal(requests.has("request-3"), true);
await manager.handleMessage(renderer, {
  type: "electron-app-state-snapshot-response",
  requestId: "request-3",
  fields: { snapshot_reason: "renderer-ready" },
});
assert.equal(requests.has("request-3"), false);
assert.equal(logs.filter((entry) => entry[1] === "main_thread_jank_snapshot").length, 1);
assert.equal(logs.filter((entry) => entry[1] === "app_state_snapshot").length, 1);
const snapshot = logs.find((entry) => entry[1] === "app_state_snapshot")[2].safe;
assert.equal(snapshot.host_field, 11);
assert.equal(snapshot.browser_tabs, 3);
assert.equal(snapshot.memory_field, 9);
assert.equal(snapshot.app_server_stdio_bytes_read_total, 10);
assert.equal(snapshot.app_server_stdio_bytes_written_last_30s, 5);
assert.equal(snapshot.main_thread_jank_count_since_last_snapshot, 2);
assert.equal(breadcrumbs.length, 1);
assert.equal(breadcrumbs[0].data, snapshot);

const firstSpan = webContents(21);
const secondSpan = webContents(22);
manager.startPerformanceSpanCpuSampling(firstSpan, "span");
assert.equal(firstSpan.hasListener("destroyed"), true);
manager.startPerformanceSpanCpuSampling(secondSpan, "span");
assert.equal(firstSpan.hasListener("destroyed"), false);
assert.equal(secondSpan.hasListener("destroyed"), true);
assert.deepEqual(manager.finishPerformanceSpanCpuSampling("span"), {
  initial: { id: 22, phase: "initial" },
  final: { id: 22, phase: "final" },
});
assert.equal(secondSpan.hasListener("destroyed"), false);
assert.equal(manager.finishPerformanceSpanCpuSampling("span"), null);

manager.startPerformanceSpanCpuSampling(firstSpan, "destroyed-span");
firstSpan.emit("destroyed");
assert.equal(manager.finishPerformanceSpanCpuSampling("destroyed-span"), null);
manager.startPerformanceSpanCpuSampling(secondSpan, "dispose-span");
manager.dispose();
assert.deepEqual(removedIntervals, [intervalHandle]);
assert.equal(jankStops, 1);
assert.equal(secondSpan.hasListener("destroyed"), false);

console.log("38 main sampler-manager assertions passed");
