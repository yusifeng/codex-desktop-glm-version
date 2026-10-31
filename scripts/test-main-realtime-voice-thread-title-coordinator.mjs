import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeVoiceThreadTitleCoordinatorClass } from "../src/main/main-app/realtime/voice-thread-title-coordinator.ts";

class DisposableStore {
  values = [];
  add(value) { this.values.push(value); return value; }
  dispose() {
    for (const value of this.values.splice(0)) {
      if (typeof value === "function") value();
      else value?.dispose?.();
    }
  }
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

function createHarness({ targetName = "New voice chat", assignments = {} } = {}) {
  let eventListener;
  let eventUnsubscribes = 0;
  let registryListener;
  let registryUnsubscribes = 0;
  let evaluationListener;
  let evaluationUnsubscribes = 0;
  let readyAssignments = assignments;
  let executionAssignments = assignments;
  let generationImpl = async () => ({ title: "Better title", description: "Recent topic" });
  const warnings = [];
  const generationRequests = [];
  const requests = [];
  const updates = [];
  const lifetimeChecks = [];

  const makeConnection = (hostId) => {
    const principalListeners = [];
    const notificationListeners = [];
    return {
      hostId,
      principalListeners,
      notificationListeners,
      captureRequestLifetime() {
        return () => lifetimeChecks.push(hostId);
      },
      registerInternalAuthenticatedPrincipalChangeHandler(listener) {
        principalListeners.push(listener);
        return () => principalListeners.splice(principalListeners.indexOf(listener), 1);
      },
      registerInternalNotificationHandler(listener) {
        notificationListeners.push(listener);
        return () => notificationListeners.splice(notificationListeners.indexOf(listener), 1);
      },
      async startThread(request, guard) { guard(); requests.push(["start", request]); return "started"; },
      async forkThread(request, guard) { guard(); requests.push(["fork", request]); return "forked"; },
      async startTurn(request, _unused, guard) { guard(); requests.push(["turn", request]); return "turned"; },
      async sendAppServerRequest(method, request, guard) {
        guard?.();
        requests.push([method, request]);
        if (method === "thread/read") return { thread: { name: targetName } };
        return { ok: true };
      },
      async updateThreadTitle(...args) { args.at(-1)?.(); updates.push(args.slice(0, -1)); },
    };
  };

  const local = makeConnection("local");
  const target = makeConnection("remote");
  const connections = new Map([["local", local], ["remote", target]]);
  const registry = {
    getMaybeConnection: (hostId) => connections.get(hostId),
    subscribe(listener) { registryListener = listener; return () => { registryUnsubscribes += 1; }; },
  };
  const evaluations = {
    readExecutionAssignments: async () => executionAssignments,
    readReadyExecutionAssignments: () => readyAssignments,
    onDidChange(listener) { evaluationListener = listener; return () => { evaluationUnsubscribes += 1; }; },
  };
  const Coordinator = createRealtimeVoiceThreadTitleCoordinatorClass({
    runtime: {
      Wr: DisposableStore,
      a: async (request) => {
        generationRequests.push(request);
        return generationImpl(request);
      },
    },
    createLogger: () => ({ warning: (...args) => warnings.push(args) }),
    loadModelAssignments: async () => ({ ephemeralGenerationModel: "title-model" }),
  });
  const coordinator = new Coordinator(
    { subscribe(listener) { eventListener = listener; return () => { eventUnsubscribes += 1; }; } },
    registry,
    local,
    evaluations,
  );
  return {
    coordinator,
    emit: (event) => eventListener(event),
    registry,
    local,
    target,
    connections,
    evaluations,
    warnings,
    generationRequests,
    requests,
    updates,
    lifetimeChecks,
    get registryListener() { return registryListener; },
    get evaluationListener() { return evaluationListener; },
    get eventUnsubscribes() { return eventUnsubscribes; },
    get registryUnsubscribes() { return registryUnsubscribes; },
    get evaluationUnsubscribes() { return evaluationUnsubscribes; },
    set readyAssignments(value) { readyAssignments = value; },
    set executionAssignments(value) { executionAssignments = value; },
    set generationImpl(value) { generationImpl = value; },
  };
}

const thread = { hostId: "remote", conversationId: "voice-thread" };
const harness = createHarness();
harness.emit({ type: "bem-turn-started", thread, sessionId: "ignored" });
harness.emit({ type: "session-ended", thread, sessionId: "missing" });
await settle();
assert.equal(harness.generationRequests.length, 0);

harness.generationImpl = async (request) => {
  assert.equal(request.model, "title-model");
  assert.equal(request.sourceThreadId, "voice-thread");
  assert.equal(request.fallbackToFreshThread, false);
  assert.match(request.prompt, /most recent voice chat/);
  assert.equal(await request.appServerClient.startThread({ one: 1 }), "started");
  assert.equal(await request.appServerClient.forkThread({ two: 2 }), "forked");
  assert.equal(await request.appServerClient.startTurn({ three: 3 }), "turned");
  await request.appServerClient.unsubscribeThread("temporary-thread");
  await request.appServerClient.interruptTurn({ threadId: "temporary-thread" });
  return { title: "Better title", description: "Recent topic" };
};
harness.emit({ type: "session-started", thread, sessionId: "session-1" });
harness.emit({ type: "transcript-delta", thread, sessionId: "session-1" });
harness.emit({ type: "session-ended", thread, sessionId: "wrong-session" });
harness.emit({ type: "session-ended", thread, sessionId: "session-1" });
await settle();
await settle();
assert.equal(harness.generationRequests.length, 1);
assert.deepEqual(harness.updates, [["voice-thread", "Better title", "Recent topic"]]);
assert.equal(harness.requests.some(([method]) => method === "thread/read"), true);
assert.equal(harness.requests.some(([method]) => method === "thread/unsubscribe"), true);
assert.equal(harness.requests.some(([method]) => method === "turn/interrupt"), true);
assert.equal(harness.lifetimeChecks.includes("local"), true);
assert.equal(harness.lifetimeChecks.includes("remote"), true);
assert.equal(harness.registryUnsubscribes, 1);
assert.equal(harness.evaluationUnsubscribes, 1);
assert.equal(harness.target.principalListeners.length, 0);
assert.equal(harness.local.notificationListeners.length, 0);
assert.deepEqual(harness.warnings, []);

const named = createHarness({ targetName: "User supplied title" });
named.emit({ type: "session-started", thread, sessionId: "session-2" });
named.emit({ type: "session-ended", thread, sessionId: "session-2" });
await settle();
assert.equal(named.generationRequests.length, 1);
assert.deepEqual(named.updates, []);

const unavailable = createHarness({ assignments: null });
unavailable.emit({ type: "session-started", thread, sessionId: "session-3" });
unavailable.emit({ type: "session-ended", thread, sessionId: "session-3" });
await settle();
assert.equal(unavailable.generationRequests.length, 0);

const missingTarget = createHarness();
missingTarget.connections.delete("remote");
missingTarget.emit({ type: "session-started", thread, sessionId: "session-4" });
missingTarget.emit({ type: "session-ended", thread, sessionId: "session-4" });
await settle();
assert.equal(missingTarget.generationRequests.length, 0);

const retiring = createHarness();
let releaseGeneration;
retiring.generationImpl = (request) => new Promise((resolve) => {
  releaseGeneration = resolve;
  request.signal.addEventListener("abort", () => resolve({ title: "late", description: "late" }));
});
retiring.emit({ type: "session-started", thread, sessionId: "session-5" });
retiring.emit({ type: "session-ended", thread, sessionId: "session-5" });
await settle();
assert.equal(retiring.generationRequests[0].signal.aborted, false);
retiring.registryListener({ type: "removed", hostId: "remote", connection: retiring.target });
await settle();
assert.equal(retiring.generationRequests[0].signal.aborted, true);
assert.deepEqual(retiring.updates, []);
assert.deepEqual(retiring.warnings, []);
releaseGeneration?.(null);

const policyChange = createHarness();
policyChange.generationImpl = (request) => new Promise((resolve) => {
  request.signal.addEventListener("abort", () => resolve(null));
});
policyChange.emit({ type: "session-started", thread, sessionId: "session-6" });
policyChange.emit({ type: "session-ended", thread, sessionId: "session-6" });
await settle();
policyChange.readyAssignments = null;
policyChange.evaluationListener();
await settle();
assert.equal(policyChange.generationRequests[0].signal.aborted, true);

const replacement = createHarness();
replacement.generationImpl = (request) => new Promise((resolve) => {
  request.signal.addEventListener("abort", () => resolve(null));
});
replacement.emit({ type: "session-started", thread, sessionId: "session-7" });
replacement.emit({ type: "session-ended", thread, sessionId: "session-7" });
await settle();
replacement.emit({ type: "handoff-added", thread, sessionId: "session-8" });
await settle();
assert.equal(replacement.generationRequests[0].signal.aborted, true);

const failure = createHarness();
failure.generationImpl = async () => { throw new Error("generation failed"); };
failure.emit({ type: "session-started", thread, sessionId: "session-9" });
failure.emit({ type: "session-ended", thread, sessionId: "session-9" });
await settle();
assert.equal(failure.warnings.length, 1);
assert.equal(failure.warnings[0][0], "Failed to update realtime voice thread title");

const disposed = createHarness();
disposed.generationImpl = (request) => new Promise((resolve) => {
  request.signal.addEventListener("abort", () => resolve(null));
});
disposed.emit({ type: "session-started", thread, sessionId: "session-10" });
disposed.emit({ type: "session-ended", thread, sessionId: "session-10" });
await settle();
disposed.coordinator.dispose();
assert.equal(disposed.eventUnsubscribes, 1);
assert.equal(disposed.generationRequests[0].signal.aborted, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /Y8e = createRealtimeVoiceThreadTitleCoordinatorClass\(\{/);
assert.doesNotMatch(main, /Y8e = class/);
assert.doesNotMatch(main, /function z2\(/);
assert.match(main, /S = new Y8e\(v, this\.appServerConnectionRegistry, r, this\.publishedStatsig\)/);

console.log("realtime voice thread title coordinator assertions: 43");
