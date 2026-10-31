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
    conversationTurns: (conversation) => conversation.turns ?? [], findTurnById: () => null, lastTurnWithTurnId: () => null,
    forEachTurn: (conversation, callback) => (conversation.turns ?? []).forEach(callback),
  };
  if (specifier === "../threads/patch-classification") return {
    applyThreadSettingsUpdate: (state, settings) => { state.latestThreadSettings = settings; },
  };
  if (specifier === "../requests/item-synthesis") return {
    Qv: (state, requestId) => { state.permissionResolved = requestId; },
    Zv: (state) => { state.elicitationResolved = true; },
  };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);
const owner = module.exports;

const calls = [];
const conversations = new Map([["thread-1", { id: "thread-1", turns: [], requests: [] }]]);
const context = {
  observeTurnStart: (...args) => calls.push(["observe", ...args]),
  manager: {
    logger: { trace: (...args) => calls.push(["trace", ...args]), info: (...args) => calls.push(["info", ...args]), warning: (...args) => calls.push(["warning", ...args]), error: (...args) => calls.push(["error", ...args]) },
    getHostId: () => "local", getConversation: (id) => conversations.get(id) ?? null,
    updateConversationState: (id, update) => { const state = conversations.get(id) ?? { id }; update(state); conversations.set(id, state); },
    broadcastConversationSnapshot: (id) => calls.push(["snapshot", id]),
    sendRequest: async (...args) => calls.push(["request", ...args]),
    getMcpServerElicitationItem: () => ({ type: "mcpServerElicitation" }),
  },
  notificationContext: {
    threadStore: {
      conversations, resetAfterReconnect: () => calls.push(["reset"]),
      recordThreadRuntimeStatusEvidence: (...args) => (calls.push(["status", ...args]), true),
      hydrateActiveThread: (id) => calls.push(["hydrate", id]), applyThreadTitleUpdate: (...args) => calls.push(["title", ...args]),
    },
    streamState: { shouldIgnoreThreadMutationAsFollower: () => false },
    resumeNotificationBuffer: { buffer: () => false }, threadStartedNotificationDeferral: { bufferNotification: () => false },
    events: { emitNotification: (value) => calls.push(["emit", value]), emitOpenFileChange: (value) => calls.push(["file", value]) },
    lifecycle: { handleNotification: (value) => calls.push(["lifecycle", value]) },
    itemStreamState: { handleNotification: (value) => calls.push(["item", value]) },
    openFileWatches: { getFileChangeMessages: () => [{ type: "open-file-changed" }] },
    handleRealtimeItemAdded: (params) => calls.push(["realtime", params]),
    upsertConversationFromThread: (thread) => (conversations.set(thread.id, thread), thread.id),
    handleThreadArchived: (id) => calls.push(["archived", id]), handleThreadDeletion: (ids) => calls.push(["deleted", ids]),
    handleThreadUnarchived: (id) => calls.push(["unarchived", id]),
  },
};

owner.applyNotification(context, "account/updated", { account: {} });
equal(calls.some(([kind]) => kind === "reset"), true);
equal(calls.some(([kind]) => kind === "lifecycle"), true);

owner.applyNotification(context, "turn/started", { threadId: "thread-1", turn: { id: "turn-1" } });
equal(calls.some((entry) => entry[0] === "observe" && entry[2] === "turn-1"), true);

owner.applyNotification(context, "thread/settings/updated", { threadId: "thread-1", threadSettings: { model: "gpt" } });
equal(conversations.get("thread-1").latestThreadSettings, { model: "gpt" });
owner.applyNotification(context, "thread/status/changed", { threadId: "thread-1", status: { type: "active" } });
equal(conversations.get("thread-1").threadRuntimeStatus, { type: "active" });

owner.applyNotification(context, "item/agentMessage/delta", { threadId: "thread-1", delta: "hello" });
equal(calls.some(([kind]) => kind === "item"), true);
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

console.log(`${assertions} main notification reducer owner assertions passed`);
