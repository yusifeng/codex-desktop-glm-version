function projectAnnotationTextOffset(root: any, offset: number, deps: { createTextWalker: (root: any) => any; nextNode: (walker: any) => any }): { node: any; offset: number } | null {
  if (offset < 0) return null;
  const walker = deps.createTextWalker(root);
  let consumed = 0;
  let node = deps.nextNode(walker);
  while (node != null) {
    const text = node.textContent ?? ``;
    if (consumed + text.length >= offset) return { node, offset: offset - consumed };
    consumed += text.length;
    node = deps.nextNode(walker);
  }
  return null;
}
export { projectAnnotationTextOffset };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTextOffset };
