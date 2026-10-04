/** Validates that every text node intersected by a DOM Range is selectable. */
type RangeValidationDependencies = {
  createTextWalker: (root: any) => { nextNode: () => any };
  isTextNode: (node: any) => boolean;
  getTextContent: (node: any) => string | null | undefined;
  getAssignedSlot: (node: any) => any;
  getParentElement: (node: any) => any;
  intersectsNode: (range: any, node: any) => boolean;
  isVisibleElement: (element: any) => boolean;
};

function isAnnotationRangeSelectable(range: any, dependencies: RangeValidationDependencies) {
  const root = range.commonAncestorContainer;
  const walker = dependencies.createTextWalker(root);
  let node = dependencies.isTextNode(root) ? root : walker.nextNode();
  while (node != null) {
    const text = dependencies.getTextContent(node) ?? ``;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : text.length;
    const parent = dependencies.isTextNode(node)
      ? dependencies.getAssignedSlot(node) ?? dependencies.getParentElement(node)
      : dependencies.getParentElement(node);
    if (end > start && dependencies.intersectsNode(range, node) && (parent == null || !dependencies.isVisibleElement(parent))) return false;
    node = walker.nextNode();
  }
  return true;
}

export { isAnnotationRangeSelectable };
if (typeof module !== `undefined`) module.exports = { isAnnotationRangeSelectable };
