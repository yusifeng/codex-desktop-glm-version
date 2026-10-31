import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeVoiceHostCoordinatorClass } from "../src/main/main-app/realtime/voice-host-coordinator.ts";

let uuid = 0;
let clock = 5_000;
const warnings = [];
const Coordinator = createRealtimeVoiceHostCoordinatorClass({
  runtime: { Uf: class {} },
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  randomUUID: () => `claim-${++uuid}`,
  createUsingScope: () => ({ e: undefined, u: (value) => value, d: () => {} }),
  now: () => ++clock,
});
const locator = { hostId: "local", conversationId: "thread-one" };
const otherLocator = { hostId: "local", conversationId: "thread-two" };
let eventListener;
let eventSourceDisposals = 0;
const eventSource = {
  subscribe(listener) { eventListener = listener; return () => { eventSourceDisposals += 1; }; },
};
const stoppedLocators = [];
const controllerCalls = [];
let controllerBroken;
let controllerDisposals = 0;
const duplicateController = {
  async control(command) { controllerCalls.push(command); },
  async captureScreenContext(request) { controllerCalls.push({ capture: request }); return { image: "captured" }; },
  onRpcBroken(callback) { controllerBroken = callback; },
  [Symbol.dispose]() { controllerDisposals += 1; },
};
const controllerHandle = { dup: () => duplicateController };
const nativeCalls = [];
let nativeMuteRequest;
const nativeConfig = {
  isEnabled: () => true,
  start(callback) {
    nativeMuteRequest = callback;
    nativeCalls.push(["start"]);
    return {
      acknowledgeMuted: (muted) => nativeCalls.push(["ack", muted]),
      stop: () => nativeCalls.push(["stop"]),
    };
  },
};
const created = Coordinator.create(
  eventSource,
  async (target) => stoppedLocators.push(target),
  nativeConfig,
);
const coordinator = created.rpc;
assert.deepEqual(coordinator.getSnapshot(), {
  activity: "idle",
  locator: null,
  microphoneMuted: false,
  outputMuted: false,
  phase: "inactive",
  preferredPresentationSurface: null,
  sessionId: null,
});
assert.equal(coordinator.isNativeMicrophoneMuteEnabled(), true);

const subscriberSnapshots = [];
let subscriberBroken;
let subscriberDisposals = 0;
const subscriber = (snapshot) => subscriberSnapshots.push(snapshot);
subscriber.onRpcBroken = (callback) => { subscriberBroken = callback; };
subscriber[Symbol.dispose] = () => { subscriberDisposals += 1; };
const subscription = coordinator.subscribe({ dup: () => subscriber });
assert.equal(subscriberSnapshots.length, 1);

const claimId = coordinator.claim(locator, controllerHandle, "overlay", true);
assert.equal(claimId, "claim-1");
assert.equal(coordinator.getRestartBlockers().includes("voice.session"), true);
assert.equal(coordinator.claim(otherLocator, controllerHandle, null, true), null);
coordinator.publish(claimId, {
  activity: "speaking",
  microphoneMuted: false,
  outputMuted: false,
  phase: "active",
});
assert.equal(coordinator.getSnapshot().phase, "active");
assert.equal(coordinator.getSnapshot().locator, locator);
assert.equal(coordinator.getSnapshot().preferredPresentationSurface, "overlay");
assert.equal(typeof coordinator.getSnapshot().connectedAtMs, "number");
assert.deepEqual(nativeCalls, [["start"], ["ack", false]]);

eventListener({ type: "session-started", thread: locator, sessionId: "session-one" });
assert.equal(coordinator.getSnapshot().sessionId, "session-one");
eventListener({ type: "real-delegation", thread: locator, delegation: { delegationId: "d1", tool: "spawnAgent" } });
assert.deepEqual(controllerCalls.at(-1), { type: "record-real-delegation", delegation: { delegationId: "d1", tool: "spawnAgent" } });

assert.equal(coordinator.control(otherLocator, { type: "stop" }), false);
assert.equal(coordinator.controlActive({ type: "toggle-microphone-mute" }), true);
await Promise.resolve();
assert.deepEqual(controllerCalls.at(-1), { type: "set-microphone-muted", muted: true });
coordinator.publish(claimId, {
  activity: "listening",
  microphoneMuted: true,
  outputMuted: false,
  phase: "active",
});
assert.deepEqual(nativeCalls.at(-1), ["ack", true]);
nativeMuteRequest(false);
await Promise.resolve();
assert.deepEqual(controllerCalls.at(-1), { type: "set-microphone-muted", muted: false });

assert.deepEqual(await coordinator.captureScreenContext(locator, { displayId: "display" }), { image: "captured" });
assert.equal(await coordinator.captureScreenContext(otherLocator, {}), null);
coordinator.setDictationActive(true);
assert.deepEqual(controllerCalls.at(-1), { type: "set-dictation-active", active: true });

assert.equal(coordinator.control(locator, { type: "stop" }), true);
assert.equal(coordinator.getSnapshot().phase, "stopping");
assert.deepEqual(nativeCalls.at(-1), ["stop"]);
assert.equal(coordinator.controlActive({ type: "toggle-output-mute" }), true);
coordinator.release(claimId);
assert.equal(coordinator.getSnapshot().phase, "inactive");
assert.equal(controllerDisposals, 1);

const transferCalls = [];
let transferBroken;
const transferController = {
  async control(command) { transferCalls.push(command); },
  async captureScreenContext() { return null; },
  onRpcBroken(callback) { transferBroken = callback; },
  [Symbol.dispose]() { transferCalls.push({ disposed: true }); },
};
const transferId = coordinator.claim(locator, { dup: () => transferController }, null, false);
coordinator.publish(transferId, {
  activity: "idle",
  microphoneMuted: false,
  outputMuted: false,
  phase: "active",
});
assert.equal(coordinator.transfer(locator, otherLocator, { reason: "handoff" }), true);
assert.equal(coordinator.getRestartBlockers().includes("voice.transfer"), true);
assert.equal(coordinator.getSnapshot().transferDestination, otherLocator);
assert.deepEqual(transferCalls.at(-1), { type: "transfer", locator: otherLocator, context: { reason: "handoff" } });
coordinator.cancelTransfer();
assert.equal(coordinator.getRestartBlockers().includes("voice.transfer"), false);

transferBroken();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(stoppedLocators.at(-1), locator);
assert.equal(coordinator.getSnapshot().phase, "inactive");

subscriberBroken();
assert.equal(subscriberDisposals, 1);
subscription.unsubscribe();
assert.equal(subscriberDisposals, 1);
created.dispose();
created.dispose();
assert.equal(eventSourceDisposals, 1);

let disconnectListener;
const disconnectedControls = [];
const disconnected = Coordinator.create(
  { subscribe(listener) { disconnectListener = listener; return () => {}; } },
  async () => {},
  null,
);
const disconnectedController = {
  async control(command) { disconnectedControls.push(command); },
  onRpcBroken() {},
  [Symbol.dispose]() {},
};
const disconnectedId = disconnected.rpc.claim(locator, { dup: () => disconnectedController }, null, false);
disconnected.rpc.publish(disconnectedId, {
  activity: "idle",
  microphoneMuted: false,
  outputMuted: false,
  phase: "active",
});
disconnectListener({ type: "host-disconnected", hostId: "local" });
await Promise.resolve();
assert.deepEqual(disconnectedControls.at(-1), { type: "terminate" });
assert.equal(disconnected.rpc.getSnapshot().phase, "inactive");
disconnected.dispose();

assert.equal(warnings.length, 0);
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /L8e = createRealtimeVoiceHostCoordinatorClass\(\{/);
assert.doesNotMatch(main, /L8e = class/);
assert.doesNotMatch(main, /function F2\(/);
assert.match(main, /C = L8e\.create\(/);

console.log("realtime voice host coordinator assertions: 40");
