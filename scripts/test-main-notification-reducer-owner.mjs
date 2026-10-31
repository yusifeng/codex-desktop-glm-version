import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/streams/notifications-apply.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared") return { $u: String, ed: String, Zo: (error) => error instanceof Error ? error.message : String(error) };
  if (specifier === "../turns/canonical-history") return {
    conversationTurns: (conversation) => conversation.turns ?? [],
    findTurnById: (conversation, id) => (conversation.turns ?? []).find((turn) => turn.turnId === id) ?? null,
    lastTurnWithTurnId: (conversation) => [...(conversation.turns ?? [])].reverse().find((turn) => turn.turnId != null) ?? null,
    mergedConversationTurns: (conversation) => conversation.turns ?? [],
    timelineEntryKey: (entry) => entry.type === "item" ? `item:${entry.turnId}:${entry.item.id}` : `${entry.type}:${entry.turnId ?? entry.item?.id}`,
    findTurnEntryForEvent: (conversation, id) => {
      const turn = (conversation.turns ?? []).find((entry) => entry.turnId === id); return turn == null ? null : { entityKey: `turn:${id}`, turn };
    },
    forEachTurn: (conversation, callback) => (conversation.turns ?? []).forEach(callback),
  };
  if (specifier === "../threads/patch-classification") return {
    applyThreadSettingsUpdate: (state, settings) => { state.latestThreadSettings = settings; },
  };
  if (specifier === "../requests/item-synthesis") return {
    Qv: (state, requestId) => { state.permissionResolved = requestId; },
    Yv: (turnId) => `plan-${turnId}`,
    Zv: (state) => { state.elicitationResolved = true; },
  };
  if (specifier === "../threads/automation-detector") return {
    parseAutomationUserMessage: () => null, parseHeartbeatDecision: () => null,
  };
  if (specifier === "../threads/hydration") return { activeAncestryIds: () => new Set(), normalizeImageGenerationItem: (item) => item };
  if (specifier === "../turns/steering-merge") return {
    acceptServerUserMessage: (turn, item) => turn.items.push(item), isSteeringUserMessage: (item) => item.type === "steeringUserMessage",
    recoverSteeringOrphans() {}, upsertItem: (turn, item) => { const index = turn.items.findIndex((entry) => entry.id === item.id); index < 0 ? turn.items.push(item) : turn.items[index] = item; },
  };
  if (specifier === "../vendor/immer") return { freezeIdentity: (value) => value };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);
const owner = module.exports;

const calls = [];
const conversations = new Map([["thread-1", { id: "thread-1", turns: [], requests: [] }]]);
const context = {
  createId: () => `item-${calls.length}`,
  supportsGoalContinuation: true,
  readQueuedFollowUpHead: () => null,
  observeTurnStart: (...args) => calls.push(["observe", ...args]),
  manager: {
    logger: { trace: (...args) => calls.push(["trace", ...args]), info: (...args) => calls.push(["info", ...args]), warning: (...args) => calls.push(["warning", ...args]), error: (...args) => calls.push(["error", ...args]) },
    getHostId: () => "local", getConversation: (id) => conversations.get(id) ?? null,
    getConversationOrThrow: (id) => conversations.get(id), getStreamRole: () => ({ role: "owner" }),
    isConversationStreaming: () => false,
    supportsThreadTimeline: () => true,
    onNotification: (...args) => calls.push(["replay", ...args]),
    updateConversationState: (id, update) => { const state = conversations.get(id) ?? { id }; update(state); conversations.set(id, state); },
    updateTurnState: (id, turnId, update) => {
      const state = conversations.get(id); const turn = state?.turns?.find((entry) => entry.turnId === turnId);
      if (turn != null) update(turn);
    },
    broadcastConversationSnapshot: (id) => calls.push(["snapshot", id]),
    sendRequest: async (...args) => calls.push(["request", ...args]),
    getMcpServerElicitationItem: () => ({ type: "mcpServerElicitation" }),
  },
  notificationContext: {
    threadStore: {
      conversations, resetAfterReconnect: () => calls.push(["reset"]),
      recordThreadRuntimeStatusEvidence: (...args) => (calls.push(["status", ...args]), true),
      hydrateActiveThread: (id) => calls.push(["hydrate", id]), applyThreadTitleUpdate: (...args) => calls.push(["title", ...args]),
      getThreadSummaries: () => [], getCachedConversations: () => [],
      getItemTimelineEntryIndex: (id, key) => {
        const entries = conversations.get(id)?.itemTimeline?.entries ?? [];
        const index = entries.findIndex((entry) => (entry.type === "item" ? `item:${entry.turnId}:${entry.item.id}` : `${entry.type}:${entry.turnId ?? entry.item?.id}`) === key);
        return index < 0 ? null : index;
      },
    },
    streamState: { shouldIgnoreThreadMutationAsFollower: () => false },
    resumeNotificationBuffer: { buffer: () => false }, threadStartedNotificationDeferral: { bufferNotification: () => false },
    events: {
      emitNotification: (value) => calls.push(["emit", value]), emitOpenFileChange: (value) => calls.push(["file", value]),
      emitTurnCompleted: (value) => calls.push(["turn-completed", value]),
    },
    lifecycle: { handleNotification: (value) => calls.push(["lifecycle", value]) },
    itemStreamState: {
      handleNotification: (value) => calls.push(["item", value]), drainBefore: () => false,
      clearTurnTerminalInputBuffers: (...args) => calls.push(["clear-terminal", ...args]),
      clearItemTerminalInputBuffer: (...args) => calls.push(["clear-terminal", ...args]),
    },
    openFileWatches: { getFileChangeMessages: () => [{ type: "open-file-changed" }] },
    handleRealtimeItemAdded: (params) => calls.push(["realtime", params]),
    hydrateCollabThreads: (...args) => calls.push(["hydrate-collab", ...args]),
    upsertConversationFromThread: (thread) => (conversations.set(thread.id, thread), thread.id),
    handleThreadArchived: (id) => calls.push(["archived", id]), handleThreadDeletion: (ids) => calls.push(["deleted", ids]),
    handleThreadUnarchived: (id) => calls.push(["unarchived", id]),
    unread: { discardTurn: (...args) => calls.push(["discard-unread", ...args]), completeTurn: (...args) => calls.push(["complete-unread", ...args]) },
    updateTurnState: (id, turnId, update) => context.manager.updateTurnState(id, turnId, update),
    getLastAgentMessageForTurn: () => "done",
    turnMergePolicy: {},
    manualContextCompactions: { consumeSource: () => "manual", removePendingItemFromTurn() {} },
    subagentTopology: { discoverForSpawn: (...args) => calls.push(["spawn", ...args]) },
  },
};
context.notificationContext.threadStore.threadsById = new Map();

owner.applyNotification(context, "account/updated", { account: {} });
equal(calls.some(([kind]) => kind === "reset"), true);
equal(calls.some(([kind]) => kind === "lifecycle"), true);

owner.applyNotification(context, "turn/started", { threadId: "thread-1", turn: { id: "turn-1" } });
equal(calls.some((entry) => entry[0] === "observe" && entry[2] === "turn-1"), true);

owner.applyNotification(context, "thread/settings/updated", { threadId: "thread-1", threadSettings: { model: "gpt" } });
equal(conversations.get("thread-1").latestThreadSettings, { model: "gpt" });
owner.applyNotification(context, "thread/status/changed", { threadId: "thread-1", status: { type: "active" } });
equal(conversations.get("thread-1").threadRuntimeStatus, { type: "active" });

conversations.get("thread-1").turns = [{ turnId: "turn-1", status: "inProgress", params: { model: "gpt", effort: "high" }, items: [] }];
Object.assign(conversations.get("thread-1"), { historyMode: "paginated", canonicalVoiceHistory: true });
owner.applyNotification(context, "turn/started", { threadId: "thread-1", turn: { id: "turn-1", status: "inProgress", durationMs: 3, error: null } });
equal(conversations.get("thread-1").latestModel, "gpt");
equal(conversations.get("thread-1").turns[0].durationMs, 3);
equal(conversations.get("thread-1").itemTimeline.entries[0].type, "turnStarted");
owner.applyNotification(context, "turn/diff/updated", { threadId: "thread-1", turnId: "turn-1", diff: "patch" });
equal(conversations.get("thread-1").turns[0].diff, "patch");
owner.applyNotification(context, "turn/completed", {
  threadId: "thread-1", turn: { id: "turn-1", status: "completed", error: null, durationMs: 8 },
});
equal(conversations.get("thread-1").turns[0].status, "completed");
equal(calls.some(([kind]) => kind === "complete-unread"), true);
equal(calls.some(([kind]) => kind === "snapshot"), true);

owner.applyNotification(context, "item/agentMessage/delta", { threadId: "thread-1", delta: "hello" });
equal(calls.some(([kind]) => kind === "item"), true);
owner.applyNotification(context, "item/started", {
  threadId: "thread-1", turnId: "turn-1", startedAtMs: 20,
  item: { id: "command-1", type: "commandExecution", command: "pwd" },
});
equal(conversations.get("thread-1").turns[0].items.some((item) => item.id === "command-1"), true);
owner.applyNotification(context, "item/completed", {
  threadId: "thread-1", turnId: "turn-1", completedAtMs: 30,
  item: { id: "command-1", type: "commandExecution", command: "pwd", durationMs: 5 },
});
equal(conversations.get("thread-1").turns[0].commandExecutionStartedAtMsById["command-1"], 20);
equal(calls.some((entry) => entry[0] === "clear-terminal" && entry[2] === "command-1"), true);
owner.applyNotification(context, "item/autoApprovalReview/started", {
  threadId: "thread-1", turnId: "turn-1", reviewId: "review-1", targetItemId: "command-1",
  startedAtMs: 40, action: { type: "command", source: "shell", command: "pwd", cwd: "/work" },
  review: { status: "inProgress", riskLevel: "low", userAuthorization: null, rationale: "checking" },
});
equal(conversations.get("thread-1").turns[0].items.some((item) => item.id === "automatic-approval-review:review-1"), true);
owner.applyNotification(context, "thread/realtime/itemAdded", { threadId: "thread-1", item: {} });
equal(calls.some(([kind]) => kind === "realtime"), true);
owner.applyNotification(context, "fs/changed", { watchId: "watch-1" });
equal(calls.some(([kind]) => kind === "file"), true);

const emittedBeforeIgnore = calls.filter(([kind]) => kind === "emit").length;
owner.applyNotification(context, "thread/name/updated", { threadId: "thread-1", threadName: "ignored" }, null, true);
equal(calls.filter(([kind]) => kind === "emit").length, emittedBeforeIgnore);

context.notificationContext.resumeNotificationBuffer.buffer = () => true;
owner.applyNotification(context, "thread/name/updated", { threadId: "thread-1", threadName: "buffered" });
equal(calls.some((entry) => entry[0] === "title" && entry[2] === "buffered"), false);
context.notificationContext.resumeNotificationBuffer.buffer = () => false;
conversations.get("thread-1").requests = [{ id: "request-1", method: "item/permissions/requestApproval", params: { turnId: "turn-1" } }];
owner.applyNotification(context, "serverRequest/resolved", { threadId: "thread-1", requestId: "request-1" });
equal(conversations.get("thread-1").permissionResolved, "request-1");
equal(conversations.get("thread-1").requests, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("function nb("), false);
equal(main.includes("function rb("), false);
equal(main.includes("function My("), false);
equal(main.includes("function Ny("), false);
equal(main.includes("function Py("), false);
for (const name of ["Fy", "Iy", "Ly", "zy", "By", "Vy", "Wy", "Gy", "Ky", "qy", "Jy", "Yy", "Xy", "Zy", "Qy", "eb", "tb"])
  equal(main.includes(`function ${name}(`), false);
for (const name of ["vy", "yy", "xy", "Lve", "tye", "nye", "rye", "iye", "aye", "Oy", "ky", "Ay"])
  equal(main.includes(`function ${name}(`), false);
equal(main.includes("Fve = class"), false);
equal(main.includes("Ive = class"), false);
equal(main.includes("function Yve("), false);
equal(main.includes("function jy("), false);

console.log(`${assertions} main notification reducer owner assertions passed`);
