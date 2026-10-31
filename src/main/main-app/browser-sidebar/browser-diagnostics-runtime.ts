type AnyRecord = Record<string, any>;

const FEEDBACK_EVENT_BYTE_LIMIT = 512 * 1024;
const RESTORE_PHASES: Record<string, string> = {
  "browser-restore-history-failed": "failed",
  "browser-restore-history-started": "history-restoring",
  "browser-restore-history-succeeded": "restored",
  "browser-restore-host-registered": "host-registered",
  "browser-restore-page-attached": "page-attached",
  "browser-restore-page-materialized": "page-materialized",
  "browser-restore-shell-synced": "shell-synced",
  "browser-restore-snapshot-found": "snapshot-found",
  "browser-restore-snapshot-missing": "snapshot-missing",
};

export function createBrowserDiagnosticsRuntime(dependencies: {
  makePageKey(ownerId: number, conversationId: string, browserTabId: string): unknown;
  pageUrl(page: AnyRecord): string;
}) {
  function pendingAttaches(windowState: AnyRecord): AnyRecord[] {
    return [
      ...Array.from(windowState.pendingAdoptedWebviewsByWebContentsId as Map<any, any>).map(([webContentsId, pending]) => ({
        browserTabId: pending.route.browserTabId,
        conversationId: pending.route.conversationId,
        hostGeneration: pending.acceptedHostIdentity?.hostGeneration ?? null,
        kind: "adopted",
        webContentsId,
        windowId: windowState.window.id,
      })),
      ...Array.from(windowState.pendingWebviewRoutesByInstanceId.values() as Iterable<any>).map((pending) => ({
        browserTabId: pending.route.browserTabId,
        conversationId: pending.route.conversationId,
        hostGeneration: pending.hostGeneration,
        kind: "instance",
        webContentsId: null,
        windowId: windowState.window.id,
      })),
    ];
  }

  function pendingAttachCount(windowState: AnyRecord, threadState: AnyRecord): number {
    return pendingAttaches(windowState).filter((pending) =>
      pending.browserTabId === threadState.browserTabId &&
      pending.conversationId === threadState.conversationId,
    ).length;
  }

  function restorePhase(events: AnyRecord[], conversationId: string, browserTabId: string): string {
    const event = events.findLast((candidate) =>
      candidate.conversationId === conversationId &&
      candidate.browserTabId === browserTabId &&
      candidate.kind.startsWith("browser-restore-"),
    );
    return event == null ? "idle" : (RESTORE_PHASES[event.kind] ?? "idle");
  }

  function restoreInvariant({ hasPage, hasPersistedPageState, isColdRestore, restorePhase: phase }: AnyRecord): string | null {
    return phase === "snapshot-missing"
      ? "Shell restored, snapshot missing"
      : phase === "failed"
        ? "Browser history restore failed"
        : hasPersistedPageState && !hasPage
          ? "Snapshot found, page not materialized"
          : isColdRestore && !hasPersistedPageState
            ? "Cold page has no persisted snapshot"
            : null;
  }

  function projectOpenRequest(getThreadStateForWindow: Function, request: AnyRecord, windowStates: AnyRecord[]): AnyRecord {
    const windowState = windowStates.find((candidate) => candidate.owner.id === request.ownerWebContentsId) ?? null;
    const threadState = windowState == null || request.conversationId == null || request.browserTabId == null
      ? null
      : getThreadStateForWindow(windowState, request.conversationId, request.browserTabId);
    return {
      ...request,
      activeBrowserTabId: windowState?.activeBrowserTabId ?? null,
      activeConversationId: windowState?.activeConversationId ?? null,
      guestWebContentsId: threadState?.page?.view.webContents?.id ?? null,
      hasPage: threadState == null ? null : threadState.page != null,
      ownerRoutePath: threadState?.ownerRoutePath ?? null,
      pendingAttachCount: windowState == null || threadState == null ? null : pendingAttachCount(windowState, threadState),
      pendingBrowserUsePanelOpen: threadState?.pendingBrowserUsePanelOpen ?? null,
      routeActive: windowState == null || threadState == null ? null : windowState.activeConversationId === threadState.conversationId,
      windowId: windowState?.window.id ?? null,
    };
  }

  function projectTab(events: AnyRecord[], getPersistedPageMetadata: Function, threadState: AnyRecord, windowState: AnyRecord): AnyRecord {
    const page = threadState.page;
    const persisted = getPersistedPageMetadata(threadState);
    const webviewHostRegistered = Array.from(windowState.registeredWebviewHostsByRoutePartition.values() as Iterable<any>).some((host) =>
      host.pagePersistence.browserStorageId === threadState.browserStorageId &&
      host.browserTabId === threadState.browserTabId &&
      host.conversationId === threadState.conversationId,
    );
    const phase = restorePhase(events, threadState.conversationId, threadState.browserTabId);
    return {
      active: windowState.activeConversationId === threadState.conversationId && windowState.activeBrowserTabId === threadState.browserTabId,
      bounds: threadState.bounds,
      browserStorageId: threadState.browserStorageId,
      browserTabId: threadState.browserTabId,
      canOpenOwner: threadState.ownerRoutePath != null,
      conversationId: threadState.conversationId,
      guestWebContentsId: page?.view.webContents?.id ?? null,
      hasPage: page != null,
      hasPersistedPageState: persisted != null,
      hasPendingBrowserUseVisibilityRequest: threadState.hasPendingBrowserUseVisibilityRequest,
      isAgentControllingBrowser: threadState.isAgentControllingBrowser,
      isBrowserUseActive: threadState.isBrowserUseActive,
      isBrowserUsePage: threadState.isBrowserUsePage,
      isLoading: page?.isLoading ?? threadState.snapshot.isLoading,
      isRestoring: page?.isRestoring ?? false,
      isSuspended: page?.isSuspended ?? threadState.snapshot.isSuspended,
      lastLifecycleSequence: threadState.lastLifecycleSequence,
      lastPresentedSequence: threadState.lastPresentedSequence,
      mountGeneration: threadState.mountGeneration,
      ownerRoutePath: threadState.ownerRoutePath,
      ownerWebContentsId: windowState.owner.id,
      pageKey: page == null ? null : dependencies.makePageKey(windowState.owner.id, threadState.conversationId, threadState.browserTabId),
      pendingAttachCount: pendingAttachCount(windowState, threadState),
      pendingBrowserUsePanelOpen: threadState.pendingBrowserUsePanelOpen,
      pendingTeardown: threadState.pendingTeardown,
      pendingUrl: page?.pendingUrl ?? "",
      persistedHistoryEntryCount: persisted?.historyEntryCount ?? null,
      persistedPageStateUpdatedAtMs: persisted?.updatedAtMs ?? null,
      presented: threadState.presented,
      restoreInvariant: restoreInvariant({ hasPage: page != null, hasPersistedPageState: persisted != null, isColdRestore: page?.isColdRestore === true, restorePhase: phase }),
      restorePhase: phase,
      sessionState: threadState.sessionState,
      title: page?.title || threadState.snapshot.title,
      url: page == null ? threadState.snapshot.url : dependencies.pageUrl(page),
      visible: threadState.visible,
      webviewHostRegistered,
      windowId: windowState.window.id,
    };
  }

  function projectWindow(windowState: AnyRecord): AnyRecord {
    return {
      activeBrowserTabId: windowState.activeBrowserTabId,
      activeConversationId: windowState.activeConversationId,
      ignoredConversationCount: windowState.ignoredConversationIds.size,
      ownerWebContentsId: windowState.owner.id,
      pendingAttachCount: windowState.pendingWebviewRoutesByInstanceId.size,
      pendingAdoptedWebviewCount: windowState.pendingAdoptedWebviewsByWebContentsId.size,
      transferredConversationStateCount: windowState.transferredConversationStateKeys.size,
      windowId: windowState.window.id,
    };
  }

  function getDebugSnapshot({ browserSessionRegistry, browserUseOpenRequests, getPersistedPageMetadata, getThreadStateForWindow, windows }: AnyRecord): AnyRecord {
    const windowStates = Array.from(windows) as AnyRecord[];
    const session = browserSessionRegistry.getDebugSnapshot();
    return {
      capturedAtMs: Date.now(),
      events: session.events,
      openRequests: browserUseOpenRequests.getDebugSnapshot().map((request: AnyRecord) => projectOpenRequest(getThreadStateForWindow, request, windowStates)),
      pendingAttaches: windowStates.flatMap(pendingAttaches),
      sessionRoutes: session.sessionRoutes,
      tabs: windowStates.flatMap((windowState) => Array.from(windowState.threads.values() as Iterable<any>).map((threadState) => projectTab(session.events, getPersistedPageMetadata, threadState, windowState))),
      windows: windowStates.map(projectWindow),
    };
  }

  function limitFeedbackDiagnostics(snapshot: AnyRecord): AnyRecord {
    const events: AnyRecord[] = [];
    let includedEventBytes = 2;
    let omittedEventCount = 0;
    for (let index = snapshot.events.length - 1; index >= 0; --index) {
      const event = snapshot.events[index];
      const bytes = Buffer.byteLength(JSON.stringify(event));
      const projectedBytes = includedEventBytes + bytes + (events.length === 0 ? 0 : 1);
      if (projectedBytes > FEEDBACK_EVENT_BYTE_LIMIT) { omittedEventCount += 1; continue; }
      events.push(event);
      includedEventBytes = projectedBytes;
    }
    events.reverse();
    return { ...snapshot, events, feedbackMetadata: {
      eventByteLimit: FEEDBACK_EVENT_BYTE_LIMIT,
      eventsTruncated: omittedEventCount > 0,
      includedEventBytes,
      includedEventCount: events.length,
      omittedEventCount,
    } };
  }

  function openOwner({ browserSessionRegistry, getLiveWindowState, getThreadStateForWindow, options: { browserTabId, conversationId, windowId }, windowManager }: AnyRecord): AnyRecord {
    const windowState = getLiveWindowState(windowId);
    if (windowState == null) return { opened: false, reason: "missing-window" };
    const threadState = getThreadStateForWindow(windowState, conversationId, browserTabId);
    if (threadState == null) return { opened: false, reason: "missing-tab" };
    if (threadState.ownerRoutePath == null) return { opened: false, reason: "missing-owner-route" };
    if (windowState.owner.isDestroyed() || windowState.window.isDestroyed()) return { opened: false, reason: "missing-window" };
    if (windowState.tabSourceWindow == null) {
      windowManager.sendMessageToWebContents(windowState.owner, { type: "browser-sidebar-open-panel-without-animation", browserTabId: threadState.browserTabId, conversationId: threadState.conversationId });
      windowManager.sendMessageToWebContents(windowState.owner, { type: "navigate-to-route", path: threadState.ownerRoutePath });
    }
    windowManager.showWindow(windowState.window, { stealFocus: false });
    browserSessionRegistry.recordDebugEvent({
      browserTabId, conversationId,
      details: [{ label: "ownerRoutePath", value: threadState.ownerRoutePath }],
      guestWebContentsId: threadState.page?.view.webContents?.id ?? null,
      kind: "browser-owner-opened", message: "Opened exact Browser owner route",
      ownerWebContentsId: windowState.owner.id,
      pageKey: threadState.page == null ? null : dependencies.makePageKey(windowState.owner.id, conversationId, browserTabId),
      windowId: windowState.window.id,
    });
    return { opened: true };
  }

  return { getDebugSnapshot, limitFeedbackDiagnostics, openOwner };
}
