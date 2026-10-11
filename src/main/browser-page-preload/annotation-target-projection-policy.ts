function projectAnnotationTarget(element: any, point: any, mode: string, useAnnotatable: boolean, deps: { isOverlay: (element: any) => boolean; isRoot: (element: any) => boolean; getContainerAncestor: (element: any) => any; resolveFallback: (element: any) => any; resolveAnnotation: (element: any, point: any) => any }): any {
  if (deps.isOverlay(element)) return null;
  if (deps.isRoot(element)) return mode === `annotation` && useAnnotatable && deps.getContainerAncestor(element) != null ? null : element;
  const target = mode === `design` || !useAnnotatable ? deps.resolveFallback(element) : deps.resolveAnnotation(element, point);
  return target == null || deps.isOverlay(target) ? null : target;
}

export { projectAnnotationTarget };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTarget };
