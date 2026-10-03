type Rect = { x: number; y: number; width: number; height: number };

function clipAnnotationSurfaceRect(
  elementRect: Rect,
  targetRect: Rect,
  viewport: { width: number; height: number },
): Rect | null {
  const left = Math.max(0, elementRect.x, targetRect.x);
  const top = Math.max(0, elementRect.y, targetRect.y);
  const right = Math.min(viewport.width, elementRect.x + elementRect.width, targetRect.x + targetRect.width);
  const bottom = Math.min(viewport.height, elementRect.y + elementRect.height, targetRect.y + targetRect.height);
  return right > left && bottom > top ? { x: left, y: top, width: right - left, height: bottom - top } : null;
}

function unionAnnotationRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function intersectAnnotationRect(rect: Rect, boundary: Rect, axes: { x: boolean; y: boolean }): Rect | null {
  const left = axes.x ? Math.max(rect.x, boundary.x) : rect.x;
  const top = axes.y ? Math.max(rect.y, boundary.y) : rect.y;
  const right = axes.x ? Math.min(rect.x + rect.width, boundary.x + boundary.width) : rect.x + rect.width;
  const bottom = axes.y ? Math.min(rect.y + rect.height, boundary.y + boundary.height) : rect.y + rect.height;
  return right <= left || bottom <= top ? null : { x: left, y: top, width: right - left, height: bottom - top };
}

function scaleAnnotationRect(rect: Rect, factor: number): Rect {
  return { x: rect.x * factor, y: rect.y * factor, width: rect.width * factor, height: rect.height * factor };
}

function clampAnnotationCoordinate(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function isLargeAnnotationRect(rect: Pick<Rect, `width` | `height`> | null | undefined, width: number, height: number, minimumWidthRatio: number, minimumHeightRatio: number): boolean {
  return rect != null && width > 0 && height > 0 && rect.width >= width * minimumWidthRatio && rect.height >= height * minimumHeightRatio;
}

export { clampAnnotationCoordinate, clipAnnotationSurfaceRect, intersectAnnotationRect, isLargeAnnotationRect, scaleAnnotationRect, unionAnnotationRects };
if (typeof module !== `undefined`) module.exports = { clampAnnotationCoordinate, clipAnnotationSurfaceRect, intersectAnnotationRect, isLargeAnnotationRect, scaleAnnotationRect, unionAnnotationRects };
