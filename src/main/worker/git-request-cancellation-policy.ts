/** Pure telemetry protocol policy for canceled Git requests. */
function createGitRequestCancellationTelemetry(input: { attribution?: unknown; durationMs: number; host: unknown; operation?: string | null; enqueuedAtMs?: number; startedAtMs: number; repoIndexSizeBucket?: string | null; result?: unknown; reviewSource?: string | null; source?: string | null }) {
  return {
    attribution: input.attribution,
    canceled: true,
    durationMs: input.durationMs,
    host: input.host,
    operation: input.operation,
    queueDurationMs: input.enqueuedAtMs == null ? null : Math.max(0, input.startedAtMs - input.enqueuedAtMs),
    repoIndexSizeBucket: input.repoIndexSizeBucket,
    result: input.result,
    resultDisposition: `canceled`,
    reviewSource: input.reviewSource,
    source: input.source,
    trigger: `request`,
  };
}
export { createGitRequestCancellationTelemetry };
if (typeof module !== `undefined`) module.exports = { createGitRequestCancellationTelemetry };
