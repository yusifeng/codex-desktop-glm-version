import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/device/codex-micro-service-manager.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createCodexMicroServiceManagerClass } = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const flush = () => new Promise((resolve) => setImmediate(resolve));

const windowOne = { id: "one", destroyed: false, isDestroyed() { return this.destroyed; } };
const windowTwo = { id: "two", destroyed: false, isDestroyed() { return this.destroyed; } };
let primaryWindow = windowOne;
let primarySubscriber;
let unsubscribed = 0;
const messages = [];
const shown = [];
const windowManager = {
  subscribePrimaryWindowChanges(callback) { primarySubscriber = callback; return () => { unsubscribed += 1; }; },
  getPrimaryWindow: () => primaryWindow,
  sendMessageToAllWindows: (message) => messages.push(["all", message]),
  sendMessageToWindow: (window, message) => messages.push([window.id, message]),
  showWindow: (window, options) => { shown.push([window.id, options]); return true; },
};

let serviceOptions;
let serviceState = { status: "connected", transport: "usb", model: "micro", error: null, battery: 80 };
let starts = 0;
let stops = 0;
let disposals = 0;
let loadCount = 0;
const lighting = [];
class FakeService {
  constructor(options) { serviceOptions = options; }
  start() { starts += 1; }
  getState() { return serviceState; }
  stop() { stops += 1; }
  dispose() { disposals += 1; }
  updateLighting(input) { lighting.push(input); return `lighting:${input}`; }
}
let locked = false;
let now = 1_000;
let intervalId = 0;
const intervals = new Map();
const clearedIntervals = [];
const loggerErrors = [];
const CodexMicroServiceManager = createCodexMicroServiceManagerClass({
  logger: { error: (...args) => loggerErrors.push(args) },
  async loadServiceClass() { loadCount += 1; return FakeService; },
  getSystemIdleState: () => locked ? "locked" : "active",
  setInterval(callback, milliseconds) {
    const handle = { id: ++intervalId, milliseconds, unrefCalled: false, unref() { this.unrefCalled = true; } };
    intervals.set(handle.id, { callback, handle });
    return handle;
  },
  clearInterval(handle) { clearedIntervals.push(handle.id); intervals.delete(handle.id); },
  now: () => now,
});

let ensuredWindow = windowTwo;
const manager = new CodexMicroServiceManager({ windowManager, ensureWindow: async () => ensuredWindow });
const [state, lightingResult] = await Promise.all([manager.getState(), manager.updateLighting("blue")]);
equal(loadCount, 1, "concurrent public calls share one dynamic service load");
equal(state, serviceState);
equal(starts, 1);
equal(lightingResult, "lighting:blue");
equal(lighting, ["blue"]);
equal(intervals.size, 1);
equal(intervals.values().next().value.handle.milliseconds, 250);
equal(intervals.values().next().value.handle.unrefCalled, true);

primarySubscriber(windowOne);
equal(messages.at(-1), ["one", { type: "codex-micro-window-ownership-changed", isOwner: true }]);
locked = true;
intervals.values().next().value.callback();
equal(messages.at(-1), ["one", { type: "codex-micro-window-ownership-changed", isOwner: false }]);
primarySubscriber(windowTwo);
equal(messages.at(-1)[1].isOwner, false, "locked primary changes do not acquire ownership");
locked = false;
intervals.values().next().value.callback();
equal(messages.at(-1), ["one", { type: "codex-micro-window-ownership-changed", isOwner: true }]);

messages.length = 0;
serviceOptions.onDeviceStateChanged({ status: "detected", transport: "usb" }, "device-lifecycle");
equal(messages[0][0], "all");
equal(messages[1][1].transition, null);
serviceOptions.onDeviceStateChanged({ status: "error", transport: "usb" }, "device-lifecycle");
equal(messages.at(-1)[1].transition, "connection-failed");
const lifecycleCount = messages.filter((entry) => entry[1].type === "codex-micro-device-lifecycle").length;
serviceOptions.onDeviceStateChanged({ status: "not-detected", transport: null }, "device-lifecycle");
equal(messages.filter((entry) => entry[1].type === "codex-micro-device-lifecycle").length, lifecycleCount);
serviceOptions.onDeviceStateChanged({ status: "connected", transport: "usb" }, "device-lifecycle");
equal(messages.at(-1)[1].transition, "connected");
serviceOptions.onDeviceStateChanged({ status: "error", transport: "usb" }, "device-lifecycle");
equal(messages.at(-1)[1].transition, "connection-lost");
serviceOptions.onDeviceStateChanged({ status: "connected", transport: "usb" }, "device-lifecycle");
equal(messages.at(-1)[1].transition, "reconnected");
serviceOptions.onDeviceStateChanged({ status: "not-detected", transport: null }, "transport-handoff");
const handoffCount = messages.filter((entry) => entry[1].type === "codex-micro-device-lifecycle").length;
serviceOptions.onDeviceStateChanged({ status: "error", transport: "bluetooth" }, "device-lifecycle");
equal(messages.at(-1)[1].transition, "connection-lost");
equal(messages.at(-1)[1].transport, "usb");
equal(messages.filter((entry) => entry[1].type === "codex-micro-device-lifecycle").length, handoffCount + 1);
equal(intervals.size, 0, "leaving connected state stops the lock monitor");

messages.length = 0;
primaryWindow = windowOne;
serviceOptions.onJoystickEvent({ x: 1 });
equal(messages.at(-1), ["one", { type: "codex-micro-joystick-event", event: { x: 1 } }]);
locked = true;
serviceOptions.onJoystickEvent({ x: 2 });
equal(messages.some((entry) => entry[1].event?.x === 2), false);
locked = false;

manager.updateAgentThreadKeys(["thread-1"], ["thread"]);
messages.length = 0;
shown.length = 0;
serviceOptions.onHidEvent({ act: 0, slot: 0 });
equal(messages.at(-1)[1].type, "codex-micro-hid-event");
serviceOptions.onHidEvent({ act: 1, slot: 0 });
equal(shown.length, 0);
now += 300;
serviceOptions.onHidEvent({ act: 1, slot: 0 });
equal(shown, [["one", { stealFocus: true }]], "matching second tap focuses the owner window");

shown.length = 0;
manager.updateAgentThreadKeys(["thread-1"], ["thread"], true);
serviceOptions.onHidEvent({ act: 1, slot: 0 });
equal(shown.length, 1, "single-tap mode confirms agent keys immediately");
shown.length = 0;
manager.updateAgentThreadKeys([null], ["action"], false);
serviceOptions.onHidEvent({ act: 1, slot: 0, threadKey: "action-thread" });
equal(shown.length, 0, "action keys do not focus an existing owner window");

primaryWindow = null;
manager.updateAgentThreadKeys(["thread-2"], ["thread"], false);
serviceOptions.onHidEvent({ act: 1, slot: 0 });
now += 200;
serviceOptions.onHidEvent({ act: 1, slot: 0 });
await flush();
equal(messages.at(-1)[0], "two");
equal(messages.at(-1)[1].event.threadKey, "thread-2");
equal(shown.at(-1), ["two", { stealFocus: true }]);

manager.updateAgentThreadKeys([null], ["action"], false);
serviceOptions.onHidEvent({ act: 1, slot: 0, threadKey: "action-thread" });
await flush();
equal(messages.at(-1)[1].event.threadKey, "action-thread");
equal(shown.at(-1)[0], "two");

ensuredWindow = null;
serviceOptions.onHidEvent({ act: 1, slot: 0, threadKey: "no-window" });
await flush();
equal(shown.at(-1)[0], "two", "null ensure result does not show a window");
locked = true;
const messageCountBeforeLockedHid = messages.length;
serviceOptions.onHidEvent({ act: 1, slot: 0 });
equal(messages.length, messageCountBeforeLockedHid);
locked = false;

await manager.stop();
equal(stops, 1);
manager.dispose();
equal(unsubscribed, 1);
equal(disposals, 1);

let resolveDeferredClass;
let deferredDisposed = 0;
class DeferredService extends FakeService { dispose() { deferredDisposed += 1; } }
const DeferredManager = createCodexMicroServiceManagerClass({
  logger: { error() {} },
  loadServiceClass: () => new Promise((resolve) => { resolveDeferredClass = resolve; }),
  getSystemIdleState: () => "active",
  setInterval: () => ({ unref() {} }),
  clearInterval() {},
  now: () => 0,
});
const deferredManager = new DeferredManager({ windowManager, ensureWindow: async () => null });
const deferredLighting = deferredManager.updateLighting("deferred");
await flush();
deferredManager.dispose();
resolveDeferredClass(DeferredService);
await deferredLighting;
await flush();
equal(deferredDisposed, 1, "dispose before dynamic load completion disposes the eventual service");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("CodexMicroServiceManager = createCodexMicroServiceManagerClass({"), true);
for (const symbol of ["aA", "oA", "sA", "lA"]) equal(new RegExp(`\\b${symbol}\\b`).test(main), false, `${symbol} must be removed`);
equal(windowContext.includes("new CodexMicroServiceManager({"), true);

console.log(`${assertions} main Codex Micro service manager assertions passed`);
