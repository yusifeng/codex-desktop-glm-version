type AnnotationMarkerRecordProjectionDependencies = {
  resolveLiveElement: (anchor: any, id?: string) => any;
  resolveMarkerPoint: (anchor: any, viewport: any, options: any) => any;
};

/** Project render-ready marker records while leaving DOM resolution injectable. */
function projectAnnotationMarkerRecords(
  annotations: any[],
  commentIndex: Map<any, number>,
  viewport: any,
  zoomFactor: number,
  dependencies: AnnotationMarkerRecordProjectionDependencies,
) {
  return annotations.flatMap((annotation) => {
    const commentNumber = commentIndex.get(annotation.id);
    if (commentNumber == null) return [];
    const anchors =
      annotation.anchor.kind === `text`
        ? [annotation.anchor]
        : [annotation.anchor, ...(annotation.additionalAnchors ?? [])];
    return anchors.flatMap((anchor: any, selectionIndex: number) => {
      if (anchor.kind === `virtual`) return [];
      const savedSelectionIndex = annotation.selectionSourceIndexes[selectionIndex] ?? selectionIndex;
      const liveElement =
        anchor.kind === `element`
          ? dependencies.resolveLiveElement(anchor, savedSelectionIndex === 0 ? annotation.id : undefined)
          : null;
      const markerPoint = dependencies.resolveMarkerPoint(anchor, viewport, {
        liveElement,
        viewportSize: annotation.markerViewportSize,
        zoomFactor,
      });
      if (markerPoint == null) return [];
      return [{
        anchor,
        comment: annotation,
        commentNumber,
        key: `${annotation.id}:${anchor.framePath.join(`>`)}:${anchor.selector ?? anchor.elementPath}:${selectionIndex}`,
        markerPoint,
        savedSelectionIndex,
      }];
    });
  });
}

export { projectAnnotationMarkerRecords };
if (typeof module !== `undefined`) module.exports = { projectAnnotationMarkerRecords };
