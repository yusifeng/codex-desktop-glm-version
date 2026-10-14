type GitRepoWatchFactoryDependencies = {
  metadata: { root: string; commonDir: string };
  host: any;
  closingPromise?: Promise<unknown> | null;
  getWatchKey: (root: string, host: any) => string;
  isCurrentWatch: (key: string, watch: any) => boolean;
  getRepository: (root: string, host: any) => any;
  removeOriginQueries: (repository: any) => void;
  invalidateWatchScopedCaches: (repository: any) => void;
  setLiveQueryRecovery: (hostId: string, root: string, required: boolean) => void;
  handleRepoWatchEvent: (event: any, dependencies: any) => Promise<void>;
  filterWorkingTreePaths: (repository: any, paths: string[]) => Promise<any>;
  getTrace: () => any;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  invalidateAll: (repository: any) => void;
  invalidateChange: (repository: any, changeType: string, paths?: string[]) => void;
  handleRepoChanged: (event: any, onFanout: (count: number) => void) => any;
  recordPerformance: (input: any) => void;
  getIndexSizeBucket: (root: string, host: any, result: any) => any;
  emit: (event: any) => void;
  createWatcher: (options: any) => any;
  watchIgnoreSources?: any;
  hasLocalBranchDependency: (input: any) => boolean;
  startMetadataWatch?: (host: any, options: any) => Promise<any>;
  startWorkingTreeWatch?: (host: any, options: any, directories: string[]) => Promise<any>;
};

/** Creates one GitRepoWatcher owner and its lifecycle callbacks without owning manager maps. */
function createGitRepoWatch(input: GitRepoWatchFactoryDependencies): any {
  const key = input.getWatchKey(input.metadata.root, input.host);
  const rawEventCounts = new Map<string, number>();
  let requiresRecovery = false;
  let watch: any;
  const repository = input.getRepository(input.metadata.root, input.host);
  const emitRepoWatchEvent = (event: any) => input.handleRepoWatchEvent(event, {
    root: input.metadata.root,
    host: input.host,
    isActive: () => watch.refCount > 0 && watch.closingPromise == null && input.isCurrentWatch(key, watch),
    getRepository: input.getRepository,
    filterWorkingTreePaths: input.filterWorkingTreePaths,
    getTrace: input.getTrace,
    trace: input.trace,
    invalidateAll: input.invalidateAll,
    invalidateChange: input.invalidateChange,
    handleRepoChanged: input.handleRepoChanged,
    getRawEventCount: (changeType: string) => rawEventCounts.get(changeType) ?? 1,
    clearRawEventCount: (changeType: string) => rawEventCounts.delete(changeType),
    recordPerformance: input.recordPerformance,
    getIndexSizeBucket: (_root: string, host: any, result: any) => input.getIndexSizeBucket(input.metadata.root, host, result),
    requiresRecovery: () => requiresRecovery,
    emit: input.emit,
  });
  const onRequiresRecoveryChanged = (required: boolean) => {
    if (watch.refCount <= 0 || watch.closingPromise != null || !input.isCurrentWatch(key, watch)) return;
    requiresRecovery = required;
    input.invalidateWatchScopedCaches(repository);
    input.removeOriginQueries(repository);
    input.setLiveQueryRecovery(input.host.id, input.metadata.root, required);
  };
  const onCoalescedChange = ({ changeType, rawEventCount }: { changeType: string; rawEventCount: number }) => {
    rawEventCounts.set(changeType, rawEventCount);
  };
  const watcherOptions = {
    commonDir: input.metadata.commonDir,
    root: input.metadata.root,
    host: input.host,
    watchIgnoreSources: input.host.isLocal ? input.watchIgnoreSources : undefined,
    isLocalBranchDependency: (branch: string) => input.hasLocalBranchDependency({
      branch,
      commonDir: input.metadata.commonDir,
      hostId: input.host.id,
      root: input.metadata.root,
    }),
    worktreeRepo: repository,
    onRequiresRecoveryChanged,
    onCoalescedChange,
    emit: emitRepoWatchEvent,
    startMetadataWatch: input.startMetadataWatch == null ? undefined : (options: any) => input.startMetadataWatch!(input.host, options),
    startWorkingTreeWatch: input.startWorkingTreeWatch == null ? undefined : (options: any, directories: string[]) => input.startWorkingTreeWatch!(input.host, options, directories),
  };
  const watcher = input.createWatcher(watcherOptions);
  watch = {
    commonDir: input.metadata.commonDir,
    closingPromise: null,
    hostId: input.host.id,
    isReady: false,
    repoIndexSizeBucket: `unknown`,
    refCount: 0,
    root: input.metadata.root,
    startPromise: Promise.resolve(),
    startTrace: undefined,
    watcher,
  };
  input.removeOriginQueries(repository);
  return { key, watch };
}

export { createGitRepoWatch };
if (typeof module !== `undefined`) module.exports = { createGitRepoWatch };
