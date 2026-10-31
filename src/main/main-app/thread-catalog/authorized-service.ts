// @ts-nocheck

/** Owns thread-catalog authorization, account-source leases, subscriptions, and callback cleanup. */
export function createAuthorizedThreadCatalogServiceClass(
  dependencies: Record<string, any>,
) {
  const { runtime: n, disposalScope: a } = dependencies;

  return class AuthorizedThreadCatalogService extends n.Uf {
    manager;
    principal;
    onStatus = null;
    statusSubscription = null;
    onThreadObservation = null;
    threadObservationSubscription = null;
    populationLease = null;
    accountSourceLease = null;
    accountSourceHostId = null;
    desiredAccountId = null;
    sourceGeneration = 0;
    unsubscribePrincipalChange;
    constructor(e, t) {
      (super(),
        (this.manager = e),
        (this.principal = t),
        (this.unsubscribePrincipalChange = t.onPrincipalChange(
          ({ current: e }) => {
            ((this.sourceGeneration += 1), this.#r(e));
          },
        )));
    }
    readThreadCount(e) {
      return (this.#t(e), this.manager.readThreadCount(e));
    }
    readPage(e) {
      return (this.#t(e.hostId), this.manager.readPage(e));
    }
    readEntries(e) {
      for (let t of e) this.#t(t.hostId);
      return this.manager.readEntries(e);
    }
    removeMissingEntry(e) {
      return (this.#t(e.hostId), this.manager.removeMissingEntry(e));
    }
    readStatus() {
      return this.#e(this.manager.readStatus());
    }
    subscribeStatus(e) {
      (this.unsubscribeStatus(),
        (this.onStatus = e.dup()),
        this.onStatus.onRpcBroken(() => {
          (this.unsubscribeStatus(),
            this.setSourceEnabled({ kind: `app-server` }, !1),
            (this.desiredAccountId = null),
            this.#i());
        }),
        (this.statusSubscription = this.manager.subscribeStatus((e) => {
          try {
            var t = a.en();
            t.u(this.onStatus?.(this.#e(e)));
          } catch (e) {
            t.e = e;
          } finally {
            t.d();
          }
        })));
    }
    unsubscribeStatus() {
      (this.statusSubscription?.dispose(),
        (this.statusSubscription = null),
        this.onStatus?.[Symbol.dispose](),
        (this.onStatus = null));
    }
    async setSourceEnabled(e, t) {
      if (e.kind === `app-server`) {
        if (t === (this.populationLease != null)) return;
        (this.populationLease?.dispose(),
          (this.populationLease = null),
          t && (this.populationLease = this.manager.acquirePopulation()));
        return;
      }
      if (!t) {
        this.desiredAccountId === e.accountId &&
          ((this.desiredAccountId = null),
          (this.sourceGeneration += 1),
          this.#i());
        return;
      }
      this.desiredAccountId !== e.accountId &&
        ((this.desiredAccountId = e.accountId), this.#i());
      let n = ++this.sourceGeneration,
        r = await this.principal.getPrincipal();
      n === this.sourceGeneration && this.#r(r);
    }
    async notifyThread(e, t) {
      this.#t(e.hostId);
      let n = this.manager.getCoordinator(e.hostId);
      if (n == null) throw Error(`Thread catalog source is not active`);
      n.handleNotification({
        method: t === `remove` ? `thread/archived` : `thread/unarchived`,
        params: { threadId: e.threadId },
      });
    }
    invalidateSource(e) {
      this.#t(e);
      let t = this.manager.getCoordinator(e);
      if (t == null) throw Error(`Thread catalog source is not active`);
      t.invalidateSource();
    }
    subscribeThreadObservations(e) {
      (this.unsubscribeThreadObservations(),
        (this.onThreadObservation = e.dup()),
        this.onThreadObservation.onRpcBroken(() =>
          this.unsubscribeThreadObservations(),
        ),
        (this.threadObservationSubscription =
          this.manager.subscribeThreadObservations((e) => {
            (!e.hostId.startsWith(`chatgpt:`) || this.#n(e.hostId)) &&
              this.#a(e);
          })));
    }
    unsubscribeThreadObservations() {
      (this.threadObservationSubscription?.dispose(),
        (this.threadObservationSubscription = null),
        this.onThreadObservation?.[Symbol.dispose](),
        (this.onThreadObservation = null));
    }
    async requestSync(e, t = `normal`) {
      for (let t of e ?? []) this.#t(t);
      return (await this.manager.requestSync(e, t), this.readStatus());
    }
    async requestStartupSync() {
      await this.manager.requestStartupSync();
    }
    [Symbol.dispose]() {
      (this.unsubscribeStatus(),
        this.unsubscribeThreadObservations(),
        this.populationLease?.dispose(),
        (this.populationLease = null),
        (this.desiredAccountId = null),
        (this.sourceGeneration += 1),
        this.#i(),
        this.unsubscribePrincipalChange());
    }
    #e(e) {
      return {
        ...e,
        hosts: e.hosts.filter(
          ({ hostId: e }) => !e.startsWith(`chatgpt:`) || this.#n(e),
        ),
      };
    }
    #t(e) {
      if (e.startsWith(`chatgpt:`) && !this.#n(e))
        throw Error(`Thread catalog source is not authorized`);
    }
    #n(e) {
      return this.accountSourceLease != null && this.accountSourceHostId === e;
    }
    #r(e) {
      try {
        var t = a.en();
        let n =
          e != null &&
          e.accountId === this.desiredAccountId &&
          e.userId.length > 0
            ? `chatgpt:${e.accountId}:${e.userId}`
            : null;
        if (this.accountSourceHostId === n || (this.#i(), n == null)) return;
        this.accountSourceHostId = n;
        try {
          this.accountSourceLease = this.manager.acquireSource(
            this.principal.createSource(n),
          );
        } catch (e) {
          throw ((this.accountSourceHostId = null), e);
        }
        t.u(this.onStatus?.(this.readStatus()));
      } catch (e) {
        t.e = e;
      } finally {
        t.d();
      }
    }
    #i() {
      try {
        var e = a.en();
        let t = this.accountSourceLease;
        if (t == null) return;
        ((this.accountSourceLease = null),
          (this.accountSourceHostId = null),
          t.dispose(),
          e.u(this.onStatus?.(this.readStatus())));
      } catch (t) {
        e.e = t;
      } finally {
        e.d();
      }
    }
    #a(e) {
      try {
        var t = a.en();
        t.u(this.onThreadObservation?.(e));
      } catch (e) {
        t.e = e;
      } finally {
        t.d();
      }
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createAuthorizedThreadCatalogServiceClass };
