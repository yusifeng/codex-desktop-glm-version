// IAB browser-use API（DYe 巨类）—— 内嵌浏览器 tab 会话的完整 API 面。
//
// 对应 main-C-Mhak1n.ts 的 111,422-112,805 行区段：
//   - 常量带（111,422-111,434）：IY='about:blank'；超时 yYe 15s/bYe 20s/
//     xYe 1500/SYe 3s/CYe 1s/wYe 16/TYe 10s；EYe='tabs_content'；
//     下载 Symbol 协议（RY addBrowserUseDownloadChangeListener /
//     zY consumeAllowedBrowserUseDownload / BY notifyBrowserUseDownloadChange）
//   - DYe 类（111,435-112,805，~1,370 行）：21 个 Map/Set 字段 + 105 个方法
//     （完整清单见下方分组的导出面/方法签名——本骨架按分组承载）
//
// 方法分组（105 个）：
//   会话/路由（20）：requireBrowserUseSession / getBrowserUseSession /
//     ensureBrowserUseSessionRoute / runLoggedRequest / getRequestSafeFields /
//     getRequiredBrowserHost / rememberBrowserHost / getBrowserHostsForSession /
//     setPendingCapabilityIntent / applyPendingCapabilityIntents /
//     clearPendingCapabilityIntents / disposeRoute / reassignRoute / dispose /
//     releaseSessionControl / turnEnded / recordBrowserUseTurn /
//     clearRecordedBrowserUseTurn / usedTurnIdsByConversationId 清理
//   tab 生命周期（22）：getTabs / createTab / closeTab / releaseTab /
//     removeTab / focusTab / focusTabForBrowserRoute / nameSession / markTab /
//     getTab / requireLiveTab / getTabForCommand / serializeTab /
//     getTabsForBrowserUse / createTabForBrowserUse / nameSessionForBrowserUse /
//     updateTabsForSession / pruneMissingTabs / moveRouteTabId /
//     getSelectedOrFirstControlledTabForSession / updateTabForPage /
//     updateTabForInfo / requireBrowserUseTab / forgetRouteTabId
//   CDP/debugger（22）：attach / attachTarget / detach / detachTarget /
//     executeCdp / executeCdpWithCachedExpression / addCdpEventListener /
//     addCdpDetachListener / executeUnhandledCommand / registerDebuggerListener /
//     unregisterDebuggerListener / recordDebuggerTargetEvent / emitCdpEvent /
//     attachTab / attachDebuggerTarget / detachDebuggerTarget /
//     debuggerSessionIdForTarget / rememberDebuggerTargetSession /
//     forgetDebuggerTargetSession / forgetDebuggerTargetSessionsForTab /
//     detachTab / ensureTabReadyForCdp / waitForTabReadyForCdp /
//     executeEmulatedTargetCommand / executeCdpCommandWithCaptureSurface /
//     executeCdpCommand / sendDebuggerCommand / getDebuggerFrameTargetInfos /
//     executeCdpForBrowserUse / attachForBrowserUse / detachForBrowserUse /
//     cleanupDebuggerForTabBestEffort / detachBrowserUseTabsForHostsBestEffort
//   页面状态/事件（10）：addPageEventListener / notifyWebMcpToolInvoked /
//     notifyPageEvent / registerPageStateListener / unregisterPageStateListener /
//     updateTabNavigationState / shouldAutoBootstrapNavigateCommand /
//     getCdpNavigationUrl / getHistoryNavigationUrl /
//     emitBrowserUseNavigationBlockedEvent
//   指针/交互（7）：moveMouse / notifyCursorArrived / waitForCursorArrival /
//     resolveCursorArrivalWaiter / resolveAllCursorArrivalWaiters /
//     assertCurrentPageAllowed / assertTabMatchesCurrentBrowserUsePage
//   截图/绘制租约（5）：acquirePageCapturePaintLease /
//     releasePageCapturePaintLease / waitForCaptureSurface /
//     executeCdpCommandWithCaptureSurface / restorePageClipboards
//   下载（4）：allowDownload / pruneExpiredAllowedDownloadGrants +
//     downloadChangeListeners + allowedDownloadGrantsByWebContentsId
//   信息/杂项（8）：ping / getInfo / getUserHistory / getMetadata /
//     markBrowserUseCommandForTab / clearDestroyedTabRuntimes /
//     getTabIdForWebContentsId / cachedCdpExpressions 管理
//
// 消费者：browser-session-registry 的 ensureBackendForSession（114,058 实例化）。

// ---------------------------------------------------------------------------
// 常量（原 111,422-111,434）
// ---------------------------------------------------------------------------

export const IAB_ABOUT_BLANK = "about:blank";
export const IAB_TIMEOUTS = {
  attachDebuggerMs: 15_000,
  commandMs: 20_000,
  cursorArrivalPollMs: 1_500,
  cursorArrivalTimeoutMs: 3_000,
  captureSurfacePollMs: 1_000,
  captureSurfaceRetries: 16,
  tabReadyTimeoutMs: 10_000,
} as const;
export const IAB_SESSION_CONTENT_KEY = "tabs_content";

/** 下载变更监听 Symbol（原 `RY`）。 */
export const ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER = Symbol("addBrowserUseDownloadChangeListener");

/** 消费允许的下载（原 `zY`）。 */
export const CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD = Symbol("consumeAllowedBrowserUseDownload");

/** 下载变更通知（原 `BY`）。 */
export const NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE = Symbol("notifyBrowserUseDownloadChange");

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** tab 序列化形态。 */
export interface IabTabSnapshot {
  browser_id: string;
  id: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

/** browser-use 会话路由键。 */
export interface IabSessionRoute {
  conversationId: string;
  routeKey: string;
}

/** CDP 事件监听器。 */
export type CdpEventListener = (event: { method: string; params?: unknown; sessionId?: string }) => void;

/** 页面状态监听器。 */
export type PageStateEventListener = (event: { type: string; [key: string]: unknown }) => void;

/** 下载变更监听器。 */
export type BrowserUseDownloadChangeListener = (change: { path: string; tabId: string }) => void;

export interface IabBrowserUseOptions {
  ensureSessionRoute?: (session: { conversationId: string }) => boolean;
  buildFlavor?: string;
  appSessionId?: string;
  cdpCommandTimeoutMs?: number;
  cursorArrivalTimeoutMs?: number;
  initialPageUrl?: string;
  pageReadyTimeoutMs?: number;
}

// ---------------------------------------------------------------------------
// IAB API（原 `DYe`）
// ---------------------------------------------------------------------------

/**
 * IabBrowserUseApi（原 `DYe`）：
 * 21 字段状态容器 + 105 方法 API 面（分组签名见类内注释；本骨架承载
 * 状态容器 + 会话/tab/CDP/监听器四组核心，其余分组按方法清单回填）。
 */
export class IabBrowserUseApi {
  private readonly ensureSessionRouteCallback?: IabBrowserUseOptions["ensureSessionRoute"];
  private readonly buildFlavor?: string;
  private readonly appSessionId?: string;
  private readonly cursorArrivalTimeoutMs: number;

  constructor(
    private readonly getBrowserHost: (session: { conversationId: string; routeKey?: string }) => unknown = () => null,
    disposeNavigationBlockedListener?: (listener: (event: unknown) => void) => () => void,
    options: IabBrowserUseOptions = {},
  ) {
    this.ensureSessionRouteCallback = options.ensureSessionRoute;
    this.buildFlavor = options.buildFlavor;
    this.appSessionId = options.appSessionId;
    this.cursorArrivalTimeoutMs = options.cursorArrivalTimeoutMs ?? IAB_TIMEOUTS.cursorArrivalPollMs;
    disposeNavigationBlockedListener?.(() => undefined);
  }
  // ---- 状态容器（原 21 字段）----
  private tabsById = new Map<string, IabTabSnapshot>();
  private tabRuntimesById = new Map<string, unknown>();
  private tabIdsByPageKey = new Map<string, Set<string>>();
  private tabIdsByRouteTabKey = new Map<string, string>();
  private debuggerListeners = new Map<number, Array<(event: unknown) => void>>();
  private pageStateListeners = new Map<string, Set<PageStateEventListener>>();
  private debuggerTargetSessionsByTabId = new Map<string, Set<string>>();
  private debuggerTargetIdsBySessionId = new Map<string, string>();
  private pageCapturePaintLeaseWebContentsByTabId = new Map<string, number>();
  private cachedCdpExpressions = new Map<string, unknown>();
  private cdpEventListeners = new Set<{ listener: CdpEventListener; tabIds?: Set<string> }>();
  private cdpDetachListeners = new Set<() => void>();
  private downloadChangeListeners = new Set<BrowserUseDownloadChangeListener>();
  private pageEventListeners = new Set<(event: { type: string }) => void>();
  private allowedDownloadGrantsByWebContentsId = new Map<number, { expiresAtMs: number }>();
  private cursorArrivalWaitersByMoveSequence = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
  private selectedTabIdsByRouteKey = new Map<string, string>();
  private hostsByRouteKey = new Map<string, string>();
  private pendingVisibilityRouteKeys = new Set<string>();
  private pendingViewportSizesByRouteKey = new Map<string, { height: number; width: number }>();
  private usedTurnIdsByConversationId = new Map<string, Set<string>>();

  /** ping（原 L111477）。 */
  ping(): string {
    return "pong";
  }

  /** 会话要求（原 `requireBrowserUseSession`）。 */
  requireBrowserUseSession(route: IabSessionRoute): { conversationId: string } {
    const session = this.getBrowserUseSession(route);
    if (this.ensureSessionRouteCallback?.(session) !== true) {
      throw new Error(`No ChatGPT browser route is available for browser session ${session.conversationId}`);
    }
    return session;
  }

  getBrowserUseSession(route: IabSessionRoute): { conversationId: string } {
    const conversationId = (route as { session_id?: unknown; conversationId?: unknown }).session_id ?? route.conversationId;
    if (typeof conversationId !== "string" || conversationId.length === 0) {
      throw new Error("Missing required browser session_id");
    }
    return { conversationId };
  }

  getRequestSafeFields(session: { conversationId: string }, request: { turn_id?: unknown }, name: string): Record<string, unknown> {
    return { conversationId: session.conversationId, request: name, turnId: request.turn_id ?? null };
  }

  getMetadata(session: { conversationId: string }): Record<string, string> {
    return {
      ...(this.buildFlavor == null ? {} : { codexAppBuildFlavor: this.buildFlavor }),
      ...(this.appSessionId == null ? {} : { codexAppSessionId: this.appSessionId }),
      codexSessionId: session.conversationId,
    };
  }

  /** tab 列表（原 `getTabs`/`getTabsForBrowserUse`）。 */
  getTabs(_route?: IabSessionRoute): IabTabSnapshot[] {
    return [...this.tabsById.values()];
  }

  /** 选中 tab（原 `getSelectedOrFirstControlledTabForSession`）。 */
  getSelectedOrFirstControlledTabForSession(route: IabSessionRoute): IabTabSnapshot | null {
    const selectedId = this.selectedTabIdsByRouteKey.get(route.routeKey);
    if (selectedId != null) return this.tabsById.get(selectedId) ?? null;
    return this.tabsById.values().next().value ?? null;
  }

  /** CDP 事件监听（原 `addCdpEventListener`：可选 tabIds 过滤）。 */
  addCdpEventListener(listener: CdpEventListener, tabIds?: Set<string>): () => void {
    const entry = { listener, tabIds };
    this.cdpEventListeners.add(entry);
    return () => this.cdpEventListeners.delete(entry);
  }

  /** CDP detach 监听（原 `addCdpDetachListener`）。 */
  addCdpDetachListener(listener: () => void): () => void {
    this.cdpDetachListeners.add(listener);
    return () => this.cdpDetachListeners.delete(listener);
  }

  /** 页面事件监听（原 `addPageEventListener`）。 */
  addPageEventListener(listener: (event: { type: string }) => void): () => void {
    this.pageEventListeners.add(listener);
    return () => this.pageEventListeners.delete(listener);
  }

  /** 下载变更监听（原 `[RY]` Symbol 协议）。 */
  [ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER](listener: BrowserUseDownloadChangeListener): () => void {
    this.downloadChangeListeners.add(listener);
    return () => this.downloadChangeListeners.delete(listener);
  }

  /** 下载变更通知（原 `[BY]`）。 */
  [NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE](change: { path: string; tabId: string }): void {
    for (const listener of this.downloadChangeListeners) listener(change);
  }

  /** 允许下载（原 `allowDownload`：按 webContentsId 授权 + 过期）。 */
  allowDownload(webContentsId: number, ttlMs: number): void {
    this.allowedDownloadGrantsByWebContentsId.set(webContentsId, { expiresAtMs: Date.now() + ttlMs });
  }

  /** 消费允许的下载（原 `[zY]`）。 */
  [CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD](webContentsId: number): boolean {
    const grant = this.allowedDownloadGrantsByWebContentsId.get(webContentsId);
    if (grant == null) return false;
    this.allowedDownloadGrantsByWebContentsId.delete(webContentsId);
    return Date.now() < grant.expiresAtMs;
  }

  /** 过期授权清理（原 `pruneExpiredAllowedDownloadGrants`）。 */
  pruneExpiredAllowedDownloadGrants(nowMs: number = Date.now()): void {
    for (const [id, grant] of this.allowedDownloadGrantsByWebContentsId) {
      if (nowMs >= grant.expiresAtMs) this.allowedDownloadGrantsByWebContentsId.delete(id);
    }
  }

  /** 指针到达通知（原 `notifyCursorArrived`：moveSequence 唤醒等待者）。 */
  notifyCursorArrived(moveSequence: number): void {
    const waiter = this.cursorArrivalWaitersByMoveSequence.get(moveSequence);
    if (waiter == null) return;
    this.cursorArrivalWaitersByMoveSequence.delete(moveSequence);
    waiter.resolve();
  }

  /** 会话路由释放（原 `disposeRoute`）。 */
  disposeRoute(route: IabSessionRoute): void {
    this.selectedTabIdsByRouteKey.delete(route.routeKey);
    this.hostsByRouteKey.delete(route.routeKey);
    this.pendingVisibilityRouteKeys.delete(route.routeKey);
    this.pendingViewportSizesByRouteKey.delete(route.routeKey);
  }

  /** 全量销毁（原 `dispose`）。 */
  dispose(): void {
    for (const waiter of this.cursorArrivalWaitersByMoveSequence.values()) waiter.reject(new Error("browser use session disposed"));
    this.cursorArrivalWaitersByMoveSequence.clear();
    this.cdpEventListeners.clear();
    this.cdpDetachListeners.clear();
    this.pageEventListeners.clear();
    this.downloadChangeListeners.clear();
    this.tabsById.clear();
    this.tabRuntimesById.clear();
    this.debuggerTargetSessionsByTabId.clear();
    this.debuggerTargetIdsBySessionId.clear();
  }
}
