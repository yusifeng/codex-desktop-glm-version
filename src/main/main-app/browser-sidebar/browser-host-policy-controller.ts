// @ts-nocheck

/** Owns Browser sidebar feature admission, settings-webview state, diagnostics, and persistence policy. */
export function createBrowserHostPolicyControllerClass(dependencies: Record<string, any>) {
  const { DXe, OXe, kXe, mq, VG, Yc, Xc, DZ, hX } = dependencies;

  return class BrowserHostPolicyController {
    host: any;
    constructor(host: any) {
      this.host = host;
    }

    setOnBrowserStateChanged(listener: any) {
      this.host.onBrowserStateChanged = listener;
    }

    cancelSiteBootstraps() {
      this.host.siteBootstrapController.abort();
      this.host.siteBootstrapController = new AbortController();
    }

    async setInAppBrowserFeatureEnabled(enabled: boolean, clearAuthCookies = false) {
      this.host.inAppBrowserFeatureEnabled = false;
      if (!enabled) return;
      const session = this.host.browserSessionService.configure();
      Yc(session, clearAuthCookies);
      await Xc(session).catch((error: any) => {
        this.host.logger().warning(`Failed to clear Sites authentication cookies`, {
          safe: {},
          sensitive: { error },
        });
      });
      this.host.inAppBrowserFeatureEnabled = true;
    }

    getBrowserSession() {
      return this.host.inAppBrowserFeatureEnabled
        ? this.host.browserSessionService.configure()
        : null;
    }

    admitBrowserTab(stage: string) {
      if (this.host.inAppBrowserFeatureEnabled) return true;
      if (!this.host.reportedBrowserAdmissionDenials.has(stage)) {
        this.host.reportedBrowserAdmissionDenials.add(stage);
        this.host.errorReporter.reportNonFatal(Error(DZ), {
          groupingFingerprint: [`in-app-browser-availability-backstop`],
          tags: { stage },
        });
      }
      return false;
    }

    refreshOwnerCommandAccelerators() {
      this.host.ownerCommandAccelerators = mq(this.host.getCommandKeymapState());
    }

    browserSettingsWebviewMounted(owner: any, mountId: any, themeVariant = `light`) {
      const windowState = this.host.ensureCurrentWindowState(owner);
      if (windowState != null) {
        windowState.browserSettingsWebviewMountIds.add(mountId);
        VG(windowState, themeVariant);
      }
    }

    browserSettingsWebviewThemeChanged(owner: any, themeVariant: any) {
      const windowState = this.host.ensureCurrentWindowState(owner);
      if (windowState != null) VG(windowState, themeVariant);
    }

    browserSettingsWebviewUnmounted(owner: any, mountId: any) {
      this.host.getCurrentWindowState(owner)?.browserSettingsWebviewMountIds.delete(mountId);
    }

    getDebugSnapshot() {
      return DXe({
        browserSessionRegistry: this.host.browserSessionRegistry,
        browserUseOpenRequests: this.host.browserUseOpenRequests,
        getPersistedPageMetadata: this.host.browserPageSnapshots.getDebugMetadata.bind(this.host.browserPageSnapshots),
        getThreadStateForWindow: hX,
        windows: this.host.windows.values(),
      });
    }

    getFeedbackDiagnostics() {
      return OXe(this.getDebugSnapshot());
    }

    openDebugTabOwner(options: any) {
      return kXe({
        browserSessionRegistry: this.host.browserSessionRegistry,
        getLiveWindowState: this.host.getLiveWindowState.bind(this.host),
        getThreadStateForWindow: hX,
        options,
        windowManager: this.host.windowManager,
      });
    }

    onMcpToolCallCompleted(sessionId: any, parentCallId: any) {
      const route = this.host.browserSessionRegistry.getBrowserRouteForSession(sessionId);
      if (route == null) return;
      for (const windowState of this.host.windows.values()) {
        if (windowState.window.id !== route.windowId && windowState.tabSourceWindow?.window.id !== route.windowId) continue;
        for (const threadState of windowState.threads.values()) {
          const page = threadState.page;
          if (
            threadState.conversationId === route.conversationId &&
            page?.webMcpParentCallIds?.delete(parentCallId) &&
            page.webMcpParentCallIds.size === 0
          ) {
            page.lastWebMcpToolCall = null;
            this.host.syncThreadState(windowState, route.conversationId, threadState);
          }
        }
      }
    }

    activateBrowserUseNavigationRestriction(route: any) {
      this.host.browserUseNavigationRestriction.activate(route);
    }

    addBrowserUseNavigationBlockedListener(listener: any) {
      this.host.browserUseNavigationBlockedListeners.add(listener);
      return () => this.host.browserUseNavigationBlockedListeners.delete(listener);
    }

    assertBrowserUseNavigationAllowed(pageKey: any, url: any) {
      this.host.browserUseNavigationRestriction.assertAllowed(pageKey, url);
    }

    getBrowserPageRestoreResults(owner: any, persistedPages: any[]) {
      return this.host.browserPersistence.getPageRestoreResults(this.host.getCurrentWindow(owner), persistedPages);
    }

    deletePersistedBrowserConversation(owner: any, conversationId: any) {
      return this.host.browserPersistence.deleteConversation(this.host.getCurrentWindow(owner), conversationId);
    }

    isPrimaryWindowPersistenceOwner(owner: any) {
      return this.host.browserPersistence.isPersistenceOwner(this.host.getCurrentWindow(owner));
    }
  };
}
