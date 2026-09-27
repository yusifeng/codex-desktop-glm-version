import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import "@rchunk/realtime-voice-motion";
import "@rchunk/realtime-voice-stage-layout";
import "@rchunk/use-realtime-voice-native-overlay-transition-enabled";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Props { error?: string | null; microphonePermissionDenied?: boolean; onBack?(): void; onOpenSettings?(): void; phase?: "connecting" | "connected" | "failed"; threadLocator?: { conversationId: string; hostId: string } | null; }
function RealtimeVoiceLaunchSurface({ error, microphonePermissionDenied = false, onBack, onOpenSettings, phase = "connecting", threadLocator }: Props): unknown {
  initializeRealtimeVoiceLaunchSurface();
  if (phase === "connected") return null;
  if (phase === "failed") return jsx.jsxs("section", { role: "alert", "data-thread-id": threadLocator?.conversationId, children: [jsx.jsx("h2", { children: microphonePermissionDenied ? "Microphone permission denied" : "Voice chat couldn’t start" }), jsx.jsx("p", { children: microphonePermissionDenied ? "Allow microphone access in system settings to start a voice chat" : error ?? "Try again, or go back" }), microphonePermissionDenied ? jsx.jsx("button", { onClick: onOpenSettings, type: "button", children: "Open settings" }) : null, jsx.jsx("button", { onClick: onBack, type: "button", children: "Go back" })] });
  return jsx.jsx("section", { "aria-busy": true, "data-thread-id": threadLocator?.conversationId, children: "Starting voice chat…" });
}
function initializeRealtimeVoiceLaunchSurface(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializeRealtimeVoiceLaunchSurface();
export { initializeRealtimeVoiceLaunchSurface as n, RealtimeVoiceLaunchSurface as t };
