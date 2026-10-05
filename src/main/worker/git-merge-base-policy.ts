/** Pure ordering policy for merge-base fallback refs. */
function buildMergeBaseCandidates(branch: string, remotes: string[], upstream: string | null) {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | null | undefined) => {
    const candidate = value?.trim();
    if (candidate && !seen.has(candidate)) { candidates.push(candidate); seen.add(candidate); }
  };
  if (remotes.length > 0) {
    const remoteSet = new Set(remotes);
    const slash = branch.indexOf(`/`);
    const prefix = slash > 0 ? branch.slice(0, slash) : null;
    const hasRemotePrefix = prefix != null && remoteSet.has(prefix);
    const unprefixed = hasRemotePrefix && slash + 1 < branch.length ? branch.slice(slash + 1) : null;
    for (const remote of remotes) {
      if (hasRemotePrefix && remote === prefix) { if (unprefixed) add(`refs/remotes/${remote}/${unprefixed}`); continue; }
      add(`${remote}/${branch}`); add(`refs/remotes/${remote}/${branch}`);
    }
  }
  add(upstream);
  return candidates;
}
export { buildMergeBaseCandidates };
if (typeof module !== `undefined`) module.exports = { buildMergeBaseCandidates };
