import {
  Zr as createInboxTurnHandler,
  w as persistInboxItems,
  x as setInboxItemReadState,
  b as markAllAutomationItemsRead,
  fu as inboxEvents,
} from "@chunk/shared";
import { extractInboxItems } from "../markdown/marked-extensions";

const INSTALLATION_ID_KEY = `electron-automations-installation-id`;

/** Inbox item persistence and turn-completion projection owner (original `xwe`). */
export class InboxItemsFacade {
  broadcaster: { inboxItemsChanged(event: unknown): void };

  constructor(broadcaster: { inboxItemsChanged(event: unknown): void }) {
    this.broadcaster = broadcaster;
  }

  bindTurnCompletions({ manager, connection, context, globalState, assertCurrent }: any) {
    if (!connection.isLocal || manager.getHostId() !== connection.hostId || context.identity.kind !== `chatgpt`) return null;
    const { accountId, userId } = context.identity;
    return manager.constructor.addTurnStartRequestedListener(manager, (request: any) => {
      const installationId = globalState.get(INSTALLATION_ID_KEY);
      if (installationId == null) return null;
      const handle = createInboxTurnHandler(
        request.conversationId,
        { accountId, userId, installationId },
        () => {
          if (!request.isCurrent() || request.hostId !== connection.hostId || globalState.get(INSTALLATION_ID_KEY) !== installationId)
            return false;
          try { assertCurrent(); return true; } catch { return false; }
        },
      );
      return handle == null ? null : {
        isCurrent: handle.isCurrent,
        onAccepted: () => handle.isCurrent(),
        onCompleted: ({ conversationId, lastAgentMessage }: any) => {
          if (lastAgentMessage == null) return;
          const item = extractInboxItems(conversationId, lastAgentMessage).at(-1);
          if (item != null && handle.apply(item.title, item.description))
            this.broadcaster.inboxItemsChanged(inboxEvents.CHANGED);
        },
        dispose() {},
      };
    });
  }

  persistAndNotify(items: unknown) {
    const persisted = persistInboxItems(items);
    if (persisted.length <= 0) return 0;
    this.broadcaster.inboxItemsChanged(inboxEvents.CHANGED);
    return persisted.length;
  }

  markRead(id: unknown, value: unknown) {
    if (setInboxItemReadState(id, value)) this.broadcaster.inboxItemsChanged(inboxEvents.CHANGED);
  }

  markUnread(id: unknown) {
    if (setInboxItemReadState(id, null)) this.broadcaster.inboxItemsChanged(inboxEvents.CHANGED);
  }

  markAllAutomationRunsRead(value: unknown) {
    if (markAllAutomationItemsRead(value) > 0) this.broadcaster.inboxItemsChanged(inboxEvents.CHANGED);
  }
}
