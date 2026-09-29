import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

const {
  $3: initializeRuntimeLazy,
  Cq: debugPolicy,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk;

type GpuDebugSettingKey =
  | "disableScrollFadeMask"
  | "disableScrollFadeMaskAnimation"
  | "disableBackdropBlur"
  | "disableCssMotion"
  | "disableSquircles"
  | "forceOpaqueRendererBackground";

type GpuDebugSettings = Record<GpuDebugSettingKey, boolean>;
interface SettingDescriptor { key: string }

const debugRuntime = appInitialChunk as unknown as {
  Kcn: (setting: SettingDescriptor) => unknown;
  Sn: (scope: unknown, settingKey: GpuDebugSettingKey, value: boolean) => void;
  Ucn: (scope: unknown, setting: SettingDescriptor, value: boolean) => Promise<void> | void;
  bn: import("@rchunk/app-shared").ReadableSignal<GpuDebugSettings>;
  vz: { debugChromePagesEnabled: SettingDescriptor };
};
const {
  Kcn: useSetting,
  Sn: setGpuDebugSetting,
  Ucn: setSetting,
  bn: gpuDebugSettingsSignal,
  vz: settingDescriptors,
} = debugRuntime;

const GPU_DEBUG_SETTINGS: readonly {
  description: string;
  label: string;
  settingKey: GpuDebugSettingKey;
}[] = [
  {
    settingKey: "disableScrollFadeMask",
    label: "Disable scroll fade mask",
    description: "Removes scroll-edge fade masks entirely to isolate mask compositing as a tearing trigger",
  },
  {
    settingKey: "disableScrollFadeMaskAnimation",
    label: "Disable scroll fade animation",
    description: "Keeps static fade masks but removes the scroll-linked animation timeline",
  },
  {
    settingKey: "disableBackdropBlur",
    label: "Disable backdrop blur",
    description: "Forces backdrop filters off across the web UI to reduce layered blur composition",
  },
  {
    settingKey: "disableCssMotion",
    label: "Disable CSS motion",
    description: "Turns off CSS animations and transitions to isolate compositor animation work",
  },
  {
    settingKey: "disableSquircles",
    label: "Disable squircles",
    description: "Uses standard round corners instead of CSS superellipses to isolate squircle rendering cost",
  },
  {
    settingKey: "forceOpaqueRendererBackground",
    label: "Force opaque web background",
    description: "Paints the renderer root and body with opaque backgrounds to isolate transparent-window composition",
  },
] as const;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function Toggle({
  ariaLabel,
  checked,
  onChange,
}: {
  ariaLabel: string;
  checked: boolean;
  onChange(value: boolean): void;
}): unknown {
  return jsx.jsx("button", {
    type: "button",
    role: "switch",
    "aria-label": ariaLabel,
    "aria-checked": checked,
    className: "rounded-full border px-3 py-1 text-sm",
    onClick: () => onChange(!checked),
    children: checked ? "On" : "Off",
  });
}

function SettingRow({
  control,
  description,
  label,
}: {
  control: unknown;
  description?: string;
  label: string;
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

function Section({
  children,
  subtitle,
  title,
}: {
  children: unknown;
  subtitle: string;
  title: string;
}): unknown {
  return jsx.jsxs("section", {
    className: "rounded-xl border border-token-border-light bg-surface-primary",
    children: [
      jsx.jsxs("header", {
        className: "border-b border-token-border-light px-4 py-3",
        children: [
          jsx.jsx("h2", { className: "font-semibold", children: title }),
          jsx.jsx("p", { className: "mt-0.5 text-sm text-secondary", children: subtitle }),
        ],
      }),
      jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
    ],
  });
}

function ChromeDebugPages(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const descriptor = settingDescriptors.debugChromePagesEnabled;
  const enabled = Boolean(useSetting(descriptor));
  const label = String(intl.formatMessage({
    id: "settings.debug.chromePages.label",
    defaultMessage: "Enable Chrome debug pages",
  }));
  return jsx.jsx(Section, {
    title: "Chrome debug pages",
    subtitle: "Allow Browser Use to open trusted chrome:// diagnostics such as version and histograms. chrome-untrusted:// stays blocked.",
    children: jsx.jsx(SettingRow, {
      label,
      control: jsx.jsx(Toggle, {
        checked: enabled,
        ariaLabel: "Toggle Chrome debug pages",
        onChange: (value) => { void setSetting(scope, descriptor, value); },
      }),
    }),
  });
}

function GpuTearingDebug(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const settings = useSignalValue(gpuDebugSettingsSignal);
  return jsx.jsx(Section, {
    title: "GPU Tearing Debug",
    subtitle: "Temporary compositor isolation toggles. Changes apply immediately and are only active while the debug gate is enabled.",
    children: GPU_DEBUG_SETTINGS.map(({ description, label, settingKey }) => jsx.jsx(SettingRow, {
      label,
      description,
      control: jsx.jsx(Toggle, {
        checked: settings[settingKey],
        ariaLabel: String(intl.formatMessage(
          { id: "settings.general.gpuTearingDebug.toggle", defaultMessage: "Toggle {settingName}" },
          { settingName: label },
        )),
        onChange: (value) => setGpuDebugSetting(scope, settingKey, value),
      }),
    }, settingKey)),
  });
}

function DebugSettings(): unknown {
  initializeDebugSettings();
  const showChromeDebugPages = debugPolicy.allowDebugMenu("prod");
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", {
        className: "border-b border-token-border-light px-5 py-4",
        children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Debug" }),
      }),
      jsx.jsx("div", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsxs("div", {
          className: "mx-auto flex max-w-3xl flex-col gap-5",
          children: [
            showChromeDebugPages ? jsx.jsx(ChromeDebugPages, {}) : null,
            jsx.jsx(GpuTearingDebug, {}),
          ],
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeDebugSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeDebugSettings();
export { DebugSettings };
