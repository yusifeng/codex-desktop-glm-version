// @ts-nocheck

export function createWorkerManagerClass(dependencies: Record<string, any>) {
  const {
    createLogger,
    workerFilePath,
    resolveMaxLogLevel,
    app,
    Worker,
    MessageChannel,
    sentryInitOptions,
    spawnInsideWsl,
    shouldFlushGitWorker,
    createRpcSession,
    SentryRpcHandler,
    isWorkerMainRpcCancel,
    isWorkerMainRpcRequest,
    parseCesPayload,
    sendTelemetryRequest,
    exportOtel,
  } = dependencies;

  return class WorkerManager {
    id;
    startupConfig;
    applicationNetwork;
    worker = null;
    desktopTraceSampleRate = sentryInitOptions.desktopTraceSampleRate;
    latestAuthUser = null;
    listeners = new Set();
    exitListeners = new Set();
    mainRpcHandler = null;
    mainRpcTarget = null;
    sentryRpcSessions = new WeakMap();
    mainRpcSessions = new WeakMap();
    exitedWorkers = new WeakSet();
    disposedWorkers = new WeakSet();
    cesRequests = new WeakMap();

    constructor(id: string, startupConfig: Record<string, any>, applicationNetwork: unknown) {
      this.id = id;
      this.startupConfig = startupConfig;
      this.applicationNetwork = applicationNetwork;
    }

    dispose() { this.flushAndDispose(); }

    flushAndDispose() {
      const worker = this.worker;
      if (worker == null) return Promise.resolve();
      this.worker = null;
      this.disposedWorkers.add(worker);
      if (this.id !== `git` || !shouldFlushGitWorker()) {
        this.handleWorkerExit(worker);
        worker.terminate();
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const finish = () => {
          clearTimeout(timeout);
          resolve();
        };
        const timeout = setTimeout(() => {
          this.handleWorkerExit(worker);
          worker.terminate().then(finish, finish);
        }, 11_000);
        timeout.unref();
        worker.on(`exit`, finish);
        worker.postMessage({ type: `worker-flush-and-exit` });
      });
    }

    addListener(listener: Function) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    addExitListener(listener: Function) {
      this.exitListeners.add(listener);
      return () => this.exitListeners.delete(listener);
    }
    setMainRpcHandler(handler: Function) { this.mainRpcHandler = handler; }
    setMainRpcTarget(target: unknown) {
      if (this.worker != null) throw Error(`Main RPC target must be set before starting the worker`);
      this.mainRpcTarget = target;
    }
    postMessage(message: unknown) { this.ensureWorker().postMessage(message); }
    start() { this.ensureWorker(); }

    setSentryUser(authMethod: unknown, userId: unknown, email: unknown, accountId: unknown) {
      this.latestAuthUser = { authMethod, userId, email, accountId };
      this.worker?.postMessage({
        type: `worker-sentry-user-update`,
        authMethod,
        userId,
        email,
        accountId,
      });
    }
    emitAppEvent(event: unknown) {
      this.worker?.postMessage({ type: `worker-app-event`, event });
    }
    emitGitTurnComplete(cwds: unknown, hostId: unknown) {
      this.worker?.postMessage({ type: `worker-git-turn-complete`, cwds, hostId });
    }
    setTracingSampleRate(sampleRate: unknown) {
      this.desktopTraceSampleRate = sampleRate;
      this.worker?.postMessage({ type: `worker-tracing-sample-rate-update`, sampleRate });
    }

    ensureWorker() {
      if (this.worker) return this.worker;
      const logger = createLogger(`worker-manager`);
      const maxLogLevel = resolveMaxLogLevel();
      const rewriteFramesRoot = app.isPackaged ? app.getAppPath() : process.cwd();
      const mainRpcChannel = this.mainRpcTarget == null ? null : new MessageChannel();
      const startup = this.startupConfig.getResolved();
      const sentryChannel = new MessageChannel();
      const workerData = {
        sentryRpcPort: sentryChannel.port2,
        analyticsEnabled: startup != null && startup.analytics?.enabled !== false,
        workerId: this.id,
        sentryInitOptions: {
          ...sentryInitOptions,
          desktopTraceSampleRate: this.desktopTraceSampleRate,
        },
        maxLogLevel,
        sentryRewriteFramesRoot: rewriteFramesRoot,
        spawnInsideWsl: spawnInsideWsl(),
        mainRpcPort: mainRpcChannel?.port2 ?? null,
      };
      const worker = new Worker(workerFilePath, {
        name: this.id,
        workerData,
        transferList: [
          sentryChannel.port2,
          ...(mainRpcChannel == null ? [] : [mainRpcChannel.port2]),
        ],
      });

      this.sentryRpcSessions.set(worker, createRpcSession(sentryChannel.port1, new SentryRpcHandler()));
      if (mainRpcChannel != null && this.mainRpcTarget != null) {
        this.mainRpcSessions.set(worker, createRpcSession(mainRpcChannel.port1, this.mainRpcTarget));
      }
      this.cesRequests.set(worker, new Map());
      worker.on(`message`, (message: Record<string, any>) => {
        if (isWorkerMainRpcCancel(message)) {
          if (message.workerId === this.id) {
            this.cesRequests.get(worker)?.get(message.requestId)?.abort();
          }
          return;
        }
        if (isWorkerMainRpcRequest(message)) {
          this.handleMainRpcRequest(worker, message);
          return;
        }
        for (const listener of this.listeners) listener(message);
      });
      worker.on(`error`, (error: unknown) => {
        logger.warning(`Worker error`, { safe: {}, sensitive: { error } });
      });
      worker.on(`exit`, (code: number) => {
        if (this.worker === worker) this.worker = null;
        this.handleWorkerExit(worker);
        if (code !== 0 && !this.disposedWorkers.has(worker)) {
          logger.warning(`Worker exited`, { safe: { code }, sensitive: {} });
        }
      });
      worker.unref();
      this.worker = worker;

      if (startup == null) {
        this.startupConfig.get().then(
          (resolved: Record<string, any>) => {
            if (this.worker === worker) {
              worker.postMessage({
                type: `worker-analytics-enabled-update`,
                enabled: resolved.analytics?.enabled !== false,
              });
            }
          },
          () => undefined,
        );
      }
      if (this.latestAuthUser) {
        worker.postMessage({ type: `worker-sentry-user-update`, ...this.latestAuthUser });
      }
      return worker;
    }

    async handleMainRpcRequest(worker: Record<string, any>, request: Record<string, any>) {
      const logger = createLogger(`worker-manager`);
      if (request.workerId !== this.id) {
        logger.warning(`Received main RPC request for wrong worker`, {
          safe: {
            expectedWorkerId: this.id,
            workerId: request.workerId,
            method: request.method,
          },
        });
        return;
      }
      if (this.exitedWorkers.has(worker)) return;

      const otelBytes =
        request.method === `otel-export` && `bytes` in request.params
          ? request.params.bytes
          : null;
      let handler = this.mainRpcHandler;
      if (request.method === `ces-telemetry`) {
        handler = async () => {
          const startup = this.startupConfig.getResolved();
          if (startup == null || startup.analytics?.enabled === false) {
            return { status: 204, body: null };
          }
          const controller = new AbortController();
          const requests = this.cesRequests.get(worker);
          requests?.set(request.requestId, controller);
          try {
            return await sendTelemetryRequest(
              this.applicationNetwork,
              parseCesPayload(request.params),
              controller.signal,
              logger.mt,
            );
          } finally {
            requests?.delete(request.requestId);
          }
        };
      } else if (otelBytes != null) {
        handler = async () => {
          await exportOtel(otelBytes);
          return {};
        };
      }

      if (!handler) {
        worker.postMessage({
          type: `worker-main-rpc-response`,
          workerId: this.id,
          requestId: request.requestId,
          method: request.method,
          result: {
            type: `error`,
            error: { message: `No main RPC handler configured for worker '${this.id}'` },
          },
        });
        return;
      }

      try {
        const value = await handler(request);
        if (!this.exitedWorkers.has(worker)) {
          worker.postMessage({
            type: `worker-main-rpc-response`,
            workerId: this.id,
            requestId: request.requestId,
            method: request.method,
            result: { type: `ok`, value },
          });
        }
      } catch (error) {
        const code =
          typeof error === `object` &&
          error != null &&
          `code` in error &&
          typeof error.code === `string`
            ? error.code
            : undefined;
        if (!this.exitedWorkers.has(worker)) {
          worker.postMessage({
            type: `worker-main-rpc-response`,
            workerId: this.id,
            requestId: request.requestId,
            method: request.method,
            result: {
              type: `error`,
              error: {
                ...(code == null ? {} : { code }),
                message:
                  error instanceof Error
                    ? error.message
                    : `Failed to handle main RPC request: ${String(error)}`,
              },
            },
          });
        }
      }
    }

    handleWorkerExit(worker: Record<string, any>) {
      if (this.exitedWorkers.has(worker)) return;
      this.exitedWorkers.add(worker);
      this.cesRequests.get(worker)?.forEach((controller: AbortController) => controller.abort());
      this.cesRequests.delete(worker);
      this.sentryRpcSessions.get(worker)?.[Symbol.dispose]();
      this.sentryRpcSessions.delete(worker);
      this.mainRpcSessions.get(worker)?.[Symbol.dispose]();
      this.mainRpcSessions.delete(worker);
      for (const listener of this.exitListeners) listener();
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createWorkerManagerClass };
}
