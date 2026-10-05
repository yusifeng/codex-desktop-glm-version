import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  batchGitLiteralPathspecs,
  formatGitIndexFingerprint,
  isMissingGitIndexError,
  parseGitUntrackedStatusPaths,
  splitNullSeparatedPaths,
} = require("../app/.vite/build/worker/git-worktree-files-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(splitNullSeparatedPaths("a\0\0b\0"), ["a", "b"]);
deepEqual(parseGitUntrackedStatusPaths(" M tracked\0?? loose.txt\0!! ignored\0?? dir/\0"), [
  "loose.txt",
  "dir/",
]);
deepEqual(batchGitLiteralPathspecs([], Buffer.byteLength), []);
deepEqual(batchGitLiteralPathspecs(["a b", ":(glob)*"], Buffer.byteLength), [
  [":(literal)a b", ":(literal):(glob)*"],
]);
deepEqual(batchGitLiteralPathspecs(["aa", "bb"], Buffer.byteLength, 14), [
  [":(literal)aa"],
  [":(literal)bb"],
]);
deepEqual(batchGitLiteralPathspecs(["oversized"], Buffer.byteLength, 1), [
  [":(literal)oversized"],
]);
equal(formatGitIndexFingerprint({ size: 3, mtimeMs: 4, ctimeMs: 5, ino: 6 }), "3:4:5:6");
equal(formatGitIndexFingerprint({ mtimeMs: 4, ctimeMs: 5 }), "0:4:5:0");
equal(isMissingGitIndexError(Object.assign(new Error("missing"), { code: "ENOENT" })), true);
equal(isMissingGitIndexError(Object.assign(new Error("denied"), { code: "EACCES" })), false);
equal(isMissingGitIndexError(null), false);

console.log(`${assertions} worker git worktree files policy assertions passed`);
