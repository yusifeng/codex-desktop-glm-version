import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as motionChunk from "@rchunk/realtime-voice-motion";
import * as stageChunk from "@rchunk/realtime-voice-stage-layout";
import * as nativeOverlayChunk from "@rchunk/use-realtime-voice-native-overlay-transition-enabled";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

type Callable = (...args: unknown[]) => unknown;
type VoiceLaunchRequest = { preferredPresentationSurface?: string; source?: string; [key: string]: unknown };
type VoiceLaunchState = { error?: string; handoffComplete?: boolean; originPath?: string; phase?: string; request: VoiceLaunchRequest };
type VoiceStageState = { activity?: string; phase?: string; preferredPresentationSurface?: string };
type VoiceHandoffState = { handoff?: { from?: string }; surface?: string };
interface Props { threadLocator?: { conversationId: string; hostId: string } | null }

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const motion = motionChunk as unknown as Record<string, unknown>;
const stage = stageChunk as unknown as Record<string, unknown>;
const nativeOverlay = nativeOverlayChunk as unknown as Record<string, unknown>;
let jsx: JsxRuntime;

function invoke<T>(value: unknown, ...args: unknown[]): T { return (value as Callable)(...args) as T; }
function element(type: unknown, props: Record<string, unknown>): unknown { return jsx.jsx(type as never, props); }
function message(id: string, defaultMessage: string, description: string): unknown { return element(shared.Y2, { id, defaultMessage, description }); }

function RealtimeVoiceLaunchSurface({ threadLocator }: Props): unknown {
  initializeRealtimeVoiceLaunchSurface();
  const scope = invoke<Record<string, unknown>>(shared.LX, shared.ZI);
  const location = invoke<{ pathname: string; search: string }>(initial.i_n);
  const launch = invoke<VoiceLaunchState | null>(shared.HX, initial.FV);
  const voiceStage = invoke<VoiceStageState>(shared.HX, initial.M1t);
  const handoff = invoke<VoiceHandoffState | null>(shared.HX, initial.qn);
  const reduceMotion = invoke<boolean>(initial.Slt);
  const nativeOverlayTransition = invoke<boolean>(nativeOverlay.n);
  const isMatchingLaunch = threadLocator == null
    ? launch?.request.source === "composer_button_new_thread" && invoke<boolean>(initial.PV, `${location.pathname}${location.search}`, launch.originPath, invoke(initial.jV, voiceStage, handoff))
    : invoke<boolean>(initial.NV, launch, threadLocator.conversationId, threadLocator.hostId);
  if (launch == null || !isMatchingLaunch ||
    (launch.request.source === "composer_button_existing_thread" && launch.request.preferredPresentationSurface === "in-window") ||
    (launch.request.source === "composer_button_existing_thread" && launch.phase !== "failed")) return null;

  if (launch.phase === "failed") {
    const microphoneDenied = launch.error === initial.DV;
    const permissions = initialChunk.pnt as unknown as { systemPermissions?: { openMicrophoneSettings(): Promise<unknown> } };
    const systemPermissions = permissions.systemPermissions;
    const openSettings = microphoneDenied && systemPermissions != null ? element(shared.Yh, {
      color: "primary", size: "medium",
      onClick: () => void systemPermissions.openMicrophoneSettings().catch(ignoreFailure),
      children: message("realtimeVoice.launch.openMicrophoneSettings", "Open system settings", "Open operating-system microphone privacy settings"),
    }) : null;
    const retry = element(shared.Yh, {
      color: microphoneDenied && systemPermissions != null ? "secondary" : "primary", size: "medium",
      onClick: () => void invoke<Promise<unknown>>(initial.IV, scope, launch.request, launch.originPath).catch(ignoreFailure),
      children: message("realtimeVoice.launch.retry", "Try again", "Retry a failed realtime voice launch"),
    });
    const feedback = element(shared.Yh, {
      color: "secondary", size: "medium",
      onClick: () => invoke(initial._Et, "feedback", "realtime_voice_startup_failure", { feedbackDetails: launch.error }),
      children: message("realtimeVoice.launch.feedback", "Send feedback", "Open feedback for a failed voice launch"),
    });
    const back = element(shared.Yh, {
      color: "secondary", size: "medium",
      onClick: () => void invoke<Promise<unknown>>(initial.OV, scope).catch(ignoreFailure),
      children: message("realtimeVoice.launch.back", "Back", "Dismiss a failed voice launch"),
    });
    return jsx.jsx("div", { className: "absolute inset-0 z-30 flex items-center justify-center bg-surface", role: "alert",
      children: jsx.jsxs("div", { className: "flex flex-col items-center gap-4 text-center", children: [
        jsx.jsxs("div", { className: "flex flex-col gap-1", children: [
          jsx.jsx("h2", { className: "text-base font-medium text-default", children: message(
            microphoneDenied ? "realtimeVoice.launch.microphonePermissionDeniedTitle" : "realtimeVoice.launch.failedTitle",
            microphoneDenied ? "Microphone permission denied" : "Voice chat couldn’t start", "Voice launch failure title") }),
          jsx.jsx("p", { className: "text-sm text-secondary", children: microphoneDenied
            ? message("realtimeVoice.launch.microphonePermissionDeniedDescription", "Allow microphone access in system settings to start a voice chat", "Microphone permission instructions")
            : launch.error || message("realtimeVoice.launch.failedDescription", "Try again, or go back", "Voice launch failure description") }),
        ] }),
        jsx.jsxs("div", { className: "flex flex-wrap justify-center gap-2", children: [openSettings, retry, feedback, back] }),
      ] }),
    });
  }

  const activeOnMainThread = voiceStage.phase === "active" && voiceStage.preferredPresentationSurface === "main-thread";
  const handoffComplete = launch.phase === "connected" && launch.handoffComplete === true;
  const transform = nativeOverlayTransition && handoff?.surface === "main-thread" && handoff.handoff?.from === "global-overlay" ? stage.i : stage.r;
  const MotionDiv = (shared.o$ as { div: unknown }).div;
  return element(MotionDiv, {
    animate: { opacity: Number(!handoffComplete) }, className: "absolute inset-0 z-30 bg-surface", initial: false,
    transition: reduceMotion ? motion.r : motion.t,
    onAnimationComplete: () => { if (handoffComplete) invoke(initial.AV, scope, launch.request); },
    children: [
      jsx.jsx("span", { className: "sr-only", role: "status", children: message("realtimeVoice.launch.starting", "Starting voice chat", "Voice startup status") }),
      jsx.jsx("div", { className: stage.n as string, children: jsx.jsx("div", { className: stage.t as string, style: { transform },
        children: element(stage.o, { isConnecting: !activeOnMainThread, onHandoffComplete: () => invoke(initial.jV, scope, launch.request),
          orb: element(initial.eA, { className: "!aspect-square !size-full", glowEnabled: false,
            phase: voiceStage.phase === "inactive" ? "starting" : voiceStage.phase, placement: "center",
            voiceActivity: voiceStage.phase === "inactive" ? "idle" : voiceStage.activity }), orbDiameter: 112, reduceMotion }) }) }),
    ],
  });
}

function ignoreFailure(): void {}
let initialized = false;
function initializeRealtimeVoiceLaunchSurface(): void {
  if (initialized) return;
  initialized = true;
  for (const initializer of [shared.FX, shared.K2, shared.a$, initial.Qgn, initial.hEt, initial.pnt, initial.xlt, initial.tA, initial.mnt, initial.qn, stage.s, stage.a, motion.i, nativeOverlay.t]) {
    if (typeof initializer === "function") invoke(initializer);
  }
  jsx = invoke<JsxRuntime>(shared.I3);
}

export { initializeRealtimeVoiceLaunchSurface as n, RealtimeVoiceLaunchSurface as t };
