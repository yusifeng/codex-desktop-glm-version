import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { createAirpodsMicrophoneMuteRuntime } from "../src/main/main-app/realtime/airpods-microphone-mute.ts";

const powerMonitor = new EventEmitter();
const addonCalls = [];
let nativeEvent;
let restartError = null;
const addon = {
  start(callback) { addonCalls.push(["start"]); nativeEvent = callback; },
  setMuted(value) { addonCalls.push(["muted", value]); },
  stop() { addonCalls.push(["stop"]); },
  restartCapture() { addonCalls.push(["restart"]); if (restartError) throw restartError; },
};
const scheduled = [];
const cancelled = [];
const warnings = [];
const loadedPaths = [];
const runtime = createAirpodsMicrophoneMuteRuntime({
  createRequire: () => { throw new Error("unused"); },
  filename: "/app/main.js",
  app: { isPackaged: false, getAppPath: () => "/repo" },
  path,
  processRef: { platform: "darwin", arch: "arm64", resourcesPath: "/resources" },
  osRelease: () => "23.4.0",
  powerMonitor,
  createLogger: () => ({ warning: (...args) => warnings.push(args) }),
  setImmediate: (callback) => { const handle = { callback }; scheduled.push(handle); return handle; },
  clearImmediate: (handle) => cancelled.push(handle),
  loadAddon: (addonPath) => { loadedPaths.push(addonPath); return addon; },
});
assert.equal(runtime.isAirpodsMicrophoneMuteSupported(), true);
assert.equal(runtime.loadAirpodsMuteAddon(), addon);
assert.equal(loadedPaths[0], "/repo/native/airpods-mute-addon/build/Release-arm64/airpods_mute.node");

const requested = [];
const companion = new runtime.AirpodsMicrophoneMute((muted) => requested.push(muted));
assert.deepEqual(addonCalls.at(-1), ["start"]);
assert.equal(powerMonitor.listenerCount("resume"), 1);
companion.acknowledgeMuted(true);
assert.deepEqual(addonCalls.at(-1), ["muted", true]);
nativeEvent({ kind: "mute-requested", muted: false });
assert.deepEqual(requested, [false]);

nativeEvent({ kind: "capture-changed" });
nativeEvent({ kind: "capture-changed" });
powerMonitor.emit("resume");
assert.equal(scheduled.length, 1);
scheduled[0].callback();
assert.deepEqual(addonCalls.at(-1), ["restart"]);
assert.equal(companion.recovery, undefined);

restartError = new Error("restart failed");
powerMonitor.emit("resume");
scheduled[1].callback();
assert.equal(warnings.length, 1);
assert.match(warnings[0][0], /recover AirPods companion capture/);
assert.equal(companion.stopped, false);

powerMonitor.emit("resume");
const pending = scheduled[2];
companion.stop();
companion.stop();
assert.equal(companion.stopped, true);
assert.equal(powerMonitor.listenerCount("resume"), 0);
assert.deepEqual(cancelled, [pending]);
assert.equal(addonCalls.filter((call) => call[0] === "stop").length, 1);
companion.acknowledgeMuted(false);
assert.equal(addonCalls.some((call) => call[0] === "muted" && call[1] === false), false);

const throwingPowerMonitor = new EventEmitter();
const throwingWarnings = [];
let throwingEvent;
const throwingAddon = {
  start(callback) { throwingEvent = callback; },
  setMuted() {},
  stop() { addonCalls.push(["throwing-stop"]); },
  restartCapture() {},
};
const throwingRuntime = createAirpodsMicrophoneMuteRuntime({
  createRequire: () => null,
  filename: "main.js",
  app: { isPackaged: true, getAppPath: () => "/unused" },
  path,
  processRef: { platform: "linux", arch: "x64", resourcesPath: "/packaged" },
  osRelease: () => "99.0.0",
  powerMonitor: throwingPowerMonitor,
  createLogger: () => ({ warning: (...args) => throwingWarnings.push(args) }),
  setImmediate: (callback) => ({ callback }),
  clearImmediate: () => {},
  loadAddon: (addonPath) => { loadedPaths.push(addonPath); return throwingAddon; },
});
assert.equal(throwingRuntime.isAirpodsMicrophoneMuteSupported(), false);
const throwingCompanion = new throwingRuntime.AirpodsMicrophoneMute(() => { throw new Error("forward failed"); });
assert.equal(loadedPaths.at(-1), "/packaged/native/airpods-mute.node");
throwingEvent({ kind: "mute-requested", muted: true });
assert.equal(throwingCompanion.stopped, true);
assert.equal(throwingWarnings.length, 1);
assert.match(throwingWarnings[0][0], /forward AirPods mute request/);
assert.equal(throwingPowerMonitor.listenerCount("resume"), 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createAirpodsMicrophoneMuteRuntime\(\{/);
assert.doesNotMatch(main, /f8e = class/);
assert.doesNotMatch(main, /function u8e\(/);
assert.doesNotMatch(main, /function d8e\(/);
assert.match(main, /start: \(e\) => new f8e\(e\)/);

console.log("AirPods microphone mute assertions: 30");
