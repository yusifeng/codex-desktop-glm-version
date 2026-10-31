// @ts-nocheck

/** Owns per-site annotation feature availability, settings, and runtime projection. */
export function createSiteAnnotationFeatureControllerClass(dependencies: Record<string, any>) {
  const {
    pageEventSchema,
    normalizeSiteHostname,
    settings,
    updatePageAnnotationFeatures,
  } = dependencies;

  return class SiteAnnotationFeatureController {
    options: any;
    apiEnabled: boolean | null = null;
    availabilityListeners = new Set<() => void>();

    constructor(options: any) {
      this.options = options;
    }

    get apiAvailability() {
      return this.apiEnabled;
    }

    getPolicy(pageState: any, siteUrl: string, canUseTweaks: boolean) {
      if (pageState == null) {
        return {
          enabled: false,
          siteAnnotationFeaturesEnabled: true,
          siteAnnotationPermissionGranted: false,
          canUseTweaks: false,
          isAgentControllingBrowser: false,
          isAnnotationModeActive: false,
        };
      }
      if (this.apiEnabled == null) return null;
      const siteAnnotationFeaturesEnabled = this.isEnabled(siteUrl);
      return {
        enabled: this.apiEnabled,
        siteAnnotationFeaturesEnabled,
        siteAnnotationPermissionGranted:
          siteAnnotationFeaturesEnabled &&
          this.options.settingsStore
            ?.getEffective(settings.siteAnnotationPermissionAnsweredHostnames.key)
            ?.includes(normalizeSiteHostname(siteUrl) ?? ``) === true,
        canUseTweaks,
        isAgentControllingBrowser: pageState.threadState.isAgentControllingBrowser,
        isAnnotationModeActive:
          this.apiEnabled && pageState.threadState.snapshot.interactionMode === `comment`,
      };
    }

    subscribeAvailability(listener: () => void) {
      this.availabilityListeners.add(listener);
      return () => {
        this.availabilityListeners.delete(listener);
      };
    }

    setApiEnabled(enabled: boolean) {
      if (this.apiEnabled === enabled) return;
      this.apiEnabled = enabled;
      this.availabilityListeners.forEach((listener) => listener());
      for (const windowState of this.options.windows.values()) {
        for (const threadState of windowState.threads.values()) {
          if (!enabled) {
            this.options.comments.cancelPendingVirtualCommentEdit(threadState);
            if (
              threadState.page?.siteAnnotationFeatures != null ||
              threadState.snapshot.siteAnnotationFeatures != null ||
              threadState.snapshot.siteToolsAvailability?.annotations === `pending-available`
            ) {
              if (threadState.page != null)
                updatePageAnnotationFeatures(threadState.page, undefined);
              threadState.snapshot = {
                ...threadState.snapshot,
                siteAnnotationFeatures: undefined,
                siteToolsAvailability: {
                  webMcp: threadState.snapshot.siteToolsAvailability?.webMcp ?? `unavailable`,
                  annotations: `unavailable`,
                },
              };
              this.options.syncThreadState(
                windowState,
                threadState.conversationId,
                threadState,
              );
            }
          }
          if (threadState.page != null)
            this.options.syncRuntimeStateToPage(threadState.page, threadState);
        }
      }
    }

    setEnabled(webContents: any, request: any) {
      const hostname = normalizeSiteHostname(request.siteUrl);
      if (
        this.options.settingsStore == null ||
        webContents == null ||
        webContents.isDestroyed() ||
        hostname == null ||
        normalizeSiteHostname(webContents.getURL()) !== hostname
      )
        return false;
      const disabledHostnames =
        this.options.settingsStore.getEffective(settings.disabledSiteAnnotationHostnames.key) ?? [];
      this.options.settingsStore.set(
        settings.disabledSiteAnnotationHostnames.key,
        request.enabled
          ? disabledHostnames.filter((value: string) => value !== hostname)
          : [...new Set([...disabledHostnames, hostname])],
      );
      this.refresh();
      return true;
    }

    refresh() {
      for (const windowState of this.options.windows.values()) {
        for (const threadState of windowState.threads.values()) {
          const enabled = this.isEnabled(
            threadState.page?.view.webContents?.getURL() ||
              threadState.snapshot.committedUrl ||
              threadState.snapshot.url,
          );
          if (threadState.snapshot.siteAnnotationFeaturesEnabled === enabled) continue;
          threadState.snapshot = {
            ...threadState.snapshot,
            siteAnnotationFeaturesEnabled: enabled,
          };
          this.options.comments.refreshSiteAnnotationFeatures(
            windowState.owner,
            threadState.conversationId,
            threadState.browserTabId,
            threadState,
          );
          this.options.syncThreadState(windowState, threadState.conversationId, threadState);
        }
      }
    }

    isEnabled(url: string) {
      const hostname = normalizeSiteHostname(url);
      return (
        hostname == null ||
        !this.options.settingsStore
          ?.getEffective(settings.disabledSiteAnnotationHostnames.key)
          ?.includes(hostname)
      );
    }

    handlePageEvent(pageState: any, event: any) {
      const parsed = pageEventSchema.safeParse(event);
      if (!parsed.success) return;
      const features =
        this.apiEnabled === true ? [...new Set(parsed.data.payload.features)] : undefined;
      if (updatePageAnnotationFeatures(pageState.page, features))
        this.options.syncThreadState(
          pageState.windowState,
          pageState.page.conversationId,
          pageState.threadState,
        );
    }
  };
}

if (typeof module !== `undefined`)
  module.exports = { createSiteAnnotationFeatureControllerClass };
