// @ts-nocheck

const EXECUTOR_FEATURE_KEYS = [
  `browserUseTinysky`,
  `computerUse`,
  `inAppBrowserUse`,
  `externalBrowserUse`,
];

/** Applies desktop feature availability and reconciles every stateful runtime consumer. */
export function createDesktopFeatureAvailabilityReconciler(options: Record<string, any>) {
  const {
    applyDesktopFeatureAvailability,
    broadcastQueryCacheInvalidation,
    getDesktopFeatureAvailability,
    getLocalAppServerConnection,
    getLogger,
    getManagedComputerUseService,
    getRecorder,
    hasWindowsCaptureBridge,
    isWindows,
    notifyDesktopFeatureAvailabilityChanged,
    reconcileRemoteHostedPipAvailability,
    refreshBrowserSettingsSync,
    refreshOwnerCommandAccelerators,
    resolveDesktopFeatureAvailability,
    setAppshotHotkeysEnabled,
    setBrowserSessionFeatureAvailability,
    setComputerUseFeatureAvailability,
    setPluginFeatureAvailability,
    startConversationExecutor,
  } = options;

  return (featureInput: Record<string, any>, reasons?: unknown) => {
    const previous = getDesktopFeatureAvailability();
    const previousSkysight = previous.skysight;
    const resolved = resolveDesktopFeatureAvailability(featureInput);
    if (isWindows && !hasWindowsCaptureBridge()) resolved.appshotsEnabled = false;
    applyDesktopFeatureAvailability(resolved);

    const current = getDesktopFeatureAvailability();
    if (previous.browserSettingsCloudSync !== current.browserSettingsCloudSync)
      refreshBrowserSettingsSync();
    if (previous.unifiedTabStrip !== current.unifiedTabStrip) {
      refreshOwnerCommandAccelerators();
      broadcastQueryCacheInvalidation([`vscode`, `codex-command-keymap-state`]);
    }
    if (current !== previous) notifyDesktopFeatureAvailabilityChanged();

    const shouldRestartExecutor = EXECUTOR_FEATURE_KEYS.some(
      (key) => previous[key] !== current[key],
    );
    setPluginFeatureAvailability(resolved, reasons).then(() => {
      if (shouldRestartExecutor) startConversationExecutor();
    });
    setBrowserSessionFeatureAvailability(resolved);
    setComputerUseFeatureAvailability(resolved);
    if (isWindows) setAppshotHotkeysEnabled(current.appshotsEnabled);
    reconcileRemoteHostedPipAvailability();

    const currentSkysight = current.skysight;
    if (!previousSkysight && currentSkysight)
      broadcastQueryCacheInvalidation([`chronicle-history`]);

    const managedService = getManagedComputerUseService();
    if (managedService != null) {
      const appshotsEnabled = current.appshotsEnabled;
      const computerUseEnabled = current.computerUse;
      managedService
        .setEnabledFeatures({
          appshotsEnabled,
          computerUseEnabled,
          skysightEnabled: currentSkysight,
        })
        .catch((error: unknown) => {
          getLogger().warning(`Failed to reconcile managed Computer Use service`, {
            safe: { appshotsEnabled, computerUseEnabled, skysightEnabled: currentSkysight },
            sensitive: { error },
          });
        });
    }

    const recorder = getRecorder();
    if (previousSkysight !== currentSkysight && recorder != null)
      (async () => {
        if (!currentSkysight) await recorder.stop();
        getLocalAppServerConnection().reconcileChronicle();
      })().catch((error) => {
        getLogger().warning(`Failed to transition Chronicle recorder backend`, {
          safe: { skysightEnabled: currentSkysight },
          sensitive: { error },
        });
      });
  };
}

if (typeof module !== `undefined`)
  module.exports = { createDesktopFeatureAvailabilityReconciler };
