// @ts-nocheck

/** Owns site-annotation permission requests and their navigation/destruction cleanup. */
export function createSiteAnnotationPermissionControllerClass(dependencies: Record<string, any>) {
  const { createId, normalizeSiteHostname, routeKey, settings } = dependencies;

  return class SiteAnnotationPermissionController {
    options: any;
    required = true;
    pending = new Map<any, any>();

    constructor(options: any) {
      this.options = options;
    }

    setRequired(required: boolean) {
      this.required = required;
      this.refresh();
    }

    isAllowed(pageState: any) {
      const webContents = pageState?.page.view.webContents;
      const hostname = webContents == null ? null : normalizeSiteHostname(webContents.getURL());
      return (
        pageState != null &&
        this.canRequest(pageState) &&
        hostname != null &&
        (!this.required ||
          this.options.settingsStore
            ?.getEffective(settings.siteAnnotationPermissionAnsweredHostnames.key)
            ?.includes(hostname) === true)
      );
    }

    request(pageState: any, requestedInteractionMode: any) {
      const webContents = pageState?.page.view.webContents;
      if (pageState == null || webContents == null || !this.canRequest(pageState)) return false;
      if (this.isAllowed(pageState)) return true;
      const hostname = normalizeSiteHostname(webContents.getURL());
      const settingsStore = this.options.settingsStore;
      if (hostname == null || settingsStore == null) return false;
      const currentRequest = this.pending.get(webContents);
      if (currentRequest != null) {
        if (currentRequest.isCurrent()) return currentRequest.promise;
        currentRequest.finish(false);
      }

      const { page, threadState, windowState } = pageState;
      const { owner } = windowState;
      const navigationVersion = page.navigationVersion;
      const id = createId();
      const { promise, resolve } = Promise.withResolvers<boolean>();
      const isCurrent = () =>
        this.canRequest(pageState) &&
        page.navigationVersion === navigationVersion &&
        normalizeSiteHostname(webContents.getURL()) === hostname;
      const finish = (allowed: boolean) => {
        if (this.pending.get(webContents)?.id !== id) return;
        this.pending.delete(webContents);
        webContents.removeListener(`did-start-navigation`, handleNavigation);
        webContents.removeListener(`destroyed`, cancel);
        webContents.removeListener(`render-process-gone`, cancel);
        owner.removeListener(`destroyed`, cancel);
        owner.removeListener(`render-process-gone`, cancel);
        threadState.snapshot = {
          ...threadState.snapshot,
          siteAnnotationPermissionRequest: undefined,
        };
        if (!owner.isDestroyed()) this.options.syncThreadState(pageState);
        resolve(allowed);
      };
      const cancel = () => finish(false);
      const handleNavigation = (
        _event: any,
        _url: string,
        isInPlace: boolean,
        isMainFrame: boolean,
      ) => {
        if (isMainFrame && !isInPlace) cancel();
      };

      this.pending.set(webContents, {
        id,
        hostname,
        isCurrent,
        finish,
        promise,
      });
      webContents.on(`did-start-navigation`, handleNavigation);
      webContents.on(`destroyed`, cancel);
      webContents.on(`render-process-gone`, cancel);
      owner.on(`destroyed`, cancel);
      owner.on(`render-process-gone`, cancel);
      threadState.snapshot = {
        ...threadState.snapshot,
        siteAnnotationPermissionRequest: { id, hostname, requestedInteractionMode },
      };
      this.options.syncThreadState(pageState);
      return promise;
    }

    respond(webContents: any, response: any) {
      const request = webContents == null ? undefined : this.pending.get(webContents);
      const settingsStore = this.options.settingsStore;
      if (
        webContents == null ||
        request == null ||
        request.id !== response.requestId ||
        settingsStore == null
      )
        return false;
      if (!request.isCurrent()) {
        request.finish(false);
        return false;
      }
      if (
        !response.allow &&
        !this.options.features.setEnabled(webContents, {
          ...response,
          siteUrl: webContents.getURL(),
          enabled: false,
        })
      )
        return false;
      const settingKey = settings.siteAnnotationPermissionAnsweredHostnames.key;
      settingsStore.set(settingKey, [
        ...new Set([...(settingsStore.getEffective(settingKey) ?? []), request.hostname]),
      ]);
      for (const pendingRequest of this.pending.values()) {
        if (pendingRequest.hostname === request.hostname)
          pendingRequest.finish(response.allow && pendingRequest.isCurrent());
      }
      return true;
    }

    refresh() {
      for (const request of this.pending.values())
        request.isCurrent()
          ? this.required || request.finish(true)
          : request.finish(false);
    }

    cancel(webContents: any) {
      if (webContents != null) this.pending.get(webContents)?.finish(false);
    }

    canRequest({ windowState, page, threadState }: any) {
      const webContents = page.view.webContents;
      return (
        this.options.features.apiAvailability === true &&
        webContents != null &&
        !webContents.isDestroyed() &&
        !windowState.owner.isDestroyed() &&
        windowState.threads.get(routeKey(page)) === threadState &&
        threadState.page === page &&
        !page.isWaitingForResponse &&
        this.options.features.isEnabled(webContents.getURL()) &&
        threadState.isAnnotationModeEnabled &&
        threadState.visible &&
        threadState.presented &&
        !threadState.isAgentControllingBrowser &&
        threadState.snapshot.commentModeDisabledReason == null
      );
    }
  };
}

if (typeof module !== `undefined`)
  module.exports = { createSiteAnnotationPermissionControllerClass };
