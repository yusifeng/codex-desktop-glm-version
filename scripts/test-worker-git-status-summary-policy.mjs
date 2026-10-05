import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseTrackedStatus } = require("../app/.vite/build/worker/git-status-summary-policy.js");
let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(parseTrackedStatus([
  "M  staged.txt", " M unstaged.txt", "R  renamed.txt", "old.txt",
  " C copied.txt", "copy-source.txt", "?? ignored.txt",
].join("\0") + "\0"), {
  type: "success", stagedCount: 2,
  stagedRenames: [{ path: "renamed.txt", previousPath: "old.txt" }],
  trackedPaths: ["staged.txt", "unstaged.txt", "renamed.txt", "old.txt", "copied.txt", "copy-source.txt"],
  unstagedCount: 2, untrackedCount: null,
});
deepEqual(parseTrackedStatus("M  incomplete"), {
  type: "success", stagedCount: 0, stagedRenames: [], trackedPaths: [],
  unstagedCount: 0, untrackedCount: null,
});
deepEqual(parseTrackedStatus("?? only-untracked\0"), {
  type: "success", stagedCount: 0, stagedRenames: [], trackedPaths: [],
  unstagedCount: 0, untrackedCount: null,
});
deepEqual(parseTrackedStatus("R  new\0old\0"), {
  type: "success", stagedCount: 1, stagedRenames: [{ path: "new", previousPath: "old" }],
  trackedPaths: ["new", "old"], unstagedCount: 0, untrackedCount: null,
});
console.log(`git-status-summary-policy: ${assertions} assertions passed`);
