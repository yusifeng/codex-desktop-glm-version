// IAB 标签页提及（tab mentions）：IAB 标签搜索 + Chrome 扩展标签的发现/存活/聚焦。
//
// 对应 main-C-Mhak1n.ts 68,427-68,704：
//   - HOe IabTabMentions（68,427-68,661）：search（IAB + Chrome 双源合并、
//     去重截断）/ getChromeTabLiveness（100 条上限 + 环回判定）/
//     focusChromeTab / subscribeInvalidations（Chrome 连接失效触发）
//   - Chrome 连接管理（#t，68,552-68,627）：5s discovery 缓存、iD/aD 双键去重
//     （generation 键防旧连接复活 / profile 键防同 profile 重复）、close/
//     invalidation 监听清理
//   - iD/aD providerInfo JSON 键（68,662-68,682）
//   - UOe UnsubscribeOnce（68,683-68,694）
//   - WOe/GOe chrome provider 连接工厂（68,695-68,701）
//   - KOe 全局持久审批的企业策略判定（68,702-68,704）
import {
  qa as tabMentionSearchSchema,
  Ya as chromeTabLivenessSchema,
  Ja as chromeTabFocusSchema,
  Nc as dedupeTabCandidates,
  Mc as candidateLimitForQuery,
  Vc as browserPluginDescriptor,
  Rc as chromeExtensionIdsForChannel,
  Uf as EventEmitterBase,
} from "@chunk/shared";
import { ChromeTabMentionClient, discoverPipeClients } from "../native-pipe/server";

// ---------------------------------------------------------------------------
// providerInfo 键（原 `iD`/`aD`）
// ---------------------------------------------------------------------------

interface ChromeProviderConnection {
  client: ChromeTabMentionClient & {
    getUserTabs(opts: { includeFavicons: boolean; limit: number; query: string }): Promise<Array<{ browserId: string; id: string }>>;
    focusTab(tabId: string): Promise<void>;
    addCloseListener(cb: () => void): () => void;
    addInvalidationListener(cb: () => void): () => void;
    isClosed(): boolean;
    close(): void;
  };
  providerInfo: {
    protocolVersion: string;
    browserFamily: string;
    buildChannel: string;
    extensionId: string;
    profileInstanceId: string;
    generation: string;
  };
}

/** 含 generation 的完整键（原 `iD`）：同 profile 的新旧连接视为不同。 */
function connectionKeyWithGeneration(connection: ChromeProviderConnection): string {
  const info = connection.providerInfo;
  return JSON.stringify([
    info.protocolVersion,
    info.browserFamily,
    info.buildChannel,
    info.extensionId,
    info.profileInstanceId,
    info.generation,
  ]);
}

/** 不含 generation 的 profile 键（原 `aD`）：同 profile 只保留一个连接。 */
function connectionProfileKey(connection: ChromeProviderConnection): string {
  const info = connection.providerInfo;
  return JSON.stringify([
    info.protocolVersion,
    info.browserFamily,
    info.buildChannel,
    info.extensionId,
    info.profileInstanceId,
  ]);
}

// ---------------------------------------------------------------------------
// UnsubscribeOnce（原 `UOe`）
// ---------------------------------------------------------------------------

/** 一次性退订句柄（原 `UOe`）。 */
class UnsubscribeOnce extends (EventEmitterBase as new () => {}) {
  unsubscribeOnce: (() => void) | null;

  constructor(unsubscribeOnce: () => void) {
    super();
    this.unsubscribeOnce = unsubscribeOnce;
  }

  unsubscribe() {
    const unsubscribe = this.unsubscribeOnce;
    this.unsubscribeOnce = null;
    unsubscribe?.();
  }

  [Symbol.dispose]() {
    this.unsubscribe();
  }
}

// ---------------------------------------------------------------------------
// chrome provider 连接工厂（原 `WOe`/`GOe`）
// ---------------------------------------------------------------------------

/** prod 渠道的连接参数（原 `GOe`）。 */
function chromeProviderExpectations() {
  return { buildChannel: "prod" as const, extensionIds: chromeExtensionIdsForChannel("prod") };
}

/** 默认连接工厂（原 `WOe`）：按 prod 渠道期望发现 pipe 客户端。 */
function defaultChromeProviderConnector(): () => Promise<ChromeProviderConnection[]> {
  const expectations = chromeProviderExpectations();
  return () => discoverPipeClients({ expectedBuildChannel: expectations.buildChannel, expectedExtensionIds: expectations.extensionIds }) as unknown as Promise<ChromeProviderConnection[]>;
}

// ---------------------------------------------------------------------------
// IabTabMentions（原 `HOe`）
// ---------------------------------------------------------------------------

const CHROME_DISCOVERY_INTERVAL_MS = 5e3;

interface MentionCandidate {
  browserId: string;
  browserFamily: string;
  faviconUrl: string | null;
  pluginId: string;
  recency: number;
  snapshot: { title: string; url: string };
  source: string;
  tabId: string;
}

interface RpcSubscription {
  dup(): RpcSubscription;
  onRpcBroken(cb: () => void): void;
  [Symbol.dispose](): void;
}

/** IAB 标签提及服务（原 `HOe`）。 */
class IabTabMentions extends (EventEmitterBase as new () => {}) {
  iabTabMentions: {
    search(origin: Electron.WebContents, conversationId: string, query: string, limit: number): Promise<{ candidates: MentionCandidate[] }>;
    subscribeInvalidations(cb: () => void): () => void;
  };
  origin: Electron.WebContents;
  connectChromeProviders: () => Promise<ChromeProviderConnection[]>;
  listeners = new Set<(invalidate: () => void) => RpcSubscription>();
  chromeConnectionCleanups = new Map<ChromeProviderConnection, () => void>();
  chromeConnections: ChromeProviderConnection[] = [];
  chromeDiscoveryNeeded = true;
  lastChromeDiscoveryAt = -Number.POSITIVE_INFINITY;
  chromeConnectionAttempt: Promise<ChromeProviderConnection[]> | null = null;
  unsubscribeIabInvalidations: (() => void) | null = null;
  disposed = false;

  constructor(
    iabTabMentions: IabTabMentions["iabTabMentions"],
    origin: Electron.WebContents,
    connectChromeProviders: () => Promise<ChromeProviderConnection[]> = defaultChromeProviderConnector(),
  ) {
    super();
    this.iabTabMentions = iabTabMentions;
    this.origin = origin;
    this.connectChromeProviders = connectChromeProviders;
    origin.once("destroyed", () => this[Symbol.dispose]());
  }

  /** 双源搜索（原 `search`）：IAB 标签 + Chrome 扩展标签，合并去重截断。 */
  async search(request: unknown): Promise<{ candidates: MentionCandidate[] }> {
    const parsed = (tabMentionSearchSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { conversationId: string; query: string } } }).safeParse(request);
    if (!parsed.success || this.disposed) return { candidates: [] };
    const { conversationId, query } = parsed.data!;
    const [iabCandidates, chromeCandidates] = await Promise.all([
      Promise.resolve(
        this.iabTabMentions.search(this.origin, conversationId, query, candidateLimitForQuery(query)),
      ),
      this.searchChromeTabs(query),
    ]);
    return {
      candidates: (dedupeTabCandidates as unknown as (candidates: MentionCandidate[], query: string) => MentionCandidate[])(
        [...iabCandidates.candidates, ...chromeCandidates],
        query,
      ).slice(0, candidateLimitForQuery(query)),
    };
  }

  /** Chrome 标签存活检查（原 `getChromeTabLiveness`）。 */
  async getChromeTabLiveness(request: unknown): Promise<{ status: string; liveTabIds?: string[] }> {
    const parsed = (chromeTabLivenessSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { tabIds: string[]; extensionInstanceId: string } } }).safeParse(request);
    if (!parsed.success || this.disposed) return { status: "unavailable" };
    const tabIds = [...new Set(parsed.data!.tabIds)];
    if (tabIds.length === 0) return { status: "available", liveTabIds: [] };
    const connection = (await this.refreshChromeConnections()).find(
      ({ providerInfo }) => providerInfo.profileInstanceId === parsed.data!.extensionInstanceId,
    );
    if (connection == null) return { status: "unavailable" };
    try {
      const tabs = await connection.client.getUserTabs({ includeFavicons: false, limit: 100, query: "" });
      const liveIds = new Set(
        tabs.filter(({ browserId }) => browserId === parsed.data!.extensionInstanceId).map(({ id }) => id),
      );
      // 满 100 仍未见目标 → 可能有更多分页，视为不可判定。
      return tabs.length >= 100 && tabIds.some((id) => !liveIds.has(id))
        ? { status: "unavailable" }
        : { status: "available", liveTabIds: tabIds.filter((id) => liveIds.has(id)) };
    } catch {
      return { status: "unavailable" };
    }
  }

  /** 聚焦 Chrome 标签（原 `focusChromeTab`）。 */
  async focusChromeTab(request: unknown) {
    const parsed = (chromeTabFocusSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { tabId: string; extensionInstanceId: string } } }).safeParse(request);
    if (!parsed.success || this.disposed) throw new Error("Invalid Chrome tab focus request");
    const connection = (await this.refreshChromeConnections()).find(
      ({ providerInfo }) => providerInfo.profileInstanceId === parsed.data!.extensionInstanceId,
    );
    if (connection == null) throw new Error("Chrome browser is unavailable");
    await connection.client.focusTab(parsed.data!.tabId);
  }

  /** 订阅失效通知（原 `subscribeInvalidations`）：Chrome/IAB 任一失效即触发。 */
  subscribeInvalidations(subscription: RpcSubscription): UnsubscribeOnce {
    const stream = subscription.dup();
    this.listeners.add(stream as never);
    this.ensureIabInvalidations();
    stream.onRpcBroken(() => this.removeListener(stream as never));
    return new UnsubscribeOnce(() => {
      this.removeListener(stream as never);
    });
  }

  [Symbol.dispose]() {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeIabInvalidations?.();
    this.unsubscribeIabInvalidations = null;
    for (const cleanup of this.chromeConnectionCleanups.values()) cleanup();
    this.chromeConnectionCleanups.clear();
    for (const connection of this.chromeConnections) connection.client.close();
    this.chromeConnections = [];
    for (const stream of this.listeners) (stream as unknown as RpcSubscription)[Symbol.dispose]();
    this.listeners.clear();
  }

  private async searchChromeTabs(query: string): Promise<MentionCandidate[]> {
    const results = await Promise.all(
      (await this.refreshChromeConnections()).flatMap(async (connection) => {
        try {
          const tabs = await connection.client.getUserTabs({ includeFavicons: true, limit: 25, query });
          return tabs.flatMap((tab) => {
            const candidate = tab as unknown as { url: string | null; browserId: string; faviconUrl?: string | null; providerTabId: string; title: string; lastOpened: string };
            return candidate.url == null
              ? []
              : [
                  {
                    browserId: candidate.browserId,
                    browserFamily: connection.providerInfo.browserFamily,
                    faviconUrl: candidate.faviconUrl ?? null,
                    pluginId: (browserPluginDescriptor as unknown as { browser: string }).browser,
                    recency: Date.parse(candidate.lastOpened),
                    snapshot: { title: candidate.title, url: candidate.url },
                    source: "extension",
                    tabId: candidate.providerTabId,
                  },
                ];
          });
        } catch {
          this.discardConnection(connection);
          return [];
        }
      }),
    );
    return results.flat();
  }

  /** Chrome 连接的发现/去重/复活防护（原 `#t`）。 */
  private async refreshChromeConnections(): Promise<ChromeProviderConnection[]> {
    if (this.disposed) return [];
    if (this.chromeConnectionAttempt == null) {
      if (!this.chromeDiscoveryNeeded && Date.now() - this.lastChromeDiscoveryAt < CHROME_DISCOVERY_INTERVAL_MS)
        return this.chromeConnections;
      this.chromeDiscoveryNeeded = false;
      this.lastChromeDiscoveryAt = Date.now();
      this.chromeConnectionAttempt = this.connectChromeProviders()
        .then((discovered) => {
          if (this.disposed) {
            for (const connection of discovered) connection.client.close();
            return [];
          }
          const merged: ChromeProviderConnection[] = [];
          const byGenerationKey = new Map(this.chromeConnections.map((connection) => [connectionKeyWithGeneration(connection), connection]));
          const generationKeyByProfileKey = new Map(this.chromeConnections.map((connection) => [connectionProfileKey(connection), connectionKeyWithGeneration(connection)]));
          const seenProfileKeys = new Set<string>();
          for (const connection of discovered) {
            const generationKey = connectionKeyWithGeneration(connection);
            const profileKey = connectionProfileKey(connection);
            if (seenProfileKeys.has(profileKey)) {
              connection.client.close();
              continue;
            }
            seenProfileKeys.add(profileKey);
            const existing = byGenerationKey.get(generationKey);
            if (existing != null) {
              byGenerationKey.delete(generationKey);
              if (!existing.client.isClosed()) {
                merged.push(existing);
                if (existing !== connection) connection.client.close();
                continue;
              }
              this.detachConnection(existing);
              existing.client.close();
            }
            const staleGenerationKey = generationKeyByProfileKey.get(profileKey);
            if (staleGenerationKey != null) {
              const stale = byGenerationKey.get(staleGenerationKey);
              if (stale != null) {
                byGenerationKey.delete(staleGenerationKey);
                this.detachConnection(stale);
                stale.client.close();
              }
            }
            let removeClose: () => void = () => {};
            let removeInvalidate: () => void = () => {};
            try {
              if (connection.client.isClosed()) {
                connection.client.close();
                continue;
              }
              removeClose = connection.client.addCloseListener(() => {
                this.discardConnection(connection);
              });
              if (connection.client.isClosed()) {
                removeClose();
                connection.client.close();
                continue;
              }
              removeInvalidate = connection.client.addInvalidationListener(() => {
                this.notifyInvalidations();
              });
              this.chromeConnectionCleanups.set(connection, () => {
                removeInvalidate();
                removeClose();
              });
              merged.push(connection);
            } catch {
              removeClose();
              removeInvalidate();
              connection.client.close();
            }
          }
          for (const connection of byGenerationKey.values()) merged.push(connection);
          this.chromeConnections = merged;
          return merged;
        })
        .catch(() => this.chromeConnections)
        .finally(() => {
          this.chromeConnectionAttempt = null;
        });
      return this.chromeConnectionAttempt;
    }
    return this.chromeConnectionAttempt;
  }

  private discardConnection(connection: ChromeProviderConnection) {
    if (!this.chromeConnections.includes(connection)) return;
    this.detachConnection(connection);
    this.chromeConnections = this.chromeConnections.filter((entry) => entry !== connection);
    this.chromeDiscoveryNeeded = true;
    connection.client.close();
    this.notifyInvalidations();
  }

  private detachConnection(connection: ChromeProviderConnection) {
    this.chromeConnectionCleanups.get(connection)?.();
    this.chromeConnectionCleanups.delete(connection);
  }

  private notifyInvalidations() {
    for (const stream of this.listeners) {
      try {
        const scope = stream as unknown as { (invalidate: () => void): unknown };
        void scope(() => {});
      } catch {
        // 订阅方失效由 onRpcBroken 兜底。
      }
    }
  }

  private ensureIabInvalidations() {
    this.unsubscribeIabInvalidations ??= this.iabTabMentions.subscribeInvalidations(() => {
      this.notifyInvalidations();
    });
  }

  private removeListener(stream: (invalidate: () => void) => unknown) {
    if (this.listeners.delete(stream as never)) {
      (stream as unknown as RpcSubscription)[Symbol.dispose]();
      if (this.listeners.size === 0) {
        this.unsubscribeIabInvalidations?.();
        this.unsubscribeIabInvalidations = null;
      }
    }
  }
}

export {
  IabTabMentions,
  UnsubscribeOnce,
  connectionKeyWithGeneration,
  connectionProfileKey,
  defaultChromeProviderConnector,
  type ChromeProviderConnection,
  type MentionCandidate,
};
