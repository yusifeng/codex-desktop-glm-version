import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Katex from "@rchunk/learning-block-katex";
import * as Stroke from "@rchunk/learning-block-stroke";
interface Point { x: number; y: number }
const katex = Katex as unknown as { n(): void; t: unknown };
const stroke = Stroke as unknown as { i(): void; n: string; s(input: Record<string, unknown>): unknown };
let jsx: Shared.JsxRuntime;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
function geometry({ anchor, toward, size, anchorPointStyle, anchorPointRadius, label, labelFontSize = 10, labelOffsetPx = 14, labelOrientation = "horizontal", labelPlacement, maxLength, minLength, strokeWidth = 2 }: Record<string, unknown>): Record<string, unknown> | null {
  const from = anchor as Point, to = toward as Point, dx = to.x - from.x, dy = to.y - from.y, distance = Math.hypot(dx, dy), progress = clamp(Number(size), 0, 1), width = Number(strokeWidth);
  if (distance <= Number.EPSILON || progress <= Number.EPSILON) return null;
  const ux = dx / distance, uy = dy / distance, px = -uy, py = ux, radius = anchorPointStyle === "hole" ? Number(anchorPointRadius ?? Math.max(4.5, width * 1.7)) : Number(anchorPointRadius ?? 4), reserve = clamp(distance * .16, 12, 24), end = Math.max(0, Number(maxLength ?? distance - reserve)), start = Math.min(end, Number(minLength ?? clamp(distance * .18, 14, 24))), length = start + (end - start) * progress, headLength = clamp(length * .28, 6, 14);
  if (length <= Number.EPSILON) return null;
  const tip = { x: from.x + ux * length, y: from.y + uy * length }, shaftEnd = { x: from.x + ux * Math.max(0, length - headLength), y: from.y + uy * Math.max(0, length - headLength) }, base = { x: tip.x - ux * headLength, y: tip.y - uy * headLength }, halfWidth = clamp(headLength * .52, 4, 10);
  return { anchorPointRadius: radius, head: { tip, left: { x: base.x + px * halfWidth, y: base.y + py * halfWidth }, right: { x: base.x - px * halfWidth, y: base.y - py * halfWidth } }, shaft: { from, to: shaftEnd }, label: label ? stroke.s({ from, to: tip, label, labelFontSize, labelPlacement: labelPlacement ?? "auto", labelOffsetPx, labelOrientation }) : null };
}
function SvgArrow(props: Record<string, unknown>): unknown { const g = geometry(props); if (!g) return null; const shaft = g.shaft as { from: Point; to: Point }, head = g.head as { tip: Point; left: Point; right: Point }; return jsx.jsxs("g", { className: props.className, children: [jsx.jsx("line", { x1: shaft.from.x, y1: shaft.from.y, x2: shaft.to.x, y2: shaft.to.y, stroke: props.color ?? "var(--icon-accent)", strokeWidth: props.strokeWidth ?? 2 }), jsx.jsx("polygon", { points: head.tip.x + "," + head.tip.y + " " + head.left.x + "," + head.left.y + " " + head.right.x + "," + head.right.y }), props.anchorPointStyle === "hole" ? jsx.jsx("circle", { cx: shaft.from.x, cy: shaft.from.y, r: g.anchorPointRadius }) : null, props.label && g.label ? jsx.jsx(props.labelFormat === "katex" ? katex.t : "text", { children: props.label, fill: props.labelColor ?? "var(--text-primary)", stroke: stroke.n }) : null] }); }
function initialize(): void { katex.n(); stroke.i(); jsx = (Shared as unknown as { I3(): Shared.JsxRuntime }).I3(); }
export { initialize as n, SvgArrow as t };
