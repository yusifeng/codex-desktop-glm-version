type GitWatcherPerformanceDependencies = {
  emit: (event: any) => void;
  now: () => number;
  setTimeout: (callback: () => void, delayMs: number) => any;
  clearTimeout: (timer: any) => void;
  snapshotDurationMs: number;
  maxRawEventCount: number;
};

class GitWatcherPerformanceAggregator {
  dependencies: GitWatcherPerformanceDependencies;
  snapshots = new Map<string, any>();

  constructor(dependencies: GitWatcherPerformanceDependencies) {
    this.dependencies = dependencies;
  }

  record(params: any) {
    const key = `${params.hostKind}:${params.repoIndexSizeBucket}:${params.changeType}`;
    let snapshot = this.snapshots.get(key);
    if (snapshot == null) {
      const startedAtMs = this.dependencies.now();
      const timer = this.dependencies.setTimeout(() => {
        this.flush(key);
      }, this.dependencies.snapshotDurationMs);
      timer.unref?.();
      snapshot = {
        changeType: params.changeType,
        changedPathCount: 0,
        coalescedBatchCount: 0,
        filteredPathCount: 0,
        fullInvalidationCount: 0,
        hostKind: params.hostKind,
        invalidationCount: 0,
        rawEventCount: 0,
        repoIndexSizeBucket: params.repoIndexSizeBucket,
        refreshFanoutCount: 0,
        requiresRecoveryCount: 0,
        snapshotDurationMs: 0,
        startedAtMs,
        timer,
      };
      this.snapshots.set(key, snapshot);
    }
    snapshot.changedPathCount += params.changedPathCount;
    snapshot.coalescedBatchCount += 1;
    snapshot.filteredPathCount += params.filteredPathCount;
    snapshot.fullInvalidationCount += +!!params.fullInvalidation;
    snapshot.invalidationCount += +!!params.invalidated;
    snapshot.rawEventCount += params.rawEventCount;
    snapshot.refreshFanoutCount += params.refreshFanoutCount;
    snapshot.requiresRecoveryCount += +!!params.requiresRecovery;
    if (snapshot.rawEventCount >= this.dependencies.maxRawEventCount)
      this.flush(key);
  }

  flush(key: string) {
    const snapshot = this.snapshots.get(key);
    if (snapshot == null) return;
    this.snapshots.delete(key);
    this.dependencies.clearTimeout(snapshot.timer);
    this.dependencies.emit({
      type: `git-performance-watcher-snapshot`,
      changeType: snapshot.changeType,
      changedPathCount: snapshot.changedPathCount,
      coalescedBatchCount: snapshot.coalescedBatchCount,
      filteredPathCount: snapshot.filteredPathCount,
      fullInvalidationCount: snapshot.fullInvalidationCount,
      hostKind: snapshot.hostKind,
      invalidationCount: snapshot.invalidationCount,
      rawEventCount: snapshot.rawEventCount,
      repoIndexSizeBucket: snapshot.repoIndexSizeBucket,
      refreshFanoutCount: snapshot.refreshFanoutCount,
      requiresRecoveryCount: snapshot.requiresRecoveryCount,
      snapshotDurationMs: this.dependencies.now() - snapshot.startedAtMs,
    });
  }
}

export { GitWatcherPerformanceAggregator };
if (typeof module !== `undefined`)
  module.exports = { GitWatcherPerformanceAggregator };
