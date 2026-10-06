function projectAnnotationRectBounds(rects: Array<{ x: number; y: number; width: number; height: number }>): { x: number; y: number; width: number; height: number } {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export { projectAnnotationRectBounds };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRectBounds };
