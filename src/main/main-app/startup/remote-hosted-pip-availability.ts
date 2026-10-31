// @ts-nocheck

/** Reconciles the native and overlay PiP hosts when feature availability changes. */
export function createRemoteHostedPipAvailabilityReconciler(options: Record<string, any>) {
  const {
    getEnabled,
    getLogger,
    reconcileContentHostLifecycle,
    reconcileOverlayContentHost,
  } = options;
  let previousEnabled = getEnabled();

  return () => {
    const enabled = getEnabled();
    reconcileContentHostLifecycle();
    if (previousEnabled !== enabled) {
      getLogger().info(`Remote hosted PiP availability changed`, { safe: { enabled } });
      reconcileOverlayContentHost();
    }
    previousEnabled = enabled;
  };
}

if (typeof module !== `undefined`)
  module.exports = { createRemoteHostedPipAvailabilityReconciler };
