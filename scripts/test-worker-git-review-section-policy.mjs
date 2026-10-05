import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  extractGitlinkSha,
  resolveReviewActionPath,
  reviewSectionChangeError,
} = require("../app/.vite/build/worker/git-review-section-policy.js");

let assertions = 0;
const equal = (actual, expected) => {
  assertions++;
  assert.deepEqual(actual, expected);
};

equal(extractGitlinkSha("new file mode 160000\n+Subproject commit abcdef0123456789abcdef0123456789abcdef01\n"), "abcdef0123456789abcdef0123456789abcdef01");
equal(extractGitlinkSha("new file mode 100644\n+hello\n"), null);
equal(extractGitlinkSha("new file mode 160000\n+Subproject commit nope\n"), null);
const calls = [];
const normalize = (...args) => (calls.push(args), args.slice(1).join("|"));
equal(resolveReviewActionPath("win", "/repo", "/repo/sub", "../file", normalize), "/repo|/repo/sub|../file");
equal(resolveReviewActionPath("win", "/repo", "/repo/sub", "src/file", normalize), "/repo|/repo|src/file");
equal(calls.length, 2);
equal(reviewSectionChangeError("stale"), { status: "error", appliedPaths: [], skippedPaths: [], conflictedPaths: [], errorCode: "stale" });
console.log(`git-review-section-policy focused assertions: ${assertions}`);
