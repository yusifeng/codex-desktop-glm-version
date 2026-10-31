// @ts-nocheck

/** Gates external window requests until startup is ready and owns presentation/navigation ordering. */
export function createWindowActivationRuntime(options: Record<string, any>) {
  const {
    createFreshWindow: createWindow,
    dismissNotificationByNavigationPath,
    getPrimaryWindow,
    hideHotkeyWindow,
    isWindows,
    navigateToRoute,
    onAppEntrySource,
    reportNonFatal,
    setImmediate: scheduleImmediate = setImmediate,
    shouldApplyWindowsOpacityWorkaround,
    showPrimaryWindow: showWindow,
    ensureWindow: ensurePrimaryWindow,
  } = options;
  let ready = false;

  const ensureWindow = () => (ready ? ensurePrimaryWindow() : Promise.resolve(null));
  const createFreshWindow = (route = `/`) =>
    ready ? createWindow(route) : Promise.resolve(null);

  const presentWindow = (window: any, activate = true) => {
    if (!activate) {
      window.showInactive();
      return;
    }
    const restoreOpacity = shouldApplyWindowsOpacityWorkaround({
      isWindows,
      isVisible: window.isVisible(),
      isMinimized: window.isMinimized(),
    });
    if (restoreOpacity) window.setOpacity(0);
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
    if (restoreOpacity)
      scheduleImmediate(() => {
        if (!window.isDestroyed()) window.setOpacity(1);
      });
  };

  const openSecondInstance = async (attribution?: Record<string, any>) => {
    if (!ready) return;
    try {
      hideHotkeyWindow();
      const window = getPrimaryWindow() ?? (await createFreshWindow(`/`));
      if (window == null) return;
      presentWindow(window);
      if (attribution != null) onAppEntrySource(attribution, window.webContents);
    } catch (error) {
      reportNonFatal(error instanceof Error ? error : `Failed to open window on second instance`, {
        kind: `second-instance-open-window-failed`,
      });
    }
  };

  const navigate = async (path: string, navigation: Record<string, any>) => {
    if (!ready) return null;
    hideHotkeyWindow();
    const existingWindow = getPrimaryWindow();
    const window = existingWindow ?? (await createFreshWindow(path));
    if (window == null) return null;
    dismissNotificationByNavigationPath(path);
    if (existingWindow != null && navigation.navigateExistingWindow)
      navigateToRoute(window, path);
    presentWindow(window);
    return window;
  };

  return {
    markReady() {
      ready = true;
    },
    isReady() {
      return ready;
    },
    ensureWindow,
    createFreshWindow,
    showPrimaryWindow(window: any) {
      if (ready) showWindow(window);
    },
    presentWindow,
    openSecondInstance,
    navigate,
    async navigateWithAttribution(path: string, navigation: Record<string, any>) {
      const window = await navigate(path, navigation);
      if (window != null)
        onAppEntrySource({ channel: `shortcut`, source: `shortcut` }, window.webContents);
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createWindowActivationRuntime };
