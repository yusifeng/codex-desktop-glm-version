// @ts-nocheck

/** Keeps browser locale policy, renderer translations, menus, tray, and PiP locale in sync. */
export function installLocaleRefreshLifecycle(options: Record<string, any>) {
  const {
    getBrowserSession,
    getLocale,
    loadLocale,
    refreshApplicationMenu,
    refreshDockMenu,
    refreshPipLocale,
    refreshTrayMenu,
    setBrowserSessionLocale,
    subscribe,
  } = options;
  return subscribe(() => {
    const locale = getLocale();
    const browserSession = getBrowserSession();
    if (browserSession != null) setBrowserSessionLocale(browserSession, locale);
    loadLocale(locale).then(() => {
      refreshApplicationMenu();
      refreshDockMenu();
      refreshTrayMenu();
      refreshPipLocale();
    });
  });
}

if (typeof module !== `undefined`) module.exports = { installLocaleRefreshLifecycle };
