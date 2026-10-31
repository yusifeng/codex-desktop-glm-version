type ProfileImportDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  platform: string;
  logger: { warning(message: string): void };
  parseSignals(value: unknown): unknown;
  parseImportRequest(value: unknown): any;
  parseProfileList(value: unknown): any[];
  parseImportResult(value: unknown): unknown;
};

export function createBrowserProfileImportServiceClass(dependencies: ProfileImportDependencies) {
  return class BrowserProfileImportService extends dependencies.RpcHandlerBase {
    constructor(
      private readonly getConfigRequirements: () => Promise<any>,
      private readonly getBrowserSession: () => any,
    ) { super(); }

    static create(getConfigRequirements: () => Promise<any>, getBrowserSession: () => any) {
      return dependencies.platform === "darwin" || dependencies.platform === "win32"
        ? new this(getConfigRequirements, getBrowserSession)
        : undefined;
    }

    async getImportSignals() {
      if (!(await this.isImportAllowed())) return null;
      const session = this.getBrowserSession();
      if (session == null) return null;
      try { return dependencies.parseSignals(await session.browserProfileImporter.getSignals()); }
      catch { dependencies.logger.warning("Unable to inspect browser profile import signals"); return null; }
    }

    async importBrowserProfile(input: unknown) {
      if (!(await this.isImportAllowed())) throw Error("Browser profile import is disabled by managed policy");
      const request = dependencies.parseImportRequest(input);
      if (request.importExtensions && request.allowUnverifiedExtensions !== true)
        throw Error("Extension import requires confirmation of unverified files and permissions");
      if (!request.importCookies && !request.importPasswords && !request.importHistory && !request.importExtensions)
        throw Error("Select cookies, passwords, history, extensions, or a combination to import");
      if (!request.importCookies && request.cookieDomainAllowlist)
        throw Error("Cookie domain selection requires cookie import");
      const profile = dependencies.parseProfileList(await this.session.browserProfileImporter.list())
        .find((candidate) => candidate.source === request.source && candidate.profilePath === request.profilePath);
      if (profile == null) throw Error("Browser profile is no longer importable");
      if (request.importExtensions && (profile.source !== "chrome" || profile.hasExtensions == null))
        throw Error("Extension import is unavailable for this browser profile");
      return dependencies.parseImportResult(await this.session.browserProfileImporter.import(request));
    }

    async listImportableBrowserProfiles() {
      if (!(await this.isImportAllowed())) return [];
      const session = this.getBrowserSession();
      return session == null ? [] : dependencies.parseProfileList(await session.browserProfileImporter.list());
    }

    private get session() {
      const session = this.getBrowserSession();
      if (session == null) throw Error("In-app browser is unavailable.");
      return session;
    }

    private async isImportAllowed() {
      const { requirements } = await this.getConfigRequirements();
      return requirements?.inAppBrowser?.allowExternalBrowserSettingsImport !== false;
    }
  };
}

export function createDetachedBrowserTabsServiceClass(RpcHandlerBase: new (...args: any[]) => any) {
  return class DetachedBrowserTabsService extends RpcHandlerBase {
    constructor(
      private readonly manager: any,
      private readonly origin: any,
      private readonly getCurrentPageUrl: (webContents: any, conversationId: string, browserTabId: string) => string | null,
    ) { super(); }

    isCurrentBrowserSiteUrl(sourceThreadId: string, tabId: string, url: string) {
      const context = this.manager.findForSource(
        this.origin,
        (entry: any) => entry.content.kind === "browser" && entry.sourceThreadId === sourceThreadId && entry.tabId === tabId,
      );
      if (context?.request.content.kind !== "browser") return false;
      const { conversationId, browserTabId } = context.request.content.data;
      return this.getCurrentPageUrl(context.window.webContents, conversationId, browserTabId) === url;
    }

    async focusSourceForBrowserComment(conversationId: string, browserTabId: string) {
      const context = this.find(conversationId, browserTabId);
      return context != null && (await context.revealSource(true)) && context.isActive();
    }

    isBrowserTabDetachedFromSource(conversationId: string, browserTabId: string) {
      return this.find(conversationId, browserTabId) != null;
    }

    private find(conversationId: string, browserTabId: string) {
      return this.manager.findForSource(
        this.origin,
        (entry: any) => entry.content.kind === "browser" && entry.content.data.conversationId === conversationId && entry.content.data.browserTabId === browserTabId,
      );
    }
  };
}

type DownloadsDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  fromWebContents(origin: any): any;
  showOpenDialog(windowOrOptions: any, options?: any): Promise<{ canceled: boolean; filePaths: string[] }>;
};

export function createDownloadsServiceClass(dependencies: DownloadsDependencies) {
  class DownloadsSubscription extends dependencies.RpcHandlerBase {
    private unsubscribeOnce: (() => void) | null;
    constructor(unsubscribe: () => void) { super(); this.unsubscribeOnce = unsubscribe; }
    unsubscribe() { const unsubscribe = this.unsubscribeOnce; this.unsubscribeOnce = null; unsubscribe?.(); }
    [Symbol.dispose]() { this.unsubscribe(); }
  }

  return class DownloadsService extends dependencies.RpcHandlerBase {
    constructor(private readonly downloadStore: any, private readonly origin: any, private readonly registerView: any) { super(); }
    async acknowledge(input: unknown) { this.downloadStore.acknowledge(input); }
    downloadUrl(input: unknown) { return this.origin.isDestroyed() ? Promise.resolve(false) : this.downloadStore.downloadUrl(input); }
    cancel(input: unknown) { return this.downloadStore.cancel(input); }
    async chooseDownloadDirectory() {
      const options = { properties: ["openDirectory", "createDirectory"], title: "Choose Downloads Folder" };
      const window = dependencies.fromWebContents(this.origin);
      const result = window == null ? await dependencies.showOpenDialog(options) : await dependencies.showOpenDialog(window, options);
      return result.canceled ? null : (result.filePaths[0] ?? null);
    }
    clearHistory() { return this.downloadStore.clearHistory(); }
    getSnapshot() { return this.downloadStore.getSnapshot(); }
    open(input: unknown) { return this.downloadStore.open(input); }
    pause(input: unknown) { return this.downloadStore.pause(input); }
    removeFromHistory(input: unknown) { return this.downloadStore.removeFromHistory(input); }
    resume(input: unknown) { return this.downloadStore.resume(input); }
    searchHistory(input: unknown) { return this.downloadStore.searchHistory(input); }
    showDownloadsFolder() { return this.downloadStore.showDownloadsFolder(); }
    showInFolder(input: unknown) { return this.downloadStore.showInFolder(input); }
    subscribe(callback: any) { return new DownloadsSubscription(this.registerView(this.origin, callback.dup())); }
  };
}
