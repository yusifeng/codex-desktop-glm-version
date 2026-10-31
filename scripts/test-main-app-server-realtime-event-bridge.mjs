import assert from "node:assert/strict";
import fs from "node:fs";
import { createAppServerRealtimeEventBridgeClass } from "../src/main/main-app/realtime/app-server-event-bridge.ts";

class ChainSchema {
  safeParse(value) { return { success: true, data: value }; }
  parse(value) { return value; }
  nullable() { return this; }
  nullish() { return this; }
  optional() { return this; }
  loose() { return this; }
  extend() { return this; }
}
const schema = () => new ChainSchema();
const successWhen = (predicate) => ({
  safeParse(value) { return predicate(value) ? { success: true, data: value } : { success: false }; },
});
let clock = 10_000;
let uuid = 0;
const Bridge = createAppServerRealtimeEventBridgeClass({
  runtime: {
    df: schema,
    vf: schema,
    wf: schema,
    Ef: schema,
    Of: schema,
    hf: schema,
    bf: schema,
    jf: schema,
    Cf: schema,
    $u: (threadId) => threadId,
    To: (text) => ({ parsed: text }),
    wo: (text) => text.includes("viz")
      ? [{ type: "inline-visualization", index: 0, file: "/viz.json", sourceThreadId: "source" }]
      : [],
  },
  randomUUID: () => `generated-session-${++uuid}`,
  now: () => ++clock,
  schemaOverrides: {
    notification: successWhen(() => true),
    agentMessage: successWhen((item) => item?.type === "agentMessage"),
    createdThreadTool: successWhen((item) => item?.type === "dynamicToolCall" && item?.tool === "create_thread"),
    multiAgentItem: successWhen((item) => item?.type === "collabAgentToolCall" || item?.type === "subAgentActivity"),
    delegationTool: successWhen((tool) => ["resumeAgent", "sendInput", "spawnAgent"].includes(tool)),
  },
});

let registryListener;
let registryDisposed = 0;
const registry = {
  subscribe(listener) { registryListener = listener; return () => { registryDisposed += 1; }; },
};
let notificationHandler;
let connectionDisposed = 0;
const connection = {
  registerInternalNotificationHandler(handler) {
    notificationHandler = handler;
    return () => { connectionDisposed += 1; };
  },
};
const bridge = new Bridge(registry);
const events = [];
const unsubscribe = bridge.subscribe((event) => events.push(event));
registryListener({ type: "added", hostId: "local", connection });
assert.equal(typeof notificationHandler, "function");
assert.equal(bridge.connections.size, 1);

notificationHandler({
  method: "thread/realtime/started",
  params: { threadId: "main", realtimeSessionId: "session-one", sessionId: null, version: "v3" },
});
assert.deepEqual(events.at(-1), {
  type: "session-started",
  thread: { hostId: "local", conversationId: "main" },
  sessionId: "session-one",
  version: "v3",
});

notificationHandler({
  method: "turn/started",
  params: { threadId: "main", turn: { id: "turn-one", startedAt: 12, status: "inProgress" } },
});
assert.equal(events.at(-1).type, "bem-turn-started");
assert.equal(events.at(-1).occurredAtMs, 12_000);
assert.equal(bridge.activeBemTurns.size, 1);
assert.equal(bridge.voiceOwnedBemTurns.size, 1);

notificationHandler({
  method: "thread/realtime/transcript/delta",
  params: { threadId: "main", role: "model", delta: "hello" },
});
assert.equal(events.at(-1).type, "transcript-delta");
assert.equal(events.at(-1).role, "assistant");
notificationHandler({
  method: "thread/realtime/transcript/done",
  params: { threadId: "main", role: "user", text: "done" },
});
assert.equal(events.at(-1).type, "transcript-done");
assert.equal(events.at(-1).role, "user");

notificationHandler({
  method: "thread/realtime/itemAdded",
  params: { threadId: "main", item: { type: "handoff_request", handoff_id: "handoff-one" } },
});
notificationHandler({
  method: "thread/realtime/itemAdded",
  params: { threadId: "main", item: { type: "handoff_request", handoff_id: "handoff-one" } },
});
assert.equal(events.filter((event) => event.type === "handoff-added").length, 1);

notificationHandler({
  method: "item/started",
  params: {
    threadId: "main",
    turnId: "turn-one",
    item: { id: "image-one", type: "imageGeneration" },
    startedAtMs: 15_000,
  },
});
assert.deepEqual(events.slice(-2).map((event) => event.type), ["bem-item-started", "bem-item-presented"]);
assert.equal(events.at(-1).kind, "image");

notificationHandler({
  method: "item/agentMessage/delta",
  params: { threadId: "main", turnId: "turn-one", itemId: "message-one", delta: "viz" },
});
assert.equal(events.at(-1).type, "bem-presentation-added");
assert.equal(events.at(-1).presentation.type, "inline-visualization");
const presentationCount = events.filter((event) => event.type === "bem-presentation-added").length;
notificationHandler({
  method: "item/agentMessage/delta",
  params: { threadId: "main", turnId: "turn-one", itemId: "message-one", delta: " more" },
});
assert.equal(events.filter((event) => event.type === "bem-presentation-added").length, presentationCount);

notificationHandler({
  method: "item/completed",
  params: {
    threadId: "main",
    turnId: "turn-one",
    item: {
      id: "create-one",
      type: "dynamicToolCall",
      tool: "create_thread",
      contentItems: [{ type: "inputText", text: "created result" }],
    },
    completedAtMs: 16_000,
  },
});
assert.equal(events.some((event) => event.type === "bem-presentation-added" && event.presentation?.type === "created-thread"), true);

notificationHandler({
  method: "item/completed",
  params: {
    threadId: "main",
    turnId: "turn-one",
    item: {
      id: "spawn-one",
      type: "collabAgentToolCall",
      tool: "spawnAgent",
      status: "completed",
      senderThreadId: "main",
      receiverThreadIds: ["child"],
      agentsStates: { child: { status: "running", message: null } },
      prompt: "delegate",
    },
    completedAtMs: 17_000,
  },
});
assert.equal(events.some((event) => event.type === "multi-agent-activity" && event.activity.kind === "thread-created"), true);
assert.equal(events.some((event) => event.type === "real-delegation" && event.delegation.delegationId === "spawn-one"), true);

notificationHandler({
  method: "item/completed",
  params: {
    threadId: "main",
    turnId: "turn-one",
    item: { id: "sub-one", type: "subAgentActivity", agentThreadId: "child", kind: "started" },
    completedAtMs: 18_000,
  },
});
assert.equal(events.some((event) => event.type === "bem-item-presented" && event.kind === "subagent"), true);

notificationHandler({
  method: "turn/completed",
  params: { threadId: "main", turn: { id: "turn-one", completedAt: 20, status: "completed" } },
});
assert.equal(events.at(-1).type, "bem-turn-completed");
assert.equal(events.at(-1).occurredAtMs, 20_000);
assert.equal(bridge.activeBemTurns.size, 0);
assert.equal(bridge.voiceOwnedBemTurns.size, 0);

notificationHandler({
  method: "thread/realtime/closed",
  params: { threadId: "main", reason: "transport_closed" },
});
assert.equal(events.at(-1).type, "transport-lost");
notificationHandler({
  method: "thread/realtime/started",
  params: { threadId: "main", realtimeSessionId: "session-one", sessionId: null, version: "v3" },
});
assert.equal(events.at(-1).type, "session-started");
notificationHandler({
  method: "thread/realtime/closed",
  params: { threadId: "main", reason: "completed" },
});
assert.equal(events.at(-1).type, "session-ended");

notificationHandler({
  method: "thread/realtime/transcript/delta",
  params: { threadId: "other", role: "user", delta: "starts implicit" },
});
assert.match(events.at(-1).sessionId, /^generated-session-/);
registryListener({ type: "removed", hostId: "local", connection });
assert.equal(connectionDisposed, 1);
assert.equal(events.some((event) => event.type === "host-disconnected"), true);
assert.equal(events.at(-1).type, "session-ended");
assert.equal(bridge.connections.size, 0);

unsubscribe();
const eventCount = events.length;
bridge.publish({ type: "host-disconnected", hostId: "ignored" });
assert.equal(events.length, eventCount);
bridge.dispose();
assert.equal(registryDisposed, 1);
assert.equal(bridge.listeners.size, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /F8e = createAppServerRealtimeEventBridgeClass\(\{/);
assert.doesNotMatch(main, /F8e = class/);
assert.doesNotMatch(main, /function k8e\(/);
assert.match(main, /v = new F8e\(this\.appServerConnectionRegistry\)/);

console.log("app-server realtime event bridge assertions: 38");
