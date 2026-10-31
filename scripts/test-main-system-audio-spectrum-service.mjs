import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { createSystemAudioSpectrumRuntime } from "../src/main/main-app/capture/system-audio-spectrum-service.ts";

const flush = () => new Promise((resolve) => setImmediate(resolve));
assert.equal(
  createSystemAudioSpectrumRuntime({ RpcHandlerBase: class {}, platform: "linux", getSystemVersion: () => "15.0", loadSpectrumCapture: async () => ({}) }).createSystemAudioSpectrumService(new EventEmitter()),
  undefined,
);
assert.equal(
  createSystemAudioSpectrumRuntime({ RpcHandlerBase: class {}, platform: "darwin", getSystemVersion: () => "14.1", loadSpectrumCapture: async () => ({}) }).createSystemAudioSpectrumService(new EventEmitter()),
  undefined,
);

let captureInstances = 0;
let captureListener;
let captureUnsubscribes = 0;
class SpectrumCapture {
  constructor() { captureInstances += 1; }
  subscribe(listener) { captureListener = listener; return () => { captureUnsubscribes += 1; }; }
}
const runtime = createSystemAudioSpectrumRuntime({
  RpcHandlerBase: class {},
  platform: "darwin",
  getSystemVersion: () => "14.2",
  loadSpectrumCapture: async () => ({ SpectrumCapture }),
});
const origin = new EventEmitter();
const service = runtime.createSystemAudioSpectrumService(origin);
assert.equal(service instanceof runtime.SystemAudioSpectrumService, true);
assert.equal(origin.listenerCount("destroyed"), 1);
assert.equal(origin.listenerCount("render-process-gone"), 1);

const events = [];
let callbackBroken;
let callbackDisposals = 0;
let resolveLevel;
const callback = (event) => {
  events.push(event);
  if (event.type === "levels") return new Promise((resolve) => { resolveLevel = resolve; });
  return Promise.resolve();
};
callback.onRpcBroken = (handler) => { callbackBroken = handler; };
callback[Symbol.dispose] = () => { callbackDisposals += 1; };
callback.dup = () => callback;
const subscription = service.subscribe({ dup: () => callback });
await flush();
assert.equal(captureInstances, 1);
assert.equal(typeof captureListener, "function");
captureListener({ type: "levels", values: [1] });
captureListener({ type: "levels", values: [2] });
assert.equal(events.length, 1);
resolveLevel();
await flush();
captureListener({ type: "levels", values: [3] });
assert.equal(events.length, 2);
resolveLevel();
await flush();
captureListener({ type: "state", active: true });
await flush();
assert.equal(events.length, 3);
assert.equal(typeof callbackBroken, "function");
callbackBroken();
assert.equal(captureUnsubscribes, 1);
assert.equal(callbackDisposals, 1);
subscription.unsubscribe();
assert.equal(callbackDisposals, 1);

const secondEvents = [];
const second = (event) => { secondEvents.push(event); return Promise.resolve(); };
second.onRpcBroken = () => {};
second[Symbol.dispose] = () => { callbackDisposals += 1; };
const secondSubscription = service.subscribe({ dup: () => second });
assert.equal(captureInstances, 1);
captureListener({ type: "error", reason: "capture-failed" });
await flush();
assert.deepEqual(secondEvents, [{ type: "error", reason: "capture-failed" }]);
assert.equal(captureUnsubscribes, 2);
assert.equal(callbackDisposals, 2);
secondSubscription.unsubscribe();

origin.emit("render-process-gone");
assert.equal(origin.listenerCount("destroyed"), 0);
assert.equal(origin.listenerCount("render-process-gone"), 0);

let failedDisposed = 0;
const failureRuntime = createSystemAudioSpectrumRuntime({
  RpcHandlerBase: class {}, platform: "darwin", getSystemVersion: () => "15.0",
  loadSpectrumCapture: async () => { throw new Error("load failed"); },
});
const failedService = failureRuntime.createSystemAudioSpectrumService(new EventEmitter());
const failedEvents = [];
const failedCallback = (event) => { failedEvents.push(event); return Promise.resolve(); };
failedCallback.onRpcBroken = () => {};
failedCallback[Symbol.dispose] = () => { failedDisposed += 1; };
failedService.subscribe({ dup: () => failedCallback });
await flush();
await flush();
assert.deepEqual(failedEvents, [{ type: "error", reason: "capture-failed" }]);
assert.equal(failedDisposed, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createSystemAudioSpectrumService: ntt/);
assert.match(main, /SystemAudioSpectrumService: rtt/);
assert.match(main, /SystemAudioSpectrumSubscription: itt/);
assert.doesNotMatch(main, /rtt = class/);
assert.doesNotMatch(main, /itt = class/);
assert.match(main, /systemAudioSpectrum: ntt\(e\)/);

console.log("system audio spectrum service assertions: 34");
