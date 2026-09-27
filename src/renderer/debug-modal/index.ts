import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/panel";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Rect { height: number; width: number; x: number; y: number }
interface Props { initialRect?: Partial<Rect>; onClose(): void; viewport?: { height: number; width: number } }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function constrain(rect: Rect, viewport: { height: number; width: number }): Rect { const topInset = Math.min(36, viewport.height), width = Math.min(viewport.width, Math.max(480, rect.width)), height = Math.min(viewport.height - topInset, Math.max(320, rect.height)); return { width, height, x: Math.min(viewport.width - width, Math.max(0, rect.x)), y: Math.min(viewport.height - height, Math.max(topInset, rect.y)) }; }
function DebugModal({ initialRect, onClose, viewport = { width: 1280, height: 800 } }: Props): unknown { const defaultRect = { width: Math.min(920, viewport.width - 32), height: Math.min(840, viewport.height - 68), x: 16, y: 52 }, rect = constrain({ ...defaultRect, ...initialRect }, viewport); return jsx().jsxs("dialog", { open: true, "data-debug-modal": true, style: { width: rect.width, height: rect.height, left: rect.x, top: rect.y }, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Debug" }), jsx().jsx("button", { type: "button", "aria-label": "Close debug panel", onClick: onClose, children: "Close" })] }), jsx().jsx("div", { role: "tabpanel", children: "Debug panel" }), jsx().jsx("span", { "data-resize-handle": true, "aria-hidden": true })] }); }
export { DebugModal };
