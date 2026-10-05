export function selectHandoffDirection(input: { codexWorktree?: unknown; operation?: { direction?: string } | null; threadHandoff?: { isWorktreeConversation?: boolean } | null }): string {
  if (input.operation != null) return input.operation.direction ?? "";
  if (input.threadHandoff == null) return input.codexWorktree ? "to-local" : "to-worktree";
  return input.threadHandoff.isWorktreeConversation ? "to-local" : "to-worktree";
}
