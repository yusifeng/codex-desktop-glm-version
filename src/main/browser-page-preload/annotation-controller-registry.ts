function useAnnotationControllerRegistry(deps: any) {
  const { useState, window, $_, B_, C_, Ce, E, Fs, G_, H_, Je, K_, O, Pc, Ry, S, Se, T, W_, Yy, Z_, Ze, _l, al, av, b, be, c, ce, createAnnotationCommentInteractionDisposalController, createAnnotationCommentPreviewCloseController, createAnnotationCommentPreviewController, createAnnotationCreateAnchorUpdateController, createAnnotationDesignEditorOpenController, createAnnotationDesignModifierNotifier, createAnnotationDesignPointSelectionController, createAnnotationEditEditorController, createAnnotationEditorAnchorRestoreController, createAnnotationEditorAnchorSyncController, createAnnotationEditorCommentReconciliationController, createAnnotationElementEditorOpenController, createAnnotationHoverFallbackController, createAnnotationHoverSyncController, createAnnotationInteractionResetController, createAnnotationPointRetryController, createAnnotationPointSelectionController, createAnnotationPointerModeSyncController, createAnnotationPreparedScreenshotController, createAnnotationRemoveSelectionController, createAnnotationScreenshotReadyController, createAnnotationSelectionCommentController, createAnnotationSelectionModifierController, createAnnotationSelectionModifierNotifier, createAnnotationSiteRequestDispatchController, createAnnotationSuspensionNotifier, createAnnotationTextAnchorEditorController, createAnnotationTextHighlightController, createAnnotationUnavailableSiteInteractionController, createAnnotationViewportRefreshScheduler, createAnnotationVirtualSelectionEditorController, cy, dc, du, e, eb, f, fc, g, gu, i, iv, le, m, mc, me, ms, nd, ne, nv, o, od, oe, ou, ov, pe, pl, pu, qe, qv, rb, rt, rv, sd, ss, su, sy, t, tv, u, ut, v, w, wl, xe, yb, yl } = deps;
  let     [viewportRefreshScheduler] = useState(() =>
      createAnnotationViewportRefreshScheduler({
        requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
        cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
        refresh: () => T(C_()),
      }),
    ),
    [screenshotReadyController] = useState(() =>
      createAnnotationScreenshotReadyController({
        requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
        cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
      }),
    ),
    [textHighlightController] = useState(() =>
      createAnnotationTextHighlightController({ apply: (anchor) => pu(anchor) }),
    ),
    [suspensionNotifier] = useState(() =>
      createAnnotationSuspensionNotifier({
        send: (suspended) => t.sendMessageToHost({ type: `browser-sidebar-runtime-annotation-suspension`, suspended }),
      }),
    ),
    [designModifierNotifier] = useState(() =>
      createAnnotationDesignModifierNotifier({
        send: (pressed) => t.sendMessageToHost({ type: `browser-sidebar-runtime-design-modifier-state`, pressed }),
      }),
    ),
    [selectionModifierNotifier] = useState(() =>
      createAnnotationSelectionModifierNotifier({
        send: (pressed) => t.sendMessageToHost({ type: `browser-sidebar-runtime-annotation-selection-modifier-state`, pressed }),
      }),
    ),
    [hoverSyncController] = useState(() =>
      createAnnotationHoverSyncController({
        getPointer: () => E.current,
        updatePointer: (pointer, enabled) => Te.updatePointer(pointer, enabled),
        clearDomHover: () => w.current?.clearHover(),
        isDomHover: (pointer) => w.current?.hover(pointer) === true,
        setPointer: (pointer) => f(pointer),
        clearHoverState: () => {
          (o(null), c(null));
        },
        setHoverState: (value) => o(value),
        resolveElement: (pointer, canUseSiteAnnotationApi) =>
          pl(pointer.x, pointer.y, canUseSiteAnnotationApi, e),
        resolveHover: (element, canUseTweaks) => Yy(element, canUseTweaks),
        hasDesignComments: (comments) => ss(comments),
      }),
    ),
    [pointerModeSyncController] = useState(() =>
      createAnnotationPointerModeSyncController({
        setEnabled: (enabled) => w.current?.setEnabled(enabled),
        invalidate: () => w.current?.invalidate(),
      }),
    ),
    [commentInteractionDisposalController] = useState(() =>
      createAnnotationCommentInteractionDisposalController({
        disposeInteraction: () => Te.dispose(),
        resetModifier: () => {
          (pe(!1), (be.current = !1), m(!1));
        },
        clearPointer: () => f(null),
        clearHover: () => {
          (o(null), c(null));
        },
        clearSelectionHover: () => u(null),
        clearTransientState: () => mc(),
        clearViewportSelection: () => {
          (xe.current = !1), (Se.current = !1);
        },
        nextInteractionGeneration: () => {
          me.current += 1;
        },
        clearDragState: () => {
          (O.current = null), oe(null);
        },
      }),
    ),
    [preparedScreenshotController] = useState(() =>
      createAnnotationPreparedScreenshotController({ setPreparedComment: (commentId) => ne(commentId) }),
    ),
    [Te] = useState(() =>
      Ry({
        rootHost: e,
        onPointerModeChange: pe,
        onPointerChange: f,
        onClearHover: () => {
          (o(null), c(null));
        },
      }),
    ),
    [unavailableSiteInteractionController] = useState(() =>
      createAnnotationUnavailableSiteInteractionController({
        cancelInteraction: () => Te.cancel(),
        markViewportSelection: () => {
          xe.current = !0;
        },
        disablePointerMode: () => pe(!1),
      }),
    ),
    [selectionModifierController] = useState(() =>
      createAnnotationSelectionModifierController({
        setModifierActive: (active) => {
          (be.current = active), m(active);
        },
        clearPointer: () => f(null),
        clearHover: () => {
          (o(null), c(null));
        },
        clearTransient: () => mc(),
        isSelectionSuppressed: () => Ce.current,
        getPointer: () => E.current,
        preparePointer: (pointer, rootHost) => _l(pointer, rootHost),
        resolveElement: (pointer, rootHost, canUseSiteAnnotationApi) =>
          yl(pointer, rootHost, canUseSiteAnnotationApi),
        focusDocument: (document) => fc(document, wl),
        projectAnchor: (element, pointer) => ({ anchor: tv(element, pointer.x, pointer.y).anchor, liveElement: element }),
        setSelectionHover: (value) => c(value),
        resolveHover: (element) => Yy(element),
        setPointer: (pointer) => f(pointer),
      }),
    ),
    [removeSelectionController] = useState(() =>
      createAnnotationRemoveSelectionController({
        getAnchorSelections: (editorState) => G_(editorState.anchor),
        projectSelection: (selections, selection) => al(selections, selection, !0),
        applyAnchorUpdate: (editorState, anchorState) => ut(editorState, anchorState),
      }),
    ),
    [pointRetryController] = useState(() =>
      createAnnotationPointRetryController({
        requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
        cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
      }),
    ),
    [pointSelectionController] = useState(() =>
      createAnnotationPointSelectionController({
        focusEditor: () => t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }),
        getCapturedPoint: () => ce.current,
        clearCapturedPoint: () => {
          ce.current = null;
        },
        now: () => Date.now(),
        captureMaxAge: yb,
        selectCapturedPoint: (point) => w.current?.select(point) === true,
        openCapturedFallback: (element, anchorState) => qe(element, anchorState),
        selectPoint: (point) => w.current?.select(point) === true,
        resolveElement: (point, canUseSiteAnnotationApi) => pl(point.x, point.y, canUseSiteAnnotationApi, e),
        projectAnchor: (element, point) => tv(element, point.x, point.y),
        openAt: (element, anchorState) => qe(element, anchorState),
      }),
    ),
    [designPointSelectionController] = useState(() =>
      createAnnotationDesignPointSelectionController({
        focusEditor: () => t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }),
        getCapturedPoint: () => ce.current,
        clearCapturedPoint: () => {
          ce.current = null;
        },
        now: () => Date.now(),
        captureMaxAge: yb,
        resolveElement: (point, canUseSiteAnnotationApi, mode) =>
          pl(point.x, point.y, canUseSiteAnnotationApi, e, mode),
        projectAnchor: (element, point) => tv(element, point.x, point.y),
        openDesignEditor: (element, anchorState) => Ze(element, anchorState),
      }),
    ),
    [selectionCommentController] = useState(() =>
      createAnnotationSelectionCommentController({
        focusEditor: () => t.sendMessageToHost({ type: `browser-sidebar-runtime-focus-editor` }),
        getPreparedSelection: () => le.current,
        clearPreparedSelection: () => {
          le.current = null;
        },
        getCurrentSelection: () => ou(),
        clearSelection: () => gu(),
        retryAtPoint: (point) => rt(point),
        openFromSelection: (selection) => Je(selection),
      }),
    ),
    [textAnchorEditorController] = useState(() =>
      createAnnotationTextAnchorEditorController({
        clearInteraction: () => w.current?.clear(),
        closePreview: (commentId) => {
          (t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }), v(null));
        },
        openEditor: (anchorState, extras) =>
          t.sendMessageToHost({
            type: `browser-sidebar-runtime-open-editor`,
            target: { mode: `create` },
            anchorState,
            wantsScreenshot: !0,
            ...extras,
          }),
        refreshViewport: () => T(C_()),
        setEditorState: (state) => S(state),
        clearHover: () => {
          (o(null), c(null));
        },
        clearSelectionHover: () => gu(),
      }),
    ),
    [editEditorController] = useState(() =>
      createAnnotationEditEditorController({
        createTargetMap: (rootHost) => eb(rootHost),
        findComment: (comments, request) => comments.find((comment) => comment.id === request.id),
        projectComment: (comment, anchor, selectionIndex) => $_(comment, anchor, selectionIndex),
        resolveTarget: (anchor, preferredId, targets) => sd(anchor, preferredId, targets),
        applyDesignChange: (target, designId) => qv(target, designId),
        projectAnchor: (commentState, target, zoom) => nv(rv(commentState, target, zoom), target),
        projectDraftDesign: (designChange) => cy(designChange),
        projectElementDesign: (target, anchorState, controls, designChange) =>
          sy(target, anchorState, controls, designChange),
        buildEditorAnchor: (commentState, target, targets) => B_(commentState, target, targets),
        closePreview: (commentId) =>
          t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }),
        openEditor: (payload) => t.sendMessageToHost(payload),
        refreshViewport: () => T(C_()),
        setEditorState: (state) => S(state),
        clearPreview: () => v(null),
        rememberTarget: (id, target) => i.rememberTarget(id, target),
      }),
    ),
    [commentPreviewController] = useState(() =>
      createAnnotationCommentPreviewController({
        createTargetMap: (rootHost) => eb(rootHost),
        findComment: (comments, request) => comments.find((comment) => comment.id === request.id),
        resolveTarget: (anchor, preferredId, targets) => sd(anchor, preferredId, targets),
        projectComment: (comment, anchor, selectionIndex) => $_(comment, anchor, selectionIndex),
        projectAnchor: (commentState, target, zoom) => rv(commentState, target, zoom),
        setPreviewComment: (commentId) => v(commentId),
        refreshViewport: () => T(C_()),
        openPreview: (payload) => t.sendMessageToHost(payload),
      }),
    ),
    [designEditorOpenController] = useState(() =>
      createAnnotationDesignEditorOpenController({
        resolveCard: (element) => nd(element),
        normalizeAnchor: (element, anchor, canUseSiteAnnotationApi) => od(element, anchor, canUseSiteAnnotationApi),
        projectCardRect: (rootHost, rect, options) => rb(rootHost, rect, options),
        projectDesign: (element, anchorState, controls, designChange, card) => sy(element, anchorState, controls, designChange, card),
        rememberTarget: (id, element) => i.rememberTarget(id, element),
        createTargetMap: (rootHost) => eb(rootHost),
        applyDesignChange: (element, id) => qv(element, id),
        openEditor: (payload) => t.sendMessageToHost(payload),
        refreshViewport: () => T(C_()),
        setEditorState: (state) => S(state),
        setCard: (card) => o(card),
        closePopover: () => g(!1),
      }),
    ),
    [virtualSelectionEditorController] = useState(() =>
      createAnnotationVirtualSelectionEditorController({
        clearDomInteraction: () => w.current?.clear(),
        closePreview: (commentId) => {
          (t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }), v(null));
        },
        projectAnchor: (text, zoom) => iv(text, zoom),
        projectDesign: (element, anchorState, controls) => sy(element, anchorState, controls),
        rememberTarget: (id, element) => i.rememberTarget(id, element),
        resetModifier: () => {
          (be.current = !1), m(!1);
        },
        clearPointer: () => f(null),
        clearHover: () => {
          (o(null), c(null));
        },
        clearSelectionHover: () => gu(),
        setEditorState: (state) => S(state),
        openEditor: (payload) => t.sendMessageToHost(payload),
      }),
    ),
    [createAnchorUpdateController] = useState(() =>
      createAnnotationCreateAnchorUpdateController({
        cancelEditor: (target) => t.sendMessageToHost({ type: `browser-sidebar-runtime-cancel-editor`, target }),
        resetModifier: () => {
          (be.current = !1), m(!1);
        },
        clearPointer: () => f(null),
        clearTransient: () => mc(),
        clearHover: () => {
          (o(null), c(null));
        },
        clearSelectionHover: () => u(null),
        mergeAnchor: (anchor, selection, index) => K_(anchor, selection, index),
        serializeAnchorState: (state, zoom, viewportScale) => av(state, zoom, viewportScale),
        updateAnchor: (target, anchorState) => t.sendMessageToHost({ type: `browser-sidebar-runtime-update-anchor`, target, anchorState }),
        refreshViewport: () => T(C_()),
        setSelectionHover: (value) => u(value),
        setEditorState: (state) => S(state),
      }),
    ),
    [interactionResetController] = useState(() =>
      createAnnotationInteractionResetController({
        closePreview: (commentId) => t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }),
        resetModifier: () => {
          (be.current = !1), m(!1);
        },
        clearPointer: () => f(null),
        clearTransient: () => mc(),
        clearPreparedSelection: () => {
          le.current = null;
        },
        clearHover: () => {
          (o(null), c(null));
        },
        clearSelectionHover: () => u(null),
        clearPreview: () => v(null),
        clearSelectionSuppression: () => {
          Ce.current = !1;
        },
        clearCapturedPoint: () => b(null),
        clearEditorState: () => S(null),
        nextInteractionGeneration: () => {
          me.current += 1;
        },
        clearViewportSelection: () => {
          (xe.current = !1), (Se.current = !1);
        },
        clearDragState: () => {
          (O.current = null), oe(null);
        },
      }),
    ),
    [hoverFallbackController] = useState(() =>
      createAnnotationHoverFallbackController({
        resolveElement: (x, y, canUseSiteAnnotationApi, rootHost) => pl(x, y, canUseSiteAnnotationApi, rootHost),
        projectAnchor: (element, x, y) => tv(element, x, y),
        openAt: (element, anchorState) => qe(element, anchorState),
        resolveHover: (element) => Yy(element),
        setHover: (hover) => o(hover),
      }),
    ),
    [siteRequestDispatchController] = useState(() =>
      createAnnotationSiteRequestDispatchController({
        resolveTextAnchor: (range) => su(range),
        openFromText: (anchorState, selectionIndex) => Je(anchorState, selectionIndex),
        projectElementAnchor: (element, x, y) => tv(element, x, y),
        openFromElement: (element, anchorState, selectionIndex, extra) => qe(element, anchorState, selectionIndex, extra),
      }),
    ),
    [commentPreviewCloseController] = useState(() =>
      createAnnotationCommentPreviewCloseController({
        closePreview: (commentId) => t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }),
        clearPreview: () => v(null),
      }),
    ),
    [editorAnchorRestoreController] = useState(() =>
      createAnnotationEditorAnchorRestoreController({
        createTargetMap: (rootHost) => eb(rootHost),
        buildAnchorPayload: (editorState, targets) => H_(editorState, targets),
        setEditorState: (state) => S(state),
      }),
    ),
    [elementEditorOpenController] = useState(() =>
      createAnnotationElementEditorOpenController({
        clearDomInteraction: () => w.current?.clear(),
        normalizeAnchor: (element, anchor, canUseSiteAnnotationApi, extra) => od(element, anchor, canUseSiteAnnotationApi, extra),
        closePreview: (commentId) => { t.sendMessageToHost({ type: `browser-sidebar-runtime-close-comment-preview`, commentId }); v(null); },
        projectDesign: (element, anchorState, controls) => sy(element, anchorState, controls),
        rememberTarget: (id, element) => i.rememberTarget(id, element),
        createTargetMap: (rootHost) => eb(rootHost),
        openEditor: (payload) => t.sendMessageToHost(payload),
        resetModifier: () => { (be.current = !1), m(!1); },
        clearPointer: () => f(null),
        refreshViewport: () => T(C_()),
        setEditorState: (state) => S(state),
        clearHover: () => { (o(null), c(null)); },
        clearSelectionHover: () => gu(),
      }),
    ),
    [editorCommentReconciliationController] = useState(() =>
      createAnnotationEditorCommentReconciliationController({
        updateEditorState: (update) => S(update),
      }),
    ),
    [editorAnchorSyncController] = useState(() =>
      createAnnotationEditorAnchorSyncController({
        windowLike: window,
        createTargetMap: (rootHost) => eb(rootHost),
        findComment: (comments, commentId) => comments.find((comment) => comment.id === commentId) ?? null,
        resolveCommentElement: (comment, targets) => Z_(comment, targets) ?? null,
        projectCommentAnchor: (comment, element, zoom) => rv(comment, element, zoom),
        serializeEditorAnchor: (editor, zoom, viewportScale) => av(editor, zoom, viewportScale),
        projectEditAnchor: (editor, comments, targets, zoom) => ov(editor, comments, targets, zoom),
        normalizeEditAnchor: (anchorState, targets) => nv(anchorState, sd(anchorState.anchor, void 0, targets)),
        resolveEditorElement: (anchor, targets) => W_(anchor, targets),
        targetsEqual: (left, right) => ms(left, right),
        textAnchorsEqual: (left, right) => Fs(left, right),
        sendAnchorUpdate: (target, anchorState) =>
          t.sendMessageToHost({ type: `browser-sidebar-runtime-update-anchor`, target, anchorState }),
        refreshViewport: () => T(C_()),
        updateEditorState: (update) => S(update),
        clearCreateHover: () => {
          (E.current = null), o(null), c(null);
        },
        observeFrames: (install) => dc(install),
        observeScrollContainers: (windowLike, anchors, onChange) => Pc(windowLike, anchors, onChange),
        observeTextAnchors: (anchors, onChange) => du(anchors, onChange),
      }),
    );
  return { viewportRefreshScheduler, screenshotReadyController, textHighlightController, suspensionNotifier, designModifierNotifier, selectionModifierNotifier, hoverSyncController, pointerModeSyncController, commentInteractionDisposalController, preparedScreenshotController, Te, unavailableSiteInteractionController, selectionModifierController, removeSelectionController, pointRetryController, pointSelectionController, designPointSelectionController, selectionCommentController, textAnchorEditorController, editEditorController, commentPreviewController, designEditorOpenController, virtualSelectionEditorController, createAnchorUpdateController, interactionResetController, hoverFallbackController, siteRequestDispatchController, commentPreviewCloseController, editorAnchorRestoreController, elementEditorOpenController, editorCommentReconciliationController, editorAnchorSyncController };
}

export { useAnnotationControllerRegistry };
if (typeof module !== `undefined`) module.exports = { useAnnotationControllerRegistry };
