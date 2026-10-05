import assert from "node:assert/strict";
import { createAnnotationPreloadMessageQueue } from "../app/.vite/build/browser-page-preload/annotation-preload-message-queue.js";

const queue = createAnnotationPreloadMessageQueue({
  reducePendingEditorMessage: (pending, message) => ({ ...(pending ?? {}), ...message }),
});
queue.bufferSync({ type: "sync", generation: 1 });
queue.bufferSync({ type: "sync", generation: 2 });
queue.bufferTextSelection();
queue.bufferTextSelection();
queue.bufferEditorMessage({ type: "editor", action: "open" });
queue.bufferEditorMessage({ value: 3 });
assert.equal(queue.hasPendingEditorMessage, true);

queue.markMounted();
queue.bufferSync({ type: "sync", generation: 3 });
queue.bufferEditorMessage({ value: 4 });
const replayed = [];
queue.consume((message) => replayed.push(message));
assert.deepEqual(replayed, [
  { type: "sync", generation: 2 },
  { type: "browser-sidebar-runtime-capture-text-selection" },
  { type: "editor", action: "open", value: 3 },
]);
assert.equal(queue.hasPendingEditorMessage, false);
queue.consume((message) => replayed.push(message));
assert.equal(replayed.length, 3);

queue.markUnmounted();
queue.bufferSync({ type: "sync", generation: 4 });
queue.prepareMount();
queue.consume((message) => replayed.push(message));
assert.equal(replayed.length, 3);

queue.bufferEditorMessage({ type: "editor", value: 5 });
queue.dispose();
assert.equal(queue.hasPendingEditorMessage, false);
queue.bufferSync({ type: "sync", generation: 6 });
queue.bufferTextSelection();
queue.bufferEditorMessage({ type: "editor", value: 6 });
queue.consume((message) => replayed.push(message));
assert.equal(replayed.length, 3);

console.log("test-preload-annotation-preload-message-queue: 8 assertions passed");
