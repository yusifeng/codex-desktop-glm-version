// realtime（语音）线程状态 + goal resume（原版 49,949-50,110 与
// 50,567-50,670 区段）。
//
// RealtimeThreadState（pSe）：订阅 thread/realtime/started|closed、
// thread/started 通知维护活跃 realtime 会话集合；handleItemAdded 把
// realtime 转写（input + transcriptDelta）合成为 steering 消息注入当前
// turn；pushWorkerCreated 把 worker 侧创建的 realtime 子线程上报为
// realtimeThreadCreated 事件。
//
// goal resume（xSe/SSe/CSe/wSe）：realtime 会话断线后恢复 thread goal——
// resume + thread/goal/set（active），并在本地合成 goal turn（`/goal` 输入、
// minimal effort、completed 状态）保持 UI 一致。
//
// 原压缩名对照：uSe→updateApprovalsReviewerForTurn、dSe→
// isDuplicateSteeringText、fSe→buildRealtimeSteerMessage、pSe→
// RealtimeThreadState、yC→trimToNonNull、xSe→resumeRealtimeThreadGoal、
// SSe→setThreadGoalStatus、CSe→buildGoalTurnParams、wSe→
// applyGoalTurnToState、Rt→goalCommandText。

import {
  $u as normalizeThreadId,
  Wn as ResumeNotReadyError,
  kd as defaultSandboxConfig,
  Wu as versionSupportsFeature,
} from "@chunk/shared";
import { latestTurn, lastTurn } from "../turns/canonical-history";
// iv（33,373）= turn 规范化（补 items/hookRuns 数组）——R3 尚未导出，
// 落地后对齐（缺导出已记录）。
const normalizeTurn: (turn: any, status?: string) => any = (projectionModule as any).normalizeTurn;
// H_（33,031）= thread source 解析（subAgent/thread_spawn）——R3
// threads/projection 的 subAgentMetadata。
import { subAgentMetadata as parseThreadSource } from "../threads/projection";
import * as projectionModule from "../threads/projection";
// hh（28,627）= produce 冻结包装（本 build 中为恒等）——R3 vendor/immer。
import { freezeIdentity } from "../vendor/immer";
import { appendConversationTurn } from "../turns/canonical-history";
// dg（30,006）= steeringUserMessage 条目构造——R3 turns/steering-merge 簇
//（导出名以 R3 侧落地为准——暂按压缩名引用，缺导出已记录）。
import { dg as buildSteeringUserMessage } from "../turns/steering-merge";
// fg（30,067）= pending/accepted steering 匹配——R3 turns/steering-merge。
import { fg as findMatchingSteeringMessage } from "../turns/steering-merge";
// Cy（39,903）= realtime itemAdded 条目解析、Wve（39,932）= 转写 → text 输入项。
// 均在 R3 streams 带（item-notifications 簇附近），导出名待 R3 侧对齐。
import {
  Cy as parseRealtimeItemAddedItem,
  Wve as buildRealtimeTranscriptItems,
} from "../streams/item-notifications";
// ym（27,872）= 30s turn/start 超时——R3 threads/start-config。
import { TURN_START_TIMEOUT_MS } from "../threads/start-config";

/** goal 命令文本（原 Rt，768 行 R1 杂项带；R1 模块落地后改为 import）。 */
function goalCommandText(objective: string) {
  return `/goal ${objective}`;
}

// ---------------------------------------------------------------------------
// turn 观测辅助（uSe/dSe/fSe）
// ---------------------------------------------------------------------------

/** turn 在途时向 app-server 更新 approvalsReviewer（版本门 turnApprovalsReviewer）。 */
export async function updateApprovalsReviewerForTurn(manager: any, conversationId: string, request: any, turnId: string | null) {
  turnId != null &&
    request.approvalsReviewer != null &&
    versionSupportsFeature(manager.requestClient.getAppServerVersion(), `turnApprovalsReviewer`) &&
    (await manager.sendRequest(`turn/settings/update`, {
      threadId: conversationId,
      turnId,
      approvalsReviewer: request.approvalsReviewer,
    }));
}

/** realtime 转写文本是否与已有 user/steering 消息重复（内容拼接或 steering 匹配）。 */
export function isDuplicateSteeringText(
  userMessages: any[],
  steeringMessages: any[],
  transcriptItems: any[],
  joinedText: string,
  turnId: string | null,
  turnStartedAtMs: number | null,
  acceptMissingImageInputs: boolean,
) {
  return (
    userMessages.some(
      (message: any) =>
        message.content
          .flatMap((content: any) => (content.type === `text` ? [content.text] : []))
          .join(`
`) === joinedText,
    ) || findMatchingSteeringMessage(steeringMessages, transcriptItems, turnId, turnStartedAtMs, acceptMissingImageInputs) != null
  );
}

/** realtime itemAdded → steeringUserMessage 条目（固定选项：不剥图片占位行）。 */
export function buildRealtimeSteerMessage({
  id,
  input,
  text,
  prompt,
  cwd,
  targetTurnId,
  targetTurnStartedAtMs,
  shouldStripImageDisplayPlaceholderLines,
}: {
  id: string;
  input: any[];
  text: string;
  prompt: string;
  cwd: string;
  targetTurnId: string | null;
  targetTurnStartedAtMs: number | null;
  shouldStripImageDisplayPlaceholderLines: boolean;
}) {
  return buildSteeringUserMessage(
    id,
    input,
    {
      id,
      text,
      context: {
        prompt,
        addedFiles: [],
        fileAttachments: [],
        ideContext: null,
        imageAttachments: [],
        commentAttachments: [],
      },
      cwd,
      createdAt: Date.now(),
    },
    { shouldStripImageDisplayPlaceholderLines, targetTurnId, targetTurnStartedAtMs },
  );
}

/** trim 后非空则返回，否则 null（原 yC）。 */
function trimToNonNull(value: string | null | undefined) {
  let trimmed = value?.trim() ?? ``;
  return trimmed.length === 0 ? null : trimmed;
}

// ---------------------------------------------------------------------------
// RealtimeThreadState（pSe）
// ---------------------------------------------------------------------------

/** RealtimeThreadState 依赖注入面。 */
export interface RealtimeThreadStateParams {
  events: any;
  logger: any;
  manager: any;
  getDefaultFeatureOverride: (key: string) => unknown;
}

/**
 * realtime 线程活跃状态跟踪（原 pSe）。
 * #active 会话集合由 thread/realtime/started|closed 驱动；会话删除时清出。
 */
export class RealtimeThreadState {
  params: RealtimeThreadStateParams;
  #active = new Set<string>();
  #unregisterNotifications: () => void;
  #unregisterState: () => void;

  constructor(params: RealtimeThreadStateParams) {
    this.params = params;
    this.#unregisterNotifications = this.params.events.addNotificationCallback(
      [`thread/realtime/started`, `thread/realtime/closed`, `thread/started`],
      (notification: any) => {
        switch (notification.method) {
          case `thread/realtime/started`:
            this.markActive(normalizeThreadId(notification.params.threadId));
            break;
          case `thread/realtime/closed`:
            this.markInactive(normalizeThreadId(notification.params.threadId));
            break;
          case `thread/started`:
            this.pushWorkerCreated(notification.params.thread);
        }
      },
    );
    this.#unregisterState = this.params.events.addConversationStateCallback((conversationId: string, state: unknown) => {
      state ?? this.markInactive(conversationId);
    });
  }

  dispose() {
    this.#unregisterNotifications();
    this.#unregisterState();
    this.#active.clear();
  }

  markActive(conversationId: string) {
    this.#active.add(conversationId);
  }

  markInactive(conversationId: string) {
    this.#active.delete(conversationId);
  }

  /**
   * realtime itemAdded → 合成 steering 消息：realtime_conversation 特性被
   * 关闭时忽略；转写与已有消息重复时忽略；否则注入当前 inProgress turn
   * 并广播 turn steered。
   */
  handleItemAdded(notification: any) {
    if (this.params.getDefaultFeatureOverride(`realtime_conversation`) === false) return;
    let realtimeItem = parseRealtimeItemAddedItem(notification.item);
    if (realtimeItem == null) return;
    let conversationId = normalizeThreadId(notification.threadId);
    this.markActive(conversationId);
    let conversation = this.params.manager.getConversation(conversationId);
    if (conversation == null) {
      this.params.logger.error(`Received thread/realtime/itemAdded for unknown conversation`, {
        safe: { conversationId },
        sensitive: {},
      });
      return;
    }
    let activeTurn = latestTurn(conversation);
    this.params.manager.updateConversationState(conversationId, (state: any) => {
      let currentTurn = lastTurn(state);
      if (
        activeTurn == null ||
        currentTurn?.status !== `inProgress` ||
        (normalizeTurn(currentTurn), !currentTurn.items.some((item: any) => item.type !== `userMessage` && item.type !== `hookPrompt`))
      )
        return;
      let transcriptItems = buildRealtimeTranscriptItems(realtimeItem.input, realtimeItem.transcriptDelta);
      let joinedText = transcriptItems
        .flatMap((item: any) => (item.type === `text` ? [item.text] : []))
        .join(`
`);
      if (
        isDuplicateSteeringText(
          activeTurn.items.filter((item: any) => item.type === `userMessage`),
          activeTurn.items.filter((item: any) => item.type === `steeringUserMessage`),
          transcriptItems,
          joinedText,
          currentTurn.turnId,
          currentTurn.turnStartedAtMs,
          false,
        )
      )
        return;
      let turnStartedAtMs = currentTurn.turnStartedAtMs ?? Date.now();
      currentTurn.turnStartedAtMs = turnStartedAtMs;
      let steeringItem = buildRealtimeSteerMessage({
        id: realtimeItem.codexItemId,
        input: transcriptItems,
        text: realtimeItem.input,
        prompt: joinedText,
        cwd: currentTurn.params.cwd ?? state.cwd ?? `/`,
        targetTurnId: currentTurn.turnId,
        targetTurnStartedAtMs: turnStartedAtMs,
        shouldStripImageDisplayPlaceholderLines: false,
      });
      currentTurn.items.push(freezeIdentity(steeringItem));
    });
    this.params.events.emitTurnSteered(conversationId);
  }

  /** worker 侧创建的 realtime 子线程 → realtimeThreadCreated 事件（父线程须活跃）。 */
  pushWorkerCreated(thread: any) {
    let parentThreadId =
      parseThreadSource(thread.source)?.parentThreadId ?? (thread.parentThreadId == null ? null : normalizeThreadId(thread.parentThreadId));
    if (parentThreadId == null || !this.#isRealtimeConversation(parentThreadId)) return;
    let source = parseThreadSource(thread.source);
    this.params.events.emitRealtimeThreadCreated({
      hostId: this.params.manager.getHostId(),
      prompt: trimToNonNull(thread.preview),
      realtimeThread: { conversationId: parentThreadId, hostId: this.params.manager.getHostId() },
      threadId: normalizeThreadId(thread.id),
      threadTitle:
        trimToNonNull(thread.agentNickname) ??
        trimToNonNull(source?.agentNickname) ??
        trimToNonNull(thread.agentRole) ??
        trimToNonNull(source?.agentRole) ??
        trimToNonNull(thread.name),
    });
  }

  #isRealtimeConversation(conversationId: string) {
    return (
      this.#active.has(conversationId) || this.params.manager.getConversation(conversationId)?.threadSource === `realtime_voice`
    );
  }
}

// ---------------------------------------------------------------------------
// thread goal resume（xSe/SSe/CSe/wSe）
// ---------------------------------------------------------------------------

/**
 * 恢复 realtime 会话的 thread goal（原 xSe）：resume → owner 校验 →
 * settings 更新 → thread/goal/set(active) → appendTranscriptItem 为 false 时
 * 直接写状态，否则本地合成 goal turn。
 */
export async function resumeRealtimeThreadGoal(
  manager: any,
  conversationId: string,
  {
    appendTranscriptItem,
    objective,
    threadSettings,
  }: { appendTranscriptItem: boolean; objective: string; threadSettings: any },
  helpers: { createSearchIslandId: () => string },
) {
  let resume = await manager.resumeConversationForUnavailableOwner({
    conversationId,
    model: null,
    serviceTier: null,
    reasoningEffort: null,
    workspaceRoots: [manager.getConversationCwd(conversationId) ?? `/`],
    collaborationMode: manager.getConversation(conversationId)?.latestCollaborationMode ?? null,
  });
  if (resume.status === `not-ready`) throw new ResumeNotReadyError(resume);
  manager.assertThreadFollowerOwner(conversationId);
  if (threadSettings == null) await manager.waitForPendingThreadSettingsUpdate(conversationId);
  else await manager.updateThreadSettingsForNextTurn(conversationId, threadSettings);
  let { goal } = await manager.sendRequest(`thread/goal/set`, {
    threadId: conversationId,
    objective,
    status: `active`,
  });
  if (appendTranscriptItem === false) {
    manager.updateConversationState(conversationId, (state: any) => {
      state.threadGoal = goal;
    });
  } else {
    applyGoalTurnToState(manager, conversationId, goal, helpers.createSearchIslandId);
  }
  return goal;
}

/** 更新 goal 状态（active 时先落 settings），并清 resume 确认标记（原 SSe）。 */
export async function setThreadGoalStatus(manager: any, conversationId: string, { status, threadSettings }: { status: string; threadSettings: any }) {
  if (status === `active`) {
    if (threadSettings == null) await manager.waitForPendingThreadSettingsUpdate(conversationId);
    else await manager.updateThreadSettingsForNextTurn(conversationId, threadSettings);
  }
  let { goal } = await manager.sendRequest(`thread/goal/set`, { threadId: conversationId, status });
  manager.updateConversationState(conversationId, (state: any) => {
    state.threadGoal = goal;
    state.threadGoalResumeConfirmation = null;
  });
  return goal;
}

/** goal turn 的本地合成参数（`/goal` 输入、minimal effort、completed）。 */
function buildGoalTurnParams(conversationId: string, goal: any, permissions: any) {
  return {
    params: {
      threadId: conversationId,
      input: [{ type: `text`, text: goalCommandText(goal.objective), text_elements: [] }],
      cwd: null,
      approvalPolicy: permissions.approvalPolicy,
      approvalsReviewer: permissions.approvalsReviewer,
      sandboxPolicy: permissions.sandboxPolicy,
      model: null,
      effort: `minimal`,
      summary: `none`,
      personality: null,
      outputSchema: null,
      collaborationMode: null,
    },
    turnId: null,
    turnStartedAtMs: goal.updatedAt * 1e3,
    durationMs: null,
    firstTurnWorkItemStartedAtMs: null,
    finalAssistantStartedAtMs: null,
    status: `completed`,
    error: null,
    diff: null,
    items: [],
  };
}

/** 把 goal turn 合成进会话状态（已有同形 turn 时跳过；原 wSe）。 */
function applyGoalTurnToState(manager: any, conversationId: string, goal: any, createSearchIslandId: () => string) {
  manager.updateConversationState(conversationId, (state: any) => {
    state.threadGoal = goal;
    let currentTurn = lastTurn(state);
    let firstInput = currentTurn?.params.input[0];
    if (
      currentTurn != null &&
      currentTurn.turnId == null &&
      currentTurn.turnStartedAtMs === goal.updatedAt * 1e3 &&
      currentTurn.status === `completed` &&
      currentTurn.items.length === 0 &&
      currentTurn.params.input.length === 1 &&
      firstInput?.type === `text` &&
      firstInput.text === goalCommandText(goal.objective)
    )
      return;
    let defaultPermissions = defaultSandboxConfig([]);
    appendConversationTurn(
      state,
      buildGoalTurnParams(conversationId, goal, {
        approvalPolicy:
          state.latestThreadSettings?.approvalPolicy ?? currentTurn?.params.approvalPolicy ?? defaultPermissions.approvalPolicy,
        approvalsReviewer:
          state.latestThreadSettings?.approvalsReviewer ?? currentTurn?.params.approvalsReviewer ?? defaultPermissions.approvalsReviewer,
        sandboxPolicy:
          state.latestThreadSettings?.sandboxPolicy ?? currentTurn?.params.sandboxPolicy ?? defaultPermissions.sandboxPolicy,
      }),
      createSearchIslandId,
    );
  });
}
