type AnnotationDraftMarkerStateDependencies = {
  resolveMarkerPoint: (anchor: any, viewport: any, options: any) => any;
  countComments: () => number;
  getCommentNumber: (annotation: any) => number | undefined;
};

/** Project the draft marker point and its display number without owning DOM state. */
function projectAnnotationDraftMarkerState(
  {
    hasActiveSelection,
    anchor,
    matchedAnnotation,
    isOriginalPage,
    additionalSelections,
    viewportSize,
    viewport,
    zoomFactor,
  }: {
    hasActiveSelection: boolean;
    anchor: any;
    matchedAnnotation: any;
    isOriginalPage: boolean;
    additionalSelections: any[];
    viewportSize: any;
    viewport: any;
    zoomFactor: number;
  },
  dependencies: AnnotationDraftMarkerStateDependencies,
) {
  const markerPoint =
    !hasActiveSelection &&
    anchor != null &&
    anchor.kind !== `virtual` &&
    (!isOriginalPage || matchedAnnotation == null)
      ? dependencies.resolveMarkerPoint(anchor, viewport, {
          includeElementFrameScroll: true,
          liveElement: additionalSelections[0]?.liveElement ?? null,
          viewportSize,
          zoomFactor,
        })
      : null;
  const commentCount = markerPoint == null ? 0 : dependencies.countComments();
  const commentNumber =
    markerPoint == null
      ? null
      : matchedAnnotation == null
        ? commentCount === 0
          ? null
          : commentCount + 1
        : (dependencies.getCommentNumber(matchedAnnotation) ?? null);
  return { markerPoint, commentNumber };
}

export { projectAnnotationDraftMarkerState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationDraftMarkerState };
