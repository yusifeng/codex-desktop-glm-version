export interface RectangleLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Return the bottom-right point of a DOM-style rectangle. */
export function getRectangleBottomRight(rectangle: RectangleLike): { x: number; y: number } {
  return { x: rectangle.x + rectangle.width, y: rectangle.y };
}
