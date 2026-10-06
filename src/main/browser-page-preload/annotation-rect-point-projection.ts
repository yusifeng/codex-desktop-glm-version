function projectAnnotationRectPoint(rects: Array<{ x: number; y: number; width: number; height: number }>, end: boolean): { x: number; y: number } {
  const rect = end ? rects.at(-1) : rects[0];
  return rect == null ? { x: 0, y: 0 } : { x: end ? rect.x + rect.width : rect.x, y: rect.y + rect.height / 2 };
}
export { projectAnnotationRectPoint };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRectPoint };
