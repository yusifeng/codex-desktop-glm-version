import {
  buildCaptureRefPrefix,
  buildCheckpointRefPrefix,
  buildCheckpointScopeRefPrefix,
  captureRefPrefix,
  checkpointRefPrefix,
  isRefStale,
  selectLatestCheckpoint,
} from './git-turn-diff-capture-policy';

type TurnDiffCaptureDependencies = {
  captureSnapshotTree: (repository: any) => Promise<string>;
  getHeadCommit: (
    repository: any,
    signal: AbortSignal,
  ) => Promise<string | null>;
  getRepositoryStatus: (repository: any, options: any) => Promise<any>;
  runGit: (
    root: string,
    args: string[],
    host: any,
    options?: any,
  ) => Promise<any>;
  runDiff: (
    root: string,
    args: string[],
    host: any,
    options: any,
  ) => Promise<any>;
  parseDiffError: (result: any) => any;
  classifyGitError: (stderr: string) => any;
  normalizeTreeSha: (sha: string) => string;
  hash: (algorithm: string, value: string) => Promise<string>;
  now: () => number;
  randomUUID: () => string;
  captureTtlMs: number;
  checkpointTtlMs: number;
  maxDiffBytes: number;
  sessionStartDiffTimeoutMs: number;
};

const checkpointQueues = new Map<string, Promise<void>>();

const queueKey = (root: string, prefix: string) => `${root}\0${prefix}`;
const hashKey = async (value: string, deps: TurnDiffCaptureDependencies) =>
  (await deps.hash(`SHA-256`, value)).slice(0, 32);

async function retainTree(params: any, deps: TurnDiffCaptureDependencies) {
  const result = await deps.runGit(
    params.root,
    [`update-ref`, params.ref, params.treeSha],
    params.host,
    { signal: params.signal },
  );
  if (!result.success)
    throw Error(`Failed to retain a turn diff tree snapshot`);
}

async function releaseTree(params: any, deps: TurnDiffCaptureDependencies) {
  const result = await deps.runGit(
    params.root,
    [`update-ref`, `-d`, params.ref],
    params.host,
  );
  if (!result.success)
    throw Error(`Failed to release a turn diff tree snapshot`);
}

async function computeTurnDiff(params: any, deps: TurnDiffCaptureDependencies) {
  const result = await deps.runDiff(
    params.root,
    [params.baseRef, params.headTreeSha],
    params.host,
    {
      allowedNonZeroExitCodes: [0, 1],
      maxOutputBytes: deps.maxDiffBytes,
      signal: params.signal,
      timeoutMs: params.timeoutMs,
      trim: false,
    },
  );
  if (!result.success || result.outputLimitExceeded) {
    const error = deps.parseDiffError(result);
    if (error.type === `unknown`)
      error.failureReason = deps.classifyGitError(result.stderr);
    return { type: `error`, error };
  }
  return {
    type: `success`,
    unifiedDiff: result.stdout,
    unifiedDiffBytes: result.stdoutBytes,
  };
}

async function findRecentCheckpoint(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  const result = await deps.runGit(
    params.root,
    [`for-each-ref`, `--format=%(refname) %(objectname)`, params.refPrefix],
    params.host,
  );
  if (!result.success) return null;
  return selectLatestCheckpoint({
    output: result.stdout,
    refPrefix: params.refPrefix,
    nowMs: params.nowMs,
    ttlMs: deps.checkpointTtlMs,
    normalizeTreeSha: deps.normalizeTreeSha,
  });
}

async function pruneRefs(params: any, deps: TurnDiffCaptureDependencies) {
  const result = await deps.runGit(
    params.root,
    [`for-each-ref`, `--format=%(refname)`, params.refPrefix],
    params.host,
  );
  if (!result.success) return;
  await Promise.allSettled(
    result.stdout
      .split(`\n`)
      .filter((ref: string) => {
        return isRefStale({
          ref,
          refPrefix: params.refPrefix,
          nowMs: params.nowMs,
          ttlMs: params.ttlMs,
        });
      })
      .map((ref: string) =>
        releaseTree({ host: params.host, ref, root: params.root }, deps),
      ),
  );
}

async function pruneStaleRefs(params: any, deps: TurnDiffCaptureDependencies) {
  await Promise.all([
    pruneRefs(
      {
        ...params,
        createdAtPathIndex: 0,
        refPrefix: captureRefPrefix,
        ttlMs: deps.captureTtlMs,
      },
      deps,
    ),
    pruneRefs(
      {
        ...params,
        createdAtPathIndex: 2,
        refPrefix: checkpointRefPrefix,
        ttlMs: deps.checkpointTtlMs,
      },
      deps,
    ),
  ]);
}

async function removeOtherCheckpoints(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  const result = await deps.runGit(
    params.root,
    [`for-each-ref`, `--format=%(refname)`, params.refPrefix],
    params.host,
  );
  if (!result.success) return;
  await Promise.allSettled(
    result.stdout
      .split(`\n`)
      .filter((ref: string) => ref !== params.exceptRef)
      .map((ref: string) =>
        releaseTree({ host: params.host, ref, root: params.root }, deps),
      ),
  );
}

async function retainCheckpoint(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  const ref = `${params.capture.checkpointRefPrefix}/${deps.now()}/${deps.randomUUID()}`;
  await retainTree(
    {
      host: params.host,
      ref,
      root: params.capture.root,
      signal: params.signal,
      treeSha: params.headTreeSha,
    },
    deps,
  );
  await removeOtherCheckpoints(
    {
      host: params.host,
      exceptRef: ref,
      refPrefix: `${params.capture.checkpointScopeRefPrefix}*/*/*/*`,
      root: params.capture.root,
    },
    deps,
  );
}

async function startTurnDiffCapture(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  const repository = await params.gitManager.getWorktreeRepository(
    params.cwd,
    params.host,
  );
  if (repository == null) return null;
  const sessionStartCommitSha =
    params.baseTurnId == null
      ? await deps.getHeadCommit(repository, params.signal)
      : null;
  const baseTreeSha = await deps.captureSnapshotTree(repository);
  const [status, sessionStartDiff] = await Promise.all([
    deps.getRepositoryStatus(repository, {
      isRepoWatched: params.isRepoWatched?.(repository.root),
      signal: params.signal,
    }),
    sessionStartCommitSha == null
      ? null
      : computeTurnDiff(
          {
            host: params.host,
            baseRef: sessionStartCommitSha,
            headTreeSha: baseTreeSha,
            root: repository.root,
            signal: params.signal,
            timeoutMs: deps.sessionStartDiffTimeoutMs,
          },
          deps,
        ),
  ]);
  const nowMs = deps.now();
  const refPrefix = buildCaptureRefPrefix(nowMs, deps.randomUUID());
  const checkpointScopeHash = await hashKey(params.checkpointKey, deps);
  const checkpointScopeRefPrefix = buildCheckpointScopeRefPrefix(checkpointScopeHash);
  const checkpointRefPrefixForTurn = buildCheckpointRefPrefix(
    checkpointScopeHash,
    await hashKey(params.turnId, deps),
  );
  await retainTree(
    {
      host: params.host,
      ref: `${refPrefix}/base`,
      root: repository.root,
      signal: params.signal,
      treeSha: baseTreeSha,
    },
    deps,
  );
  await checkpointQueues
    .get(queueKey(repository.root, checkpointScopeRefPrefix))
    ?.catch(() => undefined);
  await pruneStaleRefs(
    { host: params.host, nowMs, root: repository.root },
    deps,
  ).catch(() => undefined);
  return {
    baseTreeSha,
    baseTurnHeadTreeSha:
      params.baseTurnId == null
        ? null
        : await findRecentCheckpoint(
            {
              host: params.host,
              nowMs,
              refPrefix: `${checkpointScopeRefPrefix}*/${await hashKey(params.baseTurnId, deps)}*/*/*`,
              root: repository.root,
            },
            deps,
          ),
    sessionStartCommitSha,
    sessionStartDiff,
    checkpointRefPrefix: checkpointRefPrefixForTurn,
    checkpointScopeRefPrefix,
    refPrefix,
    ...status,
    root: repository.root,
  };
}

async function completeCaptureNow(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  try {
    const headTreeSha = await deps.captureSnapshotTree(
      params.gitManager.getWorktreeRepositoryForRoot(
        params.capture.root,
        params.host,
      ),
    );
    await retainTree(
      {
        host: params.host,
        ref: `${params.capture.refPrefix}/head`,
        root: params.capture.root,
        signal: params.signal,
        treeSha: headTreeSha,
      },
      deps,
    );
    const [diff, betweenTurnDiff] = await Promise.all([
      computeTurnDiff(
        {
          host: params.host,
          baseRef: params.capture.baseTreeSha,
          headTreeSha,
          root: params.capture.root,
          signal: params.signal,
        },
        deps,
      ),
      params.capture.baseTurnHeadTreeSha == null
        ? null
        : computeTurnDiff(
            {
              host: params.host,
              baseRef: params.capture.baseTurnHeadTreeSha,
              headTreeSha: params.capture.baseTreeSha,
              root: params.capture.root,
              signal: params.signal,
            },
            deps,
          ),
    ]);
    return {
      baseTreeSha: params.capture.baseTreeSha,
      baseTurnHeadTreeSha: params.capture.baseTurnHeadTreeSha,
      betweenTurnDiff,
      sessionStartCommitSha: params.capture.sessionStartCommitSha,
      sessionStartDiff: params.capture.sessionStartDiff,
      headTreeSha,
      diff,
    };
  } finally {
    await Promise.allSettled([
      releaseTree(
        {
          host: params.host,
          ref: `${params.capture.refPrefix}/head`,
          root: params.capture.root,
        },
        deps,
      ),
      releaseTree(
        {
          host: params.host,
          ref: `${params.capture.refPrefix}/base`,
          root: params.capture.root,
        },
        deps,
      ),
    ]);
  }
}

function completeTurnDiffCapture(
  params: any,
  deps: TurnDiffCaptureDependencies,
) {
  const key = queueKey(
    params.capture.root,
    params.capture.checkpointScopeRefPrefix,
  );
  const result = completeCaptureNow(params, deps);
  const queued = (checkpointQueues.get(key) ?? Promise.resolve())
    .then(async () => {
      const completed = await result;
      if (params.retainCheckpoint && completed.diff.type === `success`) {
        await retainCheckpoint(
          {
            host: params.host,
            capture: params.capture,
            headTreeSha: completed.headTreeSha,
            signal: params.signal,
          },
          deps,
        );
      }
    })
    .then(
      () => undefined,
      () => undefined,
    );
  checkpointQueues.set(key, queued);
  return queued
    .then(() => result)
    .finally(() => {
      if (checkpointQueues.get(key) === queued) checkpointQueues.delete(key);
    });
}

export {
  completeCaptureNow,
  completeTurnDiffCapture,
  computeTurnDiff,
  findRecentCheckpoint,
  pruneRefs,
  releaseTree,
  retainTree,
  startTurnDiffCapture,
};
if (typeof module !== `undefined`)
  module.exports = {
    completeCaptureNow,
    completeTurnDiffCapture,
    computeTurnDiff,
    findRecentCheckpoint,
    pruneRefs,
    releaseTree,
    retainTree,
    startTurnDiffCapture,
  };
