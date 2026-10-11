const { selectGitWatchTargetsForMetadataRefresh } = require(`./git-watch-paths`);

type GitMetadataRefreshBatchDependencies = {
  pathApi: any;
  commonDir: string;
  paths: string[];
  recovering: boolean;
  targets: any[];
  isDisposed: () => boolean;
  disposeSession: (target: any) => Promise<void>;
  startSession: (target: any, recovering: boolean) => Promise<void>;
  refreshWorktreeDirectories: (pathApi: any, worktreesPath: string, recovering: boolean) => Promise<void>;
  isWithinPath: (pathApi: any, value: string, parent: string) => boolean;
};

/** Coordinates metadata-triggered watcher recovery and worktree topology refresh. */
async function processGitMetadataRefreshBatch(dependencies: GitMetadataRefreshBatchDependencies): Promise<void> {
  const { pathApi, commonDir, paths, recovering, targets, isDisposed, disposeSession, startSession,
    refreshWorktreeDirectories, isWithinPath } = dependencies;
  if (isDisposed() || pathApi == null) return;
  const affected = selectGitWatchTargetsForMetadataRefresh(targets, paths, (value: string, parent: string) => isWithinPath(pathApi, value, parent));
  await Promise.all(affected.map(async (target: any) => {
    if (target.retryTimer != null) return;
    if (recovering) await disposeSession(target);
    if (!isDisposed() && target.session == null) await startSession(target, recovering);
  }));
  await Promise.all(affected.filter((target: any) => target.metadataDirectory?.missing).map((target: any) => startSession(target, recovering)));
  await refreshWorktreeDirectories(pathApi, pathApi.join(commonDir, `worktrees`), recovering);
}

export { processGitMetadataRefreshBatch };
if (typeof module !== `undefined`) module.exports = { processGitMetadataRefreshBatch };
