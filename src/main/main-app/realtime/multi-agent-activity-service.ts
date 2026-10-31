// @ts-nocheck

/** Buffers and publishes per-realtime-thread multi-agent activity snapshots. */
export function createMultiAgentActivityServiceClass(
  dependencies: Record<string, any>,
) {
  const {
    RpcHandlerBase,
    createUsingScope,
    maxActivities = 100,
  } = dependencies;

  const threadKey = (locator: any) =>
    JSON.stringify([locator.hostId, locator.conversationId]);

  class MultiAgentActivitySubscription extends RpcHandlerBase {
    cleanup;

    constructor(cleanup: () => void) {
      super();
      this.cleanup = cleanup;
    }

    unsubscribe() {
      this.cleanup?.();
      this.cleanup = null;
    }

    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  return class MultiAgentActivityService extends RpcHandlerBase {
    activitiesByThread = new Map();
    sessionsByThread = new Map();
    subscribers = new Set();
    unsubscribeEvents;

    constructor(events: any) {
      super();
      this.unsubscribeEvents = events.subscribe((event: any) => {
        switch (event.type) {
          case "multi-agent-activity":
            this.publish(event.activity);
            break;
          case "session-started":
            this.sessionStarted(event.thread, event.sessionId);
            break;
          case "session-ended":
          case "session-failed":
            this.sessionEnded(event.thread, event.sessionId);
            break;
          case "host-disconnected":
            this.hostDisconnected(event.hostId);
        }
      });
    }

    publish(activity: any) {
      const key = threadKey(activity.realtimeThread);
      const previous = this.activitiesByThread.get(key) ?? [];
      if (previous.some((item: any) => item.id === activity.id)) return;
      const activities = [activity, ...previous].slice(0, maxActivities);
      this.activitiesByThread.set(key, activities);
      this.publishToThread(activity.realtimeThread, { activities });
    }

    subscribe(locator: any, callback: any) {
      const key = threadKey(locator);
      const subscriber = {
        hostId: locator.hostId,
        listener: callback.dup(),
        threadKey: key,
      };
      this.subscribers.add(subscriber);
      subscriber.listener.onRpcBroken(() => this.removeSubscriber(subscriber));
      this.notify(subscriber, {
        activities: this.activitiesByThread.get(key) ?? [],
      });
      return new MultiAgentActivitySubscription(() =>
        this.removeSubscriber(subscriber),
      );
    }

    dispose = () => {
      this.unsubscribeEvents();
      for (const subscriber of this.subscribers)
        subscriber.listener[Symbol.dispose]();
      this.subscribers.clear();
      this.activitiesByThread.clear();
      this.sessionsByThread.clear();
    };

    publishToThread(locator: any, snapshot: any) {
      const key = threadKey(locator);
      for (const subscriber of this.subscribers)
        if (subscriber.threadKey === key) this.notify(subscriber, snapshot);
    }

    clearThread(locator: any) {
      const key = threadKey(locator);
      this.activitiesByThread.delete(key);
      for (const subscriber of this.subscribers)
        if (subscriber.threadKey === key)
          this.notify(subscriber, { activities: [] });
    }

    sessionStarted(locator: any, sessionId: string) {
      const key = threadKey(locator);
      if (this.sessionsByThread.get(key)?.sessionId === sessionId) return;
      this.sessionsByThread.set(key, { hostId: locator.hostId, sessionId });
      this.clearThread(locator);
    }

    sessionEnded(locator: any, sessionId: string | null) {
      const key = threadKey(locator);
      const active = this.sessionsByThread.get(key);
      if (active != null && sessionId != null && active.sessionId !== sessionId)
        return;
      this.sessionsByThread.delete(key);
      this.clearThread(locator);
    }

    hostDisconnected(hostId: string) {
      for (const [key, activities] of this.activitiesByThread)
        if (activities[0]?.realtimeThread.hostId === hostId)
          this.activitiesByThread.delete(key);
      for (const [key, session] of this.sessionsByThread)
        if (session.hostId === hostId) this.sessionsByThread.delete(key);
      for (const subscriber of this.subscribers)
        if (subscriber.hostId === hostId)
          this.notify(subscriber, { activities: [] });
    }

    notify(subscriber: any, snapshot: any) {
      try {
        const scope = createUsingScope();
        try {
          scope.u(subscriber.listener(snapshot));
        } catch (error) {
          scope.e = error;
        } finally {
          scope.d();
        }
      } catch {
        // RPC callback failures are isolated from the event source.
      }
    }

    removeSubscriber(subscriber: any) {
      if (this.subscribers.delete(subscriber))
        subscriber.listener[Symbol.dispose]();
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createMultiAgentActivityServiceClass };
