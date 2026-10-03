import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fsmonitorCacheKey, gitQueryKey, hasFsmonitorDaemonFeature, hostId, isCacheableGitCommand, isCancelableGitRequest, isFsmonitorPlatformSupported, matchesGitQuery, normalizeGitPath, parseFsmonitorConfigValue, pathsOverlap, shouldCheckGitAvailability, utf8ByteLength } = require(
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
assert.equal(parseFsmonitorConfigValue(" YES "), null);
assert.equal(parseFsmonitorConfigValue("on"), true);
assert.equal(parseFsmonitorConfigValue("off"), false);
assert.equal(hasFsmonitorDaemonFeature("build\nfeature: fsmonitor--daemon\n"), true);
assert.equal(isFsmonitorPlatformSupported({ isLocal: true, platformFamily: "windows", platformOs: "windows" }), true);
assert.equal(isFsmonitorPlatformSupported({ isLocal: true, platformFamily: "linux", platformOs: "linux" }), false);
assert.equal(isFsmonitorPlatformSupported({ isLocal: false, platformFamily: "linux", platformOs: "linux" }), true);
assert.equal(isCancelableGitRequest("status-summary"), true);
assert.equal(isCancelableGitRequest("push"), false);
assert.equal(shouldCheckGitAvailability("status-summary", true, false), true);
assert.equal(shouldCheckGitAvailability("status-summary", true, true), false);
assert.equal(shouldCheckGitAvailability("push", true, false), false);

console.log("24 worker git query utility assertions passed");
