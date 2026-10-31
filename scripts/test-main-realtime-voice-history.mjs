import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeVoiceHistoryRuntime } from "../src/main/main-app/realtime/voice-history.ts";

const locatorKey = (locator) => JSON.stringify([locator.hostId, locator.conversationId]);
class TranscriptAccumulator {
  states = new Map();
  state(locator) {
    const key = locatorKey(locator);
    if (!this.states.has(key)) this.states.set(key, { entries: [] });
    return this.states.get(key);
  }
  restoreSnapshot(locator, snapshot) { this.states.set(locatorKey(locator), { entries: [...snapshot.entries] }); }
  getSnapshot(locator) { return this.state(locator); }
  startSession(locator, sessionId, boundary) {
    if (boundary != null) this.state(locator).entries.push({ type: "session-divider", id: sessionId });
  }
  addDelta(locator, sessionId, role, delta) {
    const state = this.state(locator);
    const id = `segment:${sessionId}:${role}`;
    let item = state.entries.find((entry) => entry.id === id);
    if (item == null) {
      item = { type: "item", completed: false, id, role, text: "" };
      state.entries.push(item);
    }
    item.text += delta;
    return state;
  }
  complete(locator, sessionId, role, text) {
    const state = this.state(locator);
    const id = `segment:${sessionId}:${role}`;
    let item = state.entries.find((entry) => entry.id === id);
    if (item == null) {
      item = { type: "item", id, role, text: "" };
      state.entries.push(item);
    }
    item.text = text;
    item.completed = true;
    return state;
  }
  finishHandoffSegment(locator) { return this.state(locator); }
  finishSegment(locator) { return this.state(locator); }
  close(locator) { return this.state(locator); }
  forget(locator) { this.states.delete(locatorKey(locator)); }
}

class PersistentLedger {
  records = new Map();
  list(locator) { return [...(this.records.get(locatorKey(locator)) ?? [])]; }
  append(locator, record) {
    const key = locatorKey(locator);
    const list = this.records.get(key) ?? [];
    const stored = { ...record, sequence: list.length + 1 };
    list.push(stored);
    this.records.set(key, list);
    return stored;
  }
}

let clock = 1_000;
const runtime = createRealtimeVoiceHistoryRuntime({
  runtime: { Uf: class {}, Eo: TranscriptAccumulator },
  validateTimelineRecord: (record) => record,
  createUsingScope: () => ({ e: undefined, u: (value) => value, d: () => {} }),
  now: () => ++clock,
});
const locator = { hostId: "local", conversationId: "thread-one" };
const ledger = new PersistentLedger();
const updates = [];
const owner = new runtime.RealtimeVoiceHistoryLedger(ledger, (...args) => updates.push(args));

assert.deepEqual(owner.getSnapshot(locator), { entries: [], isLoaded: true, records: [] });
owner.observe({ type: "session-started", thread: locator, sessionId: "session-one", version: "v3" });
assert.equal(ledger.list(locator).at(-1).type, "session-started");
assert.equal(owner.getSnapshot(locator).records.at(-1).type, "session-started");

owner.observe({
  type: "transcript-delta",
  thread: locator,
  sessionId: "session-one",
  role: "user",
  delta: "hello ",
});
let snapshot = owner.getSnapshot(locator);
assert.equal(snapshot.entries.at(-1).text, "hello ");
assert.equal(snapshot.records.at(-1).type, "transcript-item");
assert.equal(snapshot.records.at(-1).item.completed, false);

owner.observe({
  type: "transcript-done",
  thread: locator,
  sessionId: "session-one",
  role: "user",
  text: "hello world",
});
snapshot = owner.getSnapshot(locator);
assert.equal(ledger.list(locator).at(-1).type, "transcript-segment");
assert.equal(snapshot.entries.at(-1).completed, true);
assert.equal(snapshot.records.filter((record) => record.type === "transcript-item").length, 1);

owner.observe({
  type: "bem-turn-started",
  thread: locator,
  turnId: "turn-one",
  occurredAtMs: 2_000,
});
assert.equal(ledger.list(locator).at(-1).type, "voice-work-claimed");
owner.observe({
  type: "bem-item-started",
  thread: locator,
  turnId: "turn-one",
  itemId: "item-one",
  itemType: "userMessage",
  occurredAtMs: 2_100,
});
assert.equal(ledger.list(locator).at(-1).type, "bem-user-item-observed");
owner.observe({
  type: "bem-turn-completed",
  thread: locator,
  turnId: "turn-one",
  status: "completed",
  occurredAtMs: 2_200,
});
assert.equal(ledger.list(locator).at(-1).type, "voice-work-terminal");
assert.equal(owner.getSnapshot(locator).records.at(-1).status, "completed");

owner.observe({ type: "session-ended", thread: locator, sessionId: "session-one" });
assert.equal(ledger.list(locator).at(-1).type, "session-ended");
assert.equal(owner.getSnapshot(locator).records.at(-1).type, "session-ended");
assert.equal(updates.length >= 6, true);

const ephemeral = { hostId: "local", conversationId: "ephemeral" };
owner.getSnapshot(ephemeral);
owner.markEphemeral(ephemeral);
owner.observe({ type: "session-started", thread: ephemeral, sessionId: "ephemeral-session", version: "v3" });
assert.deepEqual(ledger.list(ephemeral), []);
assert.equal(owner.getSnapshot(ephemeral).records[0].type, "session-started");
owner.forgetEphemeral(ephemeral);
assert.deepEqual(owner.getSnapshot(ephemeral), { entries: [], isLoaded: true, records: [] });
const updatesAfterForget = updates.length;
owner.observe({ type: "session-ended", thread: ephemeral, sessionId: "ephemeral-session" });
assert.equal(updates.length, updatesAfterForget);

let sourceListener;
let sourceDisposed = 0;
const source = {
  subscribe(listener) { sourceListener = listener; return () => { sourceDisposed += 1; }; },
};
const serviceLedger = new PersistentLedger();
const service = new runtime.RealtimeVoiceHistoryService(source, serviceLedger);
const notifications = [];
let broken;
let listenerDisposals = 0;
const duplicated = (value) => notifications.push(value);
duplicated.onRpcBroken = (callback) => { broken = callback; };
duplicated[Symbol.dispose] = () => { listenerDisposals += 1; };
const subscription = service.subscribe(locator, { dup: () => duplicated });
assert.equal(notifications.length, 1);
assert.equal(notifications[0].isLoaded, true);
sourceListener({ type: "session-started", thread: locator, sessionId: "service-session", version: "v3" });
assert.equal(notifications.length, 2);
sourceListener({
  type: "session-started",
  thread: { hostId: "other", conversationId: "thread-one" },
  sessionId: "other-session",
  version: "v3",
});
assert.equal(notifications.length, 2);
assert.equal(typeof broken, "function");
broken();
assert.equal(listenerDisposals, 1);
subscription.unsubscribe();
assert.equal(listenerDisposals, 1);

const secondNotifications = [];
const secondDuplicate = (value) => secondNotifications.push(value);
secondDuplicate.onRpcBroken = () => {};
secondDuplicate[Symbol.dispose] = () => { listenerDisposals += 1; };
service.subscribe(locator, { dup: () => secondDuplicate });
service.dispose();
service.dispose();
assert.equal(sourceDisposed, 1);
assert.equal(listenerDisposals, 2);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createRealtimeVoiceHistoryRuntime\(\{/);
assert.doesNotMatch(main, /b8e = class/);
assert.doesNotMatch(main, /C8e = class/);
assert.doesNotMatch(main, /function S8e\(/);
assert.match(main, /let b = new C8e\(v, new Lwe\(y\)\)/);

console.log("realtime voice history assertions: 35");
