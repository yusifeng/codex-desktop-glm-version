import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { gitStatusToReviewChangeKind, reviewFileKey } = require(
  "../app/.vite/build/worker/git-review-file-classification-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
equal(reviewFileKey("new.ts", undefined), "\0new.ts");
equal(reviewFileKey("new.ts", "old.ts"), "old.ts\0new.ts");
equal(gitStatusToReviewChangeKind("A"), "added");
equal(gitStatusToReviewChangeKind("R"), "renamed");
equal(gitStatusToReviewChangeKind("U"), "unmerged");
equal(gitStatusToReviewChangeKind("?"), "modified");
console.log(`${assertions} worker review file classification policy assertions passed`);
