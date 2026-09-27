import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import "@rchunk/realtime-voice-motion";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
const stageFooterClass = "pointer-events-none absolute inset-x-0 bottom-0 z-20 mx-auto h-52 w-full max-w-[900px] px-12";
const stageContentClass = "absolute inset-x-12 top-0 flex flex-col items-center gap-1";
const contentEnterTransform = "translateY(52px)";
const orbExitTransform = "translateY(-28px)";
interface Props { isConnecting: boolean; onHandoffComplete?(): void; orb?: unknown; orbDiameter: number; reduceMotion?: boolean; }
function RealtimeVoiceStageLayout({ isConnecting, onHandoffComplete, orb, orbDiameter, reduceMotion = false }: Props): unknown {
  initializeRealtimeVoiceStageLayout();
  if (!isConnecting) onHandoffComplete?.();
  return jsx.jsxs("div", { "aria-hidden": true, className: "relative flex items-center justify-center", style: { height: orbDiameter, width: orbDiameter }, children: [jsx.jsx("div", { className: `absolute inset-0${isConnecting ? " pointer-events-none" : ""}`, children: orb }), jsx.jsx("div", { className: `size-[50px] rounded-full bg-primary-solid${reduceMotion ? "" : " pulsing-dot"}` })] });
}
function initializeRealtimeVoiceStageLayout(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializeRealtimeVoiceStageLayout();
export { initializeRealtimeVoiceStageLayout as a, orbExitTransform as i, stageFooterClass as n, RealtimeVoiceStageLayout as o, contentEnterTransform as r, initializeRealtimeVoiceStageLayout as s, stageContentClass as t };
