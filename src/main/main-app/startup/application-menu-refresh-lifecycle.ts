// @ts-nocheck

/** Owns application-menu refresh callbacks that are needed before the menu builder exists. */
export function createApplicationMenuRefreshLifecycle(options: Record<string, any>) {
  const { app, registerDispose } = options;
  let refreshApplicationMenu: null | (() => void) = null;
  let observersInstalled = false;

  const requestRefresh = () => {
    refreshApplicationMenu?.();
  };

  return {
    requestRefresh,
    bindRefresh(handler: () => void) {
      refreshApplicationMenu = handler;
    },
    installObservers(observerOptions: Record<string, any>) {
      if (observersInstalled) return;
      observersInstalled = true;

      const {
        setOnBrowserStateChanged,
        setOnInspectorStateChanged,
        syncActiveThreadForFocusedWindow,
      } = observerOptions;
      setOnBrowserStateChanged(() => {
        requestRefresh();
        syncActiveThreadForFocusedWindow();
      });
      app.on(`browser-window-focus`, requestRefresh);
      registerDispose(() => app.off(`browser-window-focus`, requestRefresh));
      setOnInspectorStateChanged(requestRefresh);
    },
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createApplicationMenuRefreshLifecycle };
}
