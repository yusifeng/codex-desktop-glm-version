import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildGitHostCacheKey,
  classifyProcessExecutable,
  createGitCommandStats,
  exitCodeBucket,
  isGitMutationRequest,
  recordUntrackedCacheOutcome,
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
const attribution = { closed: false, untrackedCacheCoalescedCount: 0, untrackedCacheHitCount: 0, untrackedCacheMissCount: 0 };
recordUntrackedCacheOutcome(attribution, "coalesced");
recordUntrackedCacheOutcome(attribution, "hit");
recordUntrackedCacheOutcome(attribution, "miss");
assert.deepEqual(attribution, { closed: false, untrackedCacheCoalescedCount: 1, untrackedCacheHitCount: 1, untrackedCacheMissCount: 1 });
assert.equal(classifyProcessExecutable(null), "other");
assert.equal(classifyProcessExecutable("python3.11"), "python");
assert.equal(classifyProcessExecutable("/bin/bash"), "shell");
assert.equal(classifyProcessExecutable("C:\\Windows\\System32\\cmd.exe"), "shell");
assert.equal(classifyProcessExecutable("git.exe"), "git");
assert.equal(classifyProcessExecutable("gh"), "gh");
assert.equal(classifyProcessExecutable("ssh"), "ssh");
assert.equal(classifyProcessExecutable("node"), "node");
assert.equal(classifyProcessExecutable("unknown-tool"), "other");
assert.equal(classifyProcessExecutable("/usr/bin/wsl.exe"), "wsl");

console.log("20 worker git observability assertions passed");
