type GitWatchSessionRuntimeDependencies = {
  target: any;
  recovering: boolean;
  generation: number;
  isDisposed: () => boolean;
  isCurrentGeneration: () => boolean;
  stat: (path: string, options: { bypassCache: boolean }) => Promise<{ isDirectory(): boolean }>;
  isMissingPathError: (error: unknown) => boolean;
  hasWorkingTreeHandler: boolean;
  readIgnorePolicy: () => Promise<any>;
  isIgnorePolicyCurrent: (snapshot: any) => boolean;
  createWatchId: () => string;
  trace: <T>(span: { attributes: Record<string, string | boolean>; name: string; op: string }, operation: () => Promise<T>) => Promise<T>;
  hostKind: `local` | `remote`;
  startWorkingTreeWatch?: (options: any, directories: string[]) => Promise<any>;
  startMetadataWatch?: (options: any) => Promise<any>;
  startFileWatch: (options: any) => Promise<any>;
  handleWatchChange: (input: { changedPaths: string[]; pathChanges: any; ignoreDirectories: string[] }) => void;
  ignoreSourceWatch: () => any;
  changedIgnoreSourcePaths: Set<string>;
  ignoreDirectories: string[];
  refreshMetadataDirectories: (paths: string[]) => Promise<void>;
  ignorePolicy?: {
    didApply(snapshot: any): boolean;
    requestRefresh(): void;
  };
  collectHandlerPaths: (handler: any, paths: string[], cache: Map<string, boolean>) => void;
  handleFileWatchEvent: (changeType: string, paths?: string[]) => void;
  isRegistered: () => boolean;
  attachSession: (session: any) => void;
  setWorkingTreeIgnoredDirectories: (directories: string[]) => void;
  updateRecovery: () => void;
  attachClosed: (session: any, startedAt: number) => void;
  hasPendingMetadataRefresh: () => boolean;
  loggerWarning: (error: unknown, path: string) => void;
  scheduleRetry: () => void;
};

/** Runs one GitRepoWatcher target's backend session startup and side-effect ordering. */
async function startGitRepoWatchSession(input: GitWatchSessionRuntimeDependencies): Promise<void> {
  const { target, recovering, generation } = input;
  try {
    if (target.metadataDirectory != null) {
      let isDirectory = false;
      try {
        isDirectory = (await input.stat(target.watchPath, { bypassCache: true })).isDirectory();
      } catch (error) {
        if (!input.isMissingPathError(error)) throw error;
      }
      if (input.isDisposed() || !input.isCurrentGeneration()) return;
      target.metadataDirectory.missing = !isDirectory;
      input.updateRecovery();
      if (!isDirectory) {
        if (recovering) target.handlers.forEach((handler: any) => input.handleFileWatchEvent(handler.changeType));
        return;
      }
    }

    const ignoreSnapshot = input.hasWorkingTreeHandler
      ? await input.readIgnorePolicy()
      : undefined;
    if (
      input.isDisposed() ||
      !input.isCurrentGeneration() ||
      (ignoreSnapshot != null && !input.isIgnorePolicyCurrent(ignoreSnapshot))
    ) return;

    const watchOptions = {
      path: target.watchPath,
      recursive: target.recursive,
      renameEventHandling: input.hasWorkingTreeHandler
        ? `changed-path-with-parent-directory`
        : `changed-path`,
      watchId: input.createWatchId(),
      onChange: ({ changedPaths, pathChanges }: { changedPaths: string[]; pathChanges: any }) => {
        if (input.isDisposed() || !input.isCurrentGeneration()) return;
        input.handleWatchChange({
          changedPaths,
          pathChanges,
          ignoreDirectories: ignoreSnapshot?.directories ?? [],
        });
      },
    };
    const session = await input.trace(
      {
        attributes: {
          "git.host_kind": input.hostKind,
          "git.watch_target": input.hasWorkingTreeHandler ? `working-tree` : `git-metadata`,
          "git.watcher_recovering": recovering,
          "git.watcher_recursive": target.recursive,
        },
        name: `git.watcher_target_start`,
        op: `codex.git.watcher_target_start`,
      },
      () => input.hasWorkingTreeHandler && input.startWorkingTreeWatch != null
        ? input.startWorkingTreeWatch(watchOptions, ignoreSnapshot?.directories ?? [])
        : !input.hasWorkingTreeHandler && input.startMetadataWatch != null
          ? input.startMetadataWatch(watchOptions)
          : input.startFileWatch(watchOptions),
    );

    if (
      input.isDisposed() ||
      !input.isCurrentGeneration() ||
      !input.isRegistered() ||
      (ignoreSnapshot != null && !input.isIgnorePolicyCurrent(ignoreSnapshot))
    ) {
      await session.dispose();
      return;
    }

    input.attachSession(session);
    if (input.hasWorkingTreeHandler) input.setWorkingTreeIgnoredDirectories(ignoreSnapshot?.directories ?? []);
    const policyApplied = ignoreSnapshot != null && input.ignorePolicy?.didApply(ignoreSnapshot);
    const startedAt = Date.now();
    input.updateRecovery();
    input.attachClosed(session, startedAt);

    if (recovering || policyApplied) {
      if (recovering && input.ignoreSourceWatch()?.target === target) input.ignorePolicy?.requestRefresh();
      target.handlers.forEach((handler: any) => input.handleFileWatchEvent(handler.changeType));
      if (!input.hasWorkingTreeHandler && !target.recursive && !input.hasPendingMetadataRefresh()) {
        void input.refreshMetadataDirectories([]);
      }
    }
  } catch (error) {
    if (input.isDisposed() || !input.isCurrentGeneration()) return;
    input.loggerWarning(error, target.watchPath);
    input.updateRecovery();
    input.scheduleRetry();
  }
}

export { startGitRepoWatchSession };
if (typeof module !== `undefined`) module.exports = { startGitRepoWatchSession };
