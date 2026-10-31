type BrowserHistoryDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  clearBrowserData(session: any, dataTypes: unknown, timeRange: unknown): Promise<unknown>;
  fromWebContents(origin: any): any;
  displayScaleFactor(window: any): number | undefined;
  loadFaviconData(faviconService: any, options: { destinationURL: string; iconURL: null; scaleFactor?: number }): Promise<string | null>;
};

function startTimeForRange(range: string): number | undefined {
  const now = Date.now();
  switch (range) {
    case "lastHour": return now - 3_600_000;
    case "lastDay": return now - 86_400_000;
    case "lastWeek": return now - 604_800_000;
    case "lastMonth": return now - 2_419_200_000;
    case "allTime": return 0;
  }
}

function isHistoryEntry(value: any): value is { lastVisitTime: number; url: string } {
  return value.lastVisitTime != null && value.url != null;
}

function invokeDisposableCallback(callback: any, value: unknown) {
  const result = callback(value);
  try {
    return result;
  } finally {
    result?.[Symbol.dispose]?.();
  }
}

export function createBrowserHistoryServiceClass(dependencies: BrowserHistoryDependencies) {
  class TopSitesSubscription extends dependencies.RpcHandlerBase {
    constructor(private readonly disposeSubscription: () => void) { super(); }
    [Symbol.dispose]() { this.disposeSubscription(); }
  }

  function subscribeTopSites(session: any, origin: any, callback: any) {
    if (session == null || origin.isDestroyed()) {
      invokeDisposableCallback(callback, null);
      return;
    }
    const remoteCallback = callback.dup();
    const topSites = session.topSites;
    let active = true;
    let generation = 0;
    const publish = (value: unknown) => { if (active) invokeDisposableCallback(remoteCallback, value); };
    const hydrate = async (sites: any[]) => {
      const currentGeneration = ++generation;
      let projected = sites.map((site) => ({ ...site, faviconDataURL: null }));
      publish(projected);
      const window = dependencies.fromWebContents(origin);
      const scaleFactor = window == null ? undefined : dependencies.displayScaleFactor(window);
      await Promise.all(sites.map(async ({ url }, index) => {
        const favicon = await dependencies.loadFaviconData(session.faviconService, {
          destinationURL: url,
          iconURL: null,
          scaleFactor,
        }).catch(() => null);
        if (active && generation === currentGeneration && favicon != null) {
          projected = projected.map((entry, entryIndex) => entryIndex === index ? { ...entry, faviconDataURL: favicon } : entry);
          publish(projected);
        }
      }));
    };
    const onChanged = (sites: any[]) => { void hydrate(sites); };
    const dispose = () => {
      if (!active) return;
      active = false;
      topSites.off("changed", onChanged);
      origin.off("destroyed", dispose);
      remoteCallback[Symbol.dispose]();
    };
    topSites.on("changed", onChanged);
    origin.once("destroyed", dispose);
    remoteCallback.onRpcBroken(dispose);
    topSites.get().then((sites: any[]) => active && generation === 0 ? hydrate(sites) : undefined).catch(() => { if (generation === 0) publish(null); });
    return new TopSitesSubscription(dispose);
  }

  return class BrowserHistoryService extends dependencies.RpcHandlerBase {
    constructor(private readonly origin: any, private readonly getBrowserSession: () => any) { super(); }
    static create(origin: any, getBrowserSession: () => any) { return new this(origin, getBrowserSession); }
    async clearBrowsingData(input: any) { return dependencies.clearBrowserData(this.session, input.dataTypes, input.timeRange); }
    async getBrowsingDataSettings() { return this.session.getBrowsingDataSettings(); }

    async getBrowsingDataSummary(range: string) {
      const startTime = startTimeForRange(range);
      const [history, cookies, cacheSize, downloads] = await Promise.all([
        this.session.searchHistory({ deduplicateByDay: true, matchingAlgorithm: "alwaysPrefix", maxResults: 0, startTime, text: "" }),
        this.session.cookies.get({}).catch(() => null),
        this.session.getCacheSize?.().catch(() => null) ?? Promise.resolve(null),
        this.session.getDownloadHistory().catch(() => null),
      ]);
      const sites = new Set<string>();
      let firstSite: string | null = null;
      for (const entry of history) {
        if (!isHistoryEntry(entry)) continue;
        const site = new URL(entry.url).hostname || entry.url;
        firstSite ??= site;
        sites.add(site);
      }
      const cookieSites = cookies == null ? null : new Set(cookies.flatMap(({ domain }: any) => domain == null ? [] : [domain.replace(/^\./, "")]));
      return {
        cache: cacheSize == null ? null : { sizeBytes: cacheSize },
        downloads: downloads == null ? null : { count: downloads.filter(({ startTime: value, state }: any) => ["completed", "cancelled", "interrupted"].includes(state) && value * 1_000 >= (startTime as any)).length },
        history: { firstSite, siteCount: sites.size },
        siteData: cookieSites == null ? null : { siteCount: cookieSites.size },
      };
    }

    async getFavicon(url: string, size: number) {
      const image = await this.getBrowserSession()?.faviconService.getFavicon(url, size).catch(() => null);
      if (image == null || image.isEmpty()) return null;
      const window = dependencies.fromWebContents(this.origin);
      return image.toDataURL({ scaleFactor: window == null ? 1 : dependencies.displayScaleFactor(window) });
    }

    async removeEntries(input: unknown) { return this.session.removeBrowsingHistoryEntries(input); }

    async searchHistory(input: any) {
      const { offset = 0, ...query } = input;
      const maxResults = query.maxResults ?? 100;
      let requested = maxResults === 0 ? 0 : offset + maxResults;
      const search = (count: number) => this.session.searchHistory({ ...query, ...(count === maxResults ? {} : { maxResults: count }), deduplicateByDay: true, matchingAlgorithm: "alwaysPrefix" });
      let raw = await search(requested);
      let valid = raw.filter(isHistoryEntry);
      while (requested !== 0 && raw.length === requested && valid.length < offset + maxResults) {
        requested += maxResults;
        raw = await search(requested);
        valid = raw.filter(isHistoryEntry);
      }
      const selected = valid.slice(offset, maxResults === 0 ? undefined : offset + maxResults);
      const window = dependencies.fromWebContents(this.origin);
      const scaleFactor = window == null ? undefined : dependencies.displayScaleFactor(window);
      const favicons = new Map<string, Promise<string | null>>();
      return Promise.all(selected.map((entry: any) => {
        const { lastVisitTime, url } = entry;
        let favicon = favicons.get(url);
        if (favicon == null) {
          favicon = dependencies.loadFaviconData(this.session.faviconService, { destinationURL: url, iconURL: null, scaleFactor }).catch(() => null);
          favicons.set(url, favicon);
        }
        return favicon.then((faviconDataURL) => ({ ...entry, faviconDataURL, lastVisitTime, title: entry.title ?? "", url, visitTime: entry.visitTime ?? lastVisitTime }));
      }));
    }

    subscribeTopSites(callback: any) { return subscribeTopSites(this.getBrowserSession(), this.origin, callback); }
    private get session() { const session = this.getBrowserSession(); if (session == null) throw Error("In-app browser is unavailable."); return session; }
  };
}
