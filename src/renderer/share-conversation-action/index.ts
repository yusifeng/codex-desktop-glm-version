import "@rchunk/rolldown-runtime";
import { rZ as createDerivedState } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export interface ConversationAction { action_v2: { action_enum: string; conversation_id?: string; current_node_id?: string; items?: ConversationAction[]; model_slug?: string; title?: string; update_model_picker?: boolean } }
export interface ActionScope { get(key: unknown, parameter: unknown): unknown }
export type ActionOverride = (action: ConversationAction) => boolean | Promise<boolean>;
export interface RegenerateServices { getCurrentMessageId(scope: ActionScope, conversationId: string): string | null; getConversationModel(scope: ActionScope, conversationId: string): unknown; getMessage(scope: ActionScope, conversationId: string, messageId: string): { message: unknown } | null; resolveModel(model: unknown, slug?: string): unknown; retry(input: { conversationId: string; isTemporaryChat?: boolean; messageId: string; model: unknown }): Promise<void>; updateModel?(scope: ActionScope, conversationId: string, model: unknown): void }

function createRegenerateActionOverride(input: { allowedModelSlug?: string | null; conversationId: string; isTemporaryChat?: boolean; scope: ActionScope; services?: RegenerateServices }): ActionOverride {
  return async action => {
    const target = action.action_v2;
    if (target.action_enum !== "regenerate" || (input.allowedModelSlug != null && target.model_slug !== input.allowedModelSlug) || !input.services) return false;
    const messageId = input.services.getCurrentMessageId(input.scope, input.conversationId); if (!messageId) return false;
    const message = input.services.getMessage(input.scope, input.conversationId, messageId); if (!message) return false;
    const model = input.services.resolveModel(input.services.getConversationModel(input.scope, input.conversationId), target.model_slug);
    if (target.update_model_picker) input.services.updateModel?.(input.scope, input.conversationId, model);
    await input.services.retry({ conversationId: input.conversationId, isTemporaryChat: input.isTemporaryChat, messageId, model });
    return true;
  };
}
function createShareConversationOverride(input: { canShare: boolean; conversationId?: string | null; onShare?(scope: ActionScope, conversationId: string, title: string | undefined, currentNodeId: string): boolean | Promise<boolean>; scope: ActionScope }): ActionOverride | undefined {
  if (!input.canShare || input.conversationId == null) return undefined;
  return action => { const target = action.action_v2, nodeId = target.current_node_id?.trim() ?? ""; return target.action_enum !== "share_conversation" || target.conversation_id !== input.conversationId || nodeId.length === 0 ? false : input.onShare?.(input.scope, input.conversationId, target.title, nodeId) ?? false; };
}
function containsShareConversation(actions: ConversationAction[]): boolean { return actions.some(action => action.action_v2.action_enum === "share_conversation" || action.action_v2.action_enum === "dropdown" && (action.action_v2.items ?? []).some(item => item.action_v2.action_enum === "share_conversation")); }
const SHARE_ACTION_PENDING = Symbol("share-action-pending"), SHARE_ACTION_UNAVAILABLE = Symbol("share-action-unavailable");
function resolveConversationActionOverride(input: { action: ConversationAction; getActionOverride?(action: ConversationAction): unknown; shareConversationEligible?: boolean | null; shareConversationOverride?: ActionOverride }): unknown { return input.action.action_v2.action_enum === "share_conversation" ? input.shareConversationEligible == null ? SHARE_ACTION_PENDING : input.shareConversationEligible && input.shareConversationOverride ? input.shareConversationOverride : SHARE_ACTION_UNAVAILABLE : input.getActionOverride?.(input.action); }
const shareConversationEligibility = createDerivedState({} as never, () => undefined);
function initializeShareConversationAction(): void { void shareConversationEligibility; }
function initializeRegenerateAction(): void {}
export { initializeShareConversationAction as a, containsShareConversation as i, createShareConversationOverride as n, createRegenerateActionOverride as o, resolveConversationActionOverride as r, initializeRegenerateAction as s, shareConversationEligibility as t };
