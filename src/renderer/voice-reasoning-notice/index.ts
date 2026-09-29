// Voice reasoning downgrade notice. Release chunk: notice-2197fe51f059.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as announcementStateChunk from "@rchunk/task-announcement-state";

interface Props {
  conversationId: string;
  hostId: string;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
}
interface SharedRuntime {
  BX(signal: unknown, parameter: unknown): unknown;
  I3(): JsxRuntime;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as Record<string, unknown>;
const state = announcementStateChunk as unknown as Record<string, unknown>;
const jsxRuntime = shared.I3();

function VoiceReasoningNoticeController(props: Props): unknown {
  const sessionId = shared.BX(state.r, props);
  if (sessionId == null) return null;
  return jsxRuntime.jsx(VoiceReasoningNotice, { ...props, sessionId });
}

function VoiceReasoningNotice({
  conversationId,
  hostId,
  sessionId,
}: Props & { sessionId: unknown }): unknown {
  const useModelSettings = initial.f8 as
    | ((conversationId: string) => {
        modelSettings: {
          model: string;
          reasoningEffort?: string | null;
          isLoading?: boolean;
        };
        setModelAndReasoningEffort(
          model: string,
          effort: string,
        ): Promise<boolean>;
      })
    | undefined;
  const settings = useModelSettings?.(conversationId);
  if (
    !settings ||
    settings.modelSettings.isLoading ||
    settings.modelSettings.reasoningEffort == null ||
    ["none", "minimal", "low"].includes(settings.modelSettings.reasoningEffort)
  ) {
    return null;
  }
  const store = (
    shared.LX as
      | ((signal: unknown) => { set(signal: unknown, updater: unknown): void })
      | undefined
  )?.(shared.ZI);
  const dismiss = () =>
    store?.set(state.n, (value: unknown) =>
      typeof value === "object" && value !== null
        ? { ...value, dismissed: true }
        : value,
    );
  const useLight = () => {
    void settings
      .setModelAndReasoningEffort(settings.modelSettings.model, "low")
      .then((changed) => {
        if (changed) dismiss();
      });
  };
  const Banner = initial.n7;
  return jsxRuntime.jsx("div", {
    "data-realtime-voice-reasoning-notice": true,
    children: jsxRuntime.jsx(Banner, {
      density: "compact",
      layout: "inline",
      content: "Switch to Light for faster Voice replies",
      primaryCtaText: "Use Light",
      secondaryCtaText: "Got it",
      isPrimaryCtaDisabled: false,
      onPrimaryCtaClick: useLight,
      onSecondaryCtaClick: dismiss,
      hostId,
      sessionId,
    }),
  });
}

for (const [runtime, names] of [
  [shared as unknown as Record<string, unknown>, ["FX", "K2"]],
  [initial, ["r7", "u8", "S8"]],
  [state, ["t"]],
] as Array<[Record<string, unknown>, string[]]>) {
  for (const name of names) {
    const value = runtime[name];
    if (typeof value === "function") (value as () => void)();
  }
}

export { VoiceReasoningNoticeController };
