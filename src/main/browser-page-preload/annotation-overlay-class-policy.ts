type AnnotationOverlayClassPolicyDependencies = {
  isAnchorOnCurrentPage: (anchor: any) => boolean;
  isRectLargeEnough: (rect: any, width: number, height: number) => boolean;
};

/**
 * Selects the CSS class contract used by element annotation overlays.  Google
 * Docs anchors that span a substantial viewport area receive the additional
 * compatibility classes; ordinary and small anchors keep the generic class.
 */
function getAnnotationElementOverlayClassName(
  anchor: any,
  rect: any,
  width: number,
  height: number,
  dependencies: AnnotationOverlayClassPolicyDependencies,
): string {
  return dependencies.isAnchorOnCurrentPage(anchor) && dependencies.isRectLargeEnough(rect, width, height)
    ? `hover-box google-docs-annotation-box google-docs-element-box`
    : `hover-box`;
}

export { getAnnotationElementOverlayClassName };
if (typeof module !== `undefined`) module.exports = { getAnnotationElementOverlayClassName };
