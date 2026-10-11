import { getGitWatchSessionClosePolicy } from "./git-watch-session-policy";

function createGitWatchSessionCloseController(input: {
  stableThresholdMs: number;
  isDisposed: () => boolean;
  getCurrentSession: (target: any) => unknown;
  clearSession: (target: any) => void;
  resetRetryDelay: (target: any) => void;
  onWatchError: (target: any, close: any) => void;
  updateRecovery: () => void;
  scheduleRetry: (target: any) => void;
}) {
  function handleClose(target: any, session: unknown, startedAtMs: number, close: any): void {
    const policy = getGitWatchSessionClosePolicy({
      disposed: input.isDisposed(),
      sessionMatches: input.getCurrentSession(target) === session,
      elapsedMs: Date.now() - startedAtMs,
      stableThresholdMs: input.stableThresholdMs,
    });
    if (!policy.active) return;
    if (close.reason === `watch-error`) input.onWatchError(target, close);
    input.clearSession(target);
    if (policy.resetRetryDelay) input.resetRetryDelay(target);
    input.updateRecovery();
    input.scheduleRetry(target);
  }
  return { handleClose };
}

export { createGitWatchSessionCloseController };
if (typeof module !== `undefined`) module.exports = { createGitWatchSessionCloseController };
