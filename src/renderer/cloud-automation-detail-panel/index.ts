import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/automation-dialog";
import "@rchunk/automation-frequency-section";
import "@rchunk/automation-editor-dialog";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface Automation {
  canDelete?: boolean;
  canManage?: boolean;
  default_timezone?: string;
  destination?: string;
  id: string;
  instructions?: string;
  is_enabled?: boolean;
  model?: string | null;
  name?: string;
  prompt?: string;
  schedule?: string;
  status?: string;
  project_id?: string | null;
  thread_id?: string | null;
  title?: string;
  triggers?: Array<Record<string, unknown>>;
}

interface Draft {
  executionLocation?: string | null;
  kind?: string;
  model?: string | null;
  name?: string;
  projectId?: string | null;
  prompt?: string;
  scheduleConfig?: Record<string, unknown>;
  schedule?: string | null;
  timezone?: string | null;
  threadId?: string | null;
}

interface Item {
  automation: Automation;
  teamId?: string | null;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}
function initialize(): void {}

interface ReactHooks {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
function react(): ReactHooks { return getReactRuntime() as unknown as ReactHooks; }

function automationDraft(automation: Automation): Draft {
  return {
    executionLocation: automation.destination ?? "cloud",
    kind: automation.triggers?.length ? "heartbeat" : "cron",
    name: automationTitle(automation),
    model: automation.model ?? null,
    prompt: automation.prompt ?? automation.instructions ?? "",
    projectId: automation.project_id ?? null,
    schedule: automation.schedule ?? null,
    scheduleConfig: automation.schedule == null ? {} : { customRrule: automation.schedule, mode: "custom" },
    timezone: automation.default_timezone ?? null,
    threadId: automation.thread_id ?? null,
  };
}

function sameDraft(left: Draft, right: Draft): boolean { return JSON.stringify(left) === JSON.stringify(right); }

function missingRequirements(draft: Draft, allowNewThread: boolean, executionLocation: string): string[] {
  const missing: string[] = [];
  if (draft.name?.trim().length !== 0 && draft.name != null) {
    // Present.
  } else missing.push("Add a title");
  if (draft.prompt?.trim().length !== 0 && draft.prompt != null) {
    // Present.
  } else missing.push("Add a prompt");
  if (!allowNewThread && draft.kind === "heartbeat" && draft.threadId == null) missing.push("Select a chat");
  if (executionLocation === "cloud" && draft.executionLocation == null) missing.push("Choose where to run it");
  if (executionLocation === "cloud" && draft.model == null) missing.push("Choose a model");
  return missing;
}

function Requirements({ allowNewThread = false, draft, executionLocation = "local" }: {
  allowNewThread?: boolean;
  draft: Draft;
  executionLocation?: string | { selectedLocation?: string };
}): unknown {
  const location = typeof executionLocation === "string" ? executionLocation : executionLocation.selectedLocation ?? "local";
  const missing = missingRequirements(draft, allowNewThread, location);
  if (missing.length === 0) return null;
  return jsx().jsxs("div", {
    children: [
      jsx().jsx("p", { children: "Complete these requirements:" }),
      jsx().jsx("ul", { children: missing.map((requirement) => jsx().jsx("li", { children: requirement }, requirement)) }),
    ],
  });
}

function AutomationForm({ draft, formId = "cloud-automation-form", isPending = false, models = [], onSubmit, resolvedProjects = [], setDraft }: {
  draft: Draft;
  formId?: string;
  isPending?: boolean;
  models?: Array<{ id?: string; label?: string; name?: string; slug?: string }>;
  onSubmit?(event: { preventDefault(): void }): void;
  resolvedProjects?: Array<{ projectId: string; title?: string; worktreePaths?: string[] }>;
  setDraft(value: Draft | ((draft: Draft) => Draft)): void;
}): unknown {
  const projects = resolvedProjects.filter((project) => (project.worktreePaths?.length ?? 0) > 0);
  const valid = draft.name?.trim().length !== 0 && draft.prompt?.trim().length !== 0;
  return jsx().jsxs("form", {
    id: formId,
    onSubmit,
    children: [
      jsx().jsx("input", {
        "aria-label": "Name",
        disabled: isPending,
        value: draft.name ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, name: event.currentTarget.value })),
      }),
      jsx().jsx("textarea", {
        "aria-label": "Prompt",
        disabled: isPending,
        value: draft.prompt ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, prompt: event.currentTarget.value })),
      }),
      jsx().jsx("select", {
        "aria-label": "Project",
        disabled: isPending,
        value: draft.projectId ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, projectId: event.currentTarget.value || null })),
        children: [
          jsx().jsx("option", { value: "", children: "No project" }),
          ...projects.map((project) => jsx().jsx("option", { value: project.projectId, children: project.title ?? project.projectId }, project.projectId)),
        ],
      }),
      jsx().jsx("select", {
        "aria-label": "Run location",
        disabled: isPending,
        value: draft.executionLocation ?? "cloud",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, executionLocation: event.currentTarget.value })),
        children: [
          jsx().jsx("option", { value: "cloud", children: "Cloud" }),
          jsx().jsx("option", { value: "local", children: "This device" }),
        ],
      }),
      models.length === 0 ? null : jsx().jsx("select", {
        "aria-label": "Model",
        disabled: isPending,
        value: draft.model ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, model: event.currentTarget.value || null })),
        children: [
          jsx().jsx("option", { value: "", children: "Choose a model" }),
          ...models.map((model) => { const id = model.id ?? model.slug ?? ""; return jsx().jsx("option", { value: id, children: model.label ?? model.name ?? model.slug ?? id }, id); }),
        ],
      }),
      jsx().jsx("textarea", {
        "aria-label": "Schedule",
        disabled: isPending,
        value: draft.schedule ?? String(draft.scheduleConfig?.customRrule ?? ""),
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, schedule: event.currentTarget.value, scheduleConfig: { ...current.scheduleConfig, customRrule: event.currentTarget.value, mode: "custom" } })),
      }),
      jsx().jsx("input", {
        "aria-label": "Time zone",
        disabled: isPending,
        value: draft.timezone ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, timezone: event.currentTarget.value || null })),
      }),
      jsx().jsx("button", { type: "submit", disabled: isPending || !valid, children: isPending ? "Saving…" : "Save" }),
    ],
  });
}

function DetailPanel({ actions, children, closeAction, footer = null, name, onKeyDown, onNameChange, statusLabel }: {
  actions?: unknown;
  autoFocusName?: boolean;
  children?: unknown;
  closeAction?: { label: string; onClose(): void };
  footer?: unknown;
  name?: string;
  onKeyDown?: unknown;
  onNameChange?(value: string): void;
  statusLabel?: string;
}): unknown {
  return jsx().jsxs("section", {
    onKeyDown,
    children: [
      statusLabel == null ? null : jsx().jsx("div", { children: statusLabel }),
      jsx().jsx("h2", { children: name ?? "Scheduled task" }),
      jsx().jsx("input", {
        id: "automation-detail-panel-title",
        readOnly: onNameChange == null,
        value: name ?? "",
        onChange: (event: { currentTarget: { value: string } }) => onNameChange?.(event.currentTarget.value),
      }),
      actions,
      children,
      footer,
      closeAction == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Close", onClick: closeAction.onClose, children: closeAction.label }),
    ],
  });
}

function automationTitle(automation: Automation): string {
  return automation.name?.trim() || automation.title?.trim() || "Scheduled task";
}

function canRun(automation: Automation): boolean {
  const status = automation.status?.toLocaleLowerCase();
  return status !== "paused" && status !== "completed" && automation.is_enabled !== false;
}

function CloudAutomationEditor({
  automation: directAutomation,
  isPending = false,
  item,
  onClose,
  onDelete,
  onEdit,
  onOpenConversation,
  onPause,
  onRunNow,
  onSave,
  onSaved,
  resolvedProjects = [],
  models = [],
}: {
  automation?: Automation;
  isPending?: boolean;
  item?: Item;
  onClose?(): void;
  onDelete?(): void | Promise<void>;
  onEdit?(): void;
  onOpenConversation?(): void;
  onPause?(): void;
  onRunNow?(): void;
  onSave?(draft: Draft, item: Item): Automation | void | Promise<Automation | void>;
  onSaved?(automation: Automation): void;
  resolvedProjects?: Array<{ projectId: string; title?: string; worktreePaths?: string[] }>;
  models?: Array<{ id?: string; label?: string; name?: string; slug?: string }>;
  showRunResults?: boolean;
}): unknown {
  const automation = item?.automation ?? directAutomation;
  if (automation == null) return jsx().jsx("p", { children: "Scheduled task not found" });
  const React = react();
  const initial = automationDraft(automation);
  const [draft, setDraft] = React.useState<Draft>(initial);
  const [baseline, setBaseline] = React.useState<Draft>(initial);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    const next = automationDraft(automation);
    setDraft(next); setBaseline(next); setEditing(false); setSaving(false); setDeleting(false); setDiscardOpen(false); setDeleteOpen(false); setError(null);
  }, [automation.id]);
  const paused = automation.status?.toLocaleLowerCase() === "paused" || automation.is_enabled === false;
  const changed = !sameDraft(draft, baseline);
  const pending = isPending || saving || deleting;
  const requestClose = (): void => { if (pending) return; if (editing && changed) setDiscardOpen(true); else onClose?.(); };
  const save = async (event: { preventDefault(): void }): Promise<void> => {
    event.preventDefault();
    if (item == null || onSave == null || pending || !changed || draft.name?.trim() === "" || draft.prompt?.trim() === "") return;
    setSaving(true); setError(null);
    try {
      const saved = await onSave(draft, item);
      const nextAutomation: Automation = saved == null ? { ...automation, name: draft.name, title: draft.name, prompt: draft.prompt, instructions: draft.prompt, schedule: draft.schedule ?? automation.schedule, default_timezone: draft.timezone ?? automation.default_timezone } : saved as Automation;
      const next = automationDraft(nextAutomation);
      setDraft(next); setBaseline(next); setEditing(false); onSaved?.(nextAutomation);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update cloud scheduled task"); }
    finally { setSaving(false); }
  };
  const remove = async (): Promise<void> => {
    if (onDelete == null || pending) return;
    setDeleting(true); setError(null);
    let removed = false;
    try { await onDelete(); removed = true; }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete cloud scheduled task"); }
    finally { setDeleting(false); }
    if (removed) { setDeleteOpen(false); onClose?.(); }
  };
  if (editing && item != null) {
    return DetailPanel({
      name: draft.name,
      statusLabel: paused ? "Paused" : "Active",
      onNameChange: pending ? undefined : (name) => setDraft((current) => ({ ...current, name })),
      closeAction: { label: "Close", onClose: requestClose },
      children: jsx().jsxs(jsx().Fragment, { children: [
        error == null ? null : jsx().jsx("div", { role: "alert", children: error }),
        jsx().jsx(AutomationForm, { draft, formId: "cloud-automation-form", isPending: pending, models, resolvedProjects, setDraft, onSubmit: (event: { preventDefault(): void }) => void save(event) }),
        jsx().jsx(Requirements, { draft, executionLocation: draft.executionLocation ?? "cloud" }),
        jsx().jsx("button", { type: "button", disabled: pending, onClick: () => changed ? setDiscardOpen(true) : setEditing(false), children: "Cancel" }),
        onDelete == null ? null : jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setDeleteOpen(true), children: "Delete" }),
        discardOpen ? jsx().jsxs("div", { role: "dialog", "aria-label": "Discard cloud task changes?", children: [
          jsx().jsx("h3", { children: "Discard changes?" }),
          jsx().jsx("button", { type: "button", onClick: () => setDiscardOpen(false), children: "Keep editing" }),
          jsx().jsx("button", { type: "button", onClick: () => { setDraft(baseline); setDiscardOpen(false); setEditing(false); }, children: "Discard" }),
        ] }) : null,
        deleteOpen ? jsx().jsxs("div", { role: "dialog", "aria-label": "Delete cloud scheduled task?", children: [
          jsx().jsx("h3", { children: "Delete scheduled task?" }),
          jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => setDeleteOpen(false), children: "Cancel" }),
          jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => void remove(), children: deleting ? "Deleting…" : "Delete task" }),
        ] }) : null,
      ] }),
    });
  }
  const actions = jsx().jsxs("div", {
    children: [
      automation.canManage === false ? null : jsx().jsx("button", { type: "button", disabled: pending, onClick: onEdit ?? (() => setEditing(true)), children: "Edit" }),
      onRunNow == null ? null : jsx().jsx("button", { type: "button", disabled: pending || !canRun(automation), onClick: onRunNow, children: "Run now" }),
      onPause == null ? null : jsx().jsx("button", { type: "button", disabled: pending, onClick: onPause, children: paused ? "Resume" : "Pause" }),
      onDelete == null ? null : jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setDeleteOpen(true), children: "Delete" }),
      onOpenConversation == null ? null : jsx().jsx("button", { type: "button", onClick: onOpenConversation, children: "Open chat" }),
    ],
  });
  return DetailPanel({
    actions,
    name: automationTitle(automation),
    statusLabel: paused ? "Paused" : "Active",
    closeAction: onClose == null ? undefined : { label: "Close", onClose: requestClose },
    children: jsx().jsxs("div", {
      children: [
        jsx().jsx("p", { children: automation.prompt ?? automation.instructions }),
        automation.schedule == null ? null : jsx().jsx("p", { children: automation.schedule }),
        automation.destination == null ? null : jsx().jsx("p", { children: automation.destination }),
        error == null ? null : jsx().jsx("div", { role: "alert", children: error }),
        deleteOpen ? jsx().jsxs("div", { role: "dialog", "aria-label": "Delete cloud scheduled task?", children: [
          jsx().jsx("h3", { children: "Delete scheduled task?" }),
          jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => setDeleteOpen(false), children: "Cancel" }),
          jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => void remove(), children: deleting ? "Deleting…" : "Delete task" }),
        ] }) : null,
      ],
    }),
  });
}

export {
  Requirements as a,
  initialize as c,
  initialize as i,
  initialize as n,
  initialize as o,
  DetailPanel as r,
  AutomationForm as s,
  CloudAutomationEditor as t,
};
