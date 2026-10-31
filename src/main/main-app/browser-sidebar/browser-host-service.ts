type BrowserHostServiceDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  ExtensionActionMenus: new (origin: any) => any;
  browserMessageChannel: string;
  browserStorageIdOf(value: unknown): unknown;
  browserTabIdOf(value: unknown): unknown;
  getExtensionActions(getWebContents: () => any): Promise<unknown>;
  subscribeExtensionProfile(session: any, origin: any, input: unknown, usage: any): unknown;
  setExtensionPinned(getWebContents: () => any, input: unknown, usage: any): Promise<unknown>;
  showExtensionActionContextMenu(getWebContents: () => any, origin: any, input: unknown, usage: any, allowHiddenBlankTab: boolean): Promise<unknown>;
  subscribeExtensionActionEvents(getWebContents: () => any, origin: any, callback: any): unknown;
  subscribeFavicon(webContents: any, origin: any, size: number, callback: any): unknown;
  triggerExtensionAction(getWebContents: () => any, origin: any, input: unknown, usage: any): Promise<unknown>;
};

class AnnotationFeaturePreview {
  private active: { options: any; dispose(): void } | null = null;

  constructor(private readonly origin: any, private readonly channel: string) {}

  set(webContents: any, options: any) {
    if (options.preview == null) {
      if (
        this.active?.options.conversationId === options.conversationId &&
        this.active.options.browserTabId === options.browserTabId &&
        this.active.options.siteUrl === options.siteUrl
      ) {
        this.clear();
      }
      return;
    }
    this.clear();
    if (
      webContents == null ||
      webContents.isDestroyed() ||
      this.origin.isDestroyed() ||
      webContents.isLoadingMainFrame() ||
      webContents.getURL() !== options.siteUrl
    ) {
      return;
    }
    const onNavigation = (_event: unknown, _url: string, _httpResponseCode: number, isMainFrame: boolean) => {
      if (isMainFrame) this.clear();
    };
    const clear = () => this.clear();
    webContents.on("did-start-navigation", onNavigation);
    webContents.once("destroyed", clear);
    this.origin.once("destroyed", clear);
    this.origin.once("render-process-gone", clear);
    this.active = {
      options,
      dispose: () => {
        webContents.removeListener("did-start-navigation", onNavigation);
        webContents.removeListener("destroyed", clear);
        this.origin.removeListener("destroyed", clear);
        this.origin.removeListener("render-process-gone", clear);
        if (!webContents.isDestroyed()) {
          webContents.send(this.channel, {
            type: "browser-site-annotation-feature-preview",
            preview: null,
          });
        }
      },
    };
    webContents.send(this.channel, {
      type: "browser-site-annotation-feature-preview",
      preview: options.preview,
    });
  }

  clear() {
    const active = this.active;
    this.active = null;
    active?.dispose();
  }
}

const viewportWaits = new WeakMap<Promise<unknown>, { complete: ((value: boolean) => void) | null }>();

async function waitForViewportSize(webContents: any, size: unknown, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return false;
  try {
    const wait = webContents.waitForViewportSize(size);
    const state = viewportWaits.get(wait) ?? { complete: null };
    if (viewportWaits.has(wait)) {
      state.complete?.(false);
    } else {
      viewportWaits.set(wait, state);
      const settle = (value: boolean) => {
        viewportWaits.delete(wait);
        state.complete?.(value);
      };
      wait.then(() => settle(true), () => settle(false));
    }
    return await new Promise<boolean>((resolve) => {
      const complete = (value: boolean) => {
        state.complete = null;
        signal?.removeEventListener("abort", abort);
        resolve(value);
      };
      const abort = () => complete(false);
      state.complete = complete;
      signal?.addEventListener("abort", abort, { once: true });
    });
  } catch {
    return false;
  }
}

/** Renderer-facing browser host RPC owner and its per-window cleanup boundary. */
export function createBrowserHostServiceClass(dependencies: BrowserHostServiceDependencies) {
  return class BrowserHostService extends dependencies.RpcHandlerBase {
    private readonly viewportWaits = new Map<string, AbortController>();
    private readonly annotationFeaturePreview: AnnotationFeaturePreview;
    private readonly extensionActionMenus: any;

    constructor(
      private readonly messageHandler: any,
      private readonly browserHostManager: any,
      private readonly origin: any,
      private readonly extensionUsage: any,
      private readonly onConversationDeleted: ((conversationId: string) => Promise<void>) | undefined,
      private readonly getPairedCommentOverlayOwner: ((origin: any, conversationId: string, browserTabId: string) => any) | undefined,
      private readonly detachedTabsService: any,
    ) {
      super();
      this.annotationFeaturePreview = new AnnotationFeaturePreview(origin, dependencies.browserMessageChannel);
      this.extensionActionMenus = new dependencies.ExtensionActionMenus(origin);
    }

    get detachedTabs() { return this.detachedTabsService; }
    runPageCommand(input: unknown) { return this.browserHostManager.runPageCommand(this.origin, input, (url: string, disposition: unknown) => this.messageHandler.forwardBrowserNavigationUrl(url, disposition)); }
    subscribePermissionPrompts(input: unknown, callback: unknown) { return this.browserHostManager.permissionPrompts.subscribe(this.origin, input, callback); }
    respondToPermissionPrompt(input: unknown, response: unknown) { return this.browserHostManager.permissionPrompts.respond(this.origin, input, response); }
    openPermissionSystemSettings(input: unknown) { return this.browserHostManager.permissionPrompts.openSystemSettings(this.origin, input); }
    async cancelPendingLocalWorkSessionRoute({ browserConversationId }: any) { const owner = this.messageHandler.getBrowserOwnerWebContentsForOrigin(this.origin); if (owner != null) this.messageHandler.getBrowserSessionRegistry().cancelPendingLocalWorkSessionRoute({ browserConversationId, owner }); }
    async setAnnotationPresentation(input: unknown) { const owner = this.messageHandler.getBrowserOwnerWebContentsForOrigin(this.origin); if (owner != null) this.browserHostManager.setAnnotationPresentation(owner, input); }
    async deleteConversation(input: any) { this.messageHandler.deletePersistedBrowserConversation(this.origin, input); await this.onConversationDeleted?.(input.conversationId); }
    editComment({ browserTabId, conversationId, commentId }: any) { return this.browserHostManager.selectComment(this.origin, conversationId, commentId, browserTabId); }
    deleteComment({ browserTabId, conversationId, commentId }: any) { return this.browserHostManager.deleteComment(this.origin, conversationId, commentId, browserTabId); }
    captureTabThumbnail({ browserTabId, conversationId }: any) { return this.browserHostManager.captureTabThumbnail(this.origin, conversationId, browserTabId); }
    getPageRestoreResults({ pages }: any) { return this.browserHostManager.getBrowserPageRestoreResults(this.origin, pages.map(({ browserStorageId, browserTabId, conversationId }: any) => ({ browserStorageId: dependencies.browserStorageIdOf(browserStorageId), browserTabId: dependencies.browserTabIdOf(browserTabId), conversationId }))); }
    getExtensionActions(input: unknown) { return dependencies.getExtensionActions(() => this.getExtensionWebContents(input)); }
    async subscribeExtensionProfile(input: unknown) { const session = this.browserHostManager.getBrowserSession(); return session == null ? null : dependencies.subscribeExtensionProfile(session, this.origin, input, this.extensionUsage); }
    async getExtensionCounts() { return this.browserHostManager.getBrowserSession()?.extensions.getExtensionCounts() ?? null; }
    getWebMcpInspectorData({ browserTabId, conversationId }: any) { return this.browserHostManager.getWebMcpInspectorData(this.origin, conversationId, browserTabId); }
    async focusCommentOverlay({ browserTabId, conversationId, sessionId }: any) { this.browserHostManager.handleCommentOverlayFocus(this.getPairedCommentOverlayOwner?.(this.origin, conversationId, browserTabId) ?? this.origin, conversationId, browserTabId, sessionId); }
    openSiteInfo({ anchorBounds, browserTabId, conversationId, siteUrl }: any) { return this.browserHostManager.openSiteInfo(this.origin, conversationId, browserTabId, anchorBounds, siteUrl); }
    async cloneTab(input: unknown) { this.browserHostManager.cloneTab(this.origin, input); }
    async prepareLocalWorkSessionRoute({ browserConversationId }: any) { const owner = this.messageHandler.getBrowserOwnerWebContentsForOrigin(this.origin); if (owner != null) this.messageHandler.getBrowserSessionRegistry().prepareLocalWorkSessionRoute({ browserConversationId, owner }); }
    registerWebviewHost({ browserTabId, conversationId, hostGeneration, pagePersistence, rendererInstanceId }: any) { return this.browserHostManager.registerWebviewHost(this.origin, browserTabId, conversationId, hostGeneration, pagePersistence, rendererInstanceId); }
    async syncView(input: unknown) { this.browserHostManager.syncView(this.origin, input); }
    registerWebviewHostSession({ rendererInstanceId }: any) { return this.browserHostManager.registerWebviewHostSession(this.origin, rendererInstanceId); }
    async setAudioMuted({ browserTabId, conversationId, muted }: any) { this.browserHostManager.setAudioMuted(this.origin, conversationId, browserTabId, muted); }
    setExtensionPinned(input: unknown) { return dependencies.setExtensionPinned(() => this.getExtensionWebContents(input), input, this.extensionUsage); }
    setSiteAnnotationFeaturesEnabled(input: unknown) { return this.browserHostManager.setSiteAnnotationFeaturesEnabled(this.origin, input); }
    respondToSiteAnnotationPermission(input: unknown) { return this.browserHostManager.respondToSiteAnnotationPermission(this.origin, input); }
    async setSiteAnnotationFeaturePreview(input: any) { this.annotationFeaturePreview.set(this.browserHostManager.getCurrentPageWebContents(this.origin, input.conversationId, input.browserTabId), input); }
    async setFloatingComposerRevealTracking({ activationHeightPx, browserTabId, conversationId, enabled }: any) { this.browserHostManager.setFloatingComposerRevealTracking(this.origin, conversationId, browserTabId, enabled, activationHeightPx); }
    async showExtensionActionContextMenu(input: any) { const target = this.browserHostManager.getExtensionActionMenuTarget(this.origin, input.conversationId, input.browserTabId); return dependencies.showExtensionActionContextMenu(() => target.webContents, this.origin, input, this.extensionUsage, target.allowHiddenBlankTab); }
    async beginExtensionActionMenu(input: any, callback: unknown) { const target = this.browserHostManager.getExtensionActionMenuTarget(this.origin, input.conversationId, input.browserTabId); return this.extensionActionMenus.begin(target.webContents, input, callback, target.allowHiddenBlankTab); }
    executeExtensionActionMenuCommand(input: unknown) { return this.extensionActionMenus.execute(() => this.getExtensionWebContents(input), input); }
    async closeExtensionActionMenu(input: unknown) { this.extensionActionMenus.close(input); }
    subscribeExtensionActionEvents(input: unknown, callback: unknown) { return dependencies.subscribeExtensionActionEvents(() => this.getExtensionWebContents(input), this.origin, callback); }
    subscribeFavicon(input: any, callback: unknown) { return dependencies.subscribeFavicon(this.browserHostManager.getCurrentPageWebContents(this.origin, input.conversationId, input.browserTabId), this.origin, input.size, callback); }
    triggerExtensionAction(input: unknown) { return dependencies.triggerExtensionAction(() => this.getExtensionWebContents(input), this.origin, input, this.extensionUsage); }
    getExtensionWebContents(input: any) { return this.browserHostManager.getCurrentPageWebContents(this.origin, input.conversationId, input.browserTabId); }
    async waitForViewportSize({ browserTabId, conversationId, requestId, viewportSize }: any) { const webContents = this.browserHostManager.getCurrentPageWebContents(this.origin, conversationId, browserTabId); if (webContents == null || webContents.isDestroyed()) return false; this.viewportWaits.get(requestId)?.abort(); const controller = new AbortController(); this.viewportWaits.set(requestId, controller); const timeout = setTimeout(() => controller.abort(), 1_000); try { return await waitForViewportSize(webContents, viewportSize, controller.signal); } finally { clearTimeout(timeout); if (this.viewportWaits.get(requestId) === controller) this.viewportWaits.delete(requestId); } }
    async cancelViewportWait(requestId: string) { this.viewportWaits.get(requestId)?.abort(); }
    [Symbol.dispose]() { this.annotationFeaturePreview.clear(); this.extensionActionMenus[Symbol.dispose](); for (const wait of this.viewportWaits.values()) wait.abort(); this.viewportWaits.clear(); }
  };
}
