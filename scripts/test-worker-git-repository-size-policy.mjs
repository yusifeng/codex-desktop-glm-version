import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES,
  formatByteSize,
  parseCountObjects,
  repositorySizeBytes,
  repositorySizeError,
} = require("../app/.vite/build/worker/git-repository-size-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

equal(MAX_WORKTREE_SNAPSHOT_REPOSITORY_BYTES, 200 * 1024 * 1024);
equal(formatByteSize(1024 * 1024), "1.0 MB");
deepEqual([...parseCountObjects("size: 12\r\nsize-pack: 7\ngarbage\n")], [["size", 12], ["size-pack", 7]]);
equal(repositorySizeBytes("size: 12\nsize-pack: 7\n"), 19 * 1024);
equal(repositorySizeBytes("size: nope\nsize-pack: 2\n"), 2 * 1024);
equal(repositorySizeError(2048, 1024).message, "Repository is too large (2.0 KB). Maximum allowed size is 1.0 KB.");

console.log(`git-repository-size-policy: ${assertions} assertions passed`);
