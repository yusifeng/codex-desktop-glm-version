import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  cleanDeletedPaths,
  cleanDeletedPathsBeforeRestore,
  overwriteSyncedBranch,
  resolveCommitTree,
} = require("../app/.vite/build/worker/git-synced-branch-overwrite.js");
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
const signal = new AbortController().signal;

function fixture(overrides = {}) {
  const calls = [],
    logs = [];
  const sourceRepository = { name: "source" },
    targetRepository = { name: "target" };
  const gitManager = {
    getWorktreeRepositoryForRoot: (root) =>
      root === "/source" ? sourceRepository : targetRepository,
  };
  const deps = {
    resolveObject: async (...args) => {
      calls.push(["resolve", ...args]);
      return "tree-head";
    },
    isObjectId: (value) => value.startsWith("tree-"),
    normalizeTreeSha: (value) => value,
    getHeadCommit: async (...args) => {
      calls.push(["head", ...args]);
      return "target-head";
    },
    createCommit: async (...args) => {
      calls.push(["commit", ...args]);
      return { success: true, commitSha: "synthetic" };
    },
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return {
        success: true,
        command: `git ${args[1].join(" ")}`,
        stdout: args[1][0] === "diff" ? "old.txt\n nested/deleted.txt \n" : "",
        stderr: "",
      };
    },
    formatExecOutput: (input) => ({
      formatted: input.command,
      fallback: input.fallbackOutput,
    }),
    chunkPaths: (paths, size) => {
      calls.push(["chunk", paths, size]);
      return [paths.slice(0, 1), paths.slice(1)];
    },
    logger: {
      info: (message) => logs.push(["info", message]),
      warning: (message) => logs.push(["warning", message]),
    },
    ...overrides,
  };
  return { calls, deps, gitManager, logs, sourceRepository, targetRepository };
}
const base = {
  gitRoot: "/source",
  targetRoot: null,
  branchName: "feature",
  headCommitSha: "head",
  treeSha: null,
  targetCurrentBranch: null,
  host: {},
  signal,
};

let state = fixture();
equal(
  await resolveCommitTree(state.sourceRepository, "head", signal, state.deps),
  "tree-head",
);
deepEqual(state.calls[0].slice(0, 3), [
  "resolve",
  state.sourceRepository,
  "head^{tree}",
]);
state = fixture({ resolveObject: async () => "bad", isObjectId: () => false });
await rejects(
  resolveCommitTree(state.sourceRepository, "head", signal, state.deps),
  /Unexpected head SHA/,
);

state = fixture();
equal(
  await cleanDeletedPaths("/repo", ["a", "b"], {}, signal, state.deps),
  null,
);
equal(state.calls.filter(([name]) => name === "git").length, 2);
equal(state.calls.find(([name]) => name === "chunk")[2], 1024);

let gitCalls = 0;
state = fixture({ runGit: async () => ({ success: ++gitCalls < 2 }) });
equal(
  (await cleanDeletedPaths("/repo", ["a", "b"], {}, signal, state.deps))
    .success,
  false,
);
equal(gitCalls, 2);

state = fixture();
await cleanDeletedPathsBeforeRestore(
  { gitRoot: "/repo", baseRef: "old", treeToRestore: "new", host: {}, signal },
  state.deps,
);
deepEqual(state.calls.find(([name]) => name === "chunk")[1], [
  "old.txt",
  "nested/deleted.txt",
]);
equal(state.logs.length, 0);

state = fixture({ runGit: async () => ({ success: false, stdout: "" }) });
await cleanDeletedPathsBeforeRestore(
  { gitRoot: "/repo", baseRef: "old", treeToRestore: "new", host: {}, signal },
  state.deps,
);
equal(state.logs[0][0], "warning");

state = fixture();
let result = await overwriteSyncedBranch(
  { ...base, gitManager: state.gitManager },
  state.deps,
);
equal(result.status, "success");
deepEqual(
  state.calls.find(
    ([name, , args]) => name === "git" && args[0] === "branch",
  )[2],
  ["branch", "-f", "feature", "head"],
);
equal(state.logs.at(-1)[0], "info");

state = fixture();
result = await overwriteSyncedBranch(
  {
    ...base,
    targetRoot: "/target",
    targetCurrentBranch: "other",
    treeSha: "tree-work",
    gitManager: state.gitManager,
  },
  state.deps,
);
equal(result.status, "success");
equal(state.calls.filter(([name]) => name === "commit").length, 1);
equal(
  state.calls.some(
    ([name, , args]) =>
      name === "git" && args[0] === "reset" && args[1] === "--hard",
  ),
  true,
);
equal(
  state.calls.some(
    ([name, , args]) =>
      name === "git" &&
      args[0] === "update-ref" &&
      args[1] === "refs/heads/other",
  ),
  true,
);
equal(
  state.calls.some(
    ([name, , args]) =>
      name === "git" && args[0] === "restore" && args[2] === "tree-work",
  ),
  true,
);

state = fixture({ resolveObject: async () => null });
result = await overwriteSyncedBranch(
  { ...base, gitManager: state.gitManager },
  state.deps,
);
equal(result.status, "command-error");

state = fixture({
  createCommit: async () => ({
    success: false,
    error: { stderr: "commit failed", stdout: "" },
  }),
});
result = await overwriteSyncedBranch(
  {
    ...base,
    treeSha: "tree-work",
    targetRoot: "/target",
    targetCurrentBranch: "other",
    gitManager: state.gitManager,
  },
  state.deps,
);
equal(result.status, "command-error");
equal(result.execOutput.fallback, "commit failed");

state = fixture({
  runGit: async (_root, args) =>
    args[0] === "branch"
      ? {
          success: false,
          command: "git branch",
          stdout: "",
          stderr: "branch failed",
        }
      : { success: true, stdout: "", stderr: "" },
});
result = await overwriteSyncedBranch(
  { ...base, gitManager: state.gitManager },
  state.deps,
);
equal(result.status, "command-error");
equal(result.execOutput.fallback, "branch failed");

console.log(`${count} worker git synced-branch overwrite assertions passed`);
