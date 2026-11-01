/**
 * Ensures that a conversation is present and has enough history to be opened.
 *
 * The app-primary hub used this as an inline helper before navigation. Keeping
 * the store and hydration services structural makes the policy usable by both
 * local and remote conversation routes without importing the aggregate hub.
 */
export interface ConversationReadyScope {
  get(signal: unknown, parameter?: unknown): unknown;
}

export interface ConversationStore<Conversation> {
  getConversation(conversationId: string): Conversation | null | undefined;
}

export interface ConversationHydrationService {
  hydrateBackgroundThreads(conversationIds: readonly string[]): Promise<void>;
  loadOlderConversationHistoryPage(conversationId: string): Promise<void>;
}

export interface ConversationReadiness<Conversation> {
  conversationStore: unknown;
  getHydrationService(scope: ConversationReadyScope, hostId: string): ConversationHydrationService;
  getMessages(conversation: Conversation): readonly unknown[];
  hasCompleteHistory(conversation: Conversation): boolean;
}

export function ensureConversationReady<Conversation>(
  scope: ConversationReadyScope,
  conversationId: string,
  hostId: string,
  readiness: ConversationReadiness<Conversation>,
): true | Promise<boolean> {
  const store = scope.get(readiness.conversationStore, hostId) as ConversationStore<Conversation> | null | undefined;
  const conversation = store?.getConversation(conversationId);
  if (conversation == null) {
    return readiness
      .getHydrationService(scope, hostId)
      .hydrateBackgroundThreads([conversationId])
      .then(() => {
        const hydrated = (scope
          .get(readiness.conversationStore, hostId) as ConversationStore<Conversation> | null | undefined)
          ?.getConversation(conversationId);
        return hydrated == null
          ? false
          : ensureConversationReady(scope, conversationId, hostId, readiness);
      });
  }

  const resumeState = (conversation as { resumeState?: unknown }).resumeState;
  if (
    resumeState !== "resumed" ||
    (readiness.getMessages(conversation).length === 0 && !readiness.hasCompleteHistory(conversation))
  ) {
    return readiness
      .getHydrationService(scope, hostId)
      .loadOlderConversationHistoryPage(conversationId)
      .then(() => true);
  }

  return true;
}
