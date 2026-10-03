type NearestAncestorDependencies = {
  compareAhead: (
    repository: any,
    left: string,
    right: string,
    signal: AbortSignal,
  ) => Promise<any>;
};

function normalizeAncestorCandidates(candidates: string[], currentBranch: string) {
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const branch = candidate.trim();
    if (branch.length === 0 || branch === currentBranch || seen.has(branch)) continue;
    seen.add(branch);
    normalized.push(branch);
  }
  return normalized;
}

async function getAncestorDistance(
  repository: any,
  branch: string,
  signal: AbortSignal,
  dependencies: NearestAncestorDependencies,
) {
  const comparison = await dependencies.compareAhead(repository, branch, `HEAD`, signal);
  return comparison?.state !== `right-ahead` || comparison.rightAhead <= 0
    ? null
    : comparison.rightAhead;
}

async function findNearestAncestorBranch(
  repository: any,
  candidates: string[],
  currentBranch: string,
  signal: AbortSignal,
  dependencies: NearestAncestorDependencies,
) {
  const branches = normalizeAncestorCandidates(candidates, currentBranch);
  const results = await Promise.all(
    branches.map(async (branch) => {
      const distance = await getAncestorDistance(repository, branch, signal, dependencies);
      return distance == null ? null : { branch, distance };
    }),
  );
  let nearest: string | null = null;
  let nearestDistance: number | null = null;
  for (const result of results)
    if (result != null && (nearestDistance == null || result.distance < nearestDistance)) {
      nearest = result.branch;
      nearestDistance = result.distance;
    }
  return nearest;
}

export { findNearestAncestorBranch, getAncestorDistance, normalizeAncestorCandidates };
if (typeof module !== `undefined`)
  module.exports = { findNearestAncestorBranch, getAncestorDistance, normalizeAncestorCandidates };
