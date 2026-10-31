// @ts-nocheck

/** Owns Browser sidebar thread snapshots and runtime-page state projection. */
export function createBrowserRuntimeSyncControllerClass(dependencies: Record<string, any>) {
  const { hX, fq, tq, KU, EZ, lifecycleHelpersClass } = dependencies;

  return class BrowserRuntimeSyncController {
    host: any;

    constructor(host: any) {
      this.host = host;
      this.lifecycleHelpers = lifecycleHelpersClass == null ? null : new lifecycleHelpersClass(host);
    }

    lifecycleHelpers: any;

    getPageLifecycleHelpers() {
      const host = this.host;
      const helper = this.lifecycleHelpers;
      const bind = (name: string, fallback: any = () => {}) =>
        typeof helper?.[name] === `function`
          ? helper[name].bind(helper)
          : typeof host[name] === `function`
            ? host[name].bind(host)
            : fallback;
      const lifecycleBind = (name: string, fallback: any = () => {}) =>
        typeof helper?.[name] === `function`
          ? helper[name].bind(helper)
          : typeof host.browserPageHostLifecycle?.[name] === `function`
            ? host.browserPageHostLifecycle[name].bind(host.browserPageHostLifecycle)
            : fallback;
      const tabBudgetBind = (name: string, fallback: any = () => {}) =>
        typeof host.tabBudget?.[name] === `function`
          ? host.tabBudget[name].bind(host.tabBudget)
          : fallback;
      return {
        admitBrowserTab: () => host.admitBrowserTab(`window-open`),
        areSiteAnnotationFeaturesEnabled: (url: string) => host.siteAnnotationFeatures.isEnabled(url),
        browserPagePreloadPath: EZ ?? host.browserPagePreloadPath,
        getSiteBootstrapToken: host.getSiteBootstrapToken,
        siteBootstrapSignal: host.siteBootstrapController.signal,
        browserSessionRegistry: host.browserSessionRegistry,
        bindPageToWebview: host.pageWebviewBindingController?.bindPageToWebview?.bind(host.pageWebviewBindingController),
        comments: host.comments,
        dismissCommentEditorForCommittedNavigation: bind(`dismissCommentEditorForCommittedNavigation`),
        enforceDetachedPageBudget: tabBudgetBind(`enforceDetachedPageBudget`),
        errorReporter: host.errorReporter,
        finalizeThreadTeardown: lifecycleBind(`finalizeThreadTeardown`),
        finishPageAttach: bind(`finishPageAttach`),
        findPageForRuntimeSender: bind(`findPageStateForRuntimeSender`),
        getThreadStateForWindow: hX,
        goBack: bind(`goBack`),
        goForward: bind(`goForward`),
        isBrowserUseManagedBrowserTab: lifecycleBind(`isBrowserUseManagedBrowserTab`),
        isDefaultBrowser: host.isDefaultBrowser,
        isRestrictedBrowserNavigation: bind(`isRestrictedBrowserNavigation`),
        loadBrowserErrorPage: bind(`loadBrowserErrorPage`),
        navigatePageToUrl: bind(`navigatePageToUrl`),
        notifyBrowserNavigationUsage: (conversationId: string, browserTabId: string, source: unknown, initiator: unknown, urlKind: unknown) => {
          const preferred = bind(`getPreferredWindowStateForConversation`)(conversationId);
          const pageWindow = preferred == null ? null : bind(`getPageWindowState`)({
            windowId: dependencies.oX(preferred.window.id), conversationId,
          }, browserTabId);
          if (pageWindow == null || pageWindow.owner.isDestroyed()) return;
          host.windowManager.sendMessageToWebContents(pageWindow.owner, {
            type: `browser-sidebar-usage`, conversationId, browserTabId, kind: `navigated`, source, initiator, urlKind,
          });
        },
        onBrowserStateChanged: () => {
          host.onBrowserStateChanged();
          host.iabTabMentions.notifyInvalidated();
        },
        deletePersistedPageState: typeof host.browserPageSnapshots?.deleteAndFlush === `function`
          ? host.browserPageSnapshots.deleteAndFlush.bind(host.browserPageSnapshots) : () => {},
        openBrowserExternalUrl: bind(`openBrowserExternalUrl`),
        openBrowserUrlExternally: bind(`openBrowserUrlExternally`),
        getOwnerCommandAccelerators: (ownerId: number) => host.ownerCommandAccelerators[ownerId] ?? [],
        queuePageDeviceMetricsSync: bind(`queuePageDeviceMetricsSync`),
        reload: (page: any, options: any, ignoreCache: any, windowState: any) =>
          bind(`reload`)(page, options, ignoreCache == null ? undefined : { ignoreCache }, windowState),
        setDesignModifierPressed: bind(`setDesignModifierPressed`),
        setAnnotationPresentation: bind(`setAnnotationPresentation`),
        setInteractionMode: bind(`setInteractionMode`),
        startCommentAtPoint: bind(`startCommentAtPoint`),
        startDesignEditAtPoint: bind(`startDesignEditAtPoint`),
        syncPageZoomPercent: bind(`syncPageZoomPercent`),
        syncRuntimeStateToPage: this.syncRuntimeStateToPage.bind(this),
        syncThreadState: this.syncThreadState.bind(this),
        updateThreadSessionState: lifecycleBind(`updateThreadSessionState`),
        windowManager: host.windowManager,
      };
    }

    syncThreadState(windowState: any, conversationId: string, threadState: any, pendingUrl?: string, previousSnapshot?: any) {
      this.host.iabTabMentions.trackSnapshotUpdate(threadState, () => {
        this.host.refreshCommentModeBlockStatus(windowState, threadState);
        this.projectRuntimeSnapshot(windowState, conversationId, threadState, pendingUrl, previousSnapshot);
      });
    }

    projectRuntimeSnapshot(windowState: any, conversationId: string, threadState: any, pendingUrl?: string, previousSnapshot?: any) {
      if (windowState.owner.isDestroyed() || threadState.pendingTeardown?.reason === `closed`) return;
      const helpers = this.getPageLifecycleHelpers();
      const page = threadState.page;
      const webContents = page?.view.webContents ?? null;
      if (page != null && webContents != null) {
        const isCaptured = webContents.isBeingCaptured();
        if (threadState.isTabCaptureActive !== isCaptured) {
          threadState.isTabCaptureActive = isCaptured;
          helpers.enforceDetachedPageBudget(windowState);
          dependencies.WU(helpers.windowManager, windowState, {
            type: `browser-sidebar-tab-capture-state`, conversationId: page.conversationId,
            browserTabId: page.browserTabId, isActive: isCaptured,
          });
        }
      }
      dependencies.dZ(windowState, threadState, pendingUrl);
      const pageUrl = page == null ? `` : dependencies.QU(page);
      const normalizedPageUrl = dependencies.Ze(pageUrl);
      const normalizedSnapshotUrl = dependencies.Ze(threadState.snapshot.url);
      const restoringEmpty = page != null && page.isRestoring && normalizedSnapshotUrl.length > 0 && normalizedPageUrl.length === 0;
      const restoringTitle = page != null && page.isRestoring && page.isLoading && page.loadError == null && normalizedPageUrl.length > 0 &&
        normalizedSnapshotUrl === normalizedPageUrl && threadState.snapshot.tabType === dependencies.n.lu.WEB &&
        threadState.snapshot.title.length > 0 && threadState.snapshot.title !== page.fallbackTitle;
      const blankNonBrowserUse = page != null && !threadState.isBrowserUsePage && !restoringEmpty && normalizedPageUrl.length === 0;
      let committedUrl = page?.url ?? ``;
      if (page == null || page.loadError != null || (!page.isSuspended && (webContents == null || webContents.navigationHistory.getActiveIndex() < 0))) {
        committedUrl = ``;
      } else if (page.isWaitingForResponse) {
        committedUrl = threadState.snapshot.committedUrl ?? ``;
      }
      const snapshot = page == null ? threadState.snapshot : blankNonBrowserUse
        ? { ...dependencies.pX(), areAnnotationMarkersVisible: threadState.snapshot.areAnnotationMarkersVisible }
        : {
            ...threadState.snapshot, tabType: dependencies.n.lu.WEB, isSuspended: page.isSuspended,
            title: restoringEmpty || restoringTitle ? threadState.snapshot.title : page.title || page.fallbackTitle,
            url: restoringEmpty ? threadState.snapshot.url : pageUrl, committedUrl,
            faviconUrl: restoringEmpty ? threadState.snapshot.faviconUrl : page.faviconUrl,
            securityState: restoringEmpty ? threadState.snapshot.securityState : dependencies.dZe(page),
            isAudioMuted: webContents != null && !webContents.isDestroyed() && webContents.isAudioMuted(),
            isAudible: page.mediaIndicator.state.isAudible,
            isCapturingUserMedia: page.mediaIndicator.state.isCapturingUserMedia,
            isCapturingCamera: page.mediaIndicator.state.isCapturingCamera,
            isCapturingMicrophone: page.mediaIndicator.state.isCapturingMicrophone,
            isLoading: page.isMainFrameLoading, isWaitingForResponse: page.isWaitingForResponse,
            canGoBack: page.canGoBack, canGoForward: page.canGoForward,
            siteAnnotationFeatures: page.siteAnnotationFeatures,
            siteAnnotationFeaturesEnabled: helpers.areSiteAnnotationFeaturesEnabled(committedUrl || page.url),
            siteToolsAvailability: page.siteToolsAvailability, webMcpToolsRevision: page.webMcpToolsRevision,
            lastWebMcpToolCall: page.lastWebMcpToolCall,
          };
      threadState.snapshot = snapshot;
      if (page != null && helpers.isBrowserUseManagedBrowserTab(conversationId, threadState.browserTabId)) {
        const sourceWindow = windowState.tabSourceWindow ?? windowState;
        helpers.browserSessionRegistry.recordPageSnapshot({
          browserTabId: threadState.browserTabId, conversationId,
          guestWebContentsId: page.view.webContents?.id ?? null, isLoading: page.isLoading,
          pageKey: dependencies.KU(sourceWindow.owner.id, conversationId, threadState.browserTabId),
          url: snapshot.url, windowId: dependencies.oX(sourceWindow.window.id),
        });
      }
      dependencies.dq(helpers.windowManager, windowState.owner, conversationId, threadState);
      if (previousSnapshot == null || !dependencies.isEqual(previousSnapshot, snapshot)) {
        dependencies.WU(helpers.windowManager, windowState, {
          type: `browser-sidebar-state`, conversationId, browserTabId: threadState.browserTabId, snapshot,
        });
      }
    }

    syncThreadStateFromOrigin(ownerWebContents: any, conversationId: string, threadState: any) {
      if (threadState.page == null) return;
      const windowState = this.host.getCurrentWindowState(ownerWebContents);
      if (windowState != null) this.syncThreadState(windowState, conversationId, threadState);
    }

    syncRuntimeStateToPage(page: any, threadState: any) {
      const webContents = page?.view?.webContents ?? null;
      if (webContents == null || webContents.isDestroyed()) return;
      const owner = this.host.browserPageHostLifecycle.findPageStateForWebContentsId(webContents.id)?.windowState.owner ?? webContents;
      this.host.comments.syncRuntimeStateToPage(owner, page.conversationId, webContents, threadState);
    }

    syncCommentSnapshot(ownerWebContents: any, conversationId: string, threadState: any) {
      const windowState = this.host.getCurrentWindowState(ownerWebContents);
      if (windowState != null) this.syncThreadState(windowState, conversationId, threadState);
      if (threadState.page != null) this.syncRuntimeStateToPage(threadState.page, threadState);
    }

  };
}
