export interface HandoffBranchInput { conversationId?: string | null; handoffBranch?: unknown; handoffDirection?: string | null; operation?: unknown; threadHandoff?: unknown }

/** Whether the current thread state requires a handoff branch. */
export function shouldUseHandoffBranch(input: HandoffBranchInput): boolean {
  return input.conversationId != null && input.threadHandoff != null && (input.handoffDirection === "to-local" || !!input.handoffBranch || input.operation != null);
}
