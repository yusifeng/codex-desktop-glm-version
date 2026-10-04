import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveStableMetadata } = require("../app/.vite/build/worker/git-stable-metadata-request-handler.js");

const calls = [];
const deps = {
  host: { id: "local" },
  gitManager: { getStableMetadata: async (...args) => { calls.push(["metadata", ...args]); return null; } },
  ensureWatchingForGitInit: async (...args) => calls.push(["ensure", ...args]),
  disposeGitInitWatcher: (...args) => calls.push(["dispose", ...args]),
  encodeResult: (value) => ({ type: "ok", value }),
};

assert.deepEqual(await resolveStableMetadata({ cwd: "/missing", watchForGitInit: true }, deps), { type: "ok", value: null });
assert.deepEqual(calls, [["metadata", "/missing", deps.host], ["ensure", "/missing", deps.host]]);

calls.length = 0;
deps.gitManager.getStableMetadata = async (...args) => { calls.push(["metadata", ...args]); return { root: "/repo", commonDir: "/common", ignored: true }; };
assert.deepEqual(await resolveStableMetadata({ cwd: "/repo", watchForGitInit: false }, deps), { type: "ok", value: { root: "/repo", commonDir: "/common" } });
assert.deepEqual(calls, [["metadata", "/repo", deps.host], ["dispose", "/repo", deps.host]]);

calls.length = 0;
deps.gitManager.getStableMetadata = async () => null;
assert.deepEqual(await resolveStableMetadata({ cwd: "/missing", watchForGitInit: false }, deps), { type: "ok", value: null });
assert.deepEqual(calls, [["dispose", "/missing", deps.host]]);

console.log("3 worker stable metadata request handler assertions passed");
