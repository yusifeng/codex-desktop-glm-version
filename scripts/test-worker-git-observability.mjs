import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildGitHostCacheKey,
  createGitCommandStats,
  exitCodeBucket,
  isGitMutationRequest,
} = require("../app/.vite/build/worker/git-observability.js");

assert.equal(createGitCommandStats(3).concurrentOperationCount, 3);
assert.equal(createGitCommandStats(3).closed, false);
assert.equal(isGitMutationRequest({ requestKind: "create-branch", source: null }), true);
assert.equal(isGitMutationRequest({ requestKind: "status", source: "commit_modal" }), true);
assert.equal(isGitMutationRequest({ requestKind: "status", source: "git_direct_call" }), false);
assert.equal(exitCodeBucket(null), null);
assert.equal(exitCodeBucket(128), "128");
assert.equal(exitCodeBucket(7), "other");
assert.equal(
  buildGitHostCacheKey({ id: "host-1", hostConfig: { kind: "local", os: "darwin" }}),
  JSON.stringify(["host-1", "local", undefined, undefined, undefined, undefined, undefined, undefined, "darwin", undefined, undefined, undefined, undefined]),
);

console.log("9 worker git observability assertions passed");
