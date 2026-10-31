type HabitatRuntimeDependencies = {
  HabitatAutomationsService: new (...args: any[]) => any;
  getDesktopFeatureAvailability(): { localAutomationHabitatMigration: boolean };
  fetch(input: unknown, init?: unknown): Promise<unknown>;
  completionSchema: { safeParse(value: unknown): { success: boolean } };
  threadIdOf(value: string): unknown;
  requestThreadOwner(coordination: unknown, hostId: string, threadId: unknown): Promise<boolean>;
  logger: { warning(message: string, fields: unknown): void };
};

/** Runtime bindings around the habitat automation store and host lifecycle. */
export function createHabitatAutomationRuntime(dependencies: HabitatRuntimeDependencies) {
  function createHabitatAutomationsService(
    connection: any,
    desktopApiOptions: unknown,
    appState: unknown,
    disposables: { add(dispose: () => void): void },
    invalidateQueries: (...args: any[]) => void,
  ) {
    const invalidateAutomationQueries = (force = false) => {
      invalidateQueries(["vscode", "list-automations"], force);
      invalidateQueries(["vscode", "inbox-items"], force);
      invalidateQueries(["cloud-automations"]);
      invalidateQueries(["local-automation-habitat-migration"]);
    };
    const service = new dependencies.HabitatAutomationsService(
      connection,
      desktopApiOptions,
      appState,
      () => dependencies.getDesktopFeatureAvailability().localAutomationHabitatMigration,
      dependencies.fetch,
      invalidateAutomationQueries,
    );
    const unsubscribePrincipal = connection.registerInternalAuthenticatedPrincipalChangeHandler(
      ({ current }: any) => {
        service.handlePrincipalChanged(current);
        invalidateAutomationQueries(true);
      },
    );
    const unsubscribeNotifications = connection.registerInternalNotificationHandler(
      (notification: any) => {
        if (
          notification.method === "item/completed" &&
          dependencies.completionSchema.safeParse(notification.params).success
        ) {
          service.sync().catch((error: unknown) => {
            dependencies.logger.warning("Failed to refresh automations after hosted tool call", {
              safe: {},
              sensitive: { error },
            });
          });
        }
      },
    );
    disposables.add(() => {
      unsubscribePrincipal();
      unsubscribeNotifications();
    });
    return service;
  }

  function habitatAutomationHostCallbacks(hostId: string, getService: () => any) {
    return hostId === "local"
      ? {
          onDeleteAutomation: (automationId: string) =>
            getService().deleteArchivedHeartbeat(automationId),
          getHostedAutomationInstallationId: () => getService().getHostedInstallationId(),
          isAutomationMigrationInProgress: () => getService().isLocalMigrationActive(),
        }
      : {};
  }

  async function unsubscribeCompletedAutomationIfUnowned(
    subscriptions: { unsubscribeThread(threadId: string): Promise<void> },
    event: { automationKind: string; hostId: string; threadId: string },
    getHostServices: () => Iterable<{ ownsThread(hostId: string, threadId: unknown): boolean }>,
    appViews: Iterable<{ services: Promise<{ clientCoordination: unknown }> }>,
  ) {
    if (event.automationKind !== "cron" || event.hostId !== "local") return;
    try {
      const { hostId, threadId } = event;
      const parsedThreadId = dependencies.threadIdOf(threadId);
      const ownsLocally = () => {
        for (const service of getHostServices()) {
          if (service.ownsThread(hostId, parsedThreadId)) return true;
        }
        return false;
      };
      if (ownsLocally()) return;
      const remoteOwners = await Promise.allSettled(
        Array.from(appViews, async (view) =>
          dependencies.requestThreadOwner(
            (await view.services).clientCoordination,
            hostId,
            parsedThreadId,
          ),
        ),
      );
      if (
        ownsLocally() ||
        remoteOwners.some((result) => result.status === "rejected" || result.value)
      ) {
        return;
      }
      await subscriptions.unsubscribeThread(threadId);
    } catch (error) {
      dependencies.logger.warning("Failed to unsubscribe completed automation", {
        safe: { threadId: event.threadId },
        sensitive: { error },
      });
    }
  }

  return {
    createHabitatAutomationsService,
    habitatAutomationHostCallbacks,
    unsubscribeCompletedAutomationIfUnowned,
  };
}
