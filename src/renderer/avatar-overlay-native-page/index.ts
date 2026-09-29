// avatar-overlay-native-page —— 原生宠物浮层、Quick Chat、通知与实时语音入口。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/plan-implementation-request";
import * as pointerInteractivityChunk from "@rchunk/use-floating-window-pointer-interactivity";
import "@rchunk/mcp-tool-activity-label";
import * as nativeVoiceTransitionChunk from "@rchunk/use-realtime-voice-native-overlay-transition-enabled";
import "@rchunk/active-tool-activity-label";
import "@rchunk/permission-request-model";
import * as overlayDebugChunk from "@rchunk/avatar-overlay-debug-state";
// @ts-expect-error The release dependency has not received a semantic declaration yet.
import "@rchunk/controls";
import * as avatarMascotChunk from "@rchunk/avatar-mascot-button";
import * as realtimeHandoffChunk from "@rchunk/realtime-voice-handoff-target";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

interface Avatar { displayName: string; id: string; source?: string; type?: "builtin" | "cloud" | "custom" }
interface AvatarSelection { selectedAvatar: Avatar | null; selectedAvatarId?: string | null }
interface OverlaySession { body?: string; id: string; path?: string; status?: "completed" | "failed" | "running" | "waiting"; title: string }
interface SharedRuntime {
  $3(): void;
  $R: { petVisible: { default: boolean; key: string } };
  G3: { dispatchMessage(type: string, payload: Record<string, unknown>): void };
  I3(): JsxRuntime;
  e6: (() => ReactRuntime) & ReactRuntime;
}
interface InitialRuntime {
  Kcn<Value>(setting: { key: string }): Value | undefined;
  bc(): AvatarSelection;
  ofn(gate: string): boolean;
  p4(): { activeMode?: string };
  q2(): OverlaySession[];
}
interface PointerRuntime { n(): void; t(options: { isInteractive: boolean }): void }

const { $3: initializeRuntimeLazy, $R: petSettings, G3: hostBridge, I3: getJsxRuntime, e6: getReactRuntime } = appSharedChunk as unknown as SharedRuntime;
const { Kcn: readSetting, bc: useSelectedAvatar, ofn: isGateEnabled, p4: useCollaborationMode, q2: useOverlaySessions } = appInitialChunk as unknown as InitialRuntime;
const { n: initializePointerInteractivity, t: usePointerInteractivity } = pointerInteractivityChunk as unknown as PointerRuntime;
const { n: useNativeVoiceTransition, t: initializeNativeVoiceTransition } = nativeVoiceTransitionChunk;
const { n: initializeOverlayDebugState, t: overlayDebugState } = overlayDebugChunk;
const { r: initializeAvatarMascotButton, t: AvatarMascotButton } = avatarMascotChunk;
const { n: initializeRealtimeHandoff, t: RealtimeVoiceHandoffTarget } = realtimeHandoffChunk;

const QUICK_CHAT_GATE = "665486075";
const QUICK_CHAT_STYLE_GATE = "1532120159";
const REALTIME_VOICE_GATE = "620613358";
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeAvatarOverlayNativePage(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializePointerInteractivity();
  initializeNativeVoiceTransition();
  initializeOverlayDebugState();
  initializeAvatarMascotButton();
  initializeRealtimeHandoff();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function openMainWindow(): void {
  hostBridge.dispatchMessage("open-current-main-window", { focusComposer: true, stealFocus: true, appEntryAttribution: { channel: "shortcut", source: "shortcut" } });
}
function closeOverlay(): void { hostBridge.dispatchMessage("avatar-overlay-close", {}); }
function statusLabel(status: OverlaySession["status"]): string {
  switch (status) {
    case "completed": return "Completed";
    case "failed": return "Failed";
    case "waiting": return "Waiting for approval";
    case "running": return "Working";
    default: return "Update";
  }
}

function ActivityStack({ sessions }: { sessions: OverlaySession[] }): unknown {
  if (sessions.length === 0) return null;
  return jsx.jsx("ol", {
    "aria-label": "Recent task activity", className: "avatar-overlay-activity-stack",
    children: sessions.map((session) => jsx.jsx("li", {
      "data-session-status": session.status ?? "unknown",
      children: jsx.jsxs("button", {
        type: "button",
        onClick: () => {
          if (session.path == null) return;
          hostBridge.dispatchMessage("open-in-main-window", { path: session.path, appEntryAttribution: { channel: "push_notification", source: "pet_notification" } });
        },
        children: [jsx.jsx("strong", { children: session.title }), jsx.jsx("span", { children: session.body ?? statusLabel(session.status) })],
      }),
    }, session.id)),
  });
}

function QuickChat({ avatar, enabled }: { avatar: Avatar; enabled: boolean }): unknown {
  const [prompt, setPrompt] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const collaborationMode = useCollaborationMode();
  if (!enabled) return null;
  const submit = (): void => {
    const value = prompt.trim();
    if (value.length === 0 || pending) return;
    setPending(true); setError(null);
    try {
      hostBridge.dispatchMessage("avatar-overlay-submit-quick-chat", {
        activeCollaborationMode: collaborationMode.activeMode ?? null,
        avatarId: avatar.id, prompt: value, target: { type: "projectless" }, turnTrigger: "avatar_quick_chat",
      });
      setPrompt("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setPending(false); }
  };
  return jsx.jsxs("form", {
    className: "avatar-overlay-quick-chat",
    onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); submit(); },
    children: [
      jsx.jsx("label", { children: "Ask Codex" }),
      jsx.jsx("textarea", { "aria-label": "Quick chat prompt", placeholder: "Ask " + avatar.displayName + " anything", value: prompt, onChange: (event: { target: { value: string } }) => setPrompt(event.target.value) }),
      error == null ? null : jsx.jsx("p", { role: "alert", children: error }),
      jsx.jsx("button", { type: "submit", disabled: pending || prompt.trim().length === 0, children: pending ? "Sending…" : "Send" }),
    ],
  });
}

function AvatarOverlayNativePage(): unknown {
  const { selectedAvatar, selectedAvatarId } = useSelectedAvatar();
  const petVisible = readSetting<boolean>(petSettings.petVisible) ?? petSettings.petVisible.default;
  const quickChatEnabled = (isGateEnabled(QUICK_CHAT_GATE) || isGateEnabled(QUICK_CHAT_STYLE_GATE)) && petVisible;
  const voiceEnabled = isGateEnabled(REALTIME_VOICE_GATE);
  const nativeVoiceTransition = useNativeVoiceTransition();
  const sessions = useOverlaySessions();
  const interactive = selectedAvatar != null && (quickChatEnabled || voiceEnabled || sessions.length > 0);
  usePointerInteractivity({ isInteractive: interactive });
  React.useEffect(() => {
    if (selectedAvatar == null) hostBridge.dispatchMessage("avatar-overlay-pointer-interaction-changed", { isInteractive: false });
  }, [selectedAvatar]);
  if (selectedAvatar == null) return null;
  const customAvatarPending = selectedAvatarId?.startsWith("custom:") === true && selectedAvatar.type !== "custom";
  if (customAvatarPending) return jsx.jsx("div", { role: "status", "data-avatar-overlay-state": "pending-custom-avatar", children: "Loading custom pet…" });

  return jsx.jsxs("main", {
    className: "avatar-overlay-native-page",
    "data-avatar-overlay-state": "ready",
    "data-debug-border": overlayDebugState.value || undefined,
    "data-native-voice-transition": nativeVoiceTransition || undefined,
    children: [
      jsx.jsx("button", {
        type: "button", "aria-label": "Open " + selectedAvatar.displayName + " in Codex", onClick: openMainWindow,
        children: jsx.jsx(AvatarMascotButton, { ariaLabel: selectedAvatar.displayName, source: selectedAvatar.source ?? selectedAvatar.id, state: sessions.some((session) => session.status === "running") ? "running" : "idle" }),
      }),
      jsx.jsx(ActivityStack, { sessions }),
      jsx.jsx(QuickChat, { avatar: selectedAvatar, enabled: quickChatEnabled }),
      voiceEnabled ? jsx.jsx(RealtimeVoiceHandoffTarget, { nativeOverlayTransitionEnabled: nativeVoiceTransition, surface: "global-overlay" }) : null,
      jsx.jsx("button", { type: "button", "aria-label": "Close pet", onClick: closeOverlay, children: "Close" }),
    ],
  });
}

initializeAvatarOverlayNativePage();
export { AvatarOverlayNativePage };
