import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Handoff { from: "in-window" | "global-overlay" | "main-thread"; origin?: { width: number; x: number; y: number } | null; sequence: number; velocity?: { x: number; y: number } | null; }
interface Props { children?: unknown; className?: string; handoff?: Handoff | null; presentationAnchorRef?(element: HTMLElement | null): void; style?: Record<string, unknown>; surface: string; usesFadeTransition?: boolean; }
function animateHandoff(element: HTMLElement, handoff: Handoff, surface: string, fade: boolean): Animation | null {
  if (typeof element.animate !== "function") return null;
  if (fade) return element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
  const y = handoff.from === "global-overlay" ? -28 : handoff.from === "main-thread" ? 18 : 0;
  return element.animate([{ opacity: 0.86, transform: `translate3d(0, ${y}px, 0) scale(.86)` }, { opacity: 1, transform: "translate3d(0,0,0) scale(1)" }], { delay: surface === "global-overlay" ? 24 : 0, duration: surface === "main-thread" ? 300 : 280, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
}
function RealtimeVoiceHandoffTarget({ children, className, handoff, presentationAnchorRef, style, surface, usesFadeTransition = false }: Props): unknown {
  initializeRealtimeVoiceHandoffTarget();
  return jsx.jsx("div", { className, "data-realtime-voice-handoff-target": surface, ref: (element: HTMLElement | null) => { presentationAnchorRef?.(element); if (element != null && handoff != null) animateHandoff(element, handoff, surface, usesFadeTransition); }, style, children });
}
function initializeRealtimeVoiceHandoffTarget(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializeRealtimeVoiceHandoffTarget();
export { initializeRealtimeVoiceHandoffTarget as n, RealtimeVoiceHandoffTarget as t };
