// @ts-nocheck

/** Owns hosted AppServerManager instances across connections and authenticated identities. */
export function createHostedManagerRegistryClass(dependencies: Record<string, any>) {
  const { identitiesEqual, scheduleMicrotask = queueMicrotask } = dependencies;

  return class HostedManagerRegistry {
    options;
    entries = new Map();
    listeners = new Map();
    cleanup = [];
    disposed = false;
    refreshScheduled = false;

    constructor(options: Record<string, any>) {
      this.options = options;
      this.cleanup.push(
        options.localConnection.registerInternalAuthenticatedPrincipalChangeHandler(
          ({ current }: any) => {
            if (current != null) {
              for (const [hostId, entry] of this.entries) {
                const identity = entry.instance?.context.identity;
                if (
                  identity?.kind === "chatgpt" &&
                  (identity.accountId !== current.accountId || identity.userId !== current.userId)
                ) {
                  this.retireInstance(hostId, entry);
                }
              }
            }
            this.identityChanged(false);
          },
        ),
        options.localConnection.registerInternalNotificationHandler((notification: any) => {
          if (notification.method === "account/updated") {
            this.identityChanged(notification.params?.authMode == null);
          }
        }),
        options.localConnection.registerInternalConnectionStateHandler((state: string) => {
          if (state === "connected") this.refreshInBackground();
        }),
        options.connections.subscribe(({ type, hostId, connection }: any) => {
          if (type === "removed") {
            if (this.entries.get(hostId)?.connection === connection) {
              this.retire(hostId);
              this.refreshInBackground();
            }
            return;
          }
          const entry: any = {
            connection,
            unsubscribeConnectionState: null,
            generation: 0,
            identityReady: false,
            instance: null,
          };
          this.entries.set(hostId, entry);
          if (connection !== options.localConnection) {
            entry.unsubscribeConnectionState = connection.registerInternalConnectionStateHandler(
              (state: string) => {
                if (state === "connected" && this.isEntryCurrent(hostId, entry)) {
                  this.refreshEntryInBackground(hostId, entry);
                }
              },
            );
          }
          this.refreshInBackground();
        }),
      );
    }

    getCurrent(hostId: string) {
      const instance = this.entries.get(hostId)?.instance;
      if (instance?.resource == null) return null;
      try {
        instance.assertCurrent();
        return instance;
      } catch {
        return null;
      }
    }

    subscribe(hostId: string, listener: (instance: any) => void) {
      if (this.disposed) throw Error("Hosted AppServerManager registry is disposed");
      let current = this.getCurrent(hostId);
      const notifyIfChanged = () => {
        const next = this.getCurrent(hostId);
        if (next !== current) {
          current = next;
          listener(next);
        }
      };
      let listeners = this.listeners.get(hostId);
      if (listeners == null) {
        listeners = new Set();
        this.listeners.set(hostId, listeners);
      }
      listeners.add(notifyIfChanged);
      const unsubscribe = () => {
        if (listeners.delete(notifyIfChanged) && listeners.size === 0) {
          this.listeners.delete(hostId);
        }
      };
      try {
        listener(current);
      } catch (error) {
        unsubscribe();
        throw error;
      }
      return unsubscribe;
    }

    async refresh() {
      this.refreshScheduled = false;
      if (this.disposed) return;
      await Promise.all(
        Array.from(this.entries, ([hostId, entry]) => this.refreshEntry(hostId, entry)),
      );
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.refreshScheduled = false;
      for (const dispose of this.cleanup.splice(0)) dispose();
      for (const hostId of this.entries.keys()) this.retire(hostId);
      this.listeners.clear();
    }

    identityChanged(retireAll: boolean) {
      for (const [hostId, entry] of this.entries) {
        entry.generation += 1;
        entry.identityReady = false;
        if (retireAll) this.retireInstance(hostId, entry);
        this.changed(hostId);
      }
      this.refreshInBackground();
    }

    refreshInBackground() {
      if (this.disposed || this.refreshScheduled) return;
      this.refreshScheduled = true;
      scheduleMicrotask(() => {
        if (this.refreshScheduled) this.refresh().catch((error: unknown) => this.options.onError(error));
      });
    }

    refreshEntryInBackground(hostId: string, entry: any) {
      this.refreshEntry(hostId, entry).catch((error: unknown) => this.options.onError(error));
    }

    async refreshEntry(hostId: string, entry: any) {
      if (entry.connection.getConnectionState() !== "connected") return;
      const generation = ++entry.generation;
      const context = await this.options.readContext(hostId);
      if (!this.isEntryCurrent(hostId, entry) || generation !== entry.generation) return;
      if (context == null) {
        entry.identityReady = false;
        this.changed(hostId);
        return;
      }
      if (context.identity.kind === "chatgpt") {
        const principal = await this.options.localConnection.getAuthenticatedPrincipal();
        if (
          !this.isEntryCurrent(hostId, entry) ||
          generation !== entry.generation ||
          principal?.accountId !== context.identity.accountId ||
          principal.userId !== context.identity.userId
        ) {
          return;
        }
      }
      const previous = entry.instance;
      if (
        previous != null &&
        (previous.context.executionHostKey !== context.executionHostKey ||
          !identitiesEqual(previous.context.identity, context.identity))
      ) {
        this.retireInstance(hostId, entry);
      }
      entry.identityReady = true;
      this.changed(hostId);
      if (entry.instance == null) {
        const assertLifetimeCurrent = () => {
          if (!this.isEntryCurrent(hostId, entry) || entry.instance !== instance) {
            throw Error("Hosted AppServerManager retired");
          }
        };
        const assertCurrent = () => {
          assertLifetimeCurrent();
          const identity = context.identity;
          const principal = this.options.localConnection.getCachedAuthenticatedPrincipal();
          if (
            !entry.identityReady ||
            (identity.kind === "chatgpt" &&
              (principal?.accountId !== identity.accountId || principal.userId !== identity.userId))
          ) {
            throw Error("Hosted AppServerManager identity is not ready");
          }
        };
        const instance: any = {
          connection: entry.connection,
          context,
          resource: null,
          pending: null,
          assertCurrent,
        };
        entry.instance = instance;
        instance.pending = this.options
          .create({
            hostId,
            connection: entry.connection,
            context,
            assertLifetimeCurrent,
            assertCurrent,
          })
          .then((resource: any) => {
            try {
              assertCurrent();
            } catch {
              resource.dispose();
              return;
            }
            instance.resource = resource;
            this.changed(hostId);
          })
          .catch((error: unknown) => {
            if (
              this.isEntryCurrent(hostId, entry) &&
              entry.instance === instance &&
              entry.identityReady
            ) {
              this.options.onError(error);
            }
          })
          .finally(() => {
            instance.pending = null;
            if (entry.instance === instance && instance.resource == null) {
              entry.instance = null;
              if (
                generation !== entry.generation &&
                entry.identityReady &&
                this.isEntryCurrent(hostId, entry)
              ) {
                this.refreshEntryInBackground(hostId, entry);
              }
            }
          });
      }
      await entry.instance?.pending;
    }

    isEntryCurrent(hostId: string, entry: any) {
      return (
        !this.disposed &&
        this.entries.get(hostId) === entry &&
        this.options.connections.getMaybeConnection(hostId) === entry.connection
      );
    }

    changed(hostId: string) {
      for (const listener of this.listeners.get(hostId) ?? []) listener();
    }

    retireInstance(hostId: string, entry: any) {
      const instance = entry.instance;
      entry.instance = null;
      this.changed(hostId);
      instance?.resource?.dispose();
    }

    retire(hostId: string) {
      const entry = this.entries.get(hostId);
      if (entry == null) return;
      this.entries.delete(hostId);
      entry.unsubscribeConnectionState?.();
      entry.identityReady = false;
      this.retireInstance(hostId, entry);
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createHostedManagerRegistryClass };
}
