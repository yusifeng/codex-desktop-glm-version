import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  finalizeReviewMetadata,
  readUntrackedReviewMetadata,
} = require("../app/.vite/build/worker/git-review-metadata-finalize.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

function fixture(options = {}) {
  const calls = { attach: [], deduplicate: [], workingTree: [] };
  const dependencies = {
    attachReviewFileRevisions: async (params) => {
      calls.attach.push(params);
      return options.revisions ?? params.files;
    },
    deduplicateReviewFiles: (files) => {
      calls.deduplicate.push(files);
      return options.deduplicatedFiles ?? files;
    },
    getWorkingTreeMetadata: async (...args) => {
      calls.workingTree.push(args);
      return options.workingTreeMetadata === undefined
        ? new Map()
        : options.workingTreeMetadata;
    },
  };
  return { calls, dependencies };
}

const reviewSnapshot = { generation: 3 };
let state = fixture();
deepEqual(
  await readUntrackedReviewMetadata(reviewSnapshot, [], state.dependencies),
  { files: [], rawEntries: [], stats: [] },
);
equal(state.calls.workingTree.length, 0);

state = fixture({ workingTreeMetadata: null });
equal(
  await readUntrackedReviewMetadata(
    reviewSnapshot,
    ["missing"],
    state.dependencies,
  ),
  null,
);
deepEqual(state.calls.workingTree[0], [
  reviewSnapshot,
  ["missing"],
  { includeDiffMetadata: true },
]);

state = fixture({
  workingTreeMetadata: new Map([
    [
      "present",
      { additions: 0, deletions: 2, mode: "100755", oid: "present-oid" },
    ],
  ]),
});
let metadata = await readUntrackedReviewMetadata(
  reviewSnapshot,
  ["present", "missing", "present"],
  state.dependencies,
);
equal(metadata.files.length, 3);
deepEqual(metadata.files[0], {
  additions: null,
  changeKind: "added",
  deletions: null,
  path: "present",
  previousPath: null,
});
deepEqual(metadata.rawEntries[0], {
  newMode: "100755",
  newOid: "present-oid",
  oldMode: "000000",
  oldOid: "0".repeat(40),
  path: "present",
  previousPath: null,
  status: "A",
});
deepEqual(metadata.rawEntries[1], {
  newMode: "000000",
  newOid: "0".repeat(40),
  oldMode: "000000",
  oldOid: "0".repeat(40),
  path: "missing",
  previousPath: null,
  status: "A",
});
deepEqual(metadata.stats, [
  { additions: 0, deletions: 2, path: "present", previousPath: null },
  { additions: null, deletions: null, path: "missing", previousPath: null },
  { additions: 0, deletions: 2, path: "present", previousPath: null },
]);
deepEqual(state.calls.workingTree[0][1], ["present", "missing", "present"]);

const inputMetadata = {
  files: [
    { changeKind: "added", path: "untracked", previousPath: null },
    { changeKind: "renamed", path: "renamed", previousPath: "old" },
    { changeKind: "modified", path: "tracked", previousPath: null },
  ],
  rawEntries: [
    { newMode: "100644", newOid: "0".repeat(40), path: "untracked", status: "A" },
    { newMode: "100644", newOid: "known", path: "tracked", status: "M" },
    { newMode: "100644", newOid: "0".repeat(40), path: "deleted", status: "D" },
    { newMode: "100644", newOid: "0000", path: "missing", status: "M" },
  ],
  stats: [{ additions: 1, deletions: 0, path: "untracked" }],
};
state = fixture({
  workingTreeMetadata: new Map([["untracked", { mode: "ignored", oid: "filled" }]]),
  revisions: [{ path: "z" }, { path: "a" }],
});
let files = await finalizeReviewMetadata(
  {
    gitRoot: "/repo",
    host: { id: "host" },
    metadata: inputMetadata,
    reviewSnapshot,
    source: "unstaged",
    untrackedPathSet: new Set(["untracked", "renamed"]),
  },
  state.dependencies,
);
deepEqual(files, [{ path: "a" }, { path: "z" }]);
equal(state.calls.deduplicate.length, 1);
deepEqual(state.calls.deduplicate[0], [
  { changeKind: "untracked", path: "untracked", previousPath: null },
  { changeKind: "renamed", path: "renamed", previousPath: "old" },
  { changeKind: "modified", path: "tracked", previousPath: null },
]);
deepEqual(state.calls.workingTree[0], [
  reviewSnapshot,
  ["untracked", "missing"],
  {},
]);
equal(state.calls.attach.length, 1);
equal(state.calls.attach[0].gitRoot, "/repo");
equal(state.calls.attach[0].source, "unstaged");
equal(state.calls.attach[0].host.id, "host");
equal(state.calls.attach[0].files[0].changeKind, "untracked");
equal(state.calls.attach[0].stats, inputMetadata.stats);
deepEqual(
  state.calls.attach[0].rawEntries.map((entry) => entry.newOid),
  ["filled", "known", "0".repeat(40), "0000"],
);
equal(state.calls.attach[0].rawEntries[0].newMode, "100644");

state = fixture({ workingTreeMetadata: null });
equal(
  await finalizeReviewMetadata(
    {
      metadata: { files: [], rawEntries: [], stats: [] },
      reviewSnapshot,
      untrackedPathSet: new Set(),
    },
    state.dependencies,
  ),
  null,
);
equal(state.calls.attach.length, 0);

state = fixture({ deduplicatedFiles: [{ path: "winner" }] });
await finalizeReviewMetadata(
  {
    metadata: { files: [{ path: "input" }], rawEntries: [], stats: [] },
    reviewSnapshot,
    untrackedPathSet: new Set(),
  },
  state.dependencies,
);
deepEqual(state.calls.attach[0].files, [{ path: "winner" }]);

console.log(`worker git review metadata finalize tests passed (${count} assertions)`);
