export type AppServerConnectionChange<TConnection> =
  | { type: "added"; hostId: string; connection: TConnection }
  | { type: "removed"; hostId: string; connection: TConnection };

export class AppServerConnectionRegistry<TConnection> {
  private readonly connections = new Map<string, TConnection>();
  private readonly subscribers = new Set<(change: AppServerConnectionChange<TConnection>) => void>();

  addConnection(hostId: string, connection: TConnection): void {
    const previous = this.connections.get(hostId);
    if (previous === connection) return;
    if (previous != null) {
      this.connections.delete(hostId);
      this.notifySubscribers({ type: "removed", hostId, connection: previous });
    }
    this.connections.set(hostId, connection);
    this.notifySubscribers({ type: "added", hostId, connection });
  }

  removeConnection(hostId: string): void {
    const connection = this.connections.get(hostId);
    if (connection == null) return;
    this.connections.delete(hostId);
    this.notifySubscribers({ type: "removed", hostId, connection });
  }

  getMaybeConnection(hostId: string): TConnection | null {
    return this.connections.get(hostId) ?? null;
  }

  getConnection(hostId: string): TConnection {
    const connection = this.getMaybeConnection(hostId);
    if (connection == null) throw new Error(`Connection for host ID ${hostId} not found`);
    return connection;
  }

  getAllHostIds(): string[] {
    return Array.from(this.connections.keys());
  }

  subscribe(subscriber: (change: AppServerConnectionChange<TConnection>) => void): () => void {
    for (const [hostId, connection] of this.connections)
      subscriber({ type: "added", hostId, connection });
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  private notifySubscribers(change: AppServerConnectionChange<TConnection>): void {
    for (const subscriber of this.subscribers) subscriber(change);
  }
}
