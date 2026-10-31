// @ts-nocheck

const DEFAULT_DELAYED_REVEAL_MS = 2_000;
const DEFAULT_BACKGROUND_IDLE_SECONDS = 10;

/** Owns the late-bound WindowContext and primary-window presentation lifecycle. */
export function createWindowContextLifecycle(options: Record<string, any>) {
  const {
    app,
    BrowserWindow,
    clearTimeout: clearTimer = clearTimeout,
    delayedRevealMs = DEFAULT_DELAYED_REVEAL_MS,
    getWindowManager,
    isWindows,
    powerMonitor,
    setTimeout: setTimer = setTimeout,
    shouldStartInBackground,
    startupPhases,
    backgroundIdleSeconds = DEFAULT_BACKGROUND_IDLE_SECONDS,
  } = options;
  let windowContext: any = null;

  const scheduleDelayedReveal = (window: any) => {
    if (!isWindows) return;
    const timer = setTimer(() => {
      if (window.isDestroyed() || window.isVisible()) return;
      if (shouldStartInBackground()) window.showInactive();
      else {
        window.show();
        window.focus();
      }
    }, delayedRevealMs);
    timer.unref?.();
    const cancel = () => clearTimer(timer);
    window.once(`show`, cancel);
    window.once(`closed`, cancel);
  };

  const createPrimaryWindow = async ({ show, initialRoute }: Record<string, any>) => {
    if (windowContext == null) return null;
    const window = await getWindowManager().createPrimaryWindow({
      title: app.getName(),
      show,
      initialRoute: initialRoute === `/` ? undefined : initialRoute,
    });
    if (!show) scheduleDelayedReveal(window);
    return window;
  };

  return {
    isDefaultBrowser() {
      return windowContext?.getMessageHandler().isDefaultBrowser() === true;
    },
    getLocalAuthToken(webContents: any) {
      return windowContext?.getLocalAuthToken(webContents) ?? Promise.resolve(null);
    },
    registerWindow(window: any) {
      windowContext?.registerWindow(window);
    },
    isBackgroundReady() {
      const registry = windowContext?.appServerConnectionRegistry;
      return (
        startupPhases.hasReached(`background_ready`) &&
        powerMonitor.getSystemIdleTime() >= backgroundIdleSeconds &&
        (registry?.getAllHostIds().every(
          (hostId: string) => registry.getConnection(hostId).getPendingRequestCount() === 0,
        ) ?? false)
      );
    },
    broadcastQueryCacheInvalidation(keys: Array<string>) {
      windowContext?.broadcastQueryCacheInvalidation(keys);
    },
    setWindowContext(nextWindowContext: any) {
      windowContext = nextWindowContext;
      const windowManager = getWindowManager();
      for (const window of BrowserWindow.getAllWindows())
        if (!window.isDestroyed() && windowManager.isAppServiceWindow(window))
          nextWindowContext.registerWindow(window);
    },
    async ensureWindow() {
      const windowManager = getWindowManager();
      const window = windowManager.getPrimaryWindow();
      if (window == null) return createPrimaryWindow({ show: false });
      if (windowContext == null) return null;
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
      return window.isDestroyed() ? null : window;
    },
    createFreshWindow(initialRoute = `/`) {
      return createPrimaryWindow({ show: true, initialRoute });
    },
    showLastActivePrimaryWindow() {
      return getWindowManager().showLastActivePrimaryWindow();
    },
    getContextForWebContents(webContents: any) {
      return getWindowManager().hasRegisteredWebContents(webContents) ? windowContext : null;
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createWindowContextLifecycle };
