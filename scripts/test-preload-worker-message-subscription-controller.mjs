import assert from "node:assert/strict";
const { createWorkerMessageSubscriptionController } = await import("../src/main/preload/worker-message-subscription-controller.ts");
const calls = [];
const handlers = new Map();
const controller = createWorkerMessageSubscriptionController({
  channel: (name) => `worker:${name}`,
  addListener: (channel, handler) => { calls.push(`add:${channel}`); handlers.set(channel, handler); },
  removeListener: (channel) => calls.push(`remove:${channel}`),
});
const received = [];
const unsubscribeA = controller.subscribe(`git`, (message) => received.push(`a:${message}`));
const unsubscribeB = controller.subscribe(`git`, (message) => received.push(`b:${message}`));
assert.deepEqual(calls, [`add:worker:git`]);
handlers.get(`worker:git`)(null, `hello`);
assert.deepEqual(received, [`a:hello`, `b:hello`]);
unsubscribeA();
assert.deepEqual(calls, [`add:worker:git`]);
unsubscribeB();
assert.deepEqual(calls, [`add:worker:git`, `remove:worker:git`]);
controller.dispose();
console.log("8 preload worker-message-subscription-controller assertions passed");
