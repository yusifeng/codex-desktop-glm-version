import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as colorIconChunk from "@rchunk/color-icon";
import * as computerHistorySuggestionPromptChunk from "@rchunk/computer-history-suggestion-prompt";
import * as computerHistoryQueryChunk from "@rchunk/computer-history-query";
import * as chronicleServiceQueriesChunk from "@rchunk/chronicle-service-queries";
import * as chroniclePermissionsDialogChunk from "@rchunk/chronicle-permissions-dialog";

void appPrimaryChunk;

type RecorderState = "paused" | "running" | "stopped";
type ActivationState = "active" | "failed" | "idle" | "starting" | "waiting_for_permissions";
interface ChronicleState {
  activationState?: ActivationState;
  enabled: boolean;
  recorderState?: RecorderState;
}
interface ChronicleApplication {
  bundleIdentifier?: string;
  name?: string;
  observed?: boolean;
}
interface HistoryInterval { endMs?: number; startMs?: number }
interface HistoryItem {
  application?: ChronicleApplication;
  createdAt?: number | string;
  id?: string;
  interval?: HistoryInterval;
  summary?: string;
  title?: string;
}
interface ChronicleSettings {
  applications?: ChronicleApplication[];
  showMenuBarIndicator?: boolean;
}
interface ChronicleService {
  clearHistory(scope: "all" | "interval" | "last_day" | "last_hour" | "last_ten_minutes", interval?: HistoryInterval): Promise<unknown>;
  getSettings(): Promise<ChronicleSettings>;
  getState(): Promise<ChronicleState>;
  listHistory(): Promise<HistoryItem[] | { items?: HistoryItem[] }>;
  pause(): Promise<ChronicleState>;
  resume(): Promise<ChronicleState>;
  retryActivation(): Promise<ChronicleState>;
  setEnabled(enabled: boolean): Promise<ChronicleState>;
  updateSettings(settings: ChronicleSettings): Promise<ChronicleSettings>;
}
interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
  warning?(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
}

const appSharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  FX(): void;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  LX(scope: unknown): { get(signal: unknown): unknown };
  ZI: unknown;
  e6(): import("@rchunk/app-shared").ReactRuntime;
  pk: unknown;
};
const {
  $3: initializeRuntimeLazy,
  FX: initializeScopeRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  pk: toastManagerSignal,
} = appSharedRuntime;

const appInitialRuntime = appInitialChunk as unknown as {
  Xl(): void;
  pnt?: { chronicle?: ChronicleService | null };
  su(): void;
};
const {
  Xl: initializeSettingsPage,
  pnt: serviceRegistry,
  su: initializeSettingsRuntime,
} = appInitialRuntime;

const colorIconRuntime = colorIconChunk as unknown as {
  n(): void;
  t(props: Record<string, unknown>): unknown;
};
const { n: initializeColorIcon, t: ColorIcon } = colorIconRuntime;
const suggestionRuntime = computerHistorySuggestionPromptChunk as unknown as {
  n(): void;
};
const { n: initializeSuggestionPrompt } = suggestionRuntime;
const historyQueryRuntime = computerHistoryQueryChunk as unknown as {
  a(): void;
};
const { a: initializeComputerHistoryQuery } = historyQueryRuntime;
const serviceQueryRuntime = chronicleServiceQueriesChunk as unknown as {
  S(): void;
};
const { S: initializeChronicleServiceQueries } = serviceQueryRuntime;
const permissionsRuntime = chroniclePermissionsDialogChunk as unknown as {
  n(): void;
  t(props: Record<string, unknown>): unknown;
};
const { n: initializePermissionsDialog, t: ChroniclePermissionsDialog } = permissionsRuntime;

type ClearRequest = { interval?: HistoryInterval; scope: "all" | "interval" | "last_day" | "last_hour" | "last_ten_minutes" } | null;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function normalizeHistory(value: HistoryItem[] | { items?: HistoryItem[] }): HistoryItem[] {
  return Array.isArray(value) ? value : value.items ?? [];
}

function itemTitle(item: HistoryItem, index: number): string {
  return item.title?.trim() || item.application?.name?.trim() || "Computer activity " + String(index + 1);
}

function itemTime(item: HistoryItem): string {
  const value = item.createdAt ?? item.interval?.startMs;
  if (value == null) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleString();
}

function Button({
  children,
  danger = false,
  disabled = false,
  onClick,
  testId,
  type = "button",
}: {
  children: unknown;
  danger?: boolean;
  disabled?: boolean;
  onClick?(): void;
  testId?: string;
  type?: "button" | "submit";
}): unknown {
  return jsx.jsx("button", {
    type,
    disabled,
    onClick,
    "data-testid": testId,
    className: danger ? "rounded-lg bg-danger px-3 py-2 text-white" : "rounded-lg border px-3 py-2",
    children,
  });
}

function Modal({ children, onClose, title }: { children: unknown; onClose(): void; title: string }): unknown {
  return jsx.jsx("div", {
    role: "dialog",
    "aria-label": title,
    className: "fixed inset-0 z-50 grid place-items-center bg-black/20 p-4",
    children: jsx.jsxs("section", {
      className: "w-full max-w-lg rounded-2xl bg-surface-primary p-6 shadow-xl",
      children: [jsx.jsxs("header", { className: "mb-4 flex justify-between gap-4", children: [jsx.jsx("h2", { className: "text-lg font-semibold", children: title }), jsx.jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, children: "×" })] }), children],
    }),
  });
}

function ComputerHistorySettingsPage(): unknown {
  initializeChronicleSettingsPage();
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal) as ToastManager;
  const service = serviceRegistry?.chronicle ?? null;
  const [state, setState] = React.useState<ChronicleState | null>(null);
  const [settings, setSettings] = React.useState<ChronicleSettings | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(service != null);
  const [historyError, setHistoryError] = React.useState(false);
  const [serviceError, setServiceError] = React.useState(false);
  const [pending, setPending] = React.useState<"clear" | "settings" | "state" | null>(null);
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [permissionsOpen, setPermissionsOpen] = React.useState(false);
  const [enableAfterPermissions, setEnableAfterPermissions] = React.useState(false);
  const [clearRequest, setClearRequest] = React.useState<ClearRequest>(null);

  const load = async (): Promise<void> => {
    if (service == null) return;
    setLoading(true);
    setServiceError(false);
    setHistoryError(false);
    try {
      const [nextState, nextSettings, nextHistory] = await Promise.all([service.getState(), service.getSettings(), service.listHistory()]);
      setState(nextState);
      setSettings(nextSettings);
      setHistory(normalizeHistory(nextHistory));
    } catch {
      setServiceError(true);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => { void load(); }, [service]);

  const refreshHistory = async (): Promise<void> => {
    if (service == null) return;
    setHistoryError(false);
    try {
      setHistory(normalizeHistory(await service.listHistory()));
    } catch {
      setHistoryError(true);
    }
  };
  const setEnabled = async (enabled: boolean): Promise<void> => {
    if (service == null || pending != null) return;
    setPending("state");
    try {
      const next = await service.setEnabled(enabled);
      setState(next);
      if (enabled && !next.enabled) toast.warning?.("Computer history wasn’t turned on because required permissions weren’t granted");
    } catch {
      toast.danger(enabled ? "Computer history could not be turned on. Restart ChatGPT, and try again" : "Computer history could not be turned off", { errorAnalytics: { toastId: "settings.chronicle.toggleErrorToast" } });
    } finally {
      setPending(null);
    }
  };
  const pauseOrResume = async (): Promise<void> => {
    if (service == null || state == null || pending != null) return;
    setPending("state");
    try {
      setState(state.recorderState === "paused" ? await service.resume() : await service.pause());
    } catch {
      toast.danger("Computer history could not be paused or resumed", { errorAnalytics: { toastId: "settings.chronicle.pauseResumeErrorToast" } });
    } finally {
      setPending(null);
    }
  };
  const retryActivation = async (): Promise<void> => {
    if (service == null || pending != null) return;
    setPending("state");
    try {
      setState(await service.retryActivation());
    } catch {
      toast.danger("Computer history could not be resumed", { errorAnalytics: { toastId: "settings.chronicle.retryActivationErrorToast" } });
    } finally {
      setPending(null);
    }
  };
  const toggleIndicator = async (checked: boolean): Promise<void> => {
    if (service == null || settings == null || pending != null) return;
    setPending("settings");
    const next = { ...settings, showMenuBarIndicator: checked };
    try {
      setSettings(await service.updateSettings(next));
    } catch {
      toast.danger("Computer history indicator visibility could not be updated", { errorAnalytics: { toastId: "settings.chronicle.showIndicatorInMenuBarError" } });
    } finally {
      setPending(null);
    }
  };
  const clearHistory = async (event: { preventDefault(): void }): Promise<void> => {
    event.preventDefault();
    if (service == null || clearRequest == null || pending != null) return;
    setPending("clear");
    try {
      await service.clearHistory(clearRequest.scope, clearRequest.interval);
      await refreshHistory();
      toast.success("History cleared — ChatGPT memory may take up to 6 hours to update");
      setClearRequest(null);
    } catch {
      toast.danger("Computer history could not be cleared", { errorAnalytics: { toastId: "settings.chronicle.history.clearErrorToast" } });
    } finally {
      setPending(null);
    }
  };

  if (service == null) return jsx.jsxs("section", { className: "p-5", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Computer history" }), jsx.jsx("p", { className: "mt-3 text-secondary", role: "alert", children: "Computer history isn’t available. Restart ChatGPT and try again." })] });
  if (loading) return jsx.jsxs("section", { className: "p-5", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Computer history" }), jsx.jsx("p", { className: "mt-3 text-secondary", role: "status", children: "Loading your settings…" })] });
  if (serviceError || state == null) return jsx.jsxs("section", { className: "p-5", role: "alert", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Computer history" }), jsx.jsx("p", { className: "mt-3", children: "Your settings couldn’t be loaded. Restart ChatGPT and try again." }), jsx.jsx(Button, { onClick: () => { void load(); }, children: "Try again" })] });

  const needsActivation = state.activationState === "failed" || state.activationState === "waiting_for_permissions" || (state.activationState === "idle" && state.recorderState === "stopped");
  const statusLabel = state.activationState === "failed" ? "Computer history is temporarily unavailable." : state.recorderState === "paused" ? "Paused" : state.recorderState === "running" ? "Recording" : state.enabled ? "Finishing setup" : "Off";

  return jsx.jsxs("main", {
    className: "flex h-full min-h-0 flex-col",
    "data-settings-page": "chronicle",
    children: [
      jsx.jsx("header", { className: "border-b px-5 py-4", children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Computer history" }) }),
      jsx.jsxs("div", {
        className: "flex-1 space-y-6 overflow-auto p-5",
        children: [
          jsx.jsxs("section", {
            className: "rounded-xl border p-5",
            children: [
              jsx.jsxs("div", { className: "flex items-start justify-between gap-4", children: [jsx.jsxs("div", { children: [jsx.jsx("h2", { className: "font-semibold", children: "Computer history" }), jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: statusLabel })] }), jsx.jsx("button", { type: "button", role: "switch", "aria-label": state.enabled ? "Turn off Computer history" : "Turn on Computer history", "aria-checked": state.enabled, disabled: pending != null, onClick: () => state.enabled ? void setEnabled(false) : setConsentOpen(true), children: state.enabled ? "On" : "Off" })] }),
              state.enabled ? jsx.jsxs("div", { className: "mt-5 grid gap-3 border-t pt-5", children: [needsActivation ? jsx.jsx(Button, { disabled: pending != null, onClick: () => { void retryActivation(); }, children: state.activationState === "waiting_for_permissions" ? "Finish setup" : "Try again" }) : state.recorderState === "running" || state.recorderState === "paused" ? jsx.jsx(Button, { disabled: pending != null, onClick: () => { void pauseOrResume(); }, children: state.recorderState === "paused" ? "Resume" : "Pause" }) : null, jsx.jsxs("label", { className: "flex items-center justify-between gap-4", children: [jsx.jsx("span", { children: "Show indicator in menu bar" }), jsx.jsx("input", { type: "checkbox", checked: settings?.showMenuBarIndicator !== false, disabled: pending != null, onChange: (event: { target: { checked: boolean } }) => { void toggleIndicator(event.target.checked); } })] }), jsx.jsxs("div", { className: "flex items-center justify-between gap-4", children: [jsx.jsxs("div", { children: [jsx.jsx("p", { className: "font-medium", children: "Apps and websites" }), jsx.jsx("p", { className: "text-sm text-secondary", children: "Choose which apps and websites are included." })] }), jsx.jsx(Button, { disabled: state.activationState === "failed", onClick: () => setPermissionsOpen(true), children: settings?.applications?.length ? String(settings.applications.length) + " selected" : "Choose" })] })] }) : jsx.jsxs("div", { className: "mt-5 space-y-4 border-t pt-5", children: [jsx.jsx("p", { children: "ChatGPT can record text summaries of your computer activity so you can ask what you were working on." }), jsx.jsx(Button, { testId: "chronicle-turn-on", onClick: () => setConsentOpen(true), children: "Turn on" })] }),
            ],
          }),
          state.enabled ? jsx.jsxs("section", {
            className: "rounded-xl border",
            children: [
              jsx.jsxs("header", { className: "flex items-center justify-between gap-4 border-b p-5", children: [jsx.jsxs("div", { children: [jsx.jsx("h2", { className: "font-semibold", children: "History" }), jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: "ChatGPT records text summaries of your computer activity." })] }), history.length > 0 ? jsx.jsx(Button, { disabled: state.activationState === "failed", onClick: () => setClearRequest({ scope: "all" }), children: "Clear history" }) : null] }),
              historyError ? jsx.jsxs("div", { className: "p-8 text-center", role: "alert", children: [jsx.jsx("p", { children: "Computer history could not be loaded" }), jsx.jsx(Button, { onClick: () => { void refreshHistory(); }, children: "Try again" })] }) : history.length === 0 ? jsx.jsx("p", { className: "p-8 text-center text-secondary", children: "No computer history yet" }) : jsx.jsx("div", { className: "divide-y", children: history.map((item, index) => jsx.jsxs("article", { className: "grid grid-cols-[auto_1fr_auto] gap-3 p-5", children: [jsx.jsx(ColorIcon, { name: item.application?.name ?? "computer" }), jsx.jsxs("div", { className: "min-w-0", children: [jsx.jsx("h3", { className: "font-medium", children: itemTitle(item, index) }), item.summary ? jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: item.summary }) : null, jsx.jsx("time", { className: "mt-1 block text-xs text-secondary", children: itemTime(item) })] }), jsx.jsx(Button, { danger: true, disabled: pending != null, testId: "chronicle-delete-item", onClick: () => setClearRequest({ scope: "interval", interval: item.interval }), children: "Delete" })] }, item.id ?? String(index))) }),
            ],
          }) : null,
        ],
      }),
      consentOpen ? jsx.jsx(Modal, { title: "You're in control.", onClose: () => setConsentOpen(false), children: jsx.jsxs("div", { className: "space-y-4", children: [jsx.jsx("p", { children: "You can pause or clear your history and manage which apps are included at any time." }), jsx.jsx("p", { className: "text-sm text-secondary", children: "Pause Computer history during communications with others unless you have their prior consent." }), jsx.jsxs("div", { className: "flex flex-wrap justify-end gap-3", children: [jsx.jsx(Button, { onClick: () => setConsentOpen(false), children: "Cancel" }), jsx.jsx(Button, { testId: "chronicle-customize-apps", onClick: () => { setConsentOpen(false); setEnableAfterPermissions(true); setPermissionsOpen(true); }, children: "Customize apps" }), jsx.jsx(Button, { testId: "chronicle-allow-all-apps", onClick: () => { setConsentOpen(false); void setEnabled(true); }, children: "Allow all apps" })] })] }) }) : null,
      jsx.jsx(ChroniclePermissionsDialog, { open: permissionsOpen, onOpenChange: (open: boolean) => { setPermissionsOpen(open); if (!open) setEnableAfterPermissions(false); }, onSaved: () => { setPermissionsOpen(false); if (enableAfterPermissions) void setEnabled(true); setEnableAfterPermissions(false); } }),
      clearRequest != null ? jsx.jsx(Modal, { title: clearRequest.scope === "interval" ? "Delete this history item?" : "Clear all history?", onClose: () => setClearRequest(null), children: jsx.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { void clearHistory(event); }, className: "space-y-4", children: [jsx.jsx("p", { children: "Your actions and memories created from them will be deleted. This cannot be undone." }), jsx.jsxs("div", { className: "flex justify-end gap-3", children: [jsx.jsx(Button, { disabled: pending != null, onClick: () => setClearRequest(null), children: "Cancel" }), jsx.jsx(Button, { type: "submit", danger: true, disabled: pending != null, testId: "chronicle-confirm-clear", children: pending === "clear" ? "Clearing..." : clearRequest.scope === "interval" ? "Delete" : "Clear" })] })] }) }) : null,
    ],
  });
}

let initialized = false;
function initializeChronicleSettingsPage(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeScopeRuntime();
  initializeSettingsRuntime();
  initializeSettingsPage();
  initializeColorIcon();
  initializeSuggestionPrompt();
  initializeComputerHistoryQuery();
  initializeChronicleServiceQueries();
  initializePermissionsDialog();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeChronicleSettingsPage();
export { ComputerHistorySettingsPage };
