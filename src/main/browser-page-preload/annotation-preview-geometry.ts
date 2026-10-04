type AnnotationRect = { x: number; y: number; width: number; height: number };
type AnnotationPreviewTarget = { rect: AnnotationRect; style: { borderTopLeftRadius: string; borderTopRightRadius: string; borderBottomRightRadius: string; borderBottomLeftRadius: string }; radiusScale?: { x?: number; y?: number } };
const resolveRadius = (value: string, size: number, scale: number) => { const parsed = Number.parseFloat(value); if (!Number.isFinite(parsed)) return 0; return Math.max(0, value.endsWith(`%`) ? (parsed * size) / 100 : parsed * scale); };
const resolveAnnotationCornerRadii = (target: AnnotationPreviewTarget) => {
  const { width, height } = target.rect, scaleX = target.radiusScale?.x ?? 1, scaleY = target.radiusScale?.y ?? 1;
  const corners = [target.style.borderTopLeftRadius, target.style.borderTopRightRadius, target.style.borderBottomRightRadius, target.style.borderBottomLeftRadius].map((value) => { const [x, y = x] = value.trim().split(/\s+/); return { x: resolveRadius(x, width, scaleX), y: resolveRadius(y, height, scaleY) }; });
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const factor = Math.min(1, width / (topLeft.x + topRight.x), width / (bottomLeft.x + bottomRight.x), height / (topLeft.y + bottomLeft.y), height / (topRight.y + bottomRight.y));
  return corners.map((corner) => ({ x: corner.x * factor, y: corner.y * factor }));
};
const buildAnnotationRoundedRectPath = (target: AnnotationPreviewTarget) => { const { x, y, width, height } = target.rect; const [topLeft, topRight, bottomRight, bottomLeft] = resolveAnnotationCornerRadii(target); const right = x + width, bottom = y + height; return [`M${x + topLeft.x} ${y}`, `H${right - topRight.x}`, `A${topRight.x} ${topRight.y} 0 0 1 ${right} ${y + topRight.y}`, `V${bottom - bottomRight.y}`, `A${bottomRight.x} ${bottomRight.y} 0 0 1 ${right - bottomRight.x} ${bottom}`, `H${x + bottomLeft.x}`, `A${bottomLeft.x} ${bottomLeft.y} 0 0 1 ${x} ${bottom - bottomLeft.y}`, `V${y + topLeft.y}`, `A${topLeft.x} ${topLeft.y} 0 0 1 ${x + topLeft.x} ${y}`, `Z`].join(` `); };
export { buildAnnotationRoundedRectPath, resolveAnnotationCornerRadii };
if (typeof module !== `undefined`) module.exports = { buildAnnotationRoundedRectPath, resolveAnnotationCornerRadii };
