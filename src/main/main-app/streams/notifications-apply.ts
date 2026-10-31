import { $u as normalizeThreadId, ed as requestIdOf, Zo as errorToString } from "@chunk/shared";
import { conversationTurns, findTurnById, forEachTurn, lastTurnWithTurnId } from "../turns/canonical-history";
import { applyThreadSettingsUpdate } from "../threads/patch-classification";
import { Qv as applyPermissionsResolution, Zv as applyMcpElicitationResolution } from "../requests/item-synthesis";

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
    if (method === "thread/realtime/itemAdded") notificationContext.handleRealtimeItemAdded(params);
    notificationContext.events.emitNotification(notification);
    return;
  }
  if (["account/login/completed", "account/updated", "mcpServer/oauthLogin/completed", "windowsSandbox/setupCompleted"].includes(method))
    notificationContext.lifecycle.handleNotification(notification);
  else if (THREAD_NOTIFICATION_METHODS.has(method)) applyThreadNotification(context, notification);
  else if (ITEM_STREAM_METHODS.has(method)) notificationContext.itemStreamState.handleNotification(notification);
  else if (TURN_NOTIFICATION_METHODS.has(method)) applyTurnNotification(context, notification);
  else if (method === "serverRequest/resolved") applyServerRequestResolved(context, params);
  else if (method === "fs/changed")
    for (const message of notificationContext.openFileWatches.getFileChangeMessages(params.watchId)) notificationContext.events.emitOpenFileChange(message);
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
