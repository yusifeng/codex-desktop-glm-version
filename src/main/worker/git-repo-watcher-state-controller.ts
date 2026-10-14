type Options = {
  addPendingPath: (pathApi: any, root: string, pending: Set<string> | null, path: string, limit: number) => Set<string> | null;
  createTarget: (input: any) => any;
  emitChange: (input: any) => Promise<void>;
  isWithinPath: (pathApi: any, parent: string, path: string) => boolean;
  maxPendingPaths: number;
  reconcileIgnoreSources: (context: any, discovered: Map<string, Set<string>>) => Promise<boolean>;
  requiresRecovery: (targets: any[], ignoreRecovery: boolean) => boolean;
  retryDelayMs: number;
};

class GitRepoWatcherStateController {
  readonly watchTargets: any[] = [];
  readonly ignoreSourceWatches = new Map<string, any>();
  readonly changedIgnoreSourcePaths = new Set<string>();
  private readonly options: Options;
  private pendingWorkingTreePaths: Set<string> | null = new Set();
  private workingTreeIgnoredDirectories: string[] = [];
  private currentHeadRefPath: string | null = null;
  private currentHeadRefKnown = false;
  private gitDir: string | null = null;
  pathApi: any = null;
  root = "";
  disposeSession: (target: any) => Promise<any> = async () => {};
  tryStartWatchSession: (target: any, recovering: boolean) => Promise<any> = async () => {};

  constructor(options: Options) {
    this.options = options;
  }

  configure(input: {
    disposeSession: (target: any) => Promise<any>;
    pathApi: any;
    root: string;
    tryStartWatchSession: (target: any, recovering: boolean) => Promise<any>;
  }) {
    this.pathApi = input.pathApi;
    this.root = input.root;
    this.disposeSession = input.disposeSession;
    this.tryStartWatchSession = input.tryStartWatchSession;
  }

  setPathApi(pathApi: any) {
    this.pathApi = pathApi;
  }

  setGitDir(gitDir: string) {
    this.gitDir = gitDir;
  }

  get headRefKnown() {
    return this.currentHeadRefKnown;
  }

  get ignoredDirectories() {
    return this.workingTreeIgnoredDirectories;
  }

  setIgnoredDirectories(directories: string[]) {
    this.workingTreeIgnoredDirectories = directories;
  }

  setHeadRefState(path: string | null, known: boolean) {
    this.currentHeadRefPath = path;
    this.currentHeadRefKnown = known;
  }

  setHeadRefKnown(known: boolean) {
    this.currentHeadRefKnown = known;
  }

  requiresRecovery(ignoreRecovery: boolean) {
    return this.options.requiresRecovery(this.watchTargets, ignoreRecovery);
  }

  async retryInactive(start: (target: any, recovering: boolean) => Promise<any>) {
    await Promise.all(this.watchTargets.map(async (target) => {
      if (target.session == null && !target.metadataDirectory?.missing)
        await start(target, true);
    }));
  }

  addWatchTarget(pathApi: any, path: string | null | undefined, changeType: string) {
    if (!path) return;
    const parent = pathApi.dirname(path);
    return this.addWatchHandler(parent, false, {
      changeType,
      shouldHandleChangedPath: (candidate: string) => candidate === path,
    }, null);
  }

  addDirectoryWatchTarget(path: string, changeType: string, predicate: (path: string) => boolean, recursive = true, parentPath?: string) {
    return this.addWatchHandler(path, recursive, { changeType, shouldHandleChangedPath: predicate }, parentPath == null ? null : { parentPath, missing: false });
  }

  addWatchHandler(path: string, recursive: boolean, handler: any, metadataDirectory: any) {
    const existing = this.watchTargets.find((target) => target.recursive === recursive && target.watchPath === path);
    if (existing) {
      existing.handlers.push(handler);
      return existing;
    }
    const target = this.options.createTarget({ watchPath: path, recursive, handler, metadataDirectory, retryDelayMs: this.options.retryDelayMs });
    this.watchTargets.push(target);
    return target;
  }

  reconcileIgnoreSources(discovered: Map<string, Set<string>>) {
    return this.options.reconcileIgnoreSources(this, discovered);
  }

  async readIgnoredDirectories(input: {
    discover: (environment: any) => Promise<any>;
    getEnvironment: () => Promise<any>;
    getWatchTargets: (paths: string[]) => Promise<Map<string, Set<string>>>;
    isDisposed: () => boolean;
    readDirectories: () => Promise<string[]>;
  }) {
    const environment = await input.getEnvironment();
    while (!input.isDisposed()) {
      const discovered = await input.discover(environment);
      const watchTargets = await input.getWatchTargets([
        ...discovered.configFiles,
        ...(discovered.ignoreFile == null ? [] : [discovered.ignoreFile]),
      ]);
      if (input.isDisposed()) return [];
      const changed = await this.reconcileIgnoreSources(watchTargets);
      if (input.isDisposed()) return [];
      if (!changed) return input.readDirectories();
    }
    return [];
  }

  refreshWorkingTreePolicy(input: {
    getAction: (...args: any[]) => any;
    getPolicy: () => any;
    refresh: (input: any) => Promise<any>;
    isDisposed: () => boolean;
    onApplied: () => void;
    startSession: (target: any, recovering: boolean) => Promise<any>;
  }) {
    return input.refresh({
      getPolicy: input.getPolicy,
      getTarget: () => this.watchTargets.find((target) =>
        target.handlers.some((handler: any) => handler.changeType === `working-tree`)),
      awaitSessionStart: (target: any) => target.sessionStartPromise ?? Promise.resolve(),
      isDisposed: input.isDisposed,
      hasRetryTimer: (target: any) => target.retryTimer != null,
      readPolicy: (policy: any) => policy.read({ refresh: true }),
      isCurrent: (policy: any, snapshot: any) => policy.isCurrent(snapshot),
      getAction: input.getAction,
      applyPolicy: (policy: any, snapshot: any) => policy.didApply(snapshot),
      onApplied: input.onApplied,
      disposeSession: (target: any) => this.disposeSession(target),
      startSession: input.startSession,
      getPreviousDirectories: () => this.workingTreeIgnoredDirectories,
      setPreviousDirectories: (directories: string[]) => {
        this.workingTreeIgnoredDirectories = directories;
      },
      hasSession: (target: any) => target.session != null,
    });
  }

  isWithinPath(pathApi: any, parent: string, path: string) {
    return this.options.isWithinPath(pathApi, parent, path);
  }

  isHeadRefPath(pathApi: any, headsPath: string, path: string, cache: Map<string, boolean>, isLocalBranchDependency?: (ref: string) => boolean) {
    const cached = cache.get(path);
    if (cached != null) return cached;
    const result = !this.currentHeadRefKnown || path === this.currentHeadRefPath || (isLocalBranchDependency?.(pathApi.relative(headsPath, path).split(pathApi.sep).join(`/`)) ?? false);
    cache.set(path, result);
    return result;
  }

  recordFileEvent(changeType: string, paths: Iterable<string> | null | undefined, record: (changeType: string) => void) {
    record(changeType);
    if (changeType === `working-tree`) {
      if (paths == null) this.pendingWorkingTreePaths = null;
      else if (this.pendingWorkingTreePaths != null) {
        for (const path of paths) {
          this.pendingWorkingTreePaths = this.options.addPendingPath(this.pathApi, this.root, this.pendingWorkingTreePaths, path, this.options.maxPendingPaths);
          if (this.pendingWorkingTreePaths == null) break;
        }
      }
    }
  }

  emitRepoChanged(input: any) {
    return this.options.emitChange({
      ...input,
      getPendingWorkingTreePaths: () => this.pendingWorkingTreePaths,
      resetPendingWorkingTreePaths: () => { this.pendingWorkingTreePaths = new Set(); },
      isHeadRefKnown: () => this.currentHeadRefKnown,
      setHeadRefState: (path: string | null, known: boolean) => this.setHeadRefState(path, known),
    });
  }

  async getGitOperationState(input: {
    createMarkerPaths: (pathApi: any, gitDir: string) => string[];
    createState: (input: any) => any;
    isMissingPathError: (error: unknown) => boolean;
    stat: (path: string) => Promise<any>;
  }) {
    if (this.pathApi == null || this.gitDir == null)
      return { cherryPickInProgress: null, mergeInProgress: null, rebaseInProgress: null, revertInProgress: null };
    const exists = async (path: string) => {
      try {
        await input.stat(path);
        return true;
      } catch (error) {
        return !input.isMissingPathError(error) && null;
      }
    };
    const [cherryPickInProgress, mergeInProgress, rebaseHead, rebaseMerge, rebaseApply, revertInProgress] =
      await Promise.all(input.createMarkerPaths(this.pathApi, this.gitDir).map(exists));
    return input.createState({ cherryPickInProgress, mergeInProgress, rebaseHead, rebaseMerge, rebaseApply, revertInProgress });
  }

  clear() {
    this.watchTargets.length = 0;
    this.ignoreSourceWatches.clear();
    this.changedIgnoreSourcePaths.clear();
    this.pendingWorkingTreePaths = new Set();
  }
}

export { GitRepoWatcherStateController };
if (typeof module !== `undefined`) module.exports = { GitRepoWatcherStateController };
