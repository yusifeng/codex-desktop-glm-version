import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  resolveBlameFile,
  resolveCatFile,
  resolveCommitMessageDiff,
  resolveConfigValue,
  resolveIndexInfo,
  resolveRepositoryIdentity,
  resolveSubmodulePaths,
} = require("../app/.vite/build/worker/git-repository-read-request-handlers.js");

const signal = new AbortController().signal;
const calls = [];
const repository = {
  id: "repo",
  getConfigValueForScope: async (...args) => {
    calls.push(["config", ...args]);
    return "configured";
  },
};
const deps = {
  gitManager: {
    getWorktreeRepository: async () => repository,
    getWorktreeRepositoryForRoot: () => repository,
  },
  host: { id: "local" },
  signal,
  runAbortable: async (promise, receivedSignal) => {
    assert.equal(receivedSignal, signal);
    return promise;
  },
  getRepositoryIdentity: async (...args) => {
    calls.push(["identity", ...args]);
    return { repositoryFullName: "owner/repo" };
  },
  getCommitMessageDiff: async (...args) => ({ args }),
  getSubmodulePaths: async (...args) => {
    calls.push(["submodules", ...args]);
    return ["packages/one"];
  },
  getReviewSnapshot: (repo, generation) => repo && generation === 4 ? { generation } : null,
  catFile: async (...args) => {
    calls.push(["cat", ...args]);
    return [{ type: "success", lines: ["content"] }];
  },
  blameFile: async (...args) => ({ args }),
  getIndexInfo: async (...args) => {
    calls.push(["index", ...args]);
    return { lastModified: 42 };
  },
};

assert.deepEqual(await resolveRepositoryIdentity("/repo", deps), { repositoryFullName: "owner/repo" });
assert.deepEqual(calls[0], ["identity", repository, { signal }]);
const unavailable = { ...deps, gitManager: { ...deps.gitManager, getWorktreeRepository: async () => null } };
assert.equal(await resolveRepositoryIdentity("/missing", unavailable), null);

const diff = await resolveCommitMessageDiff({ cwd: "/repo", includeUnstaged: true }, deps);
assert.deepEqual(diff.args, ["/repo", true, deps.gitManager, deps.host]);
assert.deepEqual(await resolveSubmodulePaths("/repo", deps), { paths: ["packages/one"] });
assert.deepEqual(calls[1], ["submodules", repository, signal]);

const catParams = { cwd: "/repo", requests: [{ oid: "abc" }], maxObjectBytes: 123, snapshotGeneration: 4 };
assert.deepEqual(await resolveCatFile(catParams, deps), [{ type: "success", lines: ["content"] }]);
assert.deepEqual(calls[2], ["cat", repository, { maxObjectBytes: 123, requests: catParams.requests, reviewSnapshot: { generation: 4 } }, signal]);
const unknown = [{ type: "error", error: { type: "unknown" } }];
assert.deepEqual(await resolveCatFile(catParams, unavailable), unknown);
assert.deepEqual(await resolveCatFile({ ...catParams, snapshotGeneration: 3 }, deps), unknown);

const blame = await resolveBlameFile({ cwd: "/repo", path: "src/a.ts", ignored: true }, deps);
assert.deepEqual(blame.args, [deps.gitManager, { cwd: "/repo", path: "src/a.ts" }, deps.host, signal]);
assert.deepEqual(await resolveIndexInfo("/repo", deps), { lastModified: 42 });
assert.deepEqual(await resolveIndexInfo("/missing", unavailable), { lastModified: 0 });
assert.deepEqual(await resolveConfigValue("/repo", "user.name", "local", deps), { value: "configured" });
assert.deepEqual(calls.at(-1), ["config", "user.name", "local", signal]);

console.log("15 worker git repository read request handler assertions passed");
