type TimerHandle = ReturnType<typeof setTimeout> | number;
type GitIgnorePolicyOptions = {
  readIgnoredDirectories: () => Promise<string[]>;
  refresh: () => Promise<unknown>;
  onRequiresRecoveryChanged: () => void;
  initialRetryDelayMs?: number;
  recoveryRetryDelayMs?: number;
  setTimeoutFn?: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimeoutFn?: (timer: TimerHandle) => void;
};
type Snapshot = { generation: number; directories: string[] };

class GitIgnorePolicy {
  private readonly options: GitIgnorePolicyOptions;
  private generation = 0;
  private snapshot: Snapshot | null = null;
  private readPromise: Promise<Snapshot> | null = null;
  private refreshPromise: Promise<unknown> | null = null;
  private refreshRequested = false;
  private reconciliationRequested = false;
  private refreshTimer: TimerHandle | null = null;
  private failed = false;
  private disposed = false;

  constructor(options: GitIgnorePolicyOptions) { this.options = options; }
  get requiresRecovery() { return this.failed; }
  requestRefresh() {
    if (this.disposed) return;
    this.generation += 1;
    this.refreshRequested = true;
    this.reconciliationRequested = true;
    this.scheduleRefresh();
  }
  read({ refresh = false }: { refresh?: boolean } = {}): Promise<Snapshot> {
    if (refresh) { this.snapshot = null; this.refreshRequested = false; }
    if (this.snapshot != null && this.isCurrent(this.snapshot)) return Promise.resolve(this.snapshot);
    if (this.readPromise != null) return this.readPromise;
    const generation = this.generation;
    const promise = this.options.readIgnoredDirectories()
      .then((directories) => {
        const snapshot = { generation, directories };
        if (this.isCurrent(snapshot)) this.snapshot = snapshot;
        return snapshot;
      })
      .catch((error) => { this.setFailed(true); throw error; })
      .finally(() => { if (this.readPromise === promise) this.readPromise = null; });
    this.readPromise = promise;
    return promise;
  }
  isCurrent(snapshot: Snapshot) { return !this.disposed && snapshot.generation === this.generation; }
  didApply(snapshot: Snapshot) {
    if (!this.isCurrent(snapshot)) return false;
    const shouldReconcile = this.reconciliationRequested || this.failed;
    this.reconciliationRequested = false;
    this.setFailed(false);
    return shouldReconcile;
  }
  async dispose() {
    this.disposed = true;
    if (this.refreshTimer != null) (this.options.clearTimeoutFn ?? clearTimeout)(this.refreshTimer);
    await Promise.allSettled([this.readPromise, this.refreshPromise]);
  }
  private setFailed(failed: boolean) {
    if (this.disposed || this.failed === failed) return;
    this.failed = failed;
    this.options.onRequiresRecoveryChanged();
  }
  private scheduleRefresh() {
    if (this.disposed || this.refreshTimer != null || this.refreshPromise != null) return;
    const delay = this.failed ? (this.options.recoveryRetryDelayMs ?? 60000) : (this.options.initialRetryDelayMs ?? 1000);
    this.refreshTimer = (this.options.setTimeoutFn ?? setTimeout)(() => {
      this.refreshTimer = null;
      this.refreshRequested = false;
      const promise = this.options.refresh()
        .catch(() => this.setFailed(true))
        .finally(() => {
          if (this.refreshPromise === promise) this.refreshPromise = null;
          if (this.refreshRequested || this.failed) this.scheduleRefresh();
        });
      this.refreshPromise = promise;
    }, delay);
  }
}

export { GitIgnorePolicy };
if (typeof module !== `undefined`) module.exports = { GitIgnorePolicy };
