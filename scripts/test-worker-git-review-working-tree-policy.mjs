import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  UNTRACKED_PATH_BATCH_BYTES,
  UNTRACKED_PATH_BATCH_LIMIT,
  chunkUntrackedMetadataPaths,
  isUnsupportedBatchedUntrackedDiff,
} = require("../app/.vite/build/worker/git-review-working-tree-policy.js");

let assertions = 0;
const equal = (actual, expected) => {
  assertions++;
  assert.deepEqual(actual, expected);
};

const deps = { byteLength: (value) => Buffer.byteLength(value, "utf8") };
equal([UNTRACKED_PATH_BATCH_LIMIT, UNTRACKED_PATH_BATCH_BYTES], [256, 16000]);
equal(chunkUntrackedMetadataPaths([], deps), []);
equal(chunkUntrackedMetadataPaths(Array.from({ length: 257 }, (_, i) => `f-${i}`), deps).map((b) => b.length), [256, 1]);
equal(chunkUntrackedMetadataPaths(["你".repeat(7990), "next"], deps).map((b) => b.length), [1, 1]);
equal(isUnsupportedBatchedUntrackedDiff({ code: 129, stderr: "fatal: Limiting comparison with pathspecs is unsupported" }), true);
equal(isUnsupportedBatchedUntrackedDiff({ code: 129, stderr: "usage: git diff --no-index" }), true);
equal(isUnsupportedBatchedUntrackedDiff({ code: 1, stderr: "usage: git diff --no-index" }), false);
console.log(`git-review-working-tree-policy focused assertions: ${assertions}`);
