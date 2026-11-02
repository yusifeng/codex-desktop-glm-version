import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import {
  c as ScheduleModeSelect,
  i as FrequencySection,
  n as DateInput,
  o as WeekdayPicker,
  u as TimePicker,
} from "@rchunk/automation-frequency-section";
import "@rchunk/chatgpt-tasks-runtime";
import { a as getTimePeriod, c as initializeScheduleDraft, l as switchScheduleMode, n as automationToDraft, r as draftToUpdateRequest, t as TIME_PRESETS, type AutomationDraft, type AutomationRecord, type ScheduleMode, type Weekday } from "@rchunk/schedule-draft";

export interface AutomationItem { automation: AutomationRecord & { canManage?: boolean; conversation_id?: string | null; conversation_origin?: string | null; source_conversation_id?: string | null; initial_conversation_id?: string | null; status?: string } ; teamId?: string | null }
export interface AutomationSuggestion { suggested_automation_type?: string; system_hint?: string | null; user_message: string }
export interface AutomationModel { slug: string; thinkingEffort?: string | null; versionId?: string }
export interface AutomationOperationScope {
  accountId?: string | null;
  getDefaultModel?(origin?: string): AutomationModel;
  logEvent?(event: Record<string, unknown>): void;
  markConversationRead?(conversationId: string): Promise<void> | void;
  navigate?(location: { pathname: string; search?: string }, options?: { state?: unknown }): void;
  runAutomation?(input: { automationId: string; conversationId: string; model: AutomationModel; prompt: string; signal: AbortSignal }): Promise<{ conversationId?: string; serverConversationId?: string } | null>;
  startSuggestion?(input: { conversationId: string; forceUseSearch?: boolean; model: AutomationModel; prompt: string; signal: AbortSignal; suggestedAutomationType?: string; systemHints: string[] }): Promise<{ conversationId?: string; serverConversationId?: string } | null>;
  subscribeAccount?(listener: (accountId: string | null | undefined) => void): () => void;
  updateAutomation?(automationId: string, request: ReturnType<typeof draftToUpdateRequest>, signal: AbortSignal): Promise<AutomationRecord>;
}
export interface ScheduleFieldsProps { automation: AutomationRecord; draft: AutomationDraft; onChange(draft: AutomationDraft): void; sharedPreview?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

interface CustomRule {
  frequency: "daily" | "monthly" | "weekly";
  interval: number;
  monthDays: number[];
  time: string;
  weekdays: Weekday[];
}

const WEEKDAYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const REPEAT_OPTIONS: Array<{ id: ScheduleMode; label: string }> = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "custom", label: "Custom" },
];
const PERIOD_OPTIONS = Object.entries(TIME_PRESETS).map(([id, time]) => ({ id, label: `${id[0].toUpperCase()}${id.slice(1)} (${time})` }));

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function parseRule(rule: string): Map<string, string> {
  const result = new Map<string, string>();
  const value = rule.replace(/^RRULE:/i, "").trim();
  for (const field of value.split(";")) {
    const separator = field.indexOf("=");
    if (separator > 0) result.set(field.slice(0, separator).toUpperCase(), field.slice(separator + 1));
  }
  return result;
}

function parseCustomRule(rule: string): CustomRule | null {
  const fields = parseRule(rule);
  const rawFrequency = fields.get("FREQ")?.toLowerCase();
  if (rawFrequency !== "daily" && rawFrequency !== "weekly" && rawFrequency !== "monthly") return null;
  const hour = clampInteger(Number(fields.get("BYHOUR") ?? 9), 0, 23);
  const minute = clampInteger(Number(fields.get("BYMINUTE") ?? 0), 0, 59);
  const weekdays = (fields.get("BYDAY") ?? "MO").split(",").filter((day): day is Weekday => WEEKDAYS.includes(day as Weekday));
  const monthDays = (fields.get("BYMONTHDAY") ?? "1").split(",").map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);
  return {
    frequency: rawFrequency,
    interval: clampInteger(Number(fields.get("INTERVAL") ?? 1), 1, 99),
    monthDays: monthDays.length === 0 ? [1] : monthDays,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    weekdays: weekdays.length === 0 ? ["MO"] : WEEKDAYS.filter((day) => weekdays.includes(day)),
  };
}

function serializeCustomRule(rule: CustomRule): string {
  const [hour, minute] = rule.time.split(":").map(Number);
  const fields = [`FREQ=${rule.frequency.toUpperCase()}`, `INTERVAL=${rule.interval}`];
  if (rule.frequency === "weekly") fields.push(`BYDAY=${rule.weekdays.join(",")}`);
  if (rule.frequency === "monthly") fields.push(`BYMONTHDAY=${rule.monthDays.join(",")}`);
  fields.push(`BYHOUR=${hour}`, `BYMINUTE=${minute}`);
  return fields.join(";");
}

function dateAfterMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function ScheduleRow({ control, label }: { control: unknown; label: unknown }): unknown {
  return jsx().jsxs("div", { className: "flex min-h-8 items-center justify-between gap-4", children: [jsx().jsx("span", { className: "text-tertiary", children: label }), control] });
}

function trackTaskOpened(scope: AutomationOperationScope, { item, destination, source }: { item: AutomationItem; destination: "conversation" | "editor"; source: "editor" | "scheduled_page" }): void { scope.logEvent?.({ type: "task_opened", taskId: item.automation.id, conversationId: destination === "conversation" ? item.automation.conversation_id ?? undefined : undefined, destination, source }); }
function trackScheduledPageViewed(scope: AutomationOperationScope): void { scope.logEvent?.({ type: "scheduled_page_viewed", destination: "scheduled_page" }); }
function initializeTaskAnalytics(): void {}
function selectAutomationModel(policy: { preferredModel?: AutomationModel; versionOptions?: Array<{ id?: string; model?: AutomationModel }> } | null | undefined, origin?: string): AutomationModel | undefined { return origin !== "tpp" && policy?.preferredModel != null ? policy.preferredModel : policy?.versionOptions?.[0]?.model; }
function initializeModelSelection(): void {}
function sourceConversationId({ automation }: AutomationItem): string | null { return automation.source_conversation_id ?? automation.initial_conversation_id ?? automation.conversation_id ?? null; }
async function markAutomationRead(scope: AutomationOperationScope, item: AutomationItem): Promise<void> { const id = sourceConversationId(item); if (id != null) await scope.markConversationRead?.(id); }
function initializeSourceConversation(): void {}
function openAutomationConversation(scope: AutomationOperationScope, item: AutomationItem, navigate: AutomationOperationScope["navigate"] = scope.navigate, options?: { source?: "editor" | "scheduled_page"; state?: unknown }): void { const conversationId = item.automation.conversation_id; if (conversationId == null) return; void markAutomationRead(scope, item); trackTaskOpened(scope, { item, destination: "conversation", source: options?.source ?? "editor" }); navigate?.({ pathname: `/c/${conversationId}`, search: new URLSearchParams({ automationId: item.automation.id, messageId: "finalAgentTurnStart" }).toString() }, { state: options?.state }); }

function accountBoundAbort(scope: AutomationOperationScope, externalSignal: AbortSignal): { signal: AbortSignal; dispose(): void } {
  externalSignal.throwIfAborted();
  if (scope.accountId == null) throw new DOMException("The account is no longer active", "AbortError");
  const initialAccountId = scope.accountId, controller = new AbortController();
  const abort = () => controller.abort(new DOMException("The task operation was cancelled", "AbortError"));
  externalSignal.addEventListener("abort", abort, { once: true });
  const unsubscribe = scope.subscribeAccount?.((accountId) => { if (accountId !== initialAccountId) abort(); }) ?? (() => {});
  return { signal: controller.signal, dispose() { externalSignal.removeEventListener("abort", abort); unsubscribe(); } };
}
function normalizeSystemHint(value?: string | null): string | undefined { if (value == null) return undefined; if (value === "image") return "picture_v2"; if (value === "think") return "reason"; if (value === "study") return "tatertot"; return value; }
async function startSuggestedAutomation(scope: AutomationOperationScope, { conversationId, conversationOrigin, suggestion, signal }: { conversationId: string; conversationOrigin?: string; suggestion: AutomationSuggestion; signal: AbortSignal }): Promise<string> {
  const operation = accountBoundAbort(scope, signal);
  try { const model = scope.getDefaultModel?.(conversationOrigin) ?? { slug: "auto" }; const hint = normalizeSystemHint(suggestion.system_hint); const result = await scope.startSuggestion?.({ conversationId, forceUseSearch: hint === "search" || undefined, model, prompt: suggestion.user_message, signal: operation.signal, suggestedAutomationType: suggestion.suggested_automation_type, systemHints: hint == null || hint === "search" ? [] : [hint] }); operation.signal.throwIfAborted(); const id = result?.serverConversationId ?? result?.conversationId; if (id == null) throw Error("The suggested task did not start"); return id; } finally { operation.dispose(); }
}
async function runAutomationNow(scope: AutomationOperationScope, { automation, conversationId, conversationOrigin, signal }: { automation: AutomationItem["automation"]; conversationId: string; conversationOrigin?: string; signal: AbortSignal }): Promise<string> {
  if (automation.canManage === false || automation.status === "completed") throw Error("This task cannot run now");
  const operation = accountBoundAbort(scope, signal);
  try { const model = scope.getDefaultModel?.(conversationOrigin) ?? { slug: "auto" }; const result = await scope.runAutomation?.({ automationId: automation.id, conversationId, model, prompt: automation.prompt, signal: operation.signal }); operation.signal.throwIfAborted(); const id = result?.serverConversationId ?? result?.conversationId; if (id == null) throw Error("The task did not start"); return id; } finally { operation.dispose(); }
}
async function saveAutomation(scope: AutomationOperationScope, { automation, draft, signal }: { automation: AutomationRecord & { canManage?: boolean; status?: string }; draft: AutomationDraft; signal: AbortSignal }): Promise<AutomationRecord> { if (automation.canManage === false || automation.status === "completed") throw Error("This task cannot be edited"); const operation = accountBoundAbort(scope, signal); try { if (scope.updateAutomation == null) throw Error("Automation update is unavailable"); const result = await scope.updateAutomation(automation.id, draftToUpdateRequest(automation, draft), operation.signal); operation.signal.throwIfAborted(); return result; } finally { operation.dispose(); } }

function ScheduleFields({ automation, draft, onChange, sharedPreview = false }: ScheduleFieldsProps): unknown {
  const view = jsx();
  const config = draft.scheduleConfig;
  const updateConfig = (next: typeof config): void => onChange({ ...draft, scheduleConfig: next, scheduleDirty: true, rawRrule: null });
  const update = (patch: Partial<typeof config>): void => updateConfig({ ...config, ...patch });
  const conditionWatch = automation.timing_mode === "condition_watch";
  const selectedOption = REPEAT_OPTIONS.find((option) => option.id === config.mode) ?? REPEAT_OPTIONS[0];
  const selectedPeriod = getTimePeriod(config.time);
  const customRule = config.mode === "custom" ? parseCustomRule(config.customRrule) : null;
  const now = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const rows: unknown[] = [];

  if (conditionWatch) {
    rows.push(view.jsx(ScheduleRow, {
      label: "Repeat",
      control: view.jsx("span", { children: automation.schedule_components.frequency === "custom" ? "Custom" : automation.schedule_components.frequency }),
    }, "condition-repeat"));
  } else {
    if (config.oneTimeDate == null) {
      rows.push(view.jsx(ScheduleRow, {
        label: "Repeat",
        control: view.jsx(ScheduleModeSelect, {
          ariaLabel: "Frequency",
          options: REPEAT_OPTIONS,
          selectedId: config.mode,
          selectedLabel: selectedOption.label,
          onSelect: (mode: string) => mode !== config.mode && updateConfig(switchScheduleMode(automation, config, mode as ScheduleMode)),
        }),
      }, "repeat"));
    } else {
      rows.push(view.jsx(ScheduleRow, {
        label: "Date",
        control: view.jsx(DateInput, {
          ariaLabel: "Date",
          value: config.oneTimeDate,
          onChange: (oneTimeDate: string) => update({ oneTimeDate }),
        }),
      }, "once-date"));
    }

    if (config.oneTimeDate == null && config.mode === "hourly") {
      rows.push(view.jsx(ScheduleRow, {
        label: "Every",
        control: view.jsx("input", {
          "aria-label": "Interval hours",
          type: "number",
          min: 1,
          max: 23,
          value: config.intervalHours,
          onChange: (event: { currentTarget: { valueAsNumber: number } }) => update({ intervalHours: clampInteger(event.currentTarget.valueAsNumber, 1, 23), intervalMinutes: null }),
        }),
      }, "hourly"));
    }

    if (config.oneTimeDate == null && config.mode === "weekly") {
      rows.push(view.jsx(ScheduleRow, {
        label: "Days of the week",
        control: view.jsx(WeekdayPicker, { value: config.weekdays, onChange: (weekdays: Weekday[]) => update({ weekdays }) }),
      }, "weekdays"));
    }

    if (config.oneTimeDate == null && config.mode === "monthly") {
      rows.push(view.jsx(ScheduleRow, {
        label: "Day of month",
        control: view.jsx("input", {
          "aria-label": "Day of month",
          type: "number",
          min: 1,
          max: 31,
          value: config.monthDay,
          onChange: (event: { currentTarget: { valueAsNumber: number } }) => update({ monthDay: clampInteger(event.currentTarget.valueAsNumber, 1, 31) }),
        }),
      }, "month-day"));
    }

    if (config.oneTimeDate == null && customRule != null) {
      const updateCustom = (patch: Partial<CustomRule>) => update({ customRrule: serializeCustomRule({ ...customRule, ...patch }) });
      rows.push(view.jsx(ScheduleRow, {
        label: "Frequency",
        control: view.jsx(ScheduleModeSelect, {
          ariaLabel: "Custom frequency",
          options: REPEAT_OPTIONS.filter((option) => option.id === "daily" || option.id === "weekly" || option.id === "monthly"),
          selectedId: customRule.frequency,
          selectedLabel: customRule.frequency,
          onSelect: (frequency: string) => updateCustom({ frequency: frequency as CustomRule["frequency"], interval: 1 }),
        }),
      }, "custom-frequency"));
      if (customRule.frequency === "weekly") rows.push(view.jsx(ScheduleRow, { label: "Days of the week", control: view.jsx(WeekdayPicker, { value: customRule.weekdays, onChange: (weekdays: Weekday[]) => updateCustom({ weekdays }) }) }, "custom-weekdays"));
      if (customRule.frequency === "monthly") rows.push(view.jsx(ScheduleRow, { label: "Day of month", control: view.jsx("input", { "aria-label": "Custom day of month", type: "number", min: 1, max: 31, value: customRule.monthDays[0], onChange: (event: { currentTarget: { valueAsNumber: number } }) => updateCustom({ monthDays: [clampInteger(event.currentTarget.valueAsNumber, 1, 31)] }) }) }, "custom-month-day"));
      rows.push(view.jsx(ScheduleRow, { label: "Time", control: view.jsx(TimePicker, { value: customRule.time, onChange: (time: string) => updateCustom({ time }) }) }, "custom-time"));
    } else if (config.mode === "custom" && config.oneTimeDate == null) {
      rows.push(view.jsx(ScheduleRow, {
        label: "Rule",
        control: view.jsx("textarea", { "aria-label": "Custom RRULE", value: config.customRrule, onChange: (event: { currentTarget: { value: string } }) => update({ customRrule: event.currentTarget.value }) }),
      }, "custom-rule"));
    }

    const usesPeriod = config.oneTimeDate == null && ["daily", "weekdays", "weekly", "monthly"].includes(config.mode);
    if (usesPeriod) {
      rows.push(view.jsx(ScheduleRow, {
        label: "Time",
        control: view.jsx(ScheduleModeSelect, {
          ariaLabel: "Time",
          options: PERIOD_OPTIONS,
          selectedId: selectedPeriod,
          selectedLabel: PERIOD_OPTIONS.find((option) => option.id === selectedPeriod)?.label ?? selectedPeriod,
          onSelect: (period: string) => update({ time: TIME_PRESETS[period as keyof typeof TIME_PRESETS], oneTimeSeconds: 0 }),
        }),
      }, "period"));
    }
    if (config.oneTimeDate != null) {
      rows.push(view.jsx(ScheduleRow, {
        label: "Time",
        control: view.jsx(TimePicker, {
          value: config.time,
          isOptionVisible: (time: string) => `${config.oneTimeDate} ${time}` >= now,
          onChange: (time: string) => update({ time, oneTimeSeconds: 0 }),
        }),
      }, "once-time"));
    }

    if (config.oneTimeDate == null) {
      rows.push(view.jsx(ScheduleRow, {
        label: "End repeat",
        control: view.jsx(ScheduleModeSelect, {
          ariaLabel: "End repeat",
          options: [{ id: "never", label: "Never" }, { id: "on-date", label: "On date" }],
          selectedId: config.untilDate == null ? "never" : "on-date",
          selectedLabel: config.untilDate == null ? "Never" : "On date",
          onSelect: (value: string) => value === "never"
            ? update({ untilDate: undefined, untilTime: undefined })
            : config.untilDate == null && update({ untilDate: dateAfterMonths(1), untilTime: "23:59:59" }),
        }),
      }, "end-repeat"));
      if (config.untilDate != null) rows.push(view.jsx(ScheduleRow, {
        label: "Date",
        control: view.jsx(DateInput, { ariaLabel: "End repeat date", value: config.untilDate, onChange: (untilDate: string) => update({ untilDate, untilTime: "23:59:59" }) }),
      }, "end-date"));
    }
  }

  const content = view.jsx("fieldset", {
    className: "automation-schedule-fields flex flex-col gap-5",
    disabled: sharedPreview,
    "data-shared-preview": sharedPreview || undefined,
    children: rows,
  });
  return sharedPreview ? content : view.jsx(FrequencySection, { title: view.jsx("span", { className: "text-xs uppercase select-none", children: "Frequency" }), children: content });
}
function initializeScheduleOperations(): void { initializeScheduleDraft(); void getTimePeriod; void automationToDraft; void TIME_PRESETS; }
function initializeScheduleFields(): void { jsx(); initializeScheduleOperations(); }
export { openAutomationConversation as a, startSuggestedAutomation as c, markAutomationRead as d, selectAutomationModel as f, trackTaskOpened as g, trackScheduledPageViewed as h, initializeScheduleOperations as i, sourceConversationId as l, initializeTaskAnalytics as m, initializeScheduleFields as n, runAutomationNow as o, initializeModelSelection as p, accountBoundAbort as r, saveAutomation as s, ScheduleFields as t, initializeSourceConversation as u };
