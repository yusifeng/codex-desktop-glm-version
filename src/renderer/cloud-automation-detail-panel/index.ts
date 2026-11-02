import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/automation-dialog";
import "@rchunk/automation-frequency-section";
import "@rchunk/automation-editor-dialog";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface Automation {
  canDelete?: boolean;
  canManage?: boolean;
  default_timezone?: string;
  destination?: string;
  id: string;
  instructions?: string;
  is_enabled?: boolean;
  name?: string;
  prompt?: string;
  schedule?: string;
  status?: string;
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

function AutomationForm({ draft, formId = "cloud-automation-form", onSubmit, resolvedProjects = [], setDraft }: {
  draft: Draft;
  formId?: string;
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
        value: draft.name ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, name: event.currentTarget.value })),
      }),
      jsx().jsx("textarea", {
        "aria-label": "Prompt",
        value: draft.prompt ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, prompt: event.currentTarget.value })),
      }),
      jsx().jsx("select", {
        "aria-label": "Project",
        value: draft.projectId ?? "",
        onChange: (event: { currentTarget: { value: string } }) => setDraft((current) => ({ ...current, projectId: event.currentTarget.value || null })),
        children: [
          jsx().jsx("option", { value: "", children: "No project" }),
          ...projects.map((project) => jsx().jsx("option", { value: project.projectId, children: project.title ?? project.projectId }, project.projectId)),
        ],
      }),
      jsx().jsx("button", { type: "submit", disabled: !valid, children: "Save" }),
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
}: {
  automation?: Automation;
  isPending?: boolean;
  item?: Item;
  onClose?(): void;
  onDelete?(): void;
  onEdit?(): void;
  onOpenConversation?(): void;
  onPause?(): void;
  onRunNow?(): void;
  onSaved?(automation: Automation): void;
  showRunResults?: boolean;
}): unknown {
  const automation = item?.automation ?? directAutomation;
  if (automation == null) return jsx().jsx("p", { children: "Scheduled task not found" });
  const paused = automation.status?.toLocaleLowerCase() === "paused" || automation.is_enabled === false;
  const actions = jsx().jsxs("div", {
    children: [
      onEdit == null ? null : jsx().jsx("button", { type: "button", disabled: isPending, onClick: onEdit, children: "Edit" }),
      onRunNow == null ? null : jsx().jsx("button", { type: "button", disabled: isPending || !canRun(automation), onClick: onRunNow, children: "Run now" }),
      onPause == null ? null : jsx().jsx("button", { type: "button", disabled: isPending, onClick: onPause, children: paused ? "Resume" : "Pause" }),
      onDelete == null ? null : jsx().jsx("button", { type: "button", disabled: isPending, onClick: onDelete, children: "Delete" }),
      onOpenConversation == null ? null : jsx().jsx("button", { type: "button", onClick: onOpenConversation, children: "Open chat" }),
    ],
  });
  return DetailPanel({
    actions,
    name: automationTitle(automation),
    statusLabel: paused ? "Paused" : "Active",
    closeAction: onClose == null ? undefined : { label: "Close", onClose },
    children: jsx().jsxs("div", {
      children: [
        jsx().jsx("p", { children: automation.prompt ?? automation.instructions }),
        automation.schedule == null ? null : jsx().jsx("p", { children: automation.schedule }),
        automation.destination == null ? null : jsx().jsx("p", { children: automation.destination }),
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
