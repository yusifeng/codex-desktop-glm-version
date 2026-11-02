export interface Point2D {
  x: number;
  y: number;
}

/** Return the Euclidean distance between two 2D points. */
export function getPointDistance(left: Point2D, right: Point2D): number {
  const deltaX = right.x - left.x;
  const deltaY = right.y - left.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
