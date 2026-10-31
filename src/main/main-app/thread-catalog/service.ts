// @ts-nocheck

const CURSOR_VERSION = 3;
const MAX_CONCURRENT_SCANS = 4;
const MAX_INTERACTIVE_BURST = 4;
const CHATGPT_BACKGROUND_PAGE_INTERVAL_MS = 120_000;
const CHATGPT_FAILURE_BACKOFF_MS = 300_000;

export function createThreadCatalogServiceClass({
  ThreadCatalogPageSlotScheduler,
  ThreadCatalogSyncCoordinator,
  Buffer,
  createHash,
}) {
  function catalogEntryKey(e, t) {
    return `${e}\0${t}`;
  }
  function validateManualOrder(e) {
    if (
      e != null &&
      (!Array.isArray(e.threadIds) ||
        e.threadIds.some((e) => typeof e != `string` || e.length === 0) ||
        !Number.isInteger(e.startIndex) ||
        e.startIndex < 0 ||
        e.startIndex > e.threadIds.length)
    )
      throw Error(`Invalid manual thread catalog order`);
  }
  function validatePageLimit(e, t) {
    if (!Number.isInteger(e) || e < 1 || e > 100)
      throw Error(`Thread catalog ${t} must be between 1 and 100`);
  }
  function encodeCursor(e, t, n) {
    return Buffer.from(
      JSON.stringify({
        version: CURSOR_VERSION,
        hostId: e,
        filterFingerprint: t,
        ...n,
      }),
    ).toString(`base64url`);
  }
  function decodeCursor(e) {
    try {
      let t = JSON.parse(Buffer.from(e, `base64url`).toString(`utf8`));
      if (
        typeof t != `object` ||
        !t ||
        !(`version` in t) ||
        t.version !== CURSOR_VERSION ||
        !(`hostId` in t) ||
        typeof t.hostId != `string` ||
        t.hostId.length === 0 ||
        !(`filterFingerprint` in t) ||
        typeof t.filterFingerprint != `string` ||
        t.filterFingerprint.length === 0 ||
        !(`sourceUpdatedAt` in t) ||
        typeof t.sourceUpdatedAt != `number` ||
        !Number.isFinite(t.sourceUpdatedAt) ||
        !(`sourceRecencyAt` in t) ||
        typeof t.sourceRecencyAt != `number` ||
        !Number.isFinite(t.sourceRecencyAt) ||
        !(`sourceCreatedAt` in t) ||
        typeof t.sourceCreatedAt != `number` ||
        !Number.isFinite(t.sourceCreatedAt) ||
        !(`sortKey` in t) ||
        (t.sortKey !== `created_at` && t.sortKey !== `updated_at`) ||
        !(`threadId` in t) ||
        typeof t.threadId != `string` ||
        t.threadId.length === 0
      )
        throw Error(`invalid cursor payload`);
      return {
        hostId: t.hostId,
        filterFingerprint: t.filterFingerprint,
        sortKey: t.sortKey,
        sourceUpdatedAt: t.sourceUpdatedAt,
        sourceRecencyAt: t.sourceRecencyAt,
        sourceCreatedAt: t.sourceCreatedAt,
        threadId: t.threadId,
      };
    } catch {
      throw Error(`Invalid thread catalog cursor`);
    }
  }
  function normalizeFilter(e) {
    if (e == null) return;
    if (
      e.projectId != null &&
      (typeof e.projectId != `string` || e.projectId.length === 0)
    )
      throw Error(`Invalid thread catalog project filter`);
    if (
      e.conversationOrigin !== void 0 &&
      e.conversationOrigin !== `tpp` &&
      e.conversationOrigin !== `non-tpp`
    )
      throw Error(`Invalid thread catalog conversation origin filter`);
    let t = normalizePrefixes(e.cwdPrefixes);
    return {
      includeAll: e.includeAll,
      cwdValues: normalizeFilterValues(e.cwdValues, `CWD`),
      cwdPrefixes: t.filter(
        (e, n) => !t.slice(0, n).some((t) => e.startsWith(t)),
      ),
      includeThreadIds: normalizeFilterValues(
        e.includeThreadIds,
        `included thread ID`,
      ),
      excludeThreadIds: normalizeFilterValues(
        e.excludeThreadIds,
        `excluded thread ID`,
      ),
      ...(e.projectId === void 0 ? {} : { projectId: e.projectId }),
      ...(e.conversationOrigin === void 0
        ? {}
        : { conversationOrigin: e.conversationOrigin }),
    };
  }
  function normalizePrefixes(e) {
    return Array.from(
      new Set(
        normalizeFilterValues(e, `CWD prefix`).map(ensureTrailingSeparator),
      ),
    ).sort((e, t) => e.localeCompare(t));
  }
  function ensureTrailingSeparator(e) {
    return e.endsWith(`/`) || e.endsWith(`\\`)
      ? e
      : `${e}${e.includes(`\\`) ? `\\` : `/`}`;
  }
  function normalizeFilterValues(e, t) {
    if (
      !Array.isArray(e) ||
      e.some((e) => typeof e != `string` || e.length === 0)
    )
      throw Error(`Thread catalog ${t} filter values must not be empty`);
    return [...new Set(e)].sort((e, t) => e.localeCompare(t));
  }
  function filterFingerprint(e) {
    return e == null
      ? `all`
      : createHash(`sha256`).update(JSON.stringify(e)).digest(`base64url`);
  }
  return class ThreadCatalogService {
    localHostId;
    createStore;
    onError;
    idleScheduler;
    hosts = new Map();
    threadObservationListeners = new Set();
    statusListeners = new Set();
    scanWaiters = [];
    scanTailsByHost = new Map();
    scanAdmissionTimer = null;
    registry = null;
    syncEnabled = !1;
    populationOwnerCount = 0;
    startupSyncRequested = !1;
    activeScans = 0;
    consecutiveInteractiveAdmissions = 0;
    disposed = !1;
    constructor(e, t, n, r = new ThreadCatalogPageSlotScheduler()) {
      ((this.localHostId = e),
        (this.createStore = t),
        (this.onError = n),
        (this.idleScheduler = r));
    }
    attachSource(e) {
      if (this.disposed)
        throw Error(`Cannot attach a source to a disposed thread catalog`);
      let t = e.id,
        n = this.hosts.get(t);
      if (n?.source === e) return n.coordinator;
      this.detachSource(t);
      let r = !1,
        i = null,
        a = !1,
        o = !1,
        s = new AbortController(),
        c = () => s.signal,
        l = this.createStore(t, e.hostKind),
        u = () => {
          (i === `queued` && ((a = !0), this.promoteScanWaiter(t)),
            e.promoteQueuedPage?.(),
            i ?? this.idleScheduler.promoteHost(t));
        },
        d = new ThreadCatalogSyncCoordinator(
          {
            listPage: async (n, r) => {
              let s = c();
              i = `queued`;
              try {
                let c = await this.runWithScanSlot(
                  t,
                  async () => {
                    if (
                      !(await this.idleScheduler.waitForPageSlot(
                        t,
                        `immediate`,
                        () => s.aborted,
                      ))
                    )
                      return null;
                    let c = a ? `interactive` : r;
                    return (
                      (a = !1),
                      (i = `active`),
                      (o = !0),
                      e.listPage(n, { priority: c, signal: s })
                    );
                  },
                  s,
                  () => (a ? `interactive` : r),
                  !o && n.cursor == null,
                );
                if (c == null)
                  throw Error(`Thread catalog page request was aborted`);
                return c;
              } finally {
                ((i = null), (a = !1));
              }
            },
            readItem: (n, r) => {
              let i = c();
              return this.runWithScanSlot(
                t,
                () => e.readItem(n, { priority: r, signal: i }),
                i,
                () => r,
                !0,
                r === `background`,
              );
            },
          },
          l,
          {
            scheduleRun: (e, n, r, i) => this.scheduleRun(t, e, n, r, i),
            autoRetryColdFullSweep: !0,
            resumeOffsetPagination: e.hostKind === `chatgpt`,
            maxHistoryAgeMs: e.hostKind === `chatgpt` ? 2592e6 : void 0,
            failureBackoffMs:
              e.hostKind === `chatgpt` ? CHATGPT_FAILURE_BACKOFF_MS : void 0,
            waitForPageSlot: (n) =>
              this.idleScheduler.waitForPageSlot(
                t,
                n,
                () => r,
                e.hostKind === `chatgpt`
                  ? CHATGPT_BACKGROUND_PAGE_INTERVAL_MS
                  : void 0,
              ),
            promotePageSlot: u,
            onError: (e) => this.onError(t, e),
          },
        );
      d.setSyncEnabled(this.syncEnabled);
      let f = e.subscribeNotifications?.((e) => {
          d.handleNotification(e);
        }),
        p = {
          source: e,
          coordinator: d,
          store: l,
          revision: d.readSyncState().catalogRevision,
          ownerCount: 0,
          enabled: this.syncEnabled,
          setSyncEnabled: (e) => {
            ((p.enabled = e),
              e
                ? s.signal.aborted && ((s = new AbortController()), (r = !1))
                : ((r = !0), s.abort(), this.idleScheduler.clearHost(t)),
              d.setSyncEnabled(e));
          },
          cancelPageRequests: () => {
            ((r = !0), s.abort());
          },
          promotePageRequests: u,
          disposeNotificationSubscription: () => {
            f?.();
          },
          coordinatorSubscription: null,
          threadObservationSubscription: null,
        };
      return (
        this.hosts.set(t, p),
        (p.coordinatorSubscription = d.subscribe((e) => {
          this.publishCoordinatorUpdate(t, e);
        })),
        (p.threadObservationSubscription = d.subscribeThreadObservations(
          (e) => {
            this.publishThreadObservation({ hostId: t, threads: e });
          },
        )),
        this.startupSyncRequested && this.enqueueStartupSync(t, d),
        this.publishStatus(),
        d
      );
    }
    detachSource(e) {
      let t = this.hosts.get(e);
      t != null &&
        (this.hosts.delete(e),
        t.cancelPageRequests(),
        this.idleScheduler.clearHost(e),
        t.coordinatorSubscription?.dispose(),
        t.threadObservationSubscription?.dispose(),
        t.disposeNotificationSubscription(),
        t.coordinator.dispose(),
        this.publishStatus());
    }
    reconcileAuthoritativeHostKind(e, t) {
      let n = this.getRegistry();
      for (let r of n.listHostIds(e))
        t.has(r) ||
          (this.detachSource(r),
          this.createStore(r, e).pruneHost(),
          this.publishStatus());
    }
    readThreadHostId(e) {
      return this.getRegistry().readThreadHostId(e);
    }
    readThreadCount(e) {
      return this.requireHostKind(e) === `chatgpt`
        ? null
        : this.getRegistry().readThreadCount(e);
    }
    readPage({
      hostId: e,
      cursor: t,
      filter: n,
      limit: r,
      manualOrder: i,
      sortKey: a,
    }) {
      (validatePageLimit(r, `page limit`), validateManualOrder(i));
      let o = this.requireHostKind(e),
        s = normalizeFilter(n),
        c = filterFingerprint(s),
        l = t == null ? void 0 : decodeCursor(t);
      if (l != null && l.hostId !== e)
        throw Error(`Thread catalog cursor belongs to another host`);
      if (l != null && l.filterFingerprint !== c)
        throw Error(`Thread catalog cursor uses a different filter`);
      if (l != null && l.sortKey !== a)
        throw Error(`Thread catalog cursor uses a different sort order`);
      this.hosts.get(e)?.coordinator.pruneExpiredEntries();
      let u = this.createStore(e, o).readPage({
        limit: r,
        cursor: l,
        filter: s,
        manualOrder: i,
        sortKey: a,
      });
      return {
        entries: u.entries,
        ...(u.nextManualIndex === void 0
          ? {}
          : { nextManualIndex: u.nextManualIndex }),
        nextCursor:
          u.nextCursor == null ? null : encodeCursor(e, c, u.nextCursor),
      };
    }
    readEntries(e) {
      if (e.length > 100)
        throw Error(`Thread catalog entry request exceeds 100`);
      let t = new Map(),
        n = new Map();
      for (let r of e) {
        if (r.threadId.length === 0)
          throw Error(`Thread catalog thread ID must not be empty`);
        n.has(r.hostId) || n.set(r.hostId, this.requireHostKind(r.hostId));
        let e = t.get(r.hostId) ?? [];
        (e.push(r), t.set(r.hostId, e));
      }
      let r = new Map();
      for (let [e, i] of t) {
        this.hosts.get(e)?.coordinator.pruneExpiredEntries();
        let t = n.get(e);
        if (t == null) continue;
        let a = this.hosts.get(e)?.store ?? this.createStore(e, t);
        for (let t of a.readEntries(i.map((e) => e.threadId)))
          r.set(catalogEntryKey(e, t.threadId), t);
      }
      return e.flatMap((e) => {
        let t = r.get(catalogEntryKey(e.hostId, e.threadId));
        return t == null ? [] : [t];
      });
    }
    removeMissingEntry(e) {
      this.readEntries([e]);
      let t = this.hosts.get(e.hostId)?.coordinator;
      return (
        t != null &&
        (t.handleNotification({
          method: `thread/archived`,
          params: { threadId: e.threadId },
        }),
        this.readEntries([e]).length === 0)
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
    readStatus() {
      let e = this.getRegistry(),
        t = [],
        n = 0;
      for (let r of [`local`, `ssh`, `wsl`, `remote-control`])
        for (let i of e.listHostIds(r)) {
          let e = this.hosts.get(i),
            a =
              e?.coordinator.readSyncState() ??
              this.createStore(i, r).readSyncState();
          (t.push({
            hostId: i,
            isComplete: a.isComplete,
            revision: e?.revision ?? a.catalogRevision,
          }),
            (n = Math.max(n, a.catalogRevision)));
        }
      for (let [e, r] of this.hosts) {
        if (r.ownerCount === 0 || t.some((t) => t.hostId === e)) continue;
        let i = r.coordinator.readSyncState();
        (t.push({ hostId: e, isComplete: i.isComplete, revision: r.revision }),
          (n = Math.max(n, i.catalogRevision)));
      }
      return (
        t.sort((e, t) => e.hostId.localeCompare(t.hostId)),
        { revision: n, populationEnabled: this.syncEnabled, hosts: t }
      );
    }
    subscribeStatus(e) {
      return (
        this.statusListeners.add(e),
        e(this.readStatus()),
        { dispose: () => void this.statusListeners.delete(e) }
      );
    }
    acquirePopulation() {
      if (this.disposed) return { dispose: () => {} };
      this.populationOwnerCount += 1;
      for (let [e, t] of this.hosts)
        t.ownerCount === 0 && this.idleScheduler.clearHost(e);
      this.populationOwnerCount === 1 && this.setSyncEnabled(!0);
      let e = !1;
      return {
        dispose: () => {
          e ||
            ((e = !0),
            --this.populationOwnerCount,
            this.populationOwnerCount === 0 && this.setSyncEnabled(!1));
        },
      };
    }
    acquireSource(e) {
      if (this.disposed) return { dispose: () => {} };
      let t = this.hosts.get(e.id);
      if (((t ??= (this.attachSource(e), this.hosts.get(e.id))), t == null))
        throw Error(`Could not attach thread catalog source ${e.id}`);
      ((t.ownerCount += 1),
        t.ownerCount === 1 &&
          (t.setSyncEnabled(!0),
          this.publishStatus(),
          this.requestSync([e.id], `immediate`).catch((t) => {
            this.onError(e.id, t);
          })));
      let n = !1;
      return {
        dispose: () => {
          if (n) return;
          n = !0;
          let r = this.hosts.get(e.id);
          r === t &&
            (--r.ownerCount, r.ownerCount === 0 && this.detachSource(e.id));
        },
      };
    }
    getCoordinator(e) {
      return this.hosts.get(e)?.coordinator ?? null;
    }
    requestStartupSync() {
      if (!this.syncEnabled) return Promise.resolve();
      this.startupSyncRequested = !0;
      let e = Array.from(this.hosts.keys()).sort((e, t) =>
        e === this.localHostId
          ? -1
          : t === this.localHostId
            ? 1
            : e.localeCompare(t),
      );
      return Promise.all(
        e.map((e) => {
          let t = this.hosts.get(e)?.coordinator;
          return t == null ? Promise.resolve() : this.enqueueStartupSync(e, t);
        }),
      ).then(() => void 0);
    }
    async requestSync(e, t = `normal`) {
      let n = (
          e == null ? Array.from(this.hosts.keys()) : Array.from(new Set(e))
        ).flatMap((e) => {
          let n = this.hosts.get(e);
          if (n == null || !n.enabled) return [];
          let { coordinator: r } = n;
          return (
            t === `immediate` &&
              (r.isSyncExecuting
                ? n.promotePageRequests()
                : r.cancelQueuedSync()),
            [{ hostId: e, coordinator: r }]
          );
        }),
        r = (e) =>
          t === `immediate` ? e.requestForegroundSync() : e.requestSync(),
        i = await Promise.all(n.map(({ coordinator: e }) => r(e)));
      await Promise.all(
        i.flatMap((e, t) => {
          if (e !== `aborted`) return [];
          let i = n[t];
          return i == null ||
            !this.hosts.get(i.hostId)?.enabled ||
            this.hosts.get(i.hostId)?.coordinator !== i.coordinator
            ? []
            : [r(i.coordinator)];
        }),
      );
    }
    setSyncEnabled(e) {
      if (!(this.disposed || this.syncEnabled === e)) {
        ((this.syncEnabled = e), e || (this.startupSyncRequested = !1));
        for (let t of this.hosts.values())
          t.ownerCount === 0 && t.setSyncEnabled(e);
        this.publishStatus();
      }
    }
    dispose() {
      if (!this.disposed) {
        ((this.disposed = !0),
          this.scanAdmissionTimer != null &&
            (clearTimeout(this.scanAdmissionTimer),
            (this.scanAdmissionTimer = null)),
          this.threadObservationListeners.clear(),
          this.statusListeners.clear());
        for (let e of Array.from(this.hosts.keys())) this.detachSource(e);
        this.idleScheduler.dispose();
      }
    }
    async enqueueStartupSync(e, t) {
      try {
        await t.requestStartupSync();
      } catch (t) {
        this.onError(e, t);
      }
    }
    scheduleRun = async (e, t, n, r, i) => {
      if (!n) return r();
      let a = () => this.idleScheduler.clearHost(e);
      i.addEventListener(`abort`, a, { once: !0 });
      try {
        return (await this.idleScheduler.waitForPageSlot(e, `idle`))
          ? await r()
          : `aborted`;
      } finally {
        i.removeEventListener(`abort`, a);
      }
    };
    async runWithScanSlot(e, t, n, r, i, a = !0) {
      let o = a
          ? (this.scanTailsByHost.get(e) ?? Promise.resolve())
          : Promise.resolve(),
        s = Promise.withResolvers(),
        c = o.then(() => s.promise);
      a && this.scanTailsByHost.set(e, c);
      let l = !1;
      try {
        return (
          await o,
          (l = await this.acquireScanSlot(e, n, r(), i)),
          l ? await t() : null
        );
      } finally {
        (l && (--this.activeScans, this.admitScanWaiters()),
          s.resolve(void 0),
          a &&
            this.scanTailsByHost.get(e) === c &&
            this.scanTailsByHost.delete(e));
      }
    }
    publishStatus() {
      if (this.statusListeners.size === 0) return;
      let e = this.readStatus();
      for (let t of this.statusListeners)
        try {
          t(e);
        } catch (e) {
          this.onError(this.localHostId, e);
        }
    }
    publishThreadObservation(e) {
      if (this.threadObservationListeners.size !== 0)
        for (let t of this.threadObservationListeners)
          try {
            t(e);
          } catch (e) {
            this.onError(this.localHostId, e);
          }
    }
    acquireScanSlot(e, t, n, r) {
      return t.aborted
        ? Promise.resolve(!1)
        : new Promise((i) => {
            let a = {
                hostId: e,
                priority: n,
                bypassBackgroundPacing: r,
                acquire: () => {
                  (t.removeEventListener(`abort`, o), i(!0));
                },
              },
              o = () => {
                let e = this.scanWaiters.indexOf(a);
                (e !== -1 && this.scanWaiters.splice(e, 1),
                  t.removeEventListener(`abort`, o),
                  i(!1),
                  this.admitScanWaiters());
              };
            (this.scanWaiters.push(a),
              t.addEventListener(`abort`, o, { once: !0 }),
              t.aborted ? o() : this.admitScanWaiters());
          });
    }
    promoteScanWaiter(e) {
      let t = this.scanWaiters.find((t) => t.hostId === e);
      t != null && ((t.priority = `interactive`), this.admitScanWaiters());
    }
    admitScanWaiters() {
      for (
        this.scanAdmissionTimer != null &&
        (clearTimeout(this.scanAdmissionTimer),
        (this.scanAdmissionTimer = null));
        !this.disposed &&
        this.activeScans < MAX_CONCURRENT_SCANS &&
        this.scanWaiters.length > 0;
      ) {
        let e = this.scanWaiters.findIndex(
            ({ priority: e }) => e === `interactive`,
          ),
          t = this.idleScheduler.getBackgroundPageDispatchDelay(),
          n = this.scanWaiters.findIndex(
            ({ priority: e, bypassBackgroundPacing: n }) =>
              e === `background` && (n || t === 0),
          );
        if (e === -1 && n === -1) {
          this.scanAdmissionTimer = setTimeout(() => {
            ((this.scanAdmissionTimer = null), this.admitScanWaiters());
          }, t);
          return;
        }
        let r =
            this.consecutiveInteractiveAdmissions >= MAX_INTERACTIVE_BURST &&
            n !== -1,
          i = e === -1 || r ? n : e,
          a = this.scanWaiters[i];
        if (a == null) return;
        (a.priority === `background` &&
          !a.bypassBackgroundPacing &&
          this.idleScheduler.recordBackgroundPageDispatch(),
          (this.consecutiveInteractiveAdmissions =
            a.priority === `interactive` &&
            this.scanWaiters.some(({ priority: e }) => e === `background`)
              ? this.consecutiveInteractiveAdmissions + 1
              : 0),
          this.scanWaiters.splice(i, 1),
          (this.activeScans += 1),
          a.acquire());
      }
    }
    getRegistry() {
      return (this.registry ??= this.createStore(this.localHostId, `local`));
    }
    requireHostKind(e) {
      if (e.length === 0)
        throw Error(`Thread catalog host ID must not be empty`);
      let t = this.getRegistry();
      for (let n of [`local`, `ssh`, `wsl`, `remote-control`, `chatgpt`])
        if (t.listHostIds(n).includes(e)) return n;
      throw Error(`Unknown thread catalog host: ${e}`);
    }
    publishCoordinatorUpdate(e, t) {
      let n = this.hosts.get(e);
      (n != null && (n.revision = t.syncState.catalogRevision),
        this.publishStatus());
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createThreadCatalogServiceClass };
