import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimePresentationCoordinatorClass } from "../src/main/main-app/realtime/presentation-coordinator.ts";

class CallbackWrapper {
  constructor(callback) {
    const wrapped = (value) => callback(value);
    wrapped.unsubscribe = () => { wrapped.unsubscribed = true; };
    wrapped[Symbol.dispose] = () => { wrapped.disposed = true; };
    return wrapped;
  }
}
const timers = [];
const cleared = [];
const Coordinator = createRealtimePresentationCoordinatorClass({
  runtime: { Uf: class {}, Hf: CallbackWrapper },
  createUsingScope: () => ({ e: undefined, u: (value) => value, d: () => {} }),
  setTimer: (callback, delay) => { const timer = { callback, delay }; timers.push(timer); return timer; },
  clearTimer: (timer) => cleared.push(timer),
  surfaceWaitMs: 180,
  nativeFallbackDelayMs: 50,
  focusGraceMs: 250,
});
let voiceListener;
let voiceUnsubscribed = 0;
const voice = {
  subscribe(listener) { voiceListener = listener; return { unsubscribe: () => { voiceUnsubscribed += 1; } }; },
};
let focusListener;
let focusUnsubscribed = 0;
const visibility = [];
const motion = [];
let dockCallback;
const options = {
  overlayFocus: { subscribe(listener) { focusListener = listener; return () => { focusUnsubscribed += 1; }; } },
  overlayVisibility: { setVisibility: (value) => visibility.push(value) },
  overlayMotion: {
    cancelDock: () => motion.push(["cancel"]),
    setDockTarget: (...args) => motion.push(["target", ...args]),
    restoreAccessories: () => motion.push(["restore"]),
    preparePresentationForFadeIn: () => motion.push(["prepare"]),
    presentFrom: (...args) => motion.push(["present", ...args]),
    dockTo: (anchor, callback) => { motion.push(["dock", anchor]); dockCallback = callback; },
    fadeOutPresentation: (callback) => { motion.push(["fade"]); callback(); },
    updatePresentationOffset: (offset) => motion.push(["offset", offset]),
  },
};
const created = Coordinator.create(voice, options);
const coordinator = created.rpc;
assert.deepEqual(coordinator.getSnapshot(), { active: null });

const snapshots = [];
let subscriberBroken;
let subscriberDisposals = 0;
const subscriber = (snapshot) => snapshots.push(snapshot);
subscriber.onRpcBroken = (callback) => { subscriberBroken = callback; };
subscriber[Symbol.dispose] = () => { subscriberDisposals += 1; };
const subscription = coordinator.subscribe({ dup: () => subscriber });
assert.deepEqual(snapshots, [{ active: null }]);

const locator = { hostId: "local", conversationId: "thread" };
const mainToasts = [];
let mainBroken;
let mainDisposals = 0;
const mainToast = async (toast) => { mainToasts.push(toast); };
mainToast.onRpcBroken = (callback) => { mainBroken = callback; };
mainToast[Symbol.dispose] = () => { mainDisposals += 1; };
const mainSurface = coordinator.registerSurface(locator, "main-thread", true, false, { dup: () => mainToast });
mainSurface.updateAnchor({ x: 10, y: 20 });

const overlayToasts = [];
let overlayDisposals = 0;
const overlayToast = async (toast) => { overlayToasts.push(toast); };
overlayToast.onRpcBroken = () => {};
overlayToast[Symbol.dispose] = () => { overlayDisposals += 1; };
const overlaySurface = coordinator.registerSurface(locator, "global-overlay", true, false, { dup: () => overlayToast });
overlaySurface.updateAnchor({ x: 1, y: 2 });

voiceListener({
  phase: "active",
  locator,
  preferredPresentationSurface: "main-thread",
});
assert.equal(coordinator.getSnapshot().active.surface, "main-thread");
assert.equal(visibility.at(-1), false);
assert.equal(await coordinator.reportToast(locator, { message: "main" }), true);
assert.deepEqual(mainToasts, [{ message: "main" }]);

coordinator.requestSurface(locator, "global-overlay", { origin: { x: 10 }, velocity: { x: 1 } });
assert.equal(coordinator.getSnapshot().active.surface, "global-overlay");
assert.equal(coordinator.getSnapshot().active.handoff, null);
assert.equal(visibility.at(-1), true);
assert.equal(motion.some((call) => call[0] === "present"), true);
assert.equal(await coordinator.reportToast(locator, { message: "overlay" }), true);
assert.deepEqual(overlayToasts, [{ message: "overlay" }]);
overlaySurface.updatePresentationOffset({ x: 3, y: 4 });
assert.deepEqual(motion.at(-1), ["offset", { x: 3, y: 4 }]);

coordinator.requestSurface(locator, "main-thread", null);
assert.deepEqual(motion.at(-1), ["dock", { x: 10, y: 20 }]);
assert.equal(coordinator.getSnapshot().active.surface, "global-overlay");
dockCallback({ origin: { x: 10, y: 20 }, velocity: null });
assert.equal(coordinator.getSnapshot().active.surface, "main-thread");
assert.equal(visibility.at(-1), false);

mainSurface.updateEligibility(false);
assert.equal(coordinator.getSnapshot().active.surface, "global-overlay");
mainSurface.updateEligibility(true);
assert.equal(coordinator.getSnapshot().active.surface, "global-overlay");
dockCallback({ origin: { x: 10, y: 20 }, velocity: null });
assert.equal(coordinator.getSnapshot().active.surface, "main-thread");
focusListener(true);
focusListener(false);
assert.equal(typeof focusListener, "function");

assert.equal(coordinator.reportToast({ hostId: "other", conversationId: "thread" }, {} ) instanceof Promise, true);
assert.equal(await coordinator.reportToast({ hostId: "other", conversationId: "thread" }, {}), false);

voiceListener({ phase: "inactive", locator: null, preferredPresentationSurface: null });
assert.deepEqual(coordinator.getSnapshot(), { active: null });
assert.equal(visibility.at(-1), null);
assert.equal(mainDisposals, 1);
assert.equal(overlayDisposals, 1);
assert.equal(snapshots.at(-1).active, null);

mainSurface.unregister();
mainSurface.unregister();
overlaySurface[Symbol.dispose]();
assert.equal(mainDisposals, 1);
assert.equal(overlayDisposals, 1);
assert.equal(typeof subscriberBroken, "function");
subscriberBroken();
assert.equal(subscriberDisposals, 1);
subscription.unsubscribe();
assert.equal(subscriberDisposals, 1);

created.dispose();
created.dispose();
assert.equal(voiceUnsubscribed, 2);
assert.equal(focusUnsubscribed, 2);
assert.equal(visibility.at(-1), null);
assert.equal(timers.every((timer) => [50, 180, 250].includes(timer.delay)), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /G8e = createRealtimePresentationCoordinatorClass\(\{/);
assert.doesNotMatch(main, /G8e = class/);
assert.doesNotMatch(main, /function R2\(/);
assert.match(main, /w = G8e\.create\(C\.rpc/);

console.log("realtime presentation coordinator assertions: 38");
