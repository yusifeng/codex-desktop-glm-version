// @ts-nocheck

/** Owns authorized persistence, revision tombstones, and renderer subscriptions for turn summaries. */
export function createThreadTurnSummaryServiceClass(dependencies: Record<string, any>) {
  const { RpcHandlerBase, createLogger, createHash, createUsingScope } = dependencies;

  const visibleSummaryKey = (hostId: string, threadId: string) => `${hostId}\0${threadId}`;
  const storedSummaryKey = (principal: string, hostKey: string, threadId: string) =>
    `${principal}\0${hostKey}\0${threadId}`;

  class ThreadTurnSummarySubscription extends RpcHandlerBase {
    unsubscribeOnce;

    constructor(unsubscribe: () => void) {
      super();
      this.unsubscribeOnce = unsubscribe;
    }

    unsubscribe() {
      this.unsubscribeOnce?.();
      this.unsubscribeOnce = null;
    }

    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  return class ThreadTurnSummaryService extends RpcHandlerBase {
    logger = createLogger(`ThreadTurnSummaryService`);
    listeners = new Set();
    visibleSummaries = new Map();
    deletedRevisions = new Map();
    unsubscribeHostRemoved;
    unsubscribePrincipalChange;
    authorizationEpoch = 0;
    disposed = false;
    getPrincipal;
    getStore;
    getHostKey;

    constructor({
      getPrincipal,
      getStore,
      getHostKey,
      onHostRemoved,
      onPrincipalChange,
    }: Record<string, any>) {
      super();
      this.getPrincipal = getPrincipal;
      this.getStore = getStore;
      this.getHostKey = getHostKey;
      this.unsubscribeHostRemoved = onHostRemoved((hostId: string) => {
        this.invalidateSummaries((summary: Record<string, any>) => summary.hostId === hostId);
      });
      this.unsubscribePrincipalChange = onPrincipalChange((event: Record<string, any>) => {
        if (event.previous != null) {
          this.authorizationEpoch += 1;
          this.invalidateSummaries(() => true);
        }
      });
    }

    async getPrincipalIdentity({ hostId }: { hostId: string }) {
      return this.runAuthorized(hostId, null, (principalIdentity: string) => principalIdentity);
    }

    async readMany({ hostId, threadIds }: { hostId: string; threadIds: string[] }) {
      if (threadIds.length === 0) return [];
      return this.runAuthorized(hostId, [], (principalIdentity: string, hostKey: string) => {
        const store = this.getStore();
        if (store == null) return [];
        return store.readMany(principalIdentity, hostKey, threadIds).map((stored: Record<string, any>) => {
          const summary = { hostId, ...stored };
          this.visibleSummaries.set(visibleSummaryKey(hostId, stored.threadId), summary);
          return summary;
        });
      });
    }

    async setSummary({
      hostId,
      threadId,
      summary,
      compactSummary,
      compactSummaryTurnKey,
      revision,
      principalIdentity,
    }: Record<string, any>) {
      const normalizedSummary = summary.replace(/\s+/g, ` `).trim().slice(0, 280).trimEnd();
      const normalizedCompactSummary = compactSummary
        ?.replace(/\s+/g, ` `)
        .trim()
        .slice(0, 60)
        .trimEnd();
      if (
        threadId.length === 0 ||
        normalizedSummary.length === 0 ||
        normalizedCompactSummary?.length === 0 ||
        (normalizedCompactSummary == null) !== (compactSummaryTurnKey == null) ||
        compactSummaryTurnKey?.length === 0 ||
        !Number.isSafeInteger(revision) ||
        revision < 0
      ) {
        return false;
      }
      return this.runAuthorized(hostId, false, (currentPrincipal: string, hostKey: string) => {
        if (principalIdentity !== currentPrincipal) return false;
        const storageKey = storedSummaryKey(currentPrincipal, hostKey, threadId);
        if ((this.deletedRevisions.get(storageKey) ?? -1) >= revision) return false;
        const store = this.getStore();
        if (
          store == null ||
          !store.set(
            currentPrincipal,
            hostKey,
            threadId,
            normalizedSummary,
            revision,
            normalizedCompactSummary,
            compactSummaryTurnKey,
          )
        ) {
          return false;
        }
        const visible = {
          hostId,
          threadId,
          summary: normalizedSummary,
          ...(normalizedCompactSummary == null
            ? {}
            : {
                compactSummary: normalizedCompactSummary,
                compactSummaryTurnKey,
              }),
          revision,
        };
        this.deletedRevisions.delete(storageKey);
        this.visibleSummaries.set(visibleSummaryKey(hostId, threadId), visible);
        this.publish(visible);
        return true;
      });
    }

    async subscribe(callbackHandle: any) {
      if (this.disposed) {
        throw new DOMException(`Task turn summary service is disposed`, `AbortError`);
      }
      const callback = callbackHandle.dup();
      this.listeners.add(callback);
      const unsubscribe = () => {
        if (this.listeners.delete(callback)) callback[Symbol.dispose]();
      };
      callback.onRpcBroken(unsubscribe);
      return new ThreadTurnSummarySubscription(unsubscribe);
    }

    async delete({ hostId, threadId }: { hostId: string; threadId: string }) {
      await this.runAuthorized(hostId, undefined, (principalIdentity: string, hostKey: string) => {
        const store = this.getStore();
        const persistedRevision = store?.readMany(principalIdentity, hostKey, [threadId])[0]?.revision;
        store?.delete(principalIdentity, hostKey, threadId);
        const visibleKey = visibleSummaryKey(hostId, threadId);
        const visible = this.visibleSummaries.get(visibleKey);
        const storageKey = storedSummaryKey(principalIdentity, hostKey, threadId);
        const revision =
          Math.max(
            visible?.revision ?? -1,
            persistedRevision ?? -1,
            this.deletedRevisions.get(storageKey) ?? -1,
          ) + 1;
        this.deletedRevisions.set(storageKey, revision);
        this.visibleSummaries.delete(visibleKey);
        this.publish({ hostId, threadId, summary: null, revision });
      });
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.unsubscribeHostRemoved();
      this.unsubscribePrincipalChange();
      for (const listener of this.listeners) listener[Symbol.dispose]();
      this.listeners.clear();
      this.visibleSummaries.clear();
      this.deletedRevisions.clear();
    }

    async runAuthorized(hostId: string, fallback: unknown, operation: (...args: any[]) => unknown) {
      if (this.disposed) return fallback;
      const hostKey = this.getHostKey(hostId);
      if (hostKey == null) return fallback;
      const authorizationEpoch = this.authorizationEpoch;
      try {
        const principal = await this.getPrincipal();
        if (
          this.disposed ||
          principal == null ||
          this.authorizationEpoch !== authorizationEpoch ||
          this.getHostKey(hostId) !== hostKey
        ) {
          return fallback;
        }
        const principalIdentity = createHash(`sha256`)
          .update(`${principal.userId}\0${principal.accountId}`)
          .digest(`hex`);
        return operation(principalIdentity, hostKey);
      } catch (error) {
        if (!this.disposed) {
          this.logger.warning(`Failed to access task turn summaries`, {
            safe: {},
            sensitive: { error, hostId },
          });
        }
        return fallback;
      }
    }

    invalidateSummaries(predicate: (summary: Record<string, any>) => boolean) {
      for (const [key, summary] of this.visibleSummaries) {
        if (predicate(summary)) {
          this.visibleSummaries.delete(key);
          this.publish({
            hostId: summary.hostId,
            threadId: summary.threadId,
            summary: null,
            revision: summary.revision + 1,
          });
        }
      }
    }

    publish(event: Record<string, any>) {
      for (const listener of this.listeners) {
        try {
          var scope = createUsingScope();
          scope.u(listener(event));
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadTurnSummaryServiceClass };
}
