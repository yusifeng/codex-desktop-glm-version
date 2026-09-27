import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/text-bubble-figure-light";
interface ColorIconProps { className?: string; name: string; title?: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function hueFor(name: string): number { let value = 0; for (const character of name) value = (value * 31 + character.charCodeAt(0)) % 360; return value; }
function ColorIcon({ className = "icon-md", name, title }: ColorIconProps): unknown { const hue = hueFor(name); return jsx().jsxs("svg", { className, viewBox: "0 0 24 24", role: title == null ? undefined : "img", "aria-hidden": title == null || undefined, "aria-label": title, "data-color-icon": name, children: [jsx().jsx("circle", { cx: 12, cy: 12, r: 10, fill: `hsl(${hue} 70% 52%)` }), jsx().jsx("path", { d: "M7 12h10M12 7v10", stroke: "white", strokeWidth: 2, strokeLinecap: "round" })] }); }
function initializeColorIcons(): void { void jsx(); }
export { initializeColorIcons as n, ColorIcon as t };
