type Point = { x: number; y: number };
function scoreAnnotationAnchorCandidate(anchor: any, candidate: any, deps: { getName: (value: any) => string | null; getNearbyText: (value: any) => string | null; getTitle: (value: any) => string | null; getElementPath: (value: any) => string | null; getRect: (value: any) => Point | null; getAnchorPoint: (value: any) => Point | null }): number {
  let score = 0;
  if (anchor.name != null && deps.getName(candidate) === anchor.name) score += 1000;
  if (anchor.nearbyText != null && deps.getNearbyText(candidate) === anchor.nearbyText) score += 500;
  if (anchor.title === deps.getTitle(candidate)) score += 250;
  if (anchor.elementPath === deps.getElementPath(candidate)) score += 25;
  const candidatePoint = deps.getRect(candidate); const anchorPoint = deps.getAnchorPoint(anchor);
  return candidatePoint == null || anchorPoint == null ? score : score - Math.abs(candidatePoint.x - anchorPoint.x) - Math.abs(candidatePoint.y - anchorPoint.y);
}
export { scoreAnnotationAnchorCandidate };
if (typeof module !== `undefined`) module.exports = { scoreAnnotationAnchorCandidate };
