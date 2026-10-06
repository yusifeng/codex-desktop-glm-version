function resolveAnnotationHighlightContext(range: any, deps: { getRoot: (range: any) => any; isStyleRoot: (root: any) => boolean; getOwnerWindow: (root: any) => any; supportsHighlights: (windowLike: any) => boolean }): { ownerWindow: any; range: any; styleRoot: any } | null {
  const root = deps.getRoot(range);
  if (!deps.isStyleRoot(root)) return null;
  const ownerWindow = deps.getOwnerWindow(root);
  return ownerWindow != null && deps.supportsHighlights(ownerWindow) ? { ownerWindow, range, styleRoot: root } : null;
}
export { resolveAnnotationHighlightContext };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationHighlightContext };
