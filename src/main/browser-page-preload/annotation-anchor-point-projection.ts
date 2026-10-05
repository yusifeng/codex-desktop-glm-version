function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(value, minimum), maximum); }
function projectAnnotationAnchorPoint(anchor: any, targetRect: { x: number; y: number; width: number; height: number }, viewport?: { width: number; height: number }, explicitX?: number): { x: number; y: number } {
  const x = explicitX ?? (anchor.point.xPercent / 100) * (viewport?.width ?? 0); const xRatio = anchor.rect.width === 0 ? 0.5 : (x - anchor.rect.x) / anchor.rect.width; const yRatio = anchor.rect.height === 0 ? 0.5 : (anchor.point.y - anchor.rect.y) / anchor.rect.height;
  return { x: targetRect.x + clamp(xRatio, 0, 1) * targetRect.width, y: targetRect.y + clamp(yRatio, 0, 1) * targetRect.height };
}
export { projectAnnotationAnchorPoint };
if (typeof module !== `undefined`) module.exports = { projectAnnotationAnchorPoint };
