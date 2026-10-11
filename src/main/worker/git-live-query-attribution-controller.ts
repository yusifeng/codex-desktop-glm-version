type GitLiveQueryAttributionDependencies = {
  request: any;
  root: string;
  host: any;
  signal: AbortSignal;
  runLiveQuery: (request: any, root: string, host: any, signal: AbortSignal, onFirstResult: (result: any) => void) => Promise<any>;
  trace: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  resolveOperation: (method: string) => any;
  requestWithContext: <T>(options: any, operation: () => Promise<T>) => Promise<T>;
  createAttribution: () => any;
  now: () => number;
  projectResult: (result: any, attribution: any) => any;
  mapResult: (result: any) => any;
  classifyError: (error: unknown) => any;
  emitPerformance: (input: any) => void;
  endAttribution: (attribution: any) => void;
  metadataCommonDir: string | null;
  links: any;
  traceContext: any;
  trigger: string;
  source: any;
  getRepoIndexSizeBucket: (root: string, host: any) => any;
};

/** Coordinates live-query tracing, attribution, first-result timing and performance cleanup. */
async function runGitLiveQueryWithAttribution(dependencies: GitLiveQueryAttributionDependencies): Promise<any> {
  const { request, root, host, signal, runLiveQuery, trace, resolveOperation, requestWithContext, createAttribution, now,
    projectResult, mapResult, classifyError, emitPerformance, endAttribution, metadataCommonDir, links, traceContext, trigger,
    source, getRepoIndexSizeBucket } = dependencies;
  return trace({ attributes: { "git.operation": request.method, "git.trigger": trigger, "worker.id": `git`, "worker.method": `subscribe-live-query` }, name: `git.worker_operation`, op: `codex.git.live_query`, links, trace: traceContext }, async () => {
    const operation = resolveOperation(request.method);
    if (operation == null) return requestWithContext({ metadataCommonDir, source, requestKind: request.method }, () => runLiveQuery(request, root, host, signal, () => {}));
    const attribution = createAttribution(); const startedAt = now(); let firstResultMs: number | null = null; let mappedResult: any; let disposition: any = null;
    try {
      const result = await requestWithContext({ attribution, metadataCommonDir, source, requestKind: request.method }, async () => {
        const raw = await runLiveQuery(request, root, host, signal, (value) => { firstResultMs ??= now() - startedAt; });
        mappedResult = mapResult(projectResult(raw, attribution));
        return raw;
      });
      return result;
    } catch (error) {
      disposition = classifyError(error);
      throw error;
    } finally {
      emitPerformance({ attribution, canceled: signal.aborted, durationMs: now() - startedAt, firstResultMs, host, operation, queueDurationMs: null, repoIndexSizeBucket: getRepoIndexSizeBucket(root, host), result: mappedResult, resultDisposition: signal.aborted ? `canceled` : disposition ?? void 0, reviewSource: request.method === `review-summary` ? request.params.source : null, retryAttempt: null, source, trigger });
      endAttribution(attribution);
    }
  });
}

export { runGitLiveQueryWithAttribution };
if (typeof module !== `undefined`) module.exports = { runGitLiveQueryWithAttribution };
