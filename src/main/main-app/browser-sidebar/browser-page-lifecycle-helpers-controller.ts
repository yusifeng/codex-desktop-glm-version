// @ts-nocheck

/** Owns the lifecycle adapter surface consumed by the generated page runtime. */
export function createBrowserPageLifecycleHelpersControllerClass() {
  return class BrowserPageLifecycleHelpersController {
    host: any;

    constructor(host: any) {
      this.host = host;
    }

    private lifecycle(name: string): any {
      const lifecycle = this.host.browserPageHostLifecycle;
      const value = lifecycle?.[name];
      return typeof value === `function` ? value.bind(lifecycle) : null;
    }

    private hostMethod(name: string): any {
      const value = this.host[name];
      return typeof value === `function` ? value.bind(this.host) : null;
    }

    updateThreadSessionState(threadState: any): void {
      this.lifecycle(`updateThreadSessionState`)?.(threadState);
    }

    isBrowserUseManagedBrowserTab(conversationId: string, browserTabId: string): boolean {
      return this.lifecycle(`isBrowserUseManagedBrowserTab`)?.(conversationId, browserTabId) === true;
    }

    dismissCommentEditorForCommittedNavigation(windowState: any, page: any, url: string): void {
      const comments = this.host.comments;
      const threadState = this.host.getThreadStateForWindow?.(
        windowState,
        page?.conversationId,
        page?.browserTabId,
      );
      if (typeof comments?.dismissForCommittedNavigation === `function`) {
        comments.dismissForCommittedNavigation(windowState.owner, page, url, threadState);
        return;
      }
      if (threadState != null && typeof comments?.dismiss === `function`) {
        comments.dismiss(windowState.owner, page.conversationId, page.browserTabId, threadState);
      }
    }

    finishPageAttach(windowState: any, page: any, webContents: any, initialNavigationOwner: any): void {
      if (page == null || webContents == null || webContents.isDestroyed?.()) return;
      const threadState = this.host.getThreadStateForWindow?.(
        windowState,
        page.conversationId,
        page.browserTabId,
      );
      if (threadState == null) return;
      this.updateThreadSessionState(threadState);
      this.host.syncThreadState?.(windowState, page.conversationId, threadState);
      this.host.tabBudget?.enforceDetachedPageBudget?.(windowState);
      this.host.iabTabMentions?.notifyInvalidated?.();
      void initialNavigationOwner;
    }

    openBrowserExternalUrl(request: any): boolean | Promise<boolean> {
      const method = this.hostMethod(`openBrowserExternalUrl`);
      if (method != null && method !== this.openBrowserExternalUrl) return method(request);
      return false;
    }

    openBrowserUrlExternally(conversationId: string, url: string): boolean | Promise<boolean> {
      const method = this.hostMethod(`openBrowserUrlExternally`);
      if (method != null && method !== this.openBrowserUrlExternally) return method(conversationId, url);
      const shell = this.host.shell;
      if (typeof shell?.openExternal !== `function`) return false;
      try {
        return Promise.resolve(shell.openExternal(url)).then(() => true, () => false);
      } catch {
        return false;
      }
    }

    isRestrictedBrowserNavigation(webContentsId: number, url: string, resourceType?: string): boolean {
      return this.hostMethod(`isRestrictedBrowserNavigation`)?.(webContentsId, url, resourceType) === true;
    }

    navigatePageToUrl(...args: any[]): any { return this.hostMethod(`navigatePageToUrl`)?.(...args) ?? false; }
    loadBrowserErrorPage(...args: any[]): any { return this.hostMethod(`loadBrowserErrorPage`)?.(...args) ?? false; }
    queuePageDeviceMetricsSync(...args: any[]): any { return this.hostMethod(`queuePageDeviceMetricsSync`)?.(...args); }
    syncPageZoomPercent(...args: any[]): any { return this.hostMethod(`syncPageZoomPercent`)?.(...args); }
    setDesignModifierPressed(...args: any[]): any { return this.hostMethod(`setDesignModifierPressed`)?.(...args); }
    setAnnotationPresentation(...args: any[]): any { return this.hostMethod(`setAnnotationPresentation`)?.(...args); }
    setInteractionMode(...args: any[]): any { return this.hostMethod(`setInteractionMode`)?.(...args); }
    startCommentAtPoint(...args: any[]): any { return this.hostMethod(`startCommentAtPoint`)?.(...args); }
    startDesignEditAtPoint(...args: any[]): any { return this.hostMethod(`startDesignEditAtPoint`)?.(...args); }

    reload(page: any, options: any, ignoreCache: any, windowState: any): any {
      const method = this.hostMethod(`reload`);
      if (method != null && windowState != null) {
        return method(windowState.owner ?? windowState, page?.conversationId, {
          ...(options ?? {}),
          ...(ignoreCache == null ? {} : { ignoreCache }),
        }, page?.browserTabId);
      }
      const webContents = page?.view?.webContents;
      if (webContents == null || webContents.isDestroyed?.()) return false;
      return ignoreCache ? webContents.reloadIgnoringCache() : webContents.reload();
    }
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createBrowserPageLifecycleHelpersControllerClass };
}
