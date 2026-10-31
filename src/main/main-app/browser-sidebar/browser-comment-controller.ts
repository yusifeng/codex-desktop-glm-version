interface BrowserCommentControllerDependencies {
  shared: any;
  ipcChannels: any;
  electron: any;
  crypto: any;
  defaultHostId: any;
  OverlayManager: any;
  logger: any;
  screenshotReadyTimeoutMs: number;
  screenshotMaxDimension: number;
  controlFallbackValue: any;
  parseDocumentRoot: any;
  parseNodeId: any;
  parseMatchedStyles: any;
  designGroupAttribute: string;
  normalizeAnchorState: any;
  sameDesignChangeIdentity: any;
  resetCommentModeSnapshot: any;
  createSavedComment: any;
  cropAnnotationScreenshot: any;
  queueDesignChange: any;
  anchorStateFromComment: any;
  isValidVirtualAnchorState: any;
  isVirtualDesignChangeForAnchor: any;
  escapeAttributeSelector: any;
  provenanceEquals: any;
  keyboardEventFromInput: any;
  provenanceComplete: any;
  createScreenshotRecord: any;
  unionScreenshotRegion: any;
  resizeImageToFit: any;
  removeDesignChange: any;
  upsertComment: any;
  mergeProvenance: any;
  removeAnchorSelection: any;
  updateDesignChangeAnchor: any;
  compactCommentScreenshots: any;
  sameAnnotationUrl: any;
  enrichDesignChangeProvenance: any;
  keepPrimaryAnchorOnly: any;
  sanitizeCommentForPage: any;
  removeCommentBody: any;
  textInputFromKeyEvent: any;
}

function createBrowserCommentControllerClass(dependencies: BrowserCommentControllerDependencies) {
  const {
    shared: n,
    ipcChannels: a,
    electron: l,
    crypto: _,
    defaultHostId: J,
    OverlayManager: JWe,
    logger: PK,
    screenshotReadyTimeoutMs: sGe,
    screenshotMaxDimension: LK,
    controlFallbackValue,
    parseDocumentRoot: uGe,
    parseNodeId: dGe,
    parseMatchedStyles: mGe,
    designGroupAttribute: lGe,
    normalizeAnchorState: $G,
    sameDesignChangeIdentity: EGe,
    resetCommentModeSnapshot: EU,
    createSavedComment: GK,
    cropAnnotationScreenshot: HK,
    queueDesignChange: JK,
    anchorStateFromComment: KK,
    isValidVirtualAnchorState: KWe,
    isVirtualDesignChangeForAnchor: MK,
    escapeAttributeSelector: NGe,
    provenanceEquals: QK,
    keyboardEventFromInput: SGe,
    provenanceComplete: TGe,
    createScreenshotRecord: UK,
    unionScreenshotRegion: VK,
    resizeImageToFit: WK,
    removeDesignChange: XK,
    upsertComment: YK,
    mergeProvenance: ZK,
    removeAnchorSelection: bGe,
    updateDesignChangeAnchor: eK,
    compactCommentScreenshots: gGe,
    sameAnnotationUrl: iK,
    enrichDesignChangeProvenance: kGe,
    keepPrimaryAnchorOnly: qK,
    sanitizeCommentForPage: tK,
    removeCommentBody: wGe,
    textInputFromKeyEvent: xGe,
  } = dependencies;

  class BrowserCommentController {
    windowManager;
    errorReporter;
    delegate;
    hostId;
    overlayManager;
    pageDefaultTweaksEditorSenders = new WeakSet<any>();
    pendingVirtualScreenshots = new WeakMap<any, any>();
    pendingCommentEdits = new WeakMap<any, any>();
    runtimeCommentScreenshotWaiters = new Map<any, any>();
    constructor(e, t, n, r = J) {
      ((this.windowManager = e),
        (this.errorReporter = t),
        (this.delegate = n),
        (this.hostId = r),
        (this.overlayManager = new JWe(e, t)),
        this.windowManager.addBrowserCommentPopupWindowCreatedHandler((e) => {
          e.hostId === this.hostId && this.overlayManager.claimRendererOpenedWindow(e);
        }));
    }
    handleAnnotationEditorMessage(e, t) {
      switch (t.type) {
        case `browser-sidebar-runtime-cancel-editor`:
          this.handleRuntimeCancelEditor(e, t);
          return;
        case `browser-sidebar-runtime-annotation-selection-modifier-state`:
          this.handleRuntimeAnnotationSelectionModifierState(e, t);
          return;
        case `browser-sidebar-comment-overlay-annotation-selection-hover-state`:
          this.handleOverlayAnnotationSelectionHoverState(e, t);
          return;
        case `browser-sidebar-comment-overlay-annotation-selection-modifier-state`:
          this.handleOverlayAnnotationSelectionModifierState(e, t);
          return;
        case `browser-sidebar-comment-overlay-annotation-selection-pointer-state`:
          this.handleOverlayAnnotationSelectionPointerState(e, t);
          return;
        case `browser-sidebar-comment-overlay-remove-annotation-selection`:
          this.handleOverlayRemoveAnnotationSelection(e, t);
          return;
      }
    }
    prepare(e, t, r, i) {
      if (!i.visible || i.bounds == null) return;
      let o = {
          owner: e,
          siteAnnotationFeaturesEnabled: this.delegate.canUseSiteAnnotationApi(i),
          hostId: this.windowManager.getHostIdForWebContents(e) ?? this.hostId,
          browserTabId: r,
          conversationId: t,
          browserBounds: i.bounds,
          viewportScale: i.viewportScale,
          cwd: i.cwd,
        },
        s = this.pendingCommentEdits.get(i),
        c =
          s != null && i.presented && !i.isAgentControllingBrowser
            ? i.snapshot.comments.find((e) => e.id === s)
            : void 0;
      if (
        i.snapshot.commentModeDisabledReason != null ||
        (c?.anchor.kind === `virtual` && !this.delegate.canUseSiteAnnotationApi(i)) ||
        (c?.designChange != null &&
          !this.delegate.canUseTweaks() &&
          (c.body?.trim() ?? ``).length === 0)
      ) {
        this.pendingCommentEdits.delete(i);
        return;
      }
      let l = i.page?.view.webContents;
      if (
        c != null &&
        c.anchor.kind !== `virtual` &&
        l != null &&
        !l.isDestroyed() &&
        iK(c.anchor.pageUrl, l.getURL())
      ) {
        (this.syncSnapshotRuntimeStateToPage(l, i),
          l.send(a.At, { type: `browser-sidebar-runtime-select-comment`, commentId: c.id }));
        return;
      }
      s != null &&
        (i.presented || i.isAgentControllingBrowser) &&
        this.pendingCommentEdits.delete(i);
      let u =
        c?.designChange != null &&
        this.delegate.canUseTweaks() &&
        (c.anchor.kind !== `virtual` ||
          (this.delegate.canUseSiteAnnotationApi(i) && MK(c.designChange, c.anchor)))
          ? this.filterRuntimeAnnotationControls(c.designChange, void 0, i)
          : void 0;
      (c == null
        ? this.overlayManager.prepare(o)
        : this.overlayManager.open({
            ...o,
            target: { mode: `edit`, commentId: c.id },
            anchorState: {
              anchor: c.anchor,
              additionalAnchors: c.additionalAnchors,
              placement: `top-left`,
              viewportRect: null,
              viewportPoint: { x: 0, y: 0 },
              viewportSize: c.viewportSize,
              themeVariant: c.themeVariant,
            },
            body: c.body ?? ``,
            pageInitialComment:
              !this.delegate.canUseSiteAnnotationApi(i) || c.pageInitialComment == null
                ? void 0
                : { text: c.pageInitialComment, shouldReveal: !1 },
            attachedImages: c.attachedImages,
            screenshot: c.screenshot,
            designChange: u,
            designEditorState: u,
            surfaceMode: `editor`,
          })
      ).catch((e) => {
        (PK().warning(`failed to prepare browser comment overlay`, {
          safe: { conversationId: t },
          sensitive: { error: e },
        }),
          this.errorReporter.reportNonFatal(e instanceof Error ? e : n.Zo(e), {
            kind: `browser-sidebar-comment-overlay-prepare`,
          }));
      });
    }
    openSavedComment(e, t, n, r) {
      let i = this.delegate.getThreadState(e, t, n),
        a = i?.snapshot.comments.find((e) => e.id === r);
      return i == null || a == null
        ? `missing`
        : (a.anchor.kind === `virtual` && !this.delegate.canUseSiteAnnotationApi(i)) ||
            (a.designChange != null &&
              !this.delegate.canUseTweaks() &&
              (a.body?.trim() ?? ``).length === 0) ||
            e.isDestroyed() ||
            !i.isAnnotationModeEnabled ||
            i.snapshot.commentModeDisabledReason != null ||
            i.isAgentControllingBrowser
          ? `unavailable`
          : (this.closeRuntimeEditor(i.page?.view.webContents ?? null),
            this.pendingCommentEdits.set(i, r),
            (i.snapshot = { ...i.snapshot, interactionMode: `comment`, isOriginalViewEnabled: !1 }),
            this.delegate.syncCommentSnapshot(e, t, n),
            this.prepare(e, t, n, i),
            `accepted`);
    }
    cancelPendingVirtualCommentEdit(e) {
      let t = this.pendingCommentEdits.get(e);
      e.snapshot.comments.some((e) => e.id === t && e.anchor.kind === `virtual`) &&
        this.pendingCommentEdits.delete(e);
    }
    refreshSiteAnnotationFeatures(e, t, n, r) {
      let i = r.page?.view.webContents ?? null,
        a = this.delegate.canUseSiteAnnotationApi(r);
      a ||
        (this.cancelPendingVirtualCommentEdit(r),
        i != null &&
          (this.cancelVirtualScreenshot(i),
          this.pageDefaultTweaksEditorSenders.delete(i) &&
            this.setTweaksEditorOpen(e, t, n, r, !1)));
      let o = this.overlayManager.getOverlayStateForOwner(e, t, n, { includeHidden: !0 });
      if (!a && o?.session.anchorState.anchor.kind === `virtual`) this.dismiss(e, t, n, r);
      else if (o != null) {
        let i = this.overlayManager.updateSessionForOwner(e, t, n, (e) =>
          a
            ? { ...e, siteAnnotationFeaturesEnabled: !0 }
            : {
                ...e,
                siteAnnotationFeaturesEnabled: !1,
                anchorState: $G(e.anchorState, null),
                pageInitialComment: void 0,
                designChange: this.filterRuntimeAnnotationControls(
                  eK(e.designChange, null),
                  void 0,
                  r,
                ),
                designEditorState: this.filterRuntimeAnnotationControls(
                  eK(e.designEditorState, null),
                  void 0,
                  r,
                ),
              },
        );
        i != null &&
          r.bounds != null &&
          this.overlayManager.updateAnchor({
            owner: e,
            conversationId: t,
            browserTabId: n,
            target: i.session.target,
            anchorState: i.session.anchorState,
            browserBounds: r.bounds,
            viewportScale: r.viewportScale,
          });
      }
      this.syncRuntimeStateToPage(e, t, i, r);
    }
    dismiss(e, t, n, r, i = !1) {
      (r != null && !i && this.pendingCommentEdits.delete(r),
        this.overlayManager.dismiss(e, t, n),
        this.closeRuntimeEditor(r?.page?.view.webContents ?? null));
    }
    dismissForCommittedNavigation(e, t, n, r) {
      if (this.pendingCommentEdits.has(r)) return;
      let i = this.overlayManager.getOverlayStateForOwner(e, t, n)?.session;
      if (
        i?.target.mode === `edit` &&
        (i.anchorState.anchor.kind === `virtual` || i.anchorState.viewportRect == null)
      )
        return;
      let a = r.page?.view.webContents;
      (a != null &&
        this.pageDefaultTweaksEditorSenders.delete(a) &&
        this.setTweaksEditorOpen(e, t, n, r, !1),
        this.dismiss(e, t, n, r));
    }
    close(e, t, n) {
      let r = this.delegate.getThreadState(e, t, n);
      r != null && this.pendingCommentEdits.delete(r);
      let i = r?.page?.view.webContents;
      (i != null && this.cancelVirtualScreenshot(i), this.overlayManager.close(e, t, n));
    }
    transferConversation(e, t, n, r, i) {
      this.overlayManager.transferConversation(e, t, n, r, i);
    }
    restoreRuntimeEditor(e, t, n, r) {
      if (r == null || r.isDestroyed()) return;
      let i = this.delegate.getThreadState(e, t, n);
      if (i != null && this.pendingCommentEdits.has(i)) {
        this.prepare(e, t, n, i);
        return;
      }
      let o = this.overlayManager.getOverlayStateForOwner(e, t, n);
      o != null &&
        (o.session.target.mode !== `edit` ||
          (o.session.anchorState.anchor.kind !== `virtual` &&
            o.session.anchorState.viewportRect != null)) &&
        r.send(a.At, {
          type: `browser-sidebar-runtime-restore-editor`,
          target: o.session.target,
          anchorState: $G(
            o.session.anchorState,
            this.getAnnotationMetadataPageUrl(r, i),
            void 0,
            !0,
          ),
        });
    }
    handleOverlayMounted(e, t, n, r, i, a, o, s) {
      this.overlayManager.handleOverlayMounted({
        owner: e,
        browserTabId: n,
        conversationId: t,
        sessionId: r,
        placementSurfaceSize: a,
        surfaceSize: i,
        metadataHeaderHeight: o,
        isLayoutReady: s,
      });
    }
    handleOverlayPreviewOpenChanged(e, t) {
      this.overlayManager.handleOverlayPreviewOpenChanged(e, t);
    }
    async handleRuntimeOpenEditor(e, t) {
      this.cancelVirtualScreenshot(e);
      let r = this.delegate.findPageStateForRuntimeSender(e);
      if (!r || r.owner.isDestroyed()) return;
      let i = this.delegate.getThreadState(r.owner, r.page.conversationId, r.page.browserTabId);
      if (i?.bounds == null || (i.snapshot.interactionMode !== `comment` && !t.siteInitiated)) {
        this.closeRuntimeEditor(e, t.target);
        return;
      }
      let a = this.delegate.canUseTweaks();
      if (
        t.anchorState.additionalAnchors?.some((e) => e.kind === `virtual`) ||
        (t.designEditorState != null &&
          (t.designEditorState.anchor.kind === `virtual` ||
            t.anchorState.anchor.kind === `virtual`) &&
          (!a ||
            !this.delegate.canUseSiteAnnotationApi(i) ||
            !MK(t.designEditorState, t.anchorState.anchor))) ||
        (t.anchorState.anchor.kind === `virtual` &&
          (!this.delegate.canUseSiteAnnotationApi(i) ||
            t.openTweaks === !0 ||
            (t.anchorState.additionalAnchors?.length ?? 0) > 0 ||
            (t.target.mode !== `edit` &&
              (t.target.mode !== `create` ||
                !this.canCreateVirtualAnnotation(e, i) ||
                !KWe(t.anchorState, e.getURL())))))
      ) {
        this.closeRuntimeEditor(e, t.target);
        return;
      }
      if (
        t.siteInitiated &&
        (!this.delegate.canUseSiteAnnotationApi(i) ||
          this.delegate.getCachedCommentModeBlocked(e.getURL()) !== !1 ||
          t.target.mode !== `create` ||
          (t.anchorState.anchor.kind !== `element` && t.anchorState.anchor.kind !== `text`) ||
          (t.anchorState.anchor.kind === `text` &&
            (t.designEditorState != null || t.openTweaks === !0)) ||
          t.anchorState.anchor.framePath.length !== 0 ||
          t.anchorState.anchor.frameUrl != null ||
          t.anchorState.anchor.pageUrl !== e.getURL() ||
          i.page?.view.webContents?.id !== e.id ||
          !i.isAnnotationModeEnabled ||
          !i.visible ||
          !i.presented ||
          i.isAgentControllingBrowser ||
          i.snapshot.commentModeDisabledReason != null ||
          (t.designEditorState != null &&
            !n.Cu(t.designEditorState.anchor, t.anchorState.anchor)) ||
          (t.openTweaks === !0 && (!a || t.designEditorState == null)))
      ) {
        this.closeRuntimeEditor(e, t.target);
        return;
      }
      if (
        t.siteInitiated &&
        this.overlayManager.getOverlayStateForOwner(
          r.owner,
          r.page.conversationId,
          r.page.browserTabId,
        )?.session.surfaceMode === `editor`
      )
        return;
      if (t.siteInitiated) {
        if (!this.delegate.hasSiteAnnotationPermission(e)) {
          this.closeRuntimeEditor(e, t.target);
          return;
        }
        ((i.snapshot = {
          ...i.snapshot,
          annotationFlow: t.enterAnnotationMode ? `batch` : `quick`,
          interactionMode: `comment`,
          annotationEditorMode: t.openTweaks ? `design` : `comment`,
          isTweaksEditorOpen: t.openTweaks === !0,
        }),
          this.delegate.syncCommentSnapshot(r.owner, r.page.conversationId, r.page.browserTabId));
      }
      let o = null;
      if (t.target.mode === `edit`) {
        let n = t.target.commentId;
        if (((o = i.snapshot.comments.find((e) => e.id === n) ?? null), o == null)) {
          this.closeRuntimeEditor(e, t.target);
          return;
        }
        if (
          (t.anchorState.anchor.kind === `virtual` && o.anchor.kind !== `virtual`) ||
          (o.anchor.kind === `virtual` && !this.delegate.canUseSiteAnnotationApi(i))
        ) {
          this.closeRuntimeEditor(e, t.target);
          return;
        }
      }
      if (
        (o != null &&
          o.id === this.pendingCommentEdits.get(i) &&
          this.pendingCommentEdits.delete(i),
        !a && o?.designChange != null && (o.body?.trim() ?? ``).length === 0)
      ) {
        this.closeRuntimeEditor(e, t.target);
        return;
      }
      this.overlayManager.getOverlayStateForOwner(
        r.owner,
        r.page.conversationId,
        r.page.browserTabId,
        { includeHidden: !0 },
      )?.session.surfaceMode === `preview` &&
        this.overlayManager.close(r.owner, r.page.conversationId, r.page.browserTabId);
      let s = this.getAnnotationMetadataPageUrl(e, i),
        c = $G(o?.anchor.kind === `virtual` ? KK(o, t.anchorState) : t.anchorState, s, o ?? void 0),
        l =
          a &&
          (c.anchor.kind !== `virtual` ||
            (this.delegate.canUseSiteAnnotationApi(i) &&
              o?.designChange != null &&
              MK(o.designChange, c.anchor)))
            ? this.filterRuntimeAnnotationControls(eK(o?.designChange, s, c.anchor), void 0, i)
            : void 0,
        u = t.siteInitiated ? n.wu.safeParse(t.initialComment).data : void 0,
        d = this.delegate.canUseSiteAnnotationApi(i) ? (o?.pageInitialComment ?? u) : void 0,
        f = a ? (t.designEditorState ?? l) : void 0;
      if (
        (c.anchor.kind === `virtual` && o != null && (f = l),
        c.anchor.kind !== `virtual` && t.designEditorState != null && l != null)
      ) {
        let e = new Map<any, any>(l.annotationControlChanges?.map((e) => [e.callback, e]));
        f = {
          ...t.designEditorState,
          annotationControls: t.designEditorState.annotationControls ?? l.annotationControls,
          annotationControlChanges:
            t.designEditorState.annotationControlChanges?.map((t) => {
              let n = e.get(t.callback);
              return n == null ? t : { ...t, previousValue: n.previousValue, value: n.value };
            }) ?? l.annotationControlChanges,
          declarations: n.Mu(t.designEditorState.declarations, l.declarations),
        };
      }
      f = eK(this.filterRuntimeAnnotationControls(f, void 0, i), s, c.anchor);
      let p =
          this.delegate.canUseSiteAnnotationApi(i) &&
          f != null &&
          ((!t.siteInitiated &&
            t.target.mode === `create` &&
            t.annotationEditorDefault === `advanced`) ||
            f.annotationControls?.controls.some((e) => controlFallbackValue(e) !== e.currentValue) === !0),
        m = i.snapshot.isTweaksEditorOpen === !0 && !this.pageDefaultTweaksEditorSenders.has(e),
        h =
          l != null ||
          p ||
          (t.target.mode === `create` &&
            f != null &&
            ((t.siteInitiated && t.openTweaks === !0) || m));
      (p
        ? i.snapshot.isTweaksEditorOpen !== !0 && this.pageDefaultTweaksEditorSenders.add(e)
        : this.pageDefaultTweaksEditorSenders.delete(e),
        this.setTweaksEditorOpen(r.owner, r.page.conversationId, r.page.browserTabId, i, h));
      let g = o?.anchor.kind === `virtual` || c.viewportRect == null ? o?.screenshot : void 0,
        _;
      if (c.anchor.kind === `virtual` && t.target.mode === `create`) {
        let n = new AbortController();
        this.pendingVirtualScreenshots.set(e, n);
        let a = () => this.closeRuntimeEditor(e, t.target),
          o = (e, t, n, r) => {
            r && a();
          },
          s = () => {
            (e.removeListener(`did-start-navigation`, o), e.removeListener(`destroyed`, a));
          };
        (e.on(`did-start-navigation`, o),
          e.once(`destroyed`, a),
          n.signal.addEventListener(`abort`, s, { once: !0 }));
        try {
          let t = await e.capturePage(),
            { width: n, height: r } = t.getSize();
          n === 0 || r === 0
            ? (_ = !0)
            : (g = UK(WK(t, LK), !1, null, c.viewportRect, c.viewportPoint));
        } catch {
          _ = !0;
        } finally {
          (s(), n.signal.removeEventListener(`abort`, s));
        }
        if (this.pendingVirtualScreenshots.get(e) !== n) return;
        this.pendingVirtualScreenshots.delete(e);
        let l = this.delegate.getThreadState(r.owner, r.page.conversationId, r.page.browserTabId);
        if (
          l !== i ||
          r.owner.isDestroyed() ||
          !this.canCreateVirtualAnnotation(e, l) ||
          e.getURL() !== c.anchor.pageUrl
        ) {
          this.closeRuntimeEditor(e, t.target);
          return;
        }
        this.delegate.canUseTweaks() || (f = void 0);
      }
      await this.overlayManager.open({
        owner: r.owner,
        siteAnnotationFeaturesEnabled: this.delegate.canUseSiteAnnotationApi(i),
        hostId: this.windowManager.getHostIdForWebContents(r.owner) ?? this.hostId,
        browserTabId: r.page.browserTabId,
        conversationId: r.page.conversationId,
        browserBounds: i.bounds,
        viewportScale: i.viewportScale,
        target: t.target,
        anchorState: this.delegate.canUseAnnotationMultiSelect() ? c : qK(c),
        body: o?.body ?? u ?? ``,
        pageInitialComment: d == null ? void 0 : { text: d, shouldReveal: t.siteInitiated === !0 },
        ...(h ? { defaultDesignEditorOpen: !0 } : {}),
        cwd: i.cwd,
        attachedImages: o?.attachedImages,
        designChange: l,
        designEditorState: f,
        screenshot: g,
        screenshotFailed: _,
        surfaceMode: `editor`,
      });
    }
    async handleRuntimeOpenDesignEditor(e, t) {
      this.cancelVirtualScreenshot(e);
      let n = this.delegate.findPageStateForRuntimeSender(e);
      if (!n || n.owner.isDestroyed()) return;
      let r = this.delegate.getThreadState(n.owner, n.page.conversationId, n.page.browserTabId);
      if (r?.bounds == null || r.snapshot.interactionMode !== `comment`) {
        this.closeRuntimeEditor(e, { mode: `design`, groupId: t.designEditorState.id });
        return;
      }
      if (
        !this.delegate.canUseTweaks() ||
        t.anchorState.anchor.kind === `virtual` ||
        t.anchorState.additionalAnchors?.some((e) => e.kind === `virtual`) ||
        t.designEditorState.anchor.kind === `virtual` ||
        t.designChange?.anchor.kind === `virtual`
      )
        return;
      let i = this.getAnnotationMetadataPageUrl(e, r),
        a = r.snapshot.comments.find((e) => e.designChange?.id === t.designEditorState.id),
        o = $G(t.anchorState, i, a),
        s = eK(this.filterRuntimeAnnotationControls(t.designEditorState, void 0, r), i, o.anchor);
      (this.overlayManager.getOverlayStateForOwner(
        n.owner,
        n.page.conversationId,
        n.page.browserTabId,
        { includeHidden: !0 },
      )?.session.surfaceMode === `preview` &&
        this.overlayManager.close(n.owner, n.page.conversationId, n.page.browserTabId),
        this.pageDefaultTweaksEditorSenders.delete(e),
        this.setTweaksEditorOpen(n.owner, n.page.conversationId, n.page.browserTabId, r, !0),
        this.setAnnotationEditorMode(
          n.owner,
          n.page.conversationId,
          n.page.browserTabId,
          r,
          `design`,
        ),
        await this.overlayManager.open({
          owner: n.owner,
          siteAnnotationFeaturesEnabled: this.delegate.canUseSiteAnnotationApi(r),
          hostId: this.windowManager.getHostIdForWebContents(n.owner) ?? this.hostId,
          browserTabId: n.page.browserTabId,
          conversationId: n.page.conversationId,
          browserBounds: r.bounds,
          viewportScale: r.viewportScale,
          target: { mode: `design`, groupId: s.id },
          anchorState: o,
          body: t.designChange?.comment ?? ``,
          cwd: r.cwd,
          designChange: eK(
            this.filterRuntimeAnnotationControls(t.designChange ?? void 0, void 0, r),
            i,
            o.anchor,
          ),
          designEditorState: s,
          screenshot: void 0,
          surfaceMode: `editor`,
        }));
    }
    async handleRuntimeOpenCommentPreview(e, t) {
      this.cancelVirtualScreenshot(e);
      let n = this.delegate.findPageStateForRuntimeSender(e);
      if (!n || n.owner.isDestroyed()) return;
      let r = this.delegate.getThreadState(n.owner, n.page.conversationId, n.page.browserTabId);
      if (r?.bounds == null || r.snapshot.interactionMode !== `comment`) return;
      let i = r.snapshot.comments.find((e) => e.id === t.commentId) ?? null;
      if (i == null || (i.anchor.kind === `virtual` && !this.delegate.canUseSiteAnnotationApi(r)))
        return;
      let a = this.delegate.canUseTweaks();
      if (!a && i.designChange != null && (i.body?.trim() ?? ``).length === 0) return;
      let o = this.getAnnotationMetadataPageUrl(e, r),
        s = $G(i.anchor.kind === `virtual` ? KK(i, t.anchorState) : t.anchorState, o, i),
        c = a
          ? this.filterRuntimeAnnotationControls(eK(i.designChange, o, s.anchor), void 0, r)
          : void 0;
      await this.overlayManager.openPreview({
        owner: n.owner,
        siteAnnotationFeaturesEnabled: this.delegate.canUseSiteAnnotationApi(r),
        hostId: this.windowManager.getHostIdForWebContents(n.owner) ?? this.hostId,
        browserTabId: n.page.browserTabId,
        conversationId: n.page.conversationId,
        browserBounds: r.bounds,
        target: { mode: `edit`, commentId: t.commentId },
        anchorState: this.delegate.canUseAnnotationMultiSelect() ? s : qK(s),
        body: i.body ?? ``,
        pageInitialComment:
          !this.delegate.canUseSiteAnnotationApi(r) || i.pageInitialComment == null
            ? void 0
            : { text: i.pageInitialComment, shouldReveal: !1 },
        cwd: r.cwd,
        attachedImages: i.attachedImages,
        designChange: c,
        viewportScale: r.viewportScale,
        screenshot: i.anchor.kind === `virtual` ? i.screenshot : void 0,
      });
    }
    handleRuntimeCloseCommentPreview(e, t) {
      let n = this.delegate.findPageStateForRuntimeSender(e);
      n &&
        !n.owner.isDestroyed() &&
        this.overlayManager.closePreview(
          n.owner,
          n.page.conversationId,
          n.page.browserTabId,
          t.commentId,
        );
    }
    handleRuntimeCancelEditor(e, t) {
      if (t.target.mode === `create` && this.pendingVirtualScreenshots.has(e)) {
        this.closeRuntimeEditor(e, t.target);
        return;
      }
      let r = this.delegate.findPageStateForRuntimeSender(e);
      if (!r || r.owner.isDestroyed()) return;
      let i = this.overlayManager.getOverlayStateForOwner(
        r.owner,
        r.page.conversationId,
        r.page.browserTabId,
      );
      i != null &&
        n.Su(i.session.target, t.target) &&
        this.overlayManager.requestDismiss({
          owner: r.owner,
          conversationId: r.page.conversationId,
          browserTabId: r.page.browserTabId,
        });
    }
    handleRuntimeUpdateAnchor(e, t) {
      let n = this.delegate.findPageStateForRuntimeSender(e);
      if (!n || n.owner.isDestroyed()) return;
      let r = this.delegate.getThreadState(n.owner, n.page.conversationId, n.page.browserTabId);
      if (r?.bounds == null) return;
      let i = t.target;
      if (
        this.overlayManager.getOverlayStateForOwner(
          n.owner,
          n.page.conversationId,
          n.page.browserTabId,
        )?.session.anchorState.anchor?.kind === `virtual` ||
        t.anchorState?.anchor.kind === `virtual` ||
        t.anchorState?.additionalAnchors?.some((e) => e.kind === `virtual`)
      )
        return;
      let a;
      i.mode === `edit`
        ? (a = r.snapshot.comments.find((e) => e.id === i.commentId) ?? null)
        : i.mode === `design` &&
          (a = r.snapshot.comments.find((e) => e.designChange?.id === i.groupId));
      let o =
          t.anchorState == null
            ? null
            : $G(t.anchorState, this.getAnnotationMetadataPageUrl(e, r), a),
        s = this.delegate.canUseAnnotationMultiSelect() || o == null ? o : qK(o);
      this.overlayManager.updateAnchor({
        owner: n.owner,
        conversationId: n.page.conversationId,
        browserTabId: n.page.browserTabId,
        target: t.target,
        anchorState: s,
        browserBounds: r.bounds,
        viewportScale: r.viewportScale,
      });
    }
    handleRuntimeAnnotationSelectionModifierState(e, t) {
      let n = this.delegate.findPageStateForRuntimeSender(e);
      n &&
        !n.owner.isDestroyed() &&
        this.overlayManager.setAnnotationSelectionModifierPressed({
          owner: n.owner,
          conversationId: n.page.conversationId,
          browserTabId: n.page.browserTabId,
          pressed: t.pressed && this.delegate.canUseAnnotationMultiSelect(),
          restoreEditorFocus: !t.pressed,
        });
    }
    handleRuntimeFocusEditor(e) {
      let t = this.delegate.findPageStateForRuntimeSender(e);
      t &&
        !t.owner.isDestroyed() &&
        this.overlayManager.focus(t.owner, t.page.conversationId, t.page.browserTabId);
    }
    handlePageAnnotationSelectionInput(e, t, n) {
      let r = xGe(n) ?? SGe(n);
      if (r == null) return !1;
      let i = this.delegate.findPageStateForRuntimeSender(e);
      return i == null ||
        i.owner.isDestroyed() ||
        !this.delegate.canUseAnnotationMultiSelect() ||
        !this.overlayManager.routeAnnotationSelectionInputToEditor({
          owner: i.owner,
          conversationId: i.page.conversationId,
          browserTabId: i.page.browserTabId,
          editorInput: r,
        })
        ? !1
        : (t.preventDefault(),
          e.send(a.At, {
            type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
            pressed: !1,
          }),
          !0);
    }
    handleRuntimeCommentScreenshotReady(e, t) {
      let n = this.runtimeCommentScreenshotWaiters.get(e.id);
      n != null &&
        n.commentId === t.commentId &&
        (this.runtimeCommentScreenshotWaiters.delete(e.id), n.resolve(t));
    }
    async handleOverlaySubmit(e, t) {
      let r = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
      if (r == null || r.session.sessionId !== t.sessionId) return;
      let i = t.browserTabId,
        a = this.delegate.getThreadState(r.owner, r.conversationId, i);
      if (a == null) return;
      if (
        r.session.anchorState.anchor.kind === `virtual` &&
        !this.delegate.canUseSiteAnnotationApi(a)
      ) {
        this.dismiss(r.owner, r.conversationId, i, a);
        return;
      }
      let o = a.page?.view.webContents ?? null,
        s = this.getAnnotationMetadataPageUrl(o, a),
        c = $G(r.session.anchorState, s, void 0, !0),
        l = this.delegate.canUseAnnotationMultiSelect() ? c : qK(c),
        u = t.body?.trim() ?? ``,
        d =
          t.designChange === void 0 && this.delegate.canUseTweaks()
            ? r.session.designChange
            : t.designChange;
      if (
        (d != null &&
          (d = this.filterRuntimeAnnotationControls(
            d,
            a.snapshot.comments.find((e) => e.designChange?.id === d?.id)?.designChange,
            a,
          )),
        l.anchor.kind === `virtual` && d != null)
      ) {
        if (!this.delegate.canUseTweaks() || !this.delegate.canUseSiteAnnotationApi(a)) d = void 0;
        else if (!MK(d, l.anchor)) return;
      }
      let f = d !== void 0 || r.session.designChange != null,
        p = d == null ? null : JK(eK(d, this.delegate.canUseTweaks() ? s : null, l.anchor), u);
      if (u.length === 0 && p == null) {
        (this.setTweaksEditorOpen(r.owner, r.conversationId, i, a, !1),
          this.dismiss(r.owner, r.conversationId, i, a));
        return;
      }
      let m = r.session.target,
        h = l.anchor.kind !== `virtual` && t.captureScreenshot !== !1,
        g = n.Du(a.snapshot.annotationFlow),
        v = m.mode === `create` && !g.persistent,
        y = m.mode === `create` && t.submitDirectly === !0,
        b = y ? 1 : n.Tu(a.snapshot.comments) + 1,
        x = m.mode !== `edit` && h && (l.additionalAnchors?.length ?? 0) === 0 && b >= 10,
        S =
          t.cropScreenshotToRegion === !0 &&
          l.anchor.kind !== `element` &&
          (l.additionalAnchors?.length ?? 0) === 0,
        C = l.viewportRect,
        w = l.viewportPoint,
        T = x || S ? VK(C, w) : null;
      if (y) {
        let e = GK({
            anchorState: l,
            body: u,
            pageInitialComment: r.session.pageInitialComment?.text,
            commentId: (0, _.randomUUID)(),
            attachedImages: t.attachedImages,
            designChange: p,
            screenshot: r.session.screenshot,
          }),
          s = g.persistent ? a.snapshot.comments.length + 1 : 1;
        (v && (a.snapshot = EU(a.snapshot, `browse`)),
          this.dismiss(r.owner, r.conversationId, i, a));
        let c = h
            ? await this.captureDirectCommentScreenshot({
                comment: e,
                conversationId: r.conversationId,
                markerViewportPoint: w,
                annotationViewportRect: C,
                page: o,
                screenshotCropRect: T,
                shouldUseCompactScreenshot: x,
                threadState: a,
                runtimeComments: g.persistent ? [...a.snapshot.comments, e] : [e],
              })
            : void 0,
          d = o == null || o.isDestroyed() ? null : this.delegate.findPageStateForRuntimeSender(o),
          f = o == null ? r.owner : d?.owner;
        if (
          f == null ||
          f.isDestroyed() ||
          (o != null &&
            (d?.page !== a.page ||
              d.page.view.webContents !== o ||
              d.page.browserTabId !== i ||
              d.page.conversationId !== r.conversationId)) ||
          this.delegate.getThreadState(f, r.conversationId, i) !== a
        )
          return;
        (v
          ? this.delegate.syncCommentSnapshot(f, r.conversationId, i)
          : this.syncSnapshotRuntimeStateToPage(o, a),
          this.windowManager.sendMessageToWebContents(f, {
            type: `browser-sidebar-direct-comment`,
            browserTabId: i,
            conversationId: r.conversationId,
            sessionId: t.sessionId,
            body: u,
            comment: n.$c(
              tK(c == null ? e : { ...e, screenshot: c }, this.getAnnotationMetadataPageUrl(o, a)),
              s,
              i,
            ),
          }));
        return;
      }
      if (m.mode === `create` || m.mode === `design`) {
        let e = p?.id ?? (0, _.randomUUID)(),
          n = GK({
            anchorState: l,
            body: u,
            pageInitialComment: r.session.pageInitialComment?.text,
            commentId: e,
            attachedImages: t.attachedImages,
            designChange: p,
            screenshot: r.session.screenshot,
          });
        ((a.snapshot = {
          ...a.snapshot,
          annotationEditorMode: `comment`,
          isOriginalViewEnabled: !1,
          comments: YK(a.snapshot.comments, n),
        }),
          v && (a.snapshot = EU(a.snapshot, `browse`)),
          this.compactThreadCommentScreenshotsIfNeeded(a),
          this.dismiss(r.owner, r.conversationId, i, a),
          this.delegate.syncCommentSnapshot(r.owner, r.conversationId, i),
          h &&
            (await this.captureSavedCommentScreenshot({
              commentId: e,
              conversationId: r.conversationId,
              markerViewportPoint: w,
              annotationViewportRect: C,
              owner: r.owner,
              page: a.page?.view.webContents ?? null,
              screenshotCropRect: T,
              shouldUseCompactScreenshot: x,
              threadState: a,
              ...(g.persistent ? {} : { runtimeComments: [n] }),
            })));
      } else
        m.mode === `edit` &&
          ((a.snapshot = {
            ...a.snapshot,
            comments: a.snapshot.comments.map((e) => {
              if (e.id !== m.commentId) return e;
              let n =
                u.length === 0
                  ? wGe({ ...e, attachedImages: t.attachedImages })
                  : { ...e, body: u, attachedImages: t.attachedImages };
              return f ? (p == null ? XK(n) : { ...n, designChange: p }) : n;
            }),
          }),
          this.dismiss(r.owner, r.conversationId, i, a),
          this.delegate.syncCommentSnapshot(r.owner, r.conversationId, i));
    }
    handleDesignOverlayUpdate(e, t) {
      let n = this.getDesignOverlayState(e, t);
      if (n == null) return;
      let r = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId);
      if (r == null) return;
      let i = n.session.designChange?.id ?? n.session.designEditorState?.id;
      i != null &&
        (n.session.anchorState.anchor.kind !== `virtual` ||
          (this.delegate.canUseTweaks() &&
            this.delegate.canUseSiteAnnotationApi(r) &&
            (t.group == null || MK(t.group, n.session.anchorState.anchor)))) &&
        (this.overlayManager.updateSessionForOwner(
          n.owner,
          n.conversationId,
          n.browserTabId,
          (e) => ({
            ...e,
            designChange: eK(
              this.filterRuntimeAnnotationControls(
                t.group ?? void 0,
                r.snapshot.comments.find((e) => e.designChange?.id === i)?.designChange,
                r,
              ),
              this.delegate.canUseTweaks()
                ? this.getAnnotationMetadataPageUrl(r.page?.view.webContents ?? null, r)
                : null,
              e.anchorState.anchor,
            ),
          }),
        ),
        this.syncRuntimeStateToPage(
          n.owner,
          n.conversationId,
          r.page?.view.webContents ?? null,
          r,
        ));
    }
    async handleDesignOverlayAdd(e, t) {
      let r = this.getDesignOverlayState(e, t);
      if (r == null) return;
      if (r.session.anchorState.anchor.kind === `virtual`) {
        await this.handleOverlaySubmit(e, {
          type: `browser-sidebar-comment-overlay-submit`,
          browserTabId: r.browserTabId,
          conversationId: r.conversationId,
          sessionId: r.session.sessionId,
          body: t.group.comment,
          designChange: t.group,
        });
        return;
      }
      let i = this.delegate.getThreadState(r.owner, r.conversationId, r.browserTabId);
      if (i == null) return;
      let a = this.getAnnotationMetadataPageUrl(i.page?.view.webContents ?? null, i),
        o = $G(r.session.anchorState, a),
        s = n.Tu(i.snapshot.comments) + 1 >= 10,
        c = r.session.anchorState.viewportRect,
        l = r.session.anchorState.viewportPoint,
        u = s ? VK(c, l) : null,
        d = JK(
          eK(
            this.filterRuntimeAnnotationControls(
              t.group,
              i.snapshot.comments.find((e) => e.designChange?.id === t.group.id)?.designChange,
              i,
            ),
            this.delegate.canUseTweaks() ? a : null,
            o.anchor,
          ),
          t.group.comment?.trim() ?? ``,
        );
      (this.overlayManager.updateSessionForOwner(
        r.owner,
        r.conversationId,
        r.browserTabId,
        (e) => ({ ...e, designChange: d }),
      ),
        (i.snapshot = {
          ...i.snapshot,
          annotationEditorMode: `comment`,
          isOriginalViewEnabled: !1,
          comments: YK(
            i.snapshot.comments,
            GK({
              anchorState: o,
              body: d.comment ?? ``,
              pageInitialComment: r.session.pageInitialComment?.text,
              commentId: d.id,
              designChange: d,
              screenshot: r.session.screenshot,
            }),
          ),
        }),
        this.syncSnapshotRuntimeStateToPage(i.page?.view.webContents ?? null, i),
        this.dismiss(r.owner, r.conversationId, r.browserTabId, i),
        this.delegate.syncCommentSnapshot(r.owner, r.conversationId, r.browserTabId));
      let f = await this.enrichQueuedDesignChangeGroup(
          i.page?.view.webContents ?? null,
          r.session.designEditorState,
          d,
        ),
        p = i.snapshot.comments.find((e) => e.id === d.id)?.designChange;
      (f !== d &&
        EGe(p, d) &&
        ((i.snapshot = {
          ...i.snapshot,
          comments: i.snapshot.comments.map((e) =>
            e.id === d.id && e.designChange != null
              ? { ...e, designChange: { ...e.designChange, provenance: f.provenance } }
              : e,
          ),
        }),
        this.delegate.syncCommentSnapshot(r.owner, r.conversationId, r.browserTabId)),
        await this.captureSavedDesignChangeScreenshot({
          annotationViewportRect: c,
          conversationId: r.conversationId,
          groupId: d.id,
          markerViewportPoint: l,
          owner: r.owner,
          page: i.page?.view.webContents ?? null,
          screenshotCropRect: u,
          shouldUseCompactScreenshot: s,
          threadState: i,
        }));
    }
    async enrichQueuedDesignChangeGroup(e, t, n) {
      let r = ZK(n.declarations, n.provenance, t?.provenance);
      if (TGe(n.declarations, r) || e == null || e.isDestroyed() || t == null || t.id !== n.id)
        return QK(n.provenance, r) ? n : { ...n, provenance: r };
      let i = await this.enrichDesignEditorProvenance(e, {
          ...t,
          declarations: n.declarations,
          text: n.text,
          provenance: r,
        }),
        a = ZK(n.declarations, r, i.provenance);
      return QK(n.provenance, a) ? n : { ...n, provenance: a };
    }
    handleDesignOverlayDelete(e, t) {
      let n = this.getDesignOverlayState(e, t);
      if (n == null) return;
      let r = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId);
      if (r == null) return;
      let i = r.snapshot.comments.flatMap((e) =>
        e.designChange?.id === t.groupId
          ? (e.body?.trim().length ?? 0) > 0 || (e.attachedImages?.length ?? 0) > 0
            ? [XK(e)]
            : []
          : [e],
      );
      (this.overlayManager.updateSessionForOwner(
        n.owner,
        n.conversationId,
        n.browserTabId,
        (e) => ({ ...e, designChange: void 0 }),
      ),
        (r.snapshot = {
          ...r.snapshot,
          isTweaksEditorOpen: !1,
          annotationEditorMode: i.length > 0 ? r.snapshot.annotationEditorMode : `comment`,
          comments: i,
        }),
        this.syncSnapshotRuntimeStateToPage(r.page?.view.webContents ?? null, r),
        this.dismiss(n.owner, n.conversationId, n.browserTabId, r),
        this.delegate.syncCommentSnapshot(n.owner, n.conversationId, n.browserTabId));
    }
    compactThreadCommentScreenshotsIfNeeded(e) {
      if (e.snapshot.comments.length < 10) return;
      let t = gGe(e.snapshot.comments);
      t !== e.snapshot.comments && (e.snapshot = { ...e.snapshot, comments: t });
    }
    handleOverlayDelete(e, t) {
      let n = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
      if (n == null || n.session.sessionId !== t.sessionId) return;
      let r = n.session.target;
      r.mode === `edit` &&
        r.commentId === t.commentId &&
        this.deleteSavedComment(n.owner, n.conversationId, n.browserTabId, r.commentId);
    }
    deleteSavedComment(e, t, r, i) {
      let a = this.delegate.getThreadState(e, t, r);
      if (a == null) return !1;
      let o = a.snapshot.comments.filter((e) => e.id !== i);
      if (o.length === a.snapshot.comments.length) return !1;
      a.snapshot = {
        ...a.snapshot,
        annotationEditorMode: n.Au(o) ? a.snapshot.annotationEditorMode : `comment`,
        comments: o,
      };
      let s = this.overlayManager.getOverlayStateForOwner(e, t, r)?.session;
      return (
        s?.target.mode === `edit` && s.target.commentId === i
          ? this.dismiss(e, t, r, a)
          : this.pendingCommentEdits.get(a) === i && this.pendingCommentEdits.delete(a),
        this.delegate.syncCommentSnapshot(e, t, r),
        !0
      );
    }
    handleOverlayClose(e, t, r, i) {
      let a = this.overlayManager.getOverlayStateForOwner(e, t, r);
      if (a == null || a.session.sessionId !== i) return;
      let o = this.delegate.getThreadState(a.owner, t, r);
      if (o == null) {
        (this.overlayManager.dismiss(a.owner, t, r), this.closeRuntimeEditor(null));
        return;
      }
      let s = o.snapshot,
        c = s,
        l = n.Du(s.annotationFlow),
        u = l.persistent ? s.comments : [];
      if (a.session.target.mode === `create` && !l.persistent) c = EU(s, `browse`);
      else {
        let e = n.Au(s.comments) ? s.annotationEditorMode : `comment`;
        (s.isAnnotationAddModifierPressed === !0 ||
          s.isDesignModifierPressed === !0 ||
          s.isOriginalViewEnabled === !0 ||
          s.annotationEditorMode !== e) &&
          (c = {
            ...s,
            isAnnotationAddModifierPressed: !1,
            isDesignModifierPressed: !1,
            isOriginalViewEnabled: !1,
            annotationEditorMode: e,
          });
      }
      (c !== s && ((o.snapshot = c), this.delegate.syncCommentSnapshot(a.owner, t, r)),
        this.overlayManager.dismiss(a.owner, t, r),
        this.sendRuntimeStateToPage(o.page?.view.webContents ?? null, o, u),
        this.closeRuntimeEditor(o.page?.view.webContents ?? null));
    }
    handleOverlayFocus(e, t, n, r) {
      let i = this.overlayManager.getOverlayStateForOwner(e, t, n);
      i != null && i.session.sessionId === r && this.overlayManager.focus(e, t, n);
    }
    handleOverlayTweaksOpenChanged(e, t) {
      let n = this.getDesignOverlayState(e, t);
      if (n == null) return;
      let r = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId);
      if (r == null) return;
      let i = r.page?.view.webContents;
      (i != null && this.pageDefaultTweaksEditorSenders.delete(i),
        this.setTweaksEditorOpen(n.owner, n.conversationId, n.browserTabId, r, t.open),
        this.setAnnotationEditorMode(
          n.owner,
          n.conversationId,
          n.browserTabId,
          r,
          t.open ? `design` : `comment`,
        ));
    }
    handleOverlayAnnotationSelectionModifierState(e, t) {
      let n = () => {
        let n = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
        if (n == null || n.session.sessionId !== t.sessionId) return;
        let r = t.pressed && t.source === `pointer` && this.delegate.canUseAnnotationMultiSelect();
        if (t.source === `window-blur`) {
          let t = l.BrowserWindow.getFocusedWindow(),
            r = l.BrowserWindow.fromWebContents(e),
            i = l.BrowserWindow.fromWebContents(n.owner);
          if (t != null && (t === r || t === i)) return;
        }
        this.overlayManager.setAnnotationSelectionModifierPressed({
          owner: n.owner,
          conversationId: n.conversationId,
          browserTabId: n.browserTabId,
          pressed: r,
        });
        let i = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId)?.page?.view
          .webContents;
        i == null ||
          i.isDestroyed() ||
          (i.send(a.At, {
            type: `browser-sidebar-runtime-annotation-selection-modifier-state`,
            pressed: r,
          }),
          r && i.focus());
      };
      if (t.source === `window-blur`) {
        setTimeout(n, 0);
        return;
      }
      n();
    }
    handleOverlayAnnotationSelectionPointerState(e, t) {
      let n = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
      n != null &&
        n.session.sessionId === t.sessionId &&
        this.overlayManager.setAnnotationSelectionEditorPointerInside({
          owner: n.owner,
          conversationId: n.conversationId,
          browserTabId: n.browserTabId,
          insideEditor: t.insideEditor,
        });
    }
    handleOverlayAnnotationSelectionHoverState(e, t) {
      let n = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
      if (
        n == null ||
        n.session.sessionId !== t.sessionId ||
        n.session.target.mode !== `create` ||
        n.session.anchorState.anchor.kind === `text`
      )
        return;
      let r = 1 + (n.session.anchorState.additionalAnchors?.length ?? 0);
      if (
        t.selectionIndex != null &&
        (!this.delegate.canUseAnnotationMultiSelect() ||
          t.selectionIndex < 0 ||
          t.selectionIndex >= r)
      )
        return;
      let i = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId)?.page?.view
        .webContents;
      i == null ||
        i.isDestroyed() ||
        i.send(a.At, {
          type: `browser-sidebar-runtime-annotation-selection-hover-state`,
          selectionIndex: t.selectionIndex,
        });
    }
    handleOverlayRemoveAnnotationSelection(e, t) {
      let n = this.overlayManager.getOverlayStateForOwner(e, t.conversationId, t.browserTabId);
      if (
        n == null ||
        n.session.sessionId !== t.sessionId ||
        n.session.target.mode !== `create` ||
        n.session.anchorState.anchor.kind === `text` ||
        !this.delegate.canUseAnnotationMultiSelect()
      )
        return;
      let r = 1 + (n.session.anchorState.additionalAnchors?.length ?? 0);
      if (t.selectionIndex < 0 || t.selectionIndex >= r) return;
      let i = bGe(n.session.anchorState, t.selectionIndex);
      if (i == null) {
        this.dismiss(
          n.owner,
          n.conversationId,
          n.browserTabId,
          this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId),
        );
        return;
      }
      this.overlayManager.updateSessionForOwner(n.owner, n.conversationId, n.browserTabId, (e) => ({
        ...e,
        anchorState: i,
      }));
      let o = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId)?.page?.view
        .webContents;
      o == null ||
        o.isDestroyed() ||
        o.send(a.At, {
          type: `browser-sidebar-runtime-remove-annotation-selection`,
          selectionIndex: t.selectionIndex,
        });
    }
    handleOverlayDesignScrubChanged(e, t) {
      let n = this.getDesignOverlayState(e, t);
      if (n == null) return;
      let r = this.delegate.getThreadState(n.owner, n.conversationId, n.browserTabId);
      r != null && this.setRuntimeDesignScrubProperty(r.page?.view.webContents ?? null, t.property);
    }
    getDesignOverlayState(e, t) {
      let n = this.overlayManager.getOverlayStateForSession(e, t.conversationId, t.sessionId);
      return n == null || (n.session.designChange == null && n.session.designEditorState == null)
        ? null
        : n;
    }
    async captureBrowserScreenshot(e, t) {
      try {
        let n = t.readyMessage.annotationViewportRect ?? t.annotationViewportRect,
          r = t.readyMessage.markerViewportPoint ?? t.markerViewportPoint,
          i = t.screenshotCropRect == null ? null : (VK(n, r) ?? t.screenshotCropRect);
        return UK(
          HK(await e.capturePage(), {
            annotation: t.annotation,
            screenshotCropRect: i,
            shouldUseCompactScreenshot: t.shouldUseCompactScreenshot,
          }),
          t.shouldUseCompactScreenshot,
          i,
          n,
          r,
        );
      } catch (e) {
        (PK().warning(`failed to capture browser comment screenshot`, {
          safe: {},
          sensitive: { error: e },
        }),
          this.errorReporter.reportNonFatal(e instanceof Error ? e : Error(String(e)), {
            kind: `browser-sidebar-comment-screenshot`,
          }));
        return;
      }
    }
    async captureSavedCommentScreenshot({
      annotationViewportRect: e,
      commentId: t,
      conversationId: n,
      markerViewportPoint: r,
      owner: i,
      page: o,
      runtimeComments: s = void 0,
      screenshotCropRect: c,
      shouldUseCompactScreenshot: l,
      threadState: u,
    }) {
      if (!(o == null || o.isDestroyed())) {
        (s != null && this.sendRuntimeStateToPage(o, u, s),
          o.send(a.At, {
            type: `browser-sidebar-runtime-prepare-comment-screenshot`,
            commentId: t,
          }));
        try {
          let a = await this.waitForRuntimeCommentScreenshotReady(o, t);
          if (a == null) {
            (this.errorReporter.reportNonFatal(
              Error(`Timed out waiting for browser comment screenshot`),
              { kind: `browser-sidebar-comment-screenshot-ready-timeout` },
            ),
              PK().warning(`timed out waiting for browser comment screenshot`, {
                safe: { commentId: t, conversationId: n },
              }));
            return;
          }
          if (a.skipScreenshotCapture === !0) return;
          let s = u.snapshot.comments.find((e) => e.id === t);
          if (s == null) return;
          let d = await this.captureBrowserScreenshot(o, {
            annotationViewportRect: e,
            annotation: s,
            markerViewportPoint: r,
            readyMessage: a,
            screenshotCropRect: c,
            shouldUseCompactScreenshot: l,
          });
          if (d == null) return;
          ((u.snapshot = {
            ...u.snapshot,
            comments: u.snapshot.comments.map((e) =>
              e.id === t
                ? {
                    ...e,
                    screenshot: d,
                    ...(e.designChange == null
                      ? {}
                      : { designChange: { ...e.designChange, screenshot: d } }),
                  }
                : e,
            ),
          }),
            this.compactThreadCommentScreenshotsIfNeeded(u),
            this.delegate.syncCommentSnapshot(i, n, u.browserTabId));
        } finally {
          o.isDestroyed() ||
            o.send(a.At, { type: `browser-sidebar-runtime-clear-comment-screenshot` });
        }
      }
    }
    async captureSavedDesignChangeScreenshot({
      annotationViewportRect: e,
      conversationId: t,
      groupId: n,
      markerViewportPoint: r,
      owner: i,
      page: o,
      screenshotCropRect: s,
      shouldUseCompactScreenshot: c,
      threadState: l,
    }) {
      if (!(o == null || o.isDestroyed())) {
        o.send(a.At, { type: `browser-sidebar-runtime-prepare-comment-screenshot`, commentId: n });
        try {
          let a = await this.waitForRuntimeCommentScreenshotReady(o, n);
          if (a == null) {
            (this.errorReporter.reportNonFatal(
              Error(`Timed out waiting for browser annotation screenshot`),
              { kind: `browser-sidebar-comment-screenshot-ready-timeout` },
            ),
              PK().warning(`timed out waiting for browser annotation screenshot`, {
                safe: { commentId: n, conversationId: t },
              }));
            return;
          }
          let u = l.snapshot.comments.find((e) => e.id === n || e.designChange?.id === n);
          if (u?.designChange == null) return;
          let d = await this.captureBrowserScreenshot(o, {
            annotationViewportRect: e,
            annotation: u.designChange,
            markerViewportPoint: r,
            readyMessage: a,
            screenshotCropRect: s,
            shouldUseCompactScreenshot: c,
          });
          if (d == null) return;
          ((l.snapshot = {
            ...l.snapshot,
            comments: l.snapshot.comments.map((e) =>
              e.id === u.id
                ? {
                    ...e,
                    screenshot: d,
                    designChange:
                      e.designChange == null ? void 0 : { ...e.designChange, screenshot: d },
                  }
                : e,
            ),
          }),
            this.delegate.syncCommentSnapshot(i, t, l.browserTabId));
        } finally {
          o.isDestroyed() ||
            o.send(a.At, { type: `browser-sidebar-runtime-clear-comment-screenshot` });
        }
      }
    }
    async captureDirectCommentScreenshot({
      annotationViewportRect: e,
      comment: t,
      conversationId: n,
      markerViewportPoint: r,
      page: i,
      runtimeComments: o,
      screenshotCropRect: s,
      shouldUseCompactScreenshot: c,
      threadState: l,
    }) {
      if (!(i == null || i.isDestroyed())) {
        (this.sendRuntimeStateToPage(i, l, o),
          i.send(a.At, {
            type: `browser-sidebar-runtime-prepare-comment-screenshot`,
            commentId: t.id,
          }));
        try {
          let a = await this.waitForRuntimeCommentScreenshotReady(i, t.id);
          if (a == null) {
            (this.errorReporter.reportNonFatal(
              Error(`Timed out waiting for browser comment screenshot`),
              { kind: `browser-sidebar-comment-screenshot-ready-timeout` },
            ),
              PK().warning(`timed out waiting for browser comment screenshot`, {
                safe: { commentId: t.id, conversationId: n },
              }));
            return;
          }
          return a.skipScreenshotCapture === !0
            ? void 0
            : await this.captureBrowserScreenshot(i, {
                annotationViewportRect: e,
                annotation: t,
                markerViewportPoint: r,
                readyMessage: a,
                screenshotCropRect: s,
                shouldUseCompactScreenshot: c,
              });
        } finally {
          i.isDestroyed() ||
            i.send(a.At, { type: `browser-sidebar-runtime-clear-comment-screenshot` });
        }
      }
    }
    async enrichDesignEditorProvenance(e, t) {
      if (e.isDestroyed()) return t;
      let n = e.debugger,
        r = n.isAttached();
      try {
        (r || n.attach(`1.3`),
          await Promise.all([n.sendCommand(`DOM.enable`), n.sendCommand(`CSS.enable`)]));
        let e = uGe.parse(await n.sendCommand(`DOM.getDocument`, { pierce: !0 })),
          i = dGe.parse(
            await n.sendCommand(`DOM.querySelector`, {
              nodeId: e.root.nodeId,
              selector: `[${lGe}~="${NGe(t.draftAttribute)}"]`,
            }),
          );
        return i.nodeId === 0
          ? t
          : kGe(
              t,
              mGe.parse(await n.sendCommand(`CSS.getMatchedStylesForNode`, { nodeId: i.nodeId })),
            );
      } catch (e) {
        return (
          PK().warning(`failed to inspect browser design style provenance`, {
            safe: { groupId: t.id },
            sensitive: { error: e },
          }),
          t
        );
      } finally {
        if (!r && !e.isDestroyed() && n.isAttached())
          try {
            n.detach();
          } catch (e) {
            PK().warning(`failed to detach browser design debugger`, {
              safe: { groupId: t.id },
              sensitive: { error: e },
            });
          }
      }
    }
    syncSnapshotRuntimeStateToPage(e, t) {
      let r = n.Du(t.snapshot.annotationFlow).persistent ? t.snapshot.comments : [];
      this.sendRuntimeStateToPage(e, t, r);
    }
    syncRuntimeStateToPage(e, t, r, i, a = i.snapshot.comments) {
      if (!n.Du(i.snapshot.annotationFlow).persistent) {
        this.sendRuntimeStateToPage(
          r,
          i,
          [],
          this.getRuntimeActiveDesignChangeForSync(e, t, i.browserTabId),
        );
        return;
      }
      this.sendRuntimeStateToPage(
        r,
        i,
        this.getRuntimeCommentsForSync(e, t, i.browserTabId, a),
        this.getRuntimeActiveDesignChangeForSync(e, t, i.browserTabId),
      );
    }
    sendRuntimeStateToPage(e, t, r, i = void 0) {
      if (e == null || e.isDestroyed()) return;
      let o = this.delegate.canUseAnnotationMultiSelect(),
        s = this.delegate.getSiteAnnotationApiAvailability() ?? void 0,
        c = this.delegate.canUseTweaks(),
        l = this.getAnnotationMetadataPageUrl(e, t);
      ((l == null || t.snapshot.interactionMode !== `comment`) && this.cancelVirtualScreenshot(e),
        e.send(a.At, {
          type: `browser-sidebar-runtime-sync`,
          interactionMode: t.snapshot.interactionMode,
          annotationEditorMode: c ? t.snapshot.annotationEditorMode : `comment`,
          isAgentControllingBrowser: t.isAgentControllingBrowser,
          areAnnotationMarkersVisible: t.snapshot.areAnnotationMarkersVisible ?? !0,
          isAnnotationSuspended: t.snapshot.isAnnotationSuspended === !0,
          canUseAnnotationMultiSelect: o,
          canUseSiteAnnotationApi: s,
          siteAnnotationFeaturesEnabled: this.delegate.canUseSiteAnnotationApi(t),
          canUseTweaks: c,
          isDesignModifierPressed: c && t.snapshot.isDesignModifierPressed === !0,
          isOriginalViewEnabled: c && t.snapshot.isOriginalViewEnabled === !0,
          isTweaksEditorOpen: c && t.snapshot.isTweaksEditorOpen === !0,
          ...(c && i != null ? { activeDesignChange: eK(i, l) } : {}),
          intlConfig: t.runtimeIntlConfig,
          comments: n.Ou(r, c, o).map((e) => n.Eu(tK(e, l))),
          viewportScale: t.viewportScale,
          zoomPercent: t.snapshot.zoomPercent,
        }));
    }
    canCreateVirtualAnnotation(e, t) {
      return (
        this.getAnnotationMetadataPageUrl(e, t) != null &&
        t?.snapshot.interactionMode === `comment` &&
        this.delegate.getCachedCommentModeBlocked(e.getURL()) === !1
      );
    }
    getAnnotationMetadataPageUrl(e, t) {
      return t == null ||
        !this.delegate.canUseSiteAnnotationApi(t) ||
        e == null ||
        e.isDestroyed() ||
        t?.bounds == null ||
        t.page?.view.webContents?.id !== e.id ||
        !t.isAnnotationModeEnabled ||
        !t.visible ||
        !t.presented ||
        t.isAgentControllingBrowser ||
        t.snapshot.commentModeDisabledReason != null
        ? null
        : e.getURL();
    }
    filterRuntimeAnnotationControls(e, t, n) {
      return e == null || this.delegate.canUseSiteAnnotationApi(n)
        ? e
        : {
            ...e,
            annotationControls: t?.annotationControls,
            annotationControlChanges: t?.annotationControlChanges,
          };
    }
    getRuntimeCommentsForSync(e, t, n, r) {
      if (t == null) return r;
      let i = this.overlayManager.getOverlayStateForOwner(e, t, n);
      if (i == null) return r;
      let a = i.session.target;
      if (a.mode !== `edit`) return r;
      let o = i.session.designEditorState?.id ?? i.session.designChange?.id;
      return o == null
        ? r
        : r.map((e) =>
            e.id !== a.commentId && e.designChange?.id !== o
              ? e
              : i.session.designChange == null
                ? XK(e)
                : { ...e, designChange: i.session.designChange },
          );
    }
    getRuntimeActiveDesignChangeForSync(e, t, n) {
      if (t == null) return;
      let r = this.overlayManager.getOverlayStateForOwner(e, t, n);
      if (r != null && r.session.target.mode !== `edit` && r.session.designChange != null)
        return r.session.designChange;
    }
    cancelVirtualScreenshot(e) {
      (this.pendingVirtualScreenshots.get(e)?.abort(), this.pendingVirtualScreenshots.delete(e));
    }
    closeRuntimeEditor(e, t = void 0) {
      (e != null && this.cancelVirtualScreenshot(e),
        !(e == null || e.isDestroyed()) &&
          e.send(a.At, { type: `browser-sidebar-runtime-close-editor`, target: t }));
    }
    setTweaksEditorOpen(e, t, n, r, i) {
      (r.snapshot.isTweaksEditorOpen ?? !1) !== i &&
        ((r.snapshot = { ...r.snapshot, isTweaksEditorOpen: i }),
        this.delegate.syncCommentSnapshot(e, t, n));
    }
    setRuntimeDesignScrubProperty(e, t) {
      e == null ||
        e.isDestroyed() ||
        e.send(a.At, { type: `browser-sidebar-runtime-design-scrub-changed`, property: t });
    }
    setAnnotationEditorMode(e, t, n, r, i) {
      r.snapshot.annotationEditorMode !== i &&
        ((r.snapshot = { ...r.snapshot, annotationEditorMode: i }),
        this.delegate.syncCommentSnapshot(e, t, n));
    }
    waitForRuntimeCommentScreenshotReady(e, t) {
      return (
        this.runtimeCommentScreenshotWaiters.get(e.id)?.resolve(null),
        new Promise<any>((n) => {
          let r = setTimeout(() => {
            this.runtimeCommentScreenshotWaiters.get(e.id)?.commentId === t &&
              (this.runtimeCommentScreenshotWaiters.delete(e.id), n(null));
          }, sGe);
          this.runtimeCommentScreenshotWaiters.set(e.id, {
            commentId: t,
            resolve: (i) => {
              (clearTimeout(r),
                this.runtimeCommentScreenshotWaiters.get(e.id)?.commentId === t &&
                  this.runtimeCommentScreenshotWaiters.delete(e.id),
                n(i));
            },
          });
        })
      );
    }
  }

  return BrowserCommentController;
}

export { createBrowserCommentControllerClass };
