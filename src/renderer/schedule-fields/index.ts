import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/automation-frequency-section";
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
  const view = jsx(), config = draft.scheduleConfig;
  const update = (patch: Partial<typeof config>) => onChange({ ...draft, scheduleConfig: { ...config, ...patch }, scheduleDirty: true, rawRrule: null });
  const modes: ScheduleMode[] = ["hourly", "daily", "weekdays", "weekly", "monthly", "custom"];
  return view.jsxs("fieldset", { className: "automation-schedule-fields", disabled: sharedPreview, children: [
    view.jsx("legend", { children: "Frequency" }),
    view.jsx("select", { "aria-label": "Frequency", value: config.mode, onChange: (event: { currentTarget: { value: string } }) => onChange({ ...draft, scheduleConfig: switchScheduleMode(automation, config, event.currentTarget.value as ScheduleMode), scheduleDirty: true, rawRrule: null }), children: modes.map((mode) => view.jsx("option", { value: mode, children: mode }, mode)) }),
    config.mode === "hourly" ? view.jsx("input", { "aria-label": "Interval hours", type: "number", min: 1, max: 23, value: config.intervalHours, onChange: (event: { currentTarget: { valueAsNumber: number } }) => update({ intervalHours: event.currentTarget.valueAsNumber }) }) : null,
    config.mode !== "hourly" ? view.jsx("input", { "aria-label": "Time", type: "time", value: config.time, onChange: (event: { currentTarget: { value: string } }) => update({ time: event.currentTarget.value }) }) : null,
    config.mode === "weekly" ? view.jsx("div", { children: (["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as Weekday[]).map((day) => view.jsx("label", { children: [view.jsx("input", { type: "checkbox", checked: config.weekdays.includes(day), onChange: () => update({ weekdays: config.weekdays.includes(day) ? config.weekdays.filter((value) => value !== day) : [...config.weekdays, day] }) }), day] }, day)) }) : null,
    config.mode === "monthly" ? view.jsx("input", { "aria-label": "Day of month", type: "number", min: 1, max: 31, value: config.monthDay, onChange: (event: { currentTarget: { valueAsNumber: number } }) => update({ monthDay: event.currentTarget.valueAsNumber }) }) : null,
    config.mode === "custom" ? view.jsx("textarea", { "aria-label": "Custom RRULE", value: config.customRrule, onChange: (event: { currentTarget: { value: string } }) => update({ customRrule: event.currentTarget.value }) }) : null,
    view.jsx("input", { "aria-label": "End repeat", type: "date", value: config.untilDate ?? "", onChange: (event: { currentTarget: { value: string } }) => update({ untilDate: event.currentTarget.value || undefined }) }),
  ] });
}
function initializeScheduleOperations(): void { initializeScheduleDraft(); void getTimePeriod; void automationToDraft; void TIME_PRESETS; }
function initializeScheduleFields(): void { jsx(); initializeScheduleOperations(); }
export { openAutomationConversation as a, startSuggestedAutomation as c, markAutomationRead as d, selectAutomationModel as f, trackTaskOpened as g, trackScheduledPageViewed as h, initializeScheduleOperations as i, sourceConversationId as l, initializeTaskAnalytics as m, initializeScheduleFields as n, runAutomationNow as o, initializeModelSelection as p, accountBoundAbort as r, saveAutomation as s, ScheduleFields as t, initializeSourceConversation as u };
