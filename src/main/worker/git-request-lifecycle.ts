/**
 * Tracks cancellable and uncancellable worker requests across the request
 * boundary.  A cancel message may arrive before the request itself starts, so
 * the pending-cancel set is intentionally kept separate from in-flight work.
 */
function createGitRequestLifecycle() {
  const inFlight = new Map<string, AbortController>();
  const canceledBeforeStart = new Set<string>();
  const uncancelable = new Set<string>();

  return {
    begin(id: string, tracked: boolean, controller: AbortController): "started" | "canceled" {
      if (!tracked) {
        uncancelable.add(id);
        canceledBeforeStart.delete(id);
        return "started";
      }
      inFlight.set(id, controller);
      if (!canceledBeforeStart.has(id)) return "started";
      canceledBeforeStart.delete(id);
      inFlight.delete(id);
      controller.abort();
      return "canceled";
    },

    finish(id: string, tracked: boolean): void {
      if (tracked) inFlight.delete(id);
      else uncancelable.delete(id);
      canceledBeforeStart.delete(id);
    },

    cancel(id: string): "ignored" | "queued" | "aborted" {
      if (uncancelable.has(id)) return "ignored";
      const controller = inFlight.get(id);
      if (controller == null) {
        canceledBeforeStart.add(id);
        return "queued";
      }
      inFlight.delete(id);
      controller.abort();
      return "aborted";
    },

    /** Test/diagnostic visibility without exposing mutable collections. */
    snapshot(): { inFlight: number; canceledBeforeStart: number; uncancelable: number } {
      return {
        inFlight: inFlight.size,
        canceledBeforeStart: canceledBeforeStart.size,
        uncancelable: uncancelable.size,
      };
    },
  };
}

export { createGitRequestLifecycle };
if (typeof module !== `undefined`) module.exports = { createGitRequestLifecycle };
export {};
