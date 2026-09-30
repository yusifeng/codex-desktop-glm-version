type EvictionReason = `archive` | `archive-notification` | `delete` | `discard` | `empty-thread`;
interface Clearable { clearConversation(id: string): void }
interface EvictionParams {
  parseUrl?: unknown;
  clearPersistedUnreadState(id: string): void; emitThreadArchived(id: string): void;
  invalidateResumeState(id: string, reason: EvictionReason): void; inactiveThreadUnsubscriber: unknown;
  itemStreamState: { clearConversationTerminalInputBuffers(id: string): void }; manualContextCompactions: Clearable;
  unread: Clearable; resumeNotificationBuffer: { discard(id: string): void };
  threadStartedNotificationDeferral: { discardConversation(id: string): void };
  threadStore: { suppressArchivedConversation(id: string): void; removeThreadSummary(id: string): void; removeConversationStoreEntries(id: string): void };
}

export class kh {
  constructor(private readonly params: EvictionParams) {}
  evictConversation(id: string, options: { reason: EvictionReason }): void {
    const { reason } = options;
    if (reason === `archive` || reason === `archive-notification`) {
      this.params.clearPersistedUnreadState(id); this.params.threadStore.suppressArchivedConversation(id);
      if (reason === `archive-notification`) this.params.emitThreadArchived(id);
      this.params.threadStore.removeThreadSummary(id);
    } else if (reason === `delete`) {
      this.params.clearPersistedUnreadState(id); this.params.threadStore.suppressArchivedConversation(id); this.params.threadStore.removeThreadSummary(id);
    } else this.params.clearPersistedUnreadState(id);
    this.params.invalidateResumeState(id, reason);
    (this.params.inactiveThreadUnsubscriber as { removeConversation?: (value: string) => void }).removeConversation?.(id);
    this.params.itemStreamState.clearConversationTerminalInputBuffers(id); this.params.manualContextCompactions.clearConversation(id);
    this.params.unread.clearConversation(id); this.params.resumeNotificationBuffer.discard(id);
    this.params.threadStartedNotificationDeferral.discardConversation(id); this.params.threadStore.removeConversationStoreEntries(id);
    if (reason === `discard`) this.params.threadStore.removeThreadSummary(id);
  }
}
export const ConversationEvictionCoordinator = kh;
