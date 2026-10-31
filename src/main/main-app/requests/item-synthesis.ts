// Approval, elicitation and dynamic-tool response owner (original M_e…W_e).
import { cr as sameConnector, ed as requestIdOf, lr as parseElicitation, ur as isElicitationApprovalSafe } from "@chunk/shared";
import { forEachTurn } from "../turns/canonical-history";
import { buildOnboardingToolResponse } from "../tools/dynamic-app-tools";

type R = Record<string, any>;
export interface ApprovalActionContext extends R {
  logger: R; hostId: string; conversations: Map<string, R>;
  getStreamRole(id: string): R | null;
  getConversationRequest(id: string, requestId: string): R | null;
  getConversationRequests(id: string): R[];
  removeConversationRequest(id: string, requestId: string): void;
  dispatchAppServerResponse(method: string, response: R): void;
  approvalResolved(id: string, requestId: string): void;
}
const IMPLEMENT_PLAN_METHOD = "item/plan/requestImplementation";
const isImplementPlanRequest = (request: R) => request.method === IMPLEMENT_PLAN_METHOD;
function ownerClientId(context: ApprovalActionContext, id: string): string | null {
  const role = context.getStreamRole(id);
  return role?.role === "follower" ? role.ownerClientId : null;
}
function logForwardFailure(logger: R, message: string, id: string, error: unknown): void {
  logger[error instanceof Error && error.message === "client-coordination-service-unavailable" ? "warning" : "error"](
    message, { safe: { conversationId: id }, sensitive: { error } },
  );
}
function resolveApproval(context: ApprovalActionContext, id: string, requestId: string, method: string, decision: unknown): void {
  const request = context.getConversationRequest(id, requestId);
  if (request == null) return;
  if (request.method !== method) {
    context.logger.error("Unexpected approval request method", { safe: { method: request.method }, sensitive: {} });
    return;
  }
  const response = { id: requestId, result: { decision } };
  context.logger.info("Sending server response", { safe: {}, sensitive: { id: requestId, method: request.method, response: response.result } });
  context.dispatchAppServerResponse(request.method, response);
  context.approvalResolved(id, requestId);
  context.removeConversationRequest(id, requestId);
}
export function M_e(context: ApprovalActionContext, id: string, requestId: string, decision: unknown): void {
  const owner = ownerClientId(context, id);
  if (owner != null) {
    context.forwardFollowerCommandApproval(id, requestId, decision, owner).catch((error: unknown) =>
      logForwardFailure(context.logger, "Failed to forward command approval decision", id, error));
  } else resolveApproval(context, id, requestId, "item/commandExecution/requestApproval", decision);
}
export function N_e(context: ApprovalActionContext, id: string, requestId: string, decision: unknown): void {
  const owner = ownerClientId(context, id);
  if (owner != null) {
    context.forwardFollowerFileApproval(id, requestId, decision, owner).catch((error: unknown) =>
      logForwardFailure(context.logger, "Failed to forward file approval decision", id, error));
  } else resolveApproval(context, id, requestId, "item/fileChange/requestApproval", decision);
}
export function P_e(context: ApprovalActionContext, id: string, requestId: string, response: unknown): void {
  const owner = ownerClientId(context, id);
  if (owner != null) {
    context.forwardFollowerPermissionsApproval(id, requestId, response, owner).catch((error: unknown) =>
      logForwardFailure(context.logger, "Failed to forward permissions approval response", id, error));
    return;
  }
  const request = context.getConversationRequest(id, requestId);
  if (request == null) return;
  if (request.method !== "item/permissions/requestApproval") {
    context.logger.error("Unexpected approval request method", { safe: { method: request.method }, sensitive: {} });
    return;
  }
  context.logger.info("Sending server response", { safe: {}, sensitive: { id: requestId, method: request.method, response } });
  context.dispatchAppServerResponse(request.method, { id: requestId, result: response });
  context.approvalResolved(id, requestId);
  context.applyPermissionsRequestApprovalResponse(id, requestId, request.params, response);
  context.removeConversationRequest(id, requestId);
}
export function F_e(context: ApprovalActionContext, id: string, requestId: string, response: R): void {
  const owner = ownerClientId(context, id);
  if (owner != null) {
    context.forwardFollowerUserInput(id, requestId, response, owner).catch((error: unknown) =>
      logForwardFailure(context.logger, "Failed to forward user-input response", id, error));
    return;
  }
  const request = context.getConversationRequest(id, requestId);
  if (request == null) return;
  if (request.method !== "item/tool/requestUserInput") {
    context.logger.error("Unexpected user input request method", { safe: { method: request.method }, sensitive: {} });
    return;
  }
  const answers: Record<string, unknown[]> = {};
  for (const [questionId, answer] of Object.entries(response.answers ?? {}))
    if (answer != null) answers[questionId] = [...(answer as R).answers];
  context.logger.info("Sending server response", { safe: {}, sensitive: { id: requestId, method: request.method, response } });
  context.dispatchAppServerResponse(request.method, { id: requestId, result: response });
  context.applyUserInputResponse(id, requestId, request.params, answers);
}
function elicitationItem(requestId: string, params: R, completed: boolean, action: unknown): R | null {
  return params.turnId == null || params.turnId.length === 0 ? null : {
    id: `mcp-server-elicitation-${requestId}`, type: "mcpServerElicitation", requestId,
    turnId: params.turnId, params: params.mode === "openai/userVerification" ? { ...params, challenge: "" } : params,
    completed, action,
  };
}
export const Xv = elicitationItem;
export function Gv(context: ApprovalActionContext, id: string, requestId: string, response: R): void {
  const requests = context.getConversationRequests(id);
  const request = requests.find((entry) => entry.id === requestId);
  if (request == null) return;
  if (request.method !== "mcpServer/elicitation/request") {
    context.logger.error("Unexpected MCP server elicitation request method", { safe: { method: request.method }, sensitive: {} });
    return;
  }
  if (request.params.mode === "openai/userVerification" && response.action === "accept") return;
  if (response.action === "accept" && !context.isMcpServerElicitationApprovalSafe(request.params, response))
    throw Error("Unsafe MCP server elicitation approval");
  const owner = ownerClientId(context, id);
  if (owner != null) {
    context.forwardFollowerMcpElicitation(id, requestId, response, owner).catch((error: unknown) =>
      logForwardFailure(context.logger, "Failed to forward MCP server elicitation response", id, error));
    return;
  }
  const equivalent = context.getEquivalentConnectorAuthRequests(request, requests);
  for (const entry of equivalent)
    if (response.action === "accept" && !context.isMcpServerElicitationApprovalSafe(entry.params, response))
      throw Error("Unsafe MCP server elicitation approval");
  for (const entry of equivalent) {
    const currentId = requestIdOf(entry.id);
    context.logger.info("Sending server response", { safe: {}, sensitive: { id: currentId, method: entry.method, response } });
    context.dispatchAppServerResponse(entry.method, { id: currentId, result: response });
    if (currentId === requestId) context.applyMcpServerElicitationResponse(id, currentId, entry.params, response.action);
    else context.discardMcpServerElicitation(id, currentId, entry.params.turnId);
  }
}
function upsertTurnItem(state: R, turnId: string | null, item: R): void {
  let target: R | null = null;
  forEachTurn(state as never, (turn: R) => { if (target == null && (turnId == null || turn.turnId === turnId)) target = turn; });
  if (target == null) return;
  target.items ??= [];
  const index = target.items.findIndex((entry: R) => entry?.id === item.id);
  if (index < 0) target.items.push(item); else target.items[index] = item;
}
export function B_e(options: R): ApprovalActionContext {
  function forward(method: string, valueKey: string) {
    return async (id: string, requestId: string, value: unknown, owner: string) => {
      if (options.ipcBridge == null) throw Error("client-coordination-service-unavailable");
      const response = await options.ipcBridge.request(method, { conversationId: id, requestId, [valueKey]: value }, { targetClientId: owner });
      if (response.resultType === "error") throw Error(response.error);
    };
  }
  return {
    logger: options.logger, hostId: options.hostId, approvalResolved: options.approvalResolved,
    dispatchAppServerResponse: options.dispatchAppServerResponse, getStreamRole: options.getStreamRole,
    conversations: options.conversations,
    getEquivalentConnectorAuthRequests(request: R, requests: R[]) {
      const parsed = parseElicitation(request.params, true, options.parseUrl);
      if (parsed?.kind !== "connectorAuth" || parsed.connector.connection_consent != null) return [request];
      return requests.filter((entry) => {
        if (entry.method !== "mcpServer/elicitation/request") return false;
        const candidate = parseElicitation(entry.params, true, options.parseUrl);
        return candidate?.kind === "connectorAuth" && sameConnector(parsed.connector, candidate.connector);
      });
    },
    isMcpServerElicitationApprovalSafe: isElicitationApprovalSafe,
    forwardFollowerCommandApproval: forward("thread-follower-command-approval-decision", "decision"),
    forwardFollowerFileApproval: forward("thread-follower-file-approval-decision", "decision"),
    forwardFollowerPermissionsApproval: forward("thread-follower-permissions-request-approval-response", "response"),
    forwardFollowerUserInput: forward("thread-follower-submit-user-input", "response"),
    forwardFollowerMcpElicitation: forward("thread-follower-submit-mcp-server-elicitation-response", "response"),
    getConversationRequest(id: string, requestId: string) {
      if (options.getStreamRole(id)?.role === "follower") throw Error("Please continue this conversation on the window where it was started.");
      const conversation = options.conversations.get(id);
      if (conversation == null) {
        options.logger.error("Conversation state not found", { safe: { conversationId: id }, sensitive: {} }); return null;
      }
      const request = conversation.requests.find((entry: R) => entry.id === requestId && !isImplementPlanRequest(entry));
      if (request == null) options.logger.error("Request not found", { safe: { requestId }, sensitive: {} });
      return request ?? null;
    },
    getConversationRequests(id: string) {
      return options.conversations.get(id)?.requests.filter((entry: R) => !isImplementPlanRequest(entry)) ?? [];
    },
    removeConversationRequest(id: string, requestId: string) {
      options.updateConversationState(id, (state: R) => { state.requests = state.requests.filter((entry: R) => entry.id !== requestId); });
    },
    applyUserInputResponse(id: string, requestId: string, params: R, answers: R) {
      options.updateConversationState(id, (state: R) => {
        upsertTurnItem(state, params.turnId, {
          id: `user-input-response-${requestId}`, type: "userInputResponse", requestId, turnId: params.turnId,
          questions: params.questions.map((question: R) => ({ id: question.id, header: question.header,
            options: (question.options ?? []).map((option: R) => ({ description: option.description, label: option.label })), question: question.question })),
          answers, completed: true,
        });
        state.requests = state.requests.filter((entry: R) => entry.id !== requestId);
      });
    },
    applyMcpServerElicitationResponse(id: string, requestId: string, params: R, action: unknown) {
      options.updateConversationState(id, (state: R) => {
        const item = elicitationItem(requestId, params, true, action); if (item != null) upsertTurnItem(state, params.turnId, item);
        state.requests = state.requests.filter((entry: R) => entry.id !== requestId);
      });
    },
    discardMcpServerElicitation(id: string, requestId: string, turnId: string) {
      options.updateConversationState(id, (state: R) => {
        forEachTurn(state as never, (turn: R) => { if (turn.turnId === turnId) turn.items = turn.items.filter((item: R) => item?.type !== "mcpServerElicitation" || item.requestId !== requestId); });
        state.requests = state.requests.filter((entry: R) => entry.id !== requestId);
      });
    },
    applyPermissionsRequestApprovalResponse(id: string, requestId: string, params: R, response: unknown) {
      options.updateConversationState(id, (state: R) => upsertTurnItem(state, params.turnId, {
        id: `permission-request-${requestId}`, type: "permissionRequest", requestId, turnId: params.turnId,
        reason: params.reason, permissions: params.permissions, completed: true, response,
      }));
    },
  } as ApprovalActionContext;
}
export function V_e(context: R, build: (action: "decline") => unknown, id: string, state: R | null): void {
  for (const request of state?.requests.map(({ id, method }: R) => ({ id, method })) ?? []) {
    const requestId = requestIdOf(request.id);
    if (request.method === "item/commandExecution/requestApproval") context.replyWithCommandExecutionApprovalDecision(id, requestId, "decline");
    else if (request.method === "item/fileChange/requestApproval") context.replyWithFileChangeApprovalDecision(id, requestId, "decline");
    else if (request.method === "item/permissions/requestApproval") context.replyWithPermissionsRequestApprovalResponse(id, requestId, { permissions: {}, scope: "turn" });
    else if (request.method === "item/tool/requestUserInput") context.replyWithUserInputResponse(id, requestId, { answers: {} });
    else if (request.method === "item/tool/requestOptionPicker") context.replyWithOptionPickerResponse(id, requestId, { action: "dismiss", selectedOptions: [], freeformAnswer: null });
    else if (request.method === "mcpServer/elicitation/request") context.replyWithMcpServerElicitationResponse(id, requestId, build("decline"));
  }
}
export function ey(manager: R, id: string, requestId: string): R | null {
  const request = manager.getConversation(id)?.requests.find((entry: R) => entry.id === requestId);
  return request?.method === "item/tool/call" ? request.params : null;
}
export function H_e(manager: R, buffer: R, deferral: R, id: string, requestId: string): void {
  buffer.discardDynamicToolRequest(id, requestId); deferral.discardDynamicToolRequest(id, requestId);
  if (manager.getConversation(id) != null) manager.updateConversationState(id, (state: R) => {
    state.requests = state.requests.filter((entry: R) => entry.method !== "item/tool/call" || entry.id !== requestId);
  });
}
export function W_e(manager: R, dispatch: (method: string, response: unknown) => void, id: string, requestId: string, result: unknown): boolean {
  const params = ey(manager, id, requestId); if (params == null) return false;
  const response = typeof result === "function" ? result(params) : result; if (response == null) return false;
  dispatch("item/tool/call", { id: requestId, result: response });
  manager.updateConversationState(id, (state: R) => { state.requests = state.requests.filter((entry: R) => entry.method !== "item/tool/call" || entry.id !== requestId); });
  return true;
}
export function U_e(manager: R, dispatch: (method: string, response: unknown) => void, id: string, requestId: string, response: unknown): void {
  if (W_e(manager, dispatch, id, requestId, (params: R) => params.tool === "request_option_picker" ? buildOnboardingToolResponse(response) : null)) return;
  const request = manager.getConversation(id)?.requests.find((entry: R) => entry.id === requestId);
  if (request?.method === "item/tool/requestOptionPicker") {
    dispatch(request.method, { id: requestId, result: response });
    manager.updateConversationState(id, (state: R) => { state.requests = state.requests.filter((entry: R) => entry.id !== requestId); });
  }
}
export const buildApprovalActionContext=B_e, replyWithCommandExecutionApprovalDecision=M_e,
  replyWithFileChangeApprovalDecision=N_e, replyWithPermissionsRequestApprovalResponse=P_e,
  replyWithUserInputResponse=F_e, replyWithOptionPickerResponse=U_e, replyWithDynamicToolResponse=W_e,
  getDynamicToolRequest=ey, removePendingDynamicToolRequest=H_e,
  replyWithMcpServerElicitationResponse=Gv, buildMcpServerElicitationItem=Xv,
  markInterruptedCommandExecutions=V_e;
