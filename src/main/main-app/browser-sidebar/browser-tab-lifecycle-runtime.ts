type AnyRecord = Record<string, any>;

export type BrowserTabLifecycleRuntimeDependencies = {
  createLogger(name: string): () => {
    info(message: string, fields: { safe: AnyRecord; sensitive: AnyRecord }): void;
  };
  makePageRecordKey(route: { browserTabId: string; conversationId: string }): unknown;
  serializeWindowId(windowId: number): unknown;
  shared: {
    du: unknown;
    gu: { BATCH: unknown };
    lu: { NEW_TAB_PAGE: unknown };
  };
};

export type BrowserTabLifecycleEvent = {
  type: "browser-sidebar-tab-lifecycle";
  action: string;
  conversationId: string;
  threadBrowserTabCount: number;
  appBrowserTabCount: number;
  threadBrowserUseTabCount: number;
  appBrowserUseTabCount: number;
  isBrowserUseTab: boolean;
};

/** Owns Browser sidebar route keys, tab lifecycle accounting, and the cold-tab snapshot contract. */
export function createBrowserTabLifecycleRuntime(
  dependencies: BrowserTabLifecycleRuntimeDependencies,
) {
  const logger = dependencies.createLogger("browser-sidebar-manager");

  function browserRouteKey({ conversationId, windowId }: AnyRecord): string {
    return `${windowId}:${conversationId}`;
  }

  function pageRecordKey({ browserTabId, conversationId }: AnyRecord): unknown {
    return dependencies.makePageRecordKey({ browserTabId, conversationId });
  }

  function buildTabLifecycleEvent({
    action,
    isBrowserUseTab,
    threadState,
    windows,
  }: AnyRecord): BrowserTabLifecycleEvent {
    const browserUseTab = isBrowserUseTab ?? threadState.isBrowserUsePage;
    let appBrowserTabCount = 0;
    let appBrowserUseTabCount = 0;
    let threadBrowserTabCount = 0;
    let threadBrowserUseTabCount = 0;
    for (const windowState of windows.values()) {
      for (const candidate of windowState.threads.values()) {
        appBrowserTabCount += 1;
        if (candidate.conversationId === threadState.conversationId) threadBrowserTabCount += 1;
        if (candidate.isBrowserUsePage) {
          appBrowserUseTabCount += 1;
          if (candidate.conversationId === threadState.conversationId) threadBrowserUseTabCount += 1;
        }
      }
    }
    return {
      type: "browser-sidebar-tab-lifecycle",
      action,
      conversationId: threadState.conversationId,
      threadBrowserTabCount,
      appBrowserTabCount,
      threadBrowserUseTabCount,
      appBrowserUseTabCount,
      isBrowserUseTab: browserUseTab,
    };
  }

  function emitTabLifecycle({ windowManager, windowState, ...input }: AnyRecord): void {
    const event = buildTabLifecycleEvent(input);
    logger().info("IAB_TAB_ANALYTICS browser tab lifecycle", {
      safe: {
        action: event.action,
        appBrowserTabCount: event.appBrowserTabCount,
        appBrowserUseTabCount: event.appBrowserUseTabCount,
        browserTabId: input.threadState.browserTabId,
        conversationId: event.conversationId,
        isBrowserUseTab: event.isBrowserUseTab,
        ownerWebContentsId: windowState.owner.id,
        threadBrowserTabCount: event.threadBrowserTabCount,
        threadBrowserUseTabCount: event.threadBrowserUseTabCount,
      },
      sensitive: {},
    });
    windowManager.sendMessageToWebContents(windowState.owner, event);
  }

  function recordTabOpened(windowManager: AnyRecord, windows: Map<unknown, AnyRecord>, windowState: AnyRecord, threadState: AnyRecord): void {
    emitTabLifecycle({ action: "opened", threadState, windowManager, windows, windowState });
  }

  function registerThreadAndRecordOpened(
    browserSessionRegistry: AnyRecord,
    windowManager: AnyRecord,
    windows: Map<unknown, AnyRecord>,
    windowState: AnyRecord,
    threadState: AnyRecord,
  ): void {
    browserSessionRegistry.registerThread({
      conversationId: threadState.conversationId,
      windowId: dependencies.serializeWindowId(windowState.window.id),
    });
    recordTabOpened(windowManager, windows, windowState, threadState);
  }

  function recordTabClosed(windowManager: AnyRecord, windows: Map<unknown, AnyRecord>, windowState: AnyRecord, threadState: AnyRecord): void {
    emitTabLifecycle({
      action: "closed",
      isBrowserUseTab: threadState.isBrowserUsePage,
      threadState,
      windowManager,
      windows,
      windowState,
    });
  }

  function deleteThreadAndRecordClosed(windowManager: AnyRecord, windows: Map<unknown, AnyRecord>, windowState: AnyRecord, route: AnyRecord): void {
    const key = dependencies.makePageRecordKey({
      browserTabId: route.browserTabId,
      conversationId: route.conversationId,
    });
    windowState.threads.delete(key);
    windowState.ignoredConversationIds.delete(key);
    if (
      windowState.activeConversationId === route.conversationId &&
      windowState.activeBrowserTabId === route.browserTabId
    ) {
      windowState.activeConversationId = null;
      windowState.activeBrowserTabId = null;
    }
    recordTabClosed(windowManager, windows, windowState, route);
  }

  function createDefaultBrowserSnapshot(): AnyRecord {
    return {
      annotationFlow: dependencies.shared.gu.BATCH,
      annotationModeEntrySource: null,
      tabType: dependencies.shared.lu.NEW_TAB_PAGE,
      isSuspended: false,
      title: dependencies.shared.du,
      url: "",
      faviconUrl: null,
      securityState: null,
      isAudible: false,
      isAudioMuted: false,
      isCapturingUserMedia: false,
      isLoading: false,
      isWaitingForResponse: false,
      canGoBack: false,
      canGoForward: false,
      zoomPercent: 100,
      commentModeDisabledReason: null,
      interactionMode: "browse",
      comments: [],
      siteToolsAvailability: { webMcp: "unavailable", annotations: "unavailable" },
      webMcpToolsRevision: 0,
      lastWebMcpToolCall: null,
    };
  }

  return {
    browserRouteKey,
    pageRecordKey,
    buildTabLifecycleEvent,
    emitTabLifecycle,
    recordTabOpened,
    registerThreadAndRecordOpened,
    recordTabClosed,
    deleteThreadAndRecordClosed,
    createDefaultBrowserSnapshot,
  };
}
