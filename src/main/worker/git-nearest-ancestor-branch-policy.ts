/** Pure candidate normalization and nearest-distance selection policy. */

export function normalizeAncestorCandidates(candidates: string[], currentBranch: string) {
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

export function selectNearestAncestorBranch(
  results: Array<{ branch: string; distance: number } | null>,
) {
  let nearest: string | null = null;
  let nearestDistance: number | null = null;
  for (const result of results)
    if (result != null && (nearestDistance == null || result.distance < nearestDistance)) {
      nearest = result.branch;
      nearestDistance = result.distance;
    }
  return nearest;
}

if (typeof module !== `undefined`)
  module.exports = { normalizeAncestorCandidates, selectNearestAncestorBranch };
