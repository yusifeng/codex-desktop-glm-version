type AnnotationScreenshotPayloadProjectionDependencies = {
  unionRects: (rects: any[]) => any;
};

/** Project the screenshot-ready viewport rect and active marker point. */
function projectAnnotationScreenshotPayload(
  {
    active,
    selectionRects,
    highlightRect,
    additionalHighlights,
    markerRecords,
    markerPoints,
    zoomFactor,
  }: {
    active: any;
    selectionRects: any[];
    highlightRect: any;
    additionalHighlights: any[];
    markerRecords: any[];
    markerPoints: any[];
    zoomFactor: number;
  },
  dependencies: AnnotationScreenshotPayloadProjectionDependencies,
) {
  const annotationViewportRect =
    active == null
      ? null
      : dependencies.unionRects([
          ...selectionRects,
          ...(highlightRect == null ? [] : [highlightRect]),
          ...additionalHighlights.map(({ rect }) => rect),
        ]);
  const activeMarkerIndex =
    active?.kind === `comment`
      ? markerRecords.findIndex(({ comment }) => comment.id === active.annotation.id)
      : -1;
  const markerPoint = activeMarkerIndex === -1 ? undefined : markerPoints[activeMarkerIndex];
  const markerViewportPoint =
    markerPoint == null
      ? undefined
      : { x: markerPoint.x / zoomFactor, y: markerPoint.y / zoomFactor };
  return { annotationViewportRect, markerViewportPoint };
}

export { projectAnnotationScreenshotPayload };
if (typeof module !== `undefined`) module.exports = { projectAnnotationScreenshotPayload };
