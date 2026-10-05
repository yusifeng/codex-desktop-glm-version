type AnnotationRegionClassPolicyDependencies = {
  isAnchorOnCurrentPage: (anchor: any) => boolean;
  isRectLargeEnough: (rect: any, width: number, height: number) => boolean;
};

function getAnnotationRegionOverlayClassName(anchor: any, rect: any, width: number, height: number, deps: AnnotationRegionClassPolicyDependencies): string {
  return deps.isAnchorOnCurrentPage(anchor) && deps.isRectLargeEnough(rect, width, height)
    ? `hover-box region-box google-docs-annotation-box google-docs-region-box`
    : `hover-box region-box`;
}

function getAnnotationRegionHighlightClassName(anchor: any, rect: any, width: number, height: number, deps: AnnotationRegionClassPolicyDependencies): string {
  return deps.isAnchorOnCurrentPage(anchor) && deps.isRectLargeEnough(rect, width, height)
    ? `posted-region-highlight google-docs-annotation-box google-docs-region-box`
    : `posted-region-highlight`;
}

export { getAnnotationRegionOverlayClassName, getAnnotationRegionHighlightClassName };
if (typeof module !== `undefined`) module.exports = { getAnnotationRegionOverlayClassName, getAnnotationRegionHighlightClassName };
