import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildReviewPatchError, buildReviewPatchSuccess, unknownReviewPatchDiff } = require(
  "../app/.vite/build/worker/git-review-patch-policy.js",
);
let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
deepEqual(unknownReviewPatchDiff(), { type: "error", error: { type: "unknown" } });
deepEqual(buildReviewPatchSuccess("branch", "diff", 4), { source: "branch", diff: { type: "success", unifiedDiff: "diff", unifiedDiffBytes: 4 } });
deepEqual(buildReviewPatchError("staged", { type: "git" }), { source: "staged", diff: { type: "error", error: { type: "git" } } });
console.log(`${assertions} worker git review patch policy assertions passed`);
