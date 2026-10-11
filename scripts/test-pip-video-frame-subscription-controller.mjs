import assert from "node:assert/strict";
const { createPipVideoFrameSubscriptionController } = await import("../src/main/preload/pip-video-frame-subscription-controller.ts");

const listeners = new Map();
const stopped = [];
const frames = [];
const deps = {
  addListener(channel, handler) { listeners.set(channel, handler); },
  removeListener(channel, handler) { assert.equal(listeners.get(channel), handler); listeners.delete(channel); },
  channel: "pip-frame",
  onStopped(threadID) { stopped.push(threadID); },
  onFrame(message) { frames.push(message); },
};
const controller = createPipVideoFrameSubscriptionController(deps);
const handler = listeners.get("pip-frame");
handler({}, { stopped: true, threadID: "thread-1" });
handler({}, { presentationID: "presentation-1", data: new Uint8Array([1]) });
assert.deepEqual(stopped, ["thread-1"]);
assert.equal(frames.length, 1);
controller.dispose();
assert.equal(listeners.size, 0);
handler({}, { stopped: true, threadID: "thread-2" });
assert.deepEqual(stopped, ["thread-1"]);
controller.dispose();
console.log("6 pip-video-frame-subscription-controller assertions passed");
