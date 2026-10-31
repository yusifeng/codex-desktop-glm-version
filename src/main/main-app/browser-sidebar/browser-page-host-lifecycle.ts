import { randomUUID } from "node:crypto";

type AnyRecord = Record<string, any>;

export type BrowserPageHostLifecycleOptions = {
  browserPageSnapshots: AnyRecord;
  browserPersistence: AnyRecord;
  browserSessionRegistry: AnyRecord;
  ensureThreadStateForWindow(windowState: AnyRecord, conversationId: string, browserTabId: string): AnyRecord;
  findThreadState(windowState: AnyRecord, conversationId: string, browserTabId: string): AnyRecord | null;
  getPageLifecycleHelpers(): AnyRecord;
  iabTabMentions: AnyRecord;
  bindPageToWebview(
    helpers: AnyRecord,
    windowState: AnyRecord,
    page: AnyRecord,
    webContents: AnyRecord,
    themeVariant: unknown,
    initialNavigationOwner: unknown,
  ): void;
  logger: { info(event: string, fields: AnyRecord): void; warning(event: string, fields: AnyRecord): void };
  normalizeWindowId(windowId: number): unknown;
  pageKey(ownerId: number, conversationId: string, browserTabId: string): unknown;
  recordMissingPageAttach(registry: AnyRecord, windowState: AnyRecord, route: AnyRecord, guestId: number): void;
  removeClosedThread(windowManager: AnyRecord, windows: Map<unknown, AnyRecord>, windowState: AnyRecord, threadState: AnyRecord): void;
  reportIncompleteNavigation(input: AnyRecord): void;
  routeKey(route: AnyRecord): unknown;
  applyAnnotationMode(threadState: AnyRecord, enabled: boolean): void;
  sendWindowMessage(windowManager: AnyRecord, windowState: AnyRecord, message: AnyRecord): void;
  syncThreadState(windowState: AnyRecord, conversationId: string, threadState: AnyRecord): void;
  tabBudget: AnyRecord;
  transferLogger: { error(event: string, fields: AnyRecord): void };
  windowManager: AnyRecord;
  windows: Map<unknown, AnyRecord>;
};

/** Owns Browser sidebar renderer sessions, webview hosts, suspension, and teardown. */
export class BrowserPageHostLifecycle {
  private readonly options: BrowserPageHostLifecycleOptions;
  private readonly attachedWebviewHosts = new WeakMap<object, AnyRecord>();
  private lifecycleSequence = 0;

  constructor(options: BrowserPageHostLifecycleOptions) {
    this.options = options;
  }

  async transferToWindow(source: AnyRecord, target: AnyRecord, request: AnyRecord): Promise<unknown> {
    const key = this.options.routeKey(request.content);
    const threadState = source.threads.get(key);
    const page = threadState?.page;
    const webContents = page?.view.webContents;
    const targetPlaceholder = target.threads.get(key);
    const isRootSource = source.tabSourceWindow == null;
    if (webContents?.isDestroyed()) return `closed`;
    if (
      request.signal.aborted || webContents == null || threadState == null || page == null ||
      targetPlaceholder?.hostGeneration == null || targetPlaceholder.page?.view.webContents != null ||
      target.rendererInstanceId == null || target.pendingWindowTransfer != null || threadState.pendingTeardown != null ||
      (isRootSource && (threadState.pendingWindowTransfer === true || threadState.snapshot.interactionMode !== `browse` ||
        threadState.pendingCommentModeActivation != null || threadState.snapshot.annotationEditorMode === `design` ||
        threadState.snapshot.isTweaksEditorOpen === true))
    ) return `not-moved`;

    const transfer = webContents.createWebViewTransfer(target.owner);
    if (isRootSource) threadState.pendingWindowTransfer = true;
    target.pendingWindowTransfer = { token: transfer.token, webContents };
    const cancel = () => transfer.cancel();
    request.signal.addEventListener(`abort`, cancel, { once: true });
    request.receiver.attach({ kind: `browser`, data: { token: transfer.token } }).catch(cancel);
    let moved = false;
    try {
      const result = await transfer.finished;
      if (result !== `moved`) return result;
      moved = true;
      const helpers = this.options.getPageLifecycleHelpers();
      helpers.comments.dismiss(source.owner, threadState.conversationId, threadState.browserTabId, threadState);
      page.dispose();
      targetPlaceholder.page?.dispose();
      source.threads.delete(key);
      source.ignoredConversationIds.add(key);
      this.options.browserPersistence.unregisterWebviewHost(source, threadState);
      target.threads.set(key, threadState);
      target.ignoredConversationIds.delete(key);
      target.tabSourceWindow = source.tabSourceWindow === target ? undefined : source;
      this.options.applyAnnotationMode(threadState, targetPlaceholder.isAnnotationModeEnabled);
      target.activeConversationId = threadState.conversationId;
      target.activeBrowserTabId = threadState.browserTabId;
      if (source.activeConversationId === threadState.conversationId && source.activeBrowserTabId === threadState.browserTabId) {
        source.activeConversationId = null;
        source.activeBrowserTabId = null;
      }
      threadState.hostGeneration = targetPlaceholder.hostGeneration;
      threadState.mountGeneration = targetPlaceholder.mountGeneration;
      threadState.hostKind = targetPlaceholder.hostKind;
      threadState.bounds = targetPlaceholder.bounds;
      threadState.viewportScale = targetPlaceholder.viewportScale;
      threadState.visible = targetPlaceholder.visible;
      threadState.presented = targetPlaceholder.presented;
      threadState.isAgentControllingBrowser = threadState.isBrowserUseActive;
      threadState.pendingTeardown = null;
      if (!webContents.isDestroyed() && !target.window.isDestroyed()) {
        this.attachedWebviewHosts.set(webContents, {
          route: { conversationId: threadState.conversationId, browserTabId: threadState.browserTabId },
          hostGeneration: targetPlaceholder.hostGeneration,
          rendererInstanceId: target.rendererInstanceId,
          initialNavigationOwner: `transfer`,
        });
        helpers.bindPageToWebview(target, page, webContents, threadState.themeVariant, `transfer`);
        helpers.syncRuntimeStateToPage(page, threadState);
        this.options.syncThreadState(target, threadState.conversationId, threadState);
        this.options.sendWindowMessage(this.options.windowManager, target, {
          type: `browser-sidebar-browser-use-state`, conversationId: threadState.conversationId,
          browserTabId: threadState.browserTabId, isActive: threadState.isBrowserUseActive,
        });
      }
      return `moved`;
    } catch (error) {
      if (!moved) throw error;
      this.options.transferLogger.error(`Failed to bind transferred Browser page`, { safe: {}, sensitive: { error } });
      page.view.webContents = webContents;
      const owner = target.threads.get(key) === threadState ? target : source;
      this.requestThreadTeardown(owner, threadState.conversationId, threadState, `closed`);
      if (threadState.pendingTeardown != null) this.finalizeThreadTeardown(owner, threadState.conversationId, threadState, threadState.pendingTeardown.teardownId);
      return `closed`;
    } finally {
      if (isRootSource) delete threadState.pendingWindowTransfer;
      request.signal.removeEventListener(`abort`, cancel);
      delete target.pendingWindowTransfer;
    }
  }

  registerRendererSession(windowState: AnyRecord, rendererInstanceId: string): boolean {
    if (windowState.rendererInstanceId === rendererInstanceId) return true;
    if (windowState.rendererInstanceId != null) this.cancelPendingWebviewAttaches(windowState);
    windowState.rendererInstanceId = rendererInstanceId;
    for (const threadState of windowState.threads.values()) threadState.hostGeneration = null;
    return true;
  }

  registerHost(
    windowState: AnyRecord,
    conversationId: string,
    browserTabId: string,
    hostGeneration: number,
    persistenceKey: unknown,
    rendererInstanceId: string,
  ): boolean {
    if (windowState.rendererInstanceId !== rendererInstanceId) return false;
    const persistence = this.options.browserPersistence.getPagePersistence(
      windowState.window,
      persistenceKey,
    );
    const threadState =
      this.options.findThreadState(windowState, conversationId, browserTabId) ??
      this.options.ensureThreadStateForWindow(windowState, conversationId, browserTabId);
    if (
      (threadState.hostGeneration != null && threadState.hostGeneration > hostGeneration) ||
      !this.options.browserPersistence.reconcileBrowserStorageId(
        windowState,
        threadState,
        persistence,
      ) ||
      this.options.browserPersistence.preparePage(windowState, threadState, persistence).kind ===
        "missing"
    ) {
      return false;
    }
    threadState.hostGeneration = hostGeneration;
    this.options.browserPersistence.registerWebviewHost(windowState, threadState, persistence);
    return true;
  }

  attachWebview(windowState: AnyRecord, webContents: AnyRecord, host: AnyRecord): void {
    const { hostGeneration, rendererInstanceId, route } = host;
    const threadState = windowState.threads.get(this.options.routeKey(route)) ?? null;
    if (threadState?.page == null) {
      this.options.recordMissingPageAttach(
        this.options.browserSessionRegistry,
        windowState,
        route,
        webContents.id,
      );
      if (!webContents.isDestroyed()) webContents.close();
      return;
    }
    if (
      windowState.rendererInstanceId !== rendererInstanceId ||
      threadState.hostGeneration !== hostGeneration
    ) {
      this.options.browserSessionRegistry.recordDebugEvent({
        browserTabId: route.browserTabId,
        conversationId: route.conversationId,
        details: [
          { label: "hostGeneration", value: String(hostGeneration) },
          { label: "threadHostGeneration", value: String(threadState.hostGeneration) },
        ],
        guestWebContentsId: webContents.id,
        kind: "browser-runtime-attach-stale",
        message: "Rejected stale Browser sidebar attach",
        ownerWebContentsId: windowState.owner.id,
        pageKey: null,
        windowId: windowState.window.id,
      });
      this.options.logger.warning("IAB_LIFECYCLE rejected stale browser sidebar attach", {
        safe: {
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          guestWebContentsId: webContents.id,
          hostGeneration,
          ownerWebContentsId: windowState.owner.id,
          threadHostGeneration: threadState.hostGeneration,
          windowId: windowState.window.id,
        },
        sensitive: {},
      });
      if (!webContents.isDestroyed()) webContents.close();
      return;
    }
    const existing = this.findPageStateForWebContentsId(webContents.id);
    if (
      existing != null &&
      (existing.conversationId !== route.conversationId ||
        existing.threadState.browserTabId !== route.browserTabId)
    ) {
      this.options.browserSessionRegistry.recordDebugEvent({
        browserTabId: route.browserTabId,
        conversationId: route.conversationId,
        details: [
          { label: "previousBrowserTabId", value: existing.threadState.browserTabId },
          { label: "previousConversationId", value: existing.conversationId },
        ],
        guestWebContentsId: webContents.id,
        kind: "browser-runtime-attach-route-rebind-rejected",
        message: "Rejected Browser sidebar route rebind",
        ownerWebContentsId: windowState.owner.id,
        pageKey: null,
        windowId: windowState.window.id,
      });
      this.options.logger.warning("IAB_LIFECYCLE rejected browser sidebar route rebind", {
        safe: {
          browserTabId: route.browserTabId,
          conversationId: route.conversationId,
          guestWebContentsId: webContents.id,
          ownerWebContentsId: windowState.owner.id,
          previousBrowserTabId: existing.threadState.browserTabId,
          previousConversationId: existing.conversationId,
          windowId: windowState.window.id,
        },
        sensitive: {},
      });
      if (!webContents.isDestroyed()) webContents.close();
      return;
    }
    this.options.browserSessionRegistry.recordDebugEvent({
      browserTabId: route.browserTabId,
      conversationId: route.conversationId,
      guestWebContentsId: webContents.id,
      kind: "browser-runtime-attached",
      message: "Runtime attached Browser sidebar webview",
      ownerWebContentsId: windowState.owner.id,
      pageKey: this.options.pageKey(
        windowState.owner.id,
        route.conversationId,
        route.browserTabId,
      ),
      windowId: windowState.window.id,
    });
    this.options.logger.info("IAB_LIFECYCLE runtime attached browser sidebar webview", {
      safe: {
        browserTabId: route.browserTabId,
        conversationId: route.conversationId,
        guestWebContentsId: webContents.id,
        ownerWebContentsId: windowState.owner.id,
        windowId: windowState.window.id,
      },
      sensitive: {},
    });
    const previousWebContents = threadState.page.view.webContents;
    this.attachedWebviewHosts.set(webContents, host);
    this.options.bindPageToWebview(
      this.options.getPageLifecycleHelpers(),
      windowState,
      threadState.page,
      webContents,
      threadState.themeVariant,
      host.initialNavigationOwner,
    );
    if (
      previousWebContents != null &&
      previousWebContents !== webContents &&
      !previousWebContents.isDestroyed()
    ) {
      previousWebContents.close();
    }
  }

  updateThreadSessionState(threadState: AnyRecord): void {
    const sequence = this.lifecycleSequence + 1;
    this.lifecycleSequence = sequence;
    threadState.lastLifecycleSequence = sequence;
    if (threadState.presented) threadState.lastPresentedSequence = sequence;
    if (threadState.page == null) {
      threadState.sessionState = threadState.snapshot.isSuspended ? "suspended" : "cold";
    } else if (threadState.pendingTeardown != null) {
      return;
    } else {
      threadState.sessionState = threadState.page.isSuspended
        ? "suspended"
        : threadState.page.view.webContents == null ||
            threadState.page.view.webContents.isDestroyed()
          ? "cold"
          : threadState.presented
            ? "live-attached"
            : "live-detached";
    }
  }

  suspendDetachedThread(windowState: AnyRecord, threadState: AnyRecord): void {
    if (
      threadState.presented ||
      this.options.tabBudget.isTabProtectedFromSuspension(windowState, threadState) ||
      threadState.page == null ||
      threadState.page.isSuspended
    ) {
      return;
    }
    if (this.suspendPage(threadState, randomUUID()) && threadState.page.pendingSuspensionId != null) {
      if (this.options.tabBudget.isTabProtectedFromSuspension(windowState, threadState)) {
        threadState.page.pendingSuspensionId = null;
        this.options.tabBudget.enforceDetachedPageBudget(windowState);
        return;
      }
      this.requestThreadTeardown(
        windowState,
        threadState.conversationId,
        threadState,
        "suspended",
      );
    }
  }

  suspendPage(threadState: AnyRecord, suspensionId: string): boolean {
    const page = threadState.page;
    const webContents = page?.view.webContents;
    if (
      page == null ||
      webContents == null ||
      webContents.isDestroyed() ||
      threadState.isBrowserUseActive
    ) {
      return false;
    }
    this.options.browserPageSnapshots.persistCurrentAndFlush(page);
    page.pendingSuspensionId = suspensionId;
    return true;
  }

  requestThreadTeardown(
    windowState: AnyRecord,
    conversationId: string,
    threadState: AnyRecord,
    reason: "closed" | "suspended",
  ): void {
    if (threadState.pendingTeardown?.reason === reason) return;
    const page = threadState.page;
    if (reason === "closed") {
      if (page != null) this.reportIncompleteNavigationOnClose(page, "tab-closed");
      this.options.browserPageSnapshots.deleteClosedPageAndFlush(threadState);
    }
    this.cancelPendingWebviewAttaches(windowState, threadState);
    if (page == null && reason === "suspended") return;
    const teardownId = randomUUID();
    threadState.pendingTeardown = {
      mountGeneration: threadState.mountGeneration,
      reason,
      teardownId,
    };
    this.options.iabTabMentions.notifyInvalidated();
    if (
      page == null &&
      this.isBrowserUseManagedBrowserTab(conversationId, threadState.browserTabId)
    ) {
      this.options.browserSessionRegistry.recordPageClosed({
        conversationId,
        browserTabId: threadState.browserTabId,
        windowId: this.options.normalizeWindowId(
          (windowState.tabSourceWindow ?? windowState).window.id,
        ),
      });
    }
    this.options.windowManager.sendMessageToWebContents(windowState.owner, {
      type: "browser-sidebar-destroy-webview",
      browserTabId: threadState.browserTabId,
      conversationId,
      mountGeneration: threadState.mountGeneration,
      reason,
      teardownId,
    });
  }

  finalizeThreadTeardown(
    windowState: AnyRecord,
    conversationId: string,
    threadState: AnyRecord,
    teardownId: string,
  ): void {
    const pending = threadState.pendingTeardown;
    if (pending?.teardownId !== teardownId) return;
    const reason = pending.reason;
    if (
      reason === "suspended" &&
      (threadState.presented ||
        this.options.tabBudget.isTabProtectedFromSuspension(windowState, threadState) ||
        pending.mountGeneration !== threadState.mountGeneration)
    ) {
      threadState.pendingTeardown = null;
      if (threadState.page != null) threadState.page.pendingSuspensionId = null;
      this.updateThreadSessionState(threadState);
      this.options.syncThreadState(windowState, conversationId, threadState);
      this.options.tabBudget.enforceDetachedPageBudget(windowState);
      return;
    }
    const page = threadState.page;
    const webContents = page?.view.webContents ?? null;
    if (page != null) {
      page.pendingSuspensionId = null;
      page.isRestoring = false;
      page.isSuspended = reason === "suspended";
      this.disposePage(page);
      if (this.isBrowserUseManagedBrowserTab(conversationId, threadState.browserTabId)) {
        const windowId = this.options.normalizeWindowId(
          (windowState.tabSourceWindow ?? windowState).window.id,
        );
        if (reason === "closed") {
          this.options.browserSessionRegistry.recordPageClosed({
            conversationId,
            browserTabId: threadState.browserTabId,
            windowId,
          });
        } else if (webContents != null) {
          this.options.browserSessionRegistry.recordPageTornDown({
            conversationId,
            browserTabId: threadState.browserTabId,
            guestWebContentsId: webContents.id,
            windowId,
          });
        }
      }
    }
    threadState.pendingTeardown = null;
    if (reason === "closed") {
      this.removeClosedThreadState(windowState, threadState);
      this.options.tabBudget.enforceDetachedPageBudget(windowState);
      return;
    }
    this.updateThreadSessionState(threadState);
    this.options.syncThreadState(windowState, conversationId, threadState);
    this.options.tabBudget.recordTabSuspended(windowState, threadState);
    this.options.tabBudget.enforceDetachedPageBudget(windowState);
  }

  disposePage(page: AnyRecord): void {
    const webContents = page.view.webContents;
    page.dispose();
    page.dispose = () => undefined;
    if (webContents != null && !webContents.isDestroyed()) webContents.close();
  }

  removeClosedThreadState(windowState: AnyRecord, threadState: AnyRecord): void {
    this.options.browserPersistence.unregisterWebviewHost(windowState, threadState);
    this.options.removeClosedThread(
      this.options.windowManager,
      this.options.windows,
      windowState,
      threadState,
    );
  }

  findThreadStateForPendingTeardown(windowState: AnyRecord, teardownId: string): AnyRecord | null {
    for (const threadState of windowState.threads.values()) {
      if (threadState.pendingTeardown?.teardownId === teardownId) return threadState;
    }
    return null;
  }

  findPageStateForWebContentsId(webContentsId: number): AnyRecord | null {
    for (const windowState of this.options.windows.values()) {
      for (const threadState of windowState.threads.values()) {
        const page = threadState.page;
        if (page?.view.webContents?.id === webContentsId) {
          return {
            conversationId: threadState.conversationId,
            page,
            threadState,
            windowState,
          };
        }
      }
    }
    return null;
  }

  isBrowserUseManagedBrowserTab(conversationId: string, browserTabId: string): boolean {
    for (const windowState of this.options.windows.values()) {
      if (
        (this.options.findThreadState(windowState, conversationId, browserTabId) ?? null)
          ?.isBrowserUsePage === true
      ) {
        return true;
      }
    }
    return false;
  }

  cancelPendingWebviewAttaches(windowState: AnyRecord, threadState?: AnyRecord): void {
    for (const pending of windowState.pendingAdoptedWebviewsByWebContentsId.values()) {
      if (
        threadState == null ||
        (pending.route.browserTabId === threadState.browserTabId &&
          pending.route.conversationId === threadState.conversationId)
      ) {
        pending.stopTracking();
        if (!pending.webContents.isDestroyed()) pending.webContents.destroy();
      }
    }
    for (const [instanceId, pending] of windowState.pendingWebviewRoutesByInstanceId) {
      if (
        threadState == null ||
        (pending.route.browserTabId === threadState.browserTabId &&
          pending.route.conversationId === threadState.conversationId)
      ) {
        windowState.pendingWebviewRoutesByInstanceId.delete(instanceId);
      }
    }
  }

  reportIncompleteNavigationOnClose(page: AnyRecord, trigger: string): void {
    const observation = page.takeIncompleteNavigationObservation(5_000);
    if (observation != null) this.options.reportIncompleteNavigation({ observation, trigger });
  }
}

if (typeof module !== "undefined") {
  module.exports = { BrowserPageHostLifecycle };
}
