import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/conversations/event-bus.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const ast = acorn.parse(transpiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "Ah",
);
assert.ok(classNode, "ConversationEventBus should survive TypeScript transformation");
assertions += 1;
equal(classNode.body.body.length, 83);

const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`;
const { Ah: ConversationEventBus, ConversationEventBus: semanticAlias } = await import(moduleUrl);
equal(semanticAlias, ConversationEventBus);

const bus = new ConversationEventBus();
const accepted = [];
const disposeAccepted = bus.addAcceptedHistoryListener((...args) => accepted.push(args));
bus.emitAcceptedHistory("thread-1", ["turn-1"]);
disposeAccepted();
bus.emitAcceptedHistory("thread-2", ["turn-2"]);
equal(accepted, [["thread-1", ["turn-1"]]]);

const conversationEvents = [];
bus.addConversationStateCallback((...args) => conversationEvents.push(["state", ...args]));
bus.addConversationRemovedListener((...args) => conversationEvents.push(["removed", ...args]));
bus.addConversationCallback("thread-1", (...args) => conversationEvents.push(["keyed", ...args]));
bus.emitConversation("thread-1", { title: "One" }, { source: "test" });
bus.emitConversationRemoved("thread-1");
bus.emitConversation("thread-1", { title: "Ignored by removed keyed callback" }, null);
equal(conversationEvents, [
  ["state", "thread-1", { title: "One" }, { source: "test" }],
  ["keyed", { title: "One" }],
  ["removed", "thread-1"],
  ["state", "thread-1", null, { type: "fullReset" }],
  ["state", "thread-1", { title: "Ignored by removed keyed callback" }, null],
]);

const roleEvents = [];
bus.addStreamRoleCallback("thread-1", (role) => roleEvents.push(["keyed", role]));
bus.addStreamRoleStateCallback((...args) => roleEvents.push(["state", ...args]));
bus.emitStreamRole("thread-1", "owner");
bus.deleteStreamRoleCallbacks("thread-1");
bus.emitStreamRole("thread-1", "follower");
equal(roleEvents, [
  ["keyed", "owner"],
  ["state", "thread-1", "owner"],
  ["state", "thread-1", "follower"],
]);

const notifications = [];
const disposeNotifications = bus.addNotificationCallback(["one", "two"], (value) =>
  notifications.push(value.method),
);
bus.emitNotification({ method: "one" });
bus.emitNotification({ method: "two" });
disposeNotifications();
bus.emitNotification({ method: "one" });
equal(notifications, ["one", "two"]);

let listenerCalls = 0;
bus.addTurnStartRequestedListener(() => {
  listenerCalls += 1;
  return null;
});
bus.captureTurnStart(
  { isCurrent: () => false },
  () => () => {},
  { warning() {} },
);
equal(listenerCalls, 0);

const lifecycleBus = new ConversationEventBus();
let capturedObservation;
let captureDisposals = 0;
let observationDisposals = 0;
const unregister = lifecycleBus.addTurnStartRequestedListener(() => ({
  isCurrent: () => true,
  onAccepted() {},
  onCompleted() {},
  dispose() {
    observationDisposals += 1;
  },
}));
lifecycleBus.captureTurnStart(
  { isCurrent: () => true },
  (observation) => {
    capturedObservation = observation;
    return () => {
      captureDisposals += 1;
      observation.dispose();
    };
  },
  { warning() {} },
);
equal(capturedObservation.isCurrent(), true);
unregister();
equal(captureDisposals, 1);
equal(observationDisposals, 1);
equal(capturedObservation.isCurrent(), false);

const raceBus = new ConversationEventBus();
let raceCaptureDisposals = 0;
let unregisterRace;
unregisterRace = raceBus.addTurnStartRequestedListener(() => ({
  isCurrent: () => true,
  onAccepted() {},
  onCompleted() {},
  dispose() {},
}));
raceBus.captureTurnStart(
  { isCurrent: () => true },
  () => {
    unregisterRace();
    return () => {
      raceCaptureDisposals += 1;
    };
  },
  { warning() {} },
);
equal(raceCaptureDisposals, 1);

const staleBus = new ConversationEventBus();
let current = true;
const staleCalls = [];
staleBus.addTurnStartRequestedListener(() => {
  staleCalls.push("first");
  current = false;
  return null;
});
staleBus.addTurnStartRequestedListener(() => {
  staleCalls.push("second");
  return null;
});
staleBus.captureTurnStart(
  { isCurrent: () => current },
  () => () => {},
  { warning() {} },
);
equal(staleCalls, ["first"]);

const errorBus = new ConversationEventBus();
const warnings = [];
errorBus.addTurnStartRequestedListener(() => {
  throw new Error("capture failed");
});
errorBus.addTurnStartRequestedListener(() => {
  listenerCalls += 1;
  return null;
});
errorBus.captureTurnStart(
  { isCurrent: () => true },
  () => () => {},
  { warning: (...args) => warnings.push(args) },
);
equal(warnings.length, 1);
equal(warnings[0][0], "Turn start observer capture failed");
equal(listenerCalls, 1);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(/\bAh\b/.test(main), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes('import { Ah as ConversationEventBus } from "../conversations/event-bus"'), true);
equal(manager.includes("events = new ConversationEventBus()"), true);

console.log(`${assertions} main conversation event bus owner assertions passed`);
