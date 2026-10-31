// @ts-nocheck

export function createWorkerBusClass(dependencies: Record<string, any>) {
  const {
    WorkerManager,
    createLogger,
    createRequestId,
    channelForWorker,
    now = Date.now,
  } = dependencies;

  return class WorkerBus {
    workerId;
    options;
    logger = createLogger(`worker-bus-message-handler`);
    pending = new Map();
    pendingRequestFromHost = new Map();
    hostListeners = new Set();
    knownWebContents = new Set();
    performanceRecipient = null;
    workerManager;

    constructor(workerId: string, options: Record<string, any>) {
      this.workerId = workerId;
      this.options = options;
      this.workerManager = new WorkerManager(
        this.workerId,
        options.startupConfig,
        options.applicationNetwork,
      );
      this.workerManager.addListener((message: Record<string, any>) => {
        this.handleWorkerMessage(message);
      });
      this.workerManager.addExitListener(() => {
        const error = Error(`Worker exited for '${this.workerId}'`);
        for (const request of this.pendingRequestFromHost.values()) request.reject(error);
        this.pendingRequestFromHost.clear();
      });
    }

    async handleMessage(origin: Record<string, any>, message: Record<string, any>) {
      this.trackLifecycle(origin);
      if (message.workerId !== this.workerId) {
        this.logger.warning(`Received worker message for wrong worker`, {
          safe: {
            expectedWorkerId: this.workerId,
            workerId: message.workerId,
            type: message.type,
          },
        });
        return;
      }
      switch (message.type) {
        case `worker-request`:
          this.performanceRecipient = origin;
          this.pending.set(message.request.id, origin);
          this.options.onWorkerRequestSent?.();
          this.workerManager.postMessage(message);
          return;
        case `worker-request-cancel`:
          this.pending.delete(message.id);
      }
      this.workerManager.postMessage(message);
    }

    dispose() {
      const error = Error(`Worker bus disposed for '${this.workerId}'`);
      for (const request of this.pendingRequestFromHost.values()) request.reject(error);
      this.pendingRequestFromHost.clear();
      this.workerManager.dispose();
    }

    flushAndDisposeWorker() {
      return this.workerManager.flushAndDispose();
    }

    requestFromHost(request: Record<string, any>) {
      if (request.signal?.aborted) {
        return Promise.reject(new DOMException(`Aborted`, `AbortError`));
      }
      const id = createRequestId();
      const workerRequest = {
        enqueuedAtMs: now(),
        id,
        method: request.method,
        params: request.params,
      };
      const message = { type: `worker-request`, workerId: this.workerId, request: workerRequest };
      const result = new Promise((resolve, reject) => {
        this.pendingRequestFromHost.set(id, {
          method: request.method,
          resolve,
          reject,
        });
      });
      try {
        this.options.onWorkerRequestSent?.();
        this.workerManager.postMessage(message);
      } catch (error) {
        this.pendingRequestFromHost.delete(id);
        return Promise.reject(
          error instanceof Error ? error : Error(`Failed to post worker request: ${String(error)}`),
        );
      }

      const signal = request.signal;
      if (signal) {
        const onAbort = () => {
          signal.removeEventListener(`abort`, onAbort);
          const pending = this.pendingRequestFromHost.get(id);
          if (pending == null) return;
          this.pendingRequestFromHost.delete(id);
          this.workerManager.postMessage({
            type: `worker-request-cancel`,
            workerId: this.workerId,
            id,
          });
          pending.reject(new DOMException(`Aborted`, `AbortError`));
        };
        signal.addEventListener(`abort`, onAbort);
        const removeAbortListener = () => signal.removeEventListener(`abort`, onAbort);
        result.then(removeAbortListener, removeAbortListener);
      }
      return result;
    }

    subscribeFromHost(listener: Function) {
      this.hostListeners.add(listener);
      return () => this.hostListeners.delete(listener);
    }

    subscribeWorkerExit(listener: Function) {
      return this.workerManager.addExitListener(listener);
    }

    setSentryUser(...args: unknown[]) { this.workerManager.setSentryUser(...args); }
    emitAppEvent(event: unknown) { this.workerManager.emitAppEvent(event); }
    emitGitTurnComplete(cwds: unknown, hostId: unknown) {
      this.workerManager.emitGitTurnComplete(cwds, hostId);
    }
    setTracingSampleRate(rate: unknown) { this.workerManager.setTracingSampleRate(rate); }
    setMainRpcHandler(handler: unknown) { this.workerManager.setMainRpcHandler(handler); }
    setMainRpcTarget(target: unknown) { this.workerManager.setMainRpcTarget(target); }
    startWorker() { this.workerManager.start(); }

    trackLifecycle(webContents: Record<string, any>) {
      if (this.knownWebContents.has(webContents)) return;
      this.knownWebContents.add(webContents);
      webContents.once(`destroyed`, () => {
        this.knownWebContents.delete(webContents);
        if (this.performanceRecipient === webContents) this.performanceRecipient = null;
        this.cleanupOrigin(webContents);
      });
    }

    cleanupOrigin(webContents: Record<string, any>) {
      for (const [id, origin] of this.pending.entries()) {
        if (origin !== webContents) continue;
        this.pending.delete(id);
        this.workerManager.postMessage({
          type: `worker-request-cancel`,
          workerId: this.workerId,
          id,
        });
      }
    }

    handleWorkerMessage(message: Record<string, any>) {
      if (message.workerId !== this.workerId) {
        this.logger.warning(`Received worker message for wrong worker`, {
          safe: {
            expectedWorkerId: this.workerId,
            workerId: message.workerId,
            type: message.type,
          },
        });
        return;
      }
      if (message.type === `worker-response`) {
        const hostRequest = this.pendingRequestFromHost.get(message.response.id);
        if (hostRequest) {
          this.pendingRequestFromHost.delete(message.response.id);
          if (hostRequest.method !== message.response.method) {
            hostRequest.reject(Error(`Mismatched worker response method`));
            return;
          }
          if (message.response.result.type === `ok`) {
            hostRequest.resolve(message.response.result.value);
            return;
          }
          hostRequest.reject(Error(message.response.result.error.message));
          return;
        }
        const origin = this.pending.get(message.response.id);
        if (!origin) return;
        this.pending.delete(message.response.id);
        this.send(origin, message);
        return;
      }

      for (const listener of this.hostListeners) listener(message);
      if (this.options.singleRecipientEventTypes?.has(message.event.type)) {
        const recipient = this.performanceRecipient ?? this.knownWebContents.values().next().value;
        if (recipient != null) this.send(recipient, message);
        return;
      }
      if (!this.options.hostOnlyEventTypes?.has(message.event.type)) this.broadcast(message);
    }

    send(webContents: Record<string, any>, message: Record<string, any>) {
      if (!webContents.isDestroyed()) webContents.send(channelForWorker(this.workerId), message);
    }

    broadcast(message: Record<string, any>) {
      for (const webContents of this.knownWebContents) this.send(webContents, message);
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createWorkerBusClass };
}
