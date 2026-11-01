export class SharedObjectRepository {
  private readonly store: Record<string, unknown> = {};
  private readonly subscribers = new Set<(key: string, value: unknown) => void>();

  get(key: string): unknown {
    if (key in this.store) return this.store[key];
    return undefined;
  }

  getSnapshot(): Record<string, unknown> {
    return { ...this.store };
  }

  set(key: string, value: unknown): void {
    if (value === undefined) delete this.store[key];
    else this.store[key] = value;
    for (const subscriber of this.subscribers) subscriber(key, value);
  }

  addSubscriber(subscriber: (key: string, value: unknown) => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
}
