type AnyRecord = Record<string, any>;

export type BrowserThreadStateRuntimeDependencies = {
  createDefaultBrowserSnapshot(): AnyRecord;
  createFindState(): AnyRecord;
  makeBrowserStorageId(route: { browserTabId: string; conversationId: string }): string;
  makePageRecordKey(route: { browserTabId: string; conversationId: string }): unknown;
  makePageKey(ownerWebContentsId: number, conversationId: string, browserTabId: string): unknown;
  makePartitionKey(conversationId: string, browserTabId: string): unknown;
  makeTransferKey(sourceKey: unknown, targetKey: unknown): unknown;
  normalizeWindowId(windowId: number): unknown;
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

  function reassignPendingRoutes(windowState: AnyRecord, source: AnyRecord, target: AnyRecord): void {
    const sourcePartition = dependencies.makePartitionKey(source.conversationId, source.browserTabId);
    const registeredHost = windowState.registeredWebviewHostsByRoutePartition.get(sourcePartition);
    if (
      registeredHost?.browserTabId === source.browserTabId &&
      registeredHost.conversationId === source.conversationId
    ) {
      windowState.registeredWebviewHostsByRoutePartition.delete(sourcePartition);
      windowState.registeredWebviewHostsByRoutePartition.set(
        dependencies.makePartitionKey(target.conversationId, target.browserTabId),
        { ...target, pagePersistence: registeredHost.pagePersistence },
      );
    }
    for (const pending of windowState.pendingAdoptedWebviewsByWebContentsId.values()) {
      if (pending.route.browserTabId === source.browserTabId && pending.route.conversationId === source.conversationId) {
        pending.route = target;
      }
    }
    for (const [instanceId, pending] of windowState.pendingWebviewRoutesByInstanceId) {
      if (pending.route.browserTabId === source.browserTabId && pending.route.conversationId === source.conversationId) {
        windowState.pendingWebviewRoutesByInstanceId.set(instanceId, { ...pending, route: target });
      }
    }
  }

  function transferConversationState({
    browserSessionRegistry,
    comments,
    downloadStore,
    disposeThreadState,
    isBrowserUseManagedBrowserTab,
    getThreadStateForWindow: lookupThreadState,
    setBrowserUseActiveForRoute,
    sourceBrowserTabId,
    sourceConversationId,
    syncRuntimeStateToPage,
    syncThreadState,
    targetBrowserTabId,
    targetConversationId,
    windowState,
  }: AnyRecord): void {
    if (sourceConversationId === targetConversationId && sourceBrowserTabId === targetBrowserTabId) return;
    const threadState = lookupThreadState(windowState, sourceConversationId, sourceBrowserTabId) ?? null;
    const targetRoute = { browserTabId: targetBrowserTabId, conversationId: targetConversationId };
    if (threadState == null) {
      windowState.threads.get(dependencies.makePageRecordKey(targetRoute))?.page ??
        reassignPendingRoutes(windowState, { browserTabId: sourceBrowserTabId, conversationId: sourceConversationId }, targetRoute);
      return;
    }
    const originalBrowserTabId = threadState.browserTabId;
    const sourceKey = dependencies.makePageRecordKey(threadState);
    const targetKey = dependencies.makePageRecordKey(targetRoute);
    const transferKey = dependencies.makeTransferKey(sourceKey, targetKey);
    if (windowState.transferredConversationStateKeys.has(transferKey)) {
      browserSessionRegistry.recordDebugEvent({
        browserTabId: threadState.browserTabId,
        conversationId: targetConversationId,
        details: [
          { label: "sourceConversationId", value: sourceConversationId },
          { label: "transferKey", value: transferKey },
        ],
        guestWebContentsId: threadState.page?.view.webContents?.id ?? null,
        kind: "browser-route-transfer-replayed",
        message: "Ignored replayed Browser route transfer",
        ownerWebContentsId: windowState.owner.id,
        pageKey: null,
        windowId: windowState.window.id,
      });
      windowState.ignoredConversationIds.add(sourceKey);
      return;
    }
    const existingTarget = windowState.threads.get(targetKey) ?? null;
    if (existingTarget?.page != null) {
      browserSessionRegistry.recordDebugEvent({
        browserTabId: targetBrowserTabId,
        conversationId: targetConversationId,
        details: [{ label: "sourceConversationId", value: sourceConversationId }],
        guestWebContentsId: existingTarget.page.view.webContents?.id ?? null,
        kind: "browser-route-transfer-target-exists",
        message: "Ignored Browser route transfer because target page exists",
        ownerWebContentsId: windowState.owner.id,
        pageKey: null,
        windowId: windowState.window.id,
      });
      windowState.ignoredConversationIds.add(sourceKey);
      windowState.transferredConversationStateKeys.add(transferKey);
      return;
    }
    const ownerRoutePath = findOwnerRoutePath(windowState, targetConversationId);
    if (existingTarget != null) disposeThreadState(windowState, targetConversationId, existingTarget);
    const wasBrowserUseActive = threadState.isBrowserUseActive;
    const managedBrowserUseTab = isBrowserUseManagedBrowserTab(sourceConversationId, originalBrowserTabId);
    const reassignManagedRoute = managedBrowserUseTab && getBrowserUseTabIds(windowState, sourceConversationId).length <= 1;
    const windowId = dependencies.normalizeWindowId(windowState.window.id);
    if (reassignManagedRoute) {
      browserSessionRegistry.reassignRoute(
        { conversationId: sourceConversationId, windowId },
        { conversationId: targetConversationId, windowId },
        originalBrowserTabId,
        targetBrowserTabId,
      );
    }
    reassignPendingRoutes(
      windowState,
      { browserTabId: originalBrowserTabId, conversationId: sourceConversationId },
      targetRoute,
    );
    windowState.threads.set(targetKey, threadState);
    windowState.threads.delete(sourceKey);
    if (windowState.activeConversationId === sourceConversationId && windowState.activeBrowserTabId === threadState.browserTabId) {
      windowState.activeConversationId = targetConversationId;
      windowState.activeBrowserTabId = targetBrowserTabId;
    }
    threadState.conversationId = targetConversationId;
    threadState.browserTabId = targetBrowserTabId;
    downloadStore.reassignActiveDownloadRoute(
      { browserTabId: originalBrowserTabId, conversationId: sourceConversationId },
      targetRoute,
    );
    if (sourceConversationId !== targetConversationId) threadState.ownerRoutePath = ownerRoutePath;
    if (threadState.page != null) {
      if (!reassignManagedRoute && managedBrowserUseTab) {
        browserSessionRegistry.recordPageClosed({ conversationId: sourceConversationId, browserTabId: originalBrowserTabId, windowId });
        setBrowserUseActiveForRoute({ conversationId: sourceConversationId, windowId }, false, originalBrowserTabId);
      }
      threadState.page.conversationId = targetConversationId;
      threadState.page.browserTabId = targetBrowserTabId;
      if (!reassignManagedRoute && managedBrowserUseTab) {
        browserSessionRegistry.recordPageCreated({ conversationId: targetConversationId, browserTabId: targetBrowserTabId, windowId });
      }
      if (wasBrowserUseActive) {
        threadState.isBrowserUseActive = false;
        setBrowserUseActiveForRoute({ conversationId: targetConversationId, windowId }, true, targetBrowserTabId);
      }
    }
    browserSessionRegistry.registerThread({ conversationId: targetConversationId, windowId });
    comments.transferConversation(windowState.owner, sourceConversationId, originalBrowserTabId, targetConversationId, targetBrowserTabId);
    windowState.ignoredConversationIds.delete(targetKey);
    windowState.ignoredConversationIds.add(sourceKey);
    windowState.transferredConversationStateKeys.delete(dependencies.makeTransferKey(targetKey, sourceKey));
    windowState.transferredConversationStateKeys.add(transferKey);
    browserSessionRegistry.recordDebugEvent({
      browserTabId: targetBrowserTabId,
      conversationId: targetConversationId,
      details: [
        { label: "sourceBrowserTabId", value: originalBrowserTabId },
        { label: "sourceConversationId", value: sourceConversationId },
      ],
      guestWebContentsId: threadState.page?.view.webContents?.id ?? null,
      kind: "browser-route-transferred",
      message: "Transferred Browser route state",
      ownerWebContentsId: windowState.owner.id,
      pageKey: threadState.page == null
        ? null
        : dependencies.makePageKey(windowState.owner.id, targetConversationId, targetBrowserTabId),
      windowId: windowState.window.id,
    });
    syncThreadState(windowState, targetConversationId, threadState);
    if (threadState.page != null) syncRuntimeStateToPage(threadState.page, threadState);
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
    transferConversationState,
  };
}
