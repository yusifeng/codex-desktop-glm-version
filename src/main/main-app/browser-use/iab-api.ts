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
  /** Electron webContents id used to route native page events back to a tab. */
  webContentsId?: number;
  /** Original browser-use provider tab id, when it differs from the local id. */
  browserTabId?: string;
  routeKey?: string;
  pageKey?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
}

/** browser-use 会话路由键。 */
export interface IabSessionRoute {
  conversationId: string;
  session_id?: string;
  routeKey: string;
}

/** CDP 事件监听器。 */
export type CdpEventListener = (event: { method: string; params?: unknown; sessionId?: string; source?: { tabId?: string; sessionId?: string; targetId?: string } }) => void;

/** 页面状态监听器。 */
export type PageStateEventListener = (event: { type: string; [key: string]: unknown }) => void;

export interface WebMcpToolInvocation {
  session_id: string;
  tabId: string;
  toolName: string;
  turn_id: string;
  parentCallId?: string;
}

/** 下载变更监听器。 */
export type BrowserUseDownloadChangeListener = (change: { path: string; tabId: string }) => void;

export interface BrowserUseDownloadGrant {
  expiresAtMs: number;
  url?: string;
  sessionId?: string;
}

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
  private debuggerTargetSessionsByTabId = new Map<string, Map<string, string>>();
  private debuggerTargetIdsBySessionId = new Map<string, string>();
  private pageCapturePaintLeaseWebContentsByTabId = new Map<string, number>();
  private cachedCdpExpressions = new Map<string, unknown>();
  private cdpEventListeners = new Set<{ listener: CdpEventListener; tabIds?: Set<string> }>();
  private cdpDetachListeners = new Set<() => void>();
  private downloadChangeListeners = new Set<BrowserUseDownloadChangeListener>();
  private pageEventListeners = new Set<PageStateEventListener>();
  private allowedDownloadGrantsByWebContentsId = new Map<number, BrowserUseDownloadGrant>();
  private cursorArrivalWaitersByMoveSequence = new Map<number, { resolve: () => void; reject: (error: Error) => void }>();
  private selectedTabIdsByRouteKey = new Map<string, string>();
  private hostsByRouteKey = new Map<string, unknown>();
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

  getRequiredBrowserHost(session: { conversationId: string; routeKey?: string }): unknown {
    const host = this.getBrowserHost(session);
    if (host == null) throw new Error(`No in-app Browser host is available for browser session ${session.conversationId}`);
    return host;
  }

  rememberBrowserHost(route: { routeKey: string; conversationId?: string }, host?: unknown): void {
    if (host == null && route.conversationId != null) host = this.getBrowserHost({ conversationId: route.conversationId, routeKey: route.routeKey });
    if (host != null) this.hostsByRouteKey.set(route.routeKey, host);
  }

  getBrowserHostsForSession(route: { routeKey: string }): unknown {
    return this.hostsByRouteKey.get(route.routeKey) ?? null;
  }

  releaseSessionControl(route: { routeKey: string }): void {
    this.selectedTabIdsByRouteKey.delete(route.routeKey);
    this.pendingVisibilityRouteKeys.delete(route.routeKey);
    this.pendingViewportSizesByRouteKey.delete(route.routeKey);
  }

  recordBrowserUseTurn(session: { conversationId: string }, request: { turn_id?: unknown }): void {
    if (typeof request.turn_id !== "string" || request.turn_id.length === 0) return;
    const turns = this.usedTurnIdsByConversationId.get(session.conversationId) ?? new Set<string>();
    turns.add(request.turn_id);
    this.usedTurnIdsByConversationId.set(session.conversationId, turns);
  }

  clearRecordedBrowserUseTurn(session: { conversationId: string }, turnId: string): void {
    const turns = this.usedTurnIdsByConversationId.get(session.conversationId);
    if (turns == null) return;
    turns.delete(turnId);
    if (turns.size === 0) this.usedTurnIdsByConversationId.delete(session.conversationId);
  }

  getTab(tabId: string): IabTabSnapshot | null {
    return this.tabsById.get(tabId) ?? null;
  }

  requireLiveTab(tabId: string): IabTabSnapshot {
    const tab = this.getTab(tabId);
    if (tab == null) throw new Error(`Unknown tab: ${tabId}`);
    return tab;
  }

  forgetRouteTabId(route: { routeKey: string }, tabId?: string): void {
    const selected = this.selectedTabIdsByRouteKey.get(route.routeKey);
    if (tabId == null || selected === tabId) this.selectedTabIdsByRouteKey.delete(route.routeKey);
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

  /** CDP 事件分发（原 `emitCdpEvent`，支持按 tab 过滤）。 */
  emitCdpEvent(event: Parameters<CdpEventListener>[0]): void {
    const tabId = event.source?.tabId;
    for (const entry of this.cdpEventListeners) {
      if (entry.tabIds != null && (tabId == null || !entry.tabIds.has(tabId))) continue;
      entry.listener(event);
    }
  }

  /** CDP target/session 双向映射（原 debuggerSessionIdForTarget 等）。 */
  debuggerSessionIdForTarget(tabId: string, targetId: string): string | null {
    return this.debuggerTargetSessionsByTabId.get(tabId)?.get(targetId) ?? null;
  }

  rememberDebuggerTargetSession(tabId: string, targetId: string, sessionId: string): void {
    const targets = this.debuggerTargetSessionsByTabId.get(tabId) ?? new Map<string, string>();
    targets.set(targetId, sessionId);
    this.debuggerTargetSessionsByTabId.set(tabId, targets);
    this.debuggerTargetIdsBySessionId.set(sessionId, targetId);
  }

  getDebuggerTargetIdForSession(sessionId: string): string | null {
    return this.debuggerTargetIdsBySessionId.get(sessionId) ?? null;
  }

  forgetDebuggerTargetSession(sessionId: string): void {
    this.debuggerTargetIdsBySessionId.delete(sessionId);
    for (const [tabId, targets] of this.debuggerTargetSessionsByTabId) {
      for (const [targetId, mappedSessionId] of targets) if (mappedSessionId === sessionId) targets.delete(targetId);
      if (targets.size === 0) this.debuggerTargetSessionsByTabId.delete(tabId);
    }
  }

  forgetDebuggerTargetSessionsForTab(tabId: string): void {
    const targets = this.debuggerTargetSessionsByTabId.get(tabId);
    if (targets == null) return;
    for (const sessionId of targets.values()) this.debuggerTargetIdsBySessionId.delete(sessionId);
    this.debuggerTargetSessionsByTabId.delete(tabId);
  }

  /** 页面事件监听（原 `addPageEventListener`）。 */
  addPageEventListener(listener: (event: { type: string }) => void): () => void {
    this.pageEventListeners.add(listener);
    return () => this.pageEventListeners.delete(listener);
  }

  /** WebMCP 调用通知（原 `notifyWebMcpToolInvoked`）。 */
  notifyWebMcpToolInvoked(invocation: WebMcpToolInvocation): void {
    const session = { conversationId: invocation.session_id };
    const host = this.getBrowserHost(session) as {
      routeKey?: string;
      setWebMcpToolActivity?: (toolName: string, browserTabId: string, parentCallId?: string) => void;
    } | null;
    const tab = this.tabsById.get(invocation.tabId);
    if (host == null || tab == null || tab.routeKey !== host.routeKey) return;

    this.recordBrowserUseTurn(session, invocation);
    this.markBrowserUseCommandForTab(session, tab);
    host.setWebMcpToolActivity?.(
      invocation.toolName,
      tab.browserTabId ?? tab.browser_id ?? tab.id,
      invocation.parentCallId,
    );
  }

  /** 将 native page 事件按 webContents id 映射到 tab 并广播。 */
  notifyPageEvent(sessionId: string, webContentsId: number, event: { type: string; [key: string]: unknown }): void {
    const tabId = this.getTabIdForWebContentsId(webContentsId);
    if (tabId == null) return;
    for (const listener of this.pageEventListeners) listener({ ...event, session_id: sessionId, tabId });
  }

  private getTabIdForWebContentsId(webContentsId: number): string | null {
    for (const [tabId, tab] of this.tabsById) if (tab.webContentsId === webContentsId) return tabId;
    return null;
  }

  private markBrowserUseCommandForTab(
    session: { conversationId: string },
    tab: IabTabSnapshot,
  ): void {
    const host = this.getBrowserHost(session) as {
      routeKey?: string;
      activateBrowserUseNavigationRestriction?: (pageKey: string) => void;
      setBrowserUseActive?: (active: boolean, browserTabId: string) => void;
    } | null;
    if (host == null) return;
    const tabId = tab.browserTabId ?? tab.browser_id ?? tab.id;
    if (tab.sessionControlled !== true) this.tabsById.set(tab.id, { ...tab, sessionControlled: true });
    host.activateBrowserUseNavigationRestriction?.(tab.pageKey ?? tab.id);
    host.setBrowserUseActive?.(true, tabId);
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
  allowDownload(webContentsId: number, ttlMs: number, grant: { url?: string; sessionId?: string } = {}): void {
    this.allowedDownloadGrantsByWebContentsId.set(webContentsId, {
      ...grant,
      expiresAtMs: Date.now() + ttlMs,
    });
  }

  /** 消费允许的下载（原 `[zY]`）。 */
  [CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD](webContentsId: number): boolean;
  [CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD](request: { url: string; urlChain?: string[]; webContentsId: number }): { sessionId?: string; url: string } | null;
  [CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD](input: number | { url: string; urlChain?: string[]; webContentsId: number }): boolean | { sessionId?: string; url: string } | null {
    const webContentsId = typeof input === "number" ? input : input.webContentsId;
    const grant = this.allowedDownloadGrantsByWebContentsId.get(webContentsId);
    if (grant == null || Date.now() >= grant.expiresAtMs) {
      this.allowedDownloadGrantsByWebContentsId.delete(webContentsId);
      return typeof input === "number" ? false : null;
    }
    if (typeof input !== "number") {
      if (grant.url == null || grant.url !== input.url) return null;
      this.allowedDownloadGrantsByWebContentsId.delete(webContentsId);
      return { sessionId: grant.sessionId, url: grant.url };
    }
    this.allowedDownloadGrantsByWebContentsId.delete(webContentsId);
    return true;
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
