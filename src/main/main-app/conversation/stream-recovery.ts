// 断线重连恢复：StreamRecovery 状态机 + ResumeNotificationBuffer（原版
// 49,597-49,787 与 50,111-50,260 区段）。
//
// StreamRecovery（cSe）：websocket 重连后的会话恢复协调器——
//   - markAllConversationsNeedResumeAfterReconnect：换代（generation Symbol），
//     取消在途 resume、按「恢复流所有权」筛出可恢复会话、全量标记
//     needs_resume、前台会话 10s 后优先重试；
//   - restoreConversationStreamsAfterReconnect：并发 ≤2 的恢复泵；
//   - onResumeAttemptSettled：指数退避（1s 起、上限 60s）；
//     thread_not_found（两次确认）、writer 冲突、归档抑制等停止重试；
//   - markDurableAeonStopped / markConversationNeedsResumeForUnavailableOwner /
//     needsResume：单会话状态口。
//
// ResumeNotificationBuffer（bC）：resume 期间的通知/请求缓冲——按会话缓冲，
// release 时经 replayBufferedNotifications（mSe）去水化重放（completed 的
// agentMessage 抑制其后的 delta；已水化前缀裁剪）。
//
// 原压缩名对照：cSe→StreamRecovery、bC→ResumeNotificationBuffer、mSe→
// replayBufferedNotifications、xC→hydratedItemText、SC→deltaKey、hSe→
// isAgentMessage、gSe→isCommandExecution。

import { Gn as isWriterConflictError, $u as normalizeThreadId, Zo as errorToString } from "@chunk/shared";
// thread_not_found 判定（原 me，1-322 杂项带）。
import { isThreadNotFoundError } from "../misc/thread-errors";
// R3 threads/operations 的 writer 冲突判定（原 Px）。
import { isWriterConflictError as isWriterConflict } from "../threads/operations";
// Mh：从通知 params 提取 threadId（R3 conversations/untrusted-input）。
import { Mh as extractNotificationThreadId } from "../conversations/untrusted-input";

// ---------------------------------------------------------------------------
// ResumeNotificationBuffer（bC）
// ---------------------------------------------------------------------------

/** resume 期间按会话缓冲的通知与请求（重连后按序重放）。 */
export class ResumeNotificationBuffer {
  buffers = new Map<string, BufferedEntry[]>();

  /** 开始缓冲某会话（幂等）。 */
  begin(conversationId: string) {
    this.buffers.has(conversationId) || this.buffers.set(conversationId, []);
  }

  /** 缓冲通知；会话未在缓冲时返回 false（调用方照常投递）。 */
  buffer(delivery: any, shouldIgnore: boolean) {
    return this.push(delivery.notification.params, { type: `notification`, delivery, shouldIgnore });
  }

  /** 缓冲请求（item/tool/call 等服务端请求）。 */
  bufferRequest(request: any) {
    return this.push(request.params, { type: `request`, request });
  }

  /** 释放并重放某会话的缓冲（无缓冲时无操作）。 */
  release(conversationId: string, turns: any, replayNotification: (delivery: any, shouldIgnore: boolean) => void, replayRequest: (request: any) => void) {
    let buffered = this.buffers.get(conversationId);
    this.buffers.delete(conversationId);
    buffered != null && replayBufferedNotifications(buffered, turns, replayNotification, replayRequest);
  }

  /** 丢弃某会话的缓冲。 */
  discard(conversationId: string) {
    this.buffers.delete(conversationId);
  }

  /** 丢弃某会话缓冲中指定的动态工具请求（item/tool/call）。 */
  discardDynamicToolRequest(conversationId: string, requestId: string) {
    let buffered = this.buffers.get(conversationId);
    buffered != null &&
      this.buffers.set(
        conversationId,
        buffered.filter(
          (entry) => entry.type !== `request` || entry.request.method !== `item/tool/call` || entry.request.id !== requestId,
        ),
      );
  }

  /** 按通知 params 归属的会话入缓冲。 */
  private push(params: unknown, entry: BufferedEntry) {
    let conversationId = extractNotificationThreadId(params);
    if (conversationId == null) return false;
    let buffer = this.buffers.get(normalizeThreadId(conversationId));
    return buffer != null && (buffer.push(entry), true);
  }
}

/** 缓冲条目：通知（带投递包装与忽略标记）或服务端请求。 */
type BufferedEntry =
  | { type: `notification`; delivery: any; shouldIgnore: boolean }
  | { type: `request`; request: any };

// ---------------------------------------------------------------------------
// 缓冲重放去水化（mSe + xC/SC/hSe/gSe）
// ---------------------------------------------------------------------------

/**
 * 重放缓冲：先扫一遍把「completed 的 agentMessage 之后到达的 delta」标记
 * 抑制、把 delta/outputDelta 的水化文本（turns 里已有的完整 item 文本）记
 * 录为前缀；重放时裁掉已水化前缀，避免 resume 后文本重复。
 */
function replayBufferedNotifications(
  entries: BufferedEntry[],
  turns: any,
  replayNotification: (delivery: any, shouldIgnore: boolean) => void,
  replayRequest: (request: any) => void,
) {
  let completedAgentMessageDeltaKeys = new Set<string>();
  let hydratedPrefixes = new Map<
    string,
    { text: string[]; hydratedText: string | null; remainingHydratedPrefix: number }
  >();
  for (let entry of entries) {
    if (
      entry.type === `notification` &&
      entry.delivery.notification.method === `item/completed` &&
      entry.delivery.notification.params.item.type === `agentMessage`
    ) {
      completedAgentMessageDeltaKeys.add(
        deltaKey(
          `item/agentMessage/delta`,
          entry.delivery.notification.params.turnId,
          entry.delivery.notification.params.item.id,
        ),
      );
      continue;
    }
    if (
      entry.type === `notification` &&
      (entry.delivery.notification.method === `item/agentMessage/delta` ||
        entry.delivery.notification.method === `item/commandExecution/outputDelta`)
    ) {
      let key = deltaKey(
        entry.delivery.notification.method,
        entry.delivery.notification.params.turnId,
        entry.delivery.notification.params.itemId,
      );
      let existing = hydratedPrefixes.get(key);
      existing == null
        ? hydratedPrefixes.set(key, {
            text: [entry.delivery.notification.params.delta],
            hydratedText: hydratedItemText(
              turns,
              entry.delivery.notification.params.turnId,
              entry.delivery.notification.params.itemId,
              entry.delivery.notification.method,
            ),
            remainingHydratedPrefix: 0,
          })
        : existing.text.push(entry.delivery.notification.params.delta);
    }
  }
  for (let prefix of hydratedPrefixes.values()) {
    let joined = prefix.text.join(``);
    prefix.remainingHydratedPrefix = prefix.hydratedText?.endsWith(joined) ? joined.length : 0;
  }
  for (let entry of entries) {
    if (entry.type === `request`) {
      replayRequest(entry.request);
      continue;
    }
    let delivery = entry.delivery;
    let notification = delivery.notification;
    if (
      notification.method === `item/started` &&
      notification.params.item.type === `agentMessage` &&
      notification.params.item.text.length === 0
    ) {
      let key = deltaKey(`item/agentMessage/delta`, notification.params.turnId, notification.params.item.id);
      let prefix = hydratedPrefixes.get(key);
      let hydrated =
        prefix == null
          ? hydratedItemText(turns, notification.params.turnId, notification.params.item.id, `item/agentMessage/delta`)
          : prefix.hydratedText;
      hydrated != null &&
        (prefix == null || prefix.remainingHydratedPrefix > 0) &&
        (delivery = {
          ...delivery,
          notification: { ...notification, params: { ...notification.params, item: { ...notification.params.item, text: hydrated } } },
        });
    }
    if (notification.method !== `item/agentMessage/delta` && notification.method !== `item/commandExecution/outputDelta`) {
      replayNotification(delivery, entry.shouldIgnore);
      continue;
    }
    let key = deltaKey(notification.method, notification.params.turnId, notification.params.itemId);
    if (notification.method === `item/agentMessage/delta` && completedAgentMessageDeltaKeys.has(key)) continue;
    let prefix = hydratedPrefixes.get(key);
    let remainingHydratedPrefix = prefix?.remainingHydratedPrefix ?? 0;
    let overlap = Math.min(remainingHydratedPrefix, notification.params.delta.length);
    prefix != null && (prefix.remainingHydratedPrefix -= overlap);
    let remainingDelta = notification.params.delta.slice(overlap);
    remainingDelta.length > 0 &&
      replayNotification(
        { ...entry.delivery, notification: { ...notification, params: { ...notification.params, delta: remainingDelta } } },
        entry.shouldIgnore,
      );
  }
}

/** 从 turns 里读 item 的已水化文本（delta → agentMessage.text；outputDelta → aggregatedOutput）。 */
function hydratedItemText(turns: any, turnId: string, itemId: string, method: string) {
  let item = turns?.find((turn: any) => turn.turnId === turnId)?.items.find((candidate: any) => candidate.id === itemId);
  return method === `item/agentMessage/delta` && isAgentMessage(item)
    ? item.text
    : method === `item/commandExecution/outputDelta` && isCommandExecution(item)
      ? item.aggregatedOutput
      : null;
}

/** delta 去重键：`<method>:<turnId>:<itemId>`。 */
function deltaKey(method: string, turnId: string | null, itemId: string) {
  return `${method}:${turnId ?? ``}:${itemId}`;
}

function isAgentMessage(item: any) {
  return item?.type === `agentMessage`;
}

function isCommandExecution(item: any) {
  return item?.type === `commandExecution`;
}

// ---------------------------------------------------------------------------
// StreamRecovery（cSe）
// ---------------------------------------------------------------------------

/** StreamRecovery 的依赖注入面。 */
export interface StreamRecoveryDeps {
  manager: any;
  streamState: any;
  threadStore: any;
  pagination: any;
  resumeNotificationBuffer: ResumeNotificationBuffer;
  inFlightConversationResumes: Map<string, any>;
  schedule: (callback: () => void, delayMs: number) => () => void;
  clearConversationStreamOwnership: (conversationId: string) => void;
  resume: (conversation: any) => Promise<unknown>;
  isDisposed: () => boolean;
}

/**
 * 断线重连恢复状态机（原 cSe）。generation Symbol 换代使旧代重试定时器
 * 全部失效；恢复泵并发 ≤2；重试退避 1s 起指数翻倍、上限 60s。
 */
export class StreamRecovery {
  deps: StreamRecoveryDeps;
  generation: symbol | null = null;
  pendingConversationIds = new Set<string>();
  recoverableConversationIds = new Set<string>();
  retryTimers = new Map<string, () => void>();
  retryDelayMs = new Map<string, number>();
  unconfirmedMissingConversationIds = new Set<string>();
  activeResumes = 0;

  constructor(deps: StreamRecoveryDeps) {
    this.deps = deps;
  }

  /** 释放：清换代、取消全部重试定时器与簿记集合。 */
  dispose() {
    this.generation = null;
    for (let cancel of this.retryTimers.values()) cancel();
    this.retryTimers.clear();
    this.retryDelayMs.clear();
    this.unconfirmedMissingConversationIds.clear();
    this.pendingConversationIds.clear();
    this.recoverableConversationIds.clear();
  }

  /** durable aeon 停止：取消分页装载、标记 needs_resume + notLoaded、清流所有权。 */
  markDurableAeonStopped(conversationId: string) {
    this.deps.pagination.cancelItemLoads(conversationId);
    this.deps.threadStore.conversations.has(conversationId) &&
      this.deps.manager.updateConversationState(conversationId, (state: any) => {
        state.resumeState = `needs_resume`;
        state.threadRuntimeStatus = { type: `notLoaded` };
      });
    this.deps.clearConversationStreamOwnership(conversationId);
  }

  /** owner 不可达：follower 且 owner 匹配时清流所有权；标记 needs_resume（不覆写已有标记）。 */
  markConversationNeedsResumeForUnavailableOwner(conversationId: string, ownerClientId: string) {
    let role = this.deps.manager.getStreamRole(conversationId);
    if (role?.role === `follower`) {
      if (role.ownerClientId !== ownerClientId) return;
      this.deps.clearConversationStreamOwnership(conversationId);
    }
    let conversation = this.deps.threadStore.conversations.get(conversationId);
    conversation != null &&
      conversation.resumeState !== `needs_resume` &&
      this.deps.manager.updateConversationState(
        conversationId,
        (state: any) => {
          state.resumeState = `needs_resume`;
        },
        false,
      );
  }

  /** 会话是否需要 resume（无状态、已标记、或无流角色）。 */
  needsResume(conversationId: string) {
    let conversation = this.deps.threadStore.conversations.get(conversationId);
    return !conversation || conversation.resumeState === `needs_resume` || this.deps.manager.getStreamRole(conversationId) == null;
  }

  /**
   * 重连后全量标记：换代 + 取消在途 resume；restoreStreams 时只恢复「自己
   * 持有历史流所有权」的会话（前台会话 10s 后优先重试）；全部会话标记
   * needs_resume（有在途请求的也清空 requests）。
   */
  markAllConversationsNeedResumeAfterReconnect(options: {
    restoreStreams?: boolean;
    foregroundConversationId?: string | null;
  } | null) {
    let generation = Symbol();
    this.dispose();
    this.generation = generation;
    this.activeResumes = 0;
    for (let [conversationId, cancel] of this.deps.inFlightConversationResumes) {
      cancel();
      this.deps.resumeNotificationBuffer.discard(conversationId);
    }
    this.deps.inFlightConversationResumes.clear();
    let restorable = options?.restoreStreams
      ? [...this.deps.streamState.getStreamingConversations()].filter((conversationId: string) =>
          this.deps.streamState.ownsConversationHistoryStream(conversationId),
        )
      : [];
    for (let conversationId of restorable) {
      this.recoverableConversationIds.add(conversationId);
      conversationId !== options?.foregroundConversationId && this.pendingConversationIds.add(conversationId);
    }
    this.deps.pagination.resetAfterReconnect();
    this.deps.threadStore.resetAfterReconnect();
    let { previousStreamingCount, previousRoleCount } = this.deps.streamState.resetAfterReconnect(
      options?.restoreStreams === true,
    );
    let markedCount = 0;
    for (let [conversationId, conversation] of this.deps.threadStore.conversations) {
      (conversation.resumeState !== `needs_resume` || conversation.requests.length !== 0) &&
        (conversation.resumeState !== `needs_resume` && (markedCount += 1),
        this.deps.manager.updateConversationState(conversationId, (state: any) => {
          state.resumeState = `needs_resume`;
          state.requests = [];
        }));
    }
    this.deps.manager.logger.info(`websocket_reconnect_marked_threads_needing_resume`, {
      safe: {
        conversationCount: this.deps.threadStore.conversations.size,
        markedCount,
        previousStreamingCount,
        previousRoleCount,
      },
      sensitive: {},
    });
    options?.foregroundConversationId != null &&
      this.recoverableConversationIds.has(options.foregroundConversationId) &&
      this.scheduleRetry(options.foregroundConversationId, generation, 10_000);
    this.restoreConversationStreamsAfterReconnect();
  }

  /**
   * 单次 resume 尝试落定：成功停止重试；thread_not_found（两次确认）、
   * writer 冲突、归档抑制停止；否则指数退避（thread_not_found 首次直接
   * 60s）。
   */
  onResumeAttemptSettled(conversationId: string, result: any, error: unknown) {
    if (!this.recoverableConversationIds.has(conversationId)) return;
    if (result?.status === `ready`) {
      this.stopRetrying(conversationId);
      return;
    }
    let isThreadNotFound = error instanceof Error && isThreadNotFoundError(error);
    if (
      this.deps.manager.isConversationSuppressedAfterArchive(conversationId) ||
      isWriterConflict(error) ||
      isWriterConflictError(error) ||
      (isThreadNotFound && this.unconfirmedMissingConversationIds.has(conversationId))
    ) {
      this.stopRetrying(conversationId);
      return;
    }
    if (
      (isThreadNotFound
        ? this.unconfirmedMissingConversationIds.add(conversationId)
        : this.unconfirmedMissingConversationIds.delete(conversationId),
      this.deps.isDisposed() ||
        this.deps.threadStore.conversations.get(conversationId)?.resumeState !== `needs_resume` ||
        !this.deps.streamState.ownsConversationHistoryStream(conversationId))
    ) {
      this.stopRetrying(conversationId);
      return;
    }
    this.pendingConversationIds.delete(conversationId);
    let delay = isThreadNotFound ? 60_000 : Math.min((this.retryDelayMs.get(conversationId) ?? 1_000) * 2, 60_000);
    this.retryDelayMs.set(conversationId, delay);
    this.retryTimers.get(conversationId)?.();
    this.retryTimers.delete(conversationId);
    this.scheduleRetry(conversationId, this.generation, delay);
  }

  /** 排一次重试（换代失效：generation 不匹配或已有定时器时跳过）。 */
  scheduleRetry(conversationId: string, generation: symbol | null, delayMs: number) {
    generation == null ||
      this.retryTimers.has(conversationId) ||
      this.retryTimers.set(
        conversationId,
        this.deps.schedule(() => {
          this.retryTimers.delete(conversationId);
          if (!(this.generation !== generation || this.deps.isDisposed())) {
            if (
              !this.recoverableConversationIds.has(conversationId) ||
              this.deps.threadStore.conversations.get(conversationId)?.resumeState !== `needs_resume` ||
              !this.deps.streamState.ownsConversationHistoryStream(conversationId)
            ) {
              this.stopRetrying(conversationId);
              return;
            }
            this.deps.inFlightConversationResumes.has(conversationId) ||
              (this.pendingConversationIds.add(conversationId),
              this.restoreConversationStreamsAfterReconnect());
          }
        }, delayMs),
      );
  }

  /** 恢复泵：并发 ≤2，从 pending 集合按插入序取会话 resume。 */
  restoreConversationStreamsAfterReconnect() {
    for (; this.activeResumes < 2 && this.pendingConversationIds.size > 0; ) {
      let conversationId = this.pendingConversationIds.values().next().value as string | undefined;
      if (conversationId == null) return;
      this.pendingConversationIds.delete(conversationId);
      let conversation = this.deps.threadStore.conversations.get(conversationId);
      if (
        conversation?.resumeState !== `needs_resume` ||
        !this.deps.streamState.ownsConversationHistoryStream(conversationId)
      ) {
        this.stopRetrying(conversationId);
        continue;
      }
      if (this.deps.inFlightConversationResumes.has(conversationId)) continue;
      let attemptGeneration = this.generation;
      this.activeResumes += 1;
      Promise.resolve()
        .then(() => {
          if (
            !(
              this.generation !== attemptGeneration ||
              this.deps.isDisposed() ||
              this.deps.inFlightConversationResumes.has(conversationId)
            )
          )
            return this.deps.resume(conversation);
        })
        .catch((error: unknown) => {
          this.deps.isDisposed() ||
            this.generation !== attemptGeneration ||
            this.deps.manager.logger.warning(`websocket_reconnect_thread_resume_failed`, {
              safe: { conversationId },
              sensitive: { error },
            });
        })
        .finally(() => {
          this.generation === attemptGeneration &&
            (--this.activeResumes, this.restoreConversationStreamsAfterReconnect());
        });
    }
  }

  /** 停止重试并清理该会话的全部簿记。 */
  stopRetrying(conversationId: string) {
    this.recoverableConversationIds.delete(conversationId);
    this.pendingConversationIds.delete(conversationId);
    this.retryTimers.get(conversationId)?.();
    this.retryTimers.delete(conversationId);
    this.retryDelayMs.delete(conversationId);
    this.unconfirmedMissingConversationIds.delete(conversationId);
  }
}
