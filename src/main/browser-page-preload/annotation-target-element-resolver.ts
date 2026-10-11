type TargetElementResolverDependencies = {
  getOwnerDocument: (element: any) => any;
  getBody: (documentLike: any) => any;
  getDocumentElement: (documentLike: any) => any;
  getParentElement: (element: any) => any;
  getRect: (element: any) => { width: number; height: number };
  getTagName: (element: any) => string;
  getRole: (element: any) => string | null;
  hasDirectText: (element: any) => boolean;
};

function isAnnotationTargetElement(element: any, rect: { width: number; height: number }, deps: TargetElementResolverDependencies) {
  const tagName = deps.getTagName(element).toLowerCase();
  if ([`a`, `button`, `input`, `textarea`, `select`, `label`, `img`].includes(tagName) || deps.getRole(element) != null) return true;
  return deps.hasDirectText(element) && rect.width >= 24 && rect.height >= 16;
}

function resolveAnnotationTargetElement(element: any, deps: TargetElementResolverDependencies) {
  const ownerDocument = deps.getOwnerDocument(element);
  let current = element;
  let fallback: any = null;
  while (current?.ownerDocument === ownerDocument && current !== deps.getBody(ownerDocument) && current !== deps.getDocumentElement(ownerDocument)) {
    const rect = deps.getRect(current);
    if (rect.width > 0 && rect.height > 0) {
      if (fallback == null) fallback = current;
      if (isAnnotationTargetElement(current, rect, deps)) return current;
      if (rect.width >= 48 && rect.height >= 24) fallback = current;
    }
    current = deps.getParentElement(current);
  }
  return fallback;
}

export { isAnnotationTargetElement, resolveAnnotationTargetElement };
if (typeof module !== `undefined`) module.exports = { isAnnotationTargetElement, resolveAnnotationTargetElement };
