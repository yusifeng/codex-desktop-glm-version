type NearestAncestorDependencies = {
  compareAhead: (
    repository: any,
    left: string,
    right: string,
    signal: AbortSignal,
  ) => Promise<any>;
};

import {
  normalizeAncestorCandidates,
  selectNearestAncestorBranch,
} from './git-nearest-ancestor-branch-policy';

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
  return selectNearestAncestorBranch(results);
}

export { findNearestAncestorBranch, getAncestorDistance, normalizeAncestorCandidates };
if (typeof module !== `undefined`)
  module.exports = { findNearestAncestorBranch, getAncestorDistance, normalizeAncestorCandidates };
