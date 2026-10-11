/** Serializes per-conversation thread/settings/update operations. */
export function createThreadSettingsUpdateRegistry() {
  const pending = new Map<string, Promise<unknown>>();

  async function run(conversationId: string, operation: () => Promise<unknown>) {
    const previous = pending.get(conversationId);
    const current = (async () => {
      if (previous != null) await previous.catch(() => void 0);
      return operation();
    })();
    pending.set(conversationId, current);
    try {
      return await current;
    } finally {
      if (pending.get(conversationId) === current) pending.delete(conversationId);
    }
  }

  return {
    run,
    async wait(conversationId: string) {
      await pending.get(conversationId);
    },
    clear() {
      pending.clear();
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createThreadSettingsUpdateRegistry };
