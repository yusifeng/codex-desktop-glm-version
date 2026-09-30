interface Manager {
  getConversation(id: string): Record<string, unknown> | null;
  updateConversationState(
    id: string,
    update: (value: Record<string, unknown>) => void,
  ): void;
  loadOlderConversationTurnsPage?(
    id: string,
    options?: unknown,
  ): Promise<unknown>;
  pagination?: {
    loadOlderConversationTurnsPage(
      id: string,
      options?: unknown,
    ): Promise<unknown>;
  };
}
export async function ensureConversationHistoryLoaded(
  manager: Manager,
  id: string,
  turns: unknown[] = [],
  options: Record<string, unknown> = {},
): Promise<unknown> {
  const conversation = manager.getConversation(id);
  if (conversation == null) return null;
  if (
    (conversation.turnsPagination as { hasLoadedOldest?: boolean } | undefined)
      ?.hasLoadedOldest === false
  )
    return manager.pagination?.loadOlderConversationTurnsPage(id, {
      ...options,
      turns,
    });
  return conversation;
}
export const gve = ensureConversationHistoryLoaded;
export async function loadOlderConversationHistoryPage(
  manager: Manager,
  id: string,
  _turns: unknown[] = [],
  options: Record<string, unknown> = {},
): Promise<unknown> {
  return (
    manager.pagination?.loadOlderConversationTurnsPage(id, options) ?? null
  );
}
export const _ve = loadOlderConversationHistoryPage;
export async function getCompleteConversationTurns(
  manager: Manager,
  id: string,
): Promise<unknown> {
  let conversation = manager.getConversation(id);
  while (
    (conversation?.turnsPagination as { hasLoadedOldest?: boolean } | undefined)
      ?.hasLoadedOldest === false
  ) {
    await loadOlderConversationHistoryPage(manager, id);
    conversation = manager.getConversation(id);
  }
  return conversation?.turns ?? [];
}
export const hve = getCompleteConversationTurns;
export function applyRollbackResponse(
  manager: Manager,
  {
    conversationId,
    conversationState,
    rollbackResponse,
  }: {
    conversationId: string;
    conversationState: Record<string, unknown>;
    rollbackResponse: Record<string, unknown>;
  },
  accept: (turns: unknown[], truncatedBefore: boolean) => void,
): void {
  const thread =
    (rollbackResponse.thread as Record<string, unknown> | undefined) ?? {};
  manager.updateConversationState(conversationId, (state) => {
    state.requests = [];
    state.resumeState = "resumed";
    state.sessionId = thread.sessionId;
    state.rolloutPath = thread.path ?? state.rolloutPath;
    state.cwd = thread.cwd || conversationState.cwd || state.cwd;
    state.hasUnreadTurn = false;
  });
  accept(Array.isArray(thread.turns) ? thread.turns : [], false);
}
export const fve = applyRollbackResponse;
export function applyRevertResponse(
  manager: Manager,
  {
    conversationId,
    response,
    revertedTurns,
  }: {
    conversationId: string;
    response: Record<string, unknown>;
    revertedTurns: Array<{ turnId?: string | null }>;
  },
  accept: (truncatedBefore: boolean) => void,
): void {
  const removed = new Set(revertedTurns.map((turn) => turn.turnId));
  manager.updateConversationState(conversationId, (state) => {
    if (Array.isArray(state.turns))
      state.turns = state.turns.filter(
        (turn) =>
          typeof turn !== "object" ||
          turn == null ||
          !("turnId" in turn) ||
          !removed.has(turn.turnId as string | null),
      );
    const thread = response.thread as Record<string, unknown> | undefined;
    if (thread?.sessionId != null) state.sessionId = thread.sessionId;
  });
  accept(false);
}
export const pve = applyRevertResponse;
