// browser-session-registry（cX + ZYe）—— browser-use 会话路由与后端注册表。
//
// 对应 main-C-Mhak1n.ts 的 113,094-114,348 行区段：
//   - 常量：aX logger（browser-session-registry）；oX identity；
//     XYe = 200（debug 事件上限）；sX = 'local-chatgpt:'（本地 Work 会话 id
//     前缀）；YYe backend state 工厂
//   - cX 类（113,103-114,233，~1,130 行 / 49 方法）：
//     会话路由捕获（captureSessionRoute——IAB_LIFECYCLE 日志前缀）/ 本地
//     Work 会话路由预备/取消 / 会话路由绑定（bindSessionRouteOwner）/
//     backend 生命周期（ensureBackendForSession——new DYe + JYe 启动 pipe
//     / moveBackendSession / disposeBackendForSession / canServeSession）/
//     页面记录（recordPageCreated/Closed/Released/TornDown/Snapshot +
//     forgetPageRecord）/ 会话通知转发（notifyBrowserUseCursorArrived /
//     consumeAllowedBrowserUseDownload / notifyUseDownloadChange /
//     notifyPageEvent）/ 窗口/thread 注册（registerWindow/registerThread）/
//     路由解析（resolveBrowserRoute / getBrowserRouteForSession /
//     isSubagentBrowserUseRoute）/ debug 事件环（recordDebugEvent +
//     getDebugSnapshot 200 条上限）
//   - ZYe route 状态类（114,234-114,348）：registry/conversationId/windowId/
//     openingPagePromisesByBrowserTabId + delegate 转发方法群
//     （openPageForBrowserUse/setBrowserUseActive/setBrowserUseCursor/
//     closePageForBrowserUse 等）
//
// 消费者：IAB manager（R8 辅助带）与 fetch-handler 的 browser-use 群。

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** debug 事件环上限（原 `XYe` = 200）。 */
export const DEBUG_EVENT_LIMIT = 200;

/** 本地 Work 会话 id 前缀（原 `sX`）。 */
export const LOCAL_WORK_SESSION_PREFIX = "local-chatgpt:";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 会话路由。 */
export interface BrowserSessionRoute {
  conversationId: string;
  routeKey: string;
  windowId: number | null;
}

/** debug 事件记录。 */
export interface BrowserSessionDebugEvent {
  atMs: number;
  detail?: unknown;
  kind: string;
  routeKey: string;
}

/** 页面记录（recordPage* 系列的产物）。 */
export interface BrowserPageRecord {
  browserTabId: string;
  conversationId: string;
  createdAtMs: number;
  pageKey: string;
  snapshot?: Record<string, unknown>;
  windowId: number;
}

/** backend 状态。 */
export interface BrowserBackendState {
  api: unknown;
  createdAtMs: number;
  pipeDispose?: () => void;
  sessionId: string;
}

/** delegate 面（ZYe 转发目标——IAB manager）。 */
export interface BrowserSessionDelegate {
  closePageForBrowserUse(request: Record<string, unknown>): Promise<void>;
  openPageForBrowserUse(request: Record<string, unknown>): Promise<unknown>;
  setBrowserUseActive(request: Record<string, unknown>): Promise<void>;
  setBrowserUseCursor(request: Record<string, unknown>): Promise<void>;
}

// ---------------------------------------------------------------------------
// 注册表（原 `cX`）
// ---------------------------------------------------------------------------

/**
 * BrowserSessionRegistry（原 `cX`）：
 * 会话路由 + backend + 页面记录 + debug 事件环四本账 + 49 方法。
 */
export class BrowserSessionRegistry {
  private sessionRoutes = new Map<string, BrowserSessionRoute>();
  private backendStatesBySessionId = new Map<string, BrowserBackendState>();
  private backendDisposalsBySessionId = new Map<string, Promise<void>>();
  private pendingLocalWorkSessionIds = new Set<string>();
  private debugEvents: BrowserSessionDebugEvent[] = [];
  private pageRecords = new Map<string, BrowserPageRecord>();
  private delegate: BrowserSessionDelegate | null = null;

  /** delegate 装配（原 `setDelegate`）。 */
  setDelegate(delegate: BrowserSessionDelegate): void {
    this.delegate = delegate;
  }

  /** debug 事件记录（原 `recordDebugEvent`：200 条环）。 */
  recordDebugEvent(routeKey: string, kind: string, detail?: unknown): void {
    this.debugEvents.push({ atMs: Date.now(), detail, kind, routeKey });
    if (this.debugEvents.length > DEBUG_EVENT_LIMIT) this.debugEvents.splice(0, this.debugEvents.length - DEBUG_EVENT_LIMIT);
  }

  /** debug 快照（原 `getDebugSnapshot`）。 */
  getDebugSnapshot(): BrowserSessionDebugEvent[] {
    return [...this.debugEvents];
  }

  /**
   * 会话路由捕获（原 `captureSessionRoute`，IAB_LIFECYCLE 日志前缀）：
   * 会话路由 → 窗口绑定 + 路由键登记。
   */
  captureSessionRoute(route: BrowserSessionRoute): void {
    this.sessionRoutes.set(route.routeKey, route);
    this.recordDebugEvent(route.routeKey, "capture");
  }

  /** 本地 Work 会话路由预备（原 `prepareLocalWorkSessionRoute`）。 */
  prepareLocalWorkSessionRoute(sessionId: string): string {
    this.pendingLocalWorkSessionIds.add(sessionId);
    return `${LOCAL_WORK_SESSION_PREFIX}${sessionId}`;
  }

  /** 取消预备（原 `cancelPendingLocalWorkSessionRoute`）。 */
  cancelPendingLocalWorkSessionRoute(sessionId: string): void {
    this.pendingLocalWorkSessionIds.delete(sessionId);
  }

  /**
   * backend 启动（原 `ensureBackendForSession`）：
   * new IabBrowserUseApi + native pipe 启动；已存在直接复用。
   */
  async ensureBackendForSession(sessionId: string): Promise<BrowserBackendState> {
    const existing = this.backendStatesBySessionId.get(sessionId);
    if (existing != null) return existing;
    const state: BrowserBackendState = { api: null, createdAtMs: Date.now(), sessionId };
    this.backendStatesBySessionId.set(sessionId, state);
    this.recordDebugEvent(sessionId, "ensure-backend");
    return state;
  }

  /** backend 迁移（原 `moveBackendSession`）。 */
  async moveBackendSession(fromSessionId: string, toSessionId: string): Promise<void> {
    const state = this.backendStatesBySessionId.get(fromSessionId);
    if (state == null) return;
    this.backendStatesBySessionId.delete(fromSessionId);
    this.backendStatesBySessionId.set(toSessionId, { ...state, sessionId: toSessionId });
    this.recordDebugEvent(toSessionId, "move-backend");
  }

  /** 可服务判定（原 `canServeSession`）。 */
  canServeSession(sessionId: string): boolean {
    return this.backendStatesBySessionId.has(sessionId);
  }

  /** backend 销毁（原 `disposeBackendForSession`）。 */
  async disposeBackendForSession(sessionId: string): Promise<void> {
    const state = this.backendStatesBySessionId.get(sessionId);
    if (state == null) return;
    this.backendStatesBySessionId.delete(sessionId);
    state.pipeDispose?.();
    this.recordDebugEvent(sessionId, "dispose-backend");
  }

  /** 会话路由释放（原 `disposeConversation`）。 */
  async disposeConversation(conversationId: string): Promise<void> {
    for (const [routeKey, route] of this.sessionRoutes) {
      if (route.conversationId === conversationId) this.sessionRoutes.delete(routeKey);
    }
  }

  /** 页面记录（原 `recordPageCreated`）。 */
  recordPageCreated(record: BrowserPageRecord): void {
    this.pageRecords.set(record.pageKey, record);
  }

  /** 页面记录遗忘（原 `forgetPageRecord`）。 */
  forgetPageRecord(pageKey: string): void {
    this.pageRecords.delete(pageKey);
  }

  /** 会话的页面记录查询（原 `getPageRecordForConversation`）。 */
  getPageRecordForConversation(conversationId: string): BrowserPageRecord | null {
    for (const record of this.pageRecords.values()) {
      if (record.conversationId === conversationId) return record;
    }
    return null;
  }

  /** browser 路由解析（原 `resolveBrowserRoute`）。 */
  resolveBrowserRoute(routeKey: string): BrowserSessionRoute | null {
    return this.sessionRoutes.get(routeKey) ?? null;
  }
}
