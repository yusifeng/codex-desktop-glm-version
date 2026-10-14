// @ts-nocheck

/** Owns browser command context lookup and navigation state transitions. */
export function createBrowserNavigationContextControllerClass(dependencies: Record<string, any>) {
  const { hX, QU, sW } = dependencies;

  return class BrowserNavigationContextController {
    constructor(host: any) { this.host = host; }
    host: any;

    getPageState(owner: any, conversationId: string, browserTabId?: string) {
      const windowState = this.host.getCurrentWindowState(owner);
      return windowState == null ? null : hX(windowState, conversationId, browserTabId)?.page ?? null;
    }

    getCurrentPageCommandContext(owner: any, conversationId: string, browserTabId?: string) {
      const windowState = this.host.getCurrentWindowState(owner);
      if (windowState == null) return null;
      const threadState = hX(windowState, conversationId, browserTabId);
      const page = threadState?.page ?? null;
      return threadState == null || page == null ? null : { page, threadState, windowState };
    }

    ensureThreadCommandContext(owner: any, conversationId: string, browserTabId?: string) {
      const windowState = this.host.ensureCurrentWindowState(owner);
      if (windowState == null) return null;
      const threadState = this.host.ensureThreadStateForWindow(windowState, conversationId, browserTabId);
      return threadState == null ? null : { page: threadState.page, threadState, windowState };
    }

    ensureThreadPageForCommand(owner: any, conversationId: string, browserTabId: string, initialPage: any, persistence?: any) {
      const context = this.ensureThreadCommandContext(owner, conversationId, browserTabId);
      if (context == null) return null;
      if (context.threadState.page != null) return context.threadState.page;
      const restoreSnapshot = persistence?.snapshot ?? (persistence?.navigation ? persistence : null);
      const request = restoreSnapshot
        ? { kind: `cold-restore`, snapshot: structuredClone(restoreSnapshot) }
        : { kind: `fresh`, page: initialPage };
      return this.host.materializeThreadPageState(context.windowState, context.threadState, request);
    }

    navigateCurrentPageHistory(owner: any, conversationId: string, direction: `back` | `forward`, browserTabId?: string) {
      const context = this.getCurrentPageCommandContext(owner, conversationId, browserTabId);
      const webContents = context?.page.view.webContents;
      if (context == null || webContents == null || webContents.isDestroyed()) return false;
      if (direction === `back`) {
        if (!webContents.canGoBack()) return false;
        webContents.goBack();
      } else {
        if (!webContents.canGoForward()) return false;
        webContents.goForward();
      }
      return true;
    }

    navigatePageToUrl(page: any, url: string, source?: string, initiator?: string) {
      if (page == null || typeof url !== `string` || url.length === 0) return false;
      sW(page);
      page.pendingUrl = url;
      page.pendingNavigationUsage = source == null && initiator == null
        ? null
        : { source: source ?? `manual`, initiator: initiator ?? source ?? `manual`, expectedUrl: url };
      const webContents = page.view?.webContents;
      if (webContents == null || webContents.isDestroyed()) return true;
      try {
        webContents.loadURL(url);
        return true;
      } catch (error) {
        this.host.logger?.().warning?.(`failed to navigate browser sidebar page`, { safe: {}, sensitive: { error } });
        return false;
      }
    }

    reload(page: any) {
      const webContents = page?.view?.webContents;
      if (webContents == null || webContents.isDestroyed()) return false;
      webContents.reload();
      return true;
    }

    loadBrowserErrorPage(_windowState: any, page: any, _webContents: any, details: any) {
      if (page == null) return false;
      const failedUrl = details?.failedUrl ?? page.pendingUrl ?? page.url ?? ``;
      page.loadError = details?.loadError ?? { failedUrl };
      if (failedUrl.length > 0) page.errorPagesByUrl?.set(failedUrl, page.loadError);
      page.pendingUrl = failedUrl;
      page.url = ``;
      page.isLoading = false;
      return true;
    }

    isRestrictedBrowserNavigation(webContentsId: number | null, url: string, resourceType = `mainFrame`) {
      return this.host.browserUseNavigationRestriction?.isRestrictedForWebContentsId(webContentsId, url, { resourceType }) ?? false;
    }
  };
}

if (typeof module !== "undefined") module.exports = { createBrowserNavigationContextControllerClass };
