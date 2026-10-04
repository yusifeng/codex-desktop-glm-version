import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveBranchSearchRequest } = require(
  "../app/.vite/build/worker/git-branch-search-request-handler.js",
);

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

const signal = new AbortController().signal;
const repo = { root: "/repo", host: { id: "remote" } };
const calls = [];
const manager = {
  getWorktreeRepositoryForRoot(root, host) {
    calls.push([root, host]);
    return repo;
  },
};
const result = await resolveBranchSearchRequest(
  { root: "/workspace", query: "feature", preserveRemoteRefs: true },
  {
    gitManager: manager,
    host: repo.host,
    signal,
    searchBranches: async (params) => {
      deepEqual(params, {
        worktreeRepo: repo,
        query: "feature",
        limit: 20,
        preserveRemoteRefs: true,
        signal,
      });
      return { branches: ["feature"], remoteBranchRefs: [] };
    },
  },
);
deepEqual(result, { branches: ["feature"], remoteBranchRefs: [] });
deepEqual(calls, [["/workspace", repo.host]]);

deepEqual(
  await resolveBranchSearchRequest(
    { root: "/workspace", query: "x", limit: 3 },
    {
      gitManager: manager,
      host: repo.host,
      signal,
      searchBranches: async ({ limit }) => ({ limit }),
    },
  ),
  { limit: 3 },
);

console.log(`${count} worker git branch-search request-handler assertions passed`);
