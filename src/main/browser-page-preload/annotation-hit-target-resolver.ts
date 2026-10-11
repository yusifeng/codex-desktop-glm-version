type AnnotationHitTargetDependencies = {
  getOwnerDocument: (element: any) => any;
  getDefaultView: (documentLike: any) => any;
  getParent: (element: any) => any;
  hasAttribute: (element: any, name: string) => boolean;
  getRect: (element: any) => { left: number; top: number; right: number; bottom: number; width: number; height: number };
  checkVisibility: (element: any) => boolean;
  getDocumentBody: (documentLike: any) => any;
  getDocumentElement: (documentLike: any) => any;
};
function resolveAnnotationHitTarget(element: any, point: { x: number; y: number } | undefined, deps: AnnotationHitTargetDependencies) {
  const documentLike = deps.getOwnerDocument(element);
  const ownerWindow = deps.getDefaultView(documentLike);
  let current = element;
  let candidate: any = null;
  while (current?.ownerDocument === documentLike) {
    const isRoot = current === deps.getDocumentBody(documentLike) || current === deps.getDocumentElement(documentLike);
    const isContainer = deps.hasAttribute(current, `oai-annotation-container`);
    if (deps.hasAttribute(current, `oai-annotation-container-text`)) return null;
    if (!isRoot && !isContainer && candidate == null && deps.hasAttribute(current, `oai-annotatable`)) {
      const rect = deps.getRect(current);
      const insideViewport = ownerWindow != null && Number.isFinite(rect.left) && Number.isFinite(rect.top) && Number.isFinite(rect.right) && Number.isFinite(rect.bottom) && rect.width > 0 && rect.height > 0 && rect.left < ownerWindow.innerWidth && rect.right > 0 && rect.top < ownerWindow.innerHeight && rect.bottom > 0;
      const insidePoint = point == null || (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom);
      if (insideViewport && insidePoint && deps.checkVisibility(current)) candidate = current;
    }
    if (isContainer) return candidate ?? deps.getDocumentElement(documentLike);
    current = deps.getParent(current);
  }
  return undefined;
}
export { resolveAnnotationHitTarget };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationHitTarget };
