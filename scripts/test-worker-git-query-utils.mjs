import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { gitQueryKey, hostId, matchesGitQuery, normalizeGitPath, pathsOverlap, utf8ByteLength } = require(
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

console.log("9 worker git query utility assertions passed");
