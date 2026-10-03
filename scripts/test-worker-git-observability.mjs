import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  bucketGitIndexSize,
  buildGitHostCacheKey,
  classifyProcessExecutable,
  classifyGitHubOperation,
  classifySshOperation,
  createGitCommandStats,
  createGitPerformanceFields,
  createProcessTelemetryEvent,
  createGitProcessTelemetry,
  exitCodeBucket,
  getGitPerformanceExpectedReason,
  getGitPerformanceFailureReason,
  getGitPerformanceOutcome,
  getGitPerformanceReason,
  getGitPerformanceResultFields,
  getUntrackedCacheStatus,
  isGitMutationRequest,
  mapLiveQueryPerformanceResult,
  recordUntrackedCacheOutcome,
  resolveGitPerformanceOperation,
  selectGitPerformanceSample,
} = require("../app/.vite/build/worker/git-observability.js");

assert.equal(createGitCommandStats(3).concurrentOperationCount, 3);
assert.equal(createGitCommandStats(3).closed, false);
assert.equal(isGitMutationRequest({ requestKind: "create-branch", source: null }), true);
assert.equal(isGitMutationRequest({ requestKind: "status", source: "commit_modal" }), true);
assert.equal(isGitMutationRequest({ requestKind: "status", source: "git_direct_call" }), false);
assert.equal(exitCodeBucket(null), null);
assert.equal(exitCodeBucket(128), "128");
assert.equal(exitCodeBucket(7), "other");
assert.equal(
  buildGitHostCacheKey({ id: "host-1", hostConfig: { kind: "local", os: "darwin" }}),
  JSON.stringify(["host-1", "local", undefined, undefined, undefined, undefined, undefined, undefined, "darwin", undefined, undefined, undefined, undefined]),
);
const attribution = { closed: false, untrackedCacheCoalescedCount: 0, untrackedCacheHitCount: 0, untrackedCacheMissCount: 0 };
recordUntrackedCacheOutcome(attribution, "coalesced");
recordUntrackedCacheOutcome(attribution, "hit");
recordUntrackedCacheOutcome(attribution, "miss");
assert.deepEqual(attribution, { closed: false, untrackedCacheCoalescedCount: 1, untrackedCacheHitCount: 1, untrackedCacheMissCount: 1 });
assert.equal(classifyProcessExecutable(null), "other");
assert.equal(classifyProcessExecutable("python3.11"), "python");
assert.equal(classifyProcessExecutable("/bin/bash"), "shell");
assert.equal(classifyProcessExecutable("C:\\Windows\\System32\\cmd.exe"), "shell");
assert.equal(classifyProcessExecutable("git.exe"), "other");
assert.equal(classifyProcessExecutable("gh"), "gh");
assert.equal(classifyProcessExecutable("ssh"), "ssh");
assert.equal(classifyProcessExecutable("node"), "node");
assert.equal(classifyProcessExecutable("unknown-tool"), "other");
assert.equal(classifyProcessExecutable("/usr/bin/wsl.exe"), "wsl");
assert.equal(classifyGitHubOperation(["gh", "pr", "view"], "gh"), "pr.view");
assert.equal(classifyGitHubOperation(["gh", "api", "graphql"], "gh"), "api.graphql");
assert.equal(classifyGitHubOperation(["gh", "api", "repos"], "gh"), "api.rest");
assert.equal(classifyGitHubOperation(["gh", "version"], "gh"), "version");
assert.equal(classifyGitHubOperation(["gh", "unknown", "thing"], "gh"), "other");
assert.equal(classifyGitHubOperation(["sh", "-lc", "gh pr checks"], "shell"), "pr.checks");
assert.equal(classifyGitHubOperation(["sh", "-c", "echo gh pr view"], "shell"), undefined);
assert.equal(classifyGitHubOperation(["git", "status"], "git"), undefined);
assert.equal(classifySshOperation(["ssh", "host"]), "connection");
assert.equal(classifySshOperation(["ssh", "host", "uname", "-a"]), "remote_command");
assert.equal(classifySshOperation(["ssh", "-G", "host"]), "config");
assert.equal(classifySshOperation(["ssh", "-O", "check", "host"]), "control");
assert.equal(classifySshOperation(["ssh", "-L", "8080:localhost:80", "host"]), "port_forward");
assert.equal(classifySshOperation(["ssh", "-o", "LocalForward=8080:localhost:80", "host"]), "port_forward");
assert.equal(classifySshOperation(["ssh", "-o", "StrictHostKeyChecking=no", "host"]), "connection");
assert.equal(classifySshOperation(["ssh", "--", "host", "echo", "ok"]), "remote_command");
assert.deepEqual(createProcessTelemetryEvent("ssh", "remote_command"), { attributes: { "process.kind": "ssh", "process.operation": "remote_command" }, op: "process.exec", name: "subprocess" });
assert.deepEqual(createProcessTelemetryEvent("gh", "pr.view", true), { attributes: { "process.kind": "gh", "process.operation": "pr.view" }, op: "process.exec", name: "subprocess" });
assert.deepEqual(createProcessTelemetryEvent("node"), { attributes: { "process.kind": "node" }, op: "process.exec", name: "subprocess" });
const subcommand = (args, start) => args.slice(start).join(" ");
assert.deepEqual(createGitProcessTelemetry(["git", "status"], subcommand), { op: "git.exec", name: "git.subprocess", attributes: { "git.subcommand": "status" } });
assert.deepEqual(createGitProcessTelemetry(["/usr/bin/git.exe", "diff", "--stat"], subcommand), { op: "git.exec", name: "git.subprocess", attributes: { "git.subcommand": "diff --stat" } });
assert.deepEqual(createGitProcessTelemetry(["cmd.exe", "/d", "/s", "/c", "git.exe", "status"], subcommand), { op: "git.exec", name: "git.subprocess", attributes: { "git.subcommand": "status" } });
assert.equal(createGitProcessTelemetry(["cmd.exe", "/c", "git", "status"], subcommand), null);
assert.equal(createGitProcessTelemetry(["bash", "-c", "git status"], subcommand), null);
assert.equal(createGitProcessTelemetry(["node", "script.js"], subcommand), null);
assert.deepEqual(createGitProcessTelemetry(["git.com", "log"], subcommand).attributes, { "git.subcommand": "log" });
assert.equal(createGitProcessTelemetry(["cmd", "/d", "/s", "/c", "python", "x"], subcommand), null);

let extraCount = 0;
const extraEqual = (...args) => {
  extraCount++;
  assert.equal(...args);
};
const extraDeepEqual = (...args) => {
  extraCount++;
  assert.deepEqual(...args);
};

extraEqual(resolveGitPerformanceOperation("review-diff"), "review-diff");
extraEqual(resolveGitPerformanceOperation("current-branch"), null);
extraDeepEqual(
  mapLiveQueryPerformanceResult({ method: "status-summary", result: { type: "success" } }),
  { operation: "status-summary", result: { type: "success" } },
);
extraEqual(mapLiveQueryPerformanceResult({ method: "current-branch", result: "main" }), undefined);

extraEqual(bucketGitIndexSize(null), "unknown");
extraEqual(bucketGitIndexSize(0), "lt_1mb");
extraEqual(bucketGitIndexSize(1048575), "lt_1mb");
extraEqual(bucketGitIndexSize(1048576), "lt_10mb");
extraEqual(bucketGitIndexSize(10485760), "lt_50mb");
extraEqual(bucketGitIndexSize(52428800), "gte_50mb");

for (const [values, expected] of [
  [[1, 0, 0], "coalesced"],
  [[0, 1, 1], "mixed"],
  [[0, 1, 0], "hit"],
  [[0, 0, 1], "miss"],
  [[0, 0, 0], "none"],
])
  extraEqual(
    getUntrackedCacheStatus({
      untrackedCacheCoalescedCount: values[0],
      untrackedCacheHitCount: values[1],
      untrackedCacheMissCount: values[2],
    }),
    expected,
  );

const emptyFields = getGitPerformanceResultFields(null);
extraDeepEqual(emptyFields, {
  additions: null,
  deletions: null,
  diffBytes: null,
  fileCount: null,
  matchCount: null,
  outcome: "failure",
  truncated: false,
  untrackedFileCount: null,
});
extraDeepEqual(
  getGitPerformanceResultFields({
    operation: "branch-diff-stats",
    result: { additions: 3, deletions: 2, fileCount: 1 },
  }),
  { ...emptyFields, additions: 3, deletions: 2, fileCount: 1, outcome: "success" },
);
extraEqual(
  getGitPerformanceResultFields({ operation: "review-diff", result: { type: "stale-snapshot" } }).outcome,
  "stale",
);
extraDeepEqual(
  getGitPerformanceResultFields({
    operation: "review-diff",
    result: {
      type: "success",
      diffs: {
        one: { type: "success", diffBytes: 8 },
        two: { type: "error", error: { type: "diff-too-large" } },
        absent: null,
      },
    },
  }),
  { ...emptyFields, diffBytes: 8, fileCount: 2, outcome: "failure", truncated: true },
);
extraEqual(
  getGitPerformanceResultFields({
    operation: "review-patch",
    result: { diff: { type: "success", unifiedDiffBytes: 12 } },
  }).diffBytes,
  12,
);
extraEqual(
  getGitPerformanceResultFields({
    operation: "review-patch",
    result: { diff: { type: "error", error: { type: "diff-too-large" } } },
  }).truncated,
  true,
);
extraDeepEqual(
  getGitPerformanceResultFields({
    operation: "review-search",
    result: { type: "success", totalMatches: 9, isCapped: true },
  }),
  { ...emptyFields, matchCount: 9, outcome: "success", truncated: true },
);
extraDeepEqual(
  getGitPerformanceResultFields({
    operation: "review-source-line-counts",
    result: [
      { type: "success", additions: 4, deletions: 1 },
      { type: "expected", reason: "binary" },
      { type: "incomplete" },
    ],
  }),
  { ...emptyFields, additions: 4, deletions: 1, outcome: "expected", truncated: true },
);
extraDeepEqual(
  getGitPerformanceResultFields({
    operation: "review-summary",
    result: {
      type: "success",
      files: [{ additions: 2, deletions: 1 }, { additions: null, deletions: 3 }],
      stageCounts: { untrackedFileCount: 2 },
    },
  }),
  { ...emptyFields, additions: 2, deletions: 4, fileCount: 2, outcome: "success", untrackedFileCount: 2 },
);
extraEqual(
  getGitPerformanceResultFields({
    operation: "status-summary",
    result: { type: "success", stagedCount: 1, unstagedCount: 2, untrackedCount: 3 },
  }).fileCount,
  6,
);

extraEqual(
  getGitPerformanceExpectedReason({ operation: "review-summary", result: { type: "expected", reason: "bare" } }),
  "bare",
);
extraEqual(
  getGitPerformanceExpectedReason({
    operation: "review-source-line-counts",
    result: [{ type: "expected", reason: "binary" }, { type: "expected", reason: "large" }],
  }),
  "binary",
);
extraEqual(
  getGitPerformanceExpectedReason({
    operation: "review-source-line-counts",
    result: [{ type: "expected", reason: "binary" }, { type: "error" }],
  }),
  null,
);

extraEqual(getGitPerformanceFailureReason({ result: null, resultDisposition: null }), "missing_result");
extraEqual(getGitPerformanceFailureReason({ result: null, resultDisposition: "git_unavailable" }), "repository_unavailable");
extraEqual(
  getGitPerformanceFailureReason({
    result: { operation: "review-summary", result: { type: "error", failureReason: "bad_ref" } },
    resultDisposition: "completed",
  }),
  "bad_ref",
);
extraEqual(
  getGitPerformanceFailureReason({
    result: { operation: "review-patch", result: { diff: { type: "error" } } },
    resultDisposition: "completed",
  }),
  "review_patch_error",
);

extraEqual(
  getGitPerformanceOutcome({ canceled: true, failedCommandCount: 0 }),
  "canceled",
);
extraEqual(
  getGitPerformanceOutcome({
    canceled: false,
    canceledCommandCount: 1,
    failedCommandCount: 1,
    outputLimitExceededCount: 0,
    timedOutCommandCount: 0,
  }),
  "canceled",
);
extraEqual(
  getGitPerformanceOutcome({ canceled: false, failedCommandCount: 0, resultDisposition: "stale_snapshot" }),
  "stale",
);
extraEqual(
  getGitPerformanceOutcome({
    canceled: false,
    failedCommandCount: 0,
    result: { operation: "status-summary", result: { type: "success" } },
  }),
  "success",
);

const reasonAttribution = {
  timedOutCommandCount: 0,
  outputLimitExceededCount: 0,
  failedCommandCount: 0,
  canceledCommandCount: 0,
};
extraEqual(getGitPerformanceReason({ outcome: "success", attribution: reasonAttribution }), null);
extraEqual(getGitPerformanceReason({ outcome: "failure", canceled: true, attribution: reasonAttribution }), "canceled");
extraEqual(
  getGitPerformanceReason({
    outcome: "failure",
    attribution: { ...reasonAttribution, timedOutCommandCount: 1 },
  }),
  "command_timeout",
);
extraEqual(
  getGitPerformanceReason({
    outcome: "failure",
    attribution: reasonAttribution,
    expectedReason: "binary",
    resultFailureReason: "fallback",
  }),
  "binary",
);

const sampleAttribution = { untrackedStatusCommandCount: 0, concurrentOperationCount: 0 };
extraDeepEqual(selectGitPerformanceSample("expected", sampleAttribution, 1, () => 1), { samplingRatio: 1, samplingReason: "expected" });
extraDeepEqual(selectGitPerformanceSample("failure", sampleAttribution, 1, () => 1), { samplingRatio: 1, samplingReason: "abnormal" });
extraDeepEqual(selectGitPerformanceSample("success", { ...sampleAttribution, untrackedStatusCommandCount: 2 }, 1, () => 1), { samplingRatio: 1, samplingReason: "repeated-untracked-scan" });
extraDeepEqual(selectGitPerformanceSample("success", { ...sampleAttribution, concurrentOperationCount: 4 }, 1, () => 1), { samplingRatio: 1, samplingReason: "concurrency" });
extraDeepEqual(selectGitPerformanceSample("success", sampleAttribution, 7000, () => 1), { samplingRatio: 1, samplingReason: "slow" });
extraEqual(selectGitPerformanceSample("success", sampleAttribution, 10, () => 0.5), null);
extraDeepEqual(selectGitPerformanceSample("success", sampleAttribution, 10, () => 0.01), { samplingRatio: 0.05, samplingReason: "routine" });

const stats = createGitCommandStats(2);
const performanceFields = createGitPerformanceFields({
  attribution: stats,
  canceled: false,
  durationMs: 20,
  firstResultMs: 10,
  hostKind: "local",
  operation: "status-summary",
  queueDurationMs: null,
  repoIndexSizeBucket: "lt_1mb",
  result: {
    operation: "status-summary",
    result: { type: "success", stagedCount: 1, unstagedCount: 2, untrackedCount: 0 },
  },
  reviewSource: null,
  source: "test",
  trigger: "request",
});
extraEqual(performanceFields.outcome, "success");
extraEqual(performanceFields.fileCount, 3);
extraEqual(performanceFields.resultDisposition, "completed");
extraEqual(performanceFields.concurrentOperationCount, 2);

extraEqual(
  createGitPerformanceFields({
    attribution: stats,
    canceled: false,
    durationMs: 20,
    firstResultMs: null,
    hostKind: "local",
    operation: "status-summary",
    queueDurationMs: null,
    repoIndexSizeBucket: "unknown",
    result: {
      operation: "status-summary",
      result: { type: "success", stagedCount: 0, unstagedCount: 0, untrackedCount: 0 },
    },
    resultDisposition: null,
    reviewSource: null,
    source: "test",
    trigger: "request",
  }).resultDisposition,
  null,
);

console.log(`${47 + extraCount} worker git observability assertions passed`);
