// @ts-nocheck

/** Publishes download state and lifecycle events to app and detached renderer views. */
export function createDownloadsViewPublisherClass(dependencies: Record<string, any>) {
  const {
    createLogger,
    createUsingScope,
    setTimer,
    clearTimer,
    detachedUpdateTimeoutMs = 30_000,
  } = dependencies;

  return class DownloadsViewPublisher {
    appViewsByWebContentsId;
    getDownloadsSnapshot;
    logger = createLogger(`WindowContext`);
    downloadsLifecycleEventBroadcastQueues = new WeakMap();
    detachedDownloadsViews = new Set();
    downloadsStateBroadcastPending = false;
    downloadsStateBroadcastRunning = false;

    constructor(appViewsByWebContentsId: any, getDownloadsSnapshot: any) {
      this.appViewsByWebContentsId = appViewsByWebContentsId;
      this.getDownloadsSnapshot = getDownloadsSnapshot;
    }

    registerDetachedView = (origin: any, view: any) => {
      const registration = { view, queue: Promise.resolve(), unsubscribe: () => {} };
      const unsubscribe = () => {
        if (this.detachedDownloadsViews.delete(registration)) {
          origin.removeListener(`destroyed`, unsubscribe);
          origin.removeListener(`render-process-gone`, unsubscribe);
          view[Symbol.dispose]();
        }
      };
      registration.unsubscribe = unsubscribe;
      this.detachedDownloadsViews.add(registration);
      origin.once(`destroyed`, unsubscribe);
      origin.once(`render-process-gone`, unsubscribe);
      view.onRpcBroken(unsubscribe);
      this.enqueueDetachedDownloadsUpdate(registration, async () => {
        await view.stateChanged(await this.getDownloadsSnapshot());
      });
      return unsubscribe;
    };

    enqueueDetachedDownloadsUpdate(registration: any, publish: () => unknown) {
      registration.queue = registration.queue
        .then(async () => {
          if (!this.detachedDownloadsViews.has(registration)) return;
          const timer = setTimer(() => registration.unsubscribe(), detachedUpdateTimeoutMs);
          try {
            await publish();
          } finally {
            clearTimer(timer);
          }
        })
        .catch((error: unknown) => {
          if (this.detachedDownloadsViews.has(registration)) {
            this.logger.warning(`Failed to publish downloads to detached renderer`, {
              safe: {},
              sensitive: { error },
            });
          }
        });
      return registration.queue;
    }

    broadcastDownloadsState() {
      this.downloadsStateBroadcastPending = true;
      if (!this.downloadsStateBroadcastRunning) {
        this.downloadsStateBroadcastRunning = true;
        this.flushDownloadsStateBroadcasts();
      }
    }

    broadcastDownloadLifecycleEvent(event: unknown) {
      for (const appView of this.appViewsByWebContentsId.values()) {
        const queue = this.downloadsLifecycleEventBroadcastQueues.get(appView) ?? Promise.resolve();
        this.downloadsLifecycleEventBroadcastQueues.set(
          appView,
          queue.then(() => this.publishDownloadLifecycleEvent(event, appView)),
        );
      }
      for (const detachedView of this.detachedDownloadsViews) {
        this.enqueueDetachedDownloadsUpdate(detachedView, () =>
          detachedView.view.lifecycleChanged(event),
        );
      }
    }

    async publishDownloadLifecycleEvent(event: unknown, appView: any) {
      try {
        try {
          var scope = createUsingScope();
          await scope.u(await appView.services).downloads.lifecycleChanged(event);
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      } catch (error) {
        this.logger.warning(`Failed to publish download lifecycle event to renderer`, {
          safe: {},
          sensitive: { error },
        });
      }
    }

    async flushDownloadsStateBroadcasts() {
      try {
        while (this.downloadsStateBroadcastPending) {
          this.downloadsStateBroadcastPending = false;
          let snapshot;
          try {
            snapshot = await this.getDownloadsSnapshot();
          } catch (error) {
            this.logger.warning(`Failed to read native download history`, {
              safe: {},
              sensitive: { error },
            });
            continue;
          }
          for (const detachedView of this.detachedDownloadsViews) {
            this.enqueueDetachedDownloadsUpdate(detachedView, () =>
              detachedView.view.stateChanged(snapshot),
            );
          }
          await Promise.all(
            Array.from(this.appViewsByWebContentsId.values(), async (appView: any) => {
              try {
                try {
                  var scope = createUsingScope();
                  await scope.u(await appView.services).downloads.stateChanged(snapshot);
                } catch (error) {
                  scope.e = error;
                } finally {
                  scope.d();
                }
              } catch (error) {
                this.logger.warning(`Failed to publish downloads state to renderer`, {
                  safe: {},
                  sensitive: { error },
                });
              }
            }),
          );
        }
      } finally {
        this.downloadsStateBroadcastRunning = false;
        if (this.downloadsStateBroadcastPending) this.broadcastDownloadsState();
      }
    }

    dispose() {
      for (const detachedView of this.detachedDownloadsViews) detachedView.unsubscribe();
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createDownloadsViewPublisherClass };
}
