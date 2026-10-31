type DetachedBrowserDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  usingScopeHelper(): { u<T>(value: T): T; e?: unknown; d(): void };
  setTimeout(callback: () => void, delay: number): any;
  clearTimeout(handle: any): void;
};

const toolbarActionPresentation: Record<string, "none" | "task" | "window"> = {
  "open-settings": "window",
  "open-profile-import": "window",
  "browsing-data-cleared": "none",
  "clear-browser-data": "none",
  "capture-screenshot-selected": "none",
  "open-external": "none",
  "device-toolbar-shown": "none",
  "device-toolbar-action": "none",
  "set-extensions-toolbar-visible": "none",
  "open-extensions-web-store": "window",
  "record-site-tools-action": "none",
  "record-error-toast": "none",
  "open-site-tools-help": "window",
  "open-site-tools-sources": "window",
  "open-appgen-site-settings": "window",
  "open-appgen-site-share": "window",
  "submit-browser-tweaks": "none",
  "submit-browser-tweaks-after-focus": "task",
  "capture-screenshot-clicked": "none",
  "dismiss-active-annotation-editor": "none",
  "dismiss-annotation-coachmark": "none",
  "set-annotation-markers-visible": "none",
};

export function createDetachedBrowserRuntime(dependencies: DetachedBrowserDependencies) {
  class DetachedBrowserToolbarService extends dependencies.RpcHandlerBase {
    constructor(
      private readonly context: any,
      private readonly getCurrentPageUrl: (...args: any[]) => string | null | undefined,
      private readonly source: any,
    ) {
      super();
    }

    [Symbol.dispose]() {
      this.source[Symbol.dispose]();
    }

    recordBrowserAddressCommit(input: unknown) {
      if (this.context.isActive()) this.source.recordBrowserAddressCommit(input).catch(() => {});
    }

    recordBrowserAutocompleteSuggestionsShown(input: unknown) {
      if (this.context.isActive()) this.source.recordBrowserAutocompleteSuggestionsShown(input).catch(() => {});
    }

    recordBrowserNavigation(input: unknown) {
      if (this.context.isActive()) this.source.recordBrowserNavigation(input).catch(() => {});
    }

    getBrowserSiteToolsContext(input: unknown) {
      return this.callWithFallback(
        () => this.source.getBrowserSiteToolsContext(input),
        { canOpenSources: false, recentToolCallCount: 0 },
        true,
      );
    }

    async requestBrowserToolbarAction(input: any) {
      const isStillOnRequestedSite = () =>
        (input.type !== "open-appgen-site-settings" && input.type !== "open-appgen-site-share") ||
        this.currentPageUrl() === input.siteUrl;
      if (!this.context.isActive() || !isStillOnRequestedSite()) return false;
      const presentation = toolbarActionPresentation[input.type];
      if (presentation !== "none" && !(await this.context.revealSource(presentation === "task"))) return false;
      return this.callWithFallback(
        () => this.source.requestBrowserToolbarAction(input),
        false,
        false,
        isStillOnRequestedSite,
      );
    }

    forwardBrowserAnnotationMessage(input: any) {
      const data = this.context.request.content.data;
      if (
        this.context.isActive() &&
        data.browserTabId === input.browserTabId &&
        data.conversationId === input.conversationId
      )
        this.source.forwardBrowserAnnotationMessage(input).catch(() => {});
    }

    private currentPageUrl() {
      const { conversationId, browserTabId } = this.context.request.content.data;
      return (
        this.getCurrentPageUrl(this.context.window.webContents, conversationId, browserTabId) ??
        (this.context.phase === "opening"
          ? this.getCurrentPageUrl(this.context.sourceWindow.webContents, conversationId, browserTabId)
          : null)
      );
    }

    private async callWithFallback(
      call: () => any,
      fallback: any,
      includeTransitional: boolean,
      remainsValid: () => boolean = () => true,
    ) {
      if (!this.context.isActive(includeTransitional) || !remainsValid()) return fallback;
      const deferred = Promise.withResolvers<any>();
      const settleFallback = () => deferred.resolve(fallback);
      const timeout = dependencies.setTimeout(settleFallback, 30_000);
      this.context.signal.addEventListener("abort", settleFallback, { once: true });
      try {
        try {
          const scope = dependencies.usingScopeHelper();
          try {
            const request = scope.u(call());
            const result = await Promise.race([request, deferred.promise]);
            return this.context.isActive(includeTransitional) && remainsValid() ? result : fallback;
          } catch (error) {
            scope.e = error;
          } finally {
            scope.d();
          }
        } catch {
          return fallback;
        }
      } finally {
        dependencies.clearTimeout(timeout);
        this.context.signal.removeEventListener("abort", settleFallback);
      }
    }
  }

  async function createToolbarService(context: any, getCurrentPageUrl: (...args: any[]) => string | null | undefined) {
    try {
      const scope = dependencies.usingScopeHelper();
      try {
        const toolbar = scope.u(await context.source.toolbar);
        return toolbar.kind !== "browser" || !context.isActive(true)
          ? null
          : { kind: "browser", service: new DetachedBrowserToolbarService(context, getCurrentPageUrl, toolbar.service.dup()) };
      } catch (error) {
        scope.e = error;
      } finally {
        scope.d();
      }
    } catch {
      return null;
    }
  }

  function suspendImageAttachments(context: any, suspend: (...args: any[]) => any) {
    const { browserTabId, conversationId } = context.request.content.data;
    const suspension = suspend(context.window.webContents, conversationId, browserTabId);
    const forwardStatus = async (enabled: boolean, hadPendingDownloads: boolean) => {
      try {
        const scope = dependencies.usingScopeHelper();
        try {
          const toolbar = scope.u(await context.source.toolbar);
          if (toolbar.kind !== "browser" || (enabled && !context.isActive())) return false;
          await toolbar.service.forwardBrowserAnnotationMessage({
            type: "browser-sidebar-image-attachment-status",
            browserTabId,
            conversationId,
            enabled,
            hadPendingDownloads,
          });
          return true;
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      } catch {
        return false;
      }
    };
    const disabled = forwardStatus(false, suspension?.hadPendingDownloads ?? false);
    return () => {
      if (context.phase === "restored") {
        suspension?.resume();
        return;
      }
      disabled.then(async () => {
        if (context.isActive() && (await forwardStatus(true, false)) && context.isActive()) suspension?.resume();
      });
    };
  }

  function createDetachedBrowserKindHandler(browserHostManager: any) {
    return {
      move: (context: any) => browserHostManager.moveTabToWindow(context),
      suspend: (context: any) => suspendImageAttachments(context, browserHostManager.suspendImageAttachments.bind(browserHostManager)),
      createToolbarService: (context: any) => createToolbarService(context, browserHostManager.getCurrentPageUrl.bind(browserHostManager)),
      close: ({ content, destinationWindow }: any) => {
        browserHostManager.closePage(destinationWindow.webContents, content.conversationId, content.browserTabId);
      },
    };
  }

  function findDetachedBrowserPageWebContents(manager: any, origin: any, conversationId: string, browserTabId: string) {
    return manager.findForSource(
      origin,
      (context: any) =>
        context.content.kind === "browser" &&
        context.content.data.conversationId === conversationId &&
        context.content.data.browserTabId === browserTabId,
    )?.window.webContents ?? null;
  }

  return { createDetachedBrowserKindHandler, findDetachedBrowserPageWebContents };
}
