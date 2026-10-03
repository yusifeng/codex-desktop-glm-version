import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fsmonitorCacheKey, gitQueryKey, hostId, isCacheableGitCommand, matchesGitQuery, normalizeGitPath, pathsOverlap, utf8ByteLength } = require(
  "../app/.vite/build/worker/git-query-utils.js",
);

const host = { id: "host-1" };
assert.equal(hostId(host), "host-1");
assert.deepEqual(gitQueryKey("/repo", host, "status", "short"), ["git", "host-1", "/repo", "status", "short"]);
assert.equal(normalizeGitPath("foo\\bar///"), "foo/bar");
assert.equal(utf8ByteLength("hello"), 5);
assert.equal(utf8ByteLength("你好"), 6);
assert.equal(matchesGitQuery(["git", "host-1", "/repo"], host), true);
assert.equal(matchesGitQuery(["git", "host-2"], host), false);
assert.equal(pathsOverlap("/repo", ["src"], ["/repo/src/file.ts"]), true);
assert.equal(pathsOverlap("/repo", ["docs"], ["/repo/src/file.ts"]), false);
assert.equal(isCacheableGitCommand(["status", "--short"]), true);
assert.equal(isCacheableGitCommand(["commit"]), false);
assert.equal(fsmonitorCacheKey("/repo", host, { Z: "2", GIT_INDEX_FILE: "ignored", A: "1" }), JSON.stringify(["host-1", "/repo", [["A", "1"], ["Z", "2"]]]));

console.log("12 worker git query utility assertions passed");
