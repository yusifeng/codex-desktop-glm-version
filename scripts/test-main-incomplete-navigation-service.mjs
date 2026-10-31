import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/incomplete-navigation-service.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
});
const { createIncompleteNavigationRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const logs = [];
const scopes = [];
class DisposableBase {}
const runtime = createIncompleteNavigationRuntime({
  DisposableBase,
  createAsyncScope: () => { const scope = { d: () => scopes.push("disposed"), u: (value) => value }; scopes.push(scope); return scope; },
  createLogger: () => () => ({ info: (message) => logs.push(message) }),
});

const owner = { once(_event, listener) { this.destroy = listener; } };
const delivered = [];
let broken;
let disposed = 0;
const listener = async (input) => { delivered.push(input); };
listener.dup = () => listener;
listener.onRpcBroken = (callback) => { broken = callback; };
listener[Symbol.dispose] = () => { disposed += 1; };
const subscription = new runtime.IncompleteNavigationSubscription(owner);
subscription.subscribe(listener);
runtime.reportIncompleteNavigation({ trigger: "tab-closed" });
await new Promise((resolve) => setImmediate(resolve));
equal(delivered, [{ trigger: "tab-closed" }]);
equal(scopes.at(-1), "disposed");
broken();
equal(disposed, 1);
runtime.reportIncompleteNavigation({ trigger: "ignored" });
await new Promise((resolve) => setImmediate(resolve));
equal(delivered.length, 1);

const originalNow = Date.now;
let now = 1_000;
Date.now = () => now;
const timedOut = [];
const observer = runtime.createNavigationObserver((value) => timedOut.push(value));
observer.handleStageChanged({ navigationId: "navigation", phase: "started" });
now = 7_500;
equal(observer.takeObservation(5_000), {
  lastObservedPhase: "started",
  totalNavigationDurationMs: 6_500,
  lastObservedPhaseDurationMs: 6_500,
});
equal(observer.takeObservation(0), null);

const eventListeners = new Map();
const webContents = {
  on(event, listener) { eventListeners.set(event, listener); },
  removeListener(event, listener) { if (eventListeners.get(event) === listener) eventListeners.delete(event); },
};
const attached = runtime.attachNavigationObserver(webContents, (value) => timedOut.push(value));
equal(eventListeners.has("main-frame-navigation-stage-changed"), true);
eventListeners.get("main-frame-navigation-stage-changed")({}, { navigationId: "second", phase: "requesting" });
now = 8_000;
equal(attached.takeObservation(100), {
  lastObservedPhase: "requesting",
  totalNavigationDurationMs: 500,
  lastObservedPhaseDurationMs: 500,
});
attached.dispose();
equal(eventListeners.size, 0);
Date.now = originalNow;
owner.destroy();
equal(disposed, 1, "destroy after unsubscribe is idempotent");
equal(logs, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/incomplete-navigation-service.js")'), true);
for (const oldOwner of ["IXe = class", "function RX(", "function UXe(", "function WXe("]) equal(main.includes(oldOwner), false);
console.log(`${assertions} main incomplete navigation service assertions passed`);
