// @ts-nocheck

/** Owns Browser sidebar thread snapshots and runtime-page state projection. */
export function createBrowserRuntimeSyncControllerClass(dependencies: Record<string, any>) {
  const { uZe, hX, fq, kZe, tq, KU, EZ, lifecycleHelpersClass } = dependencies;

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
        notifyBrowserNavigationUsage: kZe(
          host.windowManager,
          bind(`getPreferredWindowStateForConversation`),
          bind(`getPageWindowState`),
        ),
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
        uZe(this.getPageLifecycleHelpers(), windowState, conversationId, threadState, pendingUrl, previousSnapshot);
      });
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
