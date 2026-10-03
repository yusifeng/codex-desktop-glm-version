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

export { clipAnnotationSurfaceRect };
if (typeof module !== `undefined`) module.exports = { clipAnnotationSurfaceRect };
