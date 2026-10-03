import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  EMPTY_GIT_TREE_SHA,
  emptyUntrackedPaths,
  getCommitParentSha,
  getCurrentHeadSnapshot,
  getGitMergeConflictPaths,
  hasGitMergeConflicts,
  normalizeOptionalHeadSha,
  prepareReviewComparison,
  readCurrentHeadSnapshot,
  resolveReviewComparisonArgs,
  resolveReviewComparisonForRepository,
} = require("../app/.vite/build/worker/git-review-comparison.js");

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

function fixture(options = {}) {
  const calls = { fetch: [], git: [], mergeBase: [], untracked: [] };
  const host = { id: "local" };
  const queryClient = {
    async fetchQuery(config) {
      calls.fetch.push(config);
      return options.returnQueryConfig ? config : config.queryFn();
    },
  };
  const worktreeRepo = { root: "/repo", host, queryClient };
  const signal = new AbortController().signal;
  const reviewSnapshot = { signal, worktreeRepo };
  worktreeRepo.reviewSnapshot = reviewSnapshot;
  const dependencies = {
    findMergeBase: async (repository, branch) => {
      calls.mergeBase.push([repository, branch]);
      return options.mergeBase === undefined ? "base-sha" : options.mergeBase;
    },
    getDefaultBranch: async () =>
      options.defaultBranch === undefined
        ? { branch: "main", remote: "origin" }
        : options.defaultBranch,
    getHeadCommit: async (...args) => {
      calls.head = args;
      return options.head === undefined ? "ABCDEF" : options.head;
    },
    getQueryMeta: () => ({ scope: "review" }),
    getUntrackedPaths: async (...args) => {
      calls.untracked.push(args);
      return (
        options.untracked ?? {
          success: true,
          gitRoot: "/repo",
          paths: ["new.txt", "extra.txt"],
          marker: true,
        }
      );
    },
    normalizeCommitSha: (sha) => sha.toLowerCase(),
    normalizeCwd: (cwd) => `normalized:${cwd}`,
    queryKey: (root, currentHost, type, ...parts) => [
      root,
      currentHost.id,
      type,
      ...parts,
    ],
    runGit: async (...args) => {
      calls.git.push(args);
      return options.gitResult ?? { success: true, stdout: "ABCDEF\n" };
    },
    validateObjectId: (sha) => /^[a-f0-9]+$/i.test(sha),
  };
  return { calls, dependencies, host, queryClient, reviewSnapshot, signal, worktreeRepo };
}

let state = fixture({
  gitResult: {
    success: true,
    stdout:
      "100644 aaa 1\tconflict.txt\0" +
      "100644 bbb 2\tconflict.txt\0" +
      "entry-without-tab\0" +
      "100644 ccc 3\tother.txt\0",
  },
  returnQueryConfig: true,
});
let query = await getGitMergeConflictPaths(
  state.worktreeRepo,
  state.signal,
  state.dependencies,
);
deepEqual(query.queryKey, ["/repo", "local", "merge-conflict-status"]);
equal(query.gcTime, 250);
equal(query.staleTime, 250);
deepEqual(query.meta, { scope: "review" });
deepEqual(await query.queryFn(), ["conflict.txt", "other.txt"]);
deepEqual(state.calls.git[0][1], ["ls-files", "-u", "-z"]);
equal(state.calls.git[0][3].signal, state.signal);

state = fixture({ gitResult: { success: false, stdout: "ignored" } });
equal(await hasGitMergeConflicts(state.worktreeRepo, state.signal, state.dependencies), false);
state = fixture({ gitResult: { success: true, stdout: "x\tfile\0" } });
equal(await hasGitMergeConflicts(state.worktreeRepo, state.signal, state.dependencies), true);

state = fixture({ returnQueryConfig: true });
query = await getCommitParentSha(
  state.worktreeRepo,
  "commit",
  state.signal,
  state.dependencies,
);
deepEqual(query.queryKey, ["/repo", "local", "commit-parent-sha", "commit"]);
equal(query.staleTime, Infinity);
equal(await query.queryFn(), "ABCDEF");
deepEqual(state.calls.git[0][1], ["rev-parse", "--verify", "--quiet", "commit^"]);
deepEqual(state.calls.git[0][3].allowedNonZeroExitCodes, [1, 128]);
state = fixture({ gitResult: { success: false, stdout: "" } });
equal(
  await getCommitParentSha(state.worktreeRepo, "root", state.signal, state.dependencies),
  null,
);

state = fixture();
equal(await getCurrentHeadSnapshot(state.worktreeRepo, state.signal, state.dependencies), "abcdef");
deepEqual(state.calls.head, [state.worktreeRepo, "HEAD", state.signal]);
state = fixture({ head: null });
equal(await getCurrentHeadSnapshot(state.worktreeRepo, state.signal, state.dependencies), null);
state = fixture({ gitResult: { success: true, stdout: "ABCDEF\n" } });
equal(await readCurrentHeadSnapshot(state.worktreeRepo, state.signal, state.dependencies), "abcdef");
deepEqual(state.calls.git[0][1], ["rev-parse", "--verify", "--quiet", "HEAD"]);
state = fixture({ gitResult: { success: false, stdout: "BAD" } });
equal(await readCurrentHeadSnapshot(state.worktreeRepo, state.signal, state.dependencies), null);
equal(normalizeOptionalHeadSha("ABCDEF", state.dependencies), "abcdef");
equal(normalizeOptionalHeadSha("", state.dependencies), null);
await rejects(
  async () => normalizeOptionalHeadSha("not a sha", state.dependencies),
  /Unexpected HEAD SHA/,
);

state = fixture();
deepEqual(
  await resolveReviewComparisonArgs(
    { baseBranch: "release", source: "branch", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "success", args: ["base-sha"] },
);
equal(state.calls.mergeBase[0][1], "release");
state = fixture();
await resolveReviewComparisonArgs(
  { source: "branch", worktreeRepo: state.worktreeRepo },
  state.dependencies,
);
equal(state.calls.mergeBase[0][1], "origin/main");
state = fixture({ defaultBranch: { branch: "upstream/main", remote: "origin" } });
await resolveReviewComparisonArgs(
  { source: "branch", worktreeRepo: state.worktreeRepo },
  state.dependencies,
);
equal(state.calls.mergeBase[0][1], "upstream/main");
state = fixture({ defaultBranch: null });
deepEqual(
  await resolveReviewComparisonArgs(
    { source: "branch", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "expected", reason: "default_branch_unavailable" },
);
state = fixture({ mergeBase: null });
deepEqual(
  await resolveReviewComparisonArgs(
    { baseBranch: "main", source: "branch", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "expected", reason: "merge_base_unavailable" },
);
deepEqual(
  await resolveReviewComparisonArgs({ source: "branch" }, state.dependencies),
  { type: "error", failureReason: "review_comparison" },
);

state = fixture({ gitResult: { success: false, stdout: "" } });
deepEqual(
  await resolveReviewComparisonArgs(
    { commitSha: "first", signal: state.signal, source: "commit", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "success", args: [EMPTY_GIT_TREE_SHA, "first"] },
);
deepEqual(
  await resolveReviewComparisonArgs({ source: "commit" }, state.dependencies),
  { type: "error", failureReason: "review_comparison" },
);
deepEqual(
  await resolveReviewComparisonArgs({ source: "staged" }, state.dependencies),
  { type: "success", args: ["--cached"] },
);
deepEqual(
  await resolveReviewComparisonArgs({ source: "unstaged" }, state.dependencies),
  { type: "success", args: [] },
);
state = fixture({ gitResult: { success: false, stdout: "" } });
deepEqual(
  await resolveReviewComparisonArgs(
    { signal: state.signal, source: "uncommitted", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "success", args: [EMPTY_GIT_TREE_SHA] },
);
state = fixture();
deepEqual(
  await resolveReviewComparisonArgs(
    { signal: state.signal, source: "uncommitted", worktreeRepo: state.worktreeRepo },
    state.dependencies,
  ),
  { type: "success", args: ["HEAD"] },
);

state = fixture();
let repositoryRequest;
let resolved = await resolveReviewComparisonForRepository(
  {
    cwd: "/cwd",
    gitManager: {
      getWorktreeRepository: async (...args) => {
        repositoryRequest = args;
        return state.worktreeRepo;
      },
    },
    host: state.host,
    includeUntrackedFiles: false,
    source: "staged",
  },
  state.dependencies,
);
deepEqual(repositoryRequest, ["normalized:/cwd", state.host]);
equal(resolved.type, "success");
deepEqual(resolved.diffArgs, ["--cached"]);
state = fixture();
deepEqual(
  await resolveReviewComparisonForRepository(
    {
      cwd: "/missing",
      gitManager: { getWorktreeRepository: async () => null },
      host: state.host,
      source: "staged",
    },
    state.dependencies,
  ),
  { type: "error", failureReason: "repository_unavailable" },
);

state = fixture({
  gitResult: {
    success: true,
    stdout: "1 a 1\tkeep.txt\0" + "1 b 1\tdrop.txt\0",
  },
});
resolved = await prepareReviewComparison(
  {
    includeUntrackedFiles: true,
    maxUntrackedFiles: 1,
    paths: ["keep.txt"],
    reviewSnapshot: state.reviewSnapshot,
    source: "unstaged",
  },
  state.dependencies,
);
equal(resolved.type, "success");
deepEqual(resolved.diffArgs, []);
equal(state.calls.untracked.length, 1);
deepEqual(state.calls.untracked[0], [state.worktreeRepo, ["keep.txt"], state.reviewSnapshot]);
deepEqual(resolved.untrackedPaths, {
  success: true,
  gitRoot: "/repo",
  paths: [],
  marker: true,
});
equal(resolved.untrackedPathSet.size, 0);
equal(resolved.unmergedPaths.type, "scanned");
deepEqual([...resolved.unmergedPaths.pathSet], ["keep.txt"]);

state = fixture();
resolved = await prepareReviewComparison(
  {
    includeUntrackedFiles: true,
    reviewSnapshot: state.reviewSnapshot,
    source: "staged",
  },
  state.dependencies,
);
equal(state.calls.untracked.length, 0);
equal(resolved.unmergedPaths.type, "not-scanned");
deepEqual(resolved.untrackedPaths, emptyUntrackedPaths("/repo"));

state = fixture({ untracked: { success: false, gitRoot: "/repo", paths: [] } });
deepEqual(
  await prepareReviewComparison(
    {
      includeUntrackedFiles: true,
      reviewSnapshot: state.reviewSnapshot,
      source: "branch",
    },
    state.dependencies,
  ),
  { type: "error", failureReason: "untracked_paths" },
);

console.log(`${count} worker git review comparison assertions passed`);
