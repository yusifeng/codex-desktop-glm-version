import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const owners = [
  ["threads/history-reader.ts", "TurnItemsPaginationLoader", 16],
  ["threads/history-reader.ts", "ConversationHistoryReader", 25],
  ["threads/timeline-index.ts", "ThreadItemIndex", 15],
  ["threads/inactive-unsubscriber.ts", "InactiveThreadUnsubscriber", 28],
  ["streams/item-notifications.ts", "ItemNotificationHandler", 19],
  ["conversation/subagent-topology.ts", "SubagentTopology", 13],
];
for (const [relativePath, className, expectedMembers] of owners) {
  const source = fs.readFileSync(
    new URL(`../src/main/main-app/${relativePath}`, import.meta.url),
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
    (node) => node.type === "ClassDeclaration" && node.id?.name === className,
  );
  assert.ok(classNode, `${className} should survive TypeScript transformation`);
  assertions += 1;
  equal(classNode.body.body.length, expectedMembers);
}

const timelineSource = fs.readFileSync(
  new URL("../src/main/main-app/threads/timeline-index.ts", import.meta.url),
  "utf8",
);
const timelineTranspiled = await transform(timelineSource, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const timelineModule = { exports: {} };
Function("require", "module", "exports", timelineTranspiled.code)(
  (specifier) => {
    if (specifier === "../turns/canonical-history")
      return { lastTurn: () => null, timelineEntryKey: () => "entry" };
    if (specifier === "./automation-detector")
      return {
        AUTOMATION_DETECTOR: {
          isAutomationAssistantMessage: (text) => text === "automation-assistant",
          isAutomationUserInput: (content) => content === "automation-user",
        },
      };
    if (specifier === "./hydration") return { pendingInteraction: () => null };
    throw new Error(`unexpected require ${specifier}`);
  },
  timelineModule,
  timelineModule.exports,
);
const timeline = timelineModule.exports;
equal(timeline.isTerminalTransientItem({ type: "fileChange" }), true);
equal(timeline.isTerminalTransientItem({ type: "agentMessage" }), false);
equal(timeline.isAutomationItem({ type: "agentMessage", text: "automation-assistant" }), true);
equal(timeline.isAutomationItem({ type: "userMessage", content: "automation-user" }), true);
equal(timeline.isActivityItem({ type: "subAgentActivity" }), true);
equal(timeline.isCreateThreadCall({
  type: "dynamicToolCall",
  namespace: "codex_app",
  tool: "create_thread",
}), true);
equal(timeline.isCreateThreadCall({
  type: "mcpToolCall",
  server: "other",
  tool: "create_thread",
}), false);
equal(timeline.isReasoningItem({ type: "reasoning" }), true);
equal(timeline.isAgentMessageItem({ type: "agentMessage" }), true);
equal(timeline.isUserMessageItem({ type: "userMessage" }), true);

const inactiveSource = fs.readFileSync(
  new URL("../src/main/main-app/threads/inactive-unsubscriber.ts", import.meta.url),
  "utf8",
);
const inactiveTranspiled = await transform(inactiveSource, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const inactiveAst = acorn.parse(inactiveTranspiled.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const inactiveClassNode = inactiveAst.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "InactiveThreadUnsubscriber",
);
const inactiveClassSource = inactiveTranspiled.code.slice(
  inactiveClassNode.start,
  inactiveClassNode.end,
);
const InactiveThreadUnsubscriber = Function(
  "normalizeThreadId",
  "lastTurn",
  "completeHistoryTurns",
  "pendingInteractionKind",
  "conversationTurns",
  "isUnboundSteeringMessage",
  "applyConversationTurns",
  "INACTIVE_OWNER_TTL_MS",
  "INACTIVE_RETRY_DELAY_MS",
  "MAX_INACTIVE_OWNER_THREADS",
  "isEphemeralSideConversation",
  `${inactiveClassSource}; return InactiveThreadUnsubscriber;`,
)(
  (id) => id,
  () => null,
  () => [],
  (conversation) => conversation.pendingKind ?? null,
  () => [],
  () => false,
  () => undefined,
  10_800_000,
  15_000,
  10,
  (conversation) => conversation.ephemeral === true && conversation.sideConversation === true,
);
let cleanupCalls = 0;
const inactiveOwner = new InactiveThreadUnsubscriber({
  events: {
    addConversationStateCallback: () => () => { cleanupCalls += 1; },
    addStreamRoleStateCallback: () => () => { cleanupCalls += 1; },
    addStreamFollowersChangedCallback: () => () => { cleanupCalls += 1; },
    addNotificationCallback: () => () => { cleanupCalls += 1; },
  },
  logger: { debug() {}, info() {}, warning() {} },
  threadStore: {},
  streamState: {},
  scheduleMicrotask() {},
});
equal(inactiveOwner.getThreadRuntimeStatusAfterUnsubscribe({ pendingKind: "approval" }), {
  type: "active",
  activeFlags: ["waitingOnApproval"],
});
equal(inactiveOwner.getThreadRuntimeStatusAfterUnsubscribe({ pendingKind: "userInput" }), {
  type: "active",
  activeFlags: ["waitingOnUserInput"],
});
equal(inactiveOwner.getThreadRuntimeStatusAfterUnsubscribe({}), { type: "idle" });
inactiveOwner.dispose();
equal(cleanupCalls, 4);
equal(inactiveOwner.disposed, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
for (const generatedName of ["Bge", "Kge", "g_e", "Dve", "Rve", "ySe", "bSe"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);
for (const generatedName of ["T_e", "Iv", "E_e"])
  equal(new RegExp(`\\b${generatedName}\\b`).test(main), false);
for (const generatedName of ["_v", "vv", "__e", "yv", "bv", "xv", "Sv"])
  equal(main.includes(`function ${generatedName}(`), false);

const manager = fs.readFileSync(
  new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url),
  "utf8",
);
equal(manager.includes("ConversationHistoryReader as ConversationHistoryPagination"), true);
equal(manager.includes("Dve as InactiveThreadUnsubscriber"), true);
equal(manager.includes("Rve as ItemNotificationHandler"), true);
equal(manager.includes("new SubagentTopology({"), true);
equal(manager.includes("new InactiveThreadUnsubscriber({"), true);
equal(manager.includes("new ItemNotificationHandler({"), true);

const threadStore = fs.readFileSync(
  new URL("../src/main/main-app/threads/thread-store.ts", import.meta.url),
  "utf8",
);
equal(threadStore.includes('import { ThreadItemIndex } from "./timeline-index"'), true);
equal(threadStore.includes("threadItemIndex = new ThreadItemIndex({"), true);
equal(threadStore.includes("function historyInvalidationOf("), true);
equal(threadStore.includes("const invalidation = historyInvalidationOf(next, patches)"), true);
equal(threadStore.includes("function byRecencyDesc("), true);
equal(threadStore.includes(".sort(byRecencyDesc as never)"), true);

console.log(`${assertions} main conversation subowner cleanup assertions passed`);
