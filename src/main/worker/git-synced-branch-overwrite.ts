type SyncedBranchOverwriteDependencies = {
  resolveObject: (
    repository: any,
    ref: string,
    signal: AbortSignal,
  ) => Promise<string | null>;
  isObjectId: (value: string) => boolean;
  normalizeTreeSha: (value: string) => string;
  getHeadCommit: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  createCommit: (
    gitRoot: string,
    treeSha: string,
    host: any,
    options: any,
  ) => Promise<any>;
  runGit: (
    gitRoot: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  formatExecOutput: (input: any) => any;
  chunkPaths: (paths: string[], size: number) => string[][];
  logger: {
    info: (message: string) => void;
    warning: (message: string) => void;
  };
};

async function resolveCommitTree(
  repository: any,
  commitSha: string,
  signal: AbortSignal,
  deps: SyncedBranchOverwriteDependencies,
) {
  const resolved = await deps.resolveObject(
    repository,
    `${commitSha}^{tree}`,
    signal,
  );
  if (resolved && !deps.isObjectId(resolved))
    throw Error(`Unexpected ${commitSha} SHA: ${resolved}`);
  return resolved ? deps.normalizeTreeSha(resolved) : null;
}

async function cleanDeletedPaths(
  gitRoot: string,
  paths: string[],
  host: any,
  signal: AbortSignal,
  deps: SyncedBranchOverwriteDependencies,
) {
  let failure = null;
  for (const chunk of deps.chunkPaths(paths, 1024)) {
    const result = await deps.runGit(
      gitRoot,
      [`clean`, `-fd`, `--`, ...chunk],
      host,
      { signal },
    );
    if (!result.success) {
      failure = result;
      break;
    }
  }
  return failure;
}

async function cleanDeletedPathsBeforeRestore(
  params: any,
  deps: SyncedBranchOverwriteDependencies,
) {
  const diff = await deps.runGit(
    params.gitRoot,
    [
      `diff`,
      `--name-only`,
      `--diff-filter=D`,
      `--no-renames`,
      params.baseRef,
      params.treeToRestore,
    ],
    params.host,
    { allowedNonZeroExitCodes: [1], signal: params.signal },
  );
  if (!diff.success) {
    deps.logger.warning(
      `Failed to compute deleted paths before cleaning untracked files.`,
    );
    return;
  }
  const paths =
    diff.stdout.length > 0
      ? diff.stdout
          .split(`\n`)
          .map((path: string) => path.trim())
          .filter((path: string) => path.length > 0)
      : [];
  if (
    paths.length > 0 &&
    (await cleanDeletedPaths(
      params.gitRoot,
      paths,
      params.host,
      params.signal,
      deps,
    ))
  ) {
    deps.logger.warning(
      `Failed to clean untracked files for deleted paths before restore.`,
    );
  }
}

function commandError(
  result: any,
  fallbackOutput: string,
  deps: SyncedBranchOverwriteDependencies,
) {
  return {
    status: `command-error`,
    execOutput: deps.formatExecOutput({
      command: result.command,
      stdout: result.stdout,
      stderr: result.stderr,
      fallbackOutput,
    }),
  };
}

async function overwriteSyncedBranch(
  params: any,
  deps: SyncedBranchOverwriteDependencies,
) {
  const repository = params.gitManager.getWorktreeRepositoryForRoot(
    params.gitRoot,
    params.host,
  );
  const targetRepository = params.targetRoot
    ? params.gitManager.getWorktreeRepositoryForRoot(
        params.targetRoot,
        params.host,
      )
    : null;
  const targetHead = targetRepository
    ? await deps.getHeadCommit(targetRepository, params.signal)
    : null;
  const headTree = await resolveCommitTree(
    repository,
    params.headCommitSha,
    params.signal,
    deps,
  );
  if (!headTree) return { status: `command-error` };

  const requiresSyntheticCommit =
    params.treeSha &&
    params.treeSha !== headTree &&
    (!params.targetRoot ||
      !(
        !params.targetCurrentBranch ||
        params.targetCurrentBranch === params.branchName
      ));
  let commitSha = params.headCommitSha;
  if (requiresSyntheticCommit) {
    const commit = await deps.createCommit(
      params.gitRoot,
      params.treeSha,
      params.host,
      {
        parentSha: params.headCommitSha,
        signal: params.signal,
      },
    );
    if (!commit.success) {
      return commandError(
        { command: `git commit-tree`, stdout: ``, stderr: commit.error.stderr },
        commit.error.stderr ||
          commit.error.stdout ||
          `Failed to create synthetic commit`,
        deps,
      );
    }
    commitSha = commit.commitSha;
  }

  const [sourceReset, targetUpdate] = await Promise.all([
    params.gitRoot && commitSha !== params.headCommitSha
      ? deps.runGit(
          params.gitRoot,
          [`reset`, `--hard`, commitSha],
          params.host,
          { signal: params.signal },
        )
      : Promise.resolve(null),
    params.targetRoot
      ? deps.runGit(
          params.targetRoot,
          [
            `update-ref`,
            params.targetCurrentBranch
              ? `refs/heads/${params.targetCurrentBranch}`
              : `HEAD`,
            commitSha,
          ],
          params.host,
          { signal: params.signal },
        )
      : params.gitRoot
        ? deps.runGit(
            params.gitRoot,
            [`branch`, `-f`, params.branchName, commitSha],
            params.host,
            { signal: params.signal },
          )
        : Promise.resolve(null),
  ]);
  const updateFailure =
    targetUpdate && !targetUpdate.success
      ? targetUpdate
      : sourceReset?.success === false
        ? sourceReset
        : null;
  if (updateFailure) {
    return commandError(
      updateFailure,
      updateFailure.stderr || updateFailure.stdout || `Failed to reset branch`,
      deps,
    );
  }

  if (params.targetRoot) {
    const reset = await deps.runGit(
      params.targetRoot,
      [`reset`, `--mixed`, `HEAD`],
      params.host,
      { signal: params.signal },
    );
    if (!reset.success)
      return commandError(
        reset,
        reset.stderr || reset.stdout || `Failed to reset index`,
        deps,
      );
    const treeToRestore = params.treeSha
      ? deps.normalizeTreeSha(params.treeSha)
      : headTree;
    if (targetHead) {
      await cleanDeletedPathsBeforeRestore(
        {
          gitRoot: params.targetRoot,
          baseRef: targetHead,
          treeToRestore,
          host: params.host,
          signal: params.signal,
        },
        deps,
      );
    }
    const restore = await deps.runGit(
      params.targetRoot,
      [`restore`, `--source`, treeToRestore, `--worktree`, `--`, `.`],
      params.host,
      { signal: params.signal },
    );
    if (!restore.success)
      return commandError(
        restore,
        restore.stderr || restore.stdout || `Failed to restore working tree`,
        deps,
      );
  }
  deps.logger.info(`Synced branch applied to branch checkout`);
  return { status: `success` };
}

export {
  cleanDeletedPaths,
  cleanDeletedPathsBeforeRestore,
  overwriteSyncedBranch,
  resolveCommitTree,
};
if (typeof module !== `undefined`)
  module.exports = {
    cleanDeletedPaths,
    cleanDeletedPathsBeforeRestore,
    overwriteSyncedBranch,
    resolveCommitTree,
  };
