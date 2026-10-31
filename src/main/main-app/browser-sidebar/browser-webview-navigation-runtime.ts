type AnyRecord = Record<string, any>;

export function createBrowserWebviewNavigationRuntime(dependencies: AnyRecord) {
  const logger = dependencies.createLogger("browser-sidebar-manager");

  function openRestrictedNavigationRoute(
    windowManager: AnyRecord,
    windowState: AnyRecord,
    threadState: AnyRecord,
    url: string,
    isRestrictedNavigation: (webContentsId: number | undefined, url: string) => boolean,
  ): boolean {
    const routePath = dependencies.routePathForUrl(url);
    if (routePath == null || dependencies.isRouteNavigationDisabled()) return false;
    if (!isRestrictedNavigation(threadState.page?.view.webContents?.id, url)) {
      windowManager.sendMessageToWebContents(windowState.owner, { type: "navigate-to-route", path: routePath });
    }
    return true;
  }

  function clearPendingBrowserUseNavigation(page: AnyRecord | null): void {
    if (page?.pendingNavigationUsage?.source === "browser_use") page.pendingNavigationUsage = null;
  }

  function setPendingBrowserUseNavigation(page: AnyRecord | null, url: string): void {
    if (page == null) return;
    page.pendingNavigationUsage = {
      expectedUrl: dependencies.normalizeUrl(url),
      initiator: "browser_use",
      source: "browser_use",
      urlKind: dependencies.classifyUrl(url),
    };
  }

  function restoreNavigationHistory({ errorReporter, pageState, webContents }: AnyRecord): Promise<boolean> | null {
    const history = pageState.isColdRestore
      ? dependencies.deserializeColdHistory(pageState.serializedPageState)
      : dependencies.deserializeHistory(pageState.serializedPageState);
    const index = history?.currentIndex ?? null;
    if (history == null || index == null || index < 0 || index >= history.entries.length) return null;
    const reportFailure = (error: unknown, message: string): false => {
      logger().warning(message, { safe: { conversationId: pageState.conversationId }, sensitive: { error } });
      errorReporter.reportNonFatal(error instanceof Error ? error : Error(String(error)), {
        kind: "browser-sidebar-restore-navigation-history",
      });
      return false;
    };
    try {
      return webContents.navigationHistory.restore({ entries: history.entries, index })
        .then(() => true)
        .catch((error: unknown) => reportFailure(error, "failed to restore browser sidebar navigation history"));
    } catch (error) {
      return Promise.resolve(reportFailure(error, "failed to start browser sidebar navigation restore"));
    }
  }

  function runInitialNavigation({ navigatePageToUrl, pageState, requiresInitialManagedNavigation, webContents }: AnyRecord): boolean {
    const currentUrl = webContents.getURL();
    return !requiresInitialManagedNavigation && currentUrl.length > 0 &&
      dependencies.normalizeUrl(currentUrl) === dependencies.normalizeUrl(pageState.pendingUrl)
      ? false
      : navigatePageToUrl(
          pageState.pendingUrl,
          pageState.pendingNavigationUsage?.source,
          pageState.pendingNavigationUsage?.initiator,
        );
  }

  function isAdoptableWebContents(value: unknown): boolean {
    return typeof value === "object" && value != null &&
      "destroy" in value && typeof (value as AnyRecord).destroy === "function" &&
      "_createWebViewAdoptionLease" in value && typeof (value as AnyRecord)._createWebViewAdoptionLease === "function";
  }

  function adoptWebContents(
    windowState: AnyRecord,
    webContents: AnyRecord,
    route: AnyRecord,
    initialHistoryNavigation: AnyRecord,
  ): string {
    let adoptionLease: unknown;
    try {
      adoptionLease = webContents._createWebViewAdoptionLease(windowState.owner);
      if (typeof adoptionLease !== "string" || adoptionLease.length === 0) {
        throw Error("Owl browser sidebar webview adoption lease is empty");
      }
    } catch (error) {
      if (!webContents.isDestroyed()) webContents.destroy();
      throw error;
    }
    const webContentsId = webContents.id;
    const stopTracking = () => {
      windowState.pendingAdoptedWebviewsByWebContentsId.delete(webContentsId);
      webContents.removeListener("destroyed", stopTracking);
    };
    windowState.pendingAdoptedWebviewsByWebContentsId.set(webContentsId, {
      adoptionLease,
      webContents,
      route,
      initialHistoryNavigation,
      acceptedHostIdentity: null,
      stopTracking,
    });
    webContents.once("destroyed", stopTracking);
    return adoptionLease;
  }

  return {
    openRestrictedNavigationRoute,
    clearPendingBrowserUseNavigation,
    setPendingBrowserUseNavigation,
    restoreNavigationHistory,
    runInitialNavigation,
    isAdoptableWebContents,
    adoptWebContents,
  };
}
