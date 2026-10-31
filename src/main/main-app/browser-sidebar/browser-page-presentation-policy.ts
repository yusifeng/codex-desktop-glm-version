type AnyRecord = Record<string, any>;

/** Owns page security projection and background-throttling transitions. */
export function createBrowserPagePresentationPolicy(dependencies: AnyRecord) {
  const throttlingByWebContents = new WeakMap<object, boolean>();

  function securityStateForPage(page: AnyRecord): "certificate-error" | null {
    return page.loadError?.errorDescription.startsWith("ERR_CERT_") === true ? "certificate-error" : null;
  }

  function syncBackgroundThrottling(windowState: AnyRecord, threadState: AnyRecord, url?: string): void {
    const page = threadState.page;
    const webContents = page?.view.webContents ?? null;
    if (page == null || webContents == null || webContents.isDestroyed()) return;
    const isBeingCaptured = webContents.isBeingCaptured();
    const shouldThrottle = !dependencies.isFirstPartyUrl(url ?? dependencies.pageUrl(page)) ||
      (!threadState.visible && !threadState.isBrowserUseActive && !isBeingCaptured);
    const previous = throttlingByWebContents.get(webContents);
    throttlingByWebContents.set(webContents, shouldThrottle);
    webContents.setBackgroundThrottling(shouldThrottle);
    if (
      previous === true &&
      !shouldThrottle &&
      !windowState.window.isDestroyed() &&
      windowState.window.isVisible()
    ) {
      windowState.window.showInactive();
    }
  }

  return { securityStateForPage, syncBackgroundThrottling };
}
