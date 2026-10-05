import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { emptyDiffStats, parseNumstat } = require(
  "../app/.vite/build/worker/git-synced-branch-state-policy.js",
);
let assertions = 0;
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};

deepEqual(emptyDiffStats, { filesChanged: 0, linesAdded: 0, linesRemoved: 0 });
deepEqual(parseNumstat(""), emptyDiffStats);
deepEqual(parseNumstat("  \r\n"), emptyDiffStats);
deepEqual(parseNumstat("2\t3\tfile.txt\r\n4\t1\tdir/file.ts"), {
  filesChanged: 2,
  linesAdded: 6,
  linesRemoved: 4,
});
deepEqual(parseNumstat("-\t-\tbinary.dat\ninvalid\nnope\t2\tpath"), {
  filesChanged: 2,
  linesAdded: 0,
  linesRemoved: 2,
});
deepEqual(parseNumstat("0\t0\tpath\twith\ttabs"), {
  filesChanged: 1,
  linesAdded: 0,
  linesRemoved: 0,
});

console.log(`git-synced-branch-state-policy: ${assertions} assertions passed`);
