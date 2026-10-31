// @ts-nocheck

/** Serializes sidebar thread-metadata mutations and rolls persistence back on flush failure. */
export function createThreadMetadataServiceClass(dependencies: Record<string, any>) {
  const {
    RpcHandlerBase,
    createLogger,
    metadataKey,
    validateUpdate,
    applyUpdate,
  } = dependencies;

  return class ThreadMetadataService extends RpcHandlerBase {
    #logger = createLogger(`ThreadMetadataService`);
    #pending = Promise.resolve();
    #globalState;
    #onChanged;

    constructor(globalState: any, onChanged: () => void) {
      super();
      this.#globalState = globalState;
      this.#onChanged = onChanged;
    }

    async get(threadId: string) {
      await this.#pending;
      const metadata = this.#globalState.getStored(metadataKey)?.[threadId];
      return metadata == null ? null : { ...metadata };
    }

    update(update: Record<string, any>) {
      const operation = this.#pending.then(
        () => this.#apply(update),
        () => this.#apply(update),
      );
      this.#pending = operation.catch(() => undefined);
      return operation;
    }

    async #apply(update: Record<string, any>) {
      validateUpdate(update);
      const previous = this.#globalState.getStored(metadataKey);
      const current = previous ?? {};
      const next = applyUpdate(current, update);
      if (next === current) return;

      this.#globalState.set(metadataKey, next);
      try {
        await this.#globalState.flushOrThrow();
        this.#onChanged();
      } catch (error) {
        this.#globalState.set(metadataKey, previous);
        try {
          await this.#globalState.flushOrThrow();
        } catch (rollbackError) {
          this.#logger.error(`Failed to persist thread metadata rollback`, {
            safe: {},
            sensitive: { rollbackError },
          });
        }
        this.#onChanged();
        throw error;
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createThreadMetadataServiceClass };
}
