type AnnotationAnchorPathDependencies = {
  generateSelector: (element: any, options: { requireUnique: boolean }) => string | null;
  getRootNode: (element: any) => any;
  isDocumentRoot: (root: any) => boolean;
  isShadowRoot: (root: any) => boolean;
  getHost: (root: any) => any;
  shadowPrefix: string;
  shadowSeparator: string;
};

function getAnnotationAnchorPath(element: any, options: { requireUnique?: boolean } = {}, deps: AnnotationAnchorPathDependencies): string | null {
  const selectors: string[] = [];
  let current = element;
  const requireUnique = options.requireUnique ?? true;
  for (;;) {
    const selector = deps.generateSelector(current, { requireUnique });
    if (selector == null) return null;
    selectors.unshift(selector);
    const root = deps.getRootNode(current);
    if (deps.isDocumentRoot(root)) break;
    if (!deps.isShadowRoot(root)) return null;
    current = deps.getHost(root);
  }
  return selectors.length === 1 ? selectors[0] : `${deps.shadowPrefix}${selectors.join(deps.shadowSeparator)}`;
}

export { getAnnotationAnchorPath };
if (typeof module !== `undefined`) module.exports = { getAnnotationAnchorPath };
