/** Deterministic editor-anchor projections used by the browser-page preload. */

export function createAnnotationEditorAnchorState(
  element: unknown,
  point: { x: number; y: number },
  deps: {
    readViewportSize: () => { width: number; height: number };
    readElementRect: (element: unknown) => unknown;
    buildAnchor: (element: unknown, rect: unknown, point: { x: number; y: number }, isFixed: boolean, viewportWidth: number) => unknown;
    isFixed: (element: unknown) => boolean;
    readThemeVariant: () => unknown;
  },
) {
  const viewportSize = deps.readViewportSize();
  const viewportRect = deps.readElementRect(element);
  return {
    anchor: deps.buildAnchor(
      element,
      viewportRect ?? { x: point.x, y: point.y, width: 0, height: 0 },
      point,
      viewportRect != null && deps.isFixed(element),
      viewportSize.width,
    ),
    themeVariant: deps.readThemeVariant(),
    viewportRect,
    viewportPoint: point,
    viewportSize,
  };
}

export function normalizeAnnotationEditorPlacement(
  state: any,
  liveElement: unknown,
  deps: {
    isCurrentPage: (pageUrl: unknown) => boolean;
    isTextAnchorResolved: (anchor: unknown) => boolean;
    clipAnchor: (anchor: unknown, viewportRect: unknown, liveElement: unknown) => unknown;
  },
) {
  const { anchor } = state;
  const visible = deps.isCurrentPage(anchor.pageUrl)
    && (anchor.kind !== `element` || liveElement != null)
    && (anchor.kind !== `text` || deps.isTextAnchorResolved(anchor));
  const clipped = visible ? deps.clipAnchor(anchor, state.viewportRect, liveElement) : null;
  return clipped == null
    ? { ...state, placement: `top-left`, viewportRect: null, viewportPoint: { x: 0, y: 0 } }
    : state;
}

if (typeof module !== `undefined`) module.exports = { createAnnotationEditorAnchorState, normalizeAnnotationEditorPlacement };
