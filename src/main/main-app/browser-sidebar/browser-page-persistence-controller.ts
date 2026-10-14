// @ts-nocheck

/** Owns persisted browser storage identity, snapshot restore, and webview host registration. */
export function createBrowserPagePersistenceControllerClass(dependencies: Record<string, any>) {
  const { pX, n, PG, qU, it, NX } = dependencies;
  return class BrowserPagePersistenceController {
    browserPageSnapshots;
    browserSessionRegistry;
    windowManager;
    windows;
    lifecycle;
    ownerWindowId = null;

    constructor(browserPageSnapshots, browserSessionRegistry, windowManager, windows, lifecycle) {
      this.browserPageSnapshots = browserPageSnapshots;
      this.browserSessionRegistry = browserSessionRegistry;
      this.windowManager = windowManager;
      this.windows = windows;
      this.lifecycle = lifecycle;
    }

    getPageRestoreResults(windowState, persistedPages) {
      return windowState == null || !this.isInitialPrimaryWindow(windowState)
        ? persistedPages.map(() => ({ status: `owned-by-another-window` }))
        : persistedPages.map((page) => {
            const owners = this.getLiveBrowserStorageOwners(page.browserStorageId);
            if (owners.some(({ windowState: ownerWindow }) => ownerWindow.window.id !== windowState.id))
              return { status: `owned-by-another-window` };
            const existing = owners.find(
              ({ threadState, windowState: ownerWindow }) =>
                ownerWindow.window.id === windowState.id &&
                threadState.browserTabId === page.browserTabId &&
                threadState.conversationId === page.conversationId,
            );
            if (existing != null)
              return {
                browserStorageId: existing.threadState.browserStorageId,
                snapshot: existing.threadState.snapshot,
                status: `already-live`,
              };
            if (owners.length > 0 || !this.browserPageSnapshots.isDurableStorageIdentityOwnedBy(page))
              return { status: `missing` };
            this.browserPageSnapshots.enablePersistence(page);
            const persisted = this.browserPageSnapshots.get(page);
            if (persisted == null) return { status: `missing` };
            const currentIndex = persisted.navigation.currentIndex;
            return {
              snapshot: {
                ...pX(),
                canGoBack: currentIndex > 0,
                canGoForward: currentIndex < persisted.navigation.entries.length - 1,
                committedUrl: persisted.navigation.entries[currentIndex]?.url ?? ``,
                faviconUrl: persisted.faviconUrl,
                isSuspended: !0,
                tabType: n.lu.WEB,
                title: persisted.title,
                url: persisted.url,
              },
              status: `snapshot-ready`,
            };
          });
    }

    deleteConversation(windowState, conversationId) {
      if (!this.isCleanupAllowed(windowState)) return !1;
      const matchingThreads = [];
      for (const candidateWindow of this.windows.values())
        for (const threadState of candidateWindow.threads.values())
          if (threadState.conversationId === conversationId) matchingThreads.push(threadState);
      this.browserPageSnapshots.deleteConversationAndFlush(conversationId, matchingThreads);
      return !0;
    }

    isPersistenceOwner(windowState) {
      return windowState != null && this.isInitialPrimaryWindow(windowState);
    }

    getPagePersistence(windowState, pagePersistence) {
      if (pagePersistence != null) return this.isPersistenceOwner(windowState) ? pagePersistence : void 0;
    }

    hasBrowserStorageOwner(browserStorageId, excludedThread) {
      for (const windowState of this.windows.values()) {
        for (const threadState of windowState.threads.values())
          if (threadState !== excludedThread && threadState.browserStorageId === browserStorageId) return !0;
        for (const host of windowState.registeredWebviewHostsByRoutePartition.values())
          if (
            host.pagePersistence.browserStorageId === browserStorageId &&
            (excludedThread == null ||
              host.browserTabId !== excludedThread.browserTabId ||
              host.conversationId !== excludedThread.conversationId)
          )
            return !0;
      }
      return !1;
    }

    getLiveBrowserStorageOwners(browserStorageId) {
      const owners = [];
      for (const windowState of this.windows.values())
        for (const threadState of windowState.threads.values())
          threadState.browserStorageId === browserStorageId &&
            threadState.page != null &&
            threadState.pendingTeardown?.reason !== `closed` &&
            owners.push({ threadState, windowState });
      return owners;
    }

    reconcileBrowserStorageId(windowState, threadState, pagePersistence) {
      if (pagePersistence == null) return !0;
      if (pagePersistence.browserStorageId === threadState.browserStorageId)
        return pagePersistence.restore !== `required` ||
          !this.hasBrowserStorageOwner(pagePersistence.browserStorageId, threadState);
      if (
        threadState.pendingTeardown != null ||
        threadState.sessionState !== `cold` ||
        threadState.browserStorageId !==
          PG({ browserTabId: threadState.browserTabId, conversationId: threadState.conversationId }) ||
        this.browserPageSnapshots.hasDurableStorageIdentity(threadState.browserStorageId) ||
        windowState.registeredWebviewHostsByRoutePartition.has(
          it(threadState.conversationId, threadState.browserTabId),
        )
      )
        return !1;
      const page = threadState.page;
      return pagePersistence.restore === `required`
        ? page != null ||
            threadState.isBrowserUsePage ||
            this.hasBrowserStorageOwner(pagePersistence.browserStorageId, threadState)
          ? !1
          : ((threadState.browserStorageId = pagePersistence.browserStorageId), !0)
        : (this.browserPageSnapshots.hasDurableStorageIdentity(pagePersistence.browserStorageId) &&
              !this.browserPageSnapshots.isDurableStorageIdentityOwnedBy({
                browserStorageId: pagePersistence.browserStorageId,
                browserTabId: threadState.browserTabId,
                conversationId: threadState.conversationId,
              })) ||
            this.hasBrowserStorageOwner(pagePersistence.browserStorageId, threadState)
          ? !1
          : page == null
            ? !threadState.isBrowserUsePage &&
              ((threadState.browserStorageId = pagePersistence.browserStorageId), !0)
            : !threadState.isBrowserUsePage ||
                threadState.browserUseTabLifetime !== `temporary` ||
                page.browserStorageId !== threadState.browserStorageId ||
                page.view.webContents != null ||
                page.isColdRestore ||
                page.isRestoring ||
                page.isSuspended ||
                page.pendingSuspensionId != null
              ? !1
              : ((threadState.browserStorageId = pagePersistence.browserStorageId),
                (page.browserStorageId = pagePersistence.browserStorageId),
                !0);
    }

    prepareWebviewAttach(windowState, threadState, page, pagePersistence) {
      if (pagePersistence != null) {
        if (pagePersistence.restore === `required` && this.preparePage(windowState, threadState, pagePersistence).kind === `missing`)
          return null;
        this.registerWebviewHost(windowState, threadState, pagePersistence);
      }
      return threadState.page ?? this.lifecycle.materializePageState(windowState, threadState, { kind: `fresh`, page });
    }

    preparePage(windowState, threadState, pagePersistence) {
      if (pagePersistence != null) this.browserPageSnapshots.enablePersistence(threadState);
      const result = materializePersistedPage({
        browserPageSnapshots: this.browserPageSnapshots,
        browserSessionRegistry: this.browserSessionRegistry,
        materializeColdRestoredPage: (snapshot) =>
          this.lifecycle.materializePageState(windowState, threadState, { kind: `cold-restore`, snapshot }),
        pagePersistence,
        threadState,
        windowState,
        recordDebugEvent: NX,
      });
      if (result.kind === `missing`) {
        const route = { browserTabId: threadState.browserTabId, conversationId: threadState.conversationId };
        this.lifecycle.removeClosedPage(windowState, threadState);
        windowState.ignoredConversationIds.add(qU(route));
        this.windowManager.sendMessageToWebContents(windowState.owner, { type: `close-browser-tab`, ...route });
      }
      return result;
    }

    registerWebviewHost(windowState, threadState, pagePersistence) {
      const route = it(threadState.conversationId, threadState.browserTabId);
      if (pagePersistence == null) windowState.registeredWebviewHostsByRoutePartition.delete(route);
      else {
        this.browserPageSnapshots.enablePersistence(threadState);
        windowState.registeredWebviewHostsByRoutePartition.set(route, {
          browserTabId: threadState.browserTabId,
          conversationId: threadState.conversationId,
          pagePersistence,
        });
        if (threadState.page?.isColdRestore === !0)
          NX(this.browserSessionRegistry, windowState, threadState, `browser-restore-host-registered`, `Registered persisted Browser webview host`);
      }
    }

    unregisterWebviewHost(windowState, threadState) {
      const route = it(threadState.conversationId, threadState.browserTabId);
      const host = windowState.registeredWebviewHostsByRoutePartition.get(route) ?? null;
      if (
        host?.pagePersistence.browserStorageId === threadState.browserStorageId &&
        host.browserTabId === threadState.browserTabId &&
        host.conversationId === threadState.conversationId
      )
        windowState.registeredWebviewHostsByRoutePartition.delete(route);
    }

    isCleanupAllowed(windowState) {
      return windowState != null && this.windowManager.getPrimaryWindows().some((candidate) => candidate.id === windowState.id);
    }

    isInitialPrimaryWindow(windowState) {
      this.ownerWindowId ??= this.windowManager.getPrimaryWindows()[0]?.id ?? null;
      return this.ownerWindowId === windowState.id;
    }
  };
}

function materializePersistedPage({
  browserPageSnapshots: snapshots,
  browserSessionRegistry: sessions,
  materializeColdRestoredPage,
  pagePersistence,
  threadState,
  windowState,
  recordDebugEvent,
}) {
  if (pagePersistence?.restore !== `required`) return { kind: `not-requested` };
  const page = threadState.page;
  const webContents = page?.view.webContents;
  if (page?.isColdRestore === !0 || (webContents != null && !webContents.isDestroyed())) return { kind: `ready` };
  recordDebugEvent(sessions, windowState, threadState, `browser-restore-shell-synced`, `Persisted Browser shell synced`);
  const snapshot = snapshots.get(threadState);
  if (snapshot == null) {
    recordDebugEvent(sessions, windowState, threadState, `browser-restore-snapshot-missing`, `Persisted Browser shell had no page snapshot`);
    snapshots.deleteClosedPageAndFlush(threadState);
    return { kind: `missing` };
  }
  recordDebugEvent(sessions, windowState, threadState, `browser-restore-snapshot-found`, `Found persisted Browser page snapshot`, [
    { label: `historyEntryCount`, value: String(snapshot.navigation.entries.length) },
  ]);
  if (page != null) {
    page.dispose();
    threadState.page = null;
  }
  materializeColdRestoredPage(snapshot);
  recordDebugEvent(sessions, windowState, threadState, `browser-restore-page-materialized`, `Materialized persisted Browser page`);
  return { kind: `ready` };
}
