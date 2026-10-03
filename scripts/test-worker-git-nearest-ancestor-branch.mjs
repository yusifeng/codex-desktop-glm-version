import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  findNearestAncestorBranch,
  getAncestorDistance,
  normalizeAncestorCandidates,
} = require("../app/.vite/build/worker/git-nearest-ancestor-branch.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };

deepEqual(
  normalizeAncestorCandidates([" main ", "", "feature", "main", " release "], "feature"),
  ["main", "release"],
);

const repository = { root: "/repo" };
const signal = new AbortController().signal;
let calls = [];
let dependencies = {
  compareAhead: async (...args) => {
    calls.push(args);
    return { state: "right-ahead", rightAhead: 3 };
  },
};
equal(await getAncestorDistance(repository, "main", signal, dependencies), 3);
deepEqual(calls, [[repository, "main", "HEAD", signal]]);

for (const comparison of [
  null,
  { state: "equal", rightAhead: 3 },
  { state: "right-ahead", rightAhead: 0 },
  { state: "right-ahead", rightAhead: -1 },
]) {
  dependencies = { compareAhead: async () => comparison };
  equal(await getAncestorDistance(repository, "main", signal, dependencies), null);
}

const distances = new Map([["main", 4], ["release", 2], ["tie", 2], ["invalid", null]]);
calls = [];
dependencies = {
  compareAhead: async (repo, branch, head, receivedSignal) => {
    calls.push([repo, branch, head, receivedSignal]);
    const distance = distances.get(branch);
    return distance == null
      ? { state: "left-ahead", rightAhead: 0 }
      : { state: "right-ahead", rightAhead: distance };
  },
};
equal(
  await findNearestAncestorBranch(
    repository,
    [" main ", "release", "tie", "invalid", "release", "feature"],
    "feature",
    signal,
    dependencies,
  ),
  "release",
);
deepEqual(calls.map((call) => call[1]), ["main", "release", "tie", "invalid"]);
equal(await findNearestAncestorBranch(repository, [], "feature", signal, dependencies), null);

console.log(`${count} worker git nearest ancestor branch assertions passed`);
