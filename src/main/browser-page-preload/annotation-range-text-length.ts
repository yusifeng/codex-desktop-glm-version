function getAnnotationRangeTextLength(element: any, endNode: any, endOffset: number, deps: { createRange: (element: any) => any }): number | null {
  const range = deps.createRange(element);
  try {
    range.selectNodeContents(element);
    range.setEnd(endNode, endOffset);
    return range.toString().length;
  } catch {
    return null;
  }
}
export { getAnnotationRangeTextLength };
if (typeof module !== `undefined`) module.exports = { getAnnotationRangeTextLength };
