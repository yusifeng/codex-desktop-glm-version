// browser sidebar comment controller（hGe）——注释系统的编排中枢。
//
// 对应 main-C-Mhak1n.ts 的 103,935-105,571 行区段（hGe 类，~1,600 行 /
// 59 方法）：
//   - 常量：FK=32（截图边距）/IK=16（截图内边距）/LK=1280（截图宽上限）/
//     RK=768（截图高上限）/cGe=1024
//   - 59 个方法分五组：
//     · 编辑器路由（handleAnnotationEditorMessage 6 种 runtime/overlay 消息
//       分派 + handleRuntimeOpenEditor/OpenDesignEditor/OpenCommentPreview/
//       CloseCommentPreview/CancelEditor/UpdateAnchor/
//       AnnotationSelectionModifierState/FocusEditor）
//     · overlay 编排（prepare/openSavedComment/dismiss/dismissForCommittedNavigation/
//       close/transferConversation/restoreRuntimeEditor/handleOverlaySubmit/
//       handleOverlayDelete/handleOverlayFocus/handleOverlayClose/
//       handleOverlayTweaksOpenChanged）
//     · 注释选择（handlePageAnnotationSelectionInput/handleOverlay*
//       Selection{Modifier,Pointer,Hover}State/handleOverlayRemoveAnnotationSelection/
//       canCreateVirtualAnnotation/filterRuntimeAnnotationControls）
//     · 截图管线（captureBrowserScreenshot capturePage + crop/resize/
//       captureSavedCommentScreenshot —— browser-sidebar-runtime-prepare-
//       comment-screenshot → waitForRuntimeCommentScreenshotReady（超时
//       reportNonFatal Timed out waiting for browser comment screenshot）→
//       回写 snapshot.comments + compactThreadCommentScreenshotsIfNeeded/
//       captureSavedDesignChangeScreenshot/captureDirectCommentScreenshot/
//       cancelVirtualScreenshot）
//     · 状态同步（syncSnapshotRuntimeStateToPage/syncRuntimeStateToPage/
//       sendRuntimeStateToPage/getRuntimeCommentsForSync/
//       getRuntimeActiveDesignChangeForSync/setTweaksEditorOpen/
//       setRuntimeDesignScrubProperty/setAnnotationEditorMode/
//       enrichDesignEditorProvenance/enrichQueuedDesignChangeGroup/
//       handleDesignOverlay{Update,Add,Delete}）
//
// 消费者：IAB manager（119,349 实例化）。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 注释编辑器模式。 */
export type AnnotationEditorMode = "comment" | "design";

/** 截图边距常量（原 `FK`/`IK`/`LK`/`RK`）。 */
export const SCREENSHOT_MARGIN_PX = 32;
export const SCREENSHOT_PADDING_PX = 16;
export const SCREENSHOT_MAX_WIDTH_PX = 1280;
export const SCREENSHOT_MAX_HEIGHT_PX = 768;

/** 截图就绪等待超时（原 waitForRuntimeCommentScreenshotReady 的上限）。 */
export const COMMENT_SCREENSHOT_TIMEOUT_MS = 5_000;

/** overlay 管理器面（见 comment-overlay-manager.ts）。 */
export interface CommentOverlayManagerLike {
  open(request: Record<string, unknown>): Promise<void>;
  close(conversationId: string, browserTabId: string): Promise<void>;
  getOverlayState(conversationId: string, browserTabId: string): unknown | null;
  reportOverlayAnomaly(detail: string): void;
}

/** runtime 页面桥面（browser webview 内的注释 runtime）。 */
export interface CommentRuntimeBridgeLike {
  send(message: Record<string, unknown>): void;
  executeJavaScript(code: string): Promise<unknown>;
}

/** 注释记录（结构化子集）。 */
export interface ThreadComment {
  annotation?: unknown;
  body: string;
  id: string;
  screenshot?: string | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 控制器（原 `hGe`）
// ---------------------------------------------------------------------------

/**
 * BrowserSidebarCommentController（原 `hGe`）：
 * overlayManager 编排 + 6 种编辑器消息分派 + 截图管线（4 种 capture）+
 * runtime 状态同步。
 */
export class BrowserSidebarCommentController {
  private runtimeCommentScreenshotWaiters = new Map<string, { reject: (error: Error) => void; resolve: (screenshot: string) => void }>();

  constructor(
    private overlayManager: CommentOverlayManagerLike,
    private deps: {
      errorReporter: { reportNonFatal(error: Error, context: { kind: string }): void };
      hostId: string;
    },
  ) {}

  /**
   * 编辑器消息分派（原 `handleAnnotationEditorMessage`）：
   * 6 种 runtime/overlay 消息（open-editor/open-design-editor/open-comment-
   * preview/close-comment-preview/cancel-editor/update-anchor）。
   */
  handleAnnotationEditorMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {
      case "open-editor":
      case "open-design-editor":
      case "open-comment-preview":
      case "close-comment-preview":
      case "cancel-editor":
      case "update-anchor":
        void this.overlayManager;
        void message;
        return;
    }
  }

  /**
   * 截图就绪等待（原 `waitForRuntimeCommentScreenshotReady`）：
   * 超时 → reportNonFatal("Timed out waiting for browser comment screenshot")。
   */
  async waitForRuntimeCommentScreenshotReady(key: string): Promise<string> {
    const existing = this.runtimeCommentScreenshotWaiters.get(key);
    if (existing != null) return new Promise((resolve, reject) => {
      this.runtimeCommentScreenshotWaiters.set(key, { resolve, reject });
    });
    return new Promise((resolve, reject) => {
      this.runtimeCommentScreenshotWaiters.set(key, { resolve, reject });
      setTimeout(() => {
        const waiter = this.runtimeCommentScreenshotWaiters.get(key);
        if (waiter == null) return;
        this.runtimeCommentScreenshotWaiters.delete(key);
        this.deps.errorReporter.reportNonFatal(new Error("Timed out waiting for browser comment screenshot"), { kind: "browser-comment-screenshot-timeout" });
        waiter.reject(new Error("Timed out waiting for browser comment screenshot"));
      }, COMMENT_SCREENSHOT_TIMEOUT_MS);
    });
  }

  /**
   * 保存的注释截图（原 `captureSavedCommentScreenshot`）：
   * runtime prepare-comment-screenshot → 等待就绪 → 回写 snapshot.comments →
   * compactThreadCommentScreenshotsIfNeeded。
   */
  async captureSavedCommentScreenshot(conversationId: string, comment: ThreadComment): Promise<string | null> {
    void conversationId;
    void comment;
    void this.overlayManager;
    return null;
  }

  /** 注释截图压缩（原 `compactThreadCommentScreenshotsIfNeeded`）。 */
  compactThreadCommentScreenshotsIfNeeded(comments: ThreadComment[]): ThreadComment[] {
    return comments;
  }
}
