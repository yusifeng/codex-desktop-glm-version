function installAnnotationHostMessageController(deps: any) {
  const { t, dispatchAnnotationWyHostMessage, Ne, Oe, i, nt, _t, unavailableSiteInteractionController, ve, ft, commentInteractionDisposalController, u, r, projectAnnotationRuntimeSyncState, T, C_, g, ie, preparedScreenshotController, ot, b, closeAnnotationEditor, w, mc, lb, be, m, f, xe, Se, o, c, O, oe, me, S, ms, rt, it, at, st, ct, yt, dt, restoreAnnotationEditor, E, vt, lt, viewportRefreshScheduler } = deps;
    let e = t.subscribeToHostMessages((e) => {
      if (dispatchAnnotationWyHostMessage(e, { canUseTweaks: Ne, canUseMultiSelect: Oe }, {
        syncContext: (message) => i.sync(message),
        syncPointerMode: (message) => nt(message),
        syncHover: (message) => _t(message),
        cancelUnavailableSiteInteraction: () => unavailableSiteInteractionController.cancel(),
        clearModifierOnModeChange: () => { ve.current = !1; },
        clearPreparedScreenshot: () => ft(),
        disposeCommentInteraction: () => commentInteractionDisposalController.dispose(),
        clearSelectionModifier: () => u(null),
        applySyncState: (message, scheduleRefresh) => r((previous) => {
          message.zoomPercent !== previous.zoomPercent && scheduleRefresh();
          return projectAnnotationRuntimeSyncState(message);
        }),
        refreshViewport: () => T(C_()),
        syncDesignModifier: (message) => g(message.interactionMode === `comment` && message.isDesignModifierPressed === !0),
        clearDesignScrub: () => ie(null),
        reconcilePreparedScreenshot: (message) => preparedScreenshotController.reconcile(message.comments),
        prepareScreenshot: (commentId) => preparedScreenshotController.prepare(commentId),
        captureTextSelection: () => ot(),
        selectComment: (commentId) => b(commentId),
        closeEditor: (message) => {
          closeAnnotationEditor(message.target, {
            clearInteraction: () => w.current?.clear(),
            clearTransientState: () => mc(),
            flushSync: (callback) => (0, lb.flushSync)(callback),
            resetModifierState: () => { be.current = !1; m(!1); },
            clearPointerState: () => f(null),
            clearViewportSelection: () => { xe.current = !1; Se.current = !1; },
            clearDesignScrub: () => ie(null),
            clearPreparedScreenshot: () => preparedScreenshotController.clear(),
            clearHover: () => { o(null); c(null); },
            clearSelectionHover: () => u(null),
            clearDragState: () => { O.current = null; oe(null); },
            clearEditorRef: () => {},
            nextInteractionGeneration: () => { me.current += 1; },
            setEditorState: (update) => S(update),
            matchesTarget: (state, target) => ms(state.target, target),
          });
        },
        setDesignScrub: (property) => ie(property),
        clearSelectionHover: () => u(null),
        createCommentAtPoint: (point) => rt(point),
        retryCreateCommentAtPoint: (point) => it(point),
        createCommentFromSelection: (message) => at(message),
        openDesignEditorAtPoint: (point) => st(point),
        retryOpenDesignEditorAtPoint: (point) => ct(point),
        setSelectionModifier: (pressed) => yt(pressed),
        setSelectionHover: (selectionIndex) => u(selectionIndex),
        removeAnnotationSelection: (selectionIndex) => dt(selectionIndex),
        restoreEditor: (message) => {
          restoreAnnotationEditor(message, {
            clearInteraction: () => w.current?.clear(),
            resetModifierState: () => { be.current = !1; m(!1); },
            clearAnchorPoint: () => { E.current = null; },
            clearPointerState: () => f(null),
            clearTransientState: () => mc(),
            clearHover: () => { o(null); c(null); },
            clearSelectionHover: () => u(null),
            restoreEditor: (restoreMessage) => vt(restoreMessage),
          });
        },
      }, () => lt())) return;
    });
    return () => {
      (viewportRefreshScheduler.cancel(), e());
    };
}
export { installAnnotationHostMessageController };
if (typeof module !== `undefined`) module.exports = { installAnnotationHostMessageController };
