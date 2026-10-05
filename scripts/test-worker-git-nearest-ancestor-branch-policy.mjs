import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  normalizeAncestorCandidates,
  selectNearestAncestorBranch,
} = require("../app/.vite/build/worker/git-nearest-ancestor-branch-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(normalizeAncestorCandidates([" main ", "", "feature", "main", " release "], "feature"), ["main", "release"]);
deepEqual(normalizeAncestorCandidates(["", " main ", "main"], "other"), ["main"]);
equal(selectNearestAncestorBranch([null, { branch: "main", distance: 4 }, { branch: "release", distance: 2 }, { branch: "tie", distance: 2 }]), "release");
equal(selectNearestAncestorBranch([]), null);
equal(selectNearestAncestorBranch([null, null]), null);

console.log(`${assertions} worker git nearest ancestor branch policy assertions passed`);
