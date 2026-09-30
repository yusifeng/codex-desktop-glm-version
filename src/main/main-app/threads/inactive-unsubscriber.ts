interface Params {
  logger: {
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warning(message: string, data?: unknown): void;
  };
  threadStore: {
    getConversation(id: string): { resumeState?: string } | null;
    updateConversationState(
      id: string,
      update: (value: Record<string, unknown>) => void,
    ): void;
  };
  streamState: {
    removeConversation(id: string): void;
    getStreamRole(id: string): { role: string } | null;
    ownsConversationHistoryStream(id: string): boolean;
  };
  requestClient: {
    sendRequest(method: string, params: unknown): Promise<{ status?: string }>;
  };
  parseUrl?: (url: string) => unknown;
  events?: {
    addConversationStateCallback?(
      callback: (id: string, state: unknown) => void,
    ): () => void;
  };
  beforePassiveRelease?(id: string): void;
  now(): number;
  schedule(callback: () => void, delay: number): () => void;
  scheduleMicrotask(callback: () => void): void;
}
export class InactiveThreadUnsubscriber {
  private readonly cleanup: Array<() => void> = [];
  private readonly inactive = new Map<string, number>();
  private readonly unsubscribing = new Set<string>();
  constructor(private readonly params: Params) {
    const release = params.events?.addConversationStateCallback?.(
      (id, state) => {
        if (state == null) this.inactive.delete(id);
      },
    );
    if (release) this.cleanup.push(release);
  }
  dispose(): void {
    for (const release of this.cleanup.splice(0)) release();
    this.inactive.clear();
  }
  handleConversationActivityChanged(id: string, active: boolean): void {
    if (active) this.inactive.delete(id);
    else this.inactive.set(id, this.params.now());
  }
  clearConversationStreamOwnership(id: string): void {
    this.params.streamState.removeConversation(id);
    this.inactive.delete(id);
  }
  async unsubscribeInactiveConversation(id: string): Promise<void> {
    if (this.unsubscribing.has(id)) return;
    const conversation = this.params.threadStore.getConversation(id);
    if (
      conversation?.resumeState !== "resumed" ||
      !this.params.streamState.ownsConversationHistoryStream(id)
    )
      return;
    this.unsubscribing.add(id);
    try {
      await this.params.requestClient.sendRequest("thread/unsubscribe", {
        threadId: id,
      });
      this.params.threadStore.updateConversationState(id, (value) => {
        value.resumeState = "needs_resume";
      });
      this.params.beforePassiveRelease?.(id);
      this.clearConversationStreamOwnership(id);
    } catch (error) {
      this.params.logger.warning("inactive_thread_unsubscribe_failed", {
        safe: { conversationId: id },
        sensitive: { error },
      });
    } finally {
      this.unsubscribing.delete(id);
    }
  }
}
export { InactiveThreadUnsubscriber as Dve };
