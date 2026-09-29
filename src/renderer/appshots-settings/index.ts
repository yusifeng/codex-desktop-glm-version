import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";

const {
  $3: initializeRuntimeLazy,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  bz: settingDescriptors,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as {
  $3(): void;
  HX<Value>(signal: import("@rchunk/app-shared").ReadableSignal<Value>): Value;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  LX(scope: unknown): unknown;
  ZI: unknown;
  bz: {
    destination: SettingDescriptor;
    soundEnabled: SettingDescriptor;
  };
  e6(): import("@rchunk/app-shared").ReactRuntime;
  n4(): import("@rchunk/app-shared").IntlShape;
};

interface SettingDescriptor { key: string }
type AppshotDestination = "automatic" | "last-chat" | "new-chat";
type AppshotHotkey = "DoubleAlt" | "DoubleCommand" | "DoubleOption" | "DoubleShift";

interface AppshotState {
  configuredHotkey?: AppshotHotkey | null;
  supported?: boolean;
}

interface AppshotBridgeResult {
  error?: string;
  state: AppshotState;
  success: boolean;
}

interface AppshotBridge {
  appshot?: {
    setHotkey(hotkey: AppshotHotkey | null): Promise<AppshotBridgeResult>;
  };
}

const appshotRuntime = appInitialChunk as unknown as {
  E6t: () => { platform: string };
  Kcn: (setting: SettingDescriptor) => unknown;
  Ucn: (scope: unknown, setting: SettingDescriptor, value: unknown) => Promise<void> | void;
  _A: import("@rchunk/app-shared").ReadableSignal<boolean>;
  bA: import("@rchunk/app-shared").ReadableSignal<AppshotState | null>;
  pnt: AppshotBridge;
};
const {
  E6t: getDesktopPlatform,
  Kcn: useSetting,
  Ucn: setSetting,
  _A: appshotsAvailableSignal,
  bA: appshotStateSignal,
  pnt: desktopBridge,
} = appshotRuntime;

const MAC_HOTKEYS: readonly { label: string; value: AppshotHotkey }[] = [
  { value: "DoubleCommand", label: "⌘ + ⌘" },
  { value: "DoubleOption", label: "⌥ + ⌥" },
  { value: "DoubleShift", label: "⇧ + ⇧" },
];
const WINDOWS_HOTKEYS: readonly { label: string; value: AppshotHotkey }[] = [
  { value: "DoubleAlt", label: "Alt + Alt" },
  { value: "DoubleShift", label: "Shift + Shift" },
];

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function SettingRow({
  control,
  description,
  label,
}: {
  control: unknown;
  description?: unknown;
  label: unknown;
}): unknown {
  return jsx.jsxs("div", {
    className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3",
    children: [
      jsx.jsxs("div", {
        className: "min-w-0",
        children: [
          jsx.jsx("div", { className: "font-medium", children: label }),
          description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description }),
        ],
      }),
      jsx.jsx("div", { className: "shrink-0", children: control }),
    ],
  });
}

function HotkeySetting({ state }: { state: AppshotState }): unknown {
  const intl = useIntl();
  const platform = getDesktopPlatform().platform;
  const [error, setError] = React.useState<string | null>(null);
  const options = platform === "windows" ? WINDOWS_HOTKEYS : MAC_HOTKEYS;
  const configured = state.configuredHotkey ?? "";
  const updateHotkey = async (hotkey: AppshotHotkey | null): Promise<void> => {
    setError(null);
    const bridge = desktopBridge.appshot;
    if (bridge == null) {
      setError("Appshot hotkeys are unavailable");
      return;
    }
    try {
      const result = await bridge.setHotkey(hotkey);
      if (!result.success) setError(result.error ?? "Unable to update Appshot hotkey");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };
  const description = error ?? (configured === "DoubleCommand"
    ? "Press both ⌘ keys simultaneously"
    : configured === "DoubleOption"
      ? "Press both ⌥ keys simultaneously"
      : configured === "DoubleShift"
        ? platform === "windows" ? "Press both Shift keys simultaneously" : "Press both ⇧ keys simultaneously"
        : configured === "DoubleAlt"
          ? "Press both Alt keys simultaneously"
          : undefined);
  return jsx.jsx(SettingRow, {
    label: "Hotkey",
    description,
    control: jsx.jsxs("select", {
      "aria-label": String(intl.formatMessage({ id: "settings.appshotHotkey.label", defaultMessage: "Hotkey" })),
      value: configured,
      onChange: (event: { currentTarget: { value: string } }) => {
        const value = event.currentTarget.value;
        void updateHotkey(value === "" ? null : value as AppshotHotkey);
      },
      children: [
        ...options.map((option) => jsx.jsx("option", { value: option.value, children: option.label }, option.value)),
        jsx.jsx("option", { value: "", children: "None" }, "none"),
      ],
    }),
  });
}

function Toggle({ checked, onChange }: { checked: boolean; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", {
    type: "button",
    role: "switch",
    "aria-label": "Play appshot sound effect",
    "aria-checked": checked,
    className: "rounded-full border px-3 py-1 text-sm",
    onClick: () => onChange(!checked),
    children: checked ? "On" : "Off",
  });
}

function AppshotsSettings(): unknown {
  initializeAppshotsSettings();
  const scope = useScope(AppScope);
  const available = useSignalValue(appshotsAvailableSignal);
  const state = useSignalValue(appshotStateSignal);
  if (!available || state?.supported === false || state == null) return null;
  const destination = (useSetting(settingDescriptors.destination) ?? "automatic") as AppshotDestination;
  const soundEnabled = Boolean(useSetting(settingDescriptors.soundEnabled));
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", {
        className: "border-b border-token-border-light px-5 py-4",
        children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Appshots" }),
      }),
      jsx.jsx("main", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsxs("div", {
          className: "mx-auto grid max-w-5xl gap-5 lg:grid-cols-2",
          children: [
            jsx.jsxs("div", {
              className: "flex flex-col gap-5",
              children: [
                jsx.jsxs("section", {
                  className: "rounded-xl border border-token-border-light p-4",
                  children: [
                    jsx.jsx("h2", { className: "font-semibold", children: "Take an appshot to show ChatGPT your frontmost window" }),
                    jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "Appshots include visual and text content, including text scrolled offscreen" }),
                  ],
                }),
                jsx.jsx("section", {
                  className: "overflow-hidden rounded-xl border border-token-border-light",
                  children: jsx.jsxs("div", {
                    className: "divide-y divide-token-border-light",
                    children: [
                      jsx.jsx(HotkeySetting, { state }),
                      jsx.jsx(SettingRow, {
                        label: "Appshot destination",
                        description: "Choose where appshots go when you use the hotkey",
                        control: jsx.jsxs("select", {
                          "aria-label": "Appshot destination",
                          value: destination,
                          onChange: (event: { currentTarget: { value: string } }) => {
                            void setSetting(scope, settingDescriptors.destination, event.currentTarget.value as AppshotDestination);
                          },
                          children: [
                            jsx.jsx("option", { value: "automatic", children: "Automatic" }),
                            jsx.jsx("option", { value: "last-chat", children: "Current chat" }),
                            jsx.jsx("option", { value: "new-chat", children: "New chat" }),
                          ],
                        }),
                      }),
                      jsx.jsx(SettingRow, {
                        label: "Play sound effect",
                        control: jsx.jsx(Toggle, {
                          checked: soundEnabled,
                          onChange: (value) => { void setSetting(scope, settingDescriptors.soundEnabled, value); },
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
            jsx.jsx("video", {
              "aria-label": "Appshots walkthrough video",
              autoPlay: true,
              className: "aspect-[901/1095] w-full rounded-xl bg-surface-secondary/92 object-cover",
              loop: true,
              muted: true,
              playsInline: true,
              preload: "auto",
              src: "appshot-demo-dc57d9bd1938.mp4",
            }),
          ],
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeAppshotsSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeAppshotsSettings();
export { AppshotsSettings };
