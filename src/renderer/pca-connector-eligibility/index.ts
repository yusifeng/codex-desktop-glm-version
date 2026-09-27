import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

type ActionStatus = "pending" | "supported" | "unavailable" | "unsupported";
interface BeaconAction { action_v2: { action_enum?: string; connector_id?: string; copy_text?: string; items?: BeaconAction[]; [key: string]: unknown }; description?: string | null; id: string; label?: string | null; type?: string }
interface ActionContext extends Record<string, unknown> { getHandlerStatus?(action: BeaconAction): Exclude<ActionStatus, "unsupported"> | "missing"; supportedActionEnums?: readonly string[] }
interface SupportResult { diagnostic?: { actionEnum: string; actionId: string; reason: string }; status: ActionStatus }
interface ActionSupportInput { actionItems: readonly BeaconAction[]; context: ActionContext; referencedActionIds?: string[]; variant: "banner" | "carousel" | "inline" | "modal" | "takeover" }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function hasLabel(action: BeaconAction): boolean { return typeof action.label === "string" && action.label.trim() !== ""; }
function unsupported(action: BeaconAction, reason: string): SupportResult { return { status: "unsupported", diagnostic: { actionEnum: action.action_v2.action_enum ?? "unknown", actionId: action.id, reason } }; }
function actionSupport(action: BeaconAction, context: ActionContext, variant: ActionSupportInput["variant"], nested: boolean, referenced = false): SupportResult {
  if (!referenced && !hasLabel(action)) return unsupported(action, "missing_label");
  if (action.action_v2.action_enum === "dropdown") {
    if (nested) return unsupported(action, "nested_dropdown");
    if (variant === "inline" || variant === "takeover") return unsupported(action, "unsupported_dropdown");
    const items = action.action_v2.items ?? [];
    if (items.length === 0) return unsupported(action, "empty_dropdown");
    return aggregate(items.map(item => actionSupport(item, context, variant, true)));
  }
  const handlerStatus = context.getHandlerStatus?.(action) ?? (context.supportedActionEnums?.includes(action.action_v2.action_enum ?? "") ? "supported" : "missing");
  return handlerStatus === "missing" ? unsupported(action, "missing_handler") : { status: handlerStatus };
}
function aggregate(results: SupportResult[]): SupportResult { const unsupportedResult = results.find(result => result.status === "unsupported"); if (unsupportedResult != null) return unsupportedResult; if (results.some(result => result.status === "pending")) return { status: "pending" }; if (results.some(result => result.status === "unavailable")) return { status: "unavailable" }; return { status: "supported" }; }
function i({ actionItems, context, referencedActionIds, variant }: ActionSupportInput): SupportResult {
  if (variant === "takeover") {
    if ((actionItems.length !== 1 && actionItems.length !== 2) || actionItems[0]?.type !== "primary" || (actionItems.length === 2 && actionItems[1]?.type !== "secondary")) return { status: "unsupported", diagnostic: { actionEnum: "unknown", actionId: actionItems[0]?.id ?? "unknown", reason: "invalid_takeover_actions" } };
    return aggregate(actionItems.map(action => actionSupport(action, context, variant, false)));
  }
  if (referencedActionIds != null) {
    const resolved = referencedActionIds.map(id => actionItems.find(action => action.id === id));
    const missing = resolved.findIndex(action => action == null);
    if (missing >= 0) return { status: "unsupported", diagnostic: { actionEnum: "unknown", actionId: referencedActionIds[missing] ?? "unknown", reason: "missing_referenced_action" } };
    return aggregate(resolved.map(action => actionSupport(action as BeaconAction, context, variant, false, true)));
  }
  const limited = variant === "inline" ? actionItems.slice(0, 3) : actionItems;
  if (variant === "inline") return aggregate(limited.map(action => actionSupport(action, context, variant, false)));
  const copy = limited.find(action => action.type === "copy" && action.action_v2.action_enum === "copy_to_clipboard");
  if (copy != null) return actionSupport(copy, context, variant, false);
  const dropdown = limited.find(action => action.action_v2.action_enum === "dropdown");
  return aggregate((dropdown == null ? limited : [dropdown]).map(action => actionSupport(action, context, variant, false)));
}
function t(actions: readonly BeaconAction[]): string[] { const ids = actions.flatMap(action => action.action_v2.action_enum === "open_pca_connector_auth_modal" && action.action_v2.connector_id != null ? [action.action_v2.connector_id] : action.action_v2.action_enum === "dropdown" ? t(action.action_v2.items ?? []) : []); return [...new Set(ids)].sort(); }
const r = { getOptions(connectorIds: readonly string[], context: { fetchConnector(id: string): Promise<{ authType?: string; status?: string }> }) { return { enabled: connectorIds.length > 0, queryKey: ["chatgpt-beacon", "pca-connector-eligibility", connectorIds], retry: false, staleTime: 300_000, async queryFn() { const results = await Promise.all(connectorIds.map(id => context.fetchConnector(id))); return new Set(connectorIds.filter((_, index) => { const connector = results[index]; return connector != null && connector.status !== "DISABLED_BY_ADMIN" && connector.authType !== "UNSUPPORTED"; })); } }; } };
function c({ actionItems, fallback = null, onActionComplete, variant }: { actionItems: BeaconAction[]; fallback?: unknown; onActionComplete?(action: BeaconAction): void; variant: ActionSupportInput["variant"] }): unknown { const supported = actionItems.filter(hasLabel); if (supported.length === 0) return fallback; return jsx().jsx("div", { "data-pca-actions": variant, children: supported.map(action => jsx().jsx("button", { onClick: () => onActionComplete?.(action), type: "button", children: action.label }, action.id)) }); }
function u(options: { isAccountPending?: boolean; isWorkspaceMemoryLoading?: boolean; onMemoryUpdateError?(): void; onMemoryUpdateSuccess?(message: string): void; trustedAccountId?: string | null; userId?: string | null }) { return (action: BeaconAction) => { const actionEnum = action.action_v2.action_enum; if (actionEnum === "request_premium_seat" || actionEnum === "request_workspace_upgrade_seat") return options.isAccountPending ? "pending" : options.trustedAccountId != null && options.userId != null ? "supported" : "unavailable"; if (actionEnum === "update_user_personalization_setting") return options.isWorkspaceMemoryLoading ? "pending" : options.trustedAccountId == null ? "unavailable" : "supported"; return undefined; }; }
async function o(props: Record<string, unknown>): Promise<unknown> { const { CodexAppHomeBeaconConnectModal } = await import("@rchunk/codex-app-home-beacon-connect-modal"); return CodexAppHomeBeaconConnectModal(props as { connectorId: string; onOpenChange(open: boolean): void; pcaResumeTarget?: unknown }); }
function a(): void {}
function d(): void {}
function l(): void {}
function n(): void {}
function s(): void {}
export { a, c, d, i, l, n, o, r, s, t, u };
