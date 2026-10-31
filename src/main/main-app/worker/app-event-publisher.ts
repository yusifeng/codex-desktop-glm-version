export interface AppEvent<T = unknown> {
  type: T;
  at: number;
}

/** Publishes timestamped application lifecycle events to active worker subscriptions. */
export class AppEventPublisher<T = unknown> {
  private readonly handlers = new Set<(event: AppEvent<T>) => void>();

  subscribe(handler: (event: AppEvent<T>) => void) {
    this.handlers.add(handler);
    return {
      dispose: () => {
        this.handlers.delete(handler);
      },
    };
  }

  emit(type: T, at = Date.now()) {
    for (const handler of this.handlers) handler({ type, at });
  }
}

if (typeof module !== `undefined`) module.exports = { AppEventPublisher };
