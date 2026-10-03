import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { gitQueryKey, hostId, normalizeGitPath, utf8ByteLength } = require(
  "../app/.vite/build/worker/git-query-utils.js",
);

const host = { id: "host-1" };
assert.equal(hostId(host), "host-1");
assert.deepEqual(gitQueryKey("/repo", host, "status", "short"), ["git", "host-1", "/repo", "status", "short"]);
assert.equal(normalizeGitPath("foo\\bar///"), "foo/bar");
assert.equal(utf8ByteLength("hello"), 5);
assert.equal(utf8ByteLength("你好"), 6);

console.log("5 worker git query utility assertions passed");
