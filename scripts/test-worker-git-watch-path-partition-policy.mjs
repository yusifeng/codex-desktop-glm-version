import assert from "node:assert/strict";
import { partitionGitWorktreeWatchPaths } from "../app/.vite/build/worker/git-watch-path-partition-policy.js";

assert.deepEqual(partitionGitWorktreeWatchPaths(["a", "b"], ["b", "c"]), { stalePaths: ["a"], newPaths: ["c"] });
assert.deepEqual(partitionGitWorktreeWatchPaths(["a", "a"], ["a"]), { stalePaths: [], newPaths: [] });
console.log("worker git watch path partition policy assertions passed (2)");
