function isAnnotationRangeIntersectingRect(element: any, target: any, rect: any, deps: { createRange: () => any; getClientRects: (range: any) => any[]; intersects: (candidate: any, rect: any) => boolean }): boolean {
  const range = deps.createRange();
  range.selectNodeContents(target);
  return deps.getClientRects(range).some((candidate) => deps.intersects(candidate, rect));
}
export { isAnnotationRangeIntersectingRect };
if (typeof module !== `undefined`) module.exports = { isAnnotationRangeIntersectingRect };
