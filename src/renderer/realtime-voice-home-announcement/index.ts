// realtime-voice-home-announcement —— Home 页实时语音入口公告。
// 原版：app/webview/assets/realtime-voice-home-announcement-1020c8788781.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appPrimaryChunk from "@rchunk/app-primary";

void runtimeChunk;

const appShared = appSharedChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;

const DEFAULT_ORB_SRC =
  "https://persistent.oaistatic.com/voice/bidi-homepage-banner-orb.21107572.webp";

interface RealtimeVoiceHomeAnnouncementContentProps {
  entryPoint: "chatgpt" | "codex" | string;
  onDismiss(): void;
  onStart(): void;
  orbSrc?: string;
}

let jsx: any;
let initialized = false;

function initializeRealtimeVoiceHomeAnnouncement(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  appPrimary.Cm?.();
  appShared.ag?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function RealtimeVoiceHomeAnnouncementContent({
  entryPoint,
  onDismiss,
  onStart,
  orbSrc = DEFAULT_ORB_SRC,
}: RealtimeVoiceHomeAnnouncementContentProps): unknown {
  initializeRealtimeVoiceHomeAnnouncement();
  const intl = appShared.n4?.();
  const FormattedMessage = appShared.Y2;
  const Announcement = appPrimary.Sm;

  const title = jsx.jsx(FormattedMessage, {
    id: "realtimeVoice.homeAnnouncement.title",
    defaultMessage: "Try ChatGPT Voice",
    description: "Title shown in the Home banner introducing realtime voice",
  });
  const description =
    entryPoint === "chatgpt"
      ? jsx.jsx(FormattedMessage, {
          id: "realtimeVoice.homeAnnouncement.description.chatgpt",
          defaultMessage: "Coordinate tasks, connect tools, and explore ideas",
          description:
            "Description shown in the ChatGPT Home banner introducing realtime voice",
        })
      : jsx.jsx(FormattedMessage, {
          id: "realtimeVoice.homeAnnouncement.description.codex",
          defaultMessage: "Orchestrate tasks, connect tools, and explore code",
          description:
            "Description shown in the Codex Home banner introducing realtime voice",
        });
  const leadingVisual = jsx.jsx("img", {
    alt: "",
    className: "size-full",
    src: orbSrc,
  });
  const primaryAction = {
    label: jsx.jsx(FormattedMessage, {
      id: "realtimeVoice.homeAnnouncement.action",
      defaultMessage: "Start Voice",
      description:
        "Button label in the Home banner that opens realtime voice onboarding",
    }),
    onClick: onStart,
  };
  const dismissAction = {
    ariaLabel: intl?.formatMessage?.({
      id: "realtimeVoice.homeAnnouncement.dismiss",
      defaultMessage: "Dismiss voice chat banner",
      description:
        "Accessible label for dismissing the realtime voice Home banner",
    }),
    icon: appShared.ig,
    onClick: onDismiss,
  };

  return jsx.jsx(Announcement, {
    title,
    description,
    leadingVisual,
    primaryAction,
    dismissAction,
  });
}

initializeRealtimeVoiceHomeAnnouncement();

export { RealtimeVoiceHomeAnnouncementContent };
