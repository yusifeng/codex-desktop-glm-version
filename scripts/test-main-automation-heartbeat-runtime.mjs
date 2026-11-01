import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};
const rejects = async (operation, pattern) => {
  assertions += 1;
  await assert.rejects(operation, pattern);
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/automations/heartbeat-runtime.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createHeartbeatAutomationRuntime } = loaded.exports;

let now = Date.parse("2026-11-01T00:00:00.000Z");
const nextRuns = [];
const markedRuns = [];
const warnings = [];
const debug = [];
let currentAutomation = null;
const dependencies = {
  classifyAutomationSchedule: () => ({ scheduleKind: "interval", intervalMs: 60_000, nextScheduledRunAt: now + 120_000 }),
  nextHeartbeatPollAt: ({ now }) => now + 60_000,
  withHostedAutomationInstructions: (mode, hosted) => mode == null ? null : { ...mode, hosted },
  checkHostedAutomationAppAvailable: async (check) => check(),
  resolveHeartbeatCollaborationMode: async ({ collaborationMode }) => ({ ...collaborationMode, resolved: true }),
  resolveAutomationPermissionSelection: (roots) => ({
    approvalPolicy: "never",
    approvalsReviewer: "user",
    sandboxPolicy: { type: "workspaceWrite", roots },
  }),
  updateAutomationNextRun: (...args) => nextRuns.push(args),
  computeAutomationNextRun: () => now + 300_000,
  markAutomationRun: (...args) => markedRuns.push(args),
  automationErrorKind: (error) => error?.kind ?? null,
  getAutomation: () => currentAutomation,
  updateAutomation: (automation) => { currentAutomation = automation; return automation; },
  supportsAppServerFeature: () => true,
  supportsListThreadTurns: () => true,
  turnSummary: "summary",
  logger: {
    warning: (...args) => warnings.push(args),
    debug: (...args) => debug.push(args),
  },
  now: () => now,
};
const runtime = createHeartbeatAutomationRuntime(dependencies);
const automation = {
  id: "automation",
  kind: "heartbeat",
  name: "Heartbeat",
  notificationPolicy: "failed_runs_only",
  prompt: "Check everything",
  rrule: "interval",
  status: "ACTIVE",
  targetThreadId: "thread",
};

await runtime.updateAutomationThreadTitle({
  automation,
  threadId: "thread",
  appServerConnection: { updateThreadTitle: async (...args) => equal(args, ["thread", "Heartbeat", null]) },
});
await runtime.updateAutomationThreadTitle({
  automation,
  threadId: "thread",
  appServerConnection: { updateThreadTitle: async () => { throw new Error("offline"); } },
});
equal(warnings.at(-1)[0], "Failed to set automation thread title");

let currentAssertions = 0;
const missingConnection = {
  readThread: async () => { throw new Error("missing"); },
};
await runtime.runScheduledHeartbeat({
  automation,
  now,
  appServerConnection: missingConnection,
  signal: new AbortController().signal,
  assertCurrent: () => { currentAssertions += 1; },
  heartbeatThreadRendererStates: new Map(),
  heartbeatThreadCollaborationModes: new Map(),
  heartbeatThreadPermissions: new Map(),
  isHostedAutomationAppAvailable: async () => true,
});
equal(currentAssertions, 1);
equal(nextRuns.at(-1), ["automation", now + 60_000]);
equal(warnings.at(-1)[0], "Heartbeat automation skipped: thread missing");

const inactiveThread = {
  id: "thread",
  cwd: "/repo",
  path: "/thread.jsonl",
  status: { type: "idle" },
};
const rendererStates = new Map([["thread", {
  isEligible: false,
  reason: "window_hidden",
  updatedAtMs: now,
}]]);
await runtime.runScheduledHeartbeat({
  automation,
  now,
  appServerConnection: { readThread: async () => inactiveThread },
  signal: new AbortController().signal,
  assertCurrent: () => {},
  heartbeatThreadRendererStates: rendererStates,
  heartbeatThreadCollaborationModes: new Map(),
  heartbeatThreadPermissions: new Map(),
  isHostedAutomationAppAvailable: async () => true,
});
equal(debug.at(-1)[0], "Heartbeat automation blocked by renderer state");
equal(debug.at(-1)[1].safe.blockReason, "window_hidden");

now += 121_000;
await runtime.runScheduledHeartbeat({
  automation,
  now,
  appServerConnection: { readThread: async () => inactiveThread },
  signal: new AbortController().signal,
  assertCurrent: () => {},
  heartbeatThreadRendererStates: rendererStates,
  heartbeatThreadCollaborationModes: new Map(),
  heartbeatThreadPermissions: new Map(),
  isHostedAutomationAppAvailable: async () => true,
});
equal(rendererStates.size, 0, "stale renderer state is evicted");
equal(debug.at(-1)[0], "Heartbeat automation waiting for renderer mode state");

await rejects(
  runtime.runHeartbeatNow({
    automation,
    appServerConnection: { readThread: async () => null },
    collaborationMode: {},
    permissions: null,
    isHostedAutomationAppAvailable: async () => true,
  }),
  /thread not found/,
);
await rejects(
  runtime.runHeartbeatNow({
    automation,
    appServerConnection: {
      readThread: async () => ({ ...inactiveThread, status: { type: "active", activeFlags: ["waitingOnApproval"] } }),
    },
    collaborationMode: {},
    permissions: null,
    isHostedAutomationAppAvailable: async () => true,
  }),
  /busy right now/,
);

const triggered = [];
const turnStarts = [];
const notificationHandlers = new Set();
const successfulConnection = {
  appServerVersion: "1.2.3",
  readThread: async () => inactiveThread,
  notifyAutomationRunTriggered: (event) => triggered.push(event),
  resumeThread: async () => ({
    thread: { id: "thread", cwd: "/resumed", path: "/thread.jsonl", sessionId: "session" },
    cwd: "/fallback",
  }),
  getUserSavedConfiguration: async () => ({ mode: "auto" }),
  getConfigRequirements: async () => ({ requirements: null }),
  registerInternalNotificationHandler(handler) {
    notificationHandlers.add(handler);
    return () => notificationHandlers.delete(handler);
  },
  async startTurn(params, options) {
    turnStarts.push([params, options]);
    const response = { turn: { id: "turn" } };
    for (const handler of notificationHandlers) {
      handler({ method: "turn/started", params: { threadId: "thread", turn: { id: "turn" } } });
    }
    return response;
  },
};
await runtime.runHeartbeatNow({
  automation,
  appServerConnection: successfulConnection,
  collaborationMode: { settings: { model: "model" } },
  permissions: null,
  isHostedAutomationAppAvailable: async () => true,
});
equal(markedRuns.at(-1), ["automation", now + 300_000]);
equal(triggered.at(-1).runTrigger, "run_now");
equal(turnStarts[0][0].cwd, "/resumed");
equal(turnStarts[0][0].approvalPolicy, "never");
equal(turnStarts[0][0].turnTrigger, "automation_heartbeat_run_now");
equal(turnStarts[0][0].serviceTierForTurn, "default");
equal(turnStarts[0][0].input[0].text.includes("<automation_id>automation</automation_id>"), true);
equal(turnStarts[0][0].input[0].text.includes("2026-11-01"), true);
equal(turnStarts[0][1], {
  automationKind: "heartbeat",
  notificationPolicy: "failed_runs_only",
  sessionId: "session",
});
equal(notificationHandlers.size, 0, "run-now turn-start waiter cleans up");

const completionHandlers = new Set();
const scheduledConnection = {
  ...successfulConnection,
  registerInternalNotificationHandler(handler) {
    completionHandlers.add(handler);
    return () => completionHandlers.delete(handler);
  },
  async startTurn(params, options) {
    turnStarts.push([params, options]);
    queueMicrotask(() => {
      for (const handler of completionHandlers) {
        handler({
          method: "turn/completed",
          params: { threadId: "thread", turn: { id: "scheduled-turn", status: "completed" } },
        });
      }
    });
    return { turn: { id: "scheduled-turn" } };
  },
};
await runtime.runScheduledHeartbeat({
  automation,
  now,
  appServerConnection: scheduledConnection,
  signal: new AbortController().signal,
  assertCurrent: () => {},
  heartbeatThreadRendererStates: new Map(),
  heartbeatThreadCollaborationModes: new Map([["thread", { settings: { model: "model" } }]]),
  heartbeatThreadPermissions: new Map([["thread", {
    approvalPolicy: "on-request",
    approvalsReviewer: "admin",
    sandboxPolicy: { type: "readOnly" },
  }]]),
  isHostedAutomationAppAvailable: async () => false,
});
equal(triggered.at(-1).runTrigger, "scheduled");
equal(turnStarts.at(-1)[0].approvalPolicy, "on-request");
equal(completionHandlers.size, 0, "completion listener cleans up");

let cleanupCount = 0;
const activeConnection = {
  appServerVersion: "1.2.3",
  readThread: async (_id, options) => options?.includeTurns
    ? { ...inactiveThread, turns: [{ status: "running" }] }
    : inactiveThread,
  listThreadTurns: async () => ({ data: [{ status: "running" }] }),
  registerInternalNotificationHandler: () => () => { cleanupCount += 1; },
  registerInternalAuthenticatedPrincipalChangeHandler: () => () => { cleanupCount += 1; },
  registerInternalConnectionStateHandler: () => () => { cleanupCount += 1; },
};
await rejects(
  runtime.runHeartbeatNow({
    automation,
    appServerConnection: {
      ...activeConnection,
      readThread: async (...args) => args.length === 1
        ? { ...inactiveThread, status: { type: "active", activeFlags: [] } }
        : activeConnection.readThread(...args),
    },
    collaborationMode: {},
    permissions: null,
    isHostedAutomationAppAvailable: async () => true,
  }),
  /busy right now/,
);
equal(cleanupCount, 3, "history listeners clean up in finally");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/automations/heartbeat-runtime.js")'), true);
equal(main.includes("createHeartbeatAutomationRuntime({"), true);
for (const generatedName of ["_ae", "vae", "yae", "Ms", "bae", "xae", "Sae", "Cae", "wae", "Tae", "Ns", "Ps", "Eae", "Dae", "Oae", "Fs"]) {
  equal(new RegExp(`^(?:async )?function ${generatedName}\\(`, "m").test(main), false);
}

console.log(`${assertions} automation heartbeat runtime assertions passed`);
