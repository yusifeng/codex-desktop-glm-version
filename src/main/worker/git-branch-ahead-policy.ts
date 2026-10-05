/** Pure branch-ahead reference and revision policy. */

export function normalizeRemoteUpstream(
  upstream: string | null | undefined,
  remote: string | null | undefined,
) {
  if (upstream == null) return null;
  if (remote != null && upstream.startsWith(`remotes/${remote}/`))
    return upstream.slice(`remotes/`.length);
  return upstream;
}

export function buildRemoteAncestorRevision(
  upstream: string | null | undefined,
  remote: string | null | undefined,
) {
  const normalized = normalizeRemoteUpstream(upstream, remote);
  if (remote == null || normalized == null || !normalized.startsWith(`${remote}/`))
    return null;
  return `refs/remotes/${normalized}`;
}

export function resolveDefaultBranchRevision(
  defaultBranch: string,
  remote: string | null | undefined,
) {
  return defaultBranch.includes(`/`) || remote == null
    ? defaultBranch
    : `${remote}/${defaultBranch}`;
}

export function buildAheadRevisionArgs(revision: string) {
  return [`${revision}..HEAD`];
}

if (typeof module !== `undefined`)
  module.exports = {
    buildAheadRevisionArgs,
    buildRemoteAncestorRevision,
    normalizeRemoteUpstream,
    resolveDefaultBranchRevision,
  };
