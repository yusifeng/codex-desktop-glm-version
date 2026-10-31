// @ts-nocheck

const PAGE_SIZE = 100;
const SUCCESS_FRESHNESS_MS = 30_000;
const FAILURE_BACKOFF_MS = 10_000;
const NOTIFICATION_DEBOUNCE_MS = 250;
const MAX_NOTIFICATION_WAIT_MS = 1_000;
const MAX_IMPORTED_REFRESHES = 8;
const HISTORY_PRUNE_INTERVAL_MS = 3_600_000;
const HISTORY_PRUNE_CHECK_INTERVAL_MS = 60_000;

function latestUpdatedAt(items) {
  const timestamps = items
    .map((item) => item.updatedAt)
    .filter((value) => Number.isFinite(value));
  return timestamps.length === 0 ? null : Math.max(...timestamps);
}

function updatedAtMap(items) {
  return new Map(
    items.flatMap((item) =>
      Number.isFinite(item.updatedAt) ? [[item.id, item.updatedAt]] : [],
    ),
  );
}

export function createThreadCatalogSyncCoordinatorClass({
  runtime: n,
  parseImportedThreadsNotification,
  projectThreadEntry,
}) {
  return class ThreadCatalogSyncCoordinator {
    client;
    store;
    options;
    listeners = new Set();
    threadObservationListeners = new Set();
    foregroundWaiters = new Set();
    foregroundRequestCount = 0;
    inFlight = null;
    inFlightExecution = null;
    inFlightGeneration = null;
    inFlightMode = null;
    inFlightAbortController = null;
    inFlightForegroundReady = !1;
    lastSuccessAt = null;
    lastFailureAt = null;
    lifecycleGeneration = 0;
    syncEnabled = !1;
    disposed = !1;
    fullReconciliationDue;
    notificationSyncTimer = null;
    notificationSyncQueuedAt = null;
    coldFullSweepRetryTimer = null;
    notificationSyncGeneration = 0;
    reconciledNotificationSyncGeneration = 0;
    pendingThreadRefreshes = new Map();
    dirtyThreadRefreshes = new Set();
    unresolvedImportedThreadIds = new Set();
    reportedImportedThreadReadFailures = new Set();
    historyPruneTimer;
    lastHistoryPruneAt = 0;
    queuedImportedThreadRefreshes = [];
    activeImportedThreadRefreshCount = 0;
    syncState;
    constructor(e, t, n = {}) {
      ((this.client = e), (this.store = t), (this.options = n));
      let r = n.maxHistoryAgeMs;
      (r == null
        ? (this.historyPruneTimer = null)
        : (this.store.pruneEntriesOlderThan((this.now() - r) / 1e3),
          (this.lastHistoryPruneAt = this.now()),
          (this.historyPruneTimer = setInterval(() => {
            try {
              ((this.lastHistoryPruneAt = this.now()),
                this.store.pruneEntriesOlderThan((this.now() - r) / 1e3) &&
                  this.publishInvalidation());
            } catch (e) {
              this.options.onError?.(e);
            }
          }, HISTORY_PRUNE_INTERVAL_MS))),
        (this.syncState = t.readSyncState()),
        n.resumeOffsetPagination &&
          (this.lastFailureAt = t.readScanCheckpoint()?.failedAt ?? null),
        (this.fullReconciliationDue = this.isFullReconciliationDue(
          this.syncState,
        )));
    }
    readSyncState() {
      return this.syncState;
    }
    pruneExpiredEntries() {
      let e = this.options.maxHistoryAgeMs;
      e == null ||
        this.now() - this.lastHistoryPruneAt <
          HISTORY_PRUNE_CHECK_INTERVAL_MS ||
        ((this.lastHistoryPruneAt = this.now()),
        this.store.pruneEntriesOlderThan((this.now() - e) / 1e3) &&
          this.publishInvalidation());
    }
    get isSyncExecuting() {
      return this.inFlightExecution != null;
    }
    cancelQueuedSync() {
      this.inFlight != null &&
        this.inFlightExecution == null &&
        ((this.lifecycleGeneration += 1),
        this.inFlightAbortController?.abort(),
        (this.inFlightAbortController = null),
        (this.inFlight = null),
        (this.inFlightGeneration = null),
        (this.inFlightMode = null),
        (this.inFlightForegroundReady = !1));
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        {
          dispose: () => {
            this.listeners.delete(e);
          },
        }
      );
    }
    subscribeThreadObservations(e) {
      return (
        this.threadObservationListeners.add(e),
        {
          dispose: () => {
            this.threadObservationListeners.delete(e);
          },
        }
      );
    }
    requestSync() {
      return (this.setSyncEnabled(!0), this.requestRun(null, !1, !1));
    }
    requestForegroundSync() {
      this.foregroundRequestCount += 1;
      let e = Promise.withResolvers(),
        t = () => e.resolve(`foreground-ready`);
      return (
        this.foregroundWaiters.add(t),
        this.inFlight != null &&
          this.inFlightForegroundReady &&
          this.options.promotePageSlot?.(),
        Promise.race([this.requestSync(), e.promise]).finally(() => {
          (this.foregroundWaiters.delete(t), --this.foregroundRequestCount);
        })
      );
    }
    requestStartupSync() {
      return (
        this.setSyncEnabled(!0),
        (this.fullReconciliationDue = this.isFullReconciliationDue(
          this.store.readSyncState(),
        )),
        this.requestRun(
          this.fullReconciliationDue ? `full` : `incremental`,
          this.fullReconciliationDue,
          !0,
        ).then((e) => (e === `backoff` && this.scheduleColdFullSweepRetry(), e))
      );
    }
    setSyncEnabled(e) {
      if (!(this.disposed || (e && this.syncEnabled))) {
        if (((this.syncEnabled = e), e)) {
          this.handleImportedThreads(
            Array.from(this.unresolvedImportedThreadIds),
          );
          return;
        }
        ((this.lifecycleGeneration += 1),
          this.clearColdFullSweepRetry(),
          this.pendingThreadRefreshes.clear(),
          this.dirtyThreadRefreshes.clear(),
          (this.queuedImportedThreadRefreshes.length = 0),
          this.notificationSyncTimer != null &&
            (clearTimeout(this.notificationSyncTimer),
            (this.notificationSyncTimer = null)),
          (this.notificationSyncQueuedAt = null));
      }
    }
    handleImportedThreads(e) {
      if (!this.disposed) {
        for (let t of new Set(e)) {
          if (
            t === `` ||
            (this.unresolvedImportedThreadIds.add(t),
            this.pendingThreadRefreshes.has(t))
          )
            continue;
          let e = Symbol();
          (this.pendingThreadRefreshes.set(t, e),
            this.queuedImportedThreadRefreshes.push({
              threadId: t,
              refresh: e,
            }));
        }
        this.startImportedThreadRefreshes();
      }
    }
    handleNotification(e) {
      if (this.disposed) return;
      let t = n.ar(e.params);
      if (
        (e.method === `thread/archived` || e.method === `thread/deleted`) &&
        t != null
      ) {
        this.removeThreadFromCatalog(t);
        return;
      }
      if (e.method === `thread/name/updated` && t != null) {
        (this.pendingThreadRefreshes.delete(t),
          this.unresolvedImportedThreadIds.has(t) &&
            this.handleImportedThreads([t]));
        let n = e.params?.threadName;
        if (typeof n == `string`) {
          let e = this.store.applyObservedTitle(t, n);
          e.changedThreadIds.length > 0 && this.publishMutation(e, []);
        }
        this.syncEnabled && this.invalidateSource();
        return;
      }
      if (
        this.syncEnabled ||
        e.method === `externalAgentConfig/import/completed`
      )
        switch (e.method) {
          case `thread/started`: {
            let t = n.ir(e.params);
            if (t == null) return;
            (this.pendingThreadRefreshes.delete(t.id),
              this.unresolvedImportedThreadIds.delete(t.id),
              this.reportedImportedThreadReadFailures.delete(t.id),
              this.observeThread(t));
            return;
          }
          case `thread/unarchived`: {
            if (t == null) return;
            if (this.pendingThreadRefreshes.has(t)) {
              this.dirtyThreadRefreshes.add(t);
              return;
            }
            let e = Symbol();
            (this.pendingThreadRefreshes.set(t, e),
              this.refreshThread(t, e, `interactive`));
            return;
          }
          case `externalAgentConfig/import/completed`: {
            let t = parseImportedThreadsNotification(e.params);
            if (t == null) return;
            this.handleImportedThreads(t.importedSessionThreadIds);
            return;
          }
          case `turn/completed`:
            this.invalidateSource();
            return;
          default:
            return;
        }
    }
    removeThreadFromCatalog(e) {
      return (
        !this.disposed &&
        (this.pendingThreadRefreshes.delete(e),
        this.dirtyThreadRefreshes.delete(e),
        this.unresolvedImportedThreadIds.delete(e),
        this.reportedImportedThreadReadFailures.delete(e),
        this.publishMutation(this.store.applyAuthoritativeRemoval(e), []),
        this.store.readEntry(e) == null)
      );
    }
    requestRun(e, t, n) {
      if (this.disposed) return Promise.resolve(`stopped`);
      if (this.inFlight != null)
        return this.inFlightGeneration !== this.lifecycleGeneration ||
          (e === `full` && this.inFlightMode !== `full`)
          ? this.inFlight.then(() => this.requestRun(e, t, n))
          : this.inFlightExecution == null
            ? this.inFlight
            : this.inFlightExecution;
      let r = this.now();
      if (
        !t &&
        this.lastSuccessAt != null &&
        r - this.lastSuccessAt <
          (this.options.successFreshnessMs ?? SUCCESS_FRESHNESS_MS)
      )
        return Promise.resolve(`fresh`);
      if (
        this.lastFailureAt != null &&
        r - this.lastFailureAt <
          (this.options.failureBackoffMs ?? FAILURE_BACKOFF_MS)
      )
        return Promise.resolve(`backoff`);
      let i = this.lifecycleGeneration;
      this.inFlightGeneration = i;
      let a =
        e ?? (this.store.readSyncState().isComplete ? `incremental` : `full`);
      ((this.inFlightMode = a), (this.inFlightForegroundReady = !1));
      let o = new AbortController();
      this.inFlightAbortController = o;
      let s = () => {
          if (this.inFlightExecution == null) {
            let e = () =>
              this.isCurrent(i)
                ? this.runSync(i, a)
                : Promise.resolve(`aborted`);
            ((this.inFlightExecution = e()),
              (this.inFlightExecution = this.inFlightExecution.then(
                (e) => (
                  a === `full` &&
                    e === `failed` &&
                    this.scheduleColdFullSweepRetry(),
                  e
                ),
              )));
          }
          return this.inFlightExecution;
        },
        c = (this.options.scheduleRun?.(a, n, s, o.signal) ?? s()).finally(
          () => {
            this.inFlight === c &&
              ((this.inFlight = null),
              (this.inFlightGeneration = null),
              (this.inFlightMode = null),
              (this.inFlightExecution = null),
              (this.inFlightAbortController = null),
              (this.inFlightForegroundReady = !1));
          },
        );
      return ((this.inFlight = c), c);
    }
    dispose() {
      this.disposed ||
        ((this.disposed = !0),
        this.historyPruneTimer != null && clearInterval(this.historyPruneTimer),
        (this.lifecycleGeneration += 1),
        this.clearColdFullSweepRetry(),
        this.pendingThreadRefreshes.clear(),
        this.dirtyThreadRefreshes.clear(),
        this.unresolvedImportedThreadIds.clear(),
        this.reportedImportedThreadReadFailures.clear(),
        (this.queuedImportedThreadRefreshes.length = 0),
        this.notificationSyncTimer != null &&
          (clearTimeout(this.notificationSyncTimer),
          (this.notificationSyncTimer = null)),
        (this.notificationSyncQueuedAt = null),
        this.listeners.clear(),
        this.threadObservationListeners.clear());
    }
    async runSync(e, t) {
      this.pruneExpiredEntries();
      let n = this.store.readSyncState(),
        r = this.options.resumeOffsetPagination
          ? this.store.readScanCheckpoint()
          : null,
        i = r?.attempt.mode === t ? r : null,
        a = this.store.beginScan(t, i),
        o = n.sourceUpdatedAtWatermark,
        s = new Set(),
        c = i?.progress.cursor ?? null,
        l = i?.progress.headWatermark ?? null,
        u = new Map(i?.progress.overlapAnchors),
        d = new Map(i?.progress.headAnchors),
        f = new Map(i?.progress.lastAnchors),
        p = i?.progress.phase ?? `scan`,
        m = p === `scan` && c != null,
        h = m,
        g = new Map(f);
      p === `reconcile-head` && ((c = null), (l = null));
      let _ = () => ({
          cursor: c,
          phase: p,
          headWatermark: l,
          headAnchors: [...d],
          lastAnchors: [...f],
          overlapAnchors: [...u],
        }),
        v = (e = null) => {
          this.options.resumeOffsetPagination
            ? this.store.pauseScan(a, e)
            : this.store.abortScan(a);
        },
        y = !0,
        b = !1,
        x = !1,
        S = n.catalogRevision,
        C = n.isComplete,
        w = t === `full` ? this.notificationSyncGeneration : null;
      try {
        for (
          this.options.resumeOffsetPagination &&
          i == null &&
          this.store.applyScanPage(a, [], _());
          ;
        ) {
          if (
            !this.isCurrent(e) ||
            (this.options.waitForPageSlot != null &&
              !(await this.options.waitForPageSlot(b ? `idle` : `immediate`)))
          )
            return (v(), (y = !1), `aborted`);
          let n = await this.client.listPage(
            { cursor: m ? null : c, limit: PAGE_SIZE },
            this.foregroundRequestCount > 0 ? `interactive` : `background`,
          );
          if (!this.isCurrent(e)) return (v(), (y = !1), `aborted`);
          n.onAccepted?.(this);
          let r =
              this.options.maxHistoryAgeMs == null
                ? null
                : (this.now() - this.options.maxHistoryAgeMs) / 1e3,
            i =
              r != null &&
              n.items.some(
                (e) => Number.isFinite(e.updatedAt) && e.updatedAt < r,
              );
          m &&
            (n.nextCursor == null || i) &&
            ((m = !1), (h = !1), (c = null), (l = null));
          let T = m,
            E =
              h &&
              !T &&
              c != null &&
              !n.items.some((e) => g.get(e.id) === e.updatedAt);
          !T &&
            !E &&
            ((h = !1),
            p === `scan` &&
              (d.size === 0 && (d = updatedAtMap(n.items)),
              n.items.length > 0 && (f = updatedAtMap(n.items))),
            (l ??= latestUpdatedAt(n.items)));
          let D = n.items.flatMap(({ entry: e }) =>
              e == null || (r != null && e.sourceUpdatedAt < r) ? [] : [e],
            ),
            O = this.store.applyScanPage(
              a,
              D,
              this.options.resumeOffsetPagination ? _() : void 0,
            );
          if (
            (this.recordSilentMutation(),
            (x =
              x ||
              O.changedThreadIds.length > 0 ||
              O.removedThreadIds.length > 0),
            !b && n.items.length > 0)
          ) {
            ((x &&=
              (this.publishInvalidation(),
              (S = this.syncState.catalogRevision),
              (C = this.syncState.isComplete),
              !1)),
              (b = !0),
              (this.inFlightForegroundReady = !0));
            for (let e of this.foregroundWaiters) e();
            this.foregroundWaiters.clear();
          } else if (this.foregroundWaiters.size > 0) {
            (this.publishInvalidation(),
              (S = this.syncState.catalogRevision),
              (C = this.syncState.isComplete),
              (x = !1));
            for (let e of this.foregroundWaiters) e();
            this.foregroundWaiters.clear();
          }
          if (T || E) {
            if (T) m = !1;
            else {
              let e = Math.max(0, Number(c) - PAGE_SIZE);
              c = e === 0 ? null : String(e);
            }
            await this.yieldBetweenPages();
            continue;
          }
          let k =
              t === `incremental` &&
              o != null &&
              n.items.some(
                (e) => Number.isFinite(e.updatedAt) && e.updatedAt < o,
              ),
            A = p === `scan` && (n.nextCursor == null || k || i);
          if (
            A &&
            ((u = t === `full` ? d : f),
            t === `incremental` &&
              k &&
              o != null &&
              (u = new Map([...u].filter(([, e]) => e < o))),
            u.size > 0)
          ) {
            ((p = `reconcile-head`),
              (c = null),
              (l = null),
              s.clear(),
              (w = this.notificationSyncGeneration),
              await this.yieldBetweenPages());
            continue;
          }
          let j =
            p === `reconcile-head` &&
            n.items.some((e) => u.get(e.id) === e.updatedAt);
          if (
            (p === `scan` && A) ||
            (p === `reconcile-head` && (n.nextCursor == null || j || i))
          )
            return (
              this.store.completeScan(
                a,
                l ?? (t === `incremental` ? o : null),
                this.now(),
                r,
              ),
              (y = !1),
              (this.lastSuccessAt = this.now()),
              (this.lastFailureAt = null),
              w != null &&
                (this.reconciledNotificationSyncGeneration = Math.max(
                  this.reconciledNotificationSyncGeneration,
                  w,
                )),
              t === `full` &&
                ((this.fullReconciliationDue = !1),
                this.clearColdFullSweepRetry(),
                this.options.onColdFullSweepCompleted?.()),
              this.hasPendingNotificationSync() &&
                this.armNotificationSyncTimer(0),
              this.recordSilentMutation(),
              (x ||
                this.syncState.catalogRevision !== S ||
                this.syncState.isComplete !== C) &&
                this.publishInvalidation(),
              `completed`
            );
          let M = n.nextCursor;
          if (M == null)
            throw Error(`Thread list ended before scan completion`);
          if (s.has(M))
            return (
              this.store.abortScan(a),
              (y = !1),
              (this.lastFailureAt = this.now()),
              x && this.publishInvalidation(),
              `failed`
            );
          (s.add(M),
            (c = M),
            (b || this.options.yieldBetweenPages != null) &&
              (await this.yieldBetweenPages()));
        }
      } catch (t) {
        return (
          y && v(this.isCurrent(e) ? this.now() : null),
          this.isCurrent(e)
            ? (this.options.onError?.(t),
              (this.lastFailureAt = this.now()),
              x && this.publishInvalidation(),
              `failed`)
            : `aborted`
        );
      }
    }
    observeThread(e) {
      this.observeThreads([e]);
      let t = projectThreadEntry(e, this.store.hostId);
      if (t == null) {
        this.publishMutation(this.store.applyAuthoritativeRemoval(e.id), []);
        return;
      }
      this.publishMutation(this.store.applyObservedEntry(t), [t]);
    }
    startImportedThreadRefreshes() {
      if (!this.disposed && this.syncEnabled)
        for (
          ;
          this.activeImportedThreadRefreshCount < MAX_IMPORTED_REFRESHES &&
          this.queuedImportedThreadRefreshes.length > 0;
        ) {
          let e = this.queuedImportedThreadRefreshes.shift();
          if (e == null) return;
          this.pendingThreadRefreshes.get(e.threadId) === e.refresh &&
            ((this.activeImportedThreadRefreshCount += 1),
            this.refreshThread(e.threadId, e.refresh).finally(() => {
              (--this.activeImportedThreadRefreshCount,
                this.startImportedThreadRefreshes());
            }));
        }
    }
    async refreshThread(e, t, n) {
      try {
        let r = await this.client.readItem(e, n ?? `background`);
        if (this.disposed || this.pendingThreadRefreshes.get(e) !== t) return;
        if (
          (this.pendingThreadRefreshes.delete(e),
          this.unresolvedImportedThreadIds.delete(e),
          this.reportedImportedThreadReadFailures.delete(e),
          r?.entry == null ||
            (this.options.maxHistoryAgeMs != null &&
              r.entry.sourceUpdatedAt <
                (this.now() - this.options.maxHistoryAgeMs) / 1e3))
        ) {
          (this.dirtyThreadRefreshes.delete(e),
            this.publishMutation(this.store.applyAuthoritativeRemoval(e), []));
          return;
        }
        (r.onAccepted?.(this),
          this.publishMutation(this.store.applyObservedEntry(r.entry), [
            r.entry,
          ]));
      } catch (n) {
        if (this.pendingThreadRefreshes.get(e) !== t) return;
        if (this.unresolvedImportedThreadIds.has(e)) {
          (this.reportedImportedThreadReadFailures.has(e) ||
            (this.reportedImportedThreadReadFailures.add(e),
            this.options.onError?.(n)),
            setTimeout(() => {
              this.unresolvedImportedThreadIds.has(e) &&
                this.pendingThreadRefreshes.get(e) === t &&
                (this.queuedImportedThreadRefreshes.push({
                  threadId: e,
                  refresh: t,
                }),
                this.startImportedThreadRefreshes());
            }, this.options.failureBackoffMs ?? FAILURE_BACKOFF_MS));
          return;
        }
        (this.pendingThreadRefreshes.delete(e),
          this.options.onError?.(n),
          this.invalidateSource());
      } finally {
        if (
          !this.disposed &&
          this.syncEnabled &&
          !this.pendingThreadRefreshes.has(e) &&
          this.dirtyThreadRefreshes.delete(e)
        ) {
          let t = Symbol();
          (this.pendingThreadRefreshes.set(e, t),
            this.refreshThread(e, t, `interactive`));
        }
      }
    }
    invalidateSource() {
      if (
        this.disposed ||
        ((this.notificationSyncGeneration += 1), !this.syncEnabled)
      )
        return;
      let e = this.now();
      ((this.notificationSyncQueuedAt ??= e),
        this.armNotificationSyncTimer(
          Math.min(
            this.options.notificationDebounceMs ?? NOTIFICATION_DEBOUNCE_MS,
            Math.max(
              0,
              this.notificationSyncQueuedAt + MAX_NOTIFICATION_WAIT_MS - e,
            ),
          ),
        ));
    }
    armNotificationSyncTimer(e) {
      (this.notificationSyncTimer != null &&
        clearTimeout(this.notificationSyncTimer),
        (this.notificationSyncTimer = setTimeout(() => {
          ((this.notificationSyncTimer = null),
            (this.notificationSyncQueuedAt = null),
            this.hasPendingNotificationSync() &&
              this.store.readSyncState().isComplete &&
              this.requestNotificationSync());
        }, e)));
    }
    requestNotificationSync(e = this.notificationSyncGeneration) {
      return e <= this.reconciledNotificationSyncGeneration
        ? Promise.resolve(`fresh`)
        : this.disposed || !this.syncEnabled
          ? Promise.resolve(`stopped`)
          : this.inFlightExecution == null
            ? this.requestRun(
                this.store.readSyncState().isComplete ? `incremental` : null,
                !0,
                !1,
              ).then(
                (t) => (
                  t === `completed`
                    ? ((this.reconciledNotificationSyncGeneration = Math.max(
                        this.reconciledNotificationSyncGeneration,
                        e,
                      )),
                      this.syncEnabled &&
                        !this.disposed &&
                        this.hasPendingNotificationSync() &&
                        this.armNotificationSyncTimer(0))
                    : this.syncEnabled &&
                      !this.disposed &&
                      this.armNotificationSyncTimer(
                        this.options.failureBackoffMs ?? FAILURE_BACKOFF_MS,
                      ),
                  t
                ),
              )
            : this.inFlightExecution.then(() =>
                this.requestNotificationSync(e),
              );
    }
    hasPendingNotificationSync() {
      return (
        this.notificationSyncGeneration >
        this.reconciledNotificationSyncGeneration
      );
    }
    scheduleColdFullSweepRetry() {
      this.syncEnabled &&
        this.fullReconciliationDue &&
        (this.options.autoRetryColdFullSweep ?? !1) &&
        !this.disposed &&
        this.coldFullSweepRetryTimer == null &&
        (this.coldFullSweepRetryTimer = setTimeout(() => {
          ((this.coldFullSweepRetryTimer = null),
            this.syncEnabled && !this.disposed && this.requestStartupSync());
        }, this.options.failureBackoffMs ?? FAILURE_BACKOFF_MS));
    }
    clearColdFullSweepRetry() {
      this.coldFullSweepRetryTimer != null &&
        (clearTimeout(this.coldFullSweepRetryTimer),
        (this.coldFullSweepRetryTimer = null));
    }
    publishMutation(e, t) {
      (e.changedThreadIds.length !== 0 || e.removedThreadIds.length !== 0) &&
        this.publish(e, t);
    }
    observeThreads(e) {
      if (e.length !== 0) for (let t of this.threadObservationListeners) t(e);
    }
    publish(e, t, n = !0) {
      let r = this.syncState.isComplete,
        i = new Map(t.map((e) => [e.threadId, e]));
      if (
        ((this.syncState = this.store.readSyncState()),
        !n ||
          (e.changedThreadIds.length === 0 &&
            e.removedThreadIds.length === 0 &&
            r === this.syncState.isComplete))
      )
        return;
      let a = {
        type: `delta`,
        entries: e.changedThreadIds.flatMap((e) => {
          let t = i.get(e) ?? this.store.readEntry(e);
          return t == null ? [] : [t];
        }),
        mutation: e,
        syncState: this.syncState,
      };
      for (let e of this.listeners)
        try {
          e(a);
        } catch (e) {
          this.options.onError?.(e);
        }
    }
    publishInvalidation() {
      this.syncState = this.store.readSyncState();
      let e = { type: `invalidation`, syncState: this.syncState };
      for (let t of this.listeners)
        try {
          t(e);
        } catch (e) {
          this.options.onError?.(e);
        }
    }
    recordSilentMutation() {
      this.syncState = this.store.readSyncState();
    }
    isCurrent(e) {
      return (
        !this.disposed && this.syncEnabled && e === this.lifecycleGeneration
      );
    }
    now() {
      return this.options.now?.() ?? Date.now();
    }
    yieldBetweenPages() {
      return (
        this.options.yieldBetweenPages?.() ??
        new Promise((e) => setImmediate(e))
      );
    }
    isFullReconciliationDue(e) {
      return !e.isComplete || e.lastFullReconciliationAt == null;
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createThreadCatalogSyncCoordinatorClass };
