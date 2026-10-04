/** Pure lifecycle decisions for asynchronous Git watcher sessions. */

/** Computes the next exponential retry delay without exceeding the cap. */
function nextGitWatcherRetryDelay(currentDelayMs: number, maxDelayMs: number): number {
  return Math.min(currentDelayMs * 2, maxDelayMs);
}

/** Allows one retry timer while the target remains registered and active. */
function shouldScheduleGitWatchSessionRetry(input: {
  disposed: boolean;
  targetRegistered: boolean;
  hasRetryTimer: boolean;
}): boolean {
  return !input.disposed && input.targetRegistered && !input.hasRetryTimer;
}

/** Describes the state transition permitted when a watcher session closes. */
function getGitWatchSessionClosePolicy(input: {
  disposed: boolean;
  sessionMatches: boolean;
  elapsedMs: number;
  stableThresholdMs: number;
}): { active: boolean; resetRetryDelay: boolean } {
  return {
    active: !input.disposed && input.sessionMatches,
    resetRetryDelay: input.elapsedMs >= input.stableThresholdMs,
  };
}

/** Decides whether a recovering target needs a follow-up session start. */
function shouldRetryGitWatchTargetAfterStart(input: {
  recovering: boolean;
  disposed: boolean;
  generationUnchanged: boolean;
  hasSession: boolean;
  metadataMissing: boolean;
}): boolean {
  return input.recovering && !input.disposed && input.generationUnchanged && !input.hasSession && !input.metadataMissing;
}

export {
  getGitWatchSessionClosePolicy,
  nextGitWatcherRetryDelay,
  shouldRetryGitWatchTargetAfterStart,
  shouldScheduleGitWatchSessionRetry,
};
if (typeof module !== `undefined`) module.exports = {
  getGitWatchSessionClosePolicy,
  nextGitWatcherRetryDelay,
  shouldRetryGitWatchTargetAfterStart,
  shouldScheduleGitWatchSessionRetry,
};
