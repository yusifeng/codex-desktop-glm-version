// steer turn 流程（原版 49,334-49,596 区段）。
//
// 职责：向进行中的 turn 注入新输入（steer）——follower 委托、owner 校验、
// 合成 steeringUserMessage 条目、turn/steer 请求（ExpectedTurnMismatch 时
// 采用服务端实际 turnId 重试一次）、以及 thread/stop 停止流程。
//
// 原压缩名对照：gC→STEER_TURN_INACTIVE_ERROR、$xe→NO_ACTIVE_TURN、
// eSe→createSteerTurnInactiveError、tSe→isSteerTurnInactiveError、_C→
// isNoActiveTurnError、nSe→BERRY_DISPLAY_TURN_ID_PATTERN、rSe→steerTurn、
// vC→updateSteeringItem、iSe→adoptLateTurnId、aSe→sendSteerRequest、
// oSe→waitForActiveTurnId、sSe→stopConversation。

import {
  $u as normalizeThreadId,
  Cs as isDurableHost,
  mr as DeliveryError,
  Zo as errorToString,
  Wn as ResumeNotReadyError,
} from "@chunk/shared";
import { lastIncompleteTurn, forEachTurn } from "../turns/canonical-history";
// dg（steeringUserMessage 条目构造，30,006）在 R3 turns/steering-merge 簇
//（导出名以 R3 侧落地为准——暂按语义名引用，缺导出已记录）。
import { dg as buildSteeringUserMessage } from "../turns/steering-merge";
// hy（ExpectedTurnMismatch 错误里解析实际 turnId）在 R3 的 interrupt 带。
import { hy as parseExpectedTurnMismatchActualId } from "../turns/interrupt";
import { hh as freezeIdentity } from "../vendor/immer";
// ny：follower 委派（owner 不在时标记 needs_resume 并尝试恢复）。
import { ny as delegateRequestToFollowerOwner } from "../files/open-file-watches";
// R3 超时常量（ym=30s）。
import { TURN_START_TIMEOUT_MS } from "../threads/start-config";
import { assertNoUnconfirmedSubmission, recordUnconfirmedSubmission, clearUnconfirmedSubmission } from "./turn-dispatch";

/** steer 目标 turn 已结束的错误名（原 gC）。 */
const STEER_TURN_INACTIVE_ERROR = `SteerTurnInactiveError`;
/** 「无活跃 turn」错误标记（原 $xe）。 */
const NO_ACTIVE_TURN = `NoActiveTurn`;

/** berry-display 合成 turnId 的正则（真实 id 为 `-berry-display-N` 前缀）。 */
const BERRY_DISPLAY_TURN_ID_PATTERN = /^(.*)-berry-display-\d+$/;

/** 构造「steer 目标 turn 已结束」错误（name 固定为 SteerTurnInactiveError）。 */
export function createSteerTurnInactiveError(conversationId: string) {
  let error = Error(`Cannot steer conversation ${conversationId} because its active turn already ended`);
  error.name = STEER_TURN_INACTIVE_ERROR;
  return error;
}

/** 错误是否为「steer 目标 turn 已结束」（按 name、消息包含、消息正则三重判定）。 */
export function isSteerTurnInactiveError(error: unknown) {
  let message = errorToString(error);
  return (
    (error instanceof Error && error.name === STEER_TURN_INACTIVE_ERROR) ||
    message.includes(STEER_TURN_INACTIVE_ERROR) ||
    /^Cannot steer conversation \S+ because its active turn already ended$/.test(message)
  );
}

/** 错误是否为「无活跃 turn」（消息包含 NoActiveTurn）。 */
export function isNoActiveTurnError(error: unknown) {
  return errorToString(error).includes(NO_ACTIVE_TURN);
}

/**
 * steer 主流程（原 rSe）：
 *   1. follower 委托（owner 不在时标记 + 恢复，成功则直接返回）；
 *   2. owner/streaming/状态校验，活跃 turn 不在则抛 inactive 错误；
 *   3. 合成 steeringUserMessage 条目并追加进当前 turn；
 *   4. 等待活跃 turnId（无 turnId 时等回调，30s 超时）；
 *   5. turn/steer；ExpectedTurnMismatch 时采用服务端实际 turnId 重试一次；
 *   6. 非 local host 标记 accepted、广播 turn steered。
 * 失败路径：outcome-unknown 保留未确认记录；其余清记录、回滚注入的条目
 * （`no active turn to steer` 转 inactive 错误）。
 */
export async function steerTurn({
  manager,
  conversationId,
  input,
  restoreMessage,
  serviceTier,
  attachments,
  clientUserMessageId,
  additionalContext,
  toolOutput,
  onMessageAdded,
  createId,
  schedule,
  ownerWindowError,
}: {
  manager: any;
  conversationId: string;
  input: any[];
  restoreMessage: any;
  serviceTier: unknown;
  attachments: any;
  clientUserMessageId: string;
  additionalContext: Record<string, unknown> | undefined;
  toolOutput: unknown;
  onMessageAdded: (() => unknown) | undefined;
  createId: () => string;
  schedule: (callback: () => void, delayMs: number) => () => void;
  ownerWindowError: string;
}) {
  assertNoUnconfirmedSubmission(manager.getConversation(conversationId));
  let conversation = manager.getConversation(conversationId);
  let cwd = restoreMessage.cwd ?? manager.getConversationCwd(conversationId);
  let workspaceRoots = restoreMessage.context.workspaceRoots;
  let createInactiveError = () => createSteerTurnInactiveError(conversationId);
  let followerResult = await delegateRequestToFollowerOwner({
    conversationId,
    getStreamRole: (id: string) => manager.getStreamRole(id),
    markConversationNeedsResumeForUnavailableOwner: (id: string, ownerClientId: string) => {
      manager.markConversationNeedsResumeForUnavailableOwner(id, ownerClientId);
    },
    resumeConversationForUnavailableOwner: (id: string) => manager.resumeConversationForUnavailableOwner(id),
    workspaceRoots: workspaceRoots != null && workspaceRoots.length > 0 ? workspaceRoots : [cwd ?? `/`],
    collaborationMode: restoreMessage.context.collaborationMode ?? conversation?.latestCollaborationMode ?? null,
    reasoningEffort: null,
    serviceTier,
    sendRequest: (followerRequest: any) =>
      manager.sendThreadFollowerRequest(followerRequest, `thread-follower-steer-turn`, {
        conversationId,
        clientUserMessageId,
        input,
        serviceTier,
        attachments,
        additionalContext,
        toolOutput,
        restoreMessage,
      }),
  });
  if (followerResult) return followerResult.result;
  if (manager.getStreamRole(conversationId)?.role !== `owner`) throw Error(ownerWindowError);
  if (!manager.isConversationStreaming(conversationId))
    throw (
      manager.logger.error(`Conversation is not being streamed.`, {
        safe: { conversationId },
        sensitive: {},
      }),
      Error(`Conversation ${conversationId} is not being streamed.`)
    );
  let current = manager.getConversation(conversationId);
  if (current == null)
    throw (
      manager.logger.error(`Conversation state not found`, {
        safe: { conversationId },
        sensitive: {},
      }),
      Error(`Conversation state for ${conversationId} not found`)
    );
  let activeTurn = lastIncompleteTurn(current);
  if (activeTurn?.status !== `inProgress`) throw createInactiveError();
  let steeringItemId = createId();
  let lastOutcomeUnknownRequestId: string | null = null;
  let steeringItem = buildSteeringUserMessage(steeringItemId, input, restoreMessage, {
    attachments,
    clientUserMessageId,
    shouldStripImageDisplayPlaceholderLines: false,
    targetTurnId: activeTurn.turnId ?? null,
    targetTurnStartedAtMs: activeTurn.turnStartedAtMs ?? null,
  });
  manager.updateConversationState(conversationId, (state: any) => {
    let turn = lastIncompleteTurn(state);
    turn?.status === `inProgress` && toolOutput == null && turn.items.push(freezeIdentity(steeringItem));
  });
  try {
    await onMessageAdded?.();
    let expectedTurnId = await waitForActiveTurnId({
      manager,
      conversationId,
      createInactiveError,
      schedule,
    });
    updateSteeringItem(manager, conversationId, steeringItemId, (item: any) => {
      item.type === `steeringUserMessage` && Object.assign(item, { targetTurnId: expectedTurnId });
    });
    let sendSteer = (turnId: string) =>
      sendSteerRequest(
        manager,
        {
          toolOutput,
          request: {
            threadId: conversationId,
            input,
            expectedTurnId: turnId,
            additionalContext,
            responsesapiClientMetadata: {
              ...restoreMessage.responsesapiClientMetadata,
              workspace_kind: current.workspaceKind ?? `project`,
            },
          },
          clientUserMessageId,
          onOutcomeUnknown: (delivery: any) => {
            lastOutcomeUnknownRequestId = delivery.requestId;
            manager.updateConversationState(conversationId, (state: any) => {
              recordUnconfirmedSubmission(state, delivery, clientUserMessageId);
            });
          },
        },
      );
    let result;
    try {
      result = await sendSteer(expectedTurnId);
    } catch (error) {
      if (error instanceof DeliveryError) throw error;
      let actualTurnId = parseExpectedTurnMismatchActualId(error);
      if (actualTurnId == null) throw error;
      manager.updateConversationState(conversationId, (state: any) => {
        clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
      });
      lastOutcomeUnknownRequestId = null;
      adoptLateTurnId(manager, conversationId, actualTurnId) &&
        updateSteeringItem(manager, conversationId, steeringItemId, (item: any) => {
          item.type === `steeringUserMessage` && Object.assign(item, { targetTurnId: actualTurnId });
        });
      result = await sendSteer(actualTurnId);
    }
    return (
      isDurableHost(manager.getHostId()) ||
        updateSteeringItem(manager, conversationId, steeringItemId, (item: any) => {
          item.type === `steeringUserMessage` && Object.assign(item, { status: `accepted` });
        }),
      manager.emitTurnSteered(conversationId),
      manager.updateConversationState(conversationId, (state: any) => {
        clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
      }),
      result
    );
  } catch (error) {
    throw error instanceof DeliveryError && error.delivery.stage === `outcome-unknown`
      ? (manager.updateConversationState(conversationId, (state: any) => {
          recordUnconfirmedSubmission(state, error.delivery, clientUserMessageId);
        }),
        error)
      : (manager.updateConversationState(conversationId, (state: any) => {
          clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
          forEachTurn(state, (turn: any) => {
            turn.items = turn.items.filter((item: any) => item.id !== steeringItemId);
          });
        }),
        errorToString(error) === `no active turn to steer`
          ? createInactiveError()
          : (manager.logger.error(`Error submitting steering turn for conversation`, {
              safe: { conversationId },
              sensitive: { error },
            }),
            error));
  }
}

/** 在会话的全部 turn 里按条目 id 找到 steering 条目并应用 mutator（原 vC）。 */
function updateSteeringItem(manager: any, conversationId: string, itemId: string, mutator: (item: any) => void) {
  manager.updateConversationState(conversationId, (state: any) => {
    forEachTurn(state, (turn: any) => {
      let item = turn.items.find((candidate: any) => candidate.id === itemId);
      item != null && mutator(item);
    });
  });
}

/** 服务端晚到的 turnId 采纳：仍 inProgress 且 turnId 缺失/不匹配时改写（原 iSe）。 */
function adoptLateTurnId(manager: any, conversationId: string, turnId: string) {
  let adopted = false;
  manager.updateConversationState(conversationId, (state: any) => {
    let turn = lastIncompleteTurn(state);
    turn?.status === `inProgress` &&
      (turn.turnId == null || BERRY_DISPLAY_TURN_ID_PATTERN.exec(turn.turnId)?.[1] !== turnId) &&
      ((turn.turnId = turnId), (adopted = true));
  });
  return adopted;
}

/**
 * 发送 steer 请求（原 aSe）：无 toolOutput 走 turn/steer；有 toolOutput 时
 * 改走 turn/start（空 input + toolOutput），把返回 turn 映射为 {turnId}。
 */
function sendSteerRequest(
  manager: any,
  {
    toolOutput,
    request,
    clientUserMessageId,
    onOutcomeUnknown,
  }: {
    toolOutput: unknown;
    request: any;
    clientUserMessageId: string;
    onOutcomeUnknown: (delivery: any) => void;
  },
) {
  assertNoUnconfirmedSubmission(manager.getConversation(normalizeThreadId(request.threadId)));
  let payload = { ...request, clientUserMessageId };
  let options = { timeoutMs: TURN_START_TIMEOUT_MS, onOutcomeUnknown };
  return toolOutput == null
    ? manager.sendRequest(`turn/steer`, payload, options)
    : manager
        .sendRequest(
          `turn/start`,
          {
            threadId: payload.threadId,
            input: [],
            toolOutput,
            additionalContext: payload.additionalContext,
            responsesapiClientMetadata: payload.responsesapiClientMetadata,
          },
          options,
        )
        .then(({ turn }: any) => ({ turnId: turn.id }));
}

/**
 * 等待活跃 turnId（原 oSe）：当前 turn 无 turnId 时注册会话回调等它出现，
 * 30s 超时；turn 结束/会话状态变化时以 inactive 错误拒绝。
 */
async function waitForActiveTurnId({
  manager,
  conversationId,
  createInactiveError,
  schedule,
}: {
  manager: any;
  conversationId: string;
  createInactiveError: () => Error;
  schedule: (callback: () => void, delayMs: number) => () => void;
}) {
  let conversation = manager.getConversation(conversationId);
  let activeTurn = conversation == null ? null : lastIncompleteTurn(conversation);
  if (activeTurn?.status !== `inProgress`) throw createInactiveError();
  return activeTurn.turnId == null
    ? new Promise<string>((resolve, reject) => {
        let timeout = schedule(() => {
          unregister();
          reject(Error(`Cannot steer conversation ${conversationId} without an active turn id`));
        }, TURN_START_TIMEOUT_MS);
        let unregister = manager.addConversationCallback(conversationId, (state: any) => {
          let turn = lastIncompleteTurn(state);
          if (turn?.status !== `inProgress`) {
            timeout();
            unregister();
            reject(createInactiveError());
            return;
          }
          turn.turnId != null && (timeout(), unregister(), resolve(turn.turnId));
        });
        let current = manager.getConversation(conversationId);
        let currentTurn = current == null ? null : lastIncompleteTurn(current);
        if (currentTurn?.status !== `inProgress`) {
          timeout();
          unregister();
          reject(createInactiveError());
          return;
        }
        currentTurn.turnId != null && (timeout(), unregister(), resolve(currentTurn.turnId));
      })
    : activeTurn.turnId;
}

/**
 * 停止会话（原 sSe）：durable（或 durable 模式会话）优先 thread/stop +
 * markDurableAeonStopped + 子代理中断（user 触发改后台）；thread/stop 不被
 * 支持（MCP method not found）或非 durable 时回退 interruptConversation。
 */
export async function stopConversation({
  conversationId,
  initiatedBy,
  isDurableHost,
  isMcpMethodNotFoundError,
  manager,
}: {
  conversationId: string;
  initiatedBy: string;
  isDurableHost: boolean;
  isMcpMethodNotFoundError: (error: unknown, method: string) => boolean;
  manager: any;
}) {
  if (isDurableHost || manager.getConversation(conversationId)?.mode === `durable`)
    try {
      await manager.sendRequest(`thread/stop`, { threadId: conversationId }, { priority: `critical` });
      manager.markDurableAeonStopped(conversationId);
      initiatedBy === `user`
        ? manager.interruptSubagentDescendantsInBackground(conversationId)
        : await manager.interruptSubagentDescendants(conversationId);
      return { stopped: true, interruptedTurnId: null };
    } catch (error) {
      if (!isMcpMethodNotFoundError(error, `thread/stop`)) throw error;
    }
  return {
    stopped: false,
    interruptedTurnId: await manager.interruptConversation(conversationId, initiatedBy === `user` ? `user-stop` : `system`),
  };
}
