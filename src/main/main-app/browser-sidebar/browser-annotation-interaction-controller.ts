// @ts-nocheck

/** Owns browser annotation ingress, design/comment interactions, and dragged-image state. */
export function createBrowserAnnotationInteractionControllerClass(dependencies: Record<string, any>) {
  const { hX, EU, IZe, LZe, n, SU, mVe, gVe } = dependencies;
  return class BrowserAnnotationInteractionController {
    constructor(host: any) { this.host = host; }
    host: any;
    activeDraggedImagesByOwnerWebContentsId = new Map();
    clearComments(e, t, n) {
      this.clearAnnotations(e, t, n, !0);
    }
    discardPendingAnnotations(e, t, n) {
      this.clearAnnotations(e, t, n, !1);
    }
    clearAnnotations(e, t, n, r) {
      let i =
        this.host.getCurrentPageCommandContext(e, t, n) ?? this.host.ensureThreadCommandContext(e, t, n);
      if (i == null) return;
      let { threadState: a, windowState: o } = i;
      ((a.snapshot = EU(a.snapshot, r ? `browse` : void 0, [])),
        r && this.host.comments.dismiss(o.owner, t, a.browserTabId, a),
        this.host.syncThreadState(o, t, a),
        a.page != null && this.host.syncRuntimeStateToPage(a.page, a));
    }
    addAnnotationsToComposer(e, t, n) {
      let r = this.host.ensureThreadCommandContext(e, t, n);
      if (r == null) return;
      let { threadState: i, windowState: a } = r;
      ((i.pendingCommentModeActivation = null),
        (i.snapshot = EU(i.snapshot, `browse`)),
        this.host.comments.dismiss(e, t, i.browserTabId, i),
        this.host.syncThreadState(a, t, i),
        i.page != null && this.host.syncRuntimeStateToPage(i.page, i),
        this.host.comments.prepare(e, t, i.browserTabId, i));
    }
    selectComment(e, t, n, r) {
      let i = this.host.getThreadState(e, t, r);
      return i == null ? `missing` : this.host.comments.openSavedComment(e, t, i.browserTabId, n);
    }
    deleteComment(e, t, n, r) {
      return this.host.comments.deleteSavedComment(e, t, r, n);
    }
    async handleRuntimeOpenEditor(e, t) {
      await this.host.comments.handleRuntimeOpenEditor(e, t);
    }
    async handleRuntimeOpenDesignEditor(e, t) {
      this.host.isTweaksFeatureEnabled && (await this.host.comments.handleRuntimeOpenDesignEditor(e, t));
    }
    async handleRuntimeOpenCommentPreview(e, t) {
      await this.host.comments.handleRuntimeOpenCommentPreview(e, t);
    }
    handleRuntimeCloseCommentPreview(e, t) {
      this.host.comments.handleRuntimeCloseCommentPreview(e, t);
    }
    handleAnnotationEditorMessage(e, t) {
      this.host.comments.handleAnnotationEditorMessage(e, t);
    }
    handleRuntimeUpdateAnchor(e, t) {
      this.host.comments.handleRuntimeUpdateAnchor(e, t);
    }
    handleRuntimeFocusEditor(e) {
      this.host.comments.handleRuntimeFocusEditor(e);
    }
    setFloatingComposerRevealTracking(e, t, n, r, i) {
      let a = this.host.getCurrentWindowState(e);
      if (a == null) return;
      let o = hX(a, t, n);
      o != null &&
        (r && (a.contentBounds = a.window.getContentBounds()),
        (o.floatingComposerRevealTracking = r
          ? { activationHeightPx: i, isPointerNearBottom: null }
          : void 0));
    }
    handlePageEvent(e, t) {
      IZe(
        e,
        this.host.findPageStateForRuntimeSender(e),
        t,
        this.host.siteAnnotationFeatures,
        this.host.browserSessionRegistry,
        this.host.syncThreadState.bind(this),
      );
    }
    handleRuntimeToggleAnnotationMode(e, t) {
      LZe(
        this,
        e,
        this.host.findPageStateForRuntimeSender(e),
        this.host.siteAnnotationFeatures,
        this.host.commentModeBlocklistLookup,
        t,
      );
    }
    handleRuntimeExitCommentMode(e) {
      let t = this.host.findPageStateForRuntimeSender(e);
      t &&
        !t.owner.isDestroyed() &&
        this.addAnnotationsToComposer(t.owner, t.page.conversationId, t.page.browserTabId);
    }
    handleRuntimeDesignModifierState(e, t) {
      let n = this.host.findPageStateForRuntimeSender(e);
      n &&
        !n.owner.isDestroyed() &&
        this.host.setDesignModifierPressed(
          n.owner,
          n.page.conversationId,
          t.pressed,
          n.page.browserTabId,
        );
    }
    setDesignModifierPressed(e, t, n, r) {
      let i = this.host.getThreadState(e, t, r),
        a = this.host.getCurrentWindowState(e);
      if (i == null || a == null) return;
      let o = this.host.isTweaksFeatureEnabled && i.snapshot.interactionMode === `comment` && n;
      (i.snapshot.isDesignModifierPressed ?? !1) !== o &&
        ((i.snapshot = { ...i.snapshot, isDesignModifierPressed: o }),
        this.host.syncThreadState(a, t, i),
        i.page != null && this.host.syncRuntimeStateToPage(i.page, i));
    }
    handleRuntimeAnnotationSuspension(e, t) {
      let n = this.host.findPageStateForRuntimeSender(e);
      n == null ||
        n.owner.isDestroyed() ||
        this.host.setAnnotationPresentation(n.owner, {
          browserTabId: n.page.browserTabId,
          conversationId: n.page.conversationId,
          suspended: t,
        });
    }
    setAnnotationPresentation(e, t) {
      let { conversationId: n, browserTabId: r } = t,
        i = this.host.getThreadState(e, n, r),
        a = this.host.getCurrentWindowState(e);
      if (i == null || a == null) return;
      let o = t.markersVisible ?? i.snapshot.areAnnotationMarkersVisible ?? !0,
        s =
          i.snapshot.interactionMode === `comment` &&
          (t.suspended ?? i.snapshot.isAnnotationSuspended ?? !1);
      ((i.snapshot.areAnnotationMarkersVisible ?? !0) !== o ||
        (i.snapshot.isAnnotationSuspended ?? !1) !== s) &&
        ((i.snapshot = { ...i.snapshot, areAnnotationMarkersVisible: o, isAnnotationSuspended: s }),
        this.host.syncThreadState(a, n, i),
        i.page != null && this.host.syncRuntimeStateToPage(i.page, i));
    }
    setOriginalViewEnabled(e, t, r, i) {
      let a = this.host.getThreadState(e, t, i),
        o = this.host.getCurrentWindowState(e);
      if (a == null || o == null) return;
      let s = a.snapshot.interactionMode === `comment` && n.ju(a.snapshot.comments) && r;
      (a.snapshot.isOriginalViewEnabled ?? !1) !== s &&
        ((a.snapshot = { ...a.snapshot, isOriginalViewEnabled: s }),
        this.host.syncThreadState(o, t, a),
        a.page != null && this.host.syncRuntimeStateToPage(a.page, a));
    }
    handleRuntimeImageDragStarted(e, t) {
      let n = this.host.findPageStateForRuntimeSender(e);
      n == null ||
        n.owner.isDestroyed() ||
        (this.activeDraggedImagesByOwnerWebContentsId.set(n.owner.id, {
          browserTabId: n.page.browserTabId,
          conversationId: n.page.conversationId,
          sourceUrl: t.sourceUrl,
        }),
        this.host.windowManager.sendMessageToWebContents(n.owner, {
          type: `browser-sidebar-image-drag-state`,
          browserTabId: n.page.browserTabId,
          conversationId: n.page.conversationId,
          isActive: !0,
        }));
    }
    handleRuntimeImageDragEnded(e) {
      let t = this.host.findPageStateForRuntimeSender(e);
      t == null ||
        t.owner.isDestroyed() ||
        SU(
          this.activeDraggedImagesByOwnerWebContentsId,
          t.page.browserTabId,
          t.page.conversationId,
          t.owner,
          this.host.windowManager,
        );
    }
    suspendImageAttachments(e, t, n) {
      let r = this.host.getPageState(e, t, n)?.view.webContents;
      return r == null ? null : mVe(r);
    }
    async attachDraggedImageToThread(e, t, n) {
      await gVe(
        this.activeDraggedImagesByOwnerWebContentsId,
        e,
        t,
        n,
        () => this.host.getPageState(e, t, n),
        this.host.windowManager,
      );
    }
    handleCommentOverlaySubmit(e, t) {
      return this.host.comments.handleOverlaySubmit(e, t);
    }
    handleDesignOverlayUpdate(e, t) {
      this.host.comments.handleDesignOverlayUpdate(e, t);
    }
    async handleDesignOverlayAdd(e, t) {
      await this.host.comments.handleDesignOverlayAdd(e, t);
    }
    handleDesignOverlayDelete(e, t) {
      this.host.comments.handleDesignOverlayDelete(e, t);
    }
    handleCommentOverlayDelete(e, t) {
      this.host.comments.handleOverlayDelete(e, t);
    }
    handleCommentOverlayClose(e, t, n, r) {
      this.host.comments.handleOverlayClose(e, t, n, r);
    }
    handleCommentOverlayFocus(e, t, n, r) {
      this.host.comments.handleOverlayFocus(e, t, n, r);
    }
    handleCommentOverlayTweaksOpenChanged(e, t) {
      this.host.comments.handleOverlayTweaksOpenChanged(e, t);
    }
    handleCommentOverlayDesignScrubChanged(e, t) {
      this.host.isTweaksFeatureEnabled && this.host.comments.handleOverlayDesignScrubChanged(e, t);
    }

  };
}
if (typeof module !== "undefined") module.exports = { createBrowserAnnotationInteractionControllerClass };
