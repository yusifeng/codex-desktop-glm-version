import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitMetadataRefreshController } = require("../app/.vite/build/worker/git-metadata-refresh-controller.js");
let disposed = false;
const batches = [];
let release;
const firstBatch = new Promise((resolve) => { release = resolve; });
const controller = createGitMetadataRefreshController({
  isDisposed: () => disposed,
  processBatch: async (paths, recovering) => {
    batches.push({ paths, recovering });
    if (batches.length === 1) await firstBatch;
  },
});
const first = controller.enqueue(["refs", "refs"], false);
assert.equal(controller.hasPending(), true);
assert.equal(controller.enqueue(["worktrees"], true), first);
release();
await first;
assert.deepEqual(batches, [
  { paths: ["refs"], recovering: false },
  { paths: ["worktrees"], recovering: true },
]);
assert.equal(controller.hasPending(), false);
assert.equal(controller.pendingPromise(), null);
disposed = true;
assert.deepEqual(await controller.enqueue(["ignored"], true), undefined);
controller.dispose();
console.log("8 worker git metadata refresh controller assertions passed");
