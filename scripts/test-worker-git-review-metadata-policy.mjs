import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getOmittedUntrackedFiles, mergeReviewMetadata, selectUntrackedReviewPaths } = require(
  "../app/.vite/build/worker/git-review-metadata-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
deepEqual(selectUntrackedReviewPaths(undefined, new Set(["a", "b"])), ["a", "b"]);
deepEqual(selectUntrackedReviewPaths(["b", "c"], new Set(["a", "b"])), ["b"]);
equal(getOmittedUntrackedFiles(2, 2), undefined);
deepEqual(getOmittedUntrackedFiles(3, 2), { count: 3, limit: 2 });
deepEqual(mergeReviewMetadata({ files: [1], rawEntries: [2], stats: [3] }, { files: [4], rawEntries: [5], stats: [6] }), { files: [1, 4], rawEntries: [2, 5], stats: [3, 6] });
console.log(`${assertions} worker git review metadata policy assertions passed`);
