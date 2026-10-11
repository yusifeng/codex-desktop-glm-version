type RequestLifecycleEvent = { type: "outcome-unknown" | "failed"; hostId: string; error?: unknown };

/** Owns request dispatch, timeout-abandon, failure notification, and cleanup ordering. */
async function runAppServerRequestLifecycle({
  request,
  options,
  isPrewarm,
  skipCurrentAssert,
  hostId,
  timeoutMs,
  assertCurrent,
  handleRequest,
  handlePrewarm,
  requestError,
  onOutcomeUnknown,
  emitLifecycle,
}: {
  request: { id: string; method: string };
  options?: { priority?: unknown; source?: unknown; timeoutMs?: number; widget?: unknown; onOutcomeUnknown?: (error: unknown) => void; savedEnvironmentConfig?: unknown };
  isPrewarm: boolean;
  skipCurrentAssert: boolean;
  hostId: string;
  timeoutMs?: number;
  assertCurrent: () => void;
  handleRequest: (request: unknown, options: unknown, onOutcomeUnknown?: (error: unknown) => void) => { promise: Promise<{ error?: unknown; result?: unknown }>; abandon(): void };
  handlePrewarm: (request: unknown, options: unknown, onOutcomeUnknown?: (error: unknown) => void) => { promise: Promise<{ error?: unknown; result?: unknown }>; abandon(): void };
  requestError: (id: string, error: unknown) => unknown;
  onOutcomeUnknown?: (error: unknown) => void;
  emitLifecycle: (event: RequestLifecycleEvent) => void;
}) {
  assertCurrent();
  const sendOptions = options == null && timeoutMs == null ? undefined : { priority: options?.priority, source: options?.source, timeoutMs, widget: options?.widget };
  const outcomeUnknown = skipCurrentAssert ? (error: unknown) => {
    onOutcomeUnknown?.(error);
    emitLifecycle({ type: "outcome-unknown", hostId, error });
  } : undefined;
  const pending = isPrewarm && request.method === "thread/start"
    ? handlePrewarm(request, sendOptions, outcomeUnknown)
    : handleRequest(request, sendOptions, outcomeUnknown);
  const abandonTimer = timeoutMs == null || timeoutMs <= 0 ? null : setTimeout(() => pending.abandon(), timeoutMs);
  try {
    const response = await pending.promise;
    if (response.error != null) throw requestError(request.id, response.error);
    return (skipCurrentAssert || assertCurrent(), response.result);
  } catch (error) {
    emitLifecycle({ type: "failed", hostId, error });
    throw error;
  } finally {
    if (abandonTimer != null) clearTimeout(abandonTimer);
  }
}

export { runAppServerRequestLifecycle };
if (typeof module !== "undefined") module.exports = { runAppServerRequestLifecycle };
