// @ts-nocheck

/** Owns the application-level worker buses and ephemeral computer-use worker lifecycles. */
export function createWorkerRuntime(options: Record<string, any>) {
  const {
    disposables,
    isTrustedIpcEvent,
    startupConfig,
    applicationNetwork,
    AppEventPublisher,
    createGitInvocationSampler,
    WorkerBus,
    createShortcutLinkReader,
    readShortcutLink,
    ipcMain,
    workerChannel,
    registeredWorkerIds,
    localHostId,
    isWorkerStartResult,
    isWorkerEventType,
    isWorkerNotificationType,
  } = options;

  const appEvent = new AppEventPublisher();
  const gitWorkerInvocationSampler = createGitInvocationSampler();
  const sentryUserTargets: Function[] = [];
  const gitWorker = new WorkerBus(`git`, {
    startupConfig,
    applicationNetwork,
    hostOnlyEventTypes: new Set([
      `create-worktree-path`,
      `create-worktree-setup-started`,
      `create-worktree-stream`,
    ]),
    singleRecipientEventTypes: new Set([
      `git-performance-operation`,
      `git-performance-watcher-snapshot`,
    ]),
    onWorkerRequestSent: () => {
      gitWorkerInvocationSampler.recordInvocation();
    },
  });
  const openInWorker = new WorkerBus(`open-in`, { startupConfig, applicationNetwork });
  const shortcutLinkReader = createShortcutLinkReader(readShortcutLink);
  openInWorker.setMainRpcHandler(async (request: Record<string, any>) => {
    switch (request.method) {
      case `read-shortcut-link`:
        return shortcutLinkReader(request.params.path);
      case `ces-telemetry`:
        throw Error(`Unsupported open-in worker request`);
    }
  });

  const captureEventListeners = new Set<Function>();
  const activeComputerUseDisposers = new Map<Record<string, any>, Function>();
  const captureUpdateWorkers = new Map<string, Record<string, any>>();
  let latestSentryUser: Record<string, any> | null = null;
  let computerUseMainRpcHandler: Function | null = null;

  disposables.add(() => {
    activeComputerUseDisposers.forEach((dispose) => dispose());
  });

  const configureComputerUseWorker = (workerBus: Record<string, any>) => {
    if (computerUseMainRpcHandler != null) {
      workerBus.setMainRpcHandler(computerUseMainRpcHandler);
    }
    if (latestSentryUser != null) {
      workerBus.setSentryUser(
        latestSentryUser.authMethod,
        latestSentryUser.userId,
        latestSentryUser.email,
        latestSentryUser.accountId,
      );
    }
  };

  const requestComputerUseCaptureUpdate = (request: Record<string, any>) =>
    watchComputerUseCaptureUpdates(request.params.requestId, request.signal);

  async function requestComputerUseWorker(request: Record<string, any>) {
    const workerBus = new WorkerBus(`computer-use`, { startupConfig, applicationNetwork });
    configureComputerUseWorker(workerBus);
    const appEventSubscription = appEvent.subscribe((event: unknown) => {
      workerBus.emitAppEvent(event);
    });
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      appEventSubscription.dispose();
      activeComputerUseDisposers.delete(workerBus);
      workerBus.dispose();
    };
    activeComputerUseDisposers.set(workerBus, dispose);
    try {
      const requestId =
        request.method === `start` &&
        `requestId` in request.params &&
        typeof request.params.requestId === `string`
          ? request.params.requestId
          : null;
      workerBus.startWorker();
      const result = await workerBus.requestFromHost(request);
      if (requestId != null && isWorkerStartResult(result)) {
        requestComputerUseCaptureUpdate({
          params: { requestId },
          signal: request.signal,
        }).catch(() => undefined);
      }
      return result;
    } finally {
      dispose();
    }
  }

  const registerWorkerBus = (workerBus: Record<string, any>) => {
    disposables.add(workerBus);
    sentryUserTargets.push((authMethod, userId, email, accountId) => {
      workerBus.setSentryUser(authMethod, userId, email, accountId);
    });
    disposables.add(
      appEvent.subscribe((event: unknown) => {
        workerBus.emitAppEvent(event);
      }),
    );
  };

  const registerWorkerBusMessageHandler = (workerId: string, workerBus: Record<string, any>) => {
    registerWorkerBus(workerBus);
    ipcMain.handle(workerChannel(workerId), async (event: unknown, message: unknown) => {
      if (isTrustedIpcEvent(event)) await workerBus.handleMessage(event.sender, message);
    });
  };

  async function watchComputerUseCaptureUpdates(requestId: string, signal: AbortSignal | undefined) {
    if (captureUpdateWorkers.has(requestId)) return;
    const workerBus = new WorkerBus(`computer-use`, { startupConfig, applicationNetwork });
    configureComputerUseWorker(workerBus);
    captureUpdateWorkers.set(requestId, workerBus);
    const appEventSubscription = appEvent.subscribe((event: unknown) => {
      workerBus.emitAppEvent(event);
    });
    const eventSubscription = workerBus.subscribeFromHost((message: Record<string, any>) => {
      if (message.type !== `worker-event`) return;
      captureEventListeners.forEach((listener) => listener(message.event));
      if (
        message.event.type === `update` &&
        message.event.requestId === requestId &&
        ((message.event.update.type === `screenshot` &&
          message.event.update.transitionSnapshotDataURL != null &&
          message.event.update.transitionSnapshotDataURL.length > 0) ||
          message.event.update.type === `completed` ||
          message.event.update.type === `failed`)
      ) {
        dispose();
      }
    });
    const exitSubscription = workerBus.subscribeWorkerExit(() => {
      if (!disposed) {
        publishFailure(`update_worker_exited`);
        dispose();
      }
    });
    const onAbort = () => dispose();
    signal?.addEventListener(`abort`, onAbort, { once: true });
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      eventSubscription();
      exitSubscription();
      signal?.removeEventListener(`abort`, onAbort);
      appEventSubscription.dispose();
      captureUpdateWorkers.delete(requestId);
      workerBus.dispose();
    };
    const publishFailure = (failureReason: string) => {
      captureEventListeners.forEach((listener) => {
        listener({
          type: `update`,
          requestId,
          update: { type: `failed`, failureReason },
        });
      });
    };

    workerBus.startWorker();
    try {
      return await workerBus.requestFromHost({
        method: `watchUpdates`,
        params: { requestId },
        signal,
      });
    } catch (error) {
      if (!disposed) {
        publishFailure(`update_watch_failed`);
        dispose();
      }
      throw error;
    }
  }

  return {
    appEvent,
    gitWorkerInvocationSampler,
    flushAndDisposeGitWorker: () => gitWorker.flushAndDisposeWorker(),
    setGitWorkerTracingSampleRate: (sampleRate: number) => {
      gitWorker.setTracingSampleRate(sampleRate);
    },
    completeLocalGitTurn: (cwds: string[]) => {
      gitWorker.emitGitTurnComplete(cwds, localHostId);
    },
    requestComputerUseWorker,
    requestComputerUseCaptureUpdate,
    requestGitWorker: (request: Record<string, any>) => gitWorker.requestFromHost(request),
    requestOpenInWorker: (request: Record<string, any>) => openInWorker.requestFromHost(request),
    subscribeComputerUseCaptureWorkerEvent: (eventType: string, listener: Function) => {
      const filteredListener = (event: Record<string, any>) => {
        if (isWorkerEventType(event, eventType)) listener(event);
      };
      captureEventListeners.add(filteredListener);
      return () => captureEventListeners.delete(filteredListener);
    },
    subscribeGitWorkerEvent: (eventType: string, listener: Function) =>
      gitWorker.subscribeFromHost((message: Record<string, any>) => {
        if (
          message.type === `worker-event` &&
          isWorkerNotificationType(message.event, eventType)
        ) {
          listener(message.event);
        }
      }),
    updateWorkerSentryUser(authMethod, userId, email, accountId) {
      latestSentryUser = { authMethod, userId, email, accountId };
      sentryUserTargets.forEach((setUser) => setUser(authMethod, userId, email, accountId));
      activeComputerUseDisposers.forEach((_dispose, workerBus) => {
        workerBus.setSentryUser(authMethod, userId, email, accountId);
      });
      captureUpdateWorkers.forEach((workerBus) => {
        workerBus.setSentryUser(authMethod, userId, email, accountId);
      });
    },
    registerWorkerBusMessageHandlers() {
      registerWorkerBus(openInWorker);
      for (const workerId of registeredWorkerIds) {
        if (workerId === `git`) {
          registerWorkerBusMessageHandler(workerId, gitWorker);
        } else {
          registerWorkerBusMessageHandler(
            workerId,
            new WorkerBus(workerId, { startupConfig, applicationNetwork }),
          );
        }
      }
    },
    setGitWorkerMainRpcTarget: (target: unknown) => {
      gitWorker.setMainRpcTarget(target);
    },
    setComputerUseWorkerMainRpcHandler(handler: Function) {
      computerUseMainRpcHandler = handler;
      activeComputerUseDisposers.forEach((_dispose, workerBus) => {
        workerBus.setMainRpcHandler(handler);
      });
      captureUpdateWorkers.forEach((workerBus) => {
        workerBus.setMainRpcHandler(handler);
      });
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = { createWorkerRuntime };
}
