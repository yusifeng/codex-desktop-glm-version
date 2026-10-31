import assert from "node:assert/strict";
import fs from "node:fs";
import { createInteractionRpcServices } from "../src/main/main-app/window/interaction-rpc-services.ts";

class RpcHandlerBase {}
const { QuickChatWindowService, RealtimeVoiceRuntimeService } =
  createInteractionRpcServices({ RpcHandlerBase });

const quickCalls = [];
const quickController = {
  addToComposer: (...args) => { quickCalls.push(["add", ...args]); return "added"; },
  clearPrewarm: (...args) => quickCalls.push(["clear", ...args]),
  open: (...args) => { quickCalls.push(["open", ...args]); return "opened"; },
  prewarm: (...args) => quickCalls.push(["prewarm", ...args]),
  handleRendererReady: (...args) => quickCalls.push(["ready", ...args]),
};
const origin = { id: "window-1" };
const quick = new QuickChatWindowService(quickController, origin);
assert.equal(quick instanceof RpcHandlerBase, true);
assert.equal(quick.addToComposer({ text: "hello" }), "added");
quick.clearPrewarm();
assert.equal(quick.open({ conversationId: "thread", contextSourceThread: "source", popoverBounds: { x: 1 } }), "opened");
quick.prewarm();
quick.rendererReady({ mounted: true });
assert.deepEqual(quickCalls, [
  ["add", { text: "hello" }],
  ["clear", origin],
  ["open", origin, "thread", "source", { x: 1 }],
  ["prewarm", origin],
  ["ready", origin, { mounted: true }],
]);

const realtimeCalls = [];
let phase = "inactive";
const voice = {
  getSnapshot: () => ({ phase, locator: "voice-locator" }),
  control: (...args) => realtimeCalls.push(["control", ...args]),
};
let stopGuard;
const realtimeController = {
  registerStarter: (...args) => { realtimeCalls.push(["register", ...args]); stopGuard = args[4]; },
  requestStart: async (...args) => realtimeCalls.push(["request", ...args]),
  cancelStart: (...args) => { realtimeCalls.push(["cancel", ...args]); return "cancelled"; },
  completeSession: (...args) => realtimeCalls.push(["complete", ...args]),
  unregisterStarter: (...args) => realtimeCalls.push(["unregister", ...args]),
};
const ephemeral = [];
const realtime = new RealtimeVoiceRuntimeService(
  realtimeController,
  origin,
  voice,
  (locator) => ephemeral.push(locator),
);
assert.equal(realtime instanceof RpcHandlerBase, true);
const start = () => {};
const cancel = () => {};
const complete = () => {};
realtime.registerRealtimeStarter(start, cancel, complete);
assert.deepEqual(realtimeCalls[0].slice(0, 5), ["register", origin.id, start, cancel, complete]);
assert.equal(stopGuard(), false);
phase = "starting";
assert.equal(stopGuard(), false);
phase = "active";
assert.equal(stopGuard(), true);
assert.deepEqual(realtimeCalls.at(-1), ["control", "voice-locator", { type: "stop" }]);
phase = "stopping";
assert.equal(stopGuard(), true);

const request = { source: "composer_button_existing_thread", ephemeral: true, locator: "thread-locator" };
await realtime.requestRealtimeStart(request, { mode: "voice" });
assert.deepEqual(ephemeral, ["thread-locator"]);
assert.deepEqual(realtimeCalls.at(-1), ["request", origin, request, { mode: "voice" }]);
assert.equal(realtime.cancelRealtimeSessionStart(), "cancelled");
realtime.completeRealtimeSession();
realtime.unregisterRealtimeStarter();
assert.deepEqual(realtimeCalls.slice(-3), [
  ["cancel", origin],
  ["complete", origin.id],
  ["unregister", origin.id],
]);

const noHistory = new RealtimeVoiceRuntimeService(realtimeController, origin, null, null);
noHistory.registerRealtimeStarter(start, cancel, complete);
assert.equal(realtimeCalls.at(-1)[5], undefined);
await assert.rejects(
  noHistory.requestRealtimeStart(request, {}),
  /Ephemeral voice history is unavailable/,
);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createInteractionRpcServices\(\{ RpcHandlerBase: n\.Uf \}\)/);
assert.doesNotMatch(main, /s8e = class/);
assert.doesNotMatch(main, /c8e = class/);
assert.match(main, /realtimeVoiceRuntime: new c8e\(/);
assert.match(main, /quickChatWindow: new s8e\(/);

console.log("interaction RPC service assertions: 24");
