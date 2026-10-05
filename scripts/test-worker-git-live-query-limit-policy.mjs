import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { normalizeRecentBranchesLimit } = require(
  "../app/.vite/build/worker/git-live-query-limit-policy.js",
);

assert.equal(normalizeRecentBranchesLimit(undefined), 10);
assert.equal(normalizeRecentBranchesLimit(null), 10);
assert.equal(normalizeRecentBranchesLimit(0), 1);
assert.equal(normalizeRecentBranchesLimit(7), 7);
assert.equal(normalizeRecentBranchesLimit(100), 100);
assert.equal(normalizeRecentBranchesLimit(101), 100);

console.log("git live query limit policy tests passed (6 assertions)");
