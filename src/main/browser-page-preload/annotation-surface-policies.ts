/** Pure lifecycle and rendering gates shared by annotation surface registries. */

/** Returns whether a trusted, non-persisted pagehide should dispose the registry. */
function shouldDisposeAnnotationRegistryOnPagehide(event: { isTrusted?: boolean; persisted?: boolean }): boolean {
  return event.isTrusted === true && event.persisted !== true;
}

/** Accepts only connected top-document elements, excluding iframe surfaces. */
function isValidAnnotationSurfaceElement(
  value: unknown,
  documentRef: object,
  htmlElementConstructor: { new (...args: any[]): any },
  iframeConstructor: { new (...args: any[]): any },
): boolean {
  return value instanceof htmlElementConstructor &&
    !(value instanceof iframeConstructor) &&
    (value as { isConnected?: boolean }).isConnected === true &&
    (value as { ownerDocument?: object }).ownerDocument === documentRef &&
    typeof (value as { getRootNode?: () => unknown }).getRootNode === `function` &&
    (value as { getRootNode: () => unknown }).getRootNode() === documentRef;
}

/** Determines whether a selection transition needs a custom overlay render. */
function shouldRenderAnnotationSelection(
  current: { hoveredId: string | null; selectedId: string | null },
  next: { hoveredId: string | null; selectedId: string | null },
  renderFailed: boolean,
  hasRenderer: boolean,
): boolean {
  return hasRenderer &&
    !(renderFailed && (next.hoveredId != null || next.selectedId != null)) &&
    (current.hoveredId !== next.hoveredId || current.selectedId !== next.selectedId);
}

export { isValidAnnotationSurfaceElement, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
if (typeof module !== `undefined`) module.exports = { isValidAnnotationSurfaceElement, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection };
