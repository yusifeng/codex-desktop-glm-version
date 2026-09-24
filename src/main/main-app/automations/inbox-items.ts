// automations inbox 门面（原版 56,344-56,403 的 `xwe` 类）。
//
// 职责：把 turn 完成（agent 消息末尾的 `:::inbox-item` directive）持久化为
// automations inbox 条目并广播变更。bindTurnCompletions 经
// AppServerConversationManager.addTurnStartRequestedListener 静态口挂接
// （本地 host + chatgpt 身份 + automations installationId 就绪才生效）；
// automation guard（n.Zr）判定会话是否属于该身份/安装。
//
// 实例化：R12 启动装配（161,207）。shared inbox API：n.w（persistAndNotify
// 返回条数）/ n.x（标记已读/未读，返回是否有变更）/ n.b（全部标已读返回
// 条数）/ n.fu.CHANGED（变更枚举）。

import {
  Zr as createAutomationGuard,
  w as persistInboxItems,
  x as markInboxItemsReadState,
  b as markAllAutomationRunsRead,
  fu as InboxItemChange,
} from "@chunk/shared";
// a.N（bootstrap LE）= automations 安装 id 的 globalState 键。
import { N as AUTOMATIONS_INSTALLATION_ID_KEY } from "@chunk/bootstrap";
import { AppServerConversationManager } from "../conversation/app-server-manager";
import { extractInboxItems } from "../markdown/marked-extensions";

/** bindTurnCompletions 的装配参数。 */
export interface BindTurnCompletionsParams {
  manager: AppServerConversationManager;
  connection: { isLocal: boolean; hostId: string };
  context: { identity: { kind: string; accountId?: string; userId?: string } };
  globalState: { get: (key: string) => unknown };
  assertCurrent: () => void;
}

/**
 * automations inbox 门面（原 `xwe`）。
 * broadcaster 由 R12 装配注入（inboxItemsChanged 广播通道）。
 */
export class InboxItemsFacade {
  broadcaster: { inboxItemsChanged: (change: unknown) => void };

  constructor(broadcaster: { inboxItemsChanged: (change: unknown) => void }) {
    this.broadcaster = broadcaster;
  }

  /**
   * 挂接 turn 完成监听（原 bindTurnCompletions）：非本地 host、host 不匹配
   * 或非 chatgpt 身份返回 null。installationId 在挂接时读取一次并在每次
   * 回调中复核（变更即失效）。
   */
  bindTurnCompletions({ manager, connection, context, globalState, assertCurrent }: BindTurnCompletionsParams) {
    if (!connection.isLocal || manager.getHostId() !== connection.hostId || context.identity.kind !== `chatgpt`)
      return null;
    let { accountId, userId } = context.identity;
    return AppServerConversationManager.addTurnStartRequestedListener(manager, (request: any) => {
      let installationId = globalState.get(AUTOMATIONS_INSTALLATION_ID_KEY);
      if (installationId == null) return null;
      let guard = createAutomationGuard(
        request.conversationId,
        { accountId, userId, installationId },
        () => {
          if (
            !request.isCurrent() ||
            request.hostId !== connection.hostId ||
            globalState.get(`electron-automations-installation-id`) !== installationId
          )
            return false;
          try {
            return (assertCurrent(), true);
          } catch {
            return false;
          }
        },
      );
      return guard == null
        ? null
        : {
            isCurrent: guard.isCurrent,
            onAccepted: () => guard.isCurrent(),
            onCompleted: ({ conversationId, lastAgentMessage }: any) => {
              if (lastAgentMessage == null) return;
              let item = extractInboxItems(conversationId, lastAgentMessage).at(-1);
              item != null &&
                guard.apply(item.title, item.description) &&
                this.broadcaster.inboxItemsChanged(InboxItemChange.CHANGED);
            },
            dispose() {},
          };
    });
  }

  /** 持久化外部提供的 inbox 条目并广播（返回条数，0 条不广播）。 */
  persistAndNotify(items: unknown) {
    let count = persistInboxItems(items);
    return count <= 0 ? 0 : (this.broadcaster.inboxItemsChanged(InboxItemChange.CHANGED), count);
  }

  /** 标记条目已读（有变更才广播）。 */
  markRead(items: unknown, readAt: unknown) {
    markInboxItemsReadState(items, readAt) && this.broadcaster.inboxItemsChanged(InboxItemChange.CHANGED);
  }

  /** 标记条目未读（有变更才广播）。 */
  markUnread(items: unknown) {
    markInboxItemsReadState(items, null) && this.broadcaster.inboxItemsChanged(InboxItemChange.CHANGED);
  }

  /** 全部 automation run 标已读（>0 才广播）。 */
  markAllAutomationRunsRead(accountId: unknown) {
    markAllAutomationRunsRead(accountId) > 0 && this.broadcaster.inboxItemsChanged(InboxItemChange.CHANGED);
  }
}
