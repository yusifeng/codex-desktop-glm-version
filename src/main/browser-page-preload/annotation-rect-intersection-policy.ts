function intersectsAnnotationRect(candidate: { left: number; top: number; right: number; bottom: number }, rect: { x: number; y: number; width: number; height: number }): boolean {
  return candidate.right >= rect.x && candidate.left <= rect.x + rect.width && candidate.bottom >= rect.y && candidate.top <= rect.y + rect.height;
}
export { intersectsAnnotationRect };
if (typeof module !== `undefined`) module.exports = { intersectsAnnotationRect };
