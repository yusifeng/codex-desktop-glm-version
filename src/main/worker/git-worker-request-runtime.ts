import { admitGitRequest } from "./git-request-admission-controller";
import { completeGitRequest } from "./git-request-completion-controller";
import { finalizeGitRequest } from "./git-request-finalization-controller";
import { dispatchGitWorkerRequest } from "./git-worker-request-dispatcher";

type GitWorkerRequestRuntimeDependencies = Record<string, any> & {
  owner: any;
};

async function runGitWorkerRequest(
  e: any,
  t: any,
  n: any,
  r: number,
  dependencies: GitWorkerRequestRuntimeDependencies,
): Promise<void> {
  const {
    owner,
    a2, AH, applyGitChangesBetweenTrees, applyGitPatchRuntime, applyReviewSectionChanges, bz,
    c3, classifyGitRequestException, cleanupHostHandoffTransferFiles, collectSyncedBranchState, createGitBranchRequest, createGitRequestCancellationTelemetry,
    createGitWorkerResponse, createReviewDiffFallback, Cge, CW, EV, f2, fbe,
    formatCommitAttribution, formatCommitMessage, g, getCommitMessageDiff, getCurrentGitBranchSnapshot, getGitBlameFile,
    getGitBranchDiffStats, getGitBranchCommits, getGitIndexInfo, getGitPerformanceRepoIndexSizeBucket, getGitRepositoryIdentity, getGitReviewCommitLineCounts,
    getGitReviewPatch, getGitSubmodulePaths, getOrderedGitRemotes, getDefaultGitRemoteBranch, getReviewDiff,
    gitApplyChangesDeps, gitBlameFileDeps, gitBranchExists,
    gitCatFileDeps, gitCommitMessageDiffDeps, gitIndexInfoDeps, gitRepositoryIdentityDeps, gitReviewBranchStatsDeps, gitReviewCommitQueryDeps,
    gitReviewDiffDeps, gitReviewPatchDeps, gitReviewSectionChangesDeps, gitSubmodulePathsDeps, gitWorktreeListDeps, g_e,
    H6, hostHandoffDeps, I6, isGitMutationMethod, isGitRequestFailure, isGitRequestTracked,
    J2, jH, KX, L1, L6, listCodexWorktrees,
    listGitWorktrees, M4, managedWorktreeDiscoveryDeps, m4, M_e, moveToLocalDeps,
    moveToWorktreeDeps, mR, OH, ove, overwriteSyncedBranch, performCompleteTurnDiffCapture,
    performHostWorktreeHandoff, performMoveThreadToLocal, performMoveThreadToWorktree, performStartTurnDiffCapture, p2, p4,
    R6, readGitCatFile, readWorktreeShellEnvironment, resolveGitInvalidationTarget, resolveGitRefSha, resolveGitRequestPerformanceContext,
    resolveGitWorktreeStartingRef, resolveOriginAndRoots, resolveRequestRoot, resolveMutationRoot, resolveSyncedBranchDetails, resolveWorktreeList,
    s4, sB, shouldCheckGitAvailability, syncedBranchOverwriteDeps, syncedBranchStateDeps, turnDiffCaptureDeps,
    V2, v4, X, X0, X2, xz,
    yR, z1, z6, $, gitWorkerRequestDispatchRuntime,
  } = dependencies;
let i = new AbortController(),
  a = e.params.hostConfig ?? { id: `local`, display_name: `Local`, kind: `local` },
  o = owner.dependencies.createExecutionHost(a),
  originDiscoveryDeps = {
    gitManager: owner.gitManager,
    host: o,
    platform: process.platform,
    environment: process.env,
    normalizeDiscoveryPath: a2,
    normalizeRoot: xz,
    isMissingError: sB,
    warnOriginFailure: (error) => CW().warning(`[git-origin-and-roots] Failed to resolve origin for workspace`, { safe: {}, sensitive: { error } }),
  },
  readRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    getOriginUrl: (repository) => repository.getOriginUrl(),
    getOrigins: (directories) => resolveOriginAndRoots(directories, originDiscoveryDeps),
    getShellEnvironment: readWorktreeShellEnvironment,
    getOwnerThreadId: p4,
    getDefaultRemoteBranch: getDefaultGitRemoteBranch,
    getMergeBase: X2,
    getCurrentBranch: (root, host) => owner.getCurrentBranch(root, host),
    getCurrentBranchSnapshot: getCurrentGitBranchSnapshot,
    getUpstreamBranch: (root, args) => owner.handleUpstreamBranch(root, args),
    getBranchAheadCount: (root, args) => owner.handleBranchAheadCount(root, args),
    getDefaultBranch: (root, host, signal) => owner.getDefaultBranch(root, host, signal),
    getBaseBranch: (root, host) => owner.getBaseBranch(root, host),
    getRecentBranches: (params, args) => owner.handleRecentBranches(params, args),
    branchExists: gitBranchExists,
    createBranch: createGitBranchRequest,
    resolveStartingRef: resolveGitWorktreeStartingRef,
    getBranchCommits: (repository, baseBranch, signal) =>
      getGitBranchCommits(
        repository,
        baseBranch,
        signal,
        gitReviewCommitQueryDeps,
      ),
    getReviewCommitLineCounts: (repository, commits, hideWhitespace, signal) =>
      getGitReviewCommitLineCounts(
        repository,
        commits,
        hideWhitespace,
        signal,
        gitReviewCommitQueryDeps,
      ),
  },
  reviewRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    attribution: n,
    signal: i.signal,
    runAbortable: yR,
    maxUntrackedFiles: z6,
    applyAttribution: H6,
    getStatusSummary: J2,
    getBranchDiffStats: (...args) =>
      getGitBranchDiffStats(...args, gitReviewBranchStatsDeps),
    getReviewSummary: c3,
    getReviewSourceLineCounts: g_e,
    getReviewSnapshot: R6,
    getReviewDiffFallback: createReviewDiffFallback,
    getReviewDiff: (reviewSnapshot, source, files, options) =>
      getReviewDiff(reviewSnapshot, source, files, options, gitReviewDiffDeps),
    staleSnapshotError: s4,
    searchReview: ove,
    getReviewPatch: (...args) => getGitReviewPatch(...args, gitReviewPatchDeps),
  },
  syncedBranchRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    getSyncedBranch: (repository, signal) =>
      resolveSyncedBranchDetails(repository, signal, syncedBranchStateDeps),
    getSyncedBranchState: (cwd, gitManager, host, signal) =>
      collectSyncedBranchState(cwd, gitManager, host, signal, syncedBranchStateDeps),
    overwriteRepository: (params) =>
      overwriteSyncedBranch(params, syncedBranchOverwriteDeps),
  },
  repositoryReadRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    runAbortable: yR,
    getRepositoryIdentity: (repository, options) =>
      getGitRepositoryIdentity(repository, options, gitRepositoryIdentityDeps),
    getCommitMessageDiff: (cwd, includeUnstaged, gitManager, host) =>
      getCommitMessageDiff(
        cwd,
        includeUnstaged,
        gitManager,
        host,
        void 0,
        gitCommitMessageDiffDeps,
      ),
    getSubmodulePaths: (repository, signal) =>
      getGitSubmodulePaths(repository, signal, gitSubmodulePathsDeps),
    getReviewSnapshot: R6,
    catFile: (repository, options, signal) =>
      readGitCatFile(repository, options, signal, gitCatFileDeps),
    blameFile: (gitManager, params, host, signal) =>
      getGitBlameFile(gitManager, params, host, signal, gitBlameFileDeps),
    getIndexInfo: (repository, signal) =>
      getGitIndexInfo(repository, signal, gitIndexInfoDeps),
  },
  turnDiffRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    isRepoWatched: (root) => {
      let watch = owner.watchRegistry.getWatch(root, o);
      return watch?.isReady === !0 && !watch.watcher.requiresRecovery;
    },
    startCapture: (params) => performStartTurnDiffCapture(params, turnDiffCaptureDeps),
    completeCapture: (params) =>
      performCompleteTurnDiffCapture(params, turnDiffCaptureDeps),
  },
  cacheRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    invalidateUntrackedPathsCache: p2,
    refreshRepository: (hostId, root) => owner.liveQueryRegistry.refreshRepository(hostId, root),
  },
  stableMetadataRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    ensureWatchingForGitInit: (cwd, host) => owner.ensureWatchingForGitInit(cwd, host),
    disposeGitInitWatcher: (cwd, host) => owner.disposeGitInitWatcher(cwd, host),
    encodeResult: X,
  },
  applyRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    applyChanges: (params) => applyGitChangesBetweenTrees(params, gitApplyChangesDeps),
    applyPatch: applyGitPatchRuntime,
    applyReviewSectionChanges: (params) =>
      applyReviewSectionChanges(params, gitReviewSectionChangesDeps),
  },
  watchRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    liveQueryRegistry: owner.liveQueryRegistry,
    disposeGitInitWatcher: (cwd, host) => owner.disposeGitInitWatcher(cwd, host),
    getExistingWatch: (root) => owner.watchRegistry.getWatch(root, o),
    ensureWatching: (metadata, host, signal) => owner.ensureWatching(metadata, host, signal),
    resolveQueryRoot: resolveRequestRoot,
    trace: OH,
    unwatchRepo: (root, host) => owner.unwatchRepo(root, host),
    waitForAbort: fbe,
  },
  gitInitRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    runGit: (root, args, host) => $(root, args, host),
  },
  gitPushRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    normalizeRoot: xz,
    getDefaultRemoteBranch: getDefaultGitRemoteBranch,
    getRemotes: getOrderedGitRemotes,
    runGit: (cwd, args, host, options) => $(cwd, args, host, options),
    formatCommand: KX,
    formatExecOutput: mR,
  },
  gitCheckoutRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    normalizeRoot: xz,
    runGit: (cwd, args, host, options) => $(cwd, args, host, options),
    formatExecOutput: mR,
  },
  gitCommitRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    environment: process.env,
    invalidateUntrackedPathsCache: p2,
    getUntrackedPaths: f2,
    stageWorktree: v4,
    runGit: (root, args, host, options) => $(root, args, host, options),
    formatCommitMessage: (message, attribution) =>
      formatCommitMessage(message, attribution, {
        escapeRegExp: (value) => (0, M_e.default)(value),
      }),
    formatCommitAttribution,
    formatExecOutput: mR,
  },
  gitConfigRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
  },
  worktreeSnapshotDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    getWorktreeId: X0,
    normalizeWorktreePath: bz,
    getSnapshotRef: M4,
    normalizeRoot: xz,
    getCommitSha: resolveGitRefSha,
    isMissingError: sB,
  },
  worktreeRequestDeps = {
    gitManager: owner.gitManager,
    host: o,
    signal: i.signal,
    emit: (event) => owner.emit(event),
    scheduleRestore: (repoRoot, worktreePath, cwd, host, signal) =>
      owner.worktreeLifecycle.scheduleRestore(repoRoot, worktreePath, cwd, host, signal, () =>
        Cge(repoRoot, worktreePath, cwd, host, signal),
      ),
    scheduleDelete: (params, host) =>
      owner.worktreeLifecycle.scheduleDelete(params, host, () => owner.deleteWorktreeWithLimit(params, host)),
    unwatchRepository: (worktreePath, host) => owner.unwatchRepo(worktreePath, host),
    normalizeWorktreePath: bz,
    setOwnerThread: m4,
    warn: (message, detail) => I6().warning(message, detail),
    moveToLocal: (params, options) =>
      performMoveThreadToLocal(params, options, moveToLocalDeps),
    moveToWorktree: (params, options) =>
      performMoveThreadToWorktree(params, options, moveToWorktreeDeps),
    moveToHostWorktree: (params, options) =>
      performHostWorktreeHandoff(params, options, hostHandoffDeps),
    createExecutionHost: (config) => owner.dependencies.createExecutionHost(config),
    cleanupHostTransfer: cleanupHostHandoffTransferFiles,
    upstreamRefreshControllers: owner.worktreeUpstreamRefreshAbortControllers,
    createWorktree: (params) => V2(params),
    listCodexWorktrees: (gitManager, host, worktreesRoot) =>
      listCodexWorktrees(gitManager, host, worktreesRoot, managedWorktreeDiscoveryDeps),
    listWorktrees: (cwd, host, signal) => resolveWorktreeList(cwd, host, signal, {
      getWorktreeRepository: (root, executionHost) => owner.gitManager.getWorktreeRepository(root, executionHost),
      listWorktrees: (repository, requestSignal) => listGitWorktrees(repository, requestSignal, gitWorktreeListDeps),
    }),
  },
  s = resolveGitRequestPerformanceContext(e).reviewCwd,
  c = s == null ? `unknown` : getGitPerformanceRepoIndexSizeBucket(owner.watchRegistry.getWatches(), s, o, o.isLocal ? g.default : g.default.posix),
  l,
  u = null,
  d = null,
  f =
  isGitRequestTracked(e.method);
if (!admitGitRequest({ requestId: e.id, tracked: f, signal: i.signal, beginRequest: (id, tracked, signal) => owner.requestLifecycle.begin(id, tracked, signal),
  emitCancellation: (input) => owner.emitGitPerformanceOperation(input), cancellationInput: createGitRequestCancellationTelemetry({ attribution: n, durationMs: Date.now() - r, host: o, operation: t, enqueuedAtMs: e.enqueuedAtMs, repoIndexSizeBucket: c, result: l, reviewSource: resolveGitRequestPerformanceContext(e).reviewSource, source: e.params.operationSource, startedAtMs: r }), operation: t, recordOutcome: (outcome) => jH(outcome) })) return;
let p;
try {
  if (
    shouldCheckGitAvailability(e.method, o.isLocal, z1({ requestKind: e.method, source: e.params.operationSource })) &&
    !(owner.localGitAvailable ??= await yR(L1(o), i.signal))
  )
    throw L6;
  let dispatched = await dispatchGitWorkerRequest(e, {
    ...gitWorkerRequestDispatchRuntime,
    owner,
    abortController: i,
    hostConfig: a,
    host: o,
    originDiscoveryDeps, readRequestDeps, reviewRequestDeps, syncedBranchRequestDeps,
    repositoryReadRequestDeps, turnDiffRequestDeps, cacheRequestDeps,
    stableMetadataRequestDeps, applyRequestDeps, watchRequestDeps, gitInitRequestDeps,
    gitPushRequestDeps, gitCheckoutRequestDeps, gitCommitRequestDeps, gitConfigRequestDeps,
    worktreeSnapshotDeps, worktreeRequestDeps,
  });
  ((p = dispatched.responseResult), (l = dispatched.performance), (d = dispatched.refreshRoot ?? null));
} catch (t) {
  ((u = classifyGitRequestException(t, L6, (value) => value instanceof s4)),
    (p =
      t === L6 && e.method === `stable-metadata`
        ? X(null)
        : t === L6 && e.method === `git-origins`
          ? X({ origins: [] })
          : EV(t)));
} finally {
  await finalizeGitRequest({ request: e, tracked: f, host: o, refreshRoot: d, resolveInvalidationTarget: (request) => resolveGitInvalidationTarget(request, xz, bz),
    invalidateUntrackedPaths: (cwd, host) => owner.gitManager.invalidateUntrackedPathsCacheForCwd(cwd, host), invalidateUntrackedHost: (host) => owner.gitManager.invalidateUntrackedPathsCache(host),
    isMutation: isGitMutationMethod, resolveMutationRoot: (request) => resolveMutationRoot(request, xz, bz), invalidateMutationCaches: (root, host) => owner.gitManager.invalidateGitReadCachesForMutation(root, host),
    getStableMetadata: (cwd, host) => owner.gitManager.getStableMetadata(cwd, host), invalidateRepositoryCaches: (repository) => p2(repository),
    refreshRepository: (hostId, root) => owner.liveQueryRegistry.refreshRepository(hostId, root), getRepository: (root, host) => owner.gitManager.getWorktreeRepositoryForRoot(root, host),
    finishRequest: (id, tracked) => owner.requestLifecycle.finish(id, tracked) });
}
if (completeGitRequest({ request: e, tracked: f, signal: i.signal, operation: t, startedAt: r, host: o, enqueuedAtMs: e.enqueuedAtMs,
  repoIndexSizeBucket: c, result: l, responseResult: p, resultDisposition: u, attribution: n,
  isRequestFailure: isGitRequestFailure, recordOutcome: (outcome) => jH(outcome), createCancellationTelemetry: createGitRequestCancellationTelemetry,
  emitPerformance: (input) => owner.emitGitPerformanceOperation(input), resolveReviewSource: (request) => resolveGitRequestPerformanceContext(request).reviewSource,
  getTrace: () => AH() ?? e.trace, createResponse: createGitWorkerResponse, emit: (event) => owner.emit(event), now: () => Date.now() })) return;
}

export { runGitWorkerRequest };
export type { GitWorkerRequestRuntimeDependencies };
if (typeof module !== `undefined`) module.exports = { runGitWorkerRequest };
