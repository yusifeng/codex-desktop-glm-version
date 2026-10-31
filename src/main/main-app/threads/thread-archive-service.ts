// @ts-nocheck

/**
 * Owns inactive local-thread archive fallback, catalog reconciliation, and archived-thread deletion.
 */
export function createThreadArchiveServiceClass(dependencies: Record<string, any>) {
  const { runtime, RpcHandlerBase, createLogger } = dependencies;

  return class ThreadArchiveService extends RpcHandlerBase {
    executionHostRegistry;
    appServerConnectionRegistry;
    localThreadCatalogSyncCoordinator;
    logger = createLogger(`ThreadArchiveService`);

    constructor(
      executionHostRegistry: any,
      appServerConnectionRegistry: any,
      localThreadCatalogSyncCoordinator: any,
    ) {
      super();
      this.executionHostRegistry = executionHostRegistry;
      this.appServerConnectionRegistry = appServerConnectionRegistry;
      this.localThreadCatalogSyncCoordinator = localThreadCatalogSyncCoordinator;
    }

    async archiveInactiveThread({
      hostId,
      threadId,
      removeCatalogEntryIfMissing,
      discardProvisionalThread,
    }: Record<string, any>) {
      const executionHost = this.executionHostRegistry.get(hostId);
      if (runtime.Es(executionHost.hostConfig)) {
        throw Error(`Archiving inactive chats is only supported locally`);
      }

      const archiveResult = await runtime.Jr({
        codexHome: await executionHost.codexHome(),
        threadId,
      });
      if (archiveResult === false) return { success: false };

      if (archiveResult == null) {
        if (removeCatalogEntryIfMissing !== true || this.localThreadCatalogSyncCoordinator == null) {
          return { success: false };
        }
        const appServer = this.appServerConnectionRegistry.getConnection(hostId);
        try {
          if (
            (await appServer.readThread(threadId, { includeTurns: false })) != null &&
            discardProvisionalThread !== true
          ) {
            return { success: false };
          }
        } catch (error) {
          if (!(error instanceof Error) || error.message !== `thread not loaded: ${threadId}`) {
            this.logger.warning(`Failed to confirm archived thread state`, {
              safe: {},
              sensitive: { error, threadId },
            });
            return { success: false };
          }
        }
        try {
          if (!this.localThreadCatalogSyncCoordinator.removeThreadFromCatalog(threadId)) {
            return { success: false };
          }
        } catch (error) {
          this.logger.warning(`Failed to remove archived thread from catalog`, {
            safe: {},
            sensitive: { error, threadId },
          });
          return { success: false };
        }
      } else {
        try {
          this.localThreadCatalogSyncCoordinator?.handleNotification({
            method: `thread/archived`,
            params: { threadId },
          });
        } catch (error) {
          this.logger.warning(`Failed to remove archived thread from catalog`, {
            safe: {},
            sensitive: { error, threadId },
          });
        }
      }

      try {
        this.appServerConnectionRegistry
          .getConnection(hostId)
          .handleArchivedThreadSideEffects(threadId);
      } catch (error) {
        this.logger.warning(`Failed to apply archived thread side effects`, {
          safe: {},
          sensitive: { error, threadId },
        });
      }
      return archiveResult == null
        ? { success: true, threadMissing: true }
        : { success: true };
    }

    async deleteArchivedThread({ hostId, threadId }: Record<string, any>) {
      const appServer = this.appServerConnectionRegistry.getConnection(hostId);
      const deletedThreadIds = await runtime.Xr({ appServer, threadId });
      appServer.notifyAutomationRunsUpdated();
      return { deletedThreadIds };
    }

    async deleteAllArchivedThreads({ hostId }: Record<string, any>) {
      const appServer = this.appServerConnectionRegistry.getConnection(hostId);
      const deletedThreadIds = await runtime.Yr({ appServer });
      if (deletedThreadIds.length > 0) appServer.notifyAutomationRunsUpdated();
      return { deletedThreadIds };
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadArchiveServiceClass };
}
