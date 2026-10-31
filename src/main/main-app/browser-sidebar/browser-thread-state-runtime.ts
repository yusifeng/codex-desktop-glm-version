type AnyRecord = Record<string, any>;

export type BrowserThreadStateRuntimeDependencies = {
  createDefaultBrowserSnapshot(): AnyRecord;
  createFindState(): AnyRecord;
  makeBrowserStorageId(route: { browserTabId: string; conversationId: string }): string;
  makePageRecordKey(route: { browserTabId: string; conversationId: string }): unknown;
  pageHandleForThread(windowState: AnyRecord, conversationId: string, page: AnyRecord): unknown;
  registerThreadAndRecordOpened(
    browserSessionRegistry: AnyRecord,
    windowManager: AnyRecord,
    windows: Map<unknown, AnyRecord>,
    windowState: AnyRecord,
    threadState: AnyRecord,
  ): void;
  runtimeIntlConfig: unknown;
};

/** Owns Browser sidebar thread lookup, materialization, cold state, and presentation projection. */
export function createBrowserThreadStateRuntime(
  dependencies: BrowserThreadStateRuntimeDependencies,
) {
  function resolveBrowserTabId(
    windowState: AnyRecord,
    conversationId: string,
    browserTabId?: string | null,
  ): string | null {
    return browserTabId ??
      (windowState.activeConversationId === conversationId
        ? windowState.activeBrowserTabId
        : null);
  }

  function getThreadStateForWindow(
    windowState: AnyRecord,
    conversationId: string,
    browserTabId?: string | null,
  ): AnyRecord | null {
    const resolvedBrowserTabId = resolveBrowserTabId(windowState, conversationId, browserTabId);
    if (resolvedBrowserTabId == null) return null;
    return windowState.threads.get(
      dependencies.makePageRecordKey({ browserTabId: resolvedBrowserTabId, conversationId }),
    ) ?? null;
  }

  function getPageHandleForConversation(
    windowState: AnyRecord,
    conversationId: string | null,
    browserTabId?: string | null,
  ): unknown | null {
    if (conversationId == null) return null;
    const threadState = getThreadStateForWindow(
      windowState,
      conversationId,
      browserTabId ?? undefined,
    );
    if (
      threadState?.pendingTeardown != null ||
      threadState?.page?.view.webContents == null ||
      threadState.page.view.webContents.isDestroyed()
    ) {
      return null;
    }
    return dependencies.pageHandleForThread(windowState, conversationId, threadState.page);
  }

  function hasThreadForConversation(windowState: AnyRecord, conversationId: string): boolean {
    for (const threadState of windowState.threads.values()) {
      if (threadState.conversationId === conversationId) return true;
    }
    return false;
  }

  function findOwnerRoutePath(windowState: AnyRecord, conversationId: string): unknown | null {
    for (const threadState of windowState.threads.values()) {
      if (threadState.conversationId === conversationId && threadState.ownerRoutePath != null) {
        return threadState.ownerRoutePath;
      }
    }
    return null;
  }

  function getBrowserUseTabIds(windowState: AnyRecord, conversationId: string): string[] {
    const browserTabIds: string[] = [];
    for (const threadState of windowState.threads.values()) {
      if (
        threadState.conversationId === conversationId &&
        (threadState.isBrowserUsePage || threadState.isBrowserUseActive)
      ) {
        browserTabIds.push(threadState.browserTabId);
      }
    }
    return browserTabIds;
  }

  function ensureThreadStateForWindow({
    browserSessionRegistry,
    browserTabId,
    conversationId,
    options: { isBrowserUseTab = false } = {},
    tabBudget,
    windowManager,
    windows,
    windowState,
  }: AnyRecord): AnyRecord {
    const key = dependencies.makePageRecordKey({ browserTabId, conversationId });
    const existing = windowState.threads.get(key);
    if (existing != null) return existing;
    const threadState = createThreadState({
      annotationModeEnabled: true,
      browserStorageId: dependencies.makeBrowserStorageId({ browserTabId, conversationId }),
      browserTabId,
      conversationId,
      hostKind: null,
      emulatedViewportSize: null,
      cwd: null,
      isBrowserUsePage: isBrowserUseTab,
      ownerRoutePath: findOwnerRoutePath(windowState, conversationId),
      runtimeIntlConfig: dependencies.runtimeIntlConfig,
    });
    tabBudget.markTabActivity(threadState);
    windowState.threads.set(key, threadState);
    dependencies.registerThreadAndRecordOpened(
      browserSessionRegistry,
      windowManager,
      windows,
      windowState,
      threadState,
    );
    return threadState;
  }

  function createThreadState({
    annotationModeEnabled,
    browserStorageId,
    browserTabId,
    conversationId,
    cwd,
    emulatedViewportSize,
    hostKind,
    isBrowserUsePage,
    ownerRoutePath,
    runtimeIntlConfig,
  }: AnyRecord): AnyRecord {
    return {
      browserStorageId,
      browserTabId,
      conversationId,
      findState: dependencies.createFindState(),
      page: null,
      hostKind,
      pendingBrowserUsePanelOpen: false,
      hasPendingBrowserUseVisibilityRequest: false,
      pendingCommentModeActivation: null,
      visible: false,
      bounds: null,
      presented: false,
      hostGeneration: null,
      mountGeneration: 0,
      pendingTeardown: null,
      sessionState: "cold",
      lastTabActivitySequence: 0,
      lastTabActivityTime: 0,
      lastPresentedSequence: 0,
      lastLifecycleSequence: 0,
      emulatedViewportSize,
      viewportScale: 1,
      cwd,
      isAgentControllingBrowser: false,
      isAnnotationModeEnabled: annotationModeEnabled,
      isBrowserUseActive: false,
      isBrowserUsePage,
      isTabCaptureActive: false,
      browserUseTabLifetime: isBrowserUsePage ? "temporary" : "persistent",
      isBrowserUseNavigationRestrictionActive: false,
      ownerRoutePath,
      commentModeBlockCheckRequestId: 0,
      commentModeBlockCheckUrl: null,
      themeVariant: "light",
      runtimeIntlConfig,
      snapshot: dependencies.createDefaultBrowserSnapshot(),
    };
  }

  function applyThreadPresentation(threadState: AnyRecord, input: AnyRecord): boolean {
    threadState.hostKind = input.hostKind;
    threadState.mountGeneration = input.mountGeneration;
    threadState.presented = input.presented;
    threadState.visible = input.visible;
    threadState.viewportScale = input.viewportScale;
    const emulatedViewportChanged =
      input.emulatedViewportSize !== undefined &&
      (threadState.emulatedViewportSize?.width !== input.emulatedViewportSize?.width ||
        threadState.emulatedViewportSize?.height !== input.emulatedViewportSize?.height);
    if (input.emulatedViewportSize !== undefined) {
      threadState.emulatedViewportSize = input.emulatedViewportSize;
    }
    threadState.bounds = input.bounds == null
      ? null
      : {
          x: Math.round(input.bounds.x),
          y: Math.round(input.bounds.y),
          width: Math.round(input.bounds.width),
          height: Math.round(input.bounds.height),
        };
    return emulatedViewportChanged;
  }

  return {
    resolveBrowserTabId,
    getThreadStateForWindow,
    getPageHandleForConversation,
    hasThreadForConversation,
    findOwnerRoutePath,
    getBrowserUseTabIds,
    ensureThreadStateForWindow,
    createThreadState,
    applyThreadPresentation,
  };
}
