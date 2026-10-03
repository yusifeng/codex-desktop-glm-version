import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  prefetchGitWatcherMetadata,
  resolveGitDirectoryPath,
  resolveGitMetadataPath,
  resolveGitWatcherHeadPath,
} = require("../app/.vite/build/worker/git-watcher-metadata.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

equal(resolveGitDirectoryPath(path.posix, "/repo", ".git"), "/repo/.git");
equal(resolveGitDirectoryPath(path.posix, "/repo", "/git/data"), "/git/data");
equal(
  resolveGitMetadataPath(path.posix, "/repo", "/git/data", "/meta/HEAD"),
  "/meta/HEAD",
);
equal(
  resolveGitMetadataPath(path.posix, "/repo", "/git/data", ".git/HEAD"),
  "/repo/.git/HEAD",
);
equal(
  resolveGitMetadataPath(path.posix, "/repo", "/git/data", "logs/HEAD"),
  "/git/data/logs/HEAD",
);
equal(
  resolveGitMetadataPath(
    path.win32,
    "C:\\repo",
    "C:\\git-data",
    "C:\\meta\\HEAD",
  ),
  "C:\\meta\\HEAD",
);

const repositoryForHead = { root: "/repo" };
const headCalls = [];
const headResult = Promise.resolve("/repo/.git/HEAD");
equal(
  resolveGitWatcherHeadPath(repositoryForHead, {
    resolveGitPath(repository, metadataPath) {
      headCalls.push([repository, metadataPath]);
      return headResult;
    },
  }),
  headResult,
);
deepEqual(headCalls, [[repositoryForHead, "HEAD"]]);

function fixture(options = {}) {
  const gitCalls = [];
  const getQueryStateCalls = [];
  const setQueryDataCalls = [];
  let platformPathCalls = 0;
  const host = {
    async platformPath() {
      platformPathCalls++;
      return options.path ?? path.posix;
    },
  };
  const repository = {
    host,
    queryClient: {
      getQueryState(query) {
        getQueryStateCalls.push(query);
        return options.existingQuery === JSON.stringify(query) ? {} : undefined;
      },
      setQueryData(query, value) {
        setQueryDataCalls.push([query, value]);
      },
    },
    root: options.root ?? "/repo",
  };
  const dependencies = {
    getSyncedBranchFileName: () => "codex-synced-branch.json",
    queryKey: (root, queryHost, type, ...parts) => [
      "git",
      queryHost === host ? "host" : "wrong-host",
      root,
      type,
      ...parts,
    ],
    resolveGitPath() {
      throw new Error("unused");
    },
    async runGit(...args) {
      gitCalls.push(args);
      return (
        options.result ?? {
          success: true,
          stdout:
            ".git\n.git/HEAD\n.git/index\n.git/codex-synced-branch.json\nrefs/heads/feature/test",
        }
      );
    },
  };
  return {
    dependencies,
    get platformPathCalls() {
      return platformPathCalls;
    },
    getQueryStateCalls,
    gitCalls,
    host,
    repository,
    setQueryDataCalls,
  };
}

let state = fixture();
const signal = new AbortController().signal;
deepEqual(
  await prefetchGitWatcherMetadata(
    state.repository,
    signal,
    state.dependencies,
  ),
  {
    gitDir: "/repo/.git",
    headPath: "/repo/.git/HEAD",
    headRef: "refs/heads/feature/test",
    indexPath: "/repo/.git/index",
    syncedBranchPath: "/repo/.git/codex-synced-branch.json",
  },
);
equal(state.gitCalls.length, 1);
equal(state.gitCalls[0][0], "/repo");
deepEqual(state.gitCalls[0][1], [
  "rev-parse",
  "--git-dir",
  "--git-path",
  "HEAD",
  "--git-path",
  "index",
  "--git-path",
  "codex-synced-branch.json",
  "--symbolic-full-name",
  "HEAD",
]);
equal(state.gitCalls[0][2], state.host);
equal(state.gitCalls[0][3].signal, signal);
deepEqual(state.getQueryStateCalls, [
  ["git", "host", "/repo", "git-dir"],
  ["git", "host", "/repo", "git-path", "HEAD"],
  ["git", "host", "/repo", "git-path", "index"],
  ["git", "host", "/repo", "git-path", "codex-synced-branch.json"],
]);
deepEqual(state.setQueryDataCalls, [
  [["git", "host", "/repo", "git-dir"], "/repo/.git"],
  [["git", "host", "/repo", "git-path", "HEAD"], "/repo/.git/HEAD"],
  [["git", "host", "/repo", "git-path", "index"], "/repo/.git/index"],
  [
    ["git", "host", "/repo", "git-path", "codex-synced-branch.json"],
    "/repo/.git/codex-synced-branch.json",
  ],
]);
equal(state.platformPathCalls, 1);

state = fixture({
  result: {
    success: true,
    stdout:
      "/data/worktree.git\r\nHEAD\r\nindex\r\ncodex-synced-branch.json\r\nHEAD",
  },
});
deepEqual(
  await prefetchGitWatcherMetadata(
    state.repository,
    undefined,
    state.dependencies,
  ),
  {
    gitDir: "/data/worktree.git",
    headPath: "/data/worktree.git/HEAD",
    headRef: null,
    indexPath: "/data/worktree.git/index",
    syncedBranchPath: "/data/worktree.git/codex-synced-branch.json",
  },
);

for (const existingQuery of [
  ["git", "host", "/repo", "git-dir"],
  ["git", "host", "/repo", "git-path", "HEAD"],
  ["git", "host", "/repo", "git-path", "index"],
  ["git", "host", "/repo", "git-path", "codex-synced-branch.json"],
]) {
  state = fixture({ existingQuery: JSON.stringify(existingQuery) });
  equal(
    await prefetchGitWatcherMetadata(
      state.repository,
      undefined,
      state.dependencies,
    ),
    null,
  );
  equal(state.gitCalls.length, 0);
  equal(state.setQueryDataCalls.length, 0);
}

for (const result of [
  { success: false, stdout: "failure" },
  { success: true, stdout: "" },
  { success: true, stdout: ".git\nHEAD\nindex\nsync" },
  { success: true, stdout: ".git\nHEAD\n\nsync\nHEAD" },
  { success: true, stdout: ".git\nHEAD\nindex\nsync\nrefs/tags/v1" },
  { success: true, stdout: ".git\nHEAD\nindex\nsync\nrefs/heads/" },
]) {
  state = fixture({ result });
  equal(
    await prefetchGitWatcherMetadata(
      state.repository,
      undefined,
      state.dependencies,
    ),
    null,
  );
  equal(state.setQueryDataCalls.length, 0);
  equal(state.platformPathCalls, 0);
}

console.log(`${count} worker git watcher metadata assertions passed`);
