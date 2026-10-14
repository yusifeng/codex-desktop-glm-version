type GitWorkerRequestDispatchDependencies = Record<string, any> & {
  owner: any;
  abortController: AbortController;
  host: any;
  hostConfig: any;
};

async function dispatchGitWorkerRequest(
  e: any,
  dependencies: GitWorkerRequestDispatchDependencies,
) {
  const {
    owner,
    abortController: i,
    hostConfig: a,
    host: o,
    originDiscoveryDeps,
    readRequestDeps,
    reviewRequestDeps,
    syncedBranchRequestDeps,
    repositoryReadRequestDeps,
    turnDiffRequestDeps,
    cacheRequestDeps,
    stableMetadataRequestDeps,
    applyRequestDeps,
    watchRequestDeps,
    gitInitRequestDeps,
    gitPushRequestDeps,
    gitCheckoutRequestDeps,
    gitCommitRequestDeps,
    gitConfigRequestDeps,
    worktreeSnapshotDeps,
    worktreeRequestDeps,
    $2, EV, I$, I6, J2, L1, X, applyGitChanges, applyGitPatch,
    applyGitReviewSectionChanges, checkoutGitBranch, commitGitChanges,
    createGitBranch, discoverGitOrigins, dispatchBranchExtraReadRequest,
    dispatchBranchReadRequest, dispatchCacheWatchRequest,
    dispatchCodexWorktreeRequest, dispatchGitApplyRequest,
    dispatchGitCoreRequest, dispatchGitMutationRequest,
    dispatchGitNodeRequest, dispatchReadOnlyGitRequest,
    dispatchRepositoryContentRequest, dispatchRepositoryReadRequest,
    dispatchReviewReadRequest, dispatchStableMetadataRequest,
    dispatchSyncedBranchRequest, dispatchTurnDiffRequest,
    dispatchWorktreeCreateRequest, dispatchWorktreeListRequest,
    dispatchWorktreeMutationRequest, dispatchWorktreeOwnerRequest,
    dispatchWorktreeReadRequest, dispatchWorktreeResolutionRequest,
    dispatchWorktreeSnapshotRead, disposeGitInitWatch, f2,
    findNearestAncestorBranch, g, getBranchMetadata, getGitCloneState,
    getGitIndexPath, getGitRootRelativeCwd, getManagedWorktreeLocations,
    gitBranchMetadataDeps, gitCloneStateDeps, gitNearestAncestorDeps,
    initializeGitRepository, invalidateGitReadCaches,
    invalidateStableMetadata, managedWorktreeDiscoveryDeps,
    overwriteSyncedBranchRepository, p4, pushGitRepository,
    recoverGitLiveQueries, resolveAutomationWritableRoots, resolveBaseBranch,
    resolveBlameFile, resolveBranchAheadCount, resolveBranchCommits,
    resolveBranchDiffStats, resolveBranchExists, resolveCatFile,
    resolveCommitMessageDiff, resolveConfigValue, resolveCurrentBranch,
    resolveCurrentBranchSnapshot, resolveDefaultBranch,
    resolveDefaultRemoteBranch, resolveIndexInfo, resolveManagedWorktreeState,
    resolveMergeBase, resolveOriginUrl, resolveOrigins, resolveRecentBranches,
    resolveRepositoryIdentity, resolveReviewCommitLineCounts,
    resolveReviewDiff, resolveReviewPatch, resolveReviewSearch,
    resolveReviewSourceLineCounts, resolveReviewSummary,
    resolveShellEnvironment, resolveStatusSummary, resolveSubmodulePaths,
    resolveSyncedBranch, resolveSyncedBranchState, resolveUpstreamBranch,
    resolveWorktreeForThread, resolveWorktreeOwner, resolveWorktreeSnapshot,
    resolveWorktreeStartingRef, resolveWorktrees, setGitConfigValue,
    subscribeGitLiveQuery, unwatchGitRepository, watchGitRepository, xz, yR,
  } = dependencies;
  let p: any;
  let l: any;
  let d: any = null;

  switch (e.method) {
          case `github-request`:
            p = X((await dispatchGitNodeRequest(e.method, e.params, {
              host: o,
              signal: i.signal,
              requestGitHub: owner.dependencies.requestGitHub,
              resolveAutomationWritableRoots: (params) => resolveAutomationWritableRoots(params, {
                gitManager: owner.gitManager,
                host: o,
                getIndexPath: getGitIndexPath,
                path: g.default,
              }),
              readGitFileBinary: owner.dependencies.readGitFileBinary,
              getWorktreeRepository: (cwd, host) => owner.gitManager.getWorktreeRepository(cwd, host),
              prepareWorktreeSnapshot: owner.dependencies.prepareWorktreeSnapshot,
            })).result);
            break;
          case `origin-url`: {
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          }
          case `origin-and-roots`:
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          case `worktree-shell-environment`: {
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          }
          case `worktree-owner`: {
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          }
          case `default-remote-branch`: {
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          }
          case `automation-writable-roots`:
            p = X((await dispatchGitNodeRequest(e.method, e.params, {
              host: o,
              signal: i.signal,
              resolveAutomationWritableRoots: (params) => resolveAutomationWritableRoots(params, {
                gitManager: owner.gitManager,
                host: o,
                getIndexPath: getGitIndexPath,
                path: g.default,
              }),
              getWorktreeRepository: (cwd, host) => owner.gitManager.getWorktreeRepository(cwd, host),
            })).result);
            break;
          case `merge-base`: {
            p = X(await dispatchReadOnlyGitRequest(e.method, e.params, { ...readRequestDeps, resolveOriginUrl: (cwd) => resolveOriginUrl(cwd, readRequestDeps), resolveOrigins: (dirs) => resolveOrigins(dirs, readRequestDeps), resolveShellEnvironment: (cwd, signal) => resolveShellEnvironment(cwd, signal, readRequestDeps), resolveWorktreeOwner: (cwd) => resolveWorktreeOwner(cwd, readRequestDeps), resolveDefaultRemoteBranch: (cwd) => resolveDefaultRemoteBranch(cwd, readRequestDeps), resolveMergeBase: (cwd, base) => resolveMergeBase(cwd, base, readRequestDeps), signal: i.signal }));
            break;
          }
          case `read-git-file-binary`:
            p = X((await dispatchGitNodeRequest(e.method, e.params, {
              host: o,
              signal: i.signal,
              readGitFileBinary: owner.dependencies.readGitFileBinary,
            })).result);
            break;
          case `prepare-worktree-snapshot`: {
            p = X((await dispatchGitNodeRequest(e.method, e.params, {
              host: o,
              signal: i.signal,
              getWorktreeRepository: (cwd, host) => owner.gitManager.getWorktreeRepository(cwd, host),
              prepareWorktreeSnapshot: owner.dependencies.prepareWorktreeSnapshot,
            })).result);
            break;
          }
          case `push`: {
            let t = await dispatchGitMutationRequest(e.method, e.params, { push: (p) => pushGitRepository(p, gitPushRequestDeps), checkout: (p) => checkoutGitBranch(p, gitCheckoutRequestDeps), commit: (p) => commitGitChanges(p, gitCommitRequestDeps), setConfig: (p) => setGitConfigValue(p, gitConfigRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `checkout-branch`: {
            let t = await dispatchGitMutationRequest(e.method, e.params, { push: (p) => pushGitRepository(p, gitPushRequestDeps), checkout: (p) => checkoutGitBranch(p, gitCheckoutRequestDeps), commit: (p) => commitGitChanges(p, gitCommitRequestDeps), setConfig: (p) => setGitConfigValue(p, gitConfigRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `availability`: {
            let t = await dispatchGitCoreRequest(e.method, e.params, {
              signal: i.signal,
              checkAvailability: (signal) => yR(L1(o), signal),
              createBranch: (params, signal) => createGitBranch(params, signal, readRequestDeps),
              discoverOrigins: (dirs) => discoverGitOrigins(dirs, originDiscoveryDeps),
            });
            (o.isLocal && (owner.localGitAvailable = t.result.available), (p = X(t.result)));
            break;
          }
          case `stable-metadata`:
            p = (await dispatchStableMetadataRequest(e.method, e.params, stableMetadataRequestDeps)).result;
            break;
          case `clone-state`:
            p = X(await dispatchRepositoryReadRequest(e.method, e.params, { cloneState: (root) => getGitCloneState(root, o, i.signal, gitCloneStateDeps), branchMetadata: (cwd) => getBranchMetadata(owner.gitManager, cwd, o, i.signal, gitBranchMetadataDeps), branchExists: (root, branch) => resolveBranchExists(root, branch, i.signal, readRequestDeps) }));
            break;
          case `current-branch`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `current-branch-snapshot`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `upstream-branch`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `branch-ahead-count`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `default-branch`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `base-branch`:
            p = X(await dispatchBranchReadRequest(e.method, e.params, { signal: i.signal, currentBranch: (root) => resolveCurrentBranch(root, readRequestDeps), currentBranchSnapshot: (root, signal) => resolveCurrentBranchSnapshot(root, signal, readRequestDeps), upstreamBranch: (root, signal) => resolveUpstreamBranch(root, signal, readRequestDeps), branchAheadCount: (root, signal) => resolveBranchAheadCount(root, signal, readRequestDeps), defaultBranch: (root, signal) => resolveDefaultBranch(root, signal, readRequestDeps), baseBranch: (root) => resolveBaseBranch(root, readRequestDeps) }));
            break;
          case `recent-branches`:
            p = await dispatchBranchExtraReadRequest(e.method, e.params, { recentBranches: (params) => resolveRecentBranches(params, i.signal, readRequestDeps), resolveStartingRef: (root, ref) => resolveWorktreeStartingRef(root, ref, i.signal, readRequestDeps), branchCommits: (root, base) => resolveBranchCommits(root, base, i.signal, readRequestDeps), reviewCommitLineCounts: (root, commits, hideWhitespace) => resolveReviewCommitLineCounts(root, commits, hideWhitespace, i.signal, readRequestDeps) });
            break;
          case `branch-exists`:
            p = X(await dispatchRepositoryReadRequest(e.method, e.params, { cloneState: (root) => getGitCloneState(root, o, i.signal, gitCloneStateDeps), branchMetadata: (cwd) => getBranchMetadata(owner.gitManager, cwd, o, i.signal, gitBranchMetadataDeps), branchExists: (root, branch) => resolveBranchExists(root, branch, i.signal, readRequestDeps) }));
            break;
          case `create-branch`: {
            p = X((await dispatchGitCoreRequest(e.method, e.params, {
              signal: i.signal,
              checkAvailability: (signal) => yR(L1(o), signal),
              createBranch: (params, signal) => createGitBranch(params, signal, readRequestDeps),
              discoverOrigins: (dirs) => discoverGitOrigins(dirs, originDiscoveryDeps),
            })).result);
            break;
          }
          case `resolve-worktree-starting-ref`:
            p = X(await dispatchBranchExtraReadRequest(e.method, e.params, { recentBranches: (params) => resolveRecentBranches(params, i.signal, readRequestDeps), resolveStartingRef: (root, ref) => resolveWorktreeStartingRef(root, ref, i.signal, readRequestDeps), branchCommits: (root, base) => resolveBranchCommits(root, base, i.signal, readRequestDeps), reviewCommitLineCounts: (root, commits, hideWhitespace) => resolveReviewCommitLineCounts(root, commits, hideWhitespace, i.signal, readRequestDeps) }));
            break;
          case `branch-commits`:
            p = X(await dispatchBranchExtraReadRequest(e.method, e.params, { recentBranches: (params) => resolveRecentBranches(params, i.signal, readRequestDeps), resolveStartingRef: (root, ref) => resolveWorktreeStartingRef(root, ref, i.signal, readRequestDeps), branchCommits: (root, base) => resolveBranchCommits(root, base, i.signal, readRequestDeps), reviewCommitLineCounts: (root, commits, hideWhitespace) => resolveReviewCommitLineCounts(root, commits, hideWhitespace, i.signal, readRequestDeps) }));
            break;
          case `review-commit-line-counts`:
            p = X(await dispatchBranchExtraReadRequest(e.method, e.params, { recentBranches: (params) => resolveRecentBranches(params, i.signal, readRequestDeps), resolveStartingRef: (root, ref) => resolveWorktreeStartingRef(root, ref, i.signal, readRequestDeps), branchCommits: (root, base) => resolveBranchCommits(root, base, i.signal, readRequestDeps), reviewCommitLineCounts: (root, commits, hideWhitespace) => resolveReviewCommitLineCounts(root, commits, hideWhitespace, i.signal, readRequestDeps) }));
            break;
          case `search-branches`:
            p = await dispatchWorktreeReadRequest(e.method, e.params, { nearestAncestorBranch: (params) => findNearestAncestorBranch(owner.gitManager.getWorktreeRepositoryForRoot(params.root, o), params.candidates, params.currentBranch, i.signal, gitNearestAncestorDeps), searchBranches: (params) => owner.handleSearchBranches(params, { host: o, signal: i.signal }) });
            break;
          case `nearest-ancestor-branch`:
            p = X({ branch: await dispatchWorktreeReadRequest(e.method, e.params, { nearestAncestorBranch: (params) => findNearestAncestorBranch(owner.gitManager.getWorktreeRepositoryForRoot(params.root, o), params.candidates, params.currentBranch, i.signal, gitNearestAncestorDeps), searchBranches: (params) => owner.handleSearchBranches(params, { host: o, signal: i.signal }) }) });
            break;
          case `branch-metadata`:
            p = X(await dispatchRepositoryReadRequest(e.method, e.params, { cloneState: (root) => getGitCloneState(root, o, i.signal, gitCloneStateDeps), branchMetadata: (cwd) => getBranchMetadata(owner.gitManager, cwd, o, i.signal, gitBranchMetadataDeps), branchExists: (root, branch) => resolveBranchExists(root, branch, i.signal, readRequestDeps) }));
            break;
          case `status-summary`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `branch-diff-stats`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `review-summary`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `review-source-line-counts`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `review-diff`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `review-search`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `review-patch`: {
            let t = await dispatchReviewReadRequest(e.method, e.params, { statusSummary: (params) => resolveStatusSummary(params, reviewRequestDeps), branchDiffStats: (params) => resolveBranchDiffStats(params, reviewRequestDeps), reviewSummary: (params) => resolveReviewSummary(params, reviewRequestDeps), reviewSourceLineCounts: (params) => resolveReviewSourceLineCounts(params, reviewRequestDeps), reviewDiff: (params) => resolveReviewDiff(params, reviewRequestDeps), reviewSearch: (params) => resolveReviewSearch(params, reviewRequestDeps), reviewPatch: (params) => resolveReviewPatch(params, reviewRequestDeps) });
            ((p = X(t.result)), (l = t.performance));
            break;
          }
          case `synced-branch`: {
            p = X(await dispatchSyncedBranchRequest(e.method, e.params, { syncedBranch: (cwd) => resolveSyncedBranch(cwd, syncedBranchRequestDeps), syncedBranchState: (cwd) => resolveSyncedBranchState(cwd, syncedBranchRequestDeps), overwriteRepository: (params) => overwriteSyncedBranchRepository(params, syncedBranchRequestDeps) }));
            break;
          }
          case `synced-branch-state`:
            p = X(await dispatchSyncedBranchRequest(e.method, e.params, { syncedBranch: (cwd) => resolveSyncedBranch(cwd, syncedBranchRequestDeps), syncedBranchState: (cwd) => resolveSyncedBranchState(cwd, syncedBranchRequestDeps), overwriteRepository: (params) => overwriteSyncedBranchRepository(params, syncedBranchRequestDeps) }));
            break;
          case `overwrite-repo`: {
            let t = await dispatchSyncedBranchRequest(e.method, e.params, { syncedBranch: (cwd) => resolveSyncedBranch(cwd, syncedBranchRequestDeps), syncedBranchState: (cwd) => resolveSyncedBranchState(cwd, syncedBranchRequestDeps), overwriteRepository: (params) => overwriteSyncedBranchRepository(params, syncedBranchRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `invalidate-stable-metadata`:
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          case `invalidate-git-read-caches`: {
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          }
          case `dispose-git-init-watch`:
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          case `watch-repo`: {
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          }
          case `subscribe-live-query`: {
            await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) });
            p = X(void 0);
            break;
          }
          case `recover-live-queries`: {
            await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) });
            p = X(void 0);
            break;
          }
          case `unwatch-repo`:
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          case `git-init-repo`:
            p = X(await dispatchCacheWatchRequest(e.method, e.params, { invalidateStableMetadata: () => invalidateStableMetadata(cacheRequestDeps), invalidateGitReadCaches: (params) => invalidateGitReadCaches(params, cacheRequestDeps), disposeGitInitWatch: (cwd) => disposeGitInitWatch(cwd, watchRequestDeps), watchRepository: (params) => watchGitRepository(params, watchRequestDeps), subscribeLiveQuery: (params) => subscribeGitLiveQuery({ ...params, trace: e.trace }, watchRequestDeps), recoverLiveQueries: (params) => recoverGitLiveQueries(params, watchRequestDeps), unwatchRepository: (root) => unwatchGitRepository(root, watchRequestDeps), initializeRepository: (params) => initializeGitRepository(params, gitInitRequestDeps) }));
            break;
          case `repository-identity`: {
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          }
          case `turn-diff-capture-start`:
          case `turn-diff-capture-complete`:
            p = X((await dispatchTurnDiffRequest(e.method, e.params, turnDiffRequestDeps)).result);
            break;
          case `commit-message-diff`:
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          case `submodule-paths`:
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          case `cat-file`: {
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          }
          case `blame-file`:
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          case `index-info`: {
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          }
          case `config-value`:
            p = X(await dispatchRepositoryContentRequest(e.method, e.params, { repositoryIdentity: (params) => resolveRepositoryIdentity(params.cwd, repositoryReadRequestDeps), commitMessageDiff: (params) => resolveCommitMessageDiff(params, repositoryReadRequestDeps), submodulePaths: (params) => resolveSubmodulePaths(params.root, repositoryReadRequestDeps), catFile: (params) => resolveCatFile(params, repositoryReadRequestDeps), blameFile: (params) => resolveBlameFile(params, repositoryReadRequestDeps), indexInfo: (params) => resolveIndexInfo(params.cwd, repositoryReadRequestDeps), configValue: (params) => resolveConfigValue(params.root, params.key, params.scope, repositoryReadRequestDeps) }));
            break;
          case `git-origins`: {
            let t = Date.now(),
              { origins: n } = (await dispatchGitCoreRequest(e.method, e.params, {
                signal: i.signal,
                checkAvailability: (signal) => yR(L1(o), signal),
                createBranch: (params, signal) => createGitBranch(params, signal, readRequestDeps),
                discoverOrigins: (dirs) => discoverGitOrigins(dirs, originDiscoveryDeps),
              })).result;
            (I6().info(`[git-origins] worker-complete`, {
              safe: {
                dirCount: e.params.dirs.length,
                originCount: n.length,
                elapsedMs: Date.now() - t,
                hostId: a.id,
              },
              sensitive: {},
            }),
              (p = X({ origins: n })));
            break;
          }
          case `set-config-value`: {
            let t = await dispatchGitMutationRequest(e.method, e.params, { push: (p) => pushGitRepository(p, gitPushRequestDeps), checkout: (p) => checkoutGitBranch(p, gitCheckoutRequestDeps), commit: (p) => commitGitChanges(p, gitCommitRequestDeps), setConfig: (p) => setGitConfigValue(p, gitConfigRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `create-worktree`:
            p = (await dispatchWorktreeCreateRequest(e.method, e.params, worktreeRequestDeps)).result;
            break;
          case `cancel-worktree-upstream-refresh`: {
            let t = await dispatchWorktreeMutationRequest(e.method, e.params, e.id, worktreeRequestDeps);
            p = X(t.result);
            break;
          }
          case `codex-worktrees`:
            try {
              p = X((await dispatchCodexWorktreeRequest(e.method, e.params, {
                gitManager: owner.gitManager,
                host: o,
                signal: i.signal,
                listCodexWorktrees: (gitManager, host, worktreesRoot, _signal) =>
                  worktreeRequestDeps.listCodexWorktrees(gitManager, host, worktreesRoot),
              })).result);
            } catch (e) {
              p = EV(e instanceof Error ? e.message : String(e));
            }
            break;
          case `list-worktrees`:
            p = X((await dispatchWorktreeListRequest(e.method, e.params, {
              listWorktrees: (cwd, host, signal) => resolveWorktrees({ cwd, host, signal }, worktreeRequestDeps),
              host: o,
              signal: i.signal,
            })).result);
            break;
          case `resolve-worktree-for-thread`:
            p = X((await dispatchWorktreeResolutionRequest(e.method, e.params, {
              resolveWorktreeForThread: (params) => resolveWorktreeForThread(params, {
                gitManager: owner.gitManager,
                host: o,
                signal: i.signal,
                getManagedWorktreeLocations: (host, worktreesRoot) =>
                  getManagedWorktreeLocations(host, worktreesRoot, managedWorktreeDiscoveryDeps),
                getRootRelativeCwd: getGitRootRelativeCwd,
                listWorktrees: $2,
                readThreadConfig: p4,
                getTrackedStatus: J2,
                getUntrackedPaths: (e, t) => f2(e, void 0, void 0, t),
                normalizeWorkspaceRoot: xz,
                normalizeComparisonPath: I$,
              }),
            })).result);
            break;
          case `worktree-snapshot-ref`:
            p = X(await dispatchWorktreeSnapshotRead(e.method, e.params, { snapshotRef: (roots, path) => resolveWorktreeSnapshot(roots, path, worktreeSnapshotDeps), managedState: (roots, cwd, path) => resolveManagedWorktreeState(roots, cwd, path, worktreeSnapshotDeps) }));
            break;
          case `managed-worktree-state`:
            p = X(await dispatchWorktreeSnapshotRead(e.method, e.params, { snapshotRef: (roots, path) => resolveWorktreeSnapshot(roots, path, worktreeSnapshotDeps), managedState: (roots, cwd, path) => resolveManagedWorktreeState(roots, cwd, path, worktreeSnapshotDeps) }));
            break;
          case `restore-worktree`:
          case `delete-worktree`: {
            let t = await dispatchWorktreeMutationRequest(e.method, e.params, e.id, worktreeRequestDeps);
            p = X(t.result);
            break;
          }
          case `set-worktree-owner-thread`:
            try {
              p = X((await dispatchWorktreeOwnerRequest(e.method, e.params, {
                gitManager: owner.gitManager,
                host: o,
                signal: i.signal,
                setOwnerThread: (repository, conversationId, signal) =>
                  worktreeRequestDeps.setOwnerThread(repository, conversationId, signal),
              })).result);
            } catch {
              p = EV(`Failed to set thread worktree owner`);
            }
            break;
          case `move-thread-to-local`:
          case `move-thread-to-worktree`:
          case `move-thread-to-host-worktree`:
          case `cleanup-host-handoff-transfer`: {
            let t = await dispatchWorktreeMutationRequest(e.method, e.params, e.id, worktreeRequestDeps);
            p = t.wrapped ? X(t.result) : t.result;
            break;
          }
          case `apply-changes`: {
            let t = await dispatchGitApplyRequest(e.method, e.params, { applyChanges: (params) => applyGitChanges(params, applyRequestDeps), applyPatch: (params) => applyGitPatch(params, applyRequestDeps), applyReviewSectionChanges: (params) => applyGitReviewSectionChanges(params, applyRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `apply-patch`: {
            let t = await dispatchGitApplyRequest(e.method, e.params, { applyChanges: (params) => applyGitChanges(params, applyRequestDeps), applyPatch: (params) => applyGitPatch(params, applyRequestDeps), applyReviewSectionChanges: (params) => applyGitReviewSectionChanges(params, applyRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `apply-review-section-changes`: {
            let t = await dispatchGitApplyRequest(e.method, e.params, { applyChanges: (params) => applyGitChanges(params, applyRequestDeps), applyPatch: (params) => applyGitPatch(params, applyRequestDeps), applyReviewSectionChanges: (params) => applyGitReviewSectionChanges(params, applyRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
          case `commit`: {
            let t = await dispatchGitMutationRequest(e.method, e.params, { push: (p) => pushGitRepository(p, gitPushRequestDeps), checkout: (p) => checkoutGitBranch(p, gitCheckoutRequestDeps), commit: (p) => commitGitChanges(p, gitCommitRequestDeps), setConfig: (p) => setGitConfigValue(p, gitConfigRequestDeps) });
            (t.refreshRoot != null && (d = t.refreshRoot), (p = X(t.result)));
            break;
          }
  }
  return { performance: l, refreshRoot: d, responseResult: p };
}

export { dispatchGitWorkerRequest };
export type { GitWorkerRequestDispatchDependencies };
if (typeof module !== `undefined`)
  module.exports = { dispatchGitWorkerRequest };
