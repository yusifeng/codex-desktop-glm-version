function getAnnotationComposedParent(value: any, deps: { getAssignedSlot: (value: any) => any; getParentElement: (value: any) => any; getRootNode: (value: any) => any; isShadowRoot: (value: any) => boolean }): any {
  const slot = deps.getAssignedSlot(value);
  if (slot != null) return slot;
  const parent = deps.getParentElement(value);
  if (parent != null) return parent;
  const root = deps.getRootNode(value);
  return deps.isShadowRoot(root) ? root.host : null;
}
export { getAnnotationComposedParent };
if (typeof module !== `undefined`) module.exports = { getAnnotationComposedParent };
