type WorktreePathDependencies = {
  logger: { error: (message: string) => void };
  normalizeCwd: (path: string) => string;
  normalizeRoot: (path: string) => string;
  normalizeWindowsPath: (path: string) => string;
  processPlatform: string;
  queryKey: (root: string, host: any, type: string, value: string) => any;
  random: () => number;
  randomUUID: () => string;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
  staleTime: number;
  validateWorktreeName: (name: string) => boolean;
};

const WORKTREE_NAME_MARKER = `.codex-worktree-name`;
const INVALID_WORKTREE_NAME_MESSAGE =
  `Invalid worktree name. Use 1–64 lowercase letters, numbers, or single hyphens; hexadecimal IDs and Windows device names are reserved.`;

async function resolveWorktreesRoot(
  host: any,
  configuredRoot: string | undefined,
  dependencies: Pick<WorktreePathDependencies, `normalizeWindowsPath` | `processPlatform`>,
) {
  const trimmedRoot = configuredRoot?.trim();
  const [root, platformPath] = await Promise.all([
    trimmedRoot || host.workspacesRoot(),
    host.platformPath(),
  ]);
  const worktreesRoot = trimmedRoot ? root : platformPath.join(root, `worktrees`);
  return host.isLocal && dependencies.processPlatform === `win32` && platformPath.sep === `/`
    ? dependencies.normalizeWindowsPath(worktreesRoot)
    : worktreesRoot;
}

async function ensureWorktreesRoot(
  host: any,
  configuredRoot: string | undefined,
  dependencies: Pick<WorktreePathDependencies, `normalizeWindowsPath` | `processPlatform`>,
) {
  const [root, platformOs, platformPath] = await Promise.all([
    resolveWorktreesRoot(host, configuredRoot, dependencies),
    host.platformOs(),
    host.platformPath(),
  ]);
  await host.createDirectory(root, { recursive: true });
  if (platformOs === `macos`)
    await host.writeFile(platformPath.join(root, `.metadata_never_index`), ``);
}

function getRootRelativeCwd(
  repository: any,
  cwd: string,
  signal: AbortSignal | undefined,
  dependencies: Pick<WorktreePathDependencies, `queryKey` | `runGit` | `staleTime`>,
) {
  return repository.queryClient.fetchQuery({
    queryKey: dependencies.queryKey(repository.root, repository.host, `root-relative-cwd`, cwd),
    queryFn: async () => {
      const result = await dependencies.runGit(
        cwd,
        [`rev-parse`, `--show-prefix`],
        repository.host,
        { signal },
      );
      if (result.success) return result.stdout.replace(/\/+$/, ``);
      throw Error(
        `Failed to resolve git-root-relative cwd: ${result.stderr || result.stdout || `Unknown error`}`,
      );
    },
    staleTime: dependencies.staleTime,
  });
}

async function createWorktreePath(
  repositoryRoot: string,
  gitManager: any,
  workspaceRoot: string,
  host: any,
  configuredWorktreesRoot: string | undefined,
  name: string | undefined,
  dependencies: WorktreePathDependencies,
) {
  if (name != null && !dependencies.validateWorktreeName(name))
    return { success: false, error: Error(INVALID_WORKTREE_NAME_MESSAGE) };
  const repository = await gitManager.getWorktreeRepository(
    dependencies.normalizeCwd(workspaceRoot),
    host,
  );
  if (!repository?.root) {
    dependencies.logger.error(`[createWorktreePath] failed to resolve git root for workspace`);
    return { success: false, error: Error(`Failed to resolve the worktree repository.`) };
  }
  const platformPath = await host.platformPath();
  const worktreesRoot = await resolveWorktreesRoot(host, configuredWorktreesRoot, dependencies);
  const worktreeName = name ?? dependencies.randomUUID().slice(0, 4);
  const repositoryName = platformPath.basename(repositoryRoot);
  const worktreeGitRoot = dependencies.normalizeRoot(
    platformPath.join(worktreesRoot, worktreeName, repositoryName),
  );
  const relativeCwd = await getRootRelativeCwd(
    repository,
    dependencies.normalizeCwd(workspaceRoot),
    undefined,
    dependencies,
  );
  return {
    success: true,
    worktreeGitRoot,
    worktreeWorkspaceRoot: dependencies.normalizeCwd(
      platformPath.join(worktreeGitRoot, relativeCwd),
    ),
  };
}

async function reserveWorktreeNameDirectory(
  desiredPath: string,
  host: any,
  signal: AbortSignal | undefined,
  dependencies: Pick<WorktreePathDependencies, `random`>,
) {
  const platformPath = await host.platformPath();
  const prefix = platformPath.basename(desiredPath).slice(0, 59).replace(/-+$/, ``);
  let candidate = desiredPath;
  for (let attempt = 0; ; attempt += 1) {
    signal?.throwIfAborted();
    try {
      await host.createDirectory(candidate, { recursive: false });
      return candidate;
    } catch (error) {
      const stat = await host
        .stat(candidate, { bypassCache: true, followSymlinks: false })
        .catch(() => null);
      if (attempt === 5 || stat == null) throw error;
    }
    const suffix = Math.floor(dependencies.random() * 10_000)
      .toString()
      .padStart(4, `0`);
    candidate = platformPath.join(platformPath.dirname(desiredPath), `${prefix}-${suffix}`);
  }
}

export {
  INVALID_WORKTREE_NAME_MESSAGE,
  WORKTREE_NAME_MARKER,
  createWorktreePath,
  ensureWorktreesRoot,
  getRootRelativeCwd,
  reserveWorktreeNameDirectory,
  resolveWorktreesRoot,
};
if (typeof module !== `undefined`)
  module.exports = {
    INVALID_WORKTREE_NAME_MESSAGE,
    WORKTREE_NAME_MARKER,
    createWorktreePath,
    ensureWorktreesRoot,
    getRootRelativeCwd,
    reserveWorktreeNameDirectory,
    resolveWorktreesRoot,
  };
