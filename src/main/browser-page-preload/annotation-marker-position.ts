type AnnotationMarkerPoint = { x: number; y: number; [key: string]: unknown };

/** Separates markers sharing a rounded point while keeping the row inside the viewport. */
function spreadAnnotationMarkerPoints(points: readonly AnnotationMarkerPoint[], viewportWidth: number, markerSize = 25, gap = 12.5): AnnotationMarkerPoint[] {
  if (points.length < 2) return points as AnnotationMarkerPoint[];
  const left = 28.5;
  const right = viewportWidth - 16 - markerSize / 2;
  const groups = new Map<string, number[]>();
  points.forEach((point, index) => {
    const key = `${Math.round(point.x)}:${Math.round(point.y)}`;
    const group = groups.get(key);
    if (group == null) groups.set(key, [index]);
    else group.push(index);
  });
  const result = points.map((point) => ({ ...point }));
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const start = group.reduce((sum, index) => sum + points[index].x, 0) / group.length - ((group.length - 1) * gap) / 2;
    const end = start + (group.length - 1) * gap;
    const shift = start < left ? left - start : end > right ? right - end : 0;
    group.forEach((index, offset) => { result[index] = { ...result[index], x: Math.min(right, Math.max(left, start + offset * gap + shift)) }; });
  }
  return result;
}

export { spreadAnnotationMarkerPoints };
if (typeof module !== `undefined`) module.exports = { spreadAnnotationMarkerPoints };
