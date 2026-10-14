// @ts-nocheck

/** Owns browser sidebar presentation and owner-route synchronization. */
export function createBrowserPresentationSyncControllerClass(dependencies: Record<string, any>) {
  const { hX, sXe, qU, DU, oX, KU } = dependencies;

  return class BrowserPresentationSyncController {
    host: any;

    constructor(host: any) {
      this.host = host;
    }

    syncView(ownerWebContents: any, input: any) {
      const windowState = this.host.getCurrentWindowState(ownerWebContents);
      if (windowState == null) return;
      const threadState = hX(windowState, input.conversationId, input.browserTabId);
      if (threadState == null) return;
      if (
        windowState.activeConversationId === input.conversationId &&
        windowState.activeBrowserTabId === input.browserTabId &&
        ((threadState.presented && !input.presented) || (threadState.visible && !input.visible))
      ) {
        this.host.closeActiveExtensionActionMenu(windowState);
      }
      const changed = sXe(threadState, input);
      if (!threadState.visible || !threadState.presented) {
        this.host.siteAnnotationPermissions.cancel(threadState.page?.view.webContents);
      }
      if (threadState.page?.view.webContents == null) return;
      if (changed) this.host.queuePageDeviceMetricsSync(threadState.page, threadState.emulatedViewportSize);
      this.host.browserPageHostLifecycle.updateThreadSessionState(threadState);
      this.host.syncThreadState(windowState, input.conversationId, threadState, void 0, threadState.snapshot);
      this.host.syncRuntimeStateToPage(threadState.page, threadState);
    }

    sync(ownerWebContents: any, input: any) {
      const windowState = this.host.ensureCurrentWindowState(ownerWebContents);
      if (windowState == null) return;
      this.host.lastSyncedWindowId = windowState.window.id;
      const previousConversationId = windowState.activeConversationId;
      const previousBrowserTabId = windowState.activeBrowserTabId;
      const mountGeneration = input.mountGeneration ?? 0;
      const presented = input.presented ?? (input.visible && input.bounds != null);
      const browserTabId = input.browserTabId;
      const route = { browserTabId, conversationId: input.conversationId };
      const persistence = this.host.browserPersistence.getPagePersistence(windowState.window, input.pagePersistence);
      if (input.transferSourceConversationId != null && input.transferSourceBrowserTabId != null) {
        this.host.transferConversationState(
          windowState,
          input.transferSourceConversationId,
          input.transferSourceBrowserTabId,
          input.conversationId,
          browserTabId,
        );
      }
      const pageKey = qU(route);
      if (this.host.getDetachedWindowStates(windowState.window.id).some((state: any) => state.threads.has(pageKey))) {
        const existing = windowState.threads.get(pageKey);
        if (existing?.hostGeneration != null && existing.page?.view.webContents == null) {
          DU(existing, input.annotationModeEnabled ?? !0);
          this.syncView(ownerWebContents, {
            ...route,
            hostKind: input.hostKind ?? `right-panel`,
            mountGeneration,
            presented,
            visible: input.visible,
            bounds: input.bounds,
            viewportScale: input.viewportScale ?? 1,
          });
        }
        return;
      }
      if (windowState.ignoredConversationIds.delete(pageKey)) return;
      if (
        (presented || windowState.activeConversationId == null) &&
        (previousConversationId !== input.conversationId || previousBrowserTabId !== browserTabId)
      ) {
        this.host.closeActiveExtensionActionMenu(windowState);
      }
      if (
        windowState.activeConversationId === input.conversationId &&
        windowState.activeBrowserTabId === browserTabId &&
        (!presented || !input.visible)
      ) {
        this.host.closeActiveExtensionActionMenu(windowState);
      }
      if (presented || windowState.activeConversationId == null) {
        windowState.activeConversationId = input.conversationId;
        windowState.activeBrowserTabId = browserTabId;
      }
      const existed = windowState.threads.has(pageKey);
      const threadState = this.host.ensureThreadState(windowState, input, browserTabId);
      const wasPresented = threadState.presented;
      const previousMountGeneration = threadState.mountGeneration;
      const previousSnapshot =
        existed && wasPresented && presented && threadState.visible && input.visible && previousMountGeneration === mountGeneration &&
        input.transferSourceConversationId == null && input.transferSourceBrowserTabId == null
          ? threadState.snapshot
          : void 0;
      threadState.presented = presented;
      if (presented && !wasPresented) this.host.tabBudget.markTabSelected(windowState, threadState);
      if (
        !existed ||
        threadState.mountGeneration !== mountGeneration ||
        threadState.presented !== presented ||
        threadState.visible !== input.visible ||
        input.transferSourceConversationId != null
      ) {
        this.host.browserSessionRegistry.recordDebugEvent({
          ...route,
          details: [
            { label: `mountGeneration`, value: String(mountGeneration) },
            { label: `presented`, value: String(presented) },
            { label: `visible`, value: String(input.visible) },
            ...(input.transferSourceConversationId == null
              ? []
              : [{ label: `transferSourceConversationId`, value: input.transferSourceConversationId }]),
          ],
          guestWebContentsId: null,
          kind: `browser-sidebar-sync`,
          message: `Synced Browser sidebar route`,
          ownerWebContentsId: ownerWebContents.id,
          pageKey: null,
          windowId: windowState.window.id,
        });
      }
      if (
        !this.host.browserPersistence.reconcileBrowserStorageId(windowState, threadState, persistence) ||
        (this.host.setThreadAnnotationModeEnabled(ownerWebContents, windowState, threadState, input.annotationModeEnabled ?? !0),
        this.host.browserPersistence.preparePage(windowState, threadState, persistence).kind === `missing`)
      ) {
        return;
      }
      threadState.cwd = input.cwd ?? null;
      threadState.hostKind = input.hostKind ?? null;
      threadState.visible = input.visible;
      threadState.mountGeneration = mountGeneration;
      if (presented && threadState.pendingTeardown?.reason === `suspended`) {
        threadState.pendingTeardown = null;
        if (threadState.page != null) threadState.page.pendingSuspensionId = null;
      }
      threadState.hasPendingBrowserUseVisibilityRequest = !1;
      threadState.isAgentControllingBrowser = input.isAgentControllingBrowser;
      if (!threadState.visible || !threadState.presented || threadState.isAgentControllingBrowser) {
        this.host.siteAnnotationPermissions.cancel(threadState.page?.view.webContents);
      }
      if (!threadState.isAgentControllingBrowser) threadState.isBrowserUseNavigationRestrictionActive = !1;
      threadState.runtimeIntlConfig = input.runtimeIntlConfig;
      const previousThemeVariant = threadState.themeVariant;
      threadState.themeVariant = input.themeVariant ?? threadState.themeVariant;
      threadState.bounds = input.bounds
        ? { x: Math.round(input.bounds.x), y: Math.round(input.bounds.y), width: Math.round(input.bounds.width), height: Math.round(input.bounds.height) }
        : null;
      const viewport = input.emulatedViewportSize ?? null;
      const viewportChanged =
        threadState.emulatedViewportSize?.width !== viewport?.width || threadState.emulatedViewportSize?.height !== viewport?.height;
      threadState.emulatedViewportSize = viewport;
      threadState.viewportScale = input.viewportScale ?? 1;
      this.host.browserPageHostLifecycle.updateThreadSessionState(threadState);
      this.host.syncThreadState(windowState, input.conversationId, threadState, void 0, previousSnapshot);
      const webContents = threadState.page?.view.webContents;
      const attachedHost = webContents == null ? null : this.host.browserPageHostLifecycle.attachedWebviewHosts.get(webContents) ?? null;
      if (
        presented && previousMountGeneration !== mountGeneration && webContents != null && !webContents.isDestroyed() &&
        attachedHost != null && attachedHost.hostGeneration === threadState.hostGeneration &&
        attachedHost.rendererInstanceId === windowState.rendererInstanceId
      ) {
        this.host.windowManager.sendMessageToWebContents(ownerWebContents, {
          type: `browser-sidebar-webview-attached`, browserTabId, conversationId: input.conversationId, mountGeneration,
        });
      }
      if (threadState.page != null) {
        if (presented) threadState.page.pendingSuspensionId = null;
        if (viewportChanged) this.host.queuePageDeviceMetricsSync(threadState.page, threadState.emulatedViewportSize);
        if (previousThemeVariant !== threadState.themeVariant && webContents != null && !webContents.isDestroyed()) {
          this.host.queuePageColorSchemeSync(threadState.page, webContents, threadState.themeVariant);
        }
        this.host.syncRuntimeStateToPage(threadState.page, threadState);
      }
      this.host.permissionPrompts.syncPresentation(threadState);
      this.host.comments[threadState.isAnnotationModeEnabled ? `prepare` : `dismiss`](ownerWebContents, input.conversationId, browserTabId, threadState);
      if (presented && previousConversationId != null && previousBrowserTabId != null && (previousConversationId !== input.conversationId || previousBrowserTabId !== browserTabId)) {
        const previous = hX(windowState, previousConversationId, previousBrowserTabId) ?? null;
        if (previous != null) previous.hasPendingBrowserUseVisibilityRequest = !1;
        this.host.comments.dismiss(ownerWebContents, previousConversationId, previousBrowserTabId, previous);
        this.host.comments.close(ownerWebContents, previousConversationId, previousBrowserTabId);
      }
      if (!threadState.presented || threadState.bounds == null) {
        this.host.comments.dismiss(ownerWebContents, input.conversationId, browserTabId, threadState, !wasPresented || (threadState.presented && threadState.visible));
      }
      this.host.tabBudget.enforceDetachedPageBudget(windowState);
      this.host.resolveBrowserUseOpenRequests(windowState);
    }

    setThreadAnnotationModeEnabled(ownerWebContents: any, windowState: any, threadState: any, enabled: any) {
      if (!DU(threadState, enabled)) return;
      const { browserTabId, conversationId, page } = threadState;
      this.host.comments.dismiss(ownerWebContents, conversationId, browserTabId, threadState);
      this.host.syncThreadState(windowState, conversationId, threadState);
      if (page != null) this.host.syncRuntimeStateToPage(page, threadState);
    }

    syncOwner(ownerWebContents: any, conversationId: any, browserTabId: any, ownerRoutePath: any, annotationModeEnabled = !0, sessionId?: any, presentedBrowserTabIds?: any) {
      const windowState = this.host.ensureCurrentWindowState(ownerWebContents);
      if (windowState == null) return;
      this.host.lastSyncedWindowId = windowState.window.id;
      if (presentedBrowserTabIds != null) this.host.presentedBrowserTabIdsByOwner.set(ownerWebContents, presentedBrowserTabIds);
      const tabId = browserTabId ?? (windowState.activeConversationId === conversationId ? windowState.activeBrowserTabId : null);
      if (windowState.activeConversationId !== conversationId || windowState.activeBrowserTabId !== tabId) this.host.closeActiveExtensionActionMenu(windowState);
      windowState.activeConversationId = conversationId;
      windowState.activeBrowserTabId = tabId;
      this.host.browserSessionRegistry.bindSessionRouteOwner({ browserConversationId: conversationId, owner: ownerWebContents, sessionId: sessionId ?? conversationId });
      const pageWindowState = this.host.getPageWindowState({ conversationId, windowId: oX(windowState.window.id) }, tabId ?? void 0) ?? windowState;
      const threadState = tabId == null ? null : this.host.ensureThreadStateForWindow(pageWindowState, conversationId, tabId);
      if (threadState != null) {
        pageWindowState.ignoredConversationIds.delete(qU(threadState));
        this.host.tabBudget.markTabSelected(pageWindowState, threadState);
      }
      for (const state of windowState.threads.values()) {
        if (state.conversationId === conversationId) {
          state.ownerRoutePath = ownerRoutePath ?? null;
          this.setThreadAnnotationModeEnabled(ownerWebContents, windowState, state, annotationModeEnabled);
        }
      }
      this.host.browserSessionRegistry.recordDebugEvent({
        browserTabId: tabId,
        conversationId,
        details: [{ label: `ownerRoutePath`, value: ownerRoutePath ?? `missing` }],
        guestWebContentsId: threadState?.page?.view.webContents?.id ?? null,
        kind: `browser-owner-synced`,
        message: threadState == null ? `Synced Browser owner before tab mount` : `Synced exact Browser owner`,
        ownerWebContentsId: ownerWebContents.id,
        pageKey: threadState?.page == null ? null : KU(ownerWebContents.id, conversationId, threadState.browserTabId),
        windowId: windowState.window.id,
      });
      if (threadState?.pendingBrowserUsePanelOpen === !0) {
        threadState.pendingBrowserUsePanelOpen = !1;
        this.host.openBrowserPanelWithoutAnimation(windowState, conversationId, threadState.browserTabId);
      }
    }

    isBrowserPresentedForConversation(ownerWebContents: any, conversationId: any) {
      const route = this.host.browserSessionRegistry.getBrowserRouteForSession(conversationId);
      const resolvedConversationId = route?.conversationId ?? conversationId;
      const windowState = this.host.windows.get(ownerWebContents.id);
      if (route != null && route.windowId !== oX(ownerWebContents.id)) return !1;
      if (windowState?.activeConversationId !== resolvedConversationId) return !1;
      const presentedTabs = this.host.presentedBrowserTabIdsByOwner.get(windowState.owner);
      if (presentedTabs != null) return presentedTabs.some((tabId: any) => hX(windowState, resolvedConversationId, tabId)?.pendingTeardown?.reason !== `closed`);
      const tabId = windowState.activeBrowserTabId;
      return tabId != null && hX(windowState, resolvedConversationId, tabId)?.pendingTeardown?.reason !== `closed`;
    }
  };
}
