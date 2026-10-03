import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  queryGitBranchRefs,
  scanGitBranchRefs,
  searchGitBranches,
} = require("../app/.vite/build/worker/git-branch-search-runtime.js");
let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  count++;
  await assert.rejects(...args);
};
const encoder = new TextEncoder();

function fixture(outputs = {}, overrides = {}) {
  const calls = [];
  const worktreeRepo = {
    root: "/repo",
    host: { id: "local" },
    queryClient: {
      fetchQuery: async (options) => {
        calls.push(["query", options]);
        return options.queryFn();
      },
    },
  };
  const deps = {
    queryKey: (...parts) => parts,
    queryMeta: () => ({ family: "branch-search" }),
    runGit: async (_root, args, _host, options) => {
      calls.push(["git", args, options]);
      const kind = args.some((arg) => arg.startsWith("refs/heads"))
        ? "heads"
        : "remotes";
      for (const chunk of outputs[kind] ?? [])
        options.onStdoutRaw(encoder.encode(chunk));
      return { success: true };
    },
    ...overrides,
  };
  return { calls, deps, worktreeRepo };
}

let state = fixture();
deepEqual(
  await searchGitBranches(
    { worktreeRepo: state.worktreeRepo, query: "---", limit: 20 },
    state.deps,
  ),
  { branches: [], remoteBranchRefs: [] },
);
equal(state.calls.length, 0);

state = fixture({
  heads: ["refs/heads/foo-", "bar\nrefs/heads/other\n"],
  remotes: [
    "refs/remotes/origin/foo-bar\nrefs/remotes/upstream/foo-bar-extra\n",
  ],
});
deepEqual(
  await searchGitBranches(
    { worktreeRepo: state.worktreeRepo, query: "foo bar", limit: 5 },
    state.deps,
  ),
  {
    branches: ["foo-bar", "foo-bar-extra"],
    remoteBranchRefs: [],
  },
);
equal(state.calls.filter(([name]) => name === "query").length, 2);
equal(state.calls.filter(([name]) => name === "git").length, 2);
equal(state.calls.find(([name]) => name === "query")[1].gcTime, 250);

state = fixture({ heads: [], remotes: ["refs/remotes/origin/topic\n"] });
deepEqual(
  await searchGitBranches(
    {
      worktreeRepo: state.worktreeRepo,
      query: "topic",
      limit: 5,
      preserveRemoteRefs: true,
    },
    state.deps,
  ),
  {
    branches: [],
    remoteBranchRefs: ["refs/remotes/origin/topic"],
  },
);

state = fixture({ heads: ["refs/heads/a\nrefs/heads/b\n"] });
deepEqual(
  await searchGitBranches(
    { worktreeRepo: state.worktreeRepo, query: "a", limit: 0 },
    state.deps,
  ),
  { branches: ["a"], remoteBranchRefs: [] },
);
equal(state.calls.filter(([name]) => name === "git").length, 1);
equal(state.calls.find(([name]) => name === "git")[2].signal.aborted, true);

state = fixture({}, { runGit: async () => ({ success: false }) });
deepEqual(
  await scanGitBranchRefs(
    {
      boundedLimit: 2,
      preserveRemoteRefs: false,
      refPattern: "refs/heads",
      terms: ["x"],
      worktreeRepo: state.worktreeRepo,
    },
    state.deps,
  ),
  [],
);

state = fixture({ heads: ["refs/heads/topic\n"] });
const queried = await queryGitBranchRefs(
  {
    boundedLimit: 2,
    preserveRemoteRefs: false,
    refPattern: "refs/heads",
    terms: ["topic"],
    worktreeRepo: state.worktreeRepo,
  },
  state.deps,
);
deepEqual(queried, ["topic"]);
deepEqual(state.calls[0][1].queryKey.slice(-4), [
  "refs/heads",
  ["topic"],
  "2",
  "false",
]);
deepEqual(state.calls[0][1].meta, { family: "branch-search" });

const controller = new AbortController();
const reason = new Error("parent stopped");
controller.abort(reason);
state = fixture({}, { runGit: async () => ({ success: false }) });
await rejects(
  scanGitBranchRefs(
    {
      boundedLimit: 2,
      preserveRemoteRefs: false,
      refPattern: "refs/heads",
      terms: ["x"],
      worktreeRepo: state.worktreeRepo,
      signal: controller.signal,
    },
    state.deps,
  ),
  (error) => error === reason,
);

console.log(`${count} worker git branch-search runtime assertions passed`);
