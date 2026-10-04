import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dispatchGitCoreRequest } = require(
  "../app/.vite/build/worker/git-core-request-dispatch.js",
);
const signal = new AbortController().signal;
const calls = [];
const deps = {
  signal,
  checkAvailability: async (...args) => (calls.push(["availability", ...args]), true),
  createBranch: async (...args) => (calls.push(["create", ...args]), { branch: "topic" }),
  discoverOrigins: async (...args) => (calls.push(["origins", ...args]), { origins: ["/repo"] }),
};

assert.deepEqual((await dispatchGitCoreRequest("availability", {}, deps)).result, { available: true });
assert.deepEqual((await dispatchGitCoreRequest("create-branch", { name: "topic" }, deps)).result, { branch: "topic" });
assert.deepEqual((await dispatchGitCoreRequest("git-origins", { dirs: ["/repo"] }, deps)).result, { origins: ["/repo"] });
assert.equal((await dispatchGitCoreRequest("unknown", {}, deps)).handled, false);
assert.deepEqual(calls, [
  ["availability", signal],
  ["create", { name: "topic" }, signal],
  ["origins", ["/repo"]],
]);
console.log("git core request dispatch tests passed");
