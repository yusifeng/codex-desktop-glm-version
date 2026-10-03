import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateThreadMetadataUpdate, updateThreadMetadata } = require(
  "../app/.vite/build/main-app/thread-metadata.js",
);

validateThreadMetadataUpdate({ threadId: "thread-1", emoji: "✅" });
assert.throws(() => validateThreadMetadataUpdate({ threadId: "" }), /must not be empty/);
assert.throws(() => validateThreadMetadataUpdate({ threadId: "thread-1", emoji: "xx" }), /exactly one emoji/);

const current = { "thread-1": { emoji: "✅", labelColor: "blue" } };
const updated = updateThreadMetadata(current, { threadId: "thread-1", labelColor: "red" });
assert.deepEqual(updated, { "thread-1": { emoji: "✅", labelColor: "red" } });
assert.notEqual(updated, current);
assert.equal(updateThreadMetadata(current, { threadId: "thread-1" }), current);
assert.deepEqual(updateThreadMetadata(updated, { threadId: "thread-1", emoji: null, labelColor: null }), undefined);

console.log("6 main thread metadata assertions passed");
