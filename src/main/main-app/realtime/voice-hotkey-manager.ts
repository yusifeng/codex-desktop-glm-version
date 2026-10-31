// @ts-nocheck

const LOCK_POLL_INTERVAL_MS = 250;

/** Owns the realtime-voice global hotkey and lock-screen reservation polling. */
export function createRealtimeVoiceHotkeyManager(dependencies: Record<string, any>) {
  const {
    getCommandBinding,
    registerGlobalHotkey,
    ensureHotkeyPermissions,
    powerMonitor,
    logger,
    setIntervalImpl = setInterval,
    clearIntervalImpl = clearInterval,
  } = dependencies;

  return function initializeRealtimeVoiceHotkey({
    requestRealtimeToggle,
    subscribeRealtimeVoiceSessionReservation,
  }: Record<string, any>) {
    let configuredHotkey = getCommandBinding(`realtimeVoice`).hotkey;
    let registeredHotkey = null;
    let hotkeyRegistration = null;
    let lockPollTimer = null;

    const requestToggle = () => {
      requestRealtimeToggle().catch((error: unknown) => {
        logger.n().warning(`Failed to toggle realtime voice hotkey`, {
          safe: {},
          sensitive: { error },
        });
      });
    };
    const setReservationActive = (active: boolean) => {
      if (!active) {
        if (lockPollTimer != null) {
          clearIntervalImpl(lockPollTimer);
          lockPollTimer = null;
        }
        return;
      }
      if (lockPollTimer == null) {
        lockPollTimer = setIntervalImpl(() => {
          if (powerMonitor.getSystemIdleState(1) === `locked`) requestToggle();
        }, LOCK_POLL_INTERVAL_MS);
        lockPollTimer.unref();
      }
    };
    const unsubscribeReservation = subscribeRealtimeVoiceSessionReservation(setReservationActive);
    const unregister = () => {
      hotkeyRegistration?.unregister();
      hotkeyRegistration = null;
      registeredHotkey = null;
    };
    const applyHotkey = () => {
      if (configuredHotkey == null) {
        unregister();
        return;
      }
      if (registeredHotkey === configuredHotkey) return;
      const registration = registerGlobalHotkey(configuredHotkey, {
        onPressed: () => {
          if (powerMonitor.getSystemIdleState(1) !== `locked`) requestToggle();
        },
      });
      if (registration == null) {
        throw Error(`Unable to register voice chat hotkey: ${configuredHotkey}`);
      }
      unregister();
      hotkeyRegistration = registration;
      registeredHotkey = configuredHotkey;
    };

    try {
      applyHotkey();
    } catch (error) {
      logger.n().warning(`Failed to apply realtime voice hotkey`, {
        safe: {},
        sensitive: { error },
      });
    }

    return {
      dispose: () => {
        unsubscribeReservation();
        setReservationActive(false);
        unregister();
      },
      syncCommandKeybinding: (hotkey: string | null) => {
        if (hotkey != null && hotkey !== configuredHotkey) ensureHotkeyPermissions(hotkey);
        configuredHotkey = hotkey;
        try {
          applyHotkey();
        } catch (error) {
          logger.n().warning(`Failed to sync realtime voice hotkey`, {
            safe: {},
            sensitive: { error },
          });
        }
      },
    };
  };
}

if (typeof module !== "undefined") {
  module.exports = { createRealtimeVoiceHotkeyManager };
}
