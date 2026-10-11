import { nextGitWatcherRetryDelay, shouldScheduleGitWatchSessionRetry } from "./git-watch-session-policy";

type RetryTarget = { retryTimer: ReturnType<typeof setTimeout> | null; retryDelayMs: number; session: unknown };

function createGitWatchRetryController(input: { maxDelayMs: number; isDisposed: () => boolean; isRegistered: (target: RetryTarget) => boolean; retry: (target: RetryTarget) => Promise<unknown> | unknown; setTimeout?: typeof setTimeout; clearTimeout?: typeof clearTimeout }) {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function schedule(target: RetryTarget): void {
    if (!shouldScheduleGitWatchSessionRetry({ disposed: input.isDisposed(), targetRegistered: input.isRegistered(target), hasRetryTimer: target.retryTimer != null })) return;
    const delay = target.retryDelayMs;
    target.retryDelayMs = nextGitWatcherRetryDelay(target.retryDelayMs, input.maxDelayMs);
    const timer = (input.setTimeout ?? setTimeout)(() => {
      timers.delete(timer);
      target.retryTimer = null;
      if (!input.isDisposed() && target.session == null) void input.retry(target);
    }, delay);
    timers.add(timer);
    target.retryTimer = timer;
  }
  function cancel(target: RetryTarget): void {
    if (target.retryTimer == null) return;
    (input.clearTimeout ?? clearTimeout)(target.retryTimer);
    timers.delete(target.retryTimer);
    target.retryTimer = null;
  }
  return { schedule, cancel, dispose() { for (const timer of timers) (input.clearTimeout ?? clearTimeout)(timer); timers.clear(); } };
}

export { createGitWatchRetryController };
if (typeof module !== `undefined`) module.exports = { createGitWatchRetryController };
