type CommitDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  environment: Record<string, string | undefined>;
  invalidateUntrackedPathsCache: (repository: any) => void;
  getUntrackedPaths: (repository: any) => Promise<any>;
  stageWorktree: (args: any) => Promise<any>;
  runGit: (root: string, args: string[], host: any, options: { signal: AbortSignal }) => Promise<any>;
  formatCommitMessage: (message: string, attribution: any) => string;
  formatCommitAttribution: (attribution: unknown) => any;
  formatExecOutput: (args: any) => any;
};

function commandFailure(execution: any, fallback: string, deps: CommitDependencies) {
  const error = execution.stderr || execution.stdout || fallback;
  return {
    error,
    execOutput: deps.formatExecOutput({
      command: execution.command,
      stdout: execution.stdout,
      stderr: execution.stderr,
      fallbackOutput: error,
    }),
  };
}

async function commitGitChanges(params: any, deps: CommitDependencies) {
  const repository = await deps.gitManager.getWorktreeRepository(params.cwd, deps.host);
  if (repository != null) deps.invalidateUntrackedPathsCache(repository);
  const root = repository?.root ?? String(params.cwd);
  let refreshRoot: string | null = null;

  if (params.includeUnstaged) {
    const staged = repository != null
      ? await deps.stageWorktree({
          gitRoot: repository.root,
          env: deps.host.isLocal ? deps.environment : {},
          signal: deps.signal,
          host: deps.host,
          untrackedPathsPromise: deps.getUntrackedPaths(repository),
        })
      : await deps.runGit(root, [`add`, `-A`], deps.host, { signal: deps.signal });
    if (!staged.success) {
      const failure = commandFailure(staged, `Failed to stage changes`, deps);
      return { result: { status: `error`, ...failure }, refreshRoot: null };
    }
    refreshRoot = params.cwd;
  }

  const committed = await deps.runGit(
    root,
    [`commit`, `-m`, deps.formatCommitMessage(params.message, deps.formatCommitAttribution(params.commitAttribution))],
    deps.host,
    { signal: deps.signal },
  );
  if (!committed.success) {
    const failure = commandFailure(committed, `Failed to commit changes`, deps);
    const cachedDiff = await deps.runGit(root, [`diff`, `--cached`, `--quiet`, `--exit-code`], deps.host, { signal: deps.signal });
    return {
      result: {
        status: `error`,
        ...failure,
        errorType: cachedDiff.success ? `nothing-to-commit` : undefined,
      },
      refreshRoot,
    };
  }

  const revision = await deps.runGit(root, [`rev-parse`, `HEAD`], deps.host, { signal: deps.signal });
  return {
    result: { status: `success`, commitSha: revision.success ? revision.stdout : null },
    refreshRoot: params.cwd,
  };
}

export { commitGitChanges };
if (typeof module !== `undefined`) module.exports = { commitGitChanges };
