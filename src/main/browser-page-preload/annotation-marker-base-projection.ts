/** Builds the shared viewport projection for non-element marker anchors. */
function projectAnnotationMarkerBase(anchor: any, zoomFactor: number, themeVariant: unknown, deps: any, additionalAnchors?: any[]) {
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
export { projectAnnotationMarkerBase };
if (typeof module !== `undefined`) module.exports = { projectAnnotationMarkerBase };
