// @ts-nocheck

export function createPinnedThreadsServiceClass({
  DisposableBase,
  PinnedThreadServer,
  SavedCustomSectionsManager,
  dedupe,
  pinnedSectionId,
  pinnedThreadIdsKey,
  readPinnedThreadIds,
  reorderPinnedThreadIds,
}) {
  return class PinnedThreadsService extends DisposableBase {
    sectionUpdateInFlight = new Map();
    useAppServerPins = null;

    constructor(globalState, appServerConnectionRegistry, windowManager, identityProvider) {
      super();
      this.globalState = globalState;
      this.appServerConnectionRegistry = appServerConnectionRegistry;
      this.windowManager = windowManager;
      this.server = new PinnedThreadServer(globalState, appServerConnectionRegistry);
      this.savedCustomSections = new SavedCustomSectionsManager(
        globalState,
        appServerConnectionRegistry,
        windowManager,
        identityProvider,
        this.server,
        async (hostId, refresh, context) => {
          refresh();
          if (context == null) {
            this.broadcast(hostId);
            return;
          }
          const isPinnedSection = context.sectionId === pinnedSectionId;
          const changed = isPinnedSection && context.beforeThreadId !== undefined
            ? this.writeOrder(reorderPinnedThreadIds({
                threadIds: readPinnedThreadIds(this.globalState),
                threadId: context.threadId,
                beforeThreadId: context.beforeThreadId,
              }))
            : this.writeToggle(context.threadId, isPinnedSection);
          if (changed) await this.globalState.flush();
          refresh();
          this.broadcast(
            hostId,
            [context.sectionId, context.previousSectionId].filter(
              (sectionId) => sectionId != null && sectionId !== pinnedSectionId,
            ),
          );
        },
      );
    }

    async list(options) {
      const useAppServerPins = options?.useAppServerPins === true;
      this.useAppServerPins = useAppServerPins;
      if (!useAppServerPins) return { threadIds: readPinnedThreadIds(this.globalState) };
      const { threadIds, serverOrderedThreadIds } = await this.server.listPinnedThreads({
        cloudThreadIds: options?.cloudThreadIds,
        hostId: options?.hostId,
      });
      const cloudThreadIds = new Set(options?.cloudThreadIds);
      const serverThreadIds = new Set(threadIds);
      return {
        threadIds: [
          ...threadIds,
          ...readPinnedThreadIds(this.globalState).filter(
            (threadId) => cloudThreadIds.has(threadId) && !serverThreadIds.has(threadId),
          ),
        ],
        serverOrderedThreadIds,
      };
    }

    async set({ threadId, pinned, beforeThreadId, useAppServerPins, hostId }) {
      if (useAppServerPins) {
        this.useAppServerPins = true;
        const customSectionIds = [];
        let changedHostId = hostId;
        const serverChanged = await this.server.setThreadPinned({
          beforeThreadId,
          threadId,
          pinned,
          hostId,
          onThreadSectionChange: (sectionId, sectionHostId) => {
            changedHostId = sectionHostId;
            if (sectionId != null && sectionId !== pinnedSectionId) customSectionIds.push(sectionId);
          },
        });
        if (serverChanged != null) {
          const localChanged = pinned && beforeThreadId !== undefined
            ? this.writeOrder(reorderPinnedThreadIds({
                threadIds: readPinnedThreadIds(this.globalState),
                threadId,
                beforeThreadId,
              }))
            : this.writeToggle(threadId, pinned);
          if (localChanged) await this.globalState.flush();
          this.broadcast(
            serverChanged ? (changedHostId ?? null) : undefined,
            serverChanged ? customSectionIds : undefined,
          );
          return { success: serverChanged };
        }
        if (!(await this.server.isLegacyThread({ threadId, hostId }))) {
          throw new Error("App server does not support pinning this thread");
        }
      }
      const changed = pinned && beforeThreadId !== undefined
        ? this.writeOrder(reorderPinnedThreadIds({
            threadIds: readPinnedThreadIds(this.globalState),
            threadId,
            beforeThreadId,
          }))
        : this.writeToggle(threadId, pinned);
      this.broadcast();
      await this.globalState.flush();
      return { success: changed };
    }

    async setOrder({ threadIds, useAppServerPins, movedThreadId, beforeThreadId, hostId }) {
      let serverMoved = false;
      if (useAppServerPins) {
        this.useAppServerPins = true;
        if (movedThreadId != null) {
          const moved = await this.server.movePinnedThread({
            threadId: movedThreadId,
            beforeThreadId: beforeThreadId ?? null,
            hostId,
          });
          if (moved != null) {
            if (!moved) {
              this.broadcast();
              return { success: false };
            }
            serverMoved = true;
          } else if (!(await this.server.isLegacyThread({ threadId: movedThreadId, hostId }))) {
            throw new Error("App server does not support reordering this thread");
          }
        } else serverMoved = true;
      }
      const pinned = serverMoved ? new Set(readPinnedThreadIds(this.globalState)) : null;
      const changed = this.writeOrder(pinned == null ? threadIds : threadIds.filter((id) => pinned.has(id)));
      this.broadcast();
      if (changed || !serverMoved) await this.globalState.flush();
      return { success: serverMoved || changed };
    }

    async listSections(request) { return this.server.listSections(request); }
    async listSectionThreadIds(request) { return this.server.listSectionThreadIds(request); }
    async createSection(request) {
      const section = await this.server.createSection(request);
      if (request.threadIdToMove != null && this.writeToggle(request.threadIdToMove, false)) {
        await this.globalState.flush();
      }
      if (request.threadIdToMove != null) {
        this.broadcast(request.hostId, [section.id, request.previousSectionId].filter(
          (sectionId) => sectionId != null && sectionId !== pinnedSectionId,
        ));
      }
      this.broadcast(request.hostId);
      return section;
    }
    async updateSection(request) {
      const key = `${request.hostId}\0${request.sectionId}\0${request.name}`;
      const current = this.sectionUpdateInFlight.get(key);
      if (current != null) return current;
      const update = this.server.updateSection(request).then(() => this.broadcast(request.hostId));
      this.sectionUpdateInFlight.set(key, update);
      try { await update; } finally {
        if (this.sectionUpdateInFlight.get(key) === update) this.sectionUpdateInFlight.delete(key);
      }
    }
    async deleteSection(request) {
      await this.server.deleteSection(request);
      this.broadcast(request.hostId);
    }
    async setThreadSection(request) {
      const changed = await this.server.setThreadSection(request);
      if (changed) {
        if (this.writeToggle(request.threadId, request.sectionId === pinnedSectionId)) {
          await this.globalState.flush();
        }
        this.broadcast(request.hostId, [request.sectionId, request.previousSectionId].filter(
          (sectionId) => sectionId != null && sectionId !== pinnedSectionId,
        ));
      }
      return { success: changed };
    }

    static async getPinnedThreadIdsForWorktreeCleanup(service, hostId) {
      if (service.useAppServerPins == null) throw new Error("Pinned thread source has not been initialized");
      if (!service.useAppServerPins) return readPinnedThreadIds(service.globalState);
      if (service.appServerConnectionRegistry.getMaybeConnection(hostId)?.getConnectionState() !== "connected") {
        throw new Error("App server unavailable for pinned worktree protection");
      }
      return service.server.listPinnedThreadIds({ hostId });
    }

    broadcast(hostId, customSectionIds) {
      this.windowManager.sendMessageToAllRegisteredWindows(
        hostId === undefined
          ? { type: "pinned-threads-updated" }
          : { type: "pinned-threads-updated", customSectionHostId: hostId, customSectionIds },
      );
    }
    writeToggle(threadId, pinned) {
      const current = readPinnedThreadIds(this.globalState);
      return this.writeOrder(pinned
        ? [...current.filter((id) => id !== threadId), threadId]
        : current.filter((id) => id !== threadId));
    }
    writeOrder(threadIds) {
      const current = this.globalState.get(pinnedThreadIdsKey) ?? [];
      const next = dedupe(threadIds);
      if (current.length === next.length && current.every((id, index) => id === next[index])) return false;
      this.globalState.set(pinnedThreadIdsKey, next);
      return true;
    }
  };
}

if (typeof module !== "undefined") module.exports = { createPinnedThreadsServiceClass };
