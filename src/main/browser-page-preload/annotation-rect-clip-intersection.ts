function intersectAnnotationRects(left: any, right: any): any {
  const x = Math.max(left.left, right.left);
  const y = Math.max(left.top, right.top);
  const rightEdge = Math.min(left.right, right.right);
  const bottom = Math.min(left.bottom, right.bottom);
  return rightEdge <= x || bottom <= y ? null : { x, y, width: rightEdge - x, height: bottom - y };
}
export { intersectAnnotationRects };
if (typeof module !== `undefined`) module.exports = { intersectAnnotationRects };
