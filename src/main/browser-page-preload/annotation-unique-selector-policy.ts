function isAnnotationUniqueSelectorMatch(element: any, selector: string, deps: { getRootNode: (element: any) => any; isQueryableRoot: (root: any) => boolean; queryAll: (root: any, selector: string) => any[] }): boolean {
  const root = deps.getRootNode(element);
  if (!deps.isQueryableRoot(root)) return false;
  const matches = deps.queryAll(root, selector);
  return matches.length === 1 && matches[0] === element;
}

export { isAnnotationUniqueSelectorMatch };
if (typeof module !== `undefined`) module.exports = { isAnnotationUniqueSelectorMatch };
