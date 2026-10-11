type AnnotationActiveGeometryDependencies = {
  resolveCommentElement: (annotation: any, cache: Map<any, any>) => any;
  resolveDesignElement: (anchor: any, annotationId: string, cache: Map<any, any>) => any;
  resolveAdditionalAnchor: (anchor: any, cache: Map<any, any>) => any;
  isOriginalPage: (pageUrl: string) => boolean;
};

/** Projects active element/additional anchors and screenshot-skip eligibility. */
function projectAnnotationActiveGeometry(
  active: any,
  cache: Map<any, any>,
  dependencies: AnnotationActiveGeometryDependencies,
) {
  const activeElement =
    active?.annotation.anchor.kind === `element`
      ? active.kind === `comment`
        ? (dependencies.resolveCommentElement(active.annotation, cache) ?? null)
        : (dependencies.resolveDesignElement(active.annotation.anchor, active.annotation.id, cache) ?? null)
      : null;
  const additionalAnchors =
    active?.kind === `comment` && active.annotation.anchor.kind !== `text`
      ? (active.annotation.additionalAnchors ?? []).map((anchor: any) =>
          dependencies.resolveAdditionalAnchor(anchor, cache),
        )
      : [];
  const skipScreenshotCapture =
    active?.kind === `comment` &&
    active.annotation.anchor.kind === `element` &&
    activeElement == null &&
    additionalAnchors.every(
      (anchor: any) => anchor.anchor.kind === `element` && anchor.liveElement == null,
    ) &&
    !dependencies.isOriginalPage(active.annotation.anchor.pageUrl);
  return { activeElement, additionalAnchors, skipScreenshotCapture };
}

export { projectAnnotationActiveGeometry };
if (typeof module !== `undefined`) module.exports = { projectAnnotationActiveGeometry };
