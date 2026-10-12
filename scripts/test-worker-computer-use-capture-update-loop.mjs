import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { readComputerUseCaptureUpdates } = createRequire(import.meta.url)("../app/.vite/build/worker/computer-use-capture-update-loop.js");

const emitted = [];
let calls = 0;
await readComputerUseCaptureUpdates("capture-1", {
  getNextCaptureUpdate: async () => (++calls === 1 ? { type: "frame" } : { type: "complete" }),
  emitCaptureUpdate: (id, update) => emitted.push([id, update.type]),
  shouldContinue: (update) => update.type !== "complete",
});
assert.deepEqual(emitted, [["capture-1", "frame"], ["capture-1", "complete"]]);

const failed = [];
await readComputerUseCaptureUpdates("capture-2", {
  getNextCaptureUpdate: async () => { throw new Error("offline"); },
  emitCaptureUpdate: (id, update) => failed.push([id, update.failureReason]),
  shouldContinue: () => true,
});
assert.deepEqual(failed, [["capture-2", "update_poll_failed"]]);
console.log("2 worker computer-use capture update loop assertions passed");
