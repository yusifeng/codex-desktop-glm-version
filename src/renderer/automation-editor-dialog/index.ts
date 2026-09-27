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

interface Action { disabled?: boolean; isPending?: boolean; onSelect(): void; tooltipText?: unknown }
interface AutomationActionsProps {
  deleteAction?: Action;
  editAction?: Action;
  isCompleted?: boolean;
  isPaused?: boolean;
  isStatusPending?: boolean;
  openConversationAction?: Action;
  pauseAction: Action;
  resetAction?: Action & { isUsingDefaults?: boolean };
  resumeAction: Action;
  retrySaveAction?: Action;
  runNowAction?: Action & { onSelectAsync?(): Promise<unknown> };
}
interface Trigger { connector_type?: string; id: string; is_enabled?: boolean; presentation?: { condition_rows?: Array<Record<string, unknown>>; display_name?: string; icon_url?: string } }
interface TriggerListProps { onOpenTrigger?(trigger: Trigger): void; showUnavailableConditions?: boolean; triggers?: Trigger[] | null }
interface EditorProps {
  initialDraft?: { destination?: string; instructions?: string; name?: string; schedule?: string };
  isPending?: boolean;
  mode?: "dialog" | "panel";
  onClose(): void;
  onDelete?(): void;
  onSave?(draft: Record<string, unknown>): void | Promise<void>;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function initialize(): void {}

function AutomationActions(props: AutomationActionsProps): unknown {
  const actions: Array<[string, Action | undefined]> = [
    ["Edit", props.editAction],
    ["Run now", props.runNowAction],
    ["Open chat", props.openConversationAction],
    ["Reset to plugin defaults", props.resetAction],
    [props.isPaused ? "Resume" : "Pause", props.isPaused ? props.resumeAction : props.pauseAction],
    ["Delete", props.deleteAction],
  ];
  return jsx().jsx("div", { "aria-label": "Scheduled task actions", children: actions.flatMap(([label, action]) => action == null ? [] : [jsx().jsx("button", { type: "button", disabled: action.disabled || action.isPending, onClick: action.onSelect, children: label }, label)]) });
}

function LinkedSiteActions({ children }: { automationId?: string; children?(content: unknown): unknown; presentation?: string }): unknown { const content = jsx().jsx("button", { type: "button", children: "Automations" }); return children?.(content) ?? content; }

function TriggerList({ onOpenTrigger, showUnavailableConditions = true, triggers }: TriggerListProps): unknown {
  if (triggers == null || triggers.length === 0) return showUnavailableConditions ? jsx().jsx("p", { children: "Trigger details unavailable" }) : null;
  return jsx().jsx("section", { children: triggers.map((trigger, index) => jsx().jsxs("div", { children: [index === 0 ? null : jsx().jsx("span", { children: "Or" }), jsx().jsx("h3", { children: trigger.presentation?.display_name ?? trigger.connector_type ?? "Webhook" }), trigger.is_enabled === false ? jsx().jsx("span", { children: "Disabled" }) : null, onOpenTrigger == null ? null : jsx().jsx("button", { type: "button", onClick: () => onOpenTrigger(trigger), children: "Open trigger" }), showUnavailableConditions && trigger.presentation == null ? jsx().jsx("p", { children: "Trigger details unavailable" }) : null] }, trigger.id)) });
}

function AutomationItemActions({ item, onDelete, onEdit, onOpenConversation, renderActions, status, trailingMenuItems }: Record<string, unknown>): unknown {
  const automation = (item as { automation?: Record<string, unknown> } | undefined)?.automation ?? {};
  const actionProps: AutomationActionsProps = {
    deleteAction: typeof onDelete === "function" ? { onSelect: onDelete as () => void } : undefined,
    editAction: typeof onEdit === "function" ? { onSelect: onEdit as () => void } : undefined,
    isCompleted: status === "completed",
    isPaused: status === "paused",
    openConversationAction: typeof onOpenConversation === "function" ? { onSelect: onOpenConversation as () => void } : undefined,
    pauseAction: { onSelect() {} }, resumeAction: { onSelect() {} },
  };
  const rendered = typeof renderActions === "function" ? (renderActions as (props: AutomationActionsProps) => unknown)(actionProps) : AutomationActions(actionProps);
  return jsx().jsxs(jsx().Fragment, { children: [rendered, trailingMenuItems ?? null, automation.id == null ? null : jsx().jsx("span", { hidden: true, children: String(automation.id) })] });
}

function DiscardChangesDialog({ isPending = false, onDiscard, onKeepEditing }: { isPending?: boolean; onDiscard(): void; onKeepEditing(): void }): unknown { return jsx().jsx("dialog", { open: true, children: jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); if (!isPending) onDiscard(); }, children: [jsx().jsx("h2", { children: "Discard changes?" }), jsx().jsx("p", { children: "Your changes will not be saved" }), jsx().jsx("button", { type: "button", onClick: onKeepEditing, children: "Keep editing" }), jsx().jsx("button", { type: "submit", disabled: isPending, children: "Discard changes" })] }) }); }

function AutomationEditor({ initialDraft = {}, isPending = false, mode = "dialog", onClose, onDelete, onSave }: EditorProps): unknown {
  const draft: Record<string, unknown> = { ...initialDraft };
  return jsx().jsxs(mode === "dialog" ? "dialog" : "aside", { open: mode === "dialog" ? true : undefined, children: [jsx().jsx("h2", { children: "Scheduled task" }), jsx().jsx("input", { "aria-label": "Task name", defaultValue: initialDraft.name ?? "", onChange: (event: { currentTarget: { value: string } }) => { draft.name = event.currentTarget.value; } }), jsx().jsx("textarea", { "aria-label": "Instructions", defaultValue: initialDraft.instructions ?? "", onChange: (event: { currentTarget: { value: string } }) => { draft.instructions = event.currentTarget.value; } }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Close" }), onDelete == null ? null : jsx().jsx("button", { type: "button", onClick: onDelete, children: "Delete" }), jsx().jsx("button", { type: "button", disabled: isPending, onClick: () => onSave?.(draft), children: "Save" })] });
}

function preventDefault(event: { preventDefault(): void }): void { event.preventDefault(); }
function identity<T>(value: T): T { return value; }

export {
  initialize as a,
  TriggerList as c,
  initialize as d,
  LinkedSiteActions as f,
  initialize as h,
  identity as i,
  initialize as l,
  AutomationActions as m,
  initialize as n,
  DiscardChangesDialog as o,
  initialize as p,
  preventDefault as r,
  initialize as s,
  AutomationEditor as t,
  AutomationItemActions as u,
};
