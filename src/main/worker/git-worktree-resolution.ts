import { isPathWithinManagedRoot, normalizeComparisonRoot } from "./git-worktree-resolution-policy";

type WorktreeResolutionDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  getManagedWorktreeLocations: (host: any, worktreesRoot?: string | null) => Promise<Array<{ path: string }>>;
  getRootRelativeCwd: (repository: any, cwd: string, signal: AbortSignal) => Promise<string>;
  listWorktrees: (repository: any, signal: AbortSignal) => Promise<Array<{ root: string }>>;
  readThreadConfig: (repository: any, signal: AbortSignal) => Promise<{ ownerThreadId: string } | null>;
  getTrackedStatus: (repository: any, includeUntracked: boolean) => Promise<any>;
  getUntrackedPaths: (repository: any, signal: AbortSignal) => Promise<any>;
  normalizeWorkspaceRoot: (path: string) => string;
  normalizeComparisonPath: (path: string) => string;
};

type ResolveWorktreeParams = {
  cwd: string;
  conversationId: string;
  threadCwd?: string | null;
  worktreesRoot?: string | null;
};

const emptyResolution = () => ({
  worktreeGitRoot: null,
  worktreeWorkspaceRoot: null,
  hasUncommittedChanges: false,
});

async function getWorktreeSortTimestamp(root: string, host: any) {
  try {
    const stat = await host.stat(root);
    if (stat.birthtimeMs > 0) return stat.birthtimeMs;
    return stat.mtimeMs > 0 ? stat.mtimeMs : 0;
  } catch {
    return 0;
  }
}

async function hasUncommittedWorktreeChanges(repository: any, deps: WorktreeResolutionDependencies) {
  const controller = new AbortController();
  const trackedStatus = deps.getTrackedStatus(repository, false);
  const untrackedPaths = deps.getUntrackedPaths(repository, controller.signal);
  untrackedPaths.catch(() => {});

  let status;
  try {
    status = await trackedStatus;
  } catch (error) {
    controller.abort();
    throw error;
  }
  if (status.type !== `success`) {
    controller.abort();
    return false;
  }
  if (status.stagedCount + status.unstagedCount > 0) {
    controller.abort();
    return true;
  }
  const untracked = await untrackedPaths;
  return untracked.success && untracked.paths.length > 0;
}

async function resolveResult(gitRoot: string, workspaceRoot: string, deps: WorktreeResolutionDependencies) {
  return {
    worktreeGitRoot: gitRoot,
    worktreeWorkspaceRoot: workspaceRoot,
    hasUncommittedChanges: await hasUncommittedWorktreeChanges(
      deps.gitManager.getWorktreeRepositoryForRoot(gitRoot, deps.host),
      deps,
    ),
  };
}

async function resolveWorktreeForThread(params: ResolveWorktreeParams, deps: WorktreeResolutionDependencies) {
  const sourceRepository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  if (!sourceRepository) return emptyResolution();

  const managedLocations = await deps.getManagedWorktreeLocations(deps.host, params.worktreesRoot);
  const platformPath = await deps.host.platformPath();
  const relativeCwd = await deps.getRootRelativeCwd(sourceRepository, params.cwd, deps.signal);
  const workspaceRootFor = (root: string) => deps.normalizeWorkspaceRoot(
    relativeCwd.length > 0 ? platformPath.join(root, relativeCwd) : root,
  );

  if (params.threadCwd != null) {
    const [sourceMetadata, threadMetadata] = await Promise.all([
      deps.gitManager.getStableMetadata(params.cwd, deps.host),
      deps.gitManager.getStableMetadata(params.threadCwd, deps.host),
    ]);
    if (
      sourceMetadata != null &&
      threadMetadata != null &&
      normalizeComparisonRoot(threadMetadata.commonDir, deps.normalizeComparisonPath) ===
        normalizeComparisonRoot(sourceMetadata.commonDir, deps.normalizeComparisonPath) &&
      (managedLocations.some((location) =>
        isPathWithinManagedRoot(threadMetadata.root, location.path, deps.normalizeComparisonPath),
      ) ||
        (await deps.readThreadConfig(
          deps.gitManager.getWorktreeRepositoryForRoot(threadMetadata.root, deps.host),
          deps.signal,
        ))?.ownerThreadId === params.conversationId)
    ) {
      return resolveResult(threadMetadata.root, workspaceRootFor(threadMetadata.root), deps);
    }
  }

  const worktrees = await deps.listWorktrees(sourceRepository, deps.signal);
  const candidates = (await Promise.all(worktrees.map(async (worktree) => {
    const config = await deps.readThreadConfig(
      deps.gitManager.getWorktreeRepositoryForRoot(worktree.root, deps.host),
      deps.signal,
    );
    if (config?.ownerThreadId !== params.conversationId) return null;
    return {
      worktreeGitRoot: worktree.root,
      worktreeWorkspaceRoot: workspaceRootFor(worktree.root),
      sortTimestamp: await getWorktreeSortTimestamp(worktree.root, deps.host),
    };
  }))).filter((candidate) => candidate != null);
  if (candidates.length === 0) return emptyResolution();

  candidates.sort((left, right) => left.sortTimestamp === right.sortTimestamp
    ? right.worktreeGitRoot.localeCompare(left.worktreeGitRoot)
    : right.sortTimestamp - left.sortTimestamp);
  const selected = candidates[0];
  return resolveResult(selected.worktreeGitRoot, selected.worktreeWorkspaceRoot, deps);
}

export {
  getWorktreeSortTimestamp,
  hasUncommittedWorktreeChanges,
  isPathWithinManagedRoot,
  resolveWorktreeForThread,
};
if (typeof module !== `undefined`) module.exports = {
  getWorktreeSortTimestamp,
  hasUncommittedWorktreeChanges,
  isPathWithinManagedRoot,
  resolveWorktreeForThread,
};
