// @ts-nocheck

/** Builds the Computer History / Computer Use callbacks consumed by the native status item. */
export function createComputerHistoryStatusItemActions(options: Record<string, any>) {
  const {
    getConnection,
    getFeatureAvailability,
    getManagedService,
    getRecorder,
    invalidateQuery,
    logComputerHistoryStatusItemAction,
    navigate,
    quit,
    requestComputerUseWorker,
    historyClearActions,
    historyClearRange,
    historyScopeAction,
    logger,
  } = options;

  return {
    getComputerUseServiceProcessIdentifier: () =>
      getManagedService()?.getServiceProcessIdentifier() ?? null,

    getNativeStatusItemState: async () => {
      const availability = getFeatureAvailability();
      const connection = getConnection();
      const computerHistoryEnabled =
        availability.skysight &&
        (connection?.getChronicleControlState().enabled ?? false);
      const managedService = getManagedService();
      let serviceProcessIdentifier = availability.skysight
        ? (managedService?.getServiceProcessIdentifier() ?? null)
        : null;

      if (
        managedService != null &&
        (availability.computerUse || computerHistoryEnabled)
      ) {
        serviceProcessIdentifier = await managedService.ensureServicePid();
      }
      if (serviceProcessIdentifier == null) {
        return {
          computerHistoryAvailable: availability.skysight,
          computerHistoryEnabled,
          computerUseAvailable: availability.computerUse,
          serviceProcessIdentifier: null,
          menuState: null,
        };
      }

      let menuState = null;
      try {
        menuState = await requestComputerUseWorker({
          method: `statusItemMenuState`,
          params: {},
        });
      } catch (error) {
        logger.n().warning(`Failed to load the native Computer Use menu state`, {
          safe: {},
          sensitive: { error },
        });
      }
      return {
        computerHistoryAvailable: availability.skysight,
        computerHistoryEnabled,
        computerUseAvailable: availability.computerUse,
        serviceProcessIdentifier,
        menuState,
      };
    },

    onNativeStatusItemMenuAction: async (event: Record<string, any>) => {
      if (event.type === `open-thread`) {
        await navigate(event.path);
        return;
      }
      if (event.type === `quit`) {
        quit();
        return;
      }
      if (event.type === `computer-use/stop-application`) {
        await requestComputerUseWorker({
          method: `stopApplication`,
          params: { applicationId: event.applicationId },
        });
        return;
      }
      if (
        event.type === `computer-history/show-history` ||
        event.type === `computer-history/open-settings`
      ) {
        await navigate(
          event.type === `computer-history/show-history`
            ? `/settings/chronicle#history`
            : `/settings/chronicle`,
        );
        logComputerHistoryStatusItemAction(
          event.type === `computer-history/show-history`
            ? `show_all_history`
            : `open_settings`,
        );
        return;
      }
      if (getManagedService() == null) return;

      switch (event.type) {
        case `computer-history/pause`: {
          const recorder = getRecorder();
          if (recorder == null) return;
          await recorder.pause(event.duration);
          logComputerHistoryStatusItemAction(`pause`);
          invalidateQuery([`chronicle-state`]);
          return;
        }
        case `computer-history/resume`: {
          const recorder = getRecorder();
          if (recorder == null) return;
          await recorder.resume();
          logComputerHistoryStatusItemAction(`resume`);
          invalidateQuery([`chronicle-state`]);
          return;
        }
        case `computer-history/update-observation`:
          await requestComputerUseWorker({
            method: `skysightUpdateObservationPolicy`,
            params: {
              observe: event.observe,
              target:
                event.scope === `app`
                  ? { scope: `app`, bundleID: event.target, urlDomain: null }
                  : { scope: `url`, bundleID: null, urlDomain: event.target },
            },
          });
          logComputerHistoryStatusItemAction(
            historyScopeAction(event.scope, event.observe),
          );
          invalidateQuery([`chronicle-settings`]);
          return;
        case `computer-history/clear-history`: {
          const recorder = getRecorder();
          if (recorder == null) return;
          const range = historyClearRange(
            event.scope,
            event.startedAt,
            event.endedAt,
          );
          if (event.scope === `application_session` && range == null) return;
          await recorder.clearHistory(event.scope, range);
          logComputerHistoryStatusItemAction(historyClearActions[event.scope]);
          invalidateQuery([`chronicle-history`]);
        }
      }
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = { createComputerHistoryStatusItemActions };
}
