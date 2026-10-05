type HandoffSharedBaseDependencies = {
  runGit: (cwd: string, args: string[], host: any, options: any) => Promise<any>;
  getDefaultRemoteBranch: (repository: any) => Promise<any>;
  getMergeBase: (repository: any, branch: string) => Promise<string | null>;
  getRemotes: (repository: any) => Promise<string[]>;
  logger: { debug: (message: string, detail: any) => void; warning: (message: string, detail: any) => void };
};

import { buildHandoffFetchTargets } from './git-handoff-shared-base-policy';

async function resolveHandoffRepositoryMetadata(gitManager: any, cwd: string, host: any) {
  try {
    return await gitManager.getStableMetadata(cwd, host);
  } catch (error) {
    if (
      host.isLocal ||
      !(error instanceof Error) ||
      !error.message.startsWith(`Failed to resolve git root:`)
    ) throw error;
    return gitManager.getStableMetadata(cwd, host);
  }
}

async function hasHandoffCommit(
  gitRoot: string,
  commitSha: string,
  host: any,
  signal: AbortSignal,
  deps: HandoffSharedBaseDependencies,
) {
  const result = await deps.runGit(gitRoot, [`cat-file`, `-e`, `${commitSha}^{commit}`], host, {
    allowedNonZeroExitCodes: [1, 128],
    env: { GIT_NO_LAZY_FETCH: `1` },
    signal,
  });
  return result.success && result.code === 0;
}

async function findHandoffSharedBase(params: any, deps: HandoffSharedBaseDependencies) {
  const sourceRepository = params.gitManager.getWorktreeRepositoryForRoot(
    params.sourceGitRoot,
    params.sourceHost,
  );
  const destinationRepository = params.gitManager.getWorktreeRepositoryForRoot(
    params.destinationGitRoot,
    params.destinationHost,
  );
  const destinationHasHead = await hasHandoffCommit(
    params.destinationGitRoot,
    params.headSha,
    params.destinationHost,
    params.signal,
    deps,
  );
  deps.logger.debug(`[host-handoff] destination-head-check`, {
    safe: { destinationHasHead },
    sensitive: {},
  });
  if (destinationHasHead) return params.headSha;

  const sourceDefault = await deps.getDefaultRemoteBranch(sourceRepository);
  deps.logger.debug(`[host-handoff] source-default-branch`, {
    safe: { found: sourceDefault != null },
    sensitive: sourceDefault ?? {},
  });
  if (sourceDefault == null) return null;

  const mergeBaseSha = await deps.getMergeBase(
    sourceRepository,
    `${sourceDefault.remote}/${sourceDefault.branch}`,
  );
  deps.logger.debug(`[host-handoff] source-merge-base`, {
    safe: { found: mergeBaseSha != null },
    sensitive: mergeBaseSha == null ? {} : { mergeBaseSha },
  });
  if (mergeBaseSha == null) return null;

  const destinationHasMergeBase = await hasHandoffCommit(
    params.destinationGitRoot,
    mergeBaseSha,
    params.destinationHost,
    params.signal,
    deps,
  );
  deps.logger.debug(`[host-handoff] destination-merge-base-check`, {
    safe: { destinationHasMergeBase },
    sensitive: {},
  });
  if (destinationHasMergeBase) return mergeBaseSha;

  const destinationDefault = await deps.getDefaultRemoteBranch(destinationRepository);
  const fetchTargets = buildHandoffFetchTargets(
    destinationDefault,
    destinationDefault == null ? await deps.getRemotes(destinationRepository) : [],
    sourceDefault.branch,
  );
  deps.logger.debug(`[host-handoff] destination-fetch-targets`, {
    safe: {
      count: fetchTargets.length,
      usedDestinationDefaultBranch: destinationDefault != null,
    },
    sensitive: {
      sourceDefaultRemoteAndBranch: sourceDefault,
      destinationDefaultRemoteAndBranch: destinationDefault,
      fetchTargets,
    },
  });
  for (const fetchTarget of fetchTargets) {
    const result = await deps.runGit(
      params.destinationGitRoot,
      [`fetch`, fetchTarget.remote, fetchTarget.branch],
      params.destinationHost,
      { signal: params.signal },
    );
    deps.logger.debug(`[host-handoff] destination-fetch-result`, {
      safe: { success: result.success },
      sensitive: { fetchTarget, stderr: result.stderr },
    });
    if (!result.success) continue;
    const found = await hasHandoffCommit(
      params.destinationGitRoot,
      mergeBaseSha,
      params.destinationHost,
      params.signal,
      deps,
    );
    deps.logger.debug(`[host-handoff] destination-fetch-base-check`, {
      safe: { hasFetchedBase: found },
      sensitive: { fetchTarget },
    });
    if (found) return mergeBaseSha;
  }
  deps.logger.warning(`[host-handoff] shared-base-not-found`, {
    safe: { fetchTargetCount: fetchTargets.length },
    sensitive: {
      sourceDefaultRemoteAndBranch: sourceDefault,
      destinationDefaultRemoteAndBranch: destinationDefault,
      mergeBaseSha,
      fetchTargets,
    },
  });
  return null;
}

export { findHandoffSharedBase, hasHandoffCommit, resolveHandoffRepositoryMetadata };
if (typeof module !== `undefined`) module.exports = {
  findHandoffSharedBase,
  hasHandoffCommit,
  resolveHandoffRepositoryMetadata,
};
