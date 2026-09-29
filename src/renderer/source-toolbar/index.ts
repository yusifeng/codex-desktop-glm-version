import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/local-conversation-artifacts-signals";
import "@rchunk/comment-mode-coachmark-state";
import "@rchunk/source-annotation-host-registry";
import "@rchunk/browser-profile-import-availability";
import "@rchunk/browser-use-origin-state-queries";
import "@rchunk/assert-never";

interface BrowserContent {
  browserTabId: string;
  conversationId: string;
  snapshot: { url: string };
  dispose?(): void;
  getCapabilities?(get: StateGetter, hostId: string): Record<string, unknown>;
  getSiteActions?(get: StateGetter, hostId: string, url: string): unknown;
  handleToolbarAction?(action: ToolbarAction): boolean | Promise<boolean>;
  recordBrowserAddressCommit?(event: unknown): void;
  recordBrowserAutocompleteSuggestionsShown?(event: unknown): void;
  recordBrowserNavigation?(event: unknown): void;
}

interface BrowserLifecycle {
  hostId: string;
  ownsTab: boolean;
  state: string;
}

interface BrowserOwner {
  getLifecycle(): BrowserLifecycle;
  onStateChanged(): void;
  tabId: string;
}

interface BrowserScope {
  get?: StateGetter;
  setPreference?(key: string, value: unknown): void | Promise<void>;
}

interface BrowserAnnotationMessage {
  browserTabId: string;
  conversationId: string;
  snapshot?: { url: string };
  type: string;
}

interface ToolbarAction {
  type: string;
  [key: string]: unknown;
}

type StateGetter = <Value>(signal: unknown, parameter?: unknown) => Value;

const browserMessageIds = new Set([
  "clipboard.copyError.description",
  "clipboard.copyError.title",
  "codex.dialog.closeButton",
]);
const browserMessagePrefixes = [
  "browserSidebar.zoomBanner.",
  "codex.threadFindBar.",
  "downloads.",
  "settings.browserUse.browser.",
  "settings.browserUse.clearBrowsingData.",
  "thread.browser.",
];

function filterBrowserIntlConfig(config: {
  defaultLocale?: string;
  locale?: string;
  messages?: Record<string, unknown>;
}): { defaultLocale?: string; locale?: string; messages: Record<string, string> } {
  return {
    locale: config.locale,
    defaultLocale: config.defaultLocale,
    messages: Object.fromEntries(
      Object.entries(config.messages ?? {}).filter(
        ([key, value]) =>
          typeof value === "string" &&
          (browserMessageIds.has(key) ||
            browserMessagePrefixes.some((prefix) => key.startsWith(prefix))),
      ) as Array<[string, string]>,
    ),
  };
}

class BrowserToolbarController {
  readonly #scope: BrowserScope;
  readonly #content: BrowserContent;
  readonly #owner: BrowserOwner;
  #disposed = false;
  #url: string;
  #siteActionsModule: { getBrowserSiteActionsState?: (...parameters: unknown[]) => unknown } | null = null;

  constructor(scope: BrowserScope, content: BrowserContent, owner: BrowserOwner) {
    this.#scope = scope;
    this.#content = content;
    this.#owner = owner;
    this.#url = content.snapshot.url;
    void import("@rchunk/browser-site-actions-state").then((module) => {
      if (this.#disposed) return;
      this.#siteActionsModule = module;
      owner.onStateChanged();
    });
  }

  #ownsDetachedTab(): boolean {
    const lifecycle = this.#owner.getLifecycle();
    return !this.#disposed && lifecycle.state === "detached" && lifecycle.ownsTab;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#content.dispose?.();
  }

  recordBrowserAddressCommit(event: unknown): void {
    if (this.#ownsDetachedTab()) this.#content.recordBrowserAddressCommit?.(event);
  }

  recordBrowserAutocompleteSuggestionsShown(event: unknown): void {
    if (this.#ownsDetachedTab())
      this.#content.recordBrowserAutocompleteSuggestionsShown?.(event);
  }

  recordBrowserNavigation(event: unknown): void {
    if (!this.#ownsDetachedTab()) return;
    const value =
      typeof event === "object" && event != null && "initiator" in event
        ? {
            ...event,
            initiator:
              (event as { initiator?: unknown }).initiator === "os_open"
                ? "external_link"
                : (event as { initiator?: unknown }).initiator,
          }
        : event;
    this.#content.recordBrowserNavigation?.(value);
  }

  forwardBrowserAnnotationMessage(message: BrowserAnnotationMessage): void {
    if (
      message.browserTabId !== this.#content.browserTabId ||
      message.conversationId !== this.#content.conversationId ||
      !this.#ownsDetachedTab()
    )
      return;
    if (message.type === "browser-sidebar-state" && message.snapshot != null) {
      if (message.snapshot.url !== this.#url) {
        this.#url = message.snapshot.url;
        this.#owner.onStateChanged();
      }
    }
  }

  getBrowserSiteToolsContext(get: StateGetter): { canOpenSources: boolean; recentToolCallCount: number } {
    const lifecycle = this.#owner.getLifecycle();
    if (
      this.#disposed ||
      !lifecycle.ownsTab ||
      (lifecycle.state !== "source" && lifecycle.state !== "detached")
    ) {
      return { canOpenSources: false, recentToolCallCount: 0 };
    }
    const context = this.#content.getSiteActions?.(get, lifecycle.hostId, this.#url);
    if (typeof context === "object" && context != null) {
      return {
        canOpenSources: (context as { canOpenSources?: unknown }).canOpenSources === true,
        recentToolCallCount:
          typeof (context as { recentToolCallCount?: unknown }).recentToolCallCount === "number"
            ? (context as { recentToolCallCount: number }).recentToolCallCount
            : 0,
      };
    }
    return { canOpenSources: false, recentToolCallCount: 0 };
  }

  getCapabilities(get: StateGetter, hostId: string): Record<string, unknown> {
    return (
      this.#content.getCapabilities?.(get, hostId) ?? {
        annotationModeEnabled: this.#ownsDetachedTab(),
        canCaptureScreenshot: this.#ownsDetachedTab(),
        canOpenSources: this.getBrowserSiteToolsContext(get).canOpenSources,
        canUseComposer: this.#ownsDetachedTab(),
        extensionsEnabled: false,
      }
    );
  }

  getSiteActions(get: StateGetter, hostId: string): unknown {
    const helper = this.#siteActionsModule?.getBrowserSiteActionsState;
    if (helper != null) return helper(get, this.#content, this.#url, hostId);
    return this.#content.getSiteActions?.(get, hostId, this.#url) ?? null;
  }

  async requestBrowserToolbarAction(action: ToolbarAction): Promise<boolean> {
    if (!this.#ownsDetachedTab()) return false;
    if (action.type === "set-annotation-markers-visible") {
      await this.#scope.setPreference?.("annotationMarkersVisible", action.visible);
      return this.#ownsDetachedTab();
    }
    if (action.type === "open-sources") {
      await loadSourceToolbarContext();
      // @ts-expect-error The lazy side-panel entry is not in the shared declaration baseline.
      const sourcePanelModule = await import("@rchunk/open-local-conversation-sources-side-panel-tab-entry");
      const { openLocalConversationSourcesSidePanelTab } = sourcePanelModule;
      openLocalConversationSourcesSidePanelTab(this.#content.conversationId);
      return this.#ownsDetachedTab();
    }
    if (action.type === "open-browser-profile-import") {
      // @ts-expect-error The lazy dialog entry is not in the shared declaration baseline.
      const dialogModule = await import("@rchunk/dialog-launcher-entry");
      const { openBrowserProfileImportDialog } = dialogModule;
      openBrowserProfileImportDialog(action);
      return this.#ownsDetachedTab();
    }
    if (action.type === "acknowledge-browser-profile-import-nux") {
      // @ts-expect-error The profile-import state alias is registered with this rewrite.
      const profileImportModule = await import("@rchunk/browser-profile-import-state");
      const { acknowledgeBrowserProfileImportNux } = profileImportModule;
      await acknowledgeBrowserProfileImportNux();
      return this.#ownsDetachedTab();
    }
    if (action.type === "open-appgen-site-settings") {
      await loadAppgenToolbarContext();
      const [{ AppgenSettingsDialog }, { openModal }] = await Promise.all([
        import("@rchunk/appgen-settings-dialog"),
        import("@rchunk/modal-controller-state"),
      ]);
      (openModal as unknown as (...parameters: unknown[]) => void)(
        AppgenSettingsDialog,
        action,
      );
      return this.#ownsDetachedTab();
    }
    if (action.type === "open-appgen-share") {
      const [{ AppgenShareDialog }, { openModal }] = await Promise.all([
        import("@rchunk/appgen-share-dialog"),
        import("@rchunk/modal-controller-state"),
      ]);
      (openModal as unknown as (...parameters: unknown[]) => void)(AppgenShareDialog, action);
      return this.#ownsDetachedTab();
    }
    return (await this.#content.handleToolbarAction?.(action)) ?? false;
  }
}

class BrowserToolbarService {
  readonly #controller: BrowserToolbarController;
  constructor(controller: BrowserToolbarController) {
    this.#controller = controller;
  }
  recordBrowserAddressCommit(event: unknown): void {
    this.#controller.recordBrowserAddressCommit(event);
  }
  recordBrowserAutocompleteSuggestionsShown(event: unknown): void {
    this.#controller.recordBrowserAutocompleteSuggestionsShown(event);
  }
  recordBrowserNavigation(event: unknown): void {
    this.#controller.recordBrowserNavigation(event);
  }
  getBrowserSiteToolsContext(get: StateGetter): unknown {
    return this.#controller.getBrowserSiteToolsContext(get);
  }
  requestBrowserToolbarAction(action: ToolbarAction): Promise<boolean> {
    return this.#controller.requestBrowserToolbarAction(action);
  }
  forwardBrowserAnnotationMessage(message: BrowserAnnotationMessage): void {
    this.#controller.forwardBrowserAnnotationMessage(message);
  }
}

function createBrowserWindowToolbarContribution(
  scope: BrowserScope,
  content: BrowserContent,
  owner: BrowserOwner,
): {
  toolbar: { kind: "browser"; service: BrowserToolbarService };
  getState(get: StateGetter, hostId: string): Record<string, unknown>;
  [Symbol.dispose](): void;
} {
  let disposed = false;
  const controller = new BrowserToolbarController(scope, content, owner);
  return {
    toolbar: { kind: "browser", service: new BrowserToolbarService(controller) },
    getState: (get, hostId) => ({
      browserIntlConfig: filterBrowserIntlConfig(
        get<{ defaultLocale?: string; locale?: string; messages?: Record<string, unknown> }>(
          "browserIntlConfig",
        ),
      ),
      browserToolbarCapabilities: controller.getCapabilities(get, hostId),
      browserHostId: hostId,
      openAIGoLinksEnabled: get<boolean>("openAIGoLinksEnabled", "3646210497"),
      showFullUrl: get<boolean>("showFullUrl"),
      siteActions: controller.getSiteActions(get, hostId),
    }),
    [Symbol.dispose]: () => {
      if (disposed) return;
      disposed = true;
      controller.dispose();
    },
  };
}

function loadSourceToolbarContext(): Promise<unknown[]> {
  return Promise.all([
    // @ts-expect-error The lazy sources-signals entry is not in the shared declaration baseline.
    import("@rchunk/local-conversation-sources-signals-entry"),
    // @ts-expect-error The lazy WebMCP model entry is not in the shared declaration baseline.
    import("@rchunk/local-conversation-webmcp-tools-model-entry"),
  ]);
}

function loadAppgenToolbarContext(): Promise<unknown[]> {
  return Promise.all([
    import("@rchunk/appgen-browser-site-entry"),
    import("@rchunk/appgen-query"),
    import("@rchunk/appgen-access-entry"),
  ]);
}

export { createBrowserWindowToolbarContribution };
