import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/appgen-automations-state";
import "@rchunk/automation-frequency-section";
import "@rchunk/automation-delete-confirmation-dialog";
import "@rchunk/schedule-fields";
import "@rchunk/schedule-draft";
import "@rchunk/share-analytics";
import "@rchunk/automation-share-dialog";
import "@rchunk/conversation-summary";
import "@rchunk/timestamps";
import "@rchunk/platform-ui-kit-provider";
import "@rchunk/navigation-blocker";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { i as draftValidationError, n as automationToDraft, s as isDraftDirty, type AutomationDraft, type AutomationRecord as ScheduleAutomationRecord } from "@rchunk/schedule-draft";
import { t as ScheduleFields } from "@rchunk/schedule-fields";

interface Action {
  disabled?: boolean;
  isPending?: boolean;
  label?: string;
  onSelect?(): void;
  tooltipText?: unknown;
}

interface AutomationRecord {
  canDelete?: boolean;
  canManage?: boolean;
  id?: string;
  is_enabled?: boolean;
  name?: string;
  prompt?: string;
  schedule?: string;
  status?: string;
  title?: string;
}

interface AutomationItem {
  automation?: AutomationRecord;
  teamId?: string | null;
}

interface AutomationActionsProps {
  deleteAction?: Action;
  editAction?: Action;
  isCompleted?: boolean;
  isPaused?: boolean;
  isStatusPending?: boolean;
  openConversationAction?: Action;
  pauseAction?: Action;
  pauseResumeInMenu?: boolean;
  resetAction?: Action & { isUsingDefaults?: boolean };
  resumeAction?: Action;
  retrySaveAction?: Action;
  runNowAction?: Action & { onSelectAsync?(): Promise<unknown> };
}

interface Trigger {
  connector_type?: string;
  id: string;
  is_enabled?: boolean;
  presentation?: { condition_rows?: Array<Record<string, unknown>>; display_name?: string; icon_url?: string };
}

interface TriggerListProps {
  onOpenTrigger?(trigger: Trigger): void;
  showUnavailableConditions?: boolean;
  triggers?: Trigger[] | null;
}

interface EditorProps {
  initialDraft?: { destination?: string; instructions?: string; name?: string; schedule?: string };
  isPending?: boolean;
  item?: AutomationItem;
  mode?: "dialog" | "panel";
  onClose(): void;
  onDelete?(): void | Promise<void>;
  onSave?(draft: AutomationDraft | Record<string, unknown>): unknown | Promise<unknown>;
  onSaved?(result: unknown, draft: AutomationDraft | Record<string, unknown>): void;
  presentation?: "dialog" | "panel";
}

interface ReactHooks {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}
function initialize(): void {}

function react(): ReactHooks {
  return getReactRuntime() as unknown as ReactHooks;
}

function normalizedAutomation(automation: AutomationRecord): ScheduleAutomationRecord {
  const schedule = automation.schedule ?? "RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=0";
  return {
    default_timezone: (automation as { default_timezone?: string }).default_timezone,
    id: automation.id ?? "draft",
    is_enabled: automation.is_enabled !== false,
    next_run_times: (automation as { next_run_times?: string[] }).next_run_times ?? [],
    prompt: automation.prompt ?? "",
    schedule,
    schedule_components: (automation as { schedule_components?: ScheduleAutomationRecord["schedule_components"] }).schedule_components ?? {
      frequency: /FREQ=([^;\r\n]+)/i.exec(schedule)?.[1]?.toLocaleLowerCase() ?? "daily",
    },
    schedule_time_of_day: (automation as { schedule_time_of_day?: ScheduleAutomationRecord["schedule_time_of_day"] }).schedule_time_of_day,
    target_time_utc: (automation as { target_time_utc?: string | null }).target_time_utc,
    thread_mode: (automation as { thread_mode?: string | null }).thread_mode,
    timing_mode: (automation as { timing_mode?: string | number }).timing_mode,
    title: automation.title ?? automation.name ?? "",
  };
}

function createInitialDraft(item?: AutomationItem, initialDraft?: EditorProps["initialDraft"]): AutomationDraft | Record<string, unknown> {
  if (item?.automation != null) return automationToDraft(normalizedAutomation(item.automation));
  return {
    destination: initialDraft?.destination,
    instructions: initialDraft?.instructions ?? "",
    kind: "cron",
    name: initialDraft?.name ?? "",
    prompt: initialDraft?.instructions ?? "",
    schedule: initialDraft?.schedule,
    scheduleConfig: initialDraft?.schedule == null ? undefined : { customRrule: initialDraft.schedule, mode: "custom" },
  };
}

function draftName(draft: Record<string, unknown>): string { return String(draft.name ?? ""); }
function draftPrompt(draft: Record<string, unknown>): string { return String(draft.prompt ?? draft.instructions ?? ""); }
function comparableDraft(draft: Record<string, unknown>): string {
  const copy = { ...draft };
  delete copy.error;
  return JSON.stringify(copy);
}

function actionLabel(fallback: string, action?: Action): string {
  return action?.label ?? fallback;
}

function AutomationActions(props: AutomationActionsProps): unknown {
  const statusAction = props.pauseResumeInMenu === false
    ? undefined
    : props.isPaused ? props.resumeAction : props.pauseAction;
  const actions: Array<[string, Action | undefined]> = [
    ["Edit", props.editAction],
    ["Run now", props.runNowAction],
    ["Open chat", props.openConversationAction],
    ["Reset to plugin defaults", props.resetAction],
    [props.isPaused ? "Resume" : "Pause", statusAction],
    ["Delete", props.deleteAction],
  ];
  return jsx().jsx("div", {
    role: "menu",
    "aria-label": "Scheduled task actions",
    children: actions.flatMap(([fallback, action]) => action == null ? [] : [jsx().jsx("button", {
      type: "button",
      role: "menuitem",
      disabled: action.disabled === true || action.isPending === true || props.isStatusPending === true && action === statusAction,
      onClick: action.onSelect,
      children: actionLabel(fallback, action),
    }, fallback)]),
  });
}

function LinkedSiteActions({
  automationId,
  children,
  onOpenSite,
  sites,
}: {
  automationId?: string;
  children?(content: unknown): unknown;
  onOpenSite?(projectId: string): void;
  presentation?: string;
  sites?: Array<{ project_id: string; title?: string }>;
}): unknown {
  if (sites != null) {
    if (sites.length === 0) return null;
    return jsx().jsx("div", {
      "data-automation-id": automationId,
      children: sites.map((site) => jsx().jsx("button", {
        type: "button",
        onClick: () => onOpenSite?.(site.project_id),
        children: `Automations: ${site.title ?? site.project_id}`,
      }, site.project_id)),
    });
  }
  const content = jsx().jsx("button", { type: "button", children: "Automations" });
  return children?.(content) ?? content;
}

function TriggerList({ onOpenTrigger, showUnavailableConditions = true, triggers }: TriggerListProps): unknown {
  if (triggers == null || triggers.length === 0) {
    return showUnavailableConditions
      ? jsx().jsx("p", { role: "status", children: "No trigger conditions · Trigger details unavailable" })
      : null;
  }
  return jsx().jsx("section", {
    children: triggers.map((trigger, index) => jsx().jsxs("div", {
      children: [
        index === 0 ? null : jsx().jsx("span", { children: "Or" }),
        jsx().jsx("h3", { children: trigger.presentation?.display_name ?? trigger.connector_type ?? "Webhook" }),
        trigger.is_enabled === false ? jsx().jsx("span", { children: "Disabled" }) : null,
        onOpenTrigger == null ? null : jsx().jsx("button", { type: "button", onClick: () => onOpenTrigger(trigger), children: "Open trigger" }),
        showUnavailableConditions && trigger.presentation == null ? jsx().jsx("p", { children: "Trigger details unavailable" }) : null,
      ],
    }, trigger.id)),
  });
}

function AutomationItemActions(props: {
  item?: AutomationItem;
  onDelete?(): void;
  onEdit?(): void;
  onOpenConversation?(): void;
  renderActions?(props: AutomationActionsProps): unknown;
  status?: string;
  statusMutation?: { isPending?: boolean; mutate?(input: { automationId?: string; isEnabled: boolean }): void };
  trailingMenuItems?: unknown;
}): unknown {
  const automation = props.item?.automation ?? {};
  if (automation.canManage === false && automation.canDelete === false) return null;
  const paused = automation.is_enabled === false || automation.status?.toLocaleLowerCase() === "paused" || props.status === "paused";
  const statusAction: Action = {
    isPending: props.statusMutation?.isPending,
    onSelect: () => props.statusMutation?.mutate?.({ automationId: automation.id, isEnabled: paused }),
  };
  const actionProps: AutomationActionsProps = {
    deleteAction: automation.canDelete === false || props.onDelete == null ? undefined : { onSelect: props.onDelete },
    editAction: automation.canManage === false || props.onEdit == null ? undefined : { onSelect: props.onEdit },
    isCompleted: props.status === "completed",
    isPaused: paused,
    openConversationAction: props.onOpenConversation == null ? undefined : { onSelect: props.onOpenConversation },
    pauseAction: statusAction,
    resumeAction: statusAction,
  };
  const rendered = props.renderActions?.(actionProps) ?? AutomationActions(actionProps);
  return jsx().jsxs(jsx().Fragment, {
    children: [rendered, props.trailingMenuItems ?? null, automation.id == null ? null : jsx().jsx("span", { hidden: true, children: automation.id })],
  });
}

function ActionBar({ hasUnsavedChanges = false, item, onRunNow, showStatusButton = false }: {
  hasUnsavedChanges?: boolean;
  item?: AutomationItem;
  onRunNow?(): void;
  showStatusButton?: boolean;
}): unknown {
  const automation = item?.automation ?? {};
  const status = automation.is_enabled === false ? "paused" : automation.status?.toLocaleLowerCase() ?? "active";
  return jsx().jsxs("div", {
    children: [
      jsx().jsx("button", { type: "button", disabled: hasUnsavedChanges || onRunNow == null, onClick: onRunNow, children: "Run now" }),
      showStatusButton ? jsx().jsx("span", { children: status }) : null,
    ],
  });
}

function DetailShell({ children, icon, onClose, onEdit, summary, title }: {
  children?: unknown;
  icon?: unknown;
  onClose?(): void;
  onEdit?(): void;
  summary?: unknown;
  title?: string;
}): unknown {
  return jsx().jsxs("section", {
    children: [
      icon,
      jsx().jsx("h2", { children: title }),
      jsx().jsx("p", { children: summary }),
      onEdit == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Edit task", onClick: onEdit, children: "Edit" }),
      onClose == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Close task details", onClick: onClose, children: "Close" }),
      children,
    ],
  });
}

function AutomationDetail({ item, onClose, onEdit }: { item?: AutomationItem; onClose?(): void; onEdit?(): void }): unknown {
  const automation = item?.automation ?? {};
  const completed = automation.status?.toLocaleLowerCase() === "completed";
  return DetailShell({
    title: automation.title ?? automation.name ?? "Scheduled task",
    summary: automation.prompt,
    onClose,
    onEdit: completed ? undefined : onEdit,
  });
}

function AutomationEditor({ initialDraft, isPending = false, item, mode = "dialog", onClose, onDelete, onSave, onSaved, presentation }: EditorProps): unknown {
  const React = react();
  const identity = item?.automation?.id ?? `new:${initialDraft?.name ?? ""}:${initialDraft?.schedule ?? ""}`;
  const makeInitial = (): AutomationDraft | Record<string, unknown> => createInitialDraft(item, initialDraft);
  const [draft, setDraft] = React.useState<AutomationDraft | Record<string, unknown>>(makeInitial);
  const [baseline, setBaseline] = React.useState<AutomationDraft | Record<string, unknown>>(makeInitial);
  const [saving, setSaving] = React.useState(false);
  const [hasSaved, setHasSaved] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const operation = React.useRef<AbortController | null>(null);
  React.useEffect(() => {
    const next = makeInitial();
    setDraft(next);
    setBaseline(next);
    setSaving(false);
    setHasSaved(false);
    setDeleting(false);
    setError(null);
    setDiscardOpen(false);
    setDeleteOpen(false);
    return () => operation.current?.abort();
  }, [identity]);
  const automation = item?.automation;
  const scheduleAutomation = automation == null ? null : normalizedAutomation(automation);
  const record = draft as Record<string, unknown>;
  const changed = scheduleAutomation == null
    ? !hasSaved && (initialDraft != null || comparableDraft(record) !== comparableDraft(baseline as Record<string, unknown>))
    : isDraftDirty(scheduleAutomation, draft as AutomationDraft);
  const validation = scheduleAutomation == null ? null : draftValidationError(scheduleAutomation, draft as AutomationDraft, new Date());
  const busy = isPending || saving || deleting;
  const valid = draftName(record).trim().length > 0 && draftPrompt(record).trim().length > 0 && validation == null;
  const update = (patch: Record<string, unknown>): void => setDraft((current) => ({ ...current, ...patch }));
  const close = (): void => { if (busy) return; if (changed) setDiscardOpen(true); else onClose(); };
  const save = async (): Promise<void> => {
    if (busy || !valid || !changed || onSave == null) return;
    operation.current?.abort();
    operation.current = new AbortController();
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      if (operation.current.signal.aborted) return;
      setBaseline(draft);
      setHasSaved(true);
      onSaved?.(result, draft);
      if ((presentation ?? mode) === "dialog") onClose();
    } catch (caught) {
      if (!operation.current.signal.aborted) setError(caught instanceof Error ? caught.message : "Couldn’t save task");
    } finally {
      if (!operation.current.signal.aborted) setSaving(false);
    }
  };
  const remove = async (): Promise<void> => {
    if (busy || onDelete == null) return;
    setDeleting(true);
    setError(null);
    let removed = false;
    try { await onDelete(); removed = true; }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Couldn’t delete task"); }
    finally { setDeleting(false); }
    if (removed) { setDeleteOpen(false); onClose(); }
  };
  const shell = presentation ?? mode;
  return jsx().jsxs(shell === "dialog" ? "dialog" : "aside", {
    open: shell === "dialog" ? true : undefined,
    "aria-busy": busy,
    children: [
      jsx().jsx("h2", { children: automation == null ? "Scheduled task" : "Edit scheduled task" }),
      error == null ? null : jsx().jsx("div", { role: "alert", children: error }),
      jsx().jsx("input", {
        "aria-label": automation == null ? "Task name" : "Name",
        disabled: busy,
        value: draftName(record),
        onChange: (event: { currentTarget: { value: string } }) => update({ name: event.currentTarget.value }),
      }),
      jsx().jsx("textarea", {
        "aria-label": "Instructions",
        disabled: busy,
        value: draftPrompt(record),
        onChange: (event: { currentTarget: { value: string } }) => update({ instructions: event.currentTarget.value, prompt: event.currentTarget.value }),
      }),
      scheduleAutomation == null ? null : jsx().jsx(ScheduleFields, {
        automation: scheduleAutomation,
        draft: draft as AutomationDraft,
        onChange: setDraft,
      }),
      validation == null ? null : jsx().jsx("p", { role: "alert", children: validation === "past" ? "Choose a future time" : validation === "too-far" ? "Choose a time within two years" : "End repeat must be in the future" }),
      jsx().jsx("button", { type: "button", disabled: busy, onClick: close, children: "Close" }),
      onDelete == null ? null : jsx().jsx("button", { type: "button", disabled: busy, onClick: () => setDeleteOpen(true), children: "Delete" }),
      jsx().jsx("button", { type: "button", disabled: busy || !valid || !changed || onSave == null, onClick: () => void save(), children: saving ? "Saving…" : error == null ? "Save" : "Try again" }),
      discardOpen ? jsx().jsxs("div", { role: "dialog", "aria-label": "Discard scheduled task changes?", children: [
        jsx().jsx("h3", { children: "Discard scheduled task changes?" }),
        jsx().jsx("p", { children: "Your changes to this scheduled task will be lost" }),
        jsx().jsx("button", { type: "button", onClick: () => setDiscardOpen(false), children: "Keep editing" }),
        jsx().jsx("button", { type: "button", onClick: onClose, children: "Discard" }),
      ] }) : null,
      deleteOpen ? jsx().jsxs("div", { role: "dialog", "aria-label": "Delete scheduled task?", children: [
        jsx().jsx("h3", { children: "Delete scheduled task?" }),
        jsx().jsx("p", { children: "This action can’t be undone" }),
        jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => setDeleteOpen(false), children: "Cancel" }),
        jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => void remove(), children: deleting ? "Deleting…" : "Delete task" }),
      ] }) : null,
    ],
  });
}

export {
  initialize as a,
  TriggerList as c,
  initialize as d,
  LinkedSiteActions as f,
  initialize as h,
  DetailShell as i,
  initialize as l,
  AutomationActions as m,
  initialize as n,
  ActionBar as o,
  initialize as p,
  AutomationDetail as r,
  initialize as s,
  AutomationEditor as t,
  AutomationItemActions as u,
};
