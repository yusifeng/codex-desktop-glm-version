type GitPerformanceOperationDependencies = {
  attribution: any;
  canceled: boolean;
  durationMs: number;
  firstResultMs?: number | null;
  host: any;
  operation: any;
  queueDurationMs: number | null;
  repoIndexSizeBucket: any;
  result: any;
  resultDisposition?: any;
  reviewSource: any;
  retryAttempt?: number | null;
  source: any;
  trigger: any;
  endAttribution: (attribution: any) => void;
  getResultFields: (result: any) => any;
  createPerformanceFields: (input: any) => any;
  recordOutcome: (outcome: string) => void;
  recordAttributes: (attributes: Record<string, any>) => void;
  selectSample: (outcome: string, attribution: any, durationMs: number, random: () => number) => any;
  getTelemetryContext: () => any;
  emit: (event: any) => void;
  random: () => number;
};

/** Finalizes Git operation performance telemetry and sampled worker-event emission. */
function emitGitPerformanceOperation(dependencies: GitPerformanceOperationDependencies): void {
  const { attribution, canceled, durationMs, firstResultMs = null, host, operation, queueDurationMs, repoIndexSizeBucket,
    result, resultDisposition = result == null ? null : `completed`, reviewSource, retryAttempt = null, source, trigger,
    endAttribution, getResultFields, createPerformanceFields, recordOutcome, recordAttributes, selectSample, getTelemetryContext, emit, random } = dependencies;
  if (attribution == null || operation == null) return;
  endAttribution(attribution);
  const performance = createPerformanceFields({ attribution, canceled, durationMs, firstResultMs, hostKind: host.isLocal ? `local` : `remote`, operation, queueDurationMs, repoIndexSizeBucket, result, resultDisposition, resultFields: result?.operation === `review-diff` ? getResultFields(result) : undefined, reviewSource, retryAttempt, source, trigger });
  const outcome = performance.outcome;
  const reasonKey = outcome === `expected` ? `git.reason` : `git.failure_reason`;
  recordAttributes({ "git.command_count": performance.commandCount, "git.failed_command_count": performance.failedCommandCount, ...(performance.failedCommandDurationMs == null ? {} : { "git.failed_command.duration_ms": performance.failedCommandDurationMs }), ...(performance.failedCommandErrorKind == null ? {} : { "git.failed_command.error_kind": performance.failedCommandErrorKind }), ...(performance.failedCommandExitCodeBucket == null ? {} : { "git.failed_command.exit_code_bucket": performance.failedCommandExitCodeBucket }), ...(performance.failedCommandFailureKind == null ? {} : { "git.failed_command.failure_kind": performance.failedCommandFailureKind }), ...(performance.failedCommandSubcommand == null ? {} : { "git.failed_command.subcommand": performance.failedCommandSubcommand }), ...(performance.reason == null ? {} : { [reasonKey]: performance.reason }), ...(performance.resultDisposition == null ? {} : { "git.result_disposition": performance.resultDisposition }), ...(performance.resultFailureReason == null ? {} : { "git.result_failure_reason": performance.resultFailureReason }), ...(retryAttempt == null ? {} : { "git.retry_attempt": retryAttempt }) });
  if (outcome !== `success`) recordOutcome(outcome);
  const sample = selectSample(outcome, attribution, durationMs, random);
  if (sample == null) return;
  emit({ type: `worker-event`, event: { type: `git-performance-operation`, ...performance, ...sample, ...getTelemetryContext() } });
}

export { emitGitPerformanceOperation };
if (typeof module !== `undefined`) module.exports = { emitGitPerformanceOperation };
