type SnapshotDependencies = {
  gitManager: any;
  host: any;
  signal: AbortSignal;
  getWorktreeId: (path: string) => Promise<string>;
  normalizeWorktreePath: (path: string) => string;
  getSnapshotRef: (worktreeId: string) => string;
  normalizeRoot: (path: string) => string;
  getCommitSha: (repository: any, ref: string, signal: AbortSignal, options: { fresh: boolean }) => Promise<string | null>;
  isMissingError: (error: unknown) => boolean;
};

async function inspectWorktreePath(host: any, path: string, isMissingError: (error: unknown) => boolean) {
  try {
    return (await host.stat(path, { bypassCache: true })).isDirectory() ? `available` : `unavailable`;
  } catch (error) {
    return isMissingError(error) ? `missing` : `unavailable`;
  }
}

async function resolveWorktreeSnapshot(candidateRoots: string[], worktreePath: string, deps: SnapshotDependencies) {
  const worktreeId = await deps.getWorktreeId(deps.normalizeWorktreePath(worktreePath));
  const snapshotRef = deps.getSnapshotRef(worktreeId);
  const existingRoots = (await Promise.all(candidateRoots.map(async (root) => {
    try {
      return (await deps.host.stat(root)).isDirectory() ? root : null;
    } catch {
      return null;
    }
  }))).filter((root) => root != null);
  if (existingRoots.length === 0) throw new Error(`No candidate workspace roots exist on disk`);

  const metadata = (await Promise.all(existingRoots.map(async (root) => {
    try {
      return await deps.gitManager.getStableMetadata(deps.normalizeRoot(root), deps.host);
    } catch {
      return null;
    }
  }))).filter(Boolean);
  if (metadata.length === 0) throw new Error(`No candidate workspace roots are valid git repositories`);

  const candidates = await Promise.all(metadata.map(async (value: any) => ({
    metadata: value,
    commitSha: await deps.getCommitSha(deps.gitManager.getWorktreeRepositoryForRoot(value.root, deps.host), snapshotRef, deps.signal, { fresh: true }),
  })));
  for (const candidate of candidates) {
    if (candidate.commitSha != null) {
      return {
        snapshotRef,
        worktreeId,
        repoRoot: candidate.metadata.root,
        commonDir: candidate.metadata.commonDir,
        exists: true,
        commitSha: candidate.commitSha,
      };
    }
  }
  return { snapshotRef, worktreeId, exists: false, commitSha: null };
}

async function resolveManagedWorktreeState(candidateRoots: string[], cwd: string, worktreePath: string, deps: SnapshotDependencies) {
  const cwdState = await inspectWorktreePath(deps.host, cwd, deps.isMissingError);
  if (cwdState === `available`) return { kind: `available` };
  if (cwdState === `unavailable`) return { kind: `unavailable`, reason: `inspection-failed` };
  if (cwd !== worktreePath) {
    const worktreeState = await inspectWorktreePath(deps.host, worktreePath, deps.isMissingError);
    if (worktreeState === `available`) return { kind: `gone` };
    if (worktreeState === `unavailable`) return { kind: `unavailable`, reason: `inspection-failed` };
  }
  if (candidateRoots.length === 0) return { kind: `unavailable`, reason: `no-candidate-roots` };
  try {
    const snapshot = await resolveWorktreeSnapshot(candidateRoots, worktreePath, deps);
    return snapshot.exists ? { kind: `restorable`, snapshot } : { kind: `gone` };
  } catch {
    return { kind: `unavailable`, reason: `inspection-failed` };
  }
}

export { inspectWorktreePath, resolveManagedWorktreeState, resolveWorktreeSnapshot };
if (typeof module !== `undefined`) module.exports = { inspectWorktreePath, resolveManagedWorktreeState, resolveWorktreeSnapshot };
