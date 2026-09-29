import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as legacyStudyHoursScheduleChunk from "@rchunk/legacy-study-hours-schedule";
import * as settingsUnsavedChangesDialogChunk from "@rchunk/settings-unsaved-changes-dialog";

const {
  $3: initializeRuntimeLazy,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = appSharedChunk;

type ScheduleKind = "quiet" | "study";
type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface ScheduleBlock {
  days: Weekday[];
  end_time: string;
  id: string;
  start_time: string;
}

interface RecurringSchedule {
  blocks: ScheduleBlock[];
  enabled: boolean;
}

type ScheduleAction =
  | { type: "add_block"; block: ScheduleBlock }
  | { type: "remove_block"; blockId: string }
  | { type: "set_enabled"; enabled: boolean; initialBlock?: ScheduleBlock }
  | { type: "update_block"; blockId: string; update: Partial<ScheduleBlock> };

interface ScheduleState {
  managedByParent?: boolean;
  schedule: RecurringSchedule;
  status: "loaded" | "unsupported";
}

interface SafetySettingsData {
  eligibleNowOrBefore?: boolean;
  quietHours: ScheduleState;
  studyHours: ScheduleState;
}

interface SafetySettingsQuery {
  data?: SafetySettingsData;
  isError: boolean;
  isFetching?: boolean;
  isLoading: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface SafetyAccess {
  accountId?: string;
  status: "allowed" | "denied" | "error" | "loading";
  userId?: string;
}

interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
}

const appRuntime = appInitialChunk as unknown as {
  Xl: () => void;
  bL: import("@rchunk/app-shared").ReadableSignal<SafetyAccess>;
  bqt: import("@rchunk/app-shared").ReadableSignal<SafetySettingsQuery>;
  rJt: {
    safePatch(path: string, options: {
      additionalHeaders: Record<string, string>;
      parameters: { query: { feature: string; value: string } };
    }): Promise<unknown>;
  };
  su: () => void;
};
const {
  Xl: initializeSettingsPage,
  bL: safetyAccessSignal,
  bqt: safetySettingsSignal,
  rJt: settingsApi,
  su: initializeSettingsRuntime,
} = appRuntime;

const legacyRuntime = legacyStudyHoursScheduleChunk as unknown as {
  n: () => RecurringSchedule;
  r: () => void;
  t: (schedule: RecurringSchedule, action: ScheduleAction) => RecurringSchedule;
};
const {
  n: createLegacyStudySchedule,
  r: initializeLegacySchedule,
  t: reduceSchedule,
} = legacyRuntime;
const {
  n: initializeSettingsLoadingRow,
  t: SettingsLoadingRow,
} = settingsLoadingRowChunk;
const {
  n: initializeUnsavedChangesDialog,
  t: SettingsUnsavedChangesDialog,
} = settingsUnsavedChangesDialogChunk;

const WEEKDAYS: readonly Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function cloneSchedule(schedule: RecurringSchedule): RecurringSchedule {
  return { enabled: schedule.enabled, blocks: schedule.blocks.map((block) => ({ ...block, days: [...block.days] })) };
}

function createBlock(kind: ScheduleKind, days: Weekday[] = WEEKDAYS.slice(0, 5)): ScheduleBlock {
  return {
    id: crypto.randomUUID(),
    days,
    start_time: kind === "quiet" ? "22:00" : "16:00",
    end_time: kind === "quiet" ? "07:00" : "20:00",
  };
}

function scheduleError(schedule: RecurringSchedule): "invalid" | "limit" | null {
  if (!schedule.enabled) return null;
  if (schedule.blocks.length > 12) return "limit";
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
  return schedule.blocks.some((block) => block.days.length === 0
    || !validTime.test(block.start_time)
    || !validTime.test(block.end_time)
    || block.start_time === block.end_time)
    ? "invalid"
    : null;
}

function schedulesEqual(left: RecurringSchedule, right: RecurringSchedule): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function Toggle({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: string; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", {
    type: "button",
    role: "switch",
    "aria-label": label,
    "aria-checked": checked,
    disabled,
    onClick: () => onChange(!checked),
    children: checked ? "On" : "Off",
  });
}

function ScheduleEditor({
  accountId,
  initialState,
  kind,
  onClose,
}: {
  accountId: string;
  initialState: ScheduleState;
  kind: ScheduleKind;
  onClose(): void;
}): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const [saved, setSaved] = React.useState(() => cloneSchedule(initialState.schedule));
  const [draft, setDraft] = React.useState(() => cloneSchedule(initialState.schedule));
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);
  const validation = scheduleError(draft);
  const dirty = !schedulesEqual(saved, draft);
  const disabled = saving || initialState.managedByParent === true || initialState.status === "unsupported";
  const title = kind === "quiet" ? "Quiet hours" : "Study hours";

  const apply = (action: ScheduleAction): void => {
    setDraft(reduceSchedule(draft, action));
    setSaveError(false);
  };

  const back = (): void => {
    if (dirty) {
      setPendingNavigation(() => onClose);
      return;
    }
    onClose();
  };

  const save = async (event: { preventDefault(): void }): Promise<void> => {
    event.preventDefault();
    if (!dirty || validation != null || disabled) return;
    setSaving(true);
    setSaveError(false);
    try {
      await settingsApi.safePatch("/settings/account_user_setting", {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        parameters: {
          query: {
            feature: kind === "quiet" ? "quiet_hours_schedule" : "study_hours_schedule",
            value: JSON.stringify(draft),
          },
        },
      });
      setSaved(cloneSchedule(draft));
      (scope.get(toastManagerSignal) as ToastManager).success(String(intl.formatMessage({
        id: "settings.chatGpt.timeManagement.schedule.saved",
        defaultMessage: title + " saved",
      })));
    } catch {
      setSaveError(true);
      (scope.get(toastManagerSignal) as ToastManager).danger(String(intl.formatMessage({
        id: "settings.chatGpt.timeManagement.schedule.saveError",
        defaultMessage: "Couldn’t save schedule. Try again.",
      })), { errorAnalytics: { toastId: "settings.chatGpt.timeManagement.schedule.saveError" } });
    } finally {
      setSaving(false);
    }
  };

  const warning = initialState.status === "unsupported"
    ? "This schedule can’t be edited here. Your existing settings have been preserved."
    : initialState.managedByParent
      ? "This setting is managed by your parent"
      : validation === "limit"
        ? "Use no more than twelve blocks"
        : validation === "invalid"
          ? "Select at least one day per block and different start and end times"
          : saveError
            ? "Couldn’t confirm the updated schedule. Try again."
            : null;

  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsxs("div", {
        className: "flex h-full min-h-0 flex-col",
        children: [
          jsx.jsxs("header", {
            className: "flex items-center justify-between border-b border-token-border-light px-5 py-4",
            children: [jsx.jsxs("div", { children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: title }), jsx.jsx("p", { className: "mt-1 text-sm text-secondary", children: kind === "quiet" ? "Schedule hours when ChatGPT can’t be used" : "Have ChatGPT ask questions and give hints before answering questions." })] }), jsx.jsx("button", { type: "button", onClick: back, disabled: saving, children: "Back" })],
          }),
          jsx.jsx("main", {
            className: "flex-1 overflow-auto p-5",
            children: jsx.jsx("form", {
              onSubmit: (event: { preventDefault(): void }) => void save(event),
              children: jsx.jsxs("section", {
                className: "mx-auto grid max-w-3xl gap-4 rounded-xl border border-token-border-light p-4",
                children: [
                  jsx.jsxs("div", { className: "flex items-center justify-between", children: [jsx.jsx("span", { className: "font-medium", children: "Scheduled" }), jsx.jsx(Toggle, { checked: draft.enabled, disabled, label: "Scheduled", onChange: (enabled) => apply({ type: "set_enabled", enabled, initialBlock: enabled && draft.blocks.length === 0 ? createBlock(kind) : undefined }) })] }),
                  draft.enabled ? draft.blocks.map((block, index) => jsx.jsxs("fieldset", {
                    className: "grid gap-3 rounded-lg border border-token-border-light p-3",
                    disabled,
                    "aria-label": "Schedule block " + (index + 1),
                    children: [
                      jsx.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                        jsx.jsxs("label", { children: [jsx.jsx("span", { children: "Start time" }), jsx.jsx("input", { type: "time", value: block.start_time, disabled, onChange: (event: { currentTarget: { value: string } }) => apply({ type: "update_block", blockId: block.id, update: { start_time: event.currentTarget.value } }) })] }),
                        jsx.jsxs("label", { children: [jsx.jsx("span", { children: "End time" }), jsx.jsx("input", { type: "time", value: block.end_time, disabled, onChange: (event: { currentTarget: { value: string } }) => apply({ type: "update_block", blockId: block.id, update: { end_time: event.currentTarget.value } }) })] }),
                      ] }),
                      jsx.jsx("div", { className: "flex flex-wrap gap-1", children: WEEKDAYS.map((day) => jsx.jsx("button", { type: "button", disabled, "aria-pressed": block.days.includes(day), onClick: () => apply({ type: "update_block", blockId: block.id, update: { days: block.days.includes(day) ? block.days.filter((value) => value !== day) : WEEKDAYS.filter((value) => value === day || block.days.includes(value)) } }), children: WEEKDAY_LABELS[day] }, day)) }),
                      draft.blocks.length > 1 ? jsx.jsx("button", { type: "button", disabled, onClick: () => apply({ type: "remove_block", blockId: block.id }), children: "Delete block" }) : null,
                    ],
                  }, block.id)) : null,
                  draft.enabled ? jsx.jsx("button", { type: "button", disabled: disabled || draft.blocks.length >= 12, onClick: () => apply({ type: "add_block", block: createBlock(kind, draft.blocks[0]?.days) }), children: "Add a new block" }) : null,
                  warning == null ? null : jsx.jsx("p", { role: "alert", children: warning }),
                  jsx.jsxs("footer", { className: "flex justify-end gap-2", children: [jsx.jsx("button", { type: "button", disabled: saving, onClick: onClose, children: "Cancel" }), jsx.jsx("button", { type: "submit", disabled: disabled || !dirty || validation != null, "aria-busy": saving, children: saving ? "Saving…" : "Save" })] }),
                ],
              }),
            }),
          }),
        ],
      }),
      jsx.jsx(SettingsUnsavedChangesDialog, {
        pendingNavigation,
        onClearPendingNavigation: () => setPendingNavigation(null),
      }),
    ],
  });
}

function ChatGptSafetySettings(): unknown {
  const access = useSignalValue(safetyAccessSignal);
  const query = useSignalValue(safetySettingsSignal);
  const [view, setView] = React.useState<"overview" | ScheduleKind>("overview");

  if (access.status === "denied") {
    return jsx.jsx("div", { className: "p-5", children: "Time management isn’t available for this account" });
  }
  if (access.status !== "allowed" || query.isLoading) {
    return jsx.jsx(SettingsLoadingRow, { children: "Loading schedule settings…" });
  }
  if (query.isError || query.data == null) {
    return jsx.jsxs("div", { className: "p-5", role: "alert", children: [jsx.jsx("span", { children: "Couldn’t load schedule settings" }), jsx.jsx("button", { type: "button", disabled: query.isFetching, onClick: () => void query.refetch(), children: "Retry" })] });
  }
  if (query.data.eligibleNowOrBefore !== true || access.accountId == null) {
    return jsx.jsx("div", { className: "p-5", children: "Time management isn’t available for this account" });
  }
  if (view !== "overview") {
    return jsx.jsx(ScheduleEditor, {
      accountId: access.accountId,
      initialState: view === "quiet" ? query.data.quietHours : query.data.studyHours,
      kind: view,
      onClose: () => setView("overview"),
    });
  }

  const scheduleRow = (kind: ScheduleKind, state: ScheduleState): unknown => jsx.jsxs("button", {
    type: "button",
    className: "flex w-full items-center justify-between gap-4 border-b border-token-border-light px-4 py-4 text-left last:border-b-0",
    disabled: state.status === "unsupported",
    onClick: () => setView(kind),
    children: [
      jsx.jsxs("span", { children: [jsx.jsx("span", { className: "block font-medium", children: kind === "quiet" ? "Quiet hours" : "Study hours" }), jsx.jsx("span", { className: "mt-1 block text-sm text-secondary", children: kind === "quiet" ? "Schedule hours when ChatGPT can’t be used" : "Ask questions and give hints before answering" })] }),
      jsx.jsx("span", { children: state.status === "unsupported" ? "Unsupported schedule" : state.schedule.enabled ? "Scheduled" : "Not scheduled" }),
    ],
  });

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col",
    children: [
      jsx.jsx("header", { className: "border-b border-token-border-light px-5 py-4", children: jsx.jsx("h1", { className: "text-lg font-semibold", children: "Safety and wellbeing" }) }),
      jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: jsx.jsxs("section", { className: "mx-auto max-w-3xl overflow-hidden rounded-xl border border-token-border-light", children: [scheduleRow("quiet", query.data.quietHours), scheduleRow("study", query.data.studyHours)] }) }),
    ],
  });
}

let initialized = false;
function initializeSafetySettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSettingsPage();
  initializeSettingsRuntime();
  initializeSettingsLoadingRow();
  initializeLegacySchedule();
  initializeUnsavedChangesDialog();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeSafetySettings();
export { ChatGptSafetySettings };
