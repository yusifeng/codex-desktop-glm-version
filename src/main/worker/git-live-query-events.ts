/** Builds the stable event envelope emitted after a live-query generation completes. */
function createGitLiveQueryUpdatedEvent(
  state: { subscriptionId: unknown; requiresRecovery: boolean },
  generation: number,
  result: Record<string, unknown>,
  emittedAtMs: number,
  trace?: unknown,
) {
  return {
    type: `git-live-query-updated`,
    emittedAtMs,
    generation,
    requiresRecovery: state.requiresRecovery,
    subscriptionId: state.subscriptionId,
    ...(trace == null ? {} : { trace }),
    ...result,
  };
}

export { createGitLiveQueryUpdatedEvent };
if (typeof module !== `undefined`)
  module.exports = { createGitLiveQueryUpdatedEvent };
