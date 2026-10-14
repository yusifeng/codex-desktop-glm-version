function useAnnotationReconciliationLifecycle(deps: any) {
  const { useEffect, useLayoutEffect, rootHost, getElementCache, comments, activeDesignChange, editor,
    previewCommentId, pageComments, closePreview, reconcileComments, interactionMode, resetInteraction,
    isSuspended, pointerRef, nativeTextSelection, installNativeSelection, selectedCommentId, openComment } = deps;
  useEffect(() => {
    const targets = getElementCache(rootHost);
    targets.forEach((element: any, annotationId: any) => {
      if (((!comments.some((comment: any) => comment.id === annotationId) &&
        annotationId !== activeDesignChange?.id &&
        (editor?.anchor.type !== `element` || editor.anchor.element !== element)) || !element.isConnected)) {
        targets.delete(annotationId);
      }
    });
    if (previewCommentId != null && !pageComments.some((comment: any) => comment.id === previewCommentId)) {
      closePreview(previewCommentId);
    }
    reconcileComments(pageComments);
  }, [activeDesignChange, editor, comments, previewCommentId, rootHost, pageComments]);
  useEffect(() => {
    if (interactionMode === `browse`) resetInteraction(previewCommentId);
  }, [previewCommentId, interactionMode]);
  useLayoutEffect(() => {
    if (interactionMode === `comment` && !isSuspended && editor == null) {
      return installNativeSelection(rootHost, pointerRef.current, nativeTextSelection);
    }
  }, [editor, interactionMode, isSuspended, rootHost, nativeTextSelection]);
  useEffect(() => {
    if (selectedCommentId == null) return;
    const comment = comments.find((candidate: any) => candidate.id === selectedCommentId) ?? null;
    if (comment != null) openComment(comment);
  }, [comments, selectedCommentId]);
}

function useAnnotationGlobalInputLifecycle(deps: any) {
  const { useEffectEvent, useEffect, suspensionNotifier, interactionMode, suspensionRef, spaceKeyRef,
    normalizeKeyboardModifier, isEditableElement, preservesTyping, createGlobalInputTracking,
    observeFrames, toViewportPoint, pointerRef, document } = deps;
  const updateSuspension = useEffectEvent((suspended: boolean) => {
    if (suspensionNotifier.update(interactionMode, suspended)) suspensionRef.current = suspended;
  });
  const handleKey = useEffectEvent((event: any) => {
    if (event.isTrusted && event.code === `Space` && event.type === `keydown` && !event.repeat) {
      spaceKeyRef.current = false;
    }
    const spacePressed = spaceKeyRef.current && event.code === `Space`;
    if (interactionMode !== `comment` && !spacePressed) return;
    const next = normalizeKeyboardModifier(event, spacePressed || deps.isSuspended || suspensionRef.current, {
      preserveTyping: event.composedPath().some((element: any) => isEditableElement(element) && preservesTyping(element)),
    });
    if (next != null) {
      spaceKeyRef.current = next;
      updateSuspension(next);
    }
  });
  useEffect(() => createGlobalInputTracking({
    observeFrames,
    isTrusted: (event: any) => event.isTrusted,
    toViewportPoint,
    onKeyDown: handleKey,
    onKeyUp: handleKey,
    onPointerMove: (point: any) => { pointerRef.current = point; },
    onBlur: () => { pointerRef.current = null; },
    hasFocus: () => document.hasFocus(),
    clearTransientModifierState: () => { suspensionRef.current = false; spaceKeyRef.current = false; },
  }).install(), []);
}

function useAnnotationHoverRefreshLifecycle(deps: any) {
  const { useEffect, interactionMode, isSuspended, editor, canUseSiteAnnotationApi, createHoverRefreshController } = deps;
  useEffect(() => {
    if (interactionMode !== `comment` || isSuspended || editor != null) return;
    const controller = createHoverRefreshController();
    const cleanup = controller.install();
    return () => {
      cleanup();
      controller.dispose();
    };
  }, [editor, canUseSiteAnnotationApi, interactionMode, isSuspended, deps.rootHost, deps.showMetadata]);
}

function useAnnotationAnchorRuntimeLifecycle(deps: any) {
  const { useEffect, useLayoutEffect, editorAnchorSyncController, editor, previewCommentId, comments,
    rootHost, zoom, viewportScale, interactionMode, canUseTweaks, designModifierPressed,
    designModifierNotifier, targetRegistry, syncDesignChanges, visibleDesignChanges, elementCache,
    createAnchorObservationController, anchorObservationState } = deps;
  useEffect(() => editorAnchorSyncController.install({
    editor, previewCommentId, comments, rootHost, zoom, viewportScale,
  }), [editorAnchorSyncController, editor, comments, previewCommentId, rootHost, viewportScale, zoom]);
  useEffect(() => {
    designModifierNotifier.update(interactionMode === `comment` && editor == null && canUseTweaks && designModifierPressed);
  }, [editor, canUseTweaks, interactionMode, designModifierPressed, designModifierNotifier]);
  useEffect(() => () => targetRegistry.clear(), [targetRegistry]);
  useEffect(() => syncDesignChanges(interactionMode === `comment` ? visibleDesignChanges : deps.emptyCollection, elementCache),
    [interactionMode, elementCache, visibleDesignChanges]);
  useLayoutEffect(() => createAnchorObservationController().install(anchorObservationState), [
    editor, anchorObservationState.previewCommentId, comments, anchorObservationState.observeDocumentScroll,
    anchorObservationState.observeMutations, interactionMode, anchorObservationState.interactionLayer,
    rootHost, anchorObservationState.hasDisplayAnnotations,
  ]);
}

export {
  useAnnotationReconciliationLifecycle,
  useAnnotationGlobalInputLifecycle,
  useAnnotationHoverRefreshLifecycle,
  useAnnotationAnchorRuntimeLifecycle,
};
if (typeof module !== `undefined`) module.exports = {
  useAnnotationReconciliationLifecycle,
  useAnnotationGlobalInputLifecycle,
  useAnnotationHoverRefreshLifecycle,
  useAnnotationAnchorRuntimeLifecycle,
};
