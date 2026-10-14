// @ts-nocheck

/** Owns Browser page object creation for fresh pages and persisted cold restores. */
export function createBrowserPageMaterializationControllerClass(dependencies: Record<string, any>) {
  const { eW, KX, oX, n } = dependencies;

  return class BrowserPageMaterializationController {
    constructor(host: any) {
      this.host = host;
    }

    host: any;

    materializeThreadPageState(windowState: any, threadState: any, request: any): any {
      const page = request.kind === `cold-restore`
        ? createColdRestoredPage(threadState, request.snapshot)
        : createFreshPage(threadState, request.page);
      const conversationId = threadState.conversationId;
      threadState.page = page;

      this.host.browserPageHostLifecycle.updateThreadSessionState(threadState);
      if (this.host.browserPageHostLifecycle.isBrowserUseManagedBrowserTab(conversationId, threadState.browserTabId)) {
        this.host.browserSessionRegistry.recordPageCreated({
          browserTabId: threadState.browserTabId,
          conversationId,
          windowId: oX(windowState.window.id),
        });
      }
      this.host.syncThreadState(windowState, conversationId, threadState);
      this.host.syncRuntimeStateToPage(page, threadState);
      if (threadState.isAnnotationModeEnabled) {
        this.host.comments.prepare(windowState.owner, conversationId, threadState.browserTabId, threadState);
      }
      return page;
    }
  };

  function createFreshPage(threadState: any, initialPage: any): any {
    return {
      ...createPageDefaults(threadState, initialPage.title),
      canGoBack: !1,
      canGoForward: !1,
      faviconUrl: null,
      isColdRestore: !1,
      isSuspended: !1,
      pendingUrl: initialPage.url,
      serializedPageState: eW({ faviconUrl: null, title: initialPage.title, url: initialPage.url }),
      title: initialPage.title,
      url: ``,
    };
  }

  function createColdRestoredPage(threadState: any, snapshot: any): any {
    const currentIndex = snapshot.navigation.currentIndex;
    return {
      ...createPageDefaults(threadState, snapshot.title),
      canGoBack: currentIndex > 0,
      canGoForward: currentIndex < snapshot.navigation.entries.length - 1,
      faviconUrl: snapshot.faviconUrl,
      isColdRestore: !0,
      isSuspended: !0,
      pendingUrl: ``,
      serializedPageState: snapshot,
      title: snapshot.title,
      url: snapshot.url,
    };
  }

  function createPageDefaults(threadState: any, fallbackTitle: string): any {
    return {
      browserStorageId: threadState.browserStorageId,
      browserTabId: threadState.browserTabId,
      conversationId: threadState.conversationId,
      debuggerSync: Promise.resolve(),
      deviceMetricsSyncVersion: 0,
      dispose: () => void 0,
      fallbackTitle,
      initialNavigationSync: Promise.resolve(),
      isAudible: !1,
      isCapturingUserMedia: !1,
      isLoading: !1,
      isWaitingForResponse: !1,
      isMainFrameLoading: !1,
      isAgentInitiatedLoad: !1,
      webMcpTools: [],
      webMcpToolsRevision: 0,
      siteToolsAvailability: { webMcp: `pending-unavailable`, annotations: `pending-unavailable` },
      lastWebMcpToolCall: null,
      isRestoring: !1,
      loadError: null,
      errorPagesByUrl: new Map(),
      mediaIndicator: KX(),
      navigationVersion: 0,
      pendingNavigationUsage: null,
      pendingSuspensionId: null,
      takeIncompleteNavigationObservation: () => null,
      view: { webContents: null },
    };
  }
}
