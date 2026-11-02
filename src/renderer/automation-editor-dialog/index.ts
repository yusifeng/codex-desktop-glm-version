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
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

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
  onDelete?(): void;
  onSave?(draft: Record<string, unknown>): void | Promise<void>;
  presentation?: "dialog" | "panel";
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}
function initialize(): void {}

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

function AutomationEditor({ initialDraft, isPending = false, item, mode = "dialog", onClose, onDelete, onSave, presentation }: EditorProps): unknown {
  const automation = item?.automation;
  const draft: Record<string, unknown> = initialDraft == null
    ? { name: automation?.title ?? automation?.name ?? "", instructions: automation?.prompt ?? "" }
    : { ...initialDraft };
  const shell = presentation ?? mode;
  return jsx().jsxs(shell === "dialog" ? "dialog" : "aside", {
    open: shell === "dialog" ? true : undefined,
    children: [
      jsx().jsx("h2", { children: automation == null ? "Scheduled task" : "Edit scheduled task" }),
      jsx().jsx("input", {
        "aria-label": automation == null ? "Task name" : "Name",
        value: String(draft.name ?? ""),
        onChange: (event: { currentTarget: { value: string } }) => { draft.name = event.currentTarget.value; },
      }),
      jsx().jsx("textarea", {
        "aria-label": "Instructions",
        value: String(draft.instructions ?? ""),
        onChange: (event: { currentTarget: { value: string } }) => { draft.instructions = event.currentTarget.value; },
      }),
      item == null ? null : jsx().jsx("fieldset", { draft: { ...draft, name: draft.name, prompt: draft.instructions } }),
      jsx().jsx("button", { type: "button", onClick: onClose, children: "Close" }),
      onDelete == null ? null : jsx().jsx("button", { type: "button", onClick: onDelete, children: "Delete" }),
      jsx().jsx("button", { type: "button", disabled: isPending || item != null, onClick: () => onSave?.(draft), children: "Save" }),
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
