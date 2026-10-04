type WorktreeCheckoutDependencies = {
  applyPatch: (params: any, gitManager: any, host: any, options: any) => Promise<any>;
  createLocalTrackingBranch: (repository: any, startingRef: string, signal?: AbortSignal) => Promise<string | null>;
  deleteLocalTrackingBranch: (repository: any, branch: string) => Promise<void>;
  getSafeAttributeFilterOverrides: (repository: any, signal?: AbortSignal) => Promise<string[]>;
  getUntrackedPaths: (repository: any, includeIgnored?: boolean, snapshot?: any, signal?: AbortSignal) => Promise<any>;
  logger: { warning: (message: string, detail: any) => void };
  normalizeRoot: (root: string) => string;
  refreshUpstream: (params: any) => Promise<void>;
  removeWorktree: (root: string, host: any, force: boolean) => Promise<void>;
  resolveStartingState: (repositoryRoot: string, startingState: any, gitManager: any, host: any, configOverrides: string[], signal?: AbortSignal) => Promise<{ startingRef: string; startingDiff?: string | null }>;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};

const encoder = new TextEncoder();
const operationCanceled = () => ({ success: false, error: Error(`Operation canceled`) });

async function performWorktreeCheckout(
  repositoryRoot: string,
  worktreeRoot: string,
  startingState: any,
  gitManager: any,
  host: any,
  options: any,
  dependencies: WorktreeCheckoutDependencies,
) {
  const onLog = options?.onLog;
  const signal = options?.signal as AbortSignal | undefined;
  if (signal?.aborted) return operationCanceled();
  const repository = gitManager.getWorktreeRepositoryForRoot(
    dependencies.normalizeRoot(repositoryRoot),
    host,
  );
  const configOverrides = await dependencies.getSafeAttributeFilterOverrides(repository, signal);
  await dependencies.refreshUpstream({
    worktreeRepo: repository,
    startingState,
    mode: options?.upstreamRefreshMode ?? `never`,
    onLog,
    signal,
    upstreamRefreshSignal: options?.upstreamRefreshSignal,
  });
  if (signal?.aborted) return operationCanceled();
  const [{ startingRef, startingDiff }, untracked] = await Promise.all([
    dependencies.resolveStartingState(
      repositoryRoot,
      startingState,
      gitManager,
      host,
      configOverrides,
      signal,
    ),
    startingState.type === `working-tree`
      ? dependencies.getUntrackedPaths(repository, undefined, undefined, signal)
      : Promise.resolve(null),
  ]);
  if (untracked != null && !untracked.success)
    throw Error(`Failed to collect untracked working tree files`);
  if (signal?.aborted) return operationCanceled();
  const addResult = await dependencies.runGit(
    repositoryRoot,
    [`worktree`, `add`, `--detach`, worktreeRoot, startingRef],
    host,
    {
      configOverrides,
      onStdoutRaw: onLog ? (chunk: Uint8Array) => onLog(`stdout`, chunk) : undefined,
      onStderrRaw: onLog ? (chunk: Uint8Array) => onLog(`stderr`, chunk) : undefined,
      signal,
    },
  );
  if (!addResult.success)
    return {
      success: false,
      error: Error(`git worktree add failed: ${addResult.stderr || addResult.stdout}`),
    };
  if (signal?.aborted) return operationCanceled();
  if (startingDiff) {
    onLog?.(`info`, encoder.encode(`[info] Applying working tree diff to new worktree\n`));
    const applyResult = await dependencies.applyPatch(
      { cwd: worktreeRoot, diff: startingDiff, revert: false },
      gitManager,
      host,
      { gitConfigOverrides: configOverrides, signal },
    );
    if (applyResult.status !== `success`) {
      const message = [
        `git apply failed: applied:${applyResult.appliedPaths.length} skipped:${applyResult.skippedPaths.length} conflicted:${applyResult.conflictedPaths.length}`,
        applyResult.execOutput?.output.trim(),
      ].filter(Boolean).join(`\n`);
      onLog?.(`info`, encoder.encode(`${message}\n`));
      return { success: false, error: Error(message) };
    }
  }
  if (untracked != null && untracked.paths.length > 0) {
    onLog?.(`info`, encoder.encode(`[info] Copying untracked files to new worktree\n`));
    const platformPath = await host.platformPath();
    for (const relativePath of untracked.paths) {
      if (signal?.aborted) return operationCanceled();
      const destination = platformPath.join(worktreeRoot, relativePath);
      await host.createDirectory(platformPath.dirname(destination), { recursive: true });
      await host.copy(platformPath.join(repositoryRoot, relativePath), destination);
    }
  }
  const trackingBranch =
    startingState.type === `branch` && startingState.remoteRef != null
      ? null
      : await dependencies.createLocalTrackingBranch(repository, startingRef, signal);
  if (signal?.aborted) {
    if (trackingBranch != null)
      await dependencies.deleteLocalTrackingBranch(repository, trackingBranch);
    return operationCanceled();
  }
  return { success: true, startingRef };
}

async function createWorktreeCheckout(
  repositoryRoot: string,
  worktreeRoot: string,
  startingState: any,
  gitManager: any,
  host: any,
  options: any,
  dependencies: WorktreeCheckoutDependencies,
) {
  try {
    const result = await performWorktreeCheckout(
      repositoryRoot,
      worktreeRoot,
      startingState,
      gitManager,
      host,
      options,
      dependencies,
    );
    if (!result.success)
      try {
        await dependencies.removeWorktree(worktreeRoot, host, true);
      } catch (error) {
        dependencies.logger.warning(`Failed to cleanup worktree`, { safe: {}, sensitive: { error } });
      }
    return result;
  } catch (error) {
    try {
      await dependencies.removeWorktree(worktreeRoot, host, true);
    } catch (cleanupError) {
      dependencies.logger.warning(`Failed to cleanup worktree`, {
        safe: {},
        sensitive: { error: cleanupError },
      });
    }
    return { success: false, error: error instanceof Error ? error : Error(String(error)) };
  }
}

export { createWorktreeCheckout, performWorktreeCheckout };
if (typeof module !== `undefined`)
  module.exports = { createWorktreeCheckout, performWorktreeCheckout };
