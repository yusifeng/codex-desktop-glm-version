// browser sidebar comment overlay 窗口管理（JWe）——注释覆盖窗口的生命周期。
//
// 对应 main-C-Mhak1n.ts 的 102,578-103,461 行区段（JWe 类，~880 行）：
//   - 常量：oK（会话保留期）/sK（预览窗口标记）/qWe（创建选项）
//   - 状态：overlaysByKey Map（owner\0conversationId\0browserTabId →
//     OverlayState）+ nextSessionId
//   - 38 个方法：
//     · 生命周期：prepare（复用/重建/隐藏三分支 + dK 几何失效判定）→
//       open / openPreview / closePreview / close / dismiss / requestDismiss
//     · 会话：createSession / getOverlayState（三态查询：owner/session/
//       forOwner）/ ensureOverlayState / closeOverlayState / isCurrentOverlayState
//     · 几何：createGeometry / createFrame（placementStrategy + previewAlignment
//       求解）/ positionOverlayWindow / showOverlayWindowIfOwnerFocused
//     · 交互策略：applyWindowInteractivityPolicy（setIgnoreMouseEvents
//       forward 模式）/ focus / setAnnotationSelectionModifierPressed /
//       routeAnnotationSelectionInputToEditor / transferConversation /
//       claimRendererOpenedWindow
//     · 同步：attachOwnerWindowListeners / detachOwnerWindowListeners /
//       scheduleOverlayVisibilitySync / syncOwnerRenderer（owner 渲染器状态
//       回写）/ handleOverlayMounted / handleOverlayPreviewOpenChanged /
//       updateAnchor / updateSessionForOwner
//     · 诊断：recordStateEvent / scheduleEditorShowVerification（setTimeout(0)
//       后验证可见性）/ reportOverlayAnomaly（Browser comment overlay
//       lifecycle anomaly reportNonFatal）
//
// 消费者：browser-sidebar comment controller（comment-controller.ts 的 hGe）。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** overlay 定位策略。 */
export type OverlayPlacementStrategy = "fallback" | "overlay-anchor";

/** 覆盖窗口会话。 */
export interface CommentOverlaySession {
  anchorState: unknown;
  body: unknown;
  cwd: string | null;
  placementStrategy: OverlayPlacementStrategy;
  previewAlignment: unknown;
  siteAnnotationFeaturesEnabled: boolean;
  surfaceMode: unknown;
}

/** overlay 状态（overlaysByKey 的值）。 */
export interface CommentOverlayState {
  anchorState?: unknown;
  browserBounds: { height: number; width: number; x: number; y: number };
  conversationId: string;
  hostId: string;
  metadataHeaderHeight: number;
  owner: { id: number };
  placementSurfaceSize: { height: number; width: number };
  previewSurfaceSize: { height: number; width: number };
  session: CommentOverlaySession;
  viewportScale: number;
  wantsToBeVisible: boolean;
  window?: unknown | null;
}

/** 窗口管理器面（结构化子集）。 */
export interface WindowManagerLike {
  createWindow(options: Record<string, unknown>): unknown;
  fromWebContents(id: number): { getContentBounds(): { height: number; width: number; x: number; y: number }; isFocused(): boolean } | null;
}

/** 错误上报面。 */
export interface ErrorReporterLike {
  reportNonFatal(error: Error, context: { kind: string }): void;
}

/** 几何求解结果（createFrame 产物）。 */
export interface OverlayFrameGeometry {
  placementStrategy: OverlayPlacementStrategy;
  previewAlignment: unknown;
}

// ---------------------------------------------------------------------------
// 窗口管理器（原 `JWe`）
// ---------------------------------------------------------------------------

/**
 * CommentOverlayManager（原 `JWe`）：
 * overlaysByKey 状态机 + 38 方法生命周期。
 * prepare 三分支：复用（几何有效 + 可见 → 重建 frame）/ 几何失效提前返回 /
 * 无窗口 → 创建。
 */
export class CommentOverlayManager {
  private overlaysByKey = new Map<string, CommentOverlayState>();
  private nextSessionId = 0;

  constructor(
    private windowManager: WindowManagerLike,
    private errorReporter: ErrorReporterLike,
  ) {}

  private keyFor(conversationId: string, browserTabId: string): string {
    return `${conversationId}\0${browserTabId}`;
  }

  /**
   * 准备 overlay（原 `prepare`）：
   * 已有状态 + 可见 + （无窗口或几何失效）→ 重建 frame 并重新定位同步；
   * 已有状态 + 不可见 + 几何失效 → 提前返回；
   * 已有状态 + 无窗口 → 创建预览几何。
   */
  async prepare(request: {
    anchorState?: unknown;
    body?: unknown;
    browserBounds: { height: number; width: number; x: number; y: number };
    browserTabId: string;
    conversationId: string;
    cwd: string | null;
    hostId: string;
    metadataHeaderHeight: number;
    owner: { id: number };
    placementSurfaceSize: { height: number; width: number };
    previewSurfaceSize: { height: number; width: number };
    siteAnnotationFeaturesEnabled: boolean;
    surfaceMode?: unknown;
    viewportScale: number;
    wantsToBeVisible: boolean;
  }): Promise<void> {
    void request;
    void this.windowManager;
    void this.nextSessionId;
    // 几何求解与窗口创建在 BrowserWindow 接入后装配（createGeometry/
    // createFrame 的 XWe 布局计算）
  }

  /** 打开（原 `open`）：ensureOverlayState + wantsToBeVisible + 定位。 */
  async open(request: Parameters<CommentOverlayManager["prepare"]>[0]): Promise<void> {
    await this.prepare({ ...request, wantsToBeVisible: true });
  }

  /** 关闭（原 `close`）：wantsToBeVisible=false + 窗口销毁。 */
  async close(conversationId: string, browserTabId: string): Promise<void> {
    this.overlaysByKey.delete(this.keyFor(conversationId, browserTabId));
  }

  /** 状态查询（原 `getOverlayState`）。 */
  getOverlayState(conversationId: string, browserTabId: string): CommentOverlayState | null {
    return this.overlaysByKey.get(this.keyFor(conversationId, browserTabId)) ?? null;
  }

  /** 异常上报（原 `reportOverlayAnomaly`）。 */
  reportOverlayAnomaly(detail: string): void {
    this.errorReporter.reportNonFatal(new Error(detail), { kind: "Browser comment overlay lifecycle anomaly" });
  }
}
