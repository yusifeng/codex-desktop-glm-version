import {
  findDraftTurn,
  removeTurn,
  type ConversationLike,
} from "../turns/canonical-history";

const PENDING_ID = "pending-manual-context-compaction";
interface Store {
  updateConversationState(
    id: string,
    update: (conversation: any) => void,
  ): void;
}
export class ManualContextCompactionTracker {
  private readonly pendingCounts = new Map<string, number>();
  constructor(
    private readonly threadStore: Store,
    private readonly addPending: (
      conversationId: string,
      item: Record<string, unknown>,
      options?: unknown,
    ) => unknown,
  ) {}
  register(id: string): void {
    this.pendingCounts.set(id, (this.pendingCounts.get(id) ?? 0) + 1);
    this.addPending(id, {
      type: "contextCompaction",
      id: PENDING_ID,
      completed: false,
      source: "manual",
    });
  }
  remove(id: string): void {
    if (this.decrement(id)) this.removePendingItem(id);
  }
  consumeSource(id: string): "manual" | "automatic" {
    return this.pendingCounts.has(id)
      ? (this.decrement(id), "manual")
      : "automatic";
  }
  clearConversation(id: string): void {
    this.pendingCounts.delete(id);
  }
  private decrement(id: string): boolean {
    const count = this.pendingCounts.get(id);
    if (count == null) return false;
    if (count <= 1) {
      this.pendingCounts.delete(id);
      return true;
    }
    this.pendingCounts.set(id, count - 1);
    return false;
  }
  private removePendingItem(id: string): void {
    this.threadStore.updateConversationState(id, (conversation) => {
      const state = conversation as ConversationLike;
      const turn = findDraftTurn(state, (candidate) =>
        candidate.items.some((item) => item.id === PENDING_ID),
      );
      if (turn == null) return;
      turn.items = turn.items.filter((item) => item.id !== PENDING_ID);
      if (turn.turnId == null && turn.status === "inProgress" && turn.items.length === 0)
        removeTurn(state, turn);
    });
  }
}
export { ManualContextCompactionTracker as Bve };
