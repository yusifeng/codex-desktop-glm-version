type AnyRecord = Record<string, any>;

export function createBrowserLifecycleDebugEvents(dependencies: {
  createLogger(name: string): () => { warning(message: string, fields: AnyRecord): void };
  makePageKey(ownerId: number, conversationId: string, browserTabId: string): unknown;
}) {
  const logger = dependencies.createLogger("browser-sidebar-manager");

  function recordMissingPageAttach(
    browserSessionRegistry: AnyRecord,
    windowState: AnyRecord,
    threadState: AnyRecord,
    guestWebContentsId: number,
  ): void {
    browserSessionRegistry.recordDebugEvent({
      browserTabId: threadState.browserTabId,
      conversationId: threadState.conversationId,
      guestWebContentsId,
      kind: "browser-runtime-attach-missing-page",
      message: "Runtime attach had no Browser page",
      ownerWebContentsId: windowState.owner.id,
      pageKey: null,
      windowId: windowState.window.id,
    });
    logger().warning("IAB_LIFECYCLE runtime attach had no page", {
      safe: {
        browserTabId: threadState.browserTabId,
        conversationId: threadState.conversationId,
        guestWebContentsId,
        ownerWebContentsId: windowState.owner.id,
        windowId: windowState.window.id,
      },
      sensitive: {},
    });
  }

  function recordThreadDebugEvent(
    browserSessionRegistry: AnyRecord,
    windowState: AnyRecord,
    threadState: AnyRecord,
    kind: string,
    message: string,
    details: AnyRecord[] = [],
  ): void {
    recordDebugEvent(
      browserSessionRegistry,
      windowState,
      threadState,
      threadState.page?.view.webContents?.id ?? null,
      threadState.page != null,
      kind,
      message,
      details,
    );
  }

  function recordAttachedPageDebugEvent(
    browserSessionRegistry: AnyRecord,
    windowState: AnyRecord,
    threadState: AnyRecord,
    guestWebContentsId: number,
    kind: string,
    message: string,
    details: AnyRecord[] = [],
  ): void {
    recordDebugEvent(
      browserSessionRegistry,
      windowState,
      threadState,
      guestWebContentsId,
      true,
      kind,
      message,
      details,
    );
  }

  function recordDebugEvent(
    browserSessionRegistry: AnyRecord,
    windowState: AnyRecord,
    threadState: AnyRecord,
    guestWebContentsId: number | null,
    hasPage: boolean,
    kind: string,
    message: string,
    details: AnyRecord[],
  ): void {
    browserSessionRegistry.recordDebugEvent({
      browserTabId: threadState.browserTabId,
      conversationId: threadState.conversationId,
      details: [{ label: "browserStorageId", value: threadState.browserStorageId }, ...details],
      guestWebContentsId,
      kind,
      message,
      ownerWebContentsId: windowState.owner.id,
      pageKey: hasPage
        ? dependencies.makePageKey(
            windowState.owner.id,
            threadState.conversationId,
            threadState.browserTabId,
          )
        : null,
      windowId: windowState.window.id,
    });
  }

  return { recordMissingPageAttach, recordThreadDebugEvent, recordAttachedPageDebugEvent };
}
