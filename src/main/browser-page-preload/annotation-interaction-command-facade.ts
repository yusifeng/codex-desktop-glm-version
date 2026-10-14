/** Owns the React command facade between annotation UI state and long-lived controllers. */
function useAnnotationInteractionCommandFacade(deps: any) {
  const {
    useCallback, useEffect, useEffectEvent, rootHost: e, bridge: t, runtimeState: n,
    canUseSiteAnnotationApi: A, previewCommentId: _, comments: Ee, zoom: j, editor: x,
    interactionMode: k, isSuspended: De, canUseTweaks: Ne, multiSelectEnabled: Oe,
    setSelectedCommentId: b, setDomHover: o, setSelectionHover: c, setFeedback: C,
    interactionRef: w, preparedSelectionRef: le, getCurrentSelection: ou,
    getAnnotationEditorDefault: Iy, document, annotationEditorDefaultKey: fb,
    createDomInteraction: t_, elementEditorOpenController, textAnchorEditorController,
    editEditorController, commentPreviewController, designEditorOpenController,
    siteRequestDispatchController, virtualSelectionEditorController, hoverFallbackController,
    commentPreviewCloseController, pointerModeSyncController, pointSelectionController, designPointSelectionController,
    pointRetryController, selectionCommentController, viewportRefreshScheduler,
    createAnchorUpdateController, removeSelectionController, editorCommentReconciliationController,
    interactionResetController, hoverSyncController, editorAnchorRestoreController,
    selectionModifierController,
  } = deps;

  const qe = useCallback(
      (target: any, anchorState: any, extras: any, _options: any) =>
        elementEditorOpenController.open(target, anchorState, { annotationEditorDefault: Iy(document, fb), ...extras }, {
          canUseSiteAnnotationApi: A,
          previewCommentId: _,
          rootHost: e,
          getAnnotationControls: t.getAnnotationControls,
        }),
      [elementEditorOpenController, A, _, e, t],
    ),
    Je = useCallback(
      (anchorState: any, extras: any) => textAnchorEditorController.open(anchorState, extras, _),
      [textAnchorEditorController, _],
    ),
    Ye = useCallback(
      (comment: any, options: any, selectionIndex = 0) =>
        editEditorController.open(comment, options, selectionIndex, {
          comments: Ee,
          rootHost: e,
          previewCommentId: _,
          canUseSiteAnnotationApi: A,
          zoom: j,
          getAnnotationControls: t.getAnnotationControls,
        }),
      [editEditorController, Ee, e, _, A, j, t],
    ),
    Xe = useCallback(
      (commentId: any, anchor: any, position: any) =>
        commentPreviewController.open(commentId, anchor, position, { comments: Ee, rootHost: e, zoom: j }),
      [commentPreviewController, Ee, e, j],
    ),
    Ze = useCallback(
      (target: any, anchorState: any) =>
        designEditorOpenController.open(target, anchorState, {
          rootHost: e,
          canUseSiteAnnotationApi: A,
          viewportScale: n.viewportScale,
          zoom: j,
          getAnnotationControls: t.getAnnotationControls,
        }),
      [designEditorOpenController, e, A, n.viewportScale, j, t],
    ),
    Qe = useEffectEvent((request: any, target: any, anchor: any, options: any) =>
      siteRequestDispatchController.dispatch(request, target, anchor, options, { editorOpen: x != null }),
    );

  useEffect(
    () => t.subscribeToSiteAnnotationRequests?.((request: any, target: any, anchor: any, options: any) =>
      Qe(request, target, anchor, options)),
    [t],
  );

  const $e = useCallback(
      (commentId: any) => commentPreviewCloseController.close(commentId),
      [commentPreviewCloseController],
    ),
    et = useEffectEvent((selection: any, options: any) => {
      virtualSelectionEditorController.open(selection, options, {
        editorOpen: x != null,
        previewCommentId: _,
        zoom: j,
        canUseTweaks: Ne,
        getAnnotationControls: t.getAnnotationControls,
      });
    }),
    tt = useEffectEvent((target: any, options: any) => {
      hoverFallbackController.handle(target, options, {
        editorOpen: x != null,
        interactionMode: k,
        canUseSiteAnnotationApi: A,
        rootHost: e,
      });
    });

  useEffect(() => {
    const interaction = t_({
      rootHost: e,
      onClearDomHover: () => {
        (o(null), c(null));
      },
      onFeedback: C,
      onSelected: et,
      onFallback: tt,
    });
    w.current = interaction;
    return () => {
      (interaction.dispose(), (w.current = null));
    };
  }, [e]);
  useEffect(() => {
    w.current?.setEnabled(A && k === `comment` && !De && !n.isAgentControllingBrowser);
  }, [A, k, De, n.isAgentControllingBrowser]);
  useEffect(() => {
    x?.anchor.type !== `virtual` && w.current?.clear();
  }, [x]);

  const nt = useEffectEvent((enabled: any) =>
      pointerModeSyncController.sync(enabled, n.zoomPercent, n.isAgentControllingBrowser),
    ),
    rt = useCallback(
      (point: any) => pointSelectionController.select(point, { isEditorOpen: x != null, canUseSiteAnnotationApi: A }),
      [pointSelectionController, x, A],
    ),
    it = useCallback((value: any) => pointRetryController.retry(value, (point: any) => rt(point)), [rt, pointRetryController]),
    at = useCallback(
      (message: any) => selectionCommentController.create(message, x != null),
      [selectionCommentController, x],
    ),
    ot = useCallback((value: any) => {
      le.current = ou(value);
    }, []),
    st = useCallback(
      (point: any, mode = `design`) =>
        designPointSelectionController.open(point, mode, {
          isEditorOpen: x != null,
          canUseSiteAnnotationApi: A,
        }),
      [designPointSelectionController, x, A],
    ),
    ct = useCallback((value: any) => pointRetryController.retry(value, (point: any) => st(point)), [st, pointRetryController]),
    lt = useCallback(() => viewportRefreshScheduler.schedule(), [viewportRefreshScheduler]),
    ut = useCallback(
      (editor: any, anchorState: any, options: any) => createAnchorUpdateController.update(editor, anchorState, options, {
        multiSelectEnabled: Oe,
        zoom: j,
        viewportScale: n.viewportScale,
      }),
      [createAnchorUpdateController, Oe, j, n.viewportScale],
    ),
    dt = useEffectEvent((selection: any) =>
      removeSelectionController.remove(selection, { multiSelectEnabled: Oe, editorState: x }),
    ),
    ft = useEffectEvent((commentId = _) => {
      commentPreviewCloseController.close(commentId);
    }),
    pt = useEffectEvent((comments: any) => editorCommentReconciliationController.reconcile(comments)),
    mt = useEffectEvent((options: any) => interactionResetController.reset(options)),
    ht = useEffectEvent((comment: any) => {
      (Ye(comment), b(null));
    }),
    _t = useEffectEvent((pointer: any) =>
      hoverSyncController.sync(pointer, { modeAllowsHover: k !== `comment` || De, hasOpenEditor: x != null }),
    ),
    vt = useEffectEvent((state: any) => editorAnchorRestoreController.restore(state, e)),
    yt = useEffectEvent((enabled: any) =>
      selectionModifierController.sync(enabled && Oe, {
        rootHost: e,
        isCreateElementTarget: x?.target.mode === `create` && x.anchor.type !== `text`,
        canUseSiteAnnotationApi: A,
      }),
    );

  return { qe, Je, Ye, Xe, Ze, $e, nt, rt, it, at, ot, st, ct, lt, ut, dt, ft, pt, mt, ht, _t, vt, yt };
}

export { useAnnotationInteractionCommandFacade };
if (typeof module !== `undefined`) module.exports = { useAnnotationInteractionCommandFacade };
