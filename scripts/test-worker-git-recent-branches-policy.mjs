import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildRecentBranchArgs,
  MAX_RECENT_BRANCHES,
  normalizeRecentBranchLimit,
  parseRecentBranchOutput,
} = require("../app/.vite/build/worker/git-recent-branches-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

equal(MAX_RECENT_BRANCHES, 100);
equal(normalizeRecentBranchLimit(-3), 1);
equal(normalizeRecentBranchLimit(0), 1);
equal(normalizeRecentBranchLimit(7), 7);
equal(normalizeRecentBranchLimit(999), 100);
deepEqual(parseRecentBranchOutput(" main \n\n feature/x\t\n"), ["main", "feature/x"]);
deepEqual(parseRecentBranchOutput("\n  \n"), []);
deepEqual(buildRecentBranchArgs(), [
  "for-each-ref",
  "--count=100",
  "--sort=-committerdate",
  "refs/heads",
  "--format=%(refname:short)",
]);

console.log(`${assertions} worker git recent branches policy assertions passed`);
