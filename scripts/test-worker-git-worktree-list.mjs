import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { listGitWorktrees, parseWorktreeList } = require(
  "../app/.vite/build/worker/git-worktree-list.js",
);

let assertions = 0;
const equal = (...args) => {
  assertions += 1;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertions += 1;
  assert.deepEqual(...args);
};
const rejects = async (...args) => {
  assertions += 1;
  await assert.rejects(...args);
};

const output = [
  "worktree /repo",
  "HEAD abc",
  "branch refs/heads/main",
  "locked reason",
  "",
  "worktree /repo/feature\r",
  "HEAD def\r",
  "branch topic\r",
  "prunable reason\r",
  "",
  "worktree /repo/detached",
  "HEAD 123",
  "branch refs/heads/old",
  "detached",
].join("\n");
deepEqual(parseWorktreeList(output, (root) => root), [
  {
    root: "/repo",
    prunable: false,
    locked: true,
    headRef: { sha: "abc", type: "branch", string: "main" },
  },
  {
    root: "/repo/feature",
    prunable: true,
    locked: false,
    headRef: { sha: "def", type: "branch", string: "topic" },
  },
  {
    root: "/repo/detached",
    prunable: false,
    locked: false,
    headRef: { sha: "123", type: "detached" },
  },
]);
deepEqual(parseWorktreeList("unknown\nworktree \nHEAD ignored\n", (root) => root), []);
deepEqual(parseWorktreeList("worktree /a\nHEAD 1\nworktree /b\nHEAD 2\n", (root) => `root:${root}`), [
  { root: "root:/a", prunable: false, locked: false, headRef: { sha: "1", type: "detached" } },
  { root: "root:/b", prunable: false, locked: false, headRef: { sha: "2", type: "detached" } },
]);
deepEqual(parseWorktreeList("", (root) => root), []);

function fixture(result = { success: true, stdout: output }) {
  const calls = { query: [], run: [] };
  const host = { id: "local" };
  const repository = {
    root: "/repo",
    host,
    queryClient: {
      fetchQuery: async (options) => {
        calls.query.push(options);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    getQueryMeta: () => ({ family: "short" }),
    normalizeRoot: (root) => root,
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => {
      calls.run.push(args);
      return result;
    },
  };
  return { calls, dependencies, host, repository };
}

const signal = new AbortController().signal;
let state = fixture();
equal((await listGitWorktrees(state.repository, signal, state.dependencies)).length, 3);
deepEqual(state.calls.query[0].queryKey, ["key", "/repo", state.host, "worktrees"]);
equal(state.calls.query[0].gcTime, 250);
equal(state.calls.query[0].staleTime, 250);
deepEqual(state.calls.query[0].meta, { family: "short" });
deepEqual(state.calls.run[0], [
  "/repo",
  ["worktree", "list", "--porcelain"],
  state.host,
  { signal },
]);

state = fixture({ success: true, stdout: undefined });
deepEqual(await listGitWorktrees(state.repository, signal, state.dependencies), []);
for (const result of [
  { success: false, stderr: "stderr", stdout: "stdout" },
  { success: false, stderr: "", stdout: "stdout" },
  { success: false, stderr: "", stdout: "" },
]) {
  state = fixture(result);
  const expectedMessage = result.stderr || result.stdout || "Failed to list worktrees";
  await rejects(
    listGitWorktrees(state.repository, signal, state.dependencies),
    new RegExp(expectedMessage),
  );
}

console.log(`${assertions} worker git worktree list assertions passed`);
