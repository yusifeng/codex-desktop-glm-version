import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  attachReviewFileRevisions,
  createUnmergedReviewFiles,
  deduplicateReviewFiles,
  getOmittedUntrackedFiles,
  getReviewFileRevisionFallback,
  gitStatusToReviewChangeKind,
  mergeReviewMetadata,
  parseNumstatValue,
  parseReviewMetadataDiff,
  reconcileRenameStats,
  reconcileUntrackedRenames,
  reviewFileKey,
  selectUntrackedReviewPaths,
} = require("../app/.vite/build/worker/git-review-metadata-utils.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

equal(reviewFileKey("new.txt", "old.txt"), "old.txt\0new.txt");
equal(reviewFileKey("new.txt", null), "\0new.txt");
equal(parseNumstatValue("12"), 12);
equal(parseNumstatValue("-"), null);
equal(parseNumstatValue("bad"), null);

deepEqual(
  ["A", "D", "R", "C", "T", "U", "M", "X"].map(
    gitStatusToReviewChangeKind,
  ),
  [
    "added",
    "deleted",
    "renamed",
    "copied",
    "type-changed",
    "unmerged",
    "modified",
    "modified",
  ],
);

deepEqual(
  selectUntrackedReviewPaths(undefined, new Set(["a", "b"])),
  ["a", "b"],
);
deepEqual(selectUntrackedReviewPaths([], new Set(["a", "b"])), ["a", "b"]);
deepEqual(
  selectUntrackedReviewPaths(["b", "c"], new Set(["a", "b"])),
  ["b"],
);
equal(getOmittedUntrackedFiles(undefined, 1), undefined);
equal(getOmittedUntrackedFiles(2, undefined), undefined);
equal(getOmittedUntrackedFiles(2, 2), undefined);
deepEqual(getOmittedUntrackedFiles(3, 2), { count: 3, limit: 2 });

const left = { files: [1], rawEntries: [2], stats: [3] };
const right = { files: [4], rawEntries: [5], stats: [6] };
deepEqual(mergeReviewMetadata(left, right), {
  files: [1, 4],
  rawEntries: [2, 5],
  stats: [3, 6],
});

deepEqual(createUnmergedReviewFiles(new Set(["b", "a"])), [
  {
    additions: null,
    changeKind: "unmerged",
    deletions: null,
    path: "b",
    previousPath: null,
  },
  {
    additions: null,
    changeKind: "unmerged",
    deletions: null,
    path: "a",
    previousPath: null,
  },
]);

const unmerged = {
  additions: null,
  changeKind: "unmerged",
  deletions: null,
  path: "a",
  previousPath: null,
};
const modified = { ...unmerged, changeKind: "modified" };
deepEqual(deduplicateReviewFiles([unmerged, modified]), [unmerged]);
deepEqual(deduplicateReviewFiles([modified, unmerged]), [unmerged]);
deepEqual(
  deduplicateReviewFiles([
    modified,
    { ...modified, path: "b", previousPath: "old-b" },
  ]).map((file) => file.path),
  ["a", "b"],
);

const parsed = parseReviewMetadataDiff(
  [
    `:100644 100755 aaa bbb M`,
    `file.txt`,
    `:100644 100644 ccc ddd R100`,
    `old.txt`,
    `new.txt`,
    `4\t2\tfile.txt`,
    `-\t-\t`,
    `old.bin`,
    `new.bin`,
    `ignored`,
    ``,
  ].join("\0"),
);
deepEqual(parsed.rawEntries, [
  {
    newMode: "100755",
    newOid: "bbb",
    oldMode: "100644",
    oldOid: "aaa",
    path: "file.txt",
    previousPath: null,
    status: "M",
  },
  {
    newMode: "100644",
    newOid: "ddd",
    oldMode: "100644",
    oldOid: "ccc",
    path: "new.txt",
    previousPath: "old.txt",
    status: "R",
  },
]);
deepEqual(parsed.stats, [
  { additions: 4, deletions: 2, path: "file.txt", previousPath: null },
  { additions: null, deletions: null, path: "new.bin", previousPath: "old.bin" },
]);
deepEqual(parseReviewMetadataDiff("garbage\0"), { rawEntries: [], stats: [] });
deepEqual(
  parseReviewMetadataDiff(":100644 100644 aaa bbb R100\0old-only\0"),
  { rawEntries: [], stats: [] },
);

const stats = [
  { additions: 5, deletions: 0, path: "new", previousPath: null },
  { additions: 0, deletions: 5, path: "old", previousPath: null },
  { additions: 1, deletions: 1, path: "keep", previousPath: null },
];
const renames = [
  { additions: 2, deletions: 3, path: "new", previousPath: "old" },
];
deepEqual(reconcileRenameStats(stats, renames, new Set(["old"])), [
  { additions: 2, deletions: 3, path: "new", previousPath: "old" },
  { additions: 1, deletions: 1, path: "keep", previousPath: null },
]);
equal(reconcileRenameStats(stats, [], new Set()).length, 3);

const deletedEntry = {
  newMode: "000000",
  newOid: "0".repeat(40),
  oldMode: "100644",
  oldOid: "abc123",
  path: "old.txt",
  previousPath: null,
  status: "D",
};
const addedEntry = {
  newMode: "100644",
  newOid: "abc123ffff",
  oldMode: "000000",
  oldOid: "0".repeat(40),
  path: "new.txt",
  previousPath: null,
  status: "A",
};
const renameInput = {
  files: [
    { additions: null, changeKind: "deleted", deletions: null, path: "old.txt", previousPath: null },
    { additions: null, changeKind: "untracked", deletions: null, path: "new.txt", previousPath: null },
  ],
  rawEntries: [deletedEntry, addedEntry],
  stats: [
    { additions: 0, deletions: 1, path: "old.txt", previousPath: null },
    { additions: 1, deletions: 0, path: "new.txt", previousPath: null },
  ],
};
const reconciled = reconcileUntrackedRenames(
  renameInput,
  new Set(["new.txt"]),
);
deepEqual(reconciled.files, [
  {
    additions: null,
    changeKind: "renamed",
    deletions: null,
    path: "new.txt",
    previousPath: "old.txt",
  },
]);
deepEqual(reconciled.rawEntries, [
  {
    ...addedEntry,
    oldMode: "100644",
    oldOid: "abc123",
    previousPath: "old.txt",
    status: "R",
  },
]);
deepEqual(reconciled.stats, [
  { additions: 0, deletions: 0, path: "new.txt", previousPath: "old.txt" },
]);
equal(reconcileUntrackedRenames(renameInput, new Set()), renameInput);
equal(
  reconcileUntrackedRenames(
    { ...renameInput, rawEntries: [deletedEntry, { ...deletedEntry, path: "other" }, addedEntry] },
    new Set(["new.txt"]),
  ).files.length,
  2,
);

const host = {
  platformPath: async () => path.posix,
  stat: async () => ({ size: 12, mtimeMs: 99.9 }),
};
equal(
  await getReviewFileRevisionFallback({
    fallback: "fallback",
    host,
    gitRoot: "/repo",
    filePath: "a",
  }),
  "fallback:12:99",
);
equal(
  await getReviewFileRevisionFallback({
    fallback: "fallback",
    host: { ...host, stat: async () => { throw Error("missing"); } },
    gitRoot: "/repo",
    filePath: "a",
  }),
  "fallback",
);

const filesWithRevisions = await attachReviewFileRevisions({
  host,
  gitRoot: "/repo",
  source: "branch",
  files: [
    { changeKind: "modified", path: "a", previousPath: null },
    { changeKind: "untracked", path: "b", previousPath: null },
    { changeKind: "added", path: "c", previousPath: null },
  ],
  rawEntries: [
    {
      newMode: "100755",
      newOid: "new-a",
      oldMode: "100644",
      oldOid: "old-a",
      path: "a",
      previousPath: null,
      status: "M",
    },
    {
      newMode: "100644",
      newOid: "new-b",
      oldMode: "000000",
      oldOid: "zero",
      path: "b",
      previousPath: null,
      status: "A",
    },
  ],
  stats: [
    { additions: 3, deletions: 4, path: "a", previousPath: null },
  ],
});
equal(filesWithRevisions[0].revision, "branch:M:100644:old-a:100755:new-a");
equal(filesWithRevisions[0].additions, 3);
equal(filesWithRevisions[0].deletions, 4);
equal(filesWithRevisions[1].revision, "untracked:100644:new-b");
equal(filesWithRevisions[1].additions, null);
equal(filesWithRevisions[2].revision, "branch:added::c:12:99");

console.log(`${count} worker git review metadata utility assertions passed`);
