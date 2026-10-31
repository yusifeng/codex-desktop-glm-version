import { $u as normalizeThreadId, Zo as errorToString } from "@chunk/shared";
import { conversationTurns, findTurnById, lastTurnWithTurnId } from "../turns/canonical-history";

type R=Record<string,unknown>;const rec=(v:unknown):R=>typeof v===`object`&&v!==null?v as R:{};const fn=(v:unknown,n:string)=>(rec(v)[n] as (((...a:unknown[])=>unknown)|undefined));
function update(manager:unknown,id:string,callback:(state:R)=>void){fn(manager,`updateConversationState`)?.(id,callback)} function append(state:R,item:unknown){const turns=state.turns;if(Array.isArray(turns)&&turns.length>0){const turn=rec(turns[turns.length-1]);const items=Array.isArray(turn.items)?turn.items:[];turn.items=[...items,item]}}
export function Fy(manager:unknown,id:string,item:unknown,_options?:unknown,_history?:unknown):void{update(manager,id,state=>append(state,item))}
export function Iy(manager:unknown,id:string,sourceId:string,title:unknown,history:unknown):void{update(manager,id,state=>append(state,{id:fn(history,`createSearchIslandId`)?.()??`fork-${sourceId}`,type:`forkedFromConversation`,sourceConversationId:sourceId,sourceConversationTitle:title}))}
export function Ly(manager:unknown,id:string,taskId:string,history:unknown):void{update(manager,id,state=>append(state,{id:fn(history,`createSearchIslandId`)?.()??`task-${taskId}`,type:`remoteTaskCreated`,taskId}))}
export function Ry(manager:unknown,id:string,item:unknown,history:unknown,mode:`latest-turn`|`new-turn`=`latest-turn`):void{const value={...rec(item),type:`worktreeInit`};update(manager,id,state=>{if(mode===`new-turn`){const turns=Array.isArray(state.turns)?state.turns:[];state.turns=[...turns,{turnId:fn(history,`createSearchIslandId`)?.()??`worktree-init`,status:`inProgress`,items:[value]}]}else append(state,value)})}
export function zy(manager:unknown,id:string,turnId:string):void{update(manager,id,state=>{if(Array.isArray(state.requests))state.requests=state.requests.filter(x=>!(rec(x).method===`item/plan/requestImplementation`&&rec(rec(x).params).turnId===turnId))})}
export function nb(context:unknown,method:string,params:unknown,_capability?:unknown,_ignore?:unknown):void{const notification={method,params};fn(rec(context).events,`emitNotification`)?.(notification);const id=typeof rec(params).threadId===`string`?rec(params).threadId as string:null;if(id==null)return;if(method===`thread/archived`)fn(context,`handleThreadArchived`)?.(id);else if(method===`thread/deleted`)fn(context,`handleThreadDeletion`)?.([id]);else if(method===`thread/unarchived`)fn(context,`handleThreadUnarchived`)?.(id)}
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
