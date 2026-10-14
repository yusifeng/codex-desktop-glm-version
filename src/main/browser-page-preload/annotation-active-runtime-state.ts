type ProjectionDependencies = {
  projectActiveView: (previewCommentId: any, comments: any[], selectedCommentId: any) => any;
  resolveEditorAnchor: (anchor: any) => any;
  splitEditorAnchor: (anchor: any) => any;
  resolveAdditionalAnchor: (anchor: any, cache: any) => any;
  selectionsEqual: (left: any, right: any) => boolean;
  textAnchorsEqual: (left: any, right: any) => boolean;
  isOriginalPage: (pageUrl: any) => boolean;
  projectMarkerRecords: (annotations: any[], numbering: any, viewport: any, zoom: number, dependencies: any) => any[];
  resolveLiveElement: (anchor: any, id: any) => any;
  resolveMarkerPoint: (anchor: any, viewport: any, options: any) => any;
  clusterMarkerPoints: (points: any[], width: number) => any;
  projectActiveGeometry: (active: any, cache: any, dependencies: any) => any;
  resolveCommentElement: (annotation: any, cache: any) => any;
  resolveDesignElement: (anchor: any, annotationId: any, cache: any) => any;
  projectRegionRecords: (input: any, dependencies: any) => any;
  shouldSuppressRegion: (annotation: any, editor: any, activeAnnotation: any) => boolean;
  projectTextPreviewState: (input: any, dependencies: any) => any;
  resolveTextAnchor: (anchor: any) => any;
  resolveSelectionRects: (anchor: any) => any;
};

/** Projects Wy's active annotation, draft matching, markers, regions and text preview. */
function projectAnnotationActiveRuntimeState(input: any, dependencies: ProjectionDependencies) {
  const activeView = dependencies.projectActiveView(
    input.previewCommentId,
    input.visibleComments,
    input.selectedCommentId,
  );
  const { active, activeId, displayAnnotations, hasActiveSelection } = activeView;
  const draftAnchor = input.editor?.target.mode === `create`
    ? dependencies.resolveEditorAnchor(input.editor.anchor)
    : null;
  const draftTextAnchor = input.editor?.target.mode === `create` && input.editor.anchor.type === `text`
    ? input.editor.anchor.value
    : null;
  const additionalSelections = input.editor?.target.mode === `create` && input.editor.anchor.type !== `text`
    ? [dependencies.splitEditorAnchor(input.editor.anchor).primary, ...input.editor.anchor.additionalSelections]
    : [];
  const editorViewportSize = input.editor?.target.mode === `create` && input.editor.anchor.type !== `text`
    ? input.editor.anchor.viewportSize
    : undefined;
  const linkedSelectionIndex =
    input.multiSelectEnabled &&
    !hasActiveSelection &&
    input.activeHighlightRect == null &&
    input.editor?.target.mode === `create` &&
    input.editor.anchor.type !== `text` &&
    input.linkedSelectionIndex != null &&
    input.linkedSelectionIndex >= 0 &&
    input.linkedSelectionIndex < additionalSelections.length
      ? input.linkedSelectionIndex
      : null;
  const matchesDraft = (annotation: any) =>
    [annotation.anchor, ...(annotation.additionalAnchors ?? [])].some((anchor) =>
      draftTextAnchor == null
        ? anchor.kind !== `text` && additionalSelections.some((selection: any) =>
          dependencies.selectionsEqual(dependencies.resolveAdditionalAnchor(anchor, input.elementCache), selection),
        )
        : dependencies.textAnchorsEqual(anchor, draftTextAnchor),
    );
  const matchedAnnotation = draftTextAnchor == null && additionalSelections.length === 0
    ? null
    : input.visibleComments.find(matchesDraft) ?? input.allComments.find(matchesDraft) ?? null;
  const originalPage = dependencies.isOriginalPage(input.pageUrl);
  let markerAnnotations = input.visibleComments;
  if (active?.kind === `comment`) markerAnnotations = originalPage ? [active.annotation] : input.visibleComments;
  else if (originalPage || hasActiveSelection) markerAnnotations = [];
  else if (matchedAnnotation != null) markerAnnotations = input.visibleComments.filter(
    (annotation: any) => annotation.id !== matchedAnnotation.id,
  );
  const markerRecords = dependencies.projectMarkerRecords(
    markerAnnotations, input.numbering, input.viewport, input.zoomFactor,
    { resolveLiveElement: dependencies.resolveLiveElement, resolveMarkerPoint: dependencies.resolveMarkerPoint },
  );
  const markerPoints = dependencies.clusterMarkerPoints(
    markerRecords.map(({ markerPoint }: any) => markerPoint),
    input.viewport.width * input.zoomFactor,
  );
  const activeGeometry = dependencies.projectActiveGeometry(active, input.elementCache, {
    resolveCommentElement: dependencies.resolveCommentElement,
    resolveDesignElement: dependencies.resolveDesignElement,
    resolveAdditionalAnchor: dependencies.resolveAdditionalAnchor,
    isOriginalPage: dependencies.isOriginalPage,
  });
  const selectedComment = input.previewCommentId == null
    ? null
    : input.visibleComments.find((annotation: any) => annotation.id === input.previewCommentId) ?? null;
  const regionRecords = dependencies.projectRegionRecords({
    enabled: (input.markersEnabled && input.markersVisible) || (hasActiveSelection && active?.kind === `comment`),
    annotations: displayAnnotations,
    editor: input.editor,
    activeAnnotation: active?.kind === `comment` ? active.annotation : null,
  }, { shouldSuppress: dependencies.shouldSuppressRegion });
  const textPreviewState = dependencies.projectTextPreviewState({
    active,
    hasActiveSelection,
    draft: input.editor,
    isSuspended: input.suspended,
    areMarkersVisible: input.markersVisible,
    selectedComment,
  }, { resolveTextAnchor: dependencies.resolveTextAnchor, resolveSelectionRects: dependencies.resolveSelectionRects });
  return {
    activeView, active, activeId, displayAnnotations, hasActiveSelection, draftAnchor, draftTextAnchor,
    additionalSelections, editorViewportSize, linkedSelectionIndex, matchedAnnotation, originalPage,
    markerRecords, markerPoints, activeGeometry, selectedComment, regionRecords, textPreviewState,
  };
}

export { projectAnnotationActiveRuntimeState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationActiveRuntimeState };
