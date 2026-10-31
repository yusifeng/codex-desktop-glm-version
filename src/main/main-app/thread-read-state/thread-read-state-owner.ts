// @ts-nocheck

/** Owns persisted unread-thread state across authenticated identities, hosts, sessions, and broadcasts. */
export function createThreadReadStateOwnerClass(dependencies: Record<string, any>) {
  const {
    createHash,
    identityEquals,
    normalizeThreadId,
    readStateKey,
    legacyStateKey,
    legacyUnreadProperty,
    legacyUnreadSchema,
  } = dependencies;

  function identityKey(identity: Record<string, any>) {
    const parts = identity.kind === `chatgpt`
      ? [identity.kind, identity.accountId, identity.userId]
      : [identity.kind, identity.authMode];
    return createHash(`sha256`).update(JSON.stringify(parts)).digest(`hex`);
  }

  function createEmptyReadState() {
    return { version: 1, unreadByIdentity: {} };
  }

  class ThreadReadStateOwner {
    options;
    sessions = new Set();
    stopIdentityChanges;
    stopHostChanges;
    generation = 0;
    incoming = null;
    disposed = false;
    loggingOutIdentityKey = null;
    identity = null;
    identityRefresh;

    constructor(options: Record<string, any>) {
      this.options = options;
      this.stopIdentityChanges = options.onIdentityChanged((event: Record<string, any>) => {
        if (event.type === `logout`) {
          if (this.identity == null) this.retire(`identity`);
          else this.clearIdentityForLogout(identityKey(this.identity));
          return;
        }
        if (event.type === `identity`) {
          this.generation += 1;
          this.loggingOutIdentityKey = null;
          this.acceptIdentity(event.identity);
          return;
        }
        const generation = ++this.generation;
        const refresh = Promise.resolve()
          .then(() =>
            generation === this.generation && !this.disposed ? options.readIdentity() : null,
          )
          .then(
            (identity) => {
              if (!this.disposed && generation === this.generation) {
                if (identity == null) this.retire(`unavailable`);
                else {
                  this.loggingOutIdentityKey = null;
                  this.acceptIdentity(identity);
                }
              }
            },
            () => {
              if (!this.disposed && generation === this.generation) this.retire(`unavailable`);
            },
          )
          .finally(() => {
            if (this.identityRefresh === refresh) this.identityRefresh = undefined;
          });
        this.identityRefresh = refresh;
      });
      this.stopHostChanges = options.onHostsChanged(() => this.retire(`hosts`));
    }

    get executionHostKeysByHostId() {
      return this.options.listHostKeys();
    }

    async captureContext(hostId: string) {
      const generation = this.generation;
      const hostKey = this.options.getHostKey(hostId);
      if (this.disposed || hostKey == null) return null;
      let identity;
      try {
        identity = await this.options.readIdentity();
      } catch {
        return null;
      }
      if (identity == null) return null;
      const isCurrent = () =>
        this.isIdentityCurrent(identity, generation) && this.options.getHostKey(hostId) === hostKey;
      return isCurrent()
        ? { context: { identity, executionHostKey: hostKey }, isCurrent }
        : null;
    }

    async open(listener: any, legacyUnreadThreadIdsByHostId?: unknown) {
      const generation = this.generation;
      let identity;
      try {
        identity = await this.options.readIdentity();
      } catch {
        return { status: `unavailable` };
      }
      if (identity == null || !this.isIdentityCurrent(identity, generation)) {
        return { status: `unavailable` };
      }
      const entry = this.createEntry(identity, listener, legacyUnreadThreadIdsByHostId);
      const unreadByHostKey = this.options.globalState.get(readStateKey)?.unreadByIdentity[entry.identityKey];
      const unreadThreadIdsByHostId = Object.fromEntries(
        Object.entries(entry.hostKeys).map(([hostId, hostKey]) => [
          hostId,
          (unreadByHostKey?.[hostKey] ?? []).map(normalizeThreadId),
        ]),
      );
      const session = {
        set: async (change: Record<string, any>) =>
          this.incoming == null && this.identityRefresh == null
            ? this.set(entry, change)
            : this.enqueueWrite(async () => {
                while (this.identityRefresh != null) await this.identityRefresh;
                return this.set(entry, change);
              }),
        clearForLogout: async () => this.clearForLogout(entry),
        unsubscribe: () => {
          this.sessions.delete(entry);
        },
        [Symbol.dispose]: () => {
          this.sessions.delete(entry);
        },
      };
      return {
        status: `ready`,
        identity,
        executionHostKeysByHostId: entry.hostKeys,
        unreadThreadIdsByHostId,
        session,
      };
    }

    openWriter(hostId: string, onRetired: () => void) {
      let active = true;
      let entry;
      const dispose = () => {
        active = false;
        if (entry != null) this.sessions.delete(entry);
      };
      const retire = () => {
        if (active) {
          dispose();
          onRetired();
        }
      };
      const opening = this.captureContext(hostId)
        .then((captured) =>
          active
            ? captured == null || !captured.isCurrent()
              ? (retire(), null)
              : ((entry = this.createEntry(captured.context.identity, (event: Record<string, any>) => {
                  if (event.type === `retired`) retire();
                })),
                entry)
            : null,
        )
        .catch(() => (retire(), null));
      return {
        set: async (change: Record<string, any>) =>
          active
            ? change.hostId === hostId
              ? entry != null && this.incoming == null && this.identityRefresh == null
                ? this.set(entry, change)
                : this.enqueueWrite(async () => {
                    const opened = await opening;
                    if (opened == null) return { status: `retired` };
                    while (this.identityRefresh != null) await this.identityRefresh;
                    return this.set(opened, change);
                  })
              : { status: `unavailable` }
            : { status: `retired` },
        dispose,
      };
    }

    createEntry(identity: Record<string, any>, listener: any, legacy?: unknown) {
      this.identity = identity;
      const entry = {
        identity,
        identityKey: identityKey(identity),
        hostKeys: this.options.listHostKeys(),
        listener,
      };
      this.adoptLegacy(entry, legacy);
      this.sessions.add(entry);
      return entry;
    }

    acceptBroadcast(change: Record<string, any>) {
      const generation = this.generation;
      return this.enqueueWrite(() => this.acceptBroadcastForGeneration(change, generation));
    }

    enqueueWrite(operation: () => unknown) {
      const result = (this.incoming ?? Promise.resolve()).then(operation, operation);
      this.incoming = result;
      const clear = () => {
        if (this.incoming === result) this.incoming = null;
      };
      result.then(clear, clear);
      return result;
    }

    async acceptBroadcastForGeneration(change: Record<string, any>, generation: number) {
      if (this.disposed || generation !== this.generation) return { status: `retired` };
      let identity;
      try {
        identity = await this.options.readIdentity();
      } catch {
        return { status: `unavailable` };
      }
      if (
        identity == null ||
        !this.isIdentityCurrent(identity, generation) ||
        !identityEquals(identity, change.context.identity) ||
        this.options.getHostKey(change.hostId) !== change.context.executionHostKey
      ) {
        return { status: `retired` };
      }
      this.apply(identityKey(identity), change, false);
      return { status: `ok` };
    }

    isIdentityCurrent(identity: Record<string, any>, generation: number) {
      return !this.disposed && generation === this.generation &&
        identityKey(identity) !== this.loggingOutIdentityKey;
    }

    acceptIdentity(identity: Record<string, any>) {
      if (this.identity == null || !identityEquals(this.identity, identity)) {
        this.identity = identity;
        this.retire(`identity`);
      }
    }

    dispose() {
      if (!this.disposed) {
        this.disposed = true;
        this.stopIdentityChanges();
        this.stopHostChanges();
        this.retire(`disposed`);
      }
    }

    set(entry: any, change: Record<string, any>) {
      if (!this.sessions.has(entry)) return { status: `retired` };
      const hostKey = entry.hostKeys[change.hostId];
      if (hostKey == null) return { status: `unavailable` };
      if (this.options.getHostKey(change.hostId) !== hostKey) return { status: `retired` };
      this.apply(
        entry.identityKey,
        { ...change, context: { identity: entry.identity, executionHostKey: hostKey } },
        true,
        entry,
      );
      return { status: `ok` };
    }

    apply(identityKeyValue: string, change: Record<string, any>, accepted: boolean, origin?: any) {
      const current =
        this.options.globalState
          .get(readStateKey)
          ?.unreadByIdentity[identityKeyValue]?.[change.context.executionHostKey]
          ?.includes(change.threadId) ?? false;
      if (current === change.hasUnreadTurn) return;
      this.options.globalState.update(readStateKey, (state: any) => {
        const currentState = state ?? createEmptyReadState();
        const identityState = currentState.unreadByIdentity[identityKeyValue] ?? {};
        const hostState = identityState[change.context.executionHostKey] ?? [];
        return {
          ...currentState,
          unreadByIdentity: {
            ...currentState.unreadByIdentity,
            [identityKeyValue]: {
              ...identityState,
              [change.context.executionHostKey]: change.hasUnreadTurn
                ? [...hostState, change.threadId]
                : hostState.filter((threadId: string) => threadId !== change.threadId),
            },
          },
        };
      });
      for (const session of this.sessions) {
        if (
          session.identityKey === identityKeyValue &&
          session.hostKeys[change.hostId] === change.context.executionHostKey
        ) {
          session.listener({
            type: `changed`,
            origin: session === origin ? `self` : `external`,
            hostId: change.hostId,
            threadId: change.threadId,
            hasUnreadTurn: change.hasUnreadTurn,
          });
        }
      }
      if (accepted) this.options.onAcceptedChange(change);
    }

    clearForLogout(entry: any) {
      if (!this.sessions.has(entry)) return { status: `retired` };
      this.clearIdentityForLogout(entry.identityKey);
      return { status: `ok` };
    }

    clearIdentityForLogout(identityKeyValue: string) {
      this.loggingOutIdentityKey = identityKeyValue;
      this.options.globalState.update(readStateKey, (state: any) => {
        const currentState = state ?? createEmptyReadState();
        const unreadByIdentity = { ...currentState.unreadByIdentity };
        delete unreadByIdentity[identityKeyValue];
        return {
          ...currentState,
          unreadByIdentity,
          legacyMigration:
            currentState.legacyMigration?.identityKey === identityKeyValue
              ? { ...currentState.legacyMigration, cleared: true }
              : currentState.legacyMigration,
        };
      });
      this.retire(`identity`);
    }

    retire(reason: string) {
      this.generation += 1;
      const sessions = [...this.sessions];
      this.sessions.clear();
      for (const session of sessions) session.listener({ type: `retired`, reason });
    }

    adoptLegacy(entry: any, legacy: unknown) {
      const existingMigration = this.options.globalState.get(readStateKey)?.legacyMigration;
      if (
        existingMigration != null &&
        (existingMigration.identityKey !== entry.identityKey || existingMigration.cleared === true)
      ) {
        return;
      }
      const legacyState = this.options.globalState.get(legacyStateKey);
      const parsed = legacyUnreadSchema.safeParse(
        legacyState?.[legacyUnreadProperty] ?? legacy,
      );
      const migration = existingMigration ??
        (parsed.success
          ? {
              identityKey: entry.identityKey,
              unreadThreadIdsByHostId: parsed.data,
              adoptedHostIds: {},
            }
          : undefined);
      if (migration == null) return;
      const adoptedHostIds = { ...migration.adoptedHostIds };
      const additions: Record<string, string[]> = {};
      for (const [hostId, threadIds] of Object.entries(migration.unreadThreadIdsByHostId)) {
        const hostKey = entry.hostKeys[hostId];
        if (hostKey != null && adoptedHostIds[hostId] == null) {
          adoptedHostIds[hostId] = hostKey;
          additions[hostKey] = threadIds;
        }
      }
      if (existingMigration == null || Object.keys(additions).length > 0) {
        this.options.globalState.update(readStateKey, (state: any) => {
          const currentState = state ?? createEmptyReadState();
          const identityState = { ...currentState.unreadByIdentity[entry.identityKey] };
          for (const [hostKey, threadIds] of Object.entries(additions)) {
            identityState[hostKey] = [...new Set([...(identityState[hostKey] ?? []), ...threadIds])];
          }
          return {
            ...currentState,
            unreadByIdentity: {
              ...currentState.unreadByIdentity,
              [entry.identityKey]: identityState,
            },
            legacyMigration: { ...migration, adoptedHostIds },
          };
        });
      }
      if (legacyState?.[legacyUnreadProperty] != null) {
        this.options.globalState.update(legacyStateKey, (state: any) => {
          const next = { ...state };
          delete next[legacyUnreadProperty];
          return next;
        });
      }
    }
  }

  return { ThreadReadStateOwner, createEmptyReadState, identityKey };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadReadStateOwnerClass };
}
