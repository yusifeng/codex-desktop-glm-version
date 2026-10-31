// @ts-nocheck

/**
 * Serializes and throttles catalog page fetches per host while allowing foreground promotion and cancellation.
 */
export function createThreadCatalogPageSlotSchedulerClass(dependencies: Record<string, any>) {
  const {
    now,
    setTimer,
    clearTimer,
    defaultPageIntervalMs = 1_000,
  } = dependencies;

  return class ThreadCatalogPageSlotScheduler {
    #pageIntervalMs;
    #disposed = false;
    #lifecycleGeneration = 0;
    #lastBackgroundPageDispatchAt = null;
    #lastPageDispatchByHost = new Map();
    #queueByHost = new Map();
    #promotedHosts = new Map();
    #hostGenerations = new Map();
    #pendingTimers = new Map();

    constructor({ pageIntervalMs = defaultPageIntervalMs } = {}) {
      this.#pageIntervalMs = pageIntervalMs;
    }

    getBackgroundPageDispatchDelay() {
      return this.#lastBackgroundPageDispatchAt == null
        ? 0
        : Math.max(0, this.#lastBackgroundPageDispatchAt + this.#pageIntervalMs - now());
    }

    recordBackgroundPageDispatch() {
      this.#lastBackgroundPageDispatchAt = now();
    }

    waitForPageSlot(
      hostId: string,
      priority: string,
      isCancelled = () => false,
      intervalMs = this.#pageIntervalMs,
    ) {
      const hostGeneration = this.#hostGenerations.get(hostId) ?? 0;
      const shouldCancel = () =>
        isCancelled() || hostGeneration !== (this.#hostGenerations.get(hostId) ?? 0);

      if (priority === `immediate`) {
        if (this.#disposed || shouldCancel()) return Promise.resolve(false);
        this.#lastPageDispatchByHost.set(hostId, now());
        return Promise.resolve(true);
      }

      const lifecycleGeneration = this.#lifecycleGeneration;
      const result = (this.#queueByHost.get(hostId) ?? Promise.resolve()).then(async () => {
        if (this.#consumePromotion(hostId)) return true;
        if (
          this.#disposed ||
          lifecycleGeneration !== this.#lifecycleGeneration ||
          shouldCancel()
        ) {
          return false;
        }
        const lastPageDispatchAt = this.#lastPageDispatchByHost.get(hostId);
        if (lastPageDispatchAt != null) {
          const delay = Math.max(0, lastPageDispatchAt + intervalMs - now());
          if (delay > 0 && !(await this.#wait(hostId, delay))) return false;
          if (this.#consumePromotion(hostId)) return true;
        }
        if (
          this.#disposed ||
          lifecycleGeneration !== this.#lifecycleGeneration ||
          shouldCancel()
        ) {
          return false;
        }
        this.#lastPageDispatchByHost.set(hostId, now());
        return true;
      });
      const settled = result.then(
        () => undefined,
        () => undefined,
      );
      this.#queueByHost.set(hostId, settled);
      settled.finally(() => {
        if (this.#queueByHost.get(hostId) === settled) this.#queueByHost.delete(hostId);
      });
      return result;
    }

    clearHost(hostId: string) {
      this.#hostGenerations.set(hostId, (this.#hostGenerations.get(hostId) ?? 0) + 1);
      for (const [timer, pending] of this.#pendingTimers) {
        if (pending.hostId === hostId) {
          clearTimer(timer);
          this.#pendingTimers.delete(timer);
          pending.resolve(false);
        }
      }
      this.#promotedHosts.delete(hostId);
      this.#lastPageDispatchByHost.delete(hostId);
      this.#queueByHost.delete(hostId);
    }

    promoteHost(hostId: string) {
      this.#promotedHosts.set(hostId, 1);
      for (const [timer, pending] of this.#pendingTimers) {
        if (pending.hostId === hostId) {
          clearTimer(timer);
          this.#pendingTimers.delete(timer);
          pending.resolve(true);
        }
      }
    }

    dispose() {
      if (!this.#disposed) {
        this.#disposed = true;
        this.cancelPendingWaits();
      }
    }

    cancelPendingWaits() {
      this.#lifecycleGeneration += 1;
      this.#lastBackgroundPageDispatchAt = null;
      for (const [timer, pending] of this.#pendingTimers) {
        clearTimer(timer);
        pending.resolve(false);
      }
      this.#pendingTimers.clear();
      this.#lastPageDispatchByHost.clear();
      this.#queueByHost.clear();
      this.#promotedHosts.clear();
      this.#hostGenerations.clear();
    }

    #consumePromotion(hostId: string) {
      if (!this.#promotedHosts.delete(hostId)) return false;
      this.#lastPageDispatchByHost.set(hostId, now());
      return true;
    }

    #wait(hostId: string, delay: number) {
      if (this.#disposed) return Promise.resolve(false);
      return new Promise((resolve) => {
        const timer = setTimer(() => {
          this.#pendingTimers.delete(timer);
          resolve(!this.#disposed);
        }, delay);
        this.#pendingTimers.set(timer, { hostId, resolve });
      });
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadCatalogPageSlotSchedulerClass };
}
