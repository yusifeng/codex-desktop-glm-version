type AnnotationRect = { x: number; y: number; width: number; height: number };
type AnnotationViewport = { width: number; height: number };
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(value, minimum), maximum); }
function readViewportScale(value: number | null | undefined): number { return value == null || value <= 0 ? 1 : 1 / value; }
function scaleRect(rect: AnnotationRect, factor: number): AnnotationRect { return { x: rect.x * factor, y: rect.y * factor, width: rect.width * factor, height: rect.height * factor }; }
function projectAnnotationTooltipPosition(anchor: AnnotationRect, input: { viewport: AnnotationViewport; viewportScale: number | null | undefined; zoomFactor?: number }): AnnotationRect {
  const inverseScale = readViewportScale(input.viewportScale); const zoom = input.zoomFactor ?? 1; const scaledAnchor = scaleRect(anchor, zoom);
  const viewportWidth = input.viewport.width * zoom; const viewportHeight = input.viewport.height * zoom; const horizontalPadding = 16 * inverseScale; const tooltipHeight = 72 * inverseScale; const tooltipWidth = Math.min(240 * inverseScale, viewportWidth - horizontalPadding * 2); const x = clamp(scaledAnchor.x, horizontalPadding, viewportWidth - tooltipWidth - horizontalPadding); const above = scaledAnchor.y - tooltipHeight - 8 * inverseScale; const below = scaledAnchor.y + scaledAnchor.height + 8 * inverseScale;
  return { x, y: above >= horizontalPadding ? above : clamp(below, horizontalPadding, viewportHeight - tooltipHeight - horizontalPadding), width: tooltipWidth, height: tooltipHeight };
}
export { projectAnnotationTooltipPosition };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTooltipPosition };
