import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
export interface ToolApprovalAction { target_message_id: string; type: string; [key: string]: unknown }
export interface RespondOptions { action: ToolApprovalAction; conversationId: string; elicitationResponse?: unknown; isApiToolElicitation?: boolean; isTemporaryChat?: boolean; model?: string; recipient?: string }
export interface RespondScope { submit(input: Record<string, unknown>): Promise<unknown> | unknown }
async function respondToToolRequest(scope: RespondScope, options: RespondOptions): Promise<void> { await scope.submit({ conversationId: options.conversationId, isTemporaryChat: options.isTemporaryChat, model: options.model, prompt: "", toolApproval: { action: options.action.type, actionData: options.action, elicitationResponse: options.elicitationResponse, isApiToolElicitation: options.isApiToolElicitation, recipient: options.recipient, targetMessageId: options.action.target_message_id } }); }
function initializeRespond(): void {}
export { respondToToolRequest as n, initializeRespond as t };
