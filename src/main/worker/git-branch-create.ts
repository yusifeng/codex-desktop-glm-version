type BranchCreateDependencies = {
  formatExecOutput: (params: any) => any;
  formatLocalBranchRef: (branch: string) => string;
  getQueryMeta: () => any;
  normalizeCwd: (cwd: string) => string;
  queryKey: (...parts: any[]) => any;
  runGit: (root: string, args: string[], host: any, options?: any) => Promise<any>;
  setSyncedBranchConfig: (
    repository: any,
    branchRef: string,
    treeRef: string,
    signal?: AbortSignal,
  ) => Promise<void>;
};

const COMMIT_TREE_CACHE_MS = 250;

async function branchExists(
  root: string,
  branch: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: BranchCreateDependencies,
) {
  const result = await dependencies.runGit(
    root,
    [`show-ref`, `--verify`, `--quiet`, dependencies.formatLocalBranchRef(branch)],
    host,
    { signal },
  );
  return result.success && result.code === 0;
}

function getCommitTree(
  repository: any,
  ref: string,
  signal: AbortSignal | undefined,
  dependencies: BranchCreateDependencies,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `tree`, ref),
    gcTime: COMMIT_TREE_CACHE_MS,
    meta: dependencies.getQueryMeta(),
    queryFn: async () => {
      const result = await dependencies.runGit(
        repository.root,
        [`rev-parse`, `${ref}^{tree}`],
        repository.host,
        { allowedNonZeroExitCodes: [128], signal },
      );
      if (!result.success || !result.stdout)
        throw Error(result.stderr || result.stdout || `Failed to resolve tree`);
      return result.stdout;
    },
    staleTime: COMMIT_TREE_CACHE_MS,
  });
}

async function createLocalBranch(
  root: string,
  branch: string,
  host: any,
  failIfExists: boolean,
  startPoint: string | null | undefined,
  signal: AbortSignal | undefined,
  dependencies: BranchCreateDependencies,
) {
  const branchRef = dependencies.formatLocalBranchRef(branch);
  if (await branchExists(root, branch, host, signal, dependencies))
    return failIfExists
      ? { success: false, reason: `already-exists`, error: `Branch already exists` }
      : { success: true, branchRef };
  const result = await dependencies.runGit(
    root,
    [`branch`, `--`, branch, ...(startPoint == null ? [] : [startPoint])],
    host,
    { signal },
  );
  if (result.success) return { success: true, branchRef };
  const error = result.stderr || result.stdout || `Failed to create branch`;
  return {
    success: false,
    reason: `create-failed`,
    error,
    execOutput: dependencies.formatExecOutput({
      command: result.command,
      stdout: result.stdout,
      stderr: result.stderr,
      fallbackOutput: error,
    }),
  };
}

async function ensureUnbornHeadBranch(
  root: string,
  branch: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: BranchCreateDependencies,
) {
  const head = await dependencies.runGit(
    root,
    [`rev-parse`, `--verify`, `HEAD`],
    host,
    { signal },
  );
  if (head.success) return null;
  const result = await dependencies.runGit(
    root,
    [`switch`, `-c`, branch],
    host,
    { signal },
  );
  if (result.success) return { success: true };
  const error = result.stderr || result.stdout || `Failed to create branch`;
  return {
    success: false,
    error,
    execOutput: dependencies.formatExecOutput({
      command: result.command,
      stdout: result.stdout,
      stderr: result.stderr,
      fallbackOutput: error,
    }),
  };
}

async function createBranch(
  {
    cwd,
    branch,
    mode,
    failIfExists = false,
    startPoint,
  }: {
    cwd: string;
    branch: string;
    mode: string;
    failIfExists?: boolean;
    startPoint?: string | null;
  },
  gitManager: any,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: BranchCreateDependencies,
) {
  const trimmedCwd = cwd.trim();
  if (!trimmedCwd)
    return { status: `error`, error: `No workspace available for branch creation` };
  const trimmedBranch = branch.trim();
  const localBranch = trimmedBranch.startsWith(`refs/heads/`)
    ? trimmedBranch.slice(11)
    : trimmedBranch;
  if (!localBranch) return { status: `error`, error: `Branch name is required` };
  if (
    localBranch.startsWith(`refs/heads/`) ||
    localBranch.startsWith(`refs/remotes/`) ||
    localBranch.startsWith(`refs/tags/`)
  )
    return { status: `error`, error: `Only local branches can be created` };
  try {
    switch (mode) {
      case `synced`: {
        const repository = await gitManager.getWorktreeRepository(
          dependencies.normalizeCwd(trimmedCwd),
          host,
        );
        const root = repository?.root;
        if (!root)
          return { status: `error`, error: `No git repository found for branch creation` };
        const result = await createLocalBranch(
          root,
          localBranch,
          host,
          failIfExists,
          startPoint,
          signal,
          dependencies,
        );
        if (!result.success)
          return { status: `error`, error: result.error, execOutput: result.execOutput };
        const branchRef = result.branchRef;
        await dependencies.setSyncedBranchConfig(
          repository,
          branchRef,
          await getCommitTree(repository, branchRef, signal, dependencies),
          signal,
        );
        return { status: `success`, branch: localBranch };
      }
      case `worktree`: {
        const result = await createLocalBranch(
          trimmedCwd,
          localBranch,
          host,
          failIfExists,
          startPoint,
          signal,
          dependencies,
        );
        if (!result.success) {
          if (result.reason === `already-exists` || startPoint != null)
            return { status: `error`, error: result.error, execOutput: result.execOutput };
          const fallback = await ensureUnbornHeadBranch(
            trimmedCwd,
            localBranch,
            host,
            signal,
            dependencies,
          );
          return fallback?.success
            ? { status: `success`, branch: localBranch }
            : fallback == null
              ? { status: `error`, error: result.error, execOutput: result.execOutput }
              : { status: `error`, error: fallback.error, execOutput: fallback.execOutput };
        }
        return { status: `success`, branch: localBranch };
      }
    }
  } catch (error) {
    return { status: `error`, error: error instanceof Error ? error.message : String(error) };
  }
}

export {
  COMMIT_TREE_CACHE_MS,
  branchExists,
  createBranch,
  createLocalBranch,
  ensureUnbornHeadBranch,
  getCommitTree,
};
if (typeof module !== `undefined`)
  module.exports = {
    COMMIT_TREE_CACHE_MS,
    branchExists,
    createBranch,
    createLocalBranch,
    ensureUnbornHeadBranch,
    getCommitTree,
  };
