export interface HandoffBranchRecord {
  sourceConversationId?: string | null;
  targetConversationId?: string | null;
  sourceBranch?: string | null;
  localBranch?: string | null;
  worktreeBranch?: string | null;
  direction?: string | null;
}

/** Project the branch associated with a conversation in a handoff record. */
export function selectHandoffBranch(record: HandoffBranchRecord | null | undefined, conversationId: string | null | undefined): string | null {
  if (record == null || conversationId == null) return null;
  if (record.sourceConversationId === conversationId) return record.sourceBranch ?? null;
  if (record.targetConversationId === conversationId) return record.direction === "to-worktree" ? (record.worktreeBranch ?? record.sourceBranch ?? null) : (record.localBranch ?? record.sourceBranch ?? null);
  return null;
}
