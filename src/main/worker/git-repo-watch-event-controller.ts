type GitRepoWatchEventDependencies = {
  event: any;
  root: string;
  host: any;
  isActive: () => boolean;
  getRepository: (root: string, host: any) => any;
  filterWorkingTreePaths: (repository: any, paths: string[]) => Promise<{ type: string; changedPaths?: string[] }>;
  getTrace: () => any;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  invalidateAll: (repository: any) => void;
  invalidateChange: (repository: any, changeType: string, paths?: string[]) => void;
  handleRepoChanged: (event: any, onFanout: (count: number) => void) => any;
  getRawEventCount: (changeType: string) => number;
  clearRawEventCount: (changeType: string) => void;
  recordPerformance: (input: any) => void;
  getIndexSizeBucket: (root: string, host: any, result: any) => any;
  requiresRecovery: () => boolean;
  emit: (event: any) => void;
};

/** Processes one repo-change event while preserving invalidation, fanout and telemetry order. */
async function handleGitRepoWatchEvent(dependencies: GitRepoWatchEventDependencies): Promise<void> {
  const { event, root, host, isActive, getRepository, filterWorkingTreePaths, getTrace, trace,
    invalidateAll, invalidateChange, handleRepoChanged, getRawEventCount, clearRawEventCount,
    recordPerformance, getIndexSizeBucket, requiresRecovery, emit } = dependencies;
  if (!isActive()) return;
  if (event.type !== `worker-event` || event.event.type !== `git-repo-changed`) { emit(event); return; }
  const change = event.event;
  await trace({ attributes: { "git.change_type": change.changeType, "git.changed_path_count": change.changedPaths?.length ?? 0, "git.full_invalidation": change.changeType === `working-tree` && change.changedPaths == null, "worker.id": `git` }, name: `desktop.git_invalidation`, op: `codex.git.invalidation`, root: !0 }, async () => {
    const repository = getRepository(change.root, host);
    let changedPaths = change.changedPaths;
    if (change.changeType === `working-tree`) {
      if (change.changedPaths == null) invalidateAll(repository);
      else {
        const result = await filterWorkingTreePaths(repository, change.changedPaths);
        if (result.type === `filtered`) changedPaths = result.changedPaths;
        else if (result.type === `full`) changedPaths = undefined;
      }
    } else if (change.changeType === `config` || change.changeType === `index`) invalidateAll(repository);
    if (!isActive()) return;
    const nextEvent = change.changeType === `working-tree` && changedPaths !== change.changedPaths ? { ...change, changedPaths } : change;
    const invalidated = nextEvent.changeType !== `working-tree` || nextEvent.changedPaths?.length !== 0;
    const traceContext = getTrace();
    const tracedEvent = traceContext == null ? nextEvent : { ...nextEvent, trace: traceContext };
    let refreshFanoutCount = 0;
    let fanout: Promise<any> | null = null;
    if (invalidated) {
      invalidateChange(repository, nextEvent.changeType, nextEvent.changeType === `working-tree` ? nextEvent.changedPaths : undefined);
      fanout = handleRepoChanged(tracedEvent, (count) => { refreshFanoutCount = count; });
    }
    const rawCount = getRawEventCount(nextEvent.changeType);
    clearRawEventCount(nextEvent.changeType);
    recordPerformance({ changeType: nextEvent.changeType, changedPathCount: change.changedPaths?.length ?? 0, filteredPathCount: Math.max(0, (change.changedPaths?.length ?? 0) - (nextEvent.changedPaths?.length ?? 0)), fullInvalidation: change.changeType === `working-tree` && change.changedPaths == null, hostKind: host.isLocal ? `local` : `remote`, invalidated, rawEventCount: rawCount, repoIndexSizeBucket: getIndexSizeBucket(root, host, fanout), refreshFanoutCount, requiresRecovery: requiresRecovery() });
    emit({ ...event, event: traceContext == null ? nextEvent : { ...nextEvent, emittedAtMs: Date.now(), trace: traceContext } });
    await fanout;
  });
}

export { handleGitRepoWatchEvent };
if (typeof module !== `undefined`) module.exports = { handleGitRepoWatchEvent };
