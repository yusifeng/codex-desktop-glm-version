// 通知延迟/未读状态/prewarm 线程管理（原版 50,671-51,198 区段）。
//
// ThreadStartedNotificationDeferral（TSe）：会话创建期间的 thread/started
// 通知延迟——创建中（pendingStarts 非空）收到的相关会话通知先缓冲，创建
// 完成（或明确归属其他会话）后按序重放，避免「会话尚未建好先收到其通知」。
//
// UnreadTurnState（ESe）：turn 粒度的未读消息簿记——消息计数在 turn 完成
// 时回扣 savedReadState；持久化读状态未就绪时延迟初始化。
//
// PrewarmedThreadManager（OSe）：按 cwd 复用的预热线程池（TTL 285s）——
// prewarm 的 thread/start 结果与权限/指令覆盖快照成对保存，消费时逐项
// deepEqual 校验，不匹配即作废（thread/delete 清理）。
//
// 原压缩名对照：TSe→ThreadStartedNotificationDeferral、ESe→UnreadTurnState、
// DSe→PREWARM_TTL_SECONDS、OSe→PrewarmedThreadManager、kSe→
// subscribeReadStateChanges。

import { $u as normalizeThreadId, mr as DeliveryError } from "@chunk/shared";
import { deepEqual } from "../util/lodash-interop";
import { ResumeNotificationBuffer } from "./stream-recovery";

// ---------------------------------------------------------------------------
// ThreadStartedNotificationDeferral（TSe）
// ---------------------------------------------------------------------------

/** 通知延迟器依赖注入面。 */
export interface ThreadStartedNotificationDeferralParams {
  logger: any;
  /** 读某会话的合并 turn 视图（缓冲重放时供去水化）。 */
  getTurns: (conversationId: string) => any;
  replayNotification: (method: string, params: any, automationCapability: unknown, shouldIgnore: boolean) => void;
  replayRequest: (request: any) => void;
}

/**
 * thread/started 通知延迟器（原 TSe）。
 * run(defer, create)：defer=true 时创建期间相关会话的通知进缓冲；
 * 创建回调以 onReady 通知归属（null=尚未知，此时所有会话都延迟）。
 */
export class ThreadStartedNotificationDeferral {
  logger: any;
  getTurns: (conversationId: string) => any;
  replayNotification: (method: string, params: any, automationCapability: unknown, shouldIgnore: boolean) => void;
  replayRequest: (request: any) => void;
  buffer = new ResumeNotificationBuffer();
  conversationIds = new Set<string>();
  pendingStarts = new Map<symbol, string | null>();
  readyConversationIds = new Set<string>();

  constructor(params: ThreadStartedNotificationDeferralParams) {
    this.logger = params.logger;
    this.getTurns = params.getTurns;
    this.replayNotification = params.replayNotification;
    this.replayRequest = params.replayRequest;
  }

  /** 通知进缓冲：已缓冲的会话照常；thread/started 且处于延迟窗口时开缓冲。 */
  bufferNotification(delivery: any, shouldIgnore: boolean) {
    let { notification } = delivery;
    if (this.buffer.buffer(delivery, shouldIgnore)) return true;
    if (notification.method !== `thread/started` || this.pendingStarts.size === 0) return false;
    let conversationId = normalizeThreadId(notification.params.thread.id);
    return this.readyConversationIds.has(conversationId) || !this.isDeferred(conversationId)
      ? false
      : (this.conversationIds.add(conversationId), this.buffer.begin(conversationId), this.buffer.buffer(delivery, shouldIgnore), true);
  }

  /** 服务端请求进缓冲。 */
  bufferRequest(request: any) {
    return this.buffer.bufferRequest(request);
  }

  /**
   * 包裹一次会话创建：defer=false 直接执行；true 时登记 pendingStart，
   * 创建回调报告归属后释放该会话的缓冲，其余无关会话一并释放。
   */
  async run<T extends { conversationId: string }>(defer: boolean, create: (onReady: (conversationId: string | null) => void) => Promise<T>): Promise<T> {
    if (!defer) return create(() => {});
    let start = Symbol();
    this.pendingStarts.set(start, null);
    try {
      let result = await create((conversationId: string | null) => {
        this.pendingStarts.set(start, conversationId);
        this.releaseUnrelatedConversations();
      });
      this.readyConversationIds.add(result.conversationId);
      this.release(result.conversationId);
      return result;
    } finally {
      this.pendingStarts.delete(start);
      this.releaseUnrelatedConversations();
      this.pendingStarts.size === 0 && this.readyConversationIds.clear();
    }
  }

  /** 会话被归档/删除时丢弃其缓冲。 */
  discardConversation(conversationId: string) {
    this.conversationIds.delete(conversationId);
    this.readyConversationIds.delete(conversationId);
    this.buffer.discard(conversationId);
  }

  /** 丢弃某会话缓冲中指定的动态工具请求。 */
  discardDynamicToolRequest(conversationId: string, requestId: string) {
    this.buffer.discardDynamicToolRequest(conversationId, requestId);
  }

  /** 会话是否处于延迟窗口（有未知归属的 pendingStart，或归属即该会话）。 */
  isDeferred(conversationId: string) {
    for (let readyId of this.pendingStarts.values()) if (readyId == null || readyId === conversationId) return true;
    return false;
  }

  /** 释放所有不在延迟窗口内的会话缓冲。 */
  releaseUnrelatedConversations() {
    for (let conversationId of this.conversationIds) this.isDeferred(conversationId) || this.release(conversationId);
  }

  /** 释放单个会话的缓冲并按序重放（重放异常仅记日志）。 */
  release(conversationId: string) {
    if (this.conversationIds.delete(conversationId)) {
      this.readyConversationIds.add(conversationId);
      try {
        this.buffer.release(
          conversationId,
          this.getTurns(conversationId),
          (delivery: any, shouldIgnore: boolean) => {
            this.replaySafely(conversationId, () => {
              this.replayNotification(delivery.notification.method, delivery.notification.params, delivery.automationCapability, shouldIgnore);
            });
          },
          (request: any) => {
            this.replaySafely(conversationId, () => {
              this.replayRequest(request);
            });
          },
        );
      } catch (error) {
        this.logger.error(`Failed to replay deferred thread start events`, {
          safe: { conversationId },
          sensitive: { error },
        });
      }
    }
  }

  private replaySafely(conversationId: string, replay: () => void) {
    try {
      replay();
    } catch (error) {
      this.logger.error(`Failed to replay deferred thread start event`, {
        safe: { conversationId },
        sensitive: { error },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// UnreadTurnState（ESe）
// ---------------------------------------------------------------------------

/** turn 粒度未读簿记条目。 */
interface UnreadTurnEntry {
  conversationId: string;
  hadUnreadTurn: boolean;
  savedReadStatePending: boolean;
  unreadMessageCount: number;
}

/**
 * 未读 turn 状态（原 ESe）：消息到达计数、turn 完成回扣；持久化读状态
 * （savedReadState）未就绪时延迟初始化 hadUnreadTurn。
 */
export class UnreadTurnState {
  saved: { isReady: () => boolean };
  turnState = new Map<string, UnreadTurnEntry>();

  constructor(saved: { isReady: () => boolean }) {
    this.saved = saved;
  }

  /** 记录一条未读消息（新 turn 建簿记条目）。 */
  recordMessage(conversationId: string, turnId: string, conversation: { hasUnreadTurn: boolean }) {
    let key = this.getKey(conversationId, turnId);
    let entry =
      this.turnState.get(key) ??
      {
        conversationId,
        hadUnreadTurn: conversation.hasUnreadTurn,
        savedReadStatePending: !this.saved.isReady(),
        unreadMessageCount: 0,
      };
    entry.unreadMessageCount += 1;
    this.turnState.set(key, entry);
  }

  /** turn 完成：回扣未读计数；turn 开始前无未读且扣尽则清 hasUnreadTurn。 */
  completeTurn(conversationId: string, turnId: string, turnHadUnread: boolean, conversation: { hasUnreadTurn: boolean; unreadMessageCount?: number }) {
    let key = this.getKey(conversationId, turnId);
    let entry = this.turnState.get(key);
    this.turnState.delete(key);
    turnHadUnread &&
      entry != null &&
      ((conversation.unreadMessageCount = Math.max(0, (conversation.unreadMessageCount ?? 0) - entry.unreadMessageCount)),
      !entry.hadUnreadTurn && conversation.unreadMessageCount === 0 && (conversation.hasUnreadTurn = false));
  }

  /** 持久化读状态就绪：补齐延迟初始化的 hadUnreadTurn。 */
  initializeSavedReadState(unreadThreadIds: Set<string>) {
    for (let entry of this.turnState.values())
      entry.savedReadStatePending &&= ((entry.hadUnreadTurn = unreadThreadIds.has(entry.conversationId)), false);
  }

  /** 会话未读状态被外部改写：同步全部相关 turn 簿记。 */
  setConversationUnreadState(conversationId: string, hasUnreadTurn: boolean) {
    for (let entry of this.turnState.values())
      entry.conversationId === conversationId &&
        ((entry.hadUnreadTurn = hasUnreadTurn), (entry.savedReadStatePending = false), hasUnreadTurn || (entry.unreadMessageCount = 0));
  }

  /** 丢弃某 turn 的簿记。 */
  discardTurn(conversationId: string, turnId: string) {
    this.turnState.delete(this.getKey(conversationId, turnId));
  }

  /** 清某会话的全部簿记。 */
  clearConversation(conversationId: string) {
    for (let [key, entry] of this.turnState) entry.conversationId === conversationId && this.turnState.delete(key);
  }

  private getKey(conversationId: string, turnId: string) {
    return `${conversationId}\0${turnId}`;
  }
}

// ---------------------------------------------------------------------------
// PrewarmedThreadManager（OSe）
// ---------------------------------------------------------------------------

/** 预热线程 TTL（秒，原 DSe=285）。 */
const PREWARM_TTL_SECONDS = 285;

/** 预热条目：thread/start promise + 权限/指令覆盖/特性覆盖快照。 */
interface PrewarmedThread {
  promise: Promise<{ response: { thread: { id: string; createdAt: number } } } | null>;
  createdAtSeconds: number | null;
  workspaceRoots: string[];
  permissions: Promise<any>;
  instructionOverrides: Promise<unknown>;
  defaultFeatureOverrides: Record<string, unknown> | null;
  serviceName: string | null;
  requestedHistoryMode: string;
}

/**
 * 预热线程池（原 OSe）：按 cwd 单槽复用。hasPrewarmedThread 校验
 * roots/service/historyMode 与新鲜度；consumePrewarmedThread 逐项
 * deepEqual 校验权限与覆盖快照，不匹配作废；outcome-unknown 的预热
 * promise 允许重新入池等待落定。
 */
export class PrewarmedThreadManager {
  deletePrewarmedThread: (threadId: string) => Promise<unknown>;
  now: () => number;
  prewarmedThreadByCwd = new Map<string, PrewarmedThread>();

  constructor(deletePrewarmedThread: (threadId: string) => Promise<unknown>, now: () => number) {
    this.deletePrewarmedThread = deletePrewarmedThread;
    this.now = now;
  }

  /** 登记一个预热条目（同 cwd 旧条目先作废）。 */
  setPrewarmedThreadPromise(
    cwd: string,
    workspaceRoots: string[],
    serviceName: string | null,
    requestedHistoryMode: string,
    promise: Promise<{ response: { thread: { id: string; createdAt: number } } } | null>,
    permissions: Promise<unknown>,
    instructionOverrides: Promise<unknown>,
    defaultFeatureOverrides: Record<string, unknown> | null = null,
  ) {
    let existing = this.prewarmedThreadByCwd.get(cwd);
    existing != null && this.discardPrewarmedThread(existing);
    let entry: PrewarmedThread = {
      promise,
      createdAtSeconds: null,
      workspaceRoots,
      permissions: Promise.resolve(permissions).catch(() => null),
      instructionOverrides: Promise.resolve(instructionOverrides),
      defaultFeatureOverrides,
      serviceName,
      requestedHistoryMode,
    };
    this.prewarmedThreadByCwd.set(cwd, entry);
    promise.then(
      (result) => {
        if (this.prewarmedThreadByCwd.get(cwd) === entry) {
          if (result == null) {
            this.prewarmedThreadByCwd.delete(cwd);
            return;
          }
          entry.createdAtSeconds = result.response.thread.createdAt;
        }
      },
      (error: unknown) => {
        // 失败（非 outcome-unknown）时出池；outcome-unknown 保留等待落定。
        (error instanceof DeliveryError && (error as any).delivery.stage === `outcome-unknown`) ||
          (this.prewarmedThreadByCwd.get(cwd) === entry && this.prewarmedThreadByCwd.delete(cwd));
      },
    );
  }

  /** 全部作废（dispose 时）。 */
  discardAllPrewarmedThreads() {
    for (let entry of this.prewarmedThreadByCwd.values()) this.discardPrewarmedThread(entry);
    this.prewarmedThreadByCwd.clear();
  }

  /** 是否有匹配的可用预热（roots/service/historyMode/新鲜度）。 */
  hasPrewarmedThread(cwd: string, workspaceRoots: string[], serviceName: string | null, requestedHistoryMode: string) {
    let entry = this.prewarmedThreadByCwd.get(cwd);
    return entry
      ? !deepEqual(entry.workspaceRoots, workspaceRoots) ||
          entry.serviceName !== serviceName ||
          entry.requestedHistoryMode !== requestedHistoryMode
        ? (this.prewarmedThreadByCwd.delete(cwd), this.discardPrewarmedThread(entry), false)
        : entry.createdAtSeconds == null || this.isFresh(entry.createdAtSeconds)
          ? true
          : (this.prewarmedThreadByCwd.delete(cwd), this.discardPrewarmedThread(entry), false)
      : false;
  }

  /** 消费预热条目（逐项校验，失败作废返回 null）。 */
  async consumePrewarmedThread(
    cwd: string,
    workspaceRoots: string[],
    serviceName: string | null,
    requestedHistoryMode: string,
    permissionsConfig: unknown,
    instructionOverrides: unknown,
    defaultFeatureOverrides: Record<string, unknown> | null,
    validateResponse?: (response: any) => boolean,
  ) {
    if (!this.hasPrewarmedThread(cwd, workspaceRoots, serviceName, requestedHistoryMode)) return null;
    let entry = this.prewarmedThreadByCwd.get(cwd);
    if (!entry) return null;
    this.prewarmedThreadByCwd.delete(cwd);
    let storedPermissions: unknown;
    let storedInstructionOverrides: unknown;
    try {
      [storedPermissions, storedInstructionOverrides] = await Promise.all([entry.permissions, entry.instructionOverrides]);
    } catch (error) {
      throw (this.discardPrewarmedThread(entry), error);
    }
    if (
      !deepEqual(storedPermissions, permissionsConfig) ||
      !deepEqual(storedInstructionOverrides, instructionOverrides) ||
      !deepEqual(entry.defaultFeatureOverrides, defaultFeatureOverrides)
    )
      return (this.discardPrewarmedThread(entry), null);
    let result: { response: any } | null;
    try {
      result = await entry.promise;
    } catch (error) {
      throw (
        error instanceof DeliveryError &&
          error.delivery.stage === `outcome-unknown` &&
          !this.prewarmedThreadByCwd.has(cwd) &&
          this.prewarmedThreadByCwd.set(cwd, entry),
        error
      );
    }
    return result != null && validateResponse != null && !validateResponse(result.response)
      ? (this.discardPrewarmedThread(entry), null)
      : result;
  }

  /** 预热是否仍在 TTL 内。 */
  isFresh(createdAtSeconds: number) {
    return this.now() / 1e3 - createdAtSeconds < PREWARM_TTL_SECONDS;
  }

  /** 作废：thread/start 已成功时删除服务端线程（尽力而为）。 */
  private discardPrewarmedThread(entry: PrewarmedThread) {
    entry.promise
      .then((result) => {
        if (result != null) return this.deletePrewarmedThread(result.response.thread.id);
      })
      .catch(() => void 0);
  }
}

// ---------------------------------------------------------------------------
// 读状态订阅（kSe）
// ---------------------------------------------------------------------------

/**
 * 订阅持久化读状态流：初始化事件（unreadThreadIds 集合）先补齐
 * UnreadTurnState 的延迟初始化并重放逐线程状态；后续带 threadId 的事件
 * 直接透传。
 */
export function subscribeReadStateChanges(
  subscription: { subscribe: (listener: (event: any) => void) => unknown },
  unreadTurnState: UnreadTurnState,
  listUnreadThreadIds: () => Iterable<{ threadId: string }>,
  onThreadReadState: (event: any) => void,
) {
  return subscription.subscribe((event) => {
    if (`threadId` in event) onThreadReadState(event);
    else {
      unreadTurnState.initializeSavedReadState(event.unreadThreadIds);
      for (let thread of listUnreadThreadIds()) onThreadReadState(thread);
    }
  });
}
