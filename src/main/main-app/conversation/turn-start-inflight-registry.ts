/** Owns per-conversation turn-start promise deduplication and identity-safe settlement cleanup. */
function createTurnStartInflightRegistry<T>() {
  const entries = new Map<string, Promise<T>>();
  const get = (conversationId: string) => entries.get(conversationId);
  const register = (conversationId: string, promise: Promise<T>) => {
    entries.set(conversationId, promise);
    const cleanup = () => {
      if (entries.get(conversationId) === promise) entries.delete(conversationId);
    };
    promise.then(cleanup, cleanup);
    return promise;
  };
  const deleteIfCurrent = (conversationId: string, promise: Promise<T>) => {
    if (entries.get(conversationId) === promise) entries.delete(conversationId);
  };
  const clear = () => entries.clear();
  return { get, register, deleteIfCurrent, clear };
}

export { createTurnStartInflightRegistry };
if (typeof module !== `undefined`) module.exports = { createTurnStartInflightRegistry };
