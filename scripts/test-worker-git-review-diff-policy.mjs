import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/worker/git-review-diff-policy.js");
assert.deepEqual(policy.createReviewDiffFallback("branch", [{ path: "a" }]), {
  source: "branch",
  diffs: { a: { type: "error", error: { type: "unknown" } } },
});
const parse = (header) => header.includes("a b") ? { oldPath: "a", newPath: "b" } : null;
assert.equal(policy.diffMatchesRename("diff --git a/a b/b\n", "a", "b", parse), true);
assert.equal(policy.diffMatchesRename("x", "a", "b", parse), false);
const output = "diff --git a/a b/b\nline\ndiff --git a/c b/c\nend";
const diffs = policy.splitReviewDiffs(output, parse, (value) => Buffer.byteLength(value));
assert.equal(diffs.get("a").diffBytes, Buffer.byteLength("diff --git a/a b/b\nline\n"));
assert.equal(diffs.get("b").diff, diffs.get("a").diff);
assert.equal(policy.reviewDiffError({ type: "x" }).type, "error");
console.log("4 worker Git review diff policy assertions passed");
