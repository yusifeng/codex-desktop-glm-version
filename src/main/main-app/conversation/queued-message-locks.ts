const ACTIVE_LOCK_TTL_MS = 2 * 60_000;
const SENT_MESSAGE_TTL_MS = 10 * 60_000;

export type QueuedMessageLockIdentity = {
  conversationId: string;
  messageId: string;
  lockId: string;
};

export class QueuedMessageLocks {
  private readonly startingTurns = new Set<string>();
  private readonly activeLocks = new Map<string, { lockId: string; expiresAtMs: number }>();
  private readonly sentMessages = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  tryAcquireStartTurn(conversationId: string): boolean {
    if (this.startingTurns.has(conversationId)) return false;
    this.startingTurns.add(conversationId);
    return true;
  }

  releaseStartTurn(conversationId: string): void {
    this.startingTurns.delete(conversationId);
  }

  tryAcquire({ conversationId, messageId, lockId }: QueuedMessageLockIdentity): boolean {
    const now = this.now();
    this.deleteExpiredSentMessages(now);
    if (this.sentMessages.has(this.sentMessageKey(conversationId, messageId))) return false;
    const activeLock = this.activeLocks.get(conversationId);
    if (activeLock != null && activeLock.expiresAtMs > now) return false;
    this.activeLocks.set(conversationId, { lockId, expiresAtMs: now + ACTIVE_LOCK_TTL_MS });
    return true;
  }

  release({ conversationId, messageId, lockId, sent }: QueuedMessageLockIdentity & { sent: boolean }): void {
    if (this.activeLocks.get(conversationId)?.lockId === lockId)
      this.activeLocks.delete(conversationId);
    if (sent)
      this.sentMessages.set(this.sentMessageKey(conversationId, messageId), this.now() + SENT_MESSAGE_TTL_MS);
  }

  private sentMessageKey(conversationId: string, messageId: string): string {
    return `${conversationId}\n${messageId}`;
  }

  private deleteExpiredSentMessages(now: number): void {
    for (const [key, expiresAtMs] of this.sentMessages)
      if (expiresAtMs <= now) this.sentMessages.delete(key);
  }
}
