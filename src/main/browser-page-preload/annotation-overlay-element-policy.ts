function isPageAnnotationOverlayElement(element: any, deps: { rootId: string; isOverlay: (element: any, rootId: string, policy: any) => boolean; policy: any }): boolean {
  return deps.isOverlay(element, deps.rootId, deps.policy);
}

export { isPageAnnotationOverlayElement };
if (typeof module !== `undefined`) module.exports = { isPageAnnotationOverlayElement };
