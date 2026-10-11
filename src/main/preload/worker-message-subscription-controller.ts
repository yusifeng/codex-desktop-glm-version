type WorkerMessageSubscriptionDependencies = {
  channel: (workerName: string) => string;
  addListener: (channel: string, handler: (event: unknown, message: unknown) => void) => void;
  removeListener: (channel: string, handler: (event: unknown, message: unknown) => void) => void;
};

/** Owns lazy worker IPC listeners, subscriber fan-out, and last-subscriber cleanup. */
function createWorkerMessageSubscriptionController(dependencies: WorkerMessageSubscriptionDependencies) {
  const listeners = new Map<string, Set<(message: unknown) => void>>();
  const handlers = new Map<string, (event: unknown, message: unknown) => void>();
  const subscribe = (workerName: string, callback: (message: unknown) => void) => {
    let current = listeners.get(workerName);
    if (current == null) {
      current = new Set();
      listeners.set(workerName, current);
    }
    let handler = handlers.get(workerName);
    if (handler == null) {
      handler = (_event, message) => listeners.get(workerName)?.forEach((listener) => listener(message));
      handlers.set(workerName, handler);
      dependencies.addListener(dependencies.channel(workerName), handler);
    }
    current.add(callback);
    return () => {
      const active = listeners.get(workerName);
      if (active == null || (active.delete(callback), active.size > 0)) return;
      listeners.delete(workerName);
      const activeHandler = handlers.get(workerName);
      if (activeHandler != null) dependencies.removeListener(dependencies.channel(workerName), activeHandler);
      handlers.delete(workerName);
    };
  };
  const dispose = () => {
    for (const [workerName, handler] of handlers) dependencies.removeListener(dependencies.channel(workerName), handler);
    listeners.clear();
    handlers.clear();
  };
  return { subscribe, dispose };
}

export { createWorkerMessageSubscriptionController };
if (typeof module !== `undefined`) module.exports = { createWorkerMessageSubscriptionController };
