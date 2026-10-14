type ProjectionDependencies = {
  projectScreenshotPayload: (input: any, dependencies: any) => any;
  unionRects: (rects: any[]) => any;
  projectRenderState: (input: any, dependencies: any) => any;
  collectFlexGapOverlays: (property: any, editor: any, annotation: any, cache: any) => any;
  projectDraftMarkerState: (input: any, dependencies: any) => any;
  resolveMarkerPoint: (anchor: any, viewport: any, options: any) => any;
  countComments: () => number;
  getCommentNumber: (annotation: any) => number;
  projectOverlayStyle: (input: any) => any;
  selectionsEqual: (left: any, right: any) => boolean;
};

/** Projects Wy's screenshot, render, draft-marker and overlay-style state in one pass. */
function projectAnnotationOverlayRuntimeState(input: any, dependencies: ProjectionDependencies) {
  const screenshotPayload = dependencies.projectScreenshotPayload(
    {
      active: input.active,
      selectionRects: input.selectionRects,
      highlightRect: input.highlightRect,
      additionalHighlights: input.additionalHighlights,
      markerRecords: input.markerRecords,
      markerPoints: input.markerPoints,
      zoomFactor: input.zoomFactor,
    },
    { unionRects: dependencies.unionRects },
  );
  const hasLinkedDraftSelection =
    !input.hasActiveSelection &&
    input.editor?.target.mode === `create` &&
    input.editor.anchor.type !== `text` &&
    input.modifierActive &&
    input.selectedPoint != null &&
    input.additionalSelections.some((selection: any) =>
      dependencies.selectionsEqual(selection, input.selectedPoint),
    );
  const renderState = dependencies.projectRenderState(
    {
      hasActiveSelection: input.hasActiveSelection,
      flexGapProperty: input.flexGapProperty,
      editor: input.editor,
      activeAnnotation: input.activeAnnotation,
      elementCache: input.elementCache,
      showMetadata: input.showMetadata,
      hoverSnapshot: input.hoverSnapshot,
      highlightRect: input.activeHighlightRect,
      selectedComment: input.selectedComment,
      modifierActive: input.modifierActive,
      selectedPoint: input.selectedPoint,
      hasLinkedDraftSelection,
      nativeTextSelection: input.nativeTextSelection,
      hotspots: input.hotspots,
    },
    { collectFlexGapOverlays: dependencies.collectFlexGapOverlays },
  );
  const draftMarkerState = dependencies.projectDraftMarkerState(
    {
      hasActiveSelection: input.hasActiveSelection,
      anchor: input.draftAnchor,
      matchedAnnotation: input.matchedAnnotation,
      isOriginalPage: input.isOriginalPage,
      additionalSelections: input.additionalSelections,
      viewportSize: input.editorViewportSize,
      viewport: input.viewport,
      zoomFactor: input.zoomFactor,
    },
    {
      resolveMarkerPoint: dependencies.resolveMarkerPoint,
      countComments: dependencies.countComments,
      getCommentNumber: dependencies.getCommentNumber,
    },
  );
  const overlayStyle = dependencies.projectOverlayStyle({
    baseStyle: input.baseStyle,
    zoomFactor: input.zoomFactor,
    viewportScale: input.viewportScale,
    markerSize: input.markerSize,
    metadataHeight: input.metadataHeight,
    scaleVariable: input.scaleVariable,
  });
  if (input.interactionMode === `comment` && !input.suspended && input.editor == null) {
    overlayStyle.cursor = `none`;
    if (!input.nativeTextSelection) overlayStyle.pointerEvents = `auto`;
  }
  return { screenshotPayload, renderState, draftMarkerState, overlayStyle };
}

export { projectAnnotationOverlayRuntimeState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationOverlayRuntimeState };
