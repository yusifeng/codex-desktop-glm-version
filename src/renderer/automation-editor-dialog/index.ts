import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/appgen-automations-state";
import "@rchunk/automation-frequency-section";
import "@rchunk/automation-delete-confirmation-dialog";
import "@rchunk/share-analytics";
import "@rchunk/conversation-summary";
import "@rchunk/timestamps";
import "@rchunk/platform-ui-kit-provider";
import "@rchunk/navigation-blocker";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { n as automationToDraft, s as isAutomationDirty, type AutomationDraft, type AutomationRecord } from "@rchunk/schedule-draft";
import { t as ScheduleFields, type AutomationItem } from "@rchunk/schedule-fields";

type Node = unknown;
interface Action { disabled?: boolean; label?: Node; onSelect?(): void }
interface Automation extends AutomationRecord { canDelete?: boolean; canManage?: boolean; conversation_id?: string | null; display_emoji?: string | null; executor?: string; status?: string }
export interface AutomationEditorItem extends Omit<AutomationItem, "automation"> { automation: Automation }
interface ActionMenuProps { additionalMenuItems?: Node; deleteAction?: Action; editAction?: Action; isCompleted?: boolean; isPaused?: boolean; isStatusPending?: boolean; onMenuOpenChange?(open: boolean): void; openConversationAction?: Action; pauseAction?: Action; pauseResumeInMenu?: boolean; resetAction?: Action; resumeAction?: Action; retrySaveAction?: Action; runNowAction?: Action; runNowIcon?: Node; statusFirst?: boolean; trailingMenuItems?: Node }
interface LinkedSitesProps { automationId: string; children?(content: Node): Node; presentation?: "detail-footer" | "editor-footer" | "inline" | "run-result"; sites?: Array<{ project_id: string; title: string }>; onOpenSite?(projectId: string): void }
interface AutomationActionsProps { item: AutomationEditorItem; onDeleted?(): void; onEdit?(): void; onOpenConversation?(): void; onPaused?(): void; onStatusChanged?(): void; renderActions?(actions: Node): Node; status?: string; statusMutation?: { isPending?: boolean; mutate?(input: { automationId: string; isEnabled: boolean }): void }; trailingMenuItems?: Node }
interface TriggerPresentation { display_name?: string; icon_url?: string }
interface Trigger { connector_type?: string; id: string; presentation?: TriggerPresentation }
interface TriggerListProps { onOpenTrigger?(trigger: Trigger): void; showUnavailableConditions?: boolean; triggers?: Trigger[] | null }
interface ActionBarProps { additionalMenuItems?: Node; disabled?: boolean; hasUnsavedChanges?: boolean; isRunNowPending?: boolean; item: AutomationEditorItem; onDeleted?(): void; onMenuOpenChange?(open: boolean): void; onPaused?(): void; onRunNow?(): void; onRunNowAsync?(): Promise<void>; rowRef?: { current?: { contains(value: unknown): boolean } | null }; runNowDisabled?: boolean; runNowIcon?: Node; shareMenuItem?: Node; showStatusButton?: boolean; source?: "editor" | "scheduled_page"; statusFirst?: boolean }
interface DetailShellProps { actions?: Node; children?: Node; footer?: Node; icon?: Node; onClose(): void; onEdit?(): void; summary?: Node; title: Node }
interface DetailContentProps { children?: Node; isRunNowPending?: boolean; item: AutomationEditorItem; onClose(): void; onEdit?(): void; onRunNow?(): void; relatedActions?: Node; summary?: Node }
interface EditorProps { conversationId?: string | null; item: AutomationEditorItem; onClose(): void; presentation?: "dialog" | "panel"; ref?: unknown; relatedActions?: Node }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function statusOf(automation: Automation): string { return automation.status ?? (automation.is_enabled ? "active" : "paused"); }
function actionButton(action: Action | undefined, key: string): Node { return action == null ? null : jsx().jsx("button", { type: "button", disabled: action.disabled, onClick: action.onSelect, children: action.label ?? key }, key); }

function AutomationActionMenu(props: ActionMenuProps): Node {
  const pauseResume = props.pauseResumeInMenu ? (props.isPaused ? props.resumeAction : props.pauseAction) : undefined;
  const ordered = props.statusFirst
    ? [pauseResume, props.runNowAction, props.openConversationAction, props.editAction, props.retrySaveAction, props.resetAction, props.deleteAction]
    : [props.runNowAction, props.openConversationAction, props.editAction, pauseResume, props.retrySaveAction, props.resetAction, props.deleteAction];
  return jsx().jsxs("div", { role: "menu", "aria-busy": props.isStatusPending || undefined, onFocus: () => props.onMenuOpenChange?.(true), onBlur: () => props.onMenuOpenChange?.(false), children: [...ordered.map((action, index) => actionButton(action, `action-${index}`)), props.additionalMenuItems, props.trailingMenuItems] });
}
function LinkedAutomationSites({ children, presentation = "inline", sites = [], onOpenSite }: LinkedSitesProps): Node {
  const content = sites.length === 0 ? null : jsx().jsx(jsx().Fragment, { children: sites.map(site => jsx().jsx("button", { type: "button", "data-presentation": presentation, onClick: () => onOpenSite?.(site.project_id), children: presentation === "inline" ? `Open ${site.title}` : sites.length === 1 ? "Automations" : `Automations: ${site.title}` }, site.project_id)) });
  return children?.(content) ?? content;
}
function AutomationActions({ item, onDeleted, onEdit, onOpenConversation, onPaused, onStatusChanged, renderActions, status, statusMutation, trailingMenuItems }: AutomationActionsProps): Node {
  const currentStatus = status ?? statusOf(item.automation), paused = currentStatus === "paused", pending = statusMutation?.isPending === true;
  if (!item.automation.canManage && !item.automation.canDelete) return null;
  const setEnabled = (enabled: boolean) => { onPaused?.(); statusMutation?.mutate?.({ automationId: item.automation.id, isEnabled: enabled }); onStatusChanged?.(); };
  const menu = jsx().jsx(AutomationActionMenu, { isPaused: paused, isCompleted: currentStatus === "completed", isStatusPending: pending, pauseResumeInMenu: true, pauseAction: { label: "Pause", disabled: pending, onSelect: () => setEnabled(false) }, resumeAction: { label: "Resume", disabled: pending, onSelect: () => setEnabled(true) }, editAction: onEdit == null ? undefined : { label: "Edit", onSelect: onEdit }, openConversationAction: onOpenConversation == null ? undefined : { label: "Open chat", onSelect: onOpenConversation }, deleteAction: item.automation.canDelete ? { label: "Delete", onSelect: onDeleted } : undefined, trailingMenuItems });
  return renderActions?.(menu) ?? menu;
}
function WebhookTriggerList({ triggers, onOpenTrigger, showUnavailableConditions = true }: TriggerListProps): Node {
  if (triggers == null || triggers.length === 0) return jsx().jsx("p", { role: "status", children: showUnavailableConditions ? "No trigger conditions available" : "No triggers" });
  return jsx().jsx(jsx().Fragment, { children: triggers.map((trigger, index) => jsx().jsxs(jsx().Fragment, { children: [index === 0 ? null : jsx().jsx("span", { children: "Or" }), jsx().jsx("button", { type: "button", onClick: () => onOpenTrigger?.(trigger), children: trigger.presentation?.display_name ?? trigger.connector_type ?? "Webhook" })] }, trigger.id)) });
}
function AutomationActionBar({ item, disabled = false, hasUnsavedChanges = false, isRunNowPending = false, onDeleted, onMenuOpenChange, onPaused, onRunNow, onRunNowAsync, runNowDisabled = false, showStatusButton = false, additionalMenuItems, shareMenuItem }: ActionBarProps): Node {
  const run = () => { onRunNow?.(); void onRunNowAsync?.(); };
  return jsx().jsxs("div", { role: "toolbar", children: [jsx().jsx("button", { type: "button", disabled: disabled || runNowDisabled || isRunNowPending || hasUnsavedChanges, "aria-busy": isRunNowPending || undefined, onClick: run, children: "Run now" }), showStatusButton ? jsx().jsx("span", { children: statusOf(item.automation) }) : null, jsx().jsx(AutomationActions, { item, onDeleted, onPaused, onStatusChanged: undefined, trailingMenuItems: jsx().jsxs(jsx().Fragment, { children: [additionalMenuItems, shareMenuItem] }), renderActions: actions => jsx().jsx("div", { onFocus: () => onMenuOpenChange?.(true), children: actions }) })] });
}
function AutomationDetailShell({ actions, children, footer, icon, onClose, onEdit, summary, title }: DetailShellProps): Node { return jsx().jsxs("section", { "aria-label": "Scheduled task details", children: [jsx().jsxs("header", { children: [jsx().jsx("span", { "aria-hidden": true, children: icon }), jsx().jsxs("div", { children: [jsx().jsx("h2", { children: title }), jsx().jsx("div", { children: summary })] }), actions, onEdit == null ? null : jsx().jsx("button", { type: "button", "aria-label": "Edit task", onClick: onEdit, children: "Edit" }), jsx().jsx("button", { type: "button", "aria-label": "Close task details", onClick: onClose, children: "Close" })] }), jsx().jsx("div", { children }), footer] }); }
function AutomationDetailContent({ children, isRunNowPending = false, item, onClose, onEdit, onRunNow, summary }: DetailContentProps): Node { const automation = item.automation; return jsx().jsx(AutomationDetailShell, { title: automation.title, icon: automation.display_emoji ?? "⏱", summary: summary ?? statusOf(automation), actions: jsx().jsx(AutomationActionBar, { item, onDeleted: onClose, onRunNow, isRunNowPending, source: "editor" }), onEdit: automation.canManage && statusOf(automation) !== "completed" ? onEdit : undefined, onClose, children: children ?? jsx().jsx("p", { children: automation.prompt }) }); }
function AutomationEditor({ item, onClose, presentation = "dialog" }: EditorProps): Node { const initial = automationToDraft(item.automation), onChange = (_draft: AutomationDraft) => undefined; return jsx().jsxs(presentation === "dialog" ? "dialog" : "section", { open: presentation === "dialog" ? true : undefined, "data-presentation": presentation, children: [jsx().jsx("h2", { children: "Edit scheduled task" }), jsx().jsx("input", { "aria-label": "Name", value: initial.name, readOnly: true }), jsx().jsx("textarea", { "aria-label": "Instructions", value: initial.prompt, readOnly: true }), jsx().jsx(ScheduleFields, { automation: item.automation, draft: initial, onChange }), jsx().jsx("button", { type: "button", disabled: !isAutomationDirty(item.automation, initial), children: "Save" }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Cancel" })] }); }

function initializeAutomationDetailContent(): void {}
function initializeActionMenu(): void {}
function initializeAutomationActions(): void {}
function initializeWebhookTriggerList(): void {}
function initializeAutomationActionBar(): void {}
function initializeLinkedAutomationSites(): void {}
function initializeAutomationEditor(): void {}

void import("@rchunk/automation-share-dialog");
export { initializeAutomationDetailContent as a, WebhookTriggerList as c, initializeAutomationActions as d, LinkedAutomationSites as f, initializeActionMenu as h, AutomationDetailShell as i, initializeWebhookTriggerList as l, AutomationActionMenu as m, initializeAutomationEditor as n, AutomationActionBar as o, initializeLinkedAutomationSites as p, AutomationDetailContent as r, initializeAutomationActionBar as s, AutomationEditor as t, AutomationActions as u };
