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

function isAnnotationPointInViewport(point: { x: number; y: number }, viewport: { width: number; height: number }) {
  return point.x >= 0 && point.y >= 0 && point.x < viewport.width && point.y < viewport.height;
}

function hasAnnotationDragThreshold(start: { x: number; y: number }, current: { x: number; y: number }, threshold = 4) {
  return Math.abs(current.x - start.x) >= threshold || Math.abs(current.y - start.y) >= threshold;
}

function createAnnotationRectFromPoints(start: { x: number; y: number }, current: { x: number; y: number }): Rect {
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

function updateAnnotationRegionDrag(state: any, current: { x: number; y: number }, threshold: number) {
  const isDraggingRegion = state.isDraggingRegion || hasAnnotationDragThreshold(state.start, current, threshold);
  return { ...state, current, rect: isDraggingRegion ? createAnnotationRectFromPoints(state.start, current) : null, isDraggingRegion };
}

export { clampAnnotationCoordinate, clipAnnotationSurfaceRect, createAnnotationRectFromPoints, hasAnnotationDragThreshold, intersectAnnotationRect, isAnnotationPointInViewport, isLargeAnnotationRect, scaleAnnotationRect, unionAnnotationRects, updateAnnotationRegionDrag };
if (typeof module !== `undefined`) module.exports = { clampAnnotationCoordinate, clipAnnotationSurfaceRect, createAnnotationRectFromPoints, hasAnnotationDragThreshold, intersectAnnotationRect, isAnnotationPointInViewport, isLargeAnnotationRect, scaleAnnotationRect, unionAnnotationRects, updateAnnotationRegionDrag };
