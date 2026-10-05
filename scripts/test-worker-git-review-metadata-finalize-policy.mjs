import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildUntrackedReviewMetadata } = require(
  "../app/.vite/build/worker/git-review-metadata-finalize-policy.js",
);
let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const metadata = new Map([["a.txt", { mode: "100644", oid: "abc", additions: 2, deletions: 1 }]]);
deepEqual(buildUntrackedReviewMetadata(["a.txt", "missing.txt"], metadata), {
  files: [
    { additions: null, changeKind: "added", deletions: null, path: "a.txt", previousPath: null },
    { additions: null, changeKind: "added", deletions: null, path: "missing.txt", previousPath: null },
  ],
  rawEntries: [
    { newMode: "100644", newOid: "abc", oldMode: "000000", oldOid: "0".repeat(40), path: "a.txt", previousPath: null, status: "A" },
    { newMode: "000000", newOid: "0".repeat(40), oldMode: "000000", oldOid: "0".repeat(40), path: "missing.txt", previousPath: null, status: "A" },
  ],
  stats: [
    { additions: 2, deletions: 1, path: "a.txt", previousPath: null },
    { additions: null, deletions: null, path: "missing.txt", previousPath: null },
  ],
});
deepEqual(buildUntrackedReviewMetadata([], metadata), { files: [], rawEntries: [], stats: [] });
console.log(`${assertions} worker git review metadata finalize policy assertions passed`);
