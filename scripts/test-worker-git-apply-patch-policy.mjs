import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseApplyPatchResult, parsePatchPaths } = require(
  "../app/.vite/build/worker/git-apply-patch-policy.js",
);

let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(parsePatchPaths("diff --git a/a.txt b/a.txt\ndiff --git a/old b/new\n"), [
  "a.txt", "old", "new",
]);
deepEqual(parsePatchPaths("diff --git a/foo b/foo\n"), ["foo"]);
deepEqual(parseApplyPatchResult(
  "Applied patch to 'ok.txt' cleanly.\nApplying patch bad.txt with 1 reject...\n",
  "",
), {
  appliedPaths: ["ok.txt"],
  skippedPaths: [],
  conflictedPaths: ["bad.txt"],
});
deepEqual(parseApplyPatchResult(
  "Checking patch merge.txt...\nFailed to perform three-way merge...\n",
  "",
), { appliedPaths: [], skippedPaths: ["merge.txt"], conflictedPaths: [] });

console.log(`git-apply-patch-policy: ${assertions} assertions passed`);
