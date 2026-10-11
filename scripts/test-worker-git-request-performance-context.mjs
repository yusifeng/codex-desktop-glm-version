import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveGitRequestPerformanceContext } = require("../app/.vite/build/worker/git-request-context-policy.js");
assert.deepEqual(resolveGitRequestPerformanceContext({ method: "review-summary", params: { cwd: "/repo", source: "local" } }), { root: "/repo", reviewCwd: "/repo", reviewSource: "local" });
assert.deepEqual(resolveGitRequestPerformanceContext({ method: "current-branch", params: { root: "/repo" } }), { root: "/repo", reviewCwd: null, reviewSource: null });
console.log("2 worker request performance context assertions passed");
