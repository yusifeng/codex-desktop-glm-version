// @ts-nocheck

const FORCED_EXIT_TIMEOUT_MS = 10_000;
const APP_KIT_FRAMEWORK = `/System/Library/Frameworks/AppKit.framework/AppKit`;

/** Owns platform-specific descendant cleanup, forced-exit arming, and system-shutdown observation. */
export function createPlatformShutdownRuntime(dependencies: Record<string, any>) {
  const {
    platform,
    pid,
    loadNativeAddon,
    loadObjcJs,
    logger,
  } = dependencies;
  let forcedExitArmed = false;

  const getWindowsUpdaterAddon = () => {
    const addon = loadNativeAddon();
    if (addon == null) throw Error(`Failed to load Windows updater addon.`);
    return addon;
  };

  function killProcessDescendants() {
    if (platform === `win32`) {
      getWindowsUpdaterAddon().killProcessDescendants(pid);
    }
  }

  function armWindowsForcedExit() {
    if (platform !== `win32` || forcedExitArmed) return;
    try {
      getWindowsUpdaterAddon().armTerminateCurrentProcess(FORCED_EXIT_TIMEOUT_MS);
      forcedExitArmed = true;
    } catch (error) {
      logger.n().warning(`Failed to arm Windows forced exit`, {
        safe: {},
        sensitive: { error },
      });
    }
  }

  async function observeSystemShutdown(onShutdown: () => void) {
    if (platform !== `darwin`) return;
    const shutdownLogger = logger.i(`mac-system-shutdown`);
    try {
      const { NobjcLibrary, typedBlock } = await loadObjcJs();
      const library = new NobjcLibrary(APP_KIT_FRAMEWORK);
      const workspace = library.NSWorkspace;
      const string = library.NSString;
      workspace
        .sharedWorkspace()
        .notificationCenter()
        .addObserverForName$object$queue$usingBlock$(
          string.stringWithUTF8String$(`NSWorkspaceWillPowerOffNotification`),
          null,
          null,
          typedBlock({ returns: `v`, args: [`@`] }, () => {
            shutdownLogger().info(`macOS system shutdown requested; allowing app quit`, {
              safe: {},
              sensitive: {},
            });
            onShutdown();
          }),
        );
    } catch (error) {
      shutdownLogger().warning(`Failed to observe macOS system shutdown`, {
        safe: {},
        sensitive: { error },
      });
    }
  }

  return { armWindowsForcedExit, killProcessDescendants, observeSystemShutdown };
}

if (typeof module !== "undefined") {
  module.exports = { createPlatformShutdownRuntime };
}
