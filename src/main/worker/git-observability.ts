import {
  classifyGitHubOperation,
  classifyProcessExecutable,
  classifySshOperation,
  createGitProcessTelemetry,
  createProcessTelemetryEvent,
} from "./git-process-observability-policy";
import {
  mapLiveQueryPerformanceResult,
  resolveGitPerformanceOperation,
} from "./git-performance-operation-policy";


function createGitCommandStats(concurrentOperationCount: number) {
  return {
    canceledCommandCount: 0, closed: false, commandCount: 0, commandDurationMsMax: 0,
    commandDurationMsSum: 0, concurrentOperationCount, diffCommandCount: 0,
    failedCommandCount: 0, slowestFailedCommand: null, outputLimitExceededCount: 0,
    peakCommandConcurrency: 0, statusCommandCount: 0, stderrBytes: 0, stdoutBytes: 0,
    timedOutCommandCount: 0, untrackedCacheCoalescedCount: 0, untrackedCacheHitCount: 0,
    untrackedCacheMissCount: 0, untrackedListCommandCount: 0, untrackedStatusCommandCount: 0,
  };
}

function recordUntrackedCacheOutcome(attribution: { closed?: boolean; untrackedCacheCoalescedCount: number; untrackedCacheHitCount: number; untrackedCacheMissCount: number } | null | undefined, outcome: string): void {
  if (attribution == null || attribution.closed) return;
  if (outcome === `coalesced`) attribution.untrackedCacheCoalescedCount += 1;
  else if (outcome === `hit`) attribution.untrackedCacheHitCount += 1;
  else if (outcome === `miss`) attribution.untrackedCacheMissCount += 1;
}

function emptyGitPerformanceResultFields() {
  return {
    additions: null,
    deletions: null,
    diffBytes: null,
    fileCount: null,
    matchCount: null,
    outcome: `failure`,
    truncated: false,
    untrackedFileCount: null,
  };
}

function getGitPerformanceResultFields(result: any): any {
  if (result == null) return emptyGitPerformanceResultFields();
  switch (result.operation) {
    case `branch-diff-stats`:
      return {
        additions: result.result?.additions ?? 0,
        deletions: result.result?.deletions ?? 0,
        diffBytes: null,
        fileCount: result.result?.fileCount ?? 0,
        matchCount: null,
        outcome: `success`,
        truncated: false,
        untrackedFileCount: null,
      };
    case `review-diff`: {
      if (result.result.type === `stale-snapshot`)
        return { ...emptyGitPerformanceResultFields(), outcome: `stale` };
      let diffBytes = 0;
      let fileCount = 0;
      let outcome = `success`;
      let truncated = false;
      for (const key in result.result.diffs) {
        const diff = result.result.diffs[key];
        if (diff == null) continue;
        fileCount += 1;
        if (diff.type === `success`) diffBytes += diff.diffBytes;
        else {
          outcome = `failure`;
          truncated ||= diff.error.type === `diff-too-large`;
        }
      }
      return {
        additions: null,
        deletions: null,
        diffBytes,
        fileCount,
        matchCount: null,
        outcome,
        truncated,
        untrackedFileCount: null,
      };
    }
    case `review-patch`:
      return result.result.diff.type === `error`
        ? {
            ...emptyGitPerformanceResultFields(),
            truncated: result.result.diff.error.type === `diff-too-large`,
          }
        : {
            additions: null,
            deletions: null,
            diffBytes: result.result.diff.unifiedDiffBytes ?? null,
            fileCount: null,
            matchCount: null,
            outcome: `success`,
            truncated: false,
            untrackedFileCount: null,
          };
    case `review-search`:
      return result.result.type === `error`
        ? emptyGitPerformanceResultFields()
        : {
            additions: null,
            deletions: null,
            diffBytes: null,
            fileCount: null,
            matchCount: result.result.totalMatches,
            outcome: `success`,
            truncated: result.result.isCapped,
            untrackedFileCount: null,
          };
    case `review-source-line-counts`: {
      let additions = 0;
      let deletions = 0;
      let outcome = `success`;
      let truncated = false;
      for (const entry of result.result) {
        if (entry.type === `success`) {
          additions += entry.additions;
          deletions += entry.deletions;
        } else if (entry.type === `error`) outcome = `failure`;
        else if (entry.type === `expected` && outcome !== `failure`)
          outcome = `expected`;
        else if (entry.type === `incomplete`) truncated = true;
      }
      return {
        additions,
        deletions,
        diffBytes: null,
        fileCount: null,
        matchCount: null,
        outcome,
        truncated,
        untrackedFileCount: null,
      };
    }
    case `review-summary`:
      if (result.result.type === `error`)
        return emptyGitPerformanceResultFields();
      if (result.result.type === `expected`)
        return { ...emptyGitPerformanceResultFields(), outcome: `expected` };
      return {
        additions: result.result.files.reduce(
          (sum: number, file: any) => sum + (file.additions ?? 0),
          0,
        ),
        deletions: result.result.files.reduce(
          (sum: number, file: any) => sum + (file.deletions ?? 0),
          0,
        ),
        diffBytes: null,
        fileCount: result.result.files.length,
        matchCount: null,
        outcome: `success`,
        truncated: false,
        untrackedFileCount: result.result.stageCounts.untrackedFileCount,
      };
    case `status-summary`:
      return result.result.type === `error`
        ? emptyGitPerformanceResultFields()
        : {
            additions: null,
            deletions: null,
            diffBytes: null,
            fileCount:
              result.result.stagedCount +
              result.result.unstagedCount +
              (result.result.untrackedCount ?? 0),
            matchCount: null,
            outcome: `success`,
            truncated: false,
            untrackedFileCount: result.result.untrackedCount,
          };
  }
}

function getGitPerformanceExpectedReason(result: any) {
  if (result?.operation === `review-summary`)
    return result.result.type === `expected` ? result.result.reason : null;
  if (result?.operation === `review-source-line-counts`) {
    let reason = null;
    for (const entry of result.result) {
      if (entry.type === `error`) return null;
      if (entry.type === `expected` && reason == null) reason = entry.reason;
    }
    return reason;
  }
  return null;
}

function getGitPerformanceFailureReason({ result, resultDisposition }: any) {
  if (resultDisposition === `canceled`) return null;
  if (resultDisposition === `stale_snapshot`) return `stale_snapshot`;
  if (resultDisposition === `git_unavailable`) return `repository_unavailable`;
  if (result == null) return `missing_result`;
  switch (result.operation) {
    case `branch-diff-stats`:
      return null;
    case `review-diff`: {
      const outcome = getGitPerformanceResultFields(result).outcome;
      return outcome === `stale`
        ? `stale_snapshot`
        : outcome === `failure`
          ? `review_diff_error`
          : null;
    }
    case `review-patch`:
      return result.result.diff.type === `error`
        ? `review_patch_error`
        : null;
    case `review-search`:
      return result.result.type === `error` ? `review_search_error` : null;
    case `review-source-line-counts`:
      for (const entry of result.result)
        if (entry.type === `error`)
          return entry.failureReason ?? `review_summary_error`;
      return null;
    case `review-summary`:
      return result.result.type === `error`
        ? (result.result.failureReason ?? `review_summary_error`)
        : null;
    case `status-summary`:
      return result.result.type === `error`
        ? (result.result.failureReason ?? `status_summary_error`)
        : null;
  }
}

function getGitPerformanceOutcome(params: any) {
  if (
    params.canceled ||
    (params.failedCommandCount > 0 &&
      params.canceledCommandCount === params.failedCommandCount &&
      params.outputLimitExceededCount === 0 &&
      params.timedOutCommandCount === 0)
  )
    return `canceled`;
  if (params.resultDisposition === `stale_snapshot`) return `stale`;
  if (params.failedCommandCount > 0 || params.result == null) return `failure`;
  switch (params.result.operation) {
    case `branch-diff-stats`:
      return `success`;
    case `review-diff`:
    case `review-source-line-counts`:
    case `review-summary`:
      return (
        params.resultFields ?? getGitPerformanceResultFields(params.result)
      ).outcome;
    case `review-patch`:
      return params.result.result.diff.type === `error`
        ? `failure`
        : `success`;
    case `review-search`:
    case `status-summary`:
      return params.result.result.type === `error` ? `failure` : `success`;
  }
}

function getGitPerformanceReason(params: any) {
  return params.outcome === `success`
    ? null
    : params.canceled
      ? `canceled`
      : params.attribution.timedOutCommandCount > 0
        ? `command_timeout`
        : params.attribution.outputLimitExceededCount > 0
          ? `command_output_limit`
          : params.attribution.failedCommandCount > 0
            ? params.attribution.canceledCommandCount ===
              params.attribution.failedCommandCount
              ? `command_canceled`
              : `command_failure`
            : (params.expectedReason ?? params.resultFailureReason);
}

function getUntrackedCacheStatus(attribution: any) {
  return attribution.untrackedCacheCoalescedCount > 0
    ? `coalesced`
    : attribution.untrackedCacheHitCount > 0 &&
        attribution.untrackedCacheMissCount > 0
      ? `mixed`
      : attribution.untrackedCacheHitCount > 0
        ? `hit`
        : attribution.untrackedCacheMissCount > 0
          ? `miss`
          : `none`;
}

function createGitPerformanceFields(params: any) {
  const resultFields =
    params.resultFields ?? getGitPerformanceResultFields(params.result);
  const cacheStatus = getUntrackedCacheStatus(params.attribution);
  const expectedReason = getGitPerformanceExpectedReason(params.result);
  const defaultResultDisposition = params.canceled
    ? `canceled`
    : params.result == null
      ? null
      : `completed`;
  const resultDisposition =
    params.resultDisposition === undefined
      ? defaultResultDisposition
      : params.resultDisposition;
  const resultFailureReason = getGitPerformanceFailureReason({
    result: params.result,
    resultDisposition,
  });
  const outcome = getGitPerformanceOutcome({
    canceled: params.canceled,
    canceledCommandCount: params.attribution.canceledCommandCount,
    failedCommandCount: params.attribution.failedCommandCount,
    outputLimitExceededCount: params.attribution.outputLimitExceededCount,
    result: params.result,
    resultDisposition,
    resultFields,
    timedOutCommandCount: params.attribution.timedOutCommandCount,
  });
  const attribution = params.attribution;
  return {
    additions: resultFields.additions,
    cacheStatus,
    canceledCommandCount: attribution.canceledCommandCount,
    commandCount: attribution.commandCount,
    commandDurationMsMax: attribution.commandDurationMsMax,
    commandDurationMsSum: attribution.commandDurationMsSum,
    concurrentOperationCount: attribution.concurrentOperationCount,
    deletions: resultFields.deletions,
    diffBytes: resultFields.diffBytes,
    diffCommandCount: attribution.diffCommandCount,
    durationMs: params.durationMs,
    failedCommandCount: attribution.failedCommandCount,
    failedCommandDurationMs: attribution.slowestFailedCommand?.durationMs ?? null,
    failedCommandErrorKind: attribution.slowestFailedCommand?.errorKind ?? null,
    failedCommandExitCodeBucket:
      attribution.slowestFailedCommand?.exitCodeBucket ?? null,
    failedCommandFailureKind:
      attribution.slowestFailedCommand?.failureKind ?? null,
    failedCommandSubcommand: attribution.slowestFailedCommand?.subcommand ?? null,
    fileCount: resultFields.fileCount,
    firstResultMs: params.firstResultMs,
    hostKind: params.hostKind,
    matchCount: resultFields.matchCount,
    operation: params.operation,
    outcome,
    outputLimitExceededCount: attribution.outputLimitExceededCount,
    peakCommandConcurrency: attribution.peakCommandConcurrency,
    queueDurationMs: params.queueDurationMs,
    reason: getGitPerformanceReason({
      attribution,
      canceled: params.canceled,
      expectedReason,
      outcome,
      resultFailureReason,
    }),
    repoIndexSizeBucket: params.repoIndexSizeBucket,
    resultDisposition,
    resultFailureReason,
    reviewSource: params.reviewSource,
    retryAttempt: params.retryAttempt ?? null,
    source: params.source,
    statusCommandCount: attribution.statusCommandCount,
    stderrBytes: attribution.stderrBytes,
    stdoutBytes: attribution.stdoutBytes,
    timedOutCommandCount: attribution.timedOutCommandCount,
    trigger: params.trigger,
    truncated:
      resultFields.truncated || attribution.outputLimitExceededCount > 0,
    untrackedCacheCoalescedCount: attribution.untrackedCacheCoalescedCount,
    untrackedCacheHitCount: attribution.untrackedCacheHitCount,
    untrackedCacheMissCount: attribution.untrackedCacheMissCount,
    untrackedFileCount: resultFields.untrackedFileCount,
    untrackedListCommandCount: attribution.untrackedListCommandCount,
    untrackedStatusCommandCount: attribution.untrackedStatusCommandCount,
  };
}

function selectGitPerformanceSample(
  outcome: string,
  attribution: any,
  durationMs: number,
  random: () => number,
) {
  if (outcome === `expected`)
    return { samplingRatio: 1, samplingReason: `expected` };
  if (outcome !== `success`)
    return { samplingRatio: 1, samplingReason: `abnormal` };
  if (attribution.untrackedStatusCommandCount > 1)
    return { samplingRatio: 1, samplingReason: `repeated-untracked-scan` };
  if (attribution.concurrentOperationCount >= 4)
    return { samplingRatio: 1, samplingReason: `concurrency` };
  if (durationMs >= 7000)
    return { samplingRatio: 1, samplingReason: `slow` };
  return random() >= 0.05
    ? null
    : { samplingRatio: 0.05, samplingReason: `routine` };
}

function bucketGitIndexSize(size: number | null | undefined) {
  return size == null
    ? `unknown`
    : size < 1048576
      ? `lt_1mb`
      : size < 10485760
        ? `lt_10mb`
        : size < 52428800
          ? `lt_50mb`
          : `gte_50mb`;
}

export { bucketGitIndexSize, buildGitHostCacheKey, classifyGitHubOperation, classifyProcessExecutable, classifySshOperation, createGitCommandStats, createGitPerformanceFields, createGitProcessTelemetry, createProcessTelemetryEvent, exitCodeBucket, getGitPerformanceExpectedReason, getGitPerformanceFailureReason, getGitPerformanceOutcome, getGitPerformanceReason, getGitPerformanceResultFields, getUntrackedCacheStatus, isGitMutationRequest, mapLiveQueryPerformanceResult, recordUntrackedCacheOutcome, resolveGitPerformanceOperation, selectGitPerformanceSample };
if (typeof module !== `undefined`) module.exports = { bucketGitIndexSize, buildGitHostCacheKey, classifyGitHubOperation, classifyProcessExecutable, classifySshOperation, createGitCommandStats, createGitPerformanceFields, createGitProcessTelemetry, createProcessTelemetryEvent, exitCodeBucket, getGitPerformanceExpectedReason, getGitPerformanceFailureReason, getGitPerformanceOutcome, getGitPerformanceReason, getGitPerformanceResultFields, getUntrackedCacheStatus, isGitMutationRequest, mapLiveQueryPerformanceResult, recordUntrackedCacheOutcome, resolveGitPerformanceOperation, selectGitPerformanceSample };
import { exitCodeBucket } from "./git-exit-code-policy";
import { isGitMutationRequest } from "./git-mutation-classification-policy";
import { buildGitHostCacheKey } from "./git-host-cache-key-policy";
