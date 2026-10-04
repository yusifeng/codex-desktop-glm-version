import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dispatchGitNodeRequest } = require(
  "../app/.vite/build/worker/git-node-request-dispatch.js",
);
const signal = new AbortController().signal;
const host = { id: "local" };
const calls = [];
const deps = {
  host,
  signal,
  requestGitHub: async (...args) => (calls.push(["github", ...args]), { ok: true }),
  resolveAutomationWritableRoots: async (params) => (calls.push(["roots", params]), ["/repo"]),
  readGitFileBinary: async (...args) => (calls.push(["binary", ...args]), "data"),
  getWorktreeRepository: async (...args) => (calls.push(["repo", ...args]), { root: "/repo" }),
  prepareWorktreeSnapshot: async (...args) => (calls.push(["snapshot", ...args]), { prepared: true }),
};

assert.deepEqual((await dispatchGitNodeRequest("github-request", { q: 1 }, deps)).result, { ok: true });
assert.deepEqual((await dispatchGitNodeRequest("automation-writable-roots", { cwd: "/repo" }, deps)).result, { roots: ["/repo"] });
assert.equal((await dispatchGitNodeRequest("read-git-file-binary", { path: "x" }, deps)).result, "data");
assert.deepEqual((await dispatchGitNodeRequest("prepare-worktree-snapshot", { cwd: "/repo", snapshotBranch: "snap" }, deps)).result, { prepared: true });
assert.equal((await dispatchGitNodeRequest("unknown", {}, deps)).handled, false);
assert.equal(calls[0][2], signal);
assert.equal(calls[2][3], signal);

await assert.rejects(
  dispatchGitNodeRequest("github-request", {}, { ...deps, requestGitHub: undefined }),
  /GitHub requests require a Node Git worker/,
);
await assert.rejects(
  dispatchGitNodeRequest("read-git-file-binary", {}, { ...deps, readGitFileBinary: undefined }),
  /Reading Git binary files requires a Node Git worker/,
);
await assert.rejects(
  dispatchGitNodeRequest("prepare-worktree-snapshot", { cwd: "/missing" }, {
    ...deps,
    getWorktreeRepository: async () => null,
  }),
  /gitRoot must belong to a Git worktree/,
);
console.log("git node request dispatch tests passed");
