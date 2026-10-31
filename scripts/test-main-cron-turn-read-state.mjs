import assert from "node:assert/strict";
import fs from "node:fs";
import { createCronTurnReadStatePreparer } from "../src/main/main-app/automations/cron-turn-read-state.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const chain = () => {
  const value = { optional() { return value; } };
  return value;
};
const runtime = {
  Of: chain,
  bf: (expected) => ({ expected }),
  hf: chain,
  wf: (shape) => ({
    safeParse(value) {
      if (Object.hasOwn(shape, "threadId")) {
        const valid =
          typeof value?.threadId === "string" &&
          typeof value?.turnId === "string" &&
          value?.item?.type === "agentMessage" &&
          typeof value.item.text === "string";
        return valid ? { success: true, data: value } : { success: false };
      }
      if (Object.hasOwn(shape, "turn")) {
        return value?.turn != null
          ? { success: true, data: value }
          : { success: false };
      }
      return { safeParse: (input) => ({ success: true, data: input }) };
    },
  }),
  tr: (params) => params?.turn ?? null,
  $u: (threadId) => `normalized:${threadId}`,
};

function createHarness({
  connectionState = "connected",
  decision = "NOTIFY",
  setResult = Promise.resolve(),
} = {}) {
  const decisions = [];
  const logs = [];
  const setCalls = [];
  let writerDisposals = 0;
  let notificationRemovals = 0;
  let stateRemovals = 0;
  let notificationHandler;
  let connectionStateHandler;
  const writer = {
    set(value) { setCalls.push(value); return setResult; },
    dispose() { writerDisposals += 1; },
  };
  const owner = {
    openWriter(hostId, onDispose) {
      equal(hostId, "host-a");
      this.onDispose = onDispose;
      return writer;
    },
  };
  const appServerConnection = {
    hostId: "host-a",
    getConnectionState: () => connectionState,
    registerInternalConnectionStateHandler(handler) {
      connectionStateHandler = handler;
      return () => { stateRemovals += 1; };
    },
    registerInternalNotificationHandler(handler) {
      notificationHandler = handler;
      return () => { notificationRemovals += 1; };
    },
  };
  const prepare = createCronTurnReadStatePreparer({
    runtime,
    createLogger: (tag) => ({
      warning(message, details) { logs.push({ tag, message, details }); },
    }),
    decideNotification(input) { decisions.push(input); return { decision }; },
  });
  const start = () => prepare({
    owner,
    appServerConnection,
    threadId: "thread-a",
    notificationPolicy: "always",
  });
  return {
    appServerConnection,
    connection: (state) => connectionStateHandler(state),
    decisions,
    get notificationRemovals() { return notificationRemovals; },
    get stateRemovals() { return stateRemovals; },
    get writerDisposals() { return writerDisposals; },
    logs,
    notify: (method, params, context) => notificationHandler({ method, params }, context),
    owner,
    setCalls,
    start,
  };
}

{
  const harness = createHarness({ connectionState: "connecting" });
  equal(harness.start(), null);
  equal(harness.owner.onDispose, undefined);
}

{
  const harness = createHarness();
  const readState = harness.start();
  harness.notify("turn/started", { threadId: "other", turn: { id: "ignored" } });
  harness.notify("turn/started", { threadId: "thread-a", turn: { id: "turn-a" } });
  harness.notify("item/completed", {
    threadId: "thread-a",
    turnId: "turn-a",
    item: { type: "agentMessage", text: "partial" },
  });
  harness.notify("turn/completed", {
    threadId: "thread-a",
    turn: {
      id: "turn-a",
      status: "completed",
      items: [
        { type: "agentMessage", text: "first" },
        { type: "tool", text: "tool" },
        { type: "agentMessage", text: "final" },
      ],
    },
  });
  await new Promise(setImmediate);
  equal(harness.decisions, [{
    automationKind: "cron",
    notificationPolicy: "always",
    lastAgentMessage: "final",
    didCompleteSuccessfully: true,
  }]);
  equal(harness.setCalls, [{
    hostId: "host-a",
    threadId: "normalized:thread-a",
    hasUnreadTurn: true,
  }]);
  equal(harness.notificationRemovals, 2);
  equal(harness.stateRemovals, 2);
  equal(harness.writerDisposals, 1);
  readState.handleStartFailure();
  equal(harness.writerDisposals, 1);
}

{
  const harness = createHarness({ decision: "DONT_NOTIFY" });
  harness.start();
  harness.notify("item/completed", {
    threadId: "thread-a",
    turnId: "turn-context",
    item: { type: "agentMessage", text: "fallback" },
  });
  harness.notify(
    "turn/completed",
    { threadId: "thread-a", turn: { id: "turn-context", status: "failed" } },
    {
      automationKind: "cron",
      threadId: "thread-a",
      turnId: "turn-context",
      notificationPolicy: "failed_runs_only",
    },
  );
  equal(harness.decisions[0], {
    automationKind: "cron",
    notificationPolicy: "failed_runs_only",
    lastAgentMessage: "fallback",
    didCompleteSuccessfully: false,
  });
  equal(harness.setCalls, []);
  equal(harness.writerDisposals, 1);
}

{
  const harness = createHarness();
  harness.start();
  harness.notify(
    "turn/completed",
    { threadId: "thread-a", turn: { id: "wrong", status: "completed" } },
    { automationKind: "heartbeat", threadId: "thread-a", turnId: "wrong" },
  );
  equal(harness.decisions, []);
  harness.connection("disconnected");
  equal(harness.writerDisposals, 1);
}

{
  const harness = createHarness();
  harness.start().handleStartFailure();
  equal(harness.writerDisposals, 1);
  equal(harness.notificationRemovals, 1);
  equal(harness.stateRemovals, 1);
}

{
  const harness = createHarness();
  const readState = harness.start();
  harness.notify("turn/started", { threadId: "thread-a", turn: { id: "started" } });
  readState.handleStartFailure();
  equal(harness.writerDisposals, 0);
  harness.notify("thread/archived", { threadId: "thread-a" });
  equal(harness.writerDisposals, 1);
}

{
  const rejection = Promise.reject(new Error("write failed"));
  rejection.catch(() => {});
  const harness = createHarness({ setResult: rejection });
  harness.start();
  harness.notify("turn/started", { threadId: "thread-a", turn: { id: "failed-write" } });
  harness.notify("turn/completed", {
    threadId: "thread-a",
    turn: { id: "failed-write", status: "completed", items: [] },
  });
  await new Promise(setImmediate);
  equal(harness.logs.length, 1);
  equal(harness.logs[0].tag, "cron-turn-read-state");
  equal(harness.logs[0].message, "Failed to save automation task unread state");
  equal(harness.writerDisposals, 1);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("Dnt = createCronTurnReadStatePreparer({"), true);
equal(main.includes("prepareCronTurnReadState: Dnt,"), true);
equal(main.includes("var Ant = createThreadReadStateRuntime({"), true);
equal(main.includes("function Dnt("), false);
equal(main.includes("Cnt = n.wf"), false);
equal(main.includes("Ent = r.i(`cron-turn-read-state`)"), false);

console.log(`${assertions} main cron-turn read-state assertions passed`);
