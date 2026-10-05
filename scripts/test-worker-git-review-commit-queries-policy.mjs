import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { MAX_REVIEW_COMMITS, MAX_REVIEW_COMMIT_OUTPUT_BYTES, parseBranchCommits, parseReviewCommitLineCounts } = require(
  "../app/.vite/build/worker/git-review-commit-queries-policy.js",
);
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const normalize = (sha) => `sha:${sha}`;
equal(MAX_REVIEW_COMMITS, 100); equal(MAX_REVIEW_COMMIT_OUTPUT_BYTES, 2097152);
deepEqual(parseReviewCommitLineCounts("abc\n2\t3\tfile\n\x1e", normalize), [{ additions: 2, deletions: 3, sha: "sha:abc" }]);
deepEqual(parseReviewCommitLineCounts("abc\n-\t3\tbinary\n\x1e", normalize), [{ additions: null, deletions: null, sha: "sha:abc" }]);
deepEqual(parseBranchCommits(["abc", "2026-01-01", "subject", "body"].join("\0") + "\x1e", normalize), [{ sha: "sha:abc", committedAt: "2026-01-01", subject: "subject", message: "body" }]);
deepEqual(parseBranchCommits("bad\0\x1e", normalize), []);
console.log(`${assertions} worker git review commit queries policy assertions passed`);
