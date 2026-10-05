import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildRepositoryOperationPaths, REPOSITORY_OPERATION_MARKERS } = require(
  "../app/.vite/build/worker/git-review-branch-stats-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(REPOSITORY_OPERATION_MARKERS, ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "REBASE_HEAD", "rebase-merge", "rebase-apply", "sequencer"]);
deepEqual(buildRepositoryOperationPaths(null, path.posix), []);
deepEqual(buildRepositoryOperationPaths("/repo/.git", path.posix), [
  "/repo/.git/index.lock",
  ...REPOSITORY_OPERATION_MARKERS.map((marker) => `/repo/.git/${marker}`),
]);
equal(buildRepositoryOperationPaths(undefined, path.posix).length, 0);

console.log(`${assertions} worker git review branch stats policy assertions passed`);
