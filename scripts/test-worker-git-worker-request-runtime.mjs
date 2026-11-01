import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/worker/git-worker-request-runtime.ts");
const bundle = await esbuild.build({ bundle: true, entryPoints: [modulePath], format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false });
const { runGitWorkerRequest } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const createHarness = ({ canceled = false, dispatchError = null, available = true, checkAvailability = false } = {}) => {
  const events = [];
  const responses = [];
  const host = { id: "local", isLocal: true };
  const owner = {
    dependencies: { createExecutionHost: () => host },
    gitManager: {
      invalidateUntrackedPathsCacheForCwd: async () => events.push("invalidate-paths"),
      invalidateUntrackedPathsCache: () => events.push("invalidate-host"),
      invalidateGitReadCachesForMutation: async () => events.push("invalidate-mutation"),
      getStableMetadata: async () => null,
      getWorktreeRepositoryForRoot: () => ({}),
    },
    liveQueryRegistry: { refreshRepository: async () => events.push("refresh") },
    watchRegistry: { getWatches: () => [] },
    requestLifecycle: {
      begin: (_id, _tracked, controller) => {
        assert.equal(controller instanceof AbortController, true);
        assertions += 1;
        events.push("begin");
        return canceled ? "canceled" : "active";
      },
      finish: () => events.push("finish"),
    },
    emitGitPerformanceOperation: (input) => events.push(input.kind === "cancel" ? "cancel-performance" : "performance"),
    emit: (event) => { events.push("response"); responses.push(event); },
    worktreeLifecycle: {},
    worktreeUpstreamRefreshAbortControllers: new Map(),
    localGitAvailable: null,
  };
  const dependencies = {
    owner,
    g: { default: { posix: {} } },
    resolveGitRequestPerformanceContext: () => ({ reviewCwd: null, reviewSource: "source" }),
    getGitPerformanceRepoIndexSizeBucket: () => "unknown",
    isGitRequestTracked: () => true,
    createGitRequestCancellationTelemetry: () => ({ kind: "cancel" }),
    jH: (outcome) => events.push(`outcome:${outcome}`),
    shouldCheckGitAvailability: () => checkAvailability,
    z1: () => ({}),
    yR: async () => available,
    L1: () => "git",
    L6: new Error("git unavailable"),
    classifyGitRequestException: (error) => { events.push("classify"); return error.message; },
    X: (value) => ({ ok: value }),
    EV: (error) => ({ error: error.message }),
    resolveGitInvalidationTarget: () => { events.push("resolve-invalidation"); return null; },
    isGitMutationMethod: () => false,
    resolveMutationRoot: () => null,
    p2: () => events.push("invalidate-repository"),
    isGitRequestFailure: (result) => "error" in result,
    AH: () => "runtime-trace",
    createGitWorkerResponse: (input) => input,
    gitWorkerRequestDispatchRuntime: {
      X: (value) => ({ ok: value }),
      dispatchReadOnlyGitRequest: async () => {
        events.push("dispatch");
        if (dispatchError != null) throw dispatchError;
        return "origin";
      },
    },
  };
  const request = { id: "request", method: "origin-url", params: { operationSource: "test" }, trace: "request-trace" };
  return { dependencies, events, owner, request, responses };
};

let harness = createHarness();
await runGitWorkerRequest(harness.request, "operation", "attribution", 10, harness.dependencies);
deepEqual(harness.events, ["begin", "dispatch", "resolve-invalidation", "finish", "performance", "response"]);
deepEqual(harness.responses[0].response.result, { ok: "origin" });
equal(harness.responses[0].response.trace, "runtime-trace");

harness = createHarness({ canceled: true });
await runGitWorkerRequest(harness.request, null, null, 10, harness.dependencies);
deepEqual(harness.events, ["begin", "cancel-performance", "outcome:canceled"]);
equal(harness.responses.length, 0);

harness = createHarness({ dispatchError: new Error("dispatch failed") });
await runGitWorkerRequest(harness.request, null, null, 10, harness.dependencies);
deepEqual(harness.events, ["begin", "dispatch", "classify", "resolve-invalidation", "finish", "outcome:failure", "performance", "response"]);
deepEqual(harness.responses[0].response.result, { error: "dispatch failed" });

harness = createHarness({ available: false, checkAvailability: true });
harness.request.method = "stable-metadata";
await runGitWorkerRequest(harness.request, "operation", null, 10, harness.dependencies);
deepEqual(harness.events, ["begin", "classify", "resolve-invalidation", "finish", "performance", "response"]);
deepEqual(harness.responses[0].response.result, { ok: null });
equal(harness.owner.localGitAvailable, false);

const workerSource = fs.readFileSync(path.join(root, ".reference/originals/main/worker.ts"), "utf8");
const methodSource = workerSource.slice(workerSource.indexOf("async handleRequestWithContext"), workerSource.indexOf("async deleteWorktreeWithLimit"));
equal(workerSource.includes('require("./worker/git-worker-request-runtime")'), true);
equal(methodSource.includes("return runGitWorkerRequest(e, t, n, r"), true);
equal(methodSource.split("\n").length <= 5, true);
for (const token of ["admitGitRequest", "dispatchGitWorkerRequest", "finalizeGitRequest", "completeGitRequest"]) {
  equal(methodSource.includes(token), false);
}

console.log(`${assertions} worker git request runtime assertions passed`);
