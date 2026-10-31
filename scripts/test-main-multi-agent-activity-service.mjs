import assert from "node:assert/strict";
import fs from "node:fs";
import { createMultiAgentActivityServiceClass } from "../src/main/main-app/realtime/multi-agent-activity-service.ts";

let eventListener;
let sourceDisposals = 0;
const source = {
  subscribe(listener) { eventListener = listener; return () => { sourceDisposals += 1; }; },
};
const Service = createMultiAgentActivityServiceClass({
  RpcHandlerBase: class {},
  createUsingScope: () => ({ e: undefined, u: (value) => value, d: () => {} }),
  maxActivities: 3,
});
const service = new Service(source);
const thread = { hostId: "local", conversationId: "thread-one" };
const otherThread = { hostId: "local", conversationId: "thread-two" };
const remoteThread = { hostId: "remote", conversationId: "thread-one" };

const snapshots = [];
let broken;
let disposals = 0;
const listener = (snapshot) => snapshots.push(snapshot);
listener.onRpcBroken = (callback) => { broken = callback; };
listener[Symbol.dispose] = () => { disposals += 1; };
const subscription = service.subscribe(thread, { dup: () => listener });
assert.deepEqual(snapshots, [{ activities: [] }]);

const activity = (id, realtimeThread = thread) => ({ id, realtimeThread, kind: "thread-message" });
eventListener({ type: "multi-agent-activity", activity: activity("one") });
assert.deepEqual(snapshots.at(-1).activities.map((item) => item.id), ["one"]);
eventListener({ type: "multi-agent-activity", activity: activity("one") });
assert.equal(snapshots.length, 2);
for (const id of ["two", "three", "four"])
  eventListener({ type: "multi-agent-activity", activity: activity(id) });
assert.deepEqual(snapshots.at(-1).activities.map((item) => item.id), ["four", "three", "two"]);

eventListener({ type: "multi-agent-activity", activity: activity("other", otherThread) });
assert.equal(snapshots.at(-1).activities[0].id, "four");
eventListener({ type: "session-started", thread, sessionId: "session-one" });
assert.deepEqual(snapshots.at(-1), { activities: [] });
const countAfterStart = snapshots.length;
eventListener({ type: "session-started", thread, sessionId: "session-one" });
assert.equal(snapshots.length, countAfterStart);
eventListener({ type: "multi-agent-activity", activity: activity("session-item") });
eventListener({ type: "session-ended", thread, sessionId: "different" });
assert.equal(snapshots.at(-1).activities[0].id, "session-item");
eventListener({ type: "session-failed", thread, sessionId: "session-one" });
assert.deepEqual(snapshots.at(-1), { activities: [] });

const remoteSnapshots = [];
let remoteDisposals = 0;
const remoteListener = (snapshot) => remoteSnapshots.push(snapshot);
remoteListener.onRpcBroken = () => {};
remoteListener[Symbol.dispose] = () => { remoteDisposals += 1; };
service.subscribe(remoteThread, { dup: () => remoteListener });
eventListener({ type: "multi-agent-activity", activity: activity("remote-item", remoteThread) });
assert.equal(remoteSnapshots.at(-1).activities[0].id, "remote-item");
eventListener({ type: "host-disconnected", hostId: "remote" });
assert.deepEqual(remoteSnapshots.at(-1), { activities: [] });

assert.equal(typeof broken, "function");
broken();
assert.equal(disposals, 1);
subscription.unsubscribe();
assert.equal(disposals, 1);
service.dispose();
assert.equal(sourceDisposals, 1);
assert.equal(remoteDisposals, 1);
assert.equal(service.subscribers.size, 0);
assert.equal(service.activitiesByThread.size, 0);
assert.equal(service.sessionsByThread.size, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /B8e = createMultiAgentActivityServiceClass\(\{/);
assert.doesNotMatch(main, /B8e = class/);
assert.doesNotMatch(main, /function I2\(/);
assert.match(main, /x = new B8e\(v\)/);

console.log("multi-agent activity service assertions: 24");
