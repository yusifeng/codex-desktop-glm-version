type GitWatchRegistryControllerOptions = {
  applyInitMetadata: (input: any) => Promise<any>;
  ensureInitDesired: (input: any) => Promise<any>;
  getHostKey: (host: any) => string;
  getInitWatchKey: (hostKey: string, cwd: string) => string;
  getWatchKey: (hostKey: string, root: string) => string;
  handleInitRecovery: (input: any) => Promise<any>;
  refreshInitMetadata: (input: any) => Promise<any>;
  scheduleSetup: (activeSetup: any, input: any) => Promise<any>;
  startInitWatcher: (input: any) => Promise<any>;
};

class GitWatchRegistryController {
  private readonly options: GitWatchRegistryControllerOptions;
  private readonly watchesByKey = new Map<string, any>();
  private readonly setupByHost = new Map<string, any>();
  private readonly handledInitWatchers = new WeakSet<object>();
  private readonly initMetadataRefreshes = new Map<string, Promise<any>>();
  private activeInitWatch: any = null;
  private desiredInitWatchKey: string | null = null;

  constructor(options: GitWatchRegistryControllerOptions) {
    this.options = options;
  }

  get watchCount() {
    return this.watchesByKey.size;
  }

  get desiredGitInitWatchKey() {
    return this.desiredInitWatchKey;
  }

  get activeGitInitWatch() {
    return this.activeInitWatch;
  }

  getWatchKey(root: string, host: any) {
    return this.options.getWatchKey(this.options.getHostKey(host), root);
  }

  getWatch(root: string, host: any) {
    return this.watchesByKey.get(this.getWatchKey(root, host));
  }

  getWatchByKey(key: string) {
    return this.watchesByKey.get(key);
  }

  getWatches() {
    return this.watchesByKey.values();
  }

  registerWatch(key: string, watch: any) {
    this.watchesByKey.set(key, watch);
  }

  removeWatch(key: string) {
    this.watchesByKey.delete(key);
  }

  isCurrentWatch(key: string, watch: any) {
    return this.watchesByKey.get(key) === watch;
  }

  scheduleWatchSetup(input: {
    bucketIndexSize: (size: number) => void;
    clearOriginQueries: () => void;
    closeWatch: () => void;
    commonDir: string;
    getTrace: () => any;
    host: any;
    indexPath: (commonDir: string, hostIsLocal: boolean) => string;
    markReady: () => void;
    setStartTrace: (trace: any) => void;
    startWatcher: () => Promise<any>;
    statIndex: (indexPath: string) => Promise<any>;
    watch: any;
  }) {
    const hostKey = this.options.getHostKey(input.host);
    const watchKey = this.getWatchKey(input.watch.root, input.host);
    const activeSetup = this.setupByHost.get(hostKey);
    return this.options.scheduleSetup(activeSetup, {
      hostKey,
      watchKey,
      hostIsLocal: input.host.isLocal,
      commonDir: input.commonDir,
      indexPath: input.indexPath,
      statIndex: input.statIndex,
      bucketIndexSize: (size: number) => {
        if (this.isCurrentWatch(watchKey, input.watch))
          input.bucketIndexSize(size);
      },
      isCurrent: () =>
        input.watch.refCount > 0 && this.isCurrentWatch(watchKey, input.watch),
      startWatcher: input.startWatcher,
      clearOriginQueries: input.clearOriginQueries,
      markReady: input.markReady,
      closeWatch: input.closeWatch,
      getActiveSetup: () => this.setupByHost.get(hostKey),
      setActiveSetup: (setup: any) => this.setupByHost.set(hostKey, setup),
      clearActiveSetup: (setup: any) => {
        if (this.setupByHost.get(hostKey) === setup)
          this.setupByHost.delete(hostKey);
      },
      setStartTrace: input.setStartTrace,
      getTrace: input.getTrace,
    });
  }

  ensureGitInitWatch(cwd: string, host: any, startWatcher: () => Promise<any>) {
    const key = this.getGitInitWatchKey(cwd, host);
    return this.options.ensureInitDesired({
      key,
      getDesiredWatchKey: () => this.desiredInitWatchKey,
      setDesiredWatchKey: (value: string | null) => {
        this.desiredInitWatchKey = value;
      },
      disposeWatcher: () => this.disposeGitInitWatcher(),
      startWatcher,
    });
  }

  startGitInitWatch(input: {
    createWatcher: () => any;
    cwd: string;
    host: any;
  }) {
    const key = this.getGitInitWatchKey(input.cwd, input.host);
    return this.options.startInitWatcher({
      key,
      disposeActiveWatcher: () => this.disposeActiveGitInitWatcher(),
      createWatcher: input.createWatcher,
      setActiveWatcher: (value: any) => {
        this.activeInitWatch = value;
      },
      getActiveWatcher: () => this.activeInitWatch,
      clearActiveWatcher: () => {
        this.activeInitWatch = null;
      },
    });
  }

  handleGitInit(input: {
    cwd: string;
    host: any;
    refreshMetadata: (cwd: string, host: any) => Promise<any>;
    startWatcher: (cwd: string, host: any, mode: string) => Promise<any>;
    watcher: object;
  }) {
    return this.options.handleInitRecovery({
      ...input,
      getWatchKey: (cwd: string, host: any) =>
        this.getGitInitWatchKey(cwd, host),
      getDesiredWatchKey: () => this.desiredInitWatchKey,
      setDesiredWatchKey: (value: string | null) => {
        this.desiredInitWatchKey = value;
      },
      getActiveWatch: () => this.activeInitWatch,
      clearActiveWatch: () => {
        this.activeInitWatch = null;
      },
      handledWatchers: this.handledInitWatchers,
    });
  }

  refreshGitInitMetadata(input: {
    cwd: string;
    host: any;
    invalidateStableMetadata: () => void;
    refreshOnce: () => Promise<any>;
  }) {
    const key = this.getGitInitWatchKey(input.cwd, input.host);
    return this.options.refreshInitMetadata({
      key,
      refreshes: this.initMetadataRefreshes,
      invalidateStableMetadata: input.invalidateStableMetadata,
      refreshOnce: input.refreshOnce,
    });
  }

  applyGitInitMetadata(input: {
    cwd: string;
    disposeGitInitWatcher: (cwd: string, host: any) => void;
    emitHeadChange: (metadata: any, cwd: string, host: any) => void;
    ensureWatching: (metadata: any, host: any) => Promise<any>;
    getStableMetadata: (cwd: string, host: any) => Promise<any>;
    host: any;
    unwatchRepo: (root: string, host: any, options: any) => void;
  }) {
    const key = this.getGitInitWatchKey(input.cwd, input.host);
    return this.options.applyInitMetadata({
      ...input,
      key,
      getDesiredWatchKey: () => this.desiredInitWatchKey,
      setDesiredWatchKey: (value: string | null) => {
        this.desiredInitWatchKey = value;
      },
      disposeActiveWatcher: () => this.disposeActiveGitInitWatcher(),
    });
  }

  getGitInitWatchKey(cwd: string, host: any) {
    return this.options.getInitWatchKey(this.options.getHostKey(host), cwd);
  }

  disposeGitInitWatcher(cwd?: string, host?: any) {
    if (
      cwd != null &&
      host != null &&
      this.desiredInitWatchKey !== this.getGitInitWatchKey(cwd, host)
    ) {
      return;
    }
    this.disposeActiveGitInitWatcher();
    this.desiredInitWatchKey = null;
  }

  disposeActiveGitInitWatcher() {
    this.activeInitWatch?.watcher.dispose();
    this.activeInitWatch = null;
  }
}

export { GitWatchRegistryController };
if (typeof module !== `undefined`)
  module.exports = { GitWatchRegistryController };
