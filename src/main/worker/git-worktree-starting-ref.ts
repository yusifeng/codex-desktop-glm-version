type StartingRefDependencies = {
  compareBranches: (repository: any, left: string, right: string, signal?: AbortSignal) => Promise<any>;
  getOrderedRemotes: (repository: any) => Promise<string[]>;
  getUpstreamRef: (repository: any, ref: string, signal?: AbortSignal) => Promise<string | null>;
  resolveRef: (repository: any, ref: string, signal?: AbortSignal, options?: any) => Promise<string | null>;
  runGit: (root: string, args: string[], host: any, options: any) => Promise<any>;
};
import { createRemoteCandidate, formatLocalBranchRef, getRemoteStartingRefCandidates, normalizeLocalBranchCandidate } from "./git-worktree-starting-ref-policy";

class StartingRefValidationError extends Error {
  constructor() {
    super(`Failed to validate the worktree starting ref`);
  }
}

async function fetchRemoteStartingRef(
  repository: any,
  candidate: { remote: string; branchName: string; ref: string },
  signal: AbortSignal | undefined,
  dependencies: StartingRefDependencies,
) {
  const validation = await dependencies.runGit(
    repository.root,
    [`ls-remote`, `--exit-code`, candidate.remote, `refs/heads/${candidate.branchName}`],
    repository.host,
    { allowedNonZeroExitCodes: [2], signal },
  );
  if (!validation.success) throw new StartingRefValidationError();
  if (validation.code === 2) return null;
  const fetched = await dependencies.runGit(
    repository.root,
    [`fetch`, candidate.remote, `+refs/heads/${candidate.branchName}:${candidate.ref}`],
    repository.host,
    { signal },
  );
  if (
    !fetched.success ||
    (await dependencies.resolveRef(
      repository,
      `${candidate.ref}^{commit}`,
      signal,
      { fresh: true },
    )) == null
  )
    throw Error(`Failed to fetch the worktree starting ref`);
  return { ref: candidate.ref, remoteRef: candidate.ref };
}

async function resolveWorktreeStartingRef(
  repository: any,
  ref: string,
  signal: AbortSignal | undefined,
  dependencies: StartingRefDependencies,
) {
  if (ref === `HEAD` || ref === `@`)
    return (await dependencies.resolveRef(repository, `${ref}^{commit}`, signal)) == null
      ? null
      : { ref };
  const localRef = normalizeLocalBranchCandidate(ref);
  const upstream = await dependencies.getUpstreamRef(repository, ref, signal);
  if (upstream != null) {
    const remoteRef = `refs/remotes/${upstream}`;
    const comparisonRef =
      (await dependencies.resolveRef(repository, `${remoteRef}^{commit}`, signal)) == null
        ? formatLocalBranchRef(upstream)
        : remoteRef;
    return (await dependencies.compareBranches(
      repository,
      localRef ?? ref,
      comparisonRef,
      signal,
    ))?.state === `right-ahead`
      ? { ref: comparisonRef }
      : { ref: localRef ?? ref };
  }
  if (
    localRef != null &&
    (await dependencies.resolveRef(repository, `${localRef}^{commit}`, signal)) != null
  )
    return { ref: localRef };
  const remotes = await dependencies.getOrderedRemotes(repository);
  if (
    ref.startsWith(`refs/remotes/`) &&
    (await dependencies.resolveRef(repository, `${ref}^{commit}`, signal)) != null
  )
    return { ref, remoteRef: ref };
  const candidates = getRemoteStartingRefCandidates(ref, remotes);
  for (const candidate of candidates)
    if (
      (await dependencies.resolveRef(repository, `${candidate.ref}^{commit}`, signal)) != null
    )
      return { ref: candidate.ref, remoteRef: candidate.ref };
  let validationError: Error | null = null;
  for (const candidate of candidates)
    try {
      const result = await fetchRemoteStartingRef(repository, candidate, signal, dependencies);
      if (result != null) return result;
    } catch (error) {
      const normalized = error instanceof Error ? error : Error(String(error));
      if (signal?.aborted || !(error instanceof StartingRefValidationError)) throw normalized;
      validationError ??= normalized;
    }
  const resolved = await dependencies.resolveRef(repository, `${ref}^{commit}`, signal);
  if (resolved != null) return { ref: resolved };
  if (validationError != null) throw validationError;
  return null;
}

export {
  createRemoteCandidate,
  fetchRemoteStartingRef,
  formatLocalBranchRef,
  getRemoteStartingRefCandidates,
  normalizeLocalBranchCandidate,
  resolveWorktreeStartingRef,
};
if (typeof module !== `undefined`)
  module.exports = {
    createRemoteCandidate,
    fetchRemoteStartingRef,
    formatLocalBranchRef,
    getRemoteStartingRefCandidates,
    normalizeLocalBranchCandidate,
    resolveWorktreeStartingRef,
  };
