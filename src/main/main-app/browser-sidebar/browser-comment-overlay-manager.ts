interface BrowserCommentOverlayDependencies {
  BrowserWindow: any;
  screen: any;
  shared: any;
  isEqual(left: unknown, right: unknown): boolean;
}

function createBrowserCommentOverlayManagerClass({
  BrowserWindow,
  screen,
  shared,
  isEqual,
}: BrowserCommentOverlayDependencies) {
  const l = { BrowserWindow, screen };
  const n = shared;
  const G = { default: isEqual };
  const OWNER_WINDOW_EDGE_MARGIN = 8;
  const OVERLAY_SURFACE_MARGIN = 8;
  const RECENT_EVENT_LIMIT = 10;
  class BrowserCommentOverlayManager {
    windowManager;
    errorReporter;
    nextSessionId = 0;
    overlaysByKey = new Map();
    constructor(e, t) {
      ((this.windowManager = e), (this.errorReporter = t));
    }
    async prepare(e) {
      let t = l.BrowserWindow.fromWebContents(e.owner),
        n = this.getOverlayState(e.owner, e.conversationId, e.browserTabId);
      if (n != null) {
        let r = isOverlayAttachedToOwner(n, t);
        if (n.wantsToBeVisible) {
          if (n.window == null || r) {
            ((n.owner = e.owner), (n.hostId = e.hostId), (n.browserBounds = e.browserBounds));
            let t = this.createFrame({
              owner: e.owner,
              browserBounds: e.browserBounds,
              viewportScale: e.viewportScale,
              anchorState: n.session.anchorState,
              forceFallback: n.session.placementStrategy === `fallback`,
              body: n.session.body,
              placementSurfaceSize: n.placementSurfaceSize,
              previewSurfaceSize: n.previewSurfaceSize,
              metadataHeaderHeight: n.metadataHeaderHeight,
              surfaceMode: n.session.surfaceMode,
            });
            ((n.session = {
              ...n.session,
              siteAnnotationFeaturesEnabled: e.siteAnnotationFeaturesEnabled,
              cwd: e.cwd,
              placementStrategy: t.placementStrategy,
              previewAlignment: t.previewAlignment,
            }),
              (n.viewportScale = e.viewportScale),
              this.recordStateEvent(n, `prepare`),
              this.attachOwnerWindowListeners(n),
              this.positionOverlayWindow(n),
              this.syncOwnerRenderer(n));
            return;
          }
        } else if (r) return;
        else if (n.window == null) {
          let t = createFallbackAnchorState(e.browserBounds, e.viewportScale);
          ((n.owner = e.owner),
            (n.hostId = e.hostId),
            (n.browserBounds = e.browserBounds),
            (n.viewportScale = e.viewportScale),
            (n.session = {
              ...this.createSession({
                ...e,
                target: { mode: `create` },
                anchorState: t,
                body: ``,
                surfaceMode: `editor`,
              }),
              sessionId: n.session.sessionId,
            }),
            (n.mountedSessionId = null),
            (n.placementSurfaceSize = null),
            (n.previewSurfaceSize = null),
            (n.metadataHeaderHeight = 0),
            (n.isPreviewOpen = !1),
            (n.isAnnotationSelectionModifierPressed = !1),
            (n.isAnnotationSelectionEditorPointerInside = !0),
            (n.dismissRequestSequence = 0),
            this.recordStateEvent(n, `prepare`),
            this.attachOwnerWindowListeners(n),
            this.positionOverlayWindow(n),
            this.syncOwnerRenderer(n),
            hideOverlayWindow(n));
          return;
        }
      }
      let r = createFallbackAnchorState(e.browserBounds, e.viewportScale),
        i = this.ensureOverlayState({
          ...e,
          target: { mode: `create` },
          anchorState: r,
          body: ``,
          surfaceMode: `editor`,
        });
      i.wantsToBeVisible ||
        ((i.owner = e.owner),
        (i.hostId = e.hostId),
        (i.browserBounds = e.browserBounds),
        (i.viewportScale = e.viewportScale),
        (i.session = this.createSession({
          ...e,
          target: { mode: `create` },
          anchorState: r,
          body: ``,
          surfaceMode: `editor`,
        })),
        (i.mountedSessionId = null),
        (i.isPreviewOpen = !1),
        (i.metadataHeaderHeight = 0),
        (i.isAnnotationSelectionModifierPressed = !1),
        (i.isAnnotationSelectionEditorPointerInside = !0),
        (i.dismissRequestSequence = 0),
        (i.wantsToBeVisible = !1),
        (i.shouldFocusWhenVisible = !1),
        this.recordStateEvent(i, `prepare`),
        this.attachOwnerWindowListeners(i),
        this.positionOverlayWindow(i),
        this.syncOwnerRenderer(i),
        hideOverlayWindow(i));
    }
    async open(e) {
      let t = this.ensureOverlayState(e);
      ((t.owner = e.owner),
        (t.hostId = e.hostId),
        (t.browserBounds = e.browserBounds),
        (t.viewportScale = e.viewportScale),
        (t.session = this.createSession(e)));
      let r = t.session.sessionId;
      if (
        ((t.mountedSessionId = null),
        (t.placementSurfaceSize = null),
        (t.previewSurfaceSize =
          e.surfaceMode === `editor` &&
          e.target.mode === `create` &&
          (e.pageInitialComment?.text.length ?? 0) > 0
            ? { width: n.bu.width, height: 120 }
            : null),
        (t.metadataHeaderHeight = 0),
        (t.isPreviewOpen = !1),
        (t.isAnnotationSelectionModifierPressed = !1),
        (t.isAnnotationSelectionEditorPointerInside = !0),
        (t.dismissRequestSequence = 0),
        (t.wantsToBeVisible = !0),
        (t.shouldFocusWhenVisible = e.surfaceMode === `editor`),
        (t.lifetimeCounts.openCount += 1),
        this.recordStateEvent(t, `open`),
        hideOverlayWindow(t),
        this.attachOwnerWindowListeners(t),
        this.positionOverlayWindow(t),
        this.syncOwnerRenderer(t),
        this.applyWindowInteractivityPolicy(t),
        !this.isCurrentOverlayState(t) ||
          t.window?.isDestroyed() ||
          !t.wantsToBeVisible ||
          t.session.sessionId !== r)
      ) {
        hideOverlayWindow(t);
        return;
      }
      if ((this.positionOverlayWindow(t), !(t.window == null || t.window.isDestroyed()))) {
        if (!isMountedSession(t)) {
          hideOverlayWindow(t);
          return;
        }
        if (e.surfaceMode === `preview`) {
          this.showPreviewWindow(t);
          return;
        }
        ((t.shouldFocusWhenVisible = !1),
          this.recordStateEvent(t, `show-editor`),
          showAndFocusWindow(t.window),
          this.applyWindowInteractivityPolicy(t),
          this.scheduleEditorShowVerification(t, `open`));
      }
    }
    async openPreview(e) {
      await this.open({ ...e, surfaceMode: `preview` });
    }
    closePreview(e, t, n, r) {
      let i = this.getOverlayState(e, t, n);
      i?.session.surfaceMode === `preview` &&
        i.session.target.mode === `edit` &&
        i.session.target.commentId === r &&
        (clearVisibilitySync(i),
        (i.wantsToBeVisible = !1),
        (i.shouldFocusWhenVisible = !1),
        this.recordStateEvent(i, `close-preview`),
        hideOverlayWindow(i));
    }
    updateAnchor({
      owner: e,
      conversationId: t,
      browserTabId: r,
      target: i,
      anchorState: a,
      browserBounds: o,
      viewportScale: s,
    }) {
      let c = this.getOverlayState(e, t, r);
      if (c == null || !n.Su(c.session.target, i)) return;
      c.browserBounds = o;
      let l =
        a == null
          ? null
          : this.createFrame({
              owner: c.owner,
              browserBounds: o,
              viewportScale: s,
              anchorState: a,
              body: c.session.body,
              placementSurfaceSize: c.placementSurfaceSize,
              previewSurfaceSize: c.previewSurfaceSize,
              metadataHeaderHeight: c.metadataHeaderHeight,
              surfaceMode: c.session.surfaceMode,
            });
      ((c.session = {
        ...c.session,
        anchorState: a ?? c.session.anchorState,
        ...(l == null
          ? { placementStrategy: `fallback` }
          : { placementStrategy: l.placementStrategy, previewAlignment: l.previewAlignment }),
      }),
        (c.viewportScale = s),
        this.positionOverlayWindow(c),
        this.syncOwnerRenderer(c),
        this.applyWindowInteractivityPolicy(c));
    }
    setAnnotationSelectionModifierPressed({
      owner: e,
      conversationId: t,
      browserTabId: n,
      pressed: r,
      restoreEditorFocus: i = !1,
    }) {
      let a = this.getOverlayState(e, t, n);
      if (a == null) return;
      let o =
        r &&
        a.session.surfaceMode === `editor` &&
        a.session.target.mode === `create` &&
        a.session.anchorState.anchor.kind !== `text`;
      a.isAnnotationSelectionModifierPressed !== o &&
        ((a.isAnnotationSelectionModifierPressed = o),
        this.applyWindowInteractivityPolicy(a),
        this.syncOwnerRenderer(a),
        !o && i && this.focus(e, t, n));
    }
    routeAnnotationSelectionInputToEditor({
      owner: e,
      conversationId: t,
      browserTabId: n,
      editorInput: r,
    }) {
      let i = this.getOverlayState(e, t, n),
        a = i?.window;
      return i?.isAnnotationSelectionModifierPressed !== !0 ||
        a == null ||
        a.isDestroyed() ||
        !isMountedSession(i)
        ? !1
        : ((i.isAnnotationSelectionModifierPressed = !1),
          this.applyWindowInteractivityPolicy(i),
          this.syncOwnerRenderer(i),
          this.focus(e, t, n),
          typeof r == `string`
            ? ((i.textInsertionSequence += 1),
              this.windowManager.sendMessageToWebContents(i.owner, {
                type: `browser-sidebar-comment-overlay-insert-text`,
                browserTabId: n,
                conversationId: t,
                sessionId: i.session.sessionId,
                sequence: i.textInsertionSequence,
                text: r,
              }))
            : (a.webContents.focus(), a.webContents.sendInputEvent(r)),
          !0);
    }
    setAnnotationSelectionEditorPointerInside({
      owner: e,
      conversationId: t,
      browserTabId: n,
      insideEditor: r,
    }) {
      let i = this.getOverlayState(e, t, n);
      i?.session.surfaceMode === `editor` &&
        i.session.target.mode === `create` &&
        i.session.anchorState.anchor.kind !== `text` &&
        i.isAnnotationSelectionEditorPointerInside !== r &&
        ((i.isAnnotationSelectionEditorPointerInside = r), this.applyWindowInteractivityPolicy(i));
    }
    requestDismiss({ owner: e, conversationId: t, browserTabId: n }) {
      let r = this.getOverlayState(e, t, n);
      r != null &&
        r.wantsToBeVisible &&
        ((r.dismissRequestSequence += 1), this.syncOwnerRenderer(r));
    }
    dismiss(e, t, n) {
      let r = this.getOverlayState(e, t, n);
      if (r == null) return;
      clearVisibilitySync(r);
      let i = r.window != null && !r.window.isDestroyed() && r.window.isFocused();
      ((r.wantsToBeVisible = !1),
        (r.shouldFocusWhenVisible = !1),
        (r.isAnnotationSelectionModifierPressed = !1),
        (r.isAnnotationSelectionEditorPointerInside = !0),
        (r.dismissRequestSequence = 0),
        this.recordStateEvent(r, `dismiss`),
        hideOverlayWindow(r),
        i &&
          r.ownerWindow != null &&
          !r.ownerWindow.isDestroyed() &&
          r.ownerWindow.isVisible() &&
          !r.ownerWindow.isMinimized() &&
          r.ownerWindow.focus());
    }
    focus(e, t, n) {
      let r = this.getOverlayState(e, t, n);
      if (
        r == null ||
        r.session.surfaceMode === `preview` ||
        r.window == null ||
        r.window.isDestroyed()
      )
        return;
      let i = l.BrowserWindow.fromWebContents(r.owner);
      i == null ||
        i.isDestroyed() ||
        !i.isVisible() ||
        i.isMinimized() ||
        (clearVisibilitySync(r),
        r.wantsToBeVisible ||
          ((r.wantsToBeVisible = !0),
          (r.shouldFocusWhenVisible = !1),
          this.positionOverlayWindow(r),
          this.syncOwnerRenderer(r),
          this.applyWindowInteractivityPolicy(r)),
        isMountedSession(r) &&
          (this.recordStateEvent(r, `focus-request`),
          showAndFocusWindow(r.window),
          this.applyWindowInteractivityPolicy(r),
          this.scheduleEditorShowVerification(r, `focus`)));
    }
    close(e, t, n) {
      let r = this.getOverlayState(e, t, n);
      r != null && this.closeOverlayState(r);
    }
    transferConversation(e, t, n, r, i) {
      if (t === r && n === i) return;
      let a = this.getOverlayState(e, t, n);
      if (a == null) return;
      let o = this.getOverlayState(e, r, i);
      (o != null && o !== a && this.closeOverlayState(o),
        this.overlaysByKey.delete(overlayStateKey(e, t, n)),
        (a.browserTabId = i),
        (a.conversationId = r),
        (a.session = {
          ...a.session,
          sessionId: String(this.nextSessionId++),
          conversationId: r,
          pageInitialComment:
            a.session.pageInitialComment == null
              ? void 0
              : { ...a.session.pageInitialComment, shouldReveal: !1 },
        }),
        (a.mountedSessionId = null),
        (a.shouldFocusWhenVisible = a.wantsToBeVisible),
        this.overlaysByKey.set(overlayStateKey(e, r, i), a),
        hideOverlayWindow(a),
        closeOverlayWindow(a),
        this.syncOwnerRenderer(a));
    }
    claimRendererOpenedWindow({
      browserTabId: e,
      conversationId: t,
      hostId: n,
      owner: r,
      sessionId: i,
      window: a,
    }) {
      let o = this.getOverlayState(r, t, e),
        s = l.BrowserWindow.fromWebContents(r);
      if (
        o == null ||
        o.hostId !== n ||
        o.session.sessionId !== i ||
        a.isDestroyed() ||
        s == null ||
        s.isDestroyed() ||
        a.getParentWindow() !== s
      ) {
        a.close();
        return;
      }
      (o.window != null && o.window !== a && closeOverlayWindow(o),
        a.hide(),
        (o.window = a),
        (o.mountedSessionId = null),
        (o.previewSurfaceSize = null),
        (o.metadataHeaderHeight = 0),
        (o.lifetimeCounts.claimCount += 1),
        this.recordStateEvent(o, `claim-window`),
        this.attachOwnerWindowListeners(o),
        a.on(`blur`, () => {
          this.scheduleOverlayVisibilitySync(o);
        }),
        a.on(`focus`, () => {
          clearVisibilitySync(o);
        }),
        a.on(`closed`, () => {
          (o.window === a && ((o.window = null), (o.mountedSessionId = null)),
            this.scheduleOverlayVisibilitySync(o));
        }),
        this.positionOverlayWindow(o),
        this.applyWindowInteractivityPolicy(o),
        this.showOverlayWindowIfOwnerFocused(o),
        this.scheduleOverlayVisibilitySync(o));
    }
    handleOverlayMounted({
      owner: e,
      browserTabId: t,
      conversationId: n,
      sessionId: r,
      placementSurfaceSize: i,
      surfaceSize: a,
      metadataHeaderHeight: o = 0,
      isLayoutReady: s = !0,
    }) {
      let c = this.getOverlayState(e, n, t);
      if (c == null || r !== c.session.sessionId) return;
      let l = c.mountedSessionId !== r;
      ((i == null ? c.placementSurfaceSize != null : sizesDiffer(c.placementSurfaceSize, i)) &&
        (c.placementSurfaceSize = i ?? null),
        a != null && sizesDiffer(c.previewSurfaceSize, a) && (c.previewSurfaceSize = a),
        (c.metadataHeaderHeight = o),
        s &&
          l &&
          ((c.mountedSessionId = r),
          (c.lifetimeCounts.mountCount += 1),
          this.recordStateEvent(c, `mounted`)),
        this.positionOverlayWindow(c),
        this.syncOwnerRenderer(c),
        s &&
          (l ||
            c.window == null ||
            c.window.isDestroyed() ||
            !c.window.isVisible() ||
            c.shouldFocusWhenVisible) &&
          (this.applyWindowInteractivityPolicy(c),
          this.showOverlayWindowIfOwnerFocused(c),
          this.scheduleOverlayVisibilitySync(c)));
    }
    handleOverlayPreviewOpenChanged(e, t) {
      let n = this.getOverlayState(e, t.conversationId, t.browserTabId);
      n != null &&
        t.sessionId === n.session.sessionId &&
        ((n.isPreviewOpen = t.previewOpen),
        this.positionOverlayWindow(n),
        this.syncOwnerRenderer(n),
        this.applyWindowInteractivityPolicy(n));
    }
    getOverlayStateForOwner(e, t, n, { includeHidden: r = !1 } = {}) {
      let i = this.getOverlayState(e, t, n);
      return i == null || (!r && !i.wantsToBeVisible)
        ? null
        : {
            browserTabId: i.browserTabId,
            conversationId: i.conversationId,
            owner: i.owner,
            session: i.session,
          };
    }
    updateSessionForOwner(e, t, n, r) {
      let i = this.getOverlayState(e, t, n);
      return i == null
        ? null
        : ((i.session = r(i.session)),
          {
            browserTabId: i.browserTabId,
            conversationId: i.conversationId,
            owner: i.owner,
            session: i.session,
          });
    }
    getOverlayStateForSession(e, t, n, { includeHidden: r = !1 } = {}) {
      let i = [...this.overlaysByKey.values()].find(
        (r) => r.owner === e && r.conversationId === t && r.session.sessionId === n,
      );
      return i == null || (!r && !i.wantsToBeVisible)
        ? null
        : {
            browserTabId: i.browserTabId,
            conversationId: i.conversationId,
            owner: i.owner,
            session: i.session,
          };
    }
    getOverlayState(e, t, n) {
      return this.overlaysByKey.get(overlayStateKey(e, t, n)) ?? null;
    }
    ensureOverlayState(e) {
      let t = overlayStateKey(e.owner, e.conversationId, e.browserTabId),
        n = this.getOverlayState(e.owner, e.conversationId, e.browserTabId),
        r = l.BrowserWindow.fromWebContents(e.owner);
      if (n != null) {
        if (n.window == null) return n;
        if (n.window.isDestroyed()) this.overlaysByKey.delete(t);
        else {
          if (isOverlayAttachedToOwner(n, r)) return n;
          this.closeOverlayState(n);
        }
      }
      let i = {
        browserTabId: e.browserTabId,
        conversationId: e.conversationId,
        hostId: e.hostId,
        owner: e.owner,
        window: null,
        mountedSessionId: null,
        wantsToBeVisible: !1,
        shouldFocusWhenVisible: !1,
        isPreviewOpen: !1,
        isAnnotationSelectionModifierPressed: !1,
        isAnnotationSelectionEditorPointerInside: !0,
        dismissRequestSequence: 0,
        browserBounds: e.browserBounds,
        viewportScale: e.viewportScale,
        session: this.createSession(e),
        ownerWindow: r,
        ownerWindowListenersCleanup: null,
        ownerDestroyedCleanup: null,
        visibilitySyncTimeout: null,
        previewSurfaceSize: null,
        placementSurfaceSize: null,
        metadataHeaderHeight: 0,
        showVerificationTimeout: null,
        eventSequence: 0,
        textInsertionSequence: 0,
        recentEvents: [],
        lifetimeCounts: { claimCount: 0, hideCount: 0, mountCount: 0, openCount: 0 },
        reportedAnomalyKeys: new Set(),
      };
      (this.overlaysByKey.set(t, i), this.attachOwnerWindowListeners(i));
      let a = () => {
        ((i.ownerDestroyedCleanup = null), this.closeOverlayState(i));
      };
      return (
        (i.ownerDestroyedCleanup = () => {
          e.owner.removeListener(`destroyed`, a);
        }),
        e.owner.once(`destroyed`, a),
        i
      );
    }
    closeOverlayState(e) {
      (this.overlaysByKey.delete(overlayStateKey(e.owner, e.conversationId, e.browserTabId)),
        (e.wantsToBeVisible = !1),
        (e.shouldFocusWhenVisible = !1),
        (e.isAnnotationSelectionModifierPressed = !1),
        (e.isAnnotationSelectionEditorPointerInside = !0),
        (e.dismissRequestSequence = 0),
        this.recordStateEvent(e, `close-state`),
        e.window != null && closeOverlayWindow(e),
        this.detachOwnerWindowListeners(e),
        e.ownerDestroyedCleanup?.(),
        (e.ownerDestroyedCleanup = null),
        clearVisibilitySync(e),
        clearShowVerification(e));
    }
    attachOwnerWindowListeners(e) {
      let t = l.BrowserWindow.fromWebContents(e.owner);
      if (
        (e.ownerWindow === t && e.ownerWindowListenersCleanup != null) ||
        (this.detachOwnerWindowListeners(e), (e.ownerWindow = t), t == null)
      )
        return;
      let n = () => {
          (this.positionOverlayWindow(e), this.syncOwnerRenderer(e));
        },
        r = () => {
          (this.positionOverlayWindow(e),
            this.syncOwnerRenderer(e),
            this.scheduleOverlayVisibilitySync(e));
        },
        i = () => {
          hideOverlayWindow(e);
        },
        a = () => {
          this.scheduleOverlayVisibilitySync(e);
        };
      (t.on(`move`, n),
        t.on(`resize`, n),
        t.on(`focus`, r),
        t.on(`show`, r),
        t.on(`restore`, r),
        t.on(`blur`, a),
        t.on(`hide`, i),
        t.on(`minimize`, i),
        (e.ownerWindowListenersCleanup = () => {
          t.isDestroyed() ||
            (t.removeListener(`move`, n),
            t.removeListener(`resize`, n),
            t.removeListener(`focus`, r),
            t.removeListener(`show`, r),
            t.removeListener(`restore`, r),
            t.removeListener(`blur`, a),
            t.removeListener(`hide`, i),
            t.removeListener(`minimize`, i));
        }));
    }
    detachOwnerWindowListeners(e) {
      (e.ownerWindowListenersCleanup != null && e.ownerWindowListenersCleanup(),
        (e.ownerWindow = null),
        (e.ownerWindowListenersCleanup = null));
    }
    isCurrentOverlayState(e) {
      return this.getOverlayState(e.owner, e.conversationId, e.browserTabId) === e;
    }
    scheduleOverlayVisibilitySync(e) {
      (clearVisibilitySync(e),
        (e.visibilitySyncTimeout = setTimeout(() => {
          if (((e.visibilitySyncTimeout = null), e.window == null || e.window.isDestroyed())) {
            hideOverlayWindow(e);
            return;
          }
          if (!e.wantsToBeVisible) {
            hideOverlayWindow(e);
            return;
          }
          if (!isMountedSession(e)) {
            hideOverlayWindow(e);
            return;
          }
          let t = l.BrowserWindow.fromWebContents(e.owner),
            n = l.BrowserWindow.getFocusedWindow();
          if (!(t == null || t.isDestroyed())) {
            if (!t.isVisible() || t.isMinimized()) {
              hideOverlayWindow(e);
              return;
            }
            if (n !== e.window) {
              if (n === t) {
                this.showOverlayWindowIfOwnerFocused(e);
                return;
              }
              hideOverlayWindow(e);
            }
          }
        }, 0)));
    }
    createSession(e) {
      let t = this.createFrame({
        owner: e.owner,
        browserBounds: e.browserBounds,
        viewportScale: e.viewportScale,
        anchorState: e.anchorState,
        body: e.body,
        placementSurfaceSize: null,
        previewSurfaceSize: null,
        surfaceMode: e.surfaceMode,
      });
      return {
        sessionId: String(this.nextSessionId++),
        siteAnnotationFeaturesEnabled: e.siteAnnotationFeaturesEnabled,
        conversationId: e.conversationId,
        target: e.target,
        anchorState: e.anchorState,
        body: e.body,
        pageInitialComment: e.pageInitialComment,
        ...(e.defaultDesignEditorOpen === !0 ? { defaultDesignEditorOpen: !0 } : {}),
        cwd: e.cwd,
        attachedImages: e.attachedImages,
        designChange: e.designChange,
        designEditorState: e.designEditorState,
        placementStrategy: t.placementStrategy,
        previewAlignment: t.previewAlignment,
        surfaceMode: e.surfaceMode,
        screenshot: e.screenshot,
        screenshotFailed: e.screenshotFailed,
      };
    }
    positionOverlayWindow(e) {
      let { overlayWindowBounds: t } = this.createGeometry({
        owner: e.owner,
        browserBounds: e.browserBounds,
        viewportScale: e.viewportScale,
        anchorState: e.session.anchorState,
        forceFallback: e.session.placementStrategy === `fallback`,
        body: e.session.body,
        placementSurfaceSize: e.placementSurfaceSize,
        previewSurfaceSize: e.previewSurfaceSize,
        metadataHeaderHeight: e.metadataHeaderHeight,
        surfaceMode: e.session.surfaceMode,
        fullWindow: e.isPreviewOpen,
      });
      e.window != null &&
        !e.window.isDestroyed() &&
        !(0, G.default)(e.window.getBounds(), t) &&
        e.window.setBounds(t, !1);
    }
    syncOwnerRenderer(e) {
      if (e.owner.isDestroyed()) return;
      let t = isMountedSession(e),
        n = this.createGeometry({
          owner: e.owner,
          browserBounds: e.browserBounds,
          viewportScale: e.viewportScale,
          anchorState: e.session.anchorState,
          forceFallback: e.session.placementStrategy === `fallback`,
          body: e.session.body,
          placementSurfaceSize: e.placementSurfaceSize,
          previewSurfaceSize: e.previewSurfaceSize,
          metadataHeaderHeight: e.metadataHeaderHeight,
          surfaceMode: e.session.surfaceMode,
          fullWindow: e.isPreviewOpen,
        });
      this.windowManager.sendMessageToWebContents(e.owner, {
        type: `browser-sidebar-comment-overlay-session`,
        browserTabId: e.browserTabId,
        conversationId: e.conversationId,
        session: { ...e.session, previewAlignment: n.previewAlignment },
        placementContext: createPlacementContext({
          ownerWindow: l.BrowserWindow.fromWebContents(e.owner),
          browserBounds: e.browserBounds,
          viewportScale: e.viewportScale,
        }),
        viewportOverlayBounds: createViewportOverlayBounds({
          ownerWindow: l.BrowserWindow.fromWebContents(e.owner),
          browserBounds: e.browserBounds,
        }),
        overlayWindowBounds: n.overlayWindowBounds,
        editorFrame: n.editorFrame,
        maxSurfaceWidth: n.maxSurfaceWidth,
        maxSurfaceHeight: n.maxSurfaceHeight,
        reservedTrayHeight: n.reservedTrayHeight,
        metadataAnchor: n.metadataAnchor,
        visible: e.wantsToBeVisible && t,
        isAnnotationSelectionActive: e.isAnnotationSelectionModifierPressed,
        shouldPrewarm: e.wantsToBeVisible && !t,
        dismissRequestSequence: e.dismissRequestSequence,
      });
    }
    createGeometry({
      owner: e,
      browserBounds: t,
      viewportScale: n,
      anchorState: r,
      forceFallback: i = !1,
      body: a = ``,
      placementSurfaceSize: o,
      previewSurfaceSize: s,
      metadataHeaderHeight: c,
      surfaceMode: u = `editor`,
      fullWindow: d = !1,
    }) {
      return computeOverlayGeometry({
        ownerWindow: l.BrowserWindow.fromWebContents(e),
        browserBounds: t,
        viewportScale: n,
        anchorState: r,
        forceFallback: i,
        body: a,
        placementSurfaceSize: o,
        previewSurfaceSize: s,
        metadataHeaderHeight: c,
        surfaceMode: u,
        fullWindow: d,
      });
    }
    createFrame({
      owner: e,
      browserBounds: t,
      viewportScale: r,
      anchorState: i,
      forceFallback: a = !1,
      body: o = ``,
      placementSurfaceSize: s,
      previewSurfaceSize: c,
      metadataHeaderHeight: u = void 0,
      surfaceMode: d = `editor`,
    }) {
      return n.Qc({
        placementContext: createPlacementContext({
          ownerWindow: l.BrowserWindow.fromWebContents(e),
          browserBounds: t,
          viewportScale: r,
        }),
        anchorState: i,
        forceFallback: a,
        body: o,
        placementSurfaceSize: s,
        previewSurfaceSize: c,
        metadataHeaderHeight: u,
        surfaceMode: d,
      });
    }
    showOverlayWindowIfOwnerFocused(e) {
      if (!e.wantsToBeVisible || !isMountedSession(e)) return;
      let t = l.BrowserWindow.fromWebContents(e.owner),
        n = l.BrowserWindow.getFocusedWindow();
      if (e.window != null && (t?.isFocused() || n === e.window)) {
        if ((this.positionOverlayWindow(e), e.session.surfaceMode === `preview`)) {
          this.showPreviewWindow(e);
          return;
        }
        if (!e.shouldFocusWhenVisible) {
          (showWindowInactive(e.window), this.applyWindowInteractivityPolicy(e));
          return;
        }
        ((e.shouldFocusWhenVisible = !1),
          this.recordStateEvent(e, `show-editor`),
          showAndFocusWindow(e.window),
          this.applyWindowInteractivityPolicy(e),
          this.scheduleEditorShowVerification(e, `owner-focus-sync`));
      }
    }
    applyWindowInteractivityPolicy(e) {
      let t = e.window;
      if (t == null || t.isDestroyed()) return;
      let n = t.isVisible(),
        r =
          e.session.surfaceMode === `editor` &&
          e.session.target.mode === `create` &&
          e.session.anchorState.anchor.kind !== `text`,
        i =
          !n ||
          (!e.isPreviewOpen &&
            (e.session.surfaceMode === `preview` ||
              (r &&
                (e.isAnnotationSelectionModifierPressed ||
                  !e.isAnnotationSelectionEditorPointerInside))));
      t.setIgnoreMouseEvents(i, { forward: n && i });
    }
    showPreviewWindow(e) {
      let t = e.window;
      t == null ||
        t.isDestroyed() ||
        (t.isVisible() || (this.recordStateEvent(e, `show-preview`), showWindowInactive(t)),
        this.applyWindowInteractivityPolicy(e));
    }
    recordStateEvent(e, t) {
      recordOverlayEvent(e, t);
    }
    scheduleEditorShowVerification(e, t) {
      clearShowVerification(e);
      let n = e.session.sessionId;
      e.showVerificationTimeout = setTimeout(() => {
        if (
          ((e.showVerificationTimeout = null),
          !this.isCurrentOverlayState(e) ||
            e.session.sessionId !== n ||
            e.window == null ||
            e.window.isDestroyed() ||
            e.session.surfaceMode !== `editor` ||
            !e.wantsToBeVisible ||
            !isMountedSession(e))
        )
          return;
        let r = l.BrowserWindow.fromWebContents(e.owner);
        if (r == null || r.isDestroyed() || !r.isVisible() || r.isMinimized()) return;
        let i = focusedWindowKind(e, r, l.BrowserWindow.getFocusedWindow()),
          a = e.window.isVisible();
        if (a && i === `overlay`) return;
        let o = e.window.getParentWindow() === r;
        this.reportOverlayAnomaly(e, `post-show-verification-failed`, {
          focusedWindowKind: i,
          hasParentOwner: o,
          ownerFocused: r.isFocused(),
          ownerVisible: r.isVisible(),
          showReason: t,
          windowVisible: a,
        });
      }, 0);
    }
    reportOverlayAnomaly(e, t, n) {
      let r = `${t}:${e.session.sessionId}`;
      e.reportedAnomalyKeys.has(r) ||
        (e.reportedAnomalyKeys.add(r),
        this.errorReporter.reportNonFatal(Error(`Browser comment overlay lifecycle anomaly`), {
          kind: `browser-sidebar-comment-overlay-anomaly`,
          tags: { anomaly: t, surfaceMode: e.session.surfaceMode },
          extra: {
            ...n,
            counts: e.lifetimeCounts,
            hasMountedSession: e.mountedSessionId != null,
            mountedMatchesSession: isMountedSession(e),
            recentEvents: e.recentEvents,
            shouldFocusWhenVisible: e.shouldFocusWhenVisible,
            wantsToBeVisible: e.wantsToBeVisible,
          },
        }));
    }
  }
function showWindowInactive(e) {
  (e.moveTop(), e.showInactive());
}
function showAndFocusWindow(e) {
  (e.moveTop(), e.show(), e.focus());
}
function isMountedSession(e) {
  return e.window != null && !e.window.isDestroyed() && e.mountedSessionId === e.session.sessionId;
}
function isOverlayAttachedToOwner(e, t) {
  return e.window != null && !e.window.isDestroyed() && e.window.getParentWindow() === t;
}
function overlayStateKey(e, t, n) {
  return `${e.id}:${t}\0${n}`;
}
function hideOverlayWindow(e) {
  (clearShowVerification(e),
    e.window != null &&
      !e.window.isDestroyed() &&
      ((e.lifetimeCounts.hideCount += 1),
      recordOverlayEvent(e, `hide`),
      e.window.setIgnoreMouseEvents(!0, { forward: !1 }),
      e.window.hide()));
}
function clearShowVerification(e) {
  e.showVerificationTimeout != null &&
    (clearTimeout(e.showVerificationTimeout), (e.showVerificationTimeout = null));
}
function focusedWindowKind(e, t, n) {
  return n == null ? `none` : n === e.window ? `overlay` : n === t ? `owner` : `other`;
}
function recordOverlayEvent(e, t) {
  ((e.eventSequence += 1),
    e.recentEvents.push({
      event: t,
      mounted: isMountedSession(e),
      sequence: e.eventSequence,
      sessionId: e.session.sessionId,
      surfaceMode: e.session.surfaceMode,
      wantsToBeVisible: e.wantsToBeVisible,
      windowVisible: e.window == null || e.window.isDestroyed() ? null : e.window.isVisible(),
    }),
    e.recentEvents.length > RECENT_EVENT_LIMIT && e.recentEvents.shift());
}
function closeOverlayWindow(e) {
  (e.window != null && !e.window.isDestroyed() && e.window.close(),
    (e.window = null),
    (e.mountedSessionId = null));
}
function createFallbackAnchorState(e, t) {
  let n = { x: e.width / t / 2, y: e.height / t / 2 };
  return {
    anchor: {
      kind: `element`,
      pageUrl: ``,
      frameUrl: null,
      title: ``,
      elementPath: ``,
      point: { xPercent: 50, y: n.y },
      rect: { x: n.x, y: n.y, width: 0, height: 0 },
      isFixed: !1,
      role: null,
      name: null,
      selector: null,
      framePath: [],
      nearbyText: null,
    },
    viewportRect: null,
    viewportPoint: n,
  };
}
function computeOverlayGeometry({
  ownerWindow: e,
  browserBounds: t,
  viewportScale: r = 1,
  anchorState: i,
  forceFallback: a = !1,
  body: o = ``,
  placementSurfaceSize: s,
  previewSurfaceSize: c,
  metadataHeaderHeight: l,
  surfaceMode: u = `editor`,
  fullWindow: d = !1,
}) {
  let f = n.Qc({
    placementContext: createPlacementContext({ ownerWindow: e, browserBounds: t, viewportScale: r }),
    anchorState: i,
    forceFallback: a,
    body: o,
    placementSurfaceSize: s,
    previewSurfaceSize: c,
    metadataHeaderHeight: l,
    surfaceMode: u,
  });
  if (u === `preview`) {
    let e = insetBounds(f.editorWindowBounds, OVERLAY_SURFACE_MARGIN);
    return {
      placementStrategy: f.placementStrategy,
      previewAlignment: f.previewAlignment,
      maxSurfaceWidth: f.maxSurfaceWidth,
      maxSurfaceHeight: f.maxSurfaceHeight,
      reservedTrayHeight: f.reservedTrayHeight,
      overlayWindowBounds: e,
      editorFrame: {
        x: OVERLAY_SURFACE_MARGIN,
        y: OVERLAY_SURFACE_MARGIN,
        width: f.editorWindowBounds.width,
        height: f.editorWindowBounds.height,
      },
    };
  }
  let p = createViewportOverlayBounds({ ownerWindow: e, browserBounds: t }),
    m = d && e != null && !e.isDestroyed() ? e.getContentBounds() : translateBoundsToViewport(p, f.editorWindowBounds);
  return {
    placementStrategy: f.placementStrategy,
    previewAlignment: f.previewAlignment,
    maxSurfaceWidth: f.maxSurfaceWidth,
    maxSurfaceHeight: f.maxSurfaceHeight,
    reservedTrayHeight: f.reservedTrayHeight,
    overlayWindowBounds: m,
    metadataAnchor: f.metadataAnchor,
    editorFrame: {
      x: f.editorWindowBounds.x - m.x,
      y: f.editorWindowBounds.y - m.y,
      width: f.editorWindowBounds.width,
      height: f.editorWindowBounds.height,
    },
  };
}
function createPlacementContext({ ownerWindow: e, browserBounds: t, viewportScale: n }) {
  let r = ownerContentOffset({ ownerWindow: e, browserBounds: t });
  return {
    browserViewportBounds: r,
    workArea: l.screen.getDisplayMatching(r).workArea,
    viewportScale: n,
  };
}
function ownerContentOffset({ ownerWindow: e, browserBounds: t }) {
  if (e == null || e.isDestroyed()) return t;
  let n = e.getContentBounds();
  return { x: Math.round(n.x + t.x), y: Math.round(n.y + t.y), width: t.width, height: t.height };
}
function createViewportOverlayBounds({ ownerWindow: e, browserBounds: t }) {
  let n = ownerContentOffset({ ownerWindow: e, browserBounds: t });
  if (e == null || e.isDestroyed()) return n;
  let r = e.getContentBounds(),
    i = t.x <= 0 ? OWNER_WINDOW_EDGE_MARGIN : 0,
    a = t.y <= 0 ? OWNER_WINDOW_EDGE_MARGIN : 0,
    o = t.x + t.width >= r.width ? OWNER_WINDOW_EDGE_MARGIN : 0,
    s = t.y + t.height >= r.height ? OWNER_WINDOW_EDGE_MARGIN : 0;
  return {
    x: n.x + i,
    y: n.y + a,
    width: Math.max(n.width - i - o, 1),
    height: Math.max(n.height - a - s, 1),
  };
}
function translateBoundsToViewport(e, t) {
  let n = Math.floor(Math.min(e.x, t.x)),
    r = Math.floor(Math.min(e.y, t.y)),
    i = Math.ceil(Math.max(e.x + e.width, t.x + t.width)),
    a = Math.ceil(Math.max(e.y + e.height, t.y + t.height));
  return { x: n, y: r, width: Math.max(i - n, 1), height: Math.max(a - r, 1) };
}
function insetBounds(e, t) {
  return { x: e.x - t, y: e.y - t, width: e.width + t * 2, height: e.height + t * 2 };
}
function sizesDiffer(e, t) {
  return e == null || e.width !== t.width || e.height !== t.height;
}
function clearVisibilitySync(e) {
  e.visibilitySyncTimeout != null &&
    (clearTimeout(e.visibilitySyncTimeout), (e.visibilitySyncTimeout = null));
}

  return BrowserCommentOverlayManager;
}

export { createBrowserCommentOverlayManagerClass };
