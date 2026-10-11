/** Owns per-conversation goal hydration generations and cleanup. */
class ThreadGoalHydrationRegistry {
  private readonly entries = new Map<string, symbol>();
  constructor(private readonly isDisposed: () => boolean) {}
  begin(conversationId: string) { const token = Symbol(); this.entries.set(conversationId, token); return token; }
  isCurrent(conversationId: string, token: symbol) { return !this.isDisposed() && this.entries.get(conversationId) === token; }
  end(conversationId: string, token: symbol) { return this.isCurrent(conversationId, token) ? (this.entries.delete(conversationId), true) : false; }
  cancel(conversationId: string) { this.entries.delete(conversationId); }
  clear() { this.entries.clear(); }
}
export { ThreadGoalHydrationRegistry };
if (typeof module !== `undefined`) module.exports = { ThreadGoalHydrationRegistry };
