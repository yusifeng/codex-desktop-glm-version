import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyWorkerMessageCategory } = require("../app/.vite/build/worker/message-category.js");

assert.equal(classifyWorkerMessageCategory({ type: "request" }), "other_request");
assert.equal(classifyWorkerMessageCategory({ type: "response" }), "other_response");
assert.equal(classifyWorkerMessageCategory({ type: "broadcast", method: "thread-stream-state-changed", params: { change: { type: "snapshot" } } }), "snapshot");
assert.equal(classifyWorkerMessageCategory({ type: "broadcast", method: "thread-stream-state-changed", params: { change: { type: "patches" } } }), "patches");
assert.equal(classifyWorkerMessageCategory({ type: "broadcast", method: "thread-stream-following-changed" }), "follower_coordination");
assert.equal(classifyWorkerMessageCategory({ type: "broadcast", method: "other" }), "other_broadcast");
assert.equal(classifyWorkerMessageCategory({ type: "event" }), "unknown");
assert.equal(classifyWorkerMessageCategory({ type: "broadcast", method: "thread-stream-state-changed", params: { change: { type: "other" } } }), "unknown");

console.log("8 worker message category assertions passed");
