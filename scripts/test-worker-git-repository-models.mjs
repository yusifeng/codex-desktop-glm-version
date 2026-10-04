import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  GitReviewSnapshotStaleError,
  ORIGIN_URL_CACHE_MS,
  createGitRepositoryModels,
} = require("../app/.vite/build/worker/git-repository-models.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };
const ok = (...args) => { assertions += 1; assert.ok(...args); };
const isStaleError = (error) => error instanceof GitReviewSnapshotStaleError;

function fixture(options = {}) {
  const calls = {
    clearShort: [],
    config: [],
    configScope: [],
    diff: [],
    git: [],
    invalidateChange: [],
    invalidateWatch: [],
    memoize: [],
    overlap: [],
    queryKeys: [],
    readConfig: [],
    setConfig: [],
  };
  const queryClient = {
    invalidations: [],
    removals: [],
    invalidateQueries(value) { this.invalidations.push(value); },
    removeQueries(value) { this.removals.push(value); },
  };
  const dependencies = {
    clearShortLivedQueries: (...args) => calls.clearShort.push(args),
    createQueryClient: () => queryClient,
    getConfigValue: async (...args) => {
      calls.config.push(args);
      return options.configValue ?? "config-value";
    },
    getConfigValueForScope: async (...args) => {
      calls.configScope.push(args);
      return options.scopeValue ?? "scope-value";
    },
    invalidateQueriesForRepoChange: (...args) => calls.invalidateChange.push(args),
    invalidateWatchScopedQueries: (...args) => calls.invalidateWatch.push(args),
    memoize: (fn, memoizeOptions) => {
      calls.memoize.push(memoizeOptions);
      let initialized = false;
      let cached;
      return (...args) => {
        if (!initialized) {
          initialized = true;
          cached = fn(...args);
        }
        return cached;
      };
    },
    pathPosix: path.posix,
    pathsOverlap: (...args) => {
      calls.overlap.push(args);
      if (options.pathsOverlap) return options.pathsOverlap(...args);
      const [, readPaths, changedPaths] = args;
      return changedPaths == null || changedPaths.some((changed) => readPaths.includes(changed));
    },
    queryKey: (...args) => {
      calls.queryKeys.push(args);
      return ["git-key", ...args];
    },
    readConfigValue: async (...args) => {
      calls.readConfig.push(args);
      return options.originUrl ?? "git@example/repo.git";
    },
    runDiff: async (...args) => {
      calls.diff.push(args);
      if (options.runDiff) return options.runDiff(...args);
      return { kind: "diff" };
    },
    runGit: async (...args) => {
      calls.git.push(args);
      if (options.runGit) return options.runGit(...args);
      return { kind: "git" };
    },
    setConfigValueForScope: async (...args) => {
      calls.setConfig.push(args);
      return options.setConfigResult ?? true;
    },
  };
  const models = createGitRepositoryModels(dependencies);
  const host = { id: "host", isLocal: true };
  return { calls, dependencies, host, models, queryClient };
}

{
  const state = fixture();
  equal(ORIGIN_URL_CACHE_MS, 86_400_000);
  const repository = new state.models.GitRepository("/common", state.host);
  deepEqual(state.calls.memoize[0], { length: 0, promise: true, maxAge: ORIGIN_URL_CACHE_MS });
  equal(repository.getCommonDir(), "/common");
  equal(repository.commonDir, "/common");
  equal(repository.host, state.host);
  const firstSignal = new AbortController().signal;
  const secondSignal = new AbortController().signal;
  const first = repository.getOriginUrl(firstSignal);
  const second = repository.getOriginUrl(secondSignal);
  equal(first, second);
  equal(await first, "git@example/repo.git");
  deepEqual(state.calls.readConfig, [["/common", ["remote.origin.url"], state.host, firstSignal]]);
}

{
  const error = new GitReviewSnapshotStaleError();
  equal(error.name, "GitReviewSnapshotStaleError");
  equal(error.message, "Git snapshot became stale");
  ok(error instanceof Error);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const snapshot = repository.reviewSnapshot;
  equal(repository.root, "/repo");
  equal(repository.host, state.host);
  equal(repository.queryClient, state.queryClient);
  equal(snapshot.generation, 0);
  equal(snapshot.worktreeRepo, repository);
  equal(snapshot.signal.aborted, false);
  equal(await snapshot.read(async () => "value"), "value");
  equal(repository.requireReviewSnapshot(0), snapshot);
  await rejects(async () => repository.requireReviewSnapshot(1), isStaleError);

  deepEqual(snapshot.queryKey("files", "a", 2), [
    "git-key", "/repo", state.host, "files", "review", "0", "a", 2,
  ]);
  deepEqual(state.calls.queryKeys.at(-1), ["/repo", state.host, "files", "review", "0", "a", 2]);

  deepEqual(await snapshot.git(["status"], { trim: false }), { kind: "git" });
  deepEqual(state.calls.git[0].slice(0, 3), ["/repo", ["status"], state.host]);
  equal(state.calls.git[0][3].trim, false);
  equal(state.calls.git[0][3].signal, snapshot.signal);
  deepEqual(await snapshot.gitDiff(["HEAD"], { binary: true }), { kind: "diff" });
  deepEqual(state.calls.diff[0].slice(0, 3), ["/repo", ["HEAD"], state.host]);
  equal(state.calls.diff[0][3].binary, true);
  equal(state.calls.diff[0][3].signal, snapshot.signal);

  const external = new AbortController();
  const combined = snapshot.commandOptions({ signal: external.signal, marker: 1 });
  equal(combined.marker, 1);
  equal(combined.signal.aborted, false);
  external.abort();
  equal(combined.signal.aborted, true);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const original = Error("original");
  await rejects(() => repository.reviewSnapshot.read(async () => { throw original; }), (error) => error === original);

  const stale = repository.reviewSnapshot;
  repository.advanceReviewSnapshot();
  equal(stale.signal.aborted, true);
  await rejects(() => stale.read(async () => "never"), isStaleError);
  await rejects(async () => repository.requireReviewSnapshot(0), isStaleError);
  equal(repository.requireReviewSnapshot(1), repository.reviewSnapshot);
}

{
  let resolveOperation;
  const pendingOperation = new Promise((resolve) => { resolveOperation = resolve; });
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const snapshot = repository.reviewSnapshot;
  const pendingRead = snapshot.read(() => pendingOperation);
  repository.advanceReviewSnapshot();
  resolveOperation("late result");
  await rejects(pendingRead, isStaleError);
}

{
  let rejectOperation;
  const pendingOperation = new Promise((_resolve, reject) => { rejectOperation = reject; });
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const pendingRead = repository.reviewSnapshot.read(() => pendingOperation);
  repository.advanceReviewSnapshot();
  rejectOperation(Error("underlying failure"));
  await rejects(pendingRead, isStaleError);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  equal(repository.gitReadGeneration, 0);
  equal(repository.gitConfigReadGeneration, 0);
  equal(repository.gitHeadReadGeneration, 0);
  equal(repository.watchScopedGitReadGeneration, 0);
  equal(repository.getReviewWorkingTreeFileGeneration("dir/file.txt"), 0);
  equal(repository.getReviewWorkingTreeFileGeneration("dir/file.txt"), 0);
  equal(repository.getReviewWorkingTreeFileGeneration("other.txt"), 1);
  deepEqual(repository.getReviewWorkingTreeFileReadPaths("a/b/file.txt"), [
    "a/b/file.txt", ".gitattributes", "a/b/.gitattributes", "a/.gitattributes",
  ]);

  repository.clearShortLivedGitReadCaches();
  equal(repository.gitReadGeneration, 1);
  equal(repository.gitConfigReadGeneration, 0);
  equal(repository.gitHeadReadGeneration, 0);
  equal(repository.watchScopedGitReadGeneration, 0);
  equal(repository.getReviewWorkingTreeFileGeneration("dir/file.txt"), 2);
  deepEqual(state.calls.clearShort, [[state.queryClient]]);

  repository.clearGitReadCaches();
  equal(repository.gitReadGeneration, 2);
  equal(repository.gitConfigReadGeneration, 1);
  equal(repository.gitHeadReadGeneration, 1);
  equal(repository.watchScopedGitReadGeneration, 1);
  equal(repository.reviewSnapshot.generation, 0);
  equal(repository.getReviewWorkingTreeFileGeneration("dir/file.txt"), 3);
  deepEqual(state.calls.invalidateWatch, [[state.queryClient]]);
  deepEqual(state.queryClient.invalidations, [{ refetchType: "none" }]);

  repository.invalidateGitReadCachesForRepoRecovery();
  equal(repository.gitReadGeneration, 3);
  equal(repository.gitConfigReadGeneration, 2);
  equal(repository.gitHeadReadGeneration, 2);
  equal(repository.watchScopedGitReadGeneration, 2);
  equal(repository.reviewSnapshot.generation, 1);

  repository.invalidateGitReadCachesForMutation();
  equal(repository.gitReadGeneration, 4);
  equal(repository.gitConfigReadGeneration, 2);
  equal(repository.gitHeadReadGeneration, 2);
  equal(repository.watchScopedGitReadGeneration, 3);
  equal(repository.reviewSnapshot.generation, 2);
  equal(state.calls.clearShort.length, 2);
  equal(state.calls.invalidateWatch.length, 3);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  repository.invalidateGitReadCachesForRepoChange("worktree-topology");
  deepEqual(state.queryClient.invalidations, [{
    queryKey: ["git-key", "/repo", state.host, "worktrees"],
    exact: true,
    refetchType: "none",
  }]);
  equal(repository.gitReadGeneration, 0);
  equal(repository.reviewSnapshot.generation, 0);
  equal(state.calls.invalidateChange.length, 0);

  repository.invalidateGitReadCachesForRepoChange("local-refs", ["refs/heads/main"]);
  equal(repository.gitReadGeneration, 0);
  equal(repository.watchScopedGitReadGeneration, 1);
  equal(repository.reviewSnapshot.generation, 0);
  deepEqual(state.calls.invalidateChange[0], [
    state.queryClient, "/repo", "local-refs", ["refs/heads/main"],
  ]);
}

for (const [kind, expected] of [
  ["config", { read: 1, config: 1, head: 0, watch: 1 }],
  ["head", { read: 1, config: 0, head: 1, watch: 1 }],
  ["remote-refs", { read: 1, config: 0, head: 0, watch: 1 }],
  ["index", { read: 1, config: 0, head: 0, watch: 0 }],
]) {
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  repository.getReviewWorkingTreeFileGeneration("file.txt");
  repository.invalidateGitReadCachesForRepoChange(kind);
  equal(repository.gitReadGeneration, expected.read);
  equal(repository.gitConfigReadGeneration, expected.config);
  equal(repository.gitHeadReadGeneration, expected.head);
  equal(repository.watchScopedGitReadGeneration, expected.watch);
  equal(repository.reviewSnapshot.generation, 1);
  equal(repository.getReviewWorkingTreeFileGeneration("file.txt"), 1);
  deepEqual(state.calls.invalidateChange, [[state.queryClient, "/repo", kind, undefined]]);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const nestedBefore = repository.getReviewWorkingTreeFileGeneration("a/b/file.txt");
  const otherBefore = repository.getReviewWorkingTreeFileGeneration("other.txt");
  repository.invalidateGitReadCachesForRepoChange("working-tree", ["a/.gitattributes"]);
  const nestedAfter = repository.getReviewWorkingTreeFileGeneration("a/b/file.txt");
  const otherAfter = repository.getReviewWorkingTreeFileGeneration("other.txt");
  equal(nestedBefore, 0);
  equal(otherBefore, 1);
  equal(nestedAfter, 2);
  equal(otherAfter, 1);
  equal(repository.gitReadGeneration, 1);
  equal(repository.reviewSnapshot.generation, 1);
  deepEqual(state.calls.overlap.map((call) => call.slice(0, 2)), [
    ["/repo", ["a/b/file.txt", ".gitattributes", "a/b/.gitattributes", "a/.gitattributes"]],
    ["/repo", ["other.txt", ".gitattributes"]],
  ]);
  deepEqual(state.calls.overlap.map((call) => call[2]), [
    ["a/.gitattributes"], ["a/.gitattributes"],
  ]);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  repository.getReviewWorkingTreeFileGeneration("file.txt");
  repository.invalidateGitReadCachesForRepoChange("working-tree");
  equal(repository.getReviewWorkingTreeFileGeneration("file.txt"), 1);
  equal(state.calls.overlap.length, 0);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const signal = new AbortController().signal;
  equal(await repository.getConfigValue("a.b", signal), "config-value");
  deepEqual(state.calls.config, [[repository, ["a.b"], signal]]);
  equal(await repository.getConfigValueForScope("a.b", "worktree", signal), "scope-value");
  deepEqual(state.calls.configScope, [[repository, "a.b", "worktree", signal]]);
  equal(await repository.setConfigValueForScope("a.b", "value", "worktree", signal), true);
  deepEqual(state.calls.setConfig, [["/repo", "a.b", "value", "worktree", state.host, signal]]);
  equal(repository.gitConfigReadGeneration, 1);
  equal(repository.gitReadGeneration, 1);
  equal(repository.watchScopedGitReadGeneration, 1);
  equal(repository.reviewSnapshot.generation, 1);

  const unchanged = fixture({ setConfigResult: false });
  const unchangedRepo = new unchanged.models.GitWorktreeRepository("/repo", unchanged.host);
  equal(await unchangedRepo.setConfigValueForScope("a.b", "value", "worktree"), false);
  equal(unchangedRepo.gitReadGeneration, 0);
  equal(unchangedRepo.reviewSnapshot.generation, 0);
}

{
  const state = fixture();
  const repository = new state.models.GitWorktreeRepository("/repo", state.host);
  const first = repository.reviewSnapshot;
  repository.advanceReviewSnapshot();
  equal(repository.reviewSnapshot.generation, 1);
  equal(first.signal.aborted, true);
  equal(state.queryClient.removals.length, 1);
  const { predicate, type } = state.queryClient.removals[0];
  equal(type, "inactive");
  equal(predicate({ queryKey: ["git", "host", "/repo", "files", "review", "0"], state: { fetchStatus: "idle" } }), true);
  equal(predicate({ queryKey: ["git", "host", "/repo", "files", "review", "1"], state: { fetchStatus: "idle" } }), false);
  equal(predicate({ queryKey: ["git", "host", "/repo", "files", "review", "0"], state: { fetchStatus: "fetching" } }), false);
  equal(predicate({ queryKey: ["git", "host", "/repo", "review-working-tree-file-metadata"], state: { fetchStatus: "fetching" } }), true);
  equal(predicate({ queryKey: ["git", "host", "/repo", "review-working-tree-file-metadata"], state: { fetchStatus: "idle" } }), false);
}

console.log(`git repository models tests passed (${assertions} assertions)`);
