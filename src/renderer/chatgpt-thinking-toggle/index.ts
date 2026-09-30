// ChatGPT composer thinking-mode toggle. Release chunk: toggle-b02ae5564000.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

interface Props {
  disabled?: boolean;
  selectedSystemHints: string[];
  onSystemHintsChange(hints: string[]): boolean | void;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface SharedRuntime {
  I3(): JsxRuntime;
  LX(signal: unknown): unknown;
  ZI: unknown;
  Y2: unknown;
  Uv: unknown;
  Yh: unknown;
  o_: unknown;
  [key: string]: unknown;
}
interface InitialRuntime {
  xpn(
    store: unknown,
    eventName: unknown,
    payload: {
      surface: unknown;
      uiEvent: { type: unknown };
    },
  ): void;
  ypn(): void;
}
interface PrimaryRuntime {
  Ga: unknown;
  Ja(): void;
  Ka: { CHATGPT_MODEL_PICKER_SURFACE_TOGGLE: unknown };
  qa: {
    CHATGPT_MODEL_PICKER_UI_EVENT_TYPE_AUTO_SWITCH_TO_THINKING_TOGGLE_CLICKED: unknown;
  };
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const primary = appPrimaryChunk as unknown as PrimaryRuntime;
const jsxRuntime = shared.I3();

function withoutReason(hint: string): boolean {
  return hint !== "reason";
}

function ChatGptThinkingToggle({
  disabled,
  selectedSystemHints,
  onSystemHintsChange,
}: Props): unknown {
  const store = shared.LX(shared.ZI);
  const selected = selectedSystemHints.includes("reason");
  const toggle = () => {
    const changed = onSystemHintsChange(
      selected ? selectedSystemHints.filter(withoutReason) : ["reason"],
    );
    if (!selected && changed !== false) {
      initial.xpn(store, primary.Ga, {
        surface: primary.Ka.CHATGPT_MODEL_PICKER_SURFACE_TOGGLE,
        uiEvent: {
          type: primary.qa
            .CHATGPT_MODEL_PICKER_UI_EVENT_TYPE_AUTO_SWITCH_TO_THINKING_TOGGLE_CLICKED,
        },
      });
    }
  };
  return jsxRuntime.jsx(shared.o_, {
    tooltipContent: jsxRuntime.jsx(shared.Y2, {
      id: "chatgptConversations.thinkingMode.tooltip",
      defaultMessage: "Get a smarter answer",
      description:
        "Tooltip explaining the Think button in the ChatGPT composer",
    }),
    children: jsxRuntime.jsxs(shared.Yh, {
      "aria-pressed": selected,
      color: selected ? "accentSubtle" : "ghost",
      disabled,
      size: "composerPill",
      onClick: toggle,
      children: [
        jsxRuntime.jsx(shared.Uv, {}),
        jsxRuntime.jsx(shared.Y2, {
          id: "chatgptConversations.thinkingMode.label",
          defaultMessage: "Think",
          description:
            "Toggles extra reasoning for the current ChatGPT conversation",
        }),
      ],
    }),
  });
}

primary.Ja();
for (const name of ["FX", "K2", "Zh", "lw", "c_", "QI"] as const) {
  const initializer = shared[name];
  if (typeof initializer === "function") (initializer as () => void)();
}
initial.ypn();

export { ChatGptThinkingToggle };
