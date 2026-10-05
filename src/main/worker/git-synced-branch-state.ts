import { emptyDiffStats, parseNumstat } from "./git-synced-branch-state-policy";

type SyncedBranchStateDependencies = {
  readConfig: (repository: any, signal: AbortSignal) => Promise<any>;
  hasConflicts: (repository: any, signal: AbortSignal) => Promise<boolean>;
  normalizeBranch: (branch: string) => string;
  queryKey: (...parts: any[]) => any;
  queryMeta: () => any;
  runDiff: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  listWorktrees: (repository: any, signal: AbortSignal) => Promise<any[]>;
  resolveObject: (
    repository: any,
    ref: string,
    signal: AbortSignal,
  ) => Promise<string | null>;
  isObjectId: (value: string) => boolean;
  normalizeCommitSha: (value: string) => string;
  getUntrackedPaths: (repository: any) => Promise<any>;
  getWorkingTree: (repository: any, options: any) => Promise<string>;
  getHeadCommit: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  getCurrentBranch: (repository: any) => Promise<string | null>;
  compareAhead: (
    repository: any,
    left: string,
    right: string,
    signal: AbortSignal,
  ) => Promise<any>;
  logger: { warning: (message: string, detail: any) => void };
};

function queryDiffStats(
  repository: any,
  left: string,
  right: string,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: deps.queryKey(
      repository.root,
      repository.host,
      `diff-stats`,
      left,
      right,
    ),
    gcTime: 250,
    meta: deps.queryMeta(),
    queryFn: () =>
      deps.runDiff(
        repository.root,
        [`--numstat`, left, right],
        repository.host,
        {
          allowedNonZeroExitCodes: [0, 1],
          signal,
        },
      ),
    staleTime: 250,
  });
}

async function resolveDiffStats(
  repository: any,
  left: string,
  right: string,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  const result = await queryDiffStats(repository, left, right, signal, deps);
  return !result.success || !result.stdout
    ? emptyDiffStats
    : parseNumstat(result.stdout);
}

async function resolveSyncedBranch(
  repository: any,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  const config = await deps.readConfig(repository, signal);
  if (!config) return { branch: null, base: null, hasConflicts: false };
  return {
    branch: deps.normalizeBranch(config.branch),
    base: config.lastSyncedTreeRef,
    hasConflicts: await deps.hasConflicts(repository, signal),
  };
}

async function findBranchWorktree(
  repository: any,
  branch: string,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  return (
    (await deps.listWorktrees(repository, signal)).find(
      (worktree) =>
        worktree.headRef.type === `branch` &&
        worktree.headRef.string === branch,
    )?.root ?? null
  );
}

async function resolveCommit(
  repository: any,
  ref: string,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  const resolved = await deps.resolveObject(repository, ref, signal);
  if (resolved && !deps.isObjectId(resolved))
    throw Error(`Unexpected ${ref} SHA: ${resolved}`);
  return resolved ? deps.normalizeCommitSha(resolved) : null;
}

async function resolveSyncedBranchState(
  cwd: string,
  gitManager: any,
  host: any,
  signal: AbortSignal,
  deps: SyncedBranchStateDependencies,
) {
  const repository = await gitManager.getWorktreeRepository(cwd, host);
  if (!repository)
    throw Error(`Unable to resolve git root for synced branch status.`);
  const root = repository.root;
  const untrackedPaths = deps.getUntrackedPaths(repository);
  const config = await deps.readConfig(repository, signal);
  if (!config)
    throw Error(`No synced branch config found for the current worktree.`);
  try {
    const normalizedBranch = deps.normalizeBranch(config.branch);
    const workingTreePromise = deps.getWorkingTree(repository, {
      signal,
      untrackedPathsPromise: untrackedPaths,
    });
    const [
      branchRoot,
      headCommitSha,
      workingTreeRef,
      branchCommitSha,
      currentBranch,
    ] = await Promise.all([
      findBranchWorktree(repository, normalizedBranch, signal, deps),
      deps.getHeadCommit(repository, signal),
      workingTreePromise,
      resolveCommit(repository, config.branch, signal, deps),
      deps.getCurrentBranch(repository),
    ]);
    if (currentBranch) throw Error(`Worktree has a branch checked out.`);
    if (!headCommitSha) throw Error(`Unable to resolve worktree head state.`);
    if (!branchCommitSha)
      throw Error(`Unable to resolve synced branch head SHA.`);

    let branchRepository = null;
    let branchWorkingTreePromise: Promise<string | null>;
    if (branchRoot) {
      if (branchRoot === root) {
        branchRepository = repository;
        branchWorkingTreePromise = deps.getWorkingTree(repository, {
          signal,
          untrackedPathsPromise: untrackedPaths,
        });
      } else {
        branchRepository = gitManager.getWorktreeRepositoryForRoot(
          branchRoot,
          host,
        );
        branchWorkingTreePromise = deps.getWorkingTree(branchRepository, {
          signal,
          untrackedPathsPromise: deps.getUntrackedPaths(branchRepository),
        });
      }
    } else {
      branchWorkingTreePromise = Promise.resolve(null);
    }
    const [ahead, branchWorkingTreeRef] = await Promise.all([
      deps.compareAhead(repository, branchCommitSha, headCommitSha, signal),
      branchWorkingTreePromise,
    ]);
    const noChanges = (ref: string) => ({
      leftRef: ref,
      rightRef: ref,
      ...emptyDiffStats,
    });
    const worktreeDiff = workingTreeRef
      ? {
          ...(await resolveDiffStats(
            repository,
            headCommitSha,
            workingTreeRef,
            signal,
            deps,
          )),
          leftRef: headCommitSha,
          rightRef: workingTreeRef,
        }
      : noChanges(headCommitSha);
    const branchDiff =
      branchRepository && branchWorkingTreeRef
        ? {
            ...(await resolveDiffStats(
              branchRepository,
              branchCommitSha,
              branchWorkingTreeRef,
              signal,
              deps,
            )),
            leftRef: branchCommitSha,
            rightRef: branchWorkingTreeRef,
          }
        : noChanges(branchCommitSha);
    return {
      branch: config.branch,
      worktreeSnapshot: {
        root,
        headCommitSha,
        workingTreeRef: workingTreeRef ?? undefined,
      },
      branchSnapshot: branchRoot
        ? {
            checkedOut: true,
            snapshot: {
              root: branchRoot,
              headCommitSha: branchCommitSha,
              workingTreeRef: branchWorkingTreeRef ?? undefined,
            },
          }
        : { checkedOut: false, headCommitSha: branchCommitSha },
      localCommitsAhead: ahead?.leftAhead ?? 0,
      worktreeCommitsAhead: ahead?.rightAhead ?? 0,
      localUncommittedDiffStats: branchDiff,
      worktreeUncommittedDiffStats: worktreeDiff,
    };
  } catch (error) {
    deps.logger.warning(`failed to collect synced branch status`, {
      safe: {},
      sensitive: { error },
    });
    throw error;
  }
}

export {
  findBranchWorktree,
  parseNumstat,
  queryDiffStats,
  resolveCommit,
  resolveDiffStats,
  resolveSyncedBranch,
  resolveSyncedBranchState,
};
if (typeof module !== `undefined`)
  module.exports = {
    findBranchWorktree,
    parseNumstat,
    queryDiffStats,
    resolveCommit,
    resolveDiffStats,
    resolveSyncedBranch,
    resolveSyncedBranchState,
  };
