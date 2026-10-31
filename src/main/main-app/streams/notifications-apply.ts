import { $u as normalizeThreadId, ed as requestIdOf, Zo as errorToString } from "@chunk/shared";
import { conversationTurns, findTurnById, findTurnEntryForEvent, forEachTurn, lastTurnWithTurnId, mergedConversationTurns, timelineEntryKey } from "../turns/canonical-history";
import { applyThreadSettingsUpdate } from "../threads/patch-classification";
import { Qv as applyPermissionsResolution, Yv as planImplementationId, Zv as applyMcpElicitationResolution } from "../requests/item-synthesis";
import { parseAutomationUserMessage, parseHeartbeatDecision } from "../threads/automation-detector";
import { activeAncestryIds } from "../threads/hydration";
import { normalizeImageGenerationItem } from "../threads/hydration";
import { acceptServerUserMessage, isSteeringUserMessage, recoverSteeringOrphans, upsertItem } from "../turns/steering-merge";
import { freezeIdentity } from "../vendor/immer";

type R=Record<string,unknown>;const rec=(v:unknown):R=>typeof v===`object`&&v!==null?v as R:{};const fn=(v:unknown,n:string)=>(rec(v)[n] as (((...a:unknown[])=>unknown)|undefined));
function update(manager:unknown,id:string,callback:(state:R)=>void){fn(manager,`updateConversationState`)?.(id,callback)} function append(state:R,item:unknown){const turns=state.turns;if(Array.isArray(turns)&&turns.length>0){const turn=rec(turns[turns.length-1]);const items=Array.isArray(turn.items)?turn.items:[];turn.items=[...items,item]}}
export function Fy(manager:unknown,id:string,item:unknown,_options?:unknown,_history?:unknown):void{update(manager,id,state=>append(state,item))}
export function Iy(manager:unknown,id:string,sourceId:string,title:unknown,history:unknown):void{update(manager,id,state=>append(state,{id:fn(history,`createSearchIslandId`)?.()??`fork-${sourceId}`,type:`forkedFromConversation`,sourceConversationId:sourceId,sourceConversationTitle:title}))}
export function Ly(manager:unknown,id:string,taskId:string,history:unknown):void{update(manager,id,state=>append(state,{id:fn(history,`createSearchIslandId`)?.()??`task-${taskId}`,type:`remoteTaskCreated`,taskId}))}
export function Ry(manager:unknown,id:string,item:unknown,history:unknown,mode:`latest-turn`|`new-turn`=`latest-turn`):void{const value={...rec(item),type:`worktreeInit`};update(manager,id,state=>{if(mode===`new-turn`){const turns=Array.isArray(state.turns)?state.turns:[];state.turns=[...turns,{turnId:fn(history,`createSearchIslandId`)?.()??`worktree-init`,status:`inProgress`,items:[value]}]}else append(state,value)})}
export function zy(manager:unknown,id:string,turnId:string):void{update(manager,id,state=>{if(Array.isArray(state.requests))state.requests=state.requests.filter(x=>!(rec(x).method===`item/plan/requestImplementation`&&rec(rec(x).params).turnId===turnId))})}
function goalAllowsConfirmation(status: unknown): boolean {
  return status === "paused" || status === "blocked" || status === "usageLimited";
}
function applyThreadNotification(context: any, notification: { method: string; params: any }): void {
  const { manager, notificationContext } = context;
  const { method, params } = notification;
  switch (method) {
    case "thread/environment/connected":
    case "thread/environment/disconnected": {
      const conversationId = normalizeThreadId(params.threadId);
      manager.getConversation(conversationId);
      manager.logger.info("VM lifecycle", {
        safe: { vmEvent: method === "thread/environment/connected" ? "environment_connected" : "environment_disconnected", vmProduct: "unknown", threadId: params.threadId, environmentId: params.environmentId },
        sensitive: { hostId: manager.getHostId() },
      });
      if (params.environmentId === "managed") return;
      manager.updateConversationState(conversationId, (state: any) => {
        if (method === "thread/environment/connected") {
          if (!state.connectedEnvironmentIds?.includes(params.environmentId))
            state.connectedEnvironmentIds = [...(state.connectedEnvironmentIds ?? []), params.environmentId];
        } else state.connectedEnvironmentIds = state.connectedEnvironmentIds?.filter((id: string) => id !== params.environmentId);
      });
      return;
    }
    case "thread/started": {
      const conversationId = notificationContext.upsertConversationFromThread(params.thread, "live");
      notificationContext.threadStore.recordThreadRuntimeStatusEvidence(params.thread.id, params.thread.status);
      manager.broadcastConversationSnapshot(conversationId);
      return;
    }
    case "thread/name/updated": {
      const title = params.threadName?.trim() ?? "";
      if (title.length > 0) notificationContext.threadStore.applyThreadTitleUpdate(params.threadId, title);
      return;
    }
    case "thread/settings/updated": {
      const conversationId = normalizeThreadId(params.threadId);
      if (notificationContext.threadStore.conversations.has(conversationId))
        manager.updateConversationState(conversationId, (state: any) => applyThreadSettingsUpdate(state, params.threadSettings));
      return;
    }
    case "thread/status/changed": {
      const status = params.status;
      if (!status) {
        manager.logger.warning("Invalid thread/status/changed notification payload", { safe: {}, sensitive: { params } });
        return;
      }
      const conversationId = normalizeThreadId(params.threadId);
      if (!notificationContext.threadStore.conversations.has(conversationId)) {
        const changed = notificationContext.threadStore.recordThreadRuntimeStatusEvidence(params.threadId, status);
        if (status.type === "active" && changed) notificationContext.threadStore.hydrateActiveThread(params.threadId);
        return;
      }
      manager.updateConversationState(conversationId, (state: any) => { state.threadRuntimeStatus = status; });
      notificationContext.threadStore.recordThreadRuntimeStatusEvidence(params.threadId, status);
      return;
    }
    case "thread/goal/updated": {
      const conversationId = normalizeThreadId(params.threadId);
      const conversation = manager.getConversation(conversationId);
      const shouldClear = params.goal.status === "complete" && conversation != null && conversation.completedThreadGoal?.updatedAt !== params.goal.updatedAt;
      manager.updateConversationState(conversationId, (state: any) => {
        state.threadGoal = params.goal;
        state.completedThreadGoal = params.goal.status === "complete" ? params.goal : null;
        if (!goalAllowsConfirmation(params.goal.status)) state.threadGoalResumeConfirmation = null;
      });
      if (shouldClear) manager.sendRequest("thread/goal/clear", { threadId: conversationId }).catch((error: unknown) =>
        manager.logger.error("Failed to clear completed thread goal", { safe: { conversationId }, sensitive: { error } }));
      return;
    }
    case "thread/goal/cleared": {
      manager.updateConversationState(normalizeThreadId(params.threadId), (state: any) => {
        state.threadGoal = null; state.threadGoalResumeConfirmation = null;
      });
      return;
    }
    case "thread/archived": notificationContext.handleThreadArchived(normalizeThreadId(params.threadId)); return;
    case "thread/deleted": notificationContext.handleThreadDeletion([params.threadId]); return;
    case "thread/unarchived": notificationContext.handleThreadUnarchived(normalizeThreadId(params.threadId)); return;
    case "thread/tokenUsage/updated":
      manager.updateConversationState(normalizeThreadId(params.threadId), (state: any) => { state.latestTokenUsageInfo = params.tokenUsage; });
  }
}
const THREAD_NOTIFICATION_METHODS = new Set([
  "thread/started", "thread/environment/connected", "thread/environment/disconnected", "thread/name/updated",
  "thread/settings/updated", "thread/status/changed", "thread/goal/updated", "thread/goal/cleared",
  "thread/archived", "thread/deleted", "thread/unarchived", "thread/tokenUsage/updated",
]);
const ITEM_STREAM_METHODS = new Set([
  "item/agentMessage/delta", "item/plan/delta", "item/reasoning/summaryTextDelta", "item/reasoning/summaryPartAdded",
  "item/reasoning/textDelta", "item/commandExecution/outputDelta", "item/commandExecution/terminalInteraction",
  "item/fileChange/patchUpdated",
]);
const TURN_NOTIFICATION_METHODS = new Set([
  "turn/started", "turn/diff/updated", "turn/plan/updated", "model/safetyBuffering/updated",
  "hook/started", "hook/completed", "model/rerouted", "error",
]);
function applyTurnNotification(context: any, notification: { method: string; params: any }): void {
  const { manager, notificationContext, createId } = context;
  const { method, params } = notification;
  const conversationId = normalizeThreadId(params.threadId);
  if (method === "turn/started") {
    const conversation = notificationContext.threadStore.conversations.get(conversationId);
    if (conversation == null) {
      manager.logger.error("Received turn/started for unknown conversation", { safe: { conversationId }, sensitive: {} });
      return;
    }
    manager.updateTurnState(conversationId, params.turn.id, (turn: any) => {
      if (turn.status !== "inProgress") return;
      turn.turnId = params.turn.id;
      turn.turnStartedAtMs ??= Date.now();
      turn.durationMs = params.turn.durationMs;
      turn.status = params.turn.status;
      turn.error = params.turn.error;
    }, { rebindLatestInProgressPlaceholder: true, synthesizeMissingTurn: true });
    manager.updateConversationState(conversationId, (state: any) => {
      const turn = findTurnById(state, params.turn.id);
      if (turn != null && lastTurnWithTurnId(state) === turn) {
        state.latestModel = turn.params?.model ?? state.latestModel;
        state.latestReasoningEffort = turn.params?.effort ?? state.latestReasoningEffort;
        state.latestCollaborationMode = turn.params?.collaborationMode ?? state.latestCollaborationMode;
      }
      forEachTurn(state, (entry: any) => {
        for (const item of entry.items ?? [])
          if (item.type === "planImplementation" && "turnId" in item && "isCompleted" in item && item.turnId !== params.turn.id)
            item.isCompleted = true;
      });
      state.requests = state.requests.filter((request: any) => request.method !== "item/plan/requestImplementation" || request.params.turnId === params.turn.id);
    });
    manager.broadcastConversationSnapshot(conversationId);
    return;
  }
  if ((method === "hook/started" || method === "hook/completed") && !notificationContext.threadStore.conversations.has(conversationId)) {
    manager.logger.error(`Received ${method} for unknown conversation`, { safe: { conversationId } });
    return;
  }
  manager.updateTurnState(conversationId, params.turnId, (turn: any) => {
    if (method === "turn/diff/updated") turn.diff = params.diff;
    else if (method === "turn/plan/updated") turn.items.push({ id: createId(), type: "todo-list", explanation: params.explanation ?? null, plan: params.plan });
    else if (method === "model/safetyBuffering/updated") {
      const { threadId: _threadId, turnId: _turnId, model: _model, ...safetyBuffering } = params;
      turn.safetyBuffering = safetyBuffering;
    } else if (method === "model/rerouted")
      turn.items.push({ id: createId(), type: "modelRerouted", fromModel: params.fromModel, toModel: params.toModel, reason: params.reason });
    else if (method === "error")
      turn.items.push({ id: createId(), type: "error", message: params.error.message, willRetry: params.willRetry,
        errorInfo: params.error.codexErrorInfo, additionalDetails: params.error.additionalDetails ?? null });
    else {
      const runs = (turn.hookRuns ??= []);
      let index = -1;
      for (let cursor = runs.length - 1; cursor >= 0; cursor -= 1) {
        const current = runs[cursor]?.run;
        if (current?.id === params.run.id && (current.status === "running" || (params.run.completedAt != null && current.completedAt === params.run.completedAt))) { index = cursor; break; }
      }
      if (index >= 0) runs[index] = { id: runs[index].id, run: params.run };
      else {
        const count = runs.filter((entry: any) => entry.run.id === params.run.id).length;
        runs.push({ id: count === 0 ? params.run.id : `${params.run.id}:${count}`, run: params.run });
      }
    }
  }, method === "hook/started" ? { rebindLatestInProgressPlaceholder: true } : undefined);
}
function applyServerRequestResolved(context: any, params: any): void {
  const { manager, notificationContext } = context;
  const conversationId = normalizeThreadId(params.threadId);
  const request = notificationContext.threadStore.conversations.get(conversationId)?.requests.find((entry: any) => entry.id === params.requestId);
  manager.updateConversationState(conversationId, (state: any) => {
    const requestId = requestIdOf(params.requestId);
    if (request?.method === "mcpServer/elicitation/request")
      applyMcpElicitationResolution(state, request.params, manager.getMcpServerElicitationItem(requestId, request.params, true, null), manager.logger);
    else if (request?.method === "item/permissions/requestApproval")
      applyPermissionsResolution(state, requestId, request.params, true, null, manager.logger);
    else if (request?.method === "item/tool/requestUserInput") {
      forEachTurn(state, (turn: any) => {
        if (turn.turnId !== request.params.turnId) return;
        const item = {
          id: `user-input-response-${requestId}`, type: "userInputResponse", requestId,
          turnId: request.params.turnId, questions: request.params.questions, answers: {}, completed: true,
        };
        const index = turn.items.findIndex((entry: any) => entry.id === item.id);
        if (index < 0) turn.items.push(item); else turn.items[index] = item;
      });
    }
    state.requests = state.requests.filter((entry: any) => entry.id !== params.requestId);
  });
}
function pendingContinuation(context: any, conversationId: string, status: string, hasRunnableQueuedFollowUp: boolean): boolean {
  const { manager, notificationContext } = context;
  const conversation = manager.getConversationOrThrow(conversationId);
  const turns = mergedConversationTurns(conversation, notificationContext.turnMergePolicy);
  return (conversation.unconfirmedTurnSubmissions?.length ?? 0) > 0 ||
    (status !== "interrupted" && hasRunnableQueuedFollowUp) ||
    (status === "completed" && conversation.threadGoal?.status === "active") ||
    turns.at(-1)?.status === "inProgress" ||
    activeAncestryIds(notificationContext.threadStore.getThreadSummaries(), notificationContext.threadStore.getCachedConversations()).has(conversationId);
}
function goalCanContinue(context: any, conversationId: string, conversation: any): boolean {
  const { manager, notificationContext } = context;
  const hasPendingSteering = mergedConversationTurns(conversation, notificationContext.turnMergePolicy).some((turn: any) =>
    turn.items.some((item: any) => item.type === "steeringUserMessage" && item.status === "pending"));
  return conversation.resumeState === "resumed" && conversation.threadGoal?.status === "active" &&
    conversation.requests.length === 0 && !hasPendingSteering && manager.getStreamRole(conversationId)?.role === "owner" &&
    manager.isConversationStreaming(conversationId);
}
function automationDecision(context: any, conversationId: string, turn: any, capability: any, lastAgentMessage: string | null) {
  const automationKind = capability?.automationKind ?? null;
  const parsed = lastAgentMessage == null ? null :
    (automationKind === "heartbeat" ? parseAutomationUserMessage(lastAgentMessage) : parseHeartbeatDecision(lastAgentMessage));
  let decision = parsed?.decision ?? null;
  if (decision == null && automationKind === "heartbeat" && turn.status === "completed" && !lastAgentMessage?.trim()) decision = "DONT_NOTIFY";
  if (capability?.notificationPolicy === "failed_runs_only") decision = turn.status === "completed" ? "DONT_NOTIFY" : "NOTIFY";
  const conversation = context.manager.getConversation(conversationId);
  const shouldMarkUnread = decision === "NOTIFY" || (decision !== "DONT_NOTIFY" &&
    (!context.supportsGoalContinuation || turn.status !== "completed" || conversation == null || !goalCanContinue(context, conversationId, conversation)));
  const head = context.readQueuedFollowUpHead(conversationId);
  return {
    decision,
    heartbeatAssistantMessage: parsed,
    shouldMarkUnread,
    hasRunnableQueuedFollowUp: head === undefined || (head != null && head.pausedReason == null),
  };
}
function applyTurnCompleted(context: any, notification: { params: any }, capability: any, shouldIgnore: boolean): "deferred" | "handled" {
  const { manager, notificationContext } = context;
  if (notificationContext.itemStreamState.drainBefore(() => manager.onNotification("turn/completed", notification.params, capability, shouldIgnore))) return "deferred";
  const { threadId, turn } = notification.params;
  const conversationId = normalizeThreadId(threadId);
  if (!notificationContext.threadStore.conversations.has(conversationId)) {
    notificationContext.unread.discardTurn(conversationId, turn.id);
    manager.logger.error("Received turn/completed for unknown conversation", { safe: { conversationId }, sensitive: {} });
    return "handled";
  }
  if (turn.status === "interrupted" || turn.status === "failed") notificationContext.itemStreamState.clearTurnTerminalInputBuffers(conversationId, turn.id);
  let planContent: string | null = null;
  let planStepCount: number | null = null;
  let completedPlanStepCount: number | null = null;
  notificationContext.updateTurnState(conversationId, turn.id, (state: any) => {
    state.turnId = turn.id; state.status = turn.status; state.error = turn.error; state.durationMs = turn.durationMs;
    state.automationKind = capability?.automationKind ?? null;
    state.items = state.items.filter((item: any) => item.type !== "strictReviewNotice");
    if (turn.status !== "completed") return;
    const todo = [...state.items].reverse().find((item: any) => item.type === "todo-list" && "plan" in item);
    if (todo != null) {
      completedPlanStepCount = todo.plan.filter((step: any) => step.status === "completed").length;
      if (completedPlanStepCount < todo.plan.length) planStepCount = todo.plan.length;
    }
    const plan = [...state.items].reverse().find((item: any) => item.type === "plan" && "text" in item);
    const text = plan?.text?.trim(); if (text) planContent = text;
  });
  if (planStepCount != null && completedPlanStepCount != null)
    manager.logger.info("turn_completed_with_incomplete_plan", { safe: { conversationId, turnId: turn.id, planStepCount, completedPlanStepCount }, sensitive: {} });
  if (planContent != null) manager.updateConversationState(conversationId, (state: any) => {
    const target = findTurnById(state, turn.id);
    if (target != null) {
      target.items = target.items.filter((item: any) => item.type !== "planImplementation");
      target.items.push({ id: planImplementationId(turn.id), type: "planImplementation", turnId: turn.id, planContent, isCompleted: false });
    }
    state.requests = state.requests.filter((request: any) => request.method !== "item/plan/requestImplementation" || request.params.turnId !== turn.id);
    state.requests.push({ method: "item/plan/requestImplementation", id: planImplementationId(turn.id), params: { threadId: conversationId, turnId: turn.id, planContent } });
    state.hasUnreadTurn = true;
  });
  const lastAgentMessage = notificationContext.getLastAgentMessageForTurn(conversationId, turn.id);
  const result = automationDecision(context, conversationId, turn, capability, lastAgentMessage);
  const hasPendingContinuation = pendingContinuation(context, conversationId, turn.status, result.hasRunnableQueuedFollowUp);
  let fileCount: number | undefined;
  manager.updateConversationState(conversationId, (state: any) => {
    notificationContext.unread.completeTurn(conversationId, turn.id, result.decision === "DONT_NOTIFY", state);
    if (result.shouldMarkUnread) state.hasUnreadTurn = true;
    fileCount = findTurnById(state, turn.id)?.localMetadata?.fileAttachmentCount;
  });
  manager.broadcastConversationSnapshot(conversationId);
  if (manager.getStreamRole(conversationId)?.role !== "follower") notificationContext.events.emitTurnCompleted({
    conversationId, hostId: manager.getHostId(), status: turn.status, turnId: turn.id, lastAgentMessage,
    heartbeatAssistantMessage: result.heartbeatAssistantMessage, automationNotificationDecision: result.decision,
    hasPendingContinuation, fileCount,
  });
  return "handled";
}
function projectNotificationItem(context: any, item: any): any {
  if (item.type === "collabAgentToolCall") {
    context.notificationContext.hydrateCollabThreads(item.receiverThreadIds);
    return {
      type: "collabAgentToolCall", id: item.id, tool: item.tool, status: item.status,
      senderThreadId: item.senderThreadId, receiverThreadIds: item.receiverThreadIds,
      receiverThreads: item.receiverThreadIds.map((threadId: string) => ({
        threadId, thread: context.notificationContext.threadStore.threadsById.get(threadId) ?? null,
      })),
      prompt: item.prompt, model: item.model, reasoningEffort: item.reasoningEffort, agentsStates: item.agentsStates,
    };
  }
  return item.type === "imageGeneration" ? normalizeImageGenerationItem(item) : item;
}
function reviewAction(action: any): any {
  const sources: Record<string, string> = { shell: "shell", unifiedExec: "unified_exec" };
  const protocols: Record<string, string> = { http: "http", https: "https", socks5Tcp: "socks5_tcp", socks5Udp: "socks5_udp" };
  switch (action.type) {
    case "command": return { type: "command", source: sources[action.source], command: action.command, cwd: action.cwd };
    case "execve": return { type: "execve", source: sources[action.source], program: action.program, argv: action.argv, cwd: action.cwd };
    case "writeStdin": return { type: "write_stdin", approval_id: action.approvalId, process_id: action.processId, stdin: action.stdin, cwd: action.cwd };
    case "applyPatch": return { type: "apply_patch", cwd: action.cwd, files: action.files };
    case "networkAccess": return { type: "network_access", target: action.target, host: action.host, protocol: protocols[action.protocol], port: action.port };
    case "mcpToolCall": return { type: "mcp_tool_call", server: action.server, tool_name: action.toolName, connector_id: action.connectorId, connector_name: action.connectorName, tool_title: action.toolTitle };
    case "requestPermissions": return { type: "request_permissions", reason: action.reason, permissions: { network: action.permissions.network, file_system: action.permissions.fileSystem } };
  }
}
function automaticReviewItem(params: any): any {
  const now = Date.now();
  const statuses: Record<string, string> = { aborted: "aborted", approved: "approved", denied: "denied", inProgress: "in_progress", timedOut: "timed_out" };
  return {
    type: "automaticApprovalReview", id: `automatic-approval-review:${params.reviewId}`,
    targetItemId: params.targetItemId, turnId: params.turnId, action: params.action,
    startedAtMs: now, completedAtMs: params.review.status === "inProgress" ? null : now,
    serverStartedAtMs: params.startedAtMs, serverCompletedAtMs: "completedAtMs" in params ? params.completedAtMs : null,
    event: params.review.status === "denied" ? {
      id: params.reviewId, target_item_id: params.targetItemId, turn_id: params.turnId,
      status: statuses[params.review.status], risk_level: params.review.riskLevel,
      user_authorization: params.review.userAuthorization, rationale: params.review.rationale,
      decision_source: "decisionSource" in params ? params.decisionSource : null, action: reviewAction(params.action),
    } : null,
    ...params.review,
  };
}
function applyAuxiliaryItemNotification(context: any, notification: { method: string; params: any }): void {
  const { manager, createId } = context;
  const { method, params } = notification;
  const conversationId = normalizeThreadId(params.threadId);
  if (method === "item/autoApprovalReview/started" || method === "item/autoApprovalReview/completed") {
    if (manager.getConversation(conversationId) == null) {
      manager.logger.error("Received automatic approval review for unknown conversation", { safe: { conversationId, targetItemId: params.targetItemId }, sensitive: {} });
      return;
    }
    const item = automaticReviewItem(params);
    manager.updateConversationState(conversationId, (state: any) => {
      const turn = findTurnById(state, params.turnId); if (turn == null) return;
      const existing = turn.items.find((entry: any) => entry.id === item.id && entry.type === "automaticApprovalReview");
      upsertItem(turn, freezeIdentity(existing == null ? item : { ...item, startedAtMs: existing.startedAtMs ?? item.startedAtMs }));
      state.updatedAt = Date.now();
    });
    return;
  }
  if (method === "autoApprovalReview/strictReviewRequired") {
    if (manager.getConversation(conversationId) == null) return;
    manager.updateConversationState(conversationId, (state: any) => {
      const turn = findTurnById(state, params.turnId); if (turn == null) return;
      const previous = [...turn.items].reverse().find((item: any) => item.type === "strictReviewNotice");
      if (previous == null || params.startedAtMs - previous.startedAtMs >= 10_000)
        turn.items.push({ type: "strictReviewNotice", id: `strict-review-notice:${params.startedAtMs}`, startedAtMs: params.startedAtMs });
    });
    return;
  }
  if (method === "guardianWarning") {
    if (("kind" in params ? params.kind : undefined) !== "tooManyDenials" &&
      !params.message.startsWith("Automatic approval review rejected too many approval requests for this turn")) return;
    manager.updateConversationState(conversationId, (state: any) => {
      const turn = lastTurnWithTurnId(state); if (turn != null) turn.items.push({ id: createId(), type: "autoReviewInterruptionWarning" });
    });
    return;
  }
  if (method === "item/mcpToolCall/progress") context.notificationContext.updateTurnState(conversationId, params.turnId, (turn: any) => {
    const item = turn.items.find((entry: any) => entry.id === params.itemId && entry.type === "mcpToolCall");
    if (item != null) manager.logger.debug("Ignoring mcpToolCall progress message", { safe: { itemId: params.itemId, message: params.message }, sensitive: {} });
  });
}
const AUXILIARY_ITEM_METHODS = new Set([
  "item/autoApprovalReview/started", "item/autoApprovalReview/completed", "autoApprovalReview/strictReviewRequired", "guardianWarning", "item/mcpToolCall/progress",
]);
function applyRealtimeTimeline(context: any, notification: { method: string; params: any }): void {
  const { manager, notificationContext } = context;
  if (!manager.supportsThreadTimeline()) return;
  const conversationId = normalizeThreadId(notification.params.threadId);
  const conversation = manager.getConversation(conversationId);
  if (conversation?.historyMode !== "paginated" || !conversation.canonicalVoiceHistory) return;
  manager.updateConversationState(conversationId, (state: any) => {
    if (notification.method === "thread/realtime/item/transcript/delta") {
      const realtime = state.realtimeItems?.[notification.params.itemId];
      if (realtime?.item.type === "transcriptSegment" && !realtime.completed) realtime.item.text += notification.params.delta;
      return;
    }
    if (notification.method === "thread/realtime/item/started" && notification.params.item.type !== "transcriptSegment") return;
    const timeline = (state.itemTimeline ??= { activeRealtimeSessionAtPageStart: null, entries: [] });
    const position = (timeline.entries.at(-1)?.position ?? 0) + 1;
    let entry: any;
    if (notification.method === "turn/started" || notification.method === "turn/completed") {
      const turn = notification.params.turn;
      entry = notification.method === "turn/started"
        ? { type: "turnStarted", position, turnId: turn.id, startedAt: turn.startedAt }
        : { type: "turnCompleted", position, turnId: turn.id, status: turn.status, error: turn.error,
            startedAt: turn.startedAt, completedAt: turn.completedAt, durationMs: turn.durationMs };
    } else if (notification.method === "item/started" || notification.method === "item/completed") {
      entry = { type: "item", position, turnId: notification.params.turnId,
        item: { id: notification.params.item.id, type: notification.params.item.type, completed: notification.method === "item/completed" } };
    } else {
      const item = notification.params.item;
      const realtimeItems = (state.realtimeItems ??= {});
      if (realtimeItems[item.id] != null && notification.method === "thread/realtime/item/started") return;
      realtimeItems[item.id] = freezeIdentity({ item, completed: notification.method === "thread/realtime/item/completed" });
      entry = { type: "realtime", position, item };
    }
    const key = timelineEntryKey(entry);
    const index = notificationContext.threadStore.getItemTimelineEntryIndex(conversationId, key);
    const current = index == null ? undefined : timeline.entries[index];
    if (current == null) timeline.entries.push(freezeIdentity(entry));
    else if (current.type === "item" && entry.type === "item" && entry.item.completed) current.item.completed = true;
    else if (current.type === "realtime" && entry.type === "realtime" && notification.method === "thread/realtime/item/completed")
      current.item = freezeIdentity(entry.item);
  });
}
function applyItemNotification(context: any, notification: { method: string; params: any }, capability: any): "deferred" | "handled" {
  const { manager, notificationContext, createId } = context;
  const { method, params } = notification;
  const conversationId = normalizeThreadId(params.threadId);
  if (method === "item/completed" && notificationContext.itemStreamState.drainBefore(() =>
    manager.onNotification("item/completed", params, capability))) return "deferred";
  if (!notificationContext.threadStore.conversations.has(conversationId)) {
    manager.logger.error(`Received ${method} for unknown conversation`, { safe: { conversationId }, sensitive: {} });
    return "handled";
  }
  if (method === "item/completed" && params.item.type === "commandExecution")
    notificationContext.itemStreamState.clearItemTerminalInputBuffer(conversationId, params.item.id);
  if (method === "item/completed" && params.item.type === "reasoning")
    manager.logger.info("Reasoning summary item completed", {
      safe: { summaryPartCount: params.item.summary.length },
      sensitive: { itemId: params.item.id, summary: params.item.summary, threadId: params.threadId, turnId: params.turnId },
    });
  manager.updateConversationState(conversationId, (state: any) => {
    let entry = findTurnEntryForEvent(state, params.turnId, { logger: manager.logger, createId }, {
      rebindLatestInProgressPlaceholder: method === "item/started" && params.item.type === "contextCompaction",
      synthesizeMissingTurn: method === "item/started",
    });
    if (params.item.type === "userMessage") {
      const turns = conversationTurns(state);
      recoverSteeringOrphans(turns);
      let target = method === "item/completed"
        ? turns.find((turn: any) => turn.turnId !== params.turnId && turn.items.some((item: any) => isSteeringUserMessage(item) && item.targetTurnId === params.turnId)) ?? entry?.turn
        : entry?.turn;
      if (target != null) acceptServerUserMessage(target, params.item, method === "item/started" ? "started" : "completed", state.modelProvider ?? null, params.turnId ?? target.turnId);
      return;
    }
    const turn = entry?.turn;
    if (turn == null) return;
    if (method === "item/started") {
      if (params.item.type === "agentMessage") {
        turn.finalAssistantStartedAtMs = params.startedAtMs;
        (turn.aeonAssistantMessageStartedAtMsById ??= {})[params.item.id] = params.startedAtMs;
      }
      if (params.item.type !== "hookPrompt") turn.firstTurnWorkItemStartedAtMs ??= Date.now();
      const projected = projectNotificationItem(context, params.item);
      if (projected.type === "commandExecution") (turn.commandExecutionStartedAtMsById ??= {})[projected.id] = params.startedAtMs;
      const value = freezeIdentity(projected.type === "contextCompaction"
        ? { ...projected, completed: false, source: notificationContext.manualContextCompactions.consumeSource(conversationId) }
        : projected);
      if (projected.type === "contextCompaction") notificationContext.manualContextCompactions.removePendingItemFromTurn(turn);
      upsertItem(turn, value);
      return;
    }
    const projected = projectNotificationItem(context, params.item);
    let source: unknown;
    if (projected.type === "contextCompaction") {
      delete state.lastInjectedPassiveContextKey;
      source = turn.items.find((item: any) => item.type === "contextCompaction" && item.id === projected.id)?.source;
    }
    if (projected.type === "commandExecution" && projected.durationMs != null) {
      const starts = (turn.commandExecutionStartedAtMsById ??= {});
      starts[projected.id] ??= params.completedAtMs - projected.durationMs;
    }
    if (params.item.type !== "hookPrompt") turn.firstTurnWorkItemStartedAtMs ??= Date.now();
    upsertItem(turn, freezeIdentity(projected.type === "contextCompaction"
      ? { ...projected, completed: true, source: source ?? "automatic" }
      : projected));
  });
  if (method === "item/completed" &&
    ((params.item.type === "collabAgentToolCall" && params.item.tool === "spawnAgent") ||
      (params.item.type === "subAgentActivity" && params.item.kind === "started")))
    notificationContext.subagentTopology.discoverForSpawn(conversationId, params.item);
  return "handled";
}
export function nb(context: any, method: string, params: any, automationCapability?: unknown, shouldIgnore = false): void {
  const notification = { method, params };
  const delivery = { notification, automationCapability };
  const { manager, notificationContext } = context;
  if ((method === "account/updated" || method === "account/login/completed")) notificationContext.threadStore.resetAfterReconnect();
  if (notificationContext.streamState.shouldIgnoreThreadMutationAsFollower(method, params, "notification") ||
    notificationContext.resumeNotificationBuffer.buffer(delivery, shouldIgnore) ||
    notificationContext.threadStartedNotificationDeferral.bufferNotification(delivery, shouldIgnore) || shouldIgnore) return;
  if (method === "turn/started") context.observeTurnStart(normalizeThreadId(params.threadId), params.turn.id);
  if (method !== "item/commandExecution/outputDelta")
    manager.logger.trace("Received app server notification", { safe: { method }, sensitive: {} });
  if (method.startsWith("thread/realtime/")) {
    if (["thread/realtime/item/started", "thread/realtime/item/completed", "thread/realtime/item/transcript/delta"].includes(method))
      applyRealtimeTimeline(context, notification);
    if (method === "thread/realtime/itemAdded") notificationContext.handleRealtimeItemAdded(params);
    notificationContext.events.emitNotification(notification);
    return;
  }
  if (method === "turn/completed" && applyTurnCompleted(context, notification, automationCapability, shouldIgnore) === "deferred") return;
  if ((method === "item/started" || method === "item/completed") && applyItemNotification(context, notification, automationCapability) === "deferred") return;
  if (["account/login/completed", "account/updated", "mcpServer/oauthLogin/completed", "windowsSandbox/setupCompleted"].includes(method))
    notificationContext.lifecycle.handleNotification(notification);
  else if (THREAD_NOTIFICATION_METHODS.has(method)) applyThreadNotification(context, notification);
  else if (ITEM_STREAM_METHODS.has(method)) notificationContext.itemStreamState.handleNotification(notification);
  else if (AUXILIARY_ITEM_METHODS.has(method)) applyAuxiliaryItemNotification(context, notification);
  else if (TURN_NOTIFICATION_METHODS.has(method)) applyTurnNotification(context, notification);
  else if (method === "serverRequest/resolved") applyServerRequestResolved(context, params);
  else if (method === "fs/changed")
    for (const message of notificationContext.openFileWatches.getFileChangeMessages(params.watchId)) notificationContext.events.emitOpenFileChange(message);
  if (["turn/started", "turn/completed", "item/started", "item/completed"].includes(method)) applyRealtimeTimeline(context, notification);
  notificationContext.events.emitNotification(notification);
}
export function ib(manager:unknown,_policy?:unknown):()=>void{const client=rec(manager).requestClient;const add=fn(client,`addNotificationListener`)??fn(client,`addNotificationCallback`);const dispose=add?.((method:string,params:unknown)=>fn(manager,`handleNotification`)?.(method,params));return typeof dispose===`function`?dispose as ()=>void:()=>undefined}
function mismatchTurnId(error: unknown): string | null {
  const message = errorToString(error);
  return message.match(/expected active turn id `?[^`\s]+`? but found `?([^`\s]+)`?/)?.[1] ??
    message.match(/ExpectedTurnMismatch\s*\{[^}]*actual:\s*"([^"]+)"/)?.[1] ?? null;
}
function noActiveTurn(error: unknown): boolean { return errorToString(error) === "no active turn to interrupt"; }
function activeTurn(state: any, turnId: string): any {
  const turn = findTurnById(state, turnId);
  return turn?.status === "inProgress" ? turn : null;
}
async function killNodeRepl({ conversationId, sessionId, turnId, killNodeReplExecutions, schedule, logger }: any): Promise<void> {
  let cancelTimeout: (() => void) | undefined;
  try {
    const execution = killNodeReplExecutions(sessionId, turnId);
    if (execution == null) return;
    const result = await Promise.race([
      execution.result,
      new Promise((resolve) => { cancelTimeout = schedule(() => { execution.cancel(); resolve("timeout"); }, 10_000); }),
    ]);
    if (result === "timeout") logger.warning("Timed out killing active node_repl execs", { safe: { conversationId }, sensitive: {} });
    else if (result.failedCount > 0) logger.warning("Failed to kill some active node_repl execs", { safe: { conversationId, failedCount: result.failedCount }, sensitive: {} });
  } catch (error) {
    logger.warning("Failed to kill active node_repl execs", { safe: { conversationId }, sensitive: { error } });
  } finally { cancelTimeout?.(); }
}
export async function Ove(options: any): Promise<string | null> {
  const { killNodeReplExecutions, onTurnInterruptStarted, schedule, backgroundCleanup, cleanBackgroundTerminals,
    conversationId, conversationState, expectedTurnId, logger, sendInterruptRequest, updateConversationState } = options;
  const latest = conversationState == null ? null : lastTurnWithTurnId(conversationState);
  const currentTurnId = latest?.turnId ?? null;
  if (expectedTurnId != null && (expectedTurnId !== currentTurnId || latest?.status !== "inProgress")) return null;
  if (!currentTurnId || latest?.status !== "inProgress") {
    try { await cleanBackgroundTerminals(); }
    catch (error) { logger.warning("Failed to clean background terminals after interrupt fallback", { safe: { conversationId }, sensitive: { error } }); }
    return null;
  }
  const threadId = conversationState?.id ?? conversationId;
  const sessionId = conversationState?.sessionId ?? threadId;
  const cleanups: Promise<void>[] = [];
  const startCleanup = (turnId: string) => {
    if (cleanups.length === 0) onTurnInterruptStarted();
    cleanups.push(killNodeRepl({ conversationId, sessionId, turnId, killNodeReplExecutions, schedule, logger }));
  };
  if (expectedTurnId == null) startCleanup(currentTurnId);
  let interruptedTurnId: string | null = currentTurnId;
  try {
    await sendInterruptRequest(threadId, currentTurnId);
    updateConversationState(conversationId, (state: any) => { const turn = activeTurn(state, currentTurnId); if (turn != null) turn.status = "interrupted"; });
  } catch (error) {
    const actual = mismatchTurnId(error);
    if (actual != null) {
      if (expectedTurnId != null && actual !== expectedTurnId) return (interruptedTurnId = null);
      interruptedTurnId = actual;
      if (expectedTurnId == null) startCleanup(actual);
      try { await sendInterruptRequest(threadId, actual); }
      catch (retryError) {
        if (!noActiveTurn(retryError)) throw retryError;
        updateConversationState(conversationId, (state: any) => { const turn = activeTurn(state, actual); if (turn != null) turn.status = "interrupted"; });
      }
      updateConversationState(conversationId, (state: any) => { const turn = activeTurn(state, currentTurnId); if (turn != null) turn.status = "interrupted"; });
    } else if (noActiveTurn(error)) {
      if (expectedTurnId != null) return (interruptedTurnId = null);
      updateConversationState(conversationId, (state: any) => { const turn = activeTurn(state, currentTurnId); if (turn != null) turn.status = "interrupted"; });
    } else throw error;
  } finally {
    if (expectedTurnId != null && interruptedTurnId != null) { startCleanup(currentTurnId); if (interruptedTurnId !== currentTurnId) startCleanup(interruptedTurnId); }
    if (backgroundCleanup) void Promise.all(cleanups); else await Promise.all(cleanups);
  }
  return interruptedTurnId;
}
function shouldInterruptDescendant(id: string, descendant: any, conversations: Map<string, any>): boolean {
  const conversation = conversations.get(id);
  if (conversation != null && conversationTurns(conversation).some((turn) => turn.status === "inProgress")) return true;
  const runtime = conversation?.threadRuntimeStatus;
  return conversation?.resumeState !== "needs_resume" && runtime != null && runtime.type !== "notLoaded"
    ? runtime.type === "active" : descendant.status.type === "active" || runtime?.type === "active";
}
export async function Ave(options: any): Promise<void> {
  const { logger, conversationId, conversations, discoverDescendantSnapshot, getDescendantSnapshot,
    interruptConversationSelf, interruptTurn, listThreadTurns } = options;
  const locallyInterrupted = new Set<string>();
  await Promise.all(getDescendantSnapshot().descendantThreads.map(async (descendant: any) => {
    const id = normalizeThreadId(descendant.id);
    if (!shouldInterruptDescendant(id, descendant, conversations)) return;
    try { if (await interruptConversationSelf(id) != null) locallyInterrupted.add(id); }
    catch (error) { logger.warning("Failed to interrupt subagent descendant", { safe: { conversationId, childConversationId: id }, sensitive: { error } }); }
  }));
  let descendants: any[];
  try { descendants = (await discoverDescendantSnapshot()).descendantThreads; }
  catch (error) { logger.warning("Failed to discover subagent descendants for interrupt", { safe: { conversationId }, sensitive: { error } }); return; }
  await Promise.all(descendants.map(async (descendant) => {
    const id = normalizeThreadId(descendant.id);
    if (descendant.status.type !== "active" || locallyInterrupted.has(id)) return;
    try {
      if (conversations.has(id) && await interruptConversationSelf(id) != null) return;
      const turn = (await listThreadTurns(descendant.id)).data[0];
      if (turn?.status === "inProgress") await interruptTurn(descendant.id, turn.id);
    } catch (error) { logger.warning("Failed to interrupt subagent descendant", { safe: { conversationId, childConversationId: id }, sensitive: { error } }); }
  }));
}
export async function Pye(options:unknown):Promise<unknown>{const o=rec(options);const handler=o.handler??o.handleRequest;return typeof handler===`function`?(handler as (request:unknown)=>unknown)(o.request):undefined}
export const applyNotification=nb,addSyntheticCompactionItem=Fy,addForkedFromConversationSyntheticItem=Iy,addCloudTaskSyntheticItem=Ly,addWorktreeInitSyntheticTurn=Ry,removePlanImplementationRequest=zy,subscribeToNotificationStream=ib,interruptConversationCore=Ove,interruptSubagentDescendants=Ave,handleServerRequest=Pye;
