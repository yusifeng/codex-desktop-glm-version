function projectAnnotationClientRects(value: any, deps: { getClientRects: (value: any) => any[]; maxRects?: number }): Array<{ x: number; y: number; width: number; height: number }> {
  if (typeof value?.getClientRects !== `function`) return [];
  const rects = deps.getClientRects(value);
  if (rects.length > (deps.maxRects ?? 1e3)) return [];
  return Array.from(rects).filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => ({ x: rect.left, y: rect.top, width: rect.width, height: rect.height }));
}
export { projectAnnotationClientRects };
if (typeof module !== `undefined`) module.exports = { projectAnnotationClientRects };
