// @ts-nocheck

/** Reads trigger subscriptions in bounded batches while pinning account identity for the request. */
export function createTriggerSubscriptionReaderClass(dependencies: Record<string, any>) {
  const { runtime, RpcHandlerBase, chunkArray, batchSize = 100 } = dependencies;
  const responseSchema = runtime.wf({
    subscriptions: runtime.hf(
      runtime.wf({
        thread_id: runtime.Of(),
        subscription_id: runtime.Of(),
        connector_id: runtime.Of(),
        connector_name: runtime.Of(),
        event_name: runtime.Of(),
        display_label: runtime.Of(),
      }),
    ),
  });

  return class TriggerSubscriptionReader extends RpcHandlerBase {
    getPrincipal;
    fetchJson;
    controller = new AbortController();

    constructor(getPrincipal: any, fetchJson: any) {
      super();
      this.getPrincipal = getPrincipal;
      this.fetchJson = fetchJson;
    }

    async readMany({ accountId, threadIds }: { accountId: string; threadIds: string[] }) {
      const { signal } = this.controller;
      const principal = await this.getPrincipal();
      if (principal?.accountId !== accountId) {
        throw Error(`Trigger account is no longer active`);
      }
      signal.throwIfAborted();

      const uniqueThreadIds = [...new Set(threadIds)];
      const responses = await Promise.all(
        chunkArray(uniqueThreadIds, batchSize).map(async (batch: string[]) =>
          responseSchema.parse(
            await this.fetchJson(`/ps/event-subscriptions/batch`, {
              method: `POST`,
              body: { thread_ids: batch },
              signal,
            }),
          ),
        ),
      );

      const currentPrincipal = await this.getPrincipal();
      if (
        currentPrincipal?.accountId !== principal.accountId ||
        currentPrincipal.userId !== principal.userId
      ) {
        throw Error(`Trigger account changed during the request`);
      }
      signal.throwIfAborted();

      const subscriptions = responses.flatMap((response: Record<string, any>) => response.subscriptions);
      return Object.fromEntries(
        uniqueThreadIds.map((threadId) => [
          threadId,
          subscriptions.filter((subscription: Record<string, any>) => subscription.thread_id === threadId),
        ]),
      );
    }

    cancelPendingReads() {
      this.controller.abort();
      this.controller = new AbortController();
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTriggerSubscriptionReaderClass };
}
