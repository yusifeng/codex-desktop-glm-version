type AnnotationAnchorLike = {
  pageUrl?: unknown;
  documentContext?: { kind?: unknown } | null;
};

function isGoogleDocsAnnotationAnchor(anchor: AnnotationAnchorLike | null | undefined, parsePageUrl: (value: unknown) => unknown): boolean {
  return anchor?.documentContext?.kind === `google-docs` || parsePageUrl(anchor?.pageUrl) != null;
}

function isAnnotationAnchorOnCurrentPage(
  anchor: AnnotationAnchorLike | null | undefined,
  currentPageUrl: unknown,
  dependencies: {
    isGoogleDocsAnchor: (anchor: AnnotationAnchorLike) => boolean;
    samePageUrl: (left: unknown, right: unknown) => boolean;
  },
): boolean {
  if (anchor == null) return dependencies.samePageUrl(currentPageUrl, currentPageUrl);
  return dependencies.isGoogleDocsAnchor(anchor) || dependencies.samePageUrl(anchor.pageUrl, currentPageUrl);
}

function isAnnotationRectLargeEnough(
  rect: { width: number; height: number } | null | undefined,
  viewportWidth: number,
  viewportHeight: number,
  minimumWidthRatio: number,
  minimumHeightRatio: number,
  isLargeRect: (rect: any, width: number, height: number, minWidth: number, minHeight: number) => boolean,
): boolean {
  return isLargeRect(rect, viewportWidth, viewportHeight, minimumWidthRatio, minimumHeightRatio);
}

export { isAnnotationAnchorOnCurrentPage, isAnnotationRectLargeEnough, isGoogleDocsAnnotationAnchor };
if (typeof module !== `undefined`) module.exports = { isAnnotationAnchorOnCurrentPage, isAnnotationRectLargeEnough, isGoogleDocsAnnotationAnchor };
