/**
 * Ensures that a conversation is present and has enough history to be opened.
 *
 * The app-primary hub used this as an inline helper before navigation. Keeping
 * the store and hydration services structural makes the policy usable by both
 * local and remote conversation routes without importing the aggregate hub.
 */
export interface ConversationReadyScope<Conversation> {
  getConversationStore(hostId: string): ConversationStore<Conversation> | null | undefined;
  getHydrationService(hostId: string): ConversationHydrationService;
}

export interface ConversationStore<Conversation> {
  getConversation(conversationId: string): Conversation | null | undefined;
}

export interface ConversationHydrationService {
  hydrateBackgroundThreads(conversationIds: readonly string[]): Promise<void>;
  loadOlderConversationHistoryPage(conversationId: string): Promise<void>;
}

export interface ConversationReadiness<Conversation> {
  isResumed(conversation: Conversation): boolean;
  hasMessages(conversation: Conversation): boolean;
}

export function ensureConversationReady<Conversation>(
  scope: ConversationReadyScope<Conversation>,
  conversationId: string,
  hostId: string,
  readiness: ConversationReadiness<Conversation>,
): true | Promise<boolean> {
  const store = scope.getConversationStore(hostId);
  const conversation = store?.getConversation(conversationId);
  if (conversation == null) {
    return scope
      .getHydrationService(hostId)
      .hydrateBackgroundThreads([conversationId])
      .then(() => {
        const hydrated = scope.getConversationStore(hostId)?.getConversation(conversationId);
        return hydrated == null
          ? false
          : ensureConversationReady(scope, conversationId, hostId, readiness);
      });
  }

  if (!readiness.isResumed(conversation) || !readiness.hasMessages(conversation)) {
    return scope
      .getHydrationService(hostId)
      .loadOlderConversationHistoryPage(conversationId)
      .then(() => true);
  }

  return true;
}
