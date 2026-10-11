import path from "node:path";
import { lstat, opendir } from "node:fs/promises";
import { buildParcelWatcherOptions } from "./parcel-watcher-options";
import { isParcelWatcherMissingPathError } from "./parcel-watcher-errors";
import { isPathAtOrBelowAnyRoot, isPathBelowAnyRoot } from "./parcel-watcher-paths";
import { projectParcelWatcherEvents } from "./parcel-watcher-events";

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void };

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function directoryHasEntries(directory: string) {
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory()) return false;
    const handle = await opendir(directory);
    try { return (await handle.read()) != null; } finally { await handle.close(); }
  } catch (error) {
    if (isParcelWatcherMissingPathError(error, `ENOENT`) || isParcelWatcherMissingPathError(error, `ENOTDIR`)) return false;
    throw error;
  }
}

class ParcelWatcherRuntime {
  private closed = createDeferred<any>();
  private supplementalSubscriptions = new Map<string, any>();
  private activeDirectoryPathChecks = new Map<string, any>();
  private queuedDirectoryPathChecks = new Map<string, any>();
  private rootSubscription: any = null;
  private closeResult: any = null;
  private closePromise: Promise<any> | null = null;
  private subscriptionOperationTail: Promise<any> = Promise.resolve();
  private directorySubscriptionSetupPromise: Promise<any> | null = null;

  constructor(
    private readonly parcelWatcher: any,
    private readonly params: any,
    private readonly options: any,
    private readonly deps: { pathApi: any; directoryHasEntries: (path: string) => Promise<boolean> },
  ) {}

  private getWatcherOptions(directory: string) {
    return buildParcelWatcherOptions(this.deps.pathApi, directory, this.options.ignoredPaths);
  }

  async start() {
    await this.queueSubscriptionOperation(() => this.startRootSubscription());
    if (this.closeResult != null) await this.close(this.closeResult).catch(() => {});
    return {
      coverage: { recursive: true, typedPathChanges: true },
      path: this.params.path,
      closed: this.closed.promise,
      dispose: async () => { await this.close({ reason: `disposed` }); },
    };
  }

  onWatcherEvents = (error: unknown, changes: any[]) => {
    if (this.closeResult != null) return;
    if (error != null) { this.close({ reason: `watch-error`, error }).catch(() => {}); return; }
    if (changes.length === 0) return;
    const projection = projectParcelWatcherEvents(this.deps.pathApi, this.params.path, changes, this.params.renameEventHandling);
    this.emitChange({ changedPaths: projection.changedPaths, pathChanges: projection.pathChanges });
    if (projection.rootDeleted) {
      this.close({ reason: `watch-error`, error: Error(`File watch root was deleted`) }).catch(() => {});
      return;
    }
    const paths = new Set(projection.pathsToCheck);
    this.removeSupplementalSubscriptionsAtOrBelowPaths(paths);
    changes.forEach((change) => { if (change.type !== `delete` && change.path !== this.params.path) this.queueDirectoryPathCheck(change.path); });
    this.attachSupplementalSubscriptionsForDirectories();
  };

  private queueDirectoryPathCheck(directory: string) {
    const previous = this.activeDirectoryPathChecks.get(directory);
    if (previous != null) {
      previous.active = false;
      if (this.queuedDirectoryPathChecks.get(directory) === previous) this.queuedDirectoryPathChecks.delete(directory);
    }
    const check = { active: true, path: directory };
    this.activeDirectoryPathChecks.set(directory, check);
    this.queuedDirectoryPathChecks.set(directory, check);
  }

  private attachSupplementalSubscriptionsForDirectories() {
    if (this.queuedDirectoryPathChecks.size === 0 || this.directorySubscriptionSetupPromise != null || this.closeResult != null) return;
    this.directorySubscriptionSetupPromise = (async () => {
      for (; this.queuedDirectoryPathChecks.size > 0 && this.closeResult == null;) {
        const checks = [...this.queuedDirectoryPathChecks.values()];
        checks.forEach((check) => { if (this.queuedDirectoryPathChecks.get(check.path) === check) this.queuedDirectoryPathChecks.delete(check.path); });
        try {
          const active = (await Promise.all(checks.map(async (check) => {
            if (!check.active) return null;
            const exists = await this.deps.directoryHasEntries(check.path);
            return !check.active || !exists ? null : check;
          }))).filter((check) => check != null);
          const roots = new Set(active.map((check: any) => check.path));
          const filtered = active.filter((check: any) => !isPathBelowAnyRoot(this.deps.pathApi, check.path, roots));
          const newPaths = new Set(filtered.filter((check: any) => !this.supplementalSubscriptions.has(check.path)).map((check: any) => check.path));
          if (newPaths.size > 0) {
            const removed = this.takeSupplementalSubscriptionsAtOrBelowPaths(newPaths);
            if (removed.length > 0) await this.queueSubscriptionOperation(() => this.unsubscribeSubscriptions(removed));
          }
          let started = false;
          for (const check of filtered) if (await this.startSupplementalSubscriptionForDirectory(check)) started = true;
          if (started) this.emitChange({ changedPaths: [] });
        } finally {
          checks.forEach((check) => { check.active = false; if (this.activeDirectoryPathChecks.get(check.path) === check) this.activeDirectoryPathChecks.delete(check.path); });
        }
      }
    })().catch((error) => { this.close({ reason: `watch-error`, error }).catch(() => {}); }).finally(() => {
      this.directorySubscriptionSetupPromise = null;
      if (this.queuedDirectoryPathChecks.size > 0) this.attachSupplementalSubscriptionsForDirectories();
    });
  }

  private async startSupplementalSubscriptionForDirectory(check: any) {
    let started = false;
    await this.queueSubscriptionOperation(async () => {
      if (!check.active || this.closeResult != null || this.supplementalSubscriptions.has(check.path)) return;
      const entry = { active: true, path: check.path, subscription: null as any };
      this.supplementalSubscriptions.set(check.path, entry);
      let subscription;
      try {
        subscription = await this.parcelWatcher.subscribe(check.path, (error: unknown, changes: any[]) => {
          if (entry.active && this.supplementalSubscriptions.get(entry.path) === entry) this.onWatcherEvents(error, changes);
        }, this.getWatcherOptions(check.path));
      } catch (error) {
        if (this.supplementalSubscriptions.get(check.path) === entry) this.supplementalSubscriptions.delete(check.path);
        entry.active = false;
        if (!check.active || !(await this.deps.directoryHasEntries(check.path))) return;
        throw error;
      }
      if (!check.active || !entry.active || this.closeResult != null || this.supplementalSubscriptions.get(check.path) !== entry) {
        if (this.supplementalSubscriptions.get(check.path) === entry) this.supplementalSubscriptions.delete(check.path);
        entry.active = false;
        await subscription.unsubscribe();
        return;
      }
      entry.subscription = subscription;
      started = true;
    });
    return started;
  }

  private removeSupplementalSubscriptionsAtOrBelowPaths(paths: Set<string>) {
    if (paths.size === 0) return;
    this.deactivateDirectoryPathChecksAtOrBelowPaths(paths);
    const removed = this.takeSupplementalSubscriptionsAtOrBelowPaths(paths);
    if (removed.length === 0) return;
    this.queueSubscriptionOperation(() => this.unsubscribeSubscriptions(removed)).catch((error) => { this.close({ reason: `watch-error`, error }).catch(() => {}); });
  }

  async close(reason: any) {
    const result = (this.closeResult ??= reason);
    if (this.closePromise != null) return this.closePromise;
    const root = this.rootSubscription;
    this.rootSubscription = null;
    const supplemental = this.takeSupplementalSubscriptionsAtOrBelowPaths(new Set([this.params.path]));
    this.activeDirectoryPathChecks.forEach((check) => { check.active = false; });
    this.activeDirectoryPathChecks.clear();
    this.queuedDirectoryPathChecks.clear();
    this.closePromise = this.queueSubscriptionOperation(() => this.unsubscribeSubscriptions([...(root == null ? [] : [root]), ...supplemental])).then(
      () => { this.closed.resolve(result); },
      (error) => { this.closed.resolve({ reason: `watch-error`, error }); throw error; },
    );
    return this.closePromise;
  }

  private async startRootSubscription() {
    const subscription = await this.parcelWatcher.subscribe(this.params.path, this.onWatcherEvents, this.getWatcherOptions(this.params.path));
    if (this.closeResult != null) { await subscription.unsubscribe(); return; }
    this.rootSubscription = subscription;
  }

  private queueSubscriptionOperation(operation: () => Promise<any> | any) {
    const next = this.subscriptionOperationTail.then(operation);
    this.subscriptionOperationTail = next.catch(() => {});
    return next;
  }

  private async unsubscribeSubscriptions(subscriptions: any[]) { await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe())); }

  private takeSupplementalSubscriptionsAtOrBelowPaths(roots: Set<string>) {
    const removed: any[] = [];
    this.supplementalSubscriptions.forEach((entry, directory) => {
      if (isPathAtOrBelowAnyRoot(this.deps.pathApi, directory, roots)) {
        entry.active = false;
        this.supplementalSubscriptions.delete(directory);
        if (entry.subscription != null) removed.push(entry.subscription);
      }
    });
    return removed;
  }

  private deactivateDirectoryPathChecksAtOrBelowPaths(roots: Set<string>) {
    this.activeDirectoryPathChecks.forEach((check, directory) => {
      if (isPathAtOrBelowAnyRoot(this.deps.pathApi, directory, roots)) {
        check.active = false;
        this.activeDirectoryPathChecks.delete(directory);
        if (this.queuedDirectoryPathChecks.get(directory) === check) this.queuedDirectoryPathChecks.delete(directory);
      }
    });
  }

  private emitChange(change: any) {
    if (this.closeResult == null) {
      try { this.params.onChange(change); } catch (error) { this.close({ reason: `watch-error`, error }).catch(() => {}); }
    }
  }
}

function createParcelWatcherRuntime(parcelWatcher: any, params: any, options: any, dependencies: any = {}) {
  return new ParcelWatcherRuntime(parcelWatcher, params, options, {
    pathApi: dependencies.pathApi ?? path.posix,
    directoryHasEntries: dependencies.directoryHasEntries ?? directoryHasEntries,
  });
}

async function startParcelWatcher(params: any, options: any) {
  const loadParcelWatcher = new Function(`specifier`, `return import(specifier);`) as (specifier: string) => Promise<any>;
  const parcelWatcher = await loadParcelWatcher(`@parcel/watcher`);
  return createParcelWatcherRuntime(parcelWatcher, params, options).start();
}

export { ParcelWatcherRuntime, createParcelWatcherRuntime, startParcelWatcher };
if (typeof module !== `undefined`) module.exports = { ParcelWatcherRuntime, createParcelWatcherRuntime, startParcelWatcher };
