/** Pure marker/view-state projections used by the annotation surface runtime. */

export type MarkerViewStateDependencies = {
  readViewportSize: () => { width: number; height: number };
  readViewportRect: (anchor: any) => unknown;
  resolveTextAnchor: (anchor: any, themeVariant: unknown) => any;
  resolveMarkerPoint: (anchor: any, zoomFactor: number) => { x: number; y: number };
  isElementConnected: (element: any) => boolean;
  readElementRect: (element: any) => unknown;
  refreshElementAnchor: (element: any, anchor: any, viewportSize: any, markerViewportPoint?: any) => any;
  readThemeVariant: () => unknown;
  resolveLiveElement: (anchor: any, id?: string) => any;
  readCardViewportRect?: (rect: any, options: any) => any;
  readCommentTheme?: (comment: any) => unknown;
};

function base(anchor: any, zoomFactor: number, themeVariant: unknown, deps: MarkerViewStateDependencies, additionalAnchors?: any[]) {
  const viewportSize = deps.readViewportSize();
  return {
    anchor,
    ...(additionalAnchors?.length ? { additionalAnchors } : {}),
    themeVariant: themeVariant ?? deps.readThemeVariant(),
    viewportRect: deps.readViewportRect(anchor),
    viewportPoint: deps.resolveMarkerPoint(anchor, zoomFactor),
    viewportSize,
  };
}

export function projectAnnotationMarkerViewState(annotation: any, zoomFactor: number, deps: MarkerViewStateDependencies, suppliedLiveElement?: any) {
  const anchor = annotation.anchor;
  if (anchor.kind === `text`) return deps.resolveTextAnchor(anchor, annotation.themeVariant) ?? base(anchor, zoomFactor, annotation.themeVariant, deps);
  if (anchor.kind === `region` || anchor.kind === `virtual`) return base(anchor, zoomFactor, annotation.themeVariant, deps, annotation.additionalAnchors);
  const viewportSize = deps.readViewportSize();
  const liveElement = suppliedLiveElement ?? deps.resolveLiveElement(anchor, undefined);
  const resolved = liveElement == null ? anchor : deps.refreshElementAnchor(liveElement, anchor, viewportSize, annotation.markerViewportPoint);
  return {
    anchor: resolved,
    ...(annotation.additionalAnchors?.length ? { additionalAnchors: annotation.additionalAnchors } : {}),
    themeVariant: annotation.themeVariant ?? deps.readThemeVariant(),
    viewportRect: liveElement == null ? deps.readViewportRect(resolved) : deps.readElementRect(liveElement),
    viewportPoint: deps.resolveMarkerPoint(resolved, zoomFactor),
    viewportSize,
  };
}

export function projectAnnotationDraftViewState(value: any, zoomFactor: number, viewportScale: number | undefined, deps: MarkerViewStateDependencies) {
  const anchorValue = value.anchor.value;
  if (value.anchor.type === `text`) return deps.resolveTextAnchor(anchorValue, value.anchor.themeVariant) ?? base(anchorValue, zoomFactor, value.anchor.themeVariant, deps);
  if (value.anchor.type === `region` || value.anchor.type === `virtual`) return base(anchorValue, zoomFactor, value.anchor.themeVariant, deps, value.anchor.additionalSelections?.map((selection: any) => selection));
  const element = value.anchor.element && deps.isElementConnected(value.anchor.element) ? value.anchor.element : null;
  const viewportSize = deps.readViewportSize();
  const resolved = element == null ? anchorValue : deps.refreshElementAnchor(element, anchorValue, viewportSize);
  return {
    anchor: resolved,
    additionalAnchors: (value.anchor.additionalSelections ?? []).map((selection: any) => selection),
    cardViewportRect: value.target.mode === `design` && value.anchor.cardViewportRect == null && deps.readCardViewportRect != null && deps.readElementRect(element) != null
      ? deps.readCardViewportRect(deps.readElementRect(element), { viewportScale, zoomFactor })
      : value.target.mode === `design` ? value.anchor.cardViewportRect : undefined,
    themeVariant: value.anchor.themeVariant ?? deps.readThemeVariant(),
    viewportRect: element == null ? deps.readViewportRect(resolved) : deps.readElementRect(element),
    viewportPoint: deps.resolveMarkerPoint(resolved, zoomFactor),
    viewportSize,
  };
}

export function projectAnnotationCommentViewState(value: any, comments: any[], elementId: string | undefined, zoomFactor: number, deps: MarkerViewStateDependencies, suppliedLiveElement?: any) {
  const comment = comments.find((candidate: any) => candidate.id === value.target.commentId) ?? null;
  if (comment == null) return null;
  const themeVariant = deps.readCommentTheme?.(comment) ?? comment.themeVariant ?? value.anchor.themeVariant;
  if (value.anchor.type === `text`) return deps.resolveTextAnchor(value.anchor.value, themeVariant) ?? base(value.anchor.value, zoomFactor, themeVariant, deps);
  if (value.anchor.type === `region` || value.anchor.type === `virtual`) return base(value.anchor.value, zoomFactor, themeVariant, deps, value.anchor.additionalSelections);
  const element = suppliedLiveElement ?? deps.resolveLiveElement(value.anchor.value, elementId);
  const viewportSize = deps.readViewportSize();
  const resolved = element == null ? value.anchor.value : deps.refreshElementAnchor(element, value.anchor.value, viewportSize, value.anchor.markerViewportPoint);
  return {
    anchor: resolved,
    additionalAnchors: value.anchor.additionalSelections?.length ? value.anchor.additionalSelections : undefined,
    themeVariant,
    viewportRect: element == null ? deps.readViewportRect(resolved) : deps.readElementRect(element),
    viewportPoint: deps.resolveMarkerPoint(resolved, zoomFactor),
    viewportSize,
  };
}

if (typeof module !== `undefined`) module.exports = { projectAnnotationMarkerViewState, projectAnnotationDraftViewState, projectAnnotationCommentViewState };
