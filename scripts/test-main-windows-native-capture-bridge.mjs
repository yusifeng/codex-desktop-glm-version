import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/computer-use/windows-native-capture-bridge.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createWindowsNativeCaptureBridgeModule } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};
const waitUntil = async (predicate) => {
  for (let index = 0; index < 100 && !predicate(); index += 1)
    await new Promise((resolve) => setImmediate(resolve));
  assert.equal(predicate(), true);
};

function schema(shape = {}) {
  const value = {
    shape,
    parse: (input) => input,
    safeParse: (input) => ({ success: true, data: input }),
  };
  for (const name of ["catch", "int", "min", "nonnegative", "nullable", "nullish", "optional", "positive", "refine", "regex", "trim"])
    value[name] = () => value;
  return value;
}

const logs = [];
const n = {
  wf: (shape) => schema(shape),
  Of: () => schema(),
  Cf: () => schema(),
  bf: () => schema(),
  df: () => schema(),
  hf: () => schema(),
  jf: () => schema(),
  vf: () => schema(),
  Oi: () => "/codex-home",
  Gl: "CODEX_CLI_PATH",
  Fn: () => null,
  Pn: () => null,
};

const helperRoot = path.join(os.tmpdir(), "com.openai.sky.CUAService");
await fs.mkdir(helperRoot, { recursive: true });
const screenshotPath = path.join(helperRoot, `capture-${process.pid}.png`);
await fs.writeFile(screenshotPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
let activeScreenshotPath = screenshotPath;

const calls = [];
let eventListener = null;
let exitListener = null;
let stopCalls = 0;
let closeCalls = 0;
let loadCalls = 0;
const transport = {
  onEvent(listener) {
    eventListener = listener;
    return () => {
      stopCalls += 1;
      eventListener = null;
    };
  },
  onExit(listener) {
    exitListener = listener;
  },
  async request(method, payload, options) {
    calls.push({ method, payload, options });
    switch (method) {
      case "get_appshot_target":
        return {
          app: "process:C:\\Program Files\\Editor.exe",
          displayName: "Editor",
          frame: { x: 1, y: 2, width: 800, height: 600 },
          id: 42,
          title: "Document",
        };
      case "list_apps":
        return [{ id: "editor", displayName: "Visual Editor", windows: [{ id: 42 }] }];
      case "prepare_appshot_capture":
      case "set_appshot_hotkey":
      case "finish_appshot_capture":
      case "cancel_prepared_appshot_capture":
        return {};
      case "begin_prepared_appshot_capture":
      case "begin_appshot_capture":
        return {
          animationDuration: 0.25,
          transitionId: "transition-1",
          transitionSnapshotHeight: 320,
          transitionSpringDampingFraction: 0.8,
          transitionSpringResponse: 0.4,
        };
      case "load_appshot_capture_source":
        return { screenshots: [{ url: pathToFileURL(activeScreenshotPath).href }] };
      case "complete_appshot_capture":
        return {
          accessibility: { tree: "editor tree" },
          screenshots: [],
          transitionSnapshotURL: pathToFileURL(activeScreenshotPath).href,
        };
      default:
        throw Error(`Unexpected method: ${method}`);
    }
  },
  async close() {
    closeCalls += 1;
  },
};

const origin = { id: 7 };
const nativeHandle = Buffer.alloc(8);
nativeHandle.writeBigUInt64LE(1234n);
const electronWindow = {
  isDestroyed: () => false,
  getNativeWindowHandle: () => nativeHandle,
  getContentBounds: () => ({ x: 100, y: 50, width: 900, height: 700 }),
};
const { Wit } = createWindowsNativeCaptureBridgeModule({
  n,
  r: { i: () => () => ({ warning: (...args) => logs.push(args) }) },
  c: { fileURLToPath, pathToFileURL },
  h: { default: path },
  p: { default: os },
  b: fs,
  _: { randomUUID: () => "prepared-token" },
  l: { BrowserWindow: { fromWebContents: (value) => value === origin ? electronWindow : null }, app: {} },
  o: { t: () => "/resources" },
  oH: async () => null,
  fi: () => ({ codexCliPath: null }),
});

const bridge = Wit({
  decorateApp: async (app) => ({ iconSmallDataURL: `icon:${app}` }),
  loadHelperTransport: async () => {
    loadCalls += 1;
    return transport;
  },
});

const hotkeyEvents = [];
const registration = bridge.registerHotkey("left-alt + right_alt", {
  onPressed: () => hotkeyEvents.push("pressed"),
  onReleased: () => hotkeyEvents.push("released"),
  onRegistrationFailed: () => hotkeyEvents.push("failed"),
});
await flush();
equal(registration?.handlesRelease, true);
equal(loadCalls, 1);
equal(calls.filter(({ method }) => method === "set_appshot_hotkey").map(({ payload }) => payload), [{ hotkey: "DoubleAlt" }]);

eventListener({ event: "appshotHotkey", phase: "down" });
bridge.claimHotkeyFlight(origin);
const frontmost = await bridge.getFrontmostWindow(origin);
equal(hotkeyEvents, ["pressed"]);
equal(frontmost, {
  bundleIdentifier: "process:C:\\Program Files\\Editor.exe",
  iconSmallDataURL: "icon:process:C:\\Program Files\\Editor.exe",
  name: "Visual Editor",
  windowTitle: "Document",
});
equal(calls.find(({ method }) => method === "get_appshot_target")?.payload, { preferLatched: true });

const updates = [];
const capturePromise = bridge.startCapture({
  animationTarget: {
    codexDisplay: { scaleFactor: 2 },
    destinationBackgroundColor: "#fff",
    destinationCornerRadius: 12,
    destinationFrame: { x: 130, y: 90, width: 400, height: 300 },
    destinationPrimaryTextColor: "#000",
  },
  bundleIdentifier: "process:C:\\Program Files\\Editor.exe",
  emitUpdate: (update) => updates.push(update),
  origin,
  requestId: "request-1",
  soundEnabled: true,
});
await flush();
equal(calls.some(({ method }) => method === "prepare_appshot_capture"), true);
eventListener({ event: "appshotHotkey", phase: "up" });
equal(await capturePromise, {
  result: "started",
  animationDuration: 0.25,
  transitionSnapshotHeight: 320,
  transitionSpringDampingFraction: 0.8,
  transitionSpringResponse: 0.4,
});
equal(hotkeyEvents, ["pressed", "released"]);

await waitUntil(() => updates.at(-1)?.type === "completed");
await bridge.release();
equal(updates.map(({ type }) => type), ["metadata", "screenshot", "axText", "completed"]);
equal(updates[1].screenshotPath, await fs.realpath(screenshotPath));
equal(updates[1].screenshotDataURL, "data:image/png;base64,iVBORw==");
equal(updates[2].text, "editor tree");
equal(calls.filter(({ method }) => method === "finish_appshot_capture").length, 1);
equal(calls.find(({ method }) => method === "prepare_appshot_capture")?.payload.animationTarget, {
  appIconDataURL: "icon:process:C:\\Program Files\\Editor.exe",
  destinationBackgroundColor: "#fff",
  destinationContentFrame: { x: 30, y: 40, width: 400, height: 300 },
  destinationCornerRadius: 12,
  destinationFrame: { x: 130, y: 90, width: 400, height: 300 },
  destinationPrimaryTextColor: "#000",
  destinationProcessId: process.pid,
  destinationWindowHandle: "1234",
  displayScaleFactor: 2,
  soundEnabled: true,
  sourceCornerRadius: 8,
  titleText: "Document",
  transitionSnapshotFrame: { x: 30, y: 40, width: 400, height: 300 },
});
equal(closeCalls, 1);

const recovery = Wit({ loadHelperTransport: async () => transport });
recovery.registerHotkey("DoubleShift", {});
await flush();
const registrationsBeforeExit = calls.filter(({ method }) => method === "set_appshot_hotkey").length;
exitListener();
await flush();
equal(calls.filter(({ method }) => method === "set_appshot_hotkey").length, registrationsBeforeExit + 1);
await recovery.dispose();
equal(recovery.registerHotkey("DoubleShift", {}), null);
equal(stopCalls >= 2, true);
equal(logs, []);

let resolveSingleFlight;
let singleFlightLoads = 0;
const singleFlightBridge = Wit({
  loadHelperTransport: () => {
    singleFlightLoads += 1;
    return new Promise((resolve) => {
      resolveSingleFlight = resolve;
    });
  },
});
singleFlightBridge.registerHotkey("DoubleAlt", {});
const singleFlightWindow = singleFlightBridge.getFrontmostWindow(origin);
equal(singleFlightLoads, 1);
resolveSingleFlight(transport);
await flush();
equal((await singleFlightWindow)?.bundleIdentifier, "process:C:\\Program Files\\Editor.exe");
await singleFlightBridge.dispose();

const cancelBridge = Wit({ loadHelperTransport: async () => transport });
cancelBridge.registerHotkey("DoubleAlt", {});
await flush();
eventListener({ event: "appshotHotkey", phase: "down" });
cancelBridge.claimHotkeyFlight(origin);
await cancelBridge.getFrontmostWindow(origin);
const cancellation = new AbortController();
const cancelledCapture = cancelBridge.startCapture({
  animationTarget: {
    codexDisplay: { scaleFactor: 1 },
    destinationBackgroundColor: "#fff",
    destinationCornerRadius: 0,
    destinationFrame: { x: 100, y: 50, width: 100, height: 100 },
    destinationPrimaryTextColor: "#000",
  },
  bundleIdentifier: "process:C:\\Program Files\\Editor.exe",
  emitUpdate: () => undefined,
  origin,
  requestId: "cancelled-request",
  signal: cancellation.signal,
  soundEnabled: false,
});
await flush();
cancellation.abort();
equal(await cancelledCapture, null);
await flush();
equal(calls.some(({ method }) => method === "cancel_prepared_appshot_capture"), true);
await cancelBridge.dispose();

const oversizedPath = path.join(helperRoot, `oversized-${process.pid}.png`);
await fs.writeFile(oversizedPath, Buffer.alloc(0));
await fs.truncate(oversizedPath, 26 * 1024 * 1024);
activeScreenshotPath = oversizedPath;
const oversizedBridge = Wit({ loadHelperTransport: async () => transport });
await oversizedBridge.getFrontmostWindow(origin);
const oversizedUpdates = [];
equal((await oversizedBridge.startCapture({
  animationTarget: {
    codexDisplay: { scaleFactor: 1 },
    destinationBackgroundColor: "#fff",
    destinationCornerRadius: 0,
    destinationFrame: { x: 100, y: 50, width: 100, height: 100 },
    destinationPrimaryTextColor: "#000",
  },
  bundleIdentifier: "process:C:\\Program Files\\Editor.exe",
  emitUpdate: (update) => oversizedUpdates.push(update),
  origin,
  requestId: "oversized-request",
  soundEnabled: false,
}))?.result, "started");
await waitUntil(() => oversizedUpdates.at(-1)?.type === "failed");
equal(oversizedUpdates.map(({ type }) => type), ["metadata", "failed"]);
equal(oversizedUpdates.at(-1), { failureReason: "native_completion_failed", type: "failed" });
equal(calls.filter(({ method }) => method === "finish_appshot_capture").length, 2);
await oversizedBridge.dispose();

registration.unregister();
await bridge.dispose();
await fs.rm(screenshotPath, { force: true });
await fs.rm(oversizedPath, { force: true });

console.log(`main windows native capture bridge tests passed (${assertions} assertions)`);
