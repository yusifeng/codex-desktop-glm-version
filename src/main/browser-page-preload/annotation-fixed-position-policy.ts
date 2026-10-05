type AnnotationFixedPositionDependencies = {
  getOwnerWindow: (element: any) => any;
  currentWindow: any;
  getDocumentBody: (element: any, ownerWindow: any) => any;
  getParent: (element: any) => any;
  getPosition: (element: any) => string | undefined;
};

function isAnnotationElementFixedOrSticky(
  element: any,
  deps: AnnotationFixedPositionDependencies,
): boolean {
  const ownerWindow = deps.getOwnerWindow(element) ?? deps.currentWindow;
  if (ownerWindow !== deps.currentWindow) return false;
  const body = deps.getDocumentBody(element, ownerWindow);
  for (let current = element; current != null && current !== body; current = deps.getParent(current)) {
    const position = deps.getPosition(current);
    if (position === `fixed` || position === `sticky`) return true;
  }
  return false;
}

export { isAnnotationElementFixedOrSticky };
if (typeof module !== `undefined`) module.exports = { isAnnotationElementFixedOrSticky };
