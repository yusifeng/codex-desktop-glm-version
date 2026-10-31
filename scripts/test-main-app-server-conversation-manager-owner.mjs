import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
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
  (node) => node.type === "ClassDeclaration" && node.id?.name === "AppServerConversationManager",
);
assert.ok(classNode, "conversation manager should survive TypeScript transformation");
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const AppServerConversationManager = Function(
  "ConversationEventEmitterBase",
  `${classSource}; return AppServerConversationManager;`,
)(class {});

let assertions = 1;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const calls = [];
const owner = (name, method = "dispose") => ({ [method]: () => calls.push(name) });
const manager = {
  disposed: false,
  pagination: owner("pagination"),
  turnStartObservations: owner("observations", "clear"),
  conversationReads: new Set([owner("read", "cancel")]),
  userVerificationApprovals: new Map([["approval", owner("approval", "cancel")]]),
  turnCoordinator: owner("turn-coordinator"),
  openFileWatches: owner("open-file-watches"),
  inFlightConversationResumes: new Map([["resume", owner("resume", "cancel")]]),
  streamRecovery: owner("stream-recovery"),
  threadStore: owner("thread-store", "clearActiveConversationInterests"),
  pendingThreadGoalHydrations: owner("goal-hydrations", "clear"),
  pendingThreadSettingsUpdates: owner("settings-updates", "clear"),
  cleanup: [() => calls.push("cleanup")],
  realtimeThreadState: owner("realtime"),
  inactiveThreadUnsubscriber: owner("inactive"),
  streamState: owner("stream-state"),
  lifecycle: owner("lifecycle"),
  prewarmedThreadManager: owner("prewarmed", "discardAllPrewarmedThreads"),
};
AppServerConversationManager.dispose(manager);
equal(manager.disposed, true);
equal(manager.conversationReads.size, 0);
equal(manager.userVerificationApprovals.size, 0);
equal(manager.inFlightConversationResumes.size, 0);
equal(manager.cleanup.length, 0);
equal(calls, [
  "pagination", "observations", "read", "approval", "turn-coordinator",
  "open-file-watches", "resume", "stream-recovery", "thread-store",
  "goal-hydrations", "settings-updates", "cleanup", "realtime", "inactive",
  "stream-state", "lifecycle", "prewarmed",
]);

let activeChecks = 0;
const unsubscribe = () => undefined;
const listenerManager = {
  assertActive: () => { activeChecks += 1; },
  events: { addTurnStartRequestedListener: (listener) => listener === "listener" ? unsubscribe : null },
};
equal(
  AppServerConversationManager.addTurnStartRequestedListener(listenerManager, "listener"),
  unsubscribe,
);
equal(activeChecks, 1);

equal(classNode.body.body.length, 299);
const memberNames = classNode.body.body
  .map((member) => member.key?.name ?? member.key?.value)
  .filter(Boolean);
equal(memberNames.includes("loginWithChatGPT"), true);
equal(memberNames.includes("applySavedConversationReadState"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/conversation/app-server-manager.js")'), true);
equal(main.includes("rw = AppServerConversationManager"), true);
equal(main.includes("rw = class"), false);
equal(main.includes("rw.addTurnStartRequestedListener"), true);
equal(main.includes("rw.dispose(h)"), true);

console.log(`${assertions} main app-server conversation manager owner assertions passed`);
