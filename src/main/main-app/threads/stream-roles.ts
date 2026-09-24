// app-server 流角色状态（owner/follower）+ 分层订阅注册表。
//
// 原版 main-C-Mhak1n.ts 32,447-32,943（Yge/Xge）、29,529-29,533（Jhe）、
// 29,534-29,546（Mh）。
//
// Yge（AppServerManagerStreamState）：多窗口/多客户端下的会话流所有权
// 协调——
//   - owner：本进程持有 app-server 会话流，收到 follower 订阅时广播
//     snapshot，此后把状态 patch 增量转发（streamRevision 单调 +1）；
//   - follower：本进程只跟随另一个客户端（ownerClientId）的流，
//     snapshot/patch 经 IPC transport 输入，patch 用 immer applyPatches
//     应用，revision 落后时可等待（waitForConversationRevision，带超时）；
//   - 重连宽限：IPC 连接重置时 follower 集合挂起（pendingFollowerReconnect）
//     followerReconnectGraceMs 后才广播「无 follower」，避免抖动导致
//     owner 误停流；
//   - owner 断线：follower 端拒绝 revision 等待并标记需 resume。
//
// Xge（SubscriptionRegistry）：threadId → scope（host/conversation/thread/
// turn/item）→ field → listeners 的分层注册表，item 订阅用数组下标定位
// （首次订阅时快照 index），通知时按下标读取。

import { $u as normalizeThreadId, Uf as EventEmitter } from "@chunk/shared";
import { applyPatches } from "../vendor/immer";
import { UpdateHandle } from "../util/update-handle";
import { normalizeConversationState } from "./state-normalization";

/** 流角色：owner（本进程持流）或 follower（跟随 ownerClientId）。 */
export type StreamRole = { role: `owner` } | { role: `follower`; ownerClientId: string };

/** 窗口活跃性（注册进 registerWindowActivity 的活动描述）。 */
export interface WindowActivity {
  canAcquireThreadStream: boolean;
  [key: string]: unknown;
}

/** IPC transport 面（多窗口/远端客户端通信）。 */
export interface StreamTransport {
  register(callbacks: {
    onFollowingChanged: (
      conversationId: string,
      hostId: string,
      clientId: string,
      isFollowing: boolean,
    ) => void;
    onFollowingStatusRequested: (conversationId: string, hostId: string, clientId: string) => void;
    onStreamStateChanged: (
      conversationId: string,
      hostId: string,
      state: any,
      clientId: string,
    ) => void;
    onClientStatusChanged: (status: { clientId: string; isSelf: boolean; status: string }) => void;
    onConnectionReset: () => void;
  }): (() => void) | null;
  requestFollowingStatus(conversationId: string, hostId: string): Promise<void> | null;
  sendPatches(
    conversationId: string,
    hostId: string,
    clientIds: string[],
    baseRevision: number,
    revision: number,
    patches: any[],
    changes?: any,
  ): Promise<void> | null;
  sendSnapshot(
    conversationId: string,
    hostId: string,
    clientIds: string[],
    revision: number,
    conversation: any,
  ): Promise<void> | null;
  sendFollowingChanged(
    conversationId: string,
    hostId: string,
    isFollowing: boolean,
    clientIds?: string[],
  ): Promise<void> | null;
  setThreadOwnership(
    conversationId: string,
    hostId: string,
    isOwner: boolean,
  ): Promise<void> | null;
}

/** 事件总线面（Ah 的流相关子集）。 */
export interface StreamEvents {
  addConversationPatchesListener(
    listener: (conversationId: string, patches: any[], context?: any) => void,
  ): () => void;
  emitStreamFollowersChanged(conversationId: string): void;
  emitStreamRole(conversationId: string, role: StreamRole | null): void;
}

/** Yge 的构造参数（R4 manager 装配时注入）。 */
export interface StreamStateParams {
  hostId: string;
  threadStore: {
    getConversation(conversationId: string): any;
    setConversation(conversation: any, context?: any): void;
    notifyConversationCallbacks(conversationId: string, context?: any): void;
  };
  transport?: StreamTransport | null;
  events: StreamEvents;
  logger: any;
  schedule: (callback: () => void, delayMs: number) => () => void;
  followerReconnectGraceMs: number;
  canHandleOwnerlessDynamicTool: () => boolean;
  isLocalHost: (hostId: string) => boolean;
  markConversationNeedsResumeForUnavailableOwner: (conversationId: string, ownerClientId: string) => void;
}

/** 流角色相等（原版 Jhe）：role 相同且 follower 的 ownerClientId 相同。 */
export function streamRolesEqual(a: StreamRole | null, b: StreamRole | null): boolean {
  return a?.role === b?.role
    ? a?.role !== `follower` ||
      b?.role !== `follower` ||
      (a as any).ownerClientId === (b as any).ownerClientId
    : false;
}

/**
 * 从通知/事件对象提取 threadId（原版 Mh）：顶层 threadId 或 thread.id，
 * 都没有返回 null。
 */
export function extractThreadId(event: any): string | null {
  if (`threadId` in event && typeof event.threadId == `string` && event.threadId.length > 0)
    return event.threadId;
  if (
    `thread` in event &&
    event.thread != null &&
    typeof event.thread == `object` &&
    !Array.isArray(event.thread) &&
    `id` in event.thread &&
    typeof event.thread.id == `string` &&
    event.thread.id.length > 0
  )
    return event.thread.id;
  return null;
}

/**
 * app-server 流角色状态机（原版 Yge）。attach() 注册 transport 回调与
 * conversation patch 监听；dispose() 清理并拒绝全部 revision 等待。
 */
export class AppServerManagerStreamState {
  private params: StreamStateParams;
  private snapshotPublications = 0;
  private snapshotRecipients = 0;
  private patchPublications = 0;
  private patchRecipients = 0;
  private windowActivity = new Set<{ activity: WindowActivity }>();
  private followedConversationIds = new Set<string>();
  private followerClientIdsByConversationId = new Map<string, Set<string>>();
  private conversationIdsWithPendingFollowerReconnect = new Set<string>();
  private cancelFollowerReconnectGrace: (() => void) | null = null;
  private cleanup: (() => void)[] = [];
  private attached = false;
  private streamRoles = new Map<string, StreamRole>();
  private streamRevisionByConversationId = new Map<string, number>();
  private streamRevisionWaiters = new Map<
    string,
    Set<{
      ownerClientId: string;
      revision: number;
      resolve: () => void;
      reject: (error: Error) => void;
      cancel: () => void;
    }>
  >();

  constructor(params: StreamStateParams) {
    this.params = params;
  }

  /** 注册 transport 回调与 patch 广播监听（重复 attach 抛错）。 */
  attach(): void {
    if (this.attached) throw Error(`App-server manager stream state already attached`);
    this.attached = true;
    let params = this.params;
    let unregisterTransport = params.transport?.register({
      onFollowingChanged: (conversationId, hostId, clientId, isFollowing) => {
        if (hostId === params.hostId)
          this.handleThreadStreamFollowingChanged(conversationId, clientId, isFollowing);
      },
      onFollowingStatusRequested: (conversationId, hostId, clientId) => {
        if (
          hostId === params.hostId &&
          this.followedConversationIds.has(conversationId)
        )
          this.dispatchConversationFollowing(conversationId, true, [clientId]);
      },
      onStreamStateChanged: (conversationId, hostId, state, clientId) => {
        if (hostId === params.hostId) this.handleThreadStreamStateChanged(conversationId, state, clientId);
      },
      onClientStatusChanged: (status) => this.handleClientStatusChanged(status),
      onConnectionReset: () => this.handleIpcConnectionReset(),
    });
    let removePatchesListener = this.params.events.addConversationPatchesListener(
      (conversationId, patches, context) => {
        this.broadcastIpcStatePatches(conversationId, patches, context);
      },
    );
    if (unregisterTransport != null) this.cleanup.push(unregisterTransport);
    this.cleanup.push(removePatchesListener);
  }

  dispose(): void {
    this.windowActivity.clear();
    for (let dispose of this.cleanup.splice(0)) dispose();
    this.cancelFollowerReconnectGrace?.();
    this.cancelFollowerReconnectGrace = null;
    for (let conversationId of this.streamRevisionWaiters.keys())
      this.rejectStreamRevisionWaiters(
        conversationId,
        null,
        `App server manager was disposed while waiting for history`,
      );
  }

  /** 快照指标字段（遥测 collectSnapshotFields）。 */
  collectSnapshotFields(): Record<string, number> {
    let followerSubscriptions = 0;
    for (let clientIds of this.followerClientIdsByConversationId.values())
      followerSubscriptions += clientIds.size;
    return {
      manager_stream_threads_with_followers: this.followerClientIdsByConversationId.size,
      manager_stream_follower_subscriptions: followerSubscriptions,
      manager_stream_snapshot_publications_total: this.snapshotPublications,
      manager_stream_snapshot_recipients_total: this.snapshotRecipients,
      manager_stream_patch_publications_total: this.patchPublications,
      manager_stream_patch_recipients_total: this.patchRecipients,
    };
  }

  /**
   * 注册窗口活跃性（原版 registerWindowActivity）：活跃集内的窗口都可以
   * 更新其活动描述；update(null) 表示窗口移除。返回 UpdateHandle。
   */
  registerWindowActivity(activity: WindowActivity, onChanged: () => void): UpdateHandle {
    let entry = { activity };
    this.windowActivity.add(entry);
    onChanged();
    return new UpdateHandle((next) => {
      if (!this.windowActivity.has(entry)) return;
      if (next == null) this.windowActivity.delete(entry);
      else entry.activity = next as WindowActivity;
      onChanged();
    });
  }

  /** 取当前可获流的窗口活动（优先 canAcquireThreadStream，否则最后一个）。 */
  getWindowActivity(): WindowActivity | null {
    let last: WindowActivity | null = null;
    for (let { activity } of this.windowActivity) {
      if (activity.canAcquireThreadStream) return activity;
      last = activity;
    }
    return last;
  }

  getStreamingConversations(): Set<string> {
    return new Set(this.streamRoles.keys());
  }

  isConversationStreaming(conversationId: string): boolean {
    return this.streamRoles.has(conversationId);
  }

  hasFollowersOrPendingFollowerReconnect(conversationId: string): boolean {
    return (
      this.conversationIdsWithPendingFollowerReconnect.has(conversationId) ||
      this.followerClientIdsByConversationId.has(conversationId)
    );
  }

  canBroadcastIpcStatePatches(conversationId: string): boolean {
    return (
      this.getStreamRole(conversationId)?.role === `owner` &&
      this.followerClientIdsByConversationId.has(conversationId)
    );
  }

  getStreamRole(conversationId: string): StreamRole | null {
    return this.streamRoles.get(conversationId) ?? null;
  }

  getConversationRevision(conversationId: string): number | null {
    return this.streamRevisionByConversationId.get(conversationId) ?? null;
  }

  /** 是否本进程持有该会话的历史流（owner，或拥有独立云端历史的 follower）。 */
  ownsConversationHistoryStream(conversationId: string): boolean {
    let role = this.getStreamRole(conversationId);
    return (
      role?.role === `owner` ||
      (role?.role === `follower` &&
        this.hasIndependentCloudHistory(this.params.threadStore.getConversation(conversationId)))
    );
  }

  /**
   * follower 角色下是否应忽略该 thread 变更通知（原版
   * shouldIgnoreThreadMutationAsFollower）：turn/item 前缀与固定方法名的
   * 「流内变更」在 follower 无独立云端历史（或 request 事件）时忽略——
   * 这些变更会经 snapshot/patch 通道到达。
   */
  shouldIgnoreThreadMutationAsFollower(
    method: string,
    event: any,
    direction: string | undefined,
  ): boolean {
    if (
      !(
        method.startsWith(`turn/`) ||
        method.startsWith(`item/`) ||
        method === `thread/started` ||
        method === `thread/realtime/itemAdded` ||
        method.startsWith(`thread/realtime/item/`) ||
        method === `thread/status/changed` ||
        method === `thread/tokenUsage/updated` ||
        method === `error`
      )
    )
      return false;
    let threadId = extractThreadId(event);
    if (!threadId) return false;
    let normalized = normalizeThreadId(threadId);
    return (
      this.getStreamRole(normalized)?.role === `follower` &&
      (direction === `request` ||
        !this.hasIndependentCloudHistory(this.params.threadStore.getConversation(normalized)))
    );
  }

  /** 是否有独立于 owner 流的云端历史（原版恒 false，durable 历史未启用）。 */
  hasIndependentCloudHistory(_conversation: any): boolean {
    return false;
  }

  /** 动态工具调用是否由本进程处理（owner，或无主且 manager 兜底）。 */
  shouldHandleDynamicToolCall(threadId: string | null): boolean {
    if (threadId == null) return false;
    let role = this.getStreamRole(normalizeThreadId(threadId));
    return role?.role === `owner` || (role == null && this.params.canHandleOwnerlessDynamicTool());
  }

  hasConversation(conversationId: string): boolean {
    return this.streamRoles.has(conversationId);
  }

  /** 设置会话流角色（原版 setConversationStreamRole）：换 owner 时拒绝该
   *  owner 的 revision 等待；成为 owner 且暂无 follower 时主动询问。 */
  setConversationStreamRole(conversationId: string, role: StreamRole | null): void {
    if (role == null) {
      this.deleteConversationStreamRole(conversationId);
      return;
    }
    let previous = this.getStreamRole(conversationId);
    if (streamRolesEqual(previous, role)) return;
    if (
      previous?.role === `follower` &&
      (role.role !== `follower` || role.ownerClientId !== previous.ownerClientId)
    )
      this.rejectStreamRevisionWaiters(
        conversationId,
        previous.ownerClientId,
        `no-client-found: thread stream owner changed`,
      );
    this.streamRoles.set(conversationId, role);
    this.params.logger.info(`thread_stream_role_changed`, {
      safe: {
        conversationId,
        previousRole: previous?.role ?? null,
        previousOwnerClientId: previous?.role === `follower` ? previous.ownerClientId : null,
        role: role.role,
        ownerClientId: role.role === `follower` ? role.ownerClientId : null,
      },
      sensitive: {},
    });
    this.notifyStreamRoleChanged(conversationId);
    if (
      role.role === `owner` &&
      !this.followerClientIdsByConversationId.has(conversationId)
    )
      this.params.transport?.requestFollowingStatus(conversationId, this.params.hostId)?.catch((error) => {
        this.params.logger.warning(`Failed to request thread follower status`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
  }

  /** 设置本进程是否跟随某会话（原版 setConversationFollowing）。 */
  setConversationFollowing(conversationId: string, isFollowing: boolean): void {
    if (this.followedConversationIds.has(conversationId) !== isFollowing) {
      if (isFollowing) this.followedConversationIds.add(conversationId);
      else {
        this.followedConversationIds.delete(conversationId);
        // 停止跟随且无独立历史：丢弃 follower 流状态。
        if (
          this.getStreamRole(conversationId)?.role === `follower` &&
          !this.hasIndependentCloudHistory(this.params.threadStore.getConversation(conversationId))
        )
          this.stopFollowingConversationState(conversationId);
      }
      this.dispatchConversationFollowing(conversationId, isFollowing);
    }
  }

  /** 移除会话（原版 removeConversation）：清角色/跟随/revision 并拒绝等待。 */
  removeConversation(conversationId: string): void {
    if (this.followedConversationIds.delete(conversationId))
      this.dispatchConversationFollowing(conversationId, false);
    this.followerClientIdsByConversationId.delete(conversationId);
    this.conversationIdsWithPendingFollowerReconnect.delete(conversationId);
    this.streamRevisionByConversationId.delete(conversationId);
    this.rejectStreamRevisionWaiters(
      conversationId,
      null,
      `Conversation was removed while waiting for history`,
    );
    this.deleteConversationStreamRole(conversationId);
  }

  /** 清空全部流角色（原版 clearConversationStreamRoles）。 */
  clearConversationStreamRoles(): void {
    let conversationIds = [...this.streamRoles.keys()];
    this.streamRoles.clear();
    for (let conversationId of conversationIds) this.notifyStreamRoleChanged(conversationId);
  }

  /**
   * 重连后复位（原版 resetAfterReconnect）：keepRoles 时只统计不清；
   * 否则清 revision、拒绝等待、清角色。
   */
  resetAfterReconnect(keepRoles: boolean = false): { previousStreamingCount: number; previousRoleCount: number } {
    let previousRoleCount = this.streamRoles.size;
    if (keepRoles) return { previousStreamingCount: previousRoleCount, previousRoleCount };
    this.streamRevisionByConversationId.clear();
    for (let conversationId of this.streamRevisionWaiters.keys())
      this.rejectStreamRevisionWaiters(
        conversationId,
        null,
        `Conversation stream reset while waiting for history`,
      );
    this.clearConversationStreamRoles();
    return { previousStreamingCount: previousRoleCount, previousRoleCount };
  }

  /** 向 follower 广播状态 patch（原版 broadcastIpcStatePatches）：revision
   *  单调 +1，带 baseRevision 供对端校验。 */
  broadcastIpcStatePatches(conversationId: string, patches: any[], context?: any): void {
    if (
      patches.length === 0 ||
      this.params.transport == null ||
      !this.canBroadcastIpcStatePatches(conversationId)
    )
      return;
    let followerClientIds = this.getFollowerClientIds(conversationId);
    if (followerClientIds.length === 0) return;
    let baseRevision = this.streamRevisionByConversationId.get(conversationId) ?? 0;
    let revision = baseRevision + 1;
    this.streamRevisionByConversationId.set(conversationId, revision);
    this.patchPublications += 1;
    this.patchRecipients += followerClientIds.length;
    this.params.transport
      .sendPatches(conversationId, this.params.hostId, followerClientIds, baseRevision, revision, patches, context?.changes)
      ?.catch((error) => {
        this.params.logger.warning(`Failed to broadcast thread state patches`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
  }

  /** 广播会话快照（新 follower 加入时，原版 broadcastConversationSnapshot）。 */
  broadcastConversationSnapshot(conversationId: string): number | null {
    let followerClientIds = this.getFollowerClientIds(conversationId);
    if (followerClientIds.length === 0) return null;
    let revision = (this.streamRevisionByConversationId.get(conversationId) ?? 0) + 1;
    return this.sendConversationSnapshot(conversationId, followerClientIds, revision)
      ? (this.streamRevisionByConversationId.set(conversationId, revision), revision)
      : null;
  }

  /**
   * 等待 follower 流到达指定 revision（原版 waitForConversationRevision）：
   * owner 不符立即拒绝；已达即 resolve；否则挂起等待（owner 换人/断线/
   * 超时/移除时拒绝）。
   */
  waitForConversationRevision(
    conversationId: string,
    ownerClientId: string,
    revision: number,
    timeoutMs: number,
  ): Promise<void> {
    let role = this.getStreamRole(conversationId);
    if (role?.role !== `follower` || role.ownerClientId !== ownerClientId)
      return Promise.reject(Error(`no-client-found: thread stream owner is unavailable`));
    if ((this.streamRevisionByConversationId.get(conversationId) ?? 0) >= revision)
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      let waiter = {
        ownerClientId,
        revision,
        resolve: () => {
          waiter.cancel();
          resolve();
        },
        reject: (error: Error) => {
          waiter.cancel();
          reject(error);
        },
        cancel: this.params.schedule(() => {
          this.deleteStreamRevisionWaiter(conversationId, waiter);
          reject(Error(`stream-revision-timeout: timed out waiting for stream revision ${revision}`));
        }, timeoutMs),
      };
      let waiters = this.streamRevisionWaiters.get(conversationId) ?? new Set();
      waiters.add(waiter);
      this.streamRevisionWaiters.set(conversationId, waiters);
    });
  }

  /** owner 流状态输入（原版 handleThreadStreamStateChanged）：snapshot 全量
   *  应用（normalizeConversationState），patch 按基线 revision 应用。 */
  private handleThreadStreamStateChanged(conversationId: string, state: any, clientId: string): void {
    if (!this.followedConversationIds.has(conversationId)) return;
    let role = this.getStreamRole(conversationId);
    if (role?.role === `owner` && state.type !== `snapshot`) return;
    if (state.type === `snapshot`) {
      let conversation = normalizeConversationState(state.conversationState, this.params.hostId);
      this.params.threadStore.setConversation(conversation);
      this.streamRevisionByConversationId.set(conversationId, state.revision);
      this.resolveStreamRevisionWaiters(conversationId, clientId, state.revision);
      this.params.threadStore.notifyConversationCallbacks(conversationId);
      this.setConversationStreamRole(conversationId, { role: `follower`, ownerClientId: clientId });
      return;
    }
    if (
      role?.role !== `follower` ||
      role.ownerClientId !== clientId ||
      this.streamRevisionByConversationId.get(conversationId) !== state.baseRevision
    )
      return;
    let conversation = this.params.threadStore.getConversation(conversationId);
    if (conversation)
      try {
        let patches = state.patches;
        let patched = applyPatches(conversation, patches);
        let acceptedTextChanges = state.acceptedTextChanges;
        this.params.threadStore.setConversation(patched, {
          patches,
          acceptedTranscriptText:
            acceptedTextChanges == null
              ? void 0
              : {
                  changes: acceptedTextChanges,
                  turnEntityKeys: new Set(
                    acceptedTextChanges.map(({ key }: any) => key.entityKey),
                  ),
                },
        });
        this.streamRevisionByConversationId.set(conversationId, state.revision);
        this.resolveStreamRevisionWaiters(conversationId, clientId, state.revision);
        this.params.threadStore.notifyConversationCallbacks(conversationId, { patches });
      } catch (error) {
        this.params.logger.warning(`Failed to apply patches for`, {
          safe: { conversationId: conversation.id },
          sensitive: { conversationId: conversation.id, error },
        });
      }
  }

  /** 客户端上下线（原版 handleClientStatusChanged）。 */
  private handleClientStatusChanged({ clientId, isSelf, status }: { clientId: string; isSelf: boolean; status: string }): void {
    if (status === `connected`) {
      // 新客户端接入：重播全部跟随状态（只发给该客户端，自己除外）。
      for (let conversationId of this.followedConversationIds)
        this.dispatchConversationFollowing(conversationId, true, isSelf === true ? void 0 : [clientId]);
      return;
    }
    // 客户端离线：从 follower 集合移除；作为 owner 的会话标记需 resume。
    for (let [conversationId, clientIds] of this.followerClientIdsByConversationId) {
      if (clientIds.delete(clientId)) {
        if (clientIds.size === 0) this.followerClientIdsByConversationId.delete(conversationId);
        this.params.events.emitStreamFollowersChanged(conversationId);
      }
    }
    for (let [conversationId, role] of this.streamRoles)
      if (role.role === `follower` && role.ownerClientId === clientId) {
        this.rejectStreamRevisionWaiters(
          conversationId,
          clientId,
          `no-client-found: thread stream owner disconnected`,
        );
        this.params.markConversationNeedsResumeForUnavailableOwner(conversationId, clientId);
      }
  }

  /** follower 订阅变化（原版 handleThreadStreamFollowingChanged）。 */
  private handleThreadStreamFollowingChanged(
    conversationId: string,
    clientId: string,
    isFollowing: boolean,
  ): void {
    let clientIds = this.followerClientIdsByConversationId.get(conversationId) ?? new Set<string>();
    if (clientIds.has(clientId) === isFollowing) {
      // 重复订阅：重发当前快照。
      if (isFollowing)
        this.sendConversationSnapshot(
          conversationId,
          [clientId],
          this.streamRevisionByConversationId.get(conversationId) ?? 0,
        );
      return;
    }
    if (isFollowing) {
      let isFirstFollower = clientIds.size === 0;
      clientIds.add(clientId);
      this.followerClientIdsByConversationId.set(conversationId, clientIds);
      this.params.events.emitStreamFollowersChanged(conversationId);
      if (isFirstFollower) this.broadcastConversationSnapshot(conversationId);
      else
        this.sendConversationSnapshot(
          conversationId,
          [clientId],
          this.streamRevisionByConversationId.get(conversationId) ?? 0,
        );
    } else {
      clientIds.delete(clientId);
      if (clientIds.size === 0) this.followerClientIdsByConversationId.delete(conversationId);
      this.params.events.emitStreamFollowersChanged(conversationId);
    }
  }

  /** IPC 连接重置（原版 handleIpcConnectionReset）：follower 集合挂起并
   *  启动重连宽限计时。 */
  private handleIpcConnectionReset(): void {
    for (let conversationId of this.followerClientIdsByConversationId.keys())
      this.conversationIdsWithPendingFollowerReconnect.add(conversationId);
    this.followerClientIdsByConversationId.clear();
    if (this.conversationIdsWithPendingFollowerReconnect.size !== 0) {
      this.cancelFollowerReconnectGrace?.();
      this.cancelFollowerReconnectGrace = this.params.schedule(() => {
        let conversationIds = [...this.conversationIdsWithPendingFollowerReconnect];
        this.conversationIdsWithPendingFollowerReconnect.clear();
        this.cancelFollowerReconnectGrace = null;
        for (let conversationId of conversationIds)
          this.params.events.emitStreamFollowersChanged(conversationId);
      }, this.params.followerReconnectGraceMs);
    }
  }

  /** 发送快照（owner only，原版 sendConversationSnapshot）。 */
  private sendConversationSnapshot(
    conversationId: string,
    clientIds: string[],
    revision: number,
  ): boolean {
    if (this.params.transport == null || this.getStreamRole(conversationId)?.role !== `owner`)
      return false;
    let conversation = this.params.threadStore.getConversation(conversationId);
    if (!conversation) return false;
    this.snapshotPublications += 1;
    this.snapshotRecipients += clientIds.length;
    this.params.transport
      .sendSnapshot(conversationId, this.params.hostId, clientIds, revision, conversation)
      ?.catch((error) => {
        this.params.logger.warning(`Failed to broadcast thread state snapshot`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
    return true;
  }

  private dispatchConversationFollowing(
    conversationId: string,
    isFollowing: boolean,
    clientIds?: string[],
  ): void {
    this.params.transport
      ?.sendFollowingChanged(conversationId, this.params.hostId, isFollowing, clientIds)
      ?.catch((error) => {
        this.params.logger.warning(`Failed to broadcast thread following state`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
  }

  private getFollowerClientIds(conversationId: string): string[] {
    return [...(this.followerClientIdsByConversationId.get(conversationId) ?? [])];
  }

  private stopFollowingConversationState(conversationId: string): void {
    this.streamRevisionByConversationId.delete(conversationId);
    this.rejectStreamRevisionWaiters(conversationId, null, `Conversation is no longer followed`);
    this.deleteConversationStreamRole(conversationId);
  }

  private deleteConversationStreamRole(conversationId: string): void {
    if (this.streamRoles.delete(conversationId)) this.notifyStreamRoleChanged(conversationId);
  }

  private resolveStreamRevisionWaiters(conversationId: string, ownerClientId: string, revision: number): void {
    let waiters = this.streamRevisionWaiters.get(conversationId);
    if (waiters != null) {
      for (let waiter of waiters)
        if (!(waiter.ownerClientId !== ownerClientId || waiter.revision > revision)) {
          waiters.delete(waiter);
          waiter.resolve();
        }
      if (waiters.size === 0) this.streamRevisionWaiters.delete(conversationId);
    }
  }

  private rejectStreamRevisionWaiters(conversationId: string, ownerClientId: string | null, message: string): void {
    let waiters = this.streamRevisionWaiters.get(conversationId);
    if (waiters != null) {
      for (let waiter of waiters)
        if (ownerClientId == null || waiter.ownerClientId === ownerClientId) {
          waiters.delete(waiter);
          waiter.reject(Error(message));
        }
      if (waiters.size === 0) this.streamRevisionWaiters.delete(conversationId);
    }
  }

  private deleteStreamRevisionWaiter(conversationId: string, waiter: any): void {
    let waiters = this.streamRevisionWaiters.get(conversationId);
    if (waiters != null) {
      waiters.delete(waiter);
      if (waiters.size === 0) this.streamRevisionWaiters.delete(conversationId);
    }
  }

  private notifyStreamRoleChanged(conversationId: string): void {
    let role = this.getStreamRole(conversationId);
    this.params.events.emitStreamRole(conversationId, role);
    if (this.params.isLocalHost(this.params.hostId))
      this.params.transport
        ?.setThreadOwnership(conversationId, this.params.hostId, role?.role === `owner`)
        ?.catch((error) => {
          this.params.logger.warning(`Failed to update local thread ownership`, {
            safe: { conversationId },
            sensitive: { error },
          });
        });
  }
}

// ---------------------------------------------------------------------------
// Xge：分层订阅注册表
// ---------------------------------------------------------------------------

/** 订阅描述（owner = ThreadStore）。 */
type Subscription =
  | { type: `host`; field: string; listener: (value: any) => void }
  | { type: `conversation`; key: { threadId: string }; listener: (value?: any) => void }
  | { type: `thread`; key: { threadId: string }; field: string; listener: (value: any) => void }
  | {
      type: `turn`;
      key: { threadId: string; entityKey: string };
      field: string;
      listener: (value: any) => void;
    }
  | {
      type: `item`;
      key: { threadId: string; entityKey: string; itemId: string };
      listener: (value: any) => void;
    };

/** 分层订阅注册表（原版 Xge）。 */
export class SubscriptionRegistry {
  private owner: any;
  private subscribers = new Map<
    string | null,
    Map<string, Map<string, { index: number; listeners: Set<(value?: any) => void> }>>
  >();

  constructor(owner: any) {
    this.owner = owner;
  }

  /**
   * 订阅（原版 subscribe）：按 threadId → scope → field 三级定位；item
   * 订阅额外记录首次订阅时的 items 数组下标（定位失败则 findIndex）。
   * 立即以当前值回调一次；返回反注册函数。
   */
  subscribe(subscription: Subscription): () => void {
    let threadId = subscription.type === `host` ? null : subscription.key.threadId;
    let scope: string;
    let field: string;
    if (subscription.type === `host`) {
      scope = `host`;
      field = subscription.field;
    } else if (subscription.type === `conversation`) {
      scope = `conversation`;
      field = `transcript`;
    } else if (subscription.type === `thread`) {
      scope = `thread`;
      field = subscription.field;
    } else {
      scope = `${subscription.type}:${subscription.key.entityKey}`;
      field = subscription.type === `item` ? subscription.key.itemId : (subscription as any).field;
    }
    let byScope = this.subscribers.get(threadId);
    if (byScope == null) {
      byScope = new Map();
      this.subscribers.set(threadId, byScope);
    }
    let byField = byScope.get(scope);
    if (byField == null) {
      byField = new Map();
      byScope.set(scope, byField);
    }
    let entry = byField.get(field);
    if (entry == null) {
      let index = -1;
      if (subscription.type === `item`) {
        let conversation = this.owner.getConversation(subscription.key.threadId);
        let turn = this.owner.getTurn(conversation, subscription.key.entityKey);
        let items = byField.size;
        index =
          turn?.items[items]?.id === subscription.key.itemId
            ? items
            : (turn?.items.findIndex((item: any) => item?.id === subscription.key.itemId) ?? -1);
      }
      entry = { index, listeners: new Set() };
      byField.set(field, entry);
    }
    let itemIndex = entry.index;
    let notify = (context?: any) => {
      if (subscription.type === `host`) {
        subscription.listener(this.owner.getRecentThreads());
        return;
      }
      let currentThreadId = subscription.key.threadId;
      if (subscription.type === `conversation`) {
        subscription.listener(context ?? this.owner.getTranscript(currentThreadId));
        return;
      }
      let conversation = this.owner.getConversation(currentThreadId);
      if (subscription.type === `thread`) {
        subscription.listener(this.owner.threadFieldReaders[subscription.field](conversation, currentThreadId));
        return;
      }
      let turn = this.owner.getTurn(conversation, subscription.key.entityKey);
      if (subscription.type === `turn`) {
        subscription.listener(
          this.owner.turnFieldReaders[subscription.field](turn, conversation, subscription.key.entityKey),
        );
        return;
      }
      subscription.listener(turn?.items[itemIndex] ?? null);
    };
    let unsubscribe = () => {
      entry!.listeners.delete(notify);
      if (entry!.listeners.size === 0) byField!.delete(field);
      if (byField!.size === 0) byScope!.delete(scope);
      if (byScope!.size === 0) this.subscribers.delete(threadId);
    };
    entry.listeners.add(notify);
    try {
      notify();
    } catch (error) {
      unsubscribe();
      throw error;
    }
    return unsubscribe;
  }

  /** 通知某线程的字段订阅（threadId 为空时通知全部线程）。 */
  notifyThreadField(threadId: string | null, field: string): void {
    if (threadId == null) {
      for (let key of this.subscribers.keys())
        if (key != null) this.notifyThreadField(key, field);
      return;
    }
    for (let listener of this.subscribers.get(threadId)?.get(`thread`)?.get(field)?.listeners ?? [])
      listener();
  }

  /** 通知 host 级字段订阅。 */
  notifyHostField(field: string): void {
    for (let listener of this.subscribers.get(null)?.get(`host`)?.get(field)?.listeners ?? [])
      listener();
  }

  hasConversationSubscribers(conversationId: string): boolean {
    return (
      (this.subscribers.get(conversationId)?.get(`conversation`)?.get(`transcript`)?.listeners.size ?? 0) > 0
    );
  }

  /** 通知会话 transcript 订阅（携带可选上下文）。 */
  notifyTranscript(conversationId: string, context?: any): void {
    for (let listener of this.subscribers.get(conversationId)?.get(`conversation`)?.get(`transcript`)
      ?.listeners ?? [])
      listener(context);
  }

  get(conversationId: string | null): Map<string, Map<string, { index: number; listeners: Set<any> }>> | undefined {
    return this.subscribers.get(conversationId);
  }
}
