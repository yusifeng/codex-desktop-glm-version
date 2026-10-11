type GitRequestCompletionDependencies = {
  request: any;
  tracked: boolean;
  signal: AbortSignal;
  operation: any;
  startedAt: number;
  host: any;
  enqueuedAtMs?: number;
  repoIndexSizeBucket: any;
  result: any;
  responseResult: any;
  resultDisposition: any;
  attribution: any;
  isRequestFailure: (result: any) => boolean;
  recordOutcome: (outcome: string) => void;
  createCancellationTelemetry: (input: any) => any;
  emitPerformance: (input: any) => void;
  resolveReviewSource: (request: any) => any;
  getTrace: () => any;
  createResponse: (input: any) => any;
  emit: (event: any) => void;
  now: () => number;
};

/** Completes a Git request with cancellation telemetry, performance emission, and response envelope. */
function completeGitRequest(dependencies: GitRequestCompletionDependencies): boolean {
  const { request, tracked, signal, operation, startedAt, host, enqueuedAtMs, repoIndexSizeBucket, result, responseResult,
    resultDisposition, attribution, isRequestFailure, recordOutcome, createCancellationTelemetry, emitPerformance,
    resolveReviewSource, getTrace, createResponse, emit, now } = dependencies;
  if (tracked && signal.aborted) {
    emitPerformance(createCancellationTelemetry({ attribution, durationMs: now() - startedAt, host, operation, enqueuedAtMs, repoIndexSizeBucket, result, reviewSource: resolveReviewSource(request), source: request.params.operationSource, startedAtMs: startedAt }));
    if (operation == null) recordOutcome(`canceled`);
    return true;
  }
  if (operation == null && isRequestFailure(responseResult)) recordOutcome(`failure`);
  const response = createResponse({ id: request.id, method: request.method, result: responseResult, trace: getTrace() });
  emitPerformance({ attribution, canceled: false, durationMs: now() - startedAt, host, operation, queueDurationMs: enqueuedAtMs == null ? null : Math.max(0, startedAt - enqueuedAtMs), repoIndexSizeBucket, result, resultDisposition: resultDisposition ?? void 0, reviewSource: resolveReviewSource(request), source: request.params.operationSource, trigger: `request` });
  emit({ type: `worker-response`, response });
  return false;
}

export { completeGitRequest };
if (typeof module !== `undefined`) module.exports = { completeGitRequest };
