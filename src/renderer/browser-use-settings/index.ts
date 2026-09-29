import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/compact-empty-state";
import "@rchunk/browser-browsing-data-dialog";
import "@rchunk/browser-profile-import-availability";
import "@rchunk/browser-use-origin-state-queries";
import "@rchunk/dialog-launcher-core";
import "@rchunk/browser-profile-import-history-icon";
import {
  n as getBrowserSettingsVisibility,
  t as initializeBrowserSettingsVisibility,
} from "@rchunk/browser-settings-visibility";
import "@rchunk/settings-row-disclosure";
import "@rchunk/settings-plugin-selection";

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  LX: useScope,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;

interface BrowserSettingVisibility {
  enabled: boolean;
  isLoading: boolean;
}

interface BrowserSettingsVisibility {
  contactInfo: BrowserSettingVisibility;
  downloads: BrowserSettingVisibility;
  extensions: BrowserSettingVisibility;
  history: BrowserSettingVisibility;
  passwordManager: BrowserSettingVisibility;
  siteSettings: BrowserSettingVisibility;
}

interface BrowserUseBridge {
  browsingData?: {
    clear(categories: readonly BrowserDataCategory[]): Promise<void>;
  };
  downloads?: {
    chooseDownloadDirectory(): Promise<string | null>;
    clearHistory?(): Promise<void>;
  };
}

interface BrowserUseRuntime {
  getSetting<Value>(key: string): Value;
  setSetting<Value>(scope: unknown, key: string, value: Value): Promise<void>;
  useHostFeatureAvailability(options: { featureName: string; hostId: string }): { enabled: boolean; isLoading: boolean };
  useLocation(): { pathname: string; search?: string; state?: unknown };
  useNavigate(): (path: string, options?: { replace?: boolean; state?: unknown }) => void;
  useSelectedHost(): { selectedHostId: string };
  bridge: BrowserUseBridge | null;
}

const browserRuntime = appInitialChunk as unknown as {
  Gv: BrowserUseRuntime["useSelectedHost"];
  Kcn: BrowserUseRuntime["getSetting"];
  Ucn: BrowserUseRuntime["setSetting"];
  i_n: BrowserUseRuntime["useLocation"];
  o_n: BrowserUseRuntime["useNavigate"];
  pnt: BrowserUseBridge | null;
  w6t: BrowserUseRuntime["useHostFeatureAvailability"];
};
const {
  Gv: useSelectedHost,
  Kcn: useBrowserSetting,
  Ucn: setBrowserSetting,
  i_n: useLocation,
  o_n: useNavigate,
  pnt: browserBridge,
  w6t: useHostFeatureAvailability,
} = browserRuntime;

type BrowserDataCategory = "cache" | "cookies" | "downloads" | "history" | "siteData";
type BrowserSubpage = "browsing-history" | "contact-info" | "download-history" | "extensions" | "password-manager" | "site-settings";

const SETTING_KEYS = {
  annotationScreenshotsMode: "annotationScreenshotsMode",
  downloadDirectory: "downloadDirectory",
  localUrlOpenTarget: "localUrlOpenTarget",
  promptForDownloadLocation: "promptForDownloadLocation",
  showFullUrl: "showFullUrl",
} as const;

const SUBPAGE_DETAILS: Record<BrowserSubpage, { title: string; description: string; visibility: keyof BrowserSettingsVisibility }> = {
  "browsing-history": {
    title: "Browsing history",
    description: "Search, open, and remove pages visited in the in-app browser.",
    visibility: "history",
  },
  "contact-info": {
    title: "Contact info",
    description: "Manage contact information available to browser autofill.",
    visibility: "contactInfo",
  },
  "download-history": {
    title: "Download history",
    description: "Review downloaded files and clear download history.",
    visibility: "downloads",
  },
  extensions: {
    title: "Extensions",
    description: "Manage extensions available to the in-app browser.",
    visibility: "extensions",
  },
  "password-manager": {
    title: "Password manager",
    description: "Manage passwords saved for browser sign-in flows.",
    visibility: "passwordManager",
  },
  "site-settings": {
    title: "Site settings",
    description: "Control permissions, cookies, pop-ups, JavaScript, media, and other site capabilities.",
    visibility: "siteSettings",
  },
};

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function Section({ children, title }: { children: unknown; title: unknown }): unknown {
  return jsx.jsxs("section", {
    className: "rounded-xl border border-token-border-light bg-surface-primary",
    children: [
      jsx.jsx("h2", { className: "border-b border-token-border-light px-4 py-3 font-semibold", children: title }),
      jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
    ],
  });
}

function SettingRow({
  action,
  description,
  label,
}: {
  action: unknown;
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
      jsx.jsx("div", { className: "shrink-0", children: action }),
    ],
  });
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled,
    className: "rounded-full border px-3 py-1 text-sm",
    onClick: () => onChange(!checked),
    children: checked ? "On" : "Off",
  });
}

function BrowserSubpageView({
  hostId,
  kind,
  visibility,
}: {
  hostId: string;
  kind: BrowserSubpage;
  visibility: BrowserSettingsVisibility;
}): unknown {
  const navigate = useNavigate();
  const details = SUBPAGE_DETAILS[kind];
  const availability = visibility[details.visibility];
  React.useEffect(() => {
    if (!availability.enabled && !availability.isLoading) {
      navigate("/settings/browser-use", { replace: true });
    }
  }, [availability.enabled, availability.isLoading, navigate]);
  if (availability.isLoading) {
    return jsx.jsx("div", { role: "status", className: "p-6 text-secondary", children: "Loading Browser Use settings…" });
  }
  if (!availability.enabled) return null;
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsxs("header", {
        className: "flex items-center gap-3 border-b border-token-border-light px-5 py-4",
        children: [
          jsx.jsx(Button, { color: "ghost", onClick: () => navigate("/settings/browser-use"), children: "←" }),
          jsx.jsxs("div", {
            children: [
              jsx.jsx("h1", { className: "font-semibold", children: details.title }),
              jsx.jsx("p", { className: "text-sm text-secondary", children: details.description }),
            ],
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "flex-1 overflow-auto p-5",
        children: jsx.jsxs("div", {
          className: "rounded-xl border border-token-border-light p-5",
          children: [
            jsx.jsx("div", { className: "font-medium", children: details.title }),
            jsx.jsx("div", { className: "mt-1 text-sm text-secondary", children: details.description }),
            jsx.jsx("div", { className: "mt-4 text-xs text-secondary", children: "Host: " + hostId }),
          ],
        }),
      }),
    ],
  });
}

function BrowserUseSettings(): unknown {
  initializeBrowserUseSettings();
  const intl = useIntl();
  const scope = useScope(AppScope) as { get<Value>(signal: unknown): Value };
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedHostId } = useSelectedHost();
  const visibility = getBrowserSettingsVisibility({ hostId: selectedHostId }) as BrowserSettingsVisibility;
  const feature = useHostFeatureAvailability({ featureName: "in_app_browser", hostId: selectedHostId });
  const [clearCategories, setClearCategories] = React.useState<BrowserDataCategory[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const showFullUrl = Boolean(useBrowserSetting<boolean>(SETTING_KEYS.showFullUrl));
  const promptForDownloadLocation = Boolean(useBrowserSetting<boolean>(SETTING_KEYS.promptForDownloadLocation));
  const downloadDirectory = useBrowserSetting<string | null>(SETTING_KEYS.downloadDirectory) ?? null;
  const annotationScreenshotsMode = useBrowserSetting<string>(SETTING_KEYS.annotationScreenshotsMode) ?? "necessary";
  const localUrlOpenTarget = useBrowserSetting<string>(SETTING_KEYS.localUrlOpenTarget) ?? "in-app-browser";
  const subpage = location.pathname.slice("/settings/browser-use/".length) as BrowserSubpage;
  if (location.pathname.startsWith("/settings/browser-use/") && subpage in SUBPAGE_DETAILS) {
    return jsx.jsx(BrowserSubpageView, { hostId: selectedHostId, kind: subpage, visibility });
  }

  const saveSetting = async <Value,>(key: string, value: Value) => {
    setBusy(true);
    try {
      await setBrowserSetting(scope, key, value);
    } catch {
      scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
        String(intl.formatMessage({ id: "settings.browserUse.updateError", defaultMessage: "Unable to update Browser Use settings" })),
      );
    } finally {
      setBusy(false);
    }
  };

  const clearBrowsingData = async () => {
    if (clearCategories == null || browserBridge?.browsingData == null) return;
    setBusy(true);
    try {
      await browserBridge.browsingData.clear(clearCategories);
      setClearCategories(null);
    } catch {
      scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
        String(intl.formatMessage({ id: "settings.browserUse.clearBrowsingData.error", defaultMessage: "Unable to clear browsing data" })),
      );
    } finally {
      setBusy(false);
    }
  };

  const chooseDownloadDirectory = async () => {
    const directory = await browserBridge?.downloads?.chooseDownloadDirectory();
    if (directory != null) await saveSetting(SETTING_KEYS.downloadDirectory, directory);
  };

  if (feature.isLoading) {
    return jsx.jsx("div", { role: "status", className: "p-6 text-secondary", children: "Loading Browser Use settings…" });
  }

  const generalEnabled = feature.enabled;
  return jsx.jsxs("div", {
    className: "h-full overflow-auto p-6",
    children: [
      jsx.jsxs("header", {
        className: "mb-6",
        children: [
          jsx.jsx("h1", { className: "text-xl font-semibold", children: "Browser Use" }),
          jsx.jsx("p", {
            className: "mt-1 text-sm text-secondary",
            children: jsx.jsx(FormattedMessage, {
              id: "settings.browserUse.policyAuthoring.subtitle",
              defaultMessage: "Manage your Browser Use preferences and site access.",
            }),
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "flex flex-col gap-5",
        children: jsx.jsxs(React.Fragment, {
          children: [
            jsx.jsx(Section, {
              title: "Browser availability",
              children: jsx.jsx(SettingRow, {
                label: "In-app browser",
                description: generalEnabled ? "Available on " + selectedHostId : "Unavailable on this host",
                action: jsx.jsx("span", { className: generalEnabled ? "text-success" : "text-secondary", children: generalEnabled ? "Available" : "Unavailable" }),
              }),
            }),
            generalEnabled ? jsx.jsx(Section, {
              title: "General",
              children: jsx.jsxs(React.Fragment, {
                children: [
                  jsx.jsx(SettingRow, {
                    label: "Show full URL",
                    description: "Display the complete address in the browser toolbar.",
                    action: jsx.jsx(Toggle, { checked: showFullUrl, disabled: busy, onChange: (value) => { void saveSetting(SETTING_KEYS.showFullUrl, value); } }),
                  }),
                  jsx.jsx(SettingRow, {
                    label: "Open local URLs",
                    description: "Choose where localhost and local-network links open.",
                    action: jsx.jsxs("select", {
                      value: localUrlOpenTarget,
                      disabled: busy,
                      onChange: (event: Event) => { void saveSetting(SETTING_KEYS.localUrlOpenTarget, (event.currentTarget as HTMLSelectElement).value); },
                      children: [
                        jsx.jsx("option", { value: "in-app-browser", children: "In-app browser" }),
                        jsx.jsx("option", { value: "external-browser", children: "External browser" }),
                      ],
                    }),
                  }),
                  jsx.jsx(SettingRow, {
                    label: "Annotation screenshots",
                    description: "Control when screenshots accompany site annotations.",
                    action: jsx.jsxs("select", {
                      value: annotationScreenshotsMode,
                      disabled: busy,
                      onChange: (event: Event) => { void saveSetting(SETTING_KEYS.annotationScreenshotsMode, (event.currentTarget as HTMLSelectElement).value); },
                      children: [
                        jsx.jsx("option", { value: "necessary", children: "When necessary" }),
                        jsx.jsx("option", { value: "always", children: "Always" }),
                      ],
                    }),
                  }),
                  visibility.history.enabled ? jsx.jsx(SettingRow, {
                    label: "Browsing history",
                    description: "Review or remove pages visited in the in-app browser.",
                    action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/browsing-history"), children: "Manage" }),
                  }) : null,
                  jsx.jsx(SettingRow, {
                    label: "Clear browsing data",
                    description: "Delete cookies, site data, cached files, downloads, or history.",
                    action: jsx.jsx(Button, { color: "secondary", onClick: () => setClearCategories(["cookies", "siteData", "cache", "downloads", "history"]), children: "Clear…" }),
                  }),
                ],
              }),
            }) : null,
            visibility.passwordManager.enabled || visibility.contactInfo.enabled ? jsx.jsx(Section, {
              title: "Autofill and passwords",
              children: jsx.jsxs(React.Fragment, {
                children: [
                  visibility.passwordManager.enabled ? jsx.jsx(SettingRow, { label: "Password manager", description: "Manage saved passwords.", action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/password-manager"), children: "Manage" }) }) : null,
                  visibility.contactInfo.enabled ? jsx.jsx(SettingRow, { label: "Contact info", description: "Manage saved contact information.", action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/contact-info"), children: "Manage" }) }) : null,
                ],
              }),
            }) : null,
            visibility.extensions.enabled ? jsx.jsx(Section, {
              title: "Extensions",
              children: jsx.jsx(SettingRow, { label: "Browser extensions", description: "Manage installed browser extensions.", action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/extensions"), children: "Manage" }) }),
            }) : null,
            visibility.downloads.enabled ? jsx.jsx(Section, {
              title: "Downloads",
              children: jsx.jsxs(React.Fragment, {
                children: [
                  jsx.jsx(SettingRow, { label: "Location", description: downloadDirectory ?? "System Downloads folder", action: jsx.jsx(Button, { disabled: busy, onClick: chooseDownloadDirectory, children: "Change" }) }),
                  jsx.jsx(SettingRow, { label: "Ask where to save each file", action: jsx.jsx(Toggle, { checked: promptForDownloadLocation, disabled: busy, onChange: (value) => { void saveSetting(SETTING_KEYS.promptForDownloadLocation, value); } }) }),
                  jsx.jsx(SettingRow, { label: "Download history", description: "Review and clear downloaded files.", action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/download-history"), children: "Manage" }) }),
                ],
              }),
            }) : null,
            visibility.siteSettings.enabled ? jsx.jsx(Section, {
              title: "Sites",
              children: jsx.jsx(SettingRow, { label: "Site settings", description: "Manage permissions and stored data for sites.", action: jsx.jsx(Button, { onClick: () => navigate("/settings/browser-use/site-settings"), children: "Manage" }) }),
            }) : null,
          ],
        }),
      }),
      clearCategories == null ? null : jsx.jsx("div", {
        role: "dialog",
        "aria-label": "Clear browsing data",
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
        children: jsx.jsxs("div", {
          className: "w-full max-w-md rounded-xl bg-surface p-5 shadow-xl",
          children: [
            jsx.jsx("h2", { className: "font-semibold", children: "Clear browsing data" }),
            jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "The selected browser data will be removed from this host." }),
            jsx.jsxs("div", {
              className: "mt-4 flex justify-end gap-2",
              children: [
                jsx.jsx(Button, { color: "secondary", onClick: () => setClearCategories(null), children: "Cancel" }),
                jsx.jsx(Button, { color: "dangerSolid", disabled: busy, onClick: clearBrowsingData, children: "Clear" }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}

let initialized = false;
function initializeBrowserUseSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeBrowserSettingsVisibility();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeBrowserUseSettings();
export { BrowserUseSettings };
