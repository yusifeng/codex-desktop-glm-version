// 排队 follow-up 消息协调器（原版 51,829-52,693 区段）。
//
// QueuedFollowUpsCoordinator（VSe，extends n.Uf）：每会话的排队消息队列——
//   - 双存储：本地 storage（持久化）+ serverQueue（app-server 侧队列，
//     isEnabled 时优先）；
//   - sendMessage：显式提交（queue/steer/start 模式判定 + when-idle 延迟）；
//   - 自动执行：execution 订阅（changed/readinessChanged/turnCompleted）驱动
//     tryRunConversation（锁：tryAcquireStartTurn + acquireSendLock）；
//   - follower 广播：owner 写 storage 后广播，follower 直接接受 owner 状态；
//   - storage 刷新（refreshQueues）：批量重读 + storage-change 合并去抖。
//
// 工厂 createQueuedFollowUps（USe）把 rw 的方法面适配为 options。
//
// 原压缩名对照：VSe→QueuedFollowUpsCoordinator、TC→
// assertNoUntrustedQueueContext、HSe→shouldHoldQueuedMessage、USe→
// createQueuedFollowUps、wC→EMPTY_QUEUE、BSe→cloneDeep interop。

import {
  $u as normalizeThreadId,
  Uf as ConversationEventEmitterBase,
  Wn as ResumeNotReadyError,
  Cs as isDurableHost,
  io as isUntrustedQueueContext,
  no as untrustedQueueContextError,
} from "@chunk/shared";
// using 作用域（a.en）——@chunk/main-shared。
import { en as usingScope } from "@chunk/main-shared";
// Sm（27,880）= ConversationStreamSubscription——R3 app-server/stream-subscription。
import { Sm as ConversationStreamSubscription } from "../app-server/stream-subscription";
// Fg/kg：turn 视图——R3 turns/canonical-history。
import { lastIncompleteTurn, mergedConversationTurns } from "../turns/canonical-history";
// tSe/_C：steer 错误分类——本区 conversation/turn-steer。
import { isSteerTurnInactiveError, isNoActiveTurnError } from "./turn-steer";
// cloneDeep（原 BSe interop）——R3 util/lodash-interop 尚未导出，缺导出已记录。
import { cloneDeep } from "../util/lodash-interop";

/** 空队列常量（原 wC——共享同一数组引用）。 */
const EMPTY_QUEUE: any[] = [];

/** 消息上下文含非信任输入时抛错（原 TC）。 */
function assertNoUntrustedQueueContext(messages: any[]) {
  if (messages.some((message) => isUntrustedQueueContext(message.context))) throw Error(untrustedQueueContextError);
}

/**
 * 是否应扣住排队消息（原 HSe）：已暂停/无会话/follower/turn 进行中 → 是；
 * 需要 resume 或无 turn → 否；turn 已完成且末条目是 agentMessage/手动压缩
 * → 否（可发送），否则是。
 */
export function shouldHoldQueuedMessage({
  conversationNeedsResume,
  hasConversation,
  latestTurn,
  message,
  streamRole,
}: {
  conversationNeedsResume: boolean;
  hasConversation: boolean;
  latestTurn: any;
  message: any;
  streamRole: any;
}) {
  return message.pausedReason || !hasConversation || streamRole?.role === `follower` || latestTurn?.status === `inProgress`
    ? true
    : conversationNeedsResume || latestTurn == null
      ? false
      : latestTurn.status !== `completed` ||
        !latestTurn.items.some(
          (item: any) =>
            item.type === `agentMessage` ||
            (item.type === `contextCompaction` && `source` in item && item.source === `manual`),
        );
}

/** 排队协调器 options 面（rw 装配时注入）。 */
export interface QueuedFollowUpsOptions {
  createMessageThreadId: (conversationId: string) => string | null | undefined;
  onQueueChanged?: ((conversationId: string | null) => void) | undefined;
  execution: any;
  getMessageQueueMode: (submission: any) => Promise<string>;
  submissionHost: {
    needsResume: (conversationId: string) => boolean;
    resume: (request: any, signal?: unknown) => Promise<any>;
    getActiveTurnId: (conversationId: string) => string | null;
    hasPendingTurnStart: (conversationId: string) => boolean;
    hasFinalAnswer: (conversationId: string) => boolean;
    start: (conversationId: string, start: any, onMessageAdded?: unknown) => Promise<{ turn: { id: string } }>;
    steer: (conversationId: string, steer: any, onMessageAdded?: unknown) => Promise<{ turnId: string }>;
    canStartAfterSteerError: (conversationId: string, error: unknown, executionHostId: unknown) => boolean;
  };
  canSend: (conversationId: string, message: any) => boolean;
  coordination: any;
  getStreamRole: (conversationId: string) => any;
  logger: any;
  requestFollower: (conversationId: string, state: Record<string, any>, ownerClientId: string) => Promise<any>;
  storage: {
    read: () => { isLoading: boolean; value: Record<string, any[]> | undefined };
    load: () => Promise<Record<string, any[]>>;
    update: (updater: (state: Record<string, any[]>) => Record<string, any[]>) => Promise<unknown>;
  };
}

/** 会话级待写条目（pending 合并计数 + 提交快照 + follower 广播）。 */
interface PendingWrite {
  count: number;
  committedMessages: any[] | undefined;
  broadcast: { sourceClientId: string; messages: any[] } | undefined;
}

/**
 * 排队 follow-up 协调器（原 VSe）。写路径全部经 persistMessages 串行化
 * （pendingQueueWrites 链），读路径三级回退：内存 messages → serverQueue →
 * storage（loadedState/value）。
 */
export class QueuedFollowUpsCoordinator extends ConversationEventEmitterBase {
  options: QueuedFollowUpsOptions;
  messages = new Map<string, { messages: any[]; refreshing: boolean }>();
  queueRefresh: Promise<void> | undefined;
  queueRefreshRequested: string | undefined;
  loadedState: Record<string, any[]> | undefined;
  loading: Promise<void> | undefined;
  pending = new Map<string, PendingWrite>();
  unregisterBroadcast: (() => void) | undefined;
  pendingQueueWrites: Promise<unknown> = Promise.resolve();
  execution: any;
  serverQueue: any;
  stopServerQueue: (() => void) | undefined;
  executionReady: Promise<void>;
  automaticTurnDeferrals = new Map<string, number>();
  stopExecution: (() => void) | undefined;
  running = new Set<string>();
  rerun = new Set<string>();
  disposed = false;

  constructor(options: QueuedFollowUpsOptions) {
    super();
    this.options = options;
    this.unregisterBroadcast =
      options.execution == null
        ? undefined
        : options.coordination?.registerBroadcastHandler(({ params, sourceClientId }: any) => {
            let role = options.getStreamRole(params.conversationId);
            if (this.disposed || role?.role !== `follower` || role.ownerClientId !== sourceClientId) return;
            let pending = this.pending.get(params.conversationId);
            if (pending != null) {
              pending.broadcast = { sourceClientId, messages: params.messages };
              return;
            }
            this.#commitLocalMessages(params.conversationId, params.messages);
          });
    this.executionReady = Promise.resolve().then(() => {
      if (!this.disposed && options.execution != null) this.#attachExecution(options.execution());
    });
    this.executionReady.catch((error: unknown) => {
      options.logger.error(`Failed to initialize queued message execution`, {
        safe: {},
        sensitive: { error },
      });
    });
  }

  dispose = () => {
    this.disposed = true;
    this.stopExecution?.();
    this.stopServerQueue?.();
    this.serverQueue?.dispose();
    this.execution = undefined;
    this.rerun.clear();
    this.automaticTurnDeferrals.clear();
    this.unregisterBroadcast?.();
    this.messages.clear();
    this.pending.clear();
    this.loadedState = undefined;
    this.queueRefresh = undefined;
    this.queueRefreshRequested = undefined;
  };

  /** 挂接 app-server 侧队列（isEnabled 时优先读写）。 */
  setServerQueue = (queue: any) => {
    if (this.disposed) {
      queue.dispose();
      return;
    }
    this.stopServerQueue?.();
    this.serverQueue?.dispose();
    this.serverQueue = queue;
    this.stopServerQueue = queue.subscribe((state: any) => {
      this.options.onQueueChanged?.(state);
    });
  };

  /** 挂起某会话的自动 turn（计数式，Sm 句柄释放时恢复）。 */
  deferAutomaticTurns(conversationId: string) {
    if (this.disposed) throw Error(`Turn coordinator retired`);
    this.automaticTurnDeferrals.set(conversationId, (this.automaticTurnDeferrals.get(conversationId) ?? 0) + 1);
    return new ConversationStreamSubscription(() => {
      if (this.disposed) return;
      let remaining = (this.automaticTurnDeferrals.get(conversationId) ?? 1) - 1;
      remaining > 0
        ? this.automaticTurnDeferrals.set(conversationId, remaining)
        : (this.automaticTurnDeferrals.delete(conversationId), this.#tryRunConversation(conversationId));
    });
  }

  /** 显式提交消息（原 sendMessage）：queue/steer/start 三路判定。 */
  async sendMessage(submission: any, prepareSubmission: (submission: any, mode: string) => Promise<any>, onMessageAdded?: unknown) {
    try {
      var scope = usingScope();
      if (this.disposed) throw Error(`Turn coordinator retired`);
      let messageThreadId =
        submission.editPosition?.messageThreadId ??
        submission.message.context.messageThreadId ??
        this.options.createMessageThreadId(submission.conversationId);
      let normalized = cloneDeep({
        ...submission,
        message: {
          ...submission.message,
          submissionOptions: submission.message.submissionOptions ?? submission.options,
          context: {
            ...submission.message.context,
            ...(messageThreadId == null ? {} : { messageThreadId }),
            ...(submission.editPosition == null
              ? {}
              : {
                  isImageEditFollowUp:
                    submission.editPosition.isImageEditFollowUp ?? submission.message.context.isImageEditFollowUp,
                  turnTrigger: submission.editPosition.turnTrigger ?? submission.message.context.turnTrigger,
                }),
          },
        },
      });
      let { conversationId, message } = normalized;
      scope.u(this.deferAutomaticTurns(conversationId));
      let queueMode = await this.options.getMessageQueueMode(normalized);
      let effectiveMode = queueMode === `send-only` ? `send-only` : (normalized.queueModeOverride ?? queueMode);
      let shouldQueue = () =>
        effectiveMode === `queue` ||
        (effectiveMode !== `send-only` &&
          (this.options.submissionHost.hasPendingTurnStart(conversationId) ||
            (normalized.queueModeOverride !== `send-now` && this.options.submissionHost.hasFinalAnswer(conversationId))));
      if (
        effectiveMode === `queue-only` ||
        (shouldQueue() &&
          (this.options.submissionHost.hasPendingTurnStart(conversationId) ||
            this.options.submissionHost.getActiveTurnId(conversationId) != null))
      )
        return await this.#enqueue(conversationId, message, normalized.editPosition);
      let prepared = await prepareSubmission(normalized, `steer`);
      if (prepared.conversationId !== conversationId) throw Error(`Prepared submission belongs to another thread`);
      let requiresIdle = shouldQueue() || prepared.requiresIdle === true;
      let sendMode = requiresIdle ? `when-idle` : `send-now`;
      let result = await this.#submit(prepared, sendMode, false, undefined, onMessageAdded);
      if (result.status === `needs-start-preparation`) {
        let afterInactiveTurnId = result.afterInactiveTurnId;
        prepared = await prepareSubmission(normalized, `start`);
        if (prepared.conversationId !== conversationId || prepared.start == null)
          throw Error(`Start preparation did not produce a matching turn request`);
        requiresIdle = shouldQueue() || prepared.requiresIdle === true;
        result = await this.#submit(
          { ...prepared, afterInactiveTurnId },
          requiresIdle ? `when-idle` : `send-now`,
          false,
          undefined,
          onMessageAdded,
        );
      }
      if (result.status === `deferred` && requiresIdle) return await this.#enqueue(conversationId, message, normalized.editPosition);
      if (result.status !== `sent`) throw Error(`Explicit message submission was not sent`);
      return { status: `sent`, messageId: message.id, turnId: result.turnId };
    } catch (error) {
      scope.e = error;
    } finally {
      scope.d();
    }
  }

  /** 立即发送某条排队消息（原 sendQueuedMessageNow）。 */
  async sendQueuedMessageNow(conversationId: string, messageId: string, options: any, prepareSubmission: any) {
    try {
      var scope = usingScope();
      scope.u(this.deferAutomaticTurns(conversationId));
      await this.executionReady;
      await this.loadMessages(conversationId);
      let serverQueue = this.#getServerQueueIfEnabled(conversationId);
      if (serverQueue != null)
        return await serverQueue.sendNow(conversationId, messageId, options, (message: any, resolvedOptions: any) =>
          this.#sendNowForServerQueue(conversationId, message, { ...resolvedOptions, clientUserMessageId: messageId }, prepareSubmission),
        );
      let execution = this.execution;
      if (this.disposed || execution == null) throw Error(`Queued message execution is unavailable`);
      for (; this.queueRefresh != null; ) await this.queueRefresh;
      let sentResult: { status: string; messageId: string; turnId: any } | null = null;
      await this.#runQueuedMessage(conversationId, execution, {
        messageId,
        operation: {
          prepare: async (message: any, resolvedOptions: any) => ({
            status: `ready`,
            submission: await prepareSubmission(
              { conversationId, message, options: resolvedOptions, queueModeOverride: `send-now` },
              resolvedOptions,
            ),
          }),
          onResult: (_message: any, _options: any, result: any) => {
            result.status === `sent` && (sentResult = { status: `sent`, messageId, turnId: result.turnId });
          },
        },
      });
      return sentResult;
    } catch (error) {
      scope.e = error;
    } finally {
      scope.d();
    }
  }

  /** serverQueue 消息的显式发送（steer 优先，失败转 start）。 */
  async #sendNowForServerQueue(conversationId: string, message: any, options: any, prepareSubmission: any) {
    let prepared = await prepareSubmission(
      { conversationId, message, options, queueModeOverride: `send-now` },
      `steer`,
    );
    let result = await this.#submit(prepared, `send-now`, false);
    if (result.status === `needs-start-preparation`) {
      prepared = await prepareSubmission(
        { conversationId, message, options, queueModeOverride: `send-now` },
        `start`,
      );
      if (prepared.start == null) throw Error(`Start preparation did not produce a turn request`);
      result = await this.#submit(prepared, `send-now`, false);
    }
    if (result.status !== `sent`) throw Error(`Explicit message submission was not sent`);
    return { status: `sent`, messageId: message.id, turnId: result.turnId };
  }

  sendPreparedMessage = async (submission: any) => {
    try {
      var scope = usingScope();
      let messageThreadId =
        submission.steer.restoreMessage.context.messageThreadId ??
        submission.start?.context?.messageThreadId ??
        this.options.createMessageThreadId(submission.conversationId);
      if (messageThreadId != null) {
        submission.steer.restoreMessage.context.messageThreadId = messageThreadId;
        submission.start != null &&
          (submission.start.context = { ...submission.start.context, messageThreadId });
      }
      scope.u(this.deferAutomaticTurns(submission.conversationId));
      let result = await this.#submit(submission, `send-now`, false);
      if (result.status !== `sent`) throw Error(`Prepared message was not sent`);
      return result.turnId;
    } catch (error) {
      scope.e = error;
    } finally {
      scope.d();
    }
  };

  /** 入队（本地或 serverQueue）。 */
  async #enqueue(conversationId: string, message: any, editPosition: any) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    return serverQueue == null
      ? (await this.#persistMessages(conversationId, (messages) => this.#insertMessage(messages, message, editPosition), false),
        { status: `queued`, messageId: message.id })
      : serverQueue.enqueue(conversationId, message, editPosition);
  }

  /** 清空某会话队列。 */
  async clearQueuedMessages(conversationId: string) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    return serverQueue == null ? this.#persistMessages(conversationId, () => [], false) : serverQueue.clear(conversationId);
  }

  /** 移除某条排队消息。 */
  async removeQueuedMessage(conversationId: string, messageId: string) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    if (serverQueue != null) return serverQueue.remove(conversationId, messageId);
    let remaining = await this.#persistMessages(
      conversationId,
      (messages) => messages.filter((message) => message.id !== messageId),
      false,
    );
    let index = remaining.findIndex((message) => message.id === messageId);
    let removed = remaining[index];
    return removed == null
      ? null
      : {
          index,
          message: removed,
          previousMessageId: remaining[index - 1]?.id ?? null,
          nextMessageId: remaining[index + 1]?.id ?? null,
        };
  }

  /** 恢复被移除的排队消息（按原位置）。 */
  async restoreQueuedMessage(conversationId: string, restore: { index: number; message: any; nextMessageId: string | null; previousMessageId: string | null }) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    if (serverQueue != null) {
      await serverQueue.restore(conversationId, restore);
      return;
    }
    await this.#persistMessages(
      conversationId,
      (messages) => {
        if (messages.some((message) => message.id === restore.message.id)) return messages;
        let nextIndex = messages.findIndex((message) => message.id === restore.nextMessageId);
        let previousIndex = messages.findIndex((message) => message.id === restore.previousMessageId);
        let insertIndex = Math.min(Math.max(restore.index, 0), messages.length);
        if (nextIndex === -1) {
          if (previousIndex !== -1) insertIndex = previousIndex + 1;
        } else {
          insertIndex = nextIndex;
        }
        return [...messages.slice(0, insertIndex), restore.message, ...messages.slice(insertIndex)];
      },
      false,
    );
  }

  /** 重排某会话队列（按给定 id 顺序，未列出的保持相对序）。 */
  async reorderQueuedMessages(conversationId: string, orderedIds: string[]) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    if (serverQueue != null) {
      await serverQueue.reorder(conversationId, orderedIds);
      return;
    }
    await this.#persistMessages(
      conversationId,
      (messages) => {
        let byId = new Map(messages.map((message) => [message.id, message]));
        let ordered: any[] = [];
        for (let id of orderedIds) {
          let message = byId.get(id);
          message != null && (ordered.push(message), byId.delete(id));
        }
        return [...ordered, ...byId.values()];
      },
      false,
    );
  }

  /** 恢复被中断的排队消息（去掉 pausedReason）。 */
  async resumeInterruptedQueuedMessages(conversationId: string) {
    await this.loadMessages(conversationId);
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    if (serverQueue != null) {
      await serverQueue.resume(conversationId);
      return;
    }
    await this.#persistMessages(
      conversationId,
      (messages) =>
        messages.map((message) => {
          if (message.pausedReason !== `Interrupted before the steer was accepted.`) return message;
          let { pausedReason, ...rest } = message;
          return rest;
        }),
      false,
    );
  }

  /** 按编辑位置插入消息（无位置则追加）。 */
  #insertMessage(messages: any[], message: any, editPosition: any) {
    if (editPosition == null) return [...messages, message];
    let withoutSame = messages.filter((candidate) => candidate.id !== message.id);
    let nextIndex = withoutSame.findIndex((candidate) => candidate.id === editPosition.nextMessageId);
    let previousIndex = withoutSame.findIndex((candidate) => candidate.id === editPosition.previousMessageId);
    let insertIndex = withoutSame.length;
    if (nextIndex === -1) {
      if (previousIndex !== -1) insertIndex = previousIndex + 1;
    } else {
      insertIndex = nextIndex;
    }
    return [...withoutSame.slice(0, insertIndex), message, ...withoutSame.slice(insertIndex)];
  }

  /** 提交决策（原 #r）：resume → steer（活跃 turn）→ start（无活跃）。 */
  async #submit(submission: any, sendMode: string, allowStartAfterNoActiveTurn: boolean, isCurrent?: () => boolean, onMessageAdded?: unknown) {
    if (this.disposed) throw Error(`Turn coordinator retired`);
    let submissionHost = this.options.submissionHost;
    let { conversationId } = submission;
    if (submission.resume.conversationId !== conversationId)
      throw Error(`Resume request does not match the submission thread`);
    let activeTurnIdFromResume: string | null = null;
    if (submissionHost.needsResume(conversationId)) {
      let resumeResult = await submissionHost.resume(submission.resume, onMessageAdded);
      if (resumeResult.status === `not-ready`) throw new ResumeNotReadyError(resumeResult);
      activeTurnIdFromResume = resumeResult.activeTurnId;
    }
    if (this.disposed) throw Error(`Turn coordinator retired`);
    if (isCurrent != null && !isCurrent()) return { status: `deferred` };
    let activeTurnId = submissionHost.getActiveTurnId(conversationId) ?? activeTurnIdFromResume;
    let hasPendingStart = submissionHost.hasPendingTurnStart(conversationId);
    let afterInactiveTurnId = submission.afterInactiveTurnId;
    if ((sendMode === `when-idle` || submission.requiresIdle === true) && (activeTurnId != null || hasPendingStart))
      return { status: `deferred` };
    if (activeTurnId == null ? hasPendingStart : activeTurnId !== afterInactiveTurnId) {
      try {
        return { status: `sent`, kind: `steer`, turnId: await submissionHost.steer(conversationId, submission.steer, onMessageAdded) };
      } catch (error) {
        if (
          this.disposed ||
          (!submissionHost.canStartAfterSteerError(conversationId, error, submission.executionHostId) &&
            !(submission.allowStartAfterNoActiveTurn && isNoActiveTurnError(error)))
        )
          throw error;
        afterInactiveTurnId = activeTurnId ?? undefined;
      }
    }
    return submission.start == null
      ? { status: `needs-start-preparation`, afterInactiveTurnId }
      : isCurrent != null && !isCurrent()
        ? { status: `deferred` }
        : { status: `sent`, kind: `start`, turnId: await submissionHost.start(conversationId, submission.start, onMessageAdded) };
  }

  /** 挂接执行面（原 #i）：变更/就绪/turn 完成回调驱动队列推进。 */
  #attachExecution(execution: any) {
    if (this.execution != null || this.disposed)
      throw Error(`Queued message execution already started or retired`);
    this.execution = execution;
    this.stopExecution = execution.subscribe({
      changed: () => this.#refreshQueues(),
      readinessChanged: () => this.#scheduleAutomaticTurns(),
      turnCompleted: ({ conversationId, status }: any) => {
        this.#getServerQueueIfEnabled(conversationId) == null &&
          this.options.getStreamRole(conversationId)?.role !== `follower` &&
          (status === `interrupted` &&
            this.mutate(conversationId, (messages) =>
              messages.map((message) => ({
                ...message,
                pausedReason: message.pausedReason ?? `Interrupted before the steer was accepted.`,
              })),
            ),
          status !== `interrupted` && this.#tryRunConversation(conversationId));
      },
    });
    this.#scheduleAutomaticTurns();
  }

  executionChanged = () => {
    this.#scheduleAutomaticTurns();
  };

  /** 批量刷新队列（原 #a）：storage 重读，storage-change 请求合并。 */
  #refreshQueues() {
    if (this.disposed) return;
    let refreshable = Array.from(this.messages).filter(
      ([conversationId]) => !this.pending.has(conversationId) && this.options.getStreamRole(conversationId)?.role !== `follower`,
    );
    for (let [, entry] of refreshable) entry.refreshing = true;
    this.options.onQueueChanged?.(null);
    if (this.queueRefresh != null) {
      this.queueRefreshRequested = `storage-change`;
      return;
    }
    if (refreshable.length === 0) {
      this.#scheduleAutomaticTurns();
      return;
    }
    let refresh = this.options.storage
      .load()
      .then((state) => {
        if (
          !(
            this.disposed ||
            this.queueRefresh !== refresh ||
            this.queueRefreshRequested === `storage-change`
          )
        ) {
          this.queueRefreshRequested = undefined;
          this.loadedState = state;
          this.loading = Promise.resolve();
          for (let [conversationId, entry] of refreshable)
            this.messages.get(conversationId) === entry &&
              !this.pending.has(conversationId) &&
              this.options.getStreamRole(conversationId)?.role !== `follower` &&
              this.messages.set(conversationId, { messages: state[conversationId] ?? EMPTY_QUEUE, refreshing: false });
          this.options.onQueueChanged?.(null);
          this.#scheduleAutomaticTurns();
        }
      })
      .catch((error: unknown) => {
        this.disposed ||
          this.options.logger.warning(`Failed to refresh queued follow-ups`, {
            safe: {},
            sensitive: { error },
          });
      })
      .finally(() => {
        if (this.queueRefresh === refresh) {
          this.queueRefresh = undefined;
          this.queueRefreshRequested != null && ((this.queueRefreshRequested = undefined), this.#refreshQueues());
        }
      });
    this.queueRefresh = refresh;
  }

  /** 唤醒全部已知会话的自动 turn。 */
  #scheduleAutomaticTurns() {
    if (this.execution == null) return;
    let state = this.readState();
    if (state != null) for (let conversationId of Object.keys(state)) this.#tryRunConversation(normalizeThreadId(conversationId));
  }

  /** 尝试执行某会话的队首消息（刷新中则先刷新，运行中则记 rerun）。 */
  #tryRunConversation(conversationId: string) {
    if (
      this.disposed ||
      this.execution == null ||
      this.#getServerQueueIfEnabled(conversationId) != null ||
      this.pending.has(conversationId) ||
      this.automaticTurnDeferrals.has(conversationId)
    )
      return;
    if (this.messages.get(conversationId)?.refreshing === true) {
      this.execution.isClientReady(conversationId) &&
        this.options.getStreamRole(conversationId)?.role !== `follower` &&
        (this.queueRefresh == null
          ? this.#refreshQueues()
          : (this.queueRefreshRequested = this.queueRefreshRequested ?? `execution-wake`));
      return;
    }
    let head = this.readMessages(conversationId)?.[0];
    if (head != null && head.pausedReason == null) {
      if (this.running.has(conversationId)) {
        this.rerun.add(conversationId);
        return;
      }
      this.running.add(conversationId);
      this.#runQueuedMessage(conversationId, this.execution).finally(() => {
        this.running.delete(conversationId);
        this.rerun.delete(conversationId) && this.#tryRunConversation(conversationId);
      });
    }
  }

  /** 执行单条排队消息（原 #c：锁、prepare、submit、错误暂停）。 */
  async #runQueuedMessage(conversationId: string, execution: any, explicitOperation?: any) {
    if (this.readMessages(conversationId)?.some((message) => isUntrustedQueueContext(message.context))) {
      if (explicitOperation == null) return;
      throw Error(untrustedQueueContextError);
    }
    let message: any;
    let acquiredStartTurn = false;
    let sendLock: { release: (sent: boolean) => Promise<void> } | null = null;
    let sent = false;
    let attempted = false;
    let operation = explicitOperation?.operation ?? execution;
    let isCurrent = () =>
      !this.disposed &&
      this.execution === execution &&
      !this.pending.has(conversationId) &&
      this.messages.get(conversationId)?.refreshing !== true &&
      message != null &&
      (explicitOperation == null
        ? this.readMessages(conversationId)?.[0] === message &&
          !this.automaticTurnDeferrals.has(conversationId) &&
          execution.isClientReady(conversationId) &&
          this.options.canSend(conversationId, message)
        : this.readMessages(conversationId)?.find((candidate) => candidate.id === explicitOperation.messageId) === message);
    try {
      if (
        (explicitOperation == null &&
          this.options.getStreamRole(conversationId)?.role !== `owner` &&
          !execution.canAcquireOwnership(conversationId)) ||
        (explicitOperation == null && (this.automaticTurnDeferrals.has(conversationId) || !execution.isClientReady(conversationId))) ||
        this.disposed ||
        this.execution !== execution ||
        ((message =
          explicitOperation == null
            ? this.readMessages(conversationId)?.[0]
            : this.readMessages(conversationId)?.find((candidate) => candidate.id === explicitOperation.messageId)),
        !isCurrent() || message == null || !execution.tryAcquireStartTurn(conversationId)) ||
        ((acquiredStartTurn = true),
        explicitOperation != null && (await execution.waitUntilReady?.(conversationId), !isCurrent())) ||
        ((sendLock = await execution.acquireSendLock(conversationId, message.id)), sendLock == null || !isCurrent())
      )
        return;
      let prepared = await operation.prepare(conversationId, message, explicitOperation == null ? `start` : `steer`);
      if (!isCurrent()) return;
      if (prepared.status === `paused`) {
        this.update(conversationId, message.id, (current: any) => ({ ...current, pausedReason: prepared.reason }));
        return;
      }
      if (explicitOperation == null && this.options.getStreamRole(conversationId)?.role !== `owner`) return;
      if (prepared.submission.conversationId !== conversationId)
        throw Error(`Prepared submission belongs to another thread`);
      attempted = true;
      operation.onAttempt?.(conversationId, message);
      let sendMode = explicitOperation == null ? `when-idle` : `send-now`;
      let result = await this.#submit(prepared.submission, sendMode, explicitOperation == null, isCurrent);
      if (result.status === `needs-start-preparation`) {
        let afterInactiveTurnId = result.afterInactiveTurnId;
        prepared = await operation.prepare(conversationId, message, `start`);
        if (!isCurrent()) {
          operation.onResult?.(conversationId, message, { status: `deferred` });
          return;
        }
        if (prepared.status === `paused`) {
          this.update(conversationId, message.id, (current: any) => ({ ...current, pausedReason: prepared.reason }));
          operation.onResult?.(conversationId, message, prepared);
          return;
        }
        if (prepared.submission.conversationId !== conversationId || prepared.submission.start == null)
          throw Error(`Start preparation did not produce a matching turn request`);
        result = await this.#submit(
          { ...prepared.submission, afterInactiveTurnId },
          sendMode,
          explicitOperation == null,
          isCurrent,
        );
      }
      if (result.status === `sent`) {
        sent = true;
        this.disposed || this.remove(conversationId, message.id);
      }
      operation.onResult?.(conversationId, message, result);
    } catch (error) {
      if (explicitOperation == null && error instanceof ResumeNotReadyError) {
        attempted && message != null && operation.onResult?.(conversationId, message, { status: `deferred` });
        return;
      }
      if (!sent && attempted && message != null) {
        try {
          operation.onError?.(conversationId, message, error);
        } catch (reportError) {
          this.options.logger.warning(`Failed to report queued message failure`, {
            safe: {},
            sensitive: { conversationId, error: reportError },
          });
        }
      }
      if (
        !sent &&
        !this.disposed &&
        message != null &&
        (explicitOperation != null || this.options.getStreamRole(conversationId)?.role === `owner`)
      ) {
        let reason = execution.errorReason(error);
        this.update(conversationId, message.id, (current: any) => ({ ...current, pausedReason: reason }));
      }
      this.options.logger.warning(`Failed to execute queued message`, {
        safe: {},
        sensitive: { conversationId, error },
      });
      if (explicitOperation != null && !sent) throw error;
    } finally {
      try {
        await sendLock?.release(sent);
      } catch (error) {
        this.options.logger.warning(`Failed to release queued message send lock`, {
          safe: {},
          sensitive: { conversationId, error },
        });
      }
      acquiredStartTurn && execution.releaseStartTurn(conversationId);
      explicitOperation != null && this.#tryRunConversation(conversationId);
    }
  }

  /** 队首消息（serverQueue 优先）。 */
  readHead = (conversationId: string) => {
    let messages = this.readMessages(conversationId);
    return messages == null ? undefined : (messages[0] ?? null);
  };

  /** 读某会话队列（serverQueue 优先，本地三级回退）。 */
  readMessages = (conversationId: string) => {
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    return serverQueue == null ? this.#readLocalMessages(conversationId) : serverQueue.read(conversationId);
  };

  /** 本地读取：内存 → storage.read（loadedState/value）。 */
  #readLocalMessages(conversationId: string) {
    let cached = this.messages.get(conversationId);
    if (cached != null) return cached.messages;
    let readState = this.options.storage.read();
    let value = readState.isLoading ? this.loadedState : readState.value;
    return readState.isLoading && value == null ? undefined : (value?.[conversationId] ?? EMPTY_QUEUE);
  }

  /** serverQueue 可用且本地无消息时返回之。 */
  #getServerQueueIfEnabled(conversationId: string) {
    let serverQueue = this.serverQueue;
    if (serverQueue != null && serverQueue.isEnabled(conversationId) && this.#readLocalMessages(conversationId)?.length === 0)
      return serverQueue;
  }

  /** 后台装载某会话队列（失败仅告警）。 */
  loadSubscribedMessages(conversationId: string) {
    this.loadMessages(conversationId).catch((error: unknown) => {
      this.options.logger.warning(`Failed to load queued follow-ups`, {
        safe: {},
        sensitive: { error },
      });
    });
  }

  /** 装载某会话队列（本地缺失时先装载 storage；serverQueue 未装载时补载）。 */
  loadMessages = async (conversationId: string) => {
    if (this.disposed) return;
    this.#readLocalMessages(conversationId) ?? (await this.#ensureLoaded());
    let serverQueue = this.#getServerQueueIfEnabled(conversationId);
    serverQueue != null && serverQueue.read(conversationId) == null && (await serverQueue.load(conversationId));
    this.disposed || this.#notifyQueueChanged(conversationId);
  };

  /** 确保 storage 全量已装载（单飞）。 */
  #ensureLoaded() {
    if (this.loading == null) {
      let load = this.options.storage
        .load()
        .then((state) => {
          if (!this.disposed && this.loading === load) this.loadedState = state;
        })
        .catch((error: unknown) => {
          throw (this.loading === load && (this.loading = undefined), error);
        });
      this.loading = load;
    }
    return this.loading;
  }

  /** 读全量队列状态（内存覆盖 storage）。 */
  readState = () => {
    let readState = this.options.storage.read();
    let value = readState.isLoading ? this.loadedState : readState.value;
    if (readState.isLoading && value == null) return;
    let merged = { ...value };
    for (let [conversationId, { messages }] of this.messages)
      messages.length === 0 ? delete merged[conversationId] : (merged[conversationId] = messages);
    return merged;
  };

  /** 读某会话队列（读态包装）。 */
  read = (conversationId: string) => {
    let messages = this.readMessages(conversationId);
    return { isLoading: messages == null, messages: messages ?? EMPTY_QUEUE };
  };

  /** 移除并返回某条消息。 */
  remove = (conversationId: string, messageId: string) => {
    let message = this.read(conversationId).messages.find((candidate) => candidate.id === messageId);
    return (message != null && this.mutate(conversationId, (messages) => messages.filter((candidate) => candidate.id !== messageId)), message ?? null);
  };

  /** 更新某条消息。 */
  update = (conversationId: string, messageId: string, updater: (message: any) => any) => {
    this.mutate(conversationId, (messages) => messages.map((message) => (message.id === messageId ? updater(message) : message)));
  };

  /** 读改写（未装载时先装载再重试；失败仅告警）。 */
  mutate = (conversationId: string, mutator: (messages: any[]) => any[]) => {
    if (!this.disposed) {
      if (this.readMessages(conversationId) == null) {
        this.#ensureLoaded()
          .then(() => {
            this.disposed || this.mutate(conversationId, mutator);
          })
          .catch((error: unknown) => {
            this.options.logger.warning(`Failed to load queued follow-ups`, {
              safe: {},
              sensitive: { conversationId, error },
            });
          });
        return;
      }
      this.#persistMessages(conversationId, mutator, false).catch((error: unknown) => {
        this.options.logger.warning(`Failed to update queued follow-ups`, {
          safe: {},
          sensitive: { conversationId, error },
        });
      });
    }
  };

  /** follower 接受 owner 广播的队列状态。 */
  acceptFromFollower = async (conversationId: string, messages: any[]) => {
    await this.#persistMessages(conversationId, () => messages, true);
  };

  /** 持久化写（原 #f）：串行链、follower 转发/owner 广播、pending 合并。 */
  async #persistMessages(conversationId: string, mutator: (messages: any[]) => any[], fromFollowerAccept: boolean) {
    if (this.disposed) return Promise.reject(Error(`Queued message coordinator retired`));
    let before = this.read(conversationId).messages;
    let mutated = mutator(before);
    assertNoUntrustedQueueContext(mutated);
    let pending = this.pending.get(conversationId) ?? {
      count: 0,
      committedMessages: this.messages.get(conversationId)?.messages,
      broadcast: undefined,
    };
    pending.count++;
    this.pending.set(conversationId, pending);
    this.#commitLocalMessages(conversationId, mutated);
    let write = this.pendingQueueWrites.then(async () => {
      if (this.disposed) throw Error(`Queued message coordinator retired`);
      let broadcastAtWrite = pending.broadcast;
      let role = this.options.getStreamRole(conversationId);
      if (fromFollowerAccept && role?.role !== `owner`) throw Error(`This window no longer owns the thread`);
      if (role?.role === `follower`) {
        let response = await this.options.requestFollower(conversationId, { [conversationId]: mutated }, role.ownerClientId);
        if (response.resultType === `error`) throw Error(response.error);
      } else {
        await this.options.storage.update((state) => {
          before = state[conversationId] ?? EMPTY_QUEUE;
          mutated = mutator(before);
          assertNoUntrustedQueueContext(mutated);
          let next = { ...state };
          if (mutated.length === 0) delete next[conversationId];
          else next[conversationId] = mutated;
          return next;
        });
        if (
          !this.disposed &&
          this.options.getStreamRole(conversationId)?.role === `owner` &&
          this.options.coordination
        ) {
          this.options.coordination
            ?.broadcast({ conversationId, messages: mutated })
            .catch((error: unknown) => {
              this.options.logger.warning(`Failed to broadcast queued follow-ups`, {
                safe: {},
                sensitive: { conversationId, error },
              });
            });
        }
      }
      pending.committedMessages = mutated;
      pending.broadcast === broadcastAtWrite && (pending.broadcast = undefined);
    });
    this.pendingQueueWrites = write.catch(() => {});
    return write
      .then(() => before)
      .finally(() => {
        pending.count--;
        if (pending.count !== 0 || (this.pending.delete(conversationId), this.disposed)) return;
        let role = this.options.getStreamRole(conversationId);
        let effective =
          role?.role === `follower` && role.ownerClientId === pending.broadcast?.sourceClientId
            ? pending.broadcast.messages
            : pending.committedMessages;
        if (this.messages.get(conversationId)?.messages !== effective) {
          if (effective == null) {
            this.messages.delete(conversationId);
            this.#notifyQueueChanged(conversationId);
          } else {
            this.#commitLocalMessages(conversationId, effective);
          }
        }
        role?.role !== `follower` && this.#refreshQueues();
      });
  }

  /** 内存提交 + 通知。 */
  #commitLocalMessages(conversationId: string, messages: any[]) {
    this.messages.set(conversationId, { messages, refreshing: false });
    this.#notifyQueueChanged(conversationId);
  }

  /** 队列变更通知 + 尝试推进。 */
  #notifyQueueChanged(conversationId: string) {
    this.options.onQueueChanged?.(conversationId);
    this.#tryRunConversation(conversationId);
  }
}

/**
 * 排队协调器工厂（原 USe）：把 rw 的方法面适配为 options。
 * submissionHost.steer 成功后经 tracing.abortTurnSteer 收尾。
 * createSearchIslandId 参数在原版中未被使用（保留以维持调用签名）。
 */
export function createQueuedFollowUps(
  manager: any,
  {
    ipcBridge,
    logger,
    storage,
    tracing = {},
    settings,
    queuedMessageCoordination,
  }: {
    ipcBridge: any;
    logger: any;
    storage: any;
    tracing?: any;
    settings: any;
    queuedMessageCoordination: any;
  },
  onQueueChanged: (conversationId: string | null) => void,
  execution: any,
  resumeConversation: any,
  _createSearchIslandId: () => string,
) {
  return new QueuedFollowUpsCoordinator({
    createMessageThreadId: (conversationId: string) => {
      manager.getConversation(conversationId);
    },
    onQueueChanged,
    execution,
    getMessageQueueMode: async (submission: any) => (
      manager.getConversation(submission.conversationId), settings.readFollowUpQueueMode()
    ),
    submissionHost: {
      needsResume: (conversationId: string) =>
        manager.getConversation(conversationId)?.resumeState === `resuming` || manager.needsResume(conversationId),
      resume: resumeConversation,
      getActiveTurnId: (conversationId: string) => {
        let conversation = manager.getConversation(conversationId);
        let turn = conversation == null ? null : lastIncompleteTurn(conversation);
        return turn?.status === `inProgress` ? turn.turnId : null;
      },
      hasPendingTurnStart: (conversationId: string) => {
        let conversation = manager.getConversation(conversationId);
        if (conversation == null) return false;
        let turn = lastIncompleteTurn(conversation);
        return (
          (turn?.status === `inProgress` && turn.turnId == null) ||
          (conversation.unconfirmedTurnSubmissions?.length ?? 0) > 0
        );
      },
      hasFinalAnswer: (conversationId: string) => {
        let conversation = manager.getConversation(conversationId);
        let lastItem = conversation == null ? undefined : lastIncompleteTurn({ turns: mergedConversationTurns(conversation) })?.items.at(-1);
        return (
          lastItem?.type === `agentMessage` &&
          `phase` in lastItem &&
          lastItem.phase === `final_answer` &&
          `text` in lastItem &&
          typeof lastItem.text == `string` &&
          lastItem.text.trim().length > 0
        );
      },
      start: async (conversationId: string, start: any, onMessageAdded: unknown) =>
        (await manager.startTurn(conversationId, start, onMessageAdded)).turn.id,
      steer: async (conversationId: string, steer: any, onMessageAdded: unknown) => {
        let result = await manager.steerTurn(
          conversationId,
          steer.input,
          steer.restoreMessage,
          steer.serviceTier,
          steer.attachments,
          steer.clientUserMessageId,
          steer.additionalContext,
          steer.toolOutput,
          onMessageAdded,
        );
        tracing.abortTurnSteer?.(steer.clientUserMessageId ?? steer.restoreMessage.id);
        return result.turnId;
      },
      canStartAfterSteerError: (conversationId: string, error: unknown, executionHostId: unknown) => (
        manager.getConversation(conversationId),
        isSteerTurnInactiveError(error) || ((isDurableHost(manager.getHostId()) || isDurableHost(executionHostId)) && isNoActiveTurnError(error))
      ),
    },
    canSend: (conversationId: string, message: any) => {
      let conversation = manager.getConversation(conversationId);
      return !shouldHoldQueuedMessage({
        conversationNeedsResume: manager.needsResume(conversationId),
        hasConversation: conversation != null,
        latestTurn: conversation == null ? null : lastIncompleteTurn(conversation),
        message,
        streamRole: manager.getStreamRole(conversationId),
      });
    },
    coordination: queuedMessageCoordination,
    getStreamRole: (conversationId: string) => manager.getStreamRole(conversationId),
    logger,
    requestFollower: async (conversationId: string, state: Record<string, any>, ownerClientId: string) =>
      ipcBridge == null
        ? { resultType: `error`, error: `client-coordination-service-unavailable` }
        : ipcBridge.request(
            `thread-follower-set-queued-follow-ups-state`,
            { conversationId, state },
            { targetClientId: ownerClientId },
          ),
    storage: {
      read: () => storage.readQueuedFollowUps?.() ?? { isLoading: true, value: undefined },
      load: () => storage.loadQueuedFollowUps?.() ?? Promise.reject(Error(`Queued message storage is unavailable`)),
      update: (updater: any) =>
        storage.updateQueuedFollowUps?.(updater) ??
        Promise.reject(Error(`Queued message storage is unavailable`)),
    },
  });
}
