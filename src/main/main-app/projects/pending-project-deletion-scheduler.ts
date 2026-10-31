// @ts-nocheck

/** Owns pending project-deletion timers, identity switching, and retry scheduling. */
export function createPendingProjectDeletionSchedulerClass(
  dependencies: Record<string, any>,
) {
  const { stateKey, createLogger, retryDelayMs, now, setTimer, clearTimer } =
    dependencies;

  return class PendingProjectDeletionScheduler {
    logger = createLogger("pending-app-server-project-deletions");
    timers = new Map();
    activeIdentity = null;

    constructor(globalState: any, finish: any) {
      this.globalState = globalState;
      this.finish = finish;
    }

    getAll(identity: string) {
      return this.globalState.get(stateKey)?.[identity] ?? {};
    }

    get(identity: string, projectId: string) {
      return this.getAll(identity)[projectId];
    }

    set(identity: string, projectId: string, pendingDeletion: any) {
      this.globalState.update(stateKey, (current: any) => {
        const pendingByProject = { ...current?.[identity] };
        if (pendingDeletion == null) delete pendingByProject[projectId];
        else pendingByProject[projectId] = pendingDeletion;
        const next = { ...current, [identity]: pendingByProject };
        if (Object.keys(pendingByProject).length === 0) delete next[identity];
        return Object.keys(next).length === 0 ? undefined : next;
      });
    }

    resume(identity: string) {
      this.stop();
      this.activeIdentity = identity;
      for (const projectId of Object.keys(this.getAll(identity)))
        this.schedule(identity, projectId);
    }

    stop() {
      this.activeIdentity = null;
      for (const timer of this.timers.values()) clearTimer(timer);
      this.timers.clear();
    }

    schedule(identity: string, projectId: string, isRetry = false) {
      if (this.activeIdentity !== identity) return;
      clearTimer(this.timers.get(projectId));
      this.timers.delete(projectId);
      const pendingDeletion = this.get(identity, projectId);
      if (pendingDeletion == null) return;
      const timer = setTimer(
        () => {
          this.timers.delete(projectId);
          this.finish(identity, projectId, pendingDeletion).catch(
            (error: unknown) => {
              if (this.activeIdentity !== identity) return;
              this.logger.warning(
                "Failed to finish app-server project deletion",
                {
                  safe: {},
                  sensitive: { error },
                },
              );
              this.schedule(identity, projectId, true);
            },
          );
        },
        Math.max(
          isRetry ? retryDelayMs : 0,
          pendingDeletion.deleteAfterMs - now(),
        ),
      );
      timer.unref();
      this.timers.set(projectId, timer);
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createPendingProjectDeletionSchedulerClass };
