export function formatLocalBranchRef(ref: string) { return ref.startsWith("refs/") ? ref : `refs/heads/${ref}`; }
export function normalizeLocalBranchCandidate(ref: string) { return ref.startsWith("refs/heads/") ? ref : ref.startsWith("refs/") ? null : formatLocalBranchRef(ref); }
export function createRemoteCandidate(remote: string, branchName: string) { return { remote, branchName, ref: `refs/remotes/${remote}/${branchName}` }; }
export function getRemoteStartingRefCandidates(ref: string, remotes: string[]) {
  const prefix = "refs/remotes/"; const value = ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
  if (ref.startsWith("refs/") && !ref.startsWith(prefix)) return [];
  const remote = remotes.find((candidate) => value.startsWith(`${candidate}/`));
  return remote == null ? (ref.startsWith(prefix) ? [] : remotes.map((candidate) => createRemoteCandidate(candidate, ref))) : [createRemoteCandidate(remote, value.slice(remote.length + 1))];
}
if (typeof module !== "undefined") module.exports = { formatLocalBranchRef, normalizeLocalBranchCandidate, createRemoteCandidate, getRemoteStartingRefCandidates };
